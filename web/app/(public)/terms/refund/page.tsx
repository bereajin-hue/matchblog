export default function RefundPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-3xl mx-auto px-4 py-12">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">환불 정책</h1>
        <p className="text-sm text-gray-500 mb-8">
          운영사: 에이전트티 | 서비스: 매치블로그
        </p>
        <p className="text-sm text-gray-600 mb-8 p-4 bg-gray-50 rounded-lg">
          본 정책은 전자상거래 등에서의 소비자보호에 관한 법률(전자상거래법),
          콘텐츠이용자보호지침 등 관계 법령을 준수합니다.
          본 약관에서 정하지 않은 사항 또는 본 약관이 소비자에게 부당하게 불리한
          경우에는 관계 법령 및 소비자에게 유리한 기준을 우선 적용합니다.
        </p>

        <div className="prose prose-sm text-gray-700 space-y-6">

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mt-8 mb-3">1. 서비스의 특성 및 환불 기준</h2>
            <p>
              <strong>서비스 정의</strong>: 매치블로그는 네이버 플레이스 기반 블로그 후기 포스팅
              대행(마케팅 대행) 서비스로, 이용자의 신청에 따라 콘텐츠를 생성하고
              지정 채널에 발행하는 용역을 제공합니다.
            </p>
            <p className="mt-3">
              <strong>환불 기준</strong>: 이용자가 결제 후 <strong>발행 작업 착수 전</strong>에 해지하거나,
              서비스 진행 중 중도 해지를 요청하는 경우, 관계 법령과 본 정책에 따라
              진행 상태를 정산하여 환불합니다.
            </p>

            <h3 className="text-base font-semibold text-gray-900 mt-6 mb-3">⏱️ &quot;작업 착수&quot; 시점의 정의 (환불 판단의 핵심 기준)</h3>
            <p className="mb-3">
              분쟁 방지를 위해 작업 단계를 다음과 같이 정의하며,{' '}
              <strong>개별 포스팅의 &apos;발행 완료&apos; 시점</strong>을 기준으로 환불 가능 여부를 판단합니다.
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse border border-gray-200">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="border border-gray-200 px-3 py-2 text-left">단계</th>
                    <th className="border border-gray-200 px-3 py-2 text-left">상태</th>
                    <th className="border border-gray-200 px-3 py-2 text-left">환불 가능 여부</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-gray-200 px-3 py-2">결제 완료 ~ 콘텐츠 생성 전</td>
                    <td className="border border-gray-200 px-3 py-2">미착수</td>
                    <td className="border border-gray-200 px-3 py-2 font-semibold text-green-700">전액 환불 가능</td>
                  </tr>
                  <tr className="bg-gray-50">
                    <td className="border border-gray-200 px-3 py-2">콘텐츠 생성·검수 중 (미발행)</td>
                    <td className="border border-gray-200 px-3 py-2">준비 중</td>
                    <td className="border border-gray-200 px-3 py-2 font-semibold text-green-700">전액 환불 가능</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-200 px-3 py-2">개별 포스팅 발행 완료</td>
                    <td className="border border-gray-200 px-3 py-2">이행 완료</td>
                    <td className="border border-gray-200 px-3 py-2 text-red-700">해당 건은 환불 불가, 미발행분만 환불</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="mt-3 text-sm text-gray-600 bg-amber-50 border border-amber-200 rounded p-3">
              매치블로그는 관리자 수동 트리거 방식으로 발행되므로, 발행 전까지는
              작업이 외부에 게시되지 않습니다. 따라서 <strong>발행 전 신청 건은 전액 환불</strong>이
              가능합니다.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mt-8 mb-3">2. 유형별 환불 규정</h2>

            <h3 className="text-base font-semibold text-gray-900 mt-4 mb-2">2-1. 서비스 이용 전 (발행 착수 전) — 전액 환불</h3>
            <p>
              결제 후 어떤 포스팅도 발행되지 않은 상태에서 해지를 요청하는 경우,
              <strong>결제 금액 전액을 환불</strong>합니다. (단, 제4항의 결제대행 수수료 정산 가능)
            </p>

            <h3 className="text-base font-semibold text-gray-900 mt-4 mb-2">2-2. 서비스 이용 중 (중도 해지) — 부분 환불</h3>
            <p>
              일부 포스팅이 이미 발행된 상태에서 중도 해지를 요청하는 경우,
              <strong>발행 완료된 포스팅에 해당하는 금액을 공제</strong>한 후 잔액을 환불합니다.
            </p>
            <p className="mt-2"><strong>공제 금액 = 발행 완료 포스팅 수 × 환불 기준 단가</strong></p>

            <h4 className="text-sm font-semibold text-gray-900 mt-4 mb-2">환불 기준 단가 (사전 고지)</h4>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse border border-gray-200">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="border border-gray-200 px-3 py-2 text-left">상품</th>
                    <th className="border border-gray-200 px-3 py-2 text-left">결제 금액</th>
                    <th className="border border-gray-200 px-3 py-2 text-left">총 포스팅 수</th>
                    <th className="border border-gray-200 px-3 py-2 text-left">환불 기준 단가</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-gray-200 px-3 py-2">베이직</td>
                    <td className="border border-gray-200 px-3 py-2">99,000원</td>
                    <td className="border border-gray-200 px-3 py-2">5개</td>
                    <td className="border border-gray-200 px-3 py-2">19,800원/개</td>
                  </tr>
                  <tr className="bg-gray-50">
                    <td className="border border-gray-200 px-3 py-2">프로</td>
                    <td className="border border-gray-200 px-3 py-2">165,000원</td>
                    <td className="border border-gray-200 px-3 py-2">12개*</td>
                    <td className="border border-gray-200 px-3 py-2">13,750원/개</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              *프로: N사 블로그 7 + T사 블로그 3 + 네이버 클립 1 + Blogger 1 = 12개 기준.
              채널별 단가를 별도로 정하는 경우 신청 화면에 명시합니다.
            </p>
            <p className="mt-3 text-sm bg-gray-50 rounded p-3">
              예) 베이직 이용자가 2개 발행 후 해지 →
              99,000 − (2 × 19,800) = <strong>59,400원 환불</strong>
            </p>

            <h3 className="text-base font-semibold text-gray-900 mt-4 mb-2">2-3. 회사 귀책에 의한 환불 — 전액 환불</h3>
            <p>
              회사의 사정(시스템 오류, 서비스 미이행 등)으로 약정한 서비스를
              제공하지 못한 경우, 미이행분에 대해 <strong>전액 환불</strong>합니다.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mt-8 mb-3">3. 청약철회 안내</h2>
            <ul className="list-disc list-inside space-y-2">
              <li>이용자는 결제일로부터 <strong>7일 이내</strong> 청약철회를 요청할 수 있습니다.</li>
              <li>
                다만 전자상거래법 제17조 제2항에 따라, <strong>이용자의 요청으로 발행이
                완료된 개별 포스팅(용역의 제공이 개시된 부분)</strong>에 대해서는
                청약철회가 제한될 수 있습니다. 이 경우에도 <strong>미발행분에 대한
                청약철회 및 환불은 가능</strong>합니다.
              </li>
              <li>
                회사는 청약철회가 제한되는 경우, 그 사실을 결제 화면에서 사전에 고지합니다.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mt-8 mb-3">4. 환불 절차</h2>
            <ol className="list-decimal list-inside space-y-2">
              <li><strong>환불 신청</strong>: 마이페이지 또는 고객센터(help@agentt.kr)로 신청.</li>
              <li><strong>상태 확인</strong>: 담당자가 발행 진행 상태(발행 완료/미발행 건수)를 확인.</li>
              <li>
                <strong>정산 및 반환</strong>: 승인일로부터 <strong>영업일 기준 3일 이내</strong> 결제 수단으로
                환불. (카드사·결제대행사 사정에 따라 3~7일 소요될 수 있음)
              </li>
              <li>
                <strong>결제대행 수수료</strong>: 이용자의 단순 변심에 의한 환불 시, 결제 수단에
                따라 발생한 결제대행(PG) 수수료는 이용자가 부담할 수 있습니다.
                (회사 귀책 또는 청약철회 기간 내 미이행분 환불 시에는 회사 부담)
              </li>
            </ol>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mt-8 mb-3">5. 주의사항 및 면책</h2>

            <h3 className="text-base font-semibold text-gray-900 mt-4 mb-2">5-1. 결과 비보장</h3>
            <p>
              본 서비스는 검색 최적화를 위한 마케팅 대행 서비스로, 네이버 등 포털의
              검색 로직 변경, 플랫폼 정책에 따라 <strong>검색 노출 순위·조회수·매출 효과는
              보장되지 않습니다.</strong> 이는 서비스의 본질적 특성이므로, <strong>노출 순위 미달
              또는 효과 미흡만을 사유로 한 환불은 제한</strong>됩니다. (단, 약정한 포스팅이
              실제 발행되지 않은 경우는 제2항·제3항에 따라 환불합니다.)
            </p>

            <h3 className="text-base font-semibold text-gray-900 mt-4 mb-2">5-2. 플랫폼 정책 리스크</h3>
            <p>
              블로그 플랫폼(네이버·티스토리 등)의 정책에 따라 게시물 노출 제한·삭제
              등이 발생할 수 있으며, 이는 회사가 통제할 수 없는 영역입니다. 발행이
              정상 완료된 건에 대한 플랫폼 측 사후 조치는 환불 사유에 해당하지 않습니다.
            </p>

            <h3 className="text-base font-semibold text-gray-900 mt-4 mb-2">5-3. 공정위 광고 표시</h3>
            <p>
              모든 포스팅에는 공정거래위원회 규정에 따른 광고 표시 문구(#광고 등)가
              포함됩니다. 이용자가 이를 임의로 삭제·변경할 경우, 관계 법령 위반의
              책임은 이용자에게 있으며 서비스 이용이 제한될 수 있습니다.
            </p>

            <h3 className="text-base font-semibold text-gray-900 mt-4 mb-2">5-4. 제출 자료의 책임</h3>
            <p>
              이용자가 제출한 사진·영상·매장 정보의 저작권 및 사용 권한은 이용자에게
              있으며, 제3자 권리 침해로 인한 문제의 책임은 이용자에게 있습니다.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mt-8 mb-3">6. 사업자 정보</h2>
            <div className="bg-gray-50 rounded-lg p-4 text-sm space-y-1">
              <p><strong>상호</strong>: 에이전트티</p>
              <p><strong>대표자</strong>: 진민수</p>
              <p><strong>사업자등록번호</strong>: 126-56-00745</p>
              <p><strong>통신판매업 신고번호</strong>: 제2024-화성동탄-1329호</p>
              <p><strong>주소</strong>: 경기도 화성시 메타폴리스로 42, 9층 901호 (반송동, 디앤씨빌딩)</p>
              <p><strong>고객센터</strong>: help@agentt.kr</p>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mt-8 mb-3">7. 약관 변경</h2>
            <p>
              본 환불 정책은 관계 법령 및 서비스 정책에 따라 변경될 수 있으며,
              변경 시 시행일 및 변경 내용을 서비스 내 공지합니다. 변경 전 결제한
              건에 대해서는 결제 시점의 약관을 적용합니다.
            </p>
            <p className="mt-3 text-sm text-gray-500">시행일: 2025년 1월 1일</p>
          </section>

        </div>
      </div>
    </div>
  )
}
