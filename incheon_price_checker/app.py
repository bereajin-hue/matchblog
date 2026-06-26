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
        self._excel_path = tk.StringVar()
        self._naver_id = tk.StringVar()
        self._naver_secret = tk.StringVar()
        self._gemini_key = tk.StringVar()
        self._gemini_model = tk.StringVar(value=DEFAULT_GEMINI_MODEL)
        self._sort = tk.StringVar(value=NAVER_DEFAULT_SORT)
        self._concurrency = tk.IntVar(value=DEFAULT_CONCURRENCY)
        self._batch_size = tk.IntVar(value=DEFAULT_BATCH_SIZE)
        self._save_keys = tk.BooleanVar(value=False)

        self._apply_saved_settings()
        self._build_ui()

    # ── 저장된 설정 복원 ──────────────────────────────────────────────────────
    def _apply_saved_settings(self) -> None:
        s = self._settings
        if s.get("naver_id"):
            self._naver_id.set(s["naver_id"])
        if s.get("naver_secret"):
            self._naver_secret.set(s["naver_secret"])
        if s.get("gemini_key"):
            self._gemini_key.set(s["gemini_key"])
        if s.get("gemini_model"):
            self._gemini_model.set(s["gemini_model"])
        if s.get("sort"):
            self._sort.set(s["sort"])
        if s.get("concurrency"):
            self._concurrency.set(s["concurrency"])
        if s.get("batch_size"):
            self._batch_size.set(s["batch_size"])
        if s.get("save_keys"):
            self._save_keys.set(True)

    # ── UI 빌드 ───────────────────────────────────────────────────────────────
    def _build_ui(self) -> None:
        pad = {"padx": 12, "pady": 4}
        root = ttk.Frame(self, padding=12)
        root.grid(row=0, column=0, sticky="nsew")

        row = 0

        # ── 네이버 쇼핑 API ──────────────────────────────────────────────────
        ttk.LabelFrame(root, text=" ▣ 네이버 쇼핑 API ").grid(
            row=row, column=0, columnspan=3, sticky="ew", **pad
        )
        row += 1

        ttk.Label(root, text="Client ID").grid(row=row, column=0, sticky="e", **pad)
        ttk.Entry(root, textvariable=self._naver_id, width=36).grid(
            row=row, column=1, columnspan=2, sticky="w", **pad
        )
        row += 1

        ttk.Label(root, text="Client Secret").grid(row=row, column=0, sticky="e", **pad)
        ttk.Entry(root, textvariable=self._naver_secret, width=36, show="*").grid(
            row=row, column=1, columnspan=2, sticky="w", **pad
        )
        row += 1

        # ── Google Gemini API ────────────────────────────────────────────────
        ttk.LabelFrame(root, text=" ▣ Google Gemini API ").grid(
            row=row, column=0, columnspan=3, sticky="ew", **pad
        )
        row += 1

        ttk.Label(root, text="API Key").grid(row=row, column=0, sticky="e", **pad)
        ttk.Entry(root, textvariable=self._gemini_key, width=36, show="*").grid(
            row=row, column=1, columnspan=2, sticky="w", **pad
        )
        row += 1

        ttk.Label(root, text="모델 선택").grid(row=row, column=0, sticky="e", **pad)
        model_cb = ttk.Combobox(
            root,
            textvariable=self._gemini_model,
            values=GEMINI_MODEL_OPTIONS,
            width=30,
        )
        model_cb.grid(row=row, column=1, columnspan=2, sticky="w", **pad)
        ttk.Label(root, text="(자유편집 가능)", foreground="gray").grid(
            row=row, column=2, sticky="w"
        )
        row += 1

        # ── 입력 파일 ────────────────────────────────────────────────────────
        ttk.LabelFrame(root, text=" ▣ 입력 파일 ").grid(
            row=row, column=0, columnspan=3, sticky="ew", **pad
        )
        row += 1

        ttk.Label(root, text="엑셀").grid(row=row, column=0, sticky="e", **pad)
        ttk.Entry(root, textvariable=self._excel_path, width=28, state="readonly").grid(
            row=row, column=1, sticky="w", **pad
        )
        ttk.Button(root, text="찾아보기", command=self._browse_excel).grid(
            row=row, column=2, sticky="w", **pad
        )
        row += 1

        # ── 정렬 옵션 ────────────────────────────────────────────────────────
        ttk.Label(root, text="정렬").grid(row=row, column=0, sticky="e", **pad)
        sort_frame = ttk.Frame(root)
        sort_frame.grid(row=row, column=1, columnspan=2, sticky="w", **pad)
        for val, label in [("sim", "sim"), ("date", "date"), ("asc", "asc"), ("dsc", "dsc")]:
            ttk.Radiobutton(
                sort_frame, text=label, variable=self._sort, value=val
            ).pack(side="left", padx=4)
        row += 1

        # ── 동시처리 / 배치크기 ──────────────────────────────────────────────
        ttk.Label(root, text="동시처리").grid(row=row, column=0, sticky="e", **pad)
        conc_frame = ttk.Frame(root)
        conc_frame.grid(row=row, column=1, columnspan=2, sticky="w", **pad)
        ttk.Spinbox(conc_frame, textvariable=self._concurrency, from_=1, to=20, width=5).pack(
            side="left"
        )
        ttk.Label(conc_frame, text="  배치크기").pack(side="left", padx=8)
        ttk.Spinbox(conc_frame, textvariable=self._batch_size, from_=1, to=30, width=5).pack(
            side="left"
        )
        row += 1

        # ── 키 저장 경고 + 실행 버튼 ────────────────────────────────────────
        btn_frame = ttk.Frame(root)
        btn_frame.grid(row=row, column=0, columnspan=3, sticky="ew", **pad)
        ttk.Checkbutton(
            btn_frame,
            text="키 저장 (평문 저장됨 — 공유 PC 주의)",
            variable=self._save_keys,
        ).pack(side="left", padx=4)
        self._run_btn = ttk.Button(
            btn_frame, text="  검수 실행  ", command=self._on_run
        )
        self._run_btn.pack(side="right", padx=4)
        row += 1

        # ── 진행률 ───────────────────────────────────────────────────────────
        ttk.LabelFrame(root, text=" ▣ 진행 ").grid(
            row=row, column=0, columnspan=3, sticky="ew", **pad
        )
        row += 1

        self._progress_var = tk.DoubleVar(value=0)
        self._progress_bar = ttk.Progressbar(
            root, variable=self._progress_var, maximum=100, length=420
        )
        self._progress_bar.grid(row=row, column=0, columnspan=2, sticky="ew", **pad)
        self._progress_label = ttk.Label(root, text="0 / 0")
        self._progress_label.grid(row=row, column=2, sticky="w", **pad)
        row += 1

        self._status_label = ttk.Label(root, text="대기 중", foreground="gray")
        self._status_label.grid(row=row, column=0, columnspan=3, sticky="w", **pad)
        row += 1

        # ── 결과 미리보기 테이블 ─────────────────────────────────────────────
        ttk.LabelFrame(root, text=" ▣ 결과 미리보기 ").grid(
            row=row, column=0, columnspan=3, sticky="ew", **pad
        )
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
        row += 1

        # 판정별 태그 색상
        self._tree.tag_configure("APPROVE", background="#C6EFCE")
        self._tree.tag_configure("HOLD", background="#FFEB9C")
        self._tree.tag_configure("REJECT", background="#FFC7CE")

        # ── 저장 버튼 ────────────────────────────────────────────────────────
        self._save_btn = ttk.Button(
            root, text="결과 엑셀 저장", command=self._on_save, state="disabled"
        )
        self._save_btn.grid(row=row, column=0, columnspan=3, sticky="e", **pad)

        self._results: list[dict] = []

    # ── 이벤트 핸들러 ─────────────────────────────────────────────────────────

    def _browse_excel(self) -> None:
        path = filedialog.askopenfilename(
            title="엑셀 파일 선택",
            filetypes=[("Excel 파일", "*.xlsx *.xls"), ("모든 파일", "*.*")],
        )
        if path:
            self._excel_path.set(path)

    def _on_run(self) -> None:
        """검수 실행 — 파이프라인 연결은 프롬프트 8에서 완성."""
        if not self._validate_inputs():
            return

        if self._save_keys.get():
            _save_settings(
                {
                    "naver_id": self._naver_id.get(),
                    "naver_secret": self._naver_secret.get(),
                    "gemini_key": self._gemini_key.get(),
                    "gemini_model": self._gemini_model.get(),
                    "sort": self._sort.get(),
                    "concurrency": self._concurrency.get(),
                    "batch_size": self._batch_size.get(),
                    "save_keys": True,
                }
            )

        # TODO: 프롬프트 8에서 실제 파이프라인 스레드 실행
        self._status_label.config(text="(파이프라인 구현 예정 — 프롬프트 8)", foreground="blue")

    def _on_save(self) -> None:
        """결과 엑셀 저장 — 프롬프트 8에서 완성."""
        path = filedialog.asksaveasfilename(
            defaultextension=".xlsx",
            filetypes=[("Excel 파일", "*.xlsx")],
            title="결과 저장 위치 선택",
        )
        if not path:
            return
        # TODO: 프롬프트 8에서 excel_io.save_results 호출
        messagebox.showinfo("저장", f"저장 위치 선택됨:\n{path}\n(실제 저장은 프롬프트 8)")

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

    # ── 진행률 업데이트 (외부 스레드에서 호출) ────────────────────────────────

    def update_progress(
        self,
        done: int,
        total: int,
        hold: int = 0,
        reject: int = 0,
    ) -> None:
        pct = (done / total * 100) if total else 0
        self._progress_var.set(pct)
        self._progress_label.config(
            text=f"{done} / {total}   (보류 {hold} / 반려 {reject})"
        )

    def append_result_row(self, row: dict) -> None:
        """결과 한 행을 테이블에 추가."""
        verdict = row.get("verdict", "")
        tag_map = {"승인추천": "APPROVE", "보류": "HOLD", "반려": "REJECT"}
        tag = tag_map.get(verdict, "")
        self._tree.insert(
            "",
            "end",
            values=(
                row.get("상품코드", ""),
                row.get("상품명", ""),
                row.get("시중가격", ""),
                row.get("ai_lowest_price", ""),
                verdict,
                f"{row.get('confidence', '')}%",
                row.get("reason", ""),
            ),
            tags=(tag,),
        )
        self._results.append(row)
        if self._results:
            self._save_btn.config(state="normal")


def main() -> None:
    app = App()
    app.mainloop()


if __name__ == "__main__":
    main()
