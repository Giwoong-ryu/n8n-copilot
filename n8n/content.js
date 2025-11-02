/**
 * N8N AI Copilot - Content Script
 * N8N 페이지의 DOM을 읽고 조작하는 핵심 스크립트
 */

// ========================================
// 1. N8N 페이지 감지
// ========================================
function detectN8NPage() {
  console.log('🔍 N8N AI Copilot - Detecting N8N page...');
  
  // N8N 특유의 요소 찾기
  const indicators = {
    canvas: document.querySelector('[class*="canvas"]'),
    nodeView: document.querySelector('[class*="NodeView"]'),
    workflow: document.querySelector('[class*="workflow"]'),
    vueApp: document.querySelector('#app')
  };
  
  const isN8N = Object.values(indicators).some(el => el !== null);
  
  console.log('📊 Detection results:', indicators);
  
  if (isN8N) {
    console.log('✅ N8N page detected!');
    initializeAICopilot();
  } else {
    console.log('❌ Not an N8N page');
  }
  
  return isN8N;
}


// ========================================
// 1.5. 유틸리티 클래스 (Production-Ready Helpers)
// ========================================

/**
 * SafeSelector - Fallback 선택자 패턴
 * 여러 선택자를 우선순위대로 시도하여 가장 먼저 찾은 요소 반환
 */
class SafeSelector {
  /**
   * 여러 선택자를 시도하여 첫 번째로 찾은 요소 반환
   * @param {string[]} selectors - 우선순위순 선택자 배열
   * @param {Element} [context=document] - 검색 시작점
   * @returns {Element|null} 찾은 요소 또는 null
   */
  static find(selectors, context = document) {
    for (const selector of selectors) {
      try {
        const element = context.querySelector(selector);

        // 요소가 존재하고 보이는지 확인
        if (element && this.isVisible(element)) {
          console.log(`✅ SafeSelector found element with: ${selector}`);
          return element;
        }
      } catch (error) {
        console.warn(`⚠️ Invalid selector: ${selector}`, error.message);
      }
    }

    console.warn('⚠️ SafeSelector: No element found with any selector');
    return null;
  }

  /**
   * 여러 선택자로 모든 요소 찾기
   * @param {string[]} selectors - 선택자 배열
   * @param {Element} [context=document] - 검색 시작점
   * @returns {Element[]} 찾은 모든 요소
   */
  static findAll(selectors, context = document) {
    const elements = [];

    for (const selector of selectors) {
      try {
        const found = context.querySelectorAll(selector);
        elements.push(...Array.from(found).filter(el => this.isVisible(el)));
      } catch (error) {
        console.warn(`⚠️ Invalid selector: ${selector}`, error.message);
      }
    }

    console.log(`📋 SafeSelector found ${elements.length} elements`);
    return elements;
  }

  /**
   * 요소가 화면에 보이는지 확인
   * @param {Element} element - 확인할 요소
   * @returns {boolean} 보이면 true
   */
  static isVisible(element) {
    if (!element) return false;

    // display: none 또는 visibility: hidden 체크
    if (element.offsetParent === null) return false;

    // opacity: 0 체크
    const style = window.getComputedStyle(element);
    if (style.opacity === '0') return false;

    return true;
  }

  /**
   * 요소 검증 (존재 + 보임 + 타입)
   * @param {Element} element - 검증할 요소
   * @param {string} [expectedTag] - 예상 태그명 (소문자)
   * @returns {boolean} 유효하면 true
   */
  static validate(element, expectedTag = null) {
    if (!element) return false;
    if (!this.isVisible(element)) return false;

    if (expectedTag) {
      const actualTag = element.tagName.toLowerCase();
      if (actualTag !== expectedTag) {
        console.warn(`⚠️ Expected <${expectedTag}>, got <${actualTag}>`);
        return false;
      }
    }

    return true;
  }
}


/**
 * VueInputWriter - Vue.js 리액티브 시스템 호환 값 입력
 * 6단계 프로세스로 Vue가 변경사항을 감지하도록 보장
 */
class VueInputWriter {
  /**
   * Vue 리액티브 시스템을 올바르게 트리거하면서 값 입력
   * @param {HTMLElement} element - 입력 요소
   * @param {string|number} value - 입력할 값
   * @returns {Promise<boolean>} 성공 여부
   */
  static async setValue(element, value) {
    if (!element) {
      console.error('❌ VueInputWriter: Element not found');
      return false;
    }

    const valueString = String(value);
    console.log(`✍️ VueInputWriter: Writing "${valueString}" to <${element.tagName}>`);

    try {
      // ===== 1단계: Focus (사용자 상호작용 시작) =====
      element.focus();
      await this.wait(10);

      // ===== 2단계: Select (기존 값 선택) =====
      if (element.select && typeof element.select === 'function') {
        element.select();
        await this.wait(10);
      }

      // ===== 3단계: Native Setter로 값 설정 =====
      this.setNativeValue(element, valueString);
      await this.wait(10);

      // ===== 4단계: Input Event (Vue v-model 트리거) =====
      element.dispatchEvent(new Event('input', {
        bubbles: true,
        cancelable: true,
        composed: true
      }));
      await this.wait(10);

      // ===== 5단계: Change Event (변경 확정) =====
      element.dispatchEvent(new Event('change', {
        bubbles: true,
        cancelable: true
      }));
      await this.wait(10);

      // ===== 6단계: Blur (상호작용 종료) =====
      element.blur();
      element.dispatchEvent(new Event('blur', { bubbles: true }));
      await this.wait(10);

      // ===== 추가: Vue 인스턴스 직접 업데이트 시도 =====
      this.updateVueInstance(element, valueString);

      // ===== 검증: 값이 제대로 입력되었는지 확인 =====
      const finalValue = element.value || element.textContent;
      const success = finalValue === valueString;

      if (success) {
        console.log('✅ VueInputWriter: Value written successfully');
      } else {
        console.warn(`⚠️ VueInputWriter: Value mismatch. Expected "${valueString}", got "${finalValue}"`);
      }

      return success;

    } catch (error) {
      console.error('❌ VueInputWriter error:', error);
      return false;
    }
  }

