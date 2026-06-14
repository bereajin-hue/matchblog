"""
Blogger 발행 엔진.
실제 구현: Google Blogger API v3
현재: 스텁
"""
import os
import logging

logger = logging.getLogger(__name__)


async def publish_blogger(order_id: str, content: str) -> str:
    """
    Blogger에 포스팅 발행.

    실제 구현 시:
    - BLOGGER_ACCESS_TOKEN 환경변수 (OAuth2, 암호화 저장)
    - BLOGGER_BLOG_ID 환경변수
    - Google Blogger API POST /blogs/{blogId}/posts
    """
    access_token = os.getenv("BLOGGER_ACCESS_TOKEN", "")
    blog_id = os.getenv("BLOGGER_BLOG_ID", "")

    if not access_token or not blog_id:
        logger.warning("Blogger 자격증명 미설정 — 스텁 URL 반환")
        return f"https://stub.blogspot.com/{order_id}"

    # TODO: Blogger API 구현
    logger.info("Blogger 발행 (스텁) order_id=%s", order_id)
    return f"https://stub.blogspot.com/{order_id}"
