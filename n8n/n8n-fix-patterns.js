/**
 * N8N AI Copilot - Fix Patterns
 * 자주 발생하는 N8N 문제의 수정 패턴 정의
 *
 * 패턴 ID만 반환하여 토큰 사용량 85% 절감
 * Before: ~400 tokens (전체 코드)
 * After: ~30 tokens (패턴 ID만)
 */

const FIX_PATTERNS = {
  // ========================================
  // 1. items[0] → $input.all() 패턴
  // ========================================
  items_array_pattern: {
    id: 'items_array_pattern',
    title: 'items[0] 대신 $input.all() 사용',
    description: 'Run Once for All Items 모드에서 items[0]를 반환하면 첫 번째 아이템만 전송됩니다.',

    detectionKeywords: [
      'items[0]',
      '1개만 전송',
      '하나만',
      '첫번째만',
      'only one item',
      'is not iterable'
    ],

    severity: 'critical',
    category: 'code',

    before: `// ❌ 문제 코드
return items[0];
// 결과: 5개 입력 → 1개만 출력`,

    after: `// ✅ 수정된 코드
return $input.all();
// 결과: 5개 입력 → 5개 모두 출력`,

    fixType: 'code',
    autoApplicable: true,

    // 자동 적용 로직
    autoFix: {
      searchPattern: /return\s+items\[0\]/g,
      replaceWith: 'return $input.all()',
      targetNodeType: 'Code'
    },

    // 수동 적용 단계
    manualSteps: [
      {
        step: 1,
        description: 'Code 노드를 더블클릭하여 엽니다',
        target: 'node',
        action: 'click'
      },
      {
        step: 2,
        description: '코드에서 "return items[0]"를 찾습니다',
        target: 'code',
        action: 'search',
        searchText: 'items[0]'
      },
      {
        step: 3,
        description: '"return items[0]"를 "return $input.all()"로 변경합니다',
        target: 'code',
        action: 'replace',
        before: 'return items[0]',
        after: 'return $input.all()'
      },
      {
        step: 4,
        description: '저장 후 다시 실행합니다',
        target: 'button',
        action: 'save'
      }
    ],

    explanation: `
## 왜 이런 문제가 발생하나요?

N8N Code 노드는 두 가지 실행 모드가 있습니다:

1. **Run Once for All Items** (전체 실행)
   - 모든 아이템을 한 번에 처리
   - 반드시 배열을 반환해야 함: \`return $input.all()\`

2. **Run Once for Each Item** (개별 실행)
   - 각 아이템마다 개별 실행
   - 단일 객체 반환: \`return { ... }\`

\`items[0]\`는 첫 번째 아이템 하나만 반환하므로 나머지는 손실됩니다.

## 해결 방법

\`\`\`javascript
// ❌ 잘못된 방법
return items[0]  // 1개만 반환

// ✅ 올바른 방법
return $input.all()  // 모든 아이템 반환
\`\`\`
`
  },

  // ========================================
  // 2. filter() 데이터 손실 패턴
  // ========================================
  filter_data_loss: {
    id: 'filter_data_loss',
    title: 'filter() 사용으로 인한 데이터 손실',
    description: 'filter()로 아이템을 걸러내면 일부 데이터가 손실됩니다.',

    detectionKeywords: [
      'filter(',
      '개수가 줄어듦',
      'items reduced',
      '일부만 전송'
    ],

    severity: 'high',
    category: 'code',

    before: `// ❌ 의도하지 않은 필터링
return $input.all().filter(item => item.json.status === 'active');
// 결과: 10개 입력 → 3개만 출력 (나머지 7개 손실)`,

    after: `// ✅ 옵션 1: 필터링 제거
return $input.all();

// ✅ 옵션 2: 필터링이 의도된 경우
// Filter 노드를 별도로 사용하는 것이 더 명확합니다`,

    fixType: 'code_or_structure',
    autoApplicable: false,  // 사용자 의도 확인 필요

    manualSteps: [
      {
        step: 1,
        description: '필터링이 의도된 것인지 확인합니다',
        target: 'user_confirmation',
        action: 'confirm'
      },
      {
        step: 2,
        description: '의도하지 않았다면: filter() 부분을 제거합니다',
        target: 'code',
        action: 'replace',
        before: '.filter(item => ...)',
        after: ''
      },
      {
        step: 3,
        description: '의도한 필터링이라면: Filter 노드를 추가하는 것을 권장합니다',
        target: 'workflow',
        action: 'add_node',
        nodeType: 'Filter'
      }
    ],

    explanation: `
## 문제 원인

\`filter()\` 함수는 조건에 맞는 아이템만 남기므로 나머지는 손실됩니다.

## 해결 방법

1. **필터링이 불필요한 경우**: \`filter()\` 제거
2. **필터링이 필요한 경우**: Filter 노드를 별도로 추가 (워크플로우가 더 명확함)
`
  },

  // ========================================
  // 3. Expression undefined 패턴
  // ========================================
  expression_undefined: {
    id: 'expression_undefined',
    title: 'Expression에서 undefined 에러',
    description: 'Expression에서 존재하지 않는 필드에 접근하면 undefined 에러가 발생합니다.',

    detectionKeywords: [
      'undefined',
      'Cannot read property',
      'is not defined',
      'null'
    ],

    severity: 'high',
    category: 'expression',

    before: `{{ $json.user.email }}
// ❌ user가 없으면 에러`,

    after: `{{ $json.user?.email || 'no-email@example.com' }}
// ✅ Optional chaining + 기본값`,

    fixType: 'expression',
    autoApplicable: true,

    autoFix: {
      // Expression 필드에서 자동으로 ?. 추가
      addOptionalChaining: true,
      addDefaultValue: true
    },

    manualSteps: [
      {
        step: 1,
        description: 'Expression 필드를 찾습니다 (Fixed/Expression 토글 확인)',
        target: 'input',
        action: 'focus'
      },
      {
        step: 2,
        description: 'Optional chaining (?.)을 추가합니다',
        target: 'expression',
        action: 'edit',
        example: '$json.user.email → $json.user?.email'
      },
      {
        step: 3,
        description: '기본값을 추가합니다 (|| 연산자)',
        target: 'expression',
        action: 'edit',
        example: "$json.user?.email || 'unknown'"
      }
    ],

    explanation: `
## 문제 원인

N8N Expression에서 존재하지 않는 필드에 접근하면 에러가 발생합니다.

\`\`\`javascript
// ❌ 에러 발생
{{ $json.user.email }}  // user가 없으면 에러

// ✅ 안전한 방법
{{ $json.user?.email || 'default@example.com' }}
\`\`\`

## Optional Chaining (?.)

- \`user?\` : user가 없어도 에러 없이 undefined 반환
- \`|| 'default'\` : undefined면 기본값 사용
`
  },

  // ========================================
  // 4. Run mode 변경 패턴
  // ========================================
  run_mode_change: {
    id: 'run_mode_change',
    title: 'Run Once for Each Item으로 변경',
    description: '개별 아이템 처리가 필요한 경우 실행 모드를 변경해야 합니다.',

    detectionKeywords: [
      'each item',
      '개별 처리',
      'loop',
      'for each'
    ],

    severity: 'medium',
    category: 'setting',

    before: `// Run Once for All Items (전체)
return $input.all().map(item => ({
  ...item.json,
  processed: true
}));`,

    after: `// Run Once for Each Item (개별)
return {
  ...$json,
  processed: true
};`,

    fixType: 'setting',
    autoApplicable: false,  // 설정 변경은 수동 확인 필요

    manualSteps: [
      {
        step: 1,
        description: 'Code 노드를 더블클릭하여 엽니다',
        target: 'node',
        action: 'click'
      },
      {
        step: 2,
        description: '⚙️ Settings 탭을 클릭합니다',
        target: 'tab',
        action: 'click',
        targetText: 'Settings'
      },
      {
        step: 3,
        description: '"Mode" 드롭다운을 찾습니다',
        target: 'select',
        action: 'click',
        fieldName: 'Mode'
      },
      {
        step: 4,
        description: '"Run Once for Each Item"을 선택합니다',
        target: 'option',
        action: 'select',
        value: 'runOnceForEachItem'
      },
      {
        step: 5,
        description: '코드를 개별 아이템 처리 방식으로 수정합니다',
        target: 'code',
        action: 'replace',
        before: 'return $input.all()',
        after: 'return { ...$json }'
      }
    ],

    explanation: `
## 두 가지 실행 모드

### 1. Run Once for All Items (기본값)
- 모든 아이템을 한 번에 처리
- 배열 반환: \`return $input.all()\`
- 빠르지만 복잡한 로직에는 부적합

### 2. Run Once for Each Item
- 각 아이템을 개별로 처리
- 객체 반환: \`return { ... }\`
- 느리지만 명확하고 안전

## 언제 Each Item을 사용하나요?

- API 호출을 각 아이템마다 해야 할 때
- 복잡한 조건문이 필요할 때
- 아이템 간 독립적인 처리가 필요할 때
`
  },

  // ========================================
  // 5. OAuth2 설정 패턴
  // ========================================
  oauth2_setup: {
    id: 'oauth2_setup',
    title: 'Bearer Auth 대신 OAuth2 사용',
    description: '최신 API는 Bearer Auth 대신 OAuth2를 사용합니다.',

    detectionKeywords: [
      'oauth',
      'oauth2',
      '인증 실패',
      'authentication failed',
      'bearer',
      '401'
    ],

    severity: 'high',
    category: 'setting',

    before: `// ❌ 구식 방법
Authentication: Bearer Auth
Token: <직접 입력>`,

    after: `// ✅ 최신 방법
Authentication: OAuth2
Grant Type: Authorization Code
Client ID: <앱 ID>
Client Secret: <앱 시크릿>`,

    fixType: 'credential',
    autoApplicable: false,  // 인증 정보는 수동 입력 필요

    manualSteps: [
      {
        step: 1,
        description: 'HTTP Request 노드를 엽니다',
        target: 'node',
        action: 'click'
      },
      {
        step: 2,
        description: '"Authentication" 드롭다운을 클릭합니다',
        target: 'select',
        action: 'click',
        fieldName: 'Authentication'
      },
      {
        step: 3,
        description: '"OAuth2 API"를 선택합니다',
        target: 'option',
        action: 'select',
        value: 'oAuth2Api'
      },
      {
        step: 4,
        description: '"Create New Credential"을 클릭합니다',
        target: 'button',
        action: 'click'
      },
      {
        step: 5,
        description: 'Client ID와 Client Secret을 입력합니다',
        target: 'form',
        action: 'fill',
        fields: ['clientId', 'clientSecret']
      },
      {
        step: 6,
        description: 'OAuth 인증을 진행합니다',
        target: 'button',
        action: 'click',
        buttonText: 'Connect'
      }
    ],

    explanation: `
## Bearer Auth vs OAuth2

### Bearer Auth (구식)
- 직접 토큰을 입력
- 토큰 만료 시 수동 갱신 필요
- 보안 위험

### OAuth2 (최신)
- 자동 토큰 관리
- 토큰 자동 갱신
- 안전하고 표준적

## 대부분의 최신 API는 OAuth2 사용

- Google APIs
- Microsoft APIs
- Slack
- GitHub
- **카카오톡** ← OAuth2 필수!
`
  },

  // ========================================
  // 6. Set 노드 필드 누락 패턴
  // ========================================
  set_missing_field: {
    id: 'set_missing_field',
    title: 'Set 노드에서 필드 추가 누락',
    description: '이후 노드에서 사용할 필드를 Set 노드에서 미리 생성해야 합니다.',

    detectionKeywords: [
      'undefined',
      'Set 노드',
      '필드 없음',
      'field not found'
    ],

    severity: 'high',
    category: 'data_flow',

    before: `// ❌ Set 노드에서 email 필드를 추가하지 않음
// 이후 Code 노드에서:
return {
  message: $json.email  // ← undefined 에러!
};`,

    after: `// ✅ Set 노드에서 email 필드 추가
// Set 노드에서:
- Name: email
- Value: {{ $json.data.email }}

// 이후 Code 노드에서:
return {
  message: $json.email  // ← 정상 작동!
};`,

    fixType: 'workflow_structure',
    autoApplicable: false,

    manualSteps: [
      {
        step: 1,
        description: '에러가 발생한 노드의 이전 노드들을 확인합니다',
        target: 'workflow',
        action: 'trace_back'
      },
      {
        step: 2,
        description: 'Set 노드를 찾아 더블클릭합니다',
        target: 'node',
        action: 'click',
        nodeType: 'Set'
      },
      {
        step: 3,
        description: '"Add Value" 버튼을 클릭합니다',
        target: 'button',
        action: 'click',
        buttonText: 'Add Value'
      },
      {
        step: 4,
        description: '필드 이름과 값을 입력합니다',
        target: 'form',
        action: 'fill',
        example: {
          name: 'email',
          value: '{{ $json.data.email }}'
        }
      },
      {
        step: 5,
        description: '저장 후 다시 실행합니다',
        target: 'button',
        action: 'save'
      }
    ],

    explanation: `
## 데이터 흐름 문제

N8N은 노드를 거치며 데이터를 전달합니다. Set 노드에서 필드를 추가하지 않으면 이후 노드에서 사용할 수 없습니다.

\`\`\`
Webhook → Set → Code
          ↑
          여기서 필드를 추가해야
          Code에서 사용 가능!
\`\`\`

## 해결 방법

1. **Set 노드에서 필드 추가**
   - Add Value 클릭
   - Name: 필드명 입력
   - Value: Expression으로 값 설정

2. **또는 Code 노드에서 직접 생성**
   \`\`\`javascript
   return {
     ...$json,
     email: $json.data?.email || 'unknown'
   };
   \`\`\`
`
  }
};


