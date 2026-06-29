import type { Metadata } from "next";
import localFont from "next/font/local";
import Link from "next/link";
import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { KakaoConsultButton, KakaoFloatingButton } from "./components/KakaoConsult";
import "./globals.css";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://matchblog.agentt.kr"),
  title: {
    default: "매치블로그 | 플레이스 블로그 후기 마케팅 대행",
    template: "%s | 매치블로그",
  },
  description:
    "네이버 플레이스 무료 분석부터 다채널 블로그 후기 발행까지. 사장님 매장의 검색 노출을 강화하는 블로그 후기 마케팅 대행 서비스.",
  keywords: [
    "플레이스 블로그 후기",
    "블로그 후기 대행",
    "플레이스 마케팅",
    "매장 블로그 마케팅",
    "네이버 플레이스 후기",
    "블로그 체험단 대행",
    "식당 카페 블로그 홍보",
  ],
  openGraph: {
    type: "website",
    locale: "ko_KR",
    url: "https://matchblog.agentt.kr",
    siteName: "매치블로그",
    title: "사장님, 당신의 플레이스는 안녕하십니까?",
    description: "플레이스 무료 분석 + 블로그 후기 대행. 지금 무료로 진단받으세요.",
  },
  twitter: {
    card: "summary_large_image",
    title: "사장님, 당신의 플레이스는 안녕하십니까?",
    description: "플레이스 무료 분석 + 블로그 후기 대행. 지금 무료로 진단받으세요.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

async function Nav() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <nav className="bg-white border-b border-gray-200 px-4 py-3">
      <div className="max-w-5xl mx-auto flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <span className="flex items-center justify-center w-8 h-8 bg-amber-400 rounded-lg font-black text-[#0d1b2a] text-lg">M</span>
          <span className="font-black text-xl tracking-tight">
            <span className="text-[#0d1b2a]">MATCH</span><span className="text-amber-400">BLOG</span>
          </span>
        </Link>
        <div className="flex items-center gap-4 text-sm">
          {user ? (
            <>
              <Link href="/mypage" className="text-gray-700 hover:text-blue-600">마이페이지</Link>
              <form action="/api/auth/logout" method="POST">
                <button type="submit" className="text-gray-500 hover:text-red-500">로그아웃</button>
              </form>
            </>
          ) : (
            <Link href="/login" className="text-gray-700 hover:text-blue-600">로그인</Link>
          )}
          <KakaoConsultButton />
        </div>
      </div>
    </nav>
  )
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Suspense fallback={<nav className="bg-white border-b border-gray-200 px-4 py-3 h-14" />}>
          <Nav />
        </Suspense>
        {children}
        <KakaoFloatingButton />
      </body>
    </html>
  );
}
