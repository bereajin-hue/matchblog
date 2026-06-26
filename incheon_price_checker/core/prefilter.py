"""
규칙 기반 사전필터 — LLM 호출 전 명백한 불일치 후보 제거.

제거 기준:
1. 제목에 금지 키워드(중고/리퍼/렌탈/사은품/호환 등) 포함
2. 기준 상품 핵심품목 토큰이 후보 title에 전혀 없음
   (rapidfuzz token_set_ratio < PREFILTER_TOKEN_THRESHOLD)
애매한 경우는 남겨서 LLM이 최종 판정.
"""
from __future__ import annotations

import re
from typing import Any

from rapidfuzz import fuzz

from config import MAX_GEMINI_CANDIDATES, PREFILTER_EXCLUDE_KEYWORDS, PREFILTER_TOKEN_THRESHOLD
from core.keyword import generate_keyword
from utils.logger import get_logger

logger = get_logger(__name__)

_B_TAG = re.compile(r"</?b>", re.IGNORECASE)


def _clean_title(title: str) -> str:
    return _B_TAG.sub("", title).strip()


def _has_exclude_keyword(title: str) -> bool:
    """금지 키워드가 title에 포함되면 True."""
    for kw in PREFILTER_EXCLUDE_KEYWORDS:
        if kw in title:
            return True
    return False


def _core_tokens(product_name: str) -> str:
    """
    기준 상품명에서 핵심 검색 토큰 추출.
    generate_keyword()를 재활용해 브랜드+핵심품목만 남긴다.
    """
    return generate_keyword(product_name)


_UNIT_TOKEN = re.compile(r"^\d+(?:\.\d+)?(?:kg|g|mg|L|ml|매|개|벌|팩|봉|입|병|캔|통|장|인치|cm|mm)$", re.IGNORECASE)
_DIGIT_ONLY = re.compile(r"^\d+(?:\.\d+)?$")


def _has_core_token_in_title(core: str, title: str) -> bool:
    """
    핵심 키워드의 의미 있는 토큰(2자 이상 한글/영문, 수량·단위 토큰 제외) 중
    하나라도 title에 직접 포함되면 True.
    수량/단위만 일치하는 경우는 True로 보지 않는다.
    """
    tokens = [
        t for t in core.split()
        if len(t) >= 2
        and not _UNIT_TOKEN.match(t)
        and not _DIGIT_ONLY.match(t)
    ]
    if not tokens:
        return False
    return any(tok in title for tok in tokens)


def filter_candidates(
    base_product: dict[str, Any],
    candidates: list[dict[str, Any]],
) -> list[dict[str, Any]]:
    """
    후보 리스트에서 명백한 불일치를 제거하고 남은 후보를 반환.

    제거 조건 (AND 중 하나라도 해당):
    A) title에 PREFILTER_EXCLUDE_KEYWORDS 중 하나 이상 포함
    B) 기준 상품 핵심토큰과 후보 title의 token_set_ratio
       < PREFILTER_TOKEN_THRESHOLD (애매하면 남김)

    Args:
        base_product: 기준 상품 dict (상품명 필드 필수).
        candidates: naver_api.search_products() 결과.

    Returns:
        필터링 후 남은 후보 리스트 (각 항목에 _filtered=False 플래그 없음).
    """
    product_name: str = base_product.get("상품명", "")
    core = _core_tokens(product_name)

    kept: list[dict[str, Any]] = []
    removed_count = 0

    for cand in candidates:
        title = _clean_title(cand.get("title", ""))

        # A) 금지 키워드 제거
        if _has_exclude_keyword(title):
            logger.debug("사전필터[금지키워드] 제거: %s", title[:60])
            removed_count += 1
            continue

        # B) 핵심품목 토큰 유사도 검사
        #    유사도 미달이어도 핵심 단어가 title에 직접 있으면 LLM에 넘김
        score = fuzz.token_set_ratio(core, title)
        if score < PREFILTER_TOKEN_THRESHOLD and not _has_core_token_in_title(core, title):
            logger.debug(
                "사전필터[유사도%.0f<%.0f] 제거: %s",
                score, PREFILTER_TOKEN_THRESHOLD, title[:60],
            )
            removed_count += 1
            continue

        cand["_prefilter_score"] = score
        kept.append(cand)

    total = len(candidates)
    # rapidfuzz 점수 내림차순 정렬 후 상위 MAX_GEMINI_CANDIDATES개만 반환
    kept.sort(key=lambda c: c.get("_prefilter_score", 0), reverse=True)
    kept = kept[:MAX_GEMINI_CANDIDATES]

    logger.info(
        "사전필터: %d/%d 통과 (%d 제거) → Gemini 전달 %d건 | 기준='%s'",
        len(kept), total, removed_count, len(kept), product_name[:40],
    )
    return kept