  /**
   * Native Setter를 사용하여 값 설정
   * Vue가 감지하지 못하는 직접 할당 문제 해결
   */
  static setNativeValue(element, value) {
    const tagName = element.tagName.toLowerCase();

    try {
      if (tagName === 'input' || tagName === 'textarea') {
        // HTMLInputElement/HTMLTextAreaElement의 native setter 사용
        const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
          window.HTMLInputElement.prototype,
          'value'
        )?.set;

        const nativeTextAreaValueSetter = Object.getOwnPropertyDescriptor(
          window.HTMLTextAreaElement.prototype,
          'value'
        )?.set;

        const setter = tagName === 'input' ? nativeInputValueSetter : nativeTextAreaValueSetter;

        if (setter) {
          setter.call(element, value);
          console.log('🎯 Native setter used');
        } else {
          element.value = value;
        }
      } else {
        element.value = value;
      }
    } catch (error) {
      console.warn('⚠️ Native setter failed, using direct assignment:', error.message);
      element.value = value;
    }
  }

  /**
   * Vue 인스턴스에 직접 접근하여 값 업데이트
   */
  static updateVueInstance(element, value) {
    try {
      // Vue 3 방식
      if (element.__vueParentComponent) {
        const vueComponent = element.__vueParentComponent;

        if (vueComponent.emit) {
          vueComponent.emit('update:modelValue', value);
          vueComponent.emit('input', value);
        }

        if (vueComponent.props && vueComponent.props.modelValue !== undefined) {
          vueComponent.props.modelValue = value;
        }

        console.log('🎯 Vue 3 instance updated');
      }

      // Vue 2 하위 호환
      if (element.__vue__) {
        element.__vue__.$emit('input', value);
        console.log('🎯 Vue 2 instance updated');
      }
    } catch (error) {
      // Vue 인스턴스 접근 실패는 정상 (모든 요소가 Vue 컴포넌트는 아님)
      console.log('ℹ️ Could not access Vue instance (this is normal)');
    }
  }

  /**
   * 비동기 대기
   */
  static wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}


/**
 * ResilientWriter - 재시도 메커니즘
 * VueInputWriter를 래핑하여 실패 시 자동 재시도
 */
class ResilientWriter {
  /**
   * 재시도 메커니즘이 있는 값 쓰기
   * @param {HTMLElement} element - 입력 요소
   * @param {string|number} value - 입력할 값
   * @param {number} [maxRetries=3] - 최대 재시도 횟수
   * @returns {Promise<Object>} 결과 객체 {success, attempts, error}
   */
  static async setValueWithRetry(element, value, maxRetries = 3) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`🔄 Attempt ${attempt}/${maxRetries}`);

        const success = await VueInputWriter.setValue(element, value);

        if (success) {
          return {
            success: true,
            attempts: attempt
          };
        }

        // 실패 시 대기 후 재시도
        if (attempt < maxRetries) {
          const waitTime = attempt * 100; // 100ms, 200ms, 300ms
          console.log(`⏳ Waiting ${waitTime}ms before retry...`);
          await this.wait(waitTime);
        }

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

    return {
      success: false,
      error: 'Max retries exceeded',
      attempts: maxRetries
    };
  }

  static wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}


// ========================================
// 2. N8N DOM 읽기 클래스
// ========================================
class N8NReader {
  
  // 현재 선택된 노드 정보 읽기
  getSelectedNode() {
    // SafeSelector 사용으로 안정성 향상
    const selectedNode = SafeSelector.find([
      '[data-node-selected="true"]',
      '[class*="selected"]',
      '.canvas-node.selected',
      '[data-selected="true"]'
    ]);

    if (!selectedNode) {
      return null;
    }

    return {
      element: selectedNode,
      type: this.getNodeType(selectedNode),
      name: this.getNodeName(selectedNode),
      id: this.getNodeId(selectedNode)
    };
  }
  
  getNodeType(nodeElement) {
    const typeElement = nodeElement.querySelector('[class*="type"]');
    return typeElement ? typeElement.textContent.trim() : 'unknown';
  }
  
  getNodeName(nodeElement) {
    const nameElement = nodeElement.querySelector('[class*="name"]');
    return nameElement ? nameElement.textContent.trim() : 'Unnamed';
  }
  
  getNodeId(nodeElement) {
    return nodeElement.getAttribute('data-node-id') || 
           nodeElement.getAttribute('id') || 
           'unknown';
  }
  
