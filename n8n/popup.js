/**
 * N8N AI Copilot - Popup JavaScript
 * Extension 설정 페이지의 로직
 */

// ========================================
// 1. DOM 로드 시 초기화
// ========================================
document.addEventListener('DOMContentLoaded', async () => {
  // API 키 확인 및 화면 전환
  const result = await chrome.storage.local.get('claudeApiKey');

  if (result.claudeApiKey) {
    // API 키가 있으면 메인 화면으로 전환
    showMainScreen(result.claudeApiKey);
  } else {
    // API 키가 없으면 인증 화면 표시
    showAuthScreen();
  }

  loadSavedApiKey();
  attachEventListeners();
});


// ========================================
// 2. 저장된 API 키 및 임시 입력값 불러오기
// ========================================
async function loadSavedApiKey() {
  try {
    const result = await chrome.storage.local.get(['claudeApiKey', 'selectedModel', 'tempInputValues']);

    // 저장된 API 키 불러오기
    if (result.claudeApiKey) {
      const apiKeyInput = document.getElementById('apiKey');
      // 보안을 위해 일부만 표시
      apiKeyInput.value = maskApiKey(result.claudeApiKey);
      apiKeyInput.dataset.fullKey = result.claudeApiKey;

      console.log('✅ Loaded saved API key');
    }

    // 저장된 모델 불러오기
    if (result.selectedModel) {
      const modelSelect = document.getElementById('modelSelect');
      if (modelSelect) {
        modelSelect.value = result.selectedModel;
        console.log('✅ Loaded saved model:', result.selectedModel);
      }
    }

    // 임시 입력 중인 값 복원 (popup 닫혔다가 다시 열었을 때)
    if (result.tempInputValues) {
      const temp = result.tempInputValues;

      // API Key 입력 중인 값
      if (temp.apiKey && !result.claudeApiKey) {
        const apiKeyInput = document.getElementById('apiKey');
        if (apiKeyInput) apiKeyInput.value = temp.apiKey;
      }

      // N8N URL
      if (temp.n8nUrl) {
        const n8nUrlInput = document.getElementById('n8nUrl');
        if (n8nUrlInput) n8nUrlInput.value = temp.n8nUrl;
      }

      // N8N API Key
      if (temp.n8nApiKey) {
        const n8nApiKeyInput = document.getElementById('n8nApiKey');
        if (n8nApiKeyInput) n8nApiKeyInput.value = temp.n8nApiKey;
      }

      console.log('✅ Restored temporary input values');
    }
  } catch (error) {
    console.error('❌ Failed to load API key:', error);
  }
}


// ========================================
// 3. API 키 마스킹 (보안)
// ========================================
function maskApiKey(apiKey) {
  if (!apiKey || apiKey.length < 20) {
    return apiKey;
  }

  // 앞 12자와 뒤 4자만 표시
  const start = apiKey.substring(0, 12);
  const end = apiKey.substring(apiKey.length - 4);

  return `${start}${'*'.repeat(20)}${end}`;
}


// ========================================
// 4. 이벤트 리스너 연결
// ========================================
function attachEventListeners() {
  const form = document.getElementById('settingsForm');
  const apiKeyInput = document.getElementById('apiKey');
  const changeApiKeyButton = document.getElementById('changeApiKeyButton');
  const providerSelect = document.getElementById('providerSelect');

  // 폼 제출
  form.addEventListener('submit', handleFormSubmit);

  // Provider 선택 변경
  if (providerSelect) {
    providerSelect.addEventListener('change', handleProviderChange);
    // 초기 로드 시 provider 설정
    loadSavedProvider();
  }

  // API 키 입력 시 마스킹 해제
  apiKeyInput.addEventListener('focus', () => {
    if (apiKeyInput.dataset.fullKey) {
      apiKeyInput.value = apiKeyInput.dataset.fullKey;
      delete apiKeyInput.dataset.fullKey;
    }
  });

  // API 키 입력 시 유효성 검사
  apiKeyInput.addEventListener('input', validateApiKey);

  // API 키 변경 버튼
  if (changeApiKeyButton) {
    changeApiKeyButton.addEventListener('click', () => {
      showAuthScreen();
    });
  }

  // N8N 연결 테스트 버튼
  const testN8nButton = document.getElementById('testN8nConnection');
  if (testN8nButton) {
    testN8nButton.addEventListener('click', testN8nConnection);
  }

  // 저장된 N8N 설정 불러오기
  loadN8NSettings();

  // 실시간 입력값 저장 (popup 닫혔다가 다시 열 때 복원용)
  setupAutoSaveInputs();
}

