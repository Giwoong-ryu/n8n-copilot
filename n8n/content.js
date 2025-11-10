/**
 * N8N AI Copilot - Content Script
 * N8N 페이지의 DOM을 읽고 조작하는 핵심 스크립트
 */

// ========================================
// 0-1. 유틸리티 함수
// ========================================

/**
 * 대기 함수 (Promise 기반)
 * @param {number} ms - 대기 시간 (밀리초)
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Debounce 함수
 * @param {Function} func - 실행할 함수
 * @param {number} wait - 대기 시간 (밀리초)
 */
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * 신뢰도 임계값 설정 가져오기
 */
async function getConfidenceThresholds() {
  try {
    const result = await chrome.storage.local.get('confidenceThresholds');
    return result.confidenceThresholds || {
      auto: 80,      // 자동 적용
      suggest: 50    // UI 표시
    };
  } catch (error) {
    console.error('❌ Failed to load confidence thresholds:', error);
    return { auto: 80, suggest: 50 };
  }
}

// ========================================
// 0-2. SafeSelector - N8N 버전 변경에 안전한 셀렉터 시스템
// ========================================

/**
 * SafeSelector 클래스
 * N8N의 DOM 구조 변경에 대응하는 fallback 셀렉터 시스템
 * 여러 셀렉터를 시도하여 가장 먼저 찾아지는 요소를 반환
 */
class SafeSelector {
  constructor() {
    // 각 타입별 fallback 셀렉터 정의 (우선순위 순서)
    this.selectors = {
      // 노드 설정 패널 (오른쪽 사이드바)
      settingsPanel: [
        '[class*="NodeSettings"]',
        '[class*="node-settings"]',
        '[data-test-id*="node-settings"]',
        '.ndv-panel',
        '[class*="ndv"]',
        // 추가 fallback: 특정 구조 탐색
        '[class*="panel"][class*="side"]',
        'aside[class*="panel"]'
      ],

      // Monaco 코드 에디터
      codeEditor: [
        '.monaco-editor',
        '[class*="monaco"]',
        '.CodeMirror',
        '[class*="CodeMirror"]',
        'textarea[class*="code"]'
      ],

      // 에러 패널
      errorPanel: [
        '[class*="ExecutionError"]',
        '[class*="execution-error"]',
        '[data-test-id*="error"]',
        '[class*="error-message"]',
        '[class*="RunData"][class*="error"]'
      ],

      // 캔버스 (워크플로우 영역)
      canvas: [
        '[class*="canvas"]',
        '[class*="Canvas"]',
        '[data-test-id*="canvas"]',
        '.workflow-canvas'
      ],

      // 노드 요소들
      nodes: [
        '[class*="CanvasNode"]',
        '[data-node-type]',
        '[class*="node_"]',
        '.node'
      ],

      // 선택된 노드
      selectedNode: [
        '[class*="selected"][class*="node"]',
        '[class*="node"][class*="active"]',
        '.node.selected'
      ],

      // 워크플로우 정보
      workflow: [
        '[class*="workflow"]',
        '[data-test-id*="workflow"]',
        '#workflow'
      ],

      // Vue 앱 루트
      app: [
        '#app',
        '[id*="app"]',
        'body > div:first-child'
      ]
    };
  }

  /**
   * 단일 요소 찾기 (querySelector)
   * @param {string} type - selectors 객체의 키
   * @param {Element} parent - 검색 시작 요소 (기본: document)
   * @param {boolean} silent - true이면 경고 메시지를 출력하지 않음
   * @returns {Element|null}
   */
  find(type, parent = document, silent = false) {
    const selectorList = this.selectors[type];

    if (!selectorList) {
      if (!silent) {
        console.warn(`⚠️ SafeSelector: Unknown type "${type}"`);
      }
      return null;
    }

    for (const selector of selectorList) {
      try {
        const element = parent.querySelector(selector);
        if (element) {
          if (!silent) {
            console.log(`✅ SafeSelector: Found "${type}" with selector: ${selector}`);
          }
          return element;
        }
      } catch (error) {
        if (!silent) {
          console.warn(`⚠️ SafeSelector: Invalid selector "${selector}":`, error.message);
        }
      }
    }

    if (!silent) {
      console.warn(`❌ SafeSelector: Could not find "${type}" with any selector`);
    }
    return null;
  }

  /**
   * 여러 요소 찾기 (querySelectorAll)
   * @param {string} type - selectors 객체의 키
   * @param {Element} parent - 검색 시작 요소 (기본: document)
   * @param {boolean} silent - true이면 경고 메시지를 출력하지 않음
   * @returns {NodeList|Array}
   */
  findAll(type, parent = document, silent = false) {
    const selectorList = this.selectors[type];

    if (!selectorList) {
      if (!silent) {
        console.warn(`⚠️ SafeSelector: Unknown type "${type}"`);
      }
      return [];
    }

    for (const selector of selectorList) {
      try {
        const elements = parent.querySelectorAll(selector);
        if (elements.length > 0) {
          if (!silent) {
            console.log(`✅ SafeSelector: Found ${elements.length} "${type}" with selector: ${selector}`);
          }
          return elements;
        }
      } catch (error) {
        if (!silent) {
          console.warn(`⚠️ SafeSelector: Invalid selector "${selector}":`, error.message);
        }
      }
    }

    if (!silent) {
      console.warn(`❌ SafeSelector: Could not find any "${type}" with any selector`);
    }
    return [];
  }

  /**
   * 커스텀 셀렉터 리스트로 찾기
   * @param {string[]} selectors - 시도할 셀렉터 배열
   * @param {Element} parent - 검색 시작 요소
   * @returns {Element|null}
   */
  findWithCustom(selectors, parent = document) {
    for (const selector of selectors) {
      try {
        const element = parent.querySelector(selector);
        if (element) {
          console.log(`✅ SafeSelector (custom): Found with selector: ${selector}`);
          return element;
        }
      } catch (error) {
        console.warn(`⚠️ SafeSelector (custom): Invalid selector "${selector}":`, error.message);
      }
    }
    return null;
  }

  /**
   * 특정 타입에 대한 커스텀 셀렉터 추가
   * @param {string} type - 타입 이름
   * @param {string} selector - 추가할 셀렉터
   * @param {number} priority - 우선순위 (0이 가장 높음)
   */
  addSelector(type, selector, priority = 999) {
    if (!this.selectors[type]) {
      this.selectors[type] = [];
    }

    // 우선순위에 따라 삽입
    if (priority === 0) {
      this.selectors[type].unshift(selector);
    } else if (priority >= this.selectors[type].length) {
      this.selectors[type].push(selector);
    } else {
      this.selectors[type].splice(priority, 0, selector);
    }

    console.log(`✅ SafeSelector: Added "${selector}" to "${type}" at priority ${priority}`);
  }
}

// SafeSelector 인스턴스 생성 (전역에서 사용)
const safeSelector = new SafeSelector();
window.safeSelector = safeSelector; // 디버깅용

// ========================================
// 1. N8N 페이지 감지
// ========================================
function detectN8NPage() {
  console.log('🔍 N8N AI Copilot - Detecting N8N page...');

  // N8N 특유의 요소 찾기 (SafeSelector 사용)
  const indicators = {
    canvas: safeSelector.find('canvas'),
    workflow: safeSelector.find('workflow'),
    vueApp: safeSelector.find('app')
  };

  const isN8N = Object.values(indicators).some(el => el !== null);

  console.log('📊 Detection results:', indicators);

  if (isN8N) {
    console.log('✅ N8N page detected!');
    initializeAICopilot();
  } else {
    console.log('❌ Not an N8N page');
  }

  return isN8N;
}


// ========================================
// 1.5 N8N 인스턴스에서 노드 정보 가져오기
// ========================================
async function fetchNodesFromCurrentInstance() {
  console.log('📥 Fetching node types from current N8N instance...');

  // 방법 1: REST API 시도 (여러 엔드포인트)
  const apiEndpoints = [
    '/api/v1/node-types',
    '/rest/node-types',
    '/types/nodes.json'
  ];

  for (const endpoint of apiEndpoints) {
    try {
      const response = await fetch(endpoint, {
        method: 'GET',
        headers: { 'Accept': 'application/json' }
      });

      if (response.ok) {
        const data = await response.json();
        const nodeTypes = Array.isArray(data) ? data : Object.values(data);
        console.log(`✅ Fetched ${nodeTypes.length} node types from ${endpoint}`);
        return nodeTypes;
      }
    } catch (e) {
      // 조용히 다음 방법 시도
    }
  }

  // 방법 2: N8N의 전역 Vue store에서 가져오기
  try {
    if (window.__VUE_DEVTOOLS_GLOBAL_HOOK__ && window.__VUE_DEVTOOLS_GLOBAL_HOOK__.apps) {
      const apps = window.__VUE_DEVTOOLS_GLOBAL_HOOK__.apps;

      for (const app of apps) {
        if (app && app._instance && app._instance.proxy) {
          const proxy = app._instance.proxy;

          // Pinia store 접근
          if (proxy.$pinia && proxy.$pinia._s) {
            const stores = proxy.$pinia._s;

            // nodeTypes store 찾기
            for (const [key, store] of stores) {
              if (store.allNodeTypes) {
                const nodeTypes = Object.values(store.allNodeTypes);
                console.log(`✅ Fetched ${nodeTypes.length} node types from Pinia store (${key})`);
                return nodeTypes;
              }

              if (store.nodeTypes) {
                const nodeTypes = Object.values(store.nodeTypes);
                console.log(`✅ Fetched ${nodeTypes.length} node types from Pinia store (${key})`);
                return nodeTypes;
              }
            }
          }
        }
      }
    }
  } catch (error) {
    // 조용히 실패
  }

  console.warn('⚠️ Could not fetch node types - N8N version may not be supported');
  return null;
}

// 노드 정보 가져오기 flag (중복 방지)
let nodeTypesFetched = false;

// Background에 노드 정보 전달 (한 번만)
async function updateNodesInBackground() {
  if (nodeTypesFetched) {
    console.log('⏭️ Node types already fetched, skipping...');
    return;
  }

  const nodeTypes = await fetchNodesFromCurrentInstance();

  if (nodeTypes) {
    nodeTypesFetched = true;
    chrome.runtime.sendMessage({
      action: 'updateNodeTypes',
      nodeTypes: nodeTypes
    }, response => {
      if (response && response.success) {
        console.log('✅ Node types updated in background');
      }
    });
  }
}

// ========================================
// 2. N8N DOM 읽기 클래스
// ========================================
class N8NReader {

  // 워크플로우의 모든 노드 읽기
  getAllNodes() {
    const nodes = [];

    // N8N 캔버스에서 모든 노드 찾기 (SafeSelector 사용)
    const nodeElements = safeSelector.findAll('nodes');

    nodeElements.forEach(nodeEl => {
      const nodeType = this.getNodeType(nodeEl);
      const nodeName = this.getNodeName(nodeEl);

      // 유효한 노드만 추가
      if (nodeType && nodeType !== 'unknown' && nodeType.trim() !== '') {
        nodes.push({
          type: nodeType,
          name: nodeName,
          element: nodeEl
        });
      }
    });

    // 중복 제거 (같은 타입의 노드가 여러 개일 수 있음)
    const uniqueTypes = [...new Set(nodes.map(n => n.type))];

    return {
      all: nodes,
      types: uniqueTypes,
      count: nodes.length
    };
  }

  // 현재 선택된 노드 정보 읽기
  getSelectedNode() {
    const selectedNode = safeSelector.find('selectedNode');

    if (!selectedNode) {
      return null;
    }

    return {
      element: selectedNode,
      type: this.getNodeType(selectedNode),
      name: this.getNodeName(selectedNode),
      id: this.getNodeId(selectedNode)
    };
  }
  
  getNodeType(nodeElement) {
    const typeElement = nodeElement.querySelector('[class*="type"]');
    return typeElement ? typeElement.textContent.trim() : 'unknown';
  }
  
  getNodeName(nodeElement) {
    const nameElement = nodeElement.querySelector('[class*="name"]');
    return nameElement ? nameElement.textContent.trim() : 'Unnamed';
  }
  
  getNodeId(nodeElement) {
    return nodeElement.getAttribute('data-node-id') || 
           nodeElement.getAttribute('id') || 
           'unknown';
  }
  
  // 노드 설정 패널의 입력 필드 읽기 (토글 포함)
  getNodeSettings() {
    const settingsPanel = safeSelector.find('settingsPanel');

    if (!settingsPanel) {
      console.warn('⚠️ Settings panel not found');
      return { fields: [], toggles: [], options: [] };
    }

    // 일반 입력 필드
    const inputs = settingsPanel.querySelectorAll('input[type="text"], input[type="number"], input[type="email"], input[type="url"], textarea, select');
    const fields = Array.from(inputs).map(input => ({
      element: input,
      name: this.getInputName(input),
      value: input.value,
      type: input.type || input.tagName.toLowerCase()
    }));

    // 토글/체크박스 (매우 중요!)
    const checkboxes = settingsPanel.querySelectorAll('input[type="checkbox"]');
    const toggles = Array.from(checkboxes).map(checkbox => ({
      element: checkbox,
      name: this.getInputName(checkbox),
      checked: checkbox.checked,
      type: 'toggle'
    }));

    // N8N 특수 토글 (switch 컴포넌트)
    const switches = settingsPanel.querySelectorAll('[class*="switch"], [class*="toggle"], [role="switch"]');
    switches.forEach(switchEl => {
      const isOn = switchEl.classList.contains('on') ||
                   switchEl.classList.contains('active') ||
                   switchEl.getAttribute('aria-checked') === 'true';

      toggles.push({
        element: switchEl,
        name: this.getInputName(switchEl),
        checked: isOn,
        type: 'switch'
      });
    });

    // 드롭다운/옵션
    const selects = settingsPanel.querySelectorAll('select');
    const options = Array.from(selects).map(select => ({
      element: select,
      name: this.getInputName(select),
      value: select.value,
      selectedText: select.options[select.selectedIndex]?.text,
      type: 'select'
    }));

    return { fields, toggles, options };
  }

