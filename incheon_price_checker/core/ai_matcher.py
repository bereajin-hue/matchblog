"""
Gemini 2.5+ 동일성 판정 — 후보 상품이 기준 상품과 동일한지 배치 판정.
신규 google-genai SDK 사용 (from google import genai).
"""
from __future__ import annotations
from typing import Any


def match_candidates(
    base_product: dict[str, Any],
    candidates: list[dict[str, Any]],
    gemini_api_key: str,
    model_name: str,
    batch_size: int = 12,
) -> list[dict[str, Any]]:
    """
    후보를 batch_size씩 묶어 Gemini에 배치 호출.
    각 후보에 match_level(SAME/SIMILAR/DIFFERENT), match_reason,
    추출 속성(brand, core_item, quantity_value, quantity_unit, set_count)을 채워 반환.

    2-tier 전략:
    - 기본: flash 1차 판정.
    - SIMILAR 또는 파싱 실패분만 상위모델(pro/3.x)로 재판정
      (GUI에서 상위모델 선택 시 전량 그 모델).

    파싱 실패 시 1회 재시도, 그래도 실패하면 해당 후보 DIFFERENT.

    Args:
        base_product: 기준 상품 dict.
        candidates: prefilter 통과 후보 리스트.
        gemini_api_key: GUI 입력 키 (하드코딩·로그 출력 금지).
        model_name: GUI 선택 모델명.
        batch_size: 1회 호출당 후보 수.

    Returns:
        판정 결과가 채워진 후보 리스트.
    """
    raise NotImplementedError


def _call_gemini(
    prompt: str,
    gemini_api_key: str,
    model_name: str,
) -> dict[str, Any]:
    """
    Gemini API 단일 호출. response_mime_type="application/json" 강제.
    캐시·로깅 연동. 키는 절대 로그에 출력하지 않는다.

    Returns:
        파싱된 JSON dict. 실패 시 빈 dict.
    """
    raise NotImplementedError
