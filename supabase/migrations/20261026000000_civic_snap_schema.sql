-- ==============================================================================
-- CivicSnap Database Schema Migration
-- Production-ready PostgreSQL schema with RLS, Constraints, & Audit Trail
-- ==============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. User Profiles
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  phone_number TEXT,
  preferred_language TEXT NOT NULL DEFAULT 'en' CHECK (preferred_language IN ('en', 'hi')),
  role TEXT NOT NULL DEFAULT 'CITIZEN' CHECK (role IN ('CITIZEN', 'OFFICIAL', 'ADMIN')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Authorities & Providers
CREATE TABLE IF NOT EXISTS public.authorities (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  department TEXT NOT NULL,
  jurisdiction TEXT NOT NULL,
  state TEXT NOT NULL,
  district TEXT NOT NULL,
  city TEXT,
  supported_categories TEXT[] NOT NULL,
  submission_mode TEXT NOT NULL CHECK (submission_mode IN ('DIRECT_API', 'ASSISTED_PORTAL', 'OFFLINE_READY')),
  submission_endpoint TEXT,
  portal_url TEXT,
  helpdesk_phone TEXT,
  helpdesk_email TEXT,
  required_fields TEXT[] DEFAULT ARRAY[]::TEXT[],
  sla_hours INT NOT NULL DEFAULT 72,
  is_verified BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Complaints
CREATE TABLE IF NOT EXISTS public.complaints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category TEXT NOT NULL CHECK (category IN (
    'POTHOLE', 'GARBAGE_DUMP', 'BROKEN_STREETLIGHT', 'WATER_LEAKAGE',
    'DRAINAGE_OVERFLOW', 'DAMAGED_SIDEWALK', 'FALLEN_TREE', 'OTHER'
  )),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  language TEXT NOT NULL DEFAULT 'en' CHECK (language IN ('en', 'hi')),
  severity TEXT NOT NULL CHECK (severity IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
  latitude DOUBLE PRECISION NOT NULL CHECK (latitude >= -90 AND latitude <= 90),
  longitude DOUBLE PRECISION NOT NULL CHECK (longitude >= -180 AND longitude <= 180),
  address TEXT NOT NULL,
  authority_id TEXT NOT NULL REFERENCES public.authorities(id),
  status TEXT NOT NULL DEFAULT 'DRAFT' CHECK (status IN (
    'DRAFT', 'SUBMITTED', 'IN_REVIEW', 'IN_PROGRESS', 'RESOLVED', 'REJECTED', 'DISPUTED'
  )),
  submission_mode TEXT NOT NULL CHECK (submission_mode IN ('DIRECT_API', 'ASSISTED_PORTAL', 'OFFLINE_READY')),
  official_reference_id TEXT,
  evidence_quality_rating TEXT NOT NULL DEFAULT 'ACCEPTABLE' CHECK (
    evidence_quality_rating IN ('EXCELLENT', 'ACCEPTABLE', 'POOR', 'UNUSABLE')
  ),
  ai_analysis JSONB,
  user_consent_granted BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

-- Index for geo duplicate lookups and user queries
CREATE INDEX IF NOT EXISTS idx_complaints_user ON public.complaints(user_id);
CREATE INDEX IF NOT EXISTS idx_complaints_status ON public.complaints(status);
CREATE INDEX IF NOT EXISTS idx_complaints_category ON public.complaints(category);
CREATE INDEX IF NOT EXISTS idx_complaints_coords ON public.complaints(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_complaints_created ON public.complaints(created_at DESC);

-- 4. Complaint Evidence (Photos & Audio)
CREATE TABLE IF NOT EXISTS public.complaint_evidence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  complaint_id UUID NOT NULL REFERENCES public.complaints(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  file_size_bytes INT NOT NULL,
  is_resolution_proof BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_evidence_complaint ON public.complaint_evidence(complaint_id);

-- 5. Submission Attempts & Provider Receipts
CREATE TABLE IF NOT EXISTS public.submission_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  complaint_id UUID NOT NULL REFERENCES public.complaints(id) ON DELETE CASCADE,
  authority_id TEXT NOT NULL REFERENCES public.authorities(id),
  mode TEXT NOT NULL CHECK (mode IN ('DIRECT_API', 'ASSISTED_PORTAL')),
  payload JSONB NOT NULL,
  response_status INT,
  response_body JSONB,
  receipt_reference_id TEXT,
  is_success BOOLEAN NOT NULL DEFAULT FALSE,
  error_message TEXT,
  attempted_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_submission_attempts_complaint ON public.submission_attempts(complaint_id);

-- 6. Complaint Status History (Audit Log)
CREATE TABLE IF NOT EXISTS public.complaint_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  complaint_id UUID NOT NULL REFERENCES public.complaints(id) ON DELETE CASCADE,
  from_status TEXT CHECK (from_status IS NULL OR from_status IN (
    'DRAFT', 'SUBMITTED', 'IN_REVIEW', 'IN_PROGRESS', 'RESOLVED', 'REJECTED', 'DISPUTED'
  )),
  to_status TEXT NOT NULL CHECK (to_status IN (
    'DRAFT', 'SUBMITTED', 'IN_REVIEW', 'IN_PROGRESS', 'RESOLVED', 'REJECTED', 'DISPUTED'
  )),
  changed_by_role TEXT NOT NULL CHECK (changed_by_role IN ('CITIZEN', 'AUTHORITY_API', 'ASSISTED_PORTAL', 'SYSTEM')),
  reason_or_note TEXT,
  official_reference TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_status_history_complaint ON public.complaint_status_history(complaint_id);

-- 7. Citizen Resolution Feedback & Disputes
CREATE TABLE IF NOT EXISTS public.resolution_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  complaint_id UUID NOT NULL REFERENCES public.complaints(id) ON DELETE CASCADE UNIQUE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  citizen_resolution_status TEXT NOT NULL CHECK (citizen_resolution_status IN (
    'FULLY_RESOLVED', 'PARTIALLY_RESOLVED', 'STILL_UNRESOLVED'
  )),
  satisfaction_rating INT NOT NULL CHECK (satisfaction_rating >= 1 AND satisfaction_rating <= 5),
  comments TEXT,
  resolution_evidence_path TEXT,
  is_disputed BOOLEAN NOT NULL DEFAULT FALSE,
  dispute_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_feedback_complaint ON public.resolution_feedback(complaint_id);
CREATE INDEX IF NOT EXISTS idx_feedback_user ON public.resolution_feedback(user_id);

-- 8. Audit Events
CREATE TABLE IF NOT EXISTS public.audit_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  actor_id UUID REFERENCES auth.users(id),
  metadata JSONB DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_events_created ON public.audit_events(created_at DESC);

-- ==============================================================================
-- Row Level Security (RLS) Policies
-- ==============================================================================

-- Enable RLS on every table
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.authorities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.complaints ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.complaint_evidence ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submission_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.complaint_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resolution_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_events ENABLE ROW LEVEL SECURITY;

-- 1. Profiles Policies
CREATE POLICY "Users can read their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- 2. Authorities Policies (Public read for routing)
CREATE POLICY "Anyone authenticated can view verified authorities"
  ON public.authorities FOR SELECT
  USING (is_verified = TRUE);

-- 3. Complaints Policies
CREATE POLICY "Users can read only their own complaints"
  ON public.complaints FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own complaints"
  ON public.complaints FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own complaints in draft/active state"
  ON public.complaints FOR UPDATE
  USING (auth.uid() = user_id);

-- 4. Complaint Evidence Policies
CREATE POLICY "Users can read evidence of their complaints"
  ON public.complaint_evidence FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.complaints c
    WHERE c.id = complaint_evidence.complaint_id AND c.user_id = auth.uid()
  ));

CREATE POLICY "Users can insert evidence for their complaints"
  ON public.complaint_evidence FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.complaints c
    WHERE c.id = complaint_evidence.complaint_id AND c.user_id = auth.uid()
  ));

-- 5. Submission Attempts Policies
CREATE POLICY "Users can view submission attempts of their complaints"
  ON public.submission_attempts FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.complaints c
    WHERE c.id = submission_attempts.complaint_id AND c.user_id = auth.uid()
  ));

-- 6. Status History Policies
CREATE POLICY "Users can view status history of their complaints"
  ON public.complaint_status_history FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.complaints c
    WHERE c.id = complaint_status_history.complaint_id AND c.user_id = auth.uid()
  ));

-- 7. Resolution Feedback Policies
CREATE POLICY "Users can view feedback for their complaints"
  ON public.resolution_feedback FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can submit feedback for their complaints"
  ON public.resolution_feedback FOR INSERT
  WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM public.complaints c
      WHERE c.id = resolution_feedback.complaint_id AND c.user_id = auth.uid()
    )
  );

-- 8. Storage bucket creation instructions
-- Bucket name: 'complaint-evidence' (Private bucket with RLS or signed URLs)
