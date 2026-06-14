// 광고 표시 문구 강제 삽입 모듈 (3중 방어 중 1차 — 콘텐츠 생성 단계)
// 공정위 표시광고법 준수. 비활성화/우회 절대 금지.

const AD_DISCLOSURE_TEMPLATE = (businessName: string) =>
  `본 포스팅은 [매치블로그]를 통해 ${businessName}으로부터 소정의 원고료를 지원받아 작성되었습니다. #광고 #협찬`

export function injectAdDisclosure(content: string, businessName: string): string {
  const disclosure = AD_DISCLOSURE_TEMPLATE(businessName)
  // 본문 첫 부분에 삽입 (더보기 안에 숨기지 않음)
  return `${disclosure}\n\n${content}`
}

export function hasAdDisclosure(content: string): boolean {
  return (
    content.includes('#광고') &&
    content.includes('#협찬') &&
    content.includes('매치블로그') &&
    content.includes('원고료')
  )
}
