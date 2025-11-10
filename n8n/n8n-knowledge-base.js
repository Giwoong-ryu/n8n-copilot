/**
 * N8N Knowledge Base for Gemini
 * n8n-skillset의 내용을 Gemini가 이해할 수 있는 형태로 변환
 */

const N8N_KNOWLEDGE = {

  // JavaScript Code Node 핵심 지식
  javascript: {
    title: "N8N JavaScript Code Node",
    content: `
## 핵심 객체
- $input.all(): 모든 입력 아이템 배열
- $input.first(): 첫 번째 아이템
- $input.item: 현재 처리 중인 아이템 (Each Item 모드)
- $json: 현재 아이템 데이터 ({ json: {...}, pairing: {...} })

## 실행 모드
1. Run Once for All Items: 모든 아이템을 한 번에 처리
   - return $input.all() 또는 배열 반환
   - 여러 아이템 → 여러 아이템 출력

2. Run Once for Each Item: 각 아이템별로 실행
   - return {...} 객체 반환
   - 각 아이템이 개별 처리

## 일반적인 에러
❌ "items[0] is not iterable"
→ Run Once 모드에서 return items[0] 사용
✅ return $input.all()

❌ "$json is not defined"
→ Run Once 모드에서 $json 직접 사용
✅ $input.all().map(item => item.json)

## 데이터 변환 패턴
// 필드 추출
return $input.all().map(item => ({
  id: item.json.id,
  name: item.json.name
}));

// 필터링
return $input.all().filter(item =>
  item.json.status === 'active'
);

// 집계
const total = $input.all().reduce((sum, item) =>
  sum + item.json.amount, 0
);
return [{ total }];
`
  },

  // Expression 문법
  expression: {
    title: "N8N Expression Syntax",
    content: `
## 기본 문법
- {{ $json.fieldName }}: 현재 노드의 필드
- {{ $node["Node Name"].json.field }}: 특정 노드의 데이터
- {{ $input.item.json.field }}: 입력 데이터

## Webhook 데이터 접근
- GET 파라미터: {{ $json.query.paramName }}
- POST body: {{ $json.body.fieldName }}
- Headers: {{ $json.headers["content-type"] }}

## 안전한 접근 (undefined 방지)
❌ {{ $json.user.name }} → user가 없으면 에러
✅ {{ $json.user?.name || 'Unknown' }}

## 문자열 연산
- 연결: {{ $json.firstName + ' ' + $json.lastName }}
- 대소문자: {{ $json.email.toLowerCase() }}
- 부분 문자열: {{ $json.text.substring(0, 100) }}

## 숫자 연산
- 계산: {{ $json.price * 1.1 }}
- 반올림: {{ Math.round($json.value) }}

## 날짜 처리
- 현재: {{ $now }}
- ISO: {{ $now.toISO() }}
- 포맷: {{ $now.toFormat('yyyy-MM-dd') }}

## 조건식
{{ $json.age >= 18 ? 'Adult' : 'Minor' }}
{{ $json.status === 'active' && $json.verified }}
`
  },

  // 노드 설정
  configuration: {
    title: "N8N Node Configuration",
    content: `
## HTTP Request 노드
필수 설정:
- URL: 전체 URL 또는 {{ $json.apiUrl }}
- Authentication: None/Header/OAuth2 등
- Response Format: JSON (기본)

일반 에러:
❌ "ENOTFOUND" → URL 오타 또는 네트워크 문제
❌ "401 Unauthorized" → 인증 헤더 확인
✅ Headers에 Authorization: Bearer {{ $json.token }}

## Supabase 노드
Get 작업:
- Table: 테이블 이름
- Return All: 체크 (모든 레코드)
- Filters: 조건 추가

Insert 작업:
- Rows: [{ column1: value1, column2: value2 }]

## Set 노드
데이터 구조화:
- Keep Only Set: 지정한 필드만 유지
- Fields to Set:
  - name: fieldName
  - value: {{ $json.originalField }}

## IF 노드
조건 설정:
- Condition 1: {{ $json.status }} (equal) 'active'
- Condition 2: {{ $json.count }} (larger) 10
- Combine: AND / OR

## Code 노드
- Language: JavaScript
- Mode: Run Once for All Items (기본)
- return 필수!
`
  },

  // 검증 및 에러 해결
  validation: {
    title: "N8N Validation & Error Handling",
    content: `
## 일반적인 에러 유형

### 1. Expression 에러
❌ "Cannot read property 'X' of undefined"
원인: $json.parent.child에서 parent가 없음
✅ 해결: {{ $json.parent?.child || 'default' }}

### 2. JavaScript 에러
❌ "items[0] is not iterable"
원인: Run Once 모드에서 잘못된 반환
✅ 해결: return $input.all()

### 3. 데이터 타입 에러
❌ "Expected array, got object"
원인: Set 노드에서 단일 객체를 배열 필드에 할당
✅ 해결: [{{ $json.item }}] 배열로 감싸기

### 4. 인증 에러
❌ "401 Unauthorized"
✅ 해결:
  - API 키 확인
  - Header 형식: Bearer <token>
  - OAuth2 재인증

### 5. 데이터 손실
❌ "Expected 10 items, got 1"
원인: Code 노드에서 items[0] 반환
✅ 해결:
  - Run Once for All Items: return $input.all()
  - Run Once for Each Item 모드 사용

## 디버깅 팁
1. 각 노드 실행 후 출력 확인
2. Code 노드에서 console.log() 사용
3. Set 노드로 데이터 구조 단순화
4. Error Trigger로 에러 캐치
`
  },

  // 워크플로우 패턴
  patterns: {
    title: "N8N Workflow Patterns",
    content: `
## Webhook → Database 패턴
Webhook → Code (validate) → Set → Supabase Insert → Respond

베스트 프랙티스:
- Webhook에서 데이터 검증
- Set으로 DB 스키마에 맞게 변환
- Error Trigger로 실패 처리

## API → Process → Notify 패턴
Schedule → HTTP Request → IF → Slack/Email

베스트 프랙티스:
- HTTP Request에 retry 설정
- IF로 중요 조건만 필터링
- 에러 시 알림 전송

## Database CRUD 패턴
Trigger → Supabase Get → Code (process) → Supabase Update

베스트 프랙티스:
- 파라미터화된 쿼리 사용
- 트랜잭션 고려
- 동시성 처리

## AI Agent 패턴
Trigger → Collect Context → OpenAI → Code (format) → Action

베스트 프랙티스:
- 명확한 프롬프트 작성
- AI 응답 JSON 파싱
- 토큰 사용량 모니터링
`
  }
};

