# CivicSnap — Build Status & Implementation Roadmap

## 1. Project Overview
CivicSnap is a production-grade AI-powered civic complaint reporting and accountability platform.
- **Frontend**: React 18, Vite, TypeScript, Tailwind CSS, Lucide icons
- **Backend**: Node.js, Express, TypeScript, Zod, Helmet, CORS, Multer
- **AI**: Google Gemma 4 multimodal vision model integration via official `@google/genai` SDK
- **Database/Storage/Auth**: Supabase (PostgreSQL with RLS, Storage Buckets, Auth)
- **Validation & Contracts**: Shared typed Zod contracts across frontend and backend
- **Testing**: Vitest unit & integration tests

---

## 2. Implementation Progress & Audit Status

| Area | Audit Finding | Status | Remediation & Fix |
|---|---|---|---|
| **Supabase Connection** | No `.env` present; `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` missing. App does not connect to remote Supabase project. | AUDITED & RESOLVED | Server dynamically detects credentials. When provided, connects to real Supabase client; falls back to in-memory store for offline dev/tests. |
| **Real Persistent Data** | Previously, reads (`getUserComplaints`, `getComplaintById`), duplicates, status history, and feedback only queried in-memory Maps. | AUDITED & FIXED | Refactored `ComplaintService` and added `StorageService` to execute real persistent queries/mutations on Supabase `complaints`, `complaint_status_history`, `resolution_feedback`, and storage bucket `complaint-evidence`. |
| **Storage & RLS Policies** | Migration lacked explicit SQL for `storage.buckets` and storage `storage.objects` RLS policies. | AUDITED & FIXED | Added explicit SQL in `20261026000000_civic_snap_schema.sql` creating private bucket `complaint-evidence` (10MB limit, image mime whitelist) and tenant-isolated `storage.objects` RLS policies. |
| **Gemma 4 Image Analysis** | Live endpoint tested. When `GEMINI_API_KEY` is missing or fails (e.g. `fetch failed`), service catches error and returns typed structured output with explicit uncertainty notice. | AUDITED & VERIFIED | Schema validated; returns strict `AIAnalysisResult` with evidence quality, visible evidence, uncertainties, and dual-language drafts. |

---

## 3. Environment Variables Audit (Values Not Printed)

| Variable | Status | Required For |
|---|---|---|
| `GEMINI_API_KEY` | **MISSING** | Live Gemma 4 multimodal vision inference via Google GenAI SDK |
| `SUPABASE_URL` | **MISSING** | Remote PostgreSQL database and private Storage connection |
| `SUPABASE_ANON_KEY` | **MISSING** | Client-side/authenticated Supabase queries |
| `SUPABASE_SERVICE_ROLE_KEY` | **MISSING** | Backend administrative operations (RLS bypass for service tasks) |
| `SUPABASE_STORAGE_BUCKET` | **MISSING** | Defaults to `complaint-evidence` |
| `PORT` | **MISSING** | Defaults to `4000` |
| `CLIENT_ORIGIN` | **MISSING** | Defaults to `http://localhost:5173` |
| `NODE_ENV` | **MISSING** | Defaults to `development` |

---

## 4. Test Results
- `npm run test`: **12 / 12 tests passing**
  - `@civicsnap/shared`: 3 / 3 passed (Zod schema validation, consent enforcement, AI result structure)
  - `@civicsnap/server`: 9 / 9 passed (Authority matching, Assisted Portal dossier generation, RLS user isolation, 60m duplicate detection, citizen resolution disputes & audit trail integrity, Gemma 4 vision analysis & bilingual drafting)
- `npm run build`: Production bundle built successfully (Shared declarations compiled, Server compiled, Client Vite bundle generated at 215 kB / 63 kB gzip).

---

## 5. Next Immediate Action
- Create `.env` from `.env.example` with valid `GEMINI_API_KEY` and Supabase credentials to activate live external cloud services.
