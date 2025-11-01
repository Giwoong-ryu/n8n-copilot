/**
 * AdvancedContextCollector - 깊은 컨텍스트 수집
 *
 * Architecture V2의 핵심 개선:
 * - AI 코딩 도구의 65% 개발자 불만(컨텍스트 부족) 해결
 * - 전체 워크플로우 구조 추적
 * - 데이터 흐름 분석
 * - 비즈니스 의도 추론
 */

class AdvancedContextCollector {
  constructor(adapter) {
    this.adapter = adapter; // Platform-specific adapter (N8NAdapter, MakeAdapter, etc.)
    this.contextHistory = []; // 컨텍스트 히스토리
    this.maxHistorySize = 10;
  }

  /**
   * 전체 컨텍스트 수집 (메인 메서드)
   *
   * @returns {Promise<object>} 전체 컨텍스트
   */
  async collectFullContext() {
    try {
      const context = {
        timestamp: new Date().toISOString(),
        platform: this.adapter.getPlatformName(),

        // 1. 현재 작업 컨텍스트
        current: await this.collectCurrentContext(),

        // 2. 워크플로우 전체 맥락
        workflow: await this.collectWorkflowContext(),

        // 3. 에러 컨텍스트
        errors: await this.collectErrorContext(),

        // 4. 보안 컨텍스트
        security: await this.collectSecurityContext(),

        // 5. 타입 컨텍스트 (NEW - Architecture V2)
        types: await this.collectTypeContext(),

        // 6. 실행 히스토리
        execution: await this.collectExecutionHistory(),

        // 7. 사용자 히스토리
        user: this.getUserHistory()
      };

      // 컨텍스트 히스토리에 추가
      this.addToHistory(context);

      return context;
    } catch (error) {
      console.error('AdvancedContextCollector error:', error);
      return this.getMinimalContext();
    }
  }

  /**
   * 현재 작업 컨텍스트
   */
  async collectCurrentContext() {
    try {
      const selectedNode = await this.adapter.getCurrentNode();
      const settings = await this.adapter.getNodeSettings();

      return {
        selectedNode: selectedNode,
        settings: settings,
        cursorPosition: this.getCursorPosition(),
        activePanel: this.getActivePanel(),
        userAction: this.detectUserAction()
      };
    } catch (error) {
      console.error('Current context collection error:', error);
      return {};
    }
  }

  /**
   * 워크플로우 전체 맥락
   */
  async collectWorkflowContext() {
    try {
      const structure = await this.adapter.getWorkflowStructure();
      const businessIntent = await this.inferBusinessIntent(structure);

      return {
        structure: structure,
        businessIntent: businessIntent, // NEW!
        complexity: this.analyzeComplexity(structure),
        patterns: this.detectPatterns(structure)
      };
    } catch (error) {
      console.error('Workflow context collection error:', error);
      return {};
    }
  }

  /**
   * 에러 컨텍스트 (에러 체인 추적)
   */
  async collectErrorContext() {
    try {
      const currentErrors = await this.adapter.detectErrors();
      const errorChain = this.traceErrorChain(currentErrors);
      const rootCause = this.analyzeRootCause(errorChain);

      return {
        current: currentErrors,
        chain: errorChain, // NEW - Architecture V2
        rootCause: rootCause, // NEW
        frequency: this.getErrorFrequency(currentErrors)
      };
    } catch (error) {
      console.error('Error context collection error:', error);
      return { current: [], chain: [], rootCause: null };
    }
  }

  /**
   * 보안 컨텍스트
   */
  async collectSecurityContext() {
    try {
      return {
        existingCredentials: await this.getExistingCredentials(),
        sensitiveFields: this.detectSensitiveFields(),
        permissions: await this.getCurrentPermissions()
      };
    } catch (error) {
      console.error('Security context collection error:', error);
      return {};
    }
  }

  /**
   * 타입 컨텍스트 (NEW - Architecture V2)
   * 이전 노드의 출력 스키마와 예상 입력 타입 추론
   */
  async collectTypeContext() {
    try {
      const currentNode = await this.adapter.getCurrentNode();
      if (!currentNode) return {};

      const inputSchema = await this.inferInputSchema(currentNode);
      const outputSchema = await this.inferOutputSchema(currentNode);

      return {
        inputSchema: inputSchema,
        outputSchema: outputSchema,
        dataTypes: this.extractDataTypes(inputSchema, outputSchema)
      };
    } catch (error) {
      console.error('Type context collection error:', error);
      return {};
    }
  }

  /**
   * 실행 히스토리
   */
  async collectExecutionHistory() {
    try {
      return {
        lastExecution: await this.getLastExecutionResult(),
        executionCount: await this.getExecutionCount(),
        successRate: await this.calculateSuccessRate()
      };
    } catch (error) {
      console.error('Execution history collection error:', error);
      return {};
    }
  }

