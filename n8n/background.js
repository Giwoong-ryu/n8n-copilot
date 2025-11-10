/**
 * N8N AI Copilot - Background Service Worker
 * Claude API 연동 및 Content Script와의 통신 처리
 */

// N8N 수정 패턴 로드
importScripts('n8n-fix-patterns.js');

// ========================================
// 0. N8N 지식베이스 시스템 프롬프트
// ========================================

function buildSystemPrompt(errorContext) {
  return `당신은 N8N 워크플로우 자동화 전문가입니다.

# 역할
- N8N 사용자의 에러 해결과 워크플로우 최적화를 도와줍니다
- 명확하고 실행 가능한 단계별 가이드를 제공합니다
- 한국어로 친절하게 응답합니다

# N8N 주요 개념
- **노드(Node)**: 워크플로우의 각 작업 단위
- **Code 노드**: JavaScript로 데이터 처리
- **Run Once for All Items**: 모든 아이템을 한 번에 처리
- **Run Once for Each Item**: 각 아이템마다 별도 실행
- **$input.all()**: 모든 입력 데이터 가져오기
- **$input.item**: 현재 아이템 가져오기

# 일반적인 문제 패턴
1. items[0] 사용으로 인한 데이터 손실
2. 필터 후 데이터 전송 실패
3. Expression 문법 오류
4. OAuth 설정 누락
5. Set 노드 필드 설정 오류

# 응답 원칙
- 문제의 근본 원인을 설명합니다
- Before/After 코드 예시를 제공합니다
- 단계별 수정 방법을 안내합니다
- 추가 참고 사항을 제공합니다

${errorContext ? `\n# 현재 컨텍스트\n${errorContext}\n` : ''}`;
}

// ========================================
// 1. API 키 관리
// ========================================

// API 키 저장
async function saveApiKey(apiKey) {
  await chrome.storage.local.set({ claudeApiKey: apiKey });
  console.log('✅ API Key saved');
}

// API 키 불러오기
async function getApiKey() {
  const result = await chrome.storage.local.get('claudeApiKey');
  return result.claudeApiKey || null;
}


// ========================================
// 2. Gemini API 호출
// ========================================

