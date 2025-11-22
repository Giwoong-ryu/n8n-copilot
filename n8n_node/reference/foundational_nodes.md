# Foundational Nodes (TED 10)

> 📅 Created: 2025-11-22  
> 🎯 Purpose: Essential n8n building blocks

---

## 🧱 TED 10 Nodes - Essential n8n Building Blocks

The **TED 10** nodes are the foundational building blocks every n8n developer should master. These nodes appear in virtually every workflow and form the basis for more complex automations.

### The TED 10 Nodes

| # | Node | Purpose | Common Use Cases |
|---|------|---------|------------------|
| 1️⃣ | **Trigger** | Starts the workflow | Schedule, Webhook, Manual, Email, Slack message |
| 2️⃣ | **Edit Fields (Set)** | Transform/create data fields | Rename fields, add calculated values, restructure JSON |
| 3️⃣ | **Delay (Wait)** | Pause execution | Rate limiting, polling intervals, scheduled delays |
| 4️⃣ | **HTTP Request** | Call external APIs | REST API calls, webhooks, data fetching |
| 5️⃣ | **Code** | Custom JavaScript/Python | Complex transformations, custom logic, data processing |
| 6️⃣ | **IF** | Conditional branching | Route data based on conditions, error handling |
| 7️⃣ | **Switch** | Multi-way branching | Route to different paths based on values |
| 8️⃣ | **Loop Over Items** | Iterate through arrays | Process each item in a list sequentially |
| 9️⃣ | **Merge** | Combine data from multiple sources | Join API responses, aggregate data |
| 🔟 | **Aggregate** | Collect items into arrays | Batch processing, summarization |

### Detailed Examples

#### 1️⃣ Trigger Nodes
```
Schedule Trigger: Run daily at 9 AM
Webhook Trigger: Receive external HTTP requests
Manual Trigger: Start workflow on demand
```

#### 2️⃣ Edit Fields (Set)
```javascript
// Rename and transform fields
{
  "newName": "{{ $json.oldName }}",
  "fullName": "{{ $json.firstName }} {{ $json.lastName }}",
  "timestamp": "{{ $now.toISO() }}"
}
```

#### 3️⃣ Delay (Wait)
```
Wait 10 seconds between API calls
Wait until specific time (e.g., 2 PM)
Wait for webhook response (with timeout)
```

#### 4️⃣ HTTP Request
```javascript
// GET request example
Method: GET
URL: https://api.example.com/users
Headers: { "Authorization": "Bearer {{ $credentials.apiKey }}" }

// POST request example
Method: POST
URL: https://api.example.com/data
Body: { "name": "{{ $json.name }}", "email": "{{ $json.email }}" }
```

#### 5️⃣ Code Node
```javascript
// JavaScript example
const items = $input.all();
return items.map(item => ({
  json: {
    ...item.json,
    processed: true,
    timestamp: new Date().toISOString()
  }
}));
```

#### 6️⃣ IF Node
```javascript
// Condition examples
{{ $json.status }} === "active"
{{ $json.age }} > 18
{{ $json.email }}.includes("@company.com")
```

#### 7️⃣ Switch Node
```javascript
// Route based on value
Mode: Expression
Value: {{ $json.type }}
Outputs:
  - "customer" → Route 0
  - "vendor" → Route 1
  - "partner" → Route 2
  - default → Route 3
```

#### 8️⃣ Loop Over Items
```
Batch Size: 10 (process 10 items at a time)
Use Case: Process large datasets without overwhelming APIs
```

#### 9️⃣ Merge Node
```
Mode: Combine
Input 1: User data from database
Input 2: User activity from API
Output: Merged user profile with activity
```

#### 🔟 Aggregate Node
```
Aggregate: All Items Into One
Use Case: Collect all processed items into a single array for bulk upload
```

### Best Practices

#### Data Transformation
- Use **Edit Fields** for simple transformations
- Use **Code** node for complex logic
- Always validate data types before processing

#### Error Handling
- Add **IF** nodes to check for errors
- Use **Error Trigger** for global error handling
- Log errors to Google Sheets or Slack

#### Performance
- Use **Loop Over Items** with appropriate batch sizes
- Add **Delay** nodes to respect API rate limits
- Use **Aggregate** to reduce API calls

#### Debugging
- Use **Edit Fields** to add debug flags
- Check execution logs for each node
- Use **Manual Trigger** for testing

---

*Documentation added by AI Assistant*
*Last updated: 2025‑11‑22*
