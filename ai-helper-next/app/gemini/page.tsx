import { ComingSoon } from "@/components/coming-soon";

export const metadata = {
  title: "Gemini 가이드 - AI Helper",
  description: "Google Gemini 활용 가이드 준비중",
};

export default function GeminiPage() {
  return (
    <ComingSoon
      name="Gemini"
      description="Google의 멀티모달 AI"
      icon="🔵"
      gradient="from-blue-500 to-blue-700"
      features={[
        "멀티모달 활용법 (텍스트, 이미지, 영상)",
        "Google 서비스와의 통합",
        "Gemini Pro와 Ultra 비교",
        "고급 검색 기능 활용",
        "코드 생성 및 분석",
        "실시간 정보 접근",
      ]}
    />
  );
}
