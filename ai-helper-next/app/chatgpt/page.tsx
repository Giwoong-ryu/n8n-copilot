import { ComingSoon } from "@/components/coming-soon";

export const metadata = {
  title: "ChatGPT 가이드 - AI Helper",
  description: "ChatGPT 활용 가이드 준비중",
};

export default function ChatGPTPage() {
  return (
    <ComingSoon
      name="ChatGPT"
      description="OpenAI의 범용 AI 챗봇"
      icon="🟢"
      gradient="from-green-500 to-green-700"
      features={[
        "프롬프트 엔지니어링 가이드",
        "GPT-4와 GPT-3.5 비교 및 활용법",
        "커스텀 GPTs 만들기",
        "플러그인 활용 전략",
        "API 연동 및 자동화",
        "실전 예제 모음",
      ]}
    />
  );
}
