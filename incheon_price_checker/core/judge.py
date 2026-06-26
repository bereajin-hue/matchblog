"""
최저가 재산출 · 판정(승인추천/보류/반려) · 할인율·마진율 재계산.
"""
from __future__ import annotations
from typing import Any


def judge(
    base_product: dict[str, Any],
    normalized_candidates: list[dict[str, Any]],
) -> dict[str, Any]:
    """
    동일(SAME) 후보군에서 최저가를 산출하고 시중가격과 비교해 판정.

    판정 로직:
        SAME 후보 0개  → HOLD
        시중가격 <= real_lowest * (1 + APPROVE_MARGIN) → APPROVE
        그 외 → REJECT

    재계산:
        재계산_최저가 = SAME 후보 최저 lprice
        재계산_할인율 = round((시중가격 - 최저가) / 시중가격 * 100)  # 0나눗셈 가드
        재계산_마진율 = round((최저가 - 공급가) / 최저가 * 100)       # 0나눗셈 가드

    신뢰도(confidence):
        CONFIDENCE_BASE 에서 각종 패널티 감점.

    Returns:
        {
            "verdict": str,           # 승인추천/보류/반려
            "ai_lowest_price": int,
            "ai_unit_lowest_price": float,
            "confidence": int,        # 0~100
            "reason": str,            # MD가 읽는 한 줄
            "recalc_discount_rate": int,
            "recalc_margin_rate": int,
            "top_candidates": list,   # 동일후보 최대 3개
        }
    """
    raise NotImplementedError
