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

// 마지막 클릭된 노드 추적 (전역 변수)
let lastClickedNode = null;

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

// 노드별 한글 설명 반환
function getNodeDescription(nodeName) {
  const name = nodeName.toLowerCase();

  // 트리거
  if (name.includes('schedule') || name.includes('trigger')) return '지정시간 자동실행';
  if (name.includes('webhook')) return '외부 요청 수신';
  if (name.includes('cron')) return '주기적 실행';

  // 데이터 수집
  if (name.includes('rss')) return '뉴스/피드 수집';
  if (name.includes('http')) return '웹 데이터 요청';
  if (name.includes('serp') || name.includes('google')) return '구글 검색';
  if (name.includes('twitter') || name.includes('x ')) return '트위터 수집';
  if (name.includes('reddit')) return '레딧 수집';

  // 데이터 처리
  if (name.includes('limit') || name.includes('item lists')) return '항목 제한/분류';
  if (name.includes('filter')) return '조건 필터링';
  if (name.includes('function')) return '코드 변환';
  if (name.includes('gpt') || name.includes('openai') || name.includes('ai')) return 'AI 처리';
  if (name.includes('split')) return '데이터 분할';
  if (name.includes('merge')) return '데이터 병합';
  if (name.includes('aggregate')) return '데이터 집계';

  // 출력/전송
  if (name.includes('slack')) return '슬랙 전송';
  if (name.includes('discord')) return '디스코드 전송';
  if (name.includes('telegram')) return '텔레그램 전송';
  if (name.includes('kakaotalk') || name.includes('kakao')) return '카카오톡 전송';
  if (name.includes('email') || name.includes('gmail')) return '이메일 전송';
  if (name.includes('notion')) return '노션 저장';
  if (name.includes('sheets') || name.includes('excel')) return '스프레드시트 저장';
  if (name.includes('database') || name.includes('postgres') || name.includes('mysql')) return '데이터베이스 저장';

  // 기타
  if (name.includes('wait')) return '대기';
  if (name.includes('switch')) return '조건 분기';
  if (name.includes('if')) return '조건 판단';

  return ''; // 기본값: 빈 문자열
}

// 가로 워크플로우 파싱 및 렌더링
function parseAndRenderNodes(text) {
  console.log('[DEBUG] parseAndRenderNodes called with text:', text.substring(0, 100));

  // 1. 워크플로우 패턴 감지: [노드1] > [노드2] > [노드3]
  // 개선: 첫 번째 플로우 라인만 감지 (한 줄 단위)
  const lines = text.split('\n');
  let flowLine = null;
  let flowLineIndex = -1;

  // 화살표가 있는 첫 번째 라인 찾기
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if ((line.includes('>') || line.includes('→') || line.includes('➜')) && line.includes('[')) {
      flowLine = line;
      flowLineIndex = i;
      break;
    }
  }

  if (!flowLine) {
    console.log('[DEBUG] No flow line detected');
    return parseOptions(text);
  }

  console.log('[DEBUG] Flow line found:', flowLine);

  const flowPattern = /\[([^\]]+)\]/g;
  const flowMatches = [...flowLine.matchAll(flowPattern)];

  console.log('[DEBUG] flowMatches:', flowMatches.length, 'nodes found');

  if (flowMatches.length >= 3) {
    console.log('✅ Rendering horizontal flow with', flowMatches.length, 'nodes');

    const nodes = flowMatches.map((match, idx) => {
      const nodeText = match[1].trim();
      // 노드명과 AI 제공 설명 분리 (예: "RSS: 뉴스 수집")
      const parts = nodeText.split(':');
      const nodeName = parts[0].trim();

      return {
        name: nodeName,
        description: getNodeDescription(nodeName), // 하드코딩된 한글 설명
        type: idx === 0 ? 'trigger' : (idx === flowMatches.length - 1 ? 'output' : 'action')
      };
    });

    console.log('[DEBUG] Nodes parsed:', nodes);

    // 제목 추출 (플로우 라인 이전 텍스트)
    const titleLines = lines.slice(0, flowLineIndex).join('\n');
    const fullText = titleLines + '\n' + flowLine + '\n' + lines.slice(flowLineIndex + 1).join('\n');

    return renderHorizontalFlow(nodes, fullText, flowLineIndex);
  } else {
    console.log('[DEBUG] Flow pattern NOT detected. Matches:', flowMatches.length);
    return parseOptions(text);
  }
}

