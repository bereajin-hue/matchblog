import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

interface Props {
  searchParams: Promise<{ paymentKey?: string; orderId?: string; amount?: string; dbOrderId?: string }>
}

export default async function CheckoutSuccessPage({ searchParams }: Props) {
  const { paymentKey, orderId: tossOrderId, amount, dbOrderId } = await searchParams

  // dbOrderId = 실제 DB UUID, tossOrderId = Toss가 반환하는 tossOrderId (uuid-timestamp)
  const realOrderId = dbOrderId ?? tossOrderId
  if (!paymentKey || !tossOrderId || !amount || !realOrderId) redirect('/apply')

  // 실제 접속 도메인 기준으로 절대 URL 구성 (localhost 폴백 방지)
  const hdrs = await headers()
  const host = hdrs.get('host')
  const proto = hdrs.get('x-forwarded-proto') ?? 'https'
  const origin = process.env.NEXT_PUBLIC_APP_URL ?? (host ? `${proto}://${host}` : 'http://localhost:3000')

  // 서버에서 결제 승인 API 호출 (orderId는 DB UUID 사용)
  const res = await fetch(
    `${origin}/api/payments/confirm`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ paymentKey, orderId: realOrderId, tossOrderId, amount: Number(amount) }),
    }
  )

  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    redirect(`/checkout/fail?message=${encodeURIComponent(data.error ?? '결제 승인 실패')}`)
  }

  const supabase = await createClient()
  const { data: order } = await supabase
    .from('orders')
    .select('product_type, amount')
    .eq('id', realOrderId)
    .single()

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
        <div className="text-6xl mb-4">🎉</div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">결제가 완료되었습니다!</h1>
        <p className="text-gray-500 mb-6">
          신청이 접수되었습니다.<br />
          관리자 검수 후 포스팅이 진행됩니다.
        </p>
        <div className="bg-blue-50 rounded-xl p-4 mb-6 text-sm text-left space-y-1">
          <div className="flex justify-between">
            <span className="text-gray-500">주문번호</span>
            <span className="font-mono text-xs">{realOrderId}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">결제 금액</span>
            <span className="font-bold text-blue-600">{(order?.amount ?? Number(amount)).toLocaleString()}원</span>
          </div>
        </div>
        <Link href="/mypage" className="block w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition-colors">
          마이페이지에서 진행 상황 확인 →
        </Link>
      </div>
    </div>
  )
}