  // 노드 설정 패널의 입력 필드 읽기
  getNodeSettings() {
    // SafeSelector로 설정 패널 찾기 (우선순위순)
    const settingsPanel = SafeSelector.find([
      '[data-test-id="node-parameters-panel"]',
      '[data-test-id="ndv-parameters"]',
      '.ndv-panel',
      '[class*="NodeSettings"]',
      '[class*="node-settings"]'
    ]);

    if (!settingsPanel) {
      return [];
    }

    const inputs = settingsPanel.querySelectorAll('input, select, textarea');

    return Array.from(inputs).map(input => ({
      element: input,
      name: this.getInputName(input),
      value: input.value,
      type: input.type || input.tagName.toLowerCase()
    }));
  }
  
  getInputName(inputElement) {
    const label = inputElement.closest('label') || 
                  inputElement.previousElementSibling;
    
    return label ? 
           label.textContent.trim() : 
           inputElement.name || 
           inputElement.placeholder ||
           'unknown';
  }
  
  // 에러 메시지 감지
  detectErrors() {
    const errors = document.querySelectorAll([
      '[class*="error"]',
      '[class*="Error"]',
      '[class*="issue"]',
      '.el-message--error'
    ].join(','));
    
    if (errors.length === 0) {
      return [];
    }
    
    console.log('⚠️ Found errors:', errors);
    
    return Array.from(errors).map(errorEl => ({
      element: errorEl,
      message: errorEl.textContent.trim(),
      type: this.getErrorType(errorEl)
    }));
  }
  
  getErrorType(errorElement) {
    const text = errorElement.textContent.toLowerCase();
    if (text.includes('credential')) return 'credential';
    if (text.includes('connection')) return 'connection';
    if (text.includes('required')) return 'validation';
    return 'general';
  }
  
  // 전체 워크플로우 구조 읽기
  getWorkflowStructure() {
    const nodes = document.querySelectorAll('[class*="CanvasNode"], [data-node-type]');
    
    return {
      nodeCount: nodes.length,
      nodes: Array.from(nodes).map(node => ({
        type: this.getNodeType(node),
        name: this.getNodeName(node),
        id: this.getNodeId(node)
      }))
    };
  }
}


// ========================================
// 3. N8N DOM 쓰기 클래스 (Upgraded)
// ========================================
class N8NWriter {

  /**
   * 입력 필드에 값 쓰기 (VueInputWriter 사용)
   * @param {HTMLElement} fieldElement - 입력 요소
   * @param {string|number} value - 입력할 값
   * @param {boolean} [useRetry=true] - 재시도 사용 여부
   * @returns {Promise<Object>} 결과 객체 {success, attempts}
   */
  async setFieldValue(fieldElement, value, useRetry = true) {
    if (!fieldElement) {
      console.error('❌ Field element not found');
      return { success: false, error: 'Element not found' };
    }

    // ResilientWriter 사용 (재시도 메커니즘)
    if (useRetry) {
      return await ResilientWriter.setValueWithRetry(fieldElement, value);
    }

    // 단일 시도
    const success = await VueInputWriter.setValue(fieldElement, value);
    return { success, attempts: 1 };
  }

  /**
   * 여러 필드에 자동으로 값 채우기
   * @param {Object} suggestions - 필드명:값 매핑 객체
   * @returns {Promise<Object>} 결과 {filledCount, totalFields, results}
   */
  async autoFillFields(suggestions) {
    const reader = new N8NReader();
    const fields = reader.getNodeSettings();

    if (fields.length === 0) {
      console.warn('⚠️ No input fields found');
      return { filledCount: 0, totalFields: 0, results: [] };
    }

    let filledCount = 0;
    const results = [];

    for (const [fieldName, value] of Object.entries(suggestions)) {
      // 필드 이름으로 매칭 (대소문자 무시)
      const field = fields.find(f =>
        f.name.toLowerCase().includes(fieldName.toLowerCase()) ||
        fieldName.toLowerCase().includes(f.name.toLowerCase())
      );

      if (field) {
        console.log(`🎯 Matching field found: "${field.name}" for "${fieldName}"`);

        const result = await this.setFieldValue(field.element, value);

        if (result.success) {
          filledCount++;
          results.push({
            field: field.name,
            value: value,
            status: 'success',
            attempts: result.attempts
          });
        } else {
          results.push({
            field: field.name,
            value: value,
            status: 'failed',
            error: result.error
          });
        }
      } else {
        console.warn(`⚠️ No matching field for: ${fieldName}`);
        results.push({
          field: fieldName,
          value: value,
          status: 'not_found'
        });
      }
    }

    console.log(`✅ Auto-filled ${filledCount}/${fields.length} fields`);
    return {
      filledCount,
      totalFields: fields.length,
      results
    };
  }
}


// ========================================
// 4. AI 기능 - 에러 분석
// ========================================
async function analyzeError(errorData) {
  console.log('🔍 Analyzing error:', errorData);
  
  const prompt = `N8N 워크플로우에서 다음 에러가 발생했습니다:

노드: ${errorData.nodeName || 'Unknown'}
노드 타입: ${errorData.nodeType || 'Unknown'}
에러 메시지: ${errorData.errorMessage}

다음 형식으로 간단명료하게 답변해주세요:

1. 원인 (한 문장)
2. 해결 방법 (최대 3개, 각 한 줄)

답변은 한국어로 작성해주세요.`;

  const result = await callClaudeAPI(
    prompt,
    'You are an expert N8N workflow automation assistant. Provide concise, actionable solutions.'
  );
  
  return result;
}