  getInputName(inputElement) {
    // 1. 가장 가까운 label
    const label = inputElement.closest('label');
    if (label && label.textContent.trim()) {
      return label.textContent.trim();
    }

    // 2. 이전 형제 요소의 label
    const prevLabel = inputElement.previousElementSibling;
    if (prevLabel && prevLabel.tagName === 'LABEL') {
      return prevLabel.textContent.trim();
    }

    // 3. 부모 요소에서 label 찾기
    const parent = inputElement.parentElement;
    if (parent) {
      const parentLabel = parent.querySelector('label');
      if (parentLabel) {
        return parentLabel.textContent.trim();
      }

      // 4. 부모의 텍스트 내용 (label이 없을 때)
      const parentText = parent.textContent.trim();
      if (parentText && parentText.length < 100) {
        return parentText;
      }
    }

    // 5. data-test-id나 name attribute
    return inputElement.getAttribute('data-test-id') ||
           inputElement.name ||
           inputElement.placeholder ||
           'unknown';
  }
  
  // 에러 메시지 감지 (개선된 버전)
  detectErrors() {
    const detectedErrors = [];

    // 1. 노드 실행 에러 패널에서 상세 정보 추출 (SafeSelector 사용, silent mode)
    const errorPanels = safeSelector.findAll('errorPanel', document, true);

    errorPanels.forEach(panel => {
      const errorInfo = this.extractDetailedError(panel);
      if (errorInfo) {
        detectedErrors.push(errorInfo);
      }
    });

    // 2. 일반 에러 요소에서 추출 (백업) - 커스텀 셀렉터 사용
    if (detectedErrors.length === 0) {
      const generalErrorSelectors = [
        '[class*="error"]',
        '[class*="Error"]',
        '[class*="issue"]',
        '.el-message--error'
      ];

      for (const selector of generalErrorSelectors) {
        const generalErrors = document.querySelectorAll(selector);
        if (generalErrors.length > 0) {
          generalErrors.forEach(errorEl => {
            const text = errorEl.textContent.trim();
            if (text && text.length > 0 && text.length < 5000) {
              detectedErrors.push({
                element: errorEl,
                message: text,
                type: this.getErrorType(text),
                details: null
              });
            }
          });
          break; // 찾았으면 중단
        }
      }
    }

    if (detectedErrors.length > 0) {
      console.log(`⚠️ Found ${detectedErrors.length} error(s)`);
    }
    return detectedErrors;
  }

  // 상세 에러 정보 추출
  extractDetailedError(errorElement) {
    const text = errorElement.textContent.trim();
    if (!text || text.length === 0) return null;

    // 에러 타입 추출 (ReferenceError, SyntaxError 등)
    const errorTypeMatch = text.match(/(ReferenceError|SyntaxError|TypeError|Error):\s*(.+?)(?=\n|$)/);
    const errorType = errorTypeMatch ? errorTypeMatch[1] : null;
    const errorMessage = errorTypeMatch ? errorTypeMatch[2] : text;

    // 줄 번호 추출
    const lineNumberMatch = text.match(/(?:at line|line|:)?\s*(\d+)(?::(\d+))?/);
    const lineNumber = lineNumberMatch ? lineNumberMatch[1] : null;
    const columnNumber = lineNumberMatch ? lineNumberMatch[2] : null;

    // 스택 트레이스 추출
    const stackMatch = text.match(/at\s+.+\(.+:\d+:\d+\)/g);
    const stackTrace = stackMatch ? stackMatch.slice(0, 3) : null; // 처음 3줄만

    // 노드 이름 추출
    const nodeNameMatch = text.match(/(?:in node|node)\s+['"]?([^'"]+)['"]?/i);
    const nodeName = nodeNameMatch ? nodeNameMatch[1] : this.findParentNodeName(errorElement);

    // 전체 에러 메시지 (너무 길면 자르기)
    const fullMessage = text.length > 1000 ? text.substring(0, 1000) + '...' : text;

    return {
      element: errorElement,
      type: errorType || this.getErrorType(text),
      message: errorMessage || fullMessage,
      details: {
        fullMessage: fullMessage,
        lineNumber: lineNumber,
        columnNumber: columnNumber,
        stackTrace: stackTrace,
        nodeName: nodeName,
        errorType: errorType
      }
    };
  }

  // 에러 요소의 부모 노드에서 노드 이름 찾기
  findParentNodeName(element) {
    let current = element;
    for (let i = 0; i < 10; i++) {
      if (!current) break;

      // 노드 이름을 포함할 수 있는 요소 찾기
      const nodeName = current.querySelector('[class*="node-name"], [class*="NodeName"], [data-test-id*="node-name"]');
      if (nodeName && nodeName.textContent) {
        return nodeName.textContent.trim();
      }

      current = current.parentElement;
    }
    return null;
  }

  getErrorType(text) {
    const textLower = text.toLowerCase();

    // JavaScript 에러 타입
    if (text.includes('ReferenceError')) return 'ReferenceError';
    if (text.includes('SyntaxError')) return 'SyntaxError';
    if (text.includes('TypeError')) return 'TypeError';

    // N8N 특정 에러
    if (textLower.includes('credential')) return 'credential';
    if (textLower.includes('connection')) return 'connection';
    if (textLower.includes('required')) return 'validation';
    if (textLower.includes('timeout')) return 'timeout';
    if (textLower.includes('authentication')) return 'authentication';

    return 'general';
  }

  // 노드의 실행 데이터 읽기 (Input/Output)
  getNodeExecutionData(nodeName) {
    console.log('📊 Reading execution data from node:', nodeName);

    const settingsPanel = safeSelector.find('settingsPanel');

    if (!settingsPanel) {
      console.warn('⚠️ Settings panel not found');
      return null;
    }

    const executionData = {
      nodeName: nodeName,
      input: null,
      output: null,
      inputItems: 0,
      outputItems: 0,
      dataLoss: false,
      dataChange: null
    };

    // Input/Output 탭 또는 데이터 표시 영역 찾기
    const tabs = settingsPanel.querySelectorAll('[role="tab"], .tab, [class*="tab"]');
    const dataDisplays = settingsPanel.querySelectorAll('[class*="data"], [class*="json"], pre, code');

    // JSON 데이터 찾기
    for (const display of dataDisplays) {
      const text = display.textContent;
      if (!text) continue;

      try {
        // JSON 파싱 시도
        const jsonMatch = text.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
        if (jsonMatch) {
          const data = JSON.parse(jsonMatch[0]);

          // items 배열 찾기
          if (Array.isArray(data)) {
            // Output일 가능성
            if (!executionData.output) {
              executionData.output = data;
              executionData.outputItems = data.length;
            } else if (!executionData.input) {
              executionData.input = data;
              executionData.inputItems = data.length;
            }
          } else if (data.items && Array.isArray(data.items)) {
            // items가 있는 객체
            if (!executionData.output) {
              executionData.output = data.items;
              executionData.outputItems = data.items.length;
            } else if (!executionData.input) {
              executionData.input = data.items;
              executionData.inputItems = data.items.length;
            }
          }
        }
      } catch (e) {
        // JSON 파싱 실패는 무시
      }
    }

    // Items 개수 표시 찾기 (예: "3 items")
    const itemCountElements = settingsPanel.querySelectorAll('[class*="item"], [class*="count"]');
    for (const el of itemCountElements) {
      const text = el.textContent;
      const match = text.match(/(\d+)\s*items?/i);
      if (match) {
        const count = parseInt(match[1]);
        if (executionData.outputItems === 0) {
          executionData.outputItems = count;
        }
      }
    }

    // 데이터 손실 감지
    if (executionData.inputItems > 0 && executionData.outputItems > 0) {
      if (executionData.outputItems < executionData.inputItems) {
        executionData.dataLoss = true;
        executionData.dataChange = `${executionData.inputItems} items → ${executionData.outputItems} items (손실!)`;
      } else if (executionData.outputItems > executionData.inputItems) {
        executionData.dataChange = `${executionData.inputItems} items → ${executionData.outputItems} items (증가)`;
      }
    }

    console.log('📊 Execution data:', executionData);
    return executionData;
  }

  // Code 노드에서 JavaScript 코드 읽기
  getCodeFromNode(nodeName) {
    console.log('🔍 Trying to read code from node:', nodeName);

    // 설정 패널이 열려있는지 확인 (SafeSelector 사용)
    const settingsPanel = safeSelector.find('settingsPanel');

    if (!settingsPanel) {
      console.warn('⚠️ Settings panel not found - node may not be clicked');
      return null; // 에러 대신 null 반환
    }

    // Monaco Editor (N8N이 주로 사용) - SafeSelector 사용
    const monacoEditors = safeSelector.findAll('codeEditor', settingsPanel);
    for (const editor of monacoEditors) {
      // Monaco의 실제 텍스트 영역 찾기
      const textArea = editor.querySelector('textarea');
      if (textArea && textArea.value) {
        console.log('✅ Code found in Monaco Editor (textarea)');
        return textArea.value;
      }

      // Monaco의 view-lines에서 코드 읽기
      const viewLines = editor.querySelector('.view-lines');
      if (viewLines) {
        const code = Array.from(viewLines.querySelectorAll('.view-line'))
          .map(line => line.textContent)
          .join('\n');
        if (code.trim()) {
          console.log('✅ Code found in Monaco Editor (view-lines)');
          return code;
        }
      }
    }

    // CodeMirror (대체 에디터)
    const codeMirrors = settingsPanel.querySelectorAll('.CodeMirror, [class*="CodeMirror"]');
    for (const cm of codeMirrors) {
      const cmInstance = cm.CodeMirror;
      if (cmInstance && cmInstance.getValue) {
        const code = cmInstance.getValue();
        console.log('✅ Code found in CodeMirror');
        return code;
      }
    }

    // 일반 textarea (백업)
    const textareas = settingsPanel.querySelectorAll('textarea');
    for (const textarea of textareas) {
      // 긴 텍스트가 있는 textarea = 코드일 가능성
      if (textarea.value && textarea.value.length > 20) {
        console.log('✅ Code found in textarea');
        return textarea.value;
      }
    }

    console.warn('⚠️ Could not find code in node');
    return null;
  }

  // 전체 워크플로우 구조 읽기
  getWorkflowStructure() {
    const nodes = document.querySelectorAll('[class*="CanvasNode"], [data-node-type]');

    return {
      nodeCount: nodes.length,
      nodes: Array.from(nodes).map(node => ({
        type: this.getNodeType(node),
        name: this.getNodeName(node),
        id: this.getNodeId(node)
      }))
    };
  }

  // 모든 노드의 실행 데이터 수집 (자동으로 각 노드 클릭하며 수집)
  async getAllNodesExecutionData(onProgress = null) {
    console.log('🔄 Collecting execution data from all nodes...');

    const nodes = safeSelector.findAll('nodes');
    const nodesData = [];
    const total = nodes.length;
    const startTime = Date.now();
    const MAX_TOTAL_TIME = 120000; // 2분 최대 타임아웃

    for (let index = 0; index < nodes.length; index++) {
      const nodeElement = nodes[index];
      const nodeName = this.getNodeName(nodeElement);

      // 취소 확인 (전역 변수 참조)
      if (window.currentAnalysisTask && window.currentAnalysisTask.isCancelled()) {
        console.log(`🛑 Collection cancelled at node ${index + 1}/${total}`);
        break;
      }

      // 진행률 업데이트
      const progress = {
        current: index + 1,
        total: total,
        percentage: Math.round(((index + 1) / total) * 100),
        nodeName: nodeName
      };

      if (onProgress) {
        onProgress(progress);
      }

      console.log(`📍 [${progress.current}/${progress.total}] Checking node: ${nodeName}`);

      // 전체 시간 초과 체크
      if (Date.now() - startTime > MAX_TOTAL_TIME) {
        console.warn(`⏰ Total timeout reached. Processed ${nodesData.length}/${total} nodes`);
        break;
      }

      // 노드 클릭하여 설정 패널 열기
      nodeElement.click();

      // 패널이 실제로 열릴 때까지 대기 (최대 3초)
      const panel = await waitForPanel(3000);

      if (!panel) {
        console.warn(`⚠️ Panel failed to open for node: ${nodeName} (skipping)`);
        // 패널 닫기 시도
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
        await sleep(200);
        continue;
      }

      // 실행 데이터 읽기
      const execData = this.getNodeExecutionData(nodeName);
      const code = this.getCodeFromNode(nodeName);

      if (execData || code) {
        nodesData.push({
          nodeName,
          nodeType: this.getNodeType(nodeElement),
          executionData: execData,
          code: code,
          hasDataLoss: execData?.dataLoss || false
        });
      }

      // ESC 키로 패널 닫기
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
      await sleep(200);
    }

    const status = window.currentAnalysisTask && window.currentAnalysisTask.isCancelled() ? 'cancelled' : 'complete';
    console.log(`✅ Data collection ${status}: ${nodesData.length}/${total} nodes`);
    return nodesData;
  }

