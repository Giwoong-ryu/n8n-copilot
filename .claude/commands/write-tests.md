---
description: Chrome Extension 단위 테스트 및 E2E 테스트 작성
---

# N8N Copilot 테스트 작성 가이드

Chrome Extension을 위한 체계적인 테스트 작성 방법입니다.

## 🚨 시작 전 확인

**1. 테스트 프레임워크 확인**
```bash
# package.json에서 확인
cat package.json | grep -A 5 "devDependencies"
```

현재 프로젝트에 테스트 프레임워크가 없다면:
- Jest (Chrome Extension 테스팅 권장)
- Puppeteer (E2E 테스트)
- @testing-library/dom (DOM 테스팅)

**2. 테스트 대상 우선순위**
1. 🔴 Critical 기능 (lessons-learned.md의 CRITICAL 항목)
2. 🟠 복잡한 비즈니스 로직
3. 🟡 자주 변경되는 코드
4. 🟢 유틸리티 함수

## Chrome Extension 테스트 전략

### Unit Tests (단위 테스트)
**대상:**
- Fuzzy matching 함수 (content.js)
- 메타데이터 필터링 로직
- AI 프롬프트 생성 함수
- 유틸리티 함수

### Integration Tests (통합 테스트)
**대상:**
- Background ↔ Content script 메시지 통신
- N8N API 연동
- Chrome Storage 읽기/쓰기
- AI API 호출

### E2E Tests (End-to-End)
**대상:**
- 전체 사용자 플로우
- N8N 워크플로우 노드 자동 입력
- AI 채팅 및 응답
- 설정 저장 및 복구

## 18단계 테스트 작성 프로세스

### Phase 1: 준비

**1. 테스트 파일 구조 파악**
```
n8n-copilot/
├── tests/
│   ├── unit/
│   │   ├── fuzzy-matching.test.js
│   │   ├── metadata-filter.test.js
│   │   └── utils.test.js
│   ├── integration/
│   │   ├── message-passing.test.js
│   │   ├── n8n-api.test.js
│   │   └── ai-api.test.js
│   └── e2e/
│       ├── auto-fill.test.js
│       └── ai-chat.test.js
```

**2. 코드 분석**
- Read로 테스트할 파일 읽기
- 공개 인터페이스 확인 (export된 함수)
- 비즈니스 로직 식별
- 엣지 케이스 생각

**3. 테스트 전략 수립**
- AAA 패턴: Arrange (준비) → Act (실행) → Assert (검증)
- 각 함수당 최소 3개 테스트 (정상, 엣지, 에러)

### Phase 2: Unit Test 작성

**4. Critical 기능 테스트 우선**

**예시 1: Fuzzy Matching 테스트**
```javascript
// tests/unit/fuzzy-matching.test.js
describe('Fuzzy Matching', () => {
  describe('getEditDistance', () => {
    test('같은 문자열은 거리 0', () => {
      // Arrange
      const str1 = 'feedurl';
      const str2 = 'feedurl';

      // Act
      const distance = getEditDistance(str1, str2);

      // Assert
      expect(distance).toBe(0);
    });

    test('한 글자 차이는 거리 1', () => {
      expect(getEditDistance('feedurl', 'feedUrl')).toBe(1);
    });

    test('완전히 다른 문자열', () => {
      expect(getEditDistance('abc', 'xyz')).toBe(3);
    });

    test('빈 문자열 처리', () => {
      expect(getEditDistance('', 'abc')).toBe(3);
      expect(getEditDistance('abc', '')).toBe(3);
    });
  });

  describe('getSimilarityScore', () => {
    test('feedUrl vs feedurl은 90% 이상 유사', () => {
      const score = getSimilarityScore('feedUrl', 'feedurl');
      expect(score).toBeGreaterThan(0.9);
    });

    test('임계값 0.5 이상이면 매칭 성공', () => {
      const score = getSimilarityScore('feed', 'feedurl');
      expect(score).toBeGreaterThanOrEqual(0.5);
    });
  });
});
```

