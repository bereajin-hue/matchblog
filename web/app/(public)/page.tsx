import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-white overflow-x-hidden">

      {/* ───────────────────────────────────────────
          섹션 1: [기] 후킹 — 짙은 남색 배경
      ─────────────────────────────────────────── */}
      <section className="relative min-h-screen flex flex-col items-center justify-center px-4 text-center bg-[#0d1b2a] overflow-hidden">
        {/* 배경 그라디언트 효과 */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#0d1b2a] via-[#112240] to-[#0d1b2a] pointer-events-none" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-4xl mx-auto">
          {/* 뱃지 */}
          <div className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/30 text-amber-400 text-sm font-medium px-4 py-2 rounded-full mb-8">
            <span className="w-2 h-2 bg-amber-400 rounded-full animate-pulse" />
            N사 플레이스 검색최적화 전문 대행
          </div>

          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight">
            사장님,<br />
            <span className="text-amber-400">당신의 플레이스는</span><br />
            안녕하십니까?
          </h1>

          <p className="text-lg md:text-xl text-slate-300 mb-10 max-w-2xl mx-auto">
            혹시 이런 고민 때문에 밤을 지새우시나요?
          </p>

          {/* 문제점 리스트 */}
          <div className="flex flex-col gap-3 mb-12 max-w-lg mx-auto text-left">
            {[
              '플레이스 검색 1페이지는커녕 3페이지에도 없다.',
              '매일 블로그 글을 써도 방문자 수는 그대로다.',
              '경쟁 업체는 매일 새로운 후기가 쌓이는데, 나는?',
            ].map((text) => (
              <div key={text} className="flex items-start gap-3 bg-white/5 border border-white/10 rounded-xl px-4 py-3">
                <span className="text-red-400 text-lg mt-0.5">✗</span>
                <span className="text-slate-200 text-sm md:text-base">{text}</span>
              </div>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/analyze"
              className="px-8 py-4 bg-amber-400 hover:bg-amber-300 text-[#0d1b2a] font-bold text-lg rounded-xl transition-all shadow-lg shadow-amber-500/20 hover:shadow-amber-500/40"
            >
              무료 플레이스 분석 받기 →
            </Link>
            <Link
              href="/apply"
              className="px-8 py-4 border border-white/20 hover:border-white/40 text-white font-semibold text-lg rounded-xl transition-all hover:bg-white/5"
            >
              바로 신청하기
            </Link>
          </div>

          <p className="mt-8 text-slate-500 text-sm">
            아래로 스크롤하여 해결책을 확인하세요 ↓
          </p>
        </div>
      </section>

      {/* ───────────────────────────────────────────
          섹션 2: [승] 무료 분석 — 흰 배경
      ─────────────────────────────────────────── */}
      <section className="py-24 px-4 bg-white">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-block bg-blue-50 text-blue-600 text-sm font-semibold px-4 py-1.5 rounded-full mb-6">
            AI 즉시 진단
          </div>
          <h2 className="text-3xl md:text-5xl font-bold text-gray-900 mb-4">
            복잡한 분석은 필요 없습니다.
          </h2>
          <p className="text-lg text-gray-500 mb-12">
            스크린샷 한 장이면, AI가 당신의 플레이스 SEO를 즉시 진단합니다.
          </p>

          {/* 분석 입력 카드 */}
          <div className="bg-gradient-to-br from-slate-50 to-blue-50 border border-slate-200 rounded-2xl p-8 shadow-sm">
            <div className="flex flex-col sm:flex-row gap-3 mb-4">
              <div className="flex-1 flex items-center gap-3 bg-white border border-slate-200 rounded-xl px-4 py-3 shadow-sm">
                <span className="text-slate-400">🔍</span>
                <span className="text-slate-400 text-sm">네이버 플레이스 화면을 캡처하여 업로드...</span>
              </div>
              <Link
                href="/analyze"
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all whitespace-nowrap shadow-md"
              >
                무료 분석 시작하기
              </Link>
            </div>
            <p className="text-xs text-slate-400">
              * 본 서비스는 Gemini AI를 기반으로 플레이스 SEO 현황을 분석합니다. 분석 결과는 참고용이며 실제 검색 결과와 다를 수 있습니다.
            </p>
          </div>

        </div>
      </section>

      {/* ───────────────────────────────────────────
          섹션 3: [전] 솔루션 — 짙은 남색
      ─────────────────────────────────────────── */}
      <section className="py-24 px-4 bg-[#0d1b2a]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-block bg-amber-500/10 border border-amber-500/30 text-amber-400 text-sm font-semibold px-4 py-1.5 rounded-full mb-6">
              자동화 대행 솔루션
            </div>
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">
              분석은 끝났습니다.<br />
              <span className="text-amber-400">이제 전문가에게 맡기세요.</span>
            </h2>
            <p className="text-slate-300 text-lg max-w-2xl mx-auto">
              진단된 문제점을 바탕으로, 딱 맞는 블로그 대행 전략을 실행합니다.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: '✍️',
                title: '검색 최적화 포스팅',
                desc: '분석된 키워드를 활용한 전문 블로그 후기 포스팅을 대신 발행합니다. 공정위 광고 표시 문구가 자동 포함됩니다.',
              },
              {
                icon: '📸',
                title: '다채널 콘텐츠 발행',
                desc: '네이버 블로그, 티스토리, Blogger 등 다양한 채널에 동시 발행하여 검색 노출 기회를 넓힙니다.',
              },
              {
                icon: '📊',
                title: '발행 현황 모니터링',
                desc: '마이페이지에서 발행 진행 현황과 게시된 포스팅 URL을 실시간으로 확인할 수 있습니다.',
              },
            ].map((item) => (
              <div key={item.title} className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-all hover:border-amber-500/30 group">
                <div className="text-4xl mb-4">{item.icon}</div>
                <h3 className="text-white font-bold text-lg mb-3 group-hover:text-amber-400 transition-colors">
                  {item.title}
                </h3>
                <p className="text-slate-400 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>

          <div className="mt-12 text-center">
            <p className="text-slate-400 text-base">
              이제 사장님은 본업에만 집중하세요.<br className="md:hidden" />
              <span className="text-amber-400 font-semibold"> 블로그 마케팅은 매치블로그가 대행합니다.</span>
            </p>
          </div>
        </div>
      </section>

      {/* ───────────────────────────────────────────
          섹션 4: [결] Before / After — 흰 배경
      ─────────────────────────────────────────── */}
      <section className="py-24 px-4 bg-gradient-to-b from-white to-slate-50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-block bg-green-50 text-green-600 text-sm font-semibold px-4 py-1.5 rounded-full mb-6">
              실제 이용 사례
            </div>
            <h2 className="text-3xl md:text-5xl font-bold text-gray-900 mb-4">
              매치블로그 도입 전·후
            </h2>
            <p className="text-gray-500 text-lg">
              블로그 후기 대행 서비스 도입 후 달라진 플레이스 현황입니다.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 items-stretch">
            {/* BEFORE */}
            <div className="bg-slate-100 border-2 border-slate-200 rounded-2xl p-8">
              <div className="inline-block bg-slate-200 text-slate-600 text-xs font-bold px-3 py-1 rounded-full mb-6">
                BEFORE
              </div>
              <div className="space-y-4">
                {[
                  '플레이스 블로그 후기 5개 미만',
                  '검색 결과 하위권 노출',
                  '한 달 신규 문의 10건 미만',
                  '경쟁 업체 대비 콘텐츠 부족',
                ].map((text) => (
                  <div key={text} className="flex items-center gap-3">
                    <span className="text-red-400 font-bold text-lg">✗</span>
                    <span className="text-slate-600 text-sm">{text}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* AFTER */}
            <div className="bg-[#0d1b2a] border-2 border-amber-400/50 rounded-2xl p-8 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-amber-400/10 rounded-full blur-2xl" />
              <div className="inline-block bg-amber-400/10 border border-amber-400/30 text-amber-400 text-xs font-bold px-3 py-1 rounded-full mb-6">
                AFTER (매치블로그 도입)
              </div>
              <div className="space-y-4 relative z-10">
                {[
                  '블로그 후기 다수 발행 완료',
                  '검색 상위 노출 기회 확대',
                  '신규 문의 증가 (업체별 상이)',
                  '다채널 콘텐츠로 브랜드 인지도 향상',
                ].map((text) => (
                  <div key={text} className="flex items-center gap-3">
                    <span className="text-amber-400 font-bold text-lg">✓</span>
                    <span className="text-slate-200 text-sm">{text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <p className="text-center text-xs text-slate-400 mt-6">
            * 실제 이용 사례를 바탕으로 구성되었으며, 개별 업체 상황에 따라 결과는 다를 수 있습니다.<br />
            검색 노출 순위 및 매출 효과는 보장되지 않습니다.
          </p>
        </div>
      </section>

      {/* ───────────────────────────────────────────
          섹션 5: 요금제 — 흰 배경
      ─────────────────────────────────────────── */}
      <section className="py-24 px-4 bg-white">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-block bg-blue-50 text-blue-600 text-sm font-semibold px-4 py-1.5 rounded-full mb-6">
              요금제
            </div>
            <h2 className="text-3xl md:text-5xl font-bold text-gray-900 mb-4">
              합리적인 가격, 확실한 대행
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* BASIC */}
            <div className="border-2 border-slate-200 rounded-2xl p-8 hover:shadow-xl transition-all hover:border-slate-300">
              <div className="text-blue-600 font-bold text-sm tracking-widest mb-2">BASIC</div>
              <div className="text-4xl font-bold text-gray-900 mb-1">99,000원</div>
              <p className="text-slate-400 text-sm mb-6">소규모 매장 추천</p>
              <ul className="space-y-3 text-slate-600 text-sm mb-8">
                {[
                  '네이버 블로그 후기 5개',
                  '매장 사진 20장 이상 필요',
                  '공정위 광고 표시 문구 포함',
                  '발행 완료 URL 제공',
                  '발행 전 100% 환불 보장',
                ].map((item) => (
                  <li key={item} className="flex items-center gap-2">
                    <span className="text-blue-500">✓</span> {item}
                  </li>
                ))}
              </ul>
              <Link href="/apply" className="block text-center py-3 border-2 border-blue-600 text-blue-600 rounded-xl font-bold hover:bg-blue-600 hover:text-white transition-all">
                베이직 신청하기
              </Link>
            </div>

            {/* PRO */}
            <div className="border-2 border-amber-400 rounded-2xl p-8 relative hover:shadow-xl transition-all bg-gradient-to-br from-[#0d1b2a] to-[#112240]">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-5 py-1.5 bg-amber-400 text-[#0d1b2a] text-sm font-bold rounded-full shadow">
                추천
              </div>
              <div className="text-amber-400 font-bold text-sm tracking-widest mb-2">PRO</div>
              <div className="text-4xl font-bold text-white mb-1">165,000원</div>
              <p className="text-slate-400 text-sm mb-6">마케팅 강화 필요 업체</p>
              <ul className="space-y-3 text-slate-300 text-sm mb-8">
                {[
                  '네이버 블로그 후기 7개',
                  '티스토리 3개',
                  '네이버 클립 영상 1개',
                  'Blogger 1개',
                  '사진 20장+ 및 영상 3개 필요',
                  'N사 플레이스 무료 컨설팅',
                  '공정위 광고 표시 문구 포함',
                  '발행 전 100% 환불 보장',
                ].map((item) => (
                  <li key={item} className="flex items-center gap-2">
                    <span className="text-amber-400">✓</span> {item}
                  </li>
                ))}
              </ul>
              <Link href="/apply" className="block text-center py-3 bg-amber-400 hover:bg-amber-300 text-[#0d1b2a] rounded-xl font-bold transition-all">
                프로 신청하기
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ───────────────────────────────────────────
          섹션 6: [결 최종] CTA — 짙은 남색
      ─────────────────────────────────────────── */}
      <section className="py-24 px-4 bg-[#0d1b2a] relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#0d1b2a] via-[#112240] to-[#0d1b2a] pointer-events-none" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-6 leading-tight">
            지금 바로 시작하세요.<br />
            <span className="text-amber-400">첫 번째 포스팅은 생각보다 빠릅니다.</span>
          </h2>
          <p className="text-slate-300 text-lg mb-10">
            무료 분석으로 내 플레이스 현황을 먼저 확인해보세요.<br />
            분석 후 서비스 신청 여부를 결정하셔도 됩니다.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            <Link
              href="/analyze"
              className="px-10 py-4 bg-amber-400 hover:bg-amber-300 text-[#0d1b2a] font-bold text-lg rounded-xl transition-all shadow-lg shadow-amber-500/20 hover:shadow-amber-500/40"
            >
              무료 플레이스 분석 시작하기 →
            </Link>
            <Link
              href="/apply"
              className="px-10 py-4 border border-white/20 hover:border-white/40 text-white font-semibold text-lg rounded-xl transition-all hover:bg-white/5"
            >
              바로 신청하기
            </Link>
          </div>

          <div className="flex flex-wrap justify-center gap-6 text-slate-400 text-sm">
            <span>✓ 발행 전 100% 환불</span>
            <span>✓ 공정위 광고 표시 포함</span>
            <span>✓ 발행 완료 URL 제공</span>
          </div>
        </div>
      </section>

      {/* ───────────────────────────────────────────
          푸터
      ─────────────────────────────────────────── */}
      <footer className="py-10 px-4 bg-[#080f1a] border-t border-white/5 text-center text-sm text-slate-500">
        <p className="font-semibold text-slate-400 mb-2">매치블로그 (MatchBlog)</p>
        <p>상호명: 에이전트티 | 대표: 진민수 | 개인정보보호책임자: 진민수</p>
        <p className="mt-1">사업자 등록번호: 126-56-00745 | 통신판매업신고: 제2024-화성동탄-1329호</p>
        <p className="mt-1">관광사업등록번호: 제20244-00003호 | 이메일: help@agentt.kr</p>
        <p className="mt-1">주소: 경기도 화성시 메타폴리스로 42, 9층 901호 (반송동, 디앤씨빌딩)</p>
        <div className="flex justify-center gap-6 mt-4">
          <Link href="/terms/privacy" className="hover:text-slate-300 transition-colors">개인정보처리방침</Link>
          <Link href="/terms/service" className="hover:text-slate-300 transition-colors">이용약관</Link>
          <Link href="/terms/refund" className="hover:text-slate-300 transition-colors">환불정책</Link>
        </div>
        <p className="mt-4 text-xs text-slate-600">
          * 본 서비스는 공정위 규정에 따라 모든 포스팅에 광고 표시 문구가 포함됩니다.<br />
          검색 노출 순위 및 매출 효과는 보장되지 않으며, 개별 업체 상황에 따라 결과는 다를 수 있습니다.
        </p>
      </footer>
    </main>
  )
}
