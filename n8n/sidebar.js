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

  // 리사이즈 핸들 생성 (좌우)
  const resizeHandle = document.createElement('div');
  resizeHandle.id = 'n8n-ai-copilot-resize-handle';
  resizeHandle.title = '드래그하여 가로 크기 조절';
  sidebar.appendChild(resizeHandle);

  // 리사이즈 핸들 생성 (상하)
  const resizeHandleVertical = document.createElement('div');
  resizeHandleVertical.id = 'n8n-ai-copilot-resize-handle-vertical';
  resizeHandleVertical.title = '드래그하여 세로 크기 조절';
  sidebar.appendChild(resizeHandleVertical);

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
  const resizeHandle = document.getElementById('n8n-ai-copilot-resize-handle');
  const resizeHandleVertical = document.getElementById('n8n-ai-copilot-resize-handle-vertical');

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

  // 리사이즈 핸들 드래그 (좌우)
  if (resizeHandle) {
    resizeHandle.addEventListener('mousedown', startResize);
  }

  // 리사이즈 핸들 드래그 (상하)
  if (resizeHandleVertical) {
    resizeHandleVertical.addEventListener('mousedown', startResizeVertical);
  }

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

// ========================================
// 8. 사이드바 크기 조절
// ========================================
let isResizing = false;
let isResizingVertical = false;
let startX = 0;
let startY = 0;
let startWidth = 0;
let startHeight = 0;
const MIN_WIDTH = 300;
const MAX_WIDTH = 1000;
const MIN_HEIGHT = 200;
const MAX_HEIGHT = window.innerHeight - 50;

// 좌우 크기 조절
function startResize(e) {
  e.preventDefault();
  isResizing = true;
  startX = e.clientX;

  const sidebar = document.getElementById('n8n-ai-copilot-sidebar');
  startWidth = sidebar.offsetWidth;

  // 드래그 중 선택 방지
  document.body.style.userSelect = 'none';
  document.body.style.cursor = 'ew-resize';

  console.log('📏 Horizontal resize started');
}

function doResize(e) {
  if (!isResizing) return;
  e.preventDefault();

  const sidebar = document.getElementById('n8n-ai-copilot-sidebar');
  const toggleButton = document.getElementById('n8n-ai-copilot-toggle');

  // 마우스 이동 거리 계산 (왼쪽으로 드래그하면 사이드바가 넓어짐)
  const deltaX = startX - e.clientX;
  let newWidth = startWidth + deltaX;

  // 최소/최대 크기 제한
  newWidth = Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, newWidth));

  // 사이드바 너비 적용
  sidebar.style.width = newWidth + 'px';

  // 토글 버튼 위치 조정 (사이드바가 열려있을 때)
  if (sidebar.classList.contains('open') && window.innerWidth > 1024) {
    toggleButton.style.right = (newWidth + 20) + 'px';
  }
}

function stopResize() {
  if (!isResizing) return;

  isResizing = false;

  // 스타일 복원
  document.body.style.userSelect = '';
  document.body.style.cursor = '';

  console.log('📏 Horizontal resize stopped');
}

// 상하 크기 조절
function startResizeVertical(e) {
  e.preventDefault();
  isResizingVertical = true;
  startY = e.clientY;

  const sidebar = document.getElementById('n8n-ai-copilot-sidebar');
  startHeight = sidebar.offsetHeight;

  // 드래그 중 선택 방지
  document.body.style.userSelect = 'none';
  document.body.style.cursor = 'ns-resize';

  console.log('📏 Vertical resize started');
}

function doResizeVertical(e) {
  if (!isResizingVertical) return;
  e.preventDefault();

  const sidebar = document.getElementById('n8n-ai-copilot-sidebar');

  // 마우스 이동 거리 계산 (위로 드래그하면 사이드바가 높아짐)
  const deltaY = startY - e.clientY;
  let newHeight = startHeight + deltaY;

  // 최소/최대 크기 제한
  newHeight = Math.max(MIN_HEIGHT, Math.min(MAX_HEIGHT, newHeight));

  // 사이드바 높이 적용
  sidebar.style.height = newHeight + 'px';
}

function stopResizeVertical() {
  if (!isResizingVertical) return;

  isResizingVertical = false;

  // 스타일 복원
  document.body.style.userSelect = '';
  document.body.style.cursor = '';

  console.log('📏 Vertical resize stopped');
}

// 전역 mousemove/mouseup 이벤트 (마우스가 handle을 벗어나도 동작)
document.addEventListener('mousemove', (e) => {
  if (isResizing) {
    doResize(e);
  }
  if (isResizingVertical) {
    doResizeVertical(e);
  }
});

document.addEventListener('mouseup', () => {
  if (isResizing) {
    stopResize();
  }
  if (isResizingVertical) {
    stopResizeVertical();
  }
});


console.log('📦 Sidebar.js loaded');
console.log('✅ initializeSidebar function exposed to window object');
