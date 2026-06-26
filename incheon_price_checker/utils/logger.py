"""
감사 로그 — API 키가 절대 출력되지 않도록 주의.
"""
from __future__ import annotations
import logging
import os

from config import LOG_FILE


def get_logger(name: str = "price_checker") -> logging.Logger:
    """
    파일 + 콘솔 핸들러가 붙은 Logger 반환.
    로그에 API 키를 포함시키지 말 것 (호출 측 책임).
    """
    logger = logging.getLogger(name)
    if logger.handlers:
        return logger

    logger.setLevel(logging.DEBUG)
    fmt = logging.Formatter("%(asctime)s [%(levelname)s] %(message)s")

    os.makedirs(os.path.dirname(LOG_FILE), exist_ok=True)
    fh = logging.FileHandler(LOG_FILE, encoding="utf-8")
    fh.setFormatter(fmt)
    fh.setLevel(logging.DEBUG)

    ch = logging.StreamHandler()
    ch.setFormatter(fmt)
    ch.setLevel(logging.INFO)

    logger.addHandler(fh)
    logger.addHandler(ch)
    return logger
