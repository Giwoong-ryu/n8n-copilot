# 🔧 SafeSelector 셀렉터 수정 가이드

> SafeSelector가 "Settings panel not found" 에러를 발생시킬 때 해결 방법

---

## 🚨 문제 상황

```
❌ SafeSelector: Could not find "settingsPanel" with any selector
⚠️ Settings panel not found
```

**원인**: SafeSelector에 정의된 셀렉터들이 실제 N8N 사이트의 DOM 구조와 맞지 않음

---

## ✅ 해결 방법

### 1단계: 올바른 셀렉터 찾기 (5분)

#### 방법 A: 디버깅 스크립트 사용 (추천) ⭐

1. **N8N 페이지 접속**
   - `https://n8nryugw10.site` 접속
   - 워크플로우 열기

2. **노드 설정 패널 열기**
   - 아무 노드나 클릭 (예: HTTP Request, Code 등)
   - 오른쪽에 설정 패널이 열리는지 확인

3. **디버깅 스크립트 실행**
   - F12 (개발자 도구 열기) → Console 탭
   - 이 파일 열기: `n8n/docs/DEBUG_SELECTOR_FINDER.js`
   - 전체 내용 복사 → 콘솔에 붙여넣기 → Enter

4. **결과 확인**
   ```
   ✅ FOUND 1x: [class*="panel"] (panel)
      실제 클래스: "n8n-panel side-panel node-settings"
      태그: <aside>

   🎯 최종 추천 셀렉터:
   1. [class*="panel"]
      → 1개 요소 매칭

   💡 콘솔에서 테스트:
   window.safeSelector.addSelector('settingsPanel', '[class*="panel"]', 0)
   ```

5. **추천된 명령 실행**
   - 콘솔에 추천된 명령 복사 & 붙여넣기
   - 예:
   ```javascript
   window.safeSelector.addSelector('settingsPanel', '.n8n-panel', 0)
   ```

6. **즉시 테스트**
   ```javascript
   window.safeSelector.find('settingsPanel')
   // → <aside class="n8n-panel">...</aside> 반환되면 성공!
   ```

---

#### 방법 B: 수동으로 찾기

1. **노드 클릭하여 설정 패널 열기**

2. **설정 패널에서 우클릭 → 검사**
   - 개발자 도구의 Elements 탭이 열림
   - 설정 패널의 HTML 구조 확인

3. **부모 요소 찾기**
   - 설정 패널의 가장 바깥 요소 찾기
   - 보통 `<aside>`, `<div>`, `<section>` 등

4. **클래스 이름 확인**
   - 예시:
   ```html
   <aside class="n8n-panel node-settings-panel">
     ...
   </aside>
   ```

   → 셀렉터: `.n8n-panel` 또는 `[class*="n8n-panel"]`

5. **콘솔에서 테스트**
   ```javascript
   document.querySelector('.n8n-panel')
   // → <aside class="n8n-panel">... 반환되면 성공!
   ```

6. **SafeSelector에 추가**
   ```javascript
   window.safeSelector.addSelector('settingsPanel', '.n8n-panel', 0)
   ```

---

### 2단계: 영구적으로 수정하기

#### 임시 해결 (지금 당장)

콘솔에서 실행:
```javascript
// 올바른 셀렉터로 교체
window.safeSelector.addSelector('settingsPanel', '.실제-클래스명', 0)

// 테스트
window.safeSelector.find('settingsPanel')
```

#### 영구 해결 (코드 수정)

1. **content.js 파일 열기**
   ```bash
   # 로컬에서
   code n8n/content.js
   ```

2. **SafeSelector 클래스 찾기** (약 20줄)
   ```javascript
   settingsPanel: [
     '[class*="NodeSettings"]',  // ← 이 부분을 수정
     '[class*="node-settings"]',
     ...
   ]
   ```

