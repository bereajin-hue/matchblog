"""
상품명에서 용량·수량·세트수·옵션 리스트 추출.
"""
from __future__ import annotations

import re
from dataclasses import dataclass, field

# 단위 정규화 테이블 (표기 → 표준)
_UNIT_ALIAS: dict[str, str] = {
    "킬로그램": "kg", "키로": "kg", "키로그램": "kg",
    "그램": "g", "그람": "g",
    "리터": "L", "ℓ": "L",
    "밀리리터": "ml", "㎖": "ml",
    "매": "매", "장": "장", "개": "개", "팩": "팩", "봉": "봉",
    "벌": "벌", "켤레": "켤레", "세트": "세트", "박스": "박스",
    "입": "입", "병": "병", "캔": "캔", "통": "통",
}

# 숫자(소수 포함) + 단위 패턴
_NUM = r"(\d+(?:\.\d+)?)"
_UNIT_PAT = (
    r"(kg|g|mg|L|l|ml|㎖|ℓ|킬로그램?|키로그램?|키로|그램|그람|리터|밀리리터"
    r"|매|장|개|팩|봉|벌|켤레|박스|입|병|캔|통)"
)

# "N세트" / "N팩세트" 패턴
_SET_PAT = re.compile(r"(\d+)\s*(?:종|팩|개)?\s*세트", re.IGNORECASE)

# 단일 수량 패턴: "2.5kg", "30매", "10벌"
_SINGLE_PAT = re.compile(_NUM + r"\s*" + _UNIT_PAT, re.IGNORECASE)

# 슬래시 분리 옵션: "3kg/5kg/7kg"
_SLASH_PAT = re.compile(
    _NUM + r"\s*" + _UNIT_PAT + r"(?:\s*/\s*" + _NUM + r"\s*" + _UNIT_PAT + r")+",
    re.IGNORECASE,
)

# 공백 분리 복수 숫자: "10g 25g 50g"
_SPACE_MULTI_PAT = re.compile(
    _NUM + r"\s*" + _UNIT_PAT + r"(?:\s+" + _NUM + r"\s*" + _UNIT_PAT + r")+",
    re.IGNORECASE,
)


def _normalize_unit(unit: str) -> str:
    return _UNIT_ALIAS.get(unit.strip(), unit.strip())


@dataclass
class ParsedUnit:
    quantity_value: float | None = None   # 대표 숫자
    quantity_unit: str | None = None      # 표준 단위 문자열
    set_count: int = 1                    # 세트 구성 수
    options: list[float] = field(default_factory=list)  # 슬래시/공백 다중 옵션


def parse_unit(product_name: str) -> ParsedUnit:
    """
    상품명에서 단위 정보를 추출해 ParsedUnit 반환.

    지원 패턴:
        "2.5kg"           → quantity_value=2.5, quantity_unit="kg"
        "10벌 세트"        → quantity_value=10, quantity_unit="벌", set_count=1
        "30매 3세트"       → quantity_value=30, quantity_unit="매", set_count=3
        "3kg/5kg/7kg/8kg" → options=[3,5,7,8], quantity_unit="kg"
        "S~XL"            → quantity_value=None (사이즈 범위, 단위 미상)
        "10g 25g 50g"     → options=[10,25,50], quantity_unit="g"
    """
    result = ParsedUnit()

    # 1) 세트 수 추출
    set_m = _SET_PAT.search(product_name)
    if set_m:
        result.set_count = int(set_m.group(1))

    # 2) 슬래시 다중 옵션 "3kg/5kg/7kg"
    slash_m = _SLASH_PAT.search(product_name)
    if slash_m:
        # 전체 매치 문자열에서 모든 (숫자, 단위) 쌍 추출
        pairs = re.findall(_NUM + r"\s*" + _UNIT_PAT, slash_m.group(0), re.IGNORECASE)
        if pairs:
            units = [_normalize_unit(u) for _, u in pairs]
            # 혼합 단위(600g/1kg/2kg)는 모두 g으로 통일
            if len(set(units)) > 1 and all(u in ("g", "kg", "mg") for u in units):
                values_g = []
                for v, u in pairs:
                    converted = base_unit_grams(float(v), u)
                    values_g.append(converted if converted is not None else float(v))
                result.quantity_unit = "g"
                result.options = values_g
                result.quantity_value = values_g[0]
            else:
                result.quantity_unit = units[0]
                result.options = [float(v) for v, _ in pairs]
                result.quantity_value = result.options[0]
            return result

    # 3) 공백 분리 복수 숫자 "10g 25g 50g"
    space_m = _SPACE_MULTI_PAT.search(product_name)
    if space_m:
        pairs = re.findall(_NUM + r"\s*" + _UNIT_PAT, space_m.group(0), re.IGNORECASE)
        if len(pairs) >= 2:
            units = [_normalize_unit(u) for _, u in pairs]
            result.quantity_unit = units[0]
            result.options = [float(v) for v, _ in pairs]
            result.quantity_value = result.options[0]
            return result

    # 4) 단일 수량
    single_m = _SINGLE_PAT.search(product_name)
    if single_m:
        result.quantity_value = float(single_m.group(1))
        result.quantity_unit = _normalize_unit(single_m.group(2))

    return result


def base_unit_grams(value: float, unit: str) -> float | None:
    """무게 단위를 g으로 환산. 변환 불가능하면 None."""
    u = _normalize_unit(unit).lower()
    if u == "kg":
        return value * 1000
    if u == "g":
        return value
    if u == "mg":
        return value / 1000
    return None


def base_unit_ml(value: float, unit: str) -> float | None:
    """부피 단위를 ml로 환산. 변환 불가능하면 None."""
    u = _normalize_unit(unit)
    if u in ("L", "l"):
        return value * 1000
    if u in ("ml", "㎖", "ℓ"):
        return value
    return None
