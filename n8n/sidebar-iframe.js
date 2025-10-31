/**
 * N8N AI Copilot - Sidebar iframe JavaScript
 * iframe 내부에서 실행되는 스크립트
 */

// ========================================
// iframe 내부 스크립트
// ========================================
console.log('📦 Sidebar iframe script loaded');

const messagesContainer = document.getElementById('messagesContainer');
const messageInput = document.getElementById('messageInput');
const sendButton = document.getElementById('sendButton');

// 메시지 전송 함수
async function sendMessage() {
  const message = messageInput.value.trim();

  if (!message) {
    console.log('⚠️ Empty message, not sending');
    return;
  }

  console.log('📤 Sending message:', message);

  // 사용자 메시지 표시
  addMessage(message, 'user');
  messageInput.value = '';
  sendButton.disabled = true;

  // 로딩 표시
  const loadingId = showLoading();

  try {
    // parent window(content.js)로 메시지 전송
    window.parent.postMessage({
      type: 'send-message',
      message: message
    }, '*');

    console.log('✅ Message sent to parent window');

  } catch (error) {
    console.error('❌ Error sending message:', error);
    hideLoading(loadingId);
    addMessage('메시지 전송 중 오류가 발생했습니다.', 'error');
    sendButton.disabled = false;
  }
}

// 메시지 추가 함수
function addMessage(text, type = 'assistant') {
  console.log(`💬 Adding message [${type}]:`, text.substring(0, 50));

  const messageDiv = document.createElement('div');
  messageDiv.className = `message ${type}`;

  // assistant 메시지는 마크다운을 HTML로 변환
  if (type === 'assistant') {
    // marked 라이브러리가 로드되어 있는지 확인
    if (typeof marked !== 'undefined') {
      // 마크다운을 HTML로 변환
      messageDiv.innerHTML = marked.parse(text);

      // 단계 버튼에 이벤트 리스너 추가
      setTimeout(() => {
        // 1. 기존 HTML 버튼 처리
        const stepButtons = messageDiv.querySelectorAll('.step-button');
        stepButtons.forEach(button => {
          button.addEventListener('click', (e) => {
            const step = e.target.dataset.step;
            console.log('📖 Step button clicked:', step);

            // 입력창에 자동으로 메시지 입력
            messageInput.value = `${step}번 단계 자세히 알려줘`;
            messageInput.focus();
          });
        });

        // 2. 번호 리스트 자동 감지 및 버튼 추가
        const listItems = messageDiv.querySelectorAll('ol > li, ul > li');
        listItems.forEach((li, index) => {
          const text = li.textContent.trim();

          // 이미 버튼이 있으면 스킵
          if (li.querySelector('.step-button')) {
            return;
          }

          // 단계 번호 추출 (1., 2., 3. 형식)
          const match = text.match(/^(\d+)\./);
          if (match) {
            const stepNumber = match[1];

            // 버튼 생성
            const button = document.createElement('button');
            button.className = 'step-button';
            button.textContent = `📖 ${stepNumber}단계 자세히`;
            button.style.marginLeft = '8px';

            button.addEventListener('click', () => {
              console.log(`📖 Step ${stepNumber} button clicked`);
              messageInput.value = `${stepNumber}번 단계 자세히 알려줘`;
              messageInput.focus();
            });

            // 리스트 아이템에 버튼 추가
            li.appendChild(button);
          }
        });

        // json-autofill 코드 블록 감지 및 자동 입력
        const codeBlocks = messageDiv.querySelectorAll('pre code');
        codeBlocks.forEach(codeBlock => {
          const codeText = codeBlock.textContent;

          // json-autofill 언어 지정 확인
          if (codeBlock.classList.contains('language-json-autofill') ||
              codeBlock.parentElement.getAttribute('data-language') === 'json-autofill') {

            console.log('🤖 json-autofill block detected!');

            // JSON 파싱
            try {
              const jsonData = JSON.parse(codeText);

              // 자동 입력 버튼 추가
              const autoFillButton = document.createElement('button');
              autoFillButton.className = 'step-button';
              autoFillButton.textContent = '⚡ 자동으로 입력하기';
              autoFillButton.style.marginTop = '8px';

              autoFillButton.addEventListener('click', () => {
                console.log('⚡ Auto-fill button clicked');

                // parent window(content.js)로 자동 입력 요청
                window.parent.postMessage({
                  type: 'auto-fill-node',
                  data: jsonData
                }, '*');

                // 버튼 텍스트 변경
                autoFillButton.textContent = '⏳ 입력 중...';
                autoFillButton.disabled = true;
              });

              // 코드 블록 아래에 버튼 추가
              codeBlock.parentElement.parentElement.appendChild(autoFillButton);

              console.log('✅ Auto-fill button added');

            } catch (error) {
              console.error('❌ Failed to parse JSON:', error);
            }
          }
        });
      }, 0);
    } else {
      // marked 라이브러리가 없으면 텍스트만 표시
      messageDiv.textContent = text;
    }
  } else {
    // user, error 메시지는 일반 텍스트
    messageDiv.textContent = text;
  }

  messagesContainer.appendChild(messageDiv);
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// 로딩 표시
function showLoading() {
  const loadingDiv = document.createElement('div');
  loadingDiv.className = 'loading';
  loadingDiv.id = 'loading-indicator';
  loadingDiv.innerHTML = `
    <div class="loading-dot"></div>
    <div class="loading-dot"></div>
    <div class="loading-dot"></div>
  `;
  messagesContainer.appendChild(loadingDiv);
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
  return 'loading-indicator';
}

// 로딩 숨김
function hideLoading(loadingId) {
  const loadingDiv = document.getElementById(loadingId);
  if (loadingDiv) {
    loadingDiv.remove();
  }
}

// 전송 버튼 클릭 이벤트
sendButton.addEventListener('click', () => {
  console.log('🖱️ Send button clicked');
  sendMessage();
});

// Enter 키 이벤트
messageInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    console.log('⌨️ Enter key pressed');
    sendMessage();
  }
});

