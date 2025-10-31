# 🔧 기술 스펙

## 시스템 아키텍처

### 전체 구조

```
┌─────────────────────────────────────┐
│  웹사이트 (Next.js)                 │
│  - 랜딩/마케팅                      │
│  - 회원가입/로그인                  │
│  - 결제 (Stripe)                    │
│  - API 키 발급                      │
└──────────────┬──────────────────────┘
               │ HTTPS API
               ↓
┌─────────────────────────────────────┐
│  Chrome Extension                   │
│  ├── Content Script (N8N 조작)     │
│  ├── Background (API 중계)          │
│  └── Popup (설정)                   │
└─────────────────────────────────────┘
```

---

## Chrome Extension

### 파일 구조

```
extension/
├── manifest.json       # Extension 설정
├── content.js          # N8N DOM 조작 (120KB)
├── background.js       # API 호출 중계 (20KB)
├── popup.html          # 설정 UI (5KB)
├── popup.js            # 설정 로직 (15KB)
├── sidebar.css         # 스타일 (10KB)
└── icons/
    ├── icon16.png
    ├── icon48.png
    └── icon128.png
```

### manifest.json

```json
{
  "manifest_version": 3,
  "name": "N8N AI Copilot",
  "version": "0.1.0",
  "description": "AI로 N8N을 더 쉽게",
  
  "permissions": [
    "storage",
    "activeTab"
  ],
  
  "host_permissions": [
    "*://n8nryugw10.site/*",
    "*://*.n8n.io/*",
    "*://*.n8n.cloud/*",
    "https://api.anthropic.com/*"
  ],
  
  "content_scripts": [{
    "matches": [
      "*://n8nryugw10.site/*",
      "*://*.n8n.io/*",
      "*://*.n8n.cloud/*"
    ],
    "js": ["content.js"],
    "css": ["sidebar.css"]
  }],
  
  "background": {
    "service_worker": "background.js"
  },
  
  "action": {
    "default_popup": "popup.html",
    "default_icon": {
      "16": "icons/icon16.png",
      "48": "icons/icon48.png",
      "128": "icons/icon128.png"
    }
  }
}
```

---

## 핵심 클래스

### N8NController (content.js)

**역할**: N8N DOM 읽기/쓰기

```javascript
class N8NController {
  // N8N 페이지 감지
  detectN8NPage()
  
  // 현재 선택된 노드 가져오기
  getCurrentNode() → {
    type: "HTTP Request",
    name: "Kakao API",
    id: "node-123",
    settings: {...}
  }
  
  // 노드 설정 읽기
  getNodeSettings(nodeId) → {
    url: "https://api.kakao.com/...",
    method: "POST",
    body: "{...}"
  }
  
  // 노드 설정 쓰기
  setNodeSettings(nodeId, settings)
  
  // 에러 감지
  detectErrors() → [{
    nodeId: "node-123",
    message: "401 Unauthorized",
    code: -401
  }]
  
  // 워크플로우 구조 파악
  getWorkflowStructure() → {
    nodes: [...],
    connections: [...]
  }
}
```

### AISidebar (content.js)

**역할**: 사이드바 UI 관리

```javascript
class AISidebar {
  // UI 생성
  createUI()
  
  // 사용자 입력 처리
  async handleUserInput(message) {
    // 1. 컨텍스트 수집
    const context = this.collectContext()
    
    // 2. Background에 요청
    const response = await chrome.runtime.sendMessage({
      action: 'callClaude',
      prompt: this.buildPrompt(message, context)
    })
    
    // 3. 응답 표시
    this.displayResponse(response)
  }
  
  // 컨텍스트 수집
  collectContext() → {
    currentNode: {...},
    workflow: {...},
    errors: [...],
    userHistory: [...]
  }
  
  // 자동 입력
  autoFillSettings(settings)
}
```

---

## API 통신 구조

### CORS 해결 방식

```
Content Script → Background Script → Claude API
(N8N 조작)     (중계 역할)           (AI 응답)
```

### background.js

```javascript
// Claude API 호출
async function callClaudeAPI(prompt, apiKey) {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json'
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2048,
      messages: [{
        role: 'user',
        content: prompt
      }]
    })
  })
  
  return await response.json()
}

// 메시지 리스너
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'callClaude') {
    callClaudeAPI(request.prompt, request.apiKey)
      .then(sendResponse)
      .catch(error => sendResponse({ error: error.message }))
    return true // 비동기 응답
  }
})
```

