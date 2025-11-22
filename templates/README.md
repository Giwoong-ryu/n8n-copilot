# Workflow Templates

> 📅 Last Updated: 2025-11-22  
> 🎨 Purpose: Ready-to-use n8n workflow JSON files

---

## 📁 Template Categories

### 🎯 [Marketing](./marketing/)
- YouTube Shorts automation
- Social media posting
- UGC ads generation
- Content creation pipelines

### 💼 [Sales](./sales/)
- Lead generation
- Email outreach
- CRM automation
- Follow-up sequences

### 🤖 [AI Agents](./ai_agents/)
- Customer support bots
- Content creation agents
- Data analysis agents
- Knowledge base assistants

---

## 🚀 How to Use Templates

### 1. Download Template
```bash
# Clone the repository
git clone https://github.com/yourusername/n8n-copilot.git

# Navigate to templates
cd n8n-copilot/templates
```

### 2. Import to n8n
1. Open n8n dashboard
2. Click "+" → "Import from File"
3. Select the template JSON file
4. Configure credentials and API keys

### 3. Customize
- Update API credentials
- Modify trigger conditions
- Adjust data mappings
- Test with sample data

### 4. Deploy
- Activate the workflow
- Monitor execution logs
- Optimize based on results

---

## 📊 Template Metadata

Each template includes:
- **Description**: What the workflow does
- **Prerequisites**: Required APIs and services
- **Cost**: Estimated cost per execution
- **Time**: Average execution time
- **Difficulty**: Beginner | Intermediate | Advanced

---

## 💡 Template Naming Convention

```
{category}_{workflow_name}_{version}.json

Examples:
- marketing_youtube_shorts_v2.json
- sales_lead_generation_v1.json
- ai_customer_support_bot_v3.json
```

---

## 🔧 Customization Tips

### API Keys
- Store in n8n Credentials (never hard-code)
- Use environment variables for sensitive data
- Rotate keys regularly

### Error Handling
- Add Error Trigger nodes
- Configure retry logic
- Set up notifications (Slack/Email)

### Performance
- Use Weight nodes for polling
- Batch API requests where possible
- Add appropriate delays for rate limits

---

## 📝 Contributing Templates

Want to share your workflow?

1. Export from n8n (remove sensitive data)
2. Add metadata in description
3. Test thoroughly
4. Submit pull request

See [CONTRIBUTING.md](../CONTRIBUTING.md) for details.

---

*For documentation, see [/docs](../docs/)*
