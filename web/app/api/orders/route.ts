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
  agreed_compliance: z.literal('true', { message: '광고표시 동의가 필요합니다.' }),
  agreed_no_guarantee: z.literal('true', { message: '효과 비보장 동의가 필요합니다.' }),
})

export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for') ?? 'unknown'
  if (!rateLimit(`orders:${ip}`, 5, 60_000)) {
    return NextResponse.json({ error: '요청이 너무 많습니다.' }, { status: 429 })
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })

  const formData = await request.formData()

  const parsed = OrderSchema.safeParse({
    place_url: formData.get('place_url'),
    applicant_name: formData.get('applicant_name'),
    business_no: formData.get('business_no'),
    phone: formData.get('phone'),
    product_type: formData.get('product_type'),
    agreed_compliance: formData.get('agreed_compliance'),
    agreed_no_guarantee: formData.get('agreed_no_guarantee'),
  })

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { product_type, agreed_compliance, agreed_no_guarantee, ...fields } = parsed.data
  // 서버에서 금액 재계산 — 클라이언트 금액 절대 신뢰 금지
  const amount = PRODUCT_PRICES[product_type]

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

  // 파일 업로드 (Supabase Storage)
  const imageFiles = formData.getAll('images') as File[]
  const videoFiles = formData.getAll('videos') as File[]

  for (const file of imageFiles) {
    if (file.size === 0 || !file.type.startsWith('image/') || file.size > 10 * 1024 * 1024) continue
    const ext = file.name.split('.').pop() ?? 'jpg'
    const path = `${order.id}/${crypto.randomUUID()}.${ext}`
    const { error } = await adminClient.storage.from('order-assets').upload(path, file, { contentType: file.type })
    if (!error) {
      await adminClient.from('order_assets').insert({ order_id: order.id, type: 'image', storage_path: path })
    }
  }

  for (const file of videoFiles) {
    if (file.size === 0 || !file.type.startsWith('video/') || file.size > 100 * 1024 * 1024) continue
    const ext = file.name.split('.').pop() ?? 'mp4'
    const path = `${order.id}/${crypto.randomUUID()}.${ext}`
    const { error } = await adminClient.storage.from('order-assets').upload(path, file, { contentType: file.type })
    if (!error) {
      await adminClient.from('order_assets').insert({ order_id: order.id, type: 'video', storage_path: path })
    }
  }

  return NextResponse.json({ orderId: order.id })
}
