# Claude Code Plugin 베스트 프랙티스

> Package 1 개발 경험과 공식 구조 연구를 통한 플러그인 개발 가이드

## 1. 플러그인 구조 비교

### 1.1 공식 Claude Code 플러그인 구조

```
plugin-directory/
├── .claude-plugin/
│   ├── plugin.json        # 플러그인 메타데이터
│   └── marketplace.json   # (선택) 마켓플레이스 정보
├── commands/              # 슬래시 커맨드
│   └── command-name.md
├── agents/                # 특화 에이전트
│   └── agent-name/
│       └── agent.md
├── hooks/                 # 동작 커스터마이징
│   └── hook-name.js
└── skills/                # 지식 파일 (SKILL.md)
    └── skill-name/
        └── SKILL.md
```

**plugin.json 예시**:
```json
{
  "name": "@username/plugin-name",
  "version": "1.0.0",
  "description": "Plugin description",
  "skills": [
    "skills/skill-1",
    "skills/skill-2"
  ],
  "commands": [
    "commands/command-1.md"
  ],
  "agents": [
    "agents/agent-1"
  ]
}
```

### 1.2 NPM 패키지 구조 (Package 1 방식)

```
@giwoong-ryu-n8n-skillset/
├── package.json           # NPM 패키지 메타데이터
├── .clauderc              # Claude 설정 (메타데이터)
├── README.md              # 문서
├── LICENSE
└── skills/                # 스킬만 포함
    ├── n8n-workflow-patterns/
    │   └── SKILL.md
    ├── n8n-node-configuration/
    │   └── SKILL.md
    └── ...
```

**package.json 예시**:
```json
{
  "name": "@giwoong-ryu/n8n-skillset",
  "version": "1.0.0",
  "claudeCode": {
    "skills": [
      "skills/n8n-workflow-patterns",
      "skills/n8n-node-configuration"
    ]
  },
  "files": [
    "skills/",
    "README.md",
    "LICENSE"
  ]
}
```

### 1.3 하이브리드 구조 (권장)

```
@username/plugin-name/
├── .claude-plugin/
│   └── plugin.json        # 공식 호환성
├── package.json           # NPM 배포
├── .clauderc              # 추가 메타데이터
├── README.md
├── LICENSE
├── commands/              # (선택) 커맨드
├── agents/                # (선택) 에이전트
└── skills/                # 스킬 (필수)
    └── skill-name/
        └── SKILL.md
```

## 2. Package 1 구조 분석

### 2.1 현재 구조 (@giwoong-ryu/n8n-skillset)

**장점** ✅:
1. NPM 패키지로 쉽게 배포 가능
2. `.clauderc`에 토큰 수, 태그 등 풍부한 메타데이터
3. 6개 스킬, 총 20,408 토큰으로 최적 범위
4. 명확한 스킬 분류 (workflow, node, validation, code, expression, mcp)
5. README.md에 사용 예시 및 학습 경로 제공

**개선 가능** 🔄:
1. `.claude-plugin/plugin.json` 추가하여 공식 호환성 확보
2. 각 스킬 README에 예시 추가
3. commands/ 디렉토리 추가 (예: `/n8n-debug`, `/n8n-validate`)
4. CHANGELOG.md 추가

### 2.2 권장 개선사항

#### Package 1에 `.claude-plugin/plugin.json` 추가

```json
{
  "name": "@giwoong-ryu/n8n-skillset",
  "version": "1.0.0",
  "description": "Comprehensive n8n workflow development skills for Claude Code - 6 essential skills",
  "author": {
    "name": "Giwoong Ryu",
    "email": "your.email@example.com",
    "url": "https://github.com/Giwoong-ryu"
  },
  "license": "MIT",
  "repository": {
    "type": "git",
    "url": "https://github.com/Giwoong-ryu/n8n-copilot.git",
    "directory": "packages/@giwoong-ryu-n8n-skillset"
  },
  "skills": [
    "skills/n8n-workflow-patterns",
    "skills/n8n-node-configuration",
    "skills/n8n-validation-expert",
    "skills/n8n-code-javascript",
    "skills/n8n-expression-syntax",
    "skills/n8n-mcp-tools-expert"
  ],
  "keywords": [
    "n8n",
    "workflow",
    "automation",
    "no-code"
  ]
}
```

#### 선택적 commands/ 추가 예시

`commands/n8n-validate.md`:
```markdown
# Validate n8n Workflow

Validates the current n8n workflow configuration using the n8n-validation-expert skill.

## Usage

/n8n-validate [workflow-file]

## Examples

/n8n-validate workflow.json
/n8n-validate
```

