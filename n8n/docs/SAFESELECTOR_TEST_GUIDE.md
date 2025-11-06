# 🧪 SafeSelector 업데이트 후 완벽 테스트 가이드

> SafeSelector 시스템 업데이트 후 모든 기능이 제대로 작동하는지 확인하는 완벽 가이드
> 이 테스트 시퀀스를 따라하면 N8N 버전 변경에도 안전한지 검증할 수 있습니다.

---

## 📋 테스트 체크리스트

### ✅ Phase 1: 기본 설치 확인 (1분)

**테스트 단계**:
- [ ] Chrome 확장 프로그램 페이지에서 새로고침
- [ ] N8N 페이지 접속
- [ ] F12 → 콘솔 탭 열기
- [ ] "✅ N8N page detected!" 메시지 확인
- [ ] "✅ SafeSelector: Found" 로그들 확인

**예상 콘솔 출력**:
```
🔍 N8N AI Copilot - Detecting N8N page...
✅ SafeSelector: Found "canvas" with selector: [class*="canvas"]
✅ SafeSelector: Found "workflow" with selector: [class*="workflow"]
✅ SafeSelector: Found "app" with selector: #app
✅ N8N page detected!
💬 AI Copilot initialized
```

---

### ✅ Phase 2: 노드 감지 테스트 (2분)

#### 시나리오 1: 워크플로우에 노드 추가

**테스트 단계**:
1. N8N에서 새 워크플로우 생성
2. 노드 3개 추가 (예: Webhook, Code, HTTP Request)
3. 콘솔 입력:
```javascript
window.n8nReader.getAllNodes()
```

**예상 출력**:
```javascript
{
  all: [
    { type: "n8n-nodes-base.webhook", name: "Webhook", element: ... },
    { type: "n8n-nodes-base.code", name: "Code", element: ... },
    { type: "n8n-nodes-base.httpRequest", name: "HTTP Request", element: ... }
  ],
  types: ["n8n-nodes-base.webhook", "n8n-nodes-base.code", ...],
  count: 3
}
```

**콘솔 로그 확인**:
```
✅ SafeSelector: Found 3 "nodes" with selector: [class*="CanvasNode"]
```

---

### ✅ Phase 3: 설정 패널 읽기 테스트 (3분)

#### 시나리오 2: 노드 설정 읽기

**테스트 단계**:
1. HTTP Request 노드 클릭 (설정 패널 열림)
2. URL 입력: `https://api.example.com`
3. Authentication 토글 ON
4. 콘솔 입력:
```javascript
window.n8nReader.getNodeSettings()
```

**예상 출력**:
```javascript
{
  fields: [
    { name: "URL", value: "https://api.example.com", type: "text" },
    { name: "Method", value: "GET", type: "select" }
  ],
  toggles: [
    { name: "Authentication", checked: true, type: "toggle" }
  ],
  options: [...]
}
```

**콘솔 로그 확인**:
```
✅ SafeSelector: Found "settingsPanel" with selector: [class*="NodeSettings"]
```

**만약 로그가 다르면**:
```
✅ SafeSelector: Found "settingsPanel" with selector: .ndv-panel
```
→ N8N이 업데이트되어 첫 번째 셀렉터 실패, 두 번째 성공! ✅

---

### ✅ Phase 4: 워크플로우 분석 테스트 (5분)

#### 시나리오 3: 데이터 손실 감지

**워크플로우 구성**:
```
Webhook → Code (items[0] 사용) → HTTP Request
```

**Code 노드 내용**:
```javascript
return [
  {
    json: {
      message: items[0].json.message  // ❌ 첫 번째만 선택
    }
  }
];
```

**테스트 단계**:
1. Webhook에서 3개 아이템 전송
2. Execute Workflow 클릭
3. AI Copilot 사이드바 열기 (💬 아이콘)
4. "워크플로우 분석" 버튼 클릭