// 실시간 입력값 자동 저장 설정
function setupAutoSaveInputs() {
  const apiKeyInput = document.getElementById('apiKey');
  const n8nUrlInput = document.getElementById('n8nUrl');
  const n8nApiKeyInput = document.getElementById('n8nApiKey');

  // Debounce 함수 (너무 자주 저장하지 않도록)
  let saveTimeout;
  const debouncedSave = async () => {
    clearTimeout(saveTimeout);
    saveTimeout = setTimeout(async () => {
      const tempValues = {
        apiKey: apiKeyInput ? apiKeyInput.value : '',
        n8nUrl: n8nUrlInput ? n8nUrlInput.value : '',
        n8nApiKey: n8nApiKeyInput ? n8nApiKeyInput.value : ''
      };

      await chrome.storage.local.set({ tempInputValues: tempValues });
      console.log('💾 Auto-saved input values');
    }, 500); // 500ms 후에 저장
  };

  // 각 input에 리스너 추가
  if (apiKeyInput) {
    apiKeyInput.addEventListener('input', debouncedSave);
  }

  if (n8nUrlInput) {
    n8nUrlInput.addEventListener('input', debouncedSave);
  }

  if (n8nApiKeyInput) {
    n8nApiKeyInput.addEventListener('input', debouncedSave);
  }
}

// ========================================
// 4-1. Provider 변경 처리
// ========================================
async function loadSavedProvider() {
  const result = await chrome.storage.local.get('aiProvider');
  const providerSelect = document.getElementById('providerSelect');

  if (result.aiProvider && providerSelect) {
    providerSelect.value = result.aiProvider;
    handleProviderChange(); // UI 업데이트
  }
}

function handleProviderChange() {
  const providerSelect = document.getElementById('providerSelect');
  const provider = providerSelect.value;

  const apiKeyLabel = document.getElementById('apiKeyLabel');
  const apiKeyInput = document.getElementById('apiKey');
  const apiKeyHint = document.getElementById('apiKeyHint');
  const apiKeyLink = document.getElementById('apiKeyLink');
  const modelSelectGroup = document.getElementById('modelSelectGroup');
  const modelSelect = document.getElementById('modelSelect');

  // provider에 따라 UI 변경
  switch (provider) {
    case 'gemini':
      apiKeyLabel.textContent = '🆓 Google Gemini API Key (무료)';
      apiKeyInput.placeholder = 'AIzaSy...';
      apiKeyHint.innerHTML = 'API 키는 <a href="https://makersuite.google.com/app/apikey" target="_blank" id="apiKeyLink">Google AI Studio</a>에서 무료로 발급받을 수 있습니다.';
      modelSelectGroup.style.display = 'block';
      modelSelect.innerHTML = `
        <option value="gemini-2.5-flash" selected>⭐ Gemini 2.5 Flash (2025년 최신, 권장)</option>
        <option value="gemini-2.0-flash-exp">Gemini 2.0 Flash (2024년 12월)</option>
      `;
      break;

    case 'openai':
      apiKeyLabel.textContent = '💰 OpenAI API Key (유료)';
      apiKeyInput.placeholder = 'sk-proj-...';
      apiKeyHint.innerHTML = 'API 키는 <a href="https://platform.openai.com/api-keys" target="_blank" id="apiKeyLink">OpenAI Platform</a>에서 발급받을 수 있습니다. (유료)';
      modelSelectGroup.style.display = 'block';
      modelSelect.innerHTML = `
        <option value="gpt-4o" selected>⭐ GPT-4o (2024년 최신, 권장)</option>
        <option value="gpt-4o-mini">GPT-4o Mini (저렴, 빠름)</option>
        <option value="gpt-4-turbo">GPT-4 Turbo</option>
        <option value="gpt-3.5-turbo">GPT-3.5 Turbo (가장 저렴)</option>
      `;
      break;

    case 'claude':
      apiKeyLabel.textContent = '🧠 Claude API Key (유료)';
      apiKeyInput.placeholder = 'sk-ant-api03-...';
      apiKeyHint.innerHTML = 'API 키는 <a href="https://console.anthropic.com/settings/keys" target="_blank" id="apiKeyLink">Anthropic Console</a>에서 발급받을 수 있습니다. (유료)';
      modelSelectGroup.style.display = 'block';
      modelSelect.innerHTML = `
        <option value="claude-3-5-sonnet-20241022" selected>⭐ Claude 3.5 Sonnet (최신)</option>
        <option value="claude-3-opus-20240229">Claude 3 Opus (최고 성능)</option>
        <option value="claude-3-haiku-20240307">Claude 3 Haiku (저렴, 빠름)</option>
      `;
      break;
  }

  // API 키 초기화
  apiKeyInput.value = '';
  delete apiKeyInput.dataset.fullKey;
}


