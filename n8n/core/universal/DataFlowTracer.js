/**
 * DataFlowTracer - 데이터 흐름 추적 및 분석
 *
 * Architecture V2의 핵심 기능:
 * - 노드 간 데이터 흐름 추적
 * - 이전 노드 출력값 수집
 * - 타입 불일치 감지
 * - 데이터 변환 경로 시각화
 */

class DataFlowTracer {
  constructor(adapter) {
    this.adapter = adapter;
    this.flowCache = new Map(); // 흐름 캐시
    this.maxCacheSize = 50;
  }

  /**
   * 특정 노드까지의 데이터 흐름 추적 (메인 메서드)
   *
   * @param {string} targetNodeId - 추적할 대상 노드 ID
   * @returns {Promise<object>} 데이터 흐름 정보
   */
  async traceDataFlow(targetNodeId) {
    try {
      // 캐시 확인
      if (this.flowCache.has(targetNodeId)) {
        const cached = this.flowCache.get(targetNodeId);
        if (this.isCacheValid(cached)) {
          console.log('DataFlowTracer: Using cached flow for', targetNodeId);
          return cached.data;
        }
      }

      // 데이터 흐름 분석
      const flow = {
        targetNodeId: targetNodeId,
        timestamp: new Date().toISOString(),

        // 1. 연결 경로
        path: await this.tracePath(targetNodeId),

        // 2. 이전 노드들의 출력
        previousOutputs: await this.collectPreviousOutputs(targetNodeId),

        // 3. 데이터 변환 단계
        transformations: await this.analyzeTransformations(targetNodeId),

        // 4. 타입 체인
        typeChain: await this.buildTypeChain(targetNodeId),

        // 5. 데이터 검증
        validation: await this.validateDataFlow(targetNodeId)
      };

      // 캐시 저장
      this.cacheFlow(targetNodeId, flow);

      return flow;
    } catch (error) {
      console.error('DataFlowTracer error:', error);
      return this.getMinimalFlow(targetNodeId);
    }
  }

  /**
   * 연결 경로 추적
   * 시작 노드부터 대상 노드까지의 모든 경로 찾기
   *
   * @param {string} targetNodeId - 대상 노드 ID
   * @returns {Promise<Array>} 경로 목록
   */
  async tracePath(targetNodeId) {
    try {
      const workflow = await this.adapter.getWorkflowStructure();
      if (!workflow || !workflow.connections) return [];

      const paths = [];
      const visited = new Set();

      // DFS로 모든 경로 찾기
      const findPaths = (nodeId, currentPath) => {
        if (visited.has(nodeId)) return;
        visited.add(nodeId);

        currentPath.push(nodeId);

        if (nodeId === targetNodeId) {
          paths.push([...currentPath]);
        } else {
          const nextNodes = this.getNextNodes(nodeId, workflow.connections);
          nextNodes.forEach(next => findPaths(next, currentPath));
        }

        currentPath.pop();
        visited.delete(nodeId);
      };

      // 시작 노드들 찾기 (입력 연결이 없는 노드)
      const startNodes = this.findStartNodes(workflow);
      startNodes.forEach(startId => findPaths(startId, []));

      return paths.map(path => ({
        nodes: path,
        length: path.length,
        complexity: this.calculatePathComplexity(path)
      }));
    } catch (error) {
      console.error('Path tracing error:', error);
      return [];
    }
  }

  /**
   * 이전 노드들의 출력 수집
   *
   * @param {string} targetNodeId - 대상 노드 ID
   * @returns {Promise<Array>} 이전 노드 출력 목록
   */
  async collectPreviousOutputs(targetNodeId) {
    try {
      const previousNodes = await this.adapter.getPreviousNodes(targetNodeId);
      if (!previousNodes || previousNodes.length === 0) return [];

      const outputs = [];

      for (const prevNode of previousNodes) {
        try {
          // 마지막 실행 결과 가져오기
          const lastOutput = await this.adapter.getNodeLastOutput(prevNode.id);

          outputs.push({
            nodeId: prevNode.id,
            nodeName: prevNode.name,
            nodeType: prevNode.type,
            output: lastOutput,
            schema: this.inferSchemaFromData(lastOutput),
            timestamp: lastOutput?.timestamp || null
          });
        } catch (error) {
          console.error(`Failed to get output for node ${prevNode.id}:`, error);
          outputs.push({
            nodeId: prevNode.id,
            nodeName: prevNode.name,
            nodeType: prevNode.type,
            output: null,
            error: error.message
          });
        }
      }

      return outputs;
    } catch (error) {
      console.error('Previous outputs collection error:', error);
      return [];
    }
  }

