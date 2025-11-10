/**
 * N8N AI Copilot - Sidebar iframe JavaScript
 * iframe 내부에서 실행되는 스크립트
 */

// ========================================
// 간단한 마크다운 파서 (marked.js 대체)
// ========================================
function parseMarkdown(markdown) {
  let html = markdown;

  // 코드 블록 (```)
  html = html.replace(/```([\w-]*)\n([\s\S]*?)```/g, (match, lang, code) => {
    const langClass = lang ? `language-${lang}` : '';
    return `<pre><code class="${langClass}">${escapeHtml(code.trim())}</code></pre>`;
  });

  // 인라인 코드 (`)
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>');

  // 굵은 글씨 (**)
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');

  // 기울임 (*)
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');

  // 제목 (###, ##, #)
  html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');
  html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>');
  html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>');

  // 순서 있는 리스트
  html = html.replace(/^\d+\.\s+(.+)$/gm, '<li>$1</li>');
  html = html.replace(/(<li>.*<\/li>)/s, '<ol>$1</ol>');

  // 순서 없는 리스트
  html = html.replace(/^[-*]\s+(.+)$/gm, '<li>$1</li>');

  // 링크
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank">$1</a>');

  // 줄바꿈 (두 개의 개행을 <p>로)
  html = html.split('\n\n').map(para => {
    if (!para.trim().match(/^<[^>]+>/)) {
      return `<p>${para.trim()}</p>`;
    }
    return para;
  }).join('');

  // 단일 줄바꿈을 <br>로
  html = html.replace(/\n/g, '<br>');

  return html;
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

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
    // PATTERN_ID 감지 및 처리
    const patternMatch = text.match(/PATTERN_ID:\s*(\w+)/);

    if (patternMatch) {
      const patternId = patternMatch[1];
      console.log('🔍 Pattern detected:', patternId);

      // 패턴 정보 표시 (특별한 UI)
      displayPatternMessage(text, patternId, messageDiv);
    } else {
      // 일반 메시지 처리
      messageDiv.innerHTML = parseMarkdown(text);
    }

    // 내장 마크다운 파서 사용
    if (!patternMatch) {
      messageDiv.innerHTML = parseMarkdown(text);
    }

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
    // user, error 메시지는 일반 텍스트
    messageDiv.textContent = text;
  }

  messagesContainer.appendChild(messageDiv);
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// 로딩 표시 (정지 버튼 포함)
function showLoading() {
  const loadingDiv = document.createElement('div');
  loadingDiv.className = 'loading';
  loadingDiv.id = 'loading-indicator';
  loadingDiv.innerHTML = `
    <div class="loading-content">
      <div class="loading-dots">
        <div class="loading-dot"></div>
        <div class="loading-dot"></div>
        <div class="loading-dot"></div>
      </div>
      <button class="stop-loading-btn" title="응답 대기 중단">⏹ 정지</button>
    </div>
  `;

  // 정지 버튼 이벤트 리스너
  const stopBtn = loadingDiv.querySelector('.stop-loading-btn');
  stopBtn.addEventListener('click', () => {
    console.log('🛑 Stop button clicked');
    hideLoading('loading-indicator');
    sendButton.disabled = false;
    addMessage('⏹ 응답 대기를 중단했습니다.', 'assistant');
  });

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

// 진행률 표시
function updateProgress(progress) {
  let progressDiv = document.getElementById('progress-indicator');

  if (!progressDiv) {
    // 진행률 div 생성
    progressDiv = document.createElement('div');
    progressDiv.className = 'loading';
    progressDiv.id = 'progress-indicator';
    progressDiv.innerHTML = `
      <div class="progress-content">
        <div class="progress-bar-container">
          <div class="progress-bar"></div>
        </div>
        <div class="progress-text">0%</div>
        <div class="progress-node"></div>
        <button class="cancel-btn" title="분석 취소">❌ 취소</button>
      </div>
    `;

    // 취소 버튼 이벤트 리스너
    const cancelBtn = progressDiv.querySelector('.cancel-btn');
    cancelBtn.addEventListener('click', () => {
      console.log('🛑 Cancel button clicked');
      window.parent.postMessage({
        type: 'cancel-analysis'
      }, '*');
      cancelBtn.disabled = true;
      cancelBtn.textContent = '⏳ 취소 중...';
    });

    messagesContainer.appendChild(progressDiv);
  }

  // 진행률 업데이트
  const progressBar = progressDiv.querySelector('.progress-bar');
  const progressText = progressDiv.querySelector('.progress-text');
  const progressNode = progressDiv.querySelector('.progress-node');

  progressBar.style.width = progress.percentage + '%';
  progressText.textContent = `${progress.percentage}% (${progress.current}/${progress.total})`;
  progressNode.textContent = `현재: ${progress.nodeName}`;

  messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// 진행률 숨김
function hideProgress() {
  const progressDiv = document.getElementById('progress-indicator');
  if (progressDiv) {
    progressDiv.remove();
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

    // 페이지 분석은 별도 처리
    if (action === 'analyze-page') {
      analyzePage();
      return;
    }

    // 에러 분석은 별도 처리
    if (action === 'analyze-error') {
      analyzeError();
      return;
    }

    // 워크플로우 분석은 별도 처리
    if (action === 'analyze-workflow') {
      analyzeWorkflow();
      return;
    }

    let message = '';
    switch(action) {
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

// 페이지 분석 요청
function analyzePage() {
  console.log('🔍 Requesting page analysis...');

  // 로딩 표시
  const loadingId = showLoading();

  // parent window(content.js)로 분석 요청
  window.parent.postMessage({
    type: 'analyze-page'
  }, '*');
}

// 에러 분석 요청
function analyzeError() {
  console.log('⚠️ Requesting error analysis...');

  // 로딩 표시
  const loadingId = showLoading();

  // parent window(content.js)로 에러 분석 요청
  window.parent.postMessage({
    type: 'analyze-error'
  }, '*');
}

// 워크플로우 분석 요청
function analyzeWorkflow() {
  console.log('🔬 Requesting workflow analysis...');

  // 로딩 표시
  const loadingId = showLoading();

  // parent window(content.js)로 워크플로우 분석 요청
  window.parent.postMessage({
    type: 'analyze-workflow'
  }, '*');
}

// parent window로부터 메시지 수신
window.addEventListener('message', (event) => {
  console.log('📨 Message received from parent:', event.data);

  if (event.data.type === 'assistant-response') {
    hideLoading('loading-indicator');
    addMessage(event.data.message, 'assistant');
    sendButton.disabled = false;

  } else if (event.data.type === 'page-analysis-result') {
    // 페이지 분석 결과 처리
    hideLoading('loading-indicator');
    displayPageAnalysis(event.data.data);

  } else if (event.data.type === 'error-analysis-result') {
    // 에러 분석 결과 처리 - AI에게 직접 전송
    hideLoading('loading-indicator');
    const errorData = event.data.data;

    // 에러 정보를 메시지로 전송
    const errorMessage = `에러 분석: ${errorData.errorCount}개 발견`;
    addMessage(errorMessage, 'user');

    // 로딩 표시
    const loadingId = showLoading();

    // AI에게 전송
    window.parent.postMessage({
      type: 'send-message',
      message: errorMessage,
      errorContext: errorData
    }, '*');

  } else if (event.data.type === 'workflow-analysis-progress') {
    // 워크플로우 분석 진행률 업데이트
    const progress = event.data.progress;
    updateProgress(progress);

  } else if (event.data.type === 'workflow-analysis-cancelled') {
    // 워크플로우 분석 취소됨
    hideLoading('loading-indicator');
    hideProgress();
    addMessage('🛑 워크플로우 분석이 취소되었습니다.', 'assistant');
    sendButton.disabled = false;

  } else if (event.data.type === 'workflow-analysis-result') {
    // 워크플로우 분석 결과 처리 - AI에게 직접 전송
    hideLoading('loading-indicator');
    hideProgress();
    const workflowData = event.data.data;

    // 분석 정보를 메시지로 전송
    const workflowMessage = workflowData.userMessage || '워크플로우 분석 완료';
    addMessage(workflowMessage, 'user');

    // 로딩 표시
    const loadingId = showLoading();

    // AI에게 전송
    window.parent.postMessage({
      type: 'send-message',
      message: workflowMessage,
      workflowContext: workflowData
    }, '*');

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

  } else if (event.data.type === 'pattern-apply-result') {
    // 패턴 적용 결과 처리
    console.log('🔧 Pattern apply result:', event.data);

    // 버튼 복구
    const autoApplyButtons = document.querySelectorAll('.auto-apply');
    autoApplyButtons.forEach(btn => {
      btn.disabled = false;
      btn.textContent = '⚡ 자동으로 적용하기';
    });

    if (event.data.success) {
      // 성공 메시지
      addMessage(`✅ ${event.data.message}

**수정 내용:**
- 변경된 곳: ${event.data.changeCount}개

저장하고 워크플로우를 다시 실행해보세요!`, 'assistant');
    } else if (event.data.requiresManual) {
      // 수동 적용 필요
      addMessage(`⚠️ ${event.data.message}

이 패턴은 수동으로 적용해야 합니다.`, 'assistant');

      // 수동 단계 표시
      if (event.data.pattern) {
        displayManualSteps(event.data.pattern);
      }
    } else if (event.data.requiresConfirmation) {
      // 확인 필요
      addMessage(`⚠️ ${event.data.message}

**수정 전:**
\`\`\`
${event.data.before}
\`\`\`

**수정 후:**
\`\`\`
${event.data.after}
\`\`\`

변경 사항을 확인하고 "⚡ 자동으로 적용하기" 버튼을 다시 클릭하세요.`, 'assistant');
    } else {
      // 에러
      addMessage(`❌ ${event.data.message}`, 'error');
    }

  } else if (event.data.type === 'realtime-guide-step-completed') {
    // 실시간 가이드 단계 완료
    console.log('✅ Real-time guide step completed:', event.data);

    const { patternId, stepIndex } = event.data;

    // 체크리스트 메시지 찾기
    const checklistMessages = document.querySelectorAll('.checklist-message');
    const latestChecklist = checklistMessages[checklistMessages.length - 1];

    if (latestChecklist) {
      completeStep(latestChecklist, stepIndex, { id: patternId, manualSteps: [] });
    }

  } else if (event.data.type === 'realtime-guide-all-completed') {
    // 실시간 가이드 전체 완료
    console.log('🎉 Real-time guide all completed:', event.data);

    addMessage('🎉 실시간 가이드를 통해 모든 단계를 완료했습니다! 워크플로우를 저장하고 다시 실행해보세요.', 'assistant');

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

// 페이지 분석 결과 표시
function displayPageAnalysis(data) {
  console.log('📊 Displaying page analysis:', data);

  let message = `# 🔍 페이지 분석\n\n`;

  // 워크플로우 노드만 간략하게 표시
  message += `**워크플로우 노드**: ${data.summary.hasActiveNode ? '있음' : '없음'}\n`;
  message += `**설정 패널**: ${data.summary.hasOpenSettings ? '열림' : '닫힘'}\n`;
  message += `**에러**: ${data.summary.hasErrors ? `${data.errors.count}개` : '없음'}\n`;

  addMessage(message, 'assistant');
}


// ========================================
// 패턴 기반 UI 표시
// ========================================

/**
 * 패턴 메시지를 특별한 UI로 표시
 */
function displayPatternMessage(text, patternId, messageDiv) {
  console.log('🎨 Displaying pattern UI for:', patternId);

  // 패턴 정보 가져오기
  const pattern = getPattern(patternId);

  if (!pattern) {
    // 패턴을 찾을 수 없으면 일반 메시지로 표시
    messageDiv.innerHTML = parseMarkdown(text);
    return;
  }

  // PATTERN_ID 줄 제거
  const cleanText = text.replace(/PATTERN_ID:\s*\w+\s*\n?/, '').trim();

  // 패턴 UI 생성
  const patternHTML = `
    <div class="pattern-message">
      <div class="pattern-header">
        <h3>🔧 ${pattern.title}</h3>
        <span class="pattern-severity ${pattern.severity}">${pattern.severity}</span>
      </div>

      <div class="pattern-description">
        ${parseMarkdown(pattern.description)}
      </div>

      ${cleanText ? `<div class="ai-explanation">${parseMarkdown(cleanText)}</div>` : ''}

      <div class="pattern-examples">
        <div class="before-after">
          <div class="code-section before">
            <div class="code-label">❌ Before</div>
            <pre><code>${escapeHtml(pattern.before)}</code></pre>
          </div>
          <div class="arrow">→</div>
          <div class="code-section after">
            <div class="code-label">✅ After</div>
            <pre><code>${escapeHtml(pattern.after)}</code></pre>
          </div>
        </div>
      </div>

      <div class="pattern-actions">
        ${pattern.autoApplicable ? `
          <button class="pattern-btn auto-apply" data-pattern-id="${pattern.id}">
            ⚡ 자동으로 적용하기
          </button>
        ` : ''}
        <button class="pattern-btn show-steps" data-pattern-id="${pattern.id}">
          📋 수동 단계 보기
        </button>
        <button class="pattern-btn show-explanation" data-pattern-id="${pattern.id}">
          💡 자세한 설명
        </button>
      </div>
    </div>
  `;

  messageDiv.innerHTML = patternHTML;

  // 버튼 이벤트 리스너 추가
  setTimeout(() => {
    // 자동 적용 버튼
    const autoApplyBtn = messageDiv.querySelector('.auto-apply');
    if (autoApplyBtn) {
      autoApplyBtn.addEventListener('click', () => {
        console.log('⚡ Auto-apply clicked:', patternId);
        autoApplyBtn.textContent = '⏳ 적용 중...';
        autoApplyBtn.disabled = true;

        // parent window(content.js)로 자동 적용 요청
        window.parent.postMessage({
          type: 'apply-pattern',
          patternId: patternId,
          autoApply: true
        }, '*');
      });
    }

    // 수동 단계 보기 버튼
    const showStepsBtn = messageDiv.querySelector('.show-steps');
    if (showStepsBtn) {
      showStepsBtn.addEventListener('click', () => {
        console.log('📋 Show steps clicked:', patternId);
        displayManualSteps(pattern);
      });
    }

    // 자세한 설명 버튼
    const showExplanationBtn = messageDiv.querySelector('.show-explanation');
    if (showExplanationBtn) {
      showExplanationBtn.addEventListener('click', () => {
        console.log('💡 Show explanation clicked:', patternId);
        addMessage(pattern.explanation, 'assistant');
      });
    }
  }, 0);
}


/**
 * 수동 단계 체크리스트 표시 (인터랙티브)
 */
function displayManualSteps(pattern) {
  console.log('📋 Displaying interactive checklist for:', pattern.id);

  // 체크리스트 HTML 생성
  const checklistHTML = `
<div class="interactive-checklist">
  <div class="checklist-header">
    <h3>📋 ${pattern.title} - 단계별 가이드</h3>
    <div class="checklist-controls">
      <button class="checklist-btn start-guide" data-pattern-id="${pattern.id}">
        🚀 실시간 가이드 시작
      </button>
    </div>
  </div>

  <div class="checklist-progress">
    <div class="progress-bar-container">
      <div class="progress-bar" id="checklist-progress-bar" style="width: 0%"></div>
    </div>
    <div class="progress-text" id="checklist-progress-text">0 / ${pattern.manualSteps.length} 완료</div>
  </div>

  <div class="checklist-steps">
    ${pattern.manualSteps.map((step, index) => `
      <div class="checklist-step" data-step-index="${index}">
        <div class="step-header">
          <input type="checkbox"
                 class="step-checkbox"
                 id="step-${pattern.id}-${index}"
                 data-step-index="${index}"
                 ${index === 0 ? '' : 'disabled'}>
          <label for="step-${pattern.id}-${index}" class="step-number">
            ${step.step}단계
          </label>
          <span class="step-status" data-status="pending">⏳ 대기 중</span>
        </div>

        <div class="step-content">
          <p class="step-description">${step.description}</p>

          ${step.example ? `
            <div class="step-example">
              <strong>예시:</strong> <code>${escapeHtml(step.example)}</code>
            </div>
          ` : ''}

          ${step.before && step.after ? `
            <div class="step-code-change">
              <div class="code-before">
                <strong>Before:</strong> <code>${escapeHtml(step.before)}</code>
              </div>
              <div class="code-after">
                <strong>After:</strong> <code>${escapeHtml(step.after)}</code>
              </div>
            </div>
          ` : ''}
        </div>

        <div class="step-actions">
          <button class="step-btn manual-complete"
                  data-step-index="${index}"
                  ${index === 0 ? '' : 'disabled'}>
            ✓ 완료
          </button>
        </div>
      </div>
    `).join('')}
  </div>

  <div class="checklist-footer">
    <p class="checklist-note">
      💡 <strong>실시간 가이드</strong>를 시작하면 자동으로 진행 상황을 감지합니다.
    </p>
  </div>
</div>
  `;

  // 메시지 추가
  const messageDiv = document.createElement('div');
  messageDiv.className = 'message assistant checklist-message';
  messageDiv.innerHTML = checklistHTML;
  messagesContainer.appendChild(messageDiv);
  messagesContainer.scrollTop = messagesContainer.scrollHeight;

  // 이벤트 리스너 추가
  setTimeout(() => {
    setupChecklistEvents(pattern, messageDiv);
  }, 0);
}


/**
 * 체크리스트 이벤트 설정
 */
function setupChecklistEvents(pattern, messageDiv) {
  // 실시간 가이드 시작 버튼
  const startGuideBtn = messageDiv.querySelector('.start-guide');
  if (startGuideBtn) {
    startGuideBtn.addEventListener('click', () => {
      console.log('🚀 Starting real-time guide');
      startGuideBtn.textContent = '⏸️ 가이드 진행 중...';
      startGuideBtn.disabled = true;

      // parent window에 실시간 가이드 시작 요청
      window.parent.postMessage({
        type: 'start-realtime-guide',
        patternId: pattern.id
      }, '*');

      // 첫 번째 단계 활성화
      updateStepStatus(messageDiv, 0, 'in-progress');
    });
  }

  // 수동 완료 버튼들
  const manualCompleteButtons = messageDiv.querySelectorAll('.manual-complete');
  manualCompleteButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const stepIndex = parseInt(btn.dataset.stepIndex);
      console.log(`✓ Manual complete clicked for step ${stepIndex}`);

      // 단계 완료 처리
      completeStep(messageDiv, stepIndex, pattern);

      // parent window에 수동 완료 알림
      window.parent.postMessage({
        type: 'manual-step-complete',
        patternId: pattern.id,
        stepIndex: stepIndex
      }, '*');
    });
  });
}


/**
 * 단계 완료 처리
 */
function completeStep(messageDiv, stepIndex, pattern) {
  console.log(`✅ Completing step ${stepIndex}`);

  // 체크박스 체크
  const checkbox = messageDiv.querySelector(`#step-${pattern.id}-${stepIndex}`);
  if (checkbox) {
    checkbox.checked = true;
    checkbox.disabled = true;
  }

  // 상태 업데이트
  updateStepStatus(messageDiv, stepIndex, 'completed');

  // 버튼 비활성화
  const button = messageDiv.querySelector(`.manual-complete[data-step-index="${stepIndex}"]`);
  if (button) {
    button.textContent = '✓ 완료됨';
    button.disabled = true;
  }

  // 다음 단계 활성화
  const nextStepIndex = stepIndex + 1;
  if (nextStepIndex < pattern.manualSteps.length) {
    updateStepStatus(messageDiv, nextStepIndex, 'in-progress');

    // 다음 단계 체크박스 활성화
    const nextCheckbox = messageDiv.querySelector(`#step-${pattern.id}-${nextStepIndex}`);
    if (nextCheckbox) {
      nextCheckbox.disabled = false;
    }

    // 다음 단계 버튼 활성화
    const nextButton = messageDiv.querySelector(`.manual-complete[data-step-index="${nextStepIndex}"]`);
    if (nextButton) {
      nextButton.disabled = false;
    }
  }

  // 진행률 업데이트
  updateChecklistProgress(messageDiv, stepIndex + 1, pattern.manualSteps.length);

  // 모든 단계 완료 확인
  if (nextStepIndex >= pattern.manualSteps.length) {
    console.log('🎉 All steps completed!');
    addMessage('🎉 모든 단계를 완료했습니다! 워크플로우를 저장하고 다시 실행해보세요.', 'assistant');
  }
}


/**
 * 단계 상태 업데이트
 */
function updateStepStatus(messageDiv, stepIndex, status) {
  const stepElement = messageDiv.querySelector(`.checklist-step[data-step-index="${stepIndex}"]`);
  if (!stepElement) return;

  const statusElement = stepElement.querySelector('.step-status');
  if (!statusElement) return;

  statusElement.dataset.status = status;

  switch (status) {
    case 'pending':
      statusElement.textContent = '⏳ 대기 중';
      stepElement.classList.remove('active', 'completed');
      break;
    case 'in-progress':
      statusElement.textContent = '🔄 진행 중';
      stepElement.classList.add('active');
      stepElement.classList.remove('completed');
      break;
    case 'completed':
      statusElement.textContent = '✅ 완료';
      stepElement.classList.remove('active');
      stepElement.classList.add('completed');
      break;
  }
}


/**
 * 체크리스트 진행률 업데이트
 */
function updateChecklistProgress(messageDiv, completed, total) {
  const progressBar = messageDiv.querySelector('#checklist-progress-bar');
  const progressText = messageDiv.querySelector('#checklist-progress-text');

  if (progressBar) {
    const percentage = Math.round((completed / total) * 100);
    progressBar.style.width = `${percentage}%`;
  }

  if (progressText) {
    progressText.textContent = `${completed} / ${total} 완료`;
  }
}


console.log('✅ Sidebar iframe script initialized');
