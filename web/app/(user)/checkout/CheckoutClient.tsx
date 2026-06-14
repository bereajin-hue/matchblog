'use client'

import { useEffect, useRef, useState } from 'react'

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
  const paymentRef = useRef<HTMLDivElement>(null)
  const agreementRef = useRef<HTMLDivElement>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const widgetsRef = useRef<any>(null)
  const [ready, setReady] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const script = document.createElement('script')
    script.src = 'https://js.tosspayments.com/v2/standard'
    script.async = true
    script.onload = async () => {
      const clientKey = process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY
      if (!clientKey || !window.TossPayments) return

      const toss = window.TossPayments(clientKey)
      const widgets = toss.widgets({ customerKey: `user_${orderId}` })
      widgetsRef.current = widgets

      await widgets.setAmount({ currency: 'KRW', value: amount })

      if (paymentRef.current) {
        await widgets.renderPaymentMethods({
          selector: '#payment-widget',
          variantKey: 'DEFAULT',
        })
      }
      if (agreementRef.current) {
        await widgets.renderAgreement({
          selector: '#agreement-widget',
          variantKey: 'AGREEMENT',
        })
      }
      setReady(true)
    }
    document.head.appendChild(script)
    return () => { document.head.removeChild(script) }
  }, [orderId, amount])

  async function handlePay() {
    if (!widgetsRef.current || loading) return
    setLoading(true)
    try {
      const origin = window.location.origin
      await widgetsRef.current.requestPayment({
        orderId,
        orderName: productName,
        customerName,
        successUrl: `${origin}/checkout/success`,
        failUrl: `${origin}/checkout/fail`,
      })
    } catch (e: unknown) {
      // 사용자가 결제창을 닫은 경우 등
      if (e instanceof Error && e.message !== 'PAY_PROCESS_CANCELED') {
        alert('결제 중 오류가 발생했습니다.')
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
            <span className="font-medium">{productName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">주문번호</span>
            <span className="font-mono text-xs text-gray-600">{orderId}</span>
          </div>
          <div className="flex justify-between pt-2 border-t">
            <span className="font-semibold">결제 금액</span>
            <span className="text-xl font-bold text-blue-600">{amount.toLocaleString()}원</span>
          </div>
        </div>
        <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-xs text-yellow-800">
          ⚠️ 발행 전 100% 환불 가능 · 발행 후 환불 불가<br />
          모든 포스팅에 공정위 광고 표시 문구(#광고 #협찬)가 포함됩니다.
        </div>
      </div>

      {/* 토스페이먼츠 결제 위젯 */}
      <div className="bg-white rounded-xl shadow overflow-hidden mb-6">
        <div id="payment-widget" ref={paymentRef} />
        <div id="agreement-widget" ref={agreementRef} />
      </div>

      {!ready && (
        <div className="text-center py-8 text-gray-400">
          <div className="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full mx-auto mb-2" />
          결제 수단 로딩 중...
        </div>
      )}

      <button
        onClick={handlePay}
        disabled={!ready || loading}
        className="w-full py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-bold rounded-xl text-lg transition-colors"
      >
        {loading ? '처리 중...' : `${amount.toLocaleString()}원 결제하기`}
      </button>
    </div>
  )
}
