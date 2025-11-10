import { ComingSoon } from "@/components/coming-soon";

export const metadata = {
  title: "Perplexity 가이드 - AI Helper",
  description: "Perplexity AI 활용 가이드 준비중",
};

export default function PerplexityPage() {
  return (
    <ComingSoon
      name="Perplexity"
      description="AI 기반 검색 엔진"
      icon="🔍"
      gradient="from-teal-500 to-teal-700"
      features={[
        "AI 검색 엔진 활용법",
        "소스 인용 및 팩트 체크",
        "Pro 모드 고급 기능",
        "리서치 워크플로우 최적화",
        "컬렉션 관리 전략",
        "실전 검색 패턴",
      ]}
    />
  );
}
