'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import AnalysisResult from './AnalysisResult'

interface AnalysisResultData {
  place_name: string
  place_url: string
  overall_score: number
  scores: {
    blog_count: number
    photo_quality: number
    review_count: number
    keyword_density: number
    response_rate: number
    update_frequency: number
  }
  seo_comments: string[]
}

interface AnalyzeClientProps {
  alreadyUsed: boolean
  previousResult: Record<string, unknown> | null
}

export default function AnalyzeClient({ alreadyUsed, previousResult }: AnalyzeClientProps) {
  const router = useRouter()
  const [placeUrl, setPlaceUrl] = useState('')
  const [urlError, setUrlError] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState<Record<string, unknown> | null>(previousResult)

  if (result) {
    return <AnalysisResult result={result as unknown as AnalysisResultData} />
  }

  if (alreadyUsed) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
          <div className="text-5xl mb-4">📊</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">무료 분석을 이미 사용하셨습니다</h2>
          <p className="text-gray-600 mb-6">
            무료 분석은 계정당 1회만 제공됩니다.<br />
            블로그 포스팅 서비스로 실제 노출 순위를 높여보세요!
          </p>
          <div className="bg-blue-50 rounded-xl p-4 mb-6">
            <p className="text-blue-800 font-semibold text-sm">베이직 99,000원 / 프로 165,000원</p>
            <p className="text-blue-600 text-sm mt-1">네이버 블로그 후기 포스팅 대행</p>
          </div>
          <button
            onClick={() => router.push('/apply')}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-xl transition-colors"
          >
            지금 신청하기 →
          </button>
        </div>
      </div>
    )
  }

  const validateUrl = (url: string) => {
    if (!url) return '플레이스 URL을 입력해주세요.'
    if (!url.includes('naver.me') && !url.includes('place.naver.com') && !url.includes('map.naver.com')) {
      return '네이버 플레이스 URL만 지원합니다. (naver.me, place.naver.com, map.naver.com)'
    }
    return ''
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const validationError = validateUrl(placeUrl)
    if (validationError) {
      setUrlError(validationError)
      return
    }
    setUrlError('')
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ place_url: placeUrl }),
      })
      const data = await res.json()
      if (!res.ok) {
        if (data.error === 'already_used') {
          router.refresh()
        } else {
          setError(data.error ?? '분석 중 오류가 발생했습니다.')
        }
        return
      }
      setResult(data.result)
    } catch {
      setError('네트워크 오류가 발생했습니다. 다시 시도해주세요.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-lg w-full">
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">🔍</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">네이버 플레이스 무료 분석</h1>
          <p className="text-gray-600 text-sm">
            플레이스 URL을 입력하면 SEO 현황을 무료로 분석해드립니다.<br />
            <span className="text-orange-500 font-medium">계정당 1회 무료 제공</span>
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              네이버 플레이스 URL <span className="text-red-500">*</span>
            </label>
            <input
              type="url"
              value={placeUrl}
              onChange={e => { setPlaceUrl(e.target.value); setUrlError('') }}
              placeholder="https://place.naver.com/restaurant/12345678"
              className={`w-full border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
                urlError ? 'border-red-400 bg-red-50' : 'border-gray-300'
              }`}
            />
            {urlError && <p className="text-red-500 text-xs mt-1.5">{urlError}</p>}
            <p className="text-gray-400 text-xs mt-1.5">
              지원 URL: naver.me, place.naver.com, map.naver.com
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-semibold py-3.5 px-6 rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                분석 중... (최대 30초)
              </>
            ) : (
              '분석 시작하기 →'
            )}
          </button>
        </form>

        <div className="mt-6 bg-gray-50 rounded-xl p-4">
          <p className="text-xs text-gray-500 text-center">
            분석 항목: 블로그 후기 수 · 사진 품질 · 리뷰 수 · 키워드 밀도 · 답글률 · 업데이트 주기
          </p>
        </div>
      </div>
    </div>
  )
}
