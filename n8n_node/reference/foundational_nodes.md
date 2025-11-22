# N8N Essential Nodes Guide

> 📅 Created: 2025-11-22  
> 🎯 Purpose: Master 80% of n8n automation with 18 essential nodes

---

## 📖 Overview

이 가이드는 **n8n을 처음 접하거나 핵심만 빠르게 익히고 싶은 분들**을 위해, **80%의 자동화를 마스터할 수 있는 가장 중요한 18가지 노드**를 선별하여 정리했습니다.

### 🎯 학습 목표

- 복잡한 설정이나 불필요한 이론 건너뛰기
- 트리거, 데이터 변환, AI 에이전트, 외부 API 연동 등 실무 핵심 마스터
- 데이터 처리부터 AI 에이전트 구축까지 실질적인 워크플로우 구축

### 📊 노드 카테고리

| 카테고리 | 노드 수 | 주요 용도 |
|---------|--------|----------|
| **Triggers** | 4 | 워크플로우 시작점 정의 |
| **Logic & Flow Control** | 3 | 조건부 분기 및 흐름 제어 |
| **Data Transformation** | 6 | 데이터 변환 및 준비 |
| **AI & Automation** | 1 | AI 에이전트 구축 |
| **External Actions** | 4+ | 외부 서비스 연동 |

---

## 1️⃣ Triggers (트리거)

워크플로우의 시작점을 정의하는 노드들입니다.

### 1.1 Manual Trigger (수동 트리거)

**기능**: 수동으로 "Execute Workflow" 버튼을 클릭하여 워크플로우 시작

**사용 시나리오**:
- 테스트 목적으로 즉시 실행
- 다른 트리거 규칙을 건너뛰고 수동 실행
- 필요할 때만 실행하는 워크플로우

**중요성**: ⭐⭐⭐⭐⭐ (모든 워크플로우에 필수)

```
💡 Tip: 테스트 시 가장 먼저 추가하는 노드
```

---

### 1.2 On Chat Message (채팅 메시지 트리거)

**기능**: AI 에이전트와 채팅할 때 사용하는 트리거

**주요 설정**:
- 내부 채팅 창 또는 공개 URL 선택
- 파일 업로드 허용 옵션
- 제목, 부제목, CSS 커스터마이징

**접근 방식**:
1. **Hosted Chat**: URL을 통해 접근 (AI 에이전트 구축 시 가장 많이 사용)
2. **Embedded Chat**: 웹사이트나 앱에 채팅 삽입

**활용 예시**:
```javascript
// 채팅 입력을 OpenAI 노드로 매핑
{{ $json.chatInput }}
```

**중요성**: ⭐⭐⭐⭐⭐ (AI 에이전트 필수)

---

### 1.3 On Form Submission (폼 제출 트리거)

**기능**: 한 번만 입력을 받고 워크플로우 시작

**폼 설정**:
- 제목, 설명 설정
- 질문 유형: 텍스트, 숫자, 라디오, 체크박스, 파일 등
- 필수 필드 지정
- 버튼 레이블 변경

**응답 시점**:
1. 폼 제출 즉시 응답 (접수 확인)
2. 워크플로우 완료 후 결과 표시

**URL 관리**:
- **Test URL**: 개발 시 사용
- **Production URL**: 활성화 후 사용

**사용 예시**:
```
게시물 생성: 사용자에게 원시 주제 입력받기
파일 업로드: 여러 파일 한 번에 받기
```

**중요성**: ⭐⭐⭐⭐⭐ (입력 수집 필수)

---

### 1.4 Webhook (웹훅)

**기능**: n8n을 다른 플랫폼과 연결하는 게이트웨이

**주요 설정**:
- **Method**: GET (정보 검색) / POST (정보 쓰기)
- **Path**: 웹훅 경로 지정
- **Authentication**: 보안 설정
- **Response**: 응답 시점 설정

**결과 반환**:
```javascript
// Respond to Webhook 노드 사용
{
  "status": "success",
  "data": "{{ $json.result }}"
}
```

