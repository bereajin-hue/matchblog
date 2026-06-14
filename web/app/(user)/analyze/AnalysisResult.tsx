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

export default function AnalysisResult({ result }: { result: AnalysisResultData }) {
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
      ? 'text-yellow-600'
      : 'text-red-600'

  return (
    <div className="min-h-screen bg-gray-50 pb-32">
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow p-6 mb-5 text-center">
          <div className="text-4xl mb-2">✅</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">분석 완료!</h1>
          <p className="text-gray-500 text-sm truncate">{result.place_url}</p>
          <div className="mt-4">
            <span className="text-gray-600 text-sm">종합 점수</span>
            <div className={`text-6xl font-black ${scoreColor} mt-1`}>{result.overall_score}</div>
            <span className="text-gray-400 text-sm">/ 100</span>
          </div>
        </div>

        {/* Radar Chart */}
        <div className="bg-white rounded-2xl shadow p-6 mb-5">
          <h2 className="text-lg font-bold text-gray-800 mb-4 text-center">SEO 항목별 분석</h2>
          <ResponsiveContainer width="100%" height={350}>
            <RadarChart data={radarData} margin={{ top: 20, right: 30, bottom: 20, left: 30 }}>
              <PolarGrid />
              <PolarAngleAxis dataKey="subject" tick={{ fontSize: 13, fill: '#374151' }} />
              <Radar
                name="점수"
                dataKey="score"
                stroke="#3B82F6"
                fill="#3B82F6"
                fillOpacity={0.3}
                strokeWidth={2}
              />
              <Tooltip
                formatter={(value: number) => [`${value}점`, '점수']}
                contentStyle={{ borderRadius: '8px', border: '1px solid #E5E7EB' }}
              />
            </RadarChart>
          </ResponsiveContainer>

          {/* Score table */}
          <div className="mt-4 grid grid-cols-2 gap-2">
            {radarData.map(item => (
              <div key={item.subject} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2">
                <span className="text-sm text-gray-600">{item.subject}</span>
                <span className="font-semibold text-blue-600 text-sm">{item.score}점</span>
              </div>
            ))}
          </div>
        </div>

        {/* SEO Comments */}
        <div className="bg-white rounded-2xl shadow p-6 mb-5">
          <h2 className="text-lg font-bold text-gray-800 mb-4">SEO 개선 제안</h2>
          <div className="space-y-3">
            {result.seo_comments.map((comment, i) => (
              <div key={i} className="flex gap-3 bg-orange-50 border border-orange-100 rounded-xl p-4">
                <span className="text-xl flex-shrink-0">⚠️</span>
                <p className="text-sm text-gray-700 leading-relaxed">{comment}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Fixed CTA Banner */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-2xl">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-4 flex items-center justify-between gap-4">
            <div>
              <p className="text-white font-bold text-base">블로그 후기 포스팅으로 순위를 올려보세요!</p>
              <p className="text-blue-100 text-sm mt-0.5">베이직 99,000원 / 프로 165,000원</p>
            </div>
            <button
              onClick={() => router.push('/apply')}
              className="bg-white text-blue-600 font-bold px-4 py-2.5 rounded-xl text-sm flex-shrink-0 hover:bg-blue-50 transition-colors whitespace-nowrap"
            >
              지금 신청하기 →
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
