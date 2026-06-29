import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { rateLimit } from '@/lib/rate-limit'

interface LoginPageProps {
  searchParams: Promise<{ error?: string; next?: string }>
}

const errorMessages: Record<string, string> = {
  invalid_credentials: '이메일 또는 비밀번호가 올바르지 않습니다.',
  kakao_init_failed: '카카오 로그인 초기화에 실패했습니다.',
  callback_failed: '로그인 처리 중 오류가 발생했습니다.',
  rate_limited: '너무 많은 요청입니다. 잠시 후 다시 시도해주세요.',
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { error, next } = await searchParams

  // 심사(토스페이먼츠) 대응용 이메일 로그인 — 심사 통과 후 제거 예정
  async function emailLogin(formData: FormData) {
    'use server'
    const email = formData.get('email') as string
    const password = formData.get('password') as string

    if (!rateLimit(`email:${email}`, 5, 60000)) {
      redirect('/login?error=rate_limited')
    }

    const supabase = await createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) redirect('/login?error=invalid_credentials')
    redirect(next ?? '/')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow">
        <h2 className="text-3xl font-bold text-center text-gray-900">로그인</h2>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {errorMessages[error] ?? '오류가 발생했습니다.'}
          </div>
        )}

        {/* 카카오 로그인 */}
        <a
          href="/api/auth/kakao"
          className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-[#FEE500] hover:bg-[#FDD800] text-[#3C1E1E] font-medium rounded-lg transition-colors"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 3C6.477 3 2 6.477 2 10.8c0 2.8 1.7 5.27 4.3 6.77l-1.1 4.03c-.1.37.3.66.63.46L10.5 19.3c.49.07.99.1 1.5.1 5.523 0 10-3.477 10-7.8S17.523 3 12 3z"/>
          </svg>
          카카오로 로그인
        </a>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500">또는</span>
          </div>
        </div>

        {/* 이메일 로그인 (심사용) */}
        <form action={emailLogin} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              이메일
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
              placeholder="이메일 입력"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              비밀번호
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
              placeholder="비밀번호 입력"
            />
          </div>
          <button
            type="submit"
            className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
          >
            이메일로 로그인
          </button>
        </form>
      </div>
    </div>
  )
}
