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
// 2. 저장된 API 키 불러오기
// ========================================
async function loadSavedApiKey() {
  try {
    const result = await chrome.storage.local.get(['claudeApiKey', 'selectedModel']);

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
  const saveThresholdsButton = document.getElementById('saveThresholds');

  // 폼 제출
  form.addEventListener('submit', handleFormSubmit);

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

  // 신뢰도 임계값 저장 버튼
  if (saveThresholdsButton) {
    saveThresholdsButton.addEventListener('click', saveConfidenceThresholds);
  }

  // 신뢰도 임계값 로드
  loadConfidenceThresholds();
}


// ========================================
// 5. 폼 제출 처리
// ========================================
async function handleFormSubmit(event) {
  event.preventDefault();

  console.log('Form submitted');

  const apiKeyInput = document.getElementById('apiKey');
  const modelSelect = document.getElementById('modelSelect');
  const saveButton = document.getElementById('saveButton');
  const apiKey = apiKeyInput.value.trim();
  const selectedModel = modelSelect.value;

  console.log('API Key:', apiKey.substring(0, 10));
  console.log('Selected Model:', selectedModel);

  // 유효성 검사
  if (!isValidApiKey(apiKey)) {
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

    // 모델 선택 저장
    await chrome.storage.local.set({ selectedModel: selectedModel });

    console.log('Saved to storage');

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
function isValidApiKey(apiKey) {
  // Google Gemini API 키 형식: AIzaSy...
  return apiKey.startsWith('AIzaSy') && apiKey.length > 30;
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
// 10. 신뢰도 임계값 관리
// ========================================

// 신뢰도 임계값 저장
async function saveConfidenceThresholds() {
  try {
    const autoThreshold = parseInt(document.getElementById('autoThreshold').value);
    const suggestThreshold = parseInt(document.getElementById('suggestThreshold').value);

    // 유효성 검사
    if (isNaN(autoThreshold) || autoThreshold < 0 || autoThreshold > 100) {
      showStatus('❌ 자동 수정 임계값은 0~100 사이여야 합니다', 'error');
      return;
    }

    if (isNaN(suggestThreshold) || suggestThreshold < 0 || suggestThreshold > 100) {
      showStatus('❌ UI 표시 임계값은 0~100 사이여야 합니다', 'error');
      return;
    }

    if (suggestThreshold > autoThreshold) {
      showStatus('❌ UI 표시 임계값은 자동 수정 임계값보다 낮아야 합니다', 'error');
      return;
    }

    // Chrome storage에 저장
    await chrome.storage.local.set({
      confidenceThresholds: {
        auto: autoThreshold,
        suggest: suggestThreshold
      }
    });

    console.log('✅ Confidence thresholds saved:', { auto: autoThreshold, suggest: suggestThreshold });
    showStatus('✅ 신뢰도 임계값이 저장되었습니다!', 'success');

  } catch (error) {
    console.error('❌ Failed to save confidence thresholds:', error);
    showStatus('❌ 저장에 실패했습니다: ' + error.message, 'error');
  }
}

// 신뢰도 임계값 로드
async function loadConfidenceThresholds() {
  try {
    const result = await chrome.storage.local.get('confidenceThresholds');

    if (result.confidenceThresholds) {
      const autoInput = document.getElementById('autoThreshold');
      const suggestInput = document.getElementById('suggestThreshold');

      if (autoInput) autoInput.value = result.confidenceThresholds.auto;
      if (suggestInput) suggestInput.value = result.confidenceThresholds.suggest;

      console.log('✅ Loaded confidence thresholds:', result.confidenceThresholds);
    } else {
      console.log('💡 Using default confidence thresholds');
    }
  } catch (error) {
    console.error('❌ Failed to load confidence thresholds:', error);
  }
}


console.log('📦 Popup.js loaded');