**사용 시나리오**:
- 다른 플랫폼이 n8n 워크플로우 호출
- AI 음성 에이전트와 연동
- 프론트엔드 앱과 통신

**중요성**: ⭐⭐⭐⭐ (외부 연동 필수)

---

## 2️⃣ Logic & Flow Control (로직 및 흐름 제어)

의사 결정 시 필요한 노드들입니다.

### 2.1 IF Node (조건 분기)

**기능**: True/False에 따라 두 갈래로 분기

**구조**:
- True 분기
- False 분기

**조건 설정**:
```javascript
// 예시: 게시물 유형 확인
{{ $json.postType }} === "LinkedIn"
```

**지원 연산자**:
- 등호: `=`, `!=`
- 비교: `>`, `<`, `>=`, `<=`
- 문자열: `contains`, `starts with`, `ends with`
- 상태: `is empty`, `is not empty`
- 날짜: `is before`, `is after`
- 불리언: `true`, `false`

**사용 예시**:
```
LinkedIn 게시물이면 → LinkedIn 로직
아니면 → YouTube 로직
```

**중요성**: ⭐⭐⭐⭐⭐ (조건부 실행 필수)

---

### 2.2 Switch Node (다중 분기)

**기능**: 4~5개 이상의 옵션을 처리할 때 사용

**설정**:
```javascript
// 배열 데이터 처리
{{ $json.platforms }}.includes("LinkedIn")
```

**주요 옵션**:
- **Send data to all matching outputs**: 여러 분기 동시 실행
- **Convert Types**: 데이터 타입 자동 변환
- **Case-sensitive**: 대소문자 구분

**출력 이름 변경**:
```
Output 0 → "LinkedIn"
Output 1 → "YouTube"
Output 2 → "Instagram"
```

**중요성**: ⭐⭐⭐⭐ (다중 조건 처리)

---

### 2.3 Wait Node (대기)

**기능**: 워크플로우에 지연 시간 도입

**설정**:
- 분, 시간, 일 단위 지연
- 예: 1분, 30초, 2시간

**사용 시나리오**:
```
API 속도 제한 방지:
이미지 생성 → 20초 대기 → 다음 이미지 생성

순차 처리:
이메일 발송 → 5분 대기 → 팔로업 이메일
```

**중요성**: ⭐⭐⭐⭐ (API 제한 회피)

---

## 3️⃣ Data Transformation (데이터 변환)

데이터를 변환하거나 준비하는 핵심 노드들입니다.

### 3.1 Split Out (분할)

**기능**: 리스트를 개별 아이템으로 분리

**사용 예시**:
```
입력: 1개 아이템 (파일 3개 포함)
[file1, file2, file3]

Split Out 후:
아이템 1: file1
아이템 2: file2
아이템 3: file3
```

**활용**:
```javascript
// 파일 배열 분할
{{ $json.files }}
```

**다음 노드 실행**: 3번 실행 (각 파일마다)

**중요성**: ⭐⭐⭐⭐⭐ (배열 처리 필수)

---

### 3.2 Aggregate (취합)

**기능**: 여러 아이템을 하나로 합침 (Split Out의 반대)

**사용 예시**:
```
입력: 3개 아이템
아이템 1: result1
아이템 2: result2
아이템 3: result3

Aggregate 후:
1개 아이템: [result1, result2, result3]
```

**설정**:
```javascript
// 취합할 필드 지정
Field to aggregate: "fileName"
```

**활용**:
```
3번 실행된 결과 → 이메일 1통만 발송
```

**중요성**: ⭐⭐⭐⭐ (결과 통합)

---

### 3.3 Edit Fields (필드 편집/설정)

**기능**: 필드 이름 변경 또는 새 필드 생성

**필드 이름 변경**:
```
Old: upload_invoices_0
New: invoice_one
```

**새 필드 생성**:
```javascript
// 현재 타임스탬프
Field: current_timestamp
Value: {{ $now.toISO() }}

// 계산된 값
Field: total_price
Value: {{ $json.quantity * $json.price }}
```

**중요성**: ⭐⭐⭐⭐⭐ (데이터 준비 필수)