  // 워크플로우 데이터 흐름 분석
  analyzeWorkflowDataFlow(nodesData) {
    console.log('🔍 Analyzing workflow data flow...');

    const analysis = {
      totalNodes: nodesData.length,
      nodesWithDataLoss: [],
      dataFlowIssues: [],
      recommendations: []
    };

    // 데이터 손실 노드 찾기
    nodesData.forEach((nodeData, index) => {
      if (nodeData.hasDataLoss) {
        analysis.nodesWithDataLoss.push({
          nodeName: nodeData.nodeName,
          issue: nodeData.executionData.dataChange,
          position: index
        });
      }

      // 이전 노드와 데이터 개수 비교
      if (index > 0) {
        const prevNode = nodesData[index - 1];
        const currentNode = nodeData;

        if (prevNode.executionData && currentNode.executionData) {
          const prevOutput = prevNode.executionData.outputItems;
          const currentInput = currentNode.executionData.inputItems;

          if (prevOutput !== currentInput && prevOutput > 0 && currentInput > 0) {
            analysis.dataFlowIssues.push({
              from: prevNode.nodeName,
              to: currentNode.nodeName,
              issue: `${prevOutput} items → ${currentInput} items`,
              severity: prevOutput > currentInput ? 'high' : 'low'
            });
          }
        }
      }
    });

    // 추천 사항 생성
    if (analysis.nodesWithDataLoss.length > 0) {
      const firstLoss = analysis.nodesWithDataLoss[0];
      analysis.recommendations.push({
        priority: 'high',
        nodeName: firstLoss.nodeName,
        message: `"${firstLoss.nodeName}" 노드에서 데이터 손실 발생`,
        suggestion: '코드 검토 또는 "Run Once for All Items" 설정 확인 필요'
      });
    }

    if (analysis.dataFlowIssues.length > 0) {
      const highSeverityIssues = analysis.dataFlowIssues.filter(i => i.severity === 'high');
      if (highSeverityIssues.length > 0) {
        const issue = highSeverityIssues[0];
        analysis.recommendations.push({
          priority: 'high',
          nodeName: issue.from,
          message: `"${issue.from}" → "${issue.to}" 사이 데이터 손실`,
          suggestion: `"${issue.from}" 노드 출력 확인 필요`
        });
      }
    }

    console.log('📊 Analysis result:', analysis);
    return analysis;
  }

  // 문제의 근원 노드 찾기
  findIssueSource(nodesData, problemDescription) {
    console.log('🎯 Finding issue source:', problemDescription);

    const issues = [];

    // 키워드 기반 문제 감지
    const isItemCountIssue = /\d+.*전송.*\d+.*전송|개수|1개만|하나만/i.test(problemDescription);
    const isTextTruncated = /짤림|잘림|truncate|substring|짧/i.test(problemDescription);

    nodesData.forEach((nodeData, index) => {
      // 데이터 손실이 있는 노드
      if (nodeData.hasDataLoss && isItemCountIssue) {
        issues.push({
          priority: 'critical',
          nodeName: nodeData.nodeName,
          type: 'data_loss',
          description: `데이터 개수 감소: ${nodeData.executionData.dataChange}`,
          codeSnippet: nodeData.code ? nodeData.code.substring(0, 200) : null,
          suggestion: '코드에서 items[0] 또는 필터링 로직 확인'
        });
      }

      // 텍스트 잘림 패턴 감지
      if (nodeData.code && isTextTruncated) {
        if (nodeData.code.includes('substring') ||
            nodeData.code.includes('slice') ||
            nodeData.code.includes('substr')) {
          issues.push({
            priority: 'high',
            nodeName: nodeData.nodeName,
            type: 'text_truncation',
            description: '코드에서 문자열 자르기 사용 중',
            codeSnippet: nodeData.code,
            suggestion: 'substring/slice 로직 제거 또는 길이 조정'
          });
        }
      }
    });

    // 우선순위 정렬
    issues.sort((a, b) => {
      const priority = { critical: 3, high: 2, medium: 1, low: 0 };
      return priority[b.priority] - priority[a.priority];
    });

    console.log('🎯 Found issues:', issues);
    return issues;
  }

  // ========================================
  // 고급 분석 시스템
  // ========================================

  // 자동 문제 감지 (사용자 설명 없이도 일반적인 문제 패턴 자동 감지)
  detectAutomaticIssues(nodesData) {
    console.log('🔍 Auto-detecting common issues...');
    const detectedIssues = [];

    nodesData.forEach((nodeData, index) => {
      const { nodeName, executionData, code, error } = nodeData;

      // 1. 데이터 개수 감소 (items[0] 패턴)
      if (executionData && executionData.inputItems > executionData.outputItems) {
        const reduction = executionData.inputItems - executionData.outputItems;

        // 코드에서 원인 찾기
        let cause = '알 수 없음';
        let codeSnippet = null;

        if (code) {
          if (code.match(/items\[0\]|item\[0\]/)) {
            cause = 'items[0] 사용 - 첫 번째 아이템만 선택';
            codeSnippet = code.split('\n').find(line => line.includes('items[0]') || line.includes('item[0]'));
          } else if (code.match(/\.filter\(/)) {
            cause = 'filter() 사용 - 일부 아이템 필터링';
            codeSnippet = code.split('\n').find(line => line.includes('.filter('));
          } else if (code.match(/\.slice\(.*,.*\)/)) {
            cause = 'slice() 사용 - 배열 일부만 선택';
            codeSnippet = code.split('\n').find(line => line.includes('.slice('));
          } else if (code.match(/\.limit\(|\.take\(/)) {
            cause = 'limit/take 사용 - 개수 제한';
            codeSnippet = code.split('\n').find(line => line.includes('.limit(') || line.includes('.take('));
          }
        }

        detectedIssues.push({
          priority: 'critical',
          nodeName: nodeName,
          nodeIndex: index,
          type: 'data_count_reduction',
          description: `데이터 개수 감소: ${executionData.inputItems}개 → ${executionData.outputItems}개 (${reduction}개 손실)`,
          cause: cause,
          codeSnippet: codeSnippet,
          suggestion: cause === 'items[0] 사용 - 첫 번째 아이템만 선택'
            ? '모든 아이템 처리하려면 items.map() 또는 반복문 사용'
            : '필터 조건 또는 slice/limit 파라미터 확인'
        });
      }

      // 2. 텍스트 잘림 패턴
      if (code) {
        const truncationPatterns = [
          { pattern: /\.substring\((\d+),\s*(\d+)\)/, name: 'substring' },
          { pattern: /\.slice\((\d+),\s*(\d+)\)/, name: 'slice' },
          { pattern: /\.substr\((\d+),\s*(\d+)\)/, name: 'substr' }
        ];

        truncationPatterns.forEach(({ pattern, name }) => {
          const match = code.match(pattern);
          if (match) {
            const startIdx = match[1];
            const endIdx = match[2];
            const length = endIdx - startIdx;

            detectedIssues.push({
              priority: 'high',
              nodeName: nodeName,
              nodeIndex: index,
              type: 'text_truncation',
              description: `텍스트 잘림 가능성: ${name}(${startIdx}, ${endIdx}) 사용`,
              cause: `문자열을 ${length}자로 제한`,
              codeSnippet: code.split('\n').find(line => line.match(pattern)),
              suggestion: '전체 텍스트가 필요하면 substring/slice 제거, 또는 길이 늘리기'
            });
          }
        });
      }

      // 3. 인증 에러
      if (error && (error.includes('401') || error.includes('403') || error.includes('Unauthorized'))) {
        detectedIssues.push({
          priority: 'critical',
          nodeName: nodeName,
          nodeIndex: index,
          type: 'authentication_error',
          description: '인증 실패',
          cause: error,
          suggestion: 'Credentials 설정 확인, API 키/토큰 유효성 검사'
        });
      }

      // 4. 필수 필드 누락
      if (executionData && executionData.output) {
        const outputs = Array.isArray(executionData.output) ? executionData.output : [executionData.output];
        const missingFields = [];

        outputs.forEach((item, idx) => {
          if (item && typeof item === 'object') {
            const values = Object.values(item);
            const hasUndefined = values.some(v => v === undefined || v === null || v === '');
            if (hasUndefined) {
              const undefinedKeys = Object.keys(item).filter(k =>
                item[k] === undefined || item[k] === null || item[k] === ''
              );
              missingFields.push({ itemIndex: idx, fields: undefinedKeys });
            }
          }
        });

        if (missingFields.length > 0) {
          detectedIssues.push({
            priority: 'medium',
            nodeName: nodeName,
            nodeIndex: index,
            type: 'missing_fields',
            description: `일부 아이템에 빈 필드 존재 (${missingFields.length}개 아이템)`,
            cause: `누락된 필드: ${missingFields[0].fields.join(', ')}`,
            suggestion: '이전 노드에서 데이터가 제대로 전달되었는지 확인'
          });
        }
      }

      // 5. 반복 실행 실패 (Loop + 일부만 성공)
      if (executionData && executionData.inputItems > 1 && executionData.outputItems === 1) {
        // 여러 입력이 있었는데 출력이 1개만 = 반복 실행 실패 의심
        if (code && code.includes('for') || code.includes('forEach') || code.includes('map')) {
          detectedIssues.push({
            priority: 'high',
            nodeName: nodeName,
            nodeIndex: index,
            type: 'loop_partial_failure',
            description: `반복 실행 실패 의심: ${executionData.inputItems}개 입력 → 1개 출력`,
            cause: '반복문 안에서 일부만 처리되거나 에러 발생',
            suggestion: '반복문 로직 확인, try-catch로 에러 처리 추가'
          });
        }
      }
    });

    // 우선순위 정렬
    detectedIssues.sort((a, b) => {
      const priority = { critical: 3, high: 2, medium: 1, low: 0 };
      return (priority[b.priority] || 0) - (priority[a.priority] || 0);
    });

    console.log(`✅ Auto-detected ${detectedIssues.length} issues:`, detectedIssues);
    return detectedIssues;
  }

  // 노드 체인 역추적 분석 (문제 노드부터 이전 노드까지)
  analyzeNodeChain(nodesData, problemNodeIndex) {
    console.log(`🔙 Analyzing node chain from index ${problemNodeIndex} backwards...`);

    const chain = [];
    const problemNode = nodesData[problemNodeIndex];

    if (!problemNode) {
      console.warn('⚠️ Problem node not found');
      return chain;
    }

    // 문제 노드부터 역순으로 분석
    for (let i = problemNodeIndex; i >= 0; i--) {
      const node = nodesData[i];
      const prevNode = i > 0 ? nodesData[i - 1] : null;

      const analysis = {
        nodeIndex: i,
        nodeName: node.nodeName,
        role: i === problemNodeIndex ? 'problem_node' : 'upstream_node',
        executionData: node.executionData,
        code: node.code,
        error: node.error,
        issues: []
      };

      // 데이터 변화 감지
      if (prevNode && node.executionData && prevNode.executionData) {
        const prevOutput = prevNode.executionData.outputItems;
        const currentInput = node.executionData.inputItems;
        const currentOutput = node.executionData.outputItems;

        // 입력-출력 불일치
        if (prevOutput !== currentInput && prevOutput > 0 && currentInput > 0) {
          analysis.issues.push({
            type: 'data_mismatch',
            description: `이전 노드 출력(${prevOutput}개)과 현재 입력(${currentInput}개) 불일치`,
            severity: 'high'
          });
        }

        // 데이터 손실
        if (currentOutput < currentInput) {
          analysis.issues.push({
            type: 'data_loss_in_node',
            description: `노드 내부에서 데이터 감소: ${currentInput}개 → ${currentOutput}개`,
            severity: 'critical'
          });
        }
      }

      // 코드 패턴 검사
      if (node.code) {
        // items[0] 패턴
        if (node.code.match(/items\[0\]|item\[0\]/)) {
          analysis.issues.push({
            type: 'single_item_access',
            description: 'items[0] 사용 - 첫 번째 아이템만 처리',
            severity: 'critical',
            codeSnippet: node.code.split('\n').find(line => line.includes('items[0]'))
          });
        }

        // return 문 확인
        const returnMatch = node.code.match(/return\s+(.+?);/);
        if (returnMatch) {
          const returnValue = returnMatch[1].trim();
          if (!returnValue.includes('items') && !returnValue.includes('[')) {
            analysis.issues.push({
              type: 'suspicious_return',
              description: `return 문이 배열을 반환하지 않을 수 있음: ${returnValue}`,
              severity: 'high',
              codeSnippet: returnMatch[0]
            });
          }
        }
      }

      chain.push(analysis);

      // 문제가 명확히 발견되면 더 이상 역추적하지 않음 (최적화)
      if (analysis.issues.some(issue => issue.severity === 'critical') && i < problemNodeIndex) {
        console.log(`✅ Root cause found at node ${i}: ${node.nodeName}`);
        break;
      }
    }

    console.log(`📊 Chain analysis complete: ${chain.length} nodes analyzed`);
    return chain;
  }

  // AI 분석을 위한 워크플로우 컨텍스트 구축
  buildAIContext(nodesData, userIntent = null, errorDescription = null) {
    console.log('🤖 Building AI analysis context...');

    const context = {
      summary: {
        totalNodes: nodesData.length,
        nodesWithErrors: nodesData.filter(n => n.error).length,
        nodesWithDataLoss: nodesData.filter(n => n.hasDataLoss).length,
        userIntent: userIntent,
        errorDescription: errorDescription
      },
      nodes: [],
      dataFlow: [],
      detectedIssues: this.detectAutomaticIssues(nodesData)
    };

    // 각 노드 정보
    nodesData.forEach((node, index) => {
      const nodeInfo = {
        index: index,
        name: node.nodeName,
        type: node.nodeType || 'unknown',
        input: node.executionData ? {
          itemCount: node.executionData.inputItems,
          sample: this._getSampleData(node.executionData.input, 2)
        } : null,
        output: node.executionData ? {
          itemCount: node.executionData.outputItems,
          sample: this._getSampleData(node.executionData.output, 2)
        } : null,
        code: node.code ? this._truncateCode(node.code, 50) : null,
        error: node.error || null,
        hasDataLoss: node.hasDataLoss || false
      };

      context.nodes.push(nodeInfo);

      // 데이터 흐름 정보
      if (index > 0) {
        const prevNode = nodesData[index - 1];
        if (prevNode.executionData && node.executionData) {
          context.dataFlow.push({
            from: { name: prevNode.nodeName, output: prevNode.executionData.outputItems },
            to: { name: node.nodeName, input: node.executionData.inputItems },
            itemsLost: prevNode.executionData.outputItems - node.executionData.inputItems,
            status: prevNode.executionData.outputItems === node.executionData.inputItems ? 'ok' : 'mismatch'
          });
        }
      }
    });

    console.log('✅ AI context built:', context);
    return context;
  }

  // 헬퍼: 샘플 데이터 추출 (처음 N개 아이템)
  _getSampleData(data, count = 2) {
    if (!data) return null;
    if (Array.isArray(data)) {
      return data.slice(0, count);
    }
    return data;
  }

  // 헬퍼: 코드 잘라내기 (처음 N줄)
  _truncateCode(code, lines = 50) {
    const codeLines = code.split('\n');
    if (codeLines.length <= lines) return code;
    return codeLines.slice(0, lines).join('\n') + '\n... (' + (codeLines.length - lines) + ' more lines)';
  }
}


// ========================================
// 3. N8N DOM 쓰기 클래스
// ========================================
class N8NWriter {
  
  // 입력 필드에 값 쓰기 (Vue 리액티브 트리거)
  setFieldValue(fieldElement, value) {
    console.log('✍️ Writing to field:', fieldElement, value);
    
    if (!fieldElement) {
      console.error('❌ Field element not found');
      return false;
    }
    
    // 1. 직접 값 설정
    fieldElement.value = value;
    
    // 2. Vue의 리액티브 시스템을 트리거하기 위한 이벤트 발생
    const events = ['input', 'change', 'blur'];
    
    events.forEach(eventType => {
      const event = new Event(eventType, { 
        bubbles: true, 
        cancelable: true 
      });
      fieldElement.dispatchEvent(event);
    });
    
    // 3. Vue 컴포넌트 직접 접근 시도
    this.triggerVueUpdate(fieldElement, value);
    
    console.log('✅ Value written successfully');
    return true;
  }
  
  // Vue 컴포넌트에 직접 접근
  triggerVueUpdate(element, value) {
    try {
      // Vue 3의 __vueParentComponent 속성 찾기
      const vueInstance = element.__vueParentComponent || 
                          element.__vue__;
      
      if (vueInstance) {
        console.log('🎯 Found Vue instance, triggering update...');
        
        // Vue의 emit으로 update 이벤트 발생
        if (vueInstance.emit) {
          vueInstance.emit('update:modelValue', value);
          vueInstance.emit('input', value);
        }
        
        // Props 직접 업데이트 시도
        if (vueInstance.props && vueInstance.props.modelValue !== undefined) {
          vueInstance.props.modelValue = value;
        }
      }
    } catch (error) {
      console.log('⚠️ Vue update failed (normal):', error.message);
      // 실패해도 괜찮음 - 기본 이벤트로 충분할 수 있음
    }
  }
  
  // 여러 필드에 자동으로 값 채우기
  autoFillFields(suggestions) {
    const reader = new N8NReader();
    const fields = reader.getNodeSettings();
    
    let filledCount = 0;
    
    for (const [fieldName, value] of Object.entries(suggestions)) {
      // 필드 이름으로 매칭
      const field = fields.find(f => 
        f.name.toLowerCase().includes(fieldName.toLowerCase())
      );
      
      if (field) {
        this.setFieldValue(field.element, value);
        filledCount++;
      }
    }
    
    console.log(`✅ Auto-filled ${filledCount} fields`);
    return filledCount;
  }
}


// ========================================
// 4. AI 기능 - 에러 분석
// ========================================
async function analyzeError(errorData) {
  console.log('🔍 Analyzing error:', errorData);
  
  const prompt = `N8N 워크플로우에서 다음 에러가 발생했습니다:

노드: ${errorData.nodeName || 'Unknown'}
노드 타입: ${errorData.nodeType || 'Unknown'}
에러 메시지: ${errorData.errorMessage}

다음 형식으로 간단명료하게 답변해주세요:

1. 원인 (한 문장)
2. 해결 방법 (최대 3개, 각 한 줄)

답변은 한국어로 작성해주세요.`;

  const result = await callClaudeAPI(
    prompt,
    'You are an expert N8N workflow automation assistant. Provide concise, actionable solutions.'
  );
  
  return result;
}


// ========================================
// 5. AI 기능 - JSON 자동 생성
// ========================================
async function generateJSON(requestData) {
  console.log('📝 Generating JSON:', requestData);
  
  const prompt = `N8N의 ${requestData.nodeType} 노드를 위한 JSON을 생성해주세요.

요구사항:
${requestData.requirements}

${requestData.example ? `예시:\n${requestData.example}` : ''}

응답은 반드시 유효한 JSON만 출력하세요. 설명은 포함하지 마세요.`;

  const result = await callClaudeAPI(
    prompt,
    'You are a JSON generation expert. Always respond with valid, properly formatted JSON only. No explanations.'
  );
  
  if (result.success) {
    try {
      const jsonMatch = result.content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const json = JSON.parse(jsonMatch[0]);
        return {
          success: true,
          json: json
        };
      }
    } catch (error) {
      return {
        error: true,
        message: 'Failed to parse generated JSON',
        rawContent: result.content
      };
    }
  }
  
  return result;
}


// ========================================
// 6. AI 기능 - 설정 자동 채우기
// ========================================
async function autoFillSettings(contextData) {
  console.log('⚙️ Auto-filling settings:', contextData);
  
  const prompt = `N8N 워크플로우에서 다음 노드를 설정하려고 합니다:

노드 타입: ${contextData.nodeType}
현재 설정 필드들:
${JSON.stringify(contextData.fields, null, 2)}

사용자 요청: ${contextData.userRequest}

각 필드에 적절한 값을 JSON 형식으로 제안해주세요.
응답 형식:
{
  "fieldName1": "suggested value 1",
  "fieldName2": "suggested value 2"
}

응답은 반드시 유효한 JSON만 출력하세요.`;

  const result = await callClaudeAPI(
    prompt,
    'You are an N8N workflow configuration expert. Suggest appropriate field values based on node type and user requirements.'
  );
  
  if (result.success) {
    try {
      const jsonMatch = result.content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const suggestions = JSON.parse(jsonMatch[0]);
        return {
          success: true,
          suggestions: suggestions
        };
      }
    } catch (error) {
      return {
        error: true,
        message: 'Failed to parse suggestions',
        rawContent: result.content
      };
    }
  }
  
  return result;
}


// ========================================
// 7. Background Script와 통신
// ========================================
async function callClaudeAPI(message, systemPrompt = '', context = {}) {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage(
      {
        action: 'callClaude',
        message: message,
        systemPrompt: systemPrompt,
        context: context
      },
      (response) => {
        if (chrome.runtime.lastError) {
          resolve({
            error: true,
            message: chrome.runtime.lastError.message
          });
        } else {
          resolve(response);
        }
      }
    );
  });
}