async function callGeminiAPI(userMessage, systemPrompt = '', context = {}) {
  console.log('🤖 Calling Gemini API...');
  console.log('Message:', userMessage);
  console.log('Context:', context);

  const apiKey = await getApiKey();

  if (!apiKey) {
    return {
      error: true,
      message: 'API 키가 설정되지 않았습니다. Extension 아이콘을 클릭하여 API 키를 입력해주세요.'
    };
  }

  // 저장된 모델 불러오기 (기본값: gemini-2.5-flash)
  const result = await chrome.storage.local.get('selectedModel');
  const selectedModel = result.selectedModel || 'gemini-2.5-flash';

  console.log('📌 Using model:', selectedModel);

  try {
    // Gemini API 엔드포인트
    // 사용자가 선택한 모델 사용 (2025년 10월 기준)
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${selectedModel}:generateContent?key=${apiKey}`;

    // 에러/워크플로우 분석인지 확인
    const isErrorAnalysis = context.errorContext || context.workflowContext || context.error;

    // N8N 지식베이스를 활용한 시스템 프롬프트 생성
    const errorContext = JSON.stringify(context);
    let n8nSystemPrompt = buildSystemPrompt(errorContext);

    // 에러 분석인 경우: 패턴 감지 및 추천
    if (isErrorAnalysis) {
      // 관련 패턴 자동 감지
      const detectedPatterns = detectRelevantPatterns(context);

      console.log('🔍 Detected patterns:', detectedPatterns.map(p => p.patternId));

      // 패턴 ID 목록 생성
      const allPatternIds = getAllPatternIds();

      // 패턴 기반 프롬프트 추가
      n8nSystemPrompt += `

# FIX PATTERNS (자동 수정 패턴)

다음은 사용 가능한 수정 패턴 목록입니다:
${allPatternIds.map(id => `- ${id}`).join('\n')}

${detectedPatterns.length > 0 ? `
## 감지된 패턴 (우선순위 순)
${detectedPatterns.map(p => `
### ${p.patternId} (신뢰도: ${p.confidence})
${p.pattern.description}
`).join('\n')}
` : ''}

# 응답 형식

문제를 해결할 수 있는 패턴이 있다면 다음 형식으로 응답하세요:

PATTERN_ID: <패턴_id>

그 다음 해당 패턴에 대한 간단한 설명을 한국어로 제공하세요.

예시:
PATTERN_ID: items_array_pattern

이 문제는 Code 노드에서 items[0]를 반환하여 발생했습니다. $input.all()로 변경하면 모든 아이템이 전송됩니다.

---

패턴으로 해결할 수 없는 일반 질문인 경우에는 PATTERN_ID 없이 일반 답변을 제공하세요.
`;
    }

    // 기존 시스템 프롬프트와 결합
    const enhancedSystemPrompt = systemPrompt
      ? `${systemPrompt}\n\n${n8nSystemPrompt}`
      : n8nSystemPrompt;

    console.log('📚 Using N8N knowledge base' + (isErrorAnalysis ? ' + Pattern Detection' : ''));

    // System prompt와 user message 결합
    const fullMessage = `${enhancedSystemPrompt}\n\n${formatMessageWithContext(userMessage, context)}`;

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: fullMessage
              }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 8192,  // 2048 → 8192로 증가 (thinking 토큰 + 실제 응답)
          responseModalities: ["TEXT"]  // TEXT 모달리티만 사용
        }
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || `API Error: ${response.status}`);
    }

    const data = await response.json();

    console.log('✅ Gemini API response received');
    console.log('📊 Response data:', JSON.stringify(data, null, 2));

    // Gemini API 응답 형식에서 텍스트 추출
    let text = data.candidates?.[0]?.content?.parts?.[0]?.text;

    // parts가 없는 경우 (thinking mode)
    if (!text) {
      console.warn('⚠️ No text in parts, checking for thinking tokens');

      // finishReason 확인
      const finishReason = data.candidates?.[0]?.finishReason;
      const thoughtsTokenCount = data.usageMetadata?.thoughtsTokenCount;

      if (finishReason === 'MAX_TOKENS' && thoughtsTokenCount > 0) {
        text = '⚠️ AI가 생각하는 데 너무 많은 리소스를 사용했습니다.\n\n더 간단한 질문으로 다시 시도해주세요.';
      } else {
        text = '응답을 받을 수 없습니다.\n\n다시 시도해주세요.';
      }

      console.error('❌ Failed to extract text from response');
      console.error('Response structure:', data);
    }

    return {
      success: true,
      content: text,
      usage: data.usageMetadata || {}
    };

  } catch (error) {
    console.error('❌ Gemini API Error:', error);
    return {
      error: true,
      message: `API 호출 실패: ${error.message}`
    };
  }
}


// ========================================
// 3. 메시지 포맷팅
// ========================================

function formatMessageWithContext(message, context) {
  if (!context || Object.keys(context).length === 0) {
    return message;
  }
  
  let formattedMessage = message + '\n\n--- N8N 컨텍스트 ---\n';
  
  if (context.currentNode) {
    formattedMessage += `\n현재 노드:\n- 타입: ${context.currentNode.type}\n- 이름: ${context.currentNode.name}\n`;
  }
  
  if (context.error) {
    formattedMessage += `\n발생한 에러:\n${context.error.message}\n`;
  }
  
  if (context.workflow) {
    formattedMessage += `\n워크플로우 정보:\n- 노드 개수: ${context.workflow.nodeCount}\n`;
  }
  
  return formattedMessage;
}


// ========================================
// 4. Content Script와 메시지 통신
// ========================================

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('📨 Message received:', request);

  if (request.action === 'callClaude') {
    // Gemini API 호출 (callClaude 액션 이름 유지하되 Gemini 사용)
    callGeminiAPI(request.message, request.systemPrompt, request.context)
      .then(result => {
        sendResponse(result);
      })
      .catch(error => {
        sendResponse({
          error: true,
          message: error.message
        });
      });

    // 비동기 응답을 위해 true 반환
    return true;
  }

  if (request.action === 'saveApiKey') {
    saveApiKey(request.apiKey)
      .then(() => {
        sendResponse({ success: true });
      })
      .catch(error => {
        sendResponse({ error: true, message: error.message });
      });

    return true;
  }

  if (request.action === 'getApiKey') {
    getApiKey()
      .then(apiKey => {
        sendResponse({ apiKey: apiKey });
      })
      .catch(error => {
        sendResponse({ error: true, message: error.message });
      });

    return true;
  }

  if (request.action === 'updateNodeTypes') {
    // Content script에서 받은 노드 타입 처리 및 저장
    const nodeTypes = request.nodeTypes;
    console.log(`📥 Received ${nodeTypes.length} node types from content script`);

    const processedNodes = processNodeTypes(nodeTypes);
    const nodeNames = processedNodes.map(n => n.displayName || n.name).sort();

    const docs = {
      allNodes: processedNodes,
      detailedNodes: processedNodes,
      nodeNames: nodeNames,
      version: 'Instance API',
      lastUpdated: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      source: 'n8n-instance-api'
    };

    saveN8NDocs(docs)
      .then(() => {
        sendResponse({ success: true, nodeCount: processedNodes.length });
      })
      .catch(error => {
        sendResponse({ error: true, message: error.message });
      });

    return true;
  }
});


// ========================================
// 5. Extension 설치/업데이트 이벤트
// ========================================

chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    console.log('🎉 N8N AI Copilot installed!');
    console.log('💡 Click the extension icon to set up your API key');
  } else if (details.reason === 'update') {
    console.log('🔄 N8N AI Copilot updated!');
  }
});


console.log('🚀 N8N AI Copilot Background Service Worker loaded');


// ========================================
// 6. N8N 문서 자동 업데이트 시스템
// ========================================

// N8N 문서 소스 - 사용자 인스턴스의 REST API 사용
const N8N_INSTANCE_URL = 'https://n8nryugw10.site';

// Sleep 유틸리티
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}


// 노드 타입 데이터를 우리 형식으로 변환
function processNodeTypes(nodeTypes) {
  const processed = nodeTypes.map(nodeType => {
    // N8N 노드 타입 구조:
    // {
    //   name: "n8n-nodes-base.airtable",
    //   displayName: "Airtable",
    //   description: "...",
    //   properties: [...],
    //   ...
    // }

    const name = nodeType.displayName || nodeType.name;
    const operations = [];

    // properties에서 operation/resource 추출
    if (nodeType.properties) {
      const resourceProp = nodeType.properties.find(p => p.name === 'resource');
      const operationProp = nodeType.properties.find(p => p.name === 'operation');

      if (resourceProp && resourceProp.options) {
        // 리소스별로 operations 정리
        resourceProp.options.forEach(resource => {
          const resourceName = resource.value;

          if (operationProp && operationProp.options) {
            operationProp.options
              .filter(op => !op.displayOptions || op.displayOptions.show?.resource?.includes(resourceName))
              .forEach(op => {
                operations.push(`${resourceName}:${op.name}`);
              });
          }
        });
      } else if (operationProp && operationProp.options) {
        // 리소스 없이 operation만 있는 경우
        operationProp.options.forEach(op => {
          operations.push(op.name);
        });
      }
    }

    return {
      name: name,
      displayName: nodeType.displayName,
      description: nodeType.description,
      operations: operations,
      hasOperations: operations.length > 0
    };
  });

  console.log(`✅ Processed ${processed.length} nodes (${processed.filter(n => n.hasOperations).length} with operations)`);
  return processed;
}


// 문서 저장
async function saveN8NDocs(docs) {
  try {
    await chrome.storage.local.set({ n8nDocs: docs });
    console.log(`✅ N8N docs saved (${docs.allNodes.length} nodes total, ${docs.detailedNodes.length} with operations)`);
    return true;
  } catch (error) {
    console.error('❌ Failed to save docs:', error);
    return false;
  }
}

// 문서 불러오기
async function loadN8NDocs() {
  try {
    const result = await chrome.storage.local.get('n8nDocs');

    if (!result.n8nDocs) {
      console.log('⚠️ No docs found yet - will be fetched when user visits N8N page');
      return null;
    }

    const docs = result.n8nDocs;
    console.log(`✅ Docs loaded (${docs.allNodes?.length || 0} nodes)`);
    return docs;

  } catch (error) {
    console.error('❌ Failed to load docs:', error);
    return null;
  }
}

// 확장 프로그램 설치/업데이트 이벤트
chrome.runtime.onInstalled.addListener(async (details) => {
  if (details.reason === 'install') {
    console.log('🎉 N8N AI Copilot installed!');
    console.log('💡 Node information will be fetched when you visit your N8N page');
  } else if (details.reason === 'update') {
    console.log('🔄 N8N AI Copilot updated!');
  }
});

// 백그라운드 스크립트 로드 시 캐시된 문서 확인
console.log('📥 Checking for cached N8N docs...');
loadN8NDocs().then(docs => {
  if (docs) {
    const nodeCount = docs.allNodes?.length || 0;
    const withOps = docs.detailedNodes?.filter(n => n.hasOperations).length || 0;
    console.log(`✅ N8N docs cached: ${nodeCount} nodes (${withOps} with operations)`);
  } else {
    console.log('💡 No cached docs - will fetch when user visits N8N page');
  }
});
