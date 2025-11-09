# 🤖 Claude Agent

> **Claude Agent 활용 가이드** - 복잡한 작업을 자율적으로 수행하는 AI 시스템

---

## 📋 목차
- [Agent란?](#agent란)
- [Agent vs Skills vs MCP](#agent-vs-skills-vs-mcp)
- [Agent 설정 방법](#agent-설정-방법)
- [실전 활용 예제](#실전-활용-예제)

---

## Agent란?

Claude Agent는 **복잡한 다단계 작업을 자율적으로 계획하고 실행**하는 AI 시스템입니다.

### Agent vs Skills vs MCP 차이

| 구분 | 목적 | 동작 방식 | 예시 |
|------|------|-----------|------|
| **Skills** | 특정 도메인 지식 제공 | Claude에게 컨텍스트 주입 | n8n 워크플로우 패턴 |
| **MCP** | 외부 시스템 연동 | Tools로 데이터 접근 | 데이터베이스 쿼리 |
| **Agent** | 복잡한 작업 자동화 | 다단계 작업 자율 실행 | 코드 리뷰 자동화 |

### 주요 특징

- ✅ **자율적 의사결정**: 작업 단계를 스스로 계획
- ✅ **다단계 작업**: 여러 단계를 순차적으로 수행
- ✅ **도구 사용**: Skills, MCP, Bash 등 모든 도구 활용 가능
- ✅ **컨텍스트 유지**: 작업 간 상태 유지

---

## Agent 설정 방법

### 1. Agent 디렉토리 구조

```
.claude/
└── agents/
    ├── code-reviewer/
    │   └── AGENT.md
    ├── documentation-writer/
    │   └── AGENT.md
    └── test-runner/
        └── AGENT.md
```

### 2. AGENT.md 작성 예시

```markdown
# Code Reviewer Agent

## Purpose
코드 변경사항을 자동으로 리뷰하고 피드백을 제공합니다.

## Workflow
1. 변경된 파일 목록 확인 (git diff)
2. 각 파일의 코드 리뷰
3. 보안 취약점 체크
4. 성능 이슈 검토
5. 리뷰 리포트 작성

## Tools Used
- Bash (git 명령어)
- Read (파일 읽기)
- Grep (코드 검색)

## Output
마크다운 형식의 리뷰 리포트
```

### 3. Agent 사용

```bash
# Task tool로 Agent 호출
/task code-reviewer "최근 커밋을 리뷰해줘"
```

---

## 실전 활용 예제

### 예제 1: 자동 코드 리뷰

**시나리오**: PR 생성 시 자동으로 코드 리뷰

```markdown
# .claude/agents/code-reviewer/AGENT.md

## Workflow
1. `git diff main...HEAD` 실행
2. 변경된 각 파일 분석:
   - 코드 복잡도 체크
   - 잠재적 버그 탐지
   - 베스트 프랙티스 준수 확인
3. 리뷰 리포트 생성
4. TODO 항목 추출
```

**사용**:
```
/task code-reviewer "이번 PR 리뷰해줘"
```

### 예제 2: 문서 자동 생성

**시나리오**: 코드베이스의 모든 함수에 JSDoc 추가

```markdown
# .claude/agents/documentation-writer/AGENT.md

## Workflow
1. 모든 .js 파일 탐색
2. JSDoc이 없는 함수 찾기
3. 함수 로직 분석
4. JSDoc 주석 생성
5. 파일 업데이트
```

### 예제 3: 통합 테스트 자동화

```markdown
# .claude/agents/test-runner/AGENT.md

## Workflow
1. 테스트 실행 (`npm test`)
2. 실패한 테스트 분석
3. 에러 메시지 해석
4. 수정 방안 제시
5. 필요시 테스트 코드 수정
```

---

## 💡 Agent 디자인 팁

### 1. 단일 책임 원칙
- 하나의 Agent는 하나의 명확한 목적만
- ❌ "코드 리뷰하고 테스트 작성하고 문서화"
- ✅ "코드 리뷰만 전문적으로"

### 2. 명확한 Workflow
- 각 단계를 구체적으로 명시
- 사용할 도구 명시
- 예상 출력 형식 정의

### 3. 에러 핸들링
- 실패 시 어떻게 할지 명시
- 재시도 로직 포함
- 롤백 방법 정의

---

## 📚 추가 리소스

- [Claude Code Agents 공식 문서](https://docs.claude.com/claude-code/agents)
- [Agent 디자인 패턴](https://github.com/anthropics/claude-code/blob/main/docs/agents.md)

---

**[← 돌아가기](../README.md)**