  /**
   * 데이터 변환 단계 분석
   *
   * @param {string} targetNodeId - 대상 노드 ID
   * @returns {Promise<Array>} 변환 단계 목록
   */
  async analyzeTransformations(targetNodeId) {
    try {
      const paths = await this.tracePath(targetNodeId);
      if (paths.length === 0) return [];

      const transformations = [];

      // 가장 짧은 경로 분석
      const shortestPath = paths.reduce((a, b) => a.length < b.length ? a : b);

      for (let i = 0; i < shortestPath.nodes.length - 1; i++) {
        const fromNodeId = shortestPath.nodes[i];
        const toNodeId = shortestPath.nodes[i + 1];

        const transformation = await this.analyzeNodeTransformation(fromNodeId, toNodeId);
        transformations.push(transformation);
      }

      return transformations;
    } catch (error) {
      console.error('Transformations analysis error:', error);
      return [];
    }
  }

  /**
   * 노드 간 변환 분석
   */
  async analyzeNodeTransformation(fromNodeId, toNodeId) {
    try {
      const fromNode = await this.adapter.getNodeById(fromNodeId);
      const toNode = await this.adapter.getNodeById(toNodeId);

      return {
        from: { id: fromNodeId, type: fromNode?.type, name: fromNode?.name },
        to: { id: toNodeId, type: toNode?.type, name: toNode?.name },
        transformationType: this.detectTransformationType(fromNode, toNode),
        dataChanges: await this.estimateDataChanges(fromNode, toNode)
      };
    } catch (error) {
      return {
        from: { id: fromNodeId },
        to: { id: toNodeId },
        error: error.message
      };
    }
  }

  /**
   * 변환 타입 감지
   */
  detectTransformationType(fromNode, toNode) {
    if (!fromNode || !toNode) return 'unknown';

    const fromType = fromNode.type;
    const toType = toNode.type;

    // 일반적인 변환 패턴
    if (toType === 'Function' || toType === 'Code') return 'code_transformation';
    if (toType === 'Set') return 'field_mapping';
    if (toType === 'IF') return 'conditional_routing';
    if (toType === 'Merge') return 'data_merge';
    if (toType === 'Split In Batches') return 'data_split';
    if (toType.includes('Filter')) return 'data_filter';

    // HTTP → Database
    if (fromType === 'HTTP Request' && toType.includes('Database')) {
      return 'api_to_database';
    }

    // Form → Notification
    if (fromType.includes('Form') && (toType === 'Slack' || toType === 'Email')) {
      return 'form_to_notification';
    }

    return 'direct_pass';
  }

  /**
   * 데이터 변경 추정
   */
  async estimateDataChanges(fromNode, toNode) {
    // 실제 데이터 변경 추정 (간단한 휴리스틱)
    const changes = {
      fieldsAdded: [],
      fieldsRemoved: [],
      fieldsTransformed: []
    };

    if (toNode?.type === 'Set') {
      changes.fieldsAdded.push('설정된 필드들');
    }

    if (toNode?.type === 'Function') {
      changes.fieldsTransformed.push('함수 처리 결과');
    }

    return changes;
  }

  /**
   * 타입 체인 구축
   * 데이터가 흐르면서 타입이 어떻게 변하는지 추적
   *
   * @param {string} targetNodeId - 대상 노드 ID
   * @returns {Promise<Array>} 타입 체인
   */
  async buildTypeChain(targetNodeId) {
    try {
      const previousOutputs = await this.collectPreviousOutputs(targetNodeId);
      const typeChain = [];

      previousOutputs.forEach(output => {
        if (output.schema) {
          typeChain.push({
            nodeId: output.nodeId,
            nodeName: output.nodeName,
            schema: output.schema,
            types: this.extractTypes(output.schema)
          });
        }
      });

      return typeChain;
    } catch (error) {
      console.error('Type chain building error:', error);
      return [];
    }
  }

