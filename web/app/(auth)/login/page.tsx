interface LoginPageProps {
  searchParams: Promise<{ error?: string }>
}

const errorMessages: Record<string, string> = {
  kakao_init_failed: '카카오 로그인 초기화에 실패했습니다.',
  callback_failed: '로그인 처리 중 오류가 발생했습니다.',
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { error } = await searchParams

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow">
        <h2 className="text-3xl font-bold text-center text-gray-900">로그인</h2>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {errorMessages[error] ?? '오류가 발생했습니다.'}
          </div>
        )}

        <a
          href="/api/auth/kakao"
          className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-[#FEE500] hover:bg-[#FDD800] text-[#3C1E1E] font-medium rounded-lg transition-colors"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 3C6.477 3 2 6.477 2 10.8c0 2.8 1.7 5.27 4.3 6.77l-1.1 4.03c-.1.37.3.66.63.46L10.5 19.3c.49.07.99.1 1.5.1 5.523 0 10-3.477 10-7.8S17.523 3 12 3z"/>
          </svg>
          카카오로 로그인
        </a>

        <p className="text-center text-xs text-gray-400">
          카카오 계정으로 간편하게 시작하세요
        </p>
      </div>
    </div>
  )
}
