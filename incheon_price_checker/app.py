"""
인천e몰 최저가 AI 검수 툴 — GUI 진입점 (tkinter).
"""
from __future__ import annotations

import tkinter as tk
from tkinter import ttk

# GUI 구현은 프롬프트 1에서 완성한다.
# 이 파일은 진입점 골격만 제공한다.


def main() -> None:
    root = tk.Tk()
    root.title("인천e몰 최저가 AI 검수")
    root.resizable(False, False)

    # TODO: 프롬프트 1에서 레이아웃 구현
    label = ttk.Label(root, text="(GUI 구현 예정 — 프롬프트 1)")
    label.pack(padx=40, pady=40)

    root.mainloop()


if __name__ == "__main__":
    main()
