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
// 1.5 N8N 인스턴스에서 노드 정보 가져오기
// ========================================
async function fetchNodesFromCurrentInstance() {
  console.log('📥 Fetching node types from current N8N instance...');

  // 방법 1: REST API 시도 (여러 엔드포인트)
  const apiEndpoints = [
    '/api/v1/node-types',
    '/rest/node-types',
    '/types/nodes.json'
  ];

  for (const endpoint of apiEndpoints) {
    try {
      const response = await fetch(endpoint, {
        method: 'GET',
        headers: { 'Accept': 'application/json' }
      });

      if (response.ok) {
        const data = await response.json();
        const nodeTypes = Array.isArray(data) ? data : Object.values(data);
        console.log(`✅ Fetched ${nodeTypes.length} node types from ${endpoint}`);
        return nodeTypes;
      }
    } catch (e) {
      // 조용히 다음 방법 시도
    }
  }

  // 방법 2: N8N의 전역 Vue store에서 가져오기
  try {
    if (window.__VUE_DEVTOOLS_GLOBAL_HOOK__ && window.__VUE_DEVTOOLS_GLOBAL_HOOK__.apps) {
      const apps = window.__VUE_DEVTOOLS_GLOBAL_HOOK__.apps;

      for (const app of apps) {
        if (app && app._instance && app._instance.proxy) {
          const proxy = app._instance.proxy;

          // Pinia store 접근
          if (proxy.$pinia && proxy.$pinia._s) {
            const stores = proxy.$pinia._s;

            // nodeTypes store 찾기
            for (const [key, store] of stores) {
              if (store.allNodeTypes) {
                const nodeTypes = Object.values(store.allNodeTypes);
                console.log(`✅ Fetched ${nodeTypes.length} node types from Pinia store (${key})`);
                return nodeTypes;
              }

              if (store.nodeTypes) {
                const nodeTypes = Object.values(store.nodeTypes);
                console.log(`✅ Fetched ${nodeTypes.length} node types from Pinia store (${key})`);
                return nodeTypes;
              }
            }
          }
        }
      }
    }
  } catch (error) {
    // 조용히 실패
  }

  console.warn('⚠️ Could not fetch node types - N8N version may not be supported');
  return null;
}

// 노드 정보 가져오기 flag (중복 방지)
let nodeTypesFetched = false;

// Background에 노드 정보 전달 (한 번만)
async function updateNodesInBackground() {
  if (nodeTypesFetched) {
    console.log('⏭️ Node types already fetched, skipping...');
    return;
  }

  const nodeTypes = await fetchNodesFromCurrentInstance();

  if (nodeTypes) {
    nodeTypesFetched = true;
    chrome.runtime.sendMessage({
      action: 'updateNodeTypes',
      nodeTypes: nodeTypes
    }, response => {
      if (response && response.success) {
        console.log('✅ Node types updated in background');
      }
    });
  }
}

// ========================================
// 2. N8N DOM 읽기 클래스
// ========================================
class N8NReader {
  
