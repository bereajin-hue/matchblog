"""
네이버 API / Gemini 응답 SQLite 캐시 — 재실행 비용 0 수렴.
"""
from __future__ import annotations
import hashlib
import json
import sqlite3
from typing import Any

from config import CACHE_DB


def _get_conn() -> sqlite3.Connection:
    conn = sqlite3.connect(CACHE_DB)
    conn.execute(
        """CREATE TABLE IF NOT EXISTS cache (
            key TEXT PRIMARY KEY,
            value TEXT NOT NULL,
            created_at TEXT DEFAULT (datetime('now'))
        )"""
    )
    return conn


def _make_key(namespace: str, payload: Any) -> str:
    raw = namespace + ":" + json.dumps(payload, ensure_ascii=False, sort_keys=True)
    return hashlib.sha256(raw.encode()).hexdigest()


def get(namespace: str, payload: Any) -> Any | None:
    """
    캐시 조회. 없으면 None 반환.
    payload는 JSON 직렬화 가능한 값이어야 한다.
    """
    key = _make_key(namespace, payload)
    with _get_conn() as conn:
        row = conn.execute("SELECT value FROM cache WHERE key=?", (key,)).fetchone()
    return json.loads(row[0]) if row else None


def set(namespace: str, payload: Any, value: Any) -> None:
    """
    캐시 저장. 동일 키 충돌 시 덮어쓴다.
    value에 API 키가 포함되지 않도록 호출 측에서 반드시 정제한다.
    """
    key = _make_key(namespace, payload)
    with _get_conn() as conn:
        conn.execute(
            "INSERT OR REPLACE INTO cache (key, value) VALUES (?, ?)",
            (key, json.dumps(value, ensure_ascii=False)),
        )
