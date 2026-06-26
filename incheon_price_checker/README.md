# 인천e몰 최저가 AI 검수 툴

인천e몰 파트너시스템 엑셀을 업로드하면 네이버 쇼핑 API + Gemini AI로
각 상품의 **진짜 최저가**를 산출하고 **승인추천 / 보류 / 반려** 판정을 내려줍니다.

---

## 빠른 시작 (EXE)

```
dist/incheon_price_checker.exe   ← Windows에서 더블클릭
dist/incheon_price_checker       ← Linux에서 실행
```

> EXE 옆에 `settings.json`이 생성됩니다 (키 저장 시).

---

## API 키 발급

### 네이버 쇼핑 검색 API
1. <https://developers.naver.com> → 애플리케이션 등록
2. **쇼핑 검색** 권한 추가
3. `Client ID` / `Client Secret` 복사

### Google Gemini API
1. <https://aistudio.google.com/app/apikey>
2. API 키 생성 후 복사
3. 권장 모델: `gemini-2.5-flash` (속도/비용 균형)

---

## 입력 파일 형식

인천e몰 파트너시스템 > 상품관리 > 상품목록 > **엑셀 다운로드**
- 시트명: `MyData`
- 컬럼 수: 21개 (상세보기 ~ 담당MD명)

---

## GUI 사용법

| 단계 | 동작 |
|---|---|
| ① | 네이버 Client ID / Secret 입력 |
| ② | Gemini API Key 입력, 모델 선택 |
| ③ | `찾아보기`로 엑셀 파일 선택 |
| ④ | 정렬·동시처리·배치크기 조정 (기본값 권장) |
| ⑤ | `☑ 키 저장` 체크 시 settings.json에 저장 (공유 PC 주의) |
| ⑥ | **검수 실행** 클릭 → 진행률 실시간 확인 |
| ⑦ | 완료 후 **결과 엑셀 저장** |

---

## 결과 엑셀 설명

원본 21컬럼 뒤에 검증 컬럼 10개 추가:

| 컬럼 | 설명 |
|---|---|
| AI최저가 | 동일 상품 네이버 절대 최저가 |
| AI단위최저가 | 원/g, 원/ml, 원/개 환산 최저 |
| AI판정 | **승인추천** / **보류** / **반려** |
| AI신뢰도 | 0~100% |
| AI근거 | MD가 읽는 한 줄 요약 |
| 재계산_할인율 | 깨진 할인율 교정치 |
| 재계산_마진율 | 깨진 마진율 교정치 |
| 동일후보1~3 | 네이버 동일 상품명·가격·몰 |

셀 색상: 승인추천=초록 / 보류=노랑 / 반려=빨강

---

## 개발 환경 설정 (소스 실행)

```bash
cd incheon_price_checker
pip install -r requirements.txt
python app.py
```

---

## EXE 빌드

```bash
cd incheon_price_checker
pyinstaller build.spec --distpath dist --workpath /tmp/pyi_work --noconfirm
```

- Python 3.12 + tkinter 필요
- 빌드 결과: `dist/incheon_price_checker` (Linux) / `dist/incheon_price_checker.exe` (Windows)
- `prompts/` 폴더는 EXE에 자동 포함됨

---

## 파일 구조

```
incheon_price_checker/
├── app.py            # GUI 진입점
├── pipeline.py       # STEP 1~7 파이프라인
├── config.py         # 임계값·모델명·경로 상수
├── build.spec        # PyInstaller 빌드 설정
├── requirements.txt
├── core/             # 핵심 로직 모듈
│   ├── excel_io.py   # 엑셀 입출력
│   ├── keyword.py    # 검색 키워드 생성
│   ├── naver_api.py  # 네이버 쇼핑 API
│   ├── prefilter.py  # 규칙 사전필터
│   ├── ai_matcher.py # Gemini 동일성 판정
│   ├── normalizer.py # 단위가격 정규화
│   └── judge.py      # 최저가 판정·재계산
├── prompts/
│   └── extract_match.txt  # Gemini 판정 프롬프트
├── utils/
│   ├── unit_parser.py     # 용량·수량 파싱
│   ├── cache.py           # SQLite 캐시
│   └── logger.py          # 감사 로그
└── data/
    ├── input/    # 입력 엑셀 보관 위치
    ├── output/   # 결과 엑셀 + 감사 로그
    └── cache/    # SQLite 캐시 DB
```

---

## 보안 주의사항

- `settings.json`은 API 키를 **평문**으로 저장합니다.
- 공용 PC나 공유 폴더에 두지 마세요.
- `.gitignore`에 `settings.json`이 포함되어 있어 Git에는 커밋되지 않습니다.

---

## 비용 참고 (100건 기준)

| 항목 | 예상 |
|---|---|
| 네이버 쇼핑 API | 무료 (일 25,000회 제한) |
| Gemini 2.5-flash | 약 200~350 LLM 콜 — 수백 원 수준 |
| SQLite 캐시 | 동일 키워드 재실행 시 비용 0 |