**5. 메타데이터 필터링 테스트**
```javascript
// tests/unit/metadata-filter.test.js
describe('Metadata Filtering', () => {
  const metadataKeys = ['parameters', 'type', 'nodeName', 'nodeType', 'version', 'id', 'name', 'position'];

  test('메타데이터 키는 필터링됨', () => {
    const input = {
      parameters: {},
      type: 'n8n-nodes-base.youtube',
      feedUrl: 'https://example.com/rss'
    };

    const filtered = filterMetadata(input);

    expect(filtered).toEqual({
      feedUrl: 'https://example.com/rss'
    });
    expect(filtered.parameters).toBeUndefined();
    expect(filtered.type).toBeUndefined();
  });

  test('실제 필드는 유지됨', () => {
    const input = {
      id: '123',
      videoUrl: 'https://youtube.com/watch?v=xxx',
      caption: 'Test video'
    };

    const filtered = filterMetadata(input);

    expect(filtered.videoUrl).toBe('https://youtube.com/watch?v=xxx');
    expect(filtered.caption).toBe('Test video');
  });
});
```

### Phase 3: Integration Test 작성

**6. Chrome Message Passing 테스트**
```javascript
// tests/integration/message-passing.test.js
describe('Message Passing', () => {
  beforeEach(() => {
    // Chrome API 모킹
    global.chrome = {
      runtime: {
        sendMessage: jest.fn(),
        onMessage: {
          addListener: jest.fn()
        }
      }
    };
  });

  test('Background → Content script 메시지 전달', async () => {
    const message = { type: 'AI_RESPONSE', data: 'Test' };

    chrome.runtime.sendMessage.mockResolvedValue({ success: true });

    const result = await sendToContentScript(message);

    expect(chrome.runtime.sendMessage).toHaveBeenCalledWith(message);
    expect(result.success).toBe(true);
  });
});
```

**7. N8N API 테스트**
```javascript
// tests/integration/n8n-api.test.js
describe('N8N API Integration', () => {
  test('연결 테스트 성공 시 workflows 반환', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ data: [{ id: '1', name: 'Test' }] })
    });

    const result = await testN8nConnection('https://n8n.example.com', 'api-key');

    expect(result.success).toBe(true);
    expect(result.workflows.length).toBeGreaterThan(0);
  });

  test('타임아웃 10초 후 AbortError', async () => {
    jest.useFakeTimers();

    global.fetch = jest.fn(() =>
      new Promise(resolve => setTimeout(resolve, 11000))
    );

    const promise = testN8nConnection('https://n8n.example.com', 'api-key');

    jest.advanceTimersByTime(10000);

    await expect(promise).rejects.toThrow('AbortError');
  });
});
```

### Phase 4: E2E Test 작성

**8. Puppeteer E2E 테스트**
```javascript
// tests/e2e/auto-fill.test.js
const puppeteer = require('puppeteer');

describe('Auto-fill E2E Test', () => {
  let browser;
  let page;

  beforeAll(async () => {
    browser = await puppeteer.launch({
      headless: false,
      args: [
        `--disable-extensions-except=./n8n`,
        `--load-extension=./n8n`
      ]
    });
    page = await browser.newPage();
  });

  afterAll(async () => {
    await browser.close();
  });

  test('YouTube 노드 자동 입력', async () => {
    // N8N 워크플로우 페이지 이동
    await page.goto('https://n8n.example.com/workflow/new');

    // YouTube 노드 추가
    await page.click('[data-test-id="add-node"]');
    await page.type('input[name="search"]', 'YouTube');
    await page.click('[data-node-type="n8n-nodes-base.youtube"]');

    // 사이드바에서 AI 제안 받기
    await page.click('[data-test-id="ai-sidebar-toggle"]');
    await page.type('#ai-chat-input', 'YouTube RSS 피드 가져오기');
    await page.click('#ai-chat-send');

    // 자동 입력 대기
    await page.waitForSelector('[data-test-id="auto-fill-complete"]', {
      timeout: 5000
    });

    // 필드 확인
    const feedUrl = await page.$eval('input[name="feedUrl"]', el => el.value);
    expect(feedUrl).toBeTruthy();
    expect(feedUrl).toContain('http');
  });
});
```

### Phase 5: 테스트 품질 향상

