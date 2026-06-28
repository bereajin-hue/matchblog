# smartstoreblog ↔ matchblog 연동 폴러

## 설치 방법

1. 이 파일을 `C:\Users\takkf\smartstoreblog\` 폴더에 복사

2. smartstoreblog `.env` 파일에 Supabase 정보 추가:
```
SUPABASE_URL=https://cpzuaonbseltcipmjusg.supabase.co
SUPABASE_SERVICE_KEY=여기에_서비스키_입력
POLL_INTERVAL_SECONDS=30
```

3. 패키지 설치:
```
pip install supabase python-dotenv
```

4. 실행:
```
cd C:\Users\takkf\smartstoreblog
python matchblog_poller.py
```

## 동작 방식

- 30초마다 Supabase `posting_jobs` 테이블 확인
- `pending` 작업 발견 시 자동으로 smartstoreblog 발행 엔진 실행
- 완료/실패 결과를 Supabase에 기록
- matchblog 어드민에서 실시간 상태 확인 가능
