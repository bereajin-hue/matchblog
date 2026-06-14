# 매치블로그 (MatchBlog) — 프로젝트 마스터 컨텍스트

> 이 파일은 클로드코드(Claude Code)가 항상 참조하는 마스터 컨텍스트입니다.
> 프로젝트 루트에 `CLAUDE.md`로 두고, 작업 시작 전 반드시 이 규칙을 준수합니다.

---

## 1. 서비스 개요

**매치블로그(MatchBlog)** — 네이버 플레이스 기반 블로그 후기 포스팅 대행 SaaS.

카페·식당·레저업체 사장님이 네이버 플레이스 URL과 매장 사진을 제출하면,
다계정 블로그 후기 포스팅을 대행 발행해주는 마케팅 대행 플랫폼이다.

### 핵심 사용자 흐름
```
[랜딩] → [네이버 플레이스 무료분석 미끼] → 회원가입/로그인 유도
   ↓
[무료분석 1회] 6각 방사형 그래프 + SEO 진단
   ↓
[상품소개] 베이직 99,000 / 프로 165,000 (실제 게시 사례 갤러리)
   ↓
[신청+결제] 플레이스 URL, 신청자정보, 사진 20장+, (프로)영상 3개+
   ↓  토스페이먼츠 결제
[관리자 검수] 어드민에서 콘텐츠 생성 → 검수 → 수동 트리거
   ↓
[포스팅 실행] 네이버 블로그 / 티스토리 / Blogger 발행
   ↓
[고객 알림] 게시 완료 URL 전달 (마이페이지 + 알림톡/메일)
```

### 상품 구성
| 구분 | 베이직 (99,000원) | 프로 (165,000원) |
|---|---|---|
| 네이버 블로그 후기 | 5개 | 7개 |
| 티스토리 | — | 3개 |
| 네이버 클립 영상 | — | 1개 |
| Blogger | — | 1개 |
| 필수 제출물 | 사진 20장+ | 사진 20장+, 영상 3개+ |

---

## 2. 기술 스택 (절대 변경 금지)

- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind, shadcn/ui
- **Backend**: Next.js Route Handlers + Supabase (Postgres, Auth, Storage), RLS 필수
- **Auth**: 카카오 로그인(OAuth) + 이메일 fallback
- **결제**: 토스페이먼츠 결제위젯
- **배포**: Vercel (Next.js 네이티브, 별도 어댑터 불필요)
- **자동화 워커**: 기존 Python 엔진 → FastAPI 래핑 → 별도 서버(VPS/Cloud Run).
  web에서 직접 Selenium/무거운 Python 실행 금지.

---

## 3. 🚨 절대 규칙 (Compliance — 위반 시 사업 리스크)

이 규칙은 코드 레벨에서 강제되어야 하며, 어떤 이유로도 우회/비활성화 불가.

1. **광고 문구 강제 삽입** — 모든 포스팅 콘텐츠에 공정위 광고표시 문구를
   시스템이 자동 삽입한다. 사용자/관리자가 끌 수 없다.
   - 예시 문구: "본 포스팅은 [매치블로그]를 통해 [업체명]으로부터
     소정의 원고료를 지원받아 작성되었습니다. #광고 #협찬"
   - 위치: 본문 첫 부분(눈에 잘 띄는 곳). 더보기 안에 숨기지 않는다.

2. **결제 전 필수 동의 2종** — '광고표시 동의' + '노출/효과 비보장 동의'
   체크박스. 둘 다 true가 아니면 주문 생성 불가
   (DB constraint + API 검증 이중).

3. **금지업종 필터** — 의료/대출/성인/도박/금융 등 광고 규제 업종은
   신청 시 차단 또는 관리자 검수 플래그.

4. **수동 트리거 원칙** — 모든 자동 포스팅은 '관리자 수동 트리거'로만
   실행한다. 신청 즉시 자동 실행 금지.

5. **개인정보 보호** — 연락처/사업자번호 등 개인정보는 RLS로
   본인 + 관리자만 접근 가능.

6. **환불정책 명시** — "발행 전 100% 환불, 발행 후 환불 불가"를
   약관·결제화면에 명시 (전자상거래법).

---

## 4. 코딩 규칙

- 환경변수 하드코딩 금지. `.env.example`을 항상 최신으로 유지.
- 모든 API 입력은 zod로 검증.
- 결제 금액은 클라이언트 값을 신뢰하지 않고 서버에서 product_type 기준 재계산.
- 커밋 단위로 작동을 확인한다. 추측 구현 금지. 불확실하면 먼저 질문할 것.
- 워커 호출은 `X-Worker-Secret` 헤더로 인증. 시크릿 없으면 401.

---

## 5. 디렉토리 구조