// ========================================
// 8. 초기화
// ========================================
function initializeAICopilot() {
  console.log('🚀 Initializing N8N AI Copilot...');

  // Reader와 Writer 인스턴스 생성
  window.n8nReader = new N8NReader();
  window.n8nWriter = new N8NWriter();
  console.log('✅ Reader and Writer initialized');

  // N8N 인스턴스에서 노드 정보 가져오기
  updateNodesInBackground();

  // 사이드바 초기화 (sidebar.js에서 처리)
  console.log('🔍 Checking if initializeSidebar exists:', typeof initializeSidebar);

  if (typeof initializeSidebar === 'function') {
    console.log('🎨 Calling initializeSidebar...');
    initializeSidebar();
  } else {
    console.error('❌ initializeSidebar function not found!');
  }

  // 에러 자동 감지 (5초마다) - 메모리 누수 방지
  let errorDetectionInterval = null;

  function startErrorDetection() {
    // 이미 실행 중이면 중복 방지
    if (errorDetectionInterval) {
      console.log('⚠️ Error detection already running');
      return;
    }

    console.log('🔄 Starting error detection (every 5s)');
    errorDetectionInterval = setInterval(() => {
      const errors = window.n8nReader.detectErrors();
      if (errors.length > 0 && window.sendMessageToSidebar) {
        window.sendMessageToSidebar({
          type: 'error-detected',
          errors: errors
        });
      }
    }, 5000);
  }

  function stopErrorDetection() {
    if (errorDetectionInterval) {
      console.log('🛑 Stopping error detection');
      clearInterval(errorDetectionInterval);
      errorDetectionInterval = null;
    }
  }

  // 페이지 언로드 시 정리
  window.addEventListener('beforeunload', () => {
    console.log('🧹 Cleaning up: page unload');
    stopErrorDetection();
  });

  // 사이드바 닫힐 때 정리
  window.addEventListener('message', (event) => {
    if (event.data.type === 'sidebar-closed') {
      console.log('🧹 Cleaning up: sidebar closed');
      stopErrorDetection();
    } else if (event.data.type === 'sidebar-opened') {
      console.log('▶️ Sidebar opened: starting error detection');
      startErrorDetection();
    }
  });

  // 초기 시작
  startErrorDetection();

  console.log('✅ N8N AI Copilot initialized successfully!');
}


// ========================================
// 9. 페이지 로드 시 실행 (개선된 감지)
// ========================================

// 즉시 첫 시도
console.log('📦 N8N AI Copilot Content Script loaded');
console.log('🔍 Starting N8N page detection...');

// 방법 1: 즉시 실행
detectN8NPage();

// 방법 2: 짧은 지연 후 재시도 (SPA 로딩 대기)
setTimeout(() => {
  console.log('🔄 Retrying page detection after 500ms...');
  detectN8NPage();
}, 500);

// 방법 3: 조금 더 긴 지연 후 재시도
setTimeout(() => {
  console.log('🔄 Retrying page detection after 1500ms...');
  detectN8NPage();
}, 1500);

// 방법 4: MutationObserver로 DOM 변화 감지
const observer = new MutationObserver((mutations) => {
  // N8N 특유의 요소가 추가되었는지 확인
  const hasN8NElements =
    document.querySelector('[class*="canvas"]') ||
    document.querySelector('[class*="NodeView"]') ||
    document.querySelector('[class*="workflow"]') ||
    document.querySelector('#app');

  if (hasN8NElements) {
    console.log('🎯 N8N elements detected by MutationObserver!');
    detectN8NPage();
    observer.disconnect(); // 감지 후 observer 중지
  }
});

// body가 존재하면 observer 시작
if (document.body) {
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
  console.log('👀 MutationObserver started');
} else {
  console.log('⚠️ document.body not ready for MutationObserver');
}


// ========================================
// 10. iframe과의 메시지 통신
// ========================================

// 분석 취소를 위한 전역 변수
let currentAnalysisTask = null;
window.currentAnalysisTask = null; // N8NReader에서 접근 가능하도록

class AnalysisTask {
  constructor(type) {
    this.type = type;
    this.cancelled = false;
    this.startTime = Date.now();
  }

  cancel() {
    console.log(`🛑 Cancelling ${this.type} analysis`);
    this.cancelled = true;
  }

  isCancelled() {
    return this.cancelled;
  }

  getElapsedTime() {
    return Date.now() - this.startTime;
  }
}

window.AnalysisTask = AnalysisTask; // N8NReader에서 사용 가능하도록

