# Image & Video Generation

> 📅 Created: 2025-11-22  
> 🎯 Purpose: AI-powered image and video generation workflows

---

## 🎬 Ultimate UGC Ads System (VO3.1 / Nano Banana + V3.1 / Sora 2)

**Goal** – Generate hyper‑realistic UGC video ads at scale by feeding product data from a Google Sheet into multiple AI image/video models (VO3.1, Nano Banana + V3.1, Sora 2) and automatically publishing the results.

### End‑to‑End Flow (Mermaid)

```mermaid
flowchart TD
    A[Google Sheet – Product rows (photo, ICP, features, video setting)] --> B[Webhook Trigger / Manual Run]
    B --> C[Get Rows (status = ready, limit 1)]
    C --> D[Switch on selected model]
    D -->|VO3.1| E[Image Prompt Agent]
    D -->|Nano Banana + V3.1| E
    D -->|Sora 2| E
    E --> F[Key AI – Image generation (Nano Banana) / direct VO3.1 image]
    F --> G[Weight (callback) – wait for image]
    G --> H[Analyze Image (OpenAI) – extract description]
    H --> I[Video Prompt Agent (uses product data + image description)]
    I --> J[Key AI – Video generation (VO3.1 or Sora 2)]
    J --> K[Weight (callback) – poll for video ready]
    K --> L[Update Google Sheet (status = finished, video URL)]
```

### Core Nodes

| # | Node | Purpose |
|---|------|---------|
| 1️⃣ | **Webhook Trigger** | Starts workflow when sheet is edited or manually run |
| 2️⃣ | **Google Sheets – Get** | Pulls one ready row (product photo, ICP, features, setting) |
| 3️⃣ | **Switch** | Routes to the selected model path (VO3.1, Nano Banana + V3.1, Sora 2) |
| 4️⃣ | **AI Agent – Image Prompt** | Generates a detailed image prompt for the product scene |
| 5️⃣ | **HTTP Request (Key AI – Image)** | Calls Nano Banana or VO3.1 to create a UGC‑style image |
| 6️⃣ | **Weight (Callback)** | Receives `execution.resumeUrl` from Key AI, avoids polling |
| 7️⃣ | **OpenAI – Image Analysis** | Summarizes generated image to keep video prompt consistent |
| 8️⃣ | **AI Agent – Video Prompt** | Builds a selfie‑style video script using product data + image info |
| 9️⃣ | **HTTP Request (Key AI – Video)** | Sends video prompt to VO3.1 or Sora 2 |
| 🔟 | **Weight (Callback) – Video** | Waits for video generation to finish |
| 1️⃣1️⃣ | **Google Sheets – Update** | Writes `finished` status and video URL back to the sheet |

### Setup Checklist (task‑style)

- [ ] **Google Sheet** – columns: `Photo URL`, `ICP`, `Features`, `Video Setting`, `Model`, `Status`, `Video URL`.
- [ ] **Key AI credential** – API key stored in n8n (supports Nano Banana, VO3.1, Sora 2).
- [ ] **OpenAI credential** – for image analysis and prompt generation (`gpt‑4.1‑mini` recommended).
- [ ] **Webhook URL** – copy production URL into the Trigger node.
- [ ] **Switch node mapping** – ensure model names match sheet values (`vo3.1`, `nano+v3.1`, `sora2`).
- [ ] **Weight node** – map `{{ $json.execution.resumeUrl }}` to `callbackUrl` in the request body.
- [ ] **Replace functions** – strip new‑lines and smart quotes before sending JSON to Key AI.
- [ ] **Error Trigger** – route to Slack/Telegram for failed generations.
- [ ] **Test run** – use a single product row, verify image → video → sheet update.
- [ ] **Version control** – export workflow JSON `UGC_Ads_System.json` to `shots/`.

### Tips & Best Practices

- **Model choice** – Nano Banana + V3.1 gives the highest visual fidelity; Sora 2 is cheaper per video (≈ $0.15 vs $0.32).  
- **Cost control** – limit batch size in the Loop node; each image ≈ $0.02, each 8‑second video ≈ $0.30 (VO3.1) or $0.15 (Sora 2).  
- **Prompt hygiene** – keep image‑prompt and video‑prompt agents separate; reuse system prompts across rows.  
- **First‑frame handling** – VO3.1 and Sora 2 prepend the source image as the first frame – consider trimming in post‑processing if not desired.  
- **Cameos for Sora 2** – if you need a realistic human, generate a cameo image with Nano Banana and feed it to Sora 2 via the `cameo` parameter.  
- **Security** – never store API keys in plain text; use n8n Credentials.  

