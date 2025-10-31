# 🗺️ 개발 로드맵

## 전체 개요

```
Phase 1: PoC        ✅ 완료 (2025-10-23 ~ 10-30)
Phase 2: MVP        🔥 진행중 (2025-11-01 ~ 11-22)
Phase 3: Pro        ⏭️ 예정 (2025-11-23 ~ 2026-01-15)
Phase 4: Universal  🌍 비전 (2026년 이후)
```

---

## Phase 2: MVP 개발 (3주)

### Week 1: 기술 안정화 (2025-11-01 ~ 11-08)

#### 🎯 목표
Extension이 N8N에서 완벽하게 작동

#### 📋 작업 목록

**Day 1-2: CORS 해결**
```javascript
// background.js
- [ ] Claude API 호출 함수 구현
- [ ] chrome.runtime.onMessage 리스너 추가
- [ ] 에러 처리 로직

// content.js  
- [ ] 직접 API 호출 코드 제거
- [ ] chrome.runtime.sendMessage로 변경
- [ ] 응답 처리 개선

// manifest.json
- [ ] host_permissions 확인
- [ ] permissions 점검
```

**Day 3-4: UI 개선**
```
popup.html:
- [ ] 메인 화면 HTML 구조
- [ ] 사용량 표시 UI
- [ ] 설정 화면 레이아웃

popup.js:
- [ ] showMainScreen() 구현
- [ ] 화면 전환 로직
- [ ] API 키 검증

sidebar.css:
- [ ] 반응형 디자인
- [ ] 다크모드 지원 (선택)
```

**Day 5-7: 테스트 & 버그 수정**
```
테스트 시나리오:
1. [ ] 설치 → 인증 → 메인 화면 진입
2. [ ] N8N 페이지 → 사이드바 열림
3. [ ] 메시지 전송 → AI 응답 수신
4. [ ] 자동 입력 버튼 → N8N 필드 채워짐
5. [ ] 에러 발생 → 적절한 메시지 표시

버그 수정:
- [ ] 콘솔 에러 0건
- [ ] 메모리 누수 확인
- [ ] 퍼포먼스 최적화
```

#### 📊 Week 1 완료 기준
- [ ] CORS 에러 완전 해결
- [ ] 테스트 시나리오 5개 모두 통과
- [ ] 에러 처리 완료
- [ ] 코드 정리 및 주석 추가

---

### Week 2: AI 기능 강화 (2025-11-09 ~ 11-15)

#### 🎯 목표
더 정확하고 유용한 AI 응답 제공

#### 📋 작업 목록

**컨텍스트 수집 개선**
```javascript
// content.js - N8NController

getFullWorkflow() {
  // 전체 워크플로우 구조 파악
  - [ ] 모든 노드 목록
  - [ ] 노드 간 연결 관계
  - [ ] 각 노드의 설정값
  - [ ] 변수 정의
}

detectCurrentContext() {
  // 현재 작업 컨텍스트 상세 분석
  - [ ] 선택된 노드 타입
  - [ ] 이전 노드 출력값
  - [ ] 에러 상태
  - [ ] 사용자 입력 내역
}
```

**프롬프트 최적화**
```
노드 타입별 전용 프롬프트:
- [ ] HTTP Request 노드
- [ ] Webhook 노드
- [ ] Function 노드
- [ ] If 노드
- [ ] Set 노드

응답 형식 표준화:
{
  "action": "fill_settings",
  "settings": {...},
  "explanation": "...",
  "nextSteps": [...]
}
```

**OAuth2 자동 설정 (카카오)**
```
기능:
- [ ] 카카오 개발자 사이트 링크 자동 열기
- [ ] Client ID/Secret 입력 가이드
- [ ] Redirect URL 자동 생성
- [ ] 토큰 발급 프로세스 안내

테스트:
- [ ] 실제 카카오 OAuth 완료
- [ ] 에러 케이스 처리
```

#### 📊 Week 2 완료 기준
- [ ] AI 응답 정확도 80%+
- [ ] OAuth2 자동 설정 성공률 90%+
- [ ] 사용자 만족도 조사 (베타 테스터)

---