// iframe으로부터 메시지 수신
window.addEventListener('message', async (event) => {
  console.log('📨 Message received in content.js:', event.data);

  if (event.data.type === 'send-message') {
    const userMessage = event.data.message;
    const errorContext = event.data.errorContext; // 에러 분석 컨텍스트
    const workflowContext = event.data.workflowContext; // 워크플로우 분석 컨텍스트
    console.log('💬 User message:', userMessage);

    try {
      // N8N 페이지 컨텍스트 수집
      const context = collectPageContext();

      // 에러 분석 컨텍스트가 있으면 추가
      if (errorContext) {
        context.errorAnalysis = errorContext;
        console.log('📄 Error context included:', errorContext);
      }

      // 워크플로우 분석 컨텍스트가 있으면 추가
      if (workflowContext) {
        context.workflowAnalysis = workflowContext;
        console.log('📄 Workflow context included:', workflowContext);
      }

      console.log('📄 Page context collected:', context);

      // Claude API 호출 (background.js를 통해)
      const response = await callClaudeAPI(userMessage, context);
      console.log('✅ Claude API response received');

      // iframe으로 응답 전송
      sendMessageToIframe({
        type: 'assistant-response',
        message: response
      });

    } catch (error) {
      console.error('❌ Error processing message:', error);
      sendMessageToIframe({
        type: 'error',
        message: '메시지 처리 중 오류가 발생했습니다: ' + error.message
      });
    }
  }

  if (event.data.type === 'analyze-page') {
    console.log('🔍 Page analysis requested');

    try {
      const pageAnalysis = analyzeN8NPage();
      console.log('📊 Page analysis complete:', pageAnalysis);

      sendMessageToIframe({
        type: 'page-analysis-result',
        data: pageAnalysis
      });
    } catch (error) {
      console.error('❌ Error analyzing page:', error);
      sendMessageToIframe({
        type: 'error',
        message: '페이지 분석 중 오류가 발생했습니다: ' + error.message
      });
    }
  }

  if (event.data.type === 'analyze-error') {
    console.log('⚠️ Error analysis requested');

    try {
      // async 함수이므로 await 사용
      (async () => {
        const errorAnalysis = await analyzeErrorsWithCode();
        console.log('📊 Error analysis complete:', errorAnalysis);

        sendMessageToIframe({
          type: 'error-analysis-result',
          data: errorAnalysis
        });
      })();
    } catch (error) {
      console.error('❌ Error analyzing errors:', error);
      sendMessageToIframe({
        type: 'error',
        message: '에러 분석 중 오류가 발생했습니다: ' + error.message
      });
    }
  }

  if (event.data.type === 'analyze-workflow') {
    console.log('🔬 Workflow analysis requested');

    try {
      // 비동기로 워크플로우 분석 실행
      (async () => {
        // 새 분석 태스크 생성
        currentAnalysisTask = new AnalysisTask('workflow');
        window.currentAnalysisTask = currentAnalysisTask; // N8NReader에서 접근 가능하도록
        console.log('🔄 Starting workflow analysis...');

        // 모든 노드의 실행 데이터 수집 (진행률 콜백 포함)
        const nodesData = await window.n8nReader.getAllNodesExecutionData((progress) => {
          // 취소되었는지 확인
          if (currentAnalysisTask && currentAnalysisTask.isCancelled()) {
            return;
          }

          // 진행률을 iframe으로 전송
          sendMessageToIframe({
            type: 'workflow-analysis-progress',
            progress: progress
          });
        });

        // 취소되었으면 중단
        if (currentAnalysisTask && currentAnalysisTask.isCancelled()) {
          console.log('🛑 Workflow analysis cancelled');
          sendMessageToIframe({
            type: 'workflow-analysis-cancelled',
            message: '워크플로우 분석이 취소되었습니다.'
          });
          currentAnalysisTask = null;
          window.currentAnalysisTask = null;
          return;
        }

        console.log('📊 Nodes data collected:', nodesData);

        // ========================================
        // 고급 분석 시스템 실행
        // ========================================

        // 1. 기본 데이터 흐름 분석
        const flowAnalysis = window.n8nReader.analyzeWorkflowDataFlow(nodesData);
        console.log('📊 Flow analysis complete:', flowAnalysis);

        // 2. 자동 문제 감지 (사용자 설명 없이도 일반적인 패턴 자동 감지)
        const automaticIssues = window.n8nReader.detectAutomaticIssues(nodesData);
        console.log('🔍 Automatic issues detected:', automaticIssues);

        // 3. 문제 노드 역추적 분석
        let chainAnalysis = null;
        if (automaticIssues.length > 0) {
          // 가장 심각한 문제가 있는 노드부터 역추적
          const mostCriticalIssue = automaticIssues[0];
          chainAnalysis = window.n8nReader.analyzeNodeChain(nodesData, mostCriticalIssue.nodeIndex);
          console.log('🔙 Chain analysis complete:', chainAnalysis);
        }

        // 4. AI 분석을 위한 전체 컨텍스트 구축
        const aiContext = window.n8nReader.buildAIContext(nodesData);
        console.log('🤖 AI context built:', aiContext);

        // ========================================
        // Phase 3: 자동 패턴 감지 및 적용
        // ========================================

        if (automaticIssues.length > 0) {
          console.log('🔍 Detected issues, checking for fix patterns...');

          try {
            // 가장 심각한 이슈부터 패턴 매칭 시도
            const criticalIssue = automaticIssues[0];
            const issueNode = nodesData.nodes[criticalIssue.nodeIndex];

            // 패턴 감지 컨텍스트 구축
            const patternContext = {
              error: criticalIssue.description,
              currentNode: {
                type: issueNode.type,
                name: issueNode.name
              },
              code: criticalIssue.codeSnippet || '',
              executionData: {
                input: issueNode.inputData,
                output: issueNode.outputData
              }
            };

            // 로컬 패턴 감지 (0 tokens)
            const detectedPatterns = detectRelevantPatterns(patternContext);
            console.log('🎯 Pattern detection result:', detectedPatterns);

            if (detectedPatterns.length > 0) {
              const bestMatch = detectedPatterns[0];
              const confidence = bestMatch.confidence;

              console.log(`✨ Best pattern match: ${bestMatch.patternId} (confidence: ${confidence})`);

              // 사용자 설정 신뢰도 임계값 가져오기
              const thresholds = await getConfidenceThresholds();

              // 높은 신뢰도: 자동 적용 시도
              if (confidence >= thresholds.auto && bestMatch.pattern.autoApplicable) {
                console.log(`🚀 High confidence (${confidence}% >= ${thresholds.auto}%) - attempting auto-fix...`);

                // 에러가 있는 노드 자동으로 열기
                const errorNodeElement = findNodeElementByName(issueNode.name);
                if (!errorNodeElement) {
                  console.error('❌ Failed to find error node element:', issueNode.name);
                  throw new Error(`노드를 찾을 수 없습니다: ${issueNode.name}`);
                }

                errorNodeElement.click();
                await sleep(1000); // 패널이 열릴 때까지 대기

                // 설정 패널이 열렸는지 확인
                const settingsPanel = safeSelector.find('settingsPanel', document, true);
                if (!settingsPanel) {
                  console.error('❌ Settings panel not opened after clicking node');
                  throw new Error('설정 패널을 열 수 없습니다');
                }

                console.log('✅ Settings panel opened successfully');

                // 패턴 자동 적용
                const applyResult = await applyFixPattern(bestMatch.patternId, {
                  autoApply: true,
                  nodeName: issueNode.name
                });

                if (applyResult.success) {
                  // 성공 - 사용자에게 알림
                  sendMessageToIframe({
                    type: 'workflow-auto-fixed',
                    data: {
                      patternId: bestMatch.patternId,
                      nodeName: issueNode.name,
                      confidence: confidence,
                      result: applyResult
                    }
                  });

                  currentAnalysisTask = null;
                  window.currentAnalysisTask = null;
                  return;

                } else {
                  // 자동 적용 실패 - UI 표시로 폴백
                  console.warn('⚠️ Auto-fix failed, falling back to UI suggestion');
                  sendMessageToIframe({
                    type: 'workflow-pattern-detected',
                    data: {
                      patternId: bestMatch.patternId,
                      pattern: bestMatch.pattern,
                      confidence: confidence,
                      nodeName: issueNode.name,
                      issueDescription: criticalIssue.description,
                      automaticIssues: automaticIssues,
                      autoFixFailed: true,
                      failureReason: applyResult.message || '알 수 없는 오류'
                    }
                  });

                  currentAnalysisTask = null;
                  window.currentAnalysisTask = null;
                  return;
                }
              }

              // 중간 신뢰도: 패턴 UI 표시
              if (confidence >= thresholds.suggest) {
                console.log(`💡 Medium confidence (${confidence}% >= ${thresholds.suggest}%) - showing pattern UI...`);

                sendMessageToIframe({
                  type: 'workflow-pattern-detected',
                  data: {
                    patternId: bestMatch.patternId,
                    pattern: bestMatch.pattern,
                    confidence: confidence,
                    nodeName: issueNode.name,
                    issueDescription: criticalIssue.description,
                    automaticIssues: automaticIssues
                  }
                });

                currentAnalysisTask = null;
                window.currentAnalysisTask = null;
                return;
              }
            }

            // 패턴 감지 실패 또는 낮은 신뢰도 - Gemini에게 물어보기
            console.log('🤖 No high-confidence pattern found - asking Gemini...');

          } catch (error) {
            console.error('❌ Error in Phase 3 pattern detection:', error);

            // 에러 발생 시 사용자에게 알림
            sendMessageToIframe({
              type: 'workflow-pattern-error',
              data: {
                error: error.message,
                automaticIssues: automaticIssues
              }
            });

            // 에러 발생 시에도 Gemini로 폴백
            console.log('⚠️ Falling back to Gemini analysis due to error');
          }
        }

        // ========================================
        // 사용자 메시지 생성 (기존 방식)
        // ========================================
        let userMessage = '';

        if (automaticIssues.length > 0) {
          userMessage += `🔍 워크플로우 분석 완료: ${automaticIssues.length}개 문제 발견\n\n`;

          // 자동 감지된 문제들 표시 (상위 5개만)
          const topIssues = automaticIssues.slice(0, 5);
          topIssues.forEach((issue, idx) => {
            const priorityEmoji = {
              critical: '🔴',
              high: '🟠',
              medium: '🟡',
              low: '⚪'
            }[issue.priority] || '⚪';

            userMessage += `${priorityEmoji} **${issue.nodeName}** (${issue.type})\n`;
            userMessage += `   ${issue.description}\n`;
            if (issue.cause && issue.cause !== '알 수 없음') {
              userMessage += `   원인: ${issue.cause}\n`;
            }
            if (issue.codeSnippet) {
              userMessage += `   코드: \`${issue.codeSnippet.substring(0, 60)}...\`\n`;
            }
            userMessage += `   💡 ${issue.suggestion}\n\n`;
          });

          if (automaticIssues.length > 5) {
            userMessage += `... 그 외 ${automaticIssues.length - 5}개 문제 더 있음\n\n`;
          }

          // 역추적 분석 결과
          if (chainAnalysis && chainAnalysis.length > 1) {
            userMessage += `\n🔙 **근본 원인 추적**\n`;
            userMessage += `문제 노드: ${chainAnalysis[0].nodeName}\n`;

            // 역추적 체인에서 critical 이슈를 가진 노드 찾기
            const rootCauseNode = chainAnalysis.find(node =>
              node.issues.some(issue => issue.severity === 'critical')
            );

            if (rootCauseNode && rootCauseNode.nodeIndex !== chainAnalysis[0].nodeIndex) {
              userMessage += `진짜 원인 노드: ${rootCauseNode.nodeName}\n`;
              const criticalIssue = rootCauseNode.issues.find(i => i.severity === 'critical');
              if (criticalIssue) {
                userMessage += `   → ${criticalIssue.description}\n`;
                if (criticalIssue.codeSnippet) {
                  userMessage += `   → 코드: \`${criticalIssue.codeSnippet}\`\n`;
                }
              }
            }
          }

        } else if (flowAnalysis.nodesWithDataLoss.length > 0 || flowAnalysis.dataFlowIssues.length > 0) {
          // 자동 감지는 안됐지만 기본 분석에서 문제 발견
          userMessage += '워크플로우 분석 완료\n\n';

          if (flowAnalysis.nodesWithDataLoss.length > 0) {
            userMessage += `⚠️ 데이터 손실 발견: ${flowAnalysis.nodesWithDataLoss.length}개 노드\n`;
            flowAnalysis.nodesWithDataLoss.forEach(node => {
              userMessage += `- ${node.nodeName}: ${node.issue}\n`;
            });
          }

          if (flowAnalysis.dataFlowIssues.length > 0) {
            userMessage += `\n⚠️ 데이터 흐름 문제: ${flowAnalysis.dataFlowIssues.length}개\n`;
            flowAnalysis.dataFlowIssues.forEach(issue => {
              userMessage += `- ${issue.from} → ${issue.to}: ${issue.issue}\n`;
            });
          }
        } else {
          userMessage = '✅ 워크플로우 분석 완료: 문제 없음';
        }

        // iframe으로 결과 전송 (Gemini API 호출 포함)
        sendMessageToIframe({
          type: 'workflow-analysis-result',
          data: {
            userMessage: userMessage,
            nodesData: nodesData,
            flowAnalysis: flowAnalysis,
            automaticIssues: automaticIssues,
            chainAnalysis: chainAnalysis,
            aiContext: aiContext
          }
        });

        // 태스크 완료
        currentAnalysisTask = null;
        window.currentAnalysisTask = null;
      })();

    } catch (error) {
      console.error('❌ Error analyzing workflow:', error);
      sendMessageToIframe({
        type: 'error',
        message: '워크플로우 분석 중 오류가 발생했습니다: ' + error.message
      });
      currentAnalysisTask = null;
      window.currentAnalysisTask = null;
    }
  }

  // 분석 취소 요청
  if (event.data.type === 'cancel-analysis') {
    console.log('🛑 Cancel analysis requested');

    if (currentAnalysisTask) {
      currentAnalysisTask.cancel();
      sendMessageToIframe({
        type: 'analysis-cancelled',
        message: '분석이 취소되었습니다.'
      });
    } else {
      console.warn('⚠️ No analysis running to cancel');
    }
  }
});

// iframe으로 메시지 전송
function sendMessageToIframe(data) {
  const iframe = document.querySelector('#n8n-ai-copilot-sidebar iframe');
  if (iframe && iframe.contentWindow) {
    console.log('📤 Sending message to iframe:', data);
    iframe.contentWindow.postMessage(data, '*');
  } else {
    console.error('❌ Iframe not found');
  }
}

