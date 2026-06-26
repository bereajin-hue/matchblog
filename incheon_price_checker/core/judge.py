"""
최저가 재산출 · 판정(승인추천/보류/반려) · 할인율·마진율 재계산.
"""
from __future__ import annotations

from typing import Any

from config import (
    APPROVE_MARGIN,
    CONFIDENCE_BASE,
    CONFIDENCE_PENALIZE_FEW_SAME,
    CONFIDENCE_PENALIZE_PARSE_RETRY,
    CONFIDENCE_PENALIZE_UNIT_UNKNOWN,
    VERDICT_APPROVE,
    VERDICT_HOLD,
    VERDICT_REJECT,
)
from utils.logger import get_logger

logger = get_logger(__name__)


def judge(
    base_product: dict[str, Any],
    normalized_candidates: list[dict[str, Any]],
) -> dict[str, Any]:
    """
    동일(SAME) 후보군에서 최저가를 산출하고 시중가격과 비교해 판정.

    판정 로직:
        SAME 후보 0개          → HOLD  (동일 상품 못 찾음)
        시중가격 <= real_lowest * (1 + APPROVE_MARGIN) → APPROVE
        그 외                  → REJECT

    재계산 (0나눗셈 가드 포함):
        재계산_최저가  = SAME 후보 최저 lprice
        재계산_할인율  = round((시중가격 - 최저가) / 시중가격 * 100)
        재계산_마진율  = round((최저가 - 공급가) / 최저가 * 100)

    신뢰도(confidence):
        CONFIDENCE_BASE 에서 각종 패널티 감점.

    Args:
        base_product          : 기준 상품 dict (시중가격·공급가 포함).
        normalized_candidates : normalizer.normalize_unit_prices() 결과.

    Returns:
        {
            verdict, ai_lowest_price, ai_unit_lowest_price,
            confidence, reason,
            recalc_discount_rate, recalc_margin_rate,
            top_candidates (최대 3개),
            상품코드, 상품명,
        }
    """
    product_name  = base_product.get("상품명", "")
    product_code  = base_product.get("상품코드", "")
    market_price  = int(base_product.get("시중가격", 0) or 0)
    supply_price  = int(base_product.get("공급가", 0) or 0)

    # ── SAME 후보만 추출 ──────────────────────────────────────
    same_cands = [
        c for c in normalized_candidates
        if c.get("match_level") == "SAME"
    ]

    # ── HOLD: 동일 상품 없음 ──────────────────────────────────
    if not same_cands:
        logger.info("판정=HOLD (SAME후보 0개) | %s", product_name[:40])
        return _build_result(
            product_code, product_name,
            verdict=VERDICT_HOLD,
            ai_lowest=0,
            ai_unit_lowest=0.0,
            confidence=_calc_confidence([], normalized_candidates),
            reason="동일 상품을 네이버에서 찾지 못했습니다.",
            market_price=market_price,
            supply_price=supply_price,
            top_candidates=[],
        )

    # ── 최저가 산출 ────────────────────────────────────────────
    # 절대 최저가
    same_cands_sorted = sorted(same_cands, key=lambda c: c.get("lprice", 0))
    real_lowest = same_cands_sorted[0].get("lprice", 0)

    # 단위 최저가 (unit_price 있는 것 중 최솟값)
    unit_prices = [
        c["unit_price"] for c in same_cands
        if "unit_price" in c and not c.get("unit_unknown", False)
    ]
    real_unit_lowest = min(unit_prices) if unit_prices else 0.0

    # ── 판정 ──────────────────────────────────────────────────
    if market_price > 0 and real_lowest > 0:
        if market_price <= real_lowest * (1 + APPROVE_MARGIN):
            verdict = VERDICT_APPROVE
            reason = (
                f"시중가({market_price:,}원) ≤ 네이버최저가({real_lowest:,}원) "
                f"× {1 + APPROVE_MARGIN:.0%} — 가격 경쟁력 있음"
            )
        else:
            verdict = VERDICT_REJECT
            reason = (
                f"네이버 동일상품 최저가 {real_lowest:,}원이 "
                f"시중가({market_price:,}원)보다 저렴 — 가격 재검토 필요"
            )
    else:
        verdict = VERDICT_HOLD
        reason = "시중가격 또는 최저가 데이터 없음 — 수동 확인 필요"

    # ── 신뢰도 ────────────────────────────────────────────────
    confidence = _calc_confidence(same_cands, normalized_candidates)

    # ── 재계산 ────────────────────────────────────────────────
    recalc_discount = _safe_pct(market_price - real_lowest, market_price)
    recalc_margin   = _safe_pct(real_lowest - supply_price, real_lowest)

    # ── 동일 후보 상위 3개 ────────────────────────────────────
    top3 = same_cands_sorted[:3]

    logger.info(
        "판정=%s 신뢰도=%d%% 최저가=%s 시중가=%s | %s",
        verdict, confidence, f"{real_lowest:,}", f"{market_price:,}", product_name[:40],
    )

    return _build_result(
        product_code, product_name,
        verdict=verdict,
        ai_lowest=real_lowest,
        ai_unit_lowest=real_unit_lowest,
        confidence=confidence,
        reason=reason,
        market_price=market_price,
        supply_price=supply_price,
        top_candidates=top3,
        recalc_discount_rate=recalc_discount,
        recalc_margin_rate=recalc_margin,
    )


# ── 내부 헬퍼 ─────────────────────────────────────────────────────────────────

def _calc_confidence(
    same_cands: list[dict],
    all_cands: list[dict],
) -> int:
    score = CONFIDENCE_BASE

    # SAME 후보가 1개뿐이면 감점
    if len(same_cands) == 1:
        score -= CONFIDENCE_PENALIZE_FEW_SAME

    # 단위 미상 후보 비율이 높으면 감점
    unknown_cnt = sum(1 for c in same_cands if c.get("unit_unknown", False))
    if same_cands and unknown_cnt == len(same_cands):
        score -= CONFIDENCE_PENALIZE_UNIT_UNKNOWN

    # 파싱 실패 후보가 있으면 감점
    parse_fail = sum(1 for c in all_cands if not c.get("_parse_ok", True))
    if parse_fail > 0:
        score -= CONFIDENCE_PENALIZE_PARSE_RETRY

    return max(0, min(100, score))


def _safe_pct(numerator: float, denominator: float) -> int:
    """0나눗셈 방어 퍼센트 계산."""
    if not denominator:
        return 0
    return round(numerator / denominator * 100)


def _build_result(
    product_code: str,
    product_name: str,
    *,
    verdict: str,
    ai_lowest: int,
    ai_unit_lowest: float,
    confidence: int,
    reason: str,
    market_price: int,
    supply_price: int,
    top_candidates: list,
    recalc_discount_rate: int = 0,
    recalc_margin_rate: int = 0,
) -> dict[str, Any]:
    return {
        "상품코드":            product_code,
        "상품명":              product_name,
        "verdict":             verdict,
        "ai_lowest_price":     ai_lowest,
        "ai_unit_lowest_price": ai_unit_lowest,
        "confidence":          confidence,
        "reason":              reason,
        "recalc_discount_rate": recalc_discount_rate,
        "recalc_margin_rate":   recalc_margin_rate,
        "top_candidates":       top_candidates,
    }
