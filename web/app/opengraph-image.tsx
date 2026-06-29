import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = '매치블로그 — 플레이스 블로그 후기 마케팅 대행'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#0d1b2a',
        }}
      >
        {/* 앰버 M 박스 */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 180,
            height: 180,
            backgroundColor: '#f5b800',
            borderRadius: 40,
            marginRight: 40,
            fontSize: 130,
            fontWeight: 900,
            color: '#0d1b2a',
          }}
        >
          M
        </div>
        {/* MATCHBLOG 워드마크 */}
        <div style={{ display: 'flex', fontSize: 120, fontWeight: 900, letterSpacing: -2 }}>
          <span style={{ color: '#ffffff' }}>MATCH</span>
          <span style={{ color: '#f5b800' }}>BLOG</span>
        </div>
      </div>
    ),
    { ...size }
  )
}