// 퀵 액션 버튼 이벤트
document.querySelectorAll('.quick-action-btn').forEach(btn => {
  btn.addEventListener('click', (e) => {
    const action = e.target.dataset.action;
    console.log('🎯 Quick action clicked:', action);

    let message = '';
    switch(action) {
      case 'analyze-error':
        message = '현재 워크플로우의 에러를 분석해주세요';
        break;
      case 'generate-json':
        message = 'JSON 샘플 데이터를 생성해주세요';
        break;
      case 'detail':
        message = '자세히 알려줘';
        break;
    }

    if (message) {
      messageInput.value = message;
      messageInput.focus();
    }
  });
});

// parent window로부터 메시지 수신
window.addEventListener('message', (event) => {
  console.log('📨 Message received from parent:', event.data);

  if (event.data.type === 'assistant-response') {
    hideLoading('loading-indicator');
    addMessage(event.data.message, 'assistant');
    sendButton.disabled = false;

  } else if (event.data.type === 'auto-fill-result') {
    // 자동 입력 결과 처리
    console.log('✅ Auto-fill result:', event.data);

    if (event.data.success) {
      addMessage(`✅ ${event.data.message}\n입력된 필드: ${event.data.filledCount}/${event.data.totalFields}`, 'assistant');
    } else {
      addMessage(`⚠️ ${event.data.message}`, 'error');
    }

    // 버튼 복구
    const autoFillButtons = document.querySelectorAll('.step-button');
    autoFillButtons.forEach(btn => {
      if (btn.textContent === '⏳ 입력 중...') {
        btn.textContent = '⚡ 자동으로 입력하기';
        btn.disabled = false;
      }
    });

  } else if (event.data.type === 'error') {
    hideLoading('loading-indicator');

    // 에러 메시지 개선
    let errorMessage = event.data.message;

    // Extension context invalidated 에러인 경우 특별 처리
    if (errorMessage.includes('Extension context invalidated') ||
        errorMessage.includes('확장 프로그램이 업데이트') ||
        errorMessage.includes('자동으로 새로고침')) {
      // 자동 새로고침 메시지는 그대로 표시
      addMessage(errorMessage, 'error');
    } else if (errorMessage.includes('페이지를 새로고침')) {
      // 수동 새로고침이 필요한 경우
      errorMessage += '\n\n🔄 Ctrl+R 또는 F5를 눌러 페이지를 새로고침하세요.';
      addMessage(errorMessage, 'error');
    } else {
      // 일반 에러
      addMessage(errorMessage, 'error');
    }

    sendButton.disabled = false;
  }
});

console.log('✅ Sidebar iframe script initialized');
