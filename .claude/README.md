# Claude Code 설정

이 디렉토리는 Claude Code의 동작을 커스터마이징합니다.

## 📁 구조

```
.claude/
├── instructions.md      # 프로젝트 작업 지침 (자동 적용)
├── commands/           # 슬래시 커맨드 모음
│   ├── find-github.md  # /find-github - GitHub 코드 검색
│   ├── check-docs.md   # /check-docs - 공식 문서 확인
│   ├── debug-error.md  # /debug-error - 에러 디버깅
│   └── optimize-code.md# /optimize-code - 코드 최적화
└── README.md           # 이 파일
```

## 🤖 자동 적용되는 규칙 (instructions.md)

Claude Code는 **자동으로** 다음 규칙을 따릅니다:

### 1. 복잡한 코드 → GitHub 검색
- 알고리즘, API 통합, 성능 최적화 등
- WebSearch로 검증된 레포지토리 찾기
- WebFetch로 코드 가져와서 적용

### 2. 공식 문서 우선 확인
- N8N, Chrome Extension, Gemini API 등
- Deprecated API 자동 확인
- 최신 권장사항 적용

### 3. 에러 자동 디버깅
- GitHub Issues 검색
- Stack Overflow 답변 확인
- 검증된 해결책 제시

### 4. 코드 품질 자동 체크
- 중복 코드 제거
- 매직 넘버 상수화
- 비동기 처리 최적화

## 🎯 슬래시 커맨드 사용법

### /find-github
```
/find-github fuzzy string matching
```
→ GitHub에서 fuzzy string matching 구현 찾아서 코드 제공

### /check-docs
```
/check-docs Gemini API
```
→ Gemini API 공식 문서 확인 및 최신 권장사항 제공

### /debug-error
```
/debug-error Cannot read properties of undefined
```
→ 에러 분석 및 해결책 찾기

### /optimize-code
```
/optimize-code content.js
```
→ content.js 성능 분석 및 최적화 제안

## 📝 작업 패턴 예시

### 일반 작업 (자동 적용)
```
사용자: "재귀 디렉토리 탐색 코드 작성해줘"

Claude Code:
1. 🔍 GitHub 검색 중... (자동)
2. 📦 코드 가져오기... (자동)
3. 🔧 프로젝트에 맞게 수정... (자동)
4. ✅ 적용 완료 + 출처 명시
```

### 슬래시 커맨드 사용
```
사용자: "/find-github levenshtein distance"

Claude Code:
1. GitHub 검색 결과 3개 비교
2. 최적의 레포 선택
3. 코드 추출 및 설명
4. 적용 방법 안내
```

## 🔧 설정 수정

### instructions.md 수정
```bash
# 프로젝트 작업 지침 수정
nano .claude/instructions.md
```

### 새 슬래시 커맨드 추가
```bash
# 1. 새 파일 생성
nano .claude/commands/my-command.md

# 2. 내용 작성
---
description: 명령어 설명
---

작업 내용...

# 3. 사용
/my-command
```

## ⚙️ 고급 설정

### 자동화 수준 조정
`instructions.md`에서 다음 항목 수정:
- `조건:` - 언제 자동 실행할지
- `프로세스:` - 어떻게 실행할지
- `예외:` - 언제 건너뛸지

### 예시: GitHub 검색 덜 하고 싶을 때
```markdown
**조건:** 다음 중 하나에 해당하는 경우만
- 성능 크리티컬한 알고리즘
- 보안이 중요한 코드

**예외:**
- 간단한 유틸리티 함수
- 10줄 이하 코드
- CRUD 로직
```

## 📊 통계

현재 설정된 자동화:
- ✅ 복잡한 코드 → GitHub 검색
- ✅ 공식 문서 → 자동 확인
- ✅ 에러 → 자동 디버깅
- ✅ 코드 품질 → 자동 체크
- ✅ Git 커밋 → 표준 형식

슬래시 커맨드: 4개
- `/find-github`
- `/check-docs`
- `/debug-error`
- `/optimize-code`

## 🎓 더 알아보기

- [Claude Code 공식 문서](https://docs.claude.com/claude-code)
- [슬래시 커맨드 작성법](https://docs.claude.com/claude-code/slash-commands)
- [프로젝트 지침 가이드](https://docs.claude.com/claude-code/project-instructions)
