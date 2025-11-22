# AI Agents

> 📅 Created: 2025-11-22  
> 🎯 Purpose: AI agent workflows for automation and intelligence

---

## 🧠 AI Agent to Clone YouTubers' Brains

**Goal** – Build an AI agent that replicates a specific YouTuber's knowledge, speech patterns, and personality by learning from their YouTube content.

### End‑to‑End Flow (Mermaid)
```mermaid
flowchart TD
    A[Form: YouTube URL + video count] --> B[Webhook Trigger]
    B --> C[Apify Scraper – Get video URLs]
    C --> D[Apify Scraper – Get transcripts]
    D --> E[OpenAI Analyzer – Summarize each transcript]
    E --> F[Aggregate – combine all summaries]
    F --> G[Prompt Generator – create system prompt (persona)]
    G --> H[OpenAI Agent – instantiate AI consultant]
    H --> I[Telegram Trigger] --> J[Send response]
```

### Core Nodes
| # | Node | Purpose |
|---|------|---------|
| 1️⃣ | **Webhook Trigger** | Starts when user submits form in Airtable. |
| 2️⃣ | **Airtable – Get** | Pulls channel URL & count. |
| 3️⃣ | **HTTP Request (Apify – URLs)** | Calls Apify actor to list top N video URLs. |
| 4️⃣ | **HTTP Request (Apify – Transcripts)** | Retrieves transcript for each URL. |
| 5️⃣ | **OpenAI (Summarizer)** | Extracts key points, tone, recurring pillars. |
| 6️⃣ | **Aggregate** | Merges all per‑video analyses into one array. |
| 7️⃣ | **OpenAI (Prompt Generator)** | Builds a system prompt describing the persona. |
| 8️⃣ | **OpenAI Agent** | Loads the system prompt; serves as the cloned consultant. |
| 9️⃣ | **Telegram Trigger** | Receives user questions. |
| 🔟 | **OpenAI Agent (Chat)** | Answers using the cloned persona. |
| 1️⃣1️⃣ | **Telegram Send** | Returns answer to user. |

### Setup Checklist (task‑style)
- [ ] **Airtable base** – create table with fields `Channel URL`, `Video Count`, `Status`. Add button `Start Clone`.
- [ ] **Create Apify credentials** – bearer token in n8n credential.
- [ ] **Configure Webhook Trigger** – paste production webhook URL (before `?`).
- [ ] **Map Airtable fields** to Apify payload (`channelUrl`, `maxResults`).
- [ ] **Add Weight node** after each Apify call to use `execution.resumeUrl` as callback.
- [ ] **Set up OpenAI credentials** – model `gpt‑4.1‑mini` for summarization, `gpt‑4o‑mini` for final persona.
- [ ] **Prompt Generator** – system prompt: "Create a concise system prompt that captures the creator's voice, core pillars, typical phrasing, and advice style."
- [ ] **Create Telegram credential** (Bot token) and add Trigger & Send nodes.
- [ ] **Connect Error Trigger** → Slack/Telegram alert workflow.
- [ ] **Test end‑to‑end** with a small channel (e.g., 5 videos) and verify persona prompt in OpenAI logs.
- [ ] **Version control** – export JSON workflows `Clone_YouTuber_Img.json` and `Clone_YouTuber_Chat.json` to `shots/`.

### Tips & Best Practices
- **Callback over polling** – Weight node ensures instant notification when Apify finishes.
- **Prompt optimizer** – run the raw summary through an OpenAI node to clean up tone before generating the system prompt.
- **Chunking** – if >10 videos, split into batches to stay within token limits.
- **Cost monitoring** – summarization is cheap; final persona generation can use a larger model only once.
- **Security** – keep API keys in n8n credentials, never hard‑code them.
- **Reuse** – the persona generation workflow can be used for any creator; just change the Airtable record.

---

## 📊 Sales Data AI Agent with n8n Data Tables

**Goal** – Enable an AI agent to answer sales‑related questions (e.g., total revenue, units sold, averages) by querying data stored in n8n **Data Tables** and using built‑in tools like *product‑name query*, *date query*, and the *calculator*.

### End‑to‑End Flow (Mermaid)

```mermaid
flowchart TD
    A[Manual Trigger / Webhook] --> B[Get Rows (Data Table – optional filter)]
    B --> C[AI Agent – system prompt defines available tools]
    C --> D[Tool: Product‑Name / Date / ID Query] --> E[Calculator] --> F[Return answer to chat]
    F --> G[Update Google Sheet / Send email with result]
```

### Core Nodes

| # | Node | Purpose |
|---|------|---------|
| 1️⃣ | **Manual Trigger / Webhook** | Starts the query (can be a chat UI or scheduled run). |
| 2️⃣ | **Data Tables – Get Rows** | Pulls rows from a *Sales* data table; optional filter (product, date, ID). |
| 3️⃣ | **AI Agent** | System message lists the available tools (product‑name query, date query, calculator). |
| 4️⃣ | **Tool – Product‑Name Query** | Filters rows where `product_name` equals the supplied value. |
| 5️⃣ | **Tool – Date Query** | Filters rows where `date_sold` matches the supplied date string. |
| 6️⃣ | **Tool – ID Query** | Filters rows by `product_id`. |
| 7️⃣ | **Calculator** | Performs arithmetic on the filtered rows (sum, average, count). |
| 8️⃣ | **Google Sheets – Update** | (Optional) writes the answer back to a sheet for reporting. |
| 9️⃣ | **Email / Slack Send** | (Optional) notifies the requester with the result. |

### Setup Checklist (task‑style)

- [ ] **Create a Data Table** – columns: `created_at`, `updated_at`, `date_sold` (string), `product_name`, `product_id`, `quantity`, `price`, `revenue`.
- [ ] **Import existing sales data** – use the *Data Tables* node to upsert rows from a Google Sheet.
- [ ] **Define system prompt** for the AI agent that lists the three query tools and the calculator.
- [ ] **Map tool inputs** – bind the user‑provided value (e.g., "Bluetooth speaker") to the appropriate query node.
- [ ] **Add a Manual Trigger** – expose a simple UI (n8n UI, Slack command, or webhook) for asking questions.
- [ ] **Configure output** – decide whether to return the answer in the chat, write to a sheet, or send an email.
- [ ] **Error Trigger** – route failures (e.g., no matching rows) to Slack/Telegram alerts.
- [ ] **Test cases** – ask a few sample questions:
  - *"How many units were sold on 2025‑09‑15?"*
  - *"What is total revenue for Bluetooth speaker?"*
  - *"Average daily sales for product ID BS002?"*
- [ ] **Version control** – export the workflow JSON as `Sales_Data_AI_Agent.json` to `shots/`.

### Tips & Best Practices

- **Keep dates as strings** if your source sheet uses `YYYY‑MM‑DD`; the Data Table node treats them as strings, which works for simple equality filters.
- **Use the calculator** for any aggregation (sum, average, count) – it guarantees numeric precision and avoids manual scripting.
- **Limit rows** – when dealing with large tables, add a `limit` parameter in the *Get Rows* node to keep token usage low.
- **Cache frequent queries** – store common results in a separate Data Table to avoid repeated calculations.
- **Security** – Data Tables are stored internally; no external credentials are required, but protect workflow access via n8n permissions.
- **Performance** – For bulk writes (e.g., 400 rows) the Data Table node is comparable to Google Sheets; for single‑row inserts it is near‑instant.

---

*Documentation added by AI Assistant*
*Last updated: 2025‑11‑22*