// ========================================
// 5. AI 기능 - JSON 자동 생성
// ========================================
async function generateJSON(requestData) {
  console.log('📝 Generating JSON:', requestData);
  
  const prompt = `N8N의 ${requestData.nodeType} 노드를 위한 JSON을 생성해주세요.

요구사항:
${requestData.requirements}

${requestData.example ? `예시:\n${requestData.example}` : ''}

응답은 반드시 유효한 JSON만 출력하세요. 설명은 포함하지 마세요.`;

  const result = await callClaudeAPI(
    prompt,
    'You are a JSON generation expert. Always respond with valid, properly formatted JSON only. No explanations.'
  );
  
  if (result.success) {
    try {
      const jsonMatch = result.content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const json = JSON.parse(jsonMatch[0]);
        return {
          success: true,
          json: json
        };
      }
    } catch (error) {
      return {
        error: true,
        message: 'Failed to parse generated JSON',
        rawContent: result.content
      };
    }
  }
  
  return result;
}


// ========================================
// 6. AI 기능 - 설정 자동 채우기
// ========================================
async function autoFillSettings(contextData) {
  console.log('⚙️ Auto-filling settings:', contextData);
  
  const prompt = `N8N 워크플로우에서 다음 노드를 설정하려고 합니다:

노드 타입: ${contextData.nodeType}
현재 설정 필드들:
${JSON.stringify(contextData.fields, null, 2)}

사용자 요청: ${contextData.userRequest}

각 필드에 적절한 값을 JSON 형식으로 제안해주세요.
응답 형식:
{
  "fieldName1": "suggested value 1",
  "fieldName2": "suggested value 2"
}

응답은 반드시 유효한 JSON만 출력하세요.`;

  const result = await callClaudeAPI(
    prompt,
    'You are an N8N workflow configuration expert. Suggest appropriate field values based on node type and user requirements.'
  );
  
  if (result.success) {
    try {
      const jsonMatch = result.content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const suggestions = JSON.parse(jsonMatch[0]);
        return {
          success: true,
          suggestions: suggestions
        };
      }
    } catch (error) {
      return {
        error: true,
        message: 'Failed to parse suggestions',
        rawContent: result.content
      };
    }
  }
  
  return result;
}


// ========================================
// 7. Background Script와 통신
// ========================================
async function callClaudeAPI(message, systemPrompt = '', context = {}) {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage(
      {
        action: 'callClaude',
        message: message,
        systemPrompt: systemPrompt,
        context: context
      },
      (response) => {
        if (chrome.runtime.lastError) {
          resolve({
            error: true,
            message: chrome.runtime.lastError.message
          });
        } else {
          resolve(response);
        }
      }
    );
  });
}


// ========================================
// 8. 초기화
// ========================================
function initializeAICopilot() {
  console.log('🚀 Initializing N8N AI Copilot...');

  // Reader와 Writer 인스턴스 생성
  window.n8nReader = new N8NReader();
  window.n8nWriter = new N8NWriter();
  console.log('✅ Reader and Writer initialized');

  // 사이드바 초기화 (sidebar.js에서 처리)
  console.log('🔍 Checking if initializeSidebar exists:', typeof initializeSidebar);

  if (typeof initializeSidebar === 'function') {
    console.log('🎨 Calling initializeSidebar...');
    initializeSidebar();
  } else {
    console.error('❌ initializeSidebar function not found!');
  }

  // 에러 자동 감지 (5초마다)
  window.errorCheckInterval = setInterval(() => {
    if (window.n8nReader) {
      const errors = window.n8nReader.detectErrors();
      if (errors.length > 0 && window.sendMessageToSidebar) {
        window.sendMessageToSidebar({
          type: 'error-detected',
          errors: errors
        });
      }
    }
  }, 5000);

  console.log('✅ N8N AI Copilot initialized successfully!');
}


// ========================================
// 9. 페이지 로드 시 실행 (개선된 감지)
// ========================================

// 즉시 첫 시도
console.log('📦 N8N AI Copilot Content Script loaded');
console.log('🔍 Starting N8N page detection...');

// 방법 1: 즉시 실행
detectN8NPage();

// 방법 2: 짧은 지연 후 재시도 (SPA 로딩 대기)
setTimeout(() => {
  console.log('🔄 Retrying page detection after 500ms...');
  detectN8NPage();
}, 500);

// 방법 3: 조금 더 긴 지연 후 재시도
setTimeout(() => {
  console.log('🔄 Retrying page detection after 1500ms...');
  detectN8NPage();
}, 1500);

// 방법 4: MutationObserver로 DOM 변화 감지
window.n8nPageObserver = new MutationObserver((mutations) => {
  // N8N 특유의 요소가 추가되었는지 확인
  const hasN8NElements =
    document.querySelector('[class*="canvas"]') ||
    document.querySelector('[class*="NodeView"]') ||
    document.querySelector('[class*="workflow"]') ||
    document.querySelector('#app');

  if (hasN8NElements) {
    console.log('🎯 N8N elements detected by MutationObserver!');
    detectN8NPage();
    window.n8nPageObserver.disconnect(); // 감지 후 observer 중지
  }
});

