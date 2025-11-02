/**
 * N8N AI Copilot - Sidebar JavaScript
 * 사이드바 초기화 및 메시지 처리
 */

// ========================================
// 1. 사이드바 초기화
// ========================================
window.initializeSidebar = function() {
  console.log('🎨 Initializing AI Copilot Sidebar...');

  // 사이드바가 이미 존재하면 중복 생성 방지
  if (document.getElementById('n8n-ai-copilot-sidebar')) {
    console.log('⚠️ Sidebar already exists');
    return;
  }

  createSidebarElements();
  attachEventListeners();

  console.log('✅ Sidebar initialized');
};

// ========================================
// 2. 사이드바 DOM 요소 생성
// ========================================
function createSidebarElements() {
  console.log('🎨 Creating sidebar elements...');

  // 오버레이 생성
  const overlay = document.createElement('div');
  overlay.id = 'n8n-ai-copilot-overlay';
  document.body.appendChild(overlay);
  console.log('✅ Overlay created');

  // 토글 버튼 생성
  const toggleButton = document.createElement('button');
  toggleButton.id = 'n8n-ai-copilot-toggle';
  toggleButton.innerHTML = '🤖';
  toggleButton.title = 'N8N AI Copilot 열기';
  document.body.appendChild(toggleButton);
  console.log('✅ Toggle button created');

  // 사이드바 컨테이너 생성
  const sidebar = document.createElement('div');
  sidebar.id = 'n8n-ai-copilot-sidebar';

  // iframe 생성
  const iframe = document.createElement('iframe');
  iframe.src = chrome.runtime.getURL('sidebar.html');
  iframe.id = 'n8n-ai-copilot-iframe';

  sidebar.appendChild(iframe);
  document.body.appendChild(sidebar);
  console.log('✅ Sidebar and iframe created');

  console.log('📦 Sidebar elements created');
}

// ========================================
// 3. 이벤트 리스너 연결
// ========================================
function attachEventListeners() {
  const toggleButton = document.getElementById('n8n-ai-copilot-toggle');
  const sidebar = document.getElementById('n8n-ai-copilot-sidebar');
  const overlay = document.getElementById('n8n-ai-copilot-overlay');
  
  // 토글 버튼 클릭
  toggleButton.addEventListener('click', toggleSidebar);
  
  // 오버레이 클릭 시 사이드바 닫기
  overlay.addEventListener('click', closeSidebar);
  
  // ESC 키로 사이드바 닫기
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && sidebar.classList.contains('open')) {
      closeSidebar();
    }
  });

  // iframe과의 메시지 통신은 content.js에서 처리합니다

  console.log('🔗 Event listeners attached');
}

// ========================================
// 4. 사이드바 토글
// ========================================
function toggleSidebar() {
  const sidebar = document.getElementById('n8n-ai-copilot-sidebar');
  const toggleButton = document.getElementById('n8n-ai-copilot-toggle');
  const overlay = document.getElementById('n8n-ai-copilot-overlay');
  
  if (sidebar.classList.contains('open')) {
    closeSidebar();
  } else {
    sidebar.classList.add('open');
    toggleButton.classList.add('sidebar-open');
    overlay.classList.add('show');
    
    // 모바일에서 body 스크롤 방지
    if (window.innerWidth <= 1024) {
      document.body.classList.add('n8n-copilot-active');
    }
  }
}

function closeSidebar() {
  const sidebar = document.getElementById('n8n-ai-copilot-sidebar');
  const toggleButton = document.getElementById('n8n-ai-copilot-toggle');
  const overlay = document.getElementById('n8n-ai-copilot-overlay');
  
  sidebar.classList.remove('open');
  toggleButton.classList.remove('sidebar-open');
  overlay.classList.remove('show');
  document.body.classList.remove('n8n-copilot-active');
}

// ========================================
// 5. iframe과의 메시지 통신
// ========================================
// 메시지 통신은 content.js에서 직접 처리합니다
// sidebar.js는 UI 요소 생성과 토글 기능만 담당합니다

// ========================================
// 6. 알림 뱃지 표시 (에러 자동 감지)
// ========================================
function showNotificationBadge(count) {
  const toggleButton = document.getElementById('n8n-ai-copilot-toggle');

  if (!toggleButton) return;

  // 기존 뱃지 제거
  const existingBadge = toggleButton.querySelector('.badge');
  if (existingBadge) {
    existingBadge.remove();
  }

  if (count > 0) {
    const badge = document.createElement('span');
    badge.className = 'badge';
    badge.textContent = count > 9 ? '9+' : count;
    toggleButton.appendChild(badge);
    toggleButton.classList.add('has-notification');
  } else {
    toggleButton.classList.remove('has-notification');
  }
}

// ========================================
// 7. 에러 감지 시 자동 알림
// ========================================
window.addEventListener('message', (event) => {
  if (event.data.type === 'error-detected') {
    showNotificationBadge(event.data.errors.length);
  }
});


console.log('📦 Sidebar.js loaded');
console.log('✅ initializeSidebar function exposed to window object');
