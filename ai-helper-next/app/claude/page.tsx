import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ExternalLink, Zap, Terminal, Bot, BookOpen } from "lucide-react";

export const metadata = {
  title: "Claude 가이드 - AI Helper",
  description: "Claude Code를 위한 31개 스킬셋, 커맨드, 에이전트 완벽 가이드",
};

export default function ClaudePage() {
  const sections = [
    {
      icon: <Zap className="w-6 h-6" />,
      title: "스킬셋",
      badge: "31개",
      description: "Claude Code를 위한 강력한 AI 자동화 스킬",
      features: [
        "n8n 워크플로우 전문 (6개)",
        "개발 생산성 도구 (6개)",
        "한국어 콘텐츠 생성 (4개)",
        "바이럴 마케팅 (4개)",
        "개발 자동화 (5개)",
      ],
      href: "https://github.com/Giwoong-ryu/my-skills",
      color: "from-purple-500 to-purple-700",
    },
    {
      icon: <Terminal className="w-6 h-6" />,
      title: "커맨드",
      badge: "17개",
      description: "슬래시 커맨드로 빠르게 실행하는 자동화 작업",
      features: [
        "반복 작업 자동화",
        "한 줄 명령어 실행",
        "프로젝트 초기화",
        "문서 자동 생성",
        "커스텀 명령어 지원",
      ],
      href: "#commands",
      color: "from-blue-500 to-blue-700",
    },
    {
      icon: <Bot className="w-6 h-6" />,
      title: "에이전트",
      badge: "60개",
      description: "전문 분야별 AI 페르소나",
      features: [
        "언어별 전문가 (10개 언어)",
        "아키텍처 설계",
        "DevOps 자동화",
        "테스트 전략",
        "문서화 전문가",
      ],
      href: "#agents",
      color: "from-teal-500 to-teal-700",
    },
  ];

  const quickStart = [
    {
      step: "1",
      title: "Claude Code 설치",
      description: "공식 사이트에서 Claude Code를 다운로드하고 설치합니다",
    },
    {
      step: "2",
      title: "스킬 설치",
      description: "필요한 스킬을 my-skills 레포지토리에서 선택하여 설치합니다",
    },
    {
      step: "3",
      title: "프로젝트 시작",
      description: "Claude Code를 실행하고 스킬을 활용하여 작업을 시작합니다",
    },
  ];

  return (
    <main className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                AI Helper
              </Button>
            </Link>
            <div className="h-4 w-px bg-border" />
            <div>
              <h1 className="text-2xl font-bold">Claude</h1>
              <p className="text-sm text-muted-foreground">
                Anthropic의 강력한 AI 어시스턴트
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-500/10 rounded-full mb-6">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center text-lg">
              💜
            </div>
            <span className="text-sm font-medium">Claude Code 완벽 가이드</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Claude로 개발 생산성을
            <br />
            <span className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              10배 향상시키세요
            </span>
          </h2>
          <p className="text-lg text-muted-foreground mb-8">
            31개의 전문 스킬셋, 17개의 커맨드, 60개의 에이전트로
            개발 워크플로우를 자동화하고 효율을 극대화하세요.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <a
              href="https://github.com/Giwoong-ryu/my-skills"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button size="lg" className="gap-2">
                <BookOpen className="w-4 h-4" />
                스킬셋 보기
                <ExternalLink className="w-4 h-4" />
              </Button>
            </a>
            <a
              href="https://docs.claude.com"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button size="lg" variant="outline" className="gap-2">
                공식 문서
                <ExternalLink className="w-4 h-4" />
              </Button>
            </a>
          </div>
        </div>
      </section>

      {/* Main Sections */}
      <section className="container mx-auto px-4 pb-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {sections.map((section) => (
            <Card key={section.title} className="group hover:shadow-lg transition-all">
              <CardHeader>
                <div className="flex items-start justify-between mb-4">
                  <div
                    className={`w-14 h-14 rounded-lg bg-gradient-to-br ${section.color} flex items-center justify-center text-white shadow-lg`}
                  >
                    {section.icon}
                  </div>
                  <Badge>{section.badge}</Badge>
                </div>
                <CardTitle>{section.title}</CardTitle>
                <CardDescription>{section.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 mb-4">
                  {section.features.map((feature, idx) => (
                    <li key={idx} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <a
                  href={section.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
                >
                  자세히 보기
                  <ExternalLink className="w-3 h-3" />
                </a>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Quick Start */}
      <section className="container mx-auto px-4 pb-16">
        <div className="max-w-4xl mx-auto">
          <h3 className="text-3xl font-bold text-center mb-12">빠른 시작</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {quickStart.map((item) => (
              <div key={item.step} className="relative">
                <div className="flex flex-col items-center text-center">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center text-2xl font-bold text-white mb-4 shadow-lg">
                    {item.step}
                  </div>
                  <h4 className="text-xl font-semibold mb-2">{item.title}</h4>
                  <p className="text-muted-foreground">{item.description}</p>
                </div>
                {item.step !== "3" && (
                  <div className="hidden md:block absolute top-8 left-[calc(50%+2rem)] w-[calc(100%-4rem)] h-0.5 bg-gradient-to-r from-purple-500 to-purple-700 opacity-20" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Resources */}
      <section className="container mx-auto px-4 pb-20">
        <div className="max-w-4xl mx-auto">
          <Card className="bg-gradient-to-br from-purple-500/10 to-blue-500/10 border-purple-200">
            <CardHeader>
              <CardTitle>추가 리소스</CardTitle>
              <CardDescription>Claude Code를 더 잘 활용하기 위한 자료들</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <a
                  href="https://github.com/Giwoong-ryu/my-skills"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-4 rounded-lg bg-background hover:bg-accent transition-colors"
                >
                  <BookOpen className="w-5 h-5 text-purple-500" />
                  <div>
                    <div className="font-medium">스킬셋 레포지토리</div>
                    <div className="text-sm text-muted-foreground">31개 스킬 모음</div>
                  </div>
                  <ExternalLink className="w-4 h-4 ml-auto text-muted-foreground" />
                </a>
                <a
                  href="https://docs.claude.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-4 rounded-lg bg-background hover:bg-accent transition-colors"
                >
                  <BookOpen className="w-5 h-5 text-blue-500" />
                  <div>
                    <div className="font-medium">공식 문서</div>
                    <div className="text-sm text-muted-foreground">Claude Code Docs</div>
                  </div>
                  <ExternalLink className="w-4 h-4 ml-auto text-muted-foreground" />
                </a>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-muted/50">
        <div className="container mx-auto px-4 py-8 text-center text-sm text-muted-foreground">
          <p>
            Made with 💜 by{" "}
            <a
              href="https://github.com/Giwoong-ryu"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium hover:text-foreground transition-colors"
            >
              Giwoong Ryu
            </a>
          </p>
        </div>
      </footer>
    </main>
  );
}
