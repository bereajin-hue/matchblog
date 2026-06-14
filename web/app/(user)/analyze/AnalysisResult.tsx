'use client'

import { useRouter } from 'next/navigation'
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
  ResponsiveContainer,
  Tooltip,
} from 'recharts'
import type { AnalysisResultData } from './AnalyzeClient'

interface Props {
  result: AnalysisResultData
}

export default function AnalysisResult({ result }: Props) {
  const router = useRouter()

  const radarData = [
    { subject: '블로그 후기', score: result.scores.blog_count, fullMark: 100 },
    { subject: '사진 품질', score: result.scores.photo_quality, fullMark: 100 },
    { subject: '리뷰 수', score: result.scores.review_count, fullMark: 100 },
    { subject: '키워드', score: result.scores.keyword_density, fullMark: 100 },
    { subject: '답글률', score: result.scores.response_rate, fullMark: 100 },
    { subject: '업데이트', score: result.scores.update_frequency, fullMark: 100 },
  ]

  const scoreColor =
    result.overall_score >= 70
      ? 'text-green-600'
      : result.overall_score >= 40
      ? 'text-amber-500'
      : 'text-red-500'

  return (
    <div className="min-h-screen bg-gray-50 pb-32">
      <div className="max-w-2xl mx-auto py-10 px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-4xl mb-2">✅</div>
          <h1 className="text-3xl font-bold text-gray-900">분석 완료!</h1>
          <p className="text-gray-500 mt-1">{result.place_name}</p>
        </div>

        {/* Overall Score */}
        <div className="bg-white rounded-2xl shadow p-6 text-center mb-6">
          <p className="text-sm font-medium text-gray-500 mb-1">종합 점수</p>
          <p className={`text-7xl font-bold ${scoreColor}`}>{result.overall_score}</p>
          <p className="text-gray-400 text-sm mt-1">/ 100</p>
        </div>

        {/* Radar Chart */}
        <div className="bg-white rounded-2xl shadow p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">SEO 현황 분석</h2>
          <ResponsiveContainer width="100%" height={350}>
            <RadarChart data={radarData}>
              <PolarGrid />
              <PolarAngleAxis dataKey="subject" tick={{ fontSize: 13 }} />
              <Tooltip formatter={(value) => [`${value}점`, '점수']} />
              <Radar
                name="점수"
                dataKey="score"
                stroke="#3b82f6"
                fill="#3b82f6"
                fillOpacity={0.3}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        {/* SEO Comments */}
        <div className="bg-white rounded-2xl shadow p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">SEO 개선 포인트</h2>
          <ul className="space-y-3">
            {result.seo_comments.map((comment, idx) => (
              <li key={idx} className="flex gap-3 p-3 bg-amber-50 border border-amber-100 rounded-lg">
                <span className="text-xl flex-shrink-0">⚠️</span>
                <span className="text-sm text-gray-700">{comment}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Fixed CTA Banner */}
      <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-r from-blue-600 to-blue-800 text-white shadow-2xl">
        <div className="max-w-2xl mx-auto px-4 py-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div>
            <p className="font-semibold text-lg">블로그 후기 포스팅으로 순위를 올려보세요!</p>
            <p className="text-blue-200 text-sm">베이직 99,000원 / 프로 165,000원</p>
          </div>
          <button
            onClick={() => router.push('/apply')}
            className="flex-shrink-0 bg-white text-blue-700 font-bold px-6 py-3 rounded-lg hover:bg-blue-50 transition"
          >
            지금 신청하기 →
          </button>
        </div>
      </div>
    </div>
  )
}
