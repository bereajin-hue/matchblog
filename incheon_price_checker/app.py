"""
인천e몰 최저가 AI 검수 툴 — GUI 진입점 (tkinter).
"""
from __future__ import annotations

import json
import os
import tkinter as tk
from tkinter import filedialog, messagebox, ttk

from config import (
    DEFAULT_BATCH_SIZE,
    DEFAULT_CONCURRENCY,
    DEFAULT_GEMINI_MODEL,
    GEMINI_MODEL_OPTIONS,
    NAVER_DEFAULT_SORT,
    SETTINGS_JSON,
)


# ── 설정 저장/로드 ─────────────────────────────────────────────────────────────

def _load_settings() -> dict:
    if os.path.exists(SETTINGS_JSON):
        try:
            with open(SETTINGS_JSON, encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            pass
    return {}


def _save_settings(data: dict) -> None:
    with open(SETTINGS_JSON, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)


# ── 메인 앱 ──────────────────────────────────────────────────────────────────

class App(tk.Tk):
    def __init__(self) -> None:
        super().__init__()
        self.title("인천e몰 최저가 AI 검수")
        self.resizable(False, False)

        self._settings = _load_settings()
        self._excel_path   = tk.StringVar()
        self._naver_id     = tk.StringVar()
        self._naver_secret = tk.StringVar()
        self._gemini_key   = tk.StringVar()
        self._gemini_model = tk.StringVar(value=DEFAULT_GEMINI_MODEL)
        self._sort         = tk.StringVar(value=NAVER_DEFAULT_SORT)
        self._concurrency  = tk.IntVar(value=DEFAULT_CONCURRENCY)
        self._batch_size   = tk.IntVar(value=DEFAULT_BATCH_SIZE)
        self._save_keys    = tk.BooleanVar(value=False)

        self._pipeline = None          # Pipeline 인스턴스
        self._products: list[dict] = []
        self._results:  list[dict] = []

        self._apply_saved_settings()
        self._build_ui()

    # ── 저장된 설정 복원 ──────────────────────────────────────────────────────
    def _apply_saved_settings(self) -> None:
        s = self._settings
        if s.get("naver_id"):     self._naver_id.set(s["naver_id"])
        if s.get("naver_secret"): self._naver_secret.set(s["naver_secret"])
        if s.get("gemini_key"):   self._gemini_key.set(s["gemini_key"])
        if s.get("gemini_model"): self._gemini_model.set(s["gemini_model"])
        if s.get("sort"):         self._sort.set(s["sort"])
        if s.get("concurrency"):  self._concurrency.set(s["concurrency"])
        if s.get("batch_size"):   self._batch_size.set(s["batch_size"])
        if s.get("save_keys"):    self._save_keys.set(True)

    # ── UI 빌드 ───────────────────────────────────────────────────────────────
    def _build_ui(self) -> None:
        pad = {"padx": 12, "pady": 4}
        root = ttk.Frame(self, padding=12)
        root.grid(row=0, column=0, sticky="nsew")
        row = 0

        # ── 네이버 쇼핑 API ──────────────────────────────────────────────────
        ttk.LabelFrame(root, text=" ▣ 네이버 쇼핑 API ").grid(
            row=row, column=0, columnspan=3, sticky="ew", **pad)
        row += 1
        ttk.Label(root, text="Client ID").grid(row=row, column=0, sticky="e", **pad)
        ttk.Entry(root, textvariable=self._naver_id, width=36).grid(
            row=row, column=1, columnspan=2, sticky="w", **pad)
        row += 1
        ttk.Label(root, text="Client Secret").grid(row=row, column=0, sticky="e", **pad)
        ttk.Entry(root, textvariable=self._naver_secret, width=36, show="*").grid(
            row=row, column=1, columnspan=2, sticky="w", **pad)
        row += 1

        # ── Google Gemini API ────────────────────────────────────────────────
        ttk.LabelFrame(root, text=" ▣ Google Gemini API ").grid(
            row=row, column=0, columnspan=3, sticky="ew", **pad)
        row += 1
        ttk.Label(root, text="API Key").grid(row=row, column=0, sticky="e", **pad)
        ttk.Entry(root, textvariable=self._gemini_key, width=36, show="*").grid(
            row=row, column=1, columnspan=2, sticky="w", **pad)
        row += 1
        ttk.Label(root, text="모델 선택").grid(row=row, column=0, sticky="e", **pad)
        model_frame = ttk.Frame(root)
        model_frame.grid(row=row, column=1, columnspan=2, sticky="w", **pad)
        ttk.Combobox(model_frame, textvariable=self._gemini_model,
                     values=GEMINI_MODEL_OPTIONS, width=28).pack(side="left")
        ttk.Label(model_frame, text=" (자유편집 가능)", foreground="gray").pack(side="left")
        row += 1

        # ── 입력 파일 ────────────────────────────────────────────────────────
        ttk.LabelFrame(root, text=" ▣ 입력 파일 ").grid(
            row=row, column=0, columnspan=3, sticky="ew", **pad)
        row += 1
        ttk.Label(root, text="엑셀").grid(row=row, column=0, sticky="e", **pad)
        ttk.Entry(root, textvariable=self._excel_path, width=28, state="readonly").grid(
            row=row, column=1, sticky="w", **pad)
        ttk.Button(root, text="찾아보기", command=self._browse_excel).grid(
            row=row, column=2, sticky="w", **pad)
        row += 1

        # 정렬
        ttk.Label(root, text="정렬").grid(row=row, column=0, sticky="e", **pad)
        sort_frame = ttk.Frame(root)
        sort_frame.grid(row=row, column=1, columnspan=2, sticky="w", **pad)
        for val, label in [("sim","sim"),("date","date"),("asc","asc"),("dsc","dsc")]:
            ttk.Radiobutton(sort_frame, text=label, variable=self._sort, value=val
                            ).pack(side="left", padx=4)
        row += 1

        # 동시처리 / 배치크기
        ttk.Label(root, text="동시처리").grid(row=row, column=0, sticky="e", **pad)
        conc_frame = ttk.Frame(root)
        conc_frame.grid(row=row, column=1, columnspan=2, sticky="w", **pad)
        ttk.Spinbox(conc_frame, textvariable=self._concurrency, from_=1, to=20, width=5
                    ).pack(side="left")
        ttk.Label(conc_frame, text="  배치크기").pack(side="left", padx=8)
        ttk.Spinbox(conc_frame, textvariable=self._batch_size, from_=1, to=30, width=5
                    ).pack(side="left")
        row += 1

        # ── 키 저장 + 실행/중지 버튼 ────────────────────────────────────────
        btn_frame = ttk.Frame(root)
        btn_frame.grid(row=row, column=0, columnspan=3, sticky="ew", **pad)
        ttk.Checkbutton(btn_frame, text="키 저장 (평문 저장됨 — 공유 PC 주의)",
                        variable=self._save_keys).pack(side="left", padx=4)
        self._stop_btn = ttk.Button(btn_frame, text="  중지  ",
                                    command=self._on_stop, state="disabled")
        self._stop_btn.pack(side="right", padx=4)
        self._run_btn = ttk.Button(btn_frame, text="  검수 실행  ", command=self._on_run)
        self._run_btn.pack(side="right", padx=4)
        row += 1

        # ── 진행률 ───────────────────────────────────────────────────────────
        ttk.LabelFrame(root, text=" ▣ 진행 ").grid(
            row=row, column=0, columnspan=3, sticky="ew", **pad)
        row += 1
        self._progress_var = tk.DoubleVar(value=0)
        self._progress_bar = ttk.Progressbar(
            root, variable=self._progress_var, maximum=100, length=420)
        self._progress_bar.grid(row=row, column=0, columnspan=2, sticky="ew", **pad)
        self._progress_label = ttk.Label(root, text="0 / 0")
        self._progress_label.grid(row=row, column=2, sticky="w", **pad)
        row += 1
        self._status_label = ttk.Label(root, text="대기 중", foreground="gray")
        self._status_label.grid(row=row, column=0, columnspan=3, sticky="w", **pad)
        row += 1

        # ── 결과 미리보기 테이블 ─────────────────────────────────────────────
        ttk.LabelFrame(root, text=" ▣ 결과 미리보기 ").grid(
            row=row, column=0, columnspan=3, sticky="ew", **pad)
        row += 1
        cols = ("상품코드", "상품명", "시중가격", "AI최저가", "AI판정", "AI신뢰도", "AI근거")
        self._tree = ttk.Treeview(root, columns=cols, show="headings", height=10)
        col_widths = (80, 200, 80, 80, 70, 60, 200)
        for col, w in zip(cols, col_widths):
            self._tree.heading(col, text=col)
            self._tree.column(col, width=w, anchor="center")
        self._tree.grid(row=row, column=0, columnspan=3, sticky="nsew", **pad)
        vsb = ttk.Scrollbar(root, orient="vertical", command=self._tree.yview)
        vsb.grid(row=row, column=3, sticky="ns", pady=4)
        self._tree.configure(yscrollcommand=vsb.set)
        self._tree.tag_configure("APPROVE", background="#C6EFCE")
        self._tree.tag_configure("HOLD",    background="#FFEB9C")
        self._tree.tag_configure("REJECT",  background="#FFC7CE")
        row += 1

        # ── 저장 버튼 ────────────────────────────────────────────────────────
        save_frame = ttk.Frame(root)
        save_frame.grid(row=row, column=0, columnspan=3, sticky="ew", **pad)
        self._split_md = tk.BooleanVar(value=False)
        ttk.Checkbutton(save_frame, text="담당MD별 시트 분리",
                        variable=self._split_md).pack(side="left")
        self._save_btn = ttk.Button(save_frame, text="결과 엑셀 저장",
                                    command=self._on_save, state="disabled")
        self._save_btn.pack(side="right")

    # ── 이벤트 핸들러 ─────────────────────────────────────────────────────────

    def _browse_excel(self) -> None:
        path = filedialog.askopenfilename(
            title="엑셀 파일 선택",
            filetypes=[("Excel 파일", "*.xlsx *.xls"), ("모든 파일", "*.*")],
        )
        if path:
            self._excel_path.set(path)

    def _on_run(self) -> None:
        if not self._validate_inputs():
            return

        if self._save_keys.get():
            _save_settings({
                "naver_id":     self._naver_id.get(),
                "naver_secret": self._naver_secret.get(),
                "gemini_key":   self._gemini_key.get(),
                "gemini_model": self._gemini_model.get(),
                "sort":         self._sort.get(),
                "concurrency":  self._concurrency.get(),
                "batch_size":   self._batch_size.get(),
                "save_keys":    True,
            })

        # 테이블 초기화
        for item in self._tree.get_children():
            self._tree.delete(item)
        self._results.clear()
        self._products.clear()
        self._progress_var.set(0)
        self._progress_label.config(text="0 / 0")

        self._run_btn.config(state="disabled")
        self._stop_btn.config(state="normal")
        self._save_btn.config(state="disabled")

        # 파이프라인 임포트 (실행 시점에 임포트해 GUI 초기 로딩 지연 방지)
        from pipeline import Pipeline, PipelineCallbacks, PipelineConfig

        cfg = PipelineConfig(
            excel_path        = self._excel_path.get(),
            naver_client_id   = self._naver_id.get(),
            naver_client_secret = self._naver_secret.get(),
            gemini_api_key    = self._gemini_key.get(),
            gemini_model      = self._gemini_model.get(),
            sort              = self._sort.get(),
            concurrency       = self._concurrency.get(),
            batch_size        = self._batch_size.get(),
        )
        cbs = PipelineCallbacks(
            on_progress   = lambda d, t, h, r: self.after(0, self._update_progress, d, t, h, r),
            on_result_row = lambda row: self.after(0, self._append_row, row),
            on_status     = lambda msg: self.after(0, self._set_status, msg),
            on_done       = lambda prods, res: self.after(0, self._on_done, prods, res),
            on_error      = lambda msg: self.after(0, self._on_pipeline_error, msg),
        )
        self._pipeline = Pipeline(cfg, cbs)
        self._pipeline.start()

    def _on_stop(self) -> None:
        if self._pipeline:
            self._pipeline.stop()
        self._stop_btn.config(state="disabled")
        self._run_btn.config(state="normal")

    def _on_save(self) -> None:
        if not self._results:
            messagebox.showinfo("알림", "저장할 결과가 없습니다.")
            return
        path = filedialog.asksaveasfilename(
            defaultextension=".xlsx",
            filetypes=[("Excel 파일", "*.xlsx")],
            title="결과 저장 위치 선택",
        )
        if not path:
            return
        try:
            from core.excel_io import save_results
            save_results(
                self._products, self._results, path,
                split_by_md=self._split_md.get(),
            )
            messagebox.showinfo("저장 완료", f"결과를 저장했습니다:\n{path}")
        except Exception as exc:
            messagebox.showerror("저장 오류", str(exc))

    # ── 콜백 수신 (메인 스레드) ───────────────────────────────────────────────

    def _update_progress(self, done: int, total: int, hold: int, reject: int) -> None:
        pct = (done / total * 100) if total else 0
        self._progress_var.set(pct)
        self._progress_label.config(
            text=f"{done} / {total}   (보류 {hold} / 반려 {reject})")

    def _set_status(self, msg: str) -> None:
        self._status_label.config(text=msg, foreground="gray")

    def _append_row(self, row: dict) -> None:
        verdict = row.get("verdict", "")
        tag_map = {"승인추천": "APPROVE", "보류": "HOLD", "반려": "REJECT"}
        tag = tag_map.get(verdict, "")
        self._tree.insert("", "end", values=(
            row.get("상품코드", ""),
            row.get("상품명", "")[:35],
            f'{row.get("시중가격", 0):,}' if row.get("시중가격") else "",
            f'{row.get("ai_lowest_price", 0):,}' if row.get("ai_lowest_price") else "",
            verdict,
            f'{row.get("confidence", "")}%',
            row.get("reason", "")[:40],
        ), tags=(tag,))
        # 스크롤 최하단 유지
        children = self._tree.get_children()
        if children:
            self._tree.see(children[-1])

    def _on_done(self, products: list[dict], results: list[dict]) -> None:
        self._products = products
        self._results  = results
        self._run_btn.config(state="normal")
        self._stop_btn.config(state="disabled")
        self._save_btn.config(state="normal")
        self._status_label.config(foreground="green")

    def _on_pipeline_error(self, msg: str) -> None:
        self._run_btn.config(state="normal")
        self._stop_btn.config(state="disabled")
        messagebox.showerror("파이프라인 오류", f"처리 중 오류가 발생했습니다:\n{msg}")
        self._set_status("오류 발생 — 로그를 확인하세요")

    # ── 입력 검증 ─────────────────────────────────────────────────────────────

    def _validate_inputs(self) -> bool:
        if not self._naver_id.get().strip():
            messagebox.showwarning("입력 오류", "네이버 Client ID를 입력하세요.")
            return False
        if not self._naver_secret.get().strip():
            messagebox.showwarning("입력 오류", "네이버 Client Secret을 입력하세요.")
            return False
        if not self._gemini_key.get().strip():
            messagebox.showwarning("입력 오류", "Gemini API Key를 입력하세요.")
            return False
        if not self._excel_path.get():
            messagebox.showwarning("입력 오류", "엑셀 파일을 선택하세요.")
            return False
        if not os.path.exists(self._excel_path.get()):
            messagebox.showwarning("입력 오류", "선택한 파일이 존재하지 않습니다.")
            return False
        return True


def main() -> None:
    app = App()
    app.mainloop()


if __name__ == "__main__":
    main()
