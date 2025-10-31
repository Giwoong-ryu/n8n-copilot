# 📚 N8N AI Copilot - 문서 가이드

## 🎯 문서별 용도

### 1. **README.md** ⭐
**언제 읽나요?** 프로젝트를 처음 시작할 때  
**무엇이 들어있나요?** 
- 프로젝트 개요 (한 문장)
- 빠른 시작 방법
- 파일 구조
- 현재 단계

**읽는 시간:** 1분

---

### 2. **CURRENT_STATUS.md** 🔥
**언제 읽나요?** 매일 작업 시작 전 (가장 중요!)  
**무엇이 들어있나요?**
- 완료된 작업
- 현재 작업 중인 내용
- 다음 작업 (우선순위별)
- 이번 주 목표
- 클로드 코드 작업 지시

**읽는 시간:** 2-3분  
**업데이트 주기:** 매일

---

### 3. **ROADMAP.md** 🗺️
**언제 읽나요?** 이번 주/다음 주 계획 확인할 때  
**무엇이 들어있나요?**
- Phase별 개발 계획
- Week별 상세 작업
- 완료 기준
- 마일스톤

**읽는 시간:** 5분  
**업데이트 주기:** 주간

---

### 4. **TECHNICAL_SPEC.md** 🔧
**언제 읽나요?** 기술적 세부사항 확인할 때  
**무엇이 들어있나요?**
- 시스템 아키텍처
- 파일 구조
- 핵심 클래스/함수
- API 통신 구조
- 보안/성능

**읽는 시간:** 10분  
**업데이트 주기:** 주요 변경 시

---

### 5. **PROJECT_OVERVIEW.md** 🎯
**언제 읽나요?** 프로젝트 비전/전략 확인할 때  
**무엇이 들어있나요?**
- 비전
- 문제 정의
- 솔루션
- 타겟 사용자
- 마케팅 전략
- 성장 목표

**읽는 시간:** 8분  
**업데이트 주기:** 분기별

---

### 6. **CLAUDE_CODE_GUIDE.md** 🤖
**언제 읽나요?** 클로드 코드로 작업할 때  
**무엇이 들어있나요?**
- 작업 시작 순서
- 현재 작업 상세 가이드
- 코드 예시
- 테스트 방법
- 보고 양식

**읽는 시간:** 5분  
**대상:** 클로드 코드 (Haiku 4.5)

---

## 🚀 시작 가이드

### 처음 시작하는 경우
```
1. README.md (1분) - 전체 그림 파악
2. CURRENT_STATUS.md (3분) - 현재 상태 확인
3. CLAUDE_CODE_GUIDE.md (5분) - 작업 준비
→ 총 9분
```

### 매일 작업 시작할 때
```
1. CURRENT_STATUS.md (2분) - 다음 작업 확인
2. CLAUDE_CODE_GUIDE.md (필요시) - 상세 가이드
→ 총 2-5분
```

### 새로운 기능 추가할 때
```
1. ROADMAP.md (5분) - 전체 계획 확인
2. TECHNICAL_SPEC.md (10분) - 기술 스펙 확인
3. CURRENT_STATUS.md (2분) - 현재 상태 파악
→ 총 17분
```

---

## 📂 파일 구조

```
n8n-ai-copilot/
│
├── README.md                    # 프로젝트 소개
├── INDEX.md                     # 📍 이 파일
│
├── CURRENT_STATUS.md            # 🔥 매일 확인!
├── ROADMAP.md                   # 개발 계획
├── TECHNICAL_SPEC.md            # 기술 스펙
├── PROJECT_OVERVIEW.md          # 비전/전략
├── CLAUDE_CODE_GUIDE.md         # 작업 가이드
│
├── extension/                   # Chrome Extension
│   ├── manifest.json
│   ├── content.js
│   ├── background.js
│   ├── popup.html
│   ├── popup.js
│   └── sidebar.css
│
└── website/                     # 마케팅 웹사이트 (Phase 2)
```

---

## 🎯 문서 우선순위

### 🔥 매일 필수
- CURRENT_STATUS.md

### ⭐ 주간 필수
- ROADMAP.md
- CLAUDE_CODE_GUIDE.md

### 💡 참고용
- TECHNICAL_SPEC.md
- PROJECT_OVERVIEW.md

### 📌 한 번만
- README.md
- INDEX.md (이 파일)

---

## 💡 팁

### 클로드 코드 작업 시작
```bash
# 1. 현재 상태 파악
cat CURRENT_STATUS.md

# 2. 작업 가이드 확인
cat CLAUDE_CODE_GUIDE.md

# 3. 작업 시작
cd extension
```

### 문서 검색
```bash
# 특정 키워드 검색
grep -r "CORS" *.md

# 특정 파일에서 검색
grep "background.js" TECHNICAL_SPEC.md
```

### 진행상황 기록
```
CURRENT_STATUS.md 하단의
"작업 로그" 섹션에 날짜별로 기록
```

---

## 📝 문서 업데이트 규칙

### CURRENT_STATUS.md
- **매일** 작업 전 확인
- **작업 완료 시** "작업 로그" 업데이트
- **이슈 발견 시** "현재 작업 중" 업데이트

### ROADMAP.md
- **주간 완료 시** 체크박스 업데이트
- **계획 변경 시** 해당 섹션 수정

### TECHNICAL_SPEC.md
- **파일 구조 변경 시** 업데이트
- **API 변경 시** 업데이트

---

## ❓ 자주 묻는 질문

**Q: 어떤 문서부터 읽어야 하나요?**  
A: README.md → CURRENT_STATUS.md 순서로!

**Q: 매일 모든 문서를 읽어야 하나요?**  
A: 아니요. CURRENT_STATUS.md만 필수입니다.

**Q: 클로드 코드가 어떤 문서를 읽나요?**  
A: CLAUDE_CODE_GUIDE.md를 최우선으로 읽습니다.

**Q: 문서가 너무 길면?**  
A: 각 문서의 목차를 보고 필요한 섹션만 읽으세요.

---

**마지막 업데이트:** 2025-10-31  
**다음 리뷰:** Phase 2 완료 시
