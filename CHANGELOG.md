# Changelog

All notable changes to the N8N AI Copilot project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased] - 2025-11-06

### 📝 문서 업데이트

#### Added
- 최신 작업 현황 리포트 (TODAY_WORK_REPORT.md v2.0)
- 5개 브랜치 구조 설명
- Universal Copilot 아키텍처 문서화
- NPM 패키지 정보 추가

#### Changed
- 프로젝트 구조 재정리
- 완성도 평가 업데이트 (85%)
- 다음 단계 마일스톤 수정

---

## [0.1.0 - Universal] - 2025-11-03

### 🎉 Major Release: Universal Copilot 아키텍처

#### ✨ Added - 새로운 기능

**Core 아키텍처**
- `core/adapters/BaseAdapter.js` (+164 lines)
  - 범용 플랫폼 어댑터 기본 클래스
  - Platform 자동 감지 시스템
  - 표준화된 DOM 인터페이스

- `core/adapters/N8NAdapter.js` (+647 lines)
  - N8N 전용 어댑터 구현
  - 워크플로우 읽기/쓰기 최적화
  - 노드 설정 자동화

- `core/security/SecurityScanner.js` (+415 lines)
  - XSS 공격 방어
  - SQL Injection 감지
  - API 키 검증 시스템
  - 입력 샌드박싱

- `core/universal/DataFlowTracer.js` (+501 lines)
  - 노드 간 데이터 흐름 추적
  - 그래프 구조 분석
  - 경로 탐색 알고리즘

- `core/universal/AdvancedContextCollector.js` (+530 lines)
  - 지능형 컨텍스트 수집
  - 사용자 의도 추론
  - 환경 정보 수집
  - 에러/경고 감지

**Configuration**
- `config/models.js` (+136 lines)
  - Multi-AI 모델 설정
  - OpenAI GPT-4, GPT-3.5
  - Anthropic Claude (Sonnet, Opus)
  - Google Gemini (Flash, Pro)

**새로운 문서**
- `docs/ARCHITECTURE_V2.md` (+646 lines)
  - Universal Copilot 아키텍처 설계
  - Adapter 패턴 설명
  - 확장 전략

- `docs/DESKTOP_APP_TECH_SPEC.md` (+1,085 lines)
  - 데스크톱 앱 기술 사양
  - Electron 통합 계획

- `docs/MVP_LEAN_APPROACH.md` (+611 lines)
  - MVP 개발 전략
  - Lean 방법론

- `docs/UNIVERSAL_EXPANSION_STRATEGY.md` (+348 lines)
  - 다른 플랫폼 확장 전략
  - Zapier, Make.com 지원 계획

#### 🔄 Changed - 변경사항

**background.js** (372줄 → 746줄, +374줄)
- Multi-AI 모델 지원 추가
- 실시간 노드 정보 매핑 시스템
- Resource/Operation 구조 파싱
- 370+ N8N 노드 정보 자동 수집
- API 호출 최적화

**content.js** (2,143줄 → 1,672줄, -471줄 리팩토링)
- Universal 아키텍처로 리팩토링
- N8NAdapter 통합
- 코드 모듈화 및 정리
- 중복 코드 제거
- 성능 최적화

**sidebar-iframe.js** (463줄 → 764줄, +301줄)
- UI/UX 개선
- 리사이징 기능 추가
- 출력 포맷 개선
- 응답 속도 최적화

**popup.js** (278줄 → 294줄, +16줄)
- AI 모델 선택 UI 추가
- 설정 저장 개선
- 검증 로직 강화

**manifest.json**
- Version: 0.2.3 → 0.1.0 (Universal 전환)
- Core 스크립트 추가
- 권한 최적화
- OpenAI, Claude API 호스트 추가

#### 🐛 Fixed - 버그 수정

- Template literal 문법 오류 수정
- 서비스 워커 의존성 문제 해결
- 노드 타입 중복 fetch 방지
- API 키 저장 문제 수정
- 에러 분석 자동 클릭 및 대기 로직 수정

#### 📊 통계

```
변경된 파일: 22개
추가: +8,093 줄
삭제: -1,588 줄
순증: +6,505 줄
```

---

## [0.2.3] - 2025-11-03

### ✨ Added - API별 인증 감지