/**
 * 에러 컨텍스트에 따라 관련 지식 선택
 */
function getRelevantKnowledge(errorContext) {
  const context = errorContext.toLowerCase();
  const knowledge = [];

  // JavaScript 에러
  if (context.includes('items[0]') ||
      context.includes('$input') ||
      context.includes('return') ||
      context.includes('code node')) {
    knowledge.push(N8N_KNOWLEDGE.javascript.content);
  }

  // Expression 에러
  if (context.includes('$json') ||
      context.includes('{{') ||
      context.includes('undefined') ||
      context.includes('cannot read property')) {
    knowledge.push(N8N_KNOWLEDGE.expression.content);
  }

  // 노드 설정 에러
  if (context.includes('http request') ||
      context.includes('supabase') ||
      context.includes('authentication') ||
      context.includes('401') ||
      context.includes('enotfound')) {
    knowledge.push(N8N_KNOWLEDGE.configuration.content);
  }

  // 검증 에러 (항상 포함)
  knowledge.push(N8N_KNOWLEDGE.validation.content);

  // 아무것도 매칭 안되면 전체 포함
  if (knowledge.length === 1) { // validation만 있는 경우
    return Object.values(N8N_KNOWLEDGE)
      .map(k => k.content)
      .join('\n\n---\n\n');
  }

  return knowledge.join('\n\n---\n\n');
}

/**
 * Gemini 시스템 프롬프트 생성
 */
function buildSystemPrompt(errorContext) {
  const relevantKnowledge = getRelevantKnowledge(errorContext);

  return `You are an expert n8n workflow automation assistant.

# N8N Knowledge Base
${relevantKnowledge}

# Your Task
1. Analyze the user's n8n workflow error or question
2. Use the knowledge base above to provide accurate solutions
3. Provide specific code examples when applicable
4. Explain why the error occurred and how to prevent it

# Response Format
- Be concise but thorough
- Use code blocks for examples
- Highlight common mistakes with ❌ and solutions with ✅
- Reference specific node names and settings

Answer in Korean (한국어).`;
}

// Export for use in background.js
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { N8N_KNOWLEDGE, getRelevantKnowledge, buildSystemPrompt };
}