---

## 🖼️ Photoshop AI Agent with Nano Banana (Image Generation & Editing)

**Goal** – Provide a no‑code n8n workflow that lets you generate, edit, and manage images via Google Drive and the Nano Banana model, all controlled through a Telegram chat.

### End‑to‑End Flow (Mermaid)

```mermaid
flowchart TD
    A[Telegram – Receive Message] --> B[Input Router (text vs image)]
    B -->|image| C[Upload to Google Drive]
    B -->|text| D[Pass prompt directly]
    C --> E[Change Name Tool]
    E --> F[Choose Action: Combine / Edit]
    F --> G[Prepare Image URLs (imageBB service)]
    G --> H[Nano Banana via FAL AI (create / edit)]
    H --> I[Polling for Completion]
    I --> J[Download Result & Upload to Drive]
    J --> K[Respond to Telegram with link]
```

### Core Nodes

| # | Node | Purpose |
|---|------|---------|
| 1️⃣ | **Telegram Trigger** | Listens for user messages (text or photo). |
| 2️⃣ | **Switch (Input Router)** | Detects whether the incoming payload contains an image or just text. |
| 3️⃣ | **Google Drive – Upload** | Stores incoming photos in a `media/raw` folder. |
| 4️⃣ | **Change Name Tool** | Renames the uploaded file based on user input. |
| 5️⃣ | **Action Selector** (custom workflow) | Decides between *Combine Images* or *Edit Image* based on user request. |
| 6️⃣ | **ImageBB (HTTP Request)** | Converts binary files from Drive into public URLs required by Nano Banana. |
| 7️⃣ | **FAL AI – Nano Banana (HTTP Request)** | Calls the Nano Banana API to generate or edit images. |
| 8️⃣ | **Weight (Callback / Polling)** | Repeatedly checks the FAL AI job status until finished. |
| 9️⃣ | **Google Drive – Upload Result** | Saves the generated image into `media/ai_generated`. |
| 🔟 | **Telegram – Send Message** | Returns the Drive link (or preview) to the user. |

### Setup Checklist (task‑style)

- [ ] **Create Google Drive folders** – `media/raw` and `media/ai_generated`.
- [ ] **Add Telegram credential** – Bot token and chat ID mapping.
- [ ] **Add FAL AI credential** – API key for Nano Banana (or other models).
- [ ] **Add ImageBB credential** – optional API key for public URL service.
- [ ] **Configure system prompt** for the main agent (e.g., *"You are a Photoshop assistant…"*).
- [ ] **Map tool inputs** – ensure the agent passes `image_one_id`, `image_two_id`, and `image_title` correctly.
- [ ] **Set up polling intervals** – adjust the Weight node timeout (default 30 s, can be lowered).
- [ ] **Error Trigger** – route failures (e.g., API error, missing file) to a Slack/Telegram alert.
- [ ] **Test scenarios** –
  - Upload a photo, rename it, and request *"Create a photorealistic ad of this bag of granola in front of the Eiffel Tower"*.
  - Upload two photos and ask to *"Combine them so the person holds the granola on a mountain"*.
- [ ] **Version control** – export the workflow JSON as `Photoshop_AI_Agent.json` to `shots/`.

### Tips & Best Practices

- **Prompt hygiene** – keep prompts concise; use placeholders like `{image_one}` and `{image_two}` in the system prompt.
- **Public URL workaround** – ImageBB is a quick free service; for production you may host images on a CDN.
- **Cost awareness** – Nano Banana costs ~ $0.04 per image; batch multiple edits when possible.
- **Logging** – add a Google Sheet logger node to capture each request, tool used, token count, and runtime.
- **Extensibility** – you can add a second AI node that specializes in generating the image prompt before sending it to Nano Banana.
- **Security** – keep all API keys in n8n Credentials; never hard‑code them in the workflow.

---

## 🚀 Sora 2 AI Video Agent (Text‑to‑Video, Image‑to‑Video, Cameos, Storyboards)

**Goal** – Leverage the Sora 2 model (via Kai AI/FAL AI) in n8n to generate high‑quality, watermark‑free videos at a fraction of the cost of OpenAI, with support for text‑to‑video, image‑to‑video, cameo personalities, and multi‑scene storyboards.

### End‑to‑End Flow (Mermaid)

