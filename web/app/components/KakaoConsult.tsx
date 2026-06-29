const CHAT_URL = 'http://pf.kakao.com/_KMqPX/chat'

function KakaoIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M12 3C6.477 3 2 6.477 2 10.8c0 2.8 1.7 5.27 4.3 6.77l-1.1 4.03c-.1.37.3.66.63.46L10.5 19.3c.49.07.99.1 1.5.1 5.523 0 10-3.477 10-7.8S17.523 3 12 3z" />
    </svg>
  )
}

/** 헤더/푸터용 인라인 버튼 */
export function KakaoConsultButton({ className = '' }: { className?: string }) {
  return (
    <a
      href={CHAT_URL}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center gap-1.5 bg-[#FEE500] hover:bg-[#FDD800] text-[#3C1E1E] font-medium rounded-lg px-3 py-1.5 text-sm transition-colors ${className}`}
    >
      <KakaoIcon className="w-4 h-4" />
      카카오톡 상담
    </a>
  )
}

/** 모든 페이지 우측 하단 고정 플로팅 버튼 */
export function KakaoFloatingButton() {
  return (
    <a
      href={CHAT_URL}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="카카오톡 상담하기"
      className="fixed bottom-5 right-5 z-50 flex items-center gap-2 bg-[#FEE500] hover:bg-[#FDD800] text-[#3C1E1E] font-bold rounded-full shadow-lg px-4 py-3 transition-transform hover:scale-105"
    >
      <KakaoIcon className="w-6 h-6" />
      <span className="hidden sm:inline text-sm">카카오톡 상담</span>
    </a>
  )
}
