# 🤖 클로드 코드 작업 가이드

> **이 파일은 클로드 코드(Haiku 4.5)가 최초에 읽어야 하는 문서입니다**

## 📍 시작 전 필독 순서

```bash
# 1단계: 현재 상태 파악 (필수!)
cat CURRENT_STATUS.md

# 2단계: 이번 주 작업 확인
cat ROADMAP.md | grep -A 30 "Week 1"

# 3단계: 기술 스펙 참고 (필요시)
cat TECHNICAL_SPEC.md

# 4단계: 작업 완료 후
cat CURRENT_STATUS.md 
파일에 항상 업데이트
```

---

## 🎯 현재 작업: Week 1 - 기술 안정화

### 목표
Extension이 N8N에서 완벽하게 작동

### 작업 디렉토리
```
/home/claude/n8n-ai-copilot/extension/
```

### 주요 파일
- `manifest.json` - Extension 설정
- `background.js` - Claude API 호출 (CORS 해결)
- `content.js` - N8N DOM 조작 + 사이드바
- `popup.html` - 설정 화면
- `popup.js` - 설정 로직
- `sidebar.css` - UI 스타일

---

## ⚠️ 이모지 사용 금지

**모든 UI, 코드, 주석에서 이모지(emoji) 사용을 절대 금지합니다.**

```jsx
// ❌ 나쁜 예 - 이모지 사용
const tabs = [
  { label: '📊 통계', value: 'stats' },
  { label: '❤️ 북마크', value: 'bookmarks' }
];

<button>🔍 검색</button>
<div>✅ 완료</div>

// ✅ 좋은 예 - Lucide React 아이콘 또는 텍스트만
import { BarChart3, Heart, Search, Check } from 'lucide-react';

const tabs = [
  { label: '통계', icon: BarChart3 },
  { label: '북마크', icon: Heart }
];

<button className="flex items-center gap-2">
  <Search className="w-5 h-5" />
  검색
</button>
```

---

## 🚨 주의사항

### Haiku 모델 최적화
```
❌ 나쁜 예:
"먼저 파일 확인해줘"
"그 다음 수정해줘"
"결과 보여줘"

✅ 좋은 예:
"extension/background.js 확인하고
callClaudeAPI 함수 추가한 다음
변경사항 요약해줘"
```

### 파일 경로
```
항상 절대 경로 사용:
/home/claude/n8n-ai-copilot/extension/background.js

상대 경로 사용 금지:
./extension/background.js  ❌
```

### 에러 처리
```
모든 비동기 함수에 try-catch:
try {
  const result = await someFunction();
} catch (error) {
  console.error('에러:', error);
}
```

---

## 🎨 클린 코드 6대 패턴

> **적용 시점**: 빠른 프로토타입은 생략 가능 / 프로덕션 코드는 필수

### 📊 언제 적용하나요?

| 상황 | 적용 수준 | 우선순위 |
|------|----------|---------|
| 빠른 프로토타입/POC | 기본 체크리스트만 | 속도 우선 |
| 일반 기능 개발 | 패턴 1,2,3 | 필수 |
| 프로덕션 코드 | 전체 6개 패턴 | 완전 적용 |
| 리팩토링/코드 리뷰 | 전체 6개 + 자동 검증 | 품질 최우선 |

---

### 1️⃣ Follow Patterns (기존 패턴 준수) ⭐⭐⭐

**규칙**: 새 코드는 기존 코드와 동일한 패턴을 따른다

```javascript
// ❌ 나쁜 예: 기존 패턴 무시
// 기존 파일들: useAuth.js, useNotification.js, useWorkflow.js
// 새로 추가: authHelper.js  (패턴 불일치!)

// ✅ 좋은 예: 기존 패턴 준수
// 기존: useAuth.js, useNotification.js
// 신규: useApiKey.js  (동일한 use- 접두사)
```

**체크리스트**:
- [ ] 유사한 기존 파일 3개 이상 확인
- [ ] 폴더 구조 일관성 유지
- [ ] 네이밍 규칙 준수
- [ ] import 경로 스타일 동일
- [ ] 다르게 해야 한다면 주석으로 이유 명시

