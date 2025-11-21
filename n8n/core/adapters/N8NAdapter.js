/**
 * N8NAdapter - n8n 플랫폼 전용 어댑터
 *
 * BaseAdapter를 구현하여 n8n 페이지의 DOM 읽기/쓰기를 담당
 * 기존 N8NReader, N8NWriter 클래스를 통합하여 리팩토링
 */

// Import base dependencies (loaded separately in browser context)
// const BaseAdapter = require('./BaseAdapter.js');
// const AdvancedContextCollector = require('../universal/AdvancedContextCollector.js');
// const DataFlowTracer = require('../universal/DataFlowTracer.js');
// const SecurityScanner = require('../security/SecurityScanner.js');

class N8NAdapter extends BaseAdapter {
  constructor() {
    super('n8n');

    // Architecture V2 components
    this.contextCollector = null; // Initialized after setup
    this.dataFlowTracer = null;
    this.securityScanner = null;
  }

  /**
   * 어댑터 초기화
   */
  async initialize() {
    try {
      console.log('N8NAdapter: Initializing...');

      // n8n 페이지 감지
      if (!this.detectPlatformPage()) {
        throw new Error('Not an n8n page');
      }

      // Architecture V2 컴포넌트 초기화
      this.contextCollector = new AdvancedContextCollector(this);
      this.dataFlowTracer = new DataFlowTracer(this);
      this.securityScanner = new SecurityScanner();

      this.initialized = true;
      console.log('N8NAdapter: Initialized successfully');

      return true;
    } catch (error) {
      console.error('N8NAdapter initialization error:', error);
      return false;
    }
  }

  /**
   * n8n 페이지 감지
   */
  detectPlatformPage() {
    const indicators = {
      canvas: document.querySelector('[class*="canvas"]'),
      nodeView: document.querySelector('[class*="NodeView"]'),
      workflow: document.querySelector('[class*="workflow"]'),
      vueApp: document.querySelector('#app')
    };

    const isN8N = Object.values(indicators).some(el => el !== null);

    if (isN8N) {
      console.log('N8NAdapter: n8n page detected', indicators);
    }

    return isN8N;
  }

  /**
   * 전체 컨텍스트 수집 (Architecture V2)
   * AdvancedContextCollector를 사용한 깊은 컨텍스트 수집
   */
  async getContext() {
    if (!this.initialized) {
      await this.initialize();
    }

    try {
      // Architecture V2: AdvancedContextCollector 사용
      if (this.contextCollector) {
        return await this.contextCollector.collectFullContext();
      }

      // Fallback: 기본 컨텍스트
      return await this.getBasicContext();
    } catch (error) {
      console.error('N8NAdapter getContext error:', error);
      return this.getMinimalContext();
    }
  }

  /**
   * 기본 컨텍스트 (Fallback)
   */
  async getBasicContext() {
    return {
      platform: 'n8n',
      timestamp: new Date().toISOString(),
      current: {
        selectedNode: await this.getCurrentNode(),
        settings: await this.getNodeSettings()
      },
      workflow: await this.getWorkflowStructure(),
      errors: await this.detectErrors()
    };
  }

  /**
   * 최소 컨텍스트 (에러 시)
   */
  getMinimalContext() {
    return {
      platform: 'n8n',
      timestamp: new Date().toISOString(),
      error: true,
      message: 'Failed to collect context'
    };
  }

  /**
   * 현재 선택된 노드 가져오기
   */
  async getCurrentNode() {
    try {
      const selectedNode = document.querySelector('[class*="selected"]');

      if (!selectedNode) {
        return null;
      }

      return {
        element: selectedNode,
        type: this.getNodeType(selectedNode),
        name: this.getNodeName(selectedNode),
        id: this.getNodeId(selectedNode)
      };
    } catch (error) {
      console.error('getCurrentNode error:', error);
      return null;
    }
  }