---

## 데이터 흐름

### AI 요청 플로우

```
1. 사용자 입력
   ↓
2. 컨텍스트 수집
   - getCurrentNode()
   - getNodeSettings()
   - detectErrors()
   - getWorkflowStructure()
   ↓
3. 프롬프트 생성
   - 사용자 메시지
   - 노드 정보
   - 워크플로우 구조
   - 에러 정보
   ↓
4. Background로 전송
   chrome.runtime.sendMessage({
     action: 'callClaude',
     prompt: fullPrompt,
     apiKey: userApiKey
   })
   ↓
5. Claude API 호출
   ↓
6. 응답 처리
   - JSON 파싱
   - 설정값 추출
   - N8N에 자동 입력
```

---

## 웹사이트 (Phase 2 Week 3)

### 기술 스택

```
Frontend:
- Next.js 14 (App Router)
- React 18
- Tailwind CSS
- TypeScript

Backend:
- Next.js API Routes
- Supabase (Auth + DB)
- Stripe (결제)

배포:
- Vercel (Frontend)
- Supabase Cloud (Backend)
```

### Database 스키마

```sql
-- 사용자
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email TEXT UNIQUE,
  created_at TIMESTAMP,
  plan TEXT DEFAULT 'free'
);

-- API 키
CREATE TABLE api_keys (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  key TEXT UNIQUE,
  created_at TIMESTAMP,
  last_used TIMESTAMP
);

-- 크레딧
CREATE TABLE credits (
  user_id UUID PRIMARY KEY REFERENCES users(id),
  amount INT DEFAULT 10,
  updated_at TIMESTAMP
);

-- 사용 로그
CREATE TABLE usage_logs (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  action TEXT,
  cost INT,
  created_at TIMESTAMP
);

-- 구독
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  stripe_subscription_id TEXT,
  status TEXT,
  created_at TIMESTAMP
);
```

### API Endpoints

```
POST /api/auth/login
- 구글 OAuth 로그인

POST /api/auth/callback
- OAuth 콜백 처리

POST /api/generate
- Claude API 중계
- 크레딧 차감
- 사용 로그 기록

GET /api/credits/check
- 사용자 크레딧 조회

POST /api/subscribe
- Stripe Checkout Session 생성

POST /api/webhook/stripe
- Stripe Webhook 처리
```

---

## 보안

### API 키 보호

**웹사이트:**
```
- Supabase에 암호화 저장
- HTTPS only
- Rate limiting (100 req/hour)
- IP 기반 차단
```

**Extension:**
```
- chrome.storage.sync (자동 암호화)
- Content Security Policy
- 최소 권한 원칙
```

### 데이터 흐름 보안

```
Extension → HTTPS → Website API → Claude API
          (암호화)              (프록시)

- API 키 노출 방지
- CORS 정책 준수
- XSS 방어
```

---

## 성능 최적화

### Extension

```
- DOM 조작 최소화
- 이벤트 디바운싱
- 메모리 관리 (이벤트 리스너 정리)
- 코드 번들 최소화
```

### 웹사이트

```
- Next.js 정적 생성 (SSG)
- 이미지 최적화
- CDN 활용 (Vercel Edge)
- API Response 캐싱
```

---

## 모니터링

### 지표

```
Extension:
- 설치 수
- 일간 활성 사용자 (DAU)
- AI 요청 성공률
- 평균 응답 시간

Website:
- 회원가입 전환율
- 유료 전환율
- 이탈률
- LTV (생애 가치)
```

### 도구

```
- Google Analytics
- Sentry (에러 추적)
- Stripe Dashboard (결제)
- Supabase Analytics (DB)
```

---

## 개발 환경

### 필수 도구

```
- Node.js 18+
- Chrome Browser
- VS Code (권장)
- Git

Extension 개발:
- Chrome Developer Mode
- chrome://extensions/

Website 개발:
- Vercel CLI
- Supabase CLI
```

### 로컬 테스트

```bash
# Extension 테스트
1. Chrome → 확장 프로그램 관리
2. 개발자 모드 ON
3. "압축해제된 확장 프로그램 로드"
4. extension/ 폴더 선택

# Website 테스트
cd website
npm install
npm run dev
# http://localhost:3000
```

---

**다음**: docs/ 폴더의 상세 문서 참고
