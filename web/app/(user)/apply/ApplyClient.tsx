'use client'

import { useState, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

const PRODUCT_PRICES = { basic: 99000, pro: 165000 }

export default function ApplyClient() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const defaultProduct = searchParams.get('product') === 'pro' ? 'pro' : 'basic'

  const [product, setProduct] = useState<'basic' | 'pro'>(defaultProduct)
  const [images, setImages] = useState<File[]>([])
  const [videos, setVideos] = useState<File[]>([])
  const [agreedCompliance, setAgreedCompliance] = useState(false)
  const [agreedNoGuarantee, setAgreedNoGuarantee] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const imageRef = useRef<HTMLInputElement>(null)
  const videoRef = useRef<HTMLInputElement>(null)

  const imageOk = images.length >= 20
  const videoOk = product === 'basic' || videos.length >= 3
  const canSubmit = imageOk && videoOk && agreedCompliance && agreedNoGuarantee && !loading

  function handleImages(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []).filter(
      f => f.type.startsWith('image/') && f.size <= 10 * 1024 * 1024
    )
    setImages(files.slice(0, 50))
  }

  function handleVideos(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []).filter(
      f => f.type.startsWith('video/') && f.size <= 100 * 1024 * 1024
    )
    setVideos(files.slice(0, 10))
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')

    if (!imageOk) { setError('사진을 20장 이상 선택해주세요.'); return }
    if (!videoOk) { setError('프로 상품은 영상을 3개 이상 선택해주세요.'); return }
    if (!agreedCompliance || !agreedNoGuarantee) { setError('필수 동의 항목을 모두 체크해주세요.'); return }

    const form = e.currentTarget
    const formData = new FormData(form)
    formData.set('product_type', product)
    formData.set('agreed_compliance', 'true')
    formData.set('agreed_no_guarantee', 'true')
    images.forEach(f => formData.append('images', f))
    videos.forEach(f => formData.append('videos', f))

    setLoading(true)
    try {
      const res = await fetch('/api/orders', { method: 'POST', body: formData })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? '신청 중 오류가 발생했습니다.'); return }
      router.push(`/checkout?orderId=${data.orderId}`)
    } catch {
      setError('네트워크 오류가 발생했습니다. 다시 시도해주세요.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-white mb-2">서비스 신청</h1>
      <p className="text-sm text-gray-300 mb-8">모든 포스팅에는 공정위 광고 표시 문구가 포함됩니다.</p>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 상품 선택 */}
        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="font-semibold text-gray-800 mb-4">상품 선택</h2>
          <div className="grid grid-cols-2 gap-3">
            {(['basic', 'pro'] as const).map(p => (
              <button
                key={p}
                type="button"
                onClick={() => setProduct(p)}
                className={`p-4 rounded-lg border-2 text-left transition-colors ${
                  product === p ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <p className="font-bold text-gray-900 capitalize">{p === 'basic' ? '베이직' : '프로'}</p>
                <p className="text-blue-600 font-semibold">{PRODUCT_PRICES[p].toLocaleString()}원</p>
                <p className="text-xs text-gray-500 mt-1">
                  {p === 'basic' ? '네이버 블로그 5개' : '블로그 7개 + 티스토리·Blogger'}
                </p>
              </button>
            ))}
          </div>
        </div>

        {/* 신청자 정보 */}
        <div className="bg-white rounded-xl shadow p-6 space-y-4">
          <h2 className="font-semibold text-gray-800">신청자 정보</h2>
          <Field label="네이버 플레이스 URL" name="place_url" type="url" required
            placeholder="https://map.naver.com/v5/entry/place/..." />
          <Field label="신청자 이름" name="applicant_name" required placeholder="홍길동" />
          <Field label="사업자번호" name="business_no" required placeholder="000-00-00000"
            pattern="\d{3}-\d{2}-\d{5}" title="형식: 000-00-00000" />
          <PhoneField />
        </div>

        {/* 파일 업로드 */}
        <div className="bg-white rounded-xl shadow p-6 space-y-4">
          <h2 className="font-semibold text-gray-800">파일 업로드</h2>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              매장 사진 <span className="text-red-500">*</span>
              <span className="text-gray-400 font-normal"> (최소 20장, 장당 최대 10MB)</span>
            </label>
            <input ref={imageRef} type="file" multiple accept="image/*" onChange={handleImages}
              className="hidden" />
            <button type="button" onClick={() => imageRef.current?.click()}
              className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-sm text-gray-600 hover:border-blue-400 hover:text-blue-600 transition-colors">
              📷 사진 선택하기
            </button>
            <p className={`mt-1 text-sm font-medium ${imageOk ? 'text-green-600' : 'text-red-500'}`}>
              {images.length}장 선택됨 {!imageOk && `(최소 20장 필요, ${20 - images.length}장 더 필요)`}
            </p>
          </div>

          {product === 'pro' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                홍보 영상 <span className="text-red-500">*</span>
                <span className="text-gray-400 font-normal"> (최소 3개, 개당 최대 100MB)</span>
              </label>
              <input ref={videoRef} type="file" multiple accept="video/*" onChange={handleVideos}
                className="hidden" />
              <button type="button" onClick={() => videoRef.current?.click()}
                className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-sm text-gray-600 hover:border-blue-400 hover:text-blue-600 transition-colors">
                🎬 영상 선택하기
              </button>
              <p className={`mt-1 text-sm font-medium ${videoOk ? 'text-green-600' : 'text-red-500'}`}>
                {videos.length}개 선택됨 {!videoOk && `(최소 3개 필요)`}
              </p>
            </div>
          )}
        </div>

        {/* 필수 동의 */}
        <div className="bg-white rounded-xl shadow p-6 space-y-3">
          <h2 className="font-semibold text-gray-800 mb-2">필수 동의</h2>
          <label className="flex items-start gap-3 cursor-pointer">
            <input type="checkbox" checked={agreedCompliance}
              onChange={e => setAgreedCompliance(e.target.checked)}
              className="mt-0.5 w-4 h-4 accent-blue-600" />
            <span className="text-sm text-gray-700">
              공정위 광고표시 문구(#광고 #협찬)가 모든 포스팅에 포함됨에 동의합니다. <span className="text-red-500">(필수)</span>
            </span>
          </label>
          <label className="flex items-start gap-3 cursor-pointer">
            <input type="checkbox" checked={agreedNoGuarantee}
              onChange={e => setAgreedNoGuarantee(e.target.checked)}
              className="mt-0.5 w-4 h-4 accent-blue-600" />
            <span className="text-sm text-gray-700">
              검색 노출 순위 및 마케팅 효과는 보장되지 않음에 동의합니다. <span className="text-red-500">(필수)</span>
            </span>
          </label>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* 제출 */}
        <div className="bg-white rounded-xl shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <span className="text-gray-600">결제 금액</span>
            <span className="text-2xl font-bold text-blue-600">
              {PRODUCT_PRICES[product].toLocaleString()}원
            </span>
          </div>
          <p className="text-xs text-gray-400 mb-4">발행 전 100% 환불 · 발행 후 환불 불가</p>
          <button type="submit" disabled={!canSubmit}
            className="w-full py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-bold rounded-lg transition-colors text-lg">
            {loading ? '처리 중...' : '결제하기'}
          </button>
          {!canSubmit && !loading && (
            <p className="text-xs text-gray-400 text-center mt-2">
              위 조건을 모두 충족해야 결제 버튼이 활성화됩니다.
            </p>
          )}
        </div>
      </form>
    </div>
  )
}

function Field({ label, name, type = 'text', required, placeholder, pattern, title }: {
  label: string; name: string; type?: string; required?: boolean
  placeholder?: string; pattern?: string; title?: string
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input name={name} type={type} required={required} placeholder={placeholder}
        pattern={pattern} title={title}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm text-gray-900 bg-white placeholder:text-gray-400" />
    </div>
  )
}

function PhoneField() {
  const [value, setValue] = useState('')

  function format(raw: string) {
    const digits = raw.replace(/\D/g, '').slice(0, 11)
    if (digits.length <= 3) return digits
    if (digits.length <= 7) return `${digits.slice(0, 3)}-${digits.slice(3)}`
    return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`
  }

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        연락처 <span className="text-red-500">*</span>
      </label>
      <input
        name="phone"
        type="tel"
        required
        value={value}
        onChange={e => setValue(format(e.target.value))}
        placeholder="010-0000-0000"
        pattern="01[0-9]-\d{3,4}-\d{4}"
        title="형식: 010-0000-0000"
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm text-gray-900 bg-white placeholder:text-gray-400"
      />
    </div>
  )
}
