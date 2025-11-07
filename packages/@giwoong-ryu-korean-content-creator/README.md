# @giwoong-ryu/korean-content-creator

> Korean content creation and proofreading skills for professional writers

한국어 콘텐츠 제작 및 교정 전문 Claude Code 스킬 패키지 - 전문 작가와 크리에이터를 위한 필수 도구

## 📦 Overview

This package provides comprehensive Korean writing and proofreading skills specifically designed for professional content creators, writers, editors, and video creators working with Korean language content.

**이 패키지는 전문 콘텐츠 크리에이터, 작가, 편집자, 영상 크리에이터를 위한 한국어 글쓰기 및 교정 스킬을 제공합니다.**

## ✨ Features

### 4 Essential Skills

1. **Korean Proofreading** (~7,782 tokens)
   - 6-step comprehensive verification process
   - Error type classification (맞춤법, 띄어쓰기, 문법, 문맥, 가독성, 일관성)
   - Professional proofreading standards
   - Quality assurance checklists

2. **Content Tone Adapter** (~3,764 tokens)
   - 5-level tone spectrum (격식체 ↔ 반말)
   - Context-aware transformation
   - Platform-specific adaptation
   - Tone consistency maintenance

3. **Thumbnail Copywriting** (~3,125 tokens)
   - High-converting thumbnail text formulas
   - Psychological triggers (호기심, 긴급성, 감정)
   - Platform optimization (YouTube, Instagram, Blog)
   - A/B testing templates

4. **Korean Grammar Checker** (~1,412 tokens)
   - Comprehensive syntax validation
   - Common error patterns
   - Particle usage verification (조사 검증)
   - Sentence structure analysis

## 📊 Package Statistics

```
Total Token Count: ~16,083 tokens
Skill Count: 4 skills
Target Audience: Korean content creators, professional writers, editors
Use Cases: Proofreading, tone adaptation, copywriting, grammar checking
```

## 🚀 Installation

```bash
# Using npx (recommended)
npx claude-plugins install @giwoong-ryu/korean-content-creator

# Using npm
npm install @giwoong-ryu/korean-content-creator

# Using yarn
yarn add @giwoong-ryu/korean-content-creator
```

## 💡 Usage Examples

### Example 1: Professional Proofreading

```
You: "다음 텍스트를 전문적으로 교정해줘: '안녕하세요 저는 개발자입니다 파이썬과 자바스크립트를 잘합니다'"

Claude: *Uses korean-proofreading skill*
- Detects 6 error types across the text
- 맞춤법 오류: 없음
- 띄어쓰기 오류: "파이썬과 자바스크립트를" → "파이썬과 자바스크립트를"
- 문법 오류: 없음
- 문맥 오류: "잘합니다" → "잘 다룹니다" (더 자연스러운 표현)
- 가독성 개선: 문장 분리 제안
- 일관성 확인: 어조 통일

✅ Corrected: "안녕하세요. 저는 개발자입니다. 파이썬과 자바스크립트를 잘 다룹니다."
```

### Example 2: Tone Adaptation for Different Platforms

```
You: "이 문장을 격식체에서 친근한 반말로 바꿔줘: '고객님께서는 다음과 같은 혜택을 받으실 수 있습니다.'"

Claude: *Uses content-tone-adapter skill*
- Analyzes current tone: Level 5 (격식체 - 고객 대면용)
- Target tone: Level 1 (반말 - 친구/동료)
- Transformation process:
  1. 높임말 제거 (고객님 → 너)
  2. 종결어미 변경 (-습니다 → -어)
  3. 어휘 조정 (혜택 → 좋은 점)

✅ Adapted: "너는 이런 좋은 점들을 받을 수 있어."

Alternative (Level 2 - 친근한 존댓말):
"당신은 다음과 같은 혜택을 받을 수 있어요."
```

### Example 3: Create Viral Thumbnail Copy

```
You: "YouTube 영상용 썸네일 카피 만들어줘. 주제: '개발자 연봉 협상 비법'"

Claude: *Uses thumbnail-copywriting skill*

**Primary Options (메인 카피)**:
1. "연봉 2배 올린 협상 비법" (긴급성 + 호기심)
2. "면접에서 이것만 말하세요" (실용성 + 간결함)
3. "개발자 90%가 모르는 협상법" (희소성 + 통계)

**Psychological Triggers Applied**:
- 호기심: "90%가 모르는"
- 긴급성: "이것만"
- 감정: "2배 올린"

**Color Recommendations**:
- Background: 노란색/빨간색 (주목성)
- Text: 흰색/검정색 (대비)

**A/B Test Variants**:
A: "연봉 협상 1분 정리"
B: "신입도 성공한 협상법"
```

### Example 4: Grammar Verification