**9. 모킹(Mocking) 전략**
- Chrome API 모킹 (chrome.storage, chrome.runtime)
- Fetch API 모킹 (AI API, N8N API)
- 시간 관련 함수 모킹 (setTimeout, Date.now)

**10. 테스트 커버리지 확인**
```bash
# Jest coverage 실행
npm test -- --coverage

# 커버리지 목표: 80% 이상
# Critical 기능: 100%
```

**11. 에러 케이스 테스트**
- 네트워크 실패
- API 응답 에러 (400, 401, 404, 500)
- 타임아웃
- 잘못된 입력값
- null/undefined 처리

**12. 비동기 테스트**
```javascript
test('AI API 비동기 호출', async () => {
  const response = await callAIAPI('test prompt');
  expect(response).toBeDefined();
});

test('Promise 거부 처리', async () => {
  await expect(callAIAPI(null)).rejects.toThrow('Invalid prompt');
});
```

### Phase 6: 테스트 유지보수

**13. 테스트 리팩토링**
- 중복 코드 제거
- Helper 함수 추출
- Fixture 데이터 분리

**14. CI/CD 통합**
```json
// package.json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:e2e": "jest --testPathPattern=e2e"
  }
}
```

**15. 테스트 문서화**
- 각 테스트에 명확한 설명
- 복잡한 로직에 주석 추가
- README에 테스트 실행 방법

**16. Lessons Learned 연동**
```javascript
// Critical 기능은 반드시 테스트
// .claude/lessons-learned.md의 CRITICAL 항목 확인

describe('CRITICAL: Gemini Model', () => {
  test('gemini-2.5-flash-lite 모델 존재', () => {
    const models = getGeminiModels();
    expect(models.find(m => m.value === 'gemini-2.5-flash-lite')).toBeDefined();
  });

  test('기본 모델로 설정됨', () => {
    const defaultModel = getDefaultModel();
    expect(defaultModel.value).toBe('gemini-2.5-flash-lite');
  });
});
```

**17. 성능 테스트**
```javascript
test('Fuzzy matching은 1000개 필드에서 100ms 이내', () => {
  const start = Date.now();

  const fields = Array(1000).fill(null).map((_, i) => ({
    name: `field${i}`,
    label: `Field ${i}`
  }));

  const result = findBestMatchingField('field500', fields);

  const duration = Date.now() - start;
  expect(duration).toBeLessThan(100);
  expect(result).toBeDefined();
});
```

**18. 테스트 검증**
```bash
# 모든 테스트 실행
npm test

# 검증 스크립트와 함께 실행
npm run verify-all && npm test
```

## Chrome Extension 테스트 체크리스트

**Manifest V3:**
- [ ] Service worker 생명주기 테스트
- [ ] Permissions 변경 시 재설치 테스트
- [ ] Content Security Policy 준수

**Message Passing:**
- [ ] chrome.runtime.sendMessage 응답 처리
- [ ] window.postMessage origin 검증
- [ ] 메시지 손실 처리

**Storage:**
- [ ] chrome.storage.local 읽기/쓰기
- [ ] 용량 제한 초과 처리
- [ ] 동기화 충돌 해결

**UI Testing:**
- [ ] Popup 렌더링
- [ ] Content script DOM 조작
- [ ] Sidebar iframe 통신

## 출력 형식

```
📝 테스트 작성 완료

**작성된 테스트:**
- ✅ unit/fuzzy-matching.test.js (8 tests)
- ✅ unit/metadata-filter.test.js (5 tests)
- ✅ integration/n8n-api.test.js (6 tests)
- ✅ e2e/auto-fill.test.js (3 tests)

**테스트 커버리지:**
- Overall: 85%
- Critical 기능: 100%
- Statements: 842/990
- Branches: 156/210
- Functions: 98/115

**실행 방법:**
npm test                    # 전체 테스트
npm test -- fuzzy-matching  # 특정 테스트
npm run test:coverage       # 커버리지 포함
npm run test:e2e           # E2E 테스트만

**다음 단계:**
- [ ] CI/CD 파이프라인 통합
- [ ] 성능 테스트 추가
- [ ] Visual regression 테스트
```

**핵심 원칙: 비즈니스 로직을 우선적으로 테스트하고, Critical 기능은 100% 커버리지를 목표로 합니다.**
