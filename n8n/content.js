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

      // Architecture V2: Visual Feedback (Highlighting)
      try {
        // 응답에서 JSON 액션 추출 (예: ```json ... ``` 또는 끝부분의 JSON)
        const jsonMatch = response.match(/```json\s*({[\s\S]*?})\s*```/) ||
          response.match(/({[\s\S]*?"action"\s*:\s*"highlight_field"[\s\S]*?})/);

        if (jsonMatch) {
          const actionData = JSON.parse(jsonMatch[1]);

          if (actionData.action === 'highlight_field' && actionData.field) {
            console.log('✨ Visual Feedback: Highlighting field', actionData.field);
            if (n8nAdapter) {
              await n8nAdapter.highlightErrorField(actionData.field);
            }
          }
        }
      } catch (e) {
        console.log('Visual feedback parsing failed (non-critical):', e);
      }

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

  // Background script에서 N8N 최신 노드 목록 가져오기
  let docsInfo = null;
  try {
    // Extension Context 유효성 체크
    if (!chrome.runtime?.id) {
      throw new Error('Extension context invalidated');
    }

    const response = await new Promise((resolve, reject) => {
      try {
        chrome.runtime.sendMessage({ action: 'getN8NNodeList' }, (res) => {
          if (chrome.runtime.lastError) {
            reject(chrome.runtime.lastError);
          } else {
            resolve(res);
          }
        });
      } catch (e) {
        reject(e);
      }
    });
    docsInfo = response?.docsInfo || null;
  } catch (error) {
    console.warn('⚠️ Failed to get N8N node list from background:', error);

    // Context invalidated 에러인 경우 사용자에게 알림
    if (error.message.includes('Extension context invalidated') || !chrome.runtime?.id) {
      return "⚠️ **확장 프로그램이 업데이트되었습니다.**\n\n원활한 사용을 위해 **페이지를 새로고침** 해주세요.";
    }

    // Fallback to local storage (only if context is still valid)
    try {
      if (chrome.storage && chrome.storage.local) {
        const n8nDocs = await chrome.storage.local.get('n8nDocs');
        docsInfo = n8nDocs.n8nDocs;
      }
    } catch (storageError) {
      console.warn('⚠️ Failed to access local storage:', storageError);
    }
  }

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

**역할**: N8N 워크플로우 설계 코파일럿 (사용자 주도, AI 보조)

**답변 전략**:

1. 워크플로우 요청 시 (기본 응답):
   - 전체 워크플로우를 [Node1] > [Node2] > [Node3] 형식으로 표시
   - 각 노드에 한 줄 설명 추가
   - 추가 질문 하지 말기
   - json-autofill 블록 제공하지 말기 (사용자가 "설정하기" 버튼 클릭할 때까지 대기)

   예시 - "유튜브에서 ai뉴스 검색해서 통계 내고싶어":

   추천 워크플로우:
   [YouTube] > [Code] > [Code] > [Google Sheets]

   각 노드 역할:
   - YouTube (Video > Get Many Videos): AI 뉴스 관련 영상 검색
   - Code (텍스트 추출): 영상 제목/설명에서 키워드 추출
   - Code (단어 통계): 키워드 출현 빈도 계산
   - Google Sheets (Append): 통계 결과 저장

   ⚙️ 각 노드의 "설정하기" 버튼을 클릭하여 설정하세요.

   **중요**: Resources가 있는 노드는 반드시 정확한 action 명시 (N8N UI에 나오는 그대로):
   - ✅ "YouTube (Video > Get Many Videos)"
   - ✅ "YouTube (Channel > Get Many Channels)"
   - ✅ "Gmail (Message > Send)"
   - ❌ "YouTube (Video > List)" - N8N에 없는 action

2. 특정 노드 설정 요청 시 (🎯 표시 확인 또는 "XXX 노드 설정" 요청):
   - 인사말, 설명 없이 즉시 json-autofill 코드 블록만 제공
   - 추상적 표현 금지, 실제 값만
   - 사용자는 자동 입력 후 N8N 노드에서 값 확인