- Kakao OAuth2 자동 감지 및 가이드
- Naver OAuth2 자동 감지 및 가이드
- Google OAuth2 자동 감지 및 가이드
- API별 맞춤 에러 메시지

### 🔄 Changed - 에러 출력 개선

- 간결한 원인 분석 (2-3줄)
- 상세한 해결 단계
- 3단계 강화 (원인 → 해결 → 검증)

---

## [0.2.2] - 2025-11-03

### 🐛 Fixed - 에러 분석 수정

- 에러 노드 자동 클릭 기능
- 설정 패널 대기 로직 추가
- 코드 읽기 기능 통합

### ✨ Added - 워크플로우 분석

- 전체 워크플로우 스캔
- 노드 타입 수집
- 사용되는 노드만 선택적 주입 (토큰 절약)

---

## [0.2.1] - 2025-11-03

### ✨ Added - 지능형 에러 패턴 감지

- API 에러 패턴 (401, 403, 404, 500)
- 인증 에러 패턴 (OAuth2, API Key)
- 설정 에러 패턴 (필수 필드 누락)
- 코드 에러 패턴 (Syntax, Reference)

### 🔄 Changed - 시스템 프롬프트 단순화

- 에러 분석 프롬프트 대폭 간소화
- 출력 길이 제한 (3-4줄 최대)
- 삼중 강화 로직

---

## [0.2.0] - 2025-11-03

### 🎉 Major Update

#### ✨ Added

**스마트 컨텍스트 주입**
- 동적 노드 정보 주입
- N8N API에서 노드 타입 자동 수집
- Pinia Store 직접 접근
- 사용되는 노드만 선택적 주입

**워크플로우 기반 컨텍스트**
- 모든 노드 스캔
- 노드 타입 리스트 생성
- 연결 관계 분석

#### 🔄 Changed

**UI/UX 개선**
- 사이드바 리사이징 기능
- 드래그 앤 드롭
- 출력 포맷 개선
- 차원 조정 가능

**스마트 에러 분석**
- 에러 발생 노드 코드 읽기
- 정확한 원인 분석
- 간결한 출력 (2-3줄)

#### 🐛 Fixed

- 템플릿 리터럴 문법 오류
- 노드 타입 중복 fetch
- 콘솔 노이즈 감소

---

## [0.1.0-beta] - 2025-11-02

### 🎉 Beta Release

#### ✨ Added

**Production-Ready 클래스**
- `SafeSelector` 클래스
  - Fallback 선택자 패턴
  - 가시성 검증
  - 요소 검증

- `VueInputWriter` 클래스
  - 6단계 Vue 리액티브 트리거
  - Native setter 사용
  - Vue 인스턴스 직접 업데이트

- `ResilientWriter` 클래스
  - 자동 재시도 (최대 3회)
  - 지수 백오프

**문서화**
- `N8N_DOM_INTEGRATION_GUIDE.md` (874 lines)
  - Vue.js 3 리액티브 시스템 분석
  - N8N 아키텍처 이해
  - Production-ready 구현 패턴

- `CODE_REVIEW_REPORT.md` (686 lines)
  - 16개 이슈 발견
  - 우선순위별 분류
  - 해결책 제시

- `CHANGELOG.md` + `changelog-viewer.html`
  - 변경 로그 자동 생성
  - HTML 뷰어

- `TODAY_WORK_REPORT.md` + `work-report-viewer.html`
  - 작업 리포트
  - HTML 뷰어

#### 🔄 Changed - Quick Wins

**보안 강화**
- Message Event Origin 검증
- 외부 메시지 주입 차단

**메모리 관리**
- MutationObserver cleanup
- Interval cleanup
- beforeunload 이벤트 핸들러

**안정성 개선**
- N8NReader null safety
- 로딩 순서 무관 동작

---

## [0.0.1-alpha] - 2025-10-30

### 🎉 Initial Release - PoC

#### ✨ Added

**Chrome Extension 구조**
- `manifest.json` - Extension 설정
- `content.js` - N8N DOM 조작 핵심 (500줄)
- `background.js` - Claude API 연동 (300줄)
- `sidebar.css` - UI 스타일링
- `popup.html/js` - 설정 화면
- `icons/` - 3개 크기 아이콘

**핵심 기능**