**예상 결과**:
```
🔍 워크플로우 분석 완료: 1개 문제 발견

🔴 Code 노드 (data_count_reduction)
   데이터 개수 감소: 3개 → 1개 (2개 손실)
   원인: items[0] 사용 - 첫 번째 아이템만 선택
   코드: `const message = items[0].json.message`
   💡 모든 아이템 처리하려면 items.map() 또는 반복문 사용

🔙 근본 원인 추적
문제 노드: HTTP Request
진짜 원인 노드: Code
  - items[0] 사용 - 첫 번째 아이템만 처리
```

**콘솔 로그 확인**:
```
🔄 Collecting execution data from all nodes...
✅ SafeSelector: Found 3 "nodes" with selector: [class*="CanvasNode"]
📍 [1/3] Checking node: Webhook
✅ SafeSelector: Found "settingsPanel" with selector: [class*="NodeSettings"]
✅ Panel opened
📍 [2/3] Checking node: Code
✅ SafeSelector: Found "codeEditor" with selector: .monaco-editor
📍 [3/3] Checking node: HTTP Request
🔍 Auto-detecting common issues...
✅ Auto-detected 1 issues
```

---

### ✅ Phase 5: 에러 분석 테스트 (3분)

#### 시나리오 4: 인증 에러 감지

**워크플로우 구성**:
```
Manual Trigger → HTTP Request (Bearer Auth 비어있음) → Kakao Talk
```

**테스트 단계**:
1. HTTP Request 노드 설정:
   - URL: `https://kapi.kakao.com/v2/api/talk/memo/default/send`
   - Authentication: ON
   - Auth Type: Bearer Token
   - Token: (비워둠) ❌
2. Execute Node 클릭 (에러 발생)
3. AI Copilot 사이드바 → "에러 분석" 버튼 클릭

**예상 결과**:
```
**에러**: Bearer Auth 토큰이 비어있어 401 Unauthorized 인증 실패

**해결**:
1. HTTP Request 노드 클릭 → Authentication 섹션 확인
2. Auth Type을 "OAuth2"로 변경 (카카오톡은 OAuth2 사용)
3. Client ID: 카카오 REST API 키 입력
4. Authorization URL: https://kauth.kakao.com/oauth/authorize
5. Access Token URL: https://kauth.kakao.com/oauth/token
```

**콘솔 로그 확인**:
```
⚠️ Analyzing errors with code...
✅ SafeSelector: Found 1 "errorPanel" with selector: [class*="ExecutionError"]
⚠️ Found 1 error(s)
```

---

### ✅ Phase 6: SafeSelector 디버깅 테스트 (2분)

#### 시나리오 5: 수동으로 SafeSelector 테스트

**콘솔에서 직접 테스트**:

```javascript
// 1. 설정 패널 찾기
window.safeSelector.find('settingsPanel')
// 출력: ✅ SafeSelector: Found "settingsPanel" with selector: [class*="NodeSettings"]
// 반환: <div class="NodeSettings-...">...</div>

// 2. 모든 노드 찾기
window.safeSelector.findAll('nodes')
// 출력: ✅ SafeSelector: Found 3 "nodes" with selector: [class*="CanvasNode"]
// 반환: NodeList(3) [div, div, div]

// 3. 에러 패널 찾기 (에러 없으면 null)
window.safeSelector.find('errorPanel')
// 출력: ❌ SafeSelector: Could not find "errorPanel" with any selector
// 반환: null

// 4. 커스텀 셀렉터 테스트
window.safeSelector.findWithCustom([
  '.custom-class',
  '[data-custom]',
  '#custom-id'
])
```

---

### ✅ Phase 7: 스트레스 테스트 (5분)

#### 시나리오 6: 많은 노드 처리

**테스트 단계**:
1. 워크플로우에 노드 10개 이상 추가
2. "워크플로우 분석" 버튼 클릭
3. 진행률 바 확인:
```
━━━━━━━━━░░░░░░░ 60% (6/10)
현재: HTTP Request
```
4. 취소 버튼 테스트 (❌ 취소)