---

### 3.4 Filters (필터)

**기능**: 조건을 만족하는 데이터만 통과

**조건 설정**:
```javascript
// AND 조건
{{ $json.fileName }}.contains("7617")
AND
{{ $json.fileType }} === "pdf"

// OR 조건
{{ $json.status }} === "active"
OR
{{ $json.priority }} === "high"
```

**동작**:
- 조건 만족: 다음 노드로 전달
- 조건 불만족: 폐기 (Discard)

**중요성**: ⭐⭐⭐⭐ (데이터 정제)

---

### 3.5 Code Node (코드 실행)

**기능**: JavaScript 또는 Python 코드 실행

**지원 언어**:
- JavaScript (주로 사용)
- Python

**사용 예시**:
```javascript
// JavaScript 예시
const items = $input.all();
return items.map(item => ({
  json: {
    ...item.json,
    processed: true,
    timestamp: new Date().toISOString()
  }
}));
```

**활용**:
- n8n 노드만으로 어려운 데이터 조작
- 복잡한 계산 로직
- 커스텀 데이터 변환

**AI 도움**:
```
코드를 모를 경우 ChatGPT/Claude에게 요청:
"n8n Code 노드에서 배열의 중복 제거하는 코드 작성해줘"
```

**중요성**: ⭐⭐⭐⭐ (고급 변환)

---

### 3.6 Convert to File (파일 변환)

**기능**: 데이터를 파일 형식으로 변환

**변환 옵션**:
- CSV
- JSON
- Text
- XLS
- **Base64 to File** (가장 많이 사용)

**주요 사용**:
```javascript
// AI 이미지 API 결과를 파일로 변환
Binary data (Base64) → Image file (PNG/JPG)
```

**반대 기능**:
- **Extract from File**: CSV/PDF에서 데이터 추출

**주의**:
```
PDF 추출 시 텍스트만 추출됨
이미지 OCR 기능은 제공되지 않음
```

**중요성**: ⭐⭐⭐⭐ (파일 처리)

---

## 4️⃣ AI & Automation (AI 자동화)

### 4.1 AI Agent (AI 에이전트)

**기능**: AI 에이전트 구축의 핵심 노드

**프롬프트 구성**:

1. **User Message** (사용자 메시지)
```javascript
// 변수 정보만 전달
{{ $json.chatInput }}
```

2. **System Message** (시스템 메시지)
```
당신은 [역할]입니다.

수행 작업:
1. [작업 1]
2. [작업 2]
3. [작업 3]

방법:
- [방법 1]
- [방법 2]

출력 형식:
JSON 형식으로 응답하세요.
```

**채팅 모델 (LLM)**:
- OpenAI (GPT-4, GPT-3.5)
- Claude (Sonnet, Opus)
- Gemini
- 기타 LLM

**메모리 (Memory)**:
```
마지막 10개 대화 기억
→ 이전 질문에 대한 답변 가능
```

**도구 (Tools)**:
```
Google Sheets 노드 추가:
- 계정 연결
- Append Row 액션
- 매직 버튼으로 동적 값 설정
```

**예시 (Google Sheets 도구)**:
```javascript
// AI가 동적으로 결정
Spreadsheet Title: {{ AI가 생성 }}
Sheet Name: {{ 오늘 날짜 + "일일 보고서" }}
```

**중요성**: ⭐⭐⭐⭐⭐ (AI 에이전트 필수)

**추가 학습**: 별도 AI Agent 심화 비디오 참고

---

## 5️⃣ External Actions (외부 연동)

### 5.1 HTTP Request (외부 API 연동)

**기능**: n8n에 없는 서비스도 API로 직접 연동

**수행 가능 작업**:
- 데이터 가져오기 (GET)
- 데이터 보내기 (POST)
- 읽기, 쓰기, 업데이트, 삭제

**정보 출처**:
```
해당 서비스의 API 문서
→ 메서드, URL, 헤더, 바디 등 복사
→ n8n에 붙여넣기
```