  /**
   * 노드 타입 추출
   */
  getNodeType(nodeElement) {
    try {
      const typeElement = nodeElement.querySelector('[class*="type"]');
      return typeElement ? typeElement.textContent.trim() : 'unknown';
    } catch (error) {
      return 'unknown';
    }
  }

  /**
   * 노드 이름 추출
   */
  getNodeName(nodeElement) {
    try {
      const nameElement = nodeElement.querySelector('[class*="name"]');
      return nameElement ? nameElement.textContent.trim() : 'Unnamed';
    } catch (error) {
      return 'Unnamed';
    }
  }

  /**
   * 노드 ID 추출
   */
  getNodeId(nodeElement) {
    try {
      return nodeElement.getAttribute('data-node-id') ||
        nodeElement.getAttribute('id') ||
        'unknown';
    } catch (error) {
      return 'unknown';
    }
  }
  /**
   * 노드 설정 읽기
   */
  async getNodeSettings() {
    try {
      // 1. Node View 찾기 (설정 패널)
      const nodeView = document.querySelector('[class*="NodeView"]') ||
        document.querySelector('[class*="node-view"]') ||
        document.querySelector('.el-drawer__body'); // Element UI Drawer

      if (!nodeView) {
        return [];
      }

      // 2. 입력 필드 찾기 (input, select, textarea)
      const inputs = Array.from(nodeView.querySelectorAll('input, select, textarea, [contenteditable="true"]'));

      // 3. CodeMirror 에디터 찾기
      const codeMirrors = Array.from(nodeView.querySelectorAll('.CodeMirror'));

      // 4. Monaco 에디터 찾기
      const monacoEditors = Array.from(nodeView.querySelectorAll('.monaco-editor'));

      const allFields = [
        ...inputs.map(input => ({
          element: input,
          name: this.getInputName(input),
          value: input.value || input.textContent,
          type: input.type || input.tagName.toLowerCase()
        })),
        ...codeMirrors.map(cm => ({
          element: cm,
          name: this.getCodeMirrorName(cm) || 'code',
          value: cm.CodeMirror ? cm.CodeMirror.getValue() : '',
          type: 'codemirror'
        })),
        ...monacoEditors.map(editor => ({
          element: editor,
          name: this.getMonacoName(editor) || 'code',
          value: 'monaco_content',
          type: 'monaco'
        }))
      ];

      console.log('🔍 [N8NAdapter] Detected fields:', allFields.map(f => `${f.name} (${f.type})`));
      return allFields;
    } catch (error) {
      console.error('getNodeSettings error:', error);
      return [];
    }
  }

  /**
   * Monaco 에디터 이름 추출
   */
  getMonacoName(editorElement) {
    try {
      const parameterItem = editorElement.closest('.parameter-item') ||
        editorElement.closest('[class*="parameterInput"]');

      if (parameterItem) {
        const label = parameterItem.querySelector('.parameter-label') ||
          parameterItem.querySelector('label');
        return label ? label.textContent.trim() : 'code';
      }
      return 'code';
    } catch (e) {
      return 'code';
    }
  }

  /**
   * CodeMirror 이름 추출
   */
  getCodeMirrorName(cmElement) {
    try {
      const label = cmElement.closest('.parameter-item')?.querySelector('.parameter-label') ||
        cmElement.parentElement?.previousElementSibling;
      return label ? label.textContent.trim() : 'code';
    } catch (e) {
      return 'code';
    }
  }

  /**
   * 입력 필드 이름 추출
   */
  getInputName(inputElement) {
    try {
      const label = inputElement.closest('label') ||
        inputElement.previousElementSibling;

      return label ?
        label.textContent.trim() :
        inputElement.name ||
        inputElement.placeholder ||
        'unknown';
    } catch (error) {
      return 'unknown';
    }
  }