  /**
   * 비즈니스 의도 추론 (NEW - Architecture V2)
   * 워크플로우 구조를 분석하여 사용자가 달성하려는 목표를 추론
   *
   * @param {object} structure - 워크플로우 구조
   * @returns {object} 비즈니스 의도
   */
  async inferBusinessIntent(structure) {
    if (!structure || !structure.nodes) {
      return { goal: 'unknown', pattern: 'unknown', complexity: 'unknown' };
    }

    const nodeTypes = structure.nodes.map(n => n.type);
    const nodeCount = nodeTypes.length;

    // 패턴 감지
    let pattern = 'unknown';
    let goal = 'unknown';

    // 1. Webhook → Notification 패턴
    if (nodeTypes.includes('Webhook') &&
        (nodeTypes.includes('Slack') || nodeTypes.includes('Email'))) {
      pattern = 'webhook-to-notification';
      goal = '이벤트 알림 자동화';
    }

    // 2. Schedule → Data Processing 패턴
    else if (nodeTypes.includes('Schedule') &&
             nodeTypes.includes('HTTP Request')) {
      pattern = 'scheduled-data-sync';
      goal = '정기 데이터 동기화';
    }

    // 3. Form → Database 패턴
    else if ((nodeTypes.includes('Google Forms') || nodeTypes.includes('Typeform')) &&
             nodeTypes.includes('Airtable')) {
      pattern = 'form-to-database';
      goal = '폼 응답 수집';
    }

    // 4. API → Transform → Database 패턴
    else if (nodeTypes.includes('HTTP Request') &&
             nodeTypes.includes('Function') &&
             nodeTypes.some(t => t.includes('Database'))) {
      pattern = 'api-etl';
      goal = 'API 데이터 ETL';
    }

    // 복잡도 분석
    let complexity = 'simple';
    if (nodeCount > 10) complexity = 'complex';
    else if (nodeCount > 5) complexity = 'medium';

    return {
      goal: goal,
      pattern: pattern,
      complexity: complexity,
      nodeCount: nodeCount,
      confidence: this.calculateIntentConfidence(pattern, nodeTypes)
    };
  }

  /**
   * 의도 추론 신뢰도 계산
   */
  calculateIntentConfidence(pattern, nodeTypes) {
    if (pattern === 'unknown') return 0.0;

    // 패턴에 맞는 노드가 많을수록 신뢰도 상승
    const patternNodeCount = nodeTypes.filter(type => {
      switch (pattern) {
        case 'webhook-to-notification':
          return ['Webhook', 'Slack', 'Email'].includes(type);
        case 'scheduled-data-sync':
          return ['Schedule', 'HTTP Request'].includes(type);
        case 'form-to-database':
          return ['Google Forms', 'Typeform', 'Airtable'].includes(type);
        default:
          return false;
      }
    }).length;

    return Math.min(1.0, patternNodeCount / 3);
  }

  /**
   * 에러 체인 추적 (NEW - Architecture V2)
   * 에러가 연쇄적으로 발생한 경로 추적
   */
  traceErrorChain(currentErrors) {
    if (!currentErrors) return [];

    // Ensure currentErrors is an array
    const errors = Array.isArray(currentErrors) ? currentErrors : [currentErrors];
    if (errors.length === 0) return [];

    const chain = [];

    errors.forEach(error => {
      chain.push({
        nodeId: error.nodeId || error.element?.id,
        message: error.message,
        timestamp: new Date().toISOString(),
        cause: this.findErrorCause(error)
      });
    });

    return chain;
  }

  /**
   * 에러 원인 찾기
   */
  findErrorCause(error) {
    // null/undefined 체크
    if (!error || !error.message) {
      return 'unknown';
    }

    const message = error.message.toLowerCase();

    // 일반적인 원인 패턴
    if (message.includes('401') || message.includes('unauthorized')) {
      return 'authentication_failure';
    }
    if (message.includes('403') || message.includes('forbidden')) {
      return 'permission_denied';
    }
    if (message.includes('404')) {
      return 'resource_not_found';
    }
    if (message.includes('timeout')) {
      return 'network_timeout';
    }
    if (message.includes('json') || message.includes('parse')) {
      return 'data_format_error';
    }
    if (message.includes('required')) {
      return 'missing_required_field';
    }

    return 'unknown';
  }

  /**
   * 근본 원인 분석 (NEW - Architecture V2)
   */
  analyzeRootCause(errorChain) {
    if (!errorChain || errorChain.length === 0) return null;

    // 가장 빈번한 원인 찾기
    const causes = errorChain.map(e => e.cause);
    const causeFrequency = {};

    causes.forEach(cause => {
      causeFrequency[cause] = (causeFrequency[cause] || 0) + 1;
    });

    const mostFrequentCause = Object.keys(causeFrequency).reduce((a, b) =>
      causeFrequency[a] > causeFrequency[b] ? a : b
    );

    return {
      cause: mostFrequentCause,
      frequency: causeFrequency[mostFrequentCause],
      affectedNodes: errorChain.filter(e => e.cause === mostFrequentCause).map(e => e.nodeId),
      solution: this.getSolutionForCause(mostFrequentCause)
    };
  }

