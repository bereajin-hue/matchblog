"""
네이버 쇼핑 검색 API (v1/search/shop.json) 연동.
"""
from __future__ import annotations
from typing import Any


def search_products(
    keyword: str,
    client_id: str,
    client_secret: str,
    sort: str = "sim",
    display: int = 40,
) -> list[dict[str, Any]]:
    """
    네이버 쇼핑 API로 keyword를 검색해 후보 상품 리스트 반환.
    title의 <b> 태그 제거, lprice를 int로 변환.
    tenacity 지수백오프 재시도 + utils/cache.py 캐시 연동.

    Args:
        keyword: 정제된 검색 키워드.
        client_id: 네이버 API Client ID (GUI 주입, 하드코딩 금지).
        client_secret: 네이버 API Client Secret (GUI 주입, 하드코딩 금지).
        sort: 정렬 옵션 (sim/date/asc/dsc).
        display: 결과 수 (기본 40).

    Returns:
        후보 상품 dict 리스트.
        키: title, lprice, mallName, productUrl, category1~4.
    """
    raise NotImplementedError