// body가 존재하면 observer 시작
if (document.body) {
  window.n8nPageObserver.observe(document.body, {
    childList: true,
    subtree: true
  });
  console.log('👀 MutationObserver started');
} else {
  console.log('⚠️ document.body not ready for MutationObserver');
}


// ========================================
// 10. iframe과의 메시지 통신
// ========================================

// iframe으로부터 메시지 수신
window.addEventListener('message', async (event) => {
  // 보안: 자기 자신으로부터의 메시지만 허용
  if (event.source !== window) return;
  if (!event.data || !event.data.type) return;

  console.log('📨 Message received in content.js:', event.data);

  if (event.data.type === 'send-message') {
    const userMessage = event.data.message;
    console.log('💬 User message:', userMessage);

    try {
      // N8N 페이지 컨텍스트 수집
      const context = collectPageContext();
      console.log('📄 Page context collected:', context);

      // Claude API 호출 (background.js를 통해)
      const response = await callClaudeAPI(userMessage, context);
      console.log('✅ Claude API response received');

      // iframe으로 응답 전송
      sendMessageToIframe({
        type: 'assistant-response',
        message: response
      });

    } catch (error) {
      console.error('❌ Error processing message:', error);
      sendMessageToIframe({
        type: 'error',
        message: '메시지 처리 중 오류가 발생했습니다: ' + error.message
      });
    }
  }

  // 페이지 분석 요청 처리
  if (event.data.type === 'analyze-page') {
    console.log('🔍 Page analysis requested');

    try {
      const pageAnalysis = analyzeN8NPage();
      console.log('📊 Page analysis complete:', pageAnalysis);

      sendMessageToIframe({
        type: 'page-analysis-result',
        data: pageAnalysis
      });
    } catch (error) {
      console.error('❌ Error analyzing page:', error);
      sendMessageToIframe({
        type: 'error',
        message: '페이지 분석 중 오류가 발생했습니다: ' + error.message
      });
    }
  }
});

// iframe으로 메시지 전송
function sendMessageToIframe(data) {
  const iframe = document.querySelector('#n8n-ai-copilot-sidebar iframe');
  if (iframe && iframe.contentWindow) {
    console.log('📤 Sending message to iframe:', data);
    iframe.contentWindow.postMessage(data, '*');
  } else {
    console.error('❌ Iframe not found');
  }
}

// 페이지 컨텍스트 수집
function collectPageContext() {
  const context = {
    url: window.location.href,
    workflowName: document.title,
    errors: window.n8nReader ? window.n8nReader.detectErrors() : [],
    selectedNode: null
  };

  // 선택된 노드 정보 수집 (가능한 경우)
  try {
    const selectedNodeElement = document.querySelector('[class*="selected"]');
    if (selectedNodeElement) {
      context.selectedNode = {
        type: selectedNodeElement.getAttribute('data-node-type') || 'unknown',
        name: selectedNodeElement.textContent || 'unknown'
      };
    }
  } catch (e) {
    console.log('⚠️ Could not collect selected node info:', e);
  }

  return context;
}

// N8N 페이지 상세 분석
function analyzeN8NPage() {
  console.log('🔍 Analyzing N8N page...');

  // 1. 기본 정보
  const basicInfo = {
    url: window.location.href,
    title: document.title,
    timestamp: new Date().toISOString()
  };

  // 2. N8N 주요 요소 감지
  const n8nElements = {
    canvas: !!document.querySelector('[class*="canvas"]'),
    canvasSelector: findElement('[class*="canvas"]'),

    nodeView: !!document.querySelector('[class*="NodeView"]'),
    nodeViewSelector: findElement('[class*="NodeView"]'),

    workflow: !!document.querySelector('[class*="workflow"]'),
    workflowSelector: findElement('[class*="workflow"]'),

    settings: !!document.querySelector('[class*="settings"]'),
    settingsSelector: findElement('[class*="settings"]'),

    node: !!document.querySelector('[class*="node"]'),
    nodeSelector: findElement('[class*="node"]'),

    selected: !!document.querySelector('[class*="selected"]'),
    selectedSelector: findElement('[class*="selected"]')
  };

  // 3. 모든 고유 클래스명 수집 (처음 100개)
  const allClasses = new Set();
  document.querySelectorAll('[class]').forEach(el => {
    el.className.split(' ').forEach(cls => {
      if (cls.trim()) allClasses.add(cls.trim());
    });
  });
  const classList = Array.from(allClasses).slice(0, 100);

  // 4. data-* 속성 수집
  const dataAttributes = new Set();
  document.querySelectorAll('[data-test-id]').forEach(el => {
    const testId = el.getAttribute('data-test-id');
    if (testId) dataAttributes.add(`data-test-id="${testId}"`);
  });
  const dataAttrList = Array.from(dataAttributes).slice(0, 50);

  // 5. 입력 필드 감지
  const inputs = document.querySelectorAll('input, textarea, select');
  const inputInfo = {
    totalInputs: inputs.length,
    visibleInputs: Array.from(inputs).filter(el => el.offsetParent !== null).length,
    inputTypes: [...new Set(Array.from(inputs).map(el => el.type || el.tagName.toLowerCase()))]
  };

  // 6. 에러 감지
  const errors = window.n8nReader ? window.n8nReader.detectErrors() : [];

  return {
    basicInfo,
    n8nElements,
    classList,
    dataAttributes: dataAttrList,
    inputInfo,
    errors: {
      count: errors.length,
      messages: errors.map(e => e.message).slice(0, 5)
    },
    summary: {
      isN8NPage: n8nElements.canvas || n8nElements.workflow,
      hasActiveNode: n8nElements.selected,
      hasOpenSettings: n8nElements.settings,
      hasErrors: errors.length > 0
    }
  };
}

