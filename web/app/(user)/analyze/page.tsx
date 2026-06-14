import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AnalyzeClient from './AnalyzeClient'

export default async function AnalyzePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?next=/analyze')

  const { data: existing } = await supabase
    .from('free_analyses')
    .select('id, result_json, created_at')
    .eq('user_id', user.id)
    .single()

  return <AnalyzeClient alreadyUsed={!!existing} previousResult={existing?.result_json ?? null} />
}
