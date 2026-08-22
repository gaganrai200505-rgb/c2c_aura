# TruthDNA — Forensic Media Analysis

> **The Golden Rule:** TruthDNA NEVER outputs a binary TRUE/FALSE or REAL/FAKE verdict.
> All analysis is delivered as a **3-pillar diagnostic**:
> 1. **Evidence** — Concrete forensic observations per dimension
> 2. **Confidence** — Granular multi-dimensional scores (0.0–1.0)
> 3. **Uncertainty** — Explicit known unknowns, blind spots & fallback alerts

---

## Project Structure

```
truthdna/
├── backend/
│   ├── .env.example        ← Copy to .env and add your key
│   ├── requirements.txt    ← Python dependencies
│   ├── schema.py           ← Pydantic V2 data contracts (immovable)
│   ├── forensics.py        ← ELA + video frame extraction (15s cap)
│   ├── dna_extractor.py    ← pHash + CLIP embeddings (zero-vector fallback)
│   ├── ledger.py           ← Qdrant in-memory vector DB
│   ├── seed_ledger.py      ← Historical record seeding script
│   ├── search.py           ← DuckDuckGo web grounding (safe fallback)
│   ├── agent.py            ← Gemini 2.5 Flash synthesis engine
│   └── main.py             ← FastAPI router (full pipeline)
└── frontend/
    ├── package.json
    └── src/
        ├── app/
        │   ├── layout.tsx
        │   ├── page.tsx    ← Full UI (dropzone, 3-pillar display)
        │   └── globals.css ← Dark forensic design system
        └── types/
            └── truthdna.ts ← TypeScript interfaces
```

---

## Prerequisites

- Python 3.10+
- Node.js 18+
- A **Gemini API Key** — get one free at [aistudio.google.com/apikey](https://aistudio.google.com/apikey)

---

## Setup & Running

### Step 1 — Configure Environment

```bash
cd truthdna/backend
cp .env.example .env
```

Open `backend/.env` and add your key:
```env
GEMINI_API_KEY=your_gemini_api_key_here
```

> ⚠️ **NEVER commit `.env` to Git.** It is already in `.gitignore`.

---

### Step 2 — Install Backend Dependencies (first time only)

```bash
cd truthdna/backend
pip install -r requirements.txt
```

---

### Step 3 — Start the Backend

```bash
cd truthdna/backend
python manage.py runserver 8000
```

The Django backend will:
1. Validate `GEMINI_API_KEY` — exits immediately if missing
2. **Auto-seed the Qdrant ledger** with baseline historical records on startup
3. Run Django migrations and initialize the persistent SQLite database
4. Start Django Ninja on `http://localhost:8000`

---

### Step 4 — Install & Start the Vite Frontend

```bash
cd truthdna/vite-frontend
npm install
npm run dev
```

The frontend will run at `http://localhost:5173`.

---

## API Endpoints & Interfaces

| Method | URL | Description |
|--------|-----|-------------|
| `GET` | `http://localhost:8000/health` | Liveness check + ledger stats |
| `POST` | `http://localhost:8000/api/analyze` | Upload media → `MediaDNAReport` |
| `GET` | `http://localhost:8000/admin/` | **Native Django Admin Panel** (User: `admin` / Pass: `adminpassword`) |
| `GET` | `http://localhost:8000/api/docs` | Interactive Django Ninja OpenAPI / Swagger UI |

### Upload Example (curl)
```bash
curl -X POST http://localhost:8000/api/analyze \
  -F "file=@/path/to/your/image.jpg"
```

---

## Architecture

```
[Vite + React UI :5173]
      │
      │ POST /api/analyze (multipart, ≤20MB)
      ▼
[Django + Django Ninja :8000]
      │
      ├─► forensics.py     → ELA score (0.0–1.0), frame extraction (15s cap)
      ├─► dna_extractor.py → pHash + CLIP embedding (zero-vector fallback)
      ├─► ledger.py        → Qdrant cosine search (hard-skip if invalid)
      ├─► search.py        → DuckDuckGo grounding (safe fallback)
      └─► agent.py         → Gemini 2.5 Flash synthesis
                                   │
                                   │ MediaDNAReport (structured JSON)
                                   ▼
                         [3-Pillar UI Response]
```

---

## Safety Contracts

| Contract | What it does |
|----------|-------------|
| **Zero-vector fallback** | If CLIP fails → `[0.0]*512` + `embedding_valid=False` |
| **Ledger hard-skip** | If `embedding_valid=False` → search skipped, no false matches |
| **Search fallback** | DuckDuckGo timeout/rate-limit → `search_failed=True`, pipeline continues |
| **15s video cap** | Frame extraction stops at 15s/1fps to prevent timeout |
| **Single retry loop** | Gemini schema failure → retry once with error feedback → HTTP 500 |
| **No binary verdict** | `MediaDNAReport` has no `is_fake`, `verdict`, or boolean result field |

---

## Seed Records (In-Memory — Reset on Restart)

The ledger is auto-seeded on startup with:

| Event ID | Description |
|----------|-------------|
| `2022_gujarat_floods` | Reference for water-inundation flood imagery |
| `2023_turkey_earthquake_rescue` | Reference for rubble/rescue scene imagery |

> These use synthetic unit vectors as placeholder embeddings.
> Replace with real CLIP embeddings from actual reference images for production use.

---

## Development Notes

- **CLIP model** (`openai/clip-vit-base-patch32`) is downloaded on first use (~350MB). Subsequent requests use the in-process cache.
- **ELA false positives:** Social media re-encoding, multiple JPEG saves, and screenshots routinely produce high ELA scores. The LLM prompt explicitly treats ELA as a weak signal.
- **Vector matches** indicate semantic resemblance — NOT confirmed provenance.
- The `weighting_rationale` field (min 50 chars) enforces LLM chain-of-thought reasoning before any confidence score is accepted.
