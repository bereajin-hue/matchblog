'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import AnalysisResult from './AnalysisResult'

interface Props {
  alreadyUsed: boolean
  previousResult: Record<string, unknown> | null
}

export default function AnalyzeClient({ alreadyUsed, previousResult }: Props) {
  const router = useRouter()
  const [placeUrl, setPlaceUrl] = useState('')
  const [urlError, setUrlError] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState<Record<string, unknown> | null>(null)

  if (alreadyUsed && !result) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
          <div className="text-5xl mb-4">📊</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">무료 분석을 이미 사용하셨습니다</h1>
          <p className="text-gray-500 mb-6">
            무료 분석은 계정당 1회만 제공됩니다.<br />
            지금 바로 블로그 포스팅을 신청하고 순위를 올려보세요!
          </p>
          {previousResult && (
            <button
              onClick={() => setResult(previousResult)}
              className="w-full mb-3 py-2 px-4 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
            >
              이전 분석 결과 보기
            </button>
          )}
          <button
            onClick={() => router.push('/apply')}
            className="w-full py-3 px-4 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition"
          >
            지금 신청하기 →
          </button>
        </div>
      </div>
    )
  }

  if (result) {
    return <AnalysisResult result={result as unknown as AnalysisResultData} />
  }

  const validateUrl = (url: string) => {
    if (!url) {
      setUrlError('URL을 입력해주세요.')
      return false
    }
    try {
      const parsed = new URL(url)
      const host = parsed.hostname
      if (!host.includes('naver.me') && !host.includes('place.naver.com') && !host.includes('map.naver.com')) {
        setUrlError('네이버 플레이스 URL만 지원합니다. (naver.me, place.naver.com, map.naver.com)')
        return false
      }
    } catch {
      setUrlError('올바른 URL 형식이 아닙니다.')
      return false
    }
    setUrlError('')
    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateUrl(placeUrl)) return

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
          setError('이미 무료 분석을 사용하셨습니다.')
          router.refresh()
        } else {
          setError(data.error ?? '분석 중 오류가 발생했습니다.')
        }
        return
      }

      setResult(data.result)
    } catch {
      setError('네트워크 오류가 발생했습니다. 잠시 후 다시 시도해주세요.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">네이버 플레이스 무료 분석</h1>
          <p className="text-gray-500">
            플레이스 URL을 입력하면 SEO 현황을 무료로 분석해드립니다.<br />
            <span className="text-amber-600 font-medium">계정당 1회 무료 제공</span>
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                네이버 플레이스 URL <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={placeUrl}
                onChange={e => { setPlaceUrl(e.target.value); setUrlError('') }}
                placeholder="https://place.naver.com/..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={loading}
              />
              {urlError && <p className="mt-1 text-sm text-red-600">{urlError}</p>}
              <p className="mt-1 text-xs text-gray-400">
                naver.me, place.naver.com, map.naver.com 링크를 지원합니다.
              </p>
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  분석 중...
                </>
              ) : (
                '분석 시작하기'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

export interface AnalysisResultData {
  place_name: string
  place_url: string
  scores: {
    blog_count: number
    photo_quality: number
    review_count: number
    keyword_density: number
    response_rate: number
    update_frequency: number
  }
  seo_comments: string[]
  overall_score: number
}
