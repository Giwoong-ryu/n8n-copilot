# 프로젝트에서 배운 교훈 (절대 잊지 말 것)

이 파일은 **프로젝트 진행 중 겪었던 모든 문제와 해결책**을 기록합니다.
작업 시작 전 **반드시 이 파일을 먼저 읽어야 합니다.**

---

## 🔴 CRITICAL: 반복된 오류 (2회 이상)

### 1. Gemini 모델 변경 문제 ⚠️⚠️⚠️
**발생 횟수:** 3회
**문제:** `gemini-2.5-flash-lite` 모델이 코드에서 계속 사라짐
**원인:** 하드코딩 없이 변수로만 관리
**해결:**
- `config/models.js`에 하드코딩
- `scripts/verify-config.js`로 자동 검증
- 절대 삭제하지 말 것!

**하드코딩 위치:**
```javascript
// popup.html:289-294
<option value="gemini-2.5-flash-lite" selected>
  🚀 Gemini 2.5 Flash-Lite (무료 하루 1000번, 가장 빠름, 권장)
</option>

// config/models.js
{ value: 'gemini-2.5-flash-lite', isDefault: true, verified: true }
```

**검증 방법:**
```bash
npm run verify  # 반드시 통과해야 함
```

---

### 2. Static Docs - YouTube 노드 누락 ⚠️⚠️
**발생 횟수:** 2회
**문제:** Static docs에 YouTube 노드가 없음 (307개만 로드)
**원인:** 최상위 디렉토리만 가져옴, 서브디렉토리 무시
**해결:** 재귀적 디렉토리 탐색 구현

**하드코딩 위치:**
```javascript
// background.js:576-650
async function fetchN8NDocs() {
  // 재귀적으로 모든 서브디렉토리 탐색
  // Google/ 내부의 YouTube, Gmail 등도 가져옴
}
```

**검증 방법:**
```javascript
// background.js:733-739
const hasYouTube = docs.nodes.some(node => node.toLowerCase().includes('youtube'));
console.log(`🔍 YouTube in docs? ${hasYouTube}`);
// 반드시 true여야 함!
```

**절대 규칙:**
- 노드 수는 **600개 이상**이어야 함 (307개면 문제!)
- YouTube 노드는 **반드시 포함**되어야 함

---

### 3. 필드 매칭 실패 ⚠️⚠️
**발생 횟수:** 2회
**문제:** `feedUrl` vs `feedurl` 매칭 실패, 0/36 필드만 입력
**원인:** 정확한 문자열 비교만 사용
**해결:** Fuzzy matching (Levenshtein distance) 구현

**하드코딩 위치:**
```javascript
// content.js:886-984
// Levenshtein distance 알고리즘
// Source: https://gist.github.com/andrei-m/982927
function getEditDistance(a, b) { ... }
function findBestMatchingField(key, fields) { ... }
```

**검증 방법:**
```javascript
// 임계값 0.5 이상만 매칭
const threshold = 0.5;  // 절대 낮추지 말 것!
```

**절대 규칙:**
- 정확한 문자열 비교는 **절대 사용 금지**
- 항상 **fuzzy matching** 사용
- 임계값은 **0.5 이상** 유지

---

## 🟡 중요한 문제 (1회 발생)

### 4. N8N API 404 오류
**문제:** N8N Cloud는 `/api/v1/node-types` 엔드포인트 미지원
**해결:** Fallback to static docs
**하드코딩:** 없음 (fallback 로직으로 해결)

### 5. 연결 테스트 버튼 무한 로딩
**문제:** 타임아웃 없어서 실패 시 버튼 복구 안 됨
**해결:** 10초 타임아웃 추가 (AbortController)
**하드코딩 위치:** `popup.js:504-506`

### 6. 메타데이터 키 필터링 부족
**문제:** `parameters`, `type` 같은 메타데이터가 필드 매칭 시도
**해결:** 메타데이터 키 목록 하드코딩
**하드코딩 위치:** `content.js:760`

```javascript
const metadataKeys = ['parameters', 'type', 'nodeName', 'nodeType', 'version', 'id', 'name', 'position'];
```

---

## 📋 배운 규칙들

### 검색 시 최신 정보 우선

**절대 규칙:**
```javascript
// ❌ 나쁜 예
WebSearch("github fuzzy matching javascript")

// ✅ 좋은 예
WebSearch("github fuzzy matching javascript 2024")
WebSearch("github fuzzy matching javascript 2025")
```

**연도 키워드 필수:**
- 2024년 1월 이후: "2024" 포함
- 2025년 1월 이후: "2025" 포함
- "latest", "newest" 추가
- Deprecated API 확인 필수

### 공식 문서 확인 패턴

```javascript
// 1. 공식 문서 먼저
WebSearch("[라이브러리] official documentation 2024")

// 2. Migration guide 확인
WebSearch("[라이브러리] migration guide 2024")

// 3. Deprecated API 확인
WebSearch("[라이브러리] deprecated 2024")
```

### 같은 에러 2번 → 즉시 하드코딩

**프로세스:**
1. 첫 번째 발생: 로그에 기록
2. 두 번째 발생:
   - 즉시 하드코딩
   - `config/` 폴더에 설정 파일 생성
   - 검증 스크립트 추가
   - `lessons-learned.md`에 기록

**하드코딩 위치:**
- 설정값: `config/*.js`
- 검증: `scripts/verify-*.js`
- 문서: `.claude/lessons-learned.md`

---

## 🔧 검증 체크리스트 (작업 전/후)

### 작업 전
- [ ] `lessons-learned.md` 읽기 완료
- [ ] `npm run verify` 실행 → 통과 확인
- [ ] 최신 정보 확인 (2024/2025)
- [ ] 유사한 문제 이전에 겪었는지 확인

### 작업 후
- [ ] 새로운 문제 발견 시 이 파일에 기록
- [ ] 2회 이상 발생한 문제는 하드코딩
- [ ] 검증 스크립트 업데이트
- [ ] Git 커밋 메시지에 출처/이유 명시

---

## 📊 통계

**하드코딩된 Critical 항목:** 3개
1. Gemini 모델 설정
2. 재귀 디렉토리 탐색
3. Fuzzy matching 알고리즘

**검증 스크립트:** 1개
- `scripts/verify-config.js`

**반복 오류 방지:** 100%
- 모든 2회 이상 오류는 하드코딩으로 방지

---

## 🎯 앞으로의 규칙

1. **새로운 문제 발견 시:**
   - 즉시 이 파일에 기록
   - 재현 가능한 테스트 케이스 작성
   - 해결 후 검증 방법 명시

2. **같은 문제 2번 발생 시:**
   - 🚨 알람! 즉시 하드코딩 필요
   - `config/` 폴더에 설정 생성
   - 검증 스크립트 추가
   - 이 파일의 "CRITICAL" 섹션에 추가

3. **월 1회 리뷰:**
   - 모든 CRITICAL 항목 검증
   - `npm run verify` 실행
   - Deprecated API 확인

---

## 💡 참고: 절대 잊지 말아야 할 것

1. **Gemini 2.5 Flash-Lite = 사용자 선호 모델** (절대 삭제 금지)
2. **YouTube 노드 = 600+ 노드의 증거** (307개면 문제)
3. **Fuzzy Matching = 필드 매칭의 핵심** (정확한 비교 금지)
4. **검색 시 2024/2025 = 최신 정보** (없으면 옛날 정보)
5. **같은 오류 2번 = 하드코딩** (예외 없음)

---

**마지막 업데이트:** 2025-01-XX
**다음 리뷰:** 매월 1일
