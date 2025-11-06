# Claude Code 커스텀 플러그인 설계안

## 📊 토큰 사용량 분석 결과

### 현재 상태
- **총 스킬 수**: 27개 (서버)
- **총 토큰 로드**: ~81,891 토큰
- **평균 스킬 크기**: ~3,000 토큰

### n8n 스킬 패키지 분석
- **스킬 수**: 6개
- **총 토큰**: ~20,408 토큰
- **스킬별 토큰**:
  - n8n-node-configuration: ~4,258 토큰
  - n8n-code-javascript: ~4,027 토큰
  - n8n-validation-expert: ~3,664 토큰
  - n8n-mcp-tools-expert: ~3,188 토큰
  - n8n-workflow-patterns: ~2,871 토큰
  - n8n-expression-syntax: ~2,400 토큰

### 토큰 사용량 카테고리
- **초대형 (10K+)**: 1개 스킬 (14,303 토큰)
- **대형 (5-10K)**: 1개 스킬 (6,387 토큰)
- **중형 (2-5K)**: 17개 스킬 (~52,000 토큰)
- **소형 (<2K)**: 8개 스킬 (~9,200 토큰)

---

## 🎯 커스텀 플러그인 패키지 설계

### 설계 원칙
1. **적정 크기**: 패키지당 15,000-30,000 토큰 (5-10개 스킬)
2. **명확한 목적**: 각 패키지는 특정 워크플로우에 집중
3. **재사용성**: 다른 프로젝트에서도 활용 가능
4. **확장성**: 향후 스킬 추가 가능한 구조

---

## 📦 Package 1: @giwoong-ryu/n8n-skillset

### 목적
n8n 워크플로우 개발을 위한 종합 스킬셋

### 포함 스킬 (6개)
1. **n8n-workflow-patterns** (~2,871 토큰)
   - 5가지 핵심 워크플로우 패턴
   - Webhook, HTTP API, Database, AI Agent, Scheduled Tasks

2. **n8n-node-configuration** (~4,258 토큰)
   - 노드 설정 가이드
   - Operation별 속성 의존성 이해

3. **n8n-validation-expert** (~3,664 토큰)
   - 검증 오류 해석 및 수정
   - Validation profiles, error types

4. **n8n-code-javascript** (~4,027 토큰)
   - n8n Code 노드 JavaScript 작성
   - $input, $json, $node, $helpers 사용법

5. **n8n-expression-syntax** (~2,400 토큰)
   - {{ }} 표현식 문법 및 오류 수정
   - Webhook 데이터 접근, 다중 입력 처리

6. **n8n-mcp-tools-expert** (~3,188 토큰)
   - n8n MCP 도구 사용법
   - search_nodes, validate, create 활용

### 총 예상 토큰: ~20,408 토큰

### 사용 시나리오
```bash
# 설치
npx claude-plugins install @giwoong-ryu/n8n-skillset

# 사용 예시
"n8n에서 webhook 데이터를 받아서 Supabase에 저장하는 워크플로우 만들어줘"
→ n8n-workflow-patterns: Webhook Processing 패턴 제공
→ n8n-node-configuration: Supabase 노드 설정 가이드
→ n8n-code-javascript: 데이터 변환 코드 작성
→ n8n-validation-expert: 워크플로우 검증 및 오류 수정
```

---

## 📦 Package 2: @giwoong-ryu/korean-content-creator

### 목적
한국어 콘텐츠 제작을 위한 전문 스킬셋

### 포함 스킬 (예상 5-7개)

#### Windows 전용 스킬 포함
1. **card-news-generator** (Windows 스킬)
   - 카드뉴스 자동 생성
   - 한국어 콘텐츠 최적화

2. **card-news-generator-v2** (Windows 스킬)
   - 개선된 카드뉴스 생성
   - 더 많은 템플릿 지원

3. **midjourney-cardnews-bg** (Windows 스킬)
   - Midjourney 배경 이미지 생성
   - 카드뉴스 배경 자동화

4. **viral-marketing-mastery** (~14,303 토큰)
   - 바이럴 마케팅 전략
   - STEPPS 프레임워크
   - 소셜 미디어 최적화

5. **canvas-design** (~2,984 토큰)
   - 비주얼 아트 생성
   - PNG/PDF 디자인

6. **theme-factory** (~781 토큰)
   - 10가지 사전 설정 테마
   - 슬라이드/문서/HTML 스타일링

7. **pptx** (~6,387 토큰)
   - PowerPoint 생성/편집
   - 프레젠테이션 자동화

### 총 예상 토큰: ~25,000-30,000 토큰

### 사용 시나리오
```bash
# 설치
npx claude-plugins install @giwoong-ryu/korean-content-creator

# 사용 예시
"SNS용 카드뉴스 10장 만들어줘. 주제는 AI 마케팅 트렌드"
→ viral-marketing-mastery: 바이럴 콘텐츠 전략 제공
→ card-news-generator-v2: 카드뉴스 구조 생성
→ midjourney-cardnews-bg: 배경 이미지 프롬프트 생성
→ canvas-design: 최종 디자인 완성
→ theme-factory: 일관된 브랜딩 적용
```

---

## 📦 Package 3: @giwoong-ryu/dev-productivity

### 목적
개발 생산성 향상을 위한 범용 스킬셋

### 포함 스킬 (예상 8-10개)

1. **systematic-debugging** (~2,497 토큰)
   - 4단계 디버깅 프레임워크
   - Root cause investigation

2. **writing-plans** (~863 토큰)
   - 상세한 구현 계획 작성
   - 엔지니어를 위한 단계별 가이드

3. **subagent-driven-development** (~1,268 토큰)
   - 독립적 태스크 병렬 실행
   - 코드 리뷰 통합