```
matchblog/
├── web/                          # Next.js (Vercel)
│   ├── app/
│   │   ├── (public)/
│   │   │   ├── page.tsx          # 랜딩 (무료분석 미끼)
│   │   │   ├── products/         # 상품소개 + 게시사례 갤러리
│   │   │   └── terms/            # 약관/공정위고지/개인정보/환불정책
│   │   ├── (auth)/
│   │   │   └── login/            # 카카오 OAuth + 이메일
│   │   ├── (user)/
│   │   │   ├── analyze/          # 플레이스 무료분석 (1회)
│   │   │   ├── apply/            # 신청 폼 (업로드)
│   │   │   ├── checkout/         # 토스페이먼츠 결제
│   │   │   └── mypage/           # 신청내역/게시결과
│   │   ├── admin/
│   │   │   ├── orders/           # 주문/고객/결제
│   │   │   ├── review/           # 콘텐츠 검수 + 수동 트리거
│   │   │   └── posts/            # 게시 결과/로그
│   │   └── api/
│   │       ├── auth/kakao/       # 카카오 OAuth 콜백
│   │       ├── analyze/          # 플레이스 분석 프록시
│   │       ├── orders/           # 주문 생성
│   │       ├── payments/         # 토스 승인/웹훅
│   │       └── trigger/          # 워커 호출 (시크릿 인증)
│   └── lib/
│       ├── supabase/
│       ├── kakao/
│       ├── toss/
│       └── compliance/           # 광고문구 강제삽입 모듈
└── worker/                       # Python FastAPI (별도 서버)
    ├── main.py
    ├── engines/
    │   ├── naver_blog.py
    │   ├── tistory.py
    │   ├── blogger.py
    │   └── place_analyzer.py     # Playwright + Gemini Vision
    └── compliance/
        └── ad_disclosure.py      # 발행 직전 문구 검증 (2차 방어)
```

---

## 6. 데이터 모델 (Supabase 핵심 테이블)

```sql
users          (id, kakao_id, email, name, role, created_at)
free_analyses  (id, user_id, place_url, result_json, used_at)
               -- user_id UNIQUE (무료분석 1회 제한 핵심)
orders         (id, user_id, product_type, amount, status,
                place_url, applicant_name, business_no, phone,
                agreed_compliance bool, agreed_no_guarantee bool, created_at)
order_assets   (id, order_id, type[image|video], storage_path)
posts          (id, order_id, channel, status, published_url,
                ad_disclosure_included bool, posted_at)
payments       (id, order_id, toss_payment_key, amount, status, approved_at)
admin_logs     (id, admin_id, action, target_id, created_at)
```

### 무료분석 1회 제한 로직
- 로그인 필수 → `free_analyses.user_id` UNIQUE 제약
- 이미 존재 시 분석 거부 + 유료 신청 안내 모달
- 다계정 우회 방지: 카카오 본인계정 기반 + (선택) 전화번호 인증

---

## 7. 단계별 개발 프롬프트 (STEP 0 → 7 순차 진행)

> 각 STEP을 클로드코드에 **순차 입력**한다. 한 번에 다 넣지 않는다.
> 각 STEP 완료 후 로컬에서 작동을 확인하고 다음으로 넘어간다.

### STEP 1 — 프로젝트 셋업 & DB
```
CLAUDE.md를 읽었다는 전제로 진행한다.
1. Next.js 14 + Tailwind + shadcn/ui를 web/에 초기화. Vercel 배포 전제.
2. Supabase 클라이언트(서버/브라우저 분리) 셋업.
3. 6번 섹션 스키마로 Supabase 마이그레이션 SQL 작성.
   - free_analyses.user_id UNIQUE
   - orders.agreed_compliance, agreed_no_guarantee NOT NULL DEFAULT false
   - 모든 테이블 RLS: 본인 데이터만 SELECT, admin role은 전체
4. .env.example 작성.
완료 후 마이그레이션과 RLS 정책을 보여주고 검토받아라.
```

### STEP 2 — 인증 (카카오 + 이메일)
```
카카오 로그인을 구현한다. 이메일/비밀번호를 fallback으로 병행 (Supabase Auth).
- /api/auth/kakao: 카카오 OAuth authorization code flow
- 콜백에서 users 테이블 upsert (kakao_id 기준)
- 미들웨어로 (user)/admin 라우트 보호
- admin은 role='admin'만 접근, 아니면 403
카카오 개발자콘솔에 등록할 Redirect URI와 필요 동의항목(이메일/닉네임)을 안내해줘.
```

### STEP 3 — 무료분석 (미끼)
```
네이버 플레이스 무료분석. 로그인 필수, 계정당 1회 제한.
- /analyze: 플레이스 URL 또는 스크린샷 업로드
- 워커 place_analyzer를 /api/analyze로 프록시 호출
- 결과는 6각 방사형 그래프(Recharts) + SEO 개선 코멘트
- 1회 후 free_analyses 기록, 재시도 시 유료 안내 모달
- 결과 하단 '지금 신청하기' CTA
서버에서 free_analyses 존재 여부를 먼저 체크해 우회를 막아라.
```