// 요소를 찾고 선택자 정보 반환
function findElement(selector) {
  const el = document.querySelector(selector);
  if (!el) return null;

  return {
    tagName: el.tagName.toLowerCase(),
    className: el.className,
    id: el.id,
    dataAttrs: Array.from(el.attributes)
      .filter(attr => attr.name.startsWith('data-'))
      .map(attr => `${attr.name}="${attr.value}"`)
  };
}

// Claude API 호출 (background.js를 통해)
async function callClaudeAPI(userMessage, context) {
  console.log('🚀 Calling Claude API via background...');

  // N8N 최신 문서 불러오기
  const n8nDocs = await chrome.storage.local.get('n8nDocs');
  const docsInfo = n8nDocs.n8nDocs;

  let docsSection = '';
  if (docsInfo && docsInfo.nodes) {
    const updateDate = new Date(docsInfo.lastUpdated).toLocaleDateString('ko-KR');
    docsSection = `
**N8N 실시간 노드 목록** (자동 업데이트):
📅 마지막 업데이트: ${updateDate}
📦 사용 가능한 노드: ${docsInfo.nodes.length}개

주요 노드 (A-Z):
${docsInfo.nodes.slice(0, 30).map(node => `- \`${node}\``).join('\n')}

... 외 ${docsInfo.nodes.length - 30}개 노드

최신 버전: ${docsInfo.version}
`;
  } else {
    docsSection = `
⚠️ N8N 문서를 아직 로드하지 못했습니다.
공식 문서를 참고하세요: https://docs.n8n.io
`;
  }

  const systemPrompt = `당신은 N8N 워크플로우 자동화 전문가입니다 (2025년 10월 기준 최신 버전).
${docsSection}
사용자의 워크플로우 작성, 에러 해결, JSON 데이터 생성 등을 도와주세요.

**N8N 최신 정보 (2025년 10월)**:
- **N8N 버전**: v1.60+ (2025년 10월 최신 릴리스)
- **주요 노드**:
  * HTTP Request (REST API 호출)
  * Webhook (외부 이벤트 수신)
  * Code (JavaScript/Python 실행)
  * IF/Switch (조건 분기)
  * Set/Edit Fields (데이터 변환)
  * Loop Over Items (반복 처리)
  * Split/Merge (데이터 분할/병합)
  * AI Agent (LLM 통합 에이전트)

- **최신 AI 통합**:
  * OpenAI GPT-4o, GPT-4 Turbo, o1-preview
  * Anthropic Claude 3.7 Sonnet (2025년 최신)
  * Google Gemini 2.5 Flash, Gemini 2.0 Flash (Gemini 1.x는 2025년 9월 종료)
  * Mistral AI Large 2, Cohere Command R+

- **주요 서비스 연동**:
  * 데이터베이스: Supabase, PostgreSQL, MongoDB, MySQL
  * 협업 도구: Notion, Airtable, Google Sheets, Slack
  * CRM: HubSpot, Salesforce, Pipedrive
  * 이메일: Gmail, Outlook, SendGrid

- **한국 서비스 지원**:
  * 카카오톡 (Kakao Talk Business API)
  * 네이버 (Naver Cloud, CLOVA API)
  * 쿠팡 (Coupang Partners API)
  * 배달의민족 (Baemin API - 제한적)
  * 토스페이먼츠 (Toss Payments API)

- **OAuth2 지원**: Google, Facebook, Kakao, Naver, GitHub, Microsoft

**현재 페이지 컨텍스트**:
- URL: ${context.url}
- 워크플로우: ${context.workflowName}
- 에러 개수: ${context.errors.length}개
${context.selectedNode ? `- 선택된 노드: ${context.selectedNode.name} (${context.selectedNode.type})` : ''}

**최신 정보 우선 원칙**:
⚠️ 당신이 가진 지식(2025년 1월)이 오래되었을 수 있습니다.
- N8N은 매일 업데이트되므로, 불확실한 경우 "최신 N8N 문서를 확인하세요" 안내
- 노드 이름, API 변경사항은 공식 문서 링크 제공: https://docs.n8n.io
- 새로운 노드나 기능은 "2025년 10월 기준 최신 버전에서 확인 필요" 명시

