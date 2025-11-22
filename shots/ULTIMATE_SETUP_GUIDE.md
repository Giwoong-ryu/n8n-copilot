# 🚀 Shorts Ultimate TrendMaster - 완벽 설정 가이드

> **버전**: COMPLETE (LangChain 기반 최신 OpenAI 노드)  
> **마지막 업데이트**: 2025-11-22  
> **파일**: `Shorts_UltimateTrendMaster_COMPLETE.json`

---

## 📋 목차

1. [시스템 개요](#시스템-개요)
2. [필수 준비사항](#필수-준비사항)
3. [단계별 설정](#단계별-설정)
4. [비용 분석](#비용-분석)
5. [테스트 및 검증](#테스트-및-검증)
6. [문제 해결](#문제-해결)

---

## 🎯 시스템 개요

### 핵심 기능

1. **채널 기반 Outlier 감지**: 특정 건강 채널에서 급상승 영상 자동 탐지
2. **AI 트렌드 분석**: GPT-4o-mini로 바이럴 요소, 구조, 감정 곡선 분석
3. **보람이 대본 생성**: 시니어 맞춤형 6문장 스크립트 자동 생성
4. **멀티미디어 생성**: DALL-E 3 이미지 + TTS 오디오
5. **자동 업로드**: YouTube Shorts 자동 업로드 + 원본 참조 기록

### 워크플로우 구조 (24개 노드)

```
[1. 스케줄러] → [2-6. 트렌드 감지] → [7-9. 자막 추출] 
→ [10-12. GPT 분석] → [13. 대본 분할] 
→ [14-15. 이미지/오디오] → [16-18. 백업/병합] 
→ [19-22. 렌더링/검증] → [23-24. 업로드/로깅]
```

---

## 🔧 필수 준비사항

### API 키 발급

| API | 용도 | 비용 | 발급 위치 |
|-----|------|------|-----------|
| **OpenAI** | GPT-4o-mini, DALL-E 3, TTS | $0.448/영상 | [platform.openai.com](https://platform.openai.com) |
| **YouTube Data API v3** | 채널 검색, 통계 | 무료 (10,000 quota/day) | [Google Cloud Console](https://console.cloud.google.com) |
| **Creatomate** | 영상 렌더링 | $0.20/영상 | [creatomate.com](https://creatomate.com) |
| **Google Drive** | 백업 저장 | 무료 | OAuth 인증 |
| **Google Sheets** | 로깅 | 무료 | OAuth 인증 |

### N8N 환경

- **버전**: v1.0 이상 (LangChain 노드 지원)
- **노드 패키지**: `@n8n/n8n-nodes-langchain` 설치 필수
- **실행 환경**: Self-hosted 또는 n8n Cloud

---

## 📖 단계별 설정

### STEP 1: N8N 크레덴셜 설정

N8N 워크플로우에서 5개 크레덴셜을 설정하세요.

#### 1.1 OpenAI API

```yaml
Type: OpenAI
API Key: sk-proj-...
```

#### 1.2 YouTube OAuth2

```yaml
Type: YouTube OAuth2 API
Auth Type: OAuth2
Scopes: 
  - https://www.googleapis.com/auth/youtube
  - https://www.googleapis.com/auth/youtube.upload
```

#### 1.3 Google Sheets OAuth2

```yaml
Type: Google Sheets OAuth2 API  
Auth Type: OAuth2
Scopes:
  - https://www.googleapis.com/auth/spreadsheets
```

#### 1.4 Google Drive OAuth2

```yaml
Type: Google Drive OAuth2 API
Auth Type: OAuth2
Scopes:
  - https://www.googleapis.com/auth/drive.file
```

#### 1.5 Creatomate HTTP Header Auth

```yaml
Type: HTTP Header Auth
Header Name: Authorization
Value: Bearer YOUR_CREATOMATE_API_KEY
```

---

### STEP 2: JSON 파일 수정

`Shorts_UltimateTrendMaster_COMPLETE.json` 파일을 열어서 다음을 **전체 찾기 및 바꾸기**하세요:

#### 2.1 YouTube API Key (2곳)

```json
// 찾기
"YOUR_YOUTUBE_API_KEY"

// 바꾸기
"AIzaSy..."
```

**위치**:
- 노드 3: "3. 채널별 최근 1주 영상"
- 노드 4: "4. 통계 수집"

#### 2.2 타겟 채널 설정 (노드 2)

노드 2 ("2. 타겟 채널 리스트")의 `jsCode`를 수정:

```javascript
const targetChannels = [
  { id: 'UC...실제채널ID1', name: '건강박사TV', avgViews: 10000 },
  { id: 'UC...실제채널ID2', name: '시니어건강연구소', avgViews: 15000 },
  { id: 'UC...실제채널ID3', name: '실버라이프', avgViews: 8000 },
  { id: 'UC...실제채널ID4', name: '할머니건강비법', avgViews: 12000 },
  { id: 'UC...실제채널ID5', name: '노년건강', avgViews: 9000 }
];
```

**채널 ID 찾는 방법**:
1. YouTube 채널 페이지 접속
2. URL 확인: `youtube.com/channel/UC...` 또는 `youtube.com/@username`
3. `@username` 형식이면 페이지 소스에서 `channelId` 검색

**avgViews 설정**:
- 채널의 최근 10개 영상 평균 조회수
- 정확하지 않아도 됨 (노드 5에서 자동 재계산)

#### 2.3 Google Sheet ID (2곳)

```json
// 찾기
"YOUR_GOOGLE_SHEET_ID"

// 바꾸기
"1AbC...실제시트ID"
```

**Sheet ID 찾는 방법**:
- URL: `https://docs.google.com/spreadsheets/d/1AbC...시트ID.../edit`

**시트 구조** (첫 행):

| date | our_topic | our_video_id | our_video_url | original_video_id | original_title | original_channel | original_views | outlier_score | status |
|------|-----------|--------------|---------------|-------------------|----------------|------------------|----------------|---------------|--------|

#### 2.4 Google Drive Folder ID (2곳)

```json
// 찾기
"YOUR_DRIVE_FOLDER_ID"

// 바꾸기
"1XyZ...실제폴더ID"
```

**Folder ID 찾는 방법**:
- Drive 폴더 열기
- URL: `https://drive.google.com/drive/folders/1XyZ...폴더ID`

#### 2.5 Creatomate Template ID

```json
// 찾기
"YOUR_CREATOMATE_TEMPLATE_ID"

// 바꾸기
"abc123-..."
```

---

### STEP 3: Creatomate 템플릿 생성

#### 3.1 템플릿 구조

Creatomate에서 다음 레이어를 가진 템플릿 생성:

**이미지 레이어 (6개)**:
- `Image-1`, `Image-2`, `Image-3`, `Image-4`, `Image-5`, `Image-6`
- Type: Image
- Duration: 10초씩

**오디오 레이어 (6개)**:
- `Audio-1`, `Audio-2`, `Audio-3`, `Audio-4`, `Audio-5`, `Audio-6`
- Type: Audio
- Sync: 해당 이미지와 동기화

**자막 레이어 (6개)**:
- `Subtitle-1`, `Subtitle-2`, `Subtitle-3`, `Subtitle-4`, `Subtitle-5`, `Subtitle-6`
- Type: Text
- Font: 나눔고딕 Bold 48px
- Position: 하단 중앙
- Background: 반투명 검정 (80%)

#### 3.2 템플릿 설정

```json
{
  "width": 1080,
  "height": 1920,
  "frameRate": 30,
  "duration": 60,
  "output_format": "mp4"
}
```

#### 3.3 Template ID 확인

Creatomate 대시보드 → Templates → 생성한 템플릿 클릭 → ID 복사

---

### STEP 4: OpenAI 노드 프롬프트 확인

**⚠️ 중요**: LangChain 노드 구조 (`@n8n/n8n-nodes-langchain.openAi` v2)

#### 노드 10: GPT 트렌드 분석

N8N UI에서 확인할 구조:

```
Model ID: gpt-4o-mini (리스트에서 선택)

Responses:
  - Role: system
    Content: "당신은 유튜브 쇼츠 트렌드 분석 전문가입니다..."
  
  - Role: user  
    Content: ={{ '제목: ' + $json.title + ... }}

Options:
  - Response Format: json_object
```

#### 노드 11: 주제 재해석

```
Model ID: gpt-4o-mini

Responses:
  - Role: system
    Content: "당신은 유튜브 쇼츠 각색 전문가입니다..."
  
  - Role: user
    Content: ={{ '원본 제목: ' + ... }}
```

#### 노드 12: 슈퍼 보람이 대본 생성

```
Model ID: gpt-4o-mini

Responses:
  - Role: system
    Content: "당신은 '슈퍼 보람이' 대본 생성 AI입니다..."
  
  - Role: user
    Content: ={{ '원본 분석:' + ... }}
```

**💡 팁**: JSON 파일을 import하면 프롬프트가 자동으로 설정됩니다!

---

### STEP 5: 이미지 & 오디오 노드 설정

#### 노드 14: DALL-E 이미지

```
Resource: image
Prompt: ={{ 'Pixar style 3D animation, cute 5-year-old Korean girl...' }}

Options:
  - Size: 1024x1024
  - Quality: standard
```

#### 노드 15: TTS 오디오

```
Resource: audio
Text: ={{ $json.sentence }}

Options:
  - Model: tts-1-hd
  - Voice: nova
  - Speed: 0.85
```

---

## 💰 비용 분석

### 영상 1개당 비용 (GPT-4o-mini 사용)

| 항목 | 수량 | 단가 | 비용 |
|------|------|------|------|
| **GPT-4o-mini** (트렌드 분석) | 1회 | $0.00023 | $0.00023 |
| **GPT-4o-mini** (주제 재해석) | 1회 | $0.00023 | $0.00023 |
| **GPT-4o-mini** (대본 생성) | 1회 | $0.00024 | $0.00024 |
| **DALL-E 3** (이미지) | 6개 | $0.040 | $0.240 |
| **TTS-1-HD** (오디오) | 6개 | $0.001 | $0.006 |
| **Creatomate** (렌더링) | 1회 | $0.20 | $0.20 |
| **YouTube API** (검색/통계) | ~35쿼리 | 무료 | $0 |
| | | **Total** | **$0.447** |

### 월간 비용 추정

| 실행 주기 | 영상/월 | 월 비용 |
|-----------|---------|---------|
| 6시간마다 (권장) | 120개 | $53.64 |
| 12시간마다 | 60개 | $26.82 |
| 24시간마다 | 30개 | $13.41 |

### YouTube API Quota 계산

**일일 Quota**: 10,000

**1회 실행당 사용**:
- 채널 검색 (5채널): 5 × 100 = 500
- 통계 조회 (50영상): 50 × 1 = 50
- **Total**: ~550 quota

**최대 실행 가능**: 18회/일 (10,000 ÷ 550)

---

## 🧪 테스트 및 검증

### 초기 테스트 단계

#### 1단계: 개별 노드 테스트

각 노드를 수동으로 실행하며 출력 확인:

1. **노드 1-6**: 트렌드 감지
   - 이상치가 최소 1개 이상 발견되는지 확인
   
2. **노드 7-9**: 자막 추출
   - 자막이 성공적으로 파싱되는지 확인
   
3. **노드 10-12**: GPT 분석
   - JSON 응답이 올바른 형식인지 확인
   
4. **노드 13**: 대본 분할
   - 정확히 6개 문장으로 나뉘는지 확인
   
5. **노드 14-15**: 이미지/오디오
   - 생성 성공 여부 확인

#### 2단계: 전체 플로우 테스트

1. N8N에서 "Execute Workflow" 클릭
2. 각 노드 실행 상태 모니터링
3. 최종 YouTube 업로드 확인

#### 3단계: 자동 실행 활성화

1. 워크플로우 우측 상단 "Active" 토글 ON
2. 6시간 후 자동 실행 확인
3. Google Sheets 로그 확인

---

## 🔥 문제 해결

### 문제 1: "Message a model" 노드 업데이트 필요

**증상**:
```
New node version available: get the latest version 
with added features from the nodes panel.
```

**해결**:
1. N8N 업데이트: `npm install n8n@latest`
2. 또는 노드 패널에서 "Update" 클릭

---

### 문제 2: 이상치가 발견되지 않음

**증상**:
```
Error: 이상치가 발견되지 않았습니다. 다음 실행을 기다립니다.
```

**원인**: 모니터링 채널의 영상이 평균 대비 2배 이상 조회수를 기록하지 못함

**해결**:
1. 노드 5의 `isOutlier` 기준을 `2.0`에서 `1.5`로 낮춤
2. 또는 더 활발한 채널로 변경

---

### 문제 3: 자막 추출 실패

**증상**: 노드 9에서 "자막을 파싱할 수 없습니다" 에러

**원인**: 
- 영상에 한국어 자막 없음
- YouTube 내부 API 변경

**해결**:
1. 자막 언어 변경: `&lang=ko` → `&lang=en`
2. 또는 노드 8의 IF 조건을 수정하여 자막 없는 영상 스킵

---

### 문제 4: GPT 응답 파싱 오류

**증상**: 노드 13에서 `$json.toString()` 오류

**원인**: LangChain 노드의 응답 구조가 다름

**해결**:
노드 13의 `jsCode` 수정:

```javascript
// 기존
const script = $json.toString();

// 수정
const script = typeof $json === 'string' ? $json : JSON.stringify($json);
```

---

### 문제 5: Creatomate 렌더링 실패

**증상**: 노드 19에서 400 에러

**원인**: 
- 템플릿 레이어 이름 불일치
- URL이 만료됨

**해결**:
1. Creatomate 템플릿에서 정확한 레이어 이름 확인
2. Google Drive 링크 권한을 "Anyone with the link" 로 변경

---

### 문제 6: YouTube 업로드 실패

**증상**: 노드 23에서 403 Forbidden

**원인**: YouTube OAuth 스코프 부족

**해결**:
Google Cloud Console에서 OAuth 스코프 추가:
```
https://www.googleapis.com/auth/youtube.upload
https://www.googleapis.com/auth/youtube.force-ssl
```

---

## 📊 성능 최적화

### 1. API 비용 절감

**현재 구조 (2-Stage Filtering)**:
- Stage 1: 50개 영상 메타데이터 조회
- Stage 2: Top 5만 자막 + GPT 분석

**절감 효과**:
- YouTube API: 93% 절감 (750 → 550 quota)
- GPT 비용: 90% 절감 (10회 → 1회)

### 2. 실행 주기 조정

| 주기 | 장점 | 단점 |
|------|------|------|
| **6시간** (권장) | 트렌드 빠르게 포착 | 비용 높음 |
| **12시간** | 균형 | - |
| **24시간** | 비용 낮음 | 트렌드 놓칠 수 있음 |

### 3. 채널 선정 전략

**좋은 채널**:
- 꾸준히 쇼츠 업로드 (주 3회 이상)
- 조회수 변동폭이 큼 (viral 가능성)
- 건강/시니어 관련 콘텐츠

**피해야 할 채널**:
- 업로드 빈도 낮음
- 조회수가 일정함 (viral 없음)

---

## 🎓 고급 설정

### 동적 Outlier 임계값

노드 5 수정:

```javascript
// 기존: 고정값
isOutlier: viewRatio >= 2.0

// 고급: 동적 계산
const threshold = expectedAvg < 5000 ? 1.5 : 2.0;
isOutlier: viewRatio >= threshold
```

### Slack 알림 추가

노드 6 이후에 Slack 노드 추가:

```json
{
  "type": "n8n-nodes-base.slack",
  "parameters": {
    "channel": "#shorts-alerts",
    "text": "🔥 급상승 영상 발견!\n{{ $json.title }}\n조회수: {{ $json.viewCount }}"
  }
}
```

### A/B 테스트

두 가지 보람이 스타일을 테스트:

1. 노드 12 복제
2. 프롬프트 변경 (귀여운 vs 진지한)
3. 랜덤 선택 노드 추가
4. Google Sheets에 스타일 기록
5. 조회수 비교

---

## 📝 체크리스트

설정 완료 확인:

- [ ] N8N 업데이트 (v1.0+)
- [ ] OpenAI API Key 발급
- [ ] YouTube Data API 활성화
- [ ] Creatomate 계정 생성
- [ ] Google OAuth 설정 (Sheets + Drive)
- [ ] JSON 파일 플레이스홀더 모두 교체
- [ ] 타겟 채널 5개 설정
- [ ] Creatomate 템플릿 생성 (6+6+6 레이어)
- [ ] Google Sheet 헤더 생성
- [ ] Google Drive 폴더 생성
- [ ] 개별 노드 테스트 완료
- [ ] 전체 플로우 테스트 완료
- [ ] 자동 실행 활성화
- [ ] 비용 모니터링 설정

---

## 🆘 지원 및 문의

- **N8N 공식 문서**: [docs.n8n.io](https://docs.n8n.io)
- **OpenAI API 문서**: [platform.openai.com/docs](https://platform.openai.com/docs)
- **Creatomate 문서**: [creatomate.com/docs](https://creatomate.com/docs)

---

## 🎉 축하합니다!

설정이 완료되었습니다! 이제 시스템이:

1. **6시간마다** 자동으로 실행되어
2. **급상승 트렌드**를 감지하고
3. **AI로 분석**하여
4. **보람이 대본**을 생성하고
5. **영상을 만들어**
6. **YouTube에 업로드**합니다!

**첫 영상**이 업로드되면 Google Sheets를 확인하세요! 📊

---

*Made with ❤️ by SuperGemini*  
*Last Updated: 2025-11-22*