### STEP 4 — 상품소개 & 신청 폼
```
1. /products: 베이직/프로 비교표, 실제 게시 사례 갤러리(이미지/영상),
   "공정위 규정상 광고 문구가 포함됩니다" 안내 배너 상단 고정.
2. /apply: 신청 폼
   - 플레이스 URL (필수, 형식검증)
   - 신청자 정보: 이름, 사업자번호, 연락처
   - 상품 선택 (베이직/프로)
   - 사진 20장 이상 (미만이면 제출 불가)
   - 영상: 프로는 3개 이상 필수
   - Supabase Storage 저장, order_assets 기록
   - 필수 체크박스 2개:
     [ ] 공정위 광고표시 문구 포함에 동의
     [ ] 검색 노출/효과 비보장에 동의
   둘 다 체크해야 결제 버튼 활성화. 서버에서도 재검증.
업로드는 용량/개수 제한과 진행률 UI 포함.
```

### STEP 5 — 토스페이먼츠 결제
```
토스페이먼츠 결제위젯으로 구현.
- /checkout: 주문요약 + 결제위젯
- 금액은 서버에서 product_type으로 재계산 (클라 금액 신뢰 금지)
- /api/payments/confirm: 결제 승인 (paymentKey, orderId, amount 검증)
- 승인 성공 시 orders.status='paid', payments 기록
- 웹훅으로 결제상태 동기화
- 결제 완료 → 마이페이지, 관리자에게 신규 주문 알림
테스트 키 기준으로 작성하고 라이브 전환 체크리스트를 남겨줘.
```

### STEP 6 — 어드민 (검수 + 수동 트리거)
```
관리자 페이지. role='admin'만 접근.
- /admin/orders: 주문/고객/결제 목록, 검색/필터/상태별
- /admin/review/[orderId]:
   - 제출 사진/영상/플레이스 URL 확인
   - 금지업종 플래그 표시
   - '콘텐츠 생성' → 워커 요청 (초안 반환)
   - 초안 미리보기 (광고문구 포함 여부 시각 표시)
   - 광고문구 누락 시 '발행' 버튼 비활성화
   - '발행(수동 트리거)' → /api/trigger로 워커 실행
- /admin/posts: 채널별 결과, published_url, 실패 재시도
- 모든 관리자 행동은 admin_logs 기록
워커 호출은 X-Worker-Secret 헤더로 인증.
```

### STEP 7 — 워커 연동 & 컴플라이언스 2차 방어
```
worker/ FastAPI에 엔드포인트 (기존 엔진 재사용):
- POST /generate : order 데이터로 포스팅 초안 생성
- POST /publish/{channel} : 실제 발행
ad_disclosure.py: 발행 직전 본문에 광고표시 문구 존재 여부 정규식 검증.
없으면 발행 거부 + 에러 반환 (web의 강제삽입을 워커가 재검증).
인증: web의 X-Worker-Secret 헤더 검증, 없으면 401.
```

---

## 8. 컴플라이언스 3중 방어 (사업 생존 핵심)

광고 표시 문구는 한 군데가 뚫려도 다음 단계가 막도록 3중으로 설계한다.

1. **생성 시** — 콘텐츠 생성 단계에서 광고문구 자동 삽입 (compliance 모듈)
2. **검수 시** — 어드민 검수 화면에서 포함 여부를 시각적으로 확인,
   누락 시 발행 버튼 비활성화
3. **발행 직전** — 워커가 정규식으로 최종 검증, 없으면 발행 거부

---

## 9. 라이브 전환 체크리스트

- [ ] 토스페이먼츠 라이브키 교체
- [ ] RLS 정책 전체 점검 (본인/관리자 접근 범위)
- [ ] 관리자 계정 분리 (일반 계정과 권한 격리)
- [ ] 약관 / 개인정보처리방침 / 환불정책 페이지 게시 (전자상거래법 필수)
- [ ] 사업자 정보 푸터 표기 (상호/대표/사업자번호/통신판매업신고 등)
- [ ] 카카오 로그인 검수 (이메일 동의항목 필요 시 별도 신청)
- [ ] 워커 서버 시크릿(`X-Worker-Secret`) 운영 환경 분리

---

## 10. 알아둘 리스크 (의사결정 시 참고)

- **표시광고법**: 대가성 후기를 광고 표시 없이 발행하면 대행사도 제재 대상.
  광고문구 강제 삽입이 1순위 방어선.
- **네이버 정책**: 대가성 다계정 후기 자동 생성은 약관상 어뷰징.
  계정/노출 불이익 가능성을 약관에 명시해 분쟁 차단.
- **노출 비보장**: 검색 상위 노출은 보장할 수 없음을 결제 전 동의로 받는다.