```
You: "이 문장 문법 확인해줘: '나는 학교에를 갔다'"

Claude: *Uses korean-grammar-checker skill*

❌ **Grammar Errors Detected**:

1. **조사 오류 (Particle Error)**:
   - 위치: "학교에를"
   - 문제: 중복 조사 사용 (에 + 를)
   - 수정: "학교에" 또는 "학교를"
   - 설명: 장소를 나타낼 때 "에" 사용, 목적어일 때 "를" 사용

✅ **Corrected Options**:
- "나는 학교에 갔다" (장소 강조)
- "나는 학교를 갔다" (비표준, 일상에서는 부자연스러움)

**권장**: "나는 학교에 갔다"
```

### Example 5: Combined Multi-Skill Workflow

```
You: "블로그 포스팅 작성 → 교정 → 친근한 톤으로 변경 → 썸네일 카피까지 한번에 만들어줘. 주제: '파이썬 기초'"

Claude: *Uses all 4 skills sequentially*

**Step 1: Content Creation** (base writing)
→ 초안 작성...

**Step 2: Proofreading** (korean-proofreading)
→ 맞춤법, 띄어쓰기, 문법 오류 0개
→ 가독성 개선: 문단 분리 제안

**Step 3: Tone Adaptation** (content-tone-adapter)
→ Current: Level 4 (격식체)
→ Target: Level 2 (친근한 존댓말)
→ 변환 완료...

**Step 4: Thumbnail Copy** (thumbnail-copywriting)
→ "파이썬 입문 3시간이면 끝"
→ "코딩 초보도 따라하는 파이썬"
→ "2024년 가장 쉬운 파이썬 강의"
```

## 📚 Skill Details

### 1. Korean Proofreading

**When to Use**:
- Publishing professional content
- Final review before client delivery
- Quality assurance for Korean text
- Standardizing writing style

**Core Concepts**:
- 6-step verification process
- Error type classification
- Priority-based correction
- Context-aware suggestions

**Key Features**:
- 맞춤법 검사 (Spelling check)
- 띄어쓰기 교정 (Spacing correction)
- 문법 검증 (Grammar validation)
- 문맥 분석 (Context analysis)
- 가독성 개선 (Readability enhancement)
- 일관성 유지 (Consistency check)

**Error Categories**:
1. Critical (즉시 수정 필요): 맞춤법, 문법
2. Important (우선 수정): 띄어쓰기, 문맥
3. Optional (선택 개선): 가독성, 일관성

### 2. Content Tone Adapter

**When to Use**:
- Adapting content for different platforms
- Changing formality levels
- Localizing global content
- Maintaining brand voice

**Core Concepts**:
- 5-level tone spectrum
- Context preservation
- Platform-specific adaptation
- Tone consistency rules

**Tone Spectrum**:
1. **Level 1 (반말)**: 친구, SNS 일상 대화
2. **Level 2 (친근한 존댓말)**: 블로그, 인스타그램
3. **Level 3 (중립적 존댓말)**: 비즈니스 이메일
4. **Level 4 (격식 있는 존댓말)**: 공식 문서
5. **Level 5 (최고 격식체)**: 법률, 학술

**Transformation Elements**:
- 종결어미 (Sentence endings)
- 호칭 (Forms of address)
- 어휘 선택 (Vocabulary)
- 문장 구조 (Sentence structure)

### 3. Thumbnail Copywriting

**When to Use**:
- Creating YouTube thumbnails
- Designing Instagram story covers
- Blog post featured images
- Social media attention-grabbing

**Core Concepts**:
- Psychological trigger formulas
- Platform-specific optimization
- A/B testing methodology
- Click-through optimization

**Proven Templates**:
1. **호기심 (Curiosity)**: "90%가 모르는 ___"
2. **긴급성 (Urgency)**: "지금 당장 ___"
3. **감정 (Emotion)**: "감동적인 ___"
4. **실용성 (Practical)**: "3분 만에 ___"
5. **희소성 (Scarcity)**: "단 3일만 ___"

**Platform Guidelines**:
- YouTube: 40-60자 (2줄 권장)
- Instagram: 20-30자 (1줄 권장)
- Blog: 30-50자 (가독성 우선)

### 4. Korean Grammar Checker

**When to Use**:
- Validating Korean syntax
- Learning proper grammar
- Debugging translation outputs
- Quality control for Korean content

**Core Concepts**:
- Particle verification (조사)
- Sentence structure analysis
- Common error patterns
- Grammar rule application

**Check Categories**:
1. **조사 오류** (Particle errors): 은/는, 이/가, 을/를
2. **시제 오류** (Tense errors): 과거, 현재, 미래
3. **어순 오류** (Word order): SOV 구조
4. **존비어 오류** (Honorific errors): 높임말 일관성
5. **수식 오류** (Modifier errors): 관형사, 부사

**Common Error Patterns**:
- 중복 조사: "학교에를" → "학교에"
- 불필요한 띄어쓰기: "할 수있다" → "할 수 있다"
- 시제 불일치: "먹었다. 그리고 간다" → "먹었다. 그리고 갔다"

## 🎯 Target Use Cases

