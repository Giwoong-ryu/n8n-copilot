# N8N DOM 통합 완벽 가이드

> Chrome Extension에서 Vue.js 기반 n8n 페이지를 안정적으로 제어하기 위한 상세 구현 계획

**작성일**: 2025-11-02
**대상**: n8n AI Copilot Chrome Extension
**기술 스택**: Vue.js 3, Chrome Extension Manifest V3, MutationObserver

---

## 📋 목차

1. [n8n 아키텍처 분석](#1-n8n-아키텍처-분석)
2. [Vue.js 리액티브 시스템 이해](#2-vuejs-리액티브-시스템-이해)
3. [안정적인 DOM 선택자 전략](#3-안정적인-dom-선택자-전략)
4. [MutationObserver 구현](#4-mutationobserver-구현)
5. [입력 필드 값 쓰기 (Vue 트리거)](#5-입력-필드-값-쓰기)
6. [에러 처리 및 복구](#6-에러-처리-및-복구)
7. [테스트 시나리오](#7-테스트-시나리오)
8. [버전 호환성 대응](#8-버전-호환성-대응)

---

## 1. n8n 아키텍처 분석

### 1.1 기술 스택

```
n8n (Frontend)
├─ Vue.js 3 (Composition API)
├─ Pinia (상태 관리)
├─ Element Plus (UI 컴포넌트)
└─ TypeScript
```

### 1.2 주요 컴포넌트 구조

```
App.vue
├─ WorkflowCanvas.vue (캔버스 영역)
│   ├─ CanvasNode.vue (개별 노드)
│   └─ CanvasEdge.vue (연결선)
├─ NodeDetailsView.vue (노드 설정 패널)
│   ├─ ParameterInput.vue (입력 필드)
│   ├─ CodeEditor.vue (코드 에디터)
│   └─ ExpressionEditor.vue (표현식 에디터)
└─ MainSidebar.vue (좌측 사이드바)
```

### 1.3 DOM 구조 특징

**특징 1: Shadow DOM 미사용**
- n8n은 Shadow DOM을 사용하지 않음
- `document.querySelector()`로 직접 접근 가능

**특징 2: 동적 클래스명**
- Vue Scoped CSS로 인해 해시값 포함: `node-item_abc123`
- 부분 일치 선택자 필수: `[class*="node-item"]`

**특징 3: data-test-id 적극 활용**
- 테스트 자동화를 위해 `data-test-id` 속성 사용
- 가장 안정적인 선택자

**특징 4: Vue DevTools 전용 속성**
- `__vueParentComponent`: Vue 인스턴스 참조
- `__v_model`: v-model 바인딩 정보

---

## 2. Vue.js 리액티브 시스템 이해

### 2.1 Vue 3의 Reactivity

Vue 3는 **Proxy 기반 리액티브 시스템** 사용:

```javascript
// Vue 내부적으로 이렇게 동작
const state = reactive({
  nodeSettings: {
    url: 'https://api.example.com',
    method: 'GET'
  }
});

// 값 변경 시 자동으로 UI 업데이트
state.nodeSettings.url = 'https://new-url.com'; // ✅ 자동 감지
```

### 2.2 외부에서 값 변경 시 문제

**문제**: Extension에서 DOM을 직접 수정하면 Vue가 감지하지 못함

```javascript
// ❌ 이렇게 하면 Vue가 모름
element.value = 'new value';

// ✅ 이벤트를 발생시켜야 Vue가 인식
element.dispatchEvent(new Event('input', { bubbles: true }));
```

### 2.3 v-model 바인딩 이해

n8n의 입력 필드는 대부분 `v-model` 사용:

```vue
<template>
  <input v-model="nodeParameters.url" />
</template>
```

이는 내부적으로:

```vue
<input
  :value="nodeParameters.url"
  @input="nodeParameters.url = $event.target.value"
/>
```

**결론**: `input` 이벤트를 트리거하면 Vue가 자동으로 상태 업데이트

---

## 3. 안정적인 DOM 선택자 전략

### 3.1 선택자 우선순위

```javascript
// 우선순위 1: data-test-id (가장 안정적)
const element = document.querySelector('[data-test-id="parameter-input-url"]');

// 우선순위 2: 특정 속성
const element = document.querySelector('[data-name="url"]');

// 우선순위 3: 부분 클래스명 일치
const element = document.querySelector('[class*="parameter-input"]');

// 우선순위 4: 구조 기반 (최후의 수단)
const element = document.querySelector('.ndv-panel input[type="text"]');
```

### 3.2 Fallback 선택자 패턴

```javascript
class SafeSelector {
  static find(selectors) {
    for (const selector of selectors) {
      const element = document.querySelector(selector);
      if (element) {
        console.log(`✅ Found with: ${selector}`);
        return element;
      }
    }
    console.warn('⚠️ Element not found with any selector');
    return null;
  }
}

// 사용 예시
const nodePanel = SafeSelector.find([
  '[data-test-id="node-parameters-panel"]',
  '[data-test-id="ndv-parameters"]',
  '.ndv-panel',
  '[class*="NodeSettings"]'
]);
```

### 3.3 동적 선택자 검증

```javascript
class SelectorValidator {
  static validate(element, expectedType) {
    if (!element) return false;

    // 보이는지 확인
    if (element.offsetParent === null) {
      console.warn('⚠️ Element is hidden');
      return false;
    }

    // 타입 확인
    if (expectedType && element.tagName.toLowerCase() !== expectedType) {
      console.warn(`⚠️ Expected ${expectedType}, got ${element.tagName}`);
      return false;
    }

    return true;
  }
}
```

---

## 4. MutationObserver 구현

### 4.1 기본 구현

```javascript
class N8NPageObserver {
  constructor() {
    this.observer = null;
    this.callbacks = {
      nodePanelOpened: [],
      nodePanelClosed: [],
      nodeSelected: [],
      inputFieldAdded: []
    };
  }

  start() {
    this.observer = new MutationObserver((mutations) => {
      this.handleMutations(mutations);
    });

    this.observer.observe(document.body, {
      childList: true,      // 자식 노드 추가/제거 감지
      subtree: true,        // 모든 하위 요소 감지
      attributes: true,     // 속성 변경 감지
      attributeFilter: ['class', 'style', 'data-selected']
    });

    console.log('✅ MutationObserver started');
  }

  handleMutations(mutations) {
    for (const mutation of mutations) {
      // 노드 설정 패널 열림 감지
      if (mutation.type === 'childList') {
        mutation.addedNodes.forEach(node => {
          if (node.nodeType === 1) { // Element node
            if (this.isNodePanel(node)) {
              this.trigger('nodePanelOpened', node);
            }
          }
        });
      }

      // 노드 선택 감지 (클래스 변경)
      if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
        const target = mutation.target;
        if (target.classList.contains('selected')) {
          this.trigger('nodeSelected', target);
        }
      }
    }
  }

  isNodePanel(element) {
    return element.matches && (
      element.matches('[data-test-id*="ndv"]') ||
      element.matches('.ndv-panel') ||
      element.matches('[class*="NodeSettings"]')
    );
  }

  on(eventName, callback) {
    if (this.callbacks[eventName]) {
      this.callbacks[eventName].push(callback);
    }
  }

  trigger(eventName, data) {
    if (this.callbacks[eventName]) {
      this.callbacks[eventName].forEach(cb => cb(data));
    }
  }

  stop() {
    if (this.observer) {
      this.observer.disconnect();
      console.log('🛑 MutationObserver stopped');
    }
  }
}
```

### 4.2 사용 예시

```javascript
const pageObserver = new N8NPageObserver();

pageObserver.on('nodePanelOpened', (panel) => {
  console.log('📂 Node panel opened:', panel);

  // 입력 필드 찾기
  setTimeout(() => {
    const inputs = panel.querySelectorAll('input, textarea');
    console.log(`Found ${inputs.length} input fields`);
  }, 100); // Vue 렌더링 대기
});

pageObserver.on('nodeSelected', (node) => {
  console.log('🎯 Node selected:', node);
});

pageObserver.start();
```

### 4.3 성능 최적화

```javascript
// Debounce로 과도한 콜백 방지
class OptimizedObserver extends N8NPageObserver {
  constructor() {
    super();
    this.debounceTimers = {};
  }

  trigger(eventName, data) {
    // 100ms 이내 중복 이벤트 무시
    if (this.debounceTimers[eventName]) {
      clearTimeout(this.debounceTimers[eventName]);
    }

    this.debounceTimers[eventName] = setTimeout(() => {
      super.trigger(eventName, data);
    }, 100);
  }
}
```

---

## 5. 입력 필드 값 쓰기

### 5.1 Vue 리액티브 트리거 전체 프로세스

```javascript
class VueInputWriter {
  /**
   * Vue.js의 리액티브 시스템을 올바르게 트리거하면서 값 입력
   * @param {HTMLElement} element - 입력 요소
   * @param {string|number} value - 입력할 값
   */
  static async setValue(element, value) {
    if (!element) {
      throw new Error('Element not found');
    }

    console.log(`✍️ Writing value to ${element.tagName}:`, value);

    // 1단계: 포커스 (Vue가 사용자 상호작용으로 인식)
    element.focus();
    await this.wait(10);

    // 2단계: 기존 값 선택 (사용자가 전체 선택하는 것처럼)
    if (element.select) {
      element.select();
    }
    await this.wait(10);

    // 3단계: 값 설정 (여러 방식 시도)
    const valueString = String(value);

    // 3-1: Native setter 사용
    const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
      window.HTMLInputElement.prototype,
      'value'
    ).set;
    nativeInputValueSetter.call(element, valueString);

    // 3-2: Vue의 v-model을 위한 이벤트
    element.dispatchEvent(new Event('input', { bubbles: true, cancelable: true }));
    await this.wait(10);

    // 3-3: 변경 확정 이벤트
    element.dispatchEvent(new Event('change', { bubbles: true, cancelable: true }));
    await this.wait(10);

    // 4단계: 포커스 해제 (입력 완료 시뮬레이션)
    element.blur();
    element.dispatchEvent(new Event('blur', { bubbles: true }));
    await this.wait(10);

    // 5단계: Vue 인스턴스 직접 업데이트 (추가 보험)
    this.updateVueInstance(element, valueString);

    // 6단계: 검증
    const finalValue = element.value;
    if (finalValue === valueString) {
      console.log('✅ Value successfully written');
      return true;
    } else {
      console.warn(`⚠️ Value mismatch: expected "${valueString}", got "${finalValue}"`);
      return false;
    }
  }

  /**
   * Vue 인스턴스에 직접 접근해서 값 업데이트
   */
  static updateVueInstance(element, value) {
    try {
      // Vue 3 방식
      if (element.__vueParentComponent) {
        const vueComponent = element.__vueParentComponent;

        // emit 시도
        if (vueComponent.emit) {
          vueComponent.emit('update:modelValue', value);
          vueComponent.emit('input', value);
        }

        // props 직접 수정 시도
        if (vueComponent.props) {
          vueComponent.props.modelValue = value;
        }

        console.log('🎯 Vue instance updated');
      }

      // Vue 2 방식 (하위 호환)
      if (element.__vue__) {
        element.__vue__.$emit('input', value);
      }
    } catch (error) {
      console.log('⚠️ Could not update Vue instance directly:', error.message);
    }
  }

  /**
   * 비동기 대기 유틸리티
   */
  static wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
```

### 5.2 다양한 입력 타입 처리

```javascript
class SmartInputWriter extends VueInputWriter {
  static async setValueSmart(element, value) {
    const tagName = element.tagName.toLowerCase();
    const type = element.type;

    switch (tagName) {
      case 'input':
        return await this.handleInput(element, value, type);

      case 'textarea':
        return await this.handleTextarea(element, value);

      case 'select':
        return await this.handleSelect(element, value);

      default:
        if (element.contentEditable === 'true') {
          return await this.handleContentEditable(element, value);
        }
        console.warn(`⚠️ Unsupported element type: ${tagName}`);
        return false;
    }
  }

  static async handleInput(element, value, type) {
    switch (type) {
      case 'checkbox':
        element.checked = Boolean(value);
        element.dispatchEvent(new Event('change', { bubbles: true }));
        return true;

      case 'number':
        return await this.setValue(element, Number(value));

      default:
        return await this.setValue(element, value);
    }
  }

  static async handleTextarea(element, value) {
    // 코드 에디터일 수 있으므로 특별 처리
    if (element.classList.contains('ace_text-input')) {
      return this.handleAceEditor(element, value);
    }
    return await this.setValue(element, value);
  }

  static async handleSelect(element, value) {
    // 옵션 찾기
    const option = Array.from(element.options).find(opt =>
      opt.value === value || opt.text === value
    );

    if (option) {
      element.value = option.value;
      element.dispatchEvent(new Event('change', { bubbles: true }));
      console.log(`✅ Selected option: ${option.text}`);
      return true;
    } else {
      console.warn(`⚠️ Option not found for value: ${value}`);
      return false;
    }
  }

  static async handleContentEditable(element, value) {
    element.textContent = value;
    element.dispatchEvent(new Event('input', { bubbles: true }));
    return true;
  }

  static handleAceEditor(aceInput, value) {
    // ACE 에디터는 특별한 방식 필요
    try {
      const editor = window.ace?.edit(aceInput.closest('.ace_editor'));
      if (editor) {
        editor.setValue(value, -1); // -1: 커서를 시작 위치로
        console.log('✅ ACE editor updated');
        return true;
      }
    } catch (error) {
      console.warn('⚠️ ACE editor update failed:', error);
    }
    return false;
  }
}
```

---

## 6. 에러 처리 및 복구

### 6.1 재시도 메커니즘

```javascript
class ResilientWriter {
  static async setValueWithRetry(element, value, maxRetries = 3) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`🔄 Attempt ${attempt}/${maxRetries}`);

        const success = await SmartInputWriter.setValueSmart(element, value);

        if (success) {
          return { success: true, attempts: attempt };
        }

        // 실패 시 대기 후 재시도
        await this.wait(attempt * 100);

      } catch (error) {
        console.error(`❌ Attempt ${attempt} failed:`, error);

        if (attempt === maxRetries) {
          return {
            success: false,
            error: error.message,
            attempts: attempt
          };
        }

        await this.wait(attempt * 100);
      }
    }

    return { success: false, error: 'Max retries exceeded' };
  }

  static wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
```

### 6.2 에러 로깅 및 디버깅

```javascript
class DebugLogger {
  static log(level, message, data = {}) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      message,
      data,
      userAgent: navigator.userAgent,
      url: window.location.href
    };

    // Console 출력
    console[level](message, data);

    // Local Storage에 저장 (디버깅용)
    this.saveToStorage(logEntry);
  }

  static saveToStorage(entry) {
    try {
      const logs = JSON.parse(localStorage.getItem('n8n-copilot-logs') || '[]');
      logs.push(entry);

      // 최대 100개까지만 저장
      if (logs.length > 100) {
        logs.shift();
      }

      localStorage.setItem('n8n-copilot-logs', JSON.stringify(logs));
    } catch (error) {
      console.warn('⚠️ Could not save log to storage:', error);
    }
  }

  static exportLogs() {
    const logs = localStorage.getItem('n8n-copilot-logs');
    const blob = new Blob([logs], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `n8n-copilot-logs-${Date.now()}.json`;
    a.click();
  }
}
```

---

## 7. 테스트 시나리오

### 7.1 단위 테스트

```javascript
// 테스트: 선택자 검증
async function testSelector() {
  console.log('🧪 Test: Selector validation');

  const selectors = [
    '[data-test-id="ndv-parameters"]',
    '.ndv-panel',
    '[class*="NodeSettings"]'
  ];

  const element = SafeSelector.find(selectors);

  if (element) {
    console.log('✅ PASS: Element found');
    return true;
  } else {
    console.error('❌ FAIL: Element not found');
    return false;
  }
}

// 테스트: 값 쓰기
async function testValueWrite() {
  console.log('🧪 Test: Value write');

  const input = document.querySelector('input[type="text"]');
  if (!input) {
    console.error('❌ FAIL: No input found');
    return false;
  }

  const testValue = 'test-value-' + Date.now();
  const result = await ResilientWriter.setValueWithRetry(input, testValue);

  if (result.success && input.value === testValue) {
    console.log('✅ PASS: Value written correctly');
    return true;
  } else {
    console.error('❌ FAIL: Value not written');
    return false;
  }
}
```

### 7.2 통합 테스트

```javascript
async function integrationTest() {
  console.log('🧪 Integration Test: Full workflow');

  // 1. 노드 선택
  const node = document.querySelector('[data-node-type="n8n-nodes-base.httpRequest"]');
  if (!node) {
    console.error('❌ FAIL: No HTTP Request node found');
    return false;
  }

  node.click();
  await wait(500);

  // 2. 설정 패널 확인
  const panel = SafeSelector.find([
    '[data-test-id="ndv-parameters"]',
    '.ndv-panel'
  ]);

  if (!panel) {
    console.error('❌ FAIL: Node panel not opened');
    return false;
  }

  // 3. URL 필드 찾기
  const urlInput = panel.querySelector('[data-test-id="parameter-input-url"]');
  if (!urlInput) {
    console.error('❌ FAIL: URL input not found');
    return false;
  }

  // 4. 값 입력
  const result = await ResilientWriter.setValueWithRetry(
    urlInput,
    'https://api.example.com/test'
  );

  if (result.success) {
    console.log('✅ PASS: Integration test successful');
    return true;
  } else {
    console.error('❌ FAIL: Integration test failed');
    return false;
  }
}

function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
```

---

## 8. 버전 호환성 대응

### 8.1 n8n 버전 감지

```javascript
class N8NVersionDetector {
  static detect() {
    // 방법 1: Meta 태그
    const metaVersion = document.querySelector('meta[name="n8n-version"]');
    if (metaVersion) {
      return metaVersion.content;
    }

    // 방법 2: Global 변수
    if (window.n8n && window.n8n.version) {
      return window.n8n.version;
    }

    // 방법 3: API 호출
    try {
      const response = fetch('/rest/settings').then(res => res.json());
      return response.version;
    } catch (error) {
      console.warn('⚠️ Could not detect n8n version');
      return 'unknown';
    }
  }

  static isCompatible(version) {
    // 최소 지원 버전: 1.0.0
    const minVersion = '1.0.0';
    return this.compareVersions(version, minVersion) >= 0;
  }

  static compareVersions(v1, v2) {
    const parts1 = v1.split('.').map(Number);
    const parts2 = v2.split('.').map(Number);

    for (let i = 0; i < 3; i++) {
      if (parts1[i] > parts2[i]) return 1;
      if (parts1[i] < parts2[i]) return -1;
    }
    return 0;
  }
}
```

### 8.2 버전별 선택자 전략

```javascript
class VersionAwareSelector {
  static getSelectors(version, target) {
    const selectorMap = {
      'node-panel': {
        'default': [
          '[data-test-id="ndv-parameters"]',
          '.ndv-panel'
        ],
        '0.x': [
          '.node-settings-panel',
          '[class*="NodeSettings"]'
        ]
      },
      'input-field': {
        'default': [
          '[data-test-id^="parameter-input-"]',
          '.parameter-input input'
        ]
      }
    };

    const versionKey = version.startsWith('0.') ? '0.x' : 'default';
    return selectorMap[target][versionKey] || selectorMap[target]['default'];
  }
}
```

---

## 9. 실전 구현 체크리스트

### 9.1 구현 전 준비

- [ ] n8n 버전 확인
- [ ] Chrome DevTools로 실제 DOM 구조 분석
- [ ] data-test-id 속성 목록 작성
- [ ] Vue DevTools 설치 및 컴포넌트 구조 확인

### 9.2 코드 구현

- [ ] SafeSelector 클래스 구현
- [ ] N8NPageObserver 구현 및 테스트
- [ ] VueInputWriter 구현
- [ ] SmartInputWriter 구현
- [ ] ResilientWriter 구현
- [ ] DebugLogger 통합

### 9.3 테스트

- [ ] 단위 테스트 작성 및 실행
- [ ] 통합 테스트 실행
- [ ] 다양한 노드 타입에서 테스트
- [ ] 에러 시나리오 테스트
- [ ] 성능 테스트 (메모리 누수 확인)

### 9.4 배포 전 확인

- [ ] 에러 로깅 시스템 작동 확인
- [ ] 사용자 가이드 작성
- [ ] 버전 호환성 문서 작성
- [ ] 롤백 계획 수립

---

## 10. 참고 자료

### 10.1 공식 문서

- [Vue.js 3 Reactivity](https://vuejs.org/guide/extras/reactivity-in-depth.html)
- [n8n Source Code](https://github.com/n8n-io/n8n)
- [Chrome Extension MV3](https://developer.chrome.com/docs/extensions/mv3/)

### 10.2 유용한 도구

- Vue DevTools: https://devtools.vuejs.org/
- n8n Community: https://community.n8n.io/

### 10.3 트러블슈팅

**문제**: 값을 입력해도 UI에 반영 안 됨
→ **해결**: `input` 이벤트 후 `change`, `blur` 순서로 트리거

**문제**: MutationObserver가 너무 자주 실행됨
→ **해결**: Debounce 적용 또는 `attributeFilter` 사용

**문제**: 코드 에디터에 값 입력 안 됨
→ **해결**: ACE Editor API 사용

---

## 요약

이 가이드는 n8n Chrome Extension 개발을 위한 완벽한 구현 계획을 제공합니다.

**핵심 원칙**:
1. ✅ **안정적인 선택자**: data-test-id 우선
2. ✅ **Vue 리액티브 트리거**: 이벤트 순서 준수
3. ✅ **동적 감지**: MutationObserver 활용
4. ✅ **에러 복구**: 재시도 메커니즘
5. ✅ **버전 대응**: 버전별 전략

이제 이 가이드를 기반으로 `content.js`를 개선할 수 있습니다! 🚀
