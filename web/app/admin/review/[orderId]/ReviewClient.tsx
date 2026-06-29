'use client'

import { useState } from 'react'

interface Order {
  id: string
  product_type: string
  amount: number
  status: string
  place_url: string
  applicant_name: string
  business_no: string
  phone: string
  agreed_compliance: boolean
  agreed_no_guarantee: boolean
  created_at: string
}

interface Asset {
  id: string
  type: string
  storage_path: string
  signedUrl: string | null
}

interface Post {
  id: string
  channel: string
  status: string
  published_url: string | null
  ad_disclosure_included: boolean
  posted_at: string | null
}

interface Props {
  order: Order
  images: Asset[]
  posts: Post[]
  isBlockedCategory: boolean
}

const CHANNEL_NAMES: Record<string, string> = {
  naver_blog_1: '네이버 블로그 1', naver_blog_2: '네이버 블로그 2',
  naver_blog_3: '네이버 블로그 3', naver_blog_4: '네이버 블로그 4',
  naver_blog_5: '네이버 블로그 5', naver_blog_6: '네이버 블로그 6',
  naver_blog_7: '네이버 블로그 7', tistory_1: '티스토리 1',
  tistory_2: '티스토리 2', tistory_3: '티스토리 3',
  naver_clip: 'N사 클립', blogger: 'Blogger',
}

