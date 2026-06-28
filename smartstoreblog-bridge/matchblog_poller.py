"""
matchblog_poller.py
-------------------
Supabase의 posting_jobs 테이블을 폴링하여 pending 작업을 발견하면
smartstoreblog의 posting 엔진을 실행합니다.

실행 방법:
  cd C:\\Users\\takkf\\smartstoreblog
  python matchblog_poller.py

필요 패키지:
  pip install supabase python-dotenv
"""

import os
import sys
import time
import traceback
from datetime import datetime, timezone

from dotenv import load_dotenv

# smartstoreblog 루트를 path에 추가
SMARTSTORE_DIR = os.path.dirname(os.path.abspath(__file__))
if SMARTSTORE_DIR not in sys.path:
    sys.path.insert(0, SMARTSTORE_DIR)

load_dotenv(os.path.join(SMARTSTORE_DIR, '.env'))

try:
    from supabase import create_client, Client
except ImportError:
    print("[오류] supabase 패키지가 없습니다. 다음 명령을 실행하세요:")
    print("  pip install supabase python-dotenv")
    sys.exit(1)

SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY", "")
POLL_INTERVAL = int(os.getenv("POLL_INTERVAL_SECONDS", "30"))

if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
    print("[오류] .env 파일에 SUPABASE_URL, SUPABASE_SERVICE_KEY를 설정하세요.")
    sys.exit(1)


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def get_supabase() -> Client:
    return create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)


def fetch_pending_job(sb: Client) -> dict | None:
    """pending 상태의 작업을 1개 가져와 running으로 변경 (atomic)."""
    res = (
        sb.table("posting_jobs")
        .select("id, order_id, extra_notes")
        .eq("status", "pending")
        .order("created_at")
        .limit(1)
        .execute()
    )
    if not res.data:
        return None

    job = res.data[0]
    # running으로 상태 변경 (다른 인스턴스 중복 방지)
    update = (
        sb.table("posting_jobs")
        .update({"status": "running", "started_at": now_iso(), "last_ping": now_iso()})
        .eq("id", job["id"])
        .eq("status", "pending")  # 이미 다른 곳에서 집어간 경우 무시
        .execute()
    )
    if not update.data:
        return None  # 다른 인스턴스가 먼저 집어감

    return job


def fetch_order(sb: Client, order_id: str) -> dict | None:
    res = sb.table("orders").select("place_url, applicant_name, product_type").eq("id", order_id).single().execute()
    return res.data


def mark_done(sb: Client, job_id: str, log: str):
    sb.table("posting_jobs").update({
        "status": "done",
        "done_at": now_iso(),
        "result_log": log,
        "last_ping": now_iso(),
    }).eq("id", job_id).execute()


def mark_failed(sb: Client, job_id: str, log: str):
    sb.table("posting_jobs").update({
        "status": "failed",
        "done_at": now_iso(),
        "result_log": log,
        "last_ping": now_iso(),
    }).eq("id", job_id).execute()


def ping(sb: Client, job_id: str):
    sb.table("posting_jobs").update({"last_ping": now_iso()}).eq("id", job_id).execute()


def run_posting(job: dict, order: dict) -> str:
    """
    smartstoreblog의 실제 발행 엔진을 호출합니다.
    반환값: 결과 로그 문자열
    """
    from app import _migrate_legacy_creds, _run_posting, posting_job
    from core.credential_manager import CredentialManager, CredentialLoadError
    import threading

    place_url = order.get("place_url", "")
    extra_notes = job.get("extra_notes", "")

    if not place_url:
        return "[오류] 플레이스 URL이 없습니다."

    try:
        creds = _migrate_legacy_creds(CredentialManager().load())
    except CredentialLoadError as e:
        return f"[오류] 계정 정보 로드 실패: {e}"

    active = [
        (i, b) for i, b in enumerate(creds.get("blogs", []))
        if b.get("id") and b.get("pw") and b.get("write_url")
    ]

    if not active:
        return "[오류] 설정된 블로그 계정이 없습니다. smartstoreblog에서 계정을 먼저 설정하세요."

    options = {"extra_notes": extra_notes, "target_length": 1500}

    # posting_job 전역 상태 초기화
    posting_job["running"] = False
    posting_job["stop_event"].clear()
    posting_job["done_count"] = 0
    posting_job["total_count"] = len(active)
    posting_job["progress"] = 0
    posting_job["step"] = "시작..."
    posting_job["current_url"] = place_url

    log_lines = []

    def run():
        _run_posting([place_url], options, active)

    t = threading.Thread(target=run, daemon=True)
    posting_job["running"] = True
    t.start()
    t.join(timeout=7200)  # 최대 2시간

    done = posting_job.get("done_count", 0)
    total = posting_job.get("total_count", 0)
    log_lines.append(f"완료: {done}/{total} 블로그 발행")
    return "\n".join(log_lines)


def main():
    print(f"[{now_iso()}] matchblog 폴러 시작 (폴링 간격: {POLL_INTERVAL}초)")
    sb = get_supabase()

    while True:
        try:
            job = fetch_pending_job(sb)
            if job:
                print(f"[{now_iso()}] 작업 발견: {job['id']} (주문: {job['order_id']})")
                order = fetch_order(sb, job["order_id"])
                if not order:
                    mark_failed(sb, job["id"], "[오류] 주문 정보를 찾을 수 없습니다.")
                    continue

                print(f"  플레이스 URL: {order.get('place_url')}")
                print(f"  추가정보: {job.get('extra_notes') or '(없음)'}")

                try:
                    result_log = run_posting(job, order)
                    mark_done(sb, job["id"], result_log)
                    print(f"[{now_iso()}] 작업 완료: {job['id']}")
                except Exception as e:
                    err = traceback.format_exc()
                    mark_failed(sb, job["id"], f"[오류]\n{err}")
                    print(f"[{now_iso()}] 작업 실패: {e}")
            else:
                print(f"[{now_iso()}] 대기 중... (pending 작업 없음)", end="\r")

        except KeyboardInterrupt:
            print("\n[종료] 폴러를 중지합니다.")
            break
        except Exception as e:
            print(f"[{now_iso()}] 폴러 오류: {e}")

        time.sleep(POLL_INTERVAL)


if __name__ == "__main__":
    main()
