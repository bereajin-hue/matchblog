import { createAdminClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export default async function AdminPostsPage() {
  const adminClient = createAdminClient()

  const { data: posts } = await adminClient
    .from('posts')
    .select('id, order_id, channel, status, published_url, ad_disclosure_included, posted_at')
    .order('posted_at', { ascending: false })
    .limit(200)

  const CHANNEL_NAMES: Record<string, string> = {
    naver_blog_1: '네이버 블로그 1', naver_blog_2: '네이버 블로그 2',
    naver_blog_3: '네이버 블로그 3', naver_blog_4: '네이버 블로그 4',
    naver_blog_5: '네이버 블로그 5', naver_blog_6: '네이버 블로그 6',
    naver_blog_7: '네이버 블로그 7', tistory_1: '티스토리 1',
    tistory_2: '티스토리 2', tistory_3: '티스토리 3',
    naver_clip: '네이버 클립', blogger: 'Blogger',
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">게시 결과</h1>
        <span className="text-sm text-gray-500">총 {posts?.length ?? 0}건</span>
      </div>

      <div className="bg-white rounded-xl shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              {['발행일', '채널', '주문 ID', '광고문구', '상태', '링크'].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {(posts ?? []).map(post => (
              <tr key={post.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-gray-500 whitespace-nowrap text-xs">
                  {post.posted_at ? new Date(post.posted_at).toLocaleDateString('ko-KR') : '-'}
                </td>
                <td className="px-4 py-3 font-medium">{CHANNEL_NAMES[post.channel] ?? post.channel}</td>
                <td className="px-4 py-3 font-mono text-xs text-gray-400 truncate max-w-[120px]">
                  {post.order_id.slice(0, 8)}...
                </td>
                <td className="px-4 py-3">
                  <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                    post.ad_disclosure_included ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                  }`}>
                    {post.ad_disclosure_included ? '✓ 포함' : '✗ 누락'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                    post.status === 'published' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {post.status === 'published' ? '발행 완료' : post.status}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {post.published_url ? (
                    <a href={post.published_url} target="_blank" rel="noopener noreferrer"
                      className="text-blue-600 hover:underline text-xs">보기 →</a>
                  ) : '-'}
                </td>
              </tr>
            ))}
            {(!posts || posts.length === 0) && (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">게시물이 없습니다.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
