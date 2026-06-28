import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { rateLimit } from '@/lib/rate-limit'

export async function GET(request: Request) {
  const ip = request.headers.get('x-forwarded-for') ?? 'unknown'
  if (!rateLimit(`kakao:${ip}`, 5, 60000)) {
    return NextResponse.redirect(new URL('/login?error=rate_limited', request.url))
  }

  // 실제 접속한 도메인(origin)을 우선 사용해 localhost 폴백을 방지한다.
  const origin =
    process.env.NEXT_PUBLIC_APP_URL ??
    request.headers.get('origin') ??
    new URL(request.url).origin

  const supabase = await createClient()
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'kakao',
    options: {
      redirectTo: `${origin}/api/auth/callback`,
      scopes: 'profile_nickname account_email',
    },
  })
  if (error || !data.url) {
    return NextResponse.redirect(new URL('/login?error=kakao_init_failed', request.url))
  }
  return NextResponse.redirect(data.url)
}
