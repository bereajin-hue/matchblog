"""
상품명에서 용량·수량·세트수·옵션 리스트 추출.
"""
from __future__ import annotations
from dataclasses import dataclass, field


@dataclass
class ParsedUnit:
    quantity_value: float | None = None   # 숫자 (예: 2.5)
    quantity_unit: str | None = None      # 단위 문자열 (예: "kg")
    set_count: int = 1                    # 세트 구성 수 (예: 3세트 → 3)
    options: list[float] = field(default_factory=list)  # 슬래시 다중 옵션 숫자 리스트


def parse_unit(product_name: str) -> ParsedUnit:
    """
    상품명에서 단위 정보를 추출해 ParsedUnit 반환.

    지원 패턴:
        "2.5kg"          → quantity_value=2.5, quantity_unit="kg"
        "10벌 세트"       → quantity_value=10, quantity_unit="벌", set_count=1
        "30매 3세트"      → quantity_value=30, quantity_unit="매", set_count=3
        "3kg/5kg/7kg/8kg"→ options=[3,5,7,8], quantity_unit="kg"
        "S~XL"           → quantity_value=None (사이즈 범위, 단위 미상)
        "10g 25g 50g"    → options=[10,25,50], quantity_unit="g"
    """
    raise NotImplementedError


def base_unit_grams(value: float, unit: str) -> float | None:
    """
    무게 단위를 g으로 환산. 변환 불가능하면 None.
    지원: kg, g, mg.
    """
    raise NotImplementedError


def base_unit_ml(value: float, unit: str) -> float | None:
    """
    부피 단위를 ml로 환산. 변환 불가능하면 None.
    지원: L, ml.
    """
    raise NotImplementedError
