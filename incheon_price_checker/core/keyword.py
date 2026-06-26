"""
상품명 → 검색 키워드 정제 + 옵션 분리.
"""
from __future__ import annotations

import re

from utils.unit_parser import parse_unit

# ── 제거 패턴 ─────────────────────────────────────────────────────────────────

# 대괄호 태그: [청년농가], [정식병행수입], [MD] 등
_BRACKET_TAG = re.compile(r"\[[^\]]{1,20}\]")

# 판촉·수식 문구 (단어 단위 제거)
_PROMO_WORDS = re.compile(
    r"(?<![가-힣a-zA-Z])"
    r"(?:홈쇼핑\s*완판|완판|특허정품|정식병행수입|정품|병행수입|당일발송|당일출고"
    r"|무료배송|무배|빠른배송|로켓배송|오늘출발|익일배송"
    r"|실속형|실속|프리미엄|신상|신상품|인기|베스트|추천|공식"
    r"|국내산|국산|수입산|특가|한정|기획|이벤트|선물용|사은품"
    r"|홈쇼핑|TV홈쇼핑|GS홈쇼핑|CJ홈쇼핑|현대홈쇼핑|롯데홈쇼핑"
    r"|리뷰|후기|구매평|인증|KC인증|CE인증|ISO"
    r"|보양식|기능성|과학적|임상|피부과테스트\s*완료)"
    r"(?![가-힣a-zA-Z])",
    re.IGNORECASE,
)

# 괄호 안 부가 설명 제거: (랜덤발송), (실속형), (자석케이블) 등
# 단, 용량·수량 정보가 있는 괄호는 보존 → 숫자+단위 없는 것만 제거
_PAREN_REMOVE = re.compile(
    r"\((?![^)]*\d+\s*(?:kg|g|mg|L|ml|매|개|벌|팩|봉|입|병|캔|통|장|세트|박스|인치|cm|mm))[^)]{1,30}\)",
    re.IGNORECASE,
)

# 연속 공백·특수문자 정리
_MULTI_SPACE = re.compile(r"\s{2,}")
_TRAILING_SPECIAL = re.compile(r"[\s\-_/,]+$")

# 슬래시 옵션 표현 (숫자+단위/숫자+단위): 키워드에서 대표 1개만 남기고 제거
_SLASH_OPTION = re.compile(
    r"(\d+(?:\.\d+)?)\s*"
    r"(kg|g|mg|L|ml|매|개|벌|팩|봉|입|병|캔|통|장)"
    r"(?:\s*/\s*\d+(?:\.\d+)?\s*(?:kg|g|mg|L|ml|매|개|벌|팩|봉|입|병|캔|통|장))+",
    re.IGNORECASE,
)

# 모델 코드성 패턴 제거: "BM-536", "IMNU" 같은 상품번호
_MODEL_CODE = re.compile(r"\b[A-Z]{1,4}[-_]\d{3,6}\b")

# 사이즈 범위 제거: S~XL, M~2XL
_SIZE_RANGE = re.compile(r"\b[A-Z]{1,3}~[A-Z0-9]{1,4}\b")

# 인치 표현 보존용 (TV 상품 처리)
_INCH_PAT = re.compile(r"(\d+)\s*인치")


