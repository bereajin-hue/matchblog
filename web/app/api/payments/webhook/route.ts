import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

// 토스페이먼츠 웹훅 — 결제 상태 동기화
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null)
  if (!body?.eventType || !body?.data) {
    return NextResponse.json({ error: 'invalid payload' }, { status: 400 })
  }

  const adminClient = createAdminClient()
  const { eventType, data } = body

  if (eventType === 'PAYMENT_STATUS_CHANGED') {
    const { paymentKey, orderId, status } = data
    if (status === 'CANCELED' || status === 'PARTIAL_CANCELED') {
      await adminClient.from('orders').update({ status: 'cancelled' }).eq('id', orderId)
      await adminClient
        .from('payments')
        .update({ status: status.toLowerCase() })
        .eq('toss_payment_key', paymentKey)
    }
  }

  return NextResponse.json({ received: true })
}
