---
description: GitHub 이슈 체계적 분석 및 해결
---

# GitHub 이슈 수정 워크플로우

GitHub 이슈를 체계적으로 분석하고 해결합니다. $ARGUMENTS로 이슈 번호를 전달하세요.

사용 예: `/fix-issue 123` 또는 `/fix-issue https://github.com/user/repo/issues/123`

## 🚨 시작 전 필수 확인

1. **`.claude/lessons-learned.md` 먼저 확인**
   - 유사한 이슈가 과거에 있었는지
   - 이미 검증된 해결 방법이 있는지
   - 2번째 발생이면 하드코딩 필요

2. **검증 스크립트 실행**
```bash
npm run verify-all
```
- 현재 코드 상태 확인
- Critical 기능 정상 작동 확인

## 13단계 해결 프로세스

### Phase 1: 문제 파악

**1. 이슈 정보 수집**
- 이슈 제목 및 설명 읽기
- 재현 단계 확인
- 스크린샷 / 에러 로그 분석
- 관련 PR 및 커밋 확인

**2. 환경 설정**
```bash
# 최신 코드 동기화
git fetch origin
git checkout main
git pull origin main

# 작업 브랜치 생성
git checkout -b fix/issue-[번호]-[간단한-설명]
```

**3. 재현 시도**
- 이슈에 명시된 단계 따라하기
- Chrome DevTools 콘솔 확인
- 네트워크 탭 확인 (API 요청 실패 등)
- 다양한 환경에서 테스트 (다른 브라우저, OS 등)

### Phase 2: 분석 및 조사

**4. 근본 원인 파악**
- Grep으로 관련 코드 검색
```bash
# 에러 메시지나 관련 키워드 검색
grep -r "[키워드]" n8n/
```
- Read로 관련 파일 전체 읽기
- 왜 이 문제가 발생했는지 이해

**5. 영향 범위 확인**
- 이 이슈가 어떤 기능에 영향을 주는지
- 다른 코드와의 의존성 확인
- 잠재적 부작용 파악

**6. 유사 사례 검색**
```
WebSearch: "github [이슈 키워드] [기술 스택] 2024"
WebSearch: "stackoverflow [에러 메시지] 2024"
```
- 검증된 해결 방법 찾기
- 베스트 프랙티스 확인

### Phase 3: 해결책 설계

**7. 수정 전략 수립**
- 증상이 아닌 **원인**을 해결
- 최소한의 변경으로 해결
- 기존 코드 패턴 유지
- Chrome Extension 베스트 프랙티스 준수

**8. 해결책 검토**
- `.claude/lessons-learned.md`와 일치하는지
- Critical 기능 손상 없는지
- 새로운 버그 발생 가능성 없는지

### Phase 4: 구현

**9. 코드 수정**
- Edit 툴 사용하여 정확한 수정
- 명확한 주석 추가
- 프로젝트 코딩 스타일 준수
- console.log는 개발용만, 프로덕션 제거

**10. 테스트**
- ✅ 이슈 재현 조건에서 테스트 → 해결 확인
- ✅ 엣지 케이스 확인
- ✅ 기존 기능 영향 없는지 확인
- ✅ Chrome Extension 리로드 후 재테스트

**11. 검증**
```bash
# Critical 기능 검증
npm run verify-all

# 브라우저 콘솔 에러 확인
# chrome://extensions/ → 리로드 → DevTools 확인
```

### Phase 5: 완료

**12. 커밋 및 PR**
```bash
# 변경사항 커밋
git add .
git commit -m "Fix: [이슈 간단 설명]

- 원인: [근본 원인]
- 해결: [해결 방법]
- 테스트: [테스트 결과]

Fixes #[이슈번호]"

# 푸시
git push -u origin fix/issue-[번호]-[설명]
```

**13. 문서화**
- `.claude/lessons-learned.md` 업데이트
  - 문제 설명
  - 해결 방법
  - 검증 방법
  - 2번째 발생이면 CRITICAL로 마킹

## Chrome Extension 특화 체크리스트

**Manifest V3 관련:**
- [ ] Service worker 변경 시 chrome://serviceworker-internals/ 확인
- [ ] Permissions 변경 없는지 확인
- [ ] CSP(Content Security Policy) 위반 없는지

**Message Passing:**
- [ ] chrome.runtime.sendMessage 응답 처리
- [ ] window.postMessage origin 검증
- [ ] Listener 중복 등록 방지

**Storage:**
- [ ] chrome.storage.local quota 초과 방지
- [ ] 민감 정보 암호화

**Performance:**
- [ ] Content script 주입 타이밍 최적화
- [ ] 불필요한 DOM 조작 최소화
- [ ] 메모리 누수 방지

## 출력 형식

```
🔍 이슈 분석:
- 이슈 #[번호]: [제목]
- 증상: [사용자가 겪는 문제]
- 재현: [재현 단계]

🎯 근본 원인:
- [파일:라인] - [원인 설명]

✅ 해결 방법:
- [수정 내용 1]
- [수정 내용 2]

🧪 테스트 결과:
- ✅ 이슈 재현 조건 → 해결 확인
- ✅ 엣지 케이스 테스트 통과
- ✅ npm run verify-all 통과 (5/5)

📝 문서화:
- lessons-learned.md 업데이트 완료
```

**핵심 철학: 빠른 해결보다 유지보수 가능한 솔루션을 우선시합니다.**
