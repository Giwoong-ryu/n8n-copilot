/**
 * N8N AI Copilot - Content Script (Architecture V2)
 * N8N 페이지의 DOM을 읽고 조작하는 핵심 스크립트
 *
 * Architecture V2:
 * - N8NAdapter를 사용한 플랫폼 추상화
 * - SecurityScanner를 통한 AI 응답 검증
 * - AdvancedContextCollector를 통한 깊은 컨텍스트 수집
 */

// ========================================
// 1. 전역 변수
// ========================================
let n8nAdapter = null; // Architecture V2: N8NAdapter 인스턴스

// ========================================
// 2. N8N 페이지 감지
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
// 3. Architecture V2: N8NReader, N8NWriter는 N8NAdapter로 대체됨
// ========================================
// N8NReader, N8NWriter 클래스는 더 이상 사용하지 않습니다.
// 대신 N8NAdapter를 사용합니다 (core/adapters/N8NAdapter.js)


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
// 8. 초기화 (Architecture V2)
// ========================================
async function initializeAICopilot() {
  console.log('🚀 Initializing N8N AI Copilot (Architecture V2)...');

  try {
    // Architecture V2: N8NAdapter 초기화
    n8nAdapter = new N8NAdapter();
    const initialized = await n8nAdapter.initialize();

    if (!initialized) {
      console.error('❌ N8NAdapter initialization failed');
      return;
    }

    // 하위 호환성: window.n8nReader, window.n8nWriter 유지 (레거시 지원)
    window.n8nAdapter = n8nAdapter;
    window.n8nReader = n8nAdapter; // getNodeSettings() 등의 메서드 호환
    window.n8nWriter = n8nAdapter; // setFieldValue() 등의 메서드 호환

    console.log('✅ N8NAdapter initialized (Architecture V2)');
    console.log('  - SecurityScanner:', !!n8nAdapter.securityScanner);
    console.log('  - AdvancedContextCollector:', !!n8nAdapter.contextCollector);
    console.log('  - DataFlowTracer:', !!n8nAdapter.dataFlowTracer);

    // 사이드바 초기화 (sidebar.js에서 처리)
    console.log('🔍 Checking if initializeSidebar exists:', typeof initializeSidebar);

    if (typeof initializeSidebar === 'function') {
      console.log('🎨 Calling initializeSidebar...');
      initializeSidebar();
    } else {
      console.error('❌ initializeSidebar function not found!');
    }

    // 에러 자동 감지 (5초마다) - Architecture V2: 깊은 에러 분석
    setInterval(async () => {
      const errorInfo = await n8nAdapter.detectErrors();
      if (errorInfo.current && errorInfo.current.length > 0 && window.sendMessageToSidebar) {
        window.sendMessageToSidebar({
          type: 'error-detected',
          errors: errorInfo.current,
          chain: errorInfo.chain, // NEW: 에러 체인
          rootCause: errorInfo.rootCause // NEW: 근본 원인
        });
      }
    }, 5000);

    console.log('✅ N8N AI Copilot initialized successfully (Architecture V2)!');
  } catch (error) {
    console.error('❌ Failed to initialize AI Copilot:', error);
  }
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

// iframe으로부터 메시지 수신 (Architecture V2: Security enhanced)
window.addEventListener('message', async (event) => {
  console.log('📨 Message received in content.js:', event.data);

  if (event.data.type === 'send-message') {
    const userMessage = event.data.message;
    console.log('💬 User message:', userMessage);

    try {
      // N8N 페이지 컨텍스트 수집 (Architecture V2: Deep context)
      const context = await collectPageContext();
      console.log('📄 Page context collected:', context);

      // Claude API 호출 (background.js를 통해)
      const response = await callClaudeAPI(userMessage, context);
      console.log('✅ Claude API response received');

      // Architecture V2: 보안 검증
      if (n8nAdapter && n8nAdapter.securityScanner) {
        console.log('🔒 Running security validation...');

        const securityCheck = await n8nAdapter.securityScanner.validateAIResponse(
          { content: response },
          context
        );

        if (!securityCheck.safe) {
          console.warn('⚠️ Security issues detected:', securityCheck.issues);

          // 보안 경고 포함하여 응답
          const warningMessage = `
⚠️ **보안 경고** (보안 점수: ${securityCheck.score}/100)

${securityCheck.issues.map(issue => `- ${issue.message}`).join('\n')}

---

${response}`;

          sendMessageToIframe({
            type: 'assistant-response',
            message: warningMessage,
            security: securityCheck
          });
          return;
        }

        console.log('✅ Security validation passed (score: ' + securityCheck.score + '/100)');
      }

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

// 페이지 컨텍스트 수집 (Architecture V2: AdvancedContextCollector 사용)
async function collectPageContext() {
  try {
    if (n8nAdapter && n8nAdapter.contextCollector) {
      // Architecture V2: 깊은 컨텍스트 수집
      console.log('📊 Collecting deep context (Architecture V2)...');
      const fullContext = await n8nAdapter.contextCollector.collectFullContext();
      return fullContext;
    }

    // Fallback: 기본 컨텍스트
    console.warn('⚠️ AdvancedContextCollector not available, using basic context');
    return {
      url: window.location.href,
      workflowName: document.title,
      errors: await n8nAdapter.detectErrors(),
      selectedNode: await n8nAdapter.getCurrentNode()
    };
  } catch (error) {
    console.error('❌ Failed to collect context:', error);
    // 최소 컨텍스트
    return {
      url: window.location.href,
      workflowName: document.title,
      error: true
    };
  }
}

// Claude API 호출 (background.js를 통해)
async function callClaudeAPI(userMessage, context) {
  console.log('🚀 Calling Claude API via background...');

  // ========================================
  // Option 1+3: 토큰 최적화 (1,500 tokens → 200 tokens, 87% 절감)
  // - 장황한 예시, 상세 목록 제거
  // - 핵심 규칙만 유지
  // - 동적 컨텍스트만 포함 (값이 있을 때만)
  // ========================================

  // N8N 최신 문서 불러오기
  const n8nDocs = await chrome.storage.local.get('n8nDocs');
  const docsInfo = n8nDocs.n8nDocs;

  let systemPrompt = `N8N 워크플로우 자동화 전문가 (2025년 10월 기준)`;

  // 동적 컨텍스트 추가 (Option 3: 값이 있을 때만 포함)
  const contextParts = [];

  // N8N 문서 정보 (있을 때만)
  if (docsInfo && docsInfo.nodes) {
    const updateDate = new Date(docsInfo.lastUpdated).toLocaleDateString('ko-KR');
    contextParts.push(`사용 가능한 노드: ${docsInfo.nodes.length}개 (최종 업데이트: ${updateDate})`);
  }

  // 현재 워크플로우 (있을 때만)
  if (context.workflowName && context.workflowName !== 'N/A') {
    contextParts.push(`워크플로우: ${context.workflowName}`);
  }

  // 워크플로우 목적 (있을 때만)
  if (context.workflow?.businessIntent?.goal) {
    contextParts.push(`목적: ${context.workflow.businessIntent.goal}`);
  }

  // 선택된 노드 (있을 때만)
  if (context.current?.selectedNode) {
    contextParts.push(`현재 노드: ${context.current.selectedNode.name} (${context.current.selectedNode.type})`);
  }

  // 에러 정보 (있을 때만)
  if (context.errors?.current && context.errors.current.length > 0) {
    contextParts.push(`에러: ${context.errors.current.length}개`);
    if (context.errors.rootCause?.cause) {
      contextParts.push(`근본 원인: ${context.errors.rootCause.cause}`);
    }
  }

  // 기존 Credential (있을 때만)
  if (context.security?.existingCredentials?.length > 0) {
    const credList = context.security.existingCredentials.map(c => `${c.name} (${c.type})`).join(', ');
    contextParts.push(`기존 Credential: ${credList}`);
  }

  // 컨텍스트가 있으면 추가
  if (contextParts.length > 0) {
    systemPrompt += `\n\n컨텍스트:\n${contextParts.map(p => `- ${p}`).join('\n')}`;
  }

  // 핵심 규칙만 포함
  systemPrompt += `

**보안 규칙 (필수)**:
- API 키/비밀번호 하드코딩 절대 금지
- 대신 N8N Credential 또는 환경변수 사용 권장
- 민감 데이터는 마스킹 처리

**자동 입력 기능**:
사용자가 "자동으로 입력" 요청 시:
json-autofill 코드 블록으로 응답
예: {"url": "https://...", "method": "GET"}
형식으로 응답하면 자동 입력됨

**답변 전략** (인터랙티브 워크플로우 빌더):
1. 워크플로우 제안 시 가로 플로우 형식 (한 줄로):
   예시:
   [Schedule Trigger] > [RSS] > [Limit] > [GPT] > [Slack]

   주의: 워크플로우는 반드시 한 줄에 작성
   대안 제시는 별도 문단으로 분리

2. 대안 제시 시 옵션 버튼 형식 (별도 문단):
   예시:

   RSS 대신 다른 방법:
   [HTTP: 커스텀 검색], [SERP: 구글 검색]

3. 노드 상세 설명 시 깔끔한 구조:
   - 각 항목마다 줄바꿈
   - 설정 항목은 "- 항목명: 설명" 형식
   - 예시 코드는 json-autofill 블록 사용

규칙:
- 워크플로우 한 줄: [노드1] > [노드2] > [노드3]
- 대안 노드는 별도 문단에 [옵션1], [옵션2] 형식
- 상세 설명은 항목별 줄바꿈
- 인사말 생략, N8N 노드 중심으로 답변`;


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
