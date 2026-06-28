import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import JSZip from 'jszip'

export async function GET(request: NextRequest) {
  const orderId = request.nextUrl.searchParams.get('orderId')
  if (!orderId) return NextResponse.json({ error: '주문 ID가 필요합니다.' }, { status: 400 })

  // 세션에서 유저 확인 (쿠키 기반)
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 })

  // admin 권한 확인
  const { data: userRow } = await supabase.from('users').select('role').eq('id', user.id).single()
  if (userRow?.role !== 'admin') return NextResponse.json({ error: '관리자만 접근 가능합니다.' }, { status: 403 })

  const adminClient = createAdminClient()

  const { data: assets } = await adminClient
    .from('order_assets')
    .select('id, type, storage_path')
    .eq('order_id', orderId)

  if (!assets || assets.length === 0) {
    return NextResponse.json({ error: '파일이 없습니다.' }, { status: 404 })
  }

  const zip = new JSZip()

  await Promise.all(
    assets.map(async (asset, i) => {
      const { data, error } = await adminClient.storage
        .from('order-assets')
        .download(asset.storage_path)
      if (error || !data) return

      const ext = asset.storage_path.split('.').pop() ?? 'jpg'
      const prefix = asset.type === 'video' ? 'video' : 'photo'
      const filename = `${prefix}_${String(i + 1).padStart(3, '0')}.${ext}`
      const buffer = await data.arrayBuffer()
      zip.file(filename, buffer)
    })
  )

  const zipBuffer = await zip.generateAsync({ type: 'arraybuffer' })

  return new NextResponse(zipBuffer, {
    headers: {
      'Content-Type': 'application/zip',
      'Content-Disposition': `attachment; filename="order_${orderId.slice(0, 8)}_assets.zip"`,
    },
  })
}
