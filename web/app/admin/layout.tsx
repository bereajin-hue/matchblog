import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') {
    redirect('/')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b px-6 py-3 flex items-center gap-6">
        <span className="font-bold text-gray-900">매치블로그 관리자</span>
        <Link href="/admin/orders" className="text-sm text-gray-600 hover:text-gray-900">주문 관리</Link>
        <Link href="/admin/posts" className="text-sm text-gray-600 hover:text-gray-900">포스팅 관리</Link>
        <Link href="/admin/review" className="text-sm text-gray-600 hover:text-gray-900">검수</Link>
      </nav>
      <main className="p-6">{children}</main>
    </div>
  )
}
