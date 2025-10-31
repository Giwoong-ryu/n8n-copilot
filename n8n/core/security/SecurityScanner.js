/**
 * SecurityScanner - AI 응답 및 워크플로우 보안 검증
 *
 * Architecture V2의 핵심 컴포넌트:
 * - AI 코딩 도구의 322% 더 많은 보안 결함 문제 해결
 * - 하드코딩된 credential 방지
 * - 민감한 데이터 노출 체크
 * - 과도한 권한 감지
 */

class SecurityScanner {
  constructor() {
    // 보안 위협 패턴
    this.patterns = {
      // API 키 패턴
      apiKeys: [
        /['\"]?api[_-]?key['\"]?\s*[:=]\s*['\"]\w{20,}['\"]?/gi,
        /['\"]?token['\"]?\s*[:=]\s*['\"]\w{20,}['\"]?/gi,
        /['\"]?secret['\"]?\s*[:=]\s*['\"]\w{20,}['\"]?/gi,
        /Bearer\s+\w{20,}/gi,
        /sk-[a-zA-Z0-9]{20,}/gi, // OpenAI style
        /ghp_[a-zA-Z0-9]{36}/gi, // GitHub
        /xoxb-[a-zA-Z0-9\-]+/gi // Slack
      ],

      // 비밀번호 패턴
      passwords: [
        /['\"]?password['\"]?\s*[:=]\s*['\"]\S+['\"]?/gi,
        /['\"]?passwd['\"]?\s*[:=]\s*['\"]\S+['\"]?/gi,
        /['\"]?pwd['\"]?\s*[:=]\s*['\"]\S+['\"]?/gi
      ],

      // OAuth 시크릿
      oauth: [
        /client[_-]?secret['\"]?\s*[:=]\s*['\"]\w{20,}['\"]?/gi,
        /consumer[_-]?secret['\"]?\s*[:=]\s*['\"]\w{20,}['\"]?/gi
      ],

      // 데이터베이스 연결 문자열
      database: [
        /mongodb(\+srv)?:\/\/[^\s]+/gi,
        /postgres:\/\/[^\s]+/gi,
        /mysql:\/\/[^\s]+/gi,
        /redis:\/\/[^\s]+/gi
      ],

      // AWS 키
      aws: [
        /AKIA[0-9A-Z]{16}/gi,
        /aws[_-]?secret[_-]?access[_-]?key/gi
      ],

      // 민감한 개인정보
      pii: [
        /\d{6}-\d{7}/g, // 주민등록번호
        /\d{3}-\d{2}-\d{4}/g, // SSN
        /\d{4}-\d{4}-\d{4}-\d{4}/g // 카드번호
      ]
    };

    // 허용된 필드 (false positive 방지)
    this.allowedFields = [
      'Authorization',
      'x-api-key',
      'Content-Type',
      'User-Agent',
      'Accept'
    ];
  }

  /**
   * AI 응답 보안 검증 (메인 메서드)
   *
   * @param {object} aiResponse - AI가 생성한 응답
   * @param {object} context - 현재 워크플로우 컨텍스트
   * @returns {object} 검증 결과
   */
  async validateAIResponse(aiResponse, context = {}) {
    const issues = [];

    try {
      // 1. 하드코딩된 credential 체크
      const credentialIssues = this.checkHardcodedCredentials(aiResponse);
      issues.push(...credentialIssues);

      // 2. 민감한 데이터 노출 체크
      const piiIssues = this.checkSensitiveData(aiResponse);
      issues.push(...piiIssues);

      // 3. 과도한 권한 체크
      const permissionIssues = this.checkExcessivePermissions(aiResponse, context);
      issues.push(...permissionIssues);

      // 4. 기존 Credential 사용 권장
      const credentialSuggestions = this.suggestExistingCredentials(aiResponse, context);

      return {
        safe: issues.length === 0,
        issues: issues,
        suggestions: credentialSuggestions,
        score: this.calculateSecurityScore(issues),
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('SecurityScanner validation error:', error);
      return {
        safe: false,
        issues: [{
          severity: 'error',
          type: 'scanner_error',
          message: '보안 검증 중 오류 발생',
          details: error.message
        }]
      };
    }
  }

  /**
   * 하드코딩된 credential 감지
   *
   * @param {object} aiResponse - AI 응답
   * @returns {Array} 발견된 이슈 목록
   */
  checkHardcodedCredentials(aiResponse) {
    const issues = [];
    const responseStr = JSON.stringify(aiResponse);

    // API 키 체크
    this.patterns.apiKeys.forEach(pattern => {
      const matches = responseStr.match(pattern);
      if (matches) {
        issues.push({
          severity: 'critical',
          type: 'hardcoded_api_key',
          message: 'AI가 하드코딩된 API 키를 생성했습니다',
          details: `발견된 패턴: ${matches[0].substring(0, 30)}...`,
          fix: 'N8N Credential 노드를 사용하세요',
          matches: matches.length
        });
      }
    });

    // 비밀번호 체크
    this.patterns.passwords.forEach(pattern => {
      const matches = responseStr.match(pattern);
      if (matches) {
        issues.push({
          severity: 'critical',
          type: 'hardcoded_password',
          message: '하드코딩된 비밀번호가 감지되었습니다',
          details: '비밀번호는 환경 변수나 Credential로 관리해야 합니다',
          fix: 'Credential 노드 또는 환경 변수 사용',
          matches: matches.length
        });
      }
    });

    // OAuth Secret 체크
    this.patterns.oauth.forEach(pattern => {
      const matches = responseStr.match(pattern);
      if (matches) {
        issues.push({
          severity: 'critical',
          type: 'hardcoded_oauth_secret',
          message: 'OAuth Client Secret이 하드코딩되어 있습니다',
          details: 'OAuth Secret은 절대 코드에 포함되어서는 안 됩니다',
          fix: 'OAuth2 Credential 사용',
          matches: matches.length
        });
      }
    });

    // AWS 키 체크
    this.patterns.aws.forEach(pattern => {
      const matches = responseStr.match(pattern);
      if (matches) {
        issues.push({
          severity: 'critical',
          type: 'hardcoded_aws_key',
          message: 'AWS Access Key가 노출되어 있습니다',
          details: 'AWS 키가 유출되면 매우 위험합니다',
          fix: 'AWS Credential 노드 사용',
          matches: matches.length
        });
      }
    });

    return issues;
  }

  /**
   * 민감한 개인정보 노출 체크
   *
   * @param {object} aiResponse - AI 응답
   * @returns {Array} 발견된 이슈 목록
   */
  checkSensitiveData(aiResponse) {
    const issues = [];
    const responseStr = JSON.stringify(aiResponse);

    this.patterns.pii.forEach(pattern => {
      const matches = responseStr.match(pattern);
      if (matches) {
        issues.push({
          severity: 'high',
          type: 'sensitive_data_exposure',
          message: '민감한 개인정보가 포함되어 있을 수 있습니다',
          details: `의심스러운 패턴 ${matches.length}개 발견`,
          fix: '데이터를 마스킹하거나 암호화하세요',
          matches: matches.length
        });
      }
    });

    // 데이터베이스 연결 문자열
    this.patterns.database.forEach(pattern => {
      const matches = responseStr.match(pattern);
      if (matches) {
        issues.push({
          severity: 'critical',
          type: 'database_connection_string',
          message: '데이터베이스 연결 문자열이 노출되어 있습니다',
          details: 'DB 연결 정보는 환경 변수로 관리해야 합니다',
          fix: 'Credential 노드 또는 환경 변수 사용',
          matches: matches.length
        });
      }
    });

    return issues;
  }

  /**
   * 과도한 권한 체크
   *
   * @param {object} aiResponse - AI 응답
   * @param {object} context - 워크플로우 컨텍스트
   * @returns {Array} 발견된 이슈 목록
   */
  checkExcessivePermissions(aiResponse, context) {
    const issues = [];

    // HTTP 메서드 체크
    if (aiResponse.settings && aiResponse.settings.method === 'DELETE' &&
        !context.userExplicitlyRequested) {
      issues.push({
        severity: 'medium',
        type: 'excessive_permission',
        message: 'DELETE 메서드 사용 시 주의가 필요합니다',
        details: '데이터 삭제는 신중하게 처리해야 합니다',
        fix: '사용자 확인 절차 추가 권장'
      });
    }

    // OAuth scope 체크
    if (aiResponse.settings && aiResponse.settings.scope) {
      const scopes = aiResponse.settings.scope.split(' ');
      const dangerousScopes = ['delete', 'admin', 'write_all', 'full_access'];

      const foundDangerous = scopes.filter(scope =>
        dangerousScopes.some(danger => scope.toLowerCase().includes(danger))
      );

      if (foundDangerous.length > 0) {
        issues.push({
          severity: 'medium',
          type: 'excessive_oauth_scope',
          message: '과도한 OAuth 권한이 요청되었습니다',
          details: `위험한 scope: ${foundDangerous.join(', ')}`,
          fix: '필요한 최소 권한만 요청하세요'
        });
      }
    }

    return issues;
  }

  /**
   * 기존 Credential 사용 권장
   *
   * @param {object} aiResponse - AI 응답
   * @param {object} context - 워크플로우 컨텍스트
   * @returns {Array} Credential 제안 목록
   */
  suggestExistingCredentials(aiResponse, context) {
    const suggestions = [];

    // 기존 Credential 목록 확인
    if (context.existingCredentials && context.existingCredentials.length > 0) {
      // AI 응답에서 인증이 필요한지 체크
      const needsAuth = this.detectAuthenticationNeed(aiResponse);

      if (needsAuth) {
        const relevantCreds = context.existingCredentials.filter(cred =>
          this.isCredentialRelevant(cred, aiResponse)
        );

        if (relevantCreds.length > 0) {
          suggestions.push({
            type: 'use_existing_credential',
            message: '기존 Credential을 사용할 수 있습니다',
            credentials: relevantCreds.map(c => ({
              id: c.id,
              name: c.name,
              type: c.type
            }))
          });
        } else {
          suggestions.push({
            type: 'create_new_credential',
            message: '새로운 Credential 생성을 권장합니다',
            reason: 'API 인증 정보를 안전하게 관리하기 위함'
          });
        }
      }
    }

    return suggestions;
  }

  /**
   * 인증 필요 여부 감지
   */
  detectAuthenticationNeed(aiResponse) {
    const responseStr = JSON.stringify(aiResponse).toLowerCase();

    const authKeywords = [
      'authorization',
      'api-key',
      'api_key',
      'token',
      'bearer',
      'oauth',
      'credential'
    ];

    return authKeywords.some(keyword => responseStr.includes(keyword));
  }

  /**
   * Credential 관련성 확인
   */
  isCredentialRelevant(credential, aiResponse) {
    const credType = credential.type.toLowerCase();
    const responseStr = JSON.stringify(aiResponse).toLowerCase();

    // 단순 매칭 (추후 개선 가능)
    return responseStr.includes(credType) ||
           responseStr.includes(credential.name.toLowerCase());
  }

  /**
   * 보안 점수 계산 (0-100)
   *
   * @param {Array} issues - 발견된 이슈 목록
   * @returns {number} 보안 점수
   */
  calculateSecurityScore(issues) {
    if (issues.length === 0) return 100;

    let deductions = 0;

    issues.forEach(issue => {
      switch (issue.severity) {
        case 'critical':
          deductions += 40;
          break;
        case 'high':
          deductions += 25;
          break;
        case 'medium':
          deductions += 10;
          break;
        case 'low':
          deductions += 5;
          break;
      }
    });

    return Math.max(0, 100 - deductions);
  }

  /**
   * 보안 이슈 요약 생성
   *
   * @param {object} validationResult - validateAIResponse 결과
   * @returns {string} 사용자 친화적 요약
   */
  generateSecuritySummary(validationResult) {
    if (validationResult.safe) {
      return '보안 검증 통과 - 안전합니다';
    }

    const critical = validationResult.issues.filter(i => i.severity === 'critical').length;
    const high = validationResult.issues.filter(i => i.severity === 'high').length;

    let summary = `보안 이슈 발견: `;

    if (critical > 0) {
      summary += `심각 ${critical}개`;
    }
    if (high > 0) {
      summary += ` 높음 ${high}개`;
    }

    summary += ` (보안 점수: ${validationResult.score}/100)`;

    return summary;
  }
}

// Export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = SecurityScanner;
}