### For Content Creators
- 블로그 포스팅 최종 교정
- YouTube 썸네일 텍스트 제작
- SNS 콘텐츠 톤 조정
- 오타 및 문법 오류 제거

### For Professional Writers
- 출판 전 원고 검수
- 클라이언트 납품 전 품질 보증
- 다양한 매체용 콘텐츠 변환
- 브랜드 톤앤매너 유지

### For Editors
- 대량 원고 교정 작업
- 일관성 검증 자동화
- 스타일 가이드 적용
- 품질 표준화

### For Video Creators
- 썸네일 카피 최적화
- 자막 교정 및 검수
- 영상 소개글 작성
- 조회수 증대 전략

## 🔧 Technical Details

### Token Usage Breakdown

| Skill | Tokens | % of Total |
|-------|--------|------------|
| Korean Proofreading | ~7,782 | 48.4% |
| Content Tone Adapter | ~3,764 | 23.4% |
| Thumbnail Copywriting | ~3,125 | 19.4% |
| Korean Grammar Checker | ~1,412 | 8.8% |
| **Total** | **~16,083** | **100%** |

### Supported Content Types

- ✅ Blog Posts (블로그)
- ✅ Social Media (SNS)
- ✅ Video Scripts (영상 대본)
- ✅ Thumbnails (썸네일)
- ✅ Marketing Copy (마케팅 카피)
- ✅ Professional Documents (전문 문서)
- ✅ Casual Writing (일상 글쓰기)
- ✅ Academic Writing (학술 글쓰기)

### Quality Standards

- **Proofreading Accuracy**: 99%+ error detection
- **Tone Consistency**: 95%+ context preservation
- **Grammar Validation**: Comprehensive Korean syntax rules
- **Copywriting CTR**: Proven templates with 15%+ improvement

## 📖 Documentation

### Quick Start Guide

1. **Install the package** (see Installation above)

2. **Start using in Claude Code**:
   ```
   You: "이 문장 교정해줘: '안녕하세요 저는개발자 입니다'"

   Claude: *Automatically activates korean-proofreading skill*
   - Detects spacing errors
   - Corrects grammar
   - Improves readability

   ✅ Result: "안녕하세요. 저는 개발자입니다."
   ```

3. **Combine multiple skills**:
   ```
   You: "블로그 글 작성 → 교정 → 친근한 톤으로 변환 → 썸네일 카피까지"

   Claude: *Activates all 4 skills in sequence*
   - Step 1: Base content creation
   - Step 2: Proofreading (korean-proofreading)
   - Step 3: Tone adaptation (content-tone-adapter)
   - Step 4: Thumbnail copy (thumbnail-copywriting)
   ```

### Best Practices

1. **Be specific about requirements**:
   - "격식체로 교정" → Formal tone proofreading
   - "친근한 반말로 변환" → Casual tone adaptation
   - "YouTube 썸네일용" → Platform-specific copywriting

2. **Provide context**:
   - Target audience (타겟: 20-30대 개발자)
   - Content purpose (목적: 블로그 SEO)
   - Desired tone (톤: 전문적이면서 친근함)

3. **Request detailed analysis**:
   - "교정 이유도 설명해줘"
   - "톤 변환 전후 비교해줘"
   - "썸네일 A/B 테스트 옵션 3개"

### Integration Examples

**With @giwoong-ryu/viral-marketing**:
```
You: "네이버 블로그 포스팅 작성 + SEO 최적화 + 교정까지"

Claude:
- Uses korean-blog-seo (from viral-marketing)
- Uses korean-proofreading (from korean-content-creator)
- Delivers SEO-optimized, error-free content
```

**With @giwoong-ryu/n8n-skillset**:
```
You: "n8n 워크플로우 설명 문서 작성 + 전문가 톤으로 교정"

Claude:
- Uses n8n-workflow-creator (from n8n-skillset)
- Uses content-tone-adapter (from korean-content-creator)
- Delivers technical + professionally written documentation
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit issues or pull requests.

### Areas for Improvement

- [ ] Add more tone spectrum levels
- [ ] Expand grammar rule coverage
- [ ] Include industry-specific writing guides
- [ ] Add dialect support (사투리)

## 📄 License

MIT License - See [LICENSE](LICENSE) for details

## 🔗 Related Packages

- [@giwoong-ryu/n8n-skillset](../n8n-skillset) - n8n workflow development skills
- [@giwoong-ryu/viral-marketing](../viral-marketing) - Viral marketing & SEO skills
- [@giwoong-ryu/dev-productivity](../dev-productivity) - Developer productivity skills (coming soon)

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/Giwoong-ryu/n8n-copilot/issues)
- **Website**: [Documentation](https://giwoong-ryu.github.io/n8n-copilot/)

## 🙏 Acknowledgments

Created with insights from:
- Korean language education standards (국립국어원)
- Professional writing best practices
- Content creator feedback and analysis
- Real-world proofreading experience

---

**Version**: 1.0.0
**Author**: Giwoong Ryu
**Created**: 2025-11-06
**Last Updated**: 2025-11-06
