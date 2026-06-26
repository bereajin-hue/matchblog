"""
단위가격 정규화 — SAME/SIMILAR 후보의 가격을 공통 기본 단위로 환산.
"""
from __future__ import annotations

from typing import Any

from utils.logger import get_logger
from utils.unit_parser import ParsedUnit, base_unit_grams, base_unit_ml, parse_unit

logger = get_logger(__name__)

# 수량 단위를 '개' 기준으로 처리하는 단위 목록
_COUNT_UNITS = {"개", "매", "장", "벌", "켤레", "팩", "봉", "박스", "입", "병", "캔", "통"}


def normalize_unit_prices(
    base_product: dict[str, Any],
    matched_candidates: list[dict[str, Any]],
) -> list[dict[str, Any]]:
    """
    SAME/SIMILAR 후보에 unit_price(원/기본단위) 필드를 추가해 반환.

    기본 단위:
    - 무게(kg/g/mg)  → 원/g
    - 부피(L/ml)     → 원/ml
    - 수량(개/매 등) → 원/개
    - 단위 미상       → 절대가격(lprice)으로 폴백 + unit_unknown=True

    옵션 분리 상품 처리:
    - 기준 상품에 옵션 목록이 있으면, 각 후보의 title에서 수량을 파싱해
      기준 옵션과 가장 가까운 값 기준으로 단위가를 산정.

    세트 상품:
    - set_count > 1 이면 총량 = quantity_value * set_count 로 계산.

    Args:
        base_product: 기준 상품 dict (상품명·배송비 포함).
        matched_candidates: match_level이 채워진 후보 리스트.

    Returns:
        unit_price / unit_unknown / base_unit 필드가 추가된 리스트.
        DIFFERENT 후보는 그대로 통과(unit_price 없음).
    """
    base_parsed = parse_unit(base_product.get("상품명", ""))
    results = []

    for cand in matched_candidates:
        level = cand.get("match_level", "DIFFERENT")
        if level == "DIFFERENT":
            results.append(cand)
            continue

        enriched = dict(cand)
        total_price = _total_price(cand, base_product)

        # Gemini가 추출한 수량 정보 우선 사용, 없으면 title 파싱
        qty_val = cand.get("quantity_value")
        qty_unit = cand.get("quantity_unit") or ""
        set_cnt = int(cand.get("set_count") or 1) or 1

        if qty_val is None:
            cand_parsed = parse_unit(cand.get("title", ""))
            qty_val = cand_parsed.quantity_value
            qty_unit = cand_parsed.quantity_unit or ""
            set_cnt = cand_parsed.set_count

        unit_price, base_unit, unknown = _calc_unit_price(
            total_price, qty_val, qty_unit, set_cnt
        )

        # 옵션 분리 상품: 기준 상품 옵션과 매칭해 재산정
        if base_parsed.options and len(base_parsed.options) >= 2 and not unknown:
            unit_price = _option_unit_price(
                cand, base_parsed, total_price, qty_val, qty_unit, set_cnt
            )

        enriched["unit_price"] = unit_price
        enriched["base_unit"] = base_unit
        enriched["unit_unknown"] = unknown
        results.append(enriched)

    return results


# ── 내부 헬퍼 ─────────────────────────────────────────────────────────────────

def _total_price(cand: dict[str, Any], base_product: dict[str, Any]) -> float:
    """후보 lprice (배송비는 후보에 없으므로 기준 상품 배송비 미가산 — 네이버 lprice는 배송비 별도)."""
    return float(cand.get("lprice", 0) or 0)


def _calc_unit_price(
    total_price: float,
    qty_val: float | None,
    qty_unit: str,
    set_cnt: int,
) -> tuple[float, str, bool]:
    """
    단위가격 계산.

    Returns:
        (unit_price, base_unit_label, is_unknown)
    """
    if qty_val is None or qty_val <= 0:
        return total_price, "원(절대)", True

    effective_qty = qty_val * set_cnt

    # 무게
    g = base_unit_grams(effective_qty, qty_unit)
    if g is not None and g > 0:
        return round(total_price / g, 4), "원/g", False

    # 부피
    ml = base_unit_ml(effective_qty, qty_unit)
    if ml is not None and ml > 0:
        return round(total_price / ml, 4), "원/ml", False

    # 수량
    if qty_unit in _COUNT_UNITS:
        return round(total_price / effective_qty, 4), f"원/{qty_unit}", False

    # 단위 미상 — 절대가격 폴백
    logger.debug("단위 미상 폴백: qty=%s %s", qty_val, qty_unit)
    return total_price, "원(절대)", True


def _option_unit_price(
    cand: dict[str, Any],
    base_parsed: ParsedUnit,
    total_price: float,
    qty_val: float | None,
    qty_unit: str,
    set_cnt: int,
) -> float:
    """
    슬래시 옵션 상품에서 후보의 수량이 기준 상품 옵션 중
    가장 가까운 값에 해당한다고 가정해 단위가를 재산정.
    """
    if qty_val is None:
        return total_price

    # 기준 옵션 중 가장 가까운 값 찾기
    base_unit_str = base_parsed.quantity_unit or ""
    closest = min(base_parsed.options, key=lambda v: abs(v - qty_val))

    unit_price, _, unknown = _calc_unit_price(total_price, closest, base_unit_str, set_cnt)
    if unknown:
        return total_price
    return unit_price
