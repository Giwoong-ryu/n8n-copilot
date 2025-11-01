# N8N Copilot 프로젝트 작업 지침

## 자동화된 작업 패턴

### 1. 복잡한 코드 작성 시 GitHub 우선 검색

**조건:** 다음 중 하나에 해당하는 경우 반드시 GitHub에서 검증된 코드를 먼저 검색
- 알고리즘 구현 (정렬, 검색, 문자열 매칭, 트리 순회 등)
- 외부 API 통합 (GitHub API, N8N API, REST 클라이언트 등)
- 성능 최적화가 필요한 코드
- 보안이 중요한 코드 (인증, 암호화 등)
- 디자인 패턴 구현 (싱글톤, 팩토리, 옵저버 등)

**프로세스:**
1. WebSearch로 GitHub 레포지토리 검색
   - 검색어: "github [기술명] [구현명] javascript best practice 2024"
   - 예: "github fuzzy string matching javascript 2024"
2. 상위 3개 레포지토리 확인 (stars, 최근 업데이트 날짜)
3. WebFetch로 코드 가져오기
4. 프로젝트에 맞게 수정 및 적용
5. 출처를 주석으로 명시

**예외:** 간단한 유틸리티 함수는 직접 작성 가능

### 2. 공식 문서 우선 확인 및 최신화

**조건:** 다음 라이브러리/API 사용 시 반드시 공식 문서 확인
- N8N (https://docs.n8n.io)
- Chrome Extension API (https://developer.chrome.com/docs/extensions)
- Gemini API (https://ai.google.dev/gemini-api/docs)
- OpenAI API (https://platform.openai.com/docs)
- Claude API (https://docs.anthropic.com)

**프로세스:**
1. WebSearch로 최신 공식 문서 찾기
   - 검색어: "[라이브러리명] official documentation 2024"
2. WebFetch로 관련 섹션 읽기
3. 현재 코드와 비교하여 deprecated API 확인
4. 최신 권장 사항 적용

**자동 확인 대상:**
- API 엔드포인트 변경
- 파라미터 이름 변경
- 권장 모델 버전 (Gemini, GPT 등)
- Breaking changes

### 3. 에러 발생 시 자동 디버깅 패턴

**순서:**
1. 콘솔 로그 먼저 확인 (사용자가 제공한 로그 분석)
2. 유사한 이슈 GitHub 검색
   - 검색어: "github [에러 메시지] [라이브러리명]"
3. Stack Overflow 검색 (최신 답변 우선)
4. 공식 문서에서 troubleshooting 섹션 확인
5. 해결책 적용 및 검증

### 4. 코드 최적화 기준

**항상 확인:**
- 불필요한 반복문 제거
- 캐싱 가능한 부분 식별
- 비동기 처리 최적화 (Promise.all 활용)
- 메모리 누수 가능성

**자동 개선:**
- 중복 코드는 함수로 추출
- 하드코딩된 값은 상수로 분리
- 매직 넘버는 명명된 상수로 교체

### 5. 보안 체크리스트

**자동 확인:**
- API 키 하드코딩 금지 (chrome.storage 사용)
- XSS 취약점 (innerHTML 대신 textContent)
- CSRF 방지
- 입력 검증

### 6. Git 커밋 메시지 패턴

**형식:**
```
[타입] 간단한 제목

- 상세 내용 (왜 변경했는지)
- 참조한 GitHub 레포/문서 URL
- Before/After 비교

Example improvement:
Before: [이전 문제]
After: [개선 결과]
```

**타입:**
- Fix: 버그 수정
- Improve: 기능 개선
- Add: 새 기능 추가
- Refactor: 리팩토링
- Optimize: 성능 최적화
- Update: 종속성/문서 업데이트

## 프로젝트 특화 규칙

### N8N 노드 정보
- Static docs는 재귀적으로 모든 서브디렉토리 포함
- YouTube 같은 서브 노드 반드시 포함 확인
- N8N API 우선, 실패 시 Static docs 사용

### 필드 매칭
- Fuzzy matching (Levenshtein distance) 사용
- 임계값: 0.5 (50% 이상 유사도)
- 빈 문자열 필드는 자동 스킵

### Chrome Extension
- Manifest V3 사용
- Background service worker 최적화
- Message passing 안정성 확인

## 작업 시작 전 체크리스트

- [ ] 이 작업에 GitHub 예제가 도움이 될까?
- [ ] 공식 문서 최신 버전 확인했나?
- [ ] 이전에 비슷한 문제 해결한 적 있나?
- [ ] 보안 취약점 가능성은?
- [ ] 성능 최적화 여지는?

## 응답 형식

**복잡한 코드 작성 시:**
```
1. GitHub 검색 중... (WebSearch)
   → 발견: [레포 이름] ([stars]개 stars)

2. 코드 가져오기... (WebFetch)
   → 소스: [URL]

3. 프로젝트에 맞게 수정...
   - [변경 사항 1]
   - [변경 사항 2]

4. 적용 완료
   → Before: [이전 문제]
   → After: [개선 결과]
```

**공식 문서 확인 시:**
```
1. 최신 문서 확인 중... (WebSearch)
   → 발견: [공식 문서 URL]

2. 관련 섹션 읽기... (WebFetch)
   → 최신 권장: [내용]

3. 현재 코드와 비교...
   - Deprecated: [옛날 방식]
   - 권장: [새 방식]

4. 업데이트 적용
```
