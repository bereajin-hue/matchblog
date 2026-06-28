import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase/server'
import { PRODUCT_PRICES } from '@/lib/toss/config'

const ConfirmSchema = z.object({
  paymentKey: z.string().min(1),
  orderId: z.string().uuid(),           // DB 주문 UUID
  tossOrderId: z.string().min(1),       // 토스 결제 시 사용한 orderId (uuid-timestamp)
  amount: z.number().int().positive(),
})

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null)
  const parsed = ConfirmSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: '잘못된 요청입니다.' }, { status: 400 })
  }

  const { paymentKey, orderId, tossOrderId, amount } = parsed.data
  const adminClient = createAdminClient()

  // DB에서 주문 조회 및 금액 재검증 (클라이언트 금액 신뢰 금지)
  const { data: order } = await adminClient
    .from('orders')
    .select('id, product_type, status, amount')
    .eq('id', orderId)
    .single()

  if (!order) return NextResponse.json({ error: '주문을 찾을 수 없습니다.' }, { status: 404 })
  if (order.status === 'paid') return NextResponse.json({ error: '이미 결제된 주문입니다.' }, { status: 409 })

  // 서버에서 product_type 기준 금액 재계산
  const expectedAmount = PRODUCT_PRICES[order.product_type]
  if (amount !== expectedAmount) {
    return NextResponse.json({ error: '결제 금액이 일치하지 않습니다.' }, { status: 400 })
  }

  // 토스페이먼츠 결제 승인 API 호출
  const secretKey = process.env.TOSS_SECRET_KEY!
  const encoded = Buffer.from(`${secretKey}:`).toString('base64')

  const tossRes = await fetch('https://api.tosspayments.com/v1/payments/confirm', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${encoded}`,
      'Content-Type': 'application/json',
    },
    // 토스에는 결제 시 사용한 tossOrderId를 보내야 한다 (DB UUID 아님)
    body: JSON.stringify({ paymentKey, orderId: tossOrderId, amount }),
  })

  const tossData = await tossRes.json()

  if (!tossRes.ok) {
    return NextResponse.json(
      { error: tossData.message ?? '결제 승인에 실패했습니다.' },
      { status: tossRes.status }
    )
  }

  // 승인 성공 → DB 업데이트
  await adminClient.from('orders').update({ status: 'paid' }).eq('id', orderId)
  await adminClient.from('payments').insert({
    order_id: orderId,
    toss_payment_key: paymentKey,
    amount,
    status: 'approved',
    approved_at: tossData.approvedAt ?? new Date().toISOString(),
  })

  return NextResponse.json({ success: true })
}
