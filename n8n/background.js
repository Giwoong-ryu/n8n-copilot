/**
 * N8N AI Copilot - Background Service Worker
 * Claude API 연동 및 Content Script와의 통신 처리
 */

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
// 2. AI API 호출 (Multi-Provider)
// ========================================

// 2-1. Provider에 따라 적절한 API 호출
async function callAI(userMessage, systemPrompt = '', context = {}) {
  const result = await chrome.storage.local.get('aiProvider');
  const provider = result.aiProvider || 'gemini';

  console.log('🤖 Using AI Provider:', provider);

  switch(provider) {
    case 'gemini':
      return await callGeminiAPI(userMessage, systemPrompt, context);
    case 'openai':
      return await callOpenAIAPI(userMessage, systemPrompt, context);
    case 'claude':
      return await callClaudeAPI(userMessage, systemPrompt, context);
    default:
      return {
        error: true,
        message: '알 수 없는 AI Provider입니다.'
      };
  }
}

// 2-2. Gemini API 호출
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

  // 저장된 모델 불러오기 (기본값: gemini-2.5-flash-lite)
  const result = await chrome.storage.local.get('selectedModel');
  const selectedModel = result.selectedModel || 'gemini-2.5-flash-lite';

  console.log('📌 Using model:', selectedModel);

  try {
    // N8N 실시간 정보 로드 및 시스템 프롬프트에 추가
    const n8nDocs = await getRealTimeN8NNodeInfo();
    let enhancedSystemPrompt = systemPrompt;

    if (n8nDocs && n8nDocs.nodes && n8nDocs.nodes.length > 0) {
      // Static docs는 문자열 배열, Real-time API는 객체 배열
      const isStringArray = typeof n8nDocs.nodes[0] === 'string';

      console.log(`📊 [Gemini] Node data type: ${isStringArray ? 'String Array' : 'Object Array'}`);
      console.log(`📊 [Gemini] First node sample:`, n8nDocs.nodes[0]);

      let validNodes;
      if (isStringArray) {
        // Static docs: ["YouTube", "Gmail", ...]
        validNodes = n8nDocs.nodes.map(name => ({ name, description: '', operations: [], resources: [] }));
        console.log(`📊 [Gemini] Converted ${validNodes.length} string nodes to objects`);
        console.log(`📊 [Gemini] Sample converted nodes:`, validNodes.slice(0, 5).map(n => n.name));
      } else {
        // Real-time API: [{name: "YouTube", ...}, ...]
        validNodes = n8nDocs.nodes.filter(node => node && node.name);
      }

      // YouTube가 목록에 있는지 확인
      const hasYouTube = validNodes.some(node => node.name && node.name.toLowerCase().includes('youtube'));
      console.log(`🔍 [Gemini] YouTube in node list? ${hasYouTube}`);

      // YouTube 관련 노드 찾기 (철자 확인)
      const youtubeVariants = validNodes.filter(node =>
        node.name && (
          node.name.toLowerCase().includes('you') ||
          node.name.toLowerCase().includes('tube') ||
          node.name.toLowerCase().includes('video')
        )
      );
      console.log(`📺 [Gemini] YouTube/Video variants found:`, youtubeVariants.map(n => n.name));

      // Y로 시작하는 모든 노드
      const yNodes = validNodes.filter(node => node.name && node.name.toLowerCase().startsWith('y'));
      console.log(`📺 [Gemini] Nodes starting with Y:`, yNodes.map(n => n.name));

      if (hasYouTube) {
        const youtubeNode = validNodes.find(node => node.name && node.name.toLowerCase().includes('youtube'));
        console.log(`📺 [Gemini] YouTube node:`, youtubeNode);
      }

      const versionInfo = n8nDocs.version === 'real-time'
        ? '실시간 (사용자 N8N 인스턴스)'
        : n8nDocs.version;

      const nodeListText = validNodes.slice(0, 50).map(node => {
        let info = `- **${node.name}**`;

        if (node.description) {
          info += `: ${node.description}`;
        }

        // Resources 정보 추가
        if (node.resources && node.resources.length > 0) {
          info += `\n  Resources: ${node.resources.map(r => r.displayName || r.name).join(', ')}`;
        }

        // Operations 정보 추가
        if (node.operations && node.operations.length > 0) {
          info += `\n  Operations: ${node.operations.map(o => o.displayName || o.name).join(', ')}`;
        }

        return info;
      }).join('\n');

      enhancedSystemPrompt += `\n\n**N8N 환경 정보**:
- 버전: ${versionInfo}
- 사용 가능한 노드: ${validNodes.length}개

**주요 노드 목록** (정확한 이름과 세부 작업):
${nodeListText}

**중요**:
1. 위 노드 목록에 있는 노드 이름을 정확히 사용하세요
2. 여러 작업이 있는 노드는 위 Resources/Operations를 참고하여 정확한 작업 이름을 안내하세요
   예: "YouTube 노드에서 'Video Search' 작업 선택" 같이 구체적으로`;

      console.log(`✅ [Gemini] N8N node info added to system prompt (source: ${n8nDocs.version === 'real-time' ? 'Real-time API' : 'Static docs'}, nodes: ${validNodes.length})`);
      console.log(`📝 [Gemini] First 10 nodes in prompt:`, validNodes.slice(0, 10).map(n => n.name).join(', '));
    } else {
      console.warn('⚠️ [Gemini] No N8N docs available - AI will not have node information');
    }

    // Gemini API 엔드포인트
    // 사용자가 선택한 모델 사용 (2025년 10월 기준)
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${selectedModel}:generateContent?key=${apiKey}`;

    // System prompt와 user message 결합
    const fullMessage = enhancedSystemPrompt
      ? `${enhancedSystemPrompt}\n\n${formatMessageWithContext(userMessage, context)}`
      : formatMessageWithContext(userMessage, context);

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


// 2-3. OpenAI API 호출
async function callOpenAIAPI(userMessage, systemPrompt = '', context = {}) {
  console.log('🤖 Calling OpenAI API...');

  const apiKey = await getApiKey();

  if (!apiKey) {
    return {
      error: true,
      message: 'API 키가 설정되지 않았습니다.'
    };
  }

  const result = await chrome.storage.local.get('selectedModel');
  const selectedModel = result.selectedModel || 'gpt-4o';

  console.log('📌 Using model:', selectedModel);

  try {
    // N8N 실시간 정보 로드 및 시스템 프롬프트에 추가
    const n8nDocs = await getRealTimeN8NNodeInfo();
    let enhancedSystemPrompt = systemPrompt;

    if (n8nDocs && n8nDocs.nodes && n8nDocs.nodes.length > 0) {
      // Static docs는 문자열 배열, Real-time API는 객체 배열
      const isStringArray = typeof n8nDocs.nodes[0] === 'string';

      let validNodes;
      if (isStringArray) {
        // Static docs: ["YouTube", "Gmail", ...]
        validNodes = n8nDocs.nodes.map(name => ({ name, description: '', operations: [], resources: [] }));
      } else {
        // Real-time API: [{name: "YouTube", ...}, ...]
        validNodes = n8nDocs.nodes.filter(node => node && node.name);
      }

      const versionInfo = n8nDocs.version === 'real-time'
        ? '실시간 (사용자 N8N 인스턴스)'
        : n8nDocs.version;

      enhancedSystemPrompt += `\n\n**N8N 환경 정보**:
- 버전: ${versionInfo}
- 사용 가능한 노드: ${validNodes.length}개

**주요 노드 목록** (정확한 이름과 세부 작업):
${validNodes.slice(0, 50).map(node => {
  let info = `- **${node.name}**`;

  if (node.description) {
    info += `: ${node.description}`;
  }

  // Resources 정보 추가
  if (node.resources && node.resources.length > 0) {
    info += `\n  Resources: ${node.resources.map(r => r.displayName || r.name).join(', ')}`;
  }

  // Operations 정보 추가
  if (node.operations && node.operations.length > 0) {
    info += `\n  Operations: ${node.operations.map(o => o.displayName || o.name).join(', ')}`;
  }

  return info;
}).join('\n')}

**중요**:
1. 위 노드 목록에 있는 노드 이름을 정확히 사용하세요
2. 여러 작업이 있는 노드는 위 Resources/Operations를 참고하여 정확한 작업 이름을 안내하세요
   예: "YouTube 노드에서 'Video Search' 작업 선택" 같이 구체적으로`;

      console.log(`✅ N8N node info added to system prompt (source: ${n8nDocs.version === 'real-time' ? 'Real-time API' : 'Static docs'}, nodes: ${validNodes.length})`);
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: selectedModel,
        messages: [
          { role: 'system', content: enhancedSystemPrompt || 'You are a helpful N8N workflow automation assistant.' },
          { role: 'user', content: formatMessageWithContext(userMessage, context) }
        ],
        temperature: 0.7,
        max_tokens: 4096
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || `API Error: ${response.status}`);
    }

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content;

    console.log('✅ OpenAI API response received');

    return {
      success: true,
      content: text,
      usage: data.usage || {}
    };

  } catch (error) {
    console.error('❌ OpenAI API Error:', error);
    return {
      error: true,
      message: `API 호출 실패: ${error.message}`
    };
  }
}

// 2-4. Claude API 호출
async function callClaudeAPI(userMessage, systemPrompt = '', context = {}) {
  console.log('🤖 Calling Claude API...');

  const apiKey = await getApiKey();

  if (!apiKey) {
    return {
      error: true,
      message: 'API 키가 설정되지 않았습니다.'
    };
  }

  const result = await chrome.storage.local.get('selectedModel');
  const selectedModel = result.selectedModel || 'claude-3-5-sonnet-20241022';

  console.log('📌 Using model:', selectedModel);

  try {
    // N8N 실시간 정보 로드 및 시스템 프롬프트에 추가
    const n8nDocs = await getRealTimeN8NNodeInfo();
    let enhancedSystemPrompt = systemPrompt || 'You are a helpful N8N workflow automation assistant.';

    if (n8nDocs && n8nDocs.nodes && n8nDocs.nodes.length > 0) {
      // Static docs는 문자열 배열, Real-time API는 객체 배열
      const isStringArray = typeof n8nDocs.nodes[0] === 'string';

      let validNodes;
      if (isStringArray) {
        // Static docs: ["YouTube", "Gmail", ...]
        validNodes = n8nDocs.nodes.map(name => ({ name, description: '', operations: [], resources: [] }));
      } else {
        // Real-time API: [{name: "YouTube", ...}, ...]
        validNodes = n8nDocs.nodes.filter(node => node && node.name);
      }

      const versionInfo = n8nDocs.version === 'real-time'
        ? '실시간 (사용자 N8N 인스턴스)'
        : n8nDocs.version;

      enhancedSystemPrompt += `\n\n**N8N 환경 정보**:
- 버전: ${versionInfo}
- 사용 가능한 노드: ${validNodes.length}개

**주요 노드 목록** (정확한 이름과 세부 작업):
${validNodes.slice(0, 50).map(node => {
  let info = `- **${node.name}**`;

  if (node.description) {
    info += `: ${node.description}`;
  }

  // Resources 정보 추가
  if (node.resources && node.resources.length > 0) {
    info += `\n  Resources: ${node.resources.map(r => r.displayName || r.name).join(', ')}`;
  }

  // Operations 정보 추가
  if (node.operations && node.operations.length > 0) {
    info += `\n  Operations: ${node.operations.map(o => o.displayName || o.name).join(', ')}`;
  }

  return info;
}).join('\n')}

**중요**:
1. 위 노드 목록에 있는 노드 이름을 정확히 사용하세요
2. 여러 작업이 있는 노드는 위 Resources/Operations를 참고하여 정확한 작업 이름을 안내하세요
   예: "YouTube 노드에서 'Video Search' 작업 선택" 같이 구체적으로`;

      console.log(`✅ N8N node info added to system prompt (source: ${n8nDocs.version === 'real-time' ? 'Real-time API' : 'Static docs'}, nodes: ${validNodes.length})`);
    }

    const fullMessage = formatMessageWithContext(userMessage, context);

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: selectedModel,
        max_tokens: 4096,
        system: enhancedSystemPrompt,
        messages: [
          { role: 'user', content: fullMessage }
        ]
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || `API Error: ${response.status}`);
    }

    const data = await response.json();
    const text = data.content?.[0]?.text;

    console.log('✅ Claude API response received');

    return {
      success: true,
      content: text,
      usage: data.usage || {}
    };

  } catch (error) {
    console.error('❌ Claude API Error:', error);
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
    // Multi-Provider AI 호출 (callClaude 액션 이름 유지하되 선택된 provider 사용)
    callAI(request.message, request.systemPrompt, request.context)
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

// N8N 문서 소스
const N8N_DOCS_SOURCES = {
  github_nodes: 'https://api.github.com/repos/n8n-io/n8n/contents/packages/nodes-base/nodes',
  changelog: 'https://raw.githubusercontent.com/n8n-io/n8n/master/CHANGELOG.md'
};

// 문서 가져오기 - 재귀적으로 모든 노드 수집
async function fetchN8NDocs() {
  console.log('📥 Fetching N8N docs...');

  try {
    // 최상위 디렉토리 가져오기
    const [topLevelRes, changelogRes] = await Promise.all([
      fetch(N8N_DOCS_SOURCES.github_nodes, {
        headers: { 'Accept': 'application/vnd.github.v3+json' }
      }),
      fetch(N8N_DOCS_SOURCES.changelog)
    ]);

    const topLevelNodes = await topLevelRes.json();
    const changelog = await changelogRes.text();

    console.log(`📁 Found ${topLevelNodes.length} top-level directories`);

    // 모든 노드 수집 (최상위 + 서브디렉토리)
    const allNodes = [];

    // 최상위 디렉토리 추가
    const topDirs = topLevelNodes.filter(item => item.type === 'dir');
    allNodes.push(...topDirs.map(item => item.name));

    // 각 최상위 디렉토리의 서브디렉토리 탐색
    const subDirPromises = topDirs.map(async (dir) => {
      try {
        const subRes = await fetch(dir.url, {
          headers: { 'Accept': 'application/vnd.github.v3+json' }
        });
        const subItems = await subRes.json();

        // 서브디렉토리 필터링 (파일 제외)
        const subDirs = subItems
          .filter(item => item.type === 'dir')
          .map(item => item.name);

        if (subDirs.length > 0) {
          console.log(`  └─ ${dir.name}/: ${subDirs.join(', ')}`);
        }

        return subDirs;
      } catch (error) {
        console.warn(`⚠️ Failed to fetch subdirs for ${dir.name}:`, error.message);
        return [];
      }
    });

    const subDirArrays = await Promise.all(subDirPromises);
    const allSubDirs = subDirArrays.flat();

    allNodes.push(...allSubDirs);

    // 중복 제거 및 정렬
    const uniqueNodes = [...new Set(allNodes)].sort();

    console.log(`✅ Collected ${uniqueNodes.length} total nodes (${topDirs.length} top-level + ${allSubDirs.length} sub-level)`);

    // 최신 버전 추출
    const latestVersion = changelog.split('\n## ')[1]?.split('\n')[0] || 'Unknown';

    return {
      nodes: uniqueNodes,
      changelog: changelog.split('\n## ').slice(0, 3).join('\n## '),
      version: latestVersion,
      lastUpdated: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    };

  } catch (error) {
    console.error('❌ Failed to fetch N8N docs:', error);
    return null;
  }
}

// 문서 저장
async function saveN8NDocs(docs) {
  try {
    await chrome.storage.local.set({ n8nDocs: docs });
    console.log(`✅ N8N docs saved (${docs.nodes.length} nodes)`);
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
      console.log('⚠️ No docs found, fetching...');
      return await updateN8NDocsNow();
    }

    const docs = result.n8nDocs;
    const expiresAt = new Date(docs.expiresAt);

    // 만료 체크
    if (new Date() > expiresAt) {
      console.log('⚠️ Docs expired, updating...');
      return await updateN8NDocsNow();
    }

    console.log(`✅ Docs loaded (${docs.nodes.length} nodes)`);
    return docs;

  } catch (error) {
    console.error('❌ Failed to load docs:', error);
    return null;
  }
}

// 즉시 업데이트
async function updateN8NDocsNow() {
  console.log('🔄 Updating N8N docs now...');
  const docs = await fetchN8NDocs();

  if (docs) {
    await saveN8NDocs(docs);
  }

  return docs;
}

// 1주일마다 자동 업데이트 (Chrome Alarms API)
chrome.alarms.create('updateN8NDocs', {
  periodInMinutes: 10080 // 7일 = 10080분
});

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'updateN8NDocs') {
    console.log('⏰ Weekly N8N docs update triggered');
    updateN8NDocsNow();
  }
});

// 확장 프로그램 설치 시 즉시 문서 가져오기
chrome.runtime.onInstalled.addListener(async (details) => {
  if (details.reason === 'install') {
    console.log('🎉 N8N AI Copilot installed! Fetching docs...');
    await updateN8NDocsNow();
  } else if (details.reason === 'update') {
    console.log('🔄 N8N AI Copilot updated!');
  }
});

// 백그라운드 스크립트 로드 시 즉시 문서 가져오기
console.log('📥 Initializing N8N docs on startup...');
loadN8NDocs().then(docs => {
  if (docs) {
    console.log(`✅ N8N docs ready: ${docs.nodes.length} nodes, version ${docs.version}`);

    // YouTube 노드 확인
    const hasYouTube = docs.nodes.some(node => node.toLowerCase().includes('youtube'));
    console.log(`🔍 YouTube in docs? ${hasYouTube}`);

    if (!hasYouTube) {
      console.warn('⚠️ YouTube not found in docs. This may indicate incomplete data. Consider forcing an update.');
      console.warn('💡 Run: updateN8NDocsNow() in console to force update');
    }
  } else {
    console.log('⚠️ Failed to load docs on startup');
  }
});

// 강제 업데이트 함수를 전역으로 노출 (디버깅용)
// Service worker에서는 window 대신 globalThis 사용
globalThis.forceUpdateN8NDocs = updateN8NDocsNow;

// ========================================
// 7. N8N API Client
// ========================================

// N8N에서 사용 가능한 노드 타입 목록 가져오기
async function fetchN8NNodeTypes() {
  try {
    const result = await chrome.storage.local.get(['n8nUrl', 'n8nApiKey']);
    const { n8nUrl, n8nApiKey } = result;

    if (!n8nUrl) {
      console.log('⚠️ N8N URL not configured, using static docs');
      return null;
    }

    console.log(`🔗 Attempting to connect to N8N: ${n8nUrl}`);

    const headers = {};
    if (n8nApiKey) {
      headers['X-N8N-API-KEY'] = n8nApiKey;
      console.log('🔑 Using N8N API Key');
    } else {
      console.log('⚠️ No N8N API Key configured');
    }

    const response = await fetch(`${n8nUrl}/api/v1/node-types`, {
      method: 'GET',
      headers: headers
    });

    if (!response.ok) {
      if (response.status === 404) {
        console.warn('⚠️ N8N API endpoint not found (404). This may be N8N Cloud or older version.');
        console.warn('💡 Using static docs as fallback. For real-time data, ensure N8N API is enabled.');
      } else {
        console.error(`❌ Failed to fetch N8N node types: ${response.status}`);
      }
      return null;
    }

    const data = await response.json();
    console.log(`✅ Successfully fetched ${data.length} node types from N8N API`);
    return data;
  } catch (error) {
    console.error('❌ Error fetching N8N node types:', error);
    return null;
  }
}

// 특정 노드의 스키마(필드 정보) 가져오기
async function fetchN8NNodeSchema(nodeName) {
  try {
    const result = await chrome.storage.local.get(['n8nUrl', 'n8nApiKey']);
    const { n8nUrl, n8nApiKey } = result;

    if (!n8nUrl) {
      return null;
    }

    const headers = {};
    if (n8nApiKey) {
      headers['X-N8N-API-KEY'] = n8nApiKey;
    }

    const response = await fetch(`${n8nUrl}/api/v1/node-types/${encodeURIComponent(nodeName)}`, {
      method: 'GET',
      headers: headers
    });

    if (!response.ok) {
      console.error(`❌ Failed to fetch schema for ${nodeName}: ${response.status}`);
      return null;
    }

    const data = await response.json();
    console.log(`✅ Fetched schema for ${nodeName}`);
    return data;
  } catch (error) {
    console.error(`❌ Error fetching schema for ${nodeName}:`, error);
    return null;
  }
}

// N8N에서 실시간 노드 정보 가져오기 (AI 컨텍스트용)
async function getRealTimeN8NNodeInfo() {
  const nodeTypes = await fetchN8NNodeTypes();

  if (!nodeTypes || !nodeTypes.length) {
    // N8N 연결 안 되면 기존 정적 문서 사용
    console.log('📚 Using static N8N docs (N8N API not connected)');
    return await loadN8NDocs();
  }

  console.log('🌐 Using real-time N8N API data');

  // N8N API에서 가져온 노드 목록을 docs 형식으로 변환
  // operations와 resources 정보도 추출
  const nodes = nodeTypes.map(node => {
    const nodeInfo = {
      name: node.displayName || node.name,
      description: node.description || '',
      version: node.version || 1
    };

    // properties에서 resource와 operation 정보 추출
    if (node.properties) {
      const resourceProp = node.properties.find(p => p.name === 'resource');
      const operationProp = node.properties.find(p => p.name === 'operation');

      if (resourceProp && resourceProp.options) {
        nodeInfo.resources = resourceProp.options.map(opt => ({
          name: opt.value,
          displayName: opt.name,
          description: opt.description || ''
        }));
      }

      if (operationProp && operationProp.options) {
        nodeInfo.operations = operationProp.options.map(opt => ({
          name: opt.value,
          displayName: opt.name,
          description: opt.description || ''
        }));
      }
    }

    return nodeInfo;
  });

  return {
    nodes: nodes,
    version: 'real-time',
    fetchedAt: new Date().toISOString()
  };
}