### Week 3: 웹사이트 & 결제 (2025-11-16 ~ 11-22)

#### 🎯 목표
사용자가 가입하고 결제할 수 있는 웹사이트

#### 📋 작업 목록

**랜딩 페이지**
```
섹션:
- [ ] 히어로 (헤드라인 + CTA)
- [ ] 데모 영상 (30초)
- [ ] 주요 기능 3가지
- [ ] 가격표
- [ ] FAQ
- [ ] Footer

기술 스택:
- Next.js + Tailwind CSS
- Vercel 배포
```

**인증 시스템**
```
Supabase Auth:
- [ ] 구글 로그인 연동
- [ ] 이메일 인증
- [ ] 세션 관리
- [ ] API 키 자동 발급

Database:
- [ ] users 테이블
- [ ] api_keys 테이블
- [ ] usage_logs 테이블
- [ ] subscriptions 테이블
```

**결제 시스템**
```
Stripe 연동:
- [ ] 가격 플랜 설정 (Free/Pro)
- [ ] Checkout Session 생성
- [ ] Webhook 처리 (결제 성공/실패)
- [ ] 구독 관리 페이지

크레딧 시스템:
- [ ] 무료: 10 크레딧
- [ ] Pro: 무제한 (-1)
- [ ] 사용량 추적
- [ ] 소진 알림
```

**Extension ↔ Website 연동**
```
API Endpoints:
- [ ] /api/auth/login
- [ ] /api/generate (Claude API 중계)
- [ ] /api/credits/check
- [ ] /api/credits/use

Extension 수정:
- [ ] API 키로 웹사이트 인증
- [ ] 크레딧 확인 후 AI 요청
- [ ] 소진 시 업그레이드 유도
```

#### 📊 Week 3 완료 기준
- [ ] 웹사이트 라이브 (Vercel)
- [ ] 회원가입 → 결제 → Extension 사용 플로우 완성
- [ ] 5명 실제 사용자 테스트 완료

---

## Phase 3: Pro 기능 (6주)

### 목표
프리미엄 기능으로 경쟁 우위 확보

### 주요 기능

**워크플로우 자동 생성**
```
사용자 입력:
"구글폼 제출되면 슬랙으로 알림 보내기"

AI 출력:
- Google Forms Trigger 노드
- Format Data 노드
- Slack 노드
- 자동 연결
```

**템플릿 라이브러리**
```
카테고리:
- 마케팅 자동화
- 고객 지원
- 데이터 동기화
- 알림/모니터링

기능:
- 커뮤니티 공유
- 평점/리뷰
- 원클릭 설치
```

**다양한 서비스 지원**
```
Phase 3.1 (Week 1-2):
- 네이버 API (OAuth, 검색, 블로그)
- 구글 APIs (Sheets, Gmail, Calendar)

Phase 3.2 (Week 3-4):
- Slack, Discord
- Notion, Airtable

Phase 3.3 (Week 5-6):
- Stripe, PayPal
- AWS, GCP
```

---

## Phase 4: Universal Copilot (비전)

### 컨셉
"모든 웹사이트에서 작동하는 AI 도우미"

### 확장 영역
```
1. 폼 자동 작성
   - 회원가입 (AWS, GCP, Azure)
   - 설정 페이지
   - 신청서/지원서

2. 콘텐츠 작성
   - 이메일 작성
   - 문서 번역
   - 문법 교정

3. 자동화 플랫폼
   - Zapier
   - Make (Integromat)
   - Automate.io
```

### 기술 방향
- 범용 DOM 분석 엔진
- 사이트별 학습 모델
- 크라우드소싱 패턴

---

## 📊 마일스톤 요약

```
✅ 2025-10-30: PoC 완성
🔥 2025-11-08: MVP Week 1 완료
⏭️ 2025-11-15: MVP Week 2 완료
⏭️ 2025-11-22: MVP 출시
⏭️ 2025-12-31: 100명 사용자
⏭️ 2026-03-31: 1,000명 사용자
⏭️ 2026-10-31: 10,000명 사용자
```

---

**다음**: CURRENT_STATUS.md에서 이번 주 작업 확인
