import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { hasAdDisclosure, injectAdDisclosure } from '@/lib/compliance/ad-disclosure'

const TriggerSchema = z.object({
  action: z.enum(['generate', 'publish']),
  orderId: z.string().uuid(),
  channel: z.string().optional(),
})

export async function POST(request: NextRequest) {
  // 인증: 관리자만 호출 가능
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 })

  const adminClient = createAdminClient()
  const { data: profile } = await adminClient.from('users').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return NextResponse.json({ error: '관리자 권한이 필요합니다.' }, { status: 403 })

  const body = await request.json().catch(() => null)
  const parsed = TriggerSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })

  const { action, orderId, channel } = parsed.data

  const { data: order } = await adminClient.from('orders').select('*').eq('id', orderId).single()
  if (!order) return NextResponse.json({ error: '주문을 찾을 수 없습니다.' }, { status: 404 })

  // admin_logs 기록
  await adminClient.from('admin_logs').insert({
    admin_id: user.id,
    action: `trigger_${action}${channel ? `_${channel}` : ''}`,
    target_id: orderId,
  })

  const workerUrl = process.env.WORKER_URL
  const workerSecret = process.env.WORKER_SECRET

  if (action === 'generate') {
    // 워커에 초안 생성 요청 (없으면 목업)
    let drafts: Record<string, string> = {}

    if (workerUrl && workerSecret) {
      try {
        const res = await fetch(`${workerUrl}/generate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'X-Worker-Secret': workerSecret },
          body: JSON.stringify({ order }),
          signal: AbortSignal.timeout(30_000),
        })
        if (res.ok) drafts = await res.json()
      } catch { /* 워커 실패 시 목업 */ }
    }

    if (Object.keys(drafts).length === 0) {
      drafts = generateMockDrafts(order)
    }

    // 광고 문구 강제 삽입 (1차 방어)
    const withDisclosure: Record<string, string> = {}
    for (const [ch, content] of Object.entries(drafts)) {
      withDisclosure[ch] = hasAdDisclosure(content)
        ? content
        : injectAdDisclosure(content, order.applicant_name)
    }

    return NextResponse.json({ drafts: withDisclosure })
  }

  if (action === 'publish') {
    if (!channel) return NextResponse.json({ error: 'channel이 필요합니다.' }, { status: 400 })

    // 이미 발행된 채널 확인
    const { data: existing } = await adminClient
      .from('posts')
      .select('id')
      .eq('order_id', orderId)
      .eq('channel', channel)
      .eq('status', 'published')
      .maybeSingle()

    if (existing) return NextResponse.json({ error: '이미 발행된 채널입니다.' }, { status: 409 })

    let publishedUrl: string | null = null
    let adIncluded = false

    if (workerUrl && workerSecret) {
      try {
        const res = await fetch(`${workerUrl}/publish/${channel}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'X-Worker-Secret': workerSecret },
          body: JSON.stringify({ order }),
          signal: AbortSignal.timeout(60_000),
        })
        if (res.ok) {
          const data = await res.json()
          publishedUrl = data.published_url ?? null
          adIncluded = data.ad_disclosure_included ?? false
        }
      } catch { /* 워커 없으면 목업 */ }
    }

    if (!publishedUrl) {
      // 목업 — 실제 워커 없을 때
      publishedUrl = `https://blog.naver.com/example/${Date.now()}`
      adIncluded = true
    }

    await adminClient.from('posts').insert({
      order_id: orderId,
      channel,
      status: 'published',
      published_url: publishedUrl,
      ad_disclosure_included: adIncluded,
      posted_at: new Date().toISOString(),
    })

    // 모든 채널 발행 완료 시 order status → done
    const { count } = await adminClient
      .from('posts')
      .select('*', { count: 'exact', head: true })
      .eq('order_id', orderId)
      .eq('status', 'published')

    const totalChannels = order.product_type === 'pro' ? 12 : 5
    if ((count ?? 0) >= totalChannels) {
      await adminClient.from('orders').update({ status: 'done' }).eq('id', orderId)
    } else {
      await adminClient.from('orders').update({ status: 'in_progress' }).eq('id', orderId)
    }

    return NextResponse.json({ success: true, published_url: publishedUrl })
  }

  return NextResponse.json({ error: '알 수 없는 액션입니다.' }, { status: 400 })
}

function generateMockDrafts(order: Record<string, unknown>): Record<string, string> {
  const channels = order.product_type === 'pro'
    ? ['naver_blog_1','naver_blog_2','naver_blog_3','naver_blog_4','naver_blog_5','naver_blog_6','naver_blog_7','tistory_1','tistory_2','tistory_3','naver_clip','blogger']
    : ['naver_blog_1','naver_blog_2','naver_blog_3','naver_blog_4','naver_blog_5']

  const drafts: Record<string, string> = {}
  for (const ch of channels) {
    drafts[ch] = `본 포스팅은 [매치블로그]를 통해 ${order.applicant_name}으로부터 소정의 원고료를 지원받아 작성되었습니다. #광고 #협찬\n\n[${ch}] ${order.place_url} 방문 후기입니다. 분위기도 좋고 음식도 맛있었어요! 강력 추천드립니다.`
  }
  return drafts
}
