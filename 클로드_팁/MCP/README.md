# 🔌 MCP (Model Context Protocol)

> **Claude의 외부 시스템 연동 프로토콜**

---

## 📋 목차
- [MCP란?](#mcp란)
- [MCP vs Skills](#mcp-vs-skills)
- [MCP 서버 설정](#mcp-서버-설정)
- [인기 MCP 서버](#인기-mcp-서버)
- [커스텀 MCP 도구 제작](#커스텀-mcp-도구-제작)

---

## MCP란?

Model Context Protocol은 **Claude가 외부 시스템과 통신**할 수 있게 해주는 표준 프로토콜입니다.

### MCP로 할 수 있는 것

- 📊 **데이터베이스 접근**: PostgreSQL, MySQL, MongoDB
- 📁 **파일 시스템 조작**: 파일 읽기/쓰기, 디렉토리 탐색
- 🌐 **API 호출**: REST, GraphQL API 통합
- 🔧 **시스템 도구**: Git, Docker, NPM 등
- ☁️ **클라우드 서비스**: AWS, GCP, Azure 연동

---

## MCP vs Skills

| 구분 | MCP | Skills |
|------|-----|--------|
| **목적** | 외부 시스템 **데이터 접근** | AI에게 **지식 제공** |
| **동작** | **Runtime에 데이터 가져옴** | **Static 컨텍스트 주입** |
| **예시** | DB 쿼리 실행 | n8n 워크플로우 패턴 설명 |
| **토큰** | 사용한 만큼만 | 로드 시 전체 소모 |

**간단히 말하면**:
- **Skills** = "이렇게 하는 거야" (지식)
- **MCP** = "데이터 가져와줘" (데이터)

---

## MCP 서버 설정

### 1. Claude Desktop 설정 파일

**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
**Windows**: `%APPDATA%\Claude\claude_desktop_config.json`
**Linux**: `~/.config/Claude/claude_desktop_config.json`

### 2. 설정 예시

```json
{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "/Users/username/Documents"]
    },
    "postgres": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-postgres", "postgresql://localhost/mydb"]
    },
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_TOKEN": "your-token-here"
      }
    }
  }
}
```

### 3. 적용

```bash
# Claude Desktop 재시작
# macOS
killall "Claude"

# Windows
taskkill /F /IM Claude.exe

# 다시 실행
```

---

## 인기 MCP 서버

### 공식 MCP 서버들

| 서버 | 설명 | NPM 패키지 |
|------|------|-----------|
| **filesystem** | 로컬 파일 시스템 접근 | `@modelcontextprotocol/server-filesystem` |
| **postgres** | PostgreSQL 데이터베이스 | `@modelcontextprotocol/server-postgres` |
| **github** | GitHub API 통합 | `@modelcontextprotocol/server-github` |
| **slack** | Slack 메시지 전송 | `@modelcontextprotocol/server-slack` |
| **google-drive** | Google Drive 파일 관리 | `@modelcontextprotocol/server-google-drive` |

### 커뮤니티 MCP 서버들

- **aws-kb-retrieval-server** - AWS Knowledge Base 통합
- **mcp-server-docker** - Docker 컨테이너 관리
- **mcp-obsidian** - Obsidian 노트 연동
- **cloudflare-mcp** - Cloudflare API 통합

---

## 커스텀 MCP 도구 제작

### 1. MCP 서버 템플릿

```javascript
// server.js
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

const server = new Server({
  name: "my-custom-server",
  version: "1.0.0",
});

// 도구 등록
server.setRequestHandler("tools/list", async () => {
  return {
    tools: [
      {
        name: "get_data",
        description: "데이터를 가져옵니다",
        inputSchema: {
          type: "object",
          properties: {
            id: { type: "string", description: "데이터 ID" }
          },
          required: ["id"]
        }
      }
    ]
  };
});

// 도구 실행
server.setRequestHandler("tools/call", async (request) => {
  if (request.params.name === "get_data") {
    const { id } = request.params.arguments;
    // 실제 로직
    return {
      content: [
        { type: "text", text: `Data for ID: ${id}` }
      ]
    };
  }
});

// 서버 시작
const transport = new StdioServerTransport();
await server.connect(transport);
```

### 2. Package.json

```json
{
  "name": "my-mcp-server",
  "version": "1.0.0",
  "type": "module",
  "bin": {
    "my-mcp-server": "./server.js"
  },
  "dependencies": {
    "@modelcontextprotocol/sdk": "^0.5.0"
  }
}
```

### 3. 사용

```json
{
  "mcpServers": {
    "my-server": {
      "command": "node",
      "args": ["/path/to/server.js"]
    }
  }
}
```

---

## 실전 활용 예제

### 예제 1: PostgreSQL 데이터베이스 쿼리

```bash
# 설정 후 Claude에게 요청
"users 테이블에서 최근 가입한 10명 알려줘"

# MCP가 자동으로:
# SELECT * FROM users ORDER BY created_at DESC LIMIT 10;
# 실행하고 결과 반환
```

### 예제 2: GitHub Issue 생성

```bash
"버그 리포트를 GitHub Issue로 만들어줘:
제목: 로그인 버튼이 안 눌림
내용: Safari에서 재현됨"

# MCP가 자동으로 GitHub API 호출
```

### 예제 3: AWS S3 파일 업로드

```bash
"이 이미지를 S3 버킷에 업로드해줘"

# MCP가 AWS SDK 사용해서 업로드
```

---

## 🔧 MCP 디버깅

### MCP 서버 로그 확인

```bash
# macOS/Linux
tail -f ~/Library/Logs/Claude/mcp*.log

# Windows
type %APPDATA%\Claude\Logs\mcp*.log
```

### 연결 테스트

```bash
# MCP 서버 직접 실행
npx @modelcontextprotocol/server-filesystem /tmp

# stdin/stdout으로 통신 테스트
```

---

## 📚 추가 리소스

- [MCP 공식 문서](https://modelcontextprotocol.io)
- [MCP SDK GitHub](https://github.com/modelcontextprotocol/sdk)
- [MCP 서버 예제](https://github.com/modelcontextprotocol/servers)

---

**[← 돌아가기](../README.md)**