**OpenAI API 연동 예시**:
```javascript
// 1. OpenAI API 문서에서 복사
Method: POST
URL: https://api.openai.com/v1/images/generations
Headers: {
  "Authorization": "Bearer YOUR_API_KEY",
  "Content-Type": "application/json"
}
Body: {
  "prompt": "cute kitten",
  "n": 1,
  "size": "1024x1024"
}

// 2. n8n에 붙여넣기
// 3. API 키만 자신의 것으로 교체
```

**중요성**: ⭐⭐⭐⭐⭐ (필수 스킬)

**실무 활용**:
```
클라이언트 CRM/ERP가 n8n에 없을 때
→ API 문서 참고하여 직접 연동
```

---

## 📊 노드 중요도 요약

| 노드 | 중요도 | 사용 빈도 | 난이도 |
|------|--------|----------|--------|
| Manual Trigger | ⭐⭐⭐⭐⭐ | 매우 높음 | 쉬움 |
| On Chat Message | ⭐⭐⭐⭐⭐ | 높음 | 보통 |
| On Form Submission | ⭐⭐⭐⭐⭐ | 높음 | 쉬움 |
| Webhook | ⭐⭐⭐⭐ | 보통 | 어려움 |
| IF | ⭐⭐⭐⭐⭐ | 매우 높음 | 쉬움 |
| Switch | ⭐⭐⭐⭐ | 높음 | 보통 |
| Wait | ⭐⭐⭐⭐ | 높음 | 쉬움 |
| Split Out | ⭐⭐⭐⭐⭐ | 매우 높음 | 보통 |
| Aggregate | ⭐⭐⭐⭐ | 높음 | 보통 |
| Edit Fields | ⭐⭐⭐⭐⭐ | 매우 높음 | 쉬움 |
| Filters | ⭐⭐⭐⭐ | 높음 | 쉬움 |
| Code | ⭐⭐⭐⭐ | 보통 | 어려움 |
| Convert to File | ⭐⭐⭐⭐ | 높음 | 보통 |
| AI Agent | ⭐⭐⭐⭐⭐ | 매우 높음 | 어려움 |
| HTTP Request | ⭐⭐⭐⭐⭐ | 매우 높음 | 어려움 |

---

## 🎯 학습 로드맵

### Week 1: 기초 (Triggers + Logic)
```
Day 1-2: Manual Trigger, On Form Submission
Day 3-4: IF, Switch
Day 5-7: 간단한 워크플로우 만들기
```

### Week 2: 데이터 변환
```
Day 1-2: Split Out, Aggregate
Day 3-4: Edit Fields, Filters
Day 5-7: 데이터 처리 워크플로우 만들기
```

### Week 3: AI & 외부 연동
```
Day 1-3: AI Agent 기초
Day 4-5: HTTP Request
Day 6-7: AI 에이전트 구축
```

### Week 4: 실전 프로젝트
```
Day 1-7: 실제 비즈니스 문제 해결
- 리드 생성 자동화
- 콘텐츠 생성 자동화
- 데이터 처리 자동화
```

---

## 💡 Best Practices

### 1. 데이터 변환
- **Edit Fields** 사용: 간단한 변환
- **Code 노드** 사용: 복잡한 로직
- 항상 데이터 타입 검증

### 2. 에러 핸들링
- **IF** 노드로 에러 체크
- **Error Trigger** 사용
- 에러 로그를 Google Sheets/Slack으로 전송

### 3. 성능 최적화
- **Loop Over Items** 배치 크기 조정
- **Wait** 노드로 API 제한 회피
- **Aggregate**로 API 호출 최소화

### 4. 디버깅
- **Edit Fields**로 디버그 플래그 추가
- 실행 로그 확인
- **Manual Trigger**로 테스트

---

## 🔗 추가 리소스

- [n8n 공식 문서](https://docs.n8n.io/)
- [n8n 커뮤니티](https://community.n8n.io/)
- [YouTube 튜토리얼](https://www.youtube.com/@n8n-io)

---

*Documentation by Yashika Jain (Automates AI)*  
*Translated and expanded by AI Assistant*  
*Last updated: 2025-11-22*
