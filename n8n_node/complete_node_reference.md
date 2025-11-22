# N8N 전체 노드 레퍼런스 가이드

> 📅 생성일: 2025-11-22  
> 📂 소스: `Shorts_Hybrid_v4_Final.json` + 스크린샷 분석  
> 🎯 완전판: 실제 사용된 모든 노드 포함

---

## 📋 목차

- [워크플로우 전체 구조](#워크플로우-전체-구조)
- [전체 노드 목록 (17개)](#전체-노드-목록-17개)
- [노드별 상세 설정](#노드별-상세-설정)
- [노드 타입별 분류](#노드-타입별-분류)
- [데이터 흐름 맵](#데이터-흐름-맵)
- [API 및 인증 정보](#api-및-인증-정보)

---

## 워크플로우 전체 구조

### 실행 흐름 (14단계 + 3개 숨겨진 노드)

```mermaid
graph TB
    N1[1. 매일 아침 9시 실행] --> N2A[2-A. YouTube Trending 수집]
    N2A --> N2B[2-B. 트렌드 파싱]
    N2B --> N2C[2-C. 트렌드 선정 GPT]
    N2C --> N3[3. 주제 로깅 Sheets]
    N3 --> N4[4. 보람이 대본 작성]
    N4 --> N5[5. 대본 6분할]
    
    N5 --> N6A[6-A. 이미지 생성 DALL-E]
    N5 --> N6B[6-B. 오디오 생성 TTS]
    
    N6A --> N7A[7-A. 이미지 백업 Drive]
    N6B --> N7B[7-B. 오디오 백업 Drive]
    
    N7A --> N8[8. 자산 병합]
    N7B --> N8
    
    N8 --> N9[9. 영상 렌더링 Creatomate]
    N9 --> N10[10. 대기 30초]
    N10 --> N11[11. 영상 다운로드]
    N11 --> N12[12. 영상 검증 >2MB]
    N12 --> N13[13. 유튜브 업로드]
    N13 --> N14[14. 상태 업데이트 Sheets]
    
    style N1 fill:#e8f5e9
    style N2C fill:#fff3e0
    style N4 fill:#fff3e0
    style N6A fill:#f3e5f5
    style N6B fill:#f3e5f5
    style N9 fill:#e1f5fe
    style N13 fill:#ffebee
```

---

## 전체 노드 목록 (17개)

| # | 노드 이름 | 노드 타입 | 버전 | 주요 기능 |
|---|----------|----------|------|----------|
| 1 | 1. 매일 아침 9시 실행 | `scheduleTrigger` | 1.1 | 워크플로우 스케줄 시작 |
| 2 | 2-A. YouTube Trending 수집 | `httpRequest` | 4.2 | YouTube API로 트렌드 데이터 수집 |
| 3 | **2-B. 트렌드 파싱** | `code` | 2 | **JavaScript로 트렌드 데이터 파싱** |
| 4 | **2-C. 트렌드 선정 (GPT)** | `openAi` | 1 | **GPT로 최적 주제 선정** |
| 5 | 3. 주제 로깅 (Sheets) | `googleSheets` | 4.5 | 선정된 주제를 Google Sheets에 기록 |
| 6 | 4. 보람이 대본 작성 | `openAi` | 1 | GPT-4o로 보람이 페르소나 스크립트 생성 |
| 7 | 5. 대본 6분할 | `code` | 2 | JavaScript로 대본을 6개 문장으로 분할 |
| 8 | 6-A. 이미지 생성 (DALL-E) | `openAi` | 1 | DALL-E 3로 각 문장에 맞는 이미지 생성 |
| 9 | 6-B. 오디오 생성 (TTS) | `openAi` | 1 | OpenAI TTS로 음성 생성 (Nova 보이스) |
| 10 | 7-A. 이미지 백업 (Drive) | `googleDrive` | 3 | 생성된 이미지를 Google Drive에 저장 |
| 11 | 7-B. 오디오 백업 (Drive) | `googleDrive` | 3 | 생성된 오디오를 Google Drive에 저장 |
| 12 | 8. 자산 병합 | `merge` | 3 | 이미지와 오디오 데이터를 병합 |
| 13 | 9. 영상 렌더링 (Creatomate) | `httpRequest` | 4.2 | Creatomate API로 최종 비디오 렌더링 |
| 14 | 10. 대기 (30초) | `wait` | 1 | 렌더링 완료 대기 |
| 15 | 11. 영상 다운로드 | `httpRequest` | 4.2 | 렌더링된 비디오 다운로드 |
| 16 | 12. 영상 검증 (>2MB) | `if` | 2 | 비디오 파일 크기 검증 |
| 17 | 13. 유튜브 업로드 | `youTube` | 1 | YouTube에 Shorts 업로드 |
| 18 | 14. 상태 업데이트 (Sheets) | `googleSheets` | 4.5 | 업로드 완료 상태를 Sheets에 업데이트 |

---

## 노드별 상세 설정

### 🟢 1. 매일 아침 9시 실행

**노드 ID**: `trigger-001`  
**타입**: `n8n-nodes-base.scheduleTrigger`  
**버전**: 1.1

#### 설정
```json
{
  "rule": {
    "interval": [
      {
        "field": "hours",
        "hoursInterval": 24
      }
    ]
  }
}
```

#### 용도
- 워크플로우를 24시간마다 자동 실행
- 매일 오전 9시에 트리거 (서버 시간 기준)

#### 위치 좌표
```json
[-2800, 0]
```

---

### 🔵 2-A. YouTube Trending 수집

**노드 ID**: `trend-youtube`  
**타입**: `n8n-nodes-base.httpRequest`  
**버전**: 4.2

#### 설정
```json
{
  "method": "GET",
  "url": "https://www.googleapis.com/youtube/v3/videos",
  "sendQuery": true,
  "queryParameters": {
    "parameters": [
      {
        "name": "part",
        "value": "snippet"
      },
      {
        "name": "chart",
        "value": "mostPopular"
      },
      {
        "name": "regionCode",
        "value": "KR"
      },
      {
        "name": "videoCategoryId",
        "value": "26"
      },
      {
        "name": "maxResults",
        "value": "10"
      },
      {
        "name": "key",
        "value": "YOUR_YOUTUBE_API_KEY"
      }
    ]
  }
}
```

#### API 엔드포인트
- **URL**: `https://www.googleapis.com/youtube/v3/videos`
- **Method**: GET
- **Category**: 26 (Howto & Style)
- **Region**: KR (대한민국)

#### 응답 예시
```json
{
  "items": [
    {
      "id": "video123",
      "snippet": {
        "title": "시니어 건강 운동법",
        "description": "...",
        "tags": ["건강", "운동", "시니어"]
      }
    }
  ]
}
```

---

### ⚙️ 2-B. 트렌드 파싱

**노드 ID**: `parse-trends`  
**타입**: `n8n-nodes-base.code`  
**버전**: 2

> ⚠️ **중요**: 이 노드는 JSON 파일에 정의되지 않았지만, connections에서 참조됨

#### 추정 JavaScript 코드
```javascript
// YouTube API 응답에서 건강 관련 태그만 추출
const items = $json.items || [];
const healthKeywords = ['건강', '운동', '스트레칭', '요가', '명상', '시니어', '노인'];

const parsedTrends = items
  .filter(item => {
    const tags = (item.snippet.tags || []).join(' ').toLowerCase();
    const title = item.snippet.title.toLowerCase();
    return healthKeywords.some(keyword => 
      tags.includes(keyword) || title.includes(keyword)
    );
  })
  .map(item => ({
    title: item.snippet.title,
    tags: item.snippet.tags,
    description: item.snippet.description.substring(0, 200),
    publishedAt: item.snippet.publishedAt
  }));

return { json: { trends: parsedTrends } };
```

#### 용도
- YouTube API 응답 중 건강/시니어 관련 콘텐츠만 필터링
- 다음 GPT 단계를 위한 데이터 정제

---

### 🤖 2-C. 트렌드 선정 (GPT)

**노드 ID**: `select-trend-gpt`  
**타입**: `n8n-nodes-base.openAi`  
**버전**: 1

> ⚠️ **중요**: 이 노드는 JSON 파일에 정의되지 않았지만, connections에서 참조됨

#### 추정 설정
```json
{
  "resource": "chat",
  "model": "gpt-4o",
  "prompt": {
    "messages": [
      {
        "role": "system",
        "content": "당신은 시니어 건강 콘텐츠 전문가입니다. YouTube 트렌드 데이터를 분석하여 60세 이상 시니어에게 가장 도움이 될 주제를 선정하세요."
      },
      {
        "role": "user",
        "content": "={{ '트렌드 데이터: ' + JSON.stringify($json.trends) + '\\n\\n위 데이터에서 시니어 건강 쇼츠에 가장 적합한 주제 1개를 선정하고, 이유를 간단히 설명하세요. 출력 형식: 주제명|이유' }}"
      }
    ]
  }
}
```

#### 프롬프트 구조
**System**:
```
당신은 시니어 건강 콘텐츠 전문가입니다.

선정 기준:
1. 60세+ 시니어에게 실질적 도움
2. 60초 쇼츠 형식에 적합
3. 안전하고 검증된 정보
4. 시각적 표현 가능

출력: "주제명|선정 이유"
```

**User**: 
```
트렌드 데이터: {{ $json.trends }}

위 데이터에서 최적의 주제 1개를 선정하세요.
```

#### 응답 예시
```
앉아서 하는 발목 스트레칭|넘어짐 방지에 효과적이고 의자만 있으면 안전하게 가능
```

---

### 📊 3. 주제 로깅 (Sheets)

**노드 ID**: `sheets-log`  
**타입**: `n8n-nodes-base.googleSheets`  
**버전**: 4.5

#### 설정
```json
{
  "operation": "append",
  "documentId": {
    "__rl": true,
    "value": "YOUR_GOOGLE_SHEET_ID",
    "mode": "id"
  },
  "sheetName": {
    "__rl": true,
    "value": "gid=0",
    "mode": "list"
  },
  "columns": {
    "mappingMode": "defineBelow",
    "value": {
      "topic": "={{ $json.choices[0].message.content }}",
      "status": "planned",
      "video_url": "",
      "created_at": "={{ $now.toISO() }}"
    }
  }
}
```

#### 인증
```json
{
  "googleSheetsOAuth2Api": {
    "id": "qHzPZhMeMIC0bqve",
    "name": "Google Sheets account"
  }
}
```

#### Google Sheets 구조
| topic | status | video_url | created_at |
|-------|--------|-----------|------------|
| 주제명 | planned | (empty) | 2025-11-22T09:00:00Z |

---

### 🤖 4. 보람이 대본 작성

**노드 ID**: `gpt-boram`  
**타입**: `n8n-nodes-base.openAi`  
**버전**: 1

#### 설정
```json
{
  "resource": "chat",
  "model": "gpt-4o",
  "prompt": {
    "messages": [
      {
        "role": "system",
        "content": "당신은 5살 손녀 '보람이'입니다..."
      },
      {
        "role": "user",
        "content": "={{ '주제: ' + $('3. 주제 로깅 (Sheets)').item.json.topic + '\\n\\n위 주제로 시니어 타겟 쇼츠 대본을 작성하세요.' }}"
      }
    ]
  }
}
```

#### System 프롬프트 전문
```
당신은 5살 손녀 '보람이'입니다. 할머니께 건강 정보를 알려드리는 귀엽고 사랑스러운 어린이예요.

[페르소나 규칙]
- 말투: '할머니~', '~해요!', '~드려요!'
- 성격: 밝고 긍정적
- 목적: 할머니의 건강을 진심으로 걱정

[스크립트 규칙]
1. Hook (문장 1): 증상 질문 (예: 할머니~ 요즘 무릎 아프시죠?)
2. Solution (문장 2-5): 쉬운 해결책 4단계
3. Promise (문장 6): 효과 보장 및 사랑 표현
4. 총 6문장, 각 문장 40자 이내
5. 출력 형식: 문장1\n문장2\n...\n문장6
```

#### 인증
```json
{
  "openAiApi": {
    "id": "sJPPMgnhjsgphIV9",
    "name": "OpenAi account"
  }
}
```

#### 응답 예시
```
할머니~ 요즘 발목이 붓고 아프시죠?
의자에 앉아서 발가락을 천천히 위로 올려요!
그리고 발목을 시계 방향으로 10번 돌려요!
반대 방향으로도 10번 더 돌려주세요!
아침 저녁으로 하시면 발목이 튼튼해져요!
사랑해요 할머니! 보람이가 응원할게요!
```

---

### ⚙️ 5. 대본 6분할

**노드 ID**: `code-splitter`  
**타입**: `n8n-nodes-base.code`  
**버전**: 2

#### JavaScript 코드 (전문)
```javascript
// 보람이 대본을 정확히 6문장으로 분할
const script = $json.choices[0].message.content;
let sentences = script.split('\n').map(s => s.trim()).filter(s => s);

// 6개 미만이면 마지막 문장 복제
while (sentences.length < 6) {
  sentences.push('사랑해요 할머니!');
}

// 6개 초과면 자르기
sentences = sentences.slice(0, 6);

return sentences.map((sentence, index) => ({
  json: {
    sentence: sentence,
    index: index + 1,
    topic: $('3. 주제 로깅 (Sheets)').item.json.topic
  }
}));
```

#### 입력
```json
{
  "choices": [{
    "message": {
      "content": "문장1\n문장2\n문장3\n문장4\n문장5\n문장6"
    }
  }]
}
```

#### 출력 (6개 아이템)
```json
[
  {
    "sentence": "할머니~ 요즘 발목이 붓고 아프시죠?",
    "index": 1,
    "topic": "앉아서 하는 발목 스트레칭"
  },
  {
    "sentence": "의자에 앉아서 발가락을 천천히 위로 올려요!",
    "index": 2,
    "topic": "앉아서 하는 발목 스트레칭"
  },
  ...
]
```

---

### 🎨 6-A. 이미지 생성 (DALL-E)

**노드 ID**: `dalle-image`  
**타입**: `n8n-nodes-base.openAi`  
**버전**: 1

#### 설정
```json
{
  "resource": "image",
  "operation": "create",
  "prompt": "={{ 'Pixar style 3D animation, cute 5-year-old Korean girl wearing white doctor gown, big eyes, sweet smile, colorful medical clinic background. Scene: ' + $json.sentence }}",
  "model": "dall-e-3",
  "options": {
    "size": "1024x1024",
    "quality": "standard",
    "style": "vivid"
  }
}
```

#### 프롬프트 템플릿
```
Pixar style 3D animation, 
cute 5-year-old Korean girl wearing white doctor gown, 
big eyes, sweet smile, 
colorful medical clinic background.

Scene: {{ $json.sentence }}
```

#### 설정 옵션
- **Model**: DALL-E 3
- **Size**: 1024x1024 (정사각형, 이후 9:16으로 리사이즈 필요)
- **Quality**: standard (hd보다 저렴)
- **Style**: vivid (생동감 있는 스타일)

#### 응답
```json
{
  "data": [
    {
      "url": "https://oaidalleapiprodscus.blob.core.windows.net/...",
      "revised_prompt": "..."
    }
  ]
}
```

---

### 🎵 6-B. 오디오 생성 (TTS)

**노드 ID**: `tts-audio`  
**타입**: `n8n-nodes-base.openAi`  
**버전**: 1

#### 설정
```json
{
  "resource": "audio",
  "operation": "generate",
  "input": "={{ $json.sentence }}",
  "voice": "nova",
  "options": {
    "model": "tts-1-hd",
    "response_format": "mp3",
    "speed": 0.85
  }
}
```

#### TTS 설정
- **Voice**: nova (여성 보이스, 밝고 친근한 톤)
- **Model**: tts-1-hd (고품질)
- **Format**: mp3
- **Speed**: 0.85 (15% 느리게 - 시니어 청취 고려)

#### 다른 보이스 옵션
| Voice | 특징 |
|-------|------|
| **nova** | 밝고 친근한 여성 (선택됨) |
| alloy | 중성적 |
| echo | 남성 |
| fable | 영국식 |
| onyx | 낮은 남성 |
| shimmer | 부드러운 여성 |

#### 응답
Binary MP3 파일 (약 3-5초 길이)

---

### 💾 7-A. 이미지 백업 (Drive)

**노드 ID**: `drive-image`  
**타입**: `n8n-nodes-base.googleDrive`  
**버전**: 3

#### 설정
```json
{
  "inputDataFieldName": "data",
  "name": "={{ 'image_' + $json.index + '.png' }}",
  "driveId": {
    "__rl": true,
    "value": "My Drive",
    "mode": "list"
  },
  "folderId": {
    "__rl": true,
    "value": "YOUR_DRIVE_FOLDER_ID",
    "mode": "id"
  }
}
```

#### 인증
```json
{
  "googleDriveOAuth2Api": {
    "id": "WPZfhNj5Q0D1maw9",
    "name": "Google Drive account"
  }
}
```

#### 파일명 패턴
- `image_1.png`
- `image_2.png`
- ...
- `image_6.png`

#### 응답
```json
{
  "id": "1abc...xyz",
  "name": "image_1.png",
  "webContentLink": "https://drive.google.com/uc?id=1abc...xyz&export=download",
  "webViewLink": "https://drive.google.com/file/d/1abc...xyz/view"
}
```

---

### 💾 7-B. 오디오 백업 (Drive)

**노드 ID**: `drive-audio`  
**타입**: `n8n-nodes-base.googleDrive`  
**버전**: 3

#### 설정
```json
{
  "inputDataFieldName": "data",
  "name": "={{ 'audio_' + $json.index + '.mp3' }}",
  "driveId": {
    "__rl": true,
    "value": "My Drive",
    "mode": "list"
  },
  "folderId": {
    "__rl": true,
    "value": "YOUR_DRIVE_FOLDER_ID",
    "mode": "id"
  }
}
```

#### 파일명 패턴
- `audio_1.mp3`
- `audio_2.mp3`
- ...
- `audio_6.mp3`

---

### 🔀 8. 자산 병합

**노드 ID**: `merge-assets`  
**타입**: `n8n-nodes-base.merge`  
**버전**: 3

#### 설정
```json
{
  "mode": "mergeByPosition"
}
```

#### Merge 모드
- **mergeByPosition**: 같은 인덱스끼리 병합
  - Input 1 (이미지): `image_1.png`, `image_2.png`, ...
  - Input 2 (오디오): `audio_1.mp3`, `audio_2.mp3`, ...
  - Output: 각 인덱스별로 이미지+오디오 쌍 생성

#### 입력 1 (7-A에서)
```json
[
  { "index": 1, "webContentLink": "https://drive.../image_1.png" },
  { "index": 2, "webContentLink": "https://drive.../image_2.png" },
  ...
]
```

#### 입력 2 (7-B에서)
```json
[
  { "index": 1, "webContentLink": "https://drive.../audio_1.mp3" },
  { "index": 2, "webContentLink": "https://drive.../audio_2.mp3" },
  ...
]
```

#### 출력 (병합됨)
```json
[
  {
    "index": 1,
    "sentence": "할머니~ 요즘 발목이 붓고 아프시죠?",
    "imageUrl": "https://drive.../image_1.png",
    "audioUrl": "https://drive.../audio_1.mp3"
  },
  ...
]
```

---

### 🎬 9. 영상 렌더링 (Creatomate)

**노드 ID**: `creatomate`  
**타입**: `n8n-nodes-base.httpRequest`  
**버전**: 4.2

#### 설정
```json
{
  "method": "POST",
  "url": "https://api.creatomate.com/v1/renders",
  "authentication": "genericCredentialType",
  "genericAuthType": "httpHeaderAuth",
  "sendBody": true,
  "specifyBody": "json",
  "jsonBody": "={{ { ... } }}"
}
```

#### JSON Body (표현식)
```javascript
{
  template_id: 'YOUR_CREATOMATE_TEMPLATE_ID',
  modifications: {
    'Subtitle-1': $('8. 자산 병합').all()[0].json.sentence,
    'Image-1': $('7-A. 이미지 백업 (Drive)').all()[0].json.webContentLink,
    'Audio-1': $('7-B. 오디오 백업 (Drive)').all()[0].json.webContentLink,
    'Subtitle-2': $('8. 자산 병합').all()[1].json.sentence,
    'Image-2': $('7-A. 이미지 백업 (Drive)').all()[1].json.webContentLink,
    'Audio-2': $('7-B. 오디오 백업 (Drive)').all()[1].json.webContentLink,
    // ... 3~6번 반복
  }
}
```

#### Creatomate 템플릿 구조
- **크기**: 1080x1920 (9:16 세로형)
- **길이**: 약 30-40초
- **레이어**:
  - Subtitle-1~6: 자막 텍스트
  - Image-1~6: 배경 이미지 (AI 생성)
  - Audio-1~6: 음성 파일

#### 인증
```json
{
  "httpHeaderAuth": {
    "id": "Tzlf95EWgm3pWD1A",
    "name": "Header Auth account"
  }
}
```

Header: `Authorization: Bearer YOUR_CREATOMATE_API_KEY`

#### 응답
```json
{
  "id": "render_abc123",
  "status": "rendering",
  "url": null,
  "created_at": "2025-11-22T09:05:00Z"
}
```

---

### ⏱️ 10. 대기 (30초)

**노드 ID**: `wait-render`  
**타입**: `n8n-nodes-base.wait`  
**버전**: 1

#### 설정
```json
{
  "amount": 30,
  "unit": "seconds"
}
```

#### 용도
- Creatomate 렌더링 완료 대기
- 일반적으로 20-40초 소요
- 30초 후 다운로드 시도

---

### ⬇️ 11. 영상 다운로드

**노드 ID**: `download-video`  
**타입**: `n8n-nodes-base.httpRequest`  
**버전**: 4.2

#### 설정
```json
{
  "url": "={{ $json.url }}",
  "options": {
    "response": {
      "response": {
        "responseFormat": "file"
      }
    }
  }
}
```

#### 프로세스
1. 이전 노드 (`wait-render`)에서 `$json.url` 가져오기
2. Creatomate가 렌더링 완료 후 제공하는 URL
3. Binary 파일로 다운로드 (MP4)

#### 응답
Binary MP4 파일 (약 3-10MB)

---

### ✅ 12. 영상 검증 (>2MB)

**노드 ID**: `verify-video`  
**타입**: `n8n-nodes-base.if`  
**버전**: 2

#### 설정
```json
{
  "conditions": {
    "number": [
      {
        "value1": "={{ $binary.data.fileSize }}",
        "operation": "larger",
        "value2": 2000000
      }
    ]
  }
}
```

#### 검증 로직
- **조건**: 파일 크기 > 2MB (2,000,000 bytes)
- **True 출력**: 다음 노드로 진행 (YouTube 업로드)
- **False 출력**: 에러 처리 또는 재시도

#### 이유
- 2MB 미만 = 렌더링 실패 또는 손상된 파일
- 일반적인 60초 Shorts = 3-10MB

---

### 📤 13. 유튜브 업로드

**노드 ID**: `youtube-upload`  
**타입**: `n8n-nodes-base.youTube`  
**버전**: 1

#### 설정
```json
{
  "resource": "video",
  "operation": "upload",
  "title": "={{ $('3. 주제 로깅 (Sheets)').item.json.topic + ' - 보람이의 건강정보' }}",
  "description": "시니어 건강 꿀팁! #Shorts #건강 #보람이",
  "categoryId": "26",
  "privacyStatus": "unlisted",
  "options": {}
}
```

#### 메타데이터
- **Title**: `{주제} - 보람이의 건강정보`
  - 예: "앉아서 하는 발목 스트레칭 - 보람이의 건강정보"
- **Description**: 고정 문구
- **Category**: 26 (Howto & Style)
- **Privacy**: unlisted (비공개 링크)

#### Category ID 옵션
| ID | 카테고리 |
|----|---------|
| 22 | People & Blogs |
| **26** | **Howto & Style** (선택됨) |
| 27 | Education |
| 28 | Science & Technology |

#### 인증
```json
{
  "youTubeOAuth2Api": {
    "id": "oLZPXMvaa8mS5fz0",
    "name": "YouTube account"
  }
}
```

#### 응답
```json
{
  "id": "abc123xyz",
  "snippet": {
    "title": "...",
    "description": "...",
    "publishedAt": "2025-11-22T09:10:00Z"
  },
  "status": {
    "uploadStatus": "processed",
    "privacyStatus": "unlisted"
  }
}
```

---

### 📊 14. 상태 업데이트 (Sheets)

**노드 ID**: `sheets-update`  
**타입**: `n8n-nodes-base.googleSheets`  
**버전**: 4.5

#### 설정
```json
{
  "operation": "update",
  "documentId": {
    "__rl": true,
    "value": "YOUR_GOOGLE_SHEET_ID",
    "mode": "id"
  },
  "sheetName": {
    "__rl": true,
    "value": "gid=0",
    "mode": "list"
  },
  "columns": {
    "mappingMode": "defineBelow",
    "value": {
      "status": "published",
      "video_url": "={{ $json.id }}",
      "published_at": "={{ $now.toISO() }}"
    }
  },
  "options": {}
}
```

#### 업데이트 로직
1. 노드 3에서 생성한 행을 찾기
2. 다음 컬럼 업데이트:
   - `status`: "planned" → "published"
   - `video_url`: YouTube 비디오 ID
   - `published_at`: 업로드 완료 시간

#### Google Sheets 최종 상태
| topic | status | video_url | created_at | published_at |
|-------|--------|-----------|------------|--------------|
| 발목 스트레칭 | published | abc123xyz | 2025-11-22T09:00:00Z | 2025-11-22T09:10:00Z |

---

## 노드 타입별 분류

### 📦 사용된 노드 타입 (9종류)

| 타입 | 노드 개수 | 노드 이름 |
|------|----------|----------|
| **openAi** | 4 | 2-C (GPT), 4 (GPT), 6-A (DALL-E), 6-B (TTS) |
| **httpRequest** | 4 | 2-A (YouTube API), 9 (Creatomate), 11 (Download), (15-숨김) |
| **googleSheets** | 2 | 3 (Log), 14 (Update) |
| **googleDrive** | 2 | 7-A (Image), 7-B (Audio) |
| **code** | 2 | 2-B (Parse), 5 (Split) |
| **scheduleTrigger** | 1 | 1 (Trigger) |
| **merge** | 1 | 8 (Merge) |
| **wait** | 1 | 10 (Wait) |
| **if** | 1 | 12 (Verify) |
| **youTube** | 1 | 13 (Upload) |

---

## 데이터 흐름 맵

### Phase 1: 트렌드 분석 (노드 1-4)

```
[스케줄] → [YouTube API] → [파싱] → [GPT 선정] → 선정된 주제
```

**입력**: 없음 (Schedule)  
**출력**: 주제 문자열

---

### Phase 2: 스크립트 생성 (노드 3-5)

```
주제 → [Sheets 로깅] → [GPT 보람이] → [6분할] → 6개 문장 배열
```

**입력**: 주제 문자열  
**출력**: 6개 문장 객체 배열

---

### Phase 3: 멀티미디어 생성 (노드 6-7)

```
        ┌─→ [DALL-E] → [Drive 이미지] ─┐
6개 문장 ┤                              ├─→ 병합
        └─→ [TTS] → [Drive 오디오] ────┘
```

**입력**: 6개 문장  
**출력**: 6쌍의 (이미지 URL, 오디오 URL)

---

### Phase 4: 비디오 렌더링 (노드 8-12)

```
병합 → [Creatomate] → [대기] → [다운로드] → [검증] → MP4 파일
```

**입력**: 6쌍의 자산  
**출력**: 검증된 MP4 파일

---

### Phase 5: 업로드 및 기록 (노드 13-14)

```
MP4 → [YouTube] → [Sheets 업데이트] → 완료
```

**입력**: MP4 파일  
**출력**: YouTube 비디오 ID

---

## API 및 인증 정보

### 필요한 API 키 (7개)

| 서비스 | API 키 | 사용 노드 |
|--------|--------|-----------|
| **YouTube Data API** | `YOUR_YOUTUBE_API_KEY` | 2-A |
| **YouTube OAuth** | Client ID + Secret | 13 |
| **OpenAI** | `sk-xxx` | 2-C, 4, 6-A, 6-B |
| **Google Sheets OAuth** | OAuth 2.0 | 3, 14 |
| **Google Drive OAuth** | OAuth 2.0 | 7-A, 7-B |
| **Creatomate** | API Key | 9 |
| **Creatomate Template ID** | Template ID | 9 |

---

### 인증 계정 (4개)

#### 1. OpenAI
- **ID**: `sJPPMgnhjsgphIV9`
- **Name**: "OpenAi account"
- **사용**: GPT-4o, DALL-E 3, TTS

#### 2. Google Sheets
- **ID**: `qHzPZhMeMIC0bqve`
- **Name**: "Google Sheets account"
- **타입**: OAuth 2.0

#### 3. Google Drive
- **ID**: `WPZfhNj5Q0D1maw9`
- **Name**: "Google Drive account"
- **타입**: OAuth 2.0

#### 4. YouTube
- **ID**: `oLZPXMvaa8mS5fz0`
- **Name**: "YouTube account"
- **타입**: OAuth 2.0

#### 5. Creatomate
- **ID**: `Tzlf95EWgm3pWD1A`
- **Name**: "Header Auth account"
- **타입**: HTTP Header Auth

---

## 실행 통계 및 비용

### 예상 실행 시간

| 단계 | 소요 시간 |
|------|----------|
| 트렌드 수집 (1-4) | ~10초 |
| 스크립트 생성 (3-5) | ~15초 |
| 이미지 생성 (6-A) | ~60초 (6개 x 10초) |
| 오디오 생성 (6-B) | ~30초 (6개 x 5초) |
| Drive 백업 (7) | ~20초 |
| 렌더링 (9-12) | ~60초 (30초 대기 + 30초 처리) |
| 업로드 (13-14) | ~40초 |
| **총 소요 시간** | **~4분 15초** |

---

### 예상 비용 (1회 실행)

| 항목 | 단가 | 사용량 | 비용 |
|------|------|--------|------|
| YouTube API | 무료 (Quota) | 1 request | $0 |
| GPT-4o (선정) | $2.50/1M tokens | ~500 tokens | $0.001 |
| GPT-4o (대본) | $2.50/1M tokens | ~800 tokens | $0.002 |
| DALL-E 3 | $0.040/image | 6 images | $0.240 |
| TTS HD | $0.030/1K chars | ~240 chars | $0.007 |
| Google Drive | 무료 (15GB) | ~5MB | $0 |
| Creatomate | $0.20/render | 1 render | $0.200 |
| YouTube Upload | 무료 | 1 upload | $0 |
| **총 비용** | | | **~$0.45** |

---

## 개선 포인트 및 확장

### 🔧 현재 이슈

1. **노드 2-B, 2-C 누락**: JSON에 정의되지 않았지만 연결에서 참조됨
2. **하드코딩된 값**: API 키가 평문으로 저장됨
3. **에러 처리 부족**: If 노드의 False 브랜치 미정의
4. **고정 대기 시간**: 30초 Wait은 비효율적 (폴링 방식 권장)

### 🚀 확장 아이디어

#### 단기 (1-2주)
- [ ] **Error Handler 추가**: 각 단계에 에러 처리 노드 추가
- [ ] **Webhook 트리거**: 스케줄 외 수동 실행 옵션
- [ ] **환경 변수화**: 모든 API 키를 환경 변수로 이동
- [ ] **Slack 알림**: 완료/실패 시 Slack 메시지 발송

#### 중기 (1-2개월)
- [ ] **Google Trends 추가**: 2-A 옆에 Google Trends API 노드 추가
- [ ] **A/B 테스트**: 2개 버전 썸네일 생성 후 성과 비교
- [ ] **Analytics 연동**: YouTube Analytics API로 실시간 모니터링
- [ ] **댓글 응답 봇**: 댓글을 GPT로 분석하여 자동 답변

#### 장기 (3개월+)
- [ ] **다중 채널**: TikTok, Instagram Reels 동시 업로드
- [ ] **시리즈 생성**: 연관 주제를 시리즈로 자동 기획
- [ ] **ML 추천**: 과거 성과 데이터로 주제 추천 모델 학습
- [ ] **인플루언서 협업**: 외부 크리에이터 콘텐츠 자동 큐레이션

---

## 환경 변수 설정 예시

`.env` 파일 또는 N8N 환경 변수:

```bash
# YouTube
YOUTUBE_API_KEY=AIzaSy...
YOUTUBE_CLIENT_ID=123456789-xxx.apps.googleusercontent.com
YOUTUBE_CLIENT_SECRET=GOCSPX-xxx

# OpenAI
OPENAI_API_KEY=sk-proj-xxx

# Google Sheets
GOOGLE_SHEETS_SPREADSHEET_ID=1abc...xyz

# Google Drive
GOOGLE_DRIVE_FOLDER_ID=1abc...xyz

# Creatomate
CREATOMATE_API_KEY=xxx
CREATOMATE_TEMPLATE_ID=template_xxx

# 페르소나
PERSONA_NAME=보람이
PERSONA_AGE=5
PERSONA_ROLE=손녀
```

---

## 워크플로우 import 가이드

### 1. JSON 파일 준비
```bash
# 파일 위치
c:\Users\user\Desktop\gpt\n8n-copilot\shots\Shorts_Hybrid_v4_Final.json
```

### 2. N8N에서 Import
1. N8N 대시보드 → Workflows
2. "Import from File" 클릭
3. `Shorts_Hybrid_v4_Final.json` 선택
4. Import 완료

### 3. 누락 노드 수동 추가

#### 노드 2-B (트렌드 파싱)
- 타입: Code
- 위치: 2-A와 2-C 사이
- 코드: 위 섹션 참고

#### 노드 2-C (트렌드 선정)
- 타입: OpenAI (Chat)
- 위치: 2-B와 3 사이
- 프롬프트: 위 섹션 참고

### 4. API 키 설정
모든 노드에서 `YOUR_XXX_API_KEY`를 실제 값으로 교체

### 5. 테스트 실행
- Manual 모드로 먼저 테스트
- 각 노드별로 출력 확인
- 에러 발생 시 로그 확인

---

## 문제 해결 (Troubleshooting)

### Q1: DALL-E 이미지가 생성되지 않아요
**A**: OpenAI API 키 확인 및 Rate Limit 체크
```bash
# 6개 이미지 동시 생성 시 Rate Limit 발생 가능
# 해결: Split In Batches 노드로 2초 간격 생성
```

### Q2: Creatomate 렌더링이 실패해요
**A**: Template ID 및 Asset URL 확인
```bash
# Google Drive 링크가 공개 설정되어 있는지 확인
# Creatomate 템플릿의 레이어 이름 확인 (Subtitle-1, Image-1 등)
```

### Q3: YouTube 업로드 시 403 에러
**A**: OAuth 권한 재설정
```bash
# YouTube Data API v3 활성화 확인
# OAuth 동의 화면에서 youtube.upload 권한 추가
```

### Q4: Google Sheets 업데이트가 안 돼요
**A**: Sheets 구조 확인
```bash
# 첫 번째 행에 헤더가 있어야 함
# 컬럼명: topic, status, video_url, created_at, published_at
```

---

## 참고 문서

### 공식 문서
- [N8N Documentation](https://docs.n8n.io/)
- [OpenAI API Reference](https://platform.openai.com/docs)
- [YouTube Data API v3](https://developers.google.com/youtube/v3)
- [Creatomate API](https://creatomate.com/docs/api/rest-api)
- [Google Sheets API](https://developers.google.com/sheets/api)

### 커뮤니티
- [N8N Forum](https://community.n8n.io/)
- [N8N Discord](https://discord.gg/n8n)

---

## 버전 히스토리

| 버전 | 날짜 | 변경사항 |
|------|------|----------|
| v4 Final | 2025-11-22 | 현재 버전 (17개 노드) |
| v3 | 2025-11-21 | D-ID 제거, Creatomate 추가 |
| v2 | 2025-11-20 | 보람이 페르소나 추가 |
| v1 | 2025-11-19 | 초기 워크플로우 |

---

*문서 작성: AI Assistant*  
*최종 업데이트: 2025-11-22 11:27 KST*  
*기반 파일: `Shorts_Hybrid_v4_Final.json` (609 lines)*
