import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { rateLimit } from '@/lib/rate-limit'

const AnalyzeSchema = z.object({
  place_url: z.string().url().refine(
    url => url.includes('naver.me') || url.includes('place.naver.com') || url.includes('map.naver.com'),
    { message: '네이버 플레이스 URL만 지원합니다.' }
  ),
})

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
    .single()

  if (existing) {
    return NextResponse.json({ error: 'already_used' }, { status: 403 })
  }

  const body = await request.json().catch(() => null)
  const parsed = AnalyzeSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
  }

  const { place_url } = parsed.data

  let result
  const workerUrl = process.env.WORKER_URL
  if (workerUrl) {
    try {
      const workerRes = await fetch(`${workerUrl}/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Worker-Secret': process.env.WORKER_SECRET!,
        },
        body: JSON.stringify({ place_url }),
        signal: AbortSignal.timeout(30_000),
      })
      if (workerRes.ok) {
        result = await workerRes.json()
      }
    } catch {
      // fallback to mock
    }
  }

  if (!result) {
    result = generateMockResult(place_url)
  }

  const adminClient = createAdminClient()
  await adminClient.from('free_analyses').insert({
    user_id: user.id,
    place_url,
    result_json: result,
  })

  return NextResponse.json({ result })
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
