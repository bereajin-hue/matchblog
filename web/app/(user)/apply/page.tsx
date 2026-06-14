import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Suspense } from 'react'
import ApplyClient from './ApplyClient'

export const dynamic = 'force-dynamic'

export default async function ApplyPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?next=/apply')

  return (
    <Suspense fallback={<div className="p-8 text-center text-gray-500">로딩 중...</div>}>
      <ApplyClient />
    </Suspense>
  )
}