## 3. 플러그인 개발 베스트 프랙티스

### 3.1 구조 설계

✅ **DO**:
- 스킬 중심 구조: 지식 전달이 핵심
- 명확한 디렉토리 분리: skills/, commands/, agents/
- 하나의 SKILL.md = 하나의 명확한 목적
- 토큰 최적화: 15K~30K 토큰 (5~10 스킬)
- 스킬 간 의존성 최소화

❌ **DON'T**:
- 너무 많은 기능을 하나의 스킬에 포함
- 토큰 수 무시 (30K 초과시 분리 고려)
- 관련 없는 스킬을 한 패키지에 포함
- 중복 내용 여러 스킬에 반복

### 3.2 메타데이터 관리

**필수 파일**:
1. `package.json` - NPM 배포용
2. `.claude-plugin/plugin.json` - Claude Code 공식 호환
3. `README.md` - 사용자 가이드
4. `LICENSE` - 라이선스

**권장 파일**:
1. `.clauderc` - 추가 메타데이터 (토큰 수, 태그)
2. `CHANGELOG.md` - 버전별 변경사항
3. `.gitignore` - node_modules, .DS_Store 등

### 3.3 스킬 작성 규칙

#### SKILL.md 템플릿

```markdown
# Skill Name

## Purpose
명확한 한 문장 목적 설명

## When to Use
- 사용 시나리오 1
- 사용 시나리오 2
- 사용 시나리오 3

## Core Concepts
### Concept 1
설명 및 예시

### Concept 2
설명 및 예시

## Examples
### Example 1: [시나리오]
\`\`\`language
// 실제 동작하는 예시 코드
\`\`\`

## Common Patterns
실전에서 자주 사용하는 패턴

## Best Practices
✅ DO: 권장사항
❌ DON'T: 안티패턴

## Troubleshooting
### Issue: "에러 메시지"
**Solution**: 해결 방법

## Token Count
~X,XXX tokens
```

#### 스킬 작성 체크리스트

- [ ] Purpose 섹션: 명확한 목적 (1~2 문장)
- [ ] When to Use: 구체적인 사용 시나리오 (3~5개)
- [ ] 실행 가능한 예시 코드 포함
- [ ] Common Patterns: 실전 패턴 (3~5개)
- [ ] Best Practices: DO/DON'T 구분
- [ ] Troubleshooting: 자주 발생하는 에러 및 해결법
- [ ] Token Count: 마지막에 명시

### 3.4 토큰 관리

**토큰 측정**:
```bash
# 각 스킬의 토큰 수 측정
wc -w skills/*/SKILL.md | tail -1
# 대략 1단어 = 1.3토큰 (영어 기준)
```

**최적 토큰 범위**:
- **단일 스킬**: 2,000 ~ 5,000 토큰
- **전체 패키지**: 15,000 ~ 30,000 토큰
- **초과시 조치**:
  - 스킬 분리
  - 별도 패키지 생성
  - 중복 내용 제거

### 3.5 버전 관리

**Semantic Versioning**:
- `1.0.0`: 최초 안정 버전
- `1.1.0`: 스킬 추가, 기능 개선 (호환)
- `1.0.1`: 버그 수정, 오타 수정
- `2.0.0`: Breaking changes

**CHANGELOG.md 예시**:
```markdown
# Changelog

## [1.1.0] - 2025-11-07
### Added
- New skill: n8n-error-handling

### Changed
- Updated n8n-code-javascript examples

## [1.0.0] - 2025-11-06
### Added
- Initial release with 6 skills
```

## 4. Package 2, 3 설계 개선

### 4.1 Package 2 토큰 초과 문제

**현재 설계 (초과)**:
```
Package 2: @giwoong-ryu/korean-content-creator (~31,205 토큰) ❌
├── korean-blog-seo (4,537 토큰)
├── korean-sns-content (4,123 토큰)
├── viral-marketing-strategy (4,891 토큰)
├── content-tone-adapter (3,764 토큰)
├── hashtag-generator (2,983 토큰)
├── thumbnail-copywriting (3,125 토큰)
└── korean-proofreading (7,782 토큰)
```

**해결 방안 1: 2개 패키지로 분리 (권장)** ✅

```
Package 2A: @giwoong-ryu/viral-marketing (~15,122 토큰)
├── viral-marketing-strategy (4,891 토큰)
├── korean-blog-seo (4,537 토큰)
├── korean-sns-content (4,123 토큰)
└── hashtag-generator (1,571 토큰) ← 축소 버전

Package 2B: @giwoong-ryu/korean-content-creator (~16,083 토큰)
├── korean-proofreading (7,782 토큰)
├── content-tone-adapter (3,764 토큰)
├── thumbnail-copywriting (3,125 토큰)
└── hashtag-generator (1,412 토큰) ← 축소 버전
```

