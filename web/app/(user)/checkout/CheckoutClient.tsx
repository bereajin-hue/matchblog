'use client'

import { useEffect, useState } from 'react'

interface Props {
  orderId: string
  amount: number
  productName: string
  customerName: string
}

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    TossPayments: any
  }
}

export default function CheckoutClient({ orderId, amount, productName, customerName }: Props) {
  const [ready, setReady] = useState(false)
  const [loading, setLoading] = useState(false)
  const [payError, setPayError] = useState('')

  useEffect(() => {
    const script = document.createElement('script')
    script.src = 'https://js.tosspayments.com/v1/payment'
    script.async = true
    script.onload = () => setReady(true)
    script.onerror = () => setPayError('토스페이먼츠 스크립트 로드에 실패했습니다. 새로고침해주세요.')
    document.head.appendChild(script)
    return () => { document.head.removeChild(script) }
  }, [])

  async function handlePay() {
    if (!ready || loading) return
    setLoading(true)
    setPayError('')

    const clientKey = process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY
    if (!clientKey) {
      setPayError('토스페이먼츠 클라이언트 키가 설정되지 않았습니다.')
      setLoading(false)
      return
    }

    try {
      const toss = window.TossPayments(clientKey)
      const origin = window.location.origin
      // 결제 시도마다 고유한 tossOrderId 생성 (DB orderId는 메타데이터로 전달)
      const tossOrderId = `${orderId}-${Date.now()}`
      await toss.requestPayment('카드', {
        amount,
        orderId: tossOrderId,
        orderName: productName,
        customerName,
        successUrl: `${origin}/checkout/success?dbOrderId=${orderId}`,
        failUrl: `${origin}/checkout/fail?orderId=${orderId}`,
      })
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : (typeof e === 'object' && e !== null && 'message' in e ? String((e as {message: unknown}).message) : String(e))
      if (msg !== 'PAY_PROCESS_CANCELED') {
        setPayError(`결제 오류: ${msg}`)
        console.error('[Toss 결제 오류]', e)
      }
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">결제하기</h1>

      {/* 주문 요약 */}
      <div className="bg-white rounded-xl shadow p-6 mb-6">
        <h2 className="font-semibold text-gray-800 mb-4">주문 요약</h2>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">상품명</span>
            <span className="font-medium text-gray-900">{productName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">주문번호</span>
            <span className="font-mono text-xs text-gray-600">{orderId}</span>
          </div>
          <div className="flex justify-between pt-2 border-t">
            <span className="font-semibold text-gray-900">결제 금액</span>
            <span className="text-xl font-bold text-blue-600">{amount.toLocaleString()}원</span>
          </div>
        </div>
        <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-xs text-yellow-800">
          ⚠️ 발행 전 100% 환불 가능 · 발행 후 환불 불가<br />
          모든 포스팅에 공정위 광고 표시 문구(#광고 #협찬)가 포함됩니다.
        </div>
      </div>

      {payError && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg mb-4">
          {payError}
        </div>
      )}

      <button
        onClick={handlePay}
        disabled={!ready || loading}
        className="w-full py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-bold rounded-xl text-lg transition-colors"
      >
        {loading ? '처리 중...' : !ready ? '로딩 중...' : `${amount.toLocaleString()}원 카드 결제하기`}
      </button>
      <p className="text-xs text-gray-400 text-center mt-2">토스페이먼츠 안전 결제</p>
    </div>
  )
}
