/**
 * BaseAdapter - 모든 플랫폼 어댑터의 기본 인터페이스
 *
 * Architecture V2의 핵심 패턴:
 * - 각 자동화 플랫폼(n8n, Make, Zapier 등)은 이 인터페이스를 구현
 * - Universal 확장을 위한 표준 계약(contract) 제공
 */

class BaseAdapter {
  /**
   * 어댑터 초기화
   * @param {string} platform - 플랫폼 이름 (예: 'n8n', 'make', 'zapier')
   */
  constructor(platform) {
    if (new.target === BaseAdapter) {
      throw new TypeError('BaseAdapter는 직접 인스턴스화할 수 없습니다');
    }

    this.platform = platform;
    this.initialized = false;
  }

  /**
   * 어댑터 초기화
   * @returns {Promise<boolean>} 초기화 성공 여부
   */
  async initialize() {
    throw new Error('initialize() 메서드를 구현해야 합니다');
  }

  /**
   * 플랫폼 페이지 감지
   * @returns {boolean} 해당 플랫폼 페이지인지 여부
   */
  detectPlatformPage() {
    throw new Error('detectPlatformPage() 메서드를 구현해야 합니다');
  }

  /**
   * 현재 컨텍스트 수집 (Architecture V2 - Deep Context)
   *
   * 반환 구조:
   * {
   *   platform: string,
   *   current: {
   *     selectedNode: object,
   *     cursorPosition: object,
   *     userInputHistory: array
   *   },
   *   workflow: {
   *     structure: object,
   *     executionHistory: array,
   *     dataFlow: object,
   *     businessIntent: object  // NEW - 비즈니스 의도 추론
   *   },
   *   errors: {
   *     current: array,
   *     chain: array,           // NEW - 에러 체인 추적
   *     rootCause: object       // NEW - 근본 원인 분석
   *   },
   *   security: {
   *     credentials: array,
   *     sensitiveFields: array
   *   },
   *   types: {
   *     inputSchema: object,    // NEW - 입력 스키마 추론
   *     outputSchema: object    // NEW - 출력 스키마 추론
   *   }
   * }
   *
   * @returns {Promise<object>} 컨텍스트 객체
   */
  async getContext() {
    throw new Error('getContext() 메서드를 구현해야 합니다');
  }

  /**
   * AI가 제안한 변경사항 적용
   *
   * @param {object} aiResponse - AI 응답
   * @param {string} aiResponse.action - 액션 타입 ('fill_settings', 'create_node', 'fix_error')
   * @param {object} aiResponse.settings - 적용할 설정값
   * @param {string} aiResponse.nodeId - 대상 노드 ID (선택)
   * @returns {Promise<object>} 적용 결과
   */
  async applyChanges(aiResponse) {
    throw new Error('applyChanges() 메서드를 구현해야 합니다');
  }

  /**
   * 에러 감지 및 분석 (Architecture V2 - Error Chain)
   *
   * 반환 구조:
   * {
   *   current: [{ nodeId, message, code, timestamp }],
   *   chain: [{ nodeId, message, cause, timestamp }],  // NEW
   *   rootCause: { nodeId, reason, solution }         // NEW
   * }
   *
   * @returns {Promise<object>} 에러 정보
   */
  async detectErrors() {
    throw new Error('detectErrors() 메서드를 구현해야 합니다');
  }

  /**
   * 워크플로우 구조 파악
   * @returns {Promise<object>} 워크플로우 구조
   */
  async getWorkflowStructure() {
    throw new Error('getWorkflowStructure() 메서드를 구현해야 합니다');
  }

  /**
   * 데이터 흐름 추적 (Architecture V2 - Data Flow Tracer)
   *
   * @param {string} nodeId - 추적할 노드 ID
   * @returns {Promise<object>} 데이터 흐름 정보
   */
  async traceDataFlow(nodeId) {
    throw new Error('traceDataFlow() 메서드를 구현해야 합니다');
  }

  /**
   * 비즈니스 의도 추론 (Architecture V2)
   * 워크플로우 전체를 분석하여 사용자의 의도를 파악
   *
   * 예: { goal: '고객 문의 자동 응답', pattern: 'webhook-to-slack', complexity: 'simple' }
   *
   * @returns {Promise<object>} 비즈니스 의도
   */
  async inferBusinessIntent() {
    throw new Error('inferBusinessIntent() 메서드를 구현해야 합니다');
  }

  /**
   * 플랫폼별 보안 체크
   * @returns {Promise<object>} 보안 검증 결과
   */
  async validateSecurity() {
    throw new Error('validateSecurity() 메서드를 구현해야 합니다');
  }

  /**
   * 유틸리티: 플랫폼 이름 반환
   * @returns {string}
   */
  getPlatformName() {
    return this.platform;
  }

  /**
   * 유틸리티: 초기화 상태 확인
   * @returns {boolean}
   */
  isInitialized() {
    return this.initialized;
  }
}

// Export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = BaseAdapter;
}
