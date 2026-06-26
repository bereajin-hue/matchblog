"""
인천e몰 최저가 AI 검수 툴 — 전역 설정 및 상수.
API 키는 절대 이 파일에 하드코딩하지 않는다.
"""
import os

# ── 경로 ──────────────────────────────────────────────────────────────────────
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
SETTINGS_JSON = os.path.join(BASE_DIR, "settings.json")
CACHE_DB = os.path.join(BASE_DIR, "data", "cache", "cache.db")
LOG_FILE = os.path.join(BASE_DIR, "data", "output", "audit.log")
PROMPT_DIR = os.path.join(BASE_DIR, "prompts")

# ── 기본 모델 ─────────────────────────────────────────────────────────────────
DEFAULT_GEMINI_MODEL = "gemini-2.5-flash"
GEMINI_MODEL_OPTIONS = [
    "gemini-2.5-flash",
    "gemini-2.5-pro",
    "gemini-3.5-flash",
    "gemini-3-flash",
    "gemini-3-pro",
]

# ── 네이버 쇼핑 API ────────────────────────────────────────────────────────────
NAVER_SEARCH_URL = "https://openapi.naver.com/v1/search/shop.json"
NAVER_DISPLAY = 40          # 검색 결과 수
NAVER_DEFAULT_SORT = "sim"  # sim / date / asc / dsc

# ── 동시성 / rate limit ───────────────────────────────────────────────────────
DEFAULT_CONCURRENCY = 5     # GUI 입력값
DEFAULT_BATCH_SIZE = 12     # Gemini 배치 크기 (후보 N개/콜)
MAX_GEMINI_CANDIDATES = 10  # Gemini로 보내는 후보 최대 수 (토큰 절감)

# ── 판정 임계값 ───────────────────────────────────────────────────────────────
# 시중가격 대비 AI최저가가 이 비율 이내이면 APPROVE (예: 0.05 = 5% 이내)
APPROVE_MARGIN = 0.05

# 사전필터: 핵심품목 토큰 유사도 최소 임계 (rapidfuzz score, 0~100)
PREFILTER_TOKEN_THRESHOLD = 60

# 신뢰도 산출 기준
CONFIDENCE_BASE = 100
CONFIDENCE_PENALIZE_UNIT_UNKNOWN = 20   # 단위 미상 시 감점
CONFIDENCE_PENALIZE_FEW_SAME = 10       # SAME 후보 1개 시 감점
CONFIDENCE_PENALIZE_PARSE_RETRY = 15    # LLM 파싱 재시도 시 감점

# ── 사전필터 제거 키워드 ──────────────────────────────────────────────────────
PREFILTER_EXCLUDE_KEYWORDS = [
    "중고", "리퍼", "전시", "렌탈", "대여", "사은품",
    "케이스만", "커버만", "부분", "호환",
]

# ── 판정 레이블 ───────────────────────────────────────────────────────────────
VERDICT_APPROVE = "승인추천"
VERDICT_HOLD = "보류"
VERDICT_REJECT = "반려"

# ── 셀 색상 (openpyxl PatternFill 색상 코드) ─────────────────────────────────
COLOR_APPROVE = "C6EFCE"   # 연초록
COLOR_HOLD = "FFEB9C"      # 연노랑
COLOR_REJECT = "FFC7CE"    # 연빨강
