# @giwoong-ryu/n8n-skillset

> Comprehensive n8n workflow development skills for Claude Code

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![npm version](https://badge.fury.io/js/@giwoong-ryu%2Fn8n-skillset.svg)](https://badge.fury.io/js/@giwoong-ryu%2Fn8n-skillset)

A professional skillset package for building n8n workflows with Claude Code, containing 6 essential skills covering everything from workflow patterns to MCP tools.

## 📦 Installation

```bash
npx claude-plugins install @giwoong-ryu/n8n-skillset
```

## 🎯 What's Included

This package contains **6 comprehensive skills** (~20,408 tokens total):

### 1. n8n-workflow-patterns (~2,871 tokens)
5 core workflow patterns for common automation scenarios:
- **Webhook Processing**: Real-time data handling
- **HTTP API Integration**: External API data fetching
- **Database Operations**: CRUD with databases
- **AI Agent Workflow**: AI-powered automation
- **Scheduled Tasks**: Periodic automation

**Example patterns:**
- E-commerce order processing
- Content publishing pipeline
- Customer support automation

### 2. n8n-node-configuration (~4,258 tokens)
Complete node configuration guide with operation-specific requirements:
- HTTP Request, Database, Code, Set, IF, Loop, Merge nodes
- Operation dependencies and requirements
- Common configuration errors and fixes
- Performance optimization tips

### 3. n8n-validation-expert (~3,664 tokens)
Expert validation and error handling:
- 5 common validation error types
- 3 validation profiles (API, Database, Webhook)
- Error handling strategies
- Debugging workflows

### 4. n8n-code-javascript (~4,027 tokens)
JavaScript in n8n Code nodes:
- `$input`, `$json`, `$node`, `$workflow`, `$helpers`
- Execution modes (Run Once vs Run Once for Each Item)
- Common patterns (transformation, filtering, aggregation)
- Working with dates, arrays, objects
- Async/await and parallel requests

### 5. n8n-expression-syntax (~2,400 tokens)
Master `{{ }}` expressions:
- Data access (`$json`, `$node`, `$input`)
- Webhook data handling (GET params, POST body, headers)
- String, number, date operations
- Conditional expressions and safe access
- Common error fixes

### 6. n8n-mcp-tools-expert (~3,188 tokens)
n8n MCP (Model Context Protocol) tools:
- `search_nodes`: Find nodes by functionality
- `validate`: Validate workflow configurations
- `create`: Create workflows programmatically
- Advanced patterns and templates

## 🚀 Usage Examples

### Building a Webhook to Database Workflow

```
"Create an n8n workflow that receives webhook data,
validates it, transforms it, and saves to Supabase"
```

Claude will use:
- **n8n-workflow-patterns**: Webhook processing pattern
- **n8n-node-configuration**: Supabase node setup
- **n8n-validation-expert**: Data validation
- **n8n-expression-syntax**: Data transformation

### Debugging a Failing Workflow

```
"My n8n workflow shows 'Cannot read property X of undefined'
error in the Set node"
```

Claude will use:
- **n8n-validation-expert**: Diagnose the error
- **n8n-expression-syntax**: Fix the expression
- **n8n-code-javascript**: Alternative solution

### Creating a Complex Automation

```
"Build an n8n workflow that monitors an API every hour,
processes the data with AI, and sends alerts to Slack"
```

Claude will use:
- **n8n-workflow-patterns**: Scheduled + AI pattern
- **n8n-node-configuration**: Configure all nodes
- **n8n-code-javascript**: Data processing logic
- **n8n-expression-syntax**: Dynamic values

## 📊 Token Usage

| Skill | Tokens | Size |
|-------|--------|------|
| n8n-workflow-patterns | ~2,871 | Medium |
| n8n-node-configuration | ~4,258 | Large |
| n8n-validation-expert | ~3,664 | Medium |
| n8n-code-javascript | ~4,027 | Medium |
| n8n-expression-syntax | ~2,400 | Small |
| n8n-mcp-tools-expert | ~3,188 | Medium |
| **Total** | **~20,408** | **Optimal** |

## 🎓 Learning Path

### Beginners
1. Start with **n8n-workflow-patterns** to understand common patterns
2. Learn **n8n-node-configuration** for basic node setup
3. Use **n8n-expression-syntax** for simple data access

### Intermediate
4. Master **n8n-validation-expert** for debugging
5. Deep dive into **n8n-code-javascript** for complex logic
6. Explore **n8n-mcp-tools-expert** for automation

## 🛠️ Use Cases

### ✅ Perfect For
- Building n8n workflows from scratch
- Debugging existing workflows
- Learning n8n best practices
- Automating workflow creation
- Understanding node configurations
- Mastering expressions and code nodes

### ❌ Not Suitable For
- Non-n8n workflow automation
- Frontend development
- Database schema design
- API development

## 🔗 Related Packages

- **@giwoong-ryu/korean-content-creator**: Korean content creation skills
- **@giwoong-ryu/dev-productivity**: General development productivity

## 📖 Documentation

Full documentation for each skill is available in the `skills/` directory:
- [n8n-workflow-patterns](./skills/n8n-workflow-patterns/SKILL.md)
- [n8n-node-configuration](./skills/n8n-node-configuration/SKILL.md)
- [n8n-validation-expert](./skills/n8n-validation-expert/SKILL.md)
- [n8n-code-javascript](./skills/n8n-code-javascript/SKILL.md)
- [n8n-expression-syntax](./skills/n8n-expression-syntax/SKILL.md)
- [n8n-mcp-tools-expert](./skills/n8n-mcp-tools-expert/SKILL.md)

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👤 Author

**Giwoong Ryu**
- GitHub: [@Giwoong-ryu](https://github.com/Giwoong-ryu)
- Website: https://giwoong-ryu.github.io/n8n-copilot/

## 🙏 Acknowledgments

- n8n team for the amazing workflow automation platform
- Claude Code team for the extensibility framework
- The open-source community

## 📊 Stats

- **Total Skills**: 6
- **Total Token Count**: ~20,408
- **Average Skill Size**: ~3,401 tokens
- **Maintenance**: Active
- **Quality**: Production-ready

---

**Made with ❤️ for the n8n and Claude Code communities**
