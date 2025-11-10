import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Clock, Bell } from "lucide-react";

interface ComingSoonProps {
  name: string;
  description: string;
  icon: string;
  gradient: string;
  features?: string[];
}

export function ComingSoon({ name, description, icon, gradient, features }: ComingSoonProps) {
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
              <h1 className="text-2xl font-bold">{name}</h1>
              <p className="text-sm text-muted-foreground">{description}</p>
            </div>
          </div>
        </div>
      </header>

      {/* Coming Soon Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="max-w-2xl mx-auto text-center">
          <div
            className={`w-24 h-24 mx-auto rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center text-5xl shadow-lg mb-8`}
          >
            {icon}
          </div>

          <div className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-500/10 rounded-full mb-6">
            <Clock className="w-4 h-4 text-yellow-500" />
            <span className="text-sm font-medium">준비중</span>
          </div>

          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            {name} 가이드
            <br />
            <span className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              곧 공개됩니다
            </span>
          </h2>

          <p className="text-lg text-muted-foreground mb-8">
            {name} 활용 가이드를 열심히 준비하고 있습니다.
            <br />
            조금만 기다려 주세요!
          </p>

          {features && features.length > 0 && (
            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="text-left">준비중인 콘텐츠</CardTitle>
                <CardDescription className="text-left">
                  다음 내용들을 포함할 예정입니다
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 text-left">
                  {features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <div className="w-2 h-2 rounded-full bg-primary" />
                      </div>
                      <span className="text-muted-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/">
              <Button size="lg" variant="default">
                <ArrowLeft className="w-4 h-4 mr-2" />
                홈으로 돌아가기
              </Button>
            </Link>
            <Button size="lg" variant="outline" disabled>
              <Bell className="w-4 h-4 mr-2" />
              알림 받기
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-muted/50 mt-20">
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
