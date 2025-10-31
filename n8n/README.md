# 🤖 N8N AI Copilot

AI로 N8N 워크플로우를 더 쉽고 빠르게 만드세요!

## 📋 소개

N8N AI Copilot은 N8N 워크플로우 자동화를 도와주는 Chrome Extension입니다. Claude AI를 활용하여 실시간으로 에러를 분석하고, JSON을 자동 생성하며, 노드 설정을 자동으로 채워줍니다.

## ✨ 주요 기능

- 🔍 **실시간 에러 분석**: 워크플로우에서 발생한 에러를 AI가 자동으로 분석하고 해결 방안을 제시합니다
- 📝 **JSON 자동 생성**: 복잡한 JSON 구조를 AI가 자동으로 생성해줍니다
- ⚙️ **설정 자동 채우기**: 노드 설정 필드를 AI가 자동으로 채워줍니다
- 💬 **AI 채팅**: N8N 워크플로우에 대한 질문을 AI에게 바로 물어볼 수 있습니다

## 🚀 설치 방법

### 1. 파일 다운로드
이 저장소를 다운로드하거나 클론합니다.

```bash
git clone [repository-url]
cd n8n-ai-copilot
```

### 2. Chrome Extension 로드

1. Chrome 브라우저에서 `chrome://extensions/` 접속
2. 우측 상단의 **"개발자 모드"** 활성화
3. **"압축해제된 확장 프로그램을 로드합니다"** 클릭
4. 다운로드한 `n8n-ai-copilot` 폴더 선택

### 3. API 키 설정

1. Extension 아이콘을 클릭하여 설정 페이지 열기
2. [Anthropic Console](https://console.anthropic.com/settings/keys)에서 API 키 발급
3. 발급받은 API 키를 입력하고 저장

## 📖 사용 방법

### 기본 사용법

1. **N8N 페이지 접속**
   - https://app.n8n.cloud 또는 로컬 N8N (localhost:5678) 접속
   
2. **AI Copilot 열기**
   - 우측 하단의 🤖 버튼 클릭
   
3. **AI에게 질문하기**
   - 사이드바에서 메시지 입력
   - 빠른 액션 버튼 사용

### 빠른 액션

#### 🔍 에러 분석
1. 워크플로우에서 에러 발생
2. "에러 분석" 버튼 클릭
3. AI가 에러 원인과 해결 방법 제시

#### 📝 JSON 생성
1. "JSON 생성" 버튼 클릭
2. 생성하고 싶은 JSON 구조 설명
3. AI가 자동으로 JSON 생성

#### ⚙️ 설정 자동 채우기
1. N8N에서 노드 선택
2. "자동 채우기" 버튼 클릭
3. 어떤 설정을 원하는지 입력
4. AI가 자동으로 필드 채우기

## 🛠️ 기술 스택

- **Frontend**: Vanilla JavaScript
- **AI**: Claude (Anthropic)
- **Platform**: Chrome Extension Manifest V3

## 📂 프로젝트 구조

```
C:\Users\user\Desktop\gpt\n8n\
├── 📁 docs/                    # 📋 관리 문서 (당신이 읽는 용)
│   ├── INDEX.md               # 전체 가이드
│   ├── PROJECT_OVERVIEW.md    # 프로젝트 개요
│   ├── CURRENT_STATUS.md      # ⭐ 가장 중요! 현재 상태
│   ├── ROADMAP.md             # 개발 일정
│   └── TECHNICAL_SPEC.md      # 기술 설계
│
├── 📁 guides/                  # 🤖 클로드 코드용 지침
│   ├── CLAUDE_CODE_GUIDE.md   # ⭐ 클로드 코드 작업 규칙
│   └── n8n_GUIDE.md       # 최초 설계
│
├── 📁 src/                     # 💻 실제 소스코드
│   ├── manifest.json
│   ├── popup.html
│   ├── popup.js
│   ├── content.js
│   ├── background.js
│   └── styles/
│
├── 📁 archive/                 # 🗄️ 이전 버전/참고자료
│   ├── n8n-ai-copilot.zip
│   └── 01_종합_실행_계획서.md
│
├── manifest.json          # Chrome Extension 설정
├── background.js          # Service Worker (API 통신)
├── content.js             # N8N DOM 조작
├── sidebar.js             # 사이드바 로직
├── sidebar.html           # 사이드바 UI
├── sidebar.css            # 사이드바 스타일
├── popup.html             # 설정 페이지 UI
├── popup.js               # 설정 페이지 로직
├── icons/                 # Extension 아이콘
└── README.md              # 이 문서
```

## 🔧 개발 모드

### 디버깅

1. **Content Script 디버깅**
   - N8N 페이지에서 F12 → Console 탭
   - "N8N AI Copilot" 로그 확인

2. **Background Script 디버깅**
   - `chrome://extensions/` 접속
   - Extension의 "Service Worker" 클릭
   - Console에서 로그 확인

3. **Popup 디버깅**
   - Extension 아이콘 클릭
   - Popup에서 우클릭 → "검사"

### 코드 수정 후 리로드

1. `chrome://extensions/` 접속
2. Extension의 "새로고침" 버튼 클릭
3. N8N 페이지 새로고침 (F5)

## 🔐 보안

- API 키는 Chrome의 로컬 스토리지에 암호화되어 저장됩니다
- API 키는 Anthropic API 호출에만 사용됩니다
- 외부로 전송되지 않습니다

## ⚠️ 주의사항

- Claude API 사용에 따른 요금이 발생할 수 있습니다
- N8N의 UI 변경 시 일부 기능이 작동하지 않을 수 있습니다
- 현재 베타 버전이며, 버그가 있을 수 있습니다

## 🐛 버그 리포트 & 기능 제안

이슈를 발견하셨거나 새로운 기능을 제안하고 싶으시다면:
1. GitHub Issues 페이지에서 새 이슈 생성
2. 버그의 경우: 재현 방법과 스크린샷 첨부
3. 기능 제안의 경우: 사용 사례와 기대 효과 설명

## 📝 라이선스

MIT License

## 🙏 감사합니다

- [N8N](https://n8n.io/) - 멋진 워크플로우 자동화 플랫폼
- [Anthropic](https://www.anthropic.com/) - Claude AI
- Chrome Extension 개발 커뮤니티

---

**Made with ❤️ for N8N users**
