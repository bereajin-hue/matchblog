"""
네이버 블로그 발행 엔진.
실제 구현: Playwright + 네이버 로그인 → 블로그 글쓰기 자동화
현재: 스텁 (실제 발행 없이 URL 반환)
"""
import os
import logging

logger = logging.getLogger(__name__)


async def publish_naver_blog(order_id: str, content: str) -> str:
    """
    네이버 블로그에 포스팅 발행.

    실제 구현 시 필요한 것:
    - NAVER_BLOG_ID_{N}, NAVER_BLOG_PW_{N} 환경변수 (AES-256-GCM 암호화 후 복호화해서 사용)
    - Playwright로 네이버 로그인 → 글쓰기 → 발행
    - 발행 완료 URL 반환
    """
    # 자격증명은 환경변수에서 가져옴 (절대 평문 하드코딩 금지)
    naver_id = os.getenv("NAVER_BLOG_ID_1", "")
    naver_pw = os.getenv("NAVER_BLOG_PW_1", "")  # 복호화된 값 (메모리 내 일시 사용)

    if not naver_id or not naver_pw:
        logger.warning("네이버 블로그 자격증명 미설정 — 스텁 URL 반환")
        return f"https://blog.naver.com/stub/{order_id}"

    # TODO: Playwright 자동화 구현
    # async with async_playwright() as p:
    #     browser = await p.chromium.launch(headless=True)
    #     page = await browser.new_page()
    #     await _login(page, naver_id, naver_pw)
    #     url = await _write_post(page, content)
    #     await browser.close()
    #     # 사용 후 자격증명 변수 즉시 파기
    #     naver_pw = ""
    #     return url

    logger.info("네이버 블로그 발행 (스텁) order_id=%s", order_id)
    return f"https://blog.naver.com/stub/{order_id}"