// 옵션 패턴 파싱 (분리)
function parseOptions(text) {

  // 2. 옵션 버튼 패턴 감지: [option1], [option2], [option3]
  const optionPattern = /\[([^\]]+)\](?:\s*,\s*|\s+|$)/g;
  const optionMatches = [...text.matchAll(optionPattern)];

  if (optionMatches.length >= 2 && text.includes('선택') || text.includes('옵션')) {
    console.log('🎨 Rendering option buttons:', optionMatches.length);

    const options = optionMatches.map(match => {
      const optionText = match[1].trim();
      const parts = optionText.split(':');
      return {
        name: parts[0].trim(),
        description: parts[1] ? parts[1].trim() : ''
      };
    });

    return renderOptions(options, text);
  }

  // 3. 번호 리스트 패턴 (폴백)
  return parseNumberedList(text);
}

// 가로 플로우 렌더링
function renderHorizontalFlow(nodes, originalText, flowLineIndex) {
  let html = '<div class="workflow-container">';

  // 제목 추출 (플로우 라인 이전 텍스트)
  const lines = originalText.split('\n');
  const titleLines = lines.slice(0, flowLineIndex);
  const title = titleLines.join(' ').trim();

  if (title) {
    html += `<div class="workflow-title">${escapeHtml(title)}</div>`;
  }

  html += '<div class="workflow-flow">';

  nodes.forEach((node, idx) => {
    if (idx > 0) {
      html += '<div class="flow-arrow">→</div>';
    }

    const icon = getNodeIcon(node.name);

    html += `
      <div class="flow-node" data-node="${escapeHtml(node.name)}" data-index="${idx}">
        <div class="node-box ${node.type}">
          <div class="node-icon">${icon}</div>
          <div class="node-label">${escapeHtml(node.name)}</div>
          ${node.description ? `<div class="node-sublabel">${escapeHtml(node.description)}</div>` : ''}
        </div>
        <button class="step-button node-setup-btn" data-node="${escapeHtml(node.name)}" style="margin-top: 8px; font-size: 12px;">
          ⚙️ 설정하기
        </button>
      </div>
    `;
  });

  html += '</div></div>';

  // 나머지 텍스트 (플로우 라인 다음 텍스트)
  const remainingLines = lines.slice(flowLineIndex + 1);
  const remainingText = remainingLines.join('\n').trim();

  if (remainingText && remainingText.length > 10) {
    // marked 라이브러리가 있으면 마크다운 파싱, 없으면 일반 텍스트
    const parsedText = (typeof marked !== 'undefined')
      ? marked.parse(remainingText)
      : escapeHtml(remainingText).replace(/\n/g, '<br>');
    html += `<div style="margin-top: 12px; padding: 0 12px;">${parsedText}</div>`;
  }

  return html;
}

// 옵션 버튼 렌더링
function renderOptions(options, originalText) {
  let html = '';

  // 질문/안내 텍스트 추출
  const questionText = originalText.split('[')[0].trim();
  if (questionText) {
    html += `<div style="margin: 12px 0; font-size: 14px; color: #1f2937;">${escapeHtml(questionText)}</div>`;
  }

  html += '<div class="node-options">';
  html += '<div class="option-label">선택하세요:</div>';
  html += '<div style="width: 100%; display: flex; flex-wrap: wrap; gap: 8px;">';

  options.forEach((option, idx) => {
    const icon = getNodeIcon(option.name);
    html += `
      <button class="option-btn" data-option="${escapeHtml(option.name)}" data-index="${idx}">
        <span>${icon}</span>
        <span>${escapeHtml(option.name)}</span>
        ${option.description ? `<span style="font-size: 10px; color: #6b7280;">: ${escapeHtml(option.description)}</span>` : ''}
      </button>
    `;
  });

  html += '</div></div>';

  return html;
}