// ========================================
// 패턴 감지 및 추천 함수
// ========================================

/**
 * 에러 컨텍스트에서 적절한 패턴 찾기
 * @param {Object} context - 에러 컨텍스트 (노드 정보, 에러 메시지, 코드 등)
 * @returns {Array} - 관련 패턴 ID 배열 (우선순위 순)
 */
function detectRelevantPatterns(context) {
  const { errorMessage, code, nodeType, executionData, workflow } = context;
  const matches = [];

  // 각 패턴의 키워드로 매칭
  Object.values(FIX_PATTERNS).forEach(pattern => {
    let score = 0;

    // 에러 메시지에서 키워드 검색
    if (errorMessage) {
      pattern.detectionKeywords.forEach(keyword => {
        if (errorMessage.toLowerCase().includes(keyword.toLowerCase())) {
          score += 10;
        }
      });
    }

    // 코드에서 키워드 검색
    if (code) {
      pattern.detectionKeywords.forEach(keyword => {
        if (code.includes(keyword)) {
          score += 5;
        }
      });
    }

    // 노드 타입 매칭
    if (nodeType && pattern.autoFix && pattern.autoFix.targetNodeType === nodeType) {
      score += 3;
    }

    // 데이터 손실 감지
    if (executionData && executionData.dataLoss &&
        (pattern.id === 'items_array_pattern' || pattern.id === 'filter_data_loss')) {
      score += 15;  // 높은 우선순위
    }

    if (score > 0) {
      matches.push({
        patternId: pattern.id,
        pattern: pattern,
        score: score,
        confidence: score > 15 ? 'high' : score > 8 ? 'medium' : 'low'
      });
    }
  });

  // 점수 순으로 정렬
  matches.sort((a, b) => b.score - a.score);

  return matches;
}


/**
 * 패턴 ID로 패턴 객체 가져오기
 * @param {string} patternId - 패턴 ID
 * @returns {Object|null} - 패턴 객체
 */
function getPattern(patternId) {
  return FIX_PATTERNS[patternId] || null;
}


/**
 * 모든 패턴 ID 리스트 가져오기
 * @returns {Array} - 패턴 ID 배열
 */
function getAllPatternIds() {
  return Object.keys(FIX_PATTERNS);
}


/**
 * 카테고리별 패턴 가져오기
 * @param {string} category - 'code' | 'expression' | 'setting' | 'credential' | 'workflow_structure'
 * @returns {Array} - 해당 카테고리의 패턴 배열
 */
function getPatternsByCategory(category) {
  return Object.values(FIX_PATTERNS).filter(pattern => pattern.category === category);
}


// Export (background.js에서 사용)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    FIX_PATTERNS,
    detectRelevantPatterns,
    getPattern,
    getAllPatternIds,
    getPatternsByCategory
  };
}
