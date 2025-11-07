# @giwoong-ryu/dev-productivity

> Developer productivity and best practices skills for software engineers

소프트웨어 개발 생산성 향상을 위한 Claude Code 스킬 패키지 - Git 워크플로우, 코드 리뷰, API 설계, 테스팅 등 개발 필수 스킬

## 📦 Overview

This package provides comprehensive software development skills covering Git workflow, code review practices, API design, error handling, testing strategies, and documentation writing - essential tools for professional developers and engineering teams.

**이 패키지는 Git 워크플로우, 코드 리뷰, API 설계, 에러 처리, 테스팅 전략, 문서화 등 전문 개발자와 엔지니어링 팀을 위한 필수 개발 스킬을 제공합니다.**

## ✨ Features

### 6 Essential Skills

1. **Git Workflow Korean** (~4,237 tokens)
   - Professional Git branching strategies (Git Flow, GitHub Flow)
   - Korean commit message conventions
   - PR and merge best practices
   - Conflict resolution strategies

2. **Code Review Guidelines** (~4,562 tokens)
   - Comprehensive code review checklist
   - Constructive feedback techniques
   - Review automation strategies
   - Team collaboration best practices

3. **API Design Patterns** (~4,128 tokens)
   - RESTful API design principles
   - HTTP methods and status codes
   - API versioning strategies
   - Authentication and security patterns

4. **Error Handling Strategies** (~3,891 tokens)
   - Exception hierarchy design
   - Error logging and monitoring
   - User-friendly error messages
   - Resilience patterns (retry, circuit breaker)

5. **Testing Best Practices** (~3,456 tokens)
   - Unit testing fundamentals
   - Integration testing strategies
   - E2E testing approaches
   - TDD/BDD methodologies

6. **Documentation Writer** (~2,510 tokens)
   - README template and structure
   - API documentation standards
   - Code commenting best practices
   - Architecture decision records (ADR)

## 📊 Package Statistics

```
Total Token Count: ~22,784 tokens
Skill Count: 6 skills
Target Audience: Software developers, tech leads, engineers
Focus Areas: Git, Code Quality, API Design, Testing, Documentation
```

## 🚀 Installation

```bash
# Using npx (recommended)
npx claude-plugins install @giwoong-ryu/dev-productivity

# Using npm
npm install @giwoong-ryu/dev-productivity

# Using yarn
yarn add @giwoong-ryu/dev-productivity
```

## 💡 Usage Examples

### Example 1: Git Workflow & Commit Message

```
You: "Help me create a feature branch and write a proper commit message for adding user authentication"

Claude: *Uses git-workflow-korean skill*
- Branch naming: feature/user-authentication
- Commit message structure:
  feat: 사용자 인증 기능 추가

  - JWT 기반 토큰 인증 구현
  - 로그인/로그아웃 API 엔드포인트 추가
  - 비밀번호 암호화 (bcrypt)

  Closes #123
- Suggests PR template and review checklist
```

### Example 2: API Design Review

```
You: "Review this REST API design for a blog platform: GET /posts, POST /posts, DELETE /posts/:id"

Claude: *Uses api-design-patterns skill*
✅ Good practices:
- RESTful resource naming (/posts)
- Proper HTTP methods (GET, POST, DELETE)

⚠️ Suggestions:
- Add PUT/PATCH /posts/:id for updates
- Consider pagination: GET /posts?page=1&limit=20
- Add filtering: GET /posts?author=123&tag=tech
- Missing PATCH /posts/:id for partial updates
- Recommend API versioning: /v1/posts
- Authentication strategy needed
```

### Example 3: Error Handling Implementation

```
You: "Help me implement proper error handling for a payment processing function"

Claude: *Uses error-handling-strategies skill*
Provides comprehensive error handling:

1. Custom error classes:
   - PaymentValidationError
   - PaymentProcessingError
   - PaymentTimeoutError

2. Error handling flow:
   - Input validation with detailed error messages
   - Try-catch with specific error types
   - Structured error logging
   - User-friendly error responses

3. Resilience patterns:
   - Retry logic for transient failures (3 attempts)
   - Circuit breaker for external payment API
   - Fallback mechanisms
   - Timeout configuration
```

