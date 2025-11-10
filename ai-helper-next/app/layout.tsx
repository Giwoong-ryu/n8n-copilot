import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "AI Helper - Claude, GPT, Gemini, Perplexity 통합 가이드",
  description: "Claude, ChatGPT, Gemini, Perplexity 등 모든 AI 도구의 활용법을 한 곳에서. 스킬셋, 커맨드, 에이전트 가이드 제공.",
  keywords: [
    "Claude",
    "ChatGPT",
    "Gemini",
    "Perplexity",
    "AI 도구",
    "AI 가이드",
    "프롬프트 엔지니어링",
    "자동화",
  ],
  authors: [{ name: "Giwoong Ryu" }],
  openGraph: {
    title: "AI Helper - 모든 AI 도구 통합 가이드",
    description:
      "Claude, ChatGPT, Gemini, Perplexity 등 모든 AI 도구의 활용법을 한 곳에서",
    type: "website",
    locale: "ko_KR",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
