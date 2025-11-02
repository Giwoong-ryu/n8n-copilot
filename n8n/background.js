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

    // System prompt와 user message 결합
    const fullMessage = systemPrompt
      ? `${systemPrompt}\n\n${formatMessageWithContext(userMessage, context)}`
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

// 자주 사용되는 주요 노드 리스트 (상세 operations 수집 대상)
const PRIORITY_NODES = [
  // ===== Core workflow nodes (필수) =====
  'HttpRequest', 'Webhook', 'Code', 'Set', 'IF', 'Switch', 'Merge', 'Split',
  'Loop Over Items', 'Edit Fields', 'Execute Workflow', 'Wait', 'Schedule Trigger',
  'Execute Command', 'Function', 'Function Item', 'Item Lists', 'Move Binary Data',

  // ===== AI & ML (전체 AI 관련) =====
  'OpenAI', 'Anthropic', 'Google Gemini', 'Google PaLM', 'Cohere', 'Hugging Face',
  'Replicate', 'Stability AI', 'Pinecone', 'Qdrant', 'Weaviate', 'Chroma',
  'AI Agent', 'AI Chain', 'AI Transform', 'Vector Store', 'Embeddings',
  'Text Classifier', 'Sentiment Analysis', 'Language Translator',
  'Mistral Cloud', 'Ollama', 'LangChain', 'LlamaIndex',

  // ===== Google suite =====
  'Google Sheets', 'Gmail', 'Google Drive', 'Google Calendar', 'Google Docs',
  'Google Slides', 'Google Tasks', 'Google Contacts', 'Google Cloud',

  // ===== Communication =====
  'Slack', 'Discord', 'Telegram', 'WhatsApp', 'Microsoft Teams', 'Mattermost',
  'Email Send', 'Email Trigger', 'Twilio', 'SMS', 'Voice Call',

  // ===== Social media =====
  'Twitter', 'X', 'Instagram', 'Facebook', 'LinkedIn', 'YouTube', 'TikTok',
  'Reddit', 'Mastodon', 'Bluesky',

  // ===== Databases =====
  'MySQL', 'PostgreSQL', 'MongoDB', 'Redis', 'SQLite', 'Microsoft SQL',
  'Supabase', 'Firebase', 'Elasticsearch', 'InfluxDB', 'QuestDB',

  // ===== Cloud storage & Productivity =====
  'Airtable', 'Notion', 'Dropbox', 'OneDrive', 'Box', 'Google Cloud Storage',
  'Asana', 'ClickUp', 'Monday.com', 'Todoist', 'Evernote',

  // ===== Development & DevOps =====
  'GitHub', 'GitLab', 'Bitbucket', 'Jira', 'Trello', 'Linear', 'Sentry',
  'Docker', 'Kubernetes', 'Jenkins', 'CircleCI', 'Vercel', 'Netlify',

  // ===== AWS =====
  'AWS S3', 'AWS Lambda', 'AWS DynamoDB', 'AWS SES', 'AWS SNS', 'AWS SQS',
  'AWS Comprehend', 'AWS Textract', 'AWS Rekognition', 'AWS Bedrock',

  // ===== Payment & E-commerce =====
  'Stripe', 'PayPal', 'Square', 'Shopify', 'WooCommerce', 'Magento',

  // ===== CRM & Marketing =====
  'HubSpot', 'Salesforce', 'Mailchimp', 'SendGrid', 'Brevo', 'ActiveCampaign',
  'Pipedrive', 'Zendesk', 'Intercom', 'Freshdesk',

  // ===== Data Processing =====
  'RSS', 'XML', 'JSON', 'CSV', 'HTML Extract', 'Markdown', 'PDF',
  'Spreadsheet File', 'Excel', 'Compression', 'Crypto', 'Hash',

  // ===== 최신 노드 (2024-2025) =====
  'Cloudflare', 'Supabase', 'Cal.com', 'n8n', 'Form Trigger',
  'Chat Trigger', 'Agent', 'Tools', 'Output Parser', 'Memory',
  'Document Loader', 'Recursive Character Text Splitter'
];

