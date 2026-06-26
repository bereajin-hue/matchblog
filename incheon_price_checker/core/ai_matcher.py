"""
Gemini 2.5+ 동일성 판정 — 후보 상품이 기준 상품과 동일한지 배치 판정.
신규 google-genai SDK 사용 (from google import genai).
API 키는 절대 로그·캐시에 출력하지 않는다.
"""
from __future__ import annotations

import json
import os
import time
from typing import Any

from google import genai
from tenacity import (
    retry,
    retry_if_exception_type,
    stop_after_attempt,
    wait_exponential,
)

from config import DEFAULT_BATCH_SIZE, DEFAULT_GEMINI_MODEL, PROMPT_DIR
from utils import cache as cache_mod
from utils.logger import get_logger

logger = get_logger(__name__)

_PROMPT_TEMPLATE: str | None = None


def _load_prompt() -> str:
    global _PROMPT_TEMPLATE
    if _PROMPT_TEMPLATE is None:
        path = os.path.join(PROMPT_DIR, "extract_match.txt")
        with open(path, encoding="utf-8") as f:
            _PROMPT_TEMPLATE = f.read()
    return _PROMPT_TEMPLATE


# ── 공개 API ──────────────────────────────────────────────────────────────────

def match_candidates(
    base_product: dict[str, Any],
    candidates: list[dict[str, Any]],
    gemini_api_key: str,
    model_name: str = DEFAULT_GEMINI_MODEL,
    batch_size: int = DEFAULT_BATCH_SIZE,
) -> list[dict[str, Any]]:
    """
    후보를 batch_size씩 묶어 Gemini에 배치 호출.
    각 후보에 match_level / match_reason / 추출 속성을 채워 반환.

    2-tier 전략:
    - 1차: 지정 모델(기본 flash)로 전체 판정.
    - SIMILAR 또는 파싱 실패 후보만 상위 모델(pro)로 재판정.
      단, GUI에서 이미 pro/상위 모델을 선택했으면 전량 그 모델.

    Args:
        base_product : 기준 상품 dict.
        candidates   : prefilter 통과 후보 리스트.
        gemini_api_key: GUI 입력 키 (하드코딩·로그 출력 금지).
        model_name   : GUI 선택 모델명.
        batch_size   : 1회 호출당 후보 수.

    Returns:
        판정 결과가 채워진 후보 리스트.
        추가 키: match_level, match_reason, brand, core_item,
                 quantity_value, quantity_unit, set_count, _parse_ok
    """
    if not candidates:
        return []

    results = list(candidates)  # 얕은 복사, 원본 훼손 방지

    # ── 1차 판정 ──────────────────────────────────────────────
    _run_batch(base_product, results, gemini_api_key, model_name, batch_size)

    # ── 2-tier: SIMILAR / 파싱 실패 → 상위 모델 재판정 ────────
    # 이미 상위 모델이거나 flash가 아니면 재판정 불필요
    upper_model = _upper_model(model_name)
    if upper_model and upper_model != model_name:
        retry_indices = [
            i for i, c in enumerate(results)
            if c.get("match_level") == "SIMILAR" or not c.get("_parse_ok", True)
        ]
        if retry_indices:
            logger.info(
                "2-tier 재판정: %d건 → %s", len(retry_indices), upper_model
            )
            subset = [results[i] for i in retry_indices]
            _run_batch(base_product, subset, gemini_api_key, upper_model, batch_size)
            for new_idx, orig_idx in enumerate(retry_indices):
                results[orig_idx] = subset[new_idx]

    return results


# ── 내부 헬퍼 ─────────────────────────────────────────────────────────────────

def _run_batch(
    base_product: dict[str, Any],
    candidates: list[dict[str, Any]],
    gemini_api_key: str,
    model_name: str,
    batch_size: int,
) -> None:
    """candidates 리스트를 batch_size씩 나눠 인플레이스 업데이트."""
    for start in range(0, len(candidates), batch_size):
        batch = candidates[start: start + batch_size]
        _process_batch(base_product, batch, gemini_api_key, model_name)


