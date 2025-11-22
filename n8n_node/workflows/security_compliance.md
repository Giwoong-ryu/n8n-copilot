# Security & Compliance

> 📅 Created: 2025-11-22  
> 🎯 Purpose: Security, compliance, and guardrails workflows

---

## 🛡️ n8n Guardrails Nodes (Check Text & Sanitize Text)

**Goal** – Secure your automations by automatically detecting or removing sensitive or disallowed content before it reaches LLMs or external systems.

### Guardrail Types

| Node | Operation | Description |
|---|---|---|
| **Check Text for Violations** | AI‑based guardrail | Scans incoming/outgoing text against a library of built‑in or custom rules (keywords, jailbreak, NSFW, PII, secret keys, topical alignment, URLs, custom). Returns pass/fail branches and a confidence score. |
| **Sanitize Text** | Non‑AI sanitisation | Removes or masks detected entities (PII, secret keys, URLs) without sending data to an LLM. Useful for GDPR/PCI compliance. |

### Built‑in Guardrails (examples)

| Guardrail | What it detects | Typical use |
|---|---|---|
| **Keywords** | Specific words/phrases (e.g., `password`, `system`) | Block accidental credential leaks. |
| **Jailbreak** | Prompt‑injection attempts | Prevent LLMs from being forced to ignore policies. |
| **NSFW** | Adult, violent, hateful content | Keep Slack/Teams channels safe. |
| **PII / Personal Data** | Emails, phone numbers, SSNs, credit cards, addresses, dates, etc. | GDPR/CCPA compliance. |
| **Secret Keys** | API keys, passwords, tokens | Prevent credential exposure. |
| **Topical Alignment** | Out‑of‑scope topics (e.g., sports in a finance bot) | Enforce domain‑specific conversations. |
| **URLs** | Allowed/blocked URL schemes, domains, sub‑domains | Stop phishing links or restrict external calls. |
| **Custom** | User‑defined prompt or regex | Tailor to niche policies. |

### Example Workflow (simplified)

```mermaid
flowchart TD
    A[Trigger – New Slack Message] --> B[Check Text for Violations (keywords, PII, NSFW)]
    B -->|pass| C[Send to LLM]
    B -->|fail| D[Error Trigger – Notify Security Channel]
    C --> E[Sanitize Text (PII, secret keys)]
    E --> F[LLM Request]
    F --> G[Send Response Back]
```

### Setup Checklist (task‑style)

- [ ] **Add Guardrail Nodes** – drag **Check Text for Violations** and **Sanitize Text** into your workflow.
- [ ] **Select Guardrails** – enable the ones you need (keywords, PII, etc.) and configure their parameters (keyword list, threshold, allowed URLs, regex, etc.).
- [ ] **Configure Thresholds** – adjust confidence scores (0‑1) to balance false‑positives vs. security.
- [ ] **Map Input** – connect the text you want inspected (e.g., `{{ $json.message }}`) to the node's *Text to check* field.
- [ ] **Branch Logic** – use the *Pass* and *Fail* outputs to route safe vs. flagged data (e.g., continue workflow or alert Slack).
- [ ] **Sanitise Sensitive Data** – after a successful guardrail check, add a **Sanitize Text** node for PII/secret keys before sending to an LLM.
- [ ] **Test Cases** – run a few messages through the workflow:
  - "Please update the system settings" (should fail keyword guardrail).
  - "My email is john@example.com" (should be redacted by PII sanitiser).
  - "Here is my API key: abc123‑def456‑ghi789" (should be blocked or masked).
- [ ] **Version control** – export the workflow JSON as `Guardrails_Workflow.json` to `shots/`.

### Tips & Best Practices

- **Stack Guardrails** – you can enable multiple guardrails in a single **Check Text** node; the node will evaluate all selected rules and fail if any trigger.
- **Custom Guardrails** – use a custom prompt or regex when built‑in options don't cover your policy.
- **Performance** – the **Sanitize Text** node runs locally and is fast; the AI‑based **Check Text** node adds a small latency (≈ 200 ms) but provides richer detection.
- **Logging** – add a Google Sheet logger to capture the original text, detected violations, and actions taken for audit trails.
- **Error Handling** – route the *Fail* branch to an **Error Trigger** or a Slack notification to ensure compliance teams are alerted.
- **Security** – keep all guardrail configuration (keyword lists, regexes) in n8n Credentials or environment variables, not hard‑coded in the workflow.

---

*Documentation added by AI Assistant*
*Last updated: 2025‑11‑22*