### Example 4: Testing Strategy

```
You: "Create a comprehensive testing plan for an e-commerce checkout flow"

Claude: *Uses testing-best-practices skill*
Provides 3-tier testing strategy:

Unit Tests (70%):
- Cart calculation logic
- Discount validation
- Tax calculation functions
- Input sanitization

Integration Tests (20%):
- Payment gateway integration
- Inventory management system
- Order database operations
- Email notification service

E2E Tests (10%):
- Complete checkout flow (Cypress)
- Payment success/failure scenarios
- Mobile responsive checkout
- Guest vs. authenticated user flows

Includes test coverage targets and tools recommendations
```

## 📚 Skill Details

### 1. Git Workflow Korean

**When to Use**:
- Setting up new repositories
- Creating feature branches
- Writing commit messages
- Resolving merge conflicts
- Reviewing pull requests

**Core Concepts**:
- Git Flow vs. GitHub Flow
- Branch naming conventions (feature/, bugfix/, hotfix/)
- Korean commit message format
- PR templates and descriptions
- Merge strategies (merge, squash, rebase)

**Key Features**:
- Step-by-step Git workflow guide
- Korean commit message examples
- Conflict resolution strategies
- Git best practices checklist
- Team collaboration guidelines

### 2. Code Review Guidelines

**When to Use**:
- Reviewing pull requests
- Providing code feedback
- Setting up review standards
- Training junior developers
- Establishing team guidelines

**Core Concepts**:
- Review checklist (functionality, security, performance)
- Constructive feedback patterns
- Code smell detection
- Review automation (linting, CI/CD)
- Review time management

**Key Features**:
- Comprehensive review checklist
- Feedback examples (good vs. bad)
- Security vulnerability checklist
- Performance review guidelines
- Review workflow optimization

### 3. API Design Patterns

**When to Use**:
- Designing new REST APIs
- Reviewing API specifications
- Documenting API endpoints
- Planning API versioning
- Implementing authentication

**Core Concepts**:
- RESTful principles (resources, HTTP methods)
- Status code best practices
- Request/response formatting
- API versioning strategies
- Authentication patterns (JWT, OAuth)

**Key Features**:
- REST API design checklist
- HTTP status code guide (20+ codes)
- URL naming conventions
- Pagination and filtering patterns
- Security best practices

### 4. Error Handling Strategies

**When to Use**:
- Implementing error handling
- Debugging production issues
- Improving system reliability
- Logging and monitoring setup
- Building resilient systems

**Core Concepts**:
- Exception hierarchy design
- Error vs. Exception distinction
- Logging levels and strategies
- User-facing error messages
- Resilience patterns

**Key Features**:
- Error handling flow diagram
- Custom error class templates
- Logging best practices
- Retry and circuit breaker patterns
- Error monitoring strategies

### 5. Testing Best Practices

**When to Use**:
- Writing unit tests
- Planning integration tests
- Setting up E2E testing
- Implementing TDD/BDD
- Improving test coverage

**Core Concepts**:
- Testing pyramid (Unit > Integration > E2E)
- AAA pattern (Arrange, Act, Assert)
- Mocking and stubbing
- Test coverage metrics
- TDD red-green-refactor cycle

**Key Features**:
- Testing strategy guide
- Framework recommendations (Jest, Vitest, Cypress)
- Test naming conventions
- Coverage target guidelines
- CI/CD integration tips

### 6. Documentation Writer

**When to Use**:
- Creating README files
- Documenting APIs
- Writing code comments
- Maintaining project wikis
- Creating architecture docs

**Core Concepts**:
- README structure (overview, installation, usage)
- API documentation standards (OpenAPI/Swagger)
- Code comment best practices
- Architecture Decision Records (ADR)
- Documentation maintenance

**Key Features**:
- README template with sections
- API documentation examples
- JSDoc/TSDoc comment patterns
- Markdown formatting guide
- Documentation checklist

