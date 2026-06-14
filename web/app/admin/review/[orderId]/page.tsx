import { createAdminClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import ReviewClient from './ReviewClient'

export const dynamic = 'force-dynamic'

// 금지업종 키워드
const BLOCKED_KEYWORDS = ['의료', '병원', '대출', '성인', '도박', '카지노', '금융', '투자', '주식', '보험']

interface Props {
  params: Promise<{ orderId: string }>
}

export default async function AdminReviewPage({ params }: Props) {
  const { orderId } = await params
  const adminClient = createAdminClient()

  const { data: order } = await adminClient
    .from('orders')
    .select('*')
    .eq('id', orderId)
    .single()

  if (!order) notFound()

  const { data: assets } = await adminClient
    .from('order_assets')
    .select('id, type, storage_path')
    .eq('order_id', orderId)

  const { data: posts } = await adminClient
    .from('posts')
    .select('id, channel, status, published_url, ad_disclosure_included, posted_at')
    .eq('order_id', orderId)

  // 금지업종 플래그 — 플레이스 URL 키워드 체크
  const placeUrlLower = order.place_url?.toLowerCase() ?? ''
  const isBlockedCategory = BLOCKED_KEYWORDS.some(kw => placeUrlLower.includes(kw.toLowerCase()))

  // 이미지 서명 URL 생성
  const imageAssets = (assets ?? []).filter(a => a.type === 'image').slice(0, 10)
  const signedImages = await Promise.all(
    imageAssets.map(async (a) => {
      const { data } = await adminClient.storage
        .from('order-assets')
        .createSignedUrl(a.storage_path, 3600)
      return { ...a, signedUrl: data?.signedUrl ?? null }
    })
  )

  return (
    <ReviewClient
      order={order}
      images={signedImages}
      posts={posts ?? []}
      isBlockedCategory={isBlockedCategory}
    />
  )
}
