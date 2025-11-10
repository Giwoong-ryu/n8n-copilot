import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Zap, Clock, Sparkles } from "lucide-react";

export default function Home() {
  const tools = [
    {
      name: "Claude",
      href: "/claude",
      description: "Anthropic의 강력한 AI 어시스턴트",
      status: "완료",
      statusVariant: "default" as const,
      gradient: "from-purple-500 to-purple-700",
      features: ["31개 스킬 가이드", "커맨드 & 에이전트", "토큰 최적화"],
      icon: "💜",
    },
    {
      name: "ChatGPT",
      href: "/chatgpt",
      description: "OpenAI의 범용 AI 챗봇",
      status: "준비중",
      statusVariant: "secondary" as const,
      gradient: "from-green-500 to-green-700",
      features: ["프롬프트 가이드", "플러그인 활용", "API 연동"],
      icon: "🟢",
    },
    {
      name: "Gemini",
      href: "/gemini",
      description: "Google의 멀티모달 AI",
      status: "준비중",
      statusVariant: "secondary" as const,
      gradient: "from-blue-500 to-blue-700",
      features: ["멀티모달 활용", "Google 통합", "고급 검색"],
      icon: "🔵",
    },
    {
      name: "Perplexity",
      href: "/perplexity",
      description: "AI 기반 검색 엔진",
      status: "준비중",
      statusVariant: "secondary" as const,
      gradient: "from-teal-500 to-teal-700",
      features: ["실시간 검색", "소스 인용", "리서치 최적화"],
      icon: "🔍",
    },
  ];

  return (
    <main className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                AI Helper
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                모든 AI 도구를 한 곳에서
              </p>
            </div>
            <a
              href="https://github.com/Giwoong-ryu"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              GitHub
            </a>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full mb-6">
          <Sparkles className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium">통합 AI 활용 가이드</span>
        </div>
        <h2 className="text-4xl md:text-5xl font-bold mb-6">
          모든 AI 도구의 활용법을
          <br />
          <span className="bg-gradient-to-r from-purple-600 via-blue-600 to-teal-600 bg-clip-text text-transparent">
            한 곳에서 배우세요
          </span>
        </h2>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
          Claude, ChatGPT, Gemini, Perplexity 등 주요 AI 도구들의 스킬, 커맨드,
          에이전트 활용법을 체계적으로 정리했습니다.
        </p>

        <div className="flex flex-wrap justify-center gap-4 mb-12">
          <div className="flex items-center gap-2 px-4 py-2 bg-card rounded-lg border">
            <Zap className="w-4 h-4 text-yellow-500" />
            <span className="text-sm font-medium">31개 스킬셋</span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-card rounded-lg border">
            <Clock className="w-4 h-4 text-blue-500" />
            <span className="text-sm font-medium">실전 예제</span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-card rounded-lg border">
            <Sparkles className="w-4 h-4 text-purple-500" />
            <span className="text-sm font-medium">지속 업데이트</span>
          </div>
        </div>
      </section>

      {/* Tools Grid */}
      <section className="container mx-auto px-4 pb-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {tools.map((tool) => (
            <Link key={tool.name} href={tool.href} className="group">
              <Card className="h-full transition-all hover:shadow-lg hover:-translate-y-1">
                <CardHeader>
                  <div className="flex items-start justify-between mb-4">
                    <div
                      className={`w-16 h-16 rounded-full bg-gradient-to-br ${tool.gradient} flex items-center justify-center text-3xl shadow-lg`}
                    >
                      {tool.icon}
                    </div>
                    <Badge variant={tool.statusVariant}>{tool.status}</Badge>
                  </div>
                  <CardTitle className="text-xl">{tool.name}</CardTitle>
                  <CardDescription>{tool.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 mb-4">
                    {tool.features.map((feature, idx) => (
                      <li key={idx} className="flex items-center gap-2 text-sm text-muted-foreground">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <div className="flex items-center gap-2 text-sm font-medium text-primary group-hover:gap-3 transition-all">
                    자세히 보기
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
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
          <p className="mt-2">© 2025 AI Helper. All rights reserved.</p>
        </div>
      </footer>
    </main>
  );
}
