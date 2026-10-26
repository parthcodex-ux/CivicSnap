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

## 2. Implementation Progress by Stage

| Stage | Milestone | Status | Key Deliverables |
|---|---|---|---|
| **P0** | Workspace & Architecture Setup | COMPLETED | Clean monorepo structure, shared Zod contracts (`@civicsnap/shared`), DB schema & migrations (`supabase/migrations`), `.env.example`, and server/client scaffolding |
| **P1** | Gemma 4 AI Analysis & Complaint Drafting | COMPLETED | Multimodal vision service (`ai.service.ts`), structured JSON parsing, evidence quality checks (blur/night warnings), missing-info checks, bilingual grievance draft (EN/HI) |
| **P2** | Supabase Auth, Storage & Private RLS | COMPLETED | Production SQL migration with RLS on every table (`profiles`, `complaints`, `complaint_evidence`, `submission_attempts`, `complaint_status_history`, `resolution_feedback`), tenant isolation middleware |
| **P3** | Authority Resolution & Submission Adapters | COMPLETED | Provider adapter pattern (`IAuthorityProviderAdapter`, `DirectApiAdapter`, `AssistedPortalAdapter`), verified Indian municipal registries (MCD, BBMP, PWD, DJB, Swachhata), transparent matching explanation, zero fabricated receipts |
| **P4** | Duplicate Detection, Feedback & Polish | COMPLETED | Haversine geo-spatial clustering (<60m / 14 days), citizen accountability resolution verification (1–5 stars, Fully/Partially/Unresolved), dispute escalation flow, bilingual EN/HI toggle |
| **P5** | Test Suite & Deployment Readiness | IN PROGRESS | Complete Vitest test suite for AI vision, authority matching, RLS isolation, feedback disputes, and production build readiness |

---

## 3. Test Suites Implemented
- `packages/shared/src/index.test.ts`: Validates shared Zod contracts and citizen consent enforcement.
- `packages/server/src/__tests__/authority.test.ts`: Verifies GPS jurisdiction matching for Delhi MCD, DJB, BBMP, and Assisted Portal dossier generation.
- `packages/server/src/__tests__/complaint.test.ts`: Verifies tenant isolation (User A cannot view User B's complaint), 60m duplicate detection, resolution dispute lifecycle, and duplicate feedback prevention.
- `packages/server/src/__tests__/ai.test.ts`: Verifies multimodal vision output structure, Zod validation, and safe offline fallback.

---

## 4. Known Limitations & Credential Requirements
- **Google GenAI Key**: `GEMINI_API_KEY` required for live Google Gemma 4 vision model inference. Safe, typed heuristic fallback provided for development/test environments.
- **Supabase**: `SUPABASE_URL`, `SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` required for remote Supabase instance. In-memory data store provided for zero-friction local development and automated testing.

---

## 5. Next Immediate Action
- Finalize dependency installation and run test suites and production build.
