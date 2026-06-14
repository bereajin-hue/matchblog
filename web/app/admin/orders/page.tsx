import { createAdminClient } from '@/lib/supabase/server'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

const STATUS_BADGE: Record<string, string> = {
  pending:     'bg-yellow-100 text-yellow-800',
  paid:        'bg-blue-100 text-blue-800',
  in_progress: 'bg-purple-100 text-purple-800',
  done:        'bg-green-100 text-green-800',
  cancelled:   'bg-gray-100 text-gray-600',
}
const STATUS_LABEL: Record<string, string> = {
  pending: '결제 대기', paid: '결제 완료', in_progress: '진행 중', done: '완료', cancelled: '취소',
}

interface Props {
  searchParams: Promise<{ status?: string; q?: string }>
}

export default async function AdminOrdersPage({ searchParams }: Props) {
  const { status, q } = await searchParams
  const adminClient = createAdminClient()

  let query = adminClient
    .from('orders')
    .select('id, product_type, amount, status, created_at, applicant_name, phone, place_url')
    .order('created_at', { ascending: false })
    .limit(100)

  if (status) query = query.eq('status', status)
  if (q) query = query.ilike('applicant_name', `%${q}%`)

  const { data: orders } = await query

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">주문 관리</h1>
        <span className="text-sm text-gray-500">총 {orders?.length ?? 0}건</span>
      </div>

      {/* 필터 */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {['', 'pending', 'paid', 'in_progress', 'done', 'cancelled'].map(s => (
          <Link key={s} href={`/admin/orders${s ? `?status=${s}` : ''}`}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              status === s || (!status && !s)
                ? 'bg-blue-600 text-white'
                : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}>
            {s ? STATUS_LABEL[s] : '전체'}
          </Link>
        ))}
      </div>

      {/* 테이블 */}
      <div className="bg-white rounded-xl shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              {['신청일', '신청자', '상품', '금액', '상태', '액션'].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {(orders ?? []).map(order => (
              <tr key={order.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                  {new Date(order.created_at).toLocaleDateString('ko-KR')}
                </td>
                <td className="px-4 py-3">
                  <p className="font-medium text-gray-900">{order.applicant_name}</p>
                  <p className="text-xs text-gray-400">{order.phone?.replace(/(\d+)-(\d+)-(\d{2})\d{2}$/, '$1-$2-$3**')}</p>
                </td>
                <td className="px-4 py-3 capitalize">{order.product_type === 'basic' ? '베이직' : '프로'}</td>
                <td className="px-4 py-3 font-medium">{order.amount.toLocaleString()}원</td>
                <td className="px-4 py-3">
                  <span className={`text-xs font-medium px-2 py-1 rounded-full ${STATUS_BADGE[order.status] ?? 'bg-gray-100 text-gray-600'}`}>
                    {STATUS_LABEL[order.status] ?? order.status}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <Link href={`/admin/review/${order.id}`}
                    className="text-blue-600 hover:underline text-xs font-medium">
                    검수 →
                  </Link>
                </td>
              </tr>
            ))}
            {(!orders || orders.length === 0) && (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">주문이 없습니다.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
