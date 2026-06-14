"""
매치블로그 워커 — FastAPI
POST /generate  : order 데이터로 포스팅 초안 생성
POST /publish/{channel} : 실제 발행
POST /analyze   : 네이버 플레이스 분석

인증: X-Worker-Secret 헤더 필수 (없으면 401)
"""
import os
import logging
from fastapi import FastAPI, HTTPException, Header, Depends
from pydantic import BaseModel, HttpUrl
from typing import Optional

from compliance.ad_disclosure import inject_disclosure, verify_disclosure
from engines.place_analyzer import analyze_place
from engines.naver_blog import publish_naver_blog
from engines.tistory import publish_tistory
from engines.blogger import publish_blogger

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
logger = logging.getLogger(__name__)

app = FastAPI(title="matchblog-worker", version="1.0.0")

WORKER_SECRET = os.getenv("WORKER_SECRET", "")


def verify_secret(x_worker_secret: str = Header(...)):
    if not WORKER_SECRET or x_worker_secret != WORKER_SECRET:
        raise HTTPException(status_code=401, detail="Unauthorized")


# ── 스키마 ────────────────────────────────────────────────

class OrderData(BaseModel):
    id: str
    product_type: str          # basic | pro
    place_url: str
    applicant_name: str
    business_no: str
    phone: str

class GenerateRequest(BaseModel):
    order: OrderData

class PublishRequest(BaseModel):
    order: OrderData
    content: str               # 광고문구 포함된 초안

class AnalyzeRequest(BaseModel):
    place_url: str


# ── 엔드포인트 ───────────────────────────────────────────

@app.get("/health")
def health():
    return {"status": "ok", "version": "1.0.0"}


@app.post("/generate", dependencies=[Depends(verify_secret)])
async def generate(req: GenerateRequest):
    """order 데이터로 채널별 포스팅 초안 생성. 광고문구 강제 삽입."""
    order = req.order
    channels = _get_channels(order.product_type)
    drafts: dict[str, str] = {}

    for channel in channels:
        raw = _generate_content(order, channel)
        # 2차 컴플라이언스: 광고문구 없으면 강제 삽입
        content = raw if verify_disclosure(raw) else inject_disclosure(raw, order.applicant_name)
        drafts[channel] = content

    return {"drafts": drafts}


@app.post("/publish/{channel}", dependencies=[Depends(verify_secret)])
async def publish(channel: str, req: PublishRequest):
    """채널에 포스팅 발행. 발행 직전 광고문구 3차 검증."""
    content = req.content

    # 3차 컴플라이언스 방어선: 광고문구 없으면 발행 거부
    if not verify_disclosure(content):
        logger.error("광고문구 누락 — 발행 거부 channel=%s order=%s", channel, req.order.id)
        raise HTTPException(status_code=422, detail="광고 표시 문구 누락 — 발행 불가")

    published_url = await _publish_to_channel(channel, req.order, content)

    return {
        "published_url": published_url,
        "ad_disclosure_included": True,
        "channel": channel,
    }


@app.post("/analyze", dependencies=[Depends(verify_secret)])
async def analyze(req: AnalyzeRequest):
    """네이버 플레이스 분석."""
    result = await analyze_place(req.place_url)
    return {"result": result}


# ── 헬퍼 ────────────────────────────────────────────────

def _get_channels(product_type: str) -> list[str]:
    basic = ["naver_blog_1","naver_blog_2","naver_blog_3","naver_blog_4","naver_blog_5"]
    pro_extra = ["naver_blog_6","naver_blog_7","tistory_1","tistory_2","tistory_3","naver_clip","blogger"]
    return basic + (pro_extra if product_type == "pro" else [])


def _generate_content(order: OrderData, channel: str) -> str:
    """채널별 포스팅 콘텐츠 생성 (현재 템플릿, 추후 AI 교체)."""
    return (
        f"[{order.applicant_name}] 방문 후기\n\n"
        f"안녕하세요! 오늘은 {order.place_url} 를 다녀왔어요.\n"
        f"분위기도 좋고 서비스도 훌륭했습니다. 강력 추천드려요!\n\n"
        f"[채널: {channel}]"
    )


async def _publish_to_channel(channel: str, order: OrderData, content: str) -> str:
    """채널 라우팅 → 각 엔진 호출."""
    if channel.startswith("naver_blog"):
        return await publish_naver_blog(order.id, content)
    elif channel.startswith("tistory"):
        return await publish_tistory(order.id, content)
    elif channel == "blogger":
        return await publish_blogger(order.id, content)
    elif channel == "naver_clip":
        # 영상 발행은 별도 구현 필요
        return f"https://clip.naver.com/stub/{order.id}"
    else:
        raise HTTPException(status_code=400, detail=f"지원하지 않는 채널: {channel}")