export default function ReviewClient({ order, images, posts, isBlockedCategory }: Props) {
  const [error, setError] = useState('')
  const [extraNotes, setExtraNotes] = useState('')
  const [jobStatus, setJobStatus] = useState<{id: string, status: string, log: string} | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleStartJob() {
    setSubmitting(true)
    setError('')
    setJobStatus(null)
    try {
      const res = await fetch('/api/admin/posting-job', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: order.id, extraNotes }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? '작업 생성 실패'); return }
      setJobStatus({ id: data.jobId, status: 'pending', log: '' })
      pollJobStatus(data.jobId)
    } catch {
      setError('작업 생성 중 오류가 발생했습니다.')
    } finally {
      setSubmitting(false)
    }
  }

  function pollJobStatus(jobId: string) {
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/admin/posting-job?jobId=${jobId}`)
        const data = await res.json()
        setJobStatus({ id: jobId, status: data.status, log: data.result_log ?? '' })
        if (data.status === 'done' || data.status === 'failed') {
          clearInterval(interval)
        }
      } catch {
        // 폴링 오류는 무시하고 계속 시도
      }
    }, 5000)
  }

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex items-center gap-3">
        <h1 className="text-xl font-bold text-gray-900">주문 검수</h1>
        {isBlockedCategory && (
          <span className="bg-red-100 text-red-700 text-xs font-bold px-3 py-1 rounded-full">
            🚨 금지업종 의심
          </span>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">{error}</div>
      )}

      {/* 주문 정보 */}
      <div className="bg-white rounded-xl shadow p-6 grid grid-cols-2 gap-4 text-sm">
        <div><p className="text-gray-500">신청자</p><p className="font-medium">{order.applicant_name}</p></div>
        <div><p className="text-gray-500">연락처</p><p className="font-medium">{order.phone}</p></div>
        <div><p className="text-gray-500">사업자번호</p><p className="font-medium">{order.business_no.replace(/(\d{3}-\d{2}-\d{3})\d{2}$/, '$1**')}</p></div>
        <div><p className="text-gray-500">상품</p><p className="font-medium">{order.product_type === 'basic' ? '베이직' : '프로'} — {order.amount.toLocaleString()}원</p></div>
        <div className="col-span-2">
          <p className="text-gray-500 mb-1">플레이스 URL</p>
          <a href={order.place_url} target="_blank" rel="noopener noreferrer"
            className="text-blue-600 hover:underline text-xs break-all">{order.place_url}</a>
        </div>
        <div><p className="text-gray-500">광고표시 동의</p>
          <span className={order.agreed_compliance ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
            {order.agreed_compliance ? '✓ 동의' : '✗ 미동의'}
          </span>
        </div>
        <div><p className="text-gray-500">효과 비보장 동의</p>
          <span className={order.agreed_no_guarantee ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
            {order.agreed_no_guarantee ? '✓ 동의' : '✗ 미동의'}
          </span>
        </div>
      </div>

      {/* 업로드 사진 */}
      {images.length > 0 && (
        <div className="bg-white rounded-xl shadow p-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-gray-800">제출 사진 ({images.length}장 미리보기)</h2>
            <a
              href={`/api/admin/download-assets?orderId=${order.id}`}
              className="text-xs bg-gray-900 hover:bg-gray-700 text-white px-3 py-1.5 rounded-lg transition-colors"
            >
              전체 다운로드 (ZIP)
            </a>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {images.map((img, i) => (
              img.signedUrl ? (
                <a key={img.id} href={img.signedUrl} download target="_blank" rel="noopener noreferrer"
                  className="relative group block">
                  <img src={img.signedUrl} alt={`제출 사진 ${i + 1}`}
                    className="w-full h-24 object-cover rounded-lg border group-hover:opacity-75 transition-opacity" />
                  <span className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 text-white text-xs font-bold bg-black/30 rounded-lg transition-opacity">
                    ↓ 다운로드
                  </span>
                </a>
              ) : (
                <div key={img.id} className="w-full h-24 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400 text-xs">
                  로드 실패
                </div>
              )
            ))}
          </div>
        </div>
      )}

      {isBlockedCategory && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
          🚨 금지업종으로 의심됩니다. 자동 발행 전 수동으로 확인하세요.
        </div>
      )}

      {/* smartstoreblog 자동 발행 */}
      <div className="bg-white rounded-xl shadow p-6">
        <h2 className="font-semibold text-gray-800 mb-4">🤖 자동 발행 (smartstoreblog)</h2>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            추가정보 <span className="text-gray-400 font-normal">(선택)</span>
          </label>
          <textarea
            value={extraNotes}
            onChange={e => setExtraNotes(e.target.value)}
            placeholder="예: 주차 가능, 예약 필수, 대표 메뉴는 돈카츠..."
            rows={3}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {jobStatus && (
          <div className={`mb-4 rounded-lg p-4 text-sm ${
            jobStatus.status === 'done' ? 'bg-green-50 border border-green-200' :
            jobStatus.status === 'failed' ? 'bg-red-50 border border-red-200' :
            'bg-blue-50 border border-blue-200'
          }`}>
            <div className="flex items-center gap-2 font-medium mb-1">
              {jobStatus.status === 'pending' && <span className="text-blue-700">⏳ 대기 중 — smartstoreblog가 작업을 집어갈 때까지 대기...</span>}
              {jobStatus.status === 'running' && <span className="text-blue-700">🔄 발행 진행 중...</span>}
              {jobStatus.status === 'done' && <span className="text-green-700">✅ 발행 완료!</span>}
              {jobStatus.status === 'failed' && <span className="text-red-700">❌ 발행 실패</span>}
            </div>
            {jobStatus.log && (
              <pre className="text-xs text-gray-600 whitespace-pre-wrap mt-2 max-h-32 overflow-y-auto">{jobStatus.log}</pre>
            )}
          </div>
        )}

        <button
          onClick={handleStartJob}
          disabled={submitting || jobStatus?.status === 'pending' || jobStatus?.status === 'running'}
          className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-200 disabled:text-gray-400 text-white font-bold rounded-xl transition-colors"
        >
          {submitting ? '작업 생성 중...' :
           jobStatus?.status === 'pending' ? '⏳ smartstoreblog 대기 중...' :
           jobStatus?.status === 'running' ? '🔄 발행 진행 중...' :
           '🚀 자동 발행 시작'}
        </button>
        <p className="text-xs text-gray-400 text-center mt-2">
          smartstoreblog가 실행 중인 PC에서 자동으로 네이버 블로그에 발행됩니다
        </p>
      </div>

      {/* 발행 결과 */}
      {posts.some(p => p.published_url) && (
        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="font-semibold text-gray-800 mb-4">발행 결과</h2>
          <div className="space-y-2">
            {posts.filter(p => p.published_url).map(post => (
              <div key={post.id} className="flex items-center justify-between py-2 border-b last:border-0">
                <p className="text-sm font-medium">{CHANNEL_NAMES[post.channel] ?? post.channel}</p>
                <a href={post.published_url!} target="_blank" rel="noopener noreferrer"
                  className="text-xs text-blue-600 hover:underline break-all max-w-xs text-right">{post.published_url}</a>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