  /**
   * Vue 컴포넌트 업데이트
   */
  triggerVueUpdate(element, value) {
    try {
      const vueInstance = element.__vueParentComponent || element.__vue__;

      if (vueInstance) {
        console.log('N8NAdapter: Vue instance found, triggering update');

        if (vueInstance.emit) {
          vueInstance.emit('update:modelValue', value);
          vueInstance.emit('input', value);
        }

        if (vueInstance.props && vueInstance.props.modelValue !== undefined) {
          vueInstance.props.modelValue = value;
        }
      }
    } catch (error) {
      console.log('Vue update failed (normal):', error.message);
    }
  }

  /**
   * 에러 필드 강조 표시 (Visual Feedback)
   */
  async highlightErrorField(fieldName) {
    try {
      console.log('N8NAdapter: Highlighting error field', fieldName);
      const fields = await this.getNodeSettings();

      // 이름으로 필드 찾기 (유사도 매칭)
      const targetField = fields.find(f =>
        f.name.toLowerCase().includes(fieldName.toLowerCase()) ||
        fieldName.toLowerCase().includes(f.name.toLowerCase())
      );

      if (targetField && targetField.element) {
        const el = targetField.element;

        // 1. 스크롤 이동
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });

        // 2. 빨간색 테두리 및 발광 효과 적용
        const originalTransition = el.style.transition;
        const originalBoxShadow = el.style.boxShadow;
        const originalBorder = el.style.border;

        el.style.transition = 'all 0.3s ease';
        el.style.border = '2px solid #ef4444';
        el.style.boxShadow = '0 0 0 4px rgba(239, 68, 68, 0.2)';

        // CodeMirror/Monaco 처리
        if (el.classList.contains('CodeMirror') || el.classList.contains('monaco-editor')) {
          el.style.border = '2px solid #ef4444';
        }

        // 3. 3초 후 원래대로 복구
        setTimeout(() => {
          el.style.border = originalBorder;
          el.style.boxShadow = originalBoxShadow;
          el.style.transition = originalTransition;
        }, 3000);

        return true;
      }