3. 에러 수정 요청 시:
   - 에러 원인 설명
   - 수정 방법 제시
   - json-autofill로 수정된 값 제공

**json-autofill 코드 블록 형식** (특정 노드 설정 시에만 사용):
- 마크다운 펜스드 코드 블록 사용: \`\`\`json-autofill
- 내용: JSON 객체만 (중괄호로 감싸기, 주석 금지)
- 종료: \`\`\`
- **CRITICAL**: 반드시 실제 백틱 문자 3개 사용 (키보드 숫자 1 왼쪽 키)
- **중요**: 메타데이터 키 사용 금지
  - ❌ 금지: "parameters", "type", "nodeName", "nodeType", "version", "id"
  - ✅ 허용: 실제 입력 필드 이름만 (예: "url", "feedUrl", "method", "authentication")

**규칙**:
- 워크플로우 요청 시: [Node] > [Node] 형식 사용, json-autofill 제공 안 함
- 특정 노드 요청 시:
  - 인사말, 설명 없이 즉시 json-autofill 블록만 제공
  - JSON 코드는 UI에서 숨겨지고 자동 입력 버튼만 표시됨
- 추상적 표현 금지 (실제 URL, 실제 값만)
- 추가 질문 금지 (바로 워크플로우 제안)
- 보안: API 키는 환경변수 또는 Credential 사용
- 인사말 생략, 간결하게`;

  // N8N 실제 노드 목록 추가 (N8N API에서 가져온 정확한 목록)
  if (docsInfo && docsInfo.nodes && docsInfo.nodes.length > 0) {
    console.log(`📊 Total N8N nodes from API: ${docsInfo.nodes.length}`);

    systemPrompt += `

**N8N 사용 가능한 노드 목록** (총 ${docsInfo.nodes.length}개):

`;

    // 자주 사용되는 노드 (resource/operation 상세 정보 포함)
    const commonNodeNames = ['Gmail', 'Slack', 'Google Sheets', 'HTTP Request', 'Webhook', 'Code', 'IF', 'Set', 'Function', 'Merge', 'YouTube', 'Discord', 'Twitter', 'Airtable', 'MySQL', 'PostgreSQL', 'MongoDB'];

    const commonNodesDetailed = docsInfo.nodes.filter(node =>
      commonNodeNames.includes(node.name)
    );

    const otherNodes = docsInfo.nodes.filter(node =>
      !commonNodeNames.includes(node.name)
    );

    // 자주 사용되는 노드 - 상세 정보 포함
    if (commonNodesDetailed.length > 0) {
      systemPrompt += `**자주 사용되는 노드** (resources/operations 포함):\n\n`;

      commonNodesDetailed.forEach(node => {
        systemPrompt += `- **${node.name}**\n`;

        // Debug: 노드 정보 출력
        if (node.name === 'YouTube' || node.name === 'Gmail' || node.name === 'Slack') {
          console.log(`🔍 ${node.name} node details:`, {
            name: node.name,
            hasResources: !!node.resources,
            resourceCount: node.resources?.length || 0,
            resources: node.resources
          });
        }

        // Resources 정보 (각 resource별로 가능한 operations 표시)
        if (node.resources && node.resources.length > 0) {
          node.resources.forEach(resource => {
            systemPrompt += `  **${resource.displayName || resource.name}** Actions:\n`;

            if (resource.operations && resource.operations.length > 0) {
              resource.operations.forEach(op => {
                systemPrompt += `    - ${op.displayName || op.name} (operation: "${op.name}")\n`;
              });
            } else {
              systemPrompt += `    - (no specific operations)\n`;
            }
          });
        } else if (node.operations && node.operations.length > 0) {
          // resource 없이 operation만 있는 경우
          systemPrompt += `  Operations:\n`;
          node.operations.forEach(op => {
            systemPrompt += `    - ${op.displayName || op.name} (operation: "${op.name}")\n`;
          });
        }

        systemPrompt += '\n';
      });

      systemPrompt += '\n';
    }

    // 기타 모든 노드 - 이름만 (제한 없이 전부 포함)
    if (otherNodes.length > 0) {
      systemPrompt += `**기타 사용 가능한 노드** (${otherNodes.length}개):\n`;
      const otherNodeNames = otherNodes
        .map(node => node.name)
        .sort()
        .join(', ');
      systemPrompt += otherNodeNames + '\n\n';
    }

    systemPrompt += `
**CRITICAL - 워크플로우 설명 규칙**:
- 노드 이름은 위 목록의 정확한 이름만 사용
  ❌ [YOUTUBE AI NEWS], [YouTube Search]
  ✅ [YouTube], [Gmail], [HTTP Request]

- Resources가 있는 노드는 워크플로우 설명에서 "(Resource > Action)" 형식으로 정확히 명시:
  ✅ "YouTube (Video > Get Many Videos): AI 뉴스 영상 검색"
  ✅ "Gmail (Message > Send): 결과 이메일 전송"
  ✅ "Slack (Message > Post): 알림 전송"
  ❌ "YouTube: AI 뉴스 검색" - resource/action 없음
  ❌ "YouTube (Video > List)" - 위 목록에 없는 action

- Action 이름은 위에 나온 displayName 그대로 사용 (예: "Get Many Videos", "Send", "Post")
- 존재하지 않는 action 이름 절대 만들지 말기
- 위 목록에 표시된 action만 사용`;

    // Debug: 시스템 프롬프트 일부 출력
    console.log('📝 System prompt generated successfully');
  } else {
    // Fallback: 하드코딩된 기본 노드 목록
    systemPrompt += `

**N8N 노드 이름 목록** (워크플로우 제안 시 이 정확한 이름만 사용):

**자주 사용되는 노드**:
- Gmail, Slack, Google Sheets, HTTP Request, Webhook
- Code, Function, Set, Edit Fields, Merge
- IF, Switch, Filter
- YouTube, Discord, Twitter, Airtable
- MySQL, PostgreSQL, MongoDB

**CRITICAL - 노드 이름 사용 규칙**:
- ❌ 잘못된 예: [YOUTUBE AI NEWS], [YouTube Search]
- ✅ 올바른 예: [YouTube], [Gmail], [HTTP Request]
- 존재하지 않는 노드 이름 절대 만들지 말기`;
  }

  systemPrompt += `

**주요 N8N 노드 구조** (정확한 action 이름 사용):

**YouTube 노드** (n8n-nodes-base.youtube):
Resource: "video" | "videoCategory" | "channel" | "playlist" | "playlistItem"

**Video Actions**:
- "delete" - Delete a video (videoId 필요)
- "get" - Get a video (videoId 필요)
- "getAll" - Get many videos (q: 검색어, maxResults: 개수, order: 정렬)
- "rate" - Rate a video (videoId, rating 필요)
- "update" - Update a video (videoId 필요)
- "upload" - Upload a video (title, description 필요)

**Video Category Actions**:
- "getAll" - Get many video categories (regionCode 필요)

**Channel Actions**:
- "get" - Get a channel (channelId 필요)
- "getAll" - Get many channels (q: 검색어, maxResults 필요)
- "update" - Update a channel (channelId 필요)
- "uploadBanner" - Upload a channel banner (channelId 필요)

**Playlist Actions**:
- "create" - Create a playlist (title, description 필요)
- "delete" - Delete a playlist (playlistId 필요)
- "get" - Get a playlist (playlistId 필요)
- "getAll" - Get many playlists (channelId 필요)
- "update" - Update a playlist (playlistId 필요)

**Playlist Item Actions**:
- "add" - Add a playlist item (playlistId, videoId 필요)
- "delete" - Delete a playlist item (playlistId, playlistItemId 필요)
- "get" - Get a playlist item (playlistItemId 필요)
- "getAll" - Get many playlist items (playlistId 필요)

**예시**:
- "유튜브에서 AI 뉴스 검색" → {"resource": "video", "operation": "getAll", "q": "AI news", "maxResults": 10}
- "특정 영상 조회" → {"resource": "video", "operation": "get", "videoId": "abc123"}
- "채널 검색" → {"resource": "channel", "operation": "getAll", "q": "AI channel", "maxResults": 5}

**Gmail 노드** (n8n-nodes-base.gmail):
- resource: "message" | "draft" | "label" | "thread"
- message operations: "send", "get", "getAll", "delete", "reply", "markAsRead", "markAsUnread"
  - send 필드: to, subject, message
  - getAll 필드: q (검색어), maxResults
- draft operations: "create", "get", "getAll", "delete"
- 예시: "이메일 보내기" → {"resource": "message", "operation": "send", "to": "user@example.com", "subject": "제목", "message": "내용"}

**HTTP Request 노드** (n8n-nodes-base.httpRequest):
- method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH"
- url: 실제 API 엔드포인트 (예: "https://api.example.com/data")
- authentication: "none" | "genericCredentialType" | "predefinedCredentialType"
- sendBody: true/false (POST/PUT일 때)
- bodyParameters: {parameters: [{name: "key", value: "value"}]}
- 예시: "API 호출" → {"method": "GET", "url": "https://api.example.com/users"}

**Webhook 노드** (n8n-nodes-base.webhook):
- httpMethod: "GET" | "POST" | "PUT" | "DELETE"
- path: "webhook-path" (실제 경로명)
- responseMode: "onReceived" | "lastNode"
- 예시: "웹훅 받기" → {"httpMethod": "POST", "path": "my-webhook", "responseMode": "onReceived"}

**Slack 노드** (n8n-nodes-base.slack):
- resource: "message" | "channel" | "user" | "file"
- message operations: "post", "update", "delete", "search"
  - post 필드: channel, text
- channel operations: "create", "get", "getAll", "history"
- 예시: "슬랙 메시지" → {"resource": "message", "operation": "post", "channel": "#general", "text": "메시지 내용"}

**Google Sheets 노드** (n8n-nodes-base.googleSheets):
- resource: "sheet" | "spreadsheet"
- sheet operations: "append", "appendOrUpdate", "lookup", "read", "update", "delete"
  - append 필드: sheetName, range, values
  - lookup 필드: sheetName, lookupColumn, lookupValue
- 예시: "시트에 추가" → {"resource": "sheet", "operation": "append", "sheetName": "Sheet1", "range": "A:D"}

**Airtable 노드** (n8n-nodes-base.airtable):
- operation: "append" | "list" | "read" | "update" | "delete"
- base: Base ID
- table: Table 이름
- 예시: "레코드 추가" → {"operation": "append", "base": "appXXXX", "table": "Tasks"}

**Code 노드** (n8n-nodes-base.code):
- mode: "runOnceForAllItems" | "runOnceForEachItem"
- jsCode: JavaScript 코드 문자열
- 예시: "데이터 변환" → {"mode": "runOnceForAllItems", "jsCode": "return items.map(item => ({...item, processed: true}));"}

**IF 노드** (n8n-nodes-base.if):
- conditions: {boolean: [{value1: "{{$json.field}}", operation: "equal", value2: "expected"}]}
- 예시: "조건 분기" → {"conditions": {"boolean": [{"value1": "{{$json.status}}", "operation": "equal", "value2": "active"}]}}

**CRITICAL**:
- 항상 실제 필드명 사용 (resource, operation 등)
- 메타필드 사용 금지 (parameters, type, nodeName 등)
- 노드마다 정확한 resource와 operation 명시
- 사용자 요청에 맞는 실제 값 제공 (예시값 아님)`;


  // Background script를 통해 AI API 호출
  return new Promise((resolve, reject) => {
    console.log('🚀 Calling AI API via background script...');

    chrome.runtime.sendMessage({
      action: 'callClaude',
      message: userMessage,
      systemPrompt: systemPrompt,
      context: context
    }, (response) => {
      if (chrome.runtime.lastError) {
        console.error('❌ Runtime error:', chrome.runtime.lastError);
        reject(new Error(chrome.runtime.lastError.message));
        return;
      }

      if (!response) {
        console.error('❌ No response from background script');
        reject(new Error('Background script에서 응답이 없습니다'));
        return;
      }

      if (response.error) {
        console.error('❌ API error:', response.message);
        reject(new Error(response.message));
        return;
      }

      console.log('✅ AI API response received via background script');
      resolve(response.content);
    });
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
  console.log('📝 Available field names:', visibleInputs.map(f => f.name).join(', '));
  console.log('📝 Available field labels:', visibleInputs.map(f => f.label).join(', '));
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

  // 메타데이터 키 필터링 (실제 입력 필드가 아닌 것들)
  const metadataKeys = ['parameters', 'type', 'nodeName', 'nodeType', 'version', 'id', 'name', 'position'];
  const filteredData = Object.keys(jsonData)
    .filter(key => !metadataKeys.includes(key))
    .reduce((obj, key) => {
      obj[key] = jsonData[key];
      return obj;
    }, {});

  console.log(`🔍 Filtered out ${Object.keys(jsonData).length - Object.keys(filteredData).length} metadata keys`);

  // JSON 데이터를 각 필드에 매핑 (Fuzzy Matching)
  Object.keys(filteredData).forEach(key => {
    const value = filteredData[key];

    // Fuzzy matching으로 가장 유사한 필드 찾기
    const field = findBestMatchingField(key, fields);

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

// ========================================
// Fuzzy Field Matching - Levenshtein Distance
// ========================================

// Levenshtein distance algorithm (edit distance between two strings)
// Source: https://gist.github.com/andrei-m/982927
function getEditDistance(a, b) {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  const matrix = [];

  // Initialize matrix
  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  // Fill matrix
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          Math.min(
            matrix[i][j - 1] + 1,   // insertion
            matrix[i - 1][j] + 1    // deletion
          )
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

// Calculate similarity score (0-1, higher is better)
function getSimilarityScore(str1, str2) {
  const maxLen = Math.max(str1.length, str2.length);
  if (maxLen === 0) return 0;

  const distance = getEditDistance(str1, str2);
  return 1 - (distance / maxLen);
}

// Find best matching field using fuzzy matching
function findBestMatchingField(key, fields) {
  const keyNormalized = key.toLowerCase().replace(/[_\s-]/g, '');

  let bestMatch = null;
  let bestScore = 0;
  const threshold = 0.5; // Minimum similarity score (0-1)

  console.log(`🔍 Fuzzy matching for key: "${key}" (normalized: "${keyNormalized}")`);

  fields.forEach(field => {
    const name = (field.name || '').toLowerCase().replace(/[_\s-]/g, '');
    const label = (field.label || '').toLowerCase().replace(/[_\s-]/g, '');

    // Skip empty fields
    if (!name && !label) return;

    // Calculate similarity scores
    const nameScore = name ? getSimilarityScore(keyNormalized, name) : 0;
    const labelScore = label ? getSimilarityScore(keyNormalized, label) : 0;

    // Use best score
    const score = Math.max(nameScore, labelScore);
    const matchedOn = nameScore > labelScore ? 'name' : 'label';
    const matchedValue = nameScore > labelScore ? name : label;

    if (score > bestScore && score >= threshold) {
      bestScore = score;
      bestMatch = {
        field: field,
        score: score,
        matchedOn: matchedOn,
        matchedValue: matchedValue
      };
    }

    if (score > 0.3) { // Log promising candidates
      console.log(`  📊 ${field.name || field.label}: score=${score.toFixed(2)} (${matchedOn}="${matchedValue}")`);
    }
  });

  if (bestMatch) {
    console.log(`  ✅ Best match: ${bestMatch.field.name || bestMatch.field.label} (score=${bestMatch.score.toFixed(2)}, ${bestMatch.matchedOn}="${bestMatch.matchedValue}")`);
  } else {
    console.log(`  ❌ No match found above threshold (${threshold})`);
  }

  return bestMatch ? bestMatch.field : null;
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
