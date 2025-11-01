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
// (callClaudeAPI 함수는 아래 416번 줄에서 정의됨)


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
    // sidebar.js가 로드될 때까지 대기 (최대 3초)
    const waitForSidebar = (retries = 30, delay = 100) => {
      console.log(`🔍 Checking if initializeSidebar exists (attempt ${31 - retries}/30):`, typeof window.initializeSidebar);

      if (typeof window.initializeSidebar === 'function') {
        console.log('✅ initializeSidebar found, initializing sidebar...');
        window.initializeSidebar();
      } else if (retries > 0) {
        setTimeout(() => waitForSidebar(retries - 1, delay), delay);
      } else {
        console.error('❌ initializeSidebar function not found after waiting 3 seconds!');
        console.error('   sidebar.js may not have loaded properly.');
      }
    };

    waitForSidebar();

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
    // 현재 열린 노드 정보 감지
    const openNode = detectOpenNode();

    if (n8nAdapter && n8nAdapter.contextCollector) {
      // Architecture V2: 깊은 컨텍스트 수집
      console.log('📊 Collecting deep context (Architecture V2)...');
      const fullContext = await n8nAdapter.contextCollector.collectFullContext();

      // 열린 노드 정보 추가
      fullContext.openNode = openNode;

      return fullContext;
    }

    // Fallback: 기본 컨텍스트
    console.warn('⚠️ AdvancedContextCollector not available, using basic context');
    return {
      url: window.location.href,
      workflowName: document.title,
      errors: await n8nAdapter.detectErrors(),
      selectedNode: await n8nAdapter.getCurrentNode(),
      openNode: openNode
    };
  } catch (error) {
    console.error('❌ Failed to collect context:', error);
    // 최소 컨텍스트
    const openNode = detectOpenNode();
    return {
      url: window.location.href,
      workflowName: document.title,
      error: true,
      openNode: openNode
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

  // 열린 노드 정보 (CRITICAL: 자동 입력 대상)
  if (context.openNode?.isOpen && context.openNode?.nodeName) {
    contextParts.push(`🎯 현재 열린 노드: ${context.openNode.nodeName}${context.openNode.nodeType ? ` (${context.openNode.nodeType})` : ''}`);
    contextParts.push(`💡 자동 입력 가능 상태`);
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

**답변 전략** (자동 입력 우선):

CRITICAL 1: 노드가 열려있으면 즉시 json-autofill 블록만 제공. 설명 최소화.
CRITICAL 2: 추상적 표현 금지. 항상 실제 값만.
CRITICAL 3: json-autofill 코드 블록을 정확한 마크다운 문법으로 작성

**중요: 코드 블록 작성 규칙**
- 마크다운 코드 블록 시작: 백틱 3개 연속 + json-autofill
- JSON 객체: 중괄호로 감싸고 각 줄에 "키": "값" 형식
- 마크다운 코드 블록 종료: 백틱 3개 연속
- 백틱: 키보드 숫자 1 왼쪽에 있는 특수문자 (grave accent)

**올바른 형식 예시 (실제로 이렇게 작성):**
백틱백틱백틱json-autofill
{
  "url": "https://api.example.com",
  "method": "GET"
}
백틱백틱백틱

**잘못된 형식 예시:**
- 백틱 2개만 사용 (X)
- 백틱 4개 사용 (X)
- 언어 미지정: 백틱3개만 쓰고 json-autofill 안 씀 (X)
- 중괄호 없음: JSON 객체를 중괄호로 안 감쌈 (X)

1. 워크플로우 제안 시:
   [Schedule Trigger] > [RSS] > [Limit] > [GPT] > [Slack]

2. 노드가 열려있을 때 (🎯 표시 확인):
   - 간단한 한 줄 설명 + 즉시 json-autofill 제공
   - 사용자 의도 불명확 시에만 3가지 사용 사례 제시

   예시 - "HTTP 노드 설정 방법 알려줘" + HTTP 노드 열림:

   HTTP 요청 설정이 필요하신가요? 아래 설정을 사용하세요:

   세 개의 백틱json-autofill
   {
     "url": "https://api.github.com/users/octocat",
     "method": "GET",
     "headers": "Accept: application/vnd.github.v3+json"
   }
   세 개의 백틱

   다른 용도가 필요하면 말씀해주세요.

3. 노드가 안 열려있을 때:

   **사용자 의도가 명확하지 않은 경우:**
   일반적인 사용 사례 3가지 제시 후 각각 실제 설정값 + JSON 제공

   예시 - "HTTP 노드 설정 방법 알려줘" 질문 시:

   HTTP 노드 일반 사용 사례 (각각 json-autofill 블록 제공):

   1. 뉴스 API: url, method=GET, queryParameters
   2. Slack 전송: url, method=POST, headers, body
   3. DB 조회: url, method=GET, headers

   **사용자 의도가 명확한 경우:**
   즉시 해당 용도에 맞는 실제 설정값 + json-autofill 블록 제공

   예시 - "뉴스 수집하고 싶어":
   RSS 노드 설정 예시:
   세 개의 백틱json-autofill
   {
     "url": "https://news.google.com/rss",
     "limit": 10
   }
   세 개의 백틱

   예시 - "슬랙으로 알림":
   Slack 노드 설정 예시:
   세 개의 백틱json-autofill
   {
     "channel": "#general",
     "message": "워크플로우 완료: 데이터 결과",
     "webhookUrl": "사용자의 Slack Webhook URL 입력 필요"
   }
   세 개의 백틱

3. 상세 설명 요청 시:
   모든 옵션 나열 + 각 옵션별 실제 사용 예시 + JSON

   예시:
   HTTP 노드 전체 옵션:

   **URL** (필수)
   - 실제 API 엔드포인트 입력
   - 예: https://api.github.com/users/octocat
   - 예: https://jsonplaceholder.typicode.com/posts

   **Method**
   - GET: 데이터 조회 (예: 사용자 목록 가져오기)
   - POST: 데이터 생성 (예: 새 게시글 작성)
   - PUT: 데이터 전체 수정
   - PATCH: 데이터 부분 수정
   - DELETE: 데이터 삭제

   **Headers**
   - Content-Type: application/json
   - Authorization: Bearer YOUR_TOKEN
   - API-Key: {{$credentials.apikey}}

   **Body** (POST/PUT 시)
   - JSON 형식으로 title, content 등 제공

   **실전 예시:**
   GitHub API 조회:
   세 개의 백틱json-autofill
   {
     "url": "https://api.github.com/users/octocat",
     "method": "GET",
     "headers": "Accept: application/vnd.github.v3+json"
   }
   세 개의 백틱

규칙:
- "입력하세요", "설정하세요" 같은 추상적 표현 금지
- 항상 실제 URL, 실제 값, 실제 API 엔드포인트 제공
- 예시는 복사-붙여넣기 가능한 완전한 형태
- {{$json.xxx}} 같은 N8N 표현식 사용
- 사용자 의도 불명확 시 역질문 또는 일반 사례 3개 제시
- **CRITICAL: 반드시 마크다운 코드 블록 (백틱 3개 + json-autofill + 중괄호 JSON 객체) 형식 사용**
- **CRITICAL: "RSS 노드 → url, limit" 같은 텍스트 설명만 쓰지 말고 반드시 실제 코드 블록 생성**
- **CRITICAL: 백틱 2개(``), 4개(````) 등 잘못된 개수 사용 금지. 정확히 3개만 사용**
- **CRITICAL: JSON은 반드시 중괄호로 감싸기. 키-값 쌍만 나열하지 말 것**
- json-autofill 블록의 키 이름은 N8N 필드명과 유사하게 (camelCase)
- 인사말 생략, N8N 노드 중심으로 답변
- 짧은 답변도 괜찮지만 json-autofill 블록은 필수 포함`;


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

  // 노드 패널이 없는 것은 정상 (노드가 열려있지 않을 때)
  return null;
}

// 현재 열린 노드 정보 감지
function detectOpenNode() {
  // 노드 이름 감지
  const nodeNameSelectors = [
    '[data-test-id="node-title"]',
    '[class*="NodeTitle"]',
    '.ndv-title',
    'h2[class*="title"]'
  ];

  let nodeName = null;
  for (const selector of nodeNameSelectors) {
    const element = document.querySelector(selector);
    if (element && element.textContent) {
      nodeName = element.textContent.trim();
      break;
    }
  }

  // 노드 타입 감지 (아이콘이나 클래스명에서)
  const nodeTypeSelectors = [
    '[data-test-id="node-icon"]',
    '[class*="NodeIcon"]'
  ];

  let nodeType = null;
  for (const selector of nodeTypeSelectors) {
    const element = document.querySelector(selector);
    if (element) {
      // class나 data attribute에서 노드 타입 추출
      const classes = element.className;
      const match = classes.match(/node-icon-([a-zA-Z]+)/i);
      if (match) {
        nodeType = match[1];
      }
      break;
    }
  }

  // 노드 패널이 열려있는지 확인
  const panel = detectNodePanel();
  const isOpen = panel !== null;

  const result = {
    isOpen,
    nodeName,
    nodeType,
    panel
  };

  console.log('🔍 Open node detection:', result);
  return result;
}

// 입력 필드 찾기 및 분석
function findInputFields(container) {
  const inputs = [];

  // 모든 입력 요소 찾기 (토글, 체크박스 포함)
  const inputElements = container.querySelectorAll(
    'input[type="text"], input[type="number"], input[type="email"], input[type="url"], ' +
    'input[type="checkbox"], input[type="radio"], ' +
    'textarea, select, [contenteditable="true"], [data-test-id*="parameter"], ' +
    '[role="switch"], [role="checkbox"], .toggle, .switch'
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
          const inputType = field.element.type;

          // 체크박스 또는 라디오 버튼
          if (inputType === 'checkbox' || inputType === 'radio') {
            const boolValue = (value === true || value === 'true' || value === '1' || value === 1 || value === 'on');
            field.element.checked = boolValue;
            field.element.dispatchEvent(new Event('change', { bubbles: true }));
            field.element.dispatchEvent(new Event('click', { bubbles: true }));

            filledCount++;
            results.push({ field: field.label || field.name, value: boolValue, status: 'success' });
            console.log(`✅ Toggled: ${field.label || field.name} = ${boolValue}`);
          }
          // 일반 텍스트 입력
          else {
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
          }

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

        } else if (field.element.getAttribute('role') === 'switch' || field.element.getAttribute('role') === 'checkbox') {
          // ARIA 토글/체크박스
          const boolValue = (value === true || value === 'true' || value === '1' || value === 1 || value === 'on');
          field.element.setAttribute('aria-checked', boolValue.toString());
          field.element.click(); // 토글 클릭
          filledCount++;
          results.push({ field: field.label || field.name, value: boolValue, status: 'success' });
          console.log(`✅ Toggled (ARIA): ${field.label || field.name} = ${boolValue}`);
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