// Sleep 유틸리티
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// 리소스 폴더에서 operations 추출
async function fetchOperationsFromResource(resourcePath) {
  try {
    const resourceUrl = `https://api.github.com/repos/n8n-io/n8n/contents/${resourcePath}`;
    const resourceResponse = await fetch(resourceUrl, {
      headers: { 'Accept': 'application/vnd.github.v3+json' }
    });

    if (!resourceResponse.ok) return [];

    const resourceContent = await resourceResponse.json();

    // .operation.ts 파일들 찾기
    return resourceContent
      .filter(item => item.type === 'file' && item.name.endsWith('.operation.ts'))
      .map(item => {
        // create.operation.ts -> Create
        const opName = item.name
          .replace('.operation.ts', '')
          .replace(/([A-Z])/g, ' $1')
          .trim();
        return opName.charAt(0).toUpperCase() + opName.slice(1);
      });

  } catch (error) {
    return [];
  }
}

// 버전 폴더에서 operations 추출
async function fetchOperationsFromVersion(versionPath) {
  try {
    // actions 폴더 확인
    const actionsUrl = `https://api.github.com/repos/n8n-io/n8n/contents/${versionPath}/actions`;
    const actionsResponse = await fetch(actionsUrl, {
      headers: { 'Accept': 'application/vnd.github.v3+json' }
    });

    if (!actionsResponse.ok) return [];

    const actionsContent = await actionsResponse.json();
    const operations = [];

    // 각 리소스 폴더 확인 (record, base 등)
    for (const item of actionsContent) {
      if (item.type === 'dir') {
        const resourceOps = await fetchOperationsFromResource(item.path);
        operations.push(...resourceOps.map(op => `${item.name}:${op}`));
      }
    }

    return operations;
  } catch (error) {
    return [];
  }
}

// 노드의 operations 가져오기 (주요 노드만 상세 수집)
async function fetchNodeOperations(nodes) {
  const totalNodes = nodes.length;
  let results = [];

  // 주요 노드 필터링
  const priorityNodes = nodes.filter(node => PRIORITY_NODES.includes(node.name));

  // 주요가 아닌 노드들 (operations 없이 추가)
  const nonPriorityNodes = nodes.filter(node => !PRIORITY_NODES.includes(node.name));

  console.log(`  📊 Priority nodes to fetch: ${priorityNodes.length}`);
  console.log(`  📄 Non-priority nodes (name only): ${nonPriorityNodes.length}`);

  // 주요가 아닌 노드들은 operations 없이 바로 추가
  for (const node of nonPriorityNodes) {
    results.push({
      name: node.name,
      operations: [],
      hasOperations: false,
      isPriority: false
    });
  }

  // 주요 노드만 상세 수집
  let fetchedCount = 0;
  for (const node of priorityNodes) {
    try {
      fetchedCount++;
      console.log(`  📥 Fetching [${fetchedCount}/${priorityNodes.length}]: ${node.name}`);

      // 노드 폴더 내부 확인
      const nodeContentUrl = `https://api.github.com/repos/n8n-io/n8n/contents/${node.path}`;
      const nodeResponse = await fetch(nodeContentUrl, {
        headers: { 'Accept': 'application/vnd.github.v3+json' }
      });

      if (!nodeResponse.ok) {
        // Rate limit 에러 체크
        if (nodeResponse.status === 403) {
          console.warn(`  ⚠️ GitHub API rate limit reached at priority node ${fetchedCount}/${priorityNodes.length}`);
          console.warn(`  💾 Saving progress...`);
          break;
        }

        results.push({
          name: node.name,
          operations: [],
          hasOperations: false,
          isPriority: true
        });
        continue;
      }

      const nodeContent = await nodeResponse.json();

      // v2, v1 같은 버전 폴더 찾기
      const versionFolders = nodeContent
        .filter(item => item.type === 'dir' && /^v\d+$/.test(item.name))
        .sort((a, b) => b.name.localeCompare(a.name));

      let operations = [];

      // 최신 버전 폴더 확인
      if (versionFolders.length > 0) {
        const latestVersion = versionFolders[0];
        operations = await fetchOperationsFromVersion(latestVersion.path);
      }

      results.push({
        name: node.name,
        operations: operations,
        hasOperations: operations.length > 0,
        isPriority: true
      });

      // Rate limiting 방지
      await sleep(200);

    } catch (error) {
      console.error(`  ❌ Failed to fetch operations for ${node.name}:`, error.message);
      results.push({
        name: node.name,
        operations: [],
        hasOperations: false,
        isPriority: true
      });
    }
  }

  const priorityWithOps = results.filter(n => n.isPriority && n.hasOperations).length;
  console.log(`  ✅ Complete: ${results.length} total nodes (${priorityWithOps} priority nodes with operations)`);
  return results;
}