---

### 2️⃣ One Source (단일 출처) ⭐⭐⭐

**규칙**: 타입/상수/설정은 한 곳에만 정의

```javascript
// ❌ 나쁜 예: 중복 정의
// popup.js
const API_URL = 'https://api.anthropic.com/v1/messages';

// content.js
const API_URL = 'https://api.anthropic.com/v1/messages';

// ✅ 좋은 예: 단일 출처
// extension/config/constants.js
export const API = {
  CLAUDE_URL: 'https://api.anthropic.com/v1/messages',
  CLAUDE_VERSION: '2023-06-01',
  MAX_TOKENS: 2048
};

// 모든 파일에서 import
import { API } from './config/constants.js';
```

**체크리스트**:
- [ ] 중복 상수 발견 시 즉시 통합
- [ ] 모든 설정값은 `/config` 폴더에
- [ ] 타입은 `/types` 폴더에
- [ ] 사용처는 import로만 참조

---

### 3️⃣ Magic Values (매직 값 제거) ⭐⭐

**규칙**: 하드코딩된 값은 상수로 추출

```javascript
// ❌ 나쁜 예
if (status === 'active' && count > 100) {
  setTimeout(() => retry(), 3000);
}

// ✅ 좋은 예
const STATUS = { ACTIVE: 'active', INACTIVE: 'inactive' };
const LIMITS = { MAX_COUNT: 100, RETRY_DELAY_MS: 3000 };

if (status === STATUS.ACTIVE && count > LIMITS.MAX_COUNT) {
  setTimeout(() => retry(), LIMITS.RETRY_DELAY_MS);
}
```

**매직 값 기준**:
- 숫자: 0, 1, -1 외의 모든 숫자
- 문자열: 'success', 'error', 'pending' 같은 상태값
- 시간: 1000, 3000 같은 밀리초 값

---

### 4️⃣ SRP (단일 책임 원칙) ⭐⭐

**규칙**: 각 함수는 한 가지 일만

```javascript
// ❌ 나쁜 예: 여러 책임
async function processMessage(message) {
  if (!message) return;  // 검증
  showLoading(true);  // UI
  const response = await callAPI(message);  // API
  const formatted = formatResponse(response);  // 변환
  displayResult(formatted);  // UI
  showLoading(false);  // UI
}

// ✅ 좋은 예: 각각 분리
async function processMessage(message) {
  if (!validateMessage(message)) return;
  setLoadingState(true);
  const response = await fetchAIResponse(message);
  const formatted = formatResponse(response);
  displayResult(formatted);
  setLoadingState(false);
}

function validateMessage(message) {
  return message && message.trim().length > 0;
}

function setLoadingState(isLoading) {
  showLoading(isLoading);
}
```

**분리 기준**:
- 함수명에 "그리고(and)"가 들어가면 분리
- 5줄 이상의 로직이면 분리 고려
- 재사용 가능성이 있으면 분리

---

### 5️⃣ Shared (공통 코드 분리) ⭐

**규칙**: 2회 이상 사용되면 공통 모듈로

```javascript
// ❌ 나쁜 예: 중복 코드
// popup.js
async function getStoredApiKey() {
  const { apiKey } = await chrome.storage.sync.get('apiKey');
  return apiKey;
}

// content.js
async function getStoredApiKey() {
  const { apiKey } = await chrome.storage.sync.get('apiKey');
  return apiKey;
}

// ✅ 좋은 예: 공통 모듈
// extension/shared/storage.js
export async function getStoredApiKey() {
  const { apiKey } = await chrome.storage.sync.get('apiKey');
  return apiKey;
}

export async function setStoredApiKey(apiKey) {
  await chrome.storage.sync.set({ apiKey });
}

// 사용
import { getStoredApiKey } from './shared/storage.js';
```

**네이밍 규칙**:
- `use[Name]`: React hooks
- `get[Name]`: 데이터 조회
- `[name]Utils`: 유틸리티 함수 모음

