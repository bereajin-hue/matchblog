"""
네이버 플레이스 분석 엔진.
실제 구현: Playwright로 플레이스 페이지 크롤링 + Gemini Vision 분석
현재: 목업 데이터 반환
"""
import random
import logging

logger = logging.getLogger(__name__)


async def analyze_place(place_url: str) -> dict:
    """
    네이버 플레이스 SEO 분석.

    실제 구현 시:
    - Playwright로 place_url 접속
    - 블로그 후기 수, 사진 수, 리뷰 수, 키워드 등 크롤링
    - Gemini Vision API로 사진 품질 분석
    """
    logger.info("플레이스 분석 (목업) url=%s", place_url)

    scores = {
        "blog_count": random.randint(20, 70),
        "photo_quality": random.randint(30, 70),
        "review_count": random.randint(10, 60),
        "keyword_density": random.randint(20, 50),
        "response_rate": random.randint(20, 60),
        "update_frequency": random.randint(15, 50),
    }
    overall = round(sum(scores.values()) / len(scores))

    return {
        "place_name": "분석 대상 업체",
        "place_url": place_url,
        "scores": scores,
        "overall_score": overall,
        "seo_comments": [
            "블로그 후기가 경쟁 업체 대비 부족합니다. 후기 포스팅을 늘리면 노출 순위 개선에 도움이 됩니다.",
            "사진의 다양성이 낮습니다. 음식·공간·메뉴판 등 다양한 각도의 사진을 추가하세요.",
            "키워드 최적화가 필요합니다. 업체명과 지역명을 포스팅에 자연스럽게 포함시키는 것이 좋습니다.",
            "리뷰 답글률을 높이면 신뢰도 점수가 향상됩니다.",
        ],
    }