## 🎯 Target Use Cases

### For Software Developers
- Git 워크플로우 학습 및 적용
- 코드 리뷰 스킬 향상
- REST API 설계 및 구현
- 테스트 커버리지 개선
- 기술 문서 작성

### For Tech Leads
- 팀 개발 프로세스 표준화
- 코드 리뷰 가이드라인 수립
- API 설계 표준 정립
- 품질 보증 전략 수립
- 신입 개발자 온보딩

### For Engineering Teams
- 협업 워크플로우 개선
- 코드 품질 향상
- 시스템 안정성 강화
- 문서화 체계 구축
- 베스트 프랙티스 공유

## 🔧 Technical Details

### Token Usage Breakdown

| Skill | Tokens | % of Total |
|-------|--------|------------|
| Git Workflow Korean | ~4,237 | 18.6% |
| Code Review Guidelines | ~4,562 | 20.0% |
| API Design Patterns | ~4,128 | 18.1% |
| Error Handling Strategies | ~3,891 | 17.1% |
| Testing Best Practices | ~3,456 | 15.2% |
| Documentation Writer | ~2,510 | 11.0% |
| **Total** | **~22,784** | **100%** |

### Supported Technologies

- ✅ Git / GitHub / GitLab
- ✅ REST API / GraphQL
- ✅ JavaScript / TypeScript
- ✅ Python / Java / Go
- ✅ Jest / Vitest / Pytest
- ✅ Cypress / Playwright
- ✅ Swagger / OpenAPI

## 📖 Documentation

### Quick Start Guide

1. **Install the package** (see Installation above)

2. **Start using in Claude Code**:
   ```
   You: "Help me write a proper Git commit message for adding a new feature"

   Claude: *Automatically activates git-workflow-korean skill*
   - Analyzes your changes
   - Suggests branch name
   - Generates commit message format
   - Provides PR description template
   ```

3. **Combine multiple skills**:
   ```
   You: "Review my API design and suggest proper error handling"

   Claude: *Activates api-design-patterns + error-handling-strategies*
   - Reviews API endpoints
   - Checks REST principles
   - Suggests error response format
   - Provides error handling code examples
   ```

### Best Practices

1. **Be specific about context**:
   - "Git commit message for bug fix" → Activates git-workflow-korean
   - "API design review" → Activates api-design-patterns
   - "Write unit tests" → Activates testing-best-practices

2. **Provide relevant information**:
   - Code snippets for review
   - Project context (tech stack, team size)
   - Specific goals (improve performance, add feature)

3. **Request comprehensive analysis**:
   - "Review this code for security issues"
   - "Suggest testing strategy for this module"
   - "Help me document this API endpoint"

## 🤝 Contributing

Contributions are welcome! Please feel free to submit issues or pull requests.

### Areas for Improvement

- [ ] Add GraphQL API design patterns
- [ ] Include microservices architecture guidelines
- [ ] Expand CI/CD pipeline examples
- [ ] Add container orchestration best practices
- [ ] Include performance optimization strategies

## 📄 License

MIT License - See [LICENSE](LICENSE) for details

## 🔗 Related Packages

- [@giwoong-ryu/n8n-skillset](../n8n-skillset) - n8n workflow development skills
- [@giwoong-ryu/viral-marketing](../viral-marketing) - Viral marketing and SEO skills
- [@giwoong-ryu/korean-content-creator](../korean-content-creator) - Korean content creation & proofreading

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/Giwoong-ryu/n8n-copilot/issues)
- **Website**: [Documentation](https://giwoong-ryu.github.io/n8n-copilot/)

## 🙏 Acknowledgments

Created with insights from:
- Git Best Practices (Atlassian, GitHub)
- Clean Code by Robert C. Martin
- REST API Design Best Practices
- Test-Driven Development by Kent Beck
- The Pragmatic Programmer

---

**Version**: 1.0.0
**Author**: Giwoong Ryu
**Created**: 2025-11-06
**Last Updated**: 2025-11-06