**폴더 구조**:
```
extension/
├── shared/        # 전역 공통
│   ├── storage.js
│   └── api.js
└── utils/         # 도메인 특화
    ├── domUtils.js
    └── n8nUtils.js
```

---

### 6️⃣ Error Handling (에러 처리 전략) ⭐⭐

**규칙**: 모든 에러는 일관된 구조로

```javascript
// ❌ 나쁜 예
try {
  await callAPI();
} catch (e) {
  console.log(e);
}

// ✅ 좋은 예
try {
  const result = await callAPI(message);
  return result;
} catch (error) {
  // 1. 개발자용 로그
  console.error('Claude API 호출 실패', {
    message: message,
    error: error.message,
    timestamp: new Date().toISOString()
  });
  
  // 2. 사용자 메시지 (비기술적)
  displayError('AI 응답을 받을 수 없습니다. 잠시 후 다시 시도해주세요.');
  
  // 3. 에러 재발생
  throw new AppError('AI_CALL_FAILED', error.message);
}
```

**에러 처리 체크리스트**:
- [ ] 모든 async 함수에 try-catch
- [ ] console.error로 상세 로그
- [ ] 사용자에게는 이해하기 쉬운 메시지
- [ ] 기술 용어 사용 금지
- [ ] 에러 코드 부여

---

## 🔍 자동 검증 요청

프로덕션 준비나 리팩토링 시:

```bash
"6대 패턴 기준으로 검증해줘. 체크리스트 결과도 보여줘"
```

**클로드가 제공할 내용**:
1. ✅/❌ 각 패턴 통과 여부
2. 📋 개선이 필요한 부분 목록
3. 🔧 구체적인 수정 방안
4. ⚠️ 리스크와 트레이드오프

**예시 검증 결과**:
```
## 클린 코드 6대 패턴 검증 결과

### ✅ Follow Patterns (통과)
- 모든 utils 파일이 use- 접두사 사용

### ❌ One Source (개선 필요)
문제: API_URL이 3곳에 중복 정의
위치: popup.js:12, content.js:8, background.js:15
해결: extension/config/constants.js로 통합 필요

### ✅ Magic Values (통과)
- 모든 상수가 의미있는 이름으로 정의됨

### ⚠️ SRP (부분 개선)
문제: processMessage 함수가 5가지 역할 수행
제안: validateMessage, fetchResponse, displayResult로 분리

### ✅ Shared (통과)
- 공통 함수가 적절히 분리됨

### ❌ Error Handling (개선 필요)
문제: 3개 함수에서 에러 무시
위치: loadConfig:45, saveData:78, callAPI:102
해결: try-catch 추가 및 사용자 메시지 표시
```

---

## 📝 작업 완료 보고 양식

작업 완료 후 다음 형식으로 보고:

```
## 완료 작업
- [x] CORS 에러 해결 (background.js, content.js 수정)
- [x] UI 화면 전환 (popup.html, popup.js 수정)
- [x] 테스트 시나리오 5개 통과

## 변경 파일
- extension/background.js (API 호출 함수 추가)
- extension/content.js (fetch → sendMessage 변경)
- extension/popup.html (메인 화면 추가)
- extension/popup.js (화면 전환 로직)

## 테스트 결과
✅ CORS 에러 해결됨
✅ 화면 전환 정상 작동
✅ AI 응답 수신 성공
⚠️ 발견된 문제: [있다면 기재]

## 다음 작업
- [ ] N8N DOM 조작 개선
- [ ] 에러 처리 강화
```

---

## 📚 참고 문서

작업 중 막힐 때:
- **TECHNICAL_SPEC.md** - 기술 스펙 상세
- **ROADMAP.md** - 전체 계획
- **CURRENT_STATUS.md** - 현재 상태

---

## 🚀 작업 시작 명령어

```bash
# 기본 작업
cat CURRENT_STATUS.md && echo "\n다음 작업을 시작하겠습니다"

# 프로덕션 코드 작업
cat CURRENT_STATUS.md && echo "\n6대 패턴을 적용하여 작업하겠습니다"
```
