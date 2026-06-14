import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

const STATUS_LABEL: Record<string, { label: string; color: string }> = {
  pending:   { label: '결제 대기', color: 'bg-yellow-100 text-yellow-800' },
  paid:      { label: '결제 완료', color: 'bg-blue-100 text-blue-800' },
  in_progress: { label: '포스팅 진행 중', color: 'bg-purple-100 text-purple-800' },
  done:      { label: '완료', color: 'bg-green-100 text-green-800' },
  cancelled: { label: '취소', color: 'bg-gray-100 text-gray-600' },
}

export default async function MyPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?next=/mypage')

  const { data: orders } = await supabase
    .from('orders')
    .select('id, product_type, amount, status, created_at, place_url')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  const { data: posts } = await supabase
    .from('posts')
    .select('id, order_id, channel, status, published_url, posted_at')
    .in('order_id', (orders ?? []).map(o => o.id))
    .eq('status', 'published')

  const postsByOrder = (posts ?? []).reduce<Record<string, typeof posts>>((acc, p) => {
    if (!p) return acc
    if (!acc[p.order_id]) acc[p.order_id] = []
    acc[p.order_id]!.push(p)
    return acc
  }, {})

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">마이페이지</h1>

      {(!orders || orders.length === 0) ? (
        <div className="bg-white rounded-xl shadow p-8 text-center">
          <p className="text-gray-500 mb-4">신청 내역이 없습니다.</p>
          <Link href="/apply" className="inline-block bg-blue-600 text-white font-bold px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors">
            지금 신청하기 →
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map(order => {
            const s = STATUS_LABEL[order.status] ?? { label: order.status, color: 'bg-gray-100 text-gray-600' }
            const orderPosts = postsByOrder[order.id] ?? []
            return (
              <div key={order.id} className="bg-white rounded-xl shadow p-6">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-semibold text-gray-900">
                      {order.product_type === 'basic' ? '베이직' : '프로'} — {order.amount.toLocaleString()}원
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {new Date(order.created_at).toLocaleDateString('ko-KR')} 신청
                    </p>
                  </div>
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${s.color}`}>{s.label}</span>
                </div>

                <p className="text-xs text-gray-500 truncate mb-3">{order.place_url}</p>

                {order.status === 'pending' && (
                  <Link href={`/checkout?orderId=${order.id}`}
                    className="inline-block text-sm bg-blue-600 text-white px-4 py-1.5 rounded-lg hover:bg-blue-700 transition-colors">
                    결제하기
                  </Link>
                )}

                {orderPosts.length > 0 && (
                  <div className="mt-3 pt-3 border-t">
                    <p className="text-xs font-medium text-gray-600 mb-2">게시 완료 목록</p>
                    <div className="space-y-1">
                      {orderPosts.map(post => (
                        <div key={post!.id} className="flex items-center gap-2 text-xs">
                          <span className="text-green-500">✓</span>
                          <span className="text-gray-500">{post!.channel}</span>
                          {post!.published_url && (
                            <a href={post!.published_url} target="_blank" rel="noopener noreferrer"
                              className="text-blue-600 hover:underline truncate max-w-[200px]">
                              포스팅 보기 →
                            </a>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