**자동 입력 기능** (매우 중요):
🤖 사용자가 "자동으로 입력해줘" 또는 "노드 설정 채워줘"라고 요청하면:
1. JSON 형식으로 노드 파라미터 생성
2. 반드시 다음 형식으로 응답:
   \`\`\`json-autofill
   {
     "url": "https://api.example.com",
     "method": "GET",
     "authentication": "none"
   }
   \`\`\`
3. \`\`\`json-autofill 코드 블록을 사용하면 자동으로 N8N 노드에 입력됩니다!

**답변 전략 (매우 중요)**:
🎯 **기본 원칙: 토큰 절약 + N8N 전문성**

1. **처음 질문**: 간단한 단계 개요만 (3-5줄)
   - ⚠️ **매우 중요**: 각 단계는 **반드시 줄바꿈**해서 작성!
   - 각 단계만 번호로 나열 (버튼 등 HTML 코드 작성 금지!)
   - ✅ **올바른 예시** (각 단계마다 줄바꿈):
     \`\`\`
     뉴스 수집 워크플로우:

     1. \`Schedule Trigger\` - 자동 실행
     2. \`RSS Feed Read\` - 뉴스 수집
     3. \`Code\` - 데이터 변환
     4. \`OpenAI\` - 요약
     5. \`Slack\` - 전송

     💡 특정 단계를 자세히 알고 싶으면 번호를 말씀해주세요.
     \`\`\`
   - ❌ **잘못된 예시** (한 줄로 붙여쓰기 - 절대 금지):
     \`\`\`
     1. \`Schedule Trigger\` - 자동 실행 2. \`RSS Feed Read\` - 뉴스 수집
     \`\`\`
   - ❌ **절대 금지**: HTML \`<button>\` 태그 직접 작성
   - ✅ **필수 규칙**:
     * 제목 다음에 빈 줄 1개
     * 각 단계는 새로운 줄에 작성
     * 마지막 안내문구 앞에 빈 줄 1개

2. **상세 요청 감지**: 사용자가 다음과 같이 물으면 상세 설명
   - "자세히 알려줘", "상세하게", "코드 예시", "설정 방법"
   - "1번 알려줘", "RSS 설정 방법" 등 특정 단계 질문

3. **N8N 전문가 모드**:
   - ❌ 일반적인 AI 답변 금지 (예: "물론이죠, 도와드리겠습니다")
   - ✅ N8N 워크플로우 노드와 설정만 언급
   - ✅ 구체적인 노드 이름 사용 (\`HTTP Request\`, \`Code\`, \`IF\`)

4. **답변 길이 제어**:
   - 첫 답변: 최대 100자 이내 (단계 나열만)
   - 상세 요청: 해당 단계만 설명 (전체 X)
   - 코드 예시: 최소한의 작동 코드만

**답변 형식**:
- 단계는 번호 리스트로
- 노드 이름은 \`백틱\`으로
- 코드는 \`\`\`json 또는 \`\`\`javascript
- 불필요한 인사말, 장황한 설명 제거

**금지 사항**:
- ❌ "안녕하세요", "도와드리겠습니다" 같은 인사
- ❌ N8N과 무관한 일반 지식
- ❌ 처음부터 모든 설정 상세 설명
- ❌ 긴 서론이나 배경 설명

짧고 명확하게, N8N 워크플로우만 답변하세요.`;

  // background.js로 메시지 전송
  return new Promise((resolve, reject) => {
    try {
      chrome.runtime.sendMessage(
        {
          action: 'callClaude',
          message: userMessage,
          systemPrompt: systemPrompt,
          context: context
        },
        (response) => {
          if (chrome.runtime.lastError) {
            console.error('❌ Runtime error:', chrome.runtime.lastError);

            // Extension context invalidated 에러 처리
            if (chrome.runtime.lastError.message.includes('Extension context invalidated')) {
              console.log('🔄 Extension이 업데이트되었습니다. 3초 후 페이지를 자동 새로고침합니다...');

              // iframe에 새로고침 알림 먼저 전송
              sendMessageToIframe({
                type: 'error',
                message: '확장 프로그램이 업데이트되었습니다.\n\n🔄 3초 후 페이지가 자동으로 새로고침됩니다...'
              });

              // 3초 후 자동 새로고침
              setTimeout(() => {
                window.location.reload();
              }, 3000);

              reject(new Error('확장 프로그램이 업데이트되었습니다. 페이지를 새로고침합니다.'));
            } else {
              reject(new Error(chrome.runtime.lastError.message));
            }
            return;
          }

          if (!response) {
            console.error('❌ No response from background');
            reject(new Error('Background script에서 응답이 없습니다. 페이지를 새로고침해주세요.'));
            return;
          }

          if (response.error) {
            console.error('❌ API error:', response.message);
            reject(new Error(response.message));
            return;
          }

          console.log('✅ Claude API response received');
          resolve(response.content);
        }
      );
    } catch (error) {
      console.error('❌ Exception in callClaudeAPI:', error);
      reject(new Error('확장 프로그램 연결 오류가 발생했습니다. 페이지를 새로고침해주세요.'));
    }
  });
}

console.log('✅ Message listener initialized');


// ========================================
// 7. 노드 자동 입력 기능
// ========================================

// N8N 노드 패널 감지
function detectNodePanel() {
  // N8N의 노드 설정 패널 선택자 (여러 버전 대응)
  const selectors = [
    '[data-test-id="node-parameters"]',
    '[data-test-id="parameter-input"]',
    '.node-settings',
    '[class*="NodeSettings"]',
    '[class*="ParameterInput"]',
    '.ndv-panel'
  ];

  for (const selector of selectors) {
    const panel = document.querySelector(selector);
    if (panel) {
      console.log('✅ Node panel detected:', selector);
      return panel;
    }
  }

  console.warn('⚠️ Node panel not found');
  return null;
}

