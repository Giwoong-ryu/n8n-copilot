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
// 2. Claude API 호출
// ========================================

async function callClaudeAPI(userMessage, systemPrompt = '', context = {}) {
  console.log('🤖 Calling Claude API...');
  console.log('Message:', userMessage);
  console.log('Context:', context);
  
  const apiKey = await getApiKey();
  
  if (!apiKey) {
    return {
      error: true,
      message: 'API 키가 설정되지 않았습니다. Extension 아이콘을 클릭하여 API 키를 입력해주세요.'
    };
  }
  
  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4096,
        system: systemPrompt || 'You are an expert N8N workflow automation assistant.',
        messages: [
          {
            role: 'user',
            content: formatMessageWithContext(userMessage, context)
          }
        ]
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || `API Error: ${response.status}`);
    }
    
    const data = await response.json();
    
    console.log('✅ Claude API response received');
    
    return {
      success: true,
      content: data.content[0].text,
      usage: data.usage
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
    // 비동기 처리를 위해 Promise 사용
    callClaudeAPI(request.message, request.systemPrompt, request.context)
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
