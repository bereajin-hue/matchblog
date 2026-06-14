"""
티스토리 발행 엔진.
실제 구현: Tistory API (OAuth) 또는 Playwright 자동화
현재: 스텁
"""
import os
import logging

logger = logging.getLogger(__name__)


async def publish_tistory(order_id: str, content: str) -> str:
    """
    티스토리에 포스팅 발행.

    실제 구현 시:
    - TISTORY_ACCESS_TOKEN_{N} 환경변수 (암호화 저장, 복호화해서 사용)
    - Tistory API POST /apis/post/write
    """
    access_token = os.getenv("TISTORY_ACCESS_TOKEN_1", "")

    if not access_token:
        logger.warning("티스토리 토큰 미설정 — 스텁 URL 반환")
        return f"https://stub.tistory.com/{order_id}"

    # TODO: Tistory API 구현
    logger.info("티스토리 발행 (스텁) order_id=%s", order_id)
    return f"https://stub.tistory.com/{order_id}"