// 문서 가져오기
async function fetchN8NDocs() {
  console.log('📥 Fetching N8N docs...');

  try {
    const [nodesRes, changelogRes] = await Promise.all([
      fetch(N8N_DOCS_SOURCES.github_nodes, {
        headers: { 'Accept': 'application/vnd.github.v3+json' }
      }),
      fetch(N8N_DOCS_SOURCES.changelog)
    ]);

    // Rate limit 체크
    if (!nodesRes.ok) {
      if (nodesRes.status === 403) {
        const resetTime = nodesRes.headers.get('X-RateLimit-Reset');
        const resetDate = resetTime ? new Date(parseInt(resetTime) * 1000) : null;
        const waitMinutes = resetDate ? Math.ceil((resetDate - new Date()) / 60000) : '알 수 없음';

        console.error(`⚠️ GitHub API rate limit reached`);
        console.error(`⏰ Rate limit resets in ${waitMinutes} minutes`);
        console.error(`💡 Extension을 켜두시면 ${waitMinutes}분 후 자동으로 재시도됩니다`);
        return null;
      }
      throw new Error(`GitHub API error: ${nodesRes.status} ${nodesRes.statusText}`);
    }

    const nodes = await nodesRes.json();
    const changelog = await changelogRes.text();

    // 노드 목록 추출
    const nodeList = nodes
      .filter(item => item.type === 'dir')
      .map(item => ({
        name: item.name,
        path: item.path,
        url: item.html_url
      }))
      .sort((a, b) => a.name.localeCompare(b.name));

    console.log(`✅ Found ${nodeList.length} nodes`);

    // 최신 버전 추출
    const latestVersion = changelog.split('\n## ')[1]?.split('\n')[0] || 'Unknown';

    // 상세 노드 정보 가져오기 (주요 노드만 operations 수집)
    console.log('📥 Fetching operations for priority nodes...');
    const detailedNodes = await fetchNodeOperations(nodeList);

    return {
      allNodes: nodeList,
      detailedNodes: detailedNodes,
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
      console.log('⚠️ No docs found, fetching...');
      return await updateN8NDocsNow();
    }

    const docs = result.n8nDocs;

    // 만료 체크
    if (docs.expiresAt) {
      const expiresAt = new Date(docs.expiresAt);
      if (new Date() > expiresAt) {
        console.log('⚠️ Docs expired, updating...');
        return await updateN8NDocsNow();
      }
    }

    console.log(`✅ Docs loaded (${docs.allNodes?.length || docs.nodes?.length || 0} nodes)`);
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

// 백그라운드 스크립트 로드 시 즉시 문서 가져오기 (오늘 날짜로)
console.log('📥 Initializing N8N docs on startup...');
loadN8NDocs().then(docs => {
  if (docs) {
    const nodeCount = docs.allNodes?.length || docs.nodes?.length || 0;
    const detailedCount = docs.detailedNodes?.length || 0;
    console.log(`✅ N8N docs ready: ${nodeCount} nodes (${detailedCount} with operations), version ${docs.version}`);
  } else {
    console.log('⚠️ Failed to load docs on startup');
  }
});
