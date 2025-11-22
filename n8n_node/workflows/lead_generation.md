# Lead Generation

> 📅 Created: 2025-11-22  
> 🎯 Purpose: Automated lead generation and enrichment workflows

---

## 🚀 Apollo Replacement Lead Generation (n8n + LinkedIn + Perplexity + Instantly)

**Goal** – After Apollo's scraper block, use n8n to manually extract leads from Apollo (or alternatives), scrape LinkedIn profiles, conduct background research with Perplexity, generate custom messages, and upload to Instantly.

### End‑to‑End Flow (Mermaid)
```mermaid
flowchart TD
    A[Form: Google Sheet (Lead list) / Manual Apollo export] --> B[Webhook Trigger]
    B --> C[Google Sheets – Get rows]
    C --> D[Loop Over Items]
    D --> E[HTTP Request (Apify – LinkedIn profile scraper)]
    E --> F[Weight (callback) – wait for profile data]
    F --> G[HTTP Request (Perplexity) – background research]
    G --> H[OpenAI (Prompt Optimizer) – generate personalized ice‑breaker & message]
    H --> I[Merge Node – combine profile + research + message]
    I --> J[Instantly – Upload contact & message]
    J --> K[Update Google Sheet status]
```

### Core Nodes
| # | Node | Purpose |
|---|------|---------|
| 1️⃣ | **Webhook Trigger** | Form submission (or manual file upload) starts workflow |
| 2️⃣ | **Google Sheets – Get** | Reads lead list (email, name, company, etc.) |
| 3️⃣ | **Loop Over Items** | Sequential processing for each lead (batch ≤ 10) |
| 4️⃣ | **HTTP Request (Apify – LinkedIn)** | Loads LinkedIn profile URL → returns name, title, experience, skills |
| 5️⃣ | **Weight (Callback) Node** | Passes `execution.resumeUrl` to Apify, instant notification on completion |
| 6️⃣ | **HTTP Request (Perplexity)** | Personal/company background research (keywords, recent news) |
| 7️⃣ | **OpenAI (Prompt Optimizer)** | Generates "Ice‑breaker" and full email body (system prompt specifies tone/key points) |
| 8️⃣ | **Merge Node** | Combines profile, research, generated message into one object |
| 9️⃣ | **Instantly – Upload** | Sends email, name, normalized company name, custom message |
| 🔟 | **Google Sheets – Update** | Records status (`sent`, `error`) in sheet |

### Setup Checklist (task‑style)
- [ ] **Google Sheet** – `Leads` table with `Email`, `First Name`, `Last Name`, `Company`, `LinkedIn URL`, `Status` columns
- [ ] **Apify credential** – Bearer token stored in n8n (actor: `linkedin-profile-scraper-no-cookies`)
- [ ] **Perplexity API key** – stored in n8n credential, model `sonar-small`
- [ ] **OpenAI credential** – model `gpt‑4.1‑mini` (summary) and `gpt‑4o‑mini` (message generation)
- [ ] **Instantly API key & Campaign ID** – n8n HTTP Request header `Authorization: Bearer <key>` and `campaignId` parameter
- [ ] **Webhook URL** – Production webhook URL (prefix only) pasted into Webhook Trigger
- [ ] **Weight node** – map `{{ $json.execution.resumeUrl }}` to Apify payload `callbackUrl`
- [ ] **Chunking** – `Loop` batch size limited to 5‑10, prevent excessive token usage
- [ ] **Error Trigger** – connected to entire flow, Slack/Telegram alert setup
- [ ] **Test run** – 3‑5 sample leads to verify entire flow, check Instantly dashboard for campaign
- [ ] **Version control** – export workflow JSON `Apollo_Replace_LeadGen.json` to `shots/` folder

### Tips & Best Practices
- **Callback over polling** – Weight node ensures Apify returns instantly on completion, eliminates unnecessary GET‑loops
- **Profile normalization** – clean `company` string from LinkedIn with `replace(/\b(Inc|LLC|Corp)\b/gi, "")` before passing to Instantly
- **Perplexity cost management** – use 1‑2 questions per lead, limit `maxTokens` to 200
- **Prompt optimization** – system prompt specifies "include personalized question for customer, keep concise to 2‑3 sentences"
- **Security** – all API keys stored in n8n Credentials, never include in plain text files
- **Reusability** – this workflow can swap `Airtable` for `Google Sheets`, just replace `Airtable` node and it works identically

---

*Documentation added by AI Assistant*
*Last updated: 2025‑11‑22*