  // 현재 선택된 노드 정보 읽기
  getSelectedNode() {
    const selectedNode = document.querySelector('[class*="selected"]');
    
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
  
  // 노드 설정 패널의 입력 필드 읽기 (토글 포함)
  getNodeSettings() {
    const settingsPanel = document.querySelector('[class*="NodeSettings"]') ||
                          document.querySelector('[class*="node-settings"]') ||
                          document.querySelector('[data-test-id*="node-settings"]') ||
                          document.querySelector('.ndv-panel');

    if (!settingsPanel) {
      return { fields: [], toggles: [], options: [] };
    }

    // 일반 입력 필드
    const inputs = settingsPanel.querySelectorAll('input[type="text"], input[type="number"], input[type="email"], input[type="url"], textarea, select');
    const fields = Array.from(inputs).map(input => ({
      element: input,
      name: this.getInputName(input),
      value: input.value,
      type: input.type || input.tagName.toLowerCase()
    }));

    // 토글/체크박스 (매우 중요!)
    const checkboxes = settingsPanel.querySelectorAll('input[type="checkbox"]');
    const toggles = Array.from(checkboxes).map(checkbox => ({
      element: checkbox,
      name: this.getInputName(checkbox),
      checked: checkbox.checked,
      type: 'toggle'
    }));

    // N8N 특수 토글 (switch 컴포넌트)
    const switches = settingsPanel.querySelectorAll('[class*="switch"], [class*="toggle"], [role="switch"]');
    switches.forEach(switchEl => {
      const isOn = switchEl.classList.contains('on') ||
                   switchEl.classList.contains('active') ||
                   switchEl.getAttribute('aria-checked') === 'true';

      toggles.push({
        element: switchEl,
        name: this.getInputName(switchEl),
        checked: isOn,
        type: 'switch'
      });
    });

    // 드롭다운/옵션
    const selects = settingsPanel.querySelectorAll('select');
    const options = Array.from(selects).map(select => ({
      element: select,
      name: this.getInputName(select),
      value: select.value,
      selectedText: select.options[select.selectedIndex]?.text,
      type: 'select'
    }));

    return { fields, toggles, options };
  }

  getInputName(inputElement) {
    // 1. 가장 가까운 label
    const label = inputElement.closest('label');
    if (label && label.textContent.trim()) {
      return label.textContent.trim();
    }

    // 2. 이전 형제 요소의 label
    const prevLabel = inputElement.previousElementSibling;
    if (prevLabel && prevLabel.tagName === 'LABEL') {
      return prevLabel.textContent.trim();
    }

    // 3. 부모 요소에서 label 찾기
    const parent = inputElement.parentElement;
    if (parent) {
      const parentLabel = parent.querySelector('label');
      if (parentLabel) {
        return parentLabel.textContent.trim();
      }

      // 4. 부모의 텍스트 내용 (label이 없을 때)
      const parentText = parent.textContent.trim();
      if (parentText && parentText.length < 100) {
        return parentText;
      }
    }

    // 5. data-test-id나 name attribute
    return inputElement.getAttribute('data-test-id') ||
           inputElement.name ||
           inputElement.placeholder ||
           'unknown';
  }
  
  // 에러 메시지 감지 (개선된 버전)
  detectErrors() {
    const detectedErrors = [];

    // 1. 노드 실행 에러 패널에서 상세 정보 추출
    const errorPanels = document.querySelectorAll([
      '[class*="ExecutionError"]',
      '[class*="execution-error"]',
      '[data-test-id*="error"]',
      '[class*="error-message"]',
      '[class*="RunData"]'
    ].join(','));

    errorPanels.forEach(panel => {
      const errorInfo = this.extractDetailedError(panel);
      if (errorInfo) {
        detectedErrors.push(errorInfo);
      }
    });

    // 2. 일반 에러 요소에서 추출 (백업)
    if (detectedErrors.length === 0) {
      const generalErrors = document.querySelectorAll([
        '[class*="error"]',
        '[class*="Error"]',
        '[class*="issue"]',
        '.el-message--error'
      ].join(','));

      generalErrors.forEach(errorEl => {
        const text = errorEl.textContent.trim();
        if (text && text.length > 0 && text.length < 5000) {
          detectedErrors.push({
            element: errorEl,
            message: text,
            type: this.getErrorType(text),
            details: null
          });
        }
      });
    }

    console.log('⚠️ Found errors:', detectedErrors);
    return detectedErrors;
  }

  // 상세 에러 정보 추출
  extractDetailedError(errorElement) {
    const text = errorElement.textContent.trim();
    if (!text || text.length === 0) return null;

    // 에러 타입 추출 (ReferenceError, SyntaxError 등)
    const errorTypeMatch = text.match(/(ReferenceError|SyntaxError|TypeError|Error):\s*(.+?)(?=\n|$)/);
    const errorType = errorTypeMatch ? errorTypeMatch[1] : null;
    const errorMessage = errorTypeMatch ? errorTypeMatch[2] : text;

    // 줄 번호 추출
    const lineNumberMatch = text.match(/(?:at line|line|:)?\s*(\d+)(?::(\d+))?/);
    const lineNumber = lineNumberMatch ? lineNumberMatch[1] : null;
    const columnNumber = lineNumberMatch ? lineNumberMatch[2] : null;

    // 스택 트레이스 추출
    const stackMatch = text.match(/at\s+.+\(.+:\d+:\d+\)/g);
    const stackTrace = stackMatch ? stackMatch.slice(0, 3) : null; // 처음 3줄만

    // 노드 이름 추출
    const nodeNameMatch = text.match(/(?:in node|node)\s+['"]?([^'"]+)['"]?/i);
    const nodeName = nodeNameMatch ? nodeNameMatch[1] : this.findParentNodeName(errorElement);

    // 전체 에러 메시지 (너무 길면 자르기)
    const fullMessage = text.length > 1000 ? text.substring(0, 1000) + '...' : text;

    return {
      element: errorElement,
      type: errorType || this.getErrorType(text),
      message: errorMessage || fullMessage,
      details: {
        fullMessage: fullMessage,
        lineNumber: lineNumber,
        columnNumber: columnNumber,
        stackTrace: stackTrace,
        nodeName: nodeName,
        errorType: errorType
      }
    };
  }

  // 에러 요소의 부모 노드에서 노드 이름 찾기
  findParentNodeName(element) {
    let current = element;
    for (let i = 0; i < 10; i++) {
      if (!current) break;

      // 노드 이름을 포함할 수 있는 요소 찾기
      const nodeName = current.querySelector('[class*="node-name"], [class*="NodeName"], [data-test-id*="node-name"]');
      if (nodeName && nodeName.textContent) {
        return nodeName.textContent.trim();
      }

      current = current.parentElement;
    }
    return null;
  }

  getErrorType(text) {
    const textLower = text.toLowerCase();

    // JavaScript 에러 타입
    if (text.includes('ReferenceError')) return 'ReferenceError';
    if (text.includes('SyntaxError')) return 'SyntaxError';
    if (text.includes('TypeError')) return 'TypeError';

    // N8N 특정 에러
    if (textLower.includes('credential')) return 'credential';
    if (textLower.includes('connection')) return 'connection';
    if (textLower.includes('required')) return 'validation';
    if (textLower.includes('timeout')) return 'timeout';
    if (textLower.includes('authentication')) return 'authentication';

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
// 3. N8N DOM 쓰기 클래스
// ========================================
class N8NWriter {
  
  // 입력 필드에 값 쓰기 (Vue 리액티브 트리거)
  setFieldValue(fieldElement, value) {
    console.log('✍️ Writing to field:', fieldElement, value);
    
    if (!fieldElement) {
      console.error('❌ Field element not found');
      return false;
    }
    
    // 1. 직접 값 설정
    fieldElement.value = value;
    
    // 2. Vue의 리액티브 시스템을 트리거하기 위한 이벤트 발생
    const events = ['input', 'change', 'blur'];
    
    events.forEach(eventType => {
      const event = new Event(eventType, { 
        bubbles: true, 
        cancelable: true 
      });
      fieldElement.dispatchEvent(event);
    });
    
    // 3. Vue 컴포넌트 직접 접근 시도
    this.triggerVueUpdate(fieldElement, value);
    
    console.log('✅ Value written successfully');
    return true;
  }
  
  // Vue 컴포넌트에 직접 접근
  triggerVueUpdate(element, value) {
    try {
      // Vue 3의 __vueParentComponent 속성 찾기
      const vueInstance = element.__vueParentComponent || 
                          element.__vue__;
      
      if (vueInstance) {
        console.log('🎯 Found Vue instance, triggering update...');
        
        // Vue의 emit으로 update 이벤트 발생
        if (vueInstance.emit) {
          vueInstance.emit('update:modelValue', value);
          vueInstance.emit('input', value);
        }
        
        // Props 직접 업데이트 시도
        if (vueInstance.props && vueInstance.props.modelValue !== undefined) {
          vueInstance.props.modelValue = value;
        }
      }
    } catch (error) {
      console.log('⚠️ Vue update failed (normal):', error.message);
      // 실패해도 괜찮음 - 기본 이벤트로 충분할 수 있음
    }
  }
  
  // 여러 필드에 자동으로 값 채우기
  autoFillFields(suggestions) {
    const reader = new N8NReader();
    const fields = reader.getNodeSettings();
    
    let filledCount = 0;
    
    for (const [fieldName, value] of Object.entries(suggestions)) {
      // 필드 이름으로 매칭
      const field = fields.find(f => 
        f.name.toLowerCase().includes(fieldName.toLowerCase())
      );
      
      if (field) {
        this.setFieldValue(field.element, value);
        filledCount++;
      }
    }
    
    console.log(`✅ Auto-filled ${filledCount} fields`);
    return filledCount;
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

  // N8N 인스턴스에서 노드 정보 가져오기
  updateNodesInBackground();

  // 사이드바 초기화 (sidebar.js에서 처리)
  console.log('🔍 Checking if initializeSidebar exists:', typeof initializeSidebar);

  if (typeof initializeSidebar === 'function') {
    console.log('🎨 Calling initializeSidebar...');
    initializeSidebar();
  } else {
    console.error('❌ initializeSidebar function not found!');
  }

  // 에러 자동 감지 (5초마다)
  setInterval(() => {
    const errors = window.n8nReader.detectErrors();
    if (errors.length > 0 && window.sendMessageToSidebar) {
      window.sendMessageToSidebar({
        type: 'error-detected',
        errors: errors
      });
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
const observer = new MutationObserver((mutations) => {
  // N8N 특유의 요소가 추가되었는지 확인
  const hasN8NElements =
    document.querySelector('[class*="canvas"]') ||
    document.querySelector('[class*="NodeView"]') ||
    document.querySelector('[class*="workflow"]') ||
    document.querySelector('#app');

  if (hasN8NElements) {
    console.log('🎯 N8N elements detected by MutationObserver!');
    detectN8NPage();
    observer.disconnect(); // 감지 후 observer 중지
  }
});

// body가 존재하면 observer 시작
if (document.body) {
  observer.observe(document.body, {
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

// 페이지 컨텍스트 수집 (설정 포함)
function collectPageContext() {
  const errors = window.n8nReader.detectErrors();
  const settings = window.n8nReader.getNodeSettings();

  const context = {
    url: window.location.href,
    workflowName: document.title,
    errors: errors,
    selectedNode: null,
    nodeSettings: settings,
    errorPattern: null
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

  // 에러 패턴 분석 (매우 중요!)
  if (errors.length > 0) {
    context.errorPattern = analyzeErrorPattern(errors);
  }

  return context;
}

// 에러 패턴 분석 (설정 문제 감지)
function analyzeErrorPattern(errors) {
  const pattern = {
    totalErrors: errors.length,
    uniqueErrors: new Set(errors.map(e => e.message)).size,
    repeatedError: null,
    likelySettingIssue: false,
    suggestion: null
  };

  // 동일한 에러가 여러 번 반복되는지 확인
  if (pattern.uniqueErrors === 1 && pattern.totalErrors > 1) {
    pattern.repeatedError = errors[0].message;
    pattern.likelySettingIssue = true;
    pattern.suggestion = '동일한 에러가 ' + pattern.totalErrors + '번 반복됩니다. 노드 설정(특히 "Run once for all items" vs "Run once for each item" 토글)을 확인하세요.';
  }

  // 에러 개수가 특정 패턴과 일치하는지
  if (pattern.totalErrors > 10 && pattern.uniqueErrors < 5) {
    pattern.likelySettingIssue = true;
    pattern.suggestion = '많은 에러가 발생했지만 종류는 적습니다. 설정 문제일 가능성이 높습니다.';
  }

  return pattern;
}

// 사용자 메시지에서 언급된 노드 찾기
function findMentionedNodes(userMessage, docsInfo) {
  if (!docsInfo || !docsInfo.detailedNodes) {
    return [];
  }

  const mentionedNodes = [];
  const message = userMessage.toLowerCase();

  for (const node of docsInfo.detailedNodes) {
    const nodeName = (node.displayName || node.name || '').toLowerCase();

    // 노드 이름이 메시지에 포함되어 있는지 확인
    if (nodeName && message.includes(nodeName)) {
      mentionedNodes.push(node);
    }
  }

  return mentionedNodes;
}

// Claude API 호출 (background.js를 통해)
async function callClaudeAPI(userMessage, context) {
  console.log('🚀 Calling Claude API via background...');

  // N8N 문서 불러오기
  const n8nDocs = await chrome.storage.local.get('n8nDocs');
  const docsInfo = n8nDocs.n8nDocs;

  // 사용자 메시지에서 언급된 노드 찾기
  const mentionedNodes = findMentionedNodes(userMessage, docsInfo);

  let nodeContext = '';
  if (mentionedNodes.length > 0) {
    nodeContext = '\n\n**🔍 관련 노드 정보**:\n';
    mentionedNodes.forEach(node => {
      nodeContext += `\n**${node.displayName || node.name}**:\n`;
      if (node.description) {
        nodeContext += `- 설명: ${node.description}\n`;
      }
      if (node.operations && node.operations.length > 0) {
        nodeContext += `- 사용 가능한 Operations: ${node.operations.join(', ')}\n`;
      }
    });
    console.log(`📚 Found ${mentionedNodes.length} mentioned nodes:`, mentionedNodes.map(n => n.name));
  }

  const systemPrompt = `당신은 N8N 워크플로우 자동화 전문가입니다 (2025년 10월 기준 최신 버전).
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
${nodeContext}
**현재 페이지 컨텍스트**:
- URL: ${context.url}
- 워크플로우: ${context.workflowName}
- 에러 개수: ${context.errors.length}개
${context.selectedNode ? `- 선택된 노드: ${context.selectedNode.name} (${context.selectedNode.type})` : ''}

${context.nodeSettings && (context.nodeSettings.toggles.length > 0 || context.nodeSettings.options.length > 0) ? `
**🎛️ 노드 설정 (현재 상태)**:
${context.nodeSettings.toggles.length > 0 ? `
토글/스위치:
${context.nodeSettings.toggles.map(t => `- ${t.name}: ${t.checked ? 'ON ✅' : 'OFF ❌'}`).join('\n')}
` : ''}
${context.nodeSettings.options.length > 0 ? `
옵션:
${context.nodeSettings.options.map(o => `- ${o.name}: ${o.selectedText || o.value}`).join('\n')}
` : ''}
` : ''}

${context.errorPattern && context.errorPattern.likelySettingIssue ? `
**🚨 에러 패턴 분석 결과**:
- 총 에러: ${context.errorPattern.totalErrors}개
- 고유 에러: ${context.errorPattern.uniqueErrors}개
- 설정 문제 가능성: 높음 ⚠️
- 제안: ${context.errorPattern.suggestion}
` : ''}

${context.errors.length > 0 ? `
**⚠️ 감지된 에러 상세 정보**:
${context.errors.slice(0, 3).map((err, idx) => `
에러 ${idx + 1}:
- 타입: ${err.type}
- 메시지: ${err.message}
${err.details ? `- 노드 이름: ${err.details.nodeName || '알 수 없음'}
- 줄 번호: ${err.details.lineNumber || '알 수 없음'}
${err.details.stackTrace ? `- 스택 트레이스:\n  ${err.details.stackTrace.join('\n  ')}` : ''}` : ''}
`).join('\n')}
${context.errors.length > 3 ? `\n... 외 ${context.errors.length - 3}개 에러` : ''}
` : ''}

**에러 분석 전략 (매우 중요!)**:
🚨 에러 진단 우선순위 (반드시 이 순서로!):

**1순위: 노드 설정 확인 (가장 중요!)**
   ⚠️ 코드를 보기 전에 먼저 설정을 확인하세요!

   특히 확인해야 할 것:
   - **Run once for all items** vs **Run once for each item**
     * all items: 전체 items 배열을 한 번에 처리 (items.map, items.filter 등 사용)
     * each item: 각 item을 개별로 처리 (item 하나만 접근)
     * ⚠️ 동일한 에러가 여러 번 반복되면 이 설정이 잘못되었을 가능성 높음!

   - **Always Output Data** (항상 데이터 출력)
   - **Continue On Fail** (실패 시 계속)
   - 기타 토글 설정들

**2순위: 에러 패턴 분석**
   - 에러 개수 = 아이템 개수? → 거의 확실히 설정 문제!
   - 동일한 에러가 N번 반복? → 설정 또는 입력 데이터 문제
   - 각기 다른 에러? → 코드 로직 문제일 가능성

**3순위: 코드 검토**
   - 설정과 패턴을 먼저 확인한 후에만 코드를 분석하세요

**에러 분석 답변 예시**:

✅ **올바른 예시** (설정 문제):
\`\`\`
⚠️ **설정 문제 발견!**

**현재 상태**: 동일한 에러가 39번 반복
**원인**: "Run once for each item" 모드로 설정되어 있음

**문제**:
코드가 전체 items 배열을 처리하도록 작성되었지만
(items.map, items.filter 등 사용)
노드는 각 item마다 개별 실행 중

**해결 방법**:
1. 노드 설정 열기
2. "Run once for all items"로 토글 변경
3. 저장 후 재실행

또는 코드를 "each item" 모드에 맞게 수정:
- \`items[0]\` 대신 \`item\` 사용
- \`items.map()\` 제거하고 단일 item 처리
\`\`\`

✅ **올바른 예시** (코드 문제):
\`\`\`
**에러 타입**: ReferenceError
**에러 메시지**: sortedNews is not defined
**발생 위치**: 15번째 줄

**원인**: sortedNews 변수 선언 없음

**해결 방법**:
15번째 줄 앞에 추가:
\`\`\`javascript
const sortedNews = items[0].json.news.sort(...);
\`\`\`
\`\`\`

❌ **잘못된 예시** (절대 이렇게 답변하지 마세요):
\`\`\`
39개의 에러가 발생했습니다.
코드 문법 오류일 수 있습니다.
입력 데이터 형식을 확인하세요.
console.log()로 디버깅하세요.
\`\`\`

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

// AI로부터 받은 JSON을 필드에 자동 입력
function autoFillNodeFields(jsonData) {
  console.log('🤖 Auto-filling node fields with data:', jsonData);

  const panel = detectNodePanel();
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
  Object.keys(jsonData).forEach(key => {
    const value = jsonData[key];

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

        // 값 입력
        if (field.element.tagName === 'INPUT' || field.element.tagName === 'TEXTAREA') {
          // 기존 값 저장
          const oldValue = field.element.value;

          // 새 값 설정
          field.element.value = valueStr;

          // React/Vue의 상태 업데이트를 위한 이벤트 트리거
          field.element.dispatchEvent(new Event('input', { bubbles: true, cancelable: true }));
          field.element.dispatchEvent(new Event('change', { bubbles: true, cancelable: true }));
          field.element.dispatchEvent(new Event('blur', { bubbles: true }));

          // Vue용 이벤트
          field.element.__vue__?.emit?.('input', valueStr);

          filledCount++;
          results.push({ field: field.label || field.name, value: valueStr, status: 'success' });
          console.log(`✅ Filled: ${field.label || field.name} = ${valueStr}`);

        } else if (field.element.tagName === 'SELECT') {
          // 드롭다운 선택
          const option = Array.from(field.element.options).find(opt =>
            opt.value === value || opt.text === value
          );

          if (option) {
            field.element.value = option.value;
            field.element.dispatchEvent(new Event('change', { bubbles: true }));
            filledCount++;
            results.push({ field: field.label || field.name, value: value, status: 'success' });
            console.log(`✅ Selected: ${field.label || field.name} = ${value}`);
          }

        } else if (field.element.contentEditable === 'true') {
          // ContentEditable 요소
          field.element.textContent = valueStr;
          field.element.dispatchEvent(new Event('input', { bubbles: true }));
          filledCount++;
          results.push({ field: field.label || field.name, value: valueStr, status: 'success' });
          console.log(`✅ Filled (contentEditable): ${field.label || field.name} = ${valueStr}`);
        }

      } catch (error) {
        console.error(`❌ Failed to fill ${key}:`, error);
        results.push({ field: key, value: value, status: 'error', error: error.message });
      }
    } else {
      console.warn(`⚠️ No matching field found for: ${key}`);
      results.push({ field: key, value: value, status: 'not_found' });
    }
  });

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
window.addEventListener('message', (event) => {
  if (event.data.type === 'auto-fill-node') {
    console.log('📥 Auto-fill request received from iframe');

    const result = autoFillNodeFields(event.data.data);

    // 결과를 iframe에 전송
    sendMessageToIframe({
      type: 'auto-fill-result',
      ...result
    });
  }
});


// ========================================
// 8. N8N 페이지 상세 분석
// ========================================
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
    // classList를 사용하여 SVG 요소 호환성 확보
    if (el.classList && el.classList.length > 0) {
      el.classList.forEach(cls => {
        if (cls.trim()) allClasses.add(cls.trim());
      });
    }
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

  // className이 SVGAnimatedString일 수 있으므로 안전하게 변환
  let classNameStr = '';
  if (el.classList && el.classList.length > 0) {
    classNameStr = Array.from(el.classList).join(' ');
  } else if (typeof el.className === 'string') {
    classNameStr = el.className;
  }

  return {
    tagName: el.tagName.toLowerCase(),
    className: classNameStr,
    id: el.id,
    dataAttrs: Array.from(el.attributes)
      .filter(attr => attr.name.startsWith('data-'))
      .map(attr => `${attr.name}="${attr.value}"`)
  };
}
