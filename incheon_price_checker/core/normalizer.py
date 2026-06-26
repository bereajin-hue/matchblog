"""
단위가격 정규화 — SAME/SIMILAR 후보의 가격을 g/ml/개 단위로 환산.
"""
from __future__ import annotations
from typing import Any


def normalize_unit_prices(
    base_product: dict[str, Any],
    matched_candidates: list[dict[str, Any]],
) -> list[dict[str, Any]]:
    """
    SAME/SIMILAR 후보에 unit_price(원/기본단위) 필드를 추가해 반환.

    - 무게: g 통일, 부피: ml 통일, 수량: 개 통일.
    - 세트 상품: 기준 상품 정의(세트 1개 단위) 기준.
    - 옵션 분리 상품(3kg/5kg/7kg): 옵션별 각각 최저가 산정.
    - 단위 미상: 절대가격 비교 폴백 + confidence 감점 플래그.

    Args:
        base_product: 기준 상품 dict (단위 정보 포함).
        matched_candidates: ai_matcher 결과 중 SAME/SIMILAR만.

    Returns:
        unit_price 필드가 추가된 후보 리스트.
    """
    raise NotImplementedError
