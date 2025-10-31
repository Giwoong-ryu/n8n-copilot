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
  
  // 노드 설정 패널의 입력 필드 읽기
  getNodeSettings() {
    const settingsPanel = document.querySelector('[class*="NodeSettings"]') ||
                          document.querySelector('[class*="node-settings"]');
    
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
    errors: window.n8nReader.detectErrors(),
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

// Claude API 호출 (background.js를 통해)
async function callClaudeAPI(userMessage, context) {
  console.log('🚀 Calling Claude API via background...');

  const systemPrompt = `당신은 N8N 워크플로우 자동화 전문가입니다.
사용자의 워크플로우 작성, 에러 해결, JSON 데이터 생성 등을 도와주세요.

현재 페이지 컨텍스트:
- URL: ${context.url}
- 워크플로우: ${context.workflowName}
- 에러 개수: ${context.errors.length}개
${context.selectedNode ? `- 선택된 노드: ${context.selectedNode.name} (${context.selectedNode.type})` : ''}

간결하고 실용적인 답변을 제공해주세요.`;

  // background.js로 메시지 전송
  return new Promise((resolve, reject) => {
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
          reject(new Error(chrome.runtime.lastError.message));
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
  });
}

console.log('✅ Message listener initialized');