4. **prompt-engineering-patterns** (~1,745 토큰)
   - 고급 프롬프트 엔지니어링
   - LLM 성능 최적화

5. **skill-creator** (~2,886 토큰)
   - 새로운 스킬 생성 가이드
   - 스킬 구조 설계

6. **claude-code-analyzer** (~2,342 토큰)
   - Claude Code 사용 패턴 분석
   - CLAUDE.md 개선 제안

7. **nextjs** (~2,344 토큰)
   - Next.js App Router, RSC, PPR
   - Turborepo 모노레포 관리

8. **tailwindcss** (~2,493 토큰)
   - Tailwind CSS + ShadCN UI
   - 반응형 디자인 패턴

9. **landing-page-guide** (~2,417 토큰)
   - 랜딩 페이지 11가지 필수 요소
   - 전환율 최적화

10. **research** (~1,447 토큰)
    - 멀티소스 리서치 에이전트
    - Quick/Standard/Extensive 모드

### 총 예상 토큰: ~20,302 토큰

### 사용 시나리오
```bash
# 설치
npx claude-plugins install @giwoong-ryu/dev-productivity

# 사용 예시
"Next.js 15 + Tailwind로 SaaS 랜딩 페이지 만들어줘"
→ landing-page-guide: 11가지 필수 요소 제공
→ nextjs: App Router 구조 설계
→ tailwindcss: ShadCN 컴포넌트 활용
→ writing-plans: 단계별 구현 계획
→ systematic-debugging: 빌드 오류 해결
```

---

## 🎨 Windows 전용 스킬 (Package 후보)

### @giwoong-ryu/project-starters
1. **nextjs15-init** - Next.js 15 프로젝트 초기화
2. **flutter-init** - Flutter 프로젝트 초기화
3. **codex** - 코드 도구
4. **codex-claude-loop** - Claude 루프 통합

### @giwoong-ryu/ai-enhancers
1. **meta-prompt-generator** - 메타 프롬프트 생성
2. **prompt-enhancer** - 프롬프트 개선
3. **code-changelog** - 자동 변경사항 문서화

---

## 📝 플러그인 배포 체크리스트

### 1. 패키지 구조 설정
```
@giwoong-ryu/n8n-skillset/
├── package.json
├── README.md
├── skills/
│   ├── n8n-workflow-patterns/
│   │   └── SKILL.md
│   ├── n8n-node-configuration/
│   │   └── SKILL.md
│   └── ...
└── .clauderc
```

### 2. package.json 템플릿
```json
{
  "name": "@giwoong-ryu/n8n-skillset",
  "version": "1.0.0",
  "description": "Comprehensive n8n workflow development skills for Claude Code",
  "keywords": ["claude-code", "n8n", "workflow", "automation"],
  "author": "Giwoong Ryu",
  "license": "MIT",
  "claudeCode": {
    "skills": [
      "skills/n8n-workflow-patterns",
      "skills/n8n-node-configuration",
      "skills/n8n-validation-expert",
      "skills/n8n-code-javascript",
      "skills/n8n-expression-syntax",
      "skills/n8n-mcp-tools-expert"
    ]
  }
}
```

### 3. README.md 템플릿
```markdown
# @giwoong-ryu/n8n-skillset

n8n 워크플로우 개발을 위한 종합 스킬 패키지

## Installation

\`\`\`bash
npx claude-plugins install @giwoong-ryu/n8n-skillset
\`\`\`

## Included Skills

- **n8n-workflow-patterns**: 5가지 핵심 워크플로우 패턴
- **n8n-node-configuration**: 노드 설정 가이드
- **n8n-validation-expert**: 검증 및 오류 수정
- **n8n-code-javascript**: JavaScript 코드 노드 작성
- **n8n-expression-syntax**: 표현식 문법
- **n8n-mcp-tools-expert**: MCP 도구 활용

## Usage Examples

\`\`\`
"n8n에서 webhook으로 데이터 받아서 Supabase에 저장해줘"
\`\`\`

## Token Usage

Total: ~20,408 tokens

## License

MIT
```

### 4. NPM 배포 단계
```bash
# 1. NPM 계정 생성/로그인
npm login

# 2. 패키지 빌드
npm run build

# 3. 배포
npm publish --access public

# 4. claude-plugins.dev 등록
# https://claude-plugins.dev/submit 에서 제출
```

---

## 🚀 다음 단계

1. **Package 1 우선 구현**: `@giwoong-ryu/n8n-skillset`
   - 이미 설치된 6개 n8n 스킬 활용
   - 토큰 사용량 검증 완료 (~20K)
   - 즉시 배포 가능

2. **Windows 스킬 분석**
   - Windows에서 실제 토큰 사용량 측정
   - Package 2, 3 세부 구성 확정

3. **플러그인 구조 연구**
   - 설치된 10개 플러그인의 package.json 분석
   - .clauderc 설정 방법 학습

4. **테스트 및 배포**
   - 로컬 테스트 환경 구축
   - NPM 배포 및 claude-plugins.dev 등록

---

## 💡 핵심 인사이트

### ✅ 검증된 사실
- n8n 스킬 6개로 ~20K 토큰 = **적정 크기**
- 평균 스킬당 ~3K 토큰
- 10개 스킬 패키지 = ~30K 토큰 예상

### ⚠️ 주의사항
- viral-marketing-mastery (14K 토큰)처럼 초대형 스킬은 단독 패키지 고려
- 패키지당 30K 토큰 초과 시 분리 권장
- 사용 빈도 낮은 스킬은 별도 패키지로 분리

### 🎯 최적 전략
1. **핵심 패키지 3개**: 각 15-30K 토큰
2. **전문 패키지**: 특정 목적에 집중
3. **경량 패키지**: 자주 사용하는 소형 스킬 묶음