// 번호 리스트 패턴 (폴백)
function parseNumberedList(text) {
  const lines = text.split('\n').map(line => line.trim());
  const nodes = [];
  const nodeRegex = /^(\d+)\.\s*`([^`]+)`\s*[-–—:：]?\s*(.+)?$/;

  for (const line of lines) {
    const match = line.match(nodeRegex);
    if (match) {
      const [, number, nodeName, description] = match;
      nodes.push({
        number: number,
        name: nodeName.trim(),
        description: description ? description.trim() : ''
      });
    }
  }

  if (nodes.length >= 2) {
    // 첫 번째 노드가 나오는 라인 찾기
    const lines = text.split('\n');
    let flowLineIndex = 0;
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].trim().match(/^\d+\./)) {
        flowLineIndex = i;
        break;
      }
    }

    return renderHorizontalFlow(
      nodes.map((n, idx) => ({
        name: n.name,
        description: n.description,
        type: idx === 0 ? 'trigger' : (idx === nodes.length - 1 ? 'output' : 'action')
      })),
      text,
      flowLineIndex
    );
  }

  return null;
}

// 노드 아이콘 매핑 (Font Awesome 아이콘)
function getNodeIcon(nodeName) {
  const name = nodeName.toLowerCase();

  if (name.includes('trigger') || name.includes('schedule') || name.includes('webhook'))
    return '<i class="fa-solid fa-bolt"></i>';
  if (name.includes('rss') || name.includes('feed'))
    return '<i class="fa-solid fa-rss"></i>';
  if (name.includes('http') || name.includes('api'))
    return '<i class="fa-solid fa-globe"></i>';
  if (name.includes('gpt') || name.includes('openai') || name.includes('ai'))
    return '<i class="fa-solid fa-robot"></i>';
  if (name.includes('slack'))
    return '<i class="fa-brands fa-slack"></i>';
  if (name.includes('email') || name.includes('gmail'))
    return '<i class="fa-solid fa-envelope"></i>';
  if (name.includes('code') || name.includes('function'))
    return '<i class="fa-solid fa-code"></i>';
  if (name.includes('filter') || name.includes('if'))
    return '<i class="fa-solid fa-filter"></i>';
  if (name.includes('limit') || name.includes('split'))
    return '<i class="fa-solid fa-scissors"></i>';
  if (name.includes('serp') || name.includes('google'))
    return '<i class="fa-solid fa-magnifying-glass"></i>';
  if (name.includes('kakao') || name.includes('카톡'))
    return '<i class="fa-solid fa-comment"></i>';
  if (name.includes('notion'))
    return '<i class="fa-solid fa-book"></i>';
  if (name.includes('database') || name.includes('db'))
    return '<i class="fa-solid fa-database"></i>';
  if (name.includes('discord'))
    return '<i class="fa-brands fa-discord"></i>';
  if (name.includes('github'))
    return '<i class="fa-brands fa-github"></i>';
  if (name.includes('twitter') || name.includes('x'))
    return '<i class="fa-brands fa-x-twitter"></i>';

  return '<i class="fa-solid fa-cube"></i>';
}

// HTML 이스케이프 함수
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// 수동 마크다운 파싱 (marked 라이브러리 없을 때 대체)
function parseMarkdownManually(text) {
  console.log('[DEBUG] parseMarkdownManually input:', text);

  // 1단계: 코드 블록을 먼저 추출해서 플레이스홀더로 대체
  const codeBlocks = [];
  // 정규식: 하이픈 포함 언어 이름 지원 (예: json-autofill)
  let html = text.replace(/```([\w-]+)?\n([\s\S]+?)```/g, (match, language, code) => {
    console.log('[DEBUG] Code block matched!');
    console.log('[DEBUG] - language:', language);
    console.log('[DEBUG] - code:', code.substring(0, 50));

    const lang = language || '';
    const langClass = lang ? ` class="language-${lang}"` : '';
    const dataLang = lang ? ` data-language="${lang}"` : '';
    const placeholder = `__CODE_BLOCK_${codeBlocks.length}__`;

    // json-autofill 블록인 경우 버튼 추가 (코드는 숨김)
    if (lang === 'json-autofill') {
      console.log('[DEBUG] ✅ json-autofill block detected! Adding button...');
      codeBlocks.push(`
        <div class="code-block-container">
          <pre${dataLang} style="display: none;"><code${langClass}>${escapeHtml(code.trim())}</code></pre>
          <div class="autofill-instructions">
            <button class="autofill-button">⚡ 자동으로 입력하기</button>
            <p class="autofill-hint">💡 먼저 N8N에서 해당 노드를 추가하고 더블클릭해서 설정 패널을 열어주세요</p>
          </div>
        </div>
      `);
    } else {
      codeBlocks.push(`<pre${dataLang}><code${langClass}>${escapeHtml(code.trim())}</code></pre>`);
    }
    return placeholder;
  });

  // 2단계: 인라인 코드 추출
  const inlineCodes = [];
  html = html.replace(/`([^`]+)`/g, (match, code) => {
    const placeholder = `__INLINE_CODE_${inlineCodes.length}__`;
    inlineCodes.push(`<code>${escapeHtml(code)}</code>`);
    return placeholder;
  });

  // 3단계: 나머지 텍스트 이스케이프
  html = escapeHtml(html);

  // 4단계: 마크다운 문법 처리
  // **bold** → <strong>bold</strong>
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');

  // *italic* → <em>italic</em>
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');

  // 제목 처리
  html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');
  html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>');
  html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>');

  // 리스트 처리
  html = html.replace(/^- (.+)$/gm, '<li>$1</li>');
  html = html.replace(/^\d+\. (.+)$/gm, '<li>$1</li>');
  html = html.replace(/(<li>.*?<\/li>\n?)+/g, '<ul>$&</ul>');

  // 줄바꿈 처리
  html = html.replace(/\n\n/g, '</p><p>');
  html = html.replace(/\n/g, '<br>');
  html = '<p>' + html + '</p>';
  html = html.replace(/<p><\/p>/g, '');

  // 5단계: 플레이스홀더를 실제 코드로 복원
  inlineCodes.forEach((code, i) => {
    html = html.replace(`__INLINE_CODE_${i}__`, code);
  });
  codeBlocks.forEach((block, i) => {
    html = html.replace(`__CODE_BLOCK_${i}__`, block);
  });

  return html;
}