**예상 콘솔 로그**:
```
🔄 Collecting execution data from all nodes...
✅ SafeSelector: Found 10 "nodes" with selector: [class*="CanvasNode"]
📍 [1/10] Checking node: Webhook
✅ Panel opened
📍 [2/10] Checking node: Code
✅ Panel opened
...
📍 [6/10] Checking node: HTTP Request
🛑 Collection cancelled at node 6/10  // 취소 버튼 클릭 시
```

---

## 🔍 문제 발생 시 체크리스트

### ❌ "SafeSelector: Could not find" 경고

**원인**: N8N이 대폭 업데이트되어 모든 fallback 실패

**해결 방법**:

1. 콘솔에서 수동 확인:
```javascript
document.querySelector('[class*="NodeSettings"]')  // null?
document.querySelector('.ndv-panel')  // null?
```

2. 실제 클래스 이름 확인:
   - 설정 패널 우클릭 → 검사
   - 클래스 이름 확인 (예: `NewPanelClass2025`)

3. 콘솔에서 임시 추가:
```javascript
window.safeSelector.addSelector('settingsPanel', '.NewPanelClass2025', 0)
```

4. 저에게 알려주시면 코드 업데이트!

---

### ❌ "Panel failed to open" 경고

**원인**: 노드 클릭 후 패널 열리는 시간 초과

**해결**:
- 정상 동작 (일부 노드는 느림)
- 해당 노드 스킵되고 다음 노드 계속 진행

---

### ❌ 분석 결과 없음

**원인**: 워크플로우 실행 안됨

**해결**:
1. 워크플로우 최소 1번 실행 필요
2. Execute Workflow 클릭
3. 노드에 실행 데이터 생성 확인 (초록색 체크)
4. 다시 워크플로우 분석

---

## 📊 성공 기준

**모든 테스트 통과 시**:

- ✅ Phase 1: 기본 설치 - SafeSelector 로그 보임
- ✅ Phase 2: 노드 감지 - 3개 노드 찾음
- ✅ Phase 3: 설정 읽기 - fields, toggles 출력
- ✅ Phase 4: 워크플로우 분석 - items[0] 문제 감지
- ✅ Phase 5: 에러 분석 - 인증 에러 감지
- ✅ Phase 6: 디버깅 - 수동 테스트 성공
- ✅ Phase 7: 스트레스 - 10개 노드 처리

**🎉 모든 기능 정상 작동!**

---

## 💡 빠른 테스트 (30초)

**시간 없으면 이것만**:

1. N8N 페이지 접속 → F12 콘솔
2. 콘솔 입력:
```javascript
// 모든 기능 한번에 테스트
console.clear();
console.log('1. 노드 찾기:', window.n8nReader.getAllNodes());
console.log('2. SafeSelector:', window.safeSelector);
window.safeSelector.find('settingsPanel');
window.safeSelector.findAll('nodes');
```

**에러 없고 ✅ 로그 나오면 성공!**

---

## 🎯 테스트 후 확인사항

### SafeSelector가 제대로 작동하는 증거:

1. **버전 안정성**:
   - 여러 셀렉터 중 하나가 성공적으로 매칭됨
   - 로그에서 어떤 셀렉터가 사용되었는지 확인 가능

2. **자동 Fallback**:
   - N8N 업데이트 시 첫 번째 셀렉터 실패해도
   - 자동으로 다음 셀렉터 시도
   - 최종적으로 요소 찾기 성공

3. **디버깅 편의성**:
   - 모든 시도가 콘솔에 로깅됨
   - 실패 시 어떤 셀렉터가 실패했는지 확인 가능
   - 새로운 셀렉터를 런타임에 추가 가능

---

**마지막 업데이트**: 2025-11-06
**관련 문서**: `SESSION_HISTORY.md`