  /**
   * 원인별 해결 방법
   */
  getSolutionForCause(cause) {
    const solutions = {
      'authentication_failure': 'Credential을 확인하거나 새로 인증하세요',
      'permission_denied': 'API 권한 설정을 확인하세요',
      'resource_not_found': 'URL이나 리소스 ID를 확인하세요',
      'network_timeout': '타임아웃 설정을 늘리거나 네트워크를 확인하세요',
      'data_format_error': 'JSON 구조를 확인하세요',
      'missing_required_field': '필수 입력 필드를 채우세요'
    };

    return solutions[cause] || '에러 메시지를 확인하세요';
  }

  /**
   * 입력 스키마 추론 (NEW - Architecture V2)
   * 이전 노드의 출력을 기반으로 현재 노드의 예상 입력 타입 추론
   */
  async inferInputSchema(currentNode) {
    try {
      // 이전 노드 찾기
      const previousNodes = await this.adapter.getPreviousNodes(currentNode.id);
      if (!previousNodes || previousNodes.length === 0) return {};

      // 이전 노드의 출력 스키마 수집
      const schemas = [];
      for (const prevNode of previousNodes) {
        const schema = await this.adapter.getNodeOutputSchema(prevNode.id);
        if (schema) schemas.push(schema);
      }

      // 스키마 병합 (여러 입력이 있는 경우)
      return this.mergeSchemas(schemas);
    } catch (error) {
      console.error('Input schema inference error:', error);
      return {};
    }
  }

  /**
   * 출력 스키마 추론
   */
  async inferOutputSchema(currentNode) {
    try {
      // 노드 타입별 예상 출력 스키마
      const outputSchemas = {
        'HTTP Request': { statusCode: 'number', headers: 'object', body: 'any' },
        'Function': { output: 'any' },
        'Webhook': { body: 'object', headers: 'object', params: 'object' }
      };

      return outputSchemas[currentNode.type] || {};
    } catch (error) {
      console.error('Output schema inference error:', error);
      return {};
    }
  }

  /**
   * 스키마 병합
   */
  mergeSchemas(schemas) {
    if (!schemas || schemas.length === 0) return {};
    if (schemas.length === 1) return schemas[0];

    // 여러 스키마를 병합 (공통 필드 우선)
    const merged = {};
    schemas.forEach(schema => {
      Object.assign(merged, schema);
    });

    return merged;
  }

  /**
   * 데이터 타입 추출
   */
  extractDataTypes(inputSchema, outputSchema) {
    const types = {
      input: this.extractTypesFromSchema(inputSchema),
      output: this.extractTypesFromSchema(outputSchema)
    };

    return types;
  }

  extractTypesFromSchema(schema) {
    if (!schema) return [];

    return Object.entries(schema).map(([key, type]) => ({
      field: key,
      type: type
    }));
  }

  /**
   * 복잡도 분석
   */
  analyzeComplexity(structure) {
    if (!structure || !structure.nodes) return 'simple';

    const nodeCount = structure.nodes.length;
    const connectionCount = structure.connections?.length || 0;

    if (nodeCount > 15 || connectionCount > 20) return 'complex';
    if (nodeCount > 7 || connectionCount > 10) return 'medium';
    return 'simple';
  }

  /**
   * 패턴 감지
   */
  detectPatterns(structure) {
    const patterns = [];

    if (!structure || !structure.nodes) return patterns;

    const nodeTypes = structure.nodes.map(n => n.type);

    // 공통 패턴들
    if (nodeTypes.includes('IF')) patterns.push('conditional_logic');
    if (nodeTypes.includes('Loop')) patterns.push('iteration');
    if (nodeTypes.includes('Merge')) patterns.push('data_merge');
    if (nodeTypes.filter(t => t === 'HTTP Request').length > 3) {
      patterns.push('multi_api_integration');
    }

    return patterns;
  }

  /**
   * 유틸리티: 컨텍스트 히스토리 추가
   */
  addToHistory(context) {
    this.contextHistory.unshift(context);

    // 최대 크기 유지
    if (this.contextHistory.length > this.maxHistorySize) {
      this.contextHistory = this.contextHistory.slice(0, this.maxHistorySize);
    }
  }

  /**
   * 사용자 히스토리 가져오기
   */
  getUserHistory() {
    return {
      recentContexts: this.contextHistory.slice(0, 3),
      totalCollections: this.contextHistory.length
    };
  }

  /**
   * 최소 컨텍스트 (에러 시 폴백)
   */
  getMinimalContext() {
    return {
      timestamp: new Date().toISOString(),
      platform: this.adapter?.getPlatformName() || 'unknown',
      error: true,
      message: '컨텍스트 수집 실패 - 최소 정보만 제공'
    };
  }

  // Stub implementations (adapter에서 구현 필요)
  getCursorPosition() { return null; }
  getActivePanel() { return null; }
  detectUserAction() { return null; }
  async getExistingCredentials() { return []; }
  detectSensitiveFields() { return []; }
  async getCurrentPermissions() { return {}; }
  async getLastExecutionResult() { return null; }
  async getExecutionCount() { return 0; }
  async calculateSuccessRate() { return 0; }
  getErrorFrequency(errors) { return {}; }
}

// Export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = AdvancedContextCollector;
}
