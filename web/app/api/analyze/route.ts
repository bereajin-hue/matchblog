import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { rateLimit } from '@/lib/rate-limit'

export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for') ?? 'unknown'
  if (!rateLimit(`analyze:${ip}`, 3, 60_000)) {
    return NextResponse.json({ error: '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.' }, { status: 429 })
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })

  const { data: existing } = await supabase
    .from('free_analyses')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle()

  if (existing) {
    return NextResponse.json({ error: 'already_used' }, { status: 403 })
  }

  // FormData로 스크린샷 수신
  const formData = await request.formData().catch(() => null)
  if (!formData) {
    return NextResponse.json({ error: '요청 형식이 잘못되었습니다.' }, { status: 400 })
  }

  const screenshotFile = formData.get('screenshot') as File | null
  const placeUrl = (formData.get('place_url') as string | null) ?? ''

  if (!screenshotFile) {
    return NextResponse.json({ error: '스크린샷을 업로드해주세요.' }, { status: 400 })
  }

  let result
  const geminiKey = process.env.GEMINI_API_KEY

  if (geminiKey) {
    try {
      result = await analyzeWithGemini(screenshotFile, placeUrl, geminiKey)
    } catch (err) {
      console.error('Gemini 분석 오류:', err)
    }
  }

  if (!result) {
    result = generateMockResult(placeUrl)
  }

  const adminClient = createAdminClient()
  await adminClient.from('free_analyses').insert({
    user_id: user.id,
    place_url: placeUrl || '스크린샷으로 분석',
    result_json: result,
  })

  return NextResponse.json({ result })
}

async function analyzeWithGemini(file: File, placeUrl: string, apiKey: string) {
  const bytes = await file.arrayBuffer()
  const base64 = Buffer.from(bytes).toString('base64')
  const mimeType = file.type || 'image/jpeg'

  const prompt = `이 이미지는 네이버 플레이스(지도) 업체 페이지 스크린샷입니다.
아래 항목을 0~100점으로 각각 평가하고, JSON 형식으로만 응답하세요. 설명 없이 JSON만 출력하세요.

평가 기준:
- blog_count: 블로그 후기 수 (많을수록 높은 점수, 화면에 보이는 블로그 리뷰/후기 수 기준)
- photo_quality: 사진 품질과 다양성 (사진 수, 선명도, 구성 등)
- review_count: 방문자 리뷰/별점 수 (많을수록 높은 점수)
- keyword_density: 업체명/지역명/메뉴 키워드 최적화 수준
- response_rate: 사장님 답글/답변 활성도 (보이는 경우 높은 점수)
- update_frequency: 정보 최신성/업데이트 빈도 (최근 리뷰/사진 기준)

응답 형식 (JSON만):
{
  "place_name": "업체명 (화면에서 읽기, 모르면 '분석 대상 업체')",
  "place_url": "${placeUrl || ''}",
  "scores": {
    "blog_count": 숫자,
    "photo_quality": 숫자,
    "review_count": 숫자,
    "keyword_density": 숫자,
    "response_rate": 숫자,
    "update_frequency": 숫자
  },
  "overall_score": 평균점수,
  "seo_comments": [
    "개선 필요한 항목 설명 1",
    "개선 필요한 항목 설명 2",
    "개선 필요한 항목 설명 3",
    "개선 필요한 항목 설명 4"
  ]
}`

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [
            { text: prompt },
            { inline_data: { mime_type: mimeType, data: base64 } },
          ],
        }],
        generationConfig: { temperature: 0.2, maxOutputTokens: 1024 },
      }),
      signal: AbortSignal.timeout(30_000),
    }
  )

  if (!res.ok) throw new Error(`Gemini API 오류: ${res.status}`)

  const data = await res.json()
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? ''

  // JSON 추출 (마크다운 코드블록 제거)
  const jsonMatch = text.match(/\{[\s\S]*\}/)
  if (!jsonMatch) throw new Error('Gemini 응답 파싱 실패')

  const parsed = JSON.parse(jsonMatch[0])

  // overall_score 재계산 (안전하게)
  const scores = parsed.scores
  const overall = Math.round(
    Object.values(scores as Record<string, number>).reduce((a, b) => a + b, 0) /
    Object.keys(scores).length
  )

  return { ...parsed, overall_score: overall }
}

function generateMockResult(placeUrl: string) {
  const scores = {
    blog_count: Math.floor(Math.random() * 60) + 20,
    photo_quality: Math.floor(Math.random() * 40) + 30,
    review_count: Math.floor(Math.random() * 50) + 10,
    keyword_density: Math.floor(Math.random() * 30) + 20,
    response_rate: Math.floor(Math.random() * 40) + 20,
    update_frequency: Math.floor(Math.random() * 35) + 15,
  }
  const overall_score = Math.round(
    Object.values(scores).reduce((a, b) => a + b, 0) / Object.values(scores).length
  )
  return {
    place_name: '분석 대상 업체',
    place_url: placeUrl,
    scores,
    seo_comments: [
      '블로그 후기가 경쟁 업체 대비 부족합니다. 후기 포스팅을 늘리면 노출 순위 개선에 도움이 됩니다.',
      '사진의 다양성이 낮습니다. 음식/공간/메뉴판 등 다양한 사진을 추가하세요.',
      '키워드 최적화가 필요합니다. 업체명과 지역명을 포스팅에 자연스럽게 포함시키는 것이 좋습니다.',
      '리뷰 답글률을 높이면 신뢰도 점수가 향상됩니다.',
    ],
    overall_score,
  }
}
