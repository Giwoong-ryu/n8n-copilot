# n8n Workflow Patterns

## Purpose
Provides 5 core n8n workflow patterns for common automation scenarios.

## When to Use
- Building new n8n workflows
- Choosing the right pattern for automation needs
- Understanding best practices for each pattern

## Core Workflow Patterns

### 1. Webhook Processing
**Use Case**: Receive and process external data in real-time

```
Pattern:
Webhook Trigger → Data Transformation → Action Nodes → Response

Example:
Webhook → Code (validate) → Set → Supabase → Respond to Webhook
```

**Best Practices**:
- Always validate incoming data
- Use Set node to structure data
- Return appropriate HTTP status codes
- Handle errors gracefully with Error Trigger

### 2. HTTP API Integration
**Use Case**: Fetch data from external APIs and process

```
Pattern:
Schedule/Manual Trigger → HTTP Request → Process Data → Store/Notify

Example:
Schedule (Daily 9AM) → HTTP Request (Weather API) → IF (temperature check) → Slack
```

**Best Practices**:
- Use authentication headers properly
- Handle pagination for large datasets
- Implement retry logic for failed requests
- Cache responses when appropriate

### 3. Database Operations
**Use Case**: CRUD operations with databases

```
Pattern:
Trigger → Database Query → Data Processing → Database Update

Example:
Webhook → Supabase (Get) → Code (calculate) → Supabase (Update) → Email
```

**Best Practices**:
- Use parameterized queries
- Batch operations for better performance
- Handle concurrent updates carefully
- Implement proper error handling

### 4. AI Agent Workflow
**Use Case**: AI-powered automation with context

```
Pattern:
Trigger → Collect Context → AI Node → Process Response → Action

Example:
Gmail Trigger → Get Email Content → OpenAI → Code (format) → Slack + Email Reply
```

**Best Practices**:
- Provide clear context to AI
- Structure AI responses consistently
- Implement fallback for AI failures
- Monitor token usage

### 5. Scheduled Tasks
**Use Case**: Periodic automation and maintenance

```
Pattern:
Schedule Trigger → Check Conditions → Process → Notify

Example:
Schedule (Every Hour) → HTTP Request (check status) → IF (down) → PagerDuty + Slack
```

**Best Practices**:
- Set appropriate intervals
- Implement idempotency
- Add monitoring and alerts
- Use error workflows

## Pattern Selection Guide

| Need | Pattern | Example |
|------|---------|---------|
| Real-time events | Webhook | Form submissions, GitHub webhooks |
| External data | HTTP API | Weather, stock prices, news |
| Data management | Database | User management, inventory |
| Intelligent processing | AI Agent | Email categorization, content generation |
| Periodic tasks | Scheduled | Reports, backups, monitoring |

## Common Combinations

### E-commerce Order Processing
```
Webhook (Order) → Database (Save) → AI (Fraud check) → Email + Slack
```

### Content Publishing Pipeline
```
Schedule → Database (Get drafts) → AI (Review) → HTTP (Publish) → Slack
```

### Customer Support Automation
```
Email Trigger → AI (Categorize) → Database (Save) → IF → Slack/PagerDuty
```

## Anti-Patterns to Avoid

❌ **Polling instead of webhooks**: Use webhooks when available
❌ **No error handling**: Always add Error Trigger nodes
❌ **Synchronous long operations**: Use Queue node for heavy tasks
❌ **Hardcoded values**: Use environment variables
❌ **No data validation**: Always validate external inputs

## Token Count
~2,871 tokens