// 입력 필드 찾기 및 분석
function findInputFields(container) {
  const inputs = [];

  // 모든 입력 요소 찾기
  const inputElements = container.querySelectorAll(
    'input[type="text"], input[type="number"], input[type="email"], input[type="url"], ' +
    'textarea, select, [contenteditable="true"], [data-test-id*="parameter"]'
  );

  inputElements.forEach(element => {
    // 라벨 찾기 (여러 방법 시도)
    let label = '';

    // 1. 가장 가까운 라벨 요소
    const labelElement = element.closest('[class*="parameter"]')?.querySelector('label');
    if (labelElement) {
      label = labelElement.textContent.trim();
    }

    // 2. data-test-id에서 추출
    if (!label) {
      const testId = element.getAttribute('data-test-id');
      if (testId) {
        label = testId.replace('parameter-input-', '').replace(/-/g, ' ');
      }
    }

    // 3. placeholder 사용
    if (!label && element.placeholder) {
      label = element.placeholder;
    }

    // 파라미터 이름
    const paramName = element.getAttribute('data-name') ||
                     element.getAttribute('name') ||
                     element.id ||
                     label.toLowerCase().replace(/\s+/g, '_');

    inputs.push({
      element: element,
      label: label,
      name: paramName,
      type: element.tagName.toLowerCase(),
      inputType: element.type || 'text',
      value: element.value || element.textContent,
      isVisible: element.offsetParent !== null
    });
  });

  // 보이는 필드만 필터링
  const visibleInputs = inputs.filter(input => input.isVisible);

  console.log(`📋 Found ${visibleInputs.length} visible input fields (${inputs.length} total)`);
  return visibleInputs;
}

// AI로부터 받은 JSON을 필드에 자동 입력 (Upgraded with VueInputWriter)
async function autoFillNodeFields(jsonData) {
  console.log('🤖 Auto-filling node fields with data:', jsonData);

  // SafeSelector로 패널 찾기
  const panel = SafeSelector.find([
    '[data-test-id="node-parameters-panel"]',
    '[data-test-id="ndv-parameters"]',
    '.ndv-panel',
    '[class*="NodeSettings"]'
  ]);

  if (!panel) {
    return { success: false, message: '노드 설정 패널을 찾을 수 없습니다.' };
  }

  const fields = findInputFields(panel);
  if (fields.length === 0) {
    return { success: false, message: '입력 필드를 찾을 수 없습니다.' };
  }

  let filledCount = 0;
  const results = [];

  // JSON 데이터를 각 필드에 매핑
  for (const [key, value] of Object.entries(jsonData)) {
    // 키와 매칭되는 필드 찾기 (대소문자 무시, 부분 일치)
    const field = fields.find(f => {
      const keyLower = key.toLowerCase().replace(/[_\s-]/g, '');
      const nameLower = (f.name || '').toLowerCase().replace(/[_\s-]/g, '');
      const labelLower = (f.label || '').toLowerCase().replace(/[_\s-]/g, '');

      return nameLower.includes(keyLower) ||
             labelLower.includes(keyLower) ||
             keyLower.includes(nameLower) ||
             keyLower.includes(labelLower);
    });

    if (field) {
      try {
        const valueStr = typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value);

        // ResilientWriter로 값 입력 (재시도 메커니즘 포함)
        const result = await ResilientWriter.setValueWithRetry(field.element, valueStr);

        if (result.success) {
          filledCount++;
          results.push({
            field: field.label || field.name,
            value: valueStr,
            status: 'success',
            attempts: result.attempts
          });
          console.log(`✅ Filled: ${field.label || field.name} = ${valueStr} (${result.attempts} attempts)`);
        } else {
          results.push({
            field: field.label || field.name,
            value: valueStr,
            status: 'error',
            error: result.error
          });
          console.error(`❌ Failed to fill ${field.label || field.name}:`, result.error);
        }

      } catch (error) {
        console.error(`❌ Exception while filling ${key}:`, error);
        results.push({ field: key, value: value, status: 'error', error: error.message });
      }
    } else {
      console.warn(`⚠️ No matching field found for: ${key}`);
      results.push({ field: key, value: value, status: 'not_found' });
    }
  }

  const message = `${filledCount}개 필드가 자동으로 입력되었습니다.`;
  console.log(`✅ Auto-fill complete: ${message}`);

  return {
    success: filledCount > 0,
    filledCount: filledCount,
    totalFields: fields.length,
    message: message,
    results: results
  };
}

// 메시지 리스너: iframe에서 자동 입력 요청 받기
window.addEventListener('message', async (event) => {
  if (event.data.type === 'auto-fill-node') {
    console.log('📥 Auto-fill request received from iframe');

    // async 함수이므로 await 필요
    const result = await autoFillNodeFields(event.data.data);

    // 결과를 iframe에 전송
    sendMessageToIframe({
      type: 'auto-fill-result',
      ...result
    });
  }
});


// ========================================
// 11. Cleanup (메모리 누수 방지)
// ========================================

// 페이지 언로드 시 모든 리소스 정리
window.addEventListener('beforeunload', () => {
  console.log('🧹 Cleaning up N8N AI Copilot resources...');

  // MutationObserver 정리
  if (window.n8nPageObserver) {
    window.n8nPageObserver.disconnect();
    window.n8nPageObserver = null;
    console.log('✅ MutationObserver disconnected');
  }

  // setInterval 정리
  if (window.errorCheckInterval) {
    clearInterval(window.errorCheckInterval);
    window.errorCheckInterval = null;
    console.log('✅ Error check interval cleared');
  }

  console.log('✅ Cleanup complete');
});