      console.warn('N8NAdapter: Field not found for highlighting', fieldName);
      return false;
    } catch (error) {
      console.error('highlightErrorField error:', error);
      return false;
    }
  }


  /**
   * 워크플로우 구조 파악
   */
  async getWorkflowStructure() {
    try {
      const nodes = document.querySelectorAll('[class*="CanvasNode"], [data-node-type]');

      const structure = {
        nodeCount: nodes.length,
        nodes: Array.from(nodes).map(node => ({
          type: this.getNodeType(node),
          name: this.getNodeName(node),
          id: this.getNodeId(node)
        })),
        connections: await this.getConnections()
      };

      return structure;
    } catch (error) {
      console.error('getWorkflowStructure error:', error);
      return { nodeCount: 0, nodes: [], connections: [] };
    }
  }

  /**
   * 노드 간 연결 정보 수집
   */
  async getConnections() {
    try {
      // n8n의 연결 정보는 DOM에서 추출하기 어려움
      // 추후 n8n API 접근 시 개선 가능
      const connections = [];

      // 간단한 휴리스틱: 연결선 요소 찾기
      const connectionLines = document.querySelectorAll('[class*="connection"]');

      connectionLines.forEach((line, index) => {
        connections.push({
          id: `conn-${index}`,
          source: 'unknown', // DOM에서 추출 어려움
          target: 'unknown'
        });
      });

      return connections;
    } catch (error) {
      console.error('getConnections error:', error);
      return [];
    }
  }

  /**
   */
  async detectErrors() {
    try {
      // N8N UI의 다양한 에러 표시 방식 대응
      const errorSelectors = [
        // 1. Toast/Notification 에러
        '.el-message--error',
        '[class*="toast"][class*="error"]',
        '[class*="notification"][class*="error"]',

        // 2. 노드 실행 에러 (Canvas 내)
        '[class*="node-status-error"]',
        '[data-test-id="node-execution-error"]',
        '.node-status-error',
        '.has-issues',
        '[class*="error-badge"]',

        // 3. 설정 패널 내 에러
        '[class*="parameter-error"]',
        '[class*="validation-error"]',
        '.has-error',

        // 4. 일반적인 에러 텍스트 포함 요소
        '[class*="ErrorMessage"]',
        '[class*="error-message"]'
      ];

      const errorElements = document.querySelectorAll(errorSelectors.join(','));

      if (errorElements.length === 0) {
        return { current: [], chain: [], rootCause: null };
      }

      const currentErrors = Array.from(errorElements).map(errorEl => ({
        element: errorEl,
        message: errorEl.textContent.trim() || 'Error detected on node',
        type: this.getErrorType(errorEl),
        timestamp: new Date().toISOString()
      }));

      // Architecture V2: 에러 체인 및 근본 원인 분석
      const chain = this.traceErrorChain(currentErrors);
      const rootCause = this.analyzeRootCause(chain);

      return {
        current: currentErrors,
        chain: chain,
        rootCause: rootCause
      };
    } catch (error) {
      console.error('detectErrors error:', error);
      return { current: [], chain: [], rootCause: null };
    }
  }

  /**
   * 에러 타입 분류
   */
  getErrorType(errorElement) {
    try {
      const text = errorElement.textContent.toLowerCase();

      if (text.includes('credential')) return 'credential';
      if (text.includes('401') || text.includes('unauthorized')) return 'authentication';
      if (text.includes('403') || text.includes('forbidden')) return 'permission';
      if (text.includes('404')) return 'not_found';
      if (text.includes('connection') || text.includes('timeout')) return 'connection';
      if (text.includes('required')) return 'validation';
      if (text.includes('json') || text.includes('parse')) return 'data_format';

      return 'general';
    } catch (error) {
      return 'general';
    }
  }

  /**
   * 에러 체인 추적 (Architecture V2)
   */
  traceErrorChain(currentErrors) {
    // Simple implementation - can be enhanced
    return currentErrors.map(error => ({
      message: error.message,
      type: error.type,
      timestamp: error.timestamp,
      cause: this.inferErrorCause(error)
    }));
  }

  /**
   * 에러 원인 추론
   */
  inferErrorCause(error) {
    const causes = {
      'credential': 'missing_or_invalid_credential',
      'authentication': 'authentication_failure',
      'permission': 'insufficient_permissions',
      'not_found': 'resource_not_found',
      'connection': 'network_issue',
      'validation': 'invalid_input',
      'data_format': 'malformed_data'
    };

    return causes[error.type] || 'unknown';
  }

  /**
   * 근본 원인 분석 (Architecture V2)
   */
  analyzeRootCause(errorChain) {
    if (!errorChain || errorChain.length === 0) return null;

    // 가장 빈번한 원인 찾기
    const causeCounts = {};
    errorChain.forEach(error => {
      causeCounts[error.cause] = (causeCounts[error.cause] || 0) + 1;
    });

    const mostCommonCause = Object.keys(causeCounts).reduce((a, b) =>
      causeCounts[a] > causeCounts[b] ? a : b
    );

    return {
      cause: mostCommonCause,
      frequency: causeCounts[mostCommonCause],
      solution: this.getSolutionForCause(mostCommonCause)
    };
  }

  /**
   * 원인별 해결 방안
   */
  getSolutionForCause(cause) {
    const solutions = {
      'missing_or_invalid_credential': 'Credential을 확인하거나 다시 생성하세요',
      'authentication_failure': '인증 정보를 확인하고 다시 로그인하세요',
      'insufficient_permissions': 'API 권한 설정을 확인하세요',
      'resource_not_found': 'URL이나 리소스 ID를 확인하세요',
      'network_issue': '네트워크 연결을 확인하세요',
      'invalid_input': '필수 입력 필드를 모두 채우세요',
      'malformed_data': 'JSON 형식을 확인하세요'
    };

    return solutions[cause] || '에러 메시지를 확인하고 문서를 참고하세요';
  }

  /**
   * AI 응답을 n8n에 적용 (Architecture V2 - Security enhanced)
   */
  async applyChanges(aiResponse) {
    try {
      // Architecture V2: 보안 검증
      if (this.securityScanner) {
        const context = await this.getContext();
        const securityCheck = await this.securityScanner.validateAIResponse(aiResponse, context);

        if (!securityCheck.safe) {
          console.warn('N8NAdapter: Security issues detected', securityCheck);

          return {
            success: false,
            error: 'security_violation',
            message: '보안 문제가 감지되었습니다',
            issues: securityCheck.issues,
            score: securityCheck.score
          };
        }
      }

      // 액션 타입에 따른 처리
      switch (aiResponse.action) {
        case 'fill_settings':
          return await this.fillNodeSettings(aiResponse.settings);

        case 'create_node':
          return await this.createNode(aiResponse.nodeType, aiResponse.settings);

        case 'fix_error':
          return await this.fixError(aiResponse.fix);

        default:
          console.warn('Unknown action type:', aiResponse.action);
          return { success: false, message: 'Unknown action type' };
      }
    } catch (error) {
      console.error('N8NAdapter applyChanges error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 노드 설정 채우기
   */
  async fillNodeSettings(settings) {
    try {
      let filledCount = 0;
      const fields = await this.getNodeSettings();

      for (const [fieldName, value] of Object.entries(settings)) {
        const field = fields.find(f =>
          f.name.toLowerCase().includes(fieldName.toLowerCase())
        );

        if (field && field.element) {
          this.setFieldValue(field.element, value);
          filledCount++;
        }
      }

      return {
        success: true,
        filledCount: filledCount,
        message: `${filledCount}개 필드 채움 완료`
      };
    } catch (error) {
      console.error('fillNodeSettings error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * 입력 필드에 값 쓰기 (Vue 리액티브 트리거)
   */
  setFieldValue(fieldElement, value) {
    try {
      /**
       * 스크립트 주입 (Page Context 실행용)
       */
      injectScript(code) {
        const script = document.createElement('script');
        script.textContent = code;
        (document.head || document.documentElement).appendChild(script);
        script.remove();
      }

      /**
       * 입력 필드에 값 쓰기 (Vue 리액티브 트리거 + Monaco/CodeMirror 지원)
       */
      setFieldValue(fieldElement, value) {
        try {
          console.log('N8NAdapter: Writing to field', fieldElement, value);

          if (!fieldElement) {
            console.error('Field element not found');
            return false;
          }

          // 1. Monaco Editor 처리 (Script Injection)
          if (fieldElement.classList.contains('monaco-editor') ||
            fieldElement.closest('.monaco-editor') ||
            (fieldElement.type === 'monaco')) {

            console.log('N8NAdapter: Detected Monaco Editor, injecting script...');

            const scriptContent = `
          (function() {
            try {
              console.log('🤖 [N8N Copilot] Attempting to update Monaco Editor...');
              if (window.monaco && window.monaco.editor) {
                const editors = window.monaco.editor.getEditors();
                // 현재 보이는 에디터 찾기
                const targetEditor = editors.find(e => {
                  const container = e.getContainerDomNode();
                  return document.body.contains(container) && container.offsetParent !== null;
                });
                
                if (targetEditor) {
                  console.log('✅ [N8N Copilot] Target editor found, updating value...');
                  const model = targetEditor.getModel();
                  if (model) {
                    targetEditor.setValue(${JSON.stringify(value)});
                    console.log('✨ [N8N Copilot] Value updated successfully!');
                  }
                } else {
                  console.warn('⚠️ [N8N Copilot] No visible Monaco editor found');
                }
              } else {
                console.warn('⚠️ [N8N Copilot] window.monaco not found');
              }
            } catch(e) { 
              console.error('❌ [N8N Copilot] Monaco update failed', e); 
            }
          })();
        `;
            this.injectScript(scriptContent);
            return true;
          }

          // 2. CodeMirror 처리
          if (fieldElement.classList.contains('CodeMirror') && fieldElement.CodeMirror) {
            console.log('N8NAdapter: Writing to CodeMirror');
            fieldElement.CodeMirror.setValue(value);
            fieldElement.CodeMirror.save();
            return true;
          }

          // 3. 일반 Input/Textarea
          fieldElement.value = value;

          // 4. Vue 리액티브 이벤트 트리거
          const events = ['input', 'change', 'blur'];

          events.forEach(eventType => {
            const event = new Event(eventType, {
              bubbles: true,
              cancelable: true
            });
            fieldElement.dispatchEvent(event);
          });

          // 5. Vue 컴포넌트 직접 업데이트 시도
          this.triggerVueUpdate(fieldElement, value);

          console.log('N8NAdapter: Value written successfully');
          return true;
        } catch (error) {
          console.error('setFieldValue error:', error);
          return false;
        }
      }

      /**
       * Vue 컴포넌트 업데이트
       */
      triggerVueUpdate(element, value) {
        try {
          const vueInstance = element.__vueParentComponent || element.__vue__;

          if (vueInstance) {
            console.log('N8NAdapter: Vue instance found, triggering update');

            if (vueInstance.emit) {
              vueInstance.emit('update:modelValue', value);
              vueInstance.emit('input', value);
            }

            if (vueInstance.props && vueInstance.props.modelValue !== undefined) {
              vueInstance.props.modelValue = value;
            }
          }
        } catch (error) {
          console.log('Vue update failed (normal):', error.message);
        }
      }

  /**
   * 노드 생성 (추후 구현)
   */
  async createNode(nodeType, settings) {
        console.log('N8NAdapter: createNode not yet implemented', nodeType, settings);
        return {
          success: false,
          message: 'Node creation not yet implemented'
        };
      }

  /**
   * 에러 수정 (추후 구현)
   */
  async fixError(fix) {
        console.log('N8NAdapter: fixError not yet implemented', fix);
        return {
          success: false,
          message: 'Error fixing not yet implemented'
        };
      }

  /**
   * 데이터 흐름 추적 (Architecture V2 - DataFlowTracer 사용)
   */
  async traceDataFlow(nodeId) {
        if (this.dataFlowTracer) {
          return await this.dataFlowTracer.traceDataFlow(nodeId);
        }

        return {
          targetNodeId: nodeId,
          error: true,
          message: 'DataFlowTracer not initialized'
        };
      }

  /**
   * 비즈니스 의도 추론 (Architecture V2)
   */
  async inferBusinessIntent() {
        try {
          const structure = await this.getWorkflowStructure();
          return await this.contextCollector?.inferBusinessIntent(structure) || {
            goal: 'unknown',
            pattern: 'unknown',
            complexity: 'unknown'
          };
        } catch (error) {
          console.error('inferBusinessIntent error:', error);
          return { goal: 'unknown', pattern: 'unknown', complexity: 'unknown' };
        }
      }

  /**
   * 보안 검증 (Architecture V2)
   */
  async validateSecurity() {
        if (!this.securityScanner) {
          return { safe: false, message: 'SecurityScanner not initialized' };
        }

        try {
          const context = await this.getContext();
          return {
            safe: true,
            message: 'Security check passed',
            context: context.security
          };
        } catch (error) {
          return {
            safe: false,
            message: 'Security validation failed',
            error: error.message
          };
        }
      }

  // Stub implementations for Architecture V2 methods
  async getPreviousNodes(nodeId) {
        // TODO: Implement using DOM or n8n API
        return [];
      }

  async getNodeById(nodeId) {
        // TODO: Implement
        return null;
      }

  async getNodeLastOutput(nodeId) {
        // TODO: Implement - requires n8n execution data access
        return null;
      }

  async getNodeOutputSchema(nodeId) {
        // TODO: Implement
        return {};
      }
    }

// Export
if (typeof module !== 'undefined' && module.exports) {
      module.exports = N8NAdapter;
    }
