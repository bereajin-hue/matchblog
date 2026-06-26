"""
STEP 1~7 파이프라인 — 상품을 병렬로 처리.
GUI 스레드와 분리해 별도 스레드에서 실행.
상품별 에러는 건너뛰고 로그만 남김 (전체 중단 방지).
"""
from __future__ import annotations

import threading
from concurrent.futures import ThreadPoolExecutor, as_completed
from dataclasses import dataclass, field
from typing import Any, Callable

from core.ai_matcher import match_candidates
from core.excel_io import load_products, save_results
from core.judge import judge
from core.keyword import split_options
from core.naver_api import search_products, set_concurrency
from core.normalizer import normalize_unit_prices
from core.prefilter import filter_candidates
from utils.logger import get_logger

logger = get_logger(__name__)

# 상품 단위 병렬 처리 워커 수 (Naver+Gemini API 레이트리밋 고려)
_PRODUCT_WORKERS = 5


@dataclass
class PipelineConfig:
    excel_path: str
    naver_client_id: str
    naver_client_secret: str
    gemini_api_key: str
    gemini_model: str
    sort: str = "sim"
    concurrency: int = 5
    batch_size: int = 12


@dataclass
class PipelineCallbacks:
    """GUI → 스레드 콜백 (thread-safe: tkinter after() 경유)."""
    on_progress: Callable[[int, int, int, int], None] = field(default=lambda *a: None)
    on_result_row: Callable[[dict], None]              = field(default=lambda *a: None)
    on_status: Callable[[str], None]                   = field(default=lambda *a: None)
    on_done: Callable[[list[dict], list[dict]], None]  = field(default=lambda *a: None)
    on_error: Callable[[str], None]                    = field(default=lambda *a: None)


class Pipeline:
    def __init__(self, config: PipelineConfig, callbacks: PipelineCallbacks) -> None:
        self._cfg = config
        self._cb  = callbacks
        self._stop_event = threading.Event()
        self._thread: threading.Thread | None = None
        self._lock = threading.Lock()

    def start(self) -> None:
        self._stop_event.clear()
        self._thread = threading.Thread(target=self._run, daemon=True)
        self._thread.start()

    def stop(self) -> None:
        self._stop_event.set()

    # ── 메인 파이프라인 ───────────────────────────────────────────────────────

    def _run(self) -> None:
        cfg = self._cfg
        try:
            # STEP 1: 엑셀 로드
            self._cb.on_status("엑셀 로드 중…")
            products = load_products(cfg.excel_path)
            total = len(products)
            logger.info("엑셀 로드: %d건", total)

            # Naver API 세마포어 설정 (전체 동시 HTTP 요청 제한)
            set_concurrency(cfg.concurrency)

            # 순서 보존을 위한 결과 배열
            results: list[dict | None] = [None] * total
            done = hold = reject = 0

            workers = min(_PRODUCT_WORKERS, total, cfg.concurrency)
            self._cb.on_status(f"병렬 처리 시작 (워커 {workers}개)…")

            with ThreadPoolExecutor(max_workers=workers) as executor:
                future_to_idx = {
                    executor.submit(self._process_one_safe, product, cfg, i): i
                    for i, product in enumerate(products)
                }

                for future in as_completed(future_to_idx):
                    if self._stop_event.is_set():
                        executor.shutdown(wait=False, cancel_futures=True)
                        self._cb.on_status("중단됨")
                        break

                    idx = future_to_idx[future]
                    product = products[idx]
                    result = future.result()
                    results[idx] = result

                    with self._lock:
                        done += 1
                        if result["verdict"] == "보류":
                            hold += 1
                        if result["verdict"] == "반려":
                            reject += 1
                        _done, _hold, _reject = done, hold, reject

                    name = product.get("상품명", "")
                    self._cb.on_status(f"[{_done}/{total}] {name[:35]}… 완료")
                    self._cb.on_progress(_done, total, _hold, _reject)
                    self._cb.on_result_row({**product, **result})

            valid_results = [r for r in results if r is not None]
            self._cb.on_status(f"완료 — 총 {done}건 (보류 {hold} / 반려 {reject})")
            self._cb.on_done(products, valid_results)

        except Exception as exc:
            logger.error("파이프라인 오류: %s", exc, exc_info=True)
            self._cb.on_error(str(exc))

    def _process_one_safe(self, product: dict[str, Any], cfg: PipelineConfig, idx: int) -> dict[str, Any]:
        """에러 핸들링 포함 단일 상품 처리."""
        code = product.get("상품코드", "")
        name = product.get("상품명", "")
        try:
            return self._process_one(product, cfg)
        except Exception as exc:
            logger.error("상품 처리 오류 [%s] %s: %s", code, name[:40], exc, exc_info=True)
            return _error_result(product, str(exc))

    def _process_one(self, product: dict[str, Any], cfg: PipelineConfig) -> dict[str, Any]:
        """상품 1건 STEP 2~7 처리."""
        # STEP 2: 키워드 생성 + 옵션 분리
        option_keywords = split_options(product.get("상품명", ""))

        all_candidates: list[dict] = []

        for keyword in option_keywords:
            if self._stop_event.is_set():
                break
            # STEP 3: 네이버 검색
            raw_candidates = search_products(
                keyword,
                cfg.naver_client_id,
                cfg.naver_client_secret,
                sort=cfg.sort,
            )
            # STEP 4: 사전필터
            filtered = filter_candidates(product, raw_candidates)
            all_candidates.extend(filtered)

        # 중복 제거 (productId 기준)
        seen: set[str] = set()
        unique: list[dict] = []
        for c in all_candidates:
            pid = c.get("productId") or c.get("title", "")
            if pid not in seen:
                seen.add(pid)
                unique.append(c)

        # STEP 5: Gemini 동일성 판정
        matched = match_candidates(
            product, unique,
            gemini_api_key=cfg.gemini_api_key,
            model_name=cfg.gemini_model,
            batch_size=cfg.batch_size,
        )

        # STEP 6: 단위가격 정규화
        normalized = normalize_unit_prices(product, matched)

        # STEP 7: 최저가 재산출 + 판정
        return judge(product, normalized)


def _error_result(product: dict[str, Any], error_msg: str) -> dict[str, Any]:
    return {
        "상품코드":             product.get("상품코드", ""),
        "상품명":               product.get("상품명", ""),
        "verdict":              "보류",
        "ai_lowest_price":      0,
        "ai_unit_lowest_price": 0.0,
        "confidence":           0,
        "reason":               f"처리 오류: {error_msg[:80]}",
        "recalc_discount_rate": 0,
        "recalc_margin_rate":   0,
        "top_candidates":       [],
    }
