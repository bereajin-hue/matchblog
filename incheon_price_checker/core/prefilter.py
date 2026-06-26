"""
규칙 기반 사전필터 — LLM 호출 전 명백한 불일치 후보 제거.
"""
from __future__ import annotations
from typing import Any


def filter_candidates(
    base_product: dict[str, Any],
    candidates: list[dict[str, Any]],
) -> list[dict[str, Any]]:
    """
    후보 리스트에서 다음을 제거하고 남은 후보 반환:
    - 중고/리퍼/전시/렌탈/대여/사은품/케이스만/커버만/부분/호환 포함 상품.
    - 기준 상품의 핵심품목 토큰이 후보 title에 전혀 없는 상품
      (rapidfuzz 토큰 유사도 < PREFILTER_TOKEN_THRESHOLD).
    - 애매한 경우는 남겨서 LLM이 최종 판정.

    Args:
        base_product: 기준 상품 dict (상품명 등 포함).
        candidates: naver_api.search_products() 결과.

    Returns:
        필터링 후 남은 후보 리스트.
    """
    raise NotImplementedError