def generate_keyword(product_name: str) -> str:
    """
    상품명에서 대괄호 태그·판촉문구를 제거하고
    브랜드+핵심품목+대표용량만 남긴 검색 키워드를 반환.

    예)
        "[청년농가] 제철 국내산 수박 3kg/5kg/7kg/8kg (실속형)"
            → "수박 3kg"
        "[골든벨] 코다 수저10벌 세트"
            → "코다 수저 10벌 세트"
        "PLANTIUM 75인치 구글 안드로이드 UHD 4K LED 대형 스마트 TV"
            → "PLANTIUM 75인치 스마트 TV"
    """
    name = product_name.strip()

    # 1) 대괄호 태그 제거
    name = _BRACKET_TAG.sub(" ", name)

    # 2) 괄호 안 부가설명 제거 (용량 없는 것만)
    name = _PAREN_REMOVE.sub(" ", name)

    # 3) 슬래시 옵션 → 첫 번째(대표) 옵션만 남김
    def _keep_first_option(m: re.Match) -> str:
        first_val = m.group(1)
        first_unit = m.group(2)
        return f"{first_val}{first_unit}"
    name = _SLASH_OPTION.sub(_keep_first_option, name)

    # 4) 사이즈 범위 제거
    name = _SIZE_RANGE.sub("", name)

    # 5) 모델 코드 제거
    name = _MODEL_CODE.sub("", name)

    # 6) 판촉 문구 제거
    name = _PROMO_WORDS.sub("", name)

    # 7) TV 상품: 핵심 속성만 추출 (브랜드+인치+TV)
    inch_m = _INCH_PAT.search(name)
    if inch_m and re.search(r"\bTV\b|티비|텔레비전", name, re.IGNORECASE):
        brand = _extract_brand(product_name)
        inch = inch_m.group(1)
        smart = "스마트 " if re.search(r"스마트", name) else ""
        uhd = "UHD 4K " if re.search(r"UHD|4K", name, re.IGNORECASE) else ""
        name = f"{brand} {inch}인치 {uhd}{smart}TV".strip()
        return _clean(name)

    # 8) 일반 정리
    return _clean(name)


def _extract_brand(product_name: str) -> str:
    """상품명 앞쪽에서 브랜드(영문 대문자 또는 한글 첫 단어) 추출."""
    # 대괄호 태그 제거 후 첫 토큰
    cleaned = _BRACKET_TAG.sub("", product_name).strip()
    tokens = cleaned.split()
    if tokens:
        return tokens[0]
    return ""


def _clean(name: str) -> str:
    """연속 공백·끝 특수문자 정리, 30자 이하로 truncate."""
    name = _MULTI_SPACE.sub(" ", name)
    name = _TRAILING_SPECIAL.sub("", name)
    name = name.strip()
    # 검색 키워드 최대 30자
    if len(name) > 30:
        # 단어 경계에서 자름
        tokens = name[:31].rsplit(" ", 1)
        name = tokens[0] if len(tokens) > 1 else name[:30]
    return name.strip()


def split_options(product_name: str) -> list[str]:
    """
    슬래시 옵션 상품을 옵션별 검색 키워드 리스트로 반환.
    단일 옵션이면 [generate_keyword(product_name)] 반환.

    예)
        "[청년농가] 수박 3kg/5kg/7kg/8kg"
            → ["수박 3kg", "수박 5kg", "수박 7kg", "수박 8kg"]
        "[청년농가] 남해안 순살삼치 600g/1kg/2kg"
            → ["남해안 순살삼치 600g", "남해안 순살삼치 1000g", "남해안 순살삼치 2000g"]
        "고구마줄기김치 1kg"
            → ["고구마줄기김치 1kg"]
    """
    parsed = parse_unit(product_name)

    if not parsed.options or len(parsed.options) < 2:
        return [generate_keyword(product_name)]

    unit = parsed.quantity_unit or ""
    first_val = parsed.options[0]
    first_str = _format_value(first_val)

    # 슬래시 옵션 블록을 제거한 순수 베이스 키워드 확보
    # (generate_keyword는 첫 옵션을 남기므로, 그것을 다시 제거)
    base_kw = generate_keyword(product_name)
    # "첫값+단위" 를 제거해 베이스만 남김
    base_stripped = base_kw.replace(f"{first_str}{unit}", "", 1).strip()

    results = []
    for val in parsed.options:
        val_str = _format_value(val)
        candidate = _clean(f"{base_stripped} {val_str}{unit}") if base_stripped else f"{val_str}{unit}"
        results.append(candidate)

    return results


def _format_value(val: float) -> str:
    """1000.0 → '1000', 2.5 → '2.5' 형식으로."""
    return str(int(val)) if val == int(val) else str(val)