// ========================================
// 5. 폼 제출 처리
// ========================================
async function handleFormSubmit(event) {
  event.preventDefault();

  console.log('Form submitted');

  const apiKeyInput = document.getElementById('apiKey');
  const modelSelect = document.getElementById('modelSelect');
  const providerSelect = document.getElementById('providerSelect');
  const n8nUrlInput = document.getElementById('n8nUrl');
  const n8nApiKeyInput = document.getElementById('n8nApiKey');
  const saveButton = document.getElementById('saveButton');
  const apiKey = apiKeyInput.value.trim();
  const selectedModel = modelSelect.value;
  const aiProvider = providerSelect.value;
  const n8nUrl = n8nUrlInput ? n8nUrlInput.value.trim() : '';
  const n8nApiKey = n8nApiKeyInput ? n8nApiKeyInput.value.trim() : '';

  console.log('Provider:', aiProvider);
  console.log('API Key:', apiKey.substring(0, 10));
  console.log('Selected Model:', selectedModel);

  // 유효성 검사
  if (!isValidApiKey(apiKey, aiProvider)) {
    showStatus('올바른 API 키 형식이 아닙니다.', 'error');
    return;
  }

  // 저장 중 UI 업데이트
  saveButton.disabled = true;
  saveButton.textContent = '💾 저장 중...';

  try {
    // Background script를 통해 API 키 저장
    await chrome.runtime.sendMessage({
      action: 'saveApiKey',
      apiKey: apiKey
    });

    // 기타 설정 저장
    await chrome.storage.local.set({
      aiProvider: aiProvider,
      selectedModel: selectedModel,
      n8nUrl: n8nUrl,
      n8nApiKey: n8nApiKey
    });

    // 임시 입력값 삭제 (정식 저장되었으므로)
    await chrome.storage.local.remove('tempInputValues');

    console.log('Saved to storage via background script');

    showStatus('✅ API 키가 저장되었습니다!', 'success');

    // 입력 필드 마스킹
    apiKeyInput.value = maskApiKey(apiKey);
    apiKeyInput.dataset.fullKey = apiKey;

    console.log('✅ API key saved successfully');

    // 1초 후 메인 화면으로 전환
    setTimeout(() => {
      showMainScreen(apiKey);
    }, 1000);

  } catch (error) {
    console.error('❌ Failed to save API key:', error);
    showStatus('저장 실패: ' + error.message, 'error');
  } finally {
    // UI 복구
    saveButton.disabled = false;
    saveButton.textContent = '💾 저장하기';
  }
}


// ========================================
// 6. API 키 유효성 검사
// ========================================
function isValidApiKey(apiKey, provider) {
  const providerSelect = document.getElementById('providerSelect');
  const currentProvider = provider || providerSelect?.value || 'gemini';

  switch (currentProvider) {
    case 'gemini':
      // Google Gemini API 키 형식: AIzaSy...
      return apiKey.startsWith('AIzaSy') && apiKey.length > 30;

    case 'openai':
      // OpenAI API 키 형식: sk-proj-... 또는 sk-...
      return (apiKey.startsWith('sk-proj-') || apiKey.startsWith('sk-')) && apiKey.length > 40;

    case 'claude':
      // Claude API 키 형식: sk-ant-api03-...
      return apiKey.startsWith('sk-ant-api03-') && apiKey.length > 50;

    default:
      return apiKey.length > 20;
  }
}

function validateApiKey() {
  const apiKeyInput = document.getElementById('apiKey');
  const apiKey = apiKeyInput.value.trim();

  // 마스킹된 키는 검증하지 않음
  if (apiKeyInput.dataset.fullKey) {
    return;
  }

  if (apiKey.length > 0 && !isValidApiKey(apiKey)) {
    apiKeyInput.style.borderColor = '#ef4444';
  } else {
    apiKeyInput.style.borderColor = '#d1d5db';
  }
}


// ========================================
// 7. 상태 메시지 표시
// ========================================
function showStatus(message, type = 'success') {
  const statusElement = document.getElementById('statusMessage');

  if (!statusElement) return;

  statusElement.textContent = message;
  statusElement.className = `status ${type} show`;

  // 3초 후 자동으로 숨김
  setTimeout(() => {
    statusElement.classList.remove('show');
  }, 3000);
}


// ========================================
// 8. 외부 링크 처리
// ========================================
document.addEventListener('click', (event) => {
  if (event.target.tagName === 'A' && event.target.href.startsWith('http')) {
    event.preventDefault();
    chrome.tabs.create({ url: event.target.href });
  }
});


// ========================================
// 9. 화면 전환 함수
// ========================================