**해결 방안 2: 스킬 최적화**

```
Package 2: @giwoong-ryu/korean-content-creator (~27,500 토큰)
├── korean-blog-seo (3,800 토큰) ↓ -737
├── korean-sns-content (3,500 토큰) ↓ -623
├── viral-marketing-strategy (4,200 토큰) ↓ -691
├── content-tone-adapter (3,200 토큰) ↓ -564
├── hashtag-generator (2,500 토큰) ↓ -483
├── thumbnail-copywriting (2,800 토큰) ↓ -325
└── korean-proofreading (7,500 토큰) ↓ -282
```

최적화 방법:
- 중복 예시 제거
- 패턴 개수 축소 (10개 → 7개)
- Quick Reference 테이블로 간략화

### 4.2 개선된 Package 2A: @giwoong-ryu/viral-marketing

**목적**: 바이럴 마케팅 및 SEO 최적화에 특화

```json
{
  "name": "@giwoong-ryu/viral-marketing",
  "version": "1.0.0",
  "description": "Viral marketing and SEO optimization skills for Korean content creators",
  "keywords": [
    "marketing",
    "seo",
    "viral",
    "korean",
    "sns"
  ],
  "skills": [
    "skills/viral-marketing-strategy",
    "skills/korean-blog-seo",
    "skills/korean-sns-content",
    "skills/hashtag-generator"
  ]
}
```

**스킬 구성**:
1. **viral-marketing-strategy** (4,891 토큰)
   - 바이럴 전략 수립
   - 타겟 오디언스 분석
   - 콘텐츠 배포 최적화

2. **korean-blog-seo** (4,537 토큰)
   - 네이버 SEO 최적화
   - 키워드 리서치
   - 메타태그 최적화

3. **korean-sns-content** (4,123 토큰)
   - 인스타그램, 페이스북 콘텐츠
   - 플랫폼별 톤앤매너
   - 참여 유도 문구

4. **hashtag-generator** (1,571 토큰)
   - 해시태그 추천
   - 트렌드 분석
   - 플랫폼별 최적 개수

**총 토큰**: ~15,122 토큰 ✅

### 4.3 개선된 Package 2B: @giwoong-ryu/korean-content-creator

**목적**: 한국어 콘텐츠 제작 및 교정에 특화

```json
{
  "name": "@giwoong-ryu/korean-content-creator",
  "version": "1.0.0",
  "description": "Korean content creation and proofreading skills for professional writers",
  "keywords": [
    "korean",
    "writing",
    "proofreading",
    "content",
    "copywriting"
  ],
  "skills": [
    "skills/korean-proofreading",
    "skills/content-tone-adapter",
    "skills/thumbnail-copywriting",
    "skills/korean-grammar-checker"
  ]
}
```

**스킬 구성**:
1. **korean-proofreading** (7,782 토큰)
   - 맞춤법 검사
   - 문장 구조 개선
   - 가독성 향상

2. **content-tone-adapter** (3,764 토큰)
   - 톤앤매너 조정
   - 타겟 연령대별 스타일
   - 격식/비격식 변환

3. **thumbnail-copywriting** (3,125 토큰)
   - 썸네일 문구 작성
   - 클릭 유도 기법
   - 플랫폼별 최적화

4. **korean-grammar-checker** (신규, ~1,412 토큰)
   - 문법 오류 검출
   - 자주 틀리는 표현
   - 교정 예시

**총 토큰**: ~16,083 토큰 ✅

### 4.4 Package 3 설계 개선

**기존 설계 유지** (이미 최적):

```
Package 3: @giwoong-ryu/dev-productivity (~22,784 토큰) ✅
├── git-workflow-korean (4,237 토큰)
├── code-review-guidelines (4,562 토큰)
├── api-design-patterns (4,128 토큰)
├── error-handling-strategies (3,891 토큰)
├── testing-best-practices (3,456 토큰)
└── documentation-writer (2,510 토큰)
```

**개선 제안**:
1. 스킬 순서 재배치 (사용 빈도 높은 순):
   ```
   1. git-workflow-korean (가장 자주 사용)
   2. code-review-guidelines
   3. error-handling-strategies
   4. testing-best-practices
   5. api-design-patterns
   6. documentation-writer
   ```

2. 각 스킬에 실제 프로젝트 예시 추가:
   - git-workflow-korean: 이 프로젝트(n8n-copilot)의 커밋 히스토리 참조
   - code-review-guidelines: Package 1 코드 리뷰 예시

