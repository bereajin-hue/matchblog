import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { z } from 'zod'

async function getAdminUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data } = await supabase.from('users').select('role').eq('id', user.id).single()
  if (data?.role !== 'admin') return null
  return user
}

// POST: 새 작업 생성
export async function POST(request: NextRequest) {
  const user = await getAdminUser()
  if (!user) return NextResponse.json({ error: '관리자만 접근 가능합니다.' }, { status: 403 })

  const body = await request.json().catch(() => null)
  const parsed = z.object({
    orderId: z.string().uuid(),
    extraNotes: z.string().max(2000).default(''),
  }).safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: '잘못된 요청입니다.' }, { status: 400 })

  const { orderId, extraNotes } = parsed.data
  const adminClient = createAdminClient()

  // 이미 pending/running 중인 job이 있으면 중복 생성 방지
  const { data: existing } = await adminClient
    .from('posting_jobs')
    .select('id, status')
    .eq('order_id', orderId)
    .in('status', ['pending', 'running'])
    .maybeSingle()

  if (existing) {
    return NextResponse.json({ error: '이미 진행 중인 작업이 있습니다.', jobId: existing.id }, { status: 409 })
  }

  const { data: job, error } = await adminClient
    .from('posting_jobs')
    .insert({ order_id: orderId, extra_notes: extraNotes, status: 'pending' })
    .select('id')
    .single()

  if (error || !job) {
    return NextResponse.json({ error: '작업 생성에 실패했습니다.' }, { status: 500 })
  }

  return NextResponse.json({ jobId: job.id })
}

// GET: 작업 상태 조회
export async function GET(request: NextRequest) {
  const user = await getAdminUser()
  if (!user) return NextResponse.json({ error: '관리자만 접근 가능합니다.' }, { status: 403 })

  const jobId = request.nextUrl.searchParams.get('jobId')
  if (!jobId) return NextResponse.json({ error: 'jobId가 필요합니다.' }, { status: 400 })

  const adminClient = createAdminClient()
  const { data: job } = await adminClient
    .from('posting_jobs')
    .select('id, status, result_log, started_at, done_at, last_ping')
    .eq('id', jobId)
    .single()

  if (!job) return NextResponse.json({ error: '작업을 찾을 수 없습니다.' }, { status: 404 })

  return NextResponse.json(job)
}