// 인증 화면 표시
function showAuthScreen() {
  const authScreen = document.getElementById('auth-screen');
  const mainScreen = document.getElementById('main-screen');

  if (authScreen && mainScreen) {
    authScreen.classList.add('active');
    mainScreen.classList.remove('active');

    // API 키 입력 필드 초기화
    const apiKeyInput = document.getElementById('apiKey');
    if (apiKeyInput) {
      apiKeyInput.value = '';
      delete apiKeyInput.dataset.fullKey;
    }

    console.log('🔄 Switched to auth screen');
  }
}

// 메인 화면 표시
function showMainScreen(apiKey) {
  const authScreen = document.getElementById('auth-screen');
  const mainScreen = document.getElementById('main-screen');
  const currentApiKeyElement = document.getElementById('currentApiKey');

  if (authScreen && mainScreen) {
    authScreen.classList.remove('active');
    mainScreen.classList.add('active');

    // 현재 API 키 표시 (마스킹)
    if (currentApiKeyElement && apiKey) {
      currentApiKeyElement.textContent = maskApiKey(apiKey);
    }

    console.log('🔄 Switched to main screen');
  }
}

// 화면 전환 (토글)
function switchScreen(screenId) {
  const screens = document.querySelectorAll('.screen');
  screens.forEach(screen => {
    screen.classList.remove('active');
  });

  const targetScreen = document.getElementById(screenId);
  if (targetScreen) {
    targetScreen.classList.add('active');
    console.log(`🔄 Switched to ${screenId}`);
  }
}

// ========================================
// N8N 연결 설정
// ========================================

// 저장된 N8N 설정 불러오기
async function loadN8NSettings() {
  try {
    const result = await chrome.storage.local.get(['n8nUrl', 'n8nApiKey']);

    const n8nUrlInput = document.getElementById('n8nUrl');
    const n8nApiKeyInput = document.getElementById('n8nApiKey');

    if (result.n8nUrl && n8nUrlInput) {
      n8nUrlInput.value = result.n8nUrl;
    }

    if (result.n8nApiKey && n8nApiKeyInput) {
      n8nApiKeyInput.value = result.n8nApiKey;
    }

    console.log('✅ Loaded N8N settings');
  } catch (error) {
    console.error('❌ Failed to load N8N settings:', error);
  }
}

// N8N 연결 테스트
async function testN8nConnection() {
  const n8nUrlInput = document.getElementById('n8nUrl');
  const n8nApiKeyInput = document.getElementById('n8nApiKey');
  const statusDiv = document.getElementById('n8nConnectionStatus');
  const testButton = document.getElementById('testN8nConnection');

  const n8nUrl = n8nUrlInput.value.trim();
  const n8nApiKey = n8nApiKeyInput.value.trim();

  if (!n8nUrl) {
    statusDiv.innerHTML = '<span style="color: #ef4444;">❌ N8N URL을 입력하세요</span>';
    return;
  }

  testButton.disabled = true;
  testButton.textContent = '🔌 연결 중...';
  statusDiv.innerHTML = '<span style="color: #6b7280;">연결 테스트 중...</span>';

  // 타임아웃 설정 (10초)
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);

  try {
    const headers = {};
    if (n8nApiKey) {
      headers['X-N8N-API-KEY'] = n8nApiKey;
    }

    const response = await fetch(`${n8nUrl}/api/v1/workflows`, {
      method: 'GET',
      headers: headers,
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (response.ok) {
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Received HTML instead of JSON. Check N8N URL.');
      }
      const data = await response.json();
      statusDiv.innerHTML = `<span style="color: #10b981;">✅ 연결 성공! (워크플로우 ${data.data ? data.data.length : 0}개)</span>`;
    } else if (response.status === 401) {
      statusDiv.innerHTML = '<span style="color: #ef4444;">❌ API Key가 올바르지 않습니다</span>';
    } else {
      statusDiv.innerHTML = `<span style="color: #ef4444;">❌ 연결 실패: ${response.status}</span>`;
    }
  } catch (error) {
    clearTimeout(timeoutId);
    console.error('N8N connection error:', error);

    if (error.name === 'AbortError') {
      statusDiv.innerHTML = '<span style="color: #ef4444;">❌ 연결 시간 초과 (10초)</span>';
    } else if (error.message.includes('Failed to fetch')) {
      statusDiv.innerHTML = '<span style="color: #ef4444;">❌ 서버에 연결할 수 없습니다. URL을 확인하세요</span>';
    } else {
      statusDiv.innerHTML = `<span style="color: #ef4444;">❌ 연결 실패: ${error.message}</span>`;
    }
  } finally {
    testButton.disabled = false;
    testButton.textContent = '🔌 연결 테스트';
  }
}


console.log('📦 Popup.js loaded');