3. **찾은 셀렉터를 맨 앞에 추가**
   ```javascript
   settingsPanel: [
     '.n8n-panel',               // ← 새로 찾은 셀렉터 (최우선)
     '[class*="n8n-panel"]',     // ← fallback
     '[class*="NodeSettings"]',  // 기존 셀렉터들
     '[class*="node-settings"]',
     '[data-test-id*="node-settings"]',
     '.ndv-panel',
     '[class*="ndv"]',
     '[class*="panel"][class*="side"]',
     'aside[class*="panel"]'
   ]
   ```

4. **Chrome 확장 프로그램 새로고침**
   - `chrome://extensions` 접속
   - N8N AI Copilot 찾기
   - 🔄 새로고침 버튼 클릭

5. **N8N 페이지 새로고침**
   - F5 또는 Ctrl+R
   - 콘솔 확인:
   ```
   ✅ SafeSelector: Found "settingsPanel" with selector: .n8n-panel
   ```

---

### 3단계: 다른 셀렉터도 확인

설정 패널 외에도 확인 필요:

#### ✅ Code Editor
```javascript
// 테스트
window.safeSelector.find('codeEditor')

// 실패하면 추가
window.safeSelector.addSelector('codeEditor', '.실제-에디터-클래스', 0)
```

#### ✅ Canvas Nodes
```javascript
// 테스트
window.safeSelector.findAll('nodes')

// 실패하면 추가
window.safeSelector.addSelector('nodes', '[data-node-type]', 0)
```

#### ✅ Error Panel
```javascript
// 에러 발생시킨 후 테스트
window.safeSelector.find('errorPanel')
```

---

## 📝 찾은 셀렉터 보고하기

올바른 셀렉터를 찾았다면 저에게 알려주세요:

**템플릿**:
```
SafeSelector 셀렉터 발견:

1. Settings Panel: `.n8n-panel`
2. Code Editor: `.monaco-editor` (정상 작동)
3. Canvas Nodes: `[data-id]`
4. Error Panel: `.error-display`

테스트 결과:
✅ settingsPanel 찾기 성공
✅ 노드 설정 읽기 성공
✅ 워크플로우 분석 정상 작동
```

이 정보를 받으면 content.js를 수정하여 다음 버전에 반영하겠습니다!

---

## 🎯 빠른 체크리스트

- [ ] N8N 페이지 접속
- [ ] 노드 클릭하여 설정 패널 열기
- [ ] F12 콘솔 열기
- [ ] DEBUG_SELECTOR_FINDER.js 스크립트 실행
- [ ] 추천된 셀렉터 확인
- [ ] `window.safeSelector.addSelector()` 실행
- [ ] `window.safeSelector.find('settingsPanel')` 테스트
- [ ] 성공하면 content.js 수정
- [ ] 확장 프로그램 새로고침
- [ ] N8N 페이지 새로고침 후 재테스트

---

## ❓ 자주 묻는 질문

### Q1: 디버깅 스크립트가 아무것도 찾지 못해요
**A**: 노드를 클릭하여 설정 패널이 실제로 열려있는지 확인하세요. 패널이 열려있지 않으면 찾을 수 없습니다.

### Q2: 셀렉터를 추가했는데도 안 돼요
**A**: 다음을 확인하세요:
1. 콘솔에 에러 없는지 확인
2. `window.safeSelector` 객체가 존재하는지 확인
3. 확장 프로그램이 제대로 로드되었는지 확인
4. 페이지 새로고침 (F5)

### Q3: 여러 개가 발견됐는데 어느 것을 사용해야 하나요?
**A**:
- 가장 **구체적인 것** 선택 (예: `.node-settings-panel` > `[class*="panel"]`)
- **요소 개수가 적은 것** 선택 (1-2개가 이상적)
- 콘솔에서 직접 테스트해보고 원하는 요소를 반환하는 것 선택

### Q4: 매번 콘솔에서 addSelector 해야 하나요?
**A**: 임시 테스트용입니다. 제대로 작동하면 content.js를 수정하여 영구적으로 적용하세요.

---

**마지막 업데이트**: 2025-11-06
**관련 문서**: `DEBUG_SELECTOR_FINDER.js`, `SESSION_HISTORY.md`
