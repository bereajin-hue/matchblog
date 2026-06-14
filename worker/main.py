"""
매치블로그 워커 — FastAPI
블로그 포스팅 자동화 + 컴플라이언스 체크 담당
"""
import os
from fastapi import FastAPI, HTTPException, Header, Depends
from pydantic import BaseModel
from typing import Optional
from compliance.ad_disclosure import verify_disclosure

app = FastAPI(title="matchblog-worker", version="0.1.0")

WORKER_SECRET = os.getenv("WORKER_SECRET", "")


def verify_secret(x_worker_secret: str = Header(...)):
    if x_worker_secret != WORKER_SECRET:
        raise HTTPException(status_code=401, detail="Unauthorized")
    return x_worker_secret


class GeneratePostRequest(BaseModel):
    order_id: str
    business_name: str
    place_url: str
    channel: str  # naver_blog | tistory | blogger | naver_clip
    assets: list[str]  # storage paths


class GeneratePostResponse(BaseModel):
    content: str
    disclosure_included: bool


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/generate", response_model=GeneratePostResponse, dependencies=[Depends(verify_secret)])
async def generate_post(req: GeneratePostRequest):
    """
    포스팅 콘텐츠 생성 스텁 — STEP 3에서 AI 생성 로직 구현
    """
    # TODO: STEP 3 — AI 콘텐츠 생성 (Claude API)
    stub_content = f"[{req.business_name}] 방문 후기 (STEP 3에서 구현 예정)"

    # 2차 컴플라이언스 검사: 광고 표시 문구 확인
    if not verify_disclosure(stub_content):
        raise HTTPException(status_code=422, detail="광고 표시 문구 누락 — 발행 불가")

    return GeneratePostResponse(
        content=stub_content,
        disclosure_included=verify_disclosure(stub_content),
    )


@app.post("/publish", dependencies=[Depends(verify_secret)])
async def publish_post(order_id: str, channel: str, content: str):
    """
    포스팅 발행 스텁 — STEP 3에서 채널별 발행 로직 구현
    """
    # TODO: STEP 3 — 채널별 발행 (Selenium / API)
    return {"status": "stub", "order_id": order_id, "channel": channel}
