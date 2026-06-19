import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-white">
      {/* 히어로 섹션 */}
      <section className="flex flex-col items-center justify-center min-h-screen px-4 text-center bg-gradient-to-b from-blue-50 to-white">
        <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
          네이버 플레이스 블로그 후기<br />
          <span className="text-blue-600">자동 대행 서비스</span>
        </h1>
        <p className="text-xl text-gray-600 mb-8 max-w-2xl">
          카페·식당·레저업체 사장님께 딱 맞는 블로그 마케팅.<br />
          사진만 제출하면 전문 후기 포스팅을 대신 발행해드립니다.
        </p>
        <div className="flex flex-col sm:flex-row gap-4">
          <Link
            href="/analyze"
            className="px-8 py-4 bg-blue-600 text-white rounded-lg font-semibold text-lg hover:bg-blue-700 transition"
          >
            무료 플레이스 분석 받기
          </Link>
          <Link
            href="/products"
            className="px-8 py-4 border-2 border-blue-600 text-blue-600 rounded-lg font-semibold text-lg hover:bg-blue-50 transition"
          >
            서비스 소개 보기
          </Link>
        </div>
        <p className="mt-6 text-sm text-gray-400">
          * 본 서비스는 공정위 규정에 따라 광고 표시 문구가 포함됩니다.
        </p>
      </section>

      {/* 상품 간단 소개 */}
      <section className="py-20 px-4 max-w-4xl mx-auto">
        <h2 className="text-3xl font-bold text-center mb-12">서비스 구성</h2>
        <div className="grid md:grid-cols-2 gap-8">
          <div className="p-8 border rounded-xl hover:shadow-lg transition">
            <div className="text-blue-600 font-bold text-sm mb-2">BASIC</div>
            <div className="text-3xl font-bold mb-4">99,000원</div>
            <ul className="space-y-2 text-gray-600">
              <li>✓ 네이버 블로그 후기 5개</li>
              <li>✓ 매장 사진 20장 이상 필요</li>
            </ul>
            <Link href="/apply" className="mt-6 block text-center py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition">
              신청하기
            </Link>
          </div>
          <div className="p-8 border-2 border-blue-600 rounded-xl hover:shadow-lg transition relative">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-blue-600 text-white text-sm font-bold rounded-full">추천</div>
            <div className="text-blue-600 font-bold text-sm mb-2">PRO</div>
            <div className="text-3xl font-bold mb-4">165,000원</div>
            <ul className="space-y-2 text-gray-600">
              <li>✓ 네이버 블로그 후기 7개</li>
              <li>✓ 티스토리 3개</li>
              <li>✓ 네이버 클립 영상 1개</li>
              <li>✓ Blogger 1개</li>
              <li>✓ 사진 20장+ 및 영상 3개 필요</li>
            </ul>
            <Link href="/apply" className="mt-6 block text-center py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition">
              신청하기
            </Link>
          </div>
        </div>
      </section>

      <footer className="py-8 px-4 border-t text-center text-sm text-gray-400">
        <p>상호명: 에이전트티 | 대표: 진민수 | 개인정보보호책임자: 진민수</p>
        <p className="mt-1">사업자 등록번호: 126-56-00745 | 통신판매업신고: 제2024-화성동탄-1329호</p>
        <p className="mt-1">관광사업등록번호: 제20244-00003호 | 이메일: help@agentt.kr</p>
        <p className="mt-1">주소: 경기도 화성시 메타폴리스로 42, 9층 901호 (반송동, 디앤씨빌딩)</p>
        <div className="flex justify-center gap-4 mt-3">
          <Link href="/terms/privacy" className="hover:underline">개인정보처리방침</Link>
          <Link href="/terms/service" className="hover:underline">이용약관</Link>
          <Link href="/terms/refund" className="hover:underline">환불정책</Link>
        </div>
      </footer>
    </main>
  )
}