```mermaid
flowchart TD
    A[Telegram / HTTP Trigger] --> B[Input Router (text vs image vs cameo)]
    B -->|text| C[Prepare Text‑to‑Video Payload]
    B -->|image| D[Prepare Image‑to‑Video Payload]
    B -->|cameo| E[Resolve Cameo ID]
    C --> F[HTTP Request – Sora 2 Create (text)]
    D --> F[HTTP Request – Sora 2 Create (image)]
    E --> F[HTTP Request – Sora 2 Create (cameo)]
    F --> G[Weight (Polling) – check job status]
    G --> H[Extract Result URLs]
    H --> I[Google Drive – Save Video & Metadata]
    I --> J[Telegram / Slack – Send Result Link]
```

### Core Nodes

| # | Node | Purpose |
|---|------|---------|
| 1️⃣ | **Trigger** (Telegram / Webhook) | Starts the workflow with a user request (text prompt, image URL, or cameo name). |
| 2️⃣ | **Switch (Input Router)** | Routes the request to the appropriate payload builder (text, image, cameo). |
| 3️⃣ | **Prepare Payload** | Builds the JSON body for the Sora 2 API – includes `model`, `prompt`, `aspectRatio`, `frames`, `removeWatermark`, optional `imageUrls`, `cameo`. |
| 4️⃣ | **HTTP Request – Sora 2 Create** | Sends the payload to Kai AI/FAL AI endpoint, returns a `taskId`. |
| 5️⃣ | **Weight (Polling)** | Repeatedly calls the *Query Task* endpoint until `state` is `success` (or `failed`). |
| 6️⃣ | **Extract Result URLs** | Parses the response to obtain the watermark‑free video URL (and optional preview). |
| 7️⃣ | **Google Drive – Upload Video** | Saves the video into `media/sora_videos` for archival and sharing. |
| 8️⃣ | **Telegram / Slack – Send Message** | Returns the Drive link (or preview) to the requester. |
| 9️⃣ | **Error Trigger** | Sends alerts if the job fails or returns an error code. |

### Setup Checklist (task‑style)

- [ ] **Create Google Drive folders** – `media/raw`, `media/sora_videos`.
- [ ] **Add Kai AI (FAL AI) credential** – API key for Sora 2.
- [ ] **Add Telegram credential** – Bot token and chat ID (or other webhook source).
- [ ] **Configure system prompt** for the main agent (e.g., *"You are a video generation assistant using Sora 2. You have three tools: text‑to‑video, image‑to‑video, cameo‑to‑video."*).
- [ ] **Map tool inputs** – ensure the agent passes `prompt`, optional `imageUrl`, optional `cameoName`, `aspectRatio`, `frames`, `removeWatermark`.
- [ ] **Set polling interval** – Weight node timeout default 10 s, max retries ~30 (adjust for longer storyboards).
- [ ] **Error handling** – route `failed` state to Slack/Telegram with error details.
- [ ] **Test scenarios** –
  - Text‑to‑Video: *"A young man throws a coffee mug against a wall."*
  - Image‑to‑Video: use a product image URL and prompt *"Selfie‑style UGC video of a woman showcasing the product in a car."*
  - Cameo: *"Sam Alman explains gravity in a car selfie video."*
  - Storyboard: three‑scene script with consistent character and custom timings.
- [ ] **Version control** – export the workflow JSON as `Sora2_Video_Agent.json` to `shots/`.

### Tips & Best Practices

- **Prompt hygiene** – describe subject, appearance, clothing, setting, lighting, camera angle, movement, and audio style. Use a system prompt like:
  > "You are a video‑prompt engineer. Convert raw ideas into detailed Sora 2 prompts covering subject, background, lighting, camera lens, motion, and narration."
- **Cameo handling** – verify cameo names exist in Kai AI; fallback to generic avatar if not found.
- **Storyboard timing** – total duration must equal sum of scene `frames` (10, 15, 25 s).
- **Cost awareness** – Sora 2 ≈ $0.015 / s on Kai AI (≈ $0.04 / s on OpenAI). Keep `frames` minimal for cheap tests.
- **Polling optimisation** – use a Switch after the Weight node to branch on `state` (`generating`, `success`, `failed`).
- **Logging** – add a Google Sheet logger node to capture request payload, `taskId`, final URL, runtime, and any errors.
- **Security** – store all API keys in n8n Credentials; never hard‑code them.
- **Error patterns** – 500 errors often indicate rate‑limit or content‑policy blocks; add retry logic or fallback prompts.

---

*Documentation added by AI Assistant*
*Last updated: 2025‑11‑22*
