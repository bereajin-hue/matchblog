import Link from 'next/link'

export const dynamic = 'force-dynamic'

const GALLERY_ITEMS = Array.from({ length: 6 }, (_, i) => ({
  id: i + 1,
  title: `게시 사례 ${i + 1}`,
  channel: i % 3 === 0 ? '네이버 블로그' : i % 3 === 1 ? '티스토리' : 'Blogger',
}))

export default function ProductsPage() {
  return (
    <main className="min-h-screen bg-gray-50">
      {/* 공정위 광고 안내 배너 - 상단 고정 */}
      <div className="bg-yellow-400 text-yellow-900 text-sm font-medium text-center py-2 px-4">
        ⚠️ 공정위 규정상 모든 포스팅에 광고 표시 문구가 포함됩니다.
      </div>

      {/* 히어로 */}
      <section className="bg-white py-16 px-4 text-center border-b">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          네이버 플레이스 블로그 후기 대행
        </h1>
        <p className="text-gray-500 text-lg mb-8 max-w-xl mx-auto">
          카페·식당·레저업체 사장님의 플레이스 순위 상승을 위한<br />
          다계정 블로그 후기 포스팅을 대행합니다.
        </p>
        <Link
          href="/apply"
          className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-bold px-8 py-3 rounded-lg transition-colors text-lg"
        >
          지금 신청하기 →
        </Link>
      </section>

      {/* 상품 비교표 */}
      <section className="max-w-4xl mx-auto px-4 py-14">
        <h2 className="text-2xl font-bold text-center text-gray-900 mb-8">상품 구성</h2>
        <div className="grid md:grid-cols-2 gap-6">
          {/* 베이직 */}
          <div className="bg-white rounded-2xl shadow p-8 border-2 border-gray-200">
            <div className="text-center mb-6">
              <p className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-1">베이직</p>
              <p className="text-4xl font-bold text-gray-900">99,000<span className="text-lg font-normal text-gray-500">원</span></p>
            </div>
            <ul className="space-y-3 text-sm">
              <li className="flex items-center gap-2"><span className="text-green-500">✓</span> 네이버 블로그 후기 <strong>5개</strong></li>
              <li className="flex items-center gap-2 text-gray-400"><span>—</span> 티스토리</li>
              <li className="flex items-center gap-2 text-gray-400"><span>—</span> 네이버 클립 영상</li>
              <li className="flex items-center gap-2 text-gray-400"><span>—</span> Blogger</li>
              <li className="flex items-center gap-2 pt-2 border-t"><span className="text-blue-500">📷</span> 사진 <strong>20장 이상</strong> 제출 필요</li>
            </ul>
            <Link href="/apply?product=basic" className="mt-6 block w-full text-center bg-gray-900 hover:bg-gray-700 text-white font-bold py-3 rounded-lg transition-colors">
              베이직 신청
            </Link>
          </div>

          {/* 프로 */}
          <div className="bg-white rounded-2xl shadow p-8 border-2 border-blue-500 relative">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-500 text-white text-xs font-bold px-4 py-1 rounded-full">추천</div>
            <div className="text-center mb-6">
              <p className="text-sm font-medium text-blue-600 uppercase tracking-wide mb-1">프로</p>
              <p className="text-4xl font-bold text-gray-900">165,000<span className="text-lg font-normal text-gray-500">원</span></p>
            </div>
            <ul className="space-y-3 text-sm">
              <li className="flex items-center gap-2"><span className="text-green-500">✓</span> 네이버 블로그 후기 <strong>7개</strong></li>
              <li className="flex items-center gap-2"><span className="text-green-500">✓</span> 티스토리 <strong>3개</strong></li>
              <li className="flex items-center gap-2"><span className="text-green-500">✓</span> 네이버 클립 영상 <strong>1개</strong></li>
              <li className="flex items-center gap-2"><span className="text-green-500">✓</span> Blogger <strong>1개</strong></li>
              <li className="flex items-center gap-2 pt-2 border-t"><span className="text-blue-500">📷</span> 사진 <strong>20장+</strong> · 영상 <strong>3개+</strong> 필요</li>
            </ul>
            <Link href="/apply?product=pro" className="mt-6 block w-full text-center bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg transition-colors">
              프로 신청
            </Link>
          </div>
        </div>
      </section>

      {/* 게시 사례 갤러리 */}
      <section className="max-w-4xl mx-auto px-4 pb-14">
        <h2 className="text-2xl font-bold text-center text-gray-900 mb-8">실제 게시 사례</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {GALLERY_ITEMS.map(item => (
            <div key={item.id} className="bg-white rounded-xl shadow overflow-hidden">
              <div className="bg-gradient-to-br from-blue-100 to-indigo-100 h-40 flex items-center justify-center text-4xl">
                {item.channel === '네이버 블로그' ? '📝' : item.channel === '티스토리' ? '✏️' : '🌐'}
              </div>
              <div className="p-3">
                <p className="text-xs text-blue-600 font-medium">{item.channel}</p>
                <p className="text-sm text-gray-700 font-medium mt-0.5">{item.title}</p>
              </div>
            </div>
          ))}
        </div>
        <p className="text-center text-xs text-gray-400 mt-4">
          * 광고 표시 문구 포함 · 실제 게시물은 업체명/지역명 등이 포함됩니다.
        </p>
      </section>

      {/* 하단 CTA */}
      <section className="bg-blue-600 text-white py-12 px-4 text-center">
        <h3 className="text-2xl font-bold mb-2">지금 바로 시작하세요</h3>
        <p className="text-blue-100 mb-6">발행 전 100% 환불 보장 · 발행 후 환불 불가</p>
        <Link
          href="/apply"
          className="inline-block bg-white text-blue-600 font-bold px-8 py-3 rounded-lg hover:bg-blue-50 transition-colors"
        >
          신청하기 →
        </Link>
      </section>
    </main>
  )
}
