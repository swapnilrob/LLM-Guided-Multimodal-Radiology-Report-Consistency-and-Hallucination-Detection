<div align="center">

# LLM-Guided Multimodal Radiology Report Hallucination Detection

### Detecting AI-Generated Errors in Chest X-Ray Reports Through Multimodal Cross-Verification

A full-stack research platform that automatically extracts clinical claims from radiology reports, cross-checks each claim against the source chest X-ray image using multimodal LLM reasoning, identifies internal contradictions between Findings and Impression sections, and generates corrected reports — quantifying report reliability with an explainable composite score.

**Undergraduate Thesis · BRAC University**

[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Express](https://img.shields.io/badge/Express-5-000000?logo=express&logoColor=white)](https://expressjs.com/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.141-009688?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose-47A248?logo=mongodb&logoColor=white)](https://mongoosejs.com/)
[![Status](https://img.shields.io/badge/Status-In%20Development-orange)]()

</div>

---

## The Problem

AI-generated radiology reports are becoming common in clinical workflows, but they can contain **hallucinated findings** — clinically plausible statements that have no basis in the actual medical image. A report might claim "lungs are clear bilaterally" when the X-ray shows opacities, or state "no pleural effusion" when one is visible. These errors carry real clinical risk.

This platform addresses two specific failure modes:

1. **Image–Report Hallucination** — claims in the report that contradict what the chest X-ray actually shows
2. **Internal Inconsistency** — contradictions between the Findings and Impression sections of the same report (e.g., a finding noted above but omitted or negated in the impression)

---

## How It Works

The system runs a **4-stage AI pipeline** on every submitted report:

```
┌──────────────────────────────────────────────────────────────────────┐
│                        ANALYSIS PIPELINE                            │
│                                                                      │
│  ┌─────────────┐    ┌──────────────────┐    ┌────────────────────┐  │
│  │ 1. CLAIM     │    │ 2. HALLUCINATION  │    │ 3. CONSISTENCY    │  │
│  │ EXTRACTION   │───>│ DETECTION         │    │ CHECKING          │  │
│  │              │    │                    │    │                    │  │
│  │ Report text  │    │ Each claim cross-  │    │ Findings vs.      │  │
│  │ ──> atomic   │    │ checked against    │    │ Impression         │  │
│  │ clinical     │    │ the X-ray image    │    │ contradiction      │  │
│  │ claims       │    │ (multimodal LLM)   │    │ detection          │  │
│  └─────────────┘    └────────┬───────────┘    └──────────┬─────────┘  │
│                              │                            │           │
│                              └──────────┬─────────────────┘           │
│                                         v                             │
│                         ┌───────────────────────────────┐             │
│                         │ 4. REPORT CORRECTION           │             │
│                         │                                 │             │
│                         │ Removes hallucinated claims,    │             │
│                         │ resolves contradictions,         │             │
│                         │ preserves supported findings     │             │
│                         └───────────────────────────────┘             │
│                                         │                             │
│                                         v                             │
│                          Reliability Score (0–100)                     │
│                          + Corrected Report                            │
└──────────────────────────────────────────────────────────────────────┘
```

### Stage Details

| Stage | Input | Output | How |
|---|---|---|---|
| **Claim Extraction** | Report text | List of atomic clinical claims with anatomical regions | LLM parses Findings + Impression into independently verifiable statements |
| **Hallucination Detection** | X-ray image + extracted claims | Per-claim verdict (supported / uncertain / hallucinated), risk score (0–100), explanation, bounding box | Multimodal LLM examines the image and evaluates each claim against visual evidence |
| **Consistency Checking** | Report text | List of Findings ↔ Impression contradictions with explanations | LLM identifies where the two sections logically disagree |
| **Report Correction** | Original report + flagged claims + violations | Corrected report text + changelog | LLM rewrites the report, removing hallucinations and resolving contradictions |

### Reliability Score

```
base = (supported × 100 + uncertain × 50 + hallucinated × 0) / total_claims
penalty = min(violation_count × 10, 30)
score = max(base − penalty, 0)
```

---

## Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| **Frontend** | React 19, Tailwind CSS 3, Recharts, Lucide Icons | Upload UI, results dashboard, analytics |
| **Backend API** | Express 5, Node.js, Mongoose | Auth, session management, analysis CRUD, pipeline orchestration |
| **AI Service** | Python FastAPI, OpenRouter API (OpenAI-compatible) | Claim extraction, hallucination detection, consistency checking, report correction |
| **Database** | MongoDB (Mongoose ODM) | Users, analyses, audit logs, sessions, teams, annotations |
| **Image Storage** | Cloudinary | Chest X-ray image hosting |
| **Security** | JWT (access + refresh), TOTP 2FA (Speakeasy), AES-256-CBC encryption, Helmet, rate limiting | Auth, data protection, audit trail |

### Default AI Model

`google/gemma-4-31b-it:free` via [OpenRouter](https://openrouter.ai/) — configurable through `AI_MODEL` in `.env`. The AI service uses the OpenAI SDK pointed at OpenRouter's API, so switching models requires only changing the environment variable.

---

## Security Architecture

| Feature | Implementation |
|---|---|
| **Authentication** | JWT access + refresh token pair; httpOnly cookie for refresh |
| **Two-Factor Auth** | TOTP via Speakeasy with QR code enrollment |
| **Data Encryption** | Report text encrypted at rest with AES-256-CBC (random IV per record) |
| **Rate Limiting** | express-rate-limit on all `/api` routes |
| **Upload Validation** | Multer with file type + size restrictions (JPEG/PNG, 10 MB max) |
| **Audit Logging** | Every analysis creation/deletion logged with user ID, IP, timestamp |
| **RBAC** | Three roles: `general_user`, `clinician`, `admin` — middleware-enforced |

---

## Project Structure

```
├── client/                         # React frontend (CRA + Tailwind)
│   ├── src/
│   │   ├── api/                    # Axios instance + endpoint modules
│   │   ├── components/
│   │   │   ├── common/             # ReliabilityGauge, StatusBadge, SectionHeader
│   │   │   ├── layout/             # Layout, Navbar, Sidebar, NotificationDropdown
│   │   │   └── results/            # ClaimRow, ImageViewer, ReportComparison
│   │   ├── context/                # AuthContext, ThemeContext
│   │   ├── pages/
│   │   │   ├── admin/              # 8 admin sub-pages (users, model config, quotas, ...)
│   │   │   ├── UploadPage.jsx      # Drag-and-drop X-ray + report text submission
│   │   │   ├── ProcessingPage.jsx  # Real-time pipeline progress
│   │   │   ├── ResultsPage.jsx     # Claim verdicts, image viewer, report comparison
│   │   │   ├── HistoryPage.jsx     # Past analyses
│   │   │   └── AnalyticsPage.jsx   # Usage charts (Recharts)
│   │   └── utils/                  # PDF export
│   └── package.json
│
├── server/                         # Express backend (CommonJS)
│   ├── config/                     # MongoDB + Cloudinary setup
│   ├── controllers/                # Auth, analysis, admin, session, 2FA
│   ├── middleware/                  # JWT protect, rate limiter, upload validator
│   ├── models/                     # 10 Mongoose schemas
│   ├── routes/                     # Auth, analysis, session, admin
│   ├── services/
│   │   ├── pipelineService.js      # 4-stage pipeline orchestrator with retry logic
│   │   ├── aiService.js            # HTTP client to FastAPI with rate-limit resilience
│   │   └── cloudinaryService.js    # Image upload
│   ├── utils/                      # AES-256 encryption, audit logger
│   └── server.js                   # Entry point
│
├── ai-service/                     # Python FastAPI microservice
│   ├── main.py                     # App + CORS + router registration
│   ├── routers/
│   │   ├── claims.py               # POST /claims/extract
│   │   ├── hallucination.py        # POST /hallucination/detect
│   │   ├── consistency.py          # POST /consistency/check
│   │   ├── correction.py           # POST /correction/correct
│   │   └── gemini_client.py        # OpenRouter client (OpenAI SDK)
│   └── requirements.txt
│
├── .env.example                    # All required environment variables
└── .gitignore
```

---

## Local Development

### Prerequisites

- **Node.js 18+** and **npm**
- **Python 3.10+** and **pip**
- **MongoDB** (local or [Atlas](https://cloud.mongodb.com/) free tier)
- A [Cloudinary](https://cloudinary.com/) account (free tier works)
- An [OpenRouter](https://openrouter.ai/) API key (free models available)

### 1. Clone

```bash
git clone https://github.com/swapnilrob/LLM-Guided-Multimodal-Radiology-Report-Consistency-and-Hallucination-Detection.git
cd LLM-Guided-Multimodal-Radiology-Report-Consistency-and-Hallucination-Detection
```

### 2. Environment Variables

```bash
cp .env.example .env
```

Fill in these values in `.env`:

```env
# Server
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:3000
MONGODB_URI=mongodb://localhost:27017/radiology_detector

# Auth
JWT_SECRET=<random-string-32-chars-min>
JWT_REFRESH_SECRET=<another-random-string>

# Cloudinary (from your dashboard)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# AI Service
AI_SERVICE_URL=http://localhost:8000
OPENROUTER_API_KEY=your_openrouter_key
AI_MODEL=google/gemma-4-31b-it:free

# Encryption (generate: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
ENCRYPTION_KEY=<64-char-hex-string>

# Email (optional — for notifications)
EMAIL_USER=your_email@example.com
EMAIL_PASS=your_app_password

# Frontend
REACT_APP_API_URL=http://localhost:5000
```

### 3. Start the AI Service

```bash
cd ai-service
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

### 4. Start the Backend

```bash
cd server
npm install
npm run dev
```

### 5. Start the Frontend

```bash
cd client
npm install
npm start
```

The app opens at `http://localhost:3000`.

---

## API Reference

### Auth — `/api/auth`

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/register` | Public | Create account |
| `POST` | `/login` | Public | Get JWT access + refresh tokens |
| `POST` | `/refresh` | Public | Rotate access token via refresh cookie |
| `GET` | `/me` | Private | Current user profile |
| `PUT` | `/me` | Private | Update profile |

### Two-Factor — `/api/auth`

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/2fa/setup` | Private | Generate TOTP secret + QR code |
| `POST` | `/2fa/verify` | Private | Verify TOTP code and enable 2FA |

### Analyses — `/api/analyses`

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/` | Private | Submit X-ray image + report text → triggers pipeline |
| `GET` | `/` | Private | List user's analyses (summary view) |
| `GET` | `/:id` | Private | Full analysis with claims, verdicts, corrected report |
| `DELETE` | `/:id` | Private | Delete an analysis |

### AI Service (Internal) — FastAPI on `:8000`

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/claims/extract` | Extract atomic clinical claims from report text |
| `POST` | `/hallucination/detect` | Cross-check claims against X-ray image |
| `POST` | `/consistency/check` | Find Findings ↔ Impression contradictions |
| `POST` | `/correction/correct` | Generate corrected report |
| `GET` | `/health` | Service health + current model name |

### Admin — `/api/admin`

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/users` | List all users |
| `PATCH` | `/users/:id/role` | Change user role |
| `PATCH` | `/users/:id/status` | Suspend / reactivate account |

---

## Data Models

| Model | Purpose |
|---|---|
| `User` | Accounts with roles (general_user / clinician / admin), 2FA, storage quota |
| `Analysis` | Core entity — image URL, encrypted report, claims with verdicts, consistency violations, reliability score, corrected report, pipeline status |
| `Session` | Login sessions for token management |
| `AuditLog` | Immutable action log (who did what, when, from where) |
| `Feedback` | User feedback on analysis quality |
| `Annotation` | Clinician annotations on analysis results |
| `Comment` | Discussion threads on analyses |
| `Notification` | In-app notification queue |
| `Team` | Group management for collaborative review |
| `Announcement` | Admin-broadcast messages |

---

## Current Status

> This project is under active development as an undergraduate thesis.

**Completed:**
- Three-tier architecture (React + Express + FastAPI)
- JWT authentication with refresh tokens and TOTP 2FA
- AES-256-CBC encryption for report text at rest
- Rate limiting, audit logging, upload validation
- Full 4-stage AI analysis pipeline
- Results dashboard with per-claim verdicts, risk scores, bounding boxes
- Analysis history and analytics pages
- Admin panel (user management, model config, quotas, metrics, audit logs)
- PDF export of analysis results

**In Progress:**
- Evaluation against standard radiology datasets
- Clinician annotation and feedback workflows
- Team-based collaborative review
- Deployment to cloud infrastructure

---

## License

This project is developed as an undergraduate thesis at BRAC University and is intended for academic and research purposes.
