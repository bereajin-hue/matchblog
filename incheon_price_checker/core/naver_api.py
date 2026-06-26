"""
네이버 쇼핑 검색 API (v1/search/shop.json) 연동.
Client ID/Secret은 반드시 인자로 주입 — 하드코딩·로그 출력 금지.
"""
from __future__ import annotations

import re
import threading
import time
from typing import Any

import requests
from tenacity import (
    retry,
    retry_if_exception_type,
    stop_after_attempt,
    wait_exponential,
)

from config import NAVER_DISPLAY, NAVER_SEARCH_URL
from utils import cache as cache_mod
from utils.logger import get_logger

logger = get_logger(__name__)

# 동시성 제어 — GUI 입력값으로 외부에서 설정 가능
_semaphore = threading.Semaphore(5)
_SEMAPHORE_LOCK = threading.Lock()

_B_TAG = re.compile(r"</?b>", re.IGNORECASE)


def set_concurrency(n: int) -> None:
    """GUI에서 동시처리 수를 변경할 때 호출."""
    global _semaphore
    with _SEMAPHORE_LOCK:
        _semaphore = threading.Semaphore(max(1, n))


def search_products(
    keyword: str,
    client_id: str,
    client_secret: str,
    sort: str = "sim",
    display: int = NAVER_DISPLAY,
) -> list[dict[str, Any]]:
    """
    네이버 쇼핑 API로 keyword를 검색해 후보 상품 리스트 반환.

    - title의 <b> 태그 제거, lprice를 int로 변환.
    - tenacity 지수백오프 재시도 + SQLite 캐시 연동.
    - Client ID/Secret은 캐시 키에 포함하지 않음 (보안).

    Args:
        keyword: 정제된 검색 키워드.
        client_id: 네이버 API Client ID (GUI 주입, 하드코딩 금지).
        client_secret: 네이버 API Client Secret (GUI 주입, 하드코딩 금지).
        sort: 정렬 옵션 (sim/date/asc/dsc).
        display: 결과 수 (기본 40).

    Returns:
        후보 상품 dict 리스트.
        키: title, lprice, mallName, productUrl, category1~4, image.
    """
    cache_key = {"keyword": keyword, "sort": sort, "display": display}
    cached = cache_mod.get("naver", cache_key)
    if cached is not None:
        logger.debug("캐시 히트: 네이버 검색 keyword=%s", keyword)
        return cached

    with _semaphore:
        result = _search_with_retry(keyword, client_id, client_secret, sort, display)

    # 캐시 저장 (키는 포함하지 않음)
    cache_mod.set("naver", cache_key, result)
    return result


@retry(
    retry=retry_if_exception_type((requests.Timeout, requests.ConnectionError)),
    wait=wait_exponential(multiplier=1, min=1, max=16),
    stop=stop_after_attempt(4),
    reraise=True,
)
def _search_with_retry(
    keyword: str,
    client_id: str,
    client_secret: str,
    sort: str,
    display: int,
) -> list[dict[str, Any]]:
    headers = {
        "X-Naver-Client-Id": client_id,
        "X-Naver-Client-Secret": client_secret,
    }
    params = {
        "query": keyword,
        "display": display,
        "sort": sort,
    }
    resp = requests.get(
        NAVER_SEARCH_URL,
        headers=headers,
        params=params,
        timeout=10,
    )

    if resp.status_code == 429:
        # rate limit: 잠시 대기 후 tenacity가 재시도
        retry_after = int(resp.headers.get("Retry-After", 2))
        logger.warning("네이버 rate limit — %s초 대기", retry_after)
        time.sleep(retry_after)
        raise requests.ConnectionError("rate limit")

    if resp.status_code == 401:
        raise ValueError("네이버 API 인증 실패 — Client ID/Secret을 확인하세요.")

    resp.raise_for_status()
    data = resp.json()

    items = data.get("items", [])
    return [_normalize_item(item) for item in items]


def _normalize_item(item: dict[str, Any]) -> dict[str, Any]:
    """API 응답 항목을 정규화."""
    return {
        "title":      _B_TAG.sub("", item.get("title", "")),
        "lprice":     _to_int(item.get("lprice", 0)),
        "mallName":   item.get("mallName", ""),
        "productUrl": item.get("link", ""),
        "image":      item.get("image", ""),
        "category1":  item.get("category1", ""),
        "category2":  item.get("category2", ""),
        "category3":  item.get("category3", ""),
        "category4":  item.get("category4", ""),
        "brand":      item.get("brand", ""),
        "maker":      item.get("maker", ""),
        "productId":  item.get("productId", ""),
    }


def _to_int(value: Any) -> int:
    try:
        return int(value)
    except (ValueError, TypeError):
        return 0