*N8N DOM 읽기*
- `N8NReader` 클래스
  - `getActiveNode()` - 현재 선택된 노드
  - `getSettingsPanel()` - 열린 설정 패널
  - `getInputFields()` - 모든 입력 필드
  - `detectErrors()` - 에러 메시지 감지
  - `getWorkflowStructure()` - 전체 워크플로우

*N8N DOM 쓰기*
- `N8NWriter` 클래스
  - `setFieldValue()` - 필드에 값 쓰기
  - `setJsonEditorValue()` - JSON 에디터 채우기
  - `fillMultipleFields()` - 여러 필드 한 번에
  - `triggerVueUpdate()` - Vue 리액티브 트리거

*AI 기능*
- Background Service Worker
  - `analyzeError()` - 에러 분석 및 해결책
  - `generateJSON()` - JSON 자동 생성
  - `autoFillSettings()` - 설정 자동 채우기

*UI/UX*
- 플로팅 버튼 (우측 하단)
- 슬라이드 사이드바
- 실시간 컨텍스트 표시
- 테스트 액션 버튼
- 결과 JSON 표시

---

## [NPM Package] @giwoong-ryu/n8n-skillset - 2025-11-03

### 🎉 v1.0.0 Release

#### ✨ Features

**6개 스킬 패키지**

1. `n8n-workflow-patterns`
   - 일반적인 워크플로우 패턴
   - 베스트 프랙티스
   - 에러 처리 패턴

2. `n8n-node-configuration`
   - 노드 설정 방법
   - API 연동 가이드
   - OAuth2 설정

3. `n8n-validation-expert`
   - 워크플로우 검증
   - 에러 체크
   - 테스트 전략

4. `n8n-code-javascript`
   - Function 노드 작성
   - JavaScript 코딩 패턴
   - N8N API 활용

5. `n8n-expression-syntax`
   - Expression 문법
   - 데이터 변환
   - 동적 값 생성

6. `n8n-mcp-tools-expert`
   - MCP 도구 활용
   - 외부 시스템 연동
   - 커스텀 노드 개발

#### 📦 Installation

```bash
npm install -g @giwoong-ryu/n8n-skillset
```

#### 🔧 Configuration

```json
{
  "skills": ["@giwoong-ryu/n8n-skillset"]
}
```

---

## Future Plans

### v0.2.0 (계획 중)

#### 🎯 Priority 1: 실제 테스트 (1주)
- Chrome에서 Extension 로드
- N8N 환경에서 실제 테스트
- 버그 발견 및 수정

#### 🎯 Priority 2: 고급 기능 (2주)
- SmartInputWriter (select, checkbox, ACE editor)
- DebugLogger (로컬 스토리지 로깅)
- N8NVersionDetector (버전별 대응)
- SmartFieldMatcher (정교한 필드 매칭)

#### 🎯 Priority 3: 성능 최적화 (1주)
- MutationObserver debounce 최적화
- DOM 쿼리 캐싱
- 메모리 사용량 모니터링

#### 🎯 Priority 4: 테스트 (2주)
- 단위 테스트 (Jest)
- 통합 테스트
- E2E 테스트 (Playwright)

### v1.0.0 (장기 계획)

#### 🚀 Universal Copilot 확장
- Zapier Adapter
- Make.com Adapter
- Automation Anywhere Adapter

#### 💎 고급 AI 기능
- 워크플로우 자동 생성
- 실시간 제안
- 협업 기능

#### 📱 다중 플랫폼
- Desktop App (Electron)
- Mobile App (React Native)

---

## Links

- **Repository**: https://github.com/Giwoong-ryu/n8n-copilot
- **Issues**: https://github.com/Giwoong-ryu/n8n-copilot/issues
- **NPM Package**: https://www.npmjs.com/package/@giwoong-ryu/n8n-skillset
- **Documentation**: https://giwoong-ryu.github.io/n8n-copilot/

---

**Legend**:
- 🎉 Major feature
- ✨ Enhancement
- 🔧 Fix
- 🔒 Security
- 🧹 Maintenance
- 🛡️ Stability
- 📊 Metrics
- 🎯 Roadmap
- 💡 Insight

---

**Last Updated**: 2025-11-06
**Maintained by**: Giwoong Ryu