// 페이지 컨텍스트 수집 (설정 포함)
function collectPageContext() {
  const errors = window.n8nReader.detectErrors();
  const settings = window.n8nReader.getNodeSettings();
  const workflowNodes = window.n8nReader.getAllNodes();

  const context = {
    url: window.location.href,
    workflowName: document.title,
    errors: errors,
    selectedNode: null,
    nodeSettings: settings,
    errorPattern: null,
    workflowNodes: workflowNodes // 워크플로우의 모든 노드
  };

  // 선택된 노드 정보 수집 (가능한 경우) - SafeSelector 사용
  try {
    const selectedNodeElement = safeSelector.find('selectedNode');
    if (selectedNodeElement) {
      context.selectedNode = {
        type: selectedNodeElement.getAttribute('data-node-type') || 'unknown',
        name: selectedNodeElement.textContent || 'unknown'
      };
    }
  } catch (e) {
    console.log('⚠️ Could not collect selected node info:', e);
  }

  // 에러 패턴 분석 (매우 중요!)
  if (errors.length > 0) {
    context.errorPattern = analyzeErrorPattern(errors);
  }

  return context;
}

// 에러 패턴 분석 (설정 문제 감지)
function analyzeErrorPattern(errors) {
  const pattern = {
    totalErrors: errors.length,
    uniqueErrors: new Set(errors.map(e => e.message)).size,
    repeatedError: null,
    likelySettingIssue: false,
    suggestion: null
  };

  // 동일한 에러가 여러 번 반복되는지 확인
  if (pattern.uniqueErrors === 1 && pattern.totalErrors > 1) {
    pattern.repeatedError = errors[0].message;
    pattern.likelySettingIssue = true;
    pattern.suggestion = '동일한 에러가 ' + pattern.totalErrors + '번 반복됩니다. 노드 설정(특히 "Run once for all items" vs "Run once for each item" 토글)을 확인하세요.';
  }

  // 에러 개수가 특정 패턴과 일치하는지
  if (pattern.totalErrors > 10 && pattern.uniqueErrors < 5) {
    pattern.likelySettingIssue = true;
    pattern.suggestion = '많은 에러가 발생했지만 종류는 적습니다. 설정 문제일 가능성이 높습니다.';
  }

  return pattern;
}

// 워크플로우의 노드들에 대한 operations 정보 찾기
function getWorkflowNodeOperations(workflowNodes, docsInfo) {
  if (!workflowNodes || !workflowNodes.types || !docsInfo || !docsInfo.detailedNodes) {
    return [];
  }

  const nodeOperations = [];

  // 워크플로우에 있는 각 노드 타입에 대해
  for (const nodeType of workflowNodes.types) {
    // docs에서 매칭되는 노드 찾기
    const matchedNode = docsInfo.detailedNodes.find(docNode => {
      const docName = (docNode.displayName || docNode.name || '').toLowerCase();
      const workflowType = nodeType.toLowerCase();

      // 정확히 일치하거나 포함하는 경우
      return docName === workflowType ||
             docName.includes(workflowType) ||
             workflowType.includes(docName);
    });

    if (matchedNode) {
      nodeOperations.push(matchedNode);
    }
  }

  return nodeOperations;
}

