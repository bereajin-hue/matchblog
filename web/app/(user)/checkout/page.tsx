import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import CheckoutClient from './CheckoutClient'
import { PRODUCT_PRICES, PRODUCT_NAMES } from '@/lib/toss/config'

export const dynamic = 'force-dynamic'

interface Props {
  searchParams: Promise<{ orderId?: string }>
}

export default async function CheckoutPage({ searchParams }: Props) {
  const { orderId } = await searchParams
  if (!orderId) redirect('/apply')

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?next=/checkout?orderId=' + orderId)

  const { data: order } = await supabase
    .from('orders')
    .select('id, product_type, status, applicant_name')
    .eq('id', orderId)
    .eq('user_id', user.id)
    .single()

  if (!order) redirect('/apply')
  if (order.status === 'paid') redirect('/mypage')

  // 서버에서 금액 재계산 (product_type 기준)
  const amount = PRODUCT_PRICES[order.product_type]
  const productName = PRODUCT_NAMES[order.product_type]

  return (
    <CheckoutClient
      orderId={order.id}
      amount={amount}
      productName={productName}
      customerName={order.applicant_name}
    />
  )
}
