import Link from 'next/link'

interface Props {
  searchParams: Promise<{ message?: string; orderId?: string }>
}

export default async function CheckoutFailPage({ searchParams }: Props) {
  const { message, orderId } = await searchParams

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
        <div className="text-6xl mb-4">😞</div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">결제에 실패했습니다</h1>
        <p className="text-gray-500 mb-6">
          {message ? decodeURIComponent(message) : '결제 처리 중 오류가 발생했습니다.'}
        </p>
        <div className="space-y-3">
          {orderId && (
            <Link
              href={`/checkout?orderId=${orderId}`}
              className="block w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition-colors"
            >
              다시 결제하기
            </Link>
          )}
          <Link
            href="/apply"
            className="block w-full border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium py-3 rounded-xl transition-colors"
          >
            신청서로 돌아가기
          </Link>
        </div>
      </div>
    </div>
  )
}