## 5. 배포 체크리스트

### 5.1 배포 전 확인사항

- [ ] **메타데이터 완성**
  - [ ] package.json: name, version, description, keywords
  - [ ] .claude-plugin/plugin.json 추가
  - [ ] .clauderc: 토큰 수, 스킬 개수
  - [ ] README.md: 설치, 사용법, 예시
  - [ ] LICENSE 파일

- [ ] **스킬 품질**
  - [ ] 모든 스킬에 Purpose, When to Use 포함
  - [ ] 실행 가능한 예시 코드 3개 이상
  - [ ] Best Practices 섹션
  - [ ] Troubleshooting 섹션
  - [ ] Token Count 명시

- [ ] **토큰 최적화**
  - [ ] 전체 토큰 수: 15K~30K 범위
  - [ ] 중복 내용 제거
  - [ ] 과도하게 긴 스킬 분리

- [ ] **테스트**
  - [ ] 로컬에서 설치 테스트
  - [ ] 각 스킬 동작 확인
  - [ ] 예시 코드 실행 확인

### 5.2 NPM 배포

```bash
# 1. 로그인
npm login

# 2. 패키지 테스트
npm pack
tar -xvzf *.tgz
ls package/

# 3. 배포
npm publish --access public

# 4. 확인
npm info @giwoong-ryu/n8n-skillset
```

### 5.3 Claude Code 마켓플레이스 등록

1. `.claude-plugin/marketplace.json` 생성:
```json
{
  "name": "@giwoong-ryu/n8n-skillset",
  "displayName": "n8n Workflow Skills",
  "description": "Comprehensive n8n workflow development skills",
  "icon": "🔧",
  "category": "automation",
  "tags": ["n8n", "workflow", "automation", "no-code"],
  "screenshots": [
    "screenshots/example1.png",
    "screenshots/example2.png"
  ],
  "website": "https://giwoong-ryu.github.io/n8n-copilot/",
  "support": "https://github.com/Giwoong-ryu/n8n-copilot/issues"
}
```

2. 마켓플레이스 제출 (향후 지원 예정)

## 6. 유지보수 전략

### 6.1 버전 업데이트 주기

- **Major (x.0.0)**: 6개월 ~ 1년
  - 스킬 구조 변경
  - 플랫폼 주요 업데이트 반영

- **Minor (1.x.0)**: 2~3개월
  - 새 스킬 추가
  - 기존 스킬 기능 확장

- **Patch (1.0.x)**: 필요시
  - 버그 수정
  - 오타 수정
  - 예시 개선

### 6.2 사용자 피드백 수집

1. **GitHub Issues**: 버그 리포트, 기능 요청
2. **Usage Analytics**: 어떤 스킬이 자주 사용되는지
3. **Community**: 사용자 경험 공유

### 6.3 지속적 개선

- 분기별 토큰 효율성 검토
- 신규 플랫폼 기능 반영 (n8n 업데이트)
- 사용 빈도 낮은 스킬 개선 또는 제거
- 중복 내용 통합

## 7. 요약 및 권장사항

### Package 1: @giwoong-ryu/n8n-skillset
**상태**: ✅ 완성 (20,408 토큰)
**권장 개선**:
1. `.claude-plugin/plugin.json` 추가
2. 선택적 commands/ 디렉토리 추가 (`/n8n-validate`, `/n8n-debug`)

### Package 2A: @giwoong-ryu/viral-marketing (신규)
**상태**: 🆕 설계 완료
**토큰**: ~15,122 토큰
**스킬**: 4개 (viral-marketing-strategy, korean-blog-seo, korean-sns-content, hashtag-generator)

### Package 2B: @giwoong-ryu/korean-content-creator (신규)
**상태**: 🆕 설계 완료
**토큰**: ~16,083 토큰
**스킬**: 4개 (korean-proofreading, content-tone-adapter, thumbnail-copywriting, korean-grammar-checker)

### Package 3: @giwoong-ryu/dev-productivity
**상태**: ✅ 설계 최적 (22,784 토큰)
**권장 개선**: 스킬 순서 재배치, 실제 프로젝트 예시 추가

### 다음 우선순위
1. **즉시**: Package 1에 `.claude-plugin/plugin.json` 추가
2. **다음**: Package 2A, 2B 스킬 작성 시작 (viral-marketing-strategy 우선)
3. **이후**: Package 3 구현
4. **마지막**: 테스트 및 NPM 배포

---

**작성일**: 2025-11-06
**버전**: 1.0.0
**작성자**: Giwoong Ryu
