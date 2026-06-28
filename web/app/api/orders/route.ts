import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { rateLimit } from '@/lib/rate-limit'

const PRODUCT_PRICES: Record<string, number> = {
  basic: 99000,
  pro: 165000,
}

const OrderSchema = z.object({
  place_url: z.string().url().refine(
    url => url.includes('naver.me') || url.includes('place.naver.com') || url.includes('map.naver.com'),
    { message: '네이버 플레이스 URL만 지원합니다.' }
  ),
  applicant_name: z.string().min(1).max(50),
  business_no: z.string().regex(/^\d{3}-\d{2}-\d{5}$/, '사업자번호 형식: 000-00-00000'),
  phone: z.string().regex(/^01[0-9]-\d{3,4}-\d{4}$/, '연락처 형식: 010-0000-0000'),
  product_type: z.enum(['basic', 'pro']),
  agreed_compliance: z.literal(true, { message: '광고표시 동의가 필요합니다.' }),
  agreed_no_guarantee: z.literal(true, { message: '효과 비보장 동의가 필요합니다.' }),
  // 파일은 클라이언트가 Storage에 직접 업로드한 뒤 경로만 전달한다 (Vercel 4.5MB 본문 제한 회피)
  assets: z.array(z.object({
    type: z.enum(['image', 'video']),
    storage_path: z.string().min(1).max(300),
  })).max(120),
})

export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for') ?? 'unknown'
  if (!rateLimit(`orders:${ip}`, 5, 60_000)) {
    return NextResponse.json({ error: '요청이 너무 많습니다.' }, { status: 429 })
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: '잘못된 요청입니다.' }, { status: 400 })
  }

  const parsed = OrderSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
  }

  const { product_type, assets, ...fields } = parsed.data
  // 서버에서 금액 재계산 — 클라이언트 금액 절대 신뢰 금지
  const amount = PRODUCT_PRICES[product_type]

  // 사진 최소 20장 / 프로는 영상 최소 3개 — 서버 재검증
  const imageCount = assets.filter(a => a.type === 'image').length
  const videoCount = assets.filter(a => a.type === 'video').length
  if (imageCount < 20) {
    return NextResponse.json({ error: '사진을 20장 이상 업로드해주세요.' }, { status: 400 })
  }
  if (product_type === 'pro' && videoCount < 3) {
    return NextResponse.json({ error: '프로 상품은 영상을 3개 이상 업로드해주세요.' }, { status: 400 })
  }

  // 업로드된 파일이 본인 폴더({uid}/...)에 속하는지 검증 — 위조 경로 차단
  const invalid = assets.some(a => !a.storage_path.startsWith(`${user.id}/`))
  if (invalid) {
    return NextResponse.json({ error: '유효하지 않은 파일 경로입니다.' }, { status: 400 })
  }

  const adminClient = createAdminClient()

  const { data: order, error: orderError } = await adminClient
    .from('orders')
    .insert({
      user_id: user.id,
      product_type,
      amount,
      status: 'pending',
      place_url: fields.place_url,
      applicant_name: fields.applicant_name,
      business_no: fields.business_no,
      phone: fields.phone,
      agreed_compliance: true,
      agreed_no_guarantee: true,
    })
    .select('id')
    .single()

  if (orderError || !order) {
    return NextResponse.json({ error: '주문 생성에 실패했습니다.' }, { status: 500 })
  }

  // 클라이언트가 이미 Storage에 올린 파일 경로를 order_assets에 기록
  const assetRows = assets.map(a => ({
    order_id: order.id,
    type: a.type,
    storage_path: a.storage_path,
  }))
  const { error: assetError } = await adminClient.from('order_assets').insert(assetRows)
  if (assetError) {
    return NextResponse.json({ error: '파일 정보 저장에 실패했습니다.' }, { status: 500 })
  }

  return NextResponse.json({ orderId: order.id })
}