// 메시지 추가 함수
function addMessage(text, type = 'assistant') {
  console.log(`💬 Adding message [${type}]:`, text.substring(0, 50));

  const messageDiv = document.createElement('div');
  messageDiv.className = `message ${type}`;

  // assistant 메시지는 마크다운을 HTML로 변환
  if (type === 'assistant') {
    console.log('[DEBUG] marked library loaded?', typeof marked !== 'undefined');

    // 노드 워크플로우 감지 및 비주얼 렌더링 (marked 여부와 무관)
    const nodesHtml = parseAndRenderNodes(text);
    if (nodesHtml) {
      console.log('[DEBUG] Using horizontal flow rendering');
      messageDiv.innerHTML = nodesHtml;
    } else {
      console.log('[DEBUG] Using markdown/text rendering');

      // marked 라이브러리가 로드되어 있는지 확인
      // 여러 번 시도하여 로드 대기
      if (typeof marked !== 'undefined' && marked.parse) {
        // 일반 마크다운 렌더링
        try {
          messageDiv.innerHTML = marked.parse(text);
        } catch (e) {
          console.error('Marked parsing error:', e);
          // 에러 발생 시 수동으로 줄바꿈 처리
          messageDiv.innerHTML = escapeHtml(text).replace(/\n/g, '<br>');
        }
      } else {
        // marked 라이브러리 없으면 수동으로 기본 마크다운 처리
        console.log('[WARN] marked not loaded, using manual markdown parsing');
        messageDiv.innerHTML = parseMarkdownManually(text);
      }
    }

    // 인터랙티브 요소 이벤트 리스너 추가
    setTimeout(() => {
      // -1. parseMarkdownManually()로 생성된 자동 입력 버튼 (NEW!)
      const autofillButtons = messageDiv.querySelectorAll('.autofill-button');
      autofillButtons.forEach(button => {
        button.addEventListener('click', (e) => {
          console.log('⚡ Auto-fill button clicked (from parseMarkdownManually)');

          // 코드 블록에서 JSON 데이터 추출
          const container = e.currentTarget.closest('.code-block-container');
          if (container) {
            const codeBlock = container.querySelector('code');
            if (codeBlock) {
              try {
                const jsonData = JSON.parse(codeBlock.textContent);

                // parent window(content.js)로 자동 입력 요청
                window.parent.postMessage({
                  type: 'auto-fill-node',
                  data: jsonData
                }, '*');

                // 버튼 텍스트 변경
                e.currentTarget.textContent = '⏳ 입력 중...';
                e.currentTarget.disabled = true;
              } catch (error) {
                console.error('❌ Failed to parse JSON:', error);
                e.currentTarget.textContent = '❌ JSON 오류';
              }
            }
          }
        });
      });

      // 0. 가로 플로우 "설정하기" 버튼 클릭 (NEW!)
        const setupButtons = messageDiv.querySelectorAll('.node-setup-btn');
        setupButtons.forEach(button => {
          button.addEventListener('click', (e) => {
            e.stopPropagation(); // 부모 .flow-node 클릭 이벤트 방지
            const nodeName = e.currentTarget.dataset.node;
            console.log('⚙️ Setup button clicked:', nodeName);

            // 마지막 클릭된 노드 저장
            lastClickedNode = nodeName;
            console.log('💾 Last clicked node saved:', lastClickedNode);

            // 버튼 상태 변경
            e.currentTarget.textContent = '⏳ 로딩 중...';
            e.currentTarget.disabled = true;

            // 해당 노드에 대한 설정 요청 전송
            messageInput.value = `${nodeName} 노드 설정 방법 알려줘`;
            sendMessage();
          });
        });

      // 0-1. 가로 플로우 노드 박스 클릭 (하이라이트만)
        const flowNodes = messageDiv.querySelectorAll('.flow-node');
        flowNodes.forEach(node => {
          node.addEventListener('click', (e) => {
            // 버튼 클릭이면 무시
            if (e.target.classList.contains('node-setup-btn')) {
              return;
            }

            const nodeName = e.currentTarget.dataset.node;
            console.log('🎨 Flow node clicked (info only):', nodeName);

            // 노드 하이라이트 표시 (선택적)
            flowNodes.forEach(n => n.querySelector('.node-box').style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.1)');
            e.currentTarget.querySelector('.node-box').style.boxShadow = '0 6px 16px rgba(102, 126, 234, 0.3)';
          });
        });

        // 1. 옵션 버튼 클릭 (NEW!)
        const optionButtons = messageDiv.querySelectorAll('.option-btn');
        optionButtons.forEach(button => {
          button.addEventListener('click', (e) => {
            const option = e.currentTarget.dataset.option;
            console.log('✅ Option selected:', option);

            // 선택 상태 표시
            optionButtons.forEach(btn => btn.classList.remove('selected'));
            e.currentTarget.classList.add('selected');

            // 자동으로 선택 메시지 전송
            messageInput.value = option;
            setTimeout(() => sendMessage(), 100);
          });
        });

        // 2. 노드 카드 "자세히" 버튼 처리
        const nodeDetailButtons = messageDiv.querySelectorAll('.node-detail-btn');
        nodeDetailButtons.forEach(button => {
          button.addEventListener('click', (e) => {
            const step = e.target.dataset.step;
            console.log('🎨 Node detail button clicked:', step);

            // 입력창에 자동으로 메시지 입력
            messageInput.value = `${step}번 단계 자세히 알려줘`;
            messageInput.focus();
          });
        });

        // 3. 기존 HTML 버튼 처리
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
        // 마지막 클릭된 노드가 있으면 그 노드에 대해서만 자세히 설명
        if (lastClickedNode) {
          message = `${lastClickedNode} 노드 모든 옵션 자세히 알려줘`;
          console.log('📌 Detail request for specific node:', lastClickedNode);
        } else {
          message = '모든 노드 자세히 설명해줘';
          console.log('📌 Detail request for all nodes');
        }
        break;
    }

    if (message) {
      messageInput.value = message;
      // 바로 전송
      sendMessage();
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
