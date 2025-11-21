# N8N Claude Code Skills Reference

This document contains critical N8N skills and patterns extracted from the `.claude/skills` directory.
It serves as the source of truth for the AI Copilot's system prompt.

## 1. n8n Expression Syntax
**Source**: `n8n-expression-syntax/SKILL.md`

### Core Rules
1.  **Always use {{ }}**: All dynamic content must be wrapped in double curly braces.
    -   ✅ `{{$json.email}}`
    -   ❌ `$json.email`
2.  **Webhook Data Location**: Webhook data is **NOT** at the root. It is under `.body`.
    -   ✅ `{{$json.body.name}}`
    -   ❌ `{{$json.name}}`
3.  **Node Names with Spaces**: Use bracket notation and quotes.
    -   ✅ `{{$node["HTTP Request"].json.data}}`
    -   ❌ `{{$node.HTTP Request.json.data}}`
4.  **Case Sensitivity**: Node names must match exactly.
    -   ✅ `{{$node["HTTP Request"]}}`
    -   ❌ `{{$node["http request"]}}`
5.  **No Nested Braces**: Don't double-wrap.
    -   ✅ `{{$json.field}}`
    -   ❌ `{{{$json.field}}}`

### Common Variables
-   `$json`: Current node output
-   `$node["Name"]`: Output of previous node
-   `$now`: Current timestamp (Luxon)
-   `$env`: Environment variables

---

## 2. n8n Code Node (JavaScript)
**Source**: `n8n-code-javascript/SKILL.md`

### Essential Rules
1.  **Return Format**: Must return an array of objects with a `json` property.
    -   ✅ `return [{json: {key: value}}];`
    -   ❌ `return {key: value};`
2.  **Data Access**:
    -   `$input.all()`: Get all items (Recommended for "Run Once for All Items")
    -   `$input.first()`: Get first item
    -   `$input.item`: Get current item ("Run Once for Each Item" mode only)
3.  **No Expressions**: Do **NOT** use `{{}}` inside Code nodes. Use standard JavaScript.
    -   ✅ `const email = $json.body.email;`
    -   ❌ `const email = "{{$json.body.email}}";`
4.  **Webhook Data**: Same as expressions, data is under `$json.body`.
5.  **Built-in Helpers**:
    -   `$helpers.httpRequest()`
    -   `DateTime` (Luxon)
    -   `$jmespath()`

### Common Patterns
-   **Mapping**: `return $input.all().map(item => ({json: { newField: item.json.oldField }}));`
-   **Filtering**: `const valid = $input.all().filter(item => item.json.isValid);`
-   **Aggregation**: `const total = $input.all().reduce((sum, item) => sum + item.json.amount, 0);`

---

## 3. n8n MCP Tools & Node Configuration
**Source**: `n8n-mcp-tools-expert/SKILL.md`

### Node Type Formats
-   **Search/Validate**: `nodes-base.slack` (Short prefix)
-   **Workflow Creation**: `n8n-nodes-base.slack` (Full prefix)

### Smart Parameters
-   **IF Node**: Use `branch="true"` or `branch="false"` instead of output index.
-   **Switch Node**: Use `case=0`, `case=1` etc.

### Validation Profiles
-   `minimal`: Required fields only
-   `runtime`: Values + types (Recommended)
-   `strict`: Maximum validation

### Common Mistakes
-   Using `get_node_info` (slow, heavy) instead of `get_node_essentials` (fast, focused).
-   Ignoring auto-sanitization (binary operators like `equals` remove `singleValue` property).