  /**
   * 데이터 흐름 검증
   * 타입 불일치, 누락된 필드 등 체크
   *
   * @param {string} targetNodeId - 대상 노드 ID
   * @returns {Promise<object>} 검증 결과
   */
  async validateDataFlow(targetNodeId) {
    try {
      const issues = [];
      const previousOutputs = await this.collectPreviousOutputs(targetNodeId);
      const targetNode = await this.adapter.getNodeById(targetNodeId);

      // 1. 이전 노드가 없는 경우
      if (previousOutputs.length === 0 && !this.isStartNode(targetNode)) {
        issues.push({
          severity: 'warning',
          type: 'no_input',
          message: '입력 데이터가 없습니다',
          suggestion: '이전 노드를 연결하세요'
        });
      }

      // 2. 이전 노드 출력이 null인 경우
      previousOutputs.forEach(output => {
        if (output.output === null || output.error) {
          issues.push({
            severity: 'error',
            type: 'null_input',
            message: `${output.nodeName}의 출력이 없습니다`,
            suggestion: '이전 노드가 정상적으로 실행되었는지 확인하세요'
          });
        }
      });

      // 3. 타입 불일치 체크
      const typeIssues = await this.checkTypeCompatibility(previousOutputs, targetNode);
      issues.push(...typeIssues);

      return {
        valid: issues.length === 0,
        issues: issues,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Data flow validation error:', error);
      return {
        valid: false,
        issues: [{
          severity: 'error',
          type: 'validation_error',
          message: '검증 중 오류 발생'
        }]
      };
    }
  }

  /**
   * 타입 호환성 체크
   */
  async checkTypeCompatibility(previousOutputs, targetNode) {
    const issues = [];

    // 간단한 타입 체크 (추후 확장 가능)
    if (targetNode?.type === 'HTTP Request') {
      // HTTP Request는 body가 문자열이어야 함
      previousOutputs.forEach(output => {
        if (output.schema && typeof output.schema !== 'string') {
          issues.push({
            severity: 'warning',
            type: 'type_mismatch',
            message: `${output.nodeName}의 출력 타입이 HTTP Request에 적합하지 않을 수 있습니다`,
            suggestion: 'Function 노드로 데이터를 변환하세요'
          });
        }
      });
    }

    return issues;
  }

  /**
   * 유틸리티: 데이터에서 스키마 추론
   */
  inferSchemaFromData(data) {
    if (!data) return null;

    const schema = {};
    const sample = Array.isArray(data) ? data[0] : data;

    if (typeof sample === 'object') {
      Object.keys(sample).forEach(key => {
        schema[key] = typeof sample[key];
      });
    }

    return schema;
  }

  /**
   * 유틸리티: 스키마에서 타입 추출
   */
  extractTypes(schema) {
    if (!schema) return [];

    return Object.entries(schema).map(([field, type]) => ({
      field,
      type
    }));
  }

  /**
   * 유틸리티: 시작 노드인지 확인
   */
  isStartNode(node) {
    if (!node) return false;

    const startNodeTypes = ['Webhook', 'Schedule', 'Manual Trigger', 'Cron'];
    return startNodeTypes.includes(node.type);
  }

  /**
   * 유틸리티: 다음 노드 찾기
   */
  getNextNodes(nodeId, connections) {
    if (!connections) return [];

    return connections
      .filter(conn => conn.source === nodeId)
      .map(conn => conn.target);
  }

  /**
   * 유틸리티: 시작 노드 찾기
   */
  findStartNodes(workflow) {
    if (!workflow || !workflow.nodes || !workflow.connections) return [];

    // 입력 연결이 없는 노드들
    const allTargets = new Set(workflow.connections.map(conn => conn.target));
    return workflow.nodes
      .filter(node => !allTargets.has(node.id))
      .map(node => node.id);
  }

  /**
   * 유틸리티: 경로 복잡도 계산
   */
  calculatePathComplexity(path) {
    // 경로 길이 + 노드 타입 복잡도
    let complexity = path.length;

    // 복잡한 노드 타입에 가중치
    const complexNodeTypes = ['Function', 'Code', 'IF', 'Loop'];
    path.forEach(nodeId => {
      // nodeId로 노드 타입 확인 필요 (간략화)
      complexity += 0.5;
    });

    return complexity;
  }

  /**
   * 캐시 관리
   */
  cacheFlow(nodeId, flow) {
    this.flowCache.set(nodeId, {
      data: flow,
      timestamp: Date.now()
    });

    // 캐시 크기 제한
    if (this.flowCache.size > this.maxCacheSize) {
      const firstKey = this.flowCache.keys().next().value;
      this.flowCache.delete(firstKey);
    }
  }

  isCacheValid(cached) {
    const MAX_AGE = 60000; // 1분
    return (Date.now() - cached.timestamp) < MAX_AGE;
  }

  /**
   * 최소 흐름 정보 (에러 시 폴백)
   */
  getMinimalFlow(targetNodeId) {
    return {
      targetNodeId: targetNodeId,
      timestamp: new Date().toISOString(),
      error: true,
      message: '데이터 흐름 추적 실패'
    };
  }

  /**
   * 캐시 초기화
   */
  clearCache() {
    this.flowCache.clear();
  }
}

// Export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = DataFlowTracer;
}