def _process_batch(
    base_product: dict[str, Any],
    batch: list[dict[str, Any]],
    gemini_api_key: str,
    model_name: str,
) -> None:
    """
    단일 배치 처리. 결과를 batch 항목에 인플레이스 기록.
    파싱 실패 1회 재시도 → 그래도 실패 시 DIFFERENT.
    """
    base_json = _serialize_base(base_product)
    cands_json = _serialize_candidates(batch)

    cache_key = {
        "base": base_json,
        "candidates": cands_json,
        "model": model_name,
    }
    cached = cache_mod.get("gemini", cache_key)
    if cached is not None:
        logger.debug("캐시 히트: Gemini 판정 base=%s", base_product.get("상품명", "")[:30])
        _apply_results(batch, cached)
        return

    prompt = _load_prompt().replace(
        "{base_product_json}", base_json
    ).replace(
        "{candidates_json}", cands_json
    )

    parsed = None
    for attempt in range(2):
        raw = _call_gemini(prompt, gemini_api_key, model_name)
        parsed = _parse_response(raw)
        if parsed is not None:
            break
        if attempt == 0:
            logger.warning("Gemini 파싱 실패 1차 — 재시도")
            time.sleep(1)

    if parsed is None:
        logger.warning("Gemini 파싱 실패 2회 — 배치 전체 DIFFERENT 처리")
        for cand in batch:
            cand.update(_default_result("DIFFERENT", "파싱 실패"))
            cand["_parse_ok"] = False
        return

    cache_mod.set("gemini", cache_key, parsed)
    _apply_results(batch, parsed)


@retry(
    retry=retry_if_exception_type(Exception),
    wait=wait_exponential(multiplier=1, min=2, max=30),
    stop=stop_after_attempt(3),
    reraise=True,
)
def _call_gemini(
    prompt: str,
    gemini_api_key: str,
    model_name: str,
) -> str:
    """
    Gemini API 단일 호출. response_mime_type="application/json" 강제.
    키는 절대 로그에 출력하지 않는다.
    """
    client = genai.Client(api_key=gemini_api_key)
    resp = client.models.generate_content(
        model=model_name,
        contents=prompt,
        config={"response_mime_type": "application/json"},
    )
    return resp.text


def _parse_response(raw: str) -> list[dict] | None:
    """JSON 파싱. 실패하면 None."""
    try:
        data = json.loads(raw)
        if isinstance(data, dict) and "results" in data:
            return data["results"]
        if isinstance(data, list):
            return data
    except (json.JSONDecodeError, TypeError):
        pass
    # 백틱 마크다운 감싸진 경우 시도
    try:
        stripped = raw.strip().removeprefix("```json").removeprefix("```").removesuffix("```").strip()
        data = json.loads(stripped)
        if isinstance(data, dict) and "results" in data:
            return data["results"]
    except Exception:
        pass
    return None


def _apply_results(batch: list[dict[str, Any]], parsed: list[dict]) -> None:
    """파싱 결과를 candidate_index 기준으로 batch에 인플레이스 적용."""
    index_map = {item.get("candidate_index", i): item for i, item in enumerate(parsed)}
    for i, cand in enumerate(batch):
        res = index_map.get(i, {})
        match_level = res.get("match_level", "DIFFERENT")
        if match_level not in ("SAME", "SIMILAR", "DIFFERENT"):
            match_level = "DIFFERENT"
        cand.update({
            "match_level":     match_level,
            "match_reason":    res.get("match_reason", ""),
            "brand":           res.get("brand", ""),
            "core_item":       res.get("core_item", ""),
            "quantity_value":  res.get("quantity_value"),
            "quantity_unit":   res.get("quantity_unit", ""),
            "set_count":       res.get("set_count", 1),
            "_parse_ok":       True,
        })


def _default_result(level: str, reason: str) -> dict:
    return {
        "match_level": level,
        "match_reason": reason,
        "brand": "", "core_item": "",
        "quantity_value": None, "quantity_unit": "",
        "set_count": 1,
    }


def _serialize_base(product: dict[str, Any]) -> str:
    return json.dumps({
        "상품명":   product.get("상품명", ""),
        "시중가격": product.get("시중가격", 0),
        "옵션":    product.get("옵션", ""),
    }, ensure_ascii=False)


def _serialize_candidates(candidates: list[dict[str, Any]]) -> str:
    items = []
    for i, c in enumerate(candidates):
        items.append({
            "candidate_index": i,
            "title":    c.get("title", ""),
            "lprice":   c.get("lprice", 0),
            "mallName": c.get("mallName", ""),
            "category1": c.get("category1", ""),
            "category2": c.get("category2", ""),
        })
    return json.dumps(items, ensure_ascii=False)


def _upper_model(model_name: str) -> str | None:
    """flash → pro 상위 모델 반환. 이미 pro급이면 None."""
    if "flash" in model_name:
        return model_name.replace("flash", "pro")
    return None
