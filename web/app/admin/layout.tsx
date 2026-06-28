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
        <Link href="/" className="flex items-center gap-2 mr-2">
          <span className="flex items-center justify-center w-7 h-7 bg-amber-400 rounded-lg font-black text-[#0d1b2a] text-base">M</span>
          <span className="font-black text-lg tracking-tight">
            <span className="text-[#0d1b2a]">MATCH</span><span className="text-amber-400">BLOG</span>
          </span>
        </Link>
        <span className="text-xs bg-gray-100 text-gray-500 font-medium px-2 py-0.5 rounded">관리자</span>
        <Link href="/admin/orders" className="text-sm text-gray-600 hover:text-gray-900">주문 관리</Link>
        <Link href="/admin/posts" className="text-sm text-gray-600 hover:text-gray-900">포스팅 관리</Link>
        <Link href="/admin/review" className="text-sm text-gray-600 hover:text-gray-900">검수</Link>
      </nav>
      <main className="p-6">{children}</main>
    </div>
  )
}
