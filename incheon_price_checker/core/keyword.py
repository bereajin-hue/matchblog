"""
상품명 → 검색 키워드 정제 + 옵션 분리.
"""
from __future__ import annotations


def generate_keyword(product_name: str) -> str:
    """
    상품명에서 대괄호 태그·판촉문구를 제거하고
    브랜드+핵심품목+대표용량만 남긴 검색 키워드를 반환.

    예)
        "[청년농가] 제철 국내산 수박 3kg/5kg/7kg" → "수박 3kg"
        "[골든벨] 코다 수저10벌 세트"             → "코다 수저 10벌 세트"
    """
    raise NotImplementedError


def split_options(product_name: str) -> list[str]:
    """
    슬래시·공백 다중 옵션을 분리해 옵션 리스트 반환.
    단일 옵션이면 [product_name] 반환.

    예)
        "수박 3kg/5kg/7kg" → ["수박 3kg", "수박 5kg", "수박 7kg"]
        "고구마줄기김치 1kg" → ["고구마줄기김치 1kg"]
    """
    raise NotImplementedError