// Claude API 호출 (background.js를 통해)
async function callClaudeAPI(userMessage, context) {
  console.log('🚀 Calling Claude API via background...');

  // N8N 문서 불러오기
  const n8nDocs = await chrome.storage.local.get('n8nDocs');
  const docsInfo = n8nDocs.n8nDocs;

  // 워크플로우의 실제 노드들에 대한 operations 찾기
  const workflowNodeOps = getWorkflowNodeOperations(context.workflowNodes, docsInfo);

  let nodeContext = '';
  if (workflowNodeOps.length > 0) {
    nodeContext = '\n\n**🔍 현재 워크플로우의 노드 정보**:\n';
    workflowNodeOps.forEach(node => {
      nodeContext += `\n**${node.displayName || node.name}**:\n`;
      if (node.description) {
        nodeContext += `- 설명: ${node.description}\n`;
      }
      if (node.operations && node.operations.length > 0) {
        nodeContext += `- 사용 가능한 Operations: ${node.operations.join(', ')}\n`;
      }
    });
    console.log(`📚 Workflow nodes with operations: ${workflowNodeOps.length}/${context.workflowNodes.types.length}`);
  }

  const systemPrompt = `${context.errorAnalysis ? `
🚨 에러 진단 형식 🚨

**에러**: [원인을 1-2줄로 간단 명료하게]

**해결**:
1. [구체적인 수정 단계 1]
2. [구체적인 수정 단계 2]
3. [필요시 추가 단계]

예시:
**에러**: Bearer Auth 값이 비어있어 인증 실패

**해결**:
1. 카카오톡 노드 → Generic Auth → Bearer Auth 항목 클릭
2. "Bearer [액세스토큰]" 형식으로 입력 (예: Bearer xxxxxx)
3. 또는 OAuth2로 되돌리고 Client ID/Secret 입력

원인은 간단히, 해결은 구체적으로!
` : `당신은 N8N 워크플로우 자동화 전문가입니다.`}

${context.errorAnalysis ? '' : `
**N8N 최신 정보 (2025년 10월)**:
- **N8N 버전**: v1.60+ (2025년 10월 최신 릴리스)
- **주요 노드**:
  * HTTP Request (REST API 호출)
  * Webhook (외부 이벤트 수신)
  * Code (JavaScript/Python 실행)
  * IF/Switch (조건 분기)
  * Set/Edit Fields (데이터 변환)
  * Loop Over Items (반복 처리)
  * Split/Merge (데이터 분할/병합)
  * AI Agent (LLM 통합 에이전트)

- **최신 AI 통합**:
  * OpenAI GPT-4o, GPT-4 Turbo, o1-preview
  * Anthropic Claude 3.7 Sonnet (2025년 최신)
  * Google Gemini 2.5 Flash, Gemini 2.0 Flash (Gemini 1.x는 2025년 9월 종료)
  * Mistral AI Large 2, Cohere Command R+

- **주요 서비스 연동**:
  * 데이터베이스: Supabase, PostgreSQL, MongoDB, MySQL
  * 협업 도구: Notion, Airtable, Google Sheets, Slack
  * CRM: HubSpot, Salesforce, Pipedrive
  * 이메일: Gmail, Outlook, SendGrid

- **한국 서비스 지원**:
  * 카카오톡 (Kakao Talk Business API)
  * 네이버 (Naver Cloud, CLOVA API)
  * 쿠팡 (Coupang Partners API)
  * 배달의민족 (Baemin API - 제한적)
  * 토스페이먼츠 (Toss Payments API)

- **OAuth2 지원**: Google, Facebook, Kakao, Naver, GitHub, Microsoft
`}
${nodeContext}
**현재 페이지 컨텍스트**:
- URL: ${context.url}
- 워크플로우: ${context.workflowName}
- 에러 개수: ${context.errors.length}개
${context.selectedNode ? `- 선택된 노드: ${context.selectedNode.name} (${context.selectedNode.type})` : ''}

${context.nodeSettings && (context.nodeSettings.toggles.length > 0 || context.nodeSettings.options.length > 0) ? `
**🎛️ 노드 설정 (현재 상태)**:
${context.nodeSettings.toggles.length > 0 ? `
토글/스위치:
${context.nodeSettings.toggles.map(t => `- ${t.name}: ${t.checked ? 'ON ✅' : 'OFF ❌'}`).join('\n')}
` : ''}
${context.nodeSettings.options.length > 0 ? `
옵션:
${context.nodeSettings.options.map(o => `- ${o.name}: ${o.selectedText || o.value}`).join('\n')}
` : ''}
` : ''}

${context.errorPattern && context.errorPattern.likelySettingIssue ? `
**🚨 에러 패턴 분석 결과**:
- 총 에러: ${context.errorPattern.totalErrors}개
- 고유 에러: ${context.errorPattern.uniqueErrors}개
- 설정 문제 가능성: 높음 ⚠️
- 제안: ${context.errorPattern.suggestion}
` : ''}

${context.workflowAnalysis ? `
**🔬 워크플로우 분석 결과 (고급)**:
- 총 노드 수: ${context.workflowAnalysis.flowAnalysis.totalNodes}개
${context.workflowAnalysis.automaticIssues && context.workflowAnalysis.automaticIssues.length > 0 ? `

🔍 **자동 감지된 문제들** (사용자 설명 없이도 감지):
${context.workflowAnalysis.automaticIssues.slice(0, 3).map(issue => `
  ${issue.priority === 'critical' ? '🔴' : issue.priority === 'high' ? '🟠' : '🟡'} **${issue.nodeName}** - ${issue.type}
  - 설명: ${issue.description}
  ${issue.cause ? `- 원인: ${issue.cause}` : ''}
  ${issue.codeSnippet ? `- 코드: \`${issue.codeSnippet.substring(0, 80)}\`` : ''}
  - 💡 제안: ${issue.suggestion}
`).join('\n')}
${context.workflowAnalysis.automaticIssues.length > 3 ? `  ... 그 외 ${context.workflowAnalysis.automaticIssues.length - 3}개 문제 더 있음\n` : ''}
` : ''}
${context.workflowAnalysis.chainAnalysis && context.workflowAnalysis.chainAnalysis.length > 0 ? `

🔙 **근본 원인 역추적 분석**:
문제 노드: ${context.workflowAnalysis.chainAnalysis[0].nodeName}
${(() => {
  const rootCause = context.workflowAnalysis.chainAnalysis.find(node =>
    node.issues && node.issues.some(issue => issue.severity === 'critical')
  );
  if (rootCause && rootCause.nodeIndex !== context.workflowAnalysis.chainAnalysis[0].nodeIndex) {
    const criticalIssue = rootCause.issues.find(i => i.severity === 'critical');
    return `진짜 원인 노드: ${rootCause.nodeName}
  - ${criticalIssue.description}
  ${criticalIssue.codeSnippet ? `- 코드: \`${criticalIssue.codeSnippet}\`` : ''}`;
  }
  return '원인 추적 결과: 현재 노드가 근본 원인';
})()}

체인 상세:
${context.workflowAnalysis.chainAnalysis.slice(0, 3).map((node, idx) => `
  ${idx === 0 ? '🎯' : '⬅️'} ${node.nodeName} (${node.role === 'problem_node' ? '문제 노드' : '이전 노드'})
  ${node.executionData ? `  Input: ${node.executionData.inputItems}개 → Output: ${node.executionData.outputItems}개` : ''}
  ${node.issues && node.issues.length > 0 ? `  ⚠️ 이슈: ${node.issues.map(i => i.description).join(', ')}` : '  ✅ 이상 없음'}
`).join('')}
` : ''}
${context.workflowAnalysis.aiContext ? `

🤖 **AI 컨텍스트 요약**:
- 에러가 있는 노드: ${context.workflowAnalysis.aiContext.summary.nodesWithErrors}개
- 데이터 손실 노드: ${context.workflowAnalysis.aiContext.summary.nodesWithDataLoss}개
- 감지된 이슈: ${context.workflowAnalysis.aiContext.detectedIssues.length}개

데이터 흐름:
${context.workflowAnalysis.aiContext.dataFlow.slice(0, 5).map(flow =>
  `  ${flow.from.name}(${flow.from.output}개) → ${flow.to.name}(${flow.to.input}개) ${flow.status === 'mismatch' ? `⚠️ ${flow.itemsLost}개 손실` : '✅'}`
).join('\n')}
${context.workflowAnalysis.aiContext.dataFlow.length > 5 ? `  ... 그 외 ${context.workflowAnalysis.aiContext.dataFlow.length - 5}개 노드` : ''}

노드별 상세:
${context.workflowAnalysis.aiContext.nodes.slice(0, 3).map(node => `
  📦 ${node.name} (${node.type})
  ${node.input ? `  - Input: ${node.input.itemCount}개 아이템` : ''}
  ${node.output ? `  - Output: ${node.output.itemCount}개 아이템` : ''}
  ${node.code ? `  - 코드 있음 (${node.code.split('\\n').length}줄)` : ''}
  ${node.error ? `  - ❌ 에러: ${node.error}` : ''}
  ${node.hasDataLoss ? `  - ⚠️ 데이터 손실 발생` : ''}
`).join('')}
` : ''}
${context.workflowAnalysis.flowAnalysis.nodesWithDataLoss.length > 0 ? `
- ⚠️ 데이터 손실 노드 (기본 분석):
${context.workflowAnalysis.flowAnalysis.nodesWithDataLoss.map(node => `  * ${node.nodeName}: ${node.issue}`).join('\n')}
` : ''}
${context.workflowAnalysis.flowAnalysis.dataFlowIssues.length > 0 ? `
- ⚠️ 데이터 흐름 문제:
${context.workflowAnalysis.flowAnalysis.dataFlowIssues.map(issue => `  * ${issue.from} → ${issue.to}: ${issue.issue}`).join('\n')}
` : ''}
${context.workflowAnalysis.flowAnalysis.recommendations.length > 0 ? `
- 💡 추천 사항:
${context.workflowAnalysis.flowAnalysis.recommendations.map(rec => `  * [${rec.priority}] ${rec.nodeName}: ${rec.message} - ${rec.suggestion}`).join('\n')}
` : ''}

**🎯 사용자 의도 vs 실제 결과 분석**:
위의 자동 감지 결과를 바탕으로:
1. 사용자가 원했던 결과는 무엇인가? (예: 카톡 3개 전송)
2. 실제 결과는 무엇인가? (예: 1개만 전송됨)
3. 차이가 발생한 정확한 원인은?
4. 어느 노드에서 문제가 시작되었는가?

이 질문들에 답하면서 근본 원인을 찾아주세요.
` : ''}

${context.errorAnalysis ? `
**에러 메시지**: ${context.errorAnalysis.errors.map((err) => `${err.message}`).join(', ')}
${context.errorAnalysis.errors.some(e => e.autoFix) ? `
**자동 진단**: ${context.errorAnalysis.errors.find(e => e.autoFix).autoFix}
→ 이 진단을 바탕으로 구체적인 수정 단계를 제시해주세요.` : ''}

위 형식(에러 + 해결 단계)으로 답변해주세요!
` : context.errors.length > 0 ? `
**⚠️ 감지된 에러 상세 정보**:
${context.errors.slice(0, 3).map((err, idx) => `
에러 ${idx + 1}:
- 타입: ${err.type}
- 메시지: ${err.message}
${err.details ? `- 노드 이름: ${err.details.nodeName || '알 수 없음'}
- 줄 번호: ${err.details.lineNumber || '알 수 없음'}
${err.details.stackTrace ? `- 스택 트레이스:\n  ${err.details.stackTrace.join('\n  ')}` : ''}` : ''}
`).join('\n')}
${context.errors.length > 3 ? `\n... 외 ${context.errors.length - 3}개 에러` : ''}
` : ''}

${context.errorAnalysis ? '' : `
**에러 진단 우선순위**:
1. 노드 설정 ("Run once for all items" vs "each item")
2. 에러 패턴 (반복되면 설정 문제)
3. 코드 검토
`}

**최신 정보 우선 원칙**:
⚠️ 당신이 가진 지식(2025년 1월)이 오래되었을 수 있습니다.
- N8N은 매일 업데이트되므로, 불확실한 경우 "최신 N8N 문서를 확인하세요" 안내
- 노드 이름, API 변경사항은 공식 문서 링크 제공: https://docs.n8n.io
- 새로운 노드나 기능은 "2025년 10월 기준 최신 버전에서 확인 필요" 명시

**자동 입력 기능** (매우 중요):
🤖 사용자가 "자동으로 입력해줘" 또는 "노드 설정 채워줘"라고 요청하면:
1. JSON 형식으로 노드 파라미터 생성
2. 반드시 다음 형식으로 응답:
   \`\`\`json-autofill
   {
     "url": "https://api.example.com",
     "method": "GET",
     "authentication": "none"
   }
   \`\`\`
3. \`\`\`json-autofill 코드 블록을 사용하면 자동으로 N8N 노드에 입력됩니다!

${context.errorAnalysis ? '' : `
**답변 전략 (매우 중요)**:
🎯 **기본 원칙: 토큰 절약 + N8N 전문성**

1. **처음 질문**: 간단한 단계 개요만 (3-5줄)
   - ⚠️ **매우 중요**: 각 단계는 **반드시 줄바꿈**해서 작성!
   - 각 단계만 번호로 나열 (버튼 등 HTML 코드 작성 금지!)
   - ✅ **올바른 예시** (각 단계마다 줄바꿈):
     \`\`\`
     뉴스 수집 워크플로우:

     1. \`Schedule Trigger\` - 자동 실행
     2. \`RSS Feed Read\` - 뉴스 수집
     3. \`Code\` - 데이터 변환
     4. \`OpenAI\` - 요약
     5. \`Slack\` - 전송

     💡 특정 단계를 자세히 알고 싶으면 번호를 말씀해주세요.
     \`\`\`
   - ❌ **잘못된 예시** (한 줄로 붙여쓰기 - 절대 금지):
     \`\`\`
     1. \`Schedule Trigger\` - 자동 실행 2. \`RSS Feed Read\` - 뉴스 수집
     \`\`\`
   - ❌ **절대 금지**: HTML \`<button>\` 태그 직접 작성
   - ✅ **필수 규칙**:
     * 제목 다음에 빈 줄 1개
     * 각 단계는 새로운 줄에 작성
     * 마지막 안내문구 앞에 빈 줄 1개

2. **상세 요청 감지**: 사용자가 다음과 같이 물으면 상세 설명
   - "자세히 알려줘", "상세하게", "코드 예시", "설정 방법"
   - "1번 알려줘", "RSS 설정 방법" 등 특정 단계 질문

3. **N8N 전문가 모드**:
   - ❌ 일반적인 AI 답변 금지 (예: "물론이죠, 도와드리겠습니다")
   - ✅ N8N 워크플로우 노드와 설정만 언급
   - ✅ 구체적인 노드 이름 사용 (\`HTTP Request\`, \`Code\`, \`IF\`)

4. **답변 길이 제어**:
   - 첫 답변: 최대 100자 이내 (단계 나열만)
   - 상세 요청: 해당 단계만 설명 (전체 X)
   - 코드 예시: 최소한의 작동 코드만

**답변 형식**:
- 단계는 번호 리스트로
- 노드 이름은 \`백틱\`으로
- 코드는 \`\`\`json 또는 \`\`\`javascript
- 불필요한 인사말, 장황한 설명 제거

**금지 사항**:
- ❌ "안녕하세요", "도와드리겠습니다" 같은 인사
- ❌ N8N과 무관한 일반 지식
- ❌ 처음부터 모든 설정 상세 설명
- ❌ 긴 서론이나 배경 설명

짧고 명확하게, N8N 워크플로우만 답변하세요.
`}${context.errorAnalysis ? `

🚨 다시: 반드시 2줄만! 🚨` : ''}`;
  // background.js로 메시지 전송
  return new Promise((resolve, reject) => {
    try {
      chrome.runtime.sendMessage(
        {
          action: 'callClaude',
          message: userMessage,
          systemPrompt: systemPrompt,
          context: context
        },
        (response) => {
          if (chrome.runtime.lastError) {
            console.error('❌ Runtime error:', chrome.runtime.lastError);

            // Extension context invalidated 에러 처리
            if (chrome.runtime.lastError.message.includes('Extension context invalidated')) {
              console.log('🔄 Extension이 업데이트되었습니다. 3초 후 페이지를 자동 새로고침합니다...');

              // iframe에 새로고침 알림 먼저 전송
              sendMessageToIframe({
                type: 'error',
                message: '확장 프로그램이 업데이트되었습니다.\n\n🔄 3초 후 페이지가 자동으로 새로고침됩니다...'
              });

              // 3초 후 자동 새로고침
              setTimeout(() => {
                window.location.reload();
              }, 3000);

              reject(new Error('확장 프로그램이 업데이트되었습니다. 페이지를 새로고침합니다.'));
            } else {
              reject(new Error(chrome.runtime.lastError.message));
            }
            return;
          }

          if (!response) {
            console.error('❌ No response from background');
            reject(new Error('Background script에서 응답이 없습니다. 페이지를 새로고침해주세요.'));
            return;
          }

          if (response.error) {
            console.error('❌ API error:', response.message);
            reject(new Error(response.message));
            return;
          }

          console.log('✅ Claude API response received');
          resolve(response.content);
        }
      );
    } catch (error) {
      console.error('❌ Exception in callClaudeAPI:', error);
      reject(new Error('확장 프로그램 연결 오류가 발생했습니다. 페이지를 새로고침해주세요.'));
    }
  });
}

console.log('✅ Message listener initialized');


// ========================================
// 7. 노드 자동 입력 기능
// ========================================

// N8N 노드 패널 감지
function detectNodePanel() {
  // N8N의 노드 설정 패널 선택자 (여러 버전 대응)
  const selectors = [
    '[data-test-id="node-parameters"]',
    '[data-test-id="parameter-input"]',
    '.node-settings',
    '[class*="NodeSettings"]',
    '[class*="ParameterInput"]',
    '.ndv-panel'
  ];

  for (const selector of selectors) {
    const panel = document.querySelector(selector);
    if (panel) {
      console.log('✅ Node panel detected:', selector);
      return panel;
    }
  }

  console.warn('⚠️ Node panel not found');
  return null;
}

// 입력 필드 찾기 및 분석
function findInputFields(container) {
  const inputs = [];

  // 모든 입력 요소 찾기
  const inputElements = container.querySelectorAll(
    'input[type="text"], input[type="number"], input[type="email"], input[type="url"], ' +
    'textarea, select, [contenteditable="true"], [data-test-id*="parameter"]'
  );

  inputElements.forEach(element => {
    // 라벨 찾기 (여러 방법 시도)
    let label = '';

    // 1. 가장 가까운 라벨 요소
    const labelElement = element.closest('[class*="parameter"]')?.querySelector('label');
    if (labelElement) {
      label = labelElement.textContent.trim();
    }

    // 2. data-test-id에서 추출
    if (!label) {
      const testId = element.getAttribute('data-test-id');
      if (testId) {
        label = testId.replace('parameter-input-', '').replace(/-/g, ' ');
      }
    }

    // 3. placeholder 사용
    if (!label && element.placeholder) {
      label = element.placeholder;
    }

    // 파라미터 이름
    const paramName = element.getAttribute('data-name') ||
                     element.getAttribute('name') ||
                     element.id ||
                     label.toLowerCase().replace(/\s+/g, '_');

    inputs.push({
      element: element,
      label: label,
      name: paramName,
      type: element.tagName.toLowerCase(),
      inputType: element.type || 'text',
      value: element.value || element.textContent,
      isVisible: element.offsetParent !== null
    });
  });

  // 보이는 필드만 필터링
  const visibleInputs = inputs.filter(input => input.isVisible);

  console.log(`📋 Found ${visibleInputs.length} visible input fields (${inputs.length} total)`);
  return visibleInputs;
}

// AI로부터 받은 JSON을 필드에 자동 입력
function autoFillNodeFields(jsonData) {
  console.log('🤖 Auto-filling node fields with data:', jsonData);

  const panel = detectNodePanel();
  if (!panel) {
    return { success: false, message: '노드 설정 패널을 찾을 수 없습니다.' };
  }

  const fields = findInputFields(panel);
  if (fields.length === 0) {
    return { success: false, message: '입력 필드를 찾을 수 없습니다.' };
  }

  let filledCount = 0;
  const results = [];

  // JSON 데이터를 각 필드에 매핑
  Object.keys(jsonData).forEach(key => {
    const value = jsonData[key];

    // 키와 매칭되는 필드 찾기 (대소문자 무시, 부분 일치)
    const field = fields.find(f => {
      const keyLower = key.toLowerCase().replace(/[_\s-]/g, '');
      const nameLower = (f.name || '').toLowerCase().replace(/[_\s-]/g, '');
      const labelLower = (f.label || '').toLowerCase().replace(/[_\s-]/g, '');

      return nameLower.includes(keyLower) ||
             labelLower.includes(keyLower) ||
             keyLower.includes(nameLower) ||
             keyLower.includes(labelLower);
    });

    if (field) {
      try {
        const valueStr = typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value);

        // 값 입력
        if (field.element.tagName === 'INPUT' || field.element.tagName === 'TEXTAREA') {
          // 기존 값 저장
          const oldValue = field.element.value;

          // 새 값 설정
          field.element.value = valueStr;

          // React/Vue의 상태 업데이트를 위한 이벤트 트리거
          field.element.dispatchEvent(new Event('input', { bubbles: true, cancelable: true }));
          field.element.dispatchEvent(new Event('change', { bubbles: true, cancelable: true }));
          field.element.dispatchEvent(new Event('blur', { bubbles: true }));

          // Vue용 이벤트
          field.element.__vue__?.emit?.('input', valueStr);

          filledCount++;
          results.push({ field: field.label || field.name, value: valueStr, status: 'success' });
          console.log(`✅ Filled: ${field.label || field.name} = ${valueStr}`);

        } else if (field.element.tagName === 'SELECT') {
          // 드롭다운 선택
          const option = Array.from(field.element.options).find(opt =>
            opt.value === value || opt.text === value
          );

          if (option) {
            field.element.value = option.value;
            field.element.dispatchEvent(new Event('change', { bubbles: true }));
            filledCount++;
            results.push({ field: field.label || field.name, value: value, status: 'success' });
            console.log(`✅ Selected: ${field.label || field.name} = ${value}`);
          }

        } else if (field.element.contentEditable === 'true') {
          // ContentEditable 요소
          field.element.textContent = valueStr;
          field.element.dispatchEvent(new Event('input', { bubbles: true }));
          filledCount++;
          results.push({ field: field.label || field.name, value: valueStr, status: 'success' });
          console.log(`✅ Filled (contentEditable): ${field.label || field.name} = ${valueStr}`);
        }

      } catch (error) {
        console.error(`❌ Failed to fill ${key}:`, error);
        results.push({ field: key, value: value, status: 'error', error: error.message });
      }
    } else {
      console.warn(`⚠️ No matching field found for: ${key}`);
      results.push({ field: key, value: value, status: 'not_found' });
    }
  });

  const message = `${filledCount}개 필드가 자동으로 입력되었습니다.`;
  console.log(`✅ Auto-fill complete: ${message}`);

  return {
    success: filledCount > 0,
    filledCount: filledCount,
    totalFields: fields.length,
    message: message,
    results: results
  };
}

// 메시지 리스너: iframe에서 자동 입력 요청 받기
window.addEventListener('message', async (event) => {
  if (event.data.type === 'auto-fill-node') {
    console.log('📥 Auto-fill request received from iframe');

    const result = autoFillNodeFields(event.data.data);

    // 결과를 iframe에 전송
    sendMessageToIframe({
      type: 'auto-fill-result',
      ...result
    });
  }

  // 패턴 자동 적용 요청
  if (event.data.type === 'apply-pattern') {
    console.log('🔧 Pattern apply request received from iframe:', event.data.patternId);

    const { patternId, autoApply } = event.data;

    // applyFixPattern 함수 호출
    const result = await applyFixPattern(patternId, {
      autoApply: autoApply
    });

    // 결과를 iframe에 전송
    sendMessageToIframe({
      type: 'pattern-apply-result',
      ...result
    });
  }

  // 실시간 가이드 시작 요청
  if (event.data.type === 'start-realtime-guide') {
    console.log('🚀 Real-time guide start request received:', event.data.patternId);

    const { patternId } = event.data;
    const pattern = getPattern(patternId);

    if (!pattern) {
      console.error('❌ Pattern not found:', patternId);
      return;
    }

    // RealTimeGuide 시작
    window.realTimeGuide.start(pattern, {
      onStepCompleted: (stepIndex, step) => {
        console.log(`✅ Step ${stepIndex} completed:`, step.description);

        // iframe에 단계 완료 알림
        sendMessageToIframe({
          type: 'realtime-guide-step-completed',
          patternId: patternId,
          stepIndex: stepIndex
        });
      },

      onAllCompleted: () => {
        console.log('🎉 All steps completed!');

        // iframe에 전체 완료 알림
        sendMessageToIframe({
          type: 'realtime-guide-all-completed',
          patternId: patternId
        });
      }
    });
  }

  // 수동 단계 완료 요청
  if (event.data.type === 'manual-step-complete') {
    console.log('✓ Manual step complete request:', event.data);

    const { patternId, stepIndex } = event.data;

    // RealTimeGuide에 수동 완료 알림
    if (window.realTimeGuide.isActive) {
      window.realTimeGuide.forceNextStep();
    }
  }
});


// ========================================
// 8. 에러 분석 with 코드 읽기
// ========================================

// 노드 이름으로 DOM 요소 찾기 (중복 노드 지원)
function findNodeElementByName(nodeName, options = {}) {
  const { index = 0, exactMatch = false } = options;

  console.log(`🔍 Finding node element: "${nodeName}" (index: ${index}, exactMatch: ${exactMatch})`);

  const allNodes = safeSelector.findAll('nodes');
  const matches = [];

  // 모든 노드를 순회하며 일치하는 것 찾기
  for (const node of allNodes) {
    const nodeText = (node.textContent || '').trim();
    const dataName = (node.getAttribute('data-name') || '').trim();
    const title = (node.getAttribute('title') || '').trim();

    // 정확히 일치하는지 또는 포함하는지 체크
    let isMatch = false;

    if (exactMatch) {
      // 완전 일치 (중복 노드 이름 구분)
      isMatch = nodeText === nodeName || dataName === nodeName || title === nodeName;
    } else {
      // 부분 일치
      isMatch = nodeText.includes(nodeName) || dataName.includes(nodeName) || title.includes(nodeName);
    }

    if (isMatch) {
      matches.push({
        element: node,
        text: nodeText,
        dataName: dataName,
        title: title
      });
    }
  }

  // 결과 확인
  if (matches.length === 0) {
    console.warn(`⚠️ No node found with name: "${nodeName}"`);
    return null;
  }

  if (matches.length > 1) {
    console.warn(`⚠️ Found ${matches.length} nodes with name "${nodeName}". Using index ${index}`);
    matches.forEach((match, idx) => {
      console.log(`  [${idx}] ${match.text || match.dataName || match.title}`);
    });
  }

  // 지정된 인덱스의 노드 반환
  const selectedMatch = matches[index] || matches[0];
  console.log(`✅ Selected node [${index}]: ${selectedMatch.text || selectedMatch.dataName}`);

  return selectedMatch.element;
}

// 모든 일치하는 노드 찾기 (디버깅용)
function findAllNodeElementsByName(nodeName) {
  const allNodes = document.querySelectorAll('[class*="CanvasNode"], [data-node-type]');
  const matches = [];

  for (const node of allNodes) {
    const nodeText = (node.textContent || '').trim();
    if (nodeText.includes(nodeName)) {
      matches.push({
        element: node,
        text: nodeText
      });
    }
  }

  return matches;
}

// 패널이 열릴 때까지 대기
async function waitForPanel(maxWaitMs = 2000) {
  const startTime = Date.now();

  while (Date.now() - startTime < maxWaitMs) {
    const panel = safeSelector.find('settingsPanel');

    if (panel) {
      console.log('✅ Panel opened');
      return panel;
    }

    // 100ms 대기
    await sleep(100);
  }

  console.warn('⚠️ Panel wait timeout');
  return null;
}

async function analyzeErrorsWithCode() {
  console.log('⚠️ Analyzing errors with code...');

  const errors = window.n8nReader.detectErrors();

  if (errors.length === 0) {
    return {
      errorCount: 0,
      errors: [],
      hasCode: false,
      message: '현재 감지된 에러가 없습니다.'
    };
  }

  const errorDetails = [];
  let codeFound = false;

  // 에러를 순회하며 분석
  for (let index = 0; index < errors.length; index++) {
    const error = errors[index];
    const errorDetail = {
      index: index + 1,
      type: error.type,
      message: error.message,
      nodeName: error.details?.nodeName || 'Unknown',
      lineNumber: error.details?.lineNumber || null,
      code: null,
      autoFix: null // 자동 진단
    };

    // 1. 에러 메시지에서 직접적인 힌트 찾기
    const msgLower = error.message.toLowerCase();
    const nodeNameLower = errorDetail.nodeName.toLowerCase();

    // Run Once for All Items 패턴
    if (msgLower.includes('run once for all items') ||
        msgLower.includes('.all()') ||
        msgLower.includes("can't use .all") ||
        msgLower.includes('only available in')) {
      errorDetail.autoFix = '"Run Once for All Items" 모드로 변경';
    }

    // 인증 관련 에러 패턴 + API별 올바른 인증 방식 제안
    if (msgLower.includes('authentication') ||
        msgLower.includes('credentials') ||
        msgLower.includes('unauthorized') ||
        msgLower.includes('401') ||
        msgLower.includes('자격 증명')) {

      // 카카오톡 API - OAuth2 사용
      if (nodeNameLower.includes('카카오') || nodeNameLower.includes('kakao')) {
        errorDetail.autoFix = 'OAuth2 인증 설정 (카카오톡은 OAuth2 사용)\n' +
          '1. Authentication 토글 ON\n' +
          '2. Auth Type: OAuth2\n' +
          '3. Client ID: 카카오 REST API 키 입력\n' +
          '4. Authorization URL: https://kauth.kakao.com/oauth/authorize\n' +
          '5. Access Token URL: https://kauth.kakao.com/oauth/token';
      }
      // 네이버 API - OAuth2 사용
      else if (nodeNameLower.includes('네이버') || nodeNameLower.includes('naver')) {
        errorDetail.autoFix = 'OAuth2 인증 설정 (네이버는 OAuth2 사용)\n' +
          '1. Authentication 토글 ON\n' +
          '2. Auth Type: OAuth2\n' +
          '3. Client ID: 네이버 Application Client ID\n' +
          '4. Client Secret: 네이버 Application Client Secret';
      }
      // Google API - OAuth2 사용
      else if (nodeNameLower.includes('구글') || nodeNameLower.includes('google')) {
        errorDetail.autoFix = 'OAuth2 인증 설정 (구글은 OAuth2 사용)\n' +
          '1. Authentication 토글 ON\n' +
          '2. Auth Type: OAuth2\n' +
          '3. Google Cloud Console에서 OAuth2 Client ID/Secret 발급\n' +
          '4. N8N에서 Google OAuth2 Credential 생성';
      }
      // 일반 HTTP Request - 인증 활성화 필요
      else if (nodeNameLower.includes('http') || nodeNameLower.includes('request')) {
        errorDetail.autoFix = '인증 설정 활성화 필요\n' +
          '1. Authentication 토글 ON\n' +
          '2. Auth Type 선택 (API 문서 확인)\n' +
          '3. OAuth2 (권장) 또는 Bearer Auth 또는 Basic Auth';
      }
      // 기타
      else {
        errorDetail.autoFix = '인증 설정 확인 필요\n' +
          '1. Authentication 토글이 ON인지 확인\n' +
          '2. API 공식 문서에서 올바른 인증 방식 확인\n' +
          '3. 자격 증명(Credential) 올바르게 입력했는지 확인';
      }
    }

    // 2. Code 노드인 경우 코드 읽기 시도
    const isCodeError = error.type === 'ReferenceError' ||
                        error.type === 'SyntaxError' ||
                        error.type === 'TypeError' ||
                        error.message.toLowerCase().includes('code') ||
                        error.message.toLowerCase().includes('javascript');

    if (isCodeError && errorDetail.nodeName !== 'Unknown') {
      console.log(`🔍 Attempting to read code for error ${index + 1} (${errorDetail.nodeName})`);

      // 노드 찾기
      const nodeElement = findNodeElementByName(errorDetail.nodeName);

      if (nodeElement) {
        try {
          // 노드 클릭
          console.log('🖱️ Clicking node:', errorDetail.nodeName);
          nodeElement.click();

          // 패널이 열릴 때까지 대기
          await waitForPanel(2000);

          // 코드 읽기 시도
          const code = window.n8nReader.getCodeFromNode(errorDetail.nodeName);

          if (code) {
            errorDetail.code = code;
            codeFound = true;
            console.log(`✅ Code found for error ${index + 1}`, code.substring(0, 100));

            // 3. 코드 패턴 분석 (자동 진단이 없을 때만)
            if (!errorDetail.autoFix) {
              if (code.includes('items.map') || code.includes('items.filter') ||
                  code.includes('items.forEach') || code.includes('.all()') ||
                  code.includes('$input.all()')) {
                errorDetail.autoFix = '"Run Once for All Items" 모드로 변경 (코드가 items 배열 전체 처리)';
              }
            }
          }

          // 패널 닫기 (ESC)
          document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
          await sleep(200);

        } catch (err) {
          console.error(`❌ Error processing node ${errorDetail.nodeName}:`, err);
        }
      } else {
        console.warn(`⚠️ Could not find node element for: ${errorDetail.nodeName}`);
      }
    }

    errorDetails.push(errorDetail);
  }

  return {
    errorCount: errors.length,
    errors: errorDetails,
    hasCode: codeFound,
    message: `${errors.length}개의 에러 발견${codeFound ? ' (코드 포함)' : ''}`
  };
}

// ========================================
// 9. N8N 페이지 상세 분석
// ========================================
function analyzeN8NPage() {
  console.log('🔍 Analyzing N8N page...');

  // 1. 기본 정보
  const basicInfo = {
    url: window.location.href,
    title: document.title,
    timestamp: new Date().toISOString()
  };

  // 2. N8N 주요 요소 감지
  const n8nElements = {
    canvas: !!document.querySelector('[class*="canvas"]'),
    canvasSelector: findElement('[class*="canvas"]'),

    nodeView: !!document.querySelector('[class*="NodeView"]'),
    nodeViewSelector: findElement('[class*="NodeView"]'),

    workflow: !!document.querySelector('[class*="workflow"]'),
    workflowSelector: findElement('[class*="workflow"]'),

    settings: !!document.querySelector('[class*="settings"]'),
    settingsSelector: findElement('[class*="settings"]'),

    node: !!document.querySelector('[class*="node"]'),
    nodeSelector: findElement('[class*="node"]'),

    selected: !!document.querySelector('[class*="selected"]'),
    selectedSelector: findElement('[class*="selected"]')
  };

  // 3. 모든 고유 클래스명 수집 (처음 100개)
  const allClasses = new Set();
  document.querySelectorAll('[class]').forEach(el => {
    // classList를 사용하여 SVG 요소 호환성 확보
    if (el.classList && el.classList.length > 0) {
      el.classList.forEach(cls => {
        if (cls.trim()) allClasses.add(cls.trim());
      });
    }
  });
  const classList = Array.from(allClasses).slice(0, 100);

  // 4. data-* 속성 수집
  const dataAttributes = new Set();
  document.querySelectorAll('[data-test-id]').forEach(el => {
    const testId = el.getAttribute('data-test-id');
    if (testId) dataAttributes.add(`data-test-id="${testId}"`);
  });
  const dataAttrList = Array.from(dataAttributes).slice(0, 50);

  // 5. 입력 필드 감지
  const inputs = document.querySelectorAll('input, textarea, select');
  const inputInfo = {
    totalInputs: inputs.length,
    visibleInputs: Array.from(inputs).filter(el => el.offsetParent !== null).length,
    inputTypes: [...new Set(Array.from(inputs).map(el => el.type || el.tagName.toLowerCase()))]
  };

  // 6. 에러 감지
  const errors = window.n8nReader ? window.n8nReader.detectErrors() : [];

  return {
    basicInfo,
    n8nElements,
    classList,
    dataAttributes: dataAttrList,
    inputInfo,
    errors: {
      count: errors.length,
      messages: errors.map(e => e.message).slice(0, 5)
    },
    summary: {
      isN8NPage: n8nElements.canvas || n8nElements.workflow,
      hasActiveNode: n8nElements.selected,
      hasOpenSettings: n8nElements.settings,
      hasErrors: errors.length > 0
    }
  };
}

// 요소를 찾고 선택자 정보 반환
function findElement(selector) {
  const el = document.querySelector(selector);
  if (!el) return null;

  // className이 SVGAnimatedString일 수 있으므로 안전하게 변환
  let classNameStr = '';
  if (el.classList && el.classList.length > 0) {
    classNameStr = Array.from(el.classList).join(' ');
  } else if (typeof el.className === 'string') {
    classNameStr = el.className;
  }

  return {
    tagName: el.tagName.toLowerCase(),
    className: classNameStr,
    id: el.id,
    dataAttrs: Array.from(el.attributes)
      .filter(attr => attr.name.startsWith('data-'))
      .map(attr => `${attr.name}="${attr.value}"`)
  };
}
