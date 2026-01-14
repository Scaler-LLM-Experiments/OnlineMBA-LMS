-- ==========================================
-- ASSIGNMENT PLATFORM - COMPREHENSIVE ACTION TRACKING
-- ==========================================
-- This table tracks EVERY action a student takes in the Assignment Platform
-- including clicks, file uploads, errors, ratings, and more.

-- Drop table if exists (for clean reinstall)
-- DROP TABLE IF EXISTS public.assignment_actions CASCADE;

-- Create assignment_actions table
CREATE TABLE IF NOT EXISTS public.assignment_actions (
  -- Primary Key
  id BIGSERIAL PRIMARY KEY,

  -- Timestamp (when the action occurred)
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Student Information
  student_email VARCHAR(255) NOT NULL,
  student_name VARCHAR(255),
  batch VARCHAR(100),

  -- Action Details
  action_type VARCHAR(100) NOT NULL, -- e.g., "button_click", "file_upload_success", "file_upload_error", "error", "tab_switch", "modal_open", "peer_rating_submitted", etc.
  action_category VARCHAR(50) NOT NULL, -- e.g., "click", "upload", "error", "navigation", "form", "rating"
  action_description TEXT NOT NULL, -- Detailed description of what happened

  -- Assignment Context (if applicable)
  assignment_id VARCHAR(100),
  assignment_name VARCHAR(500),
  assignment_subject VARCHAR(200),
  term VARCHAR(100),

  -- Page/Location Context
  page_url VARCHAR(1000), -- Full URL where action occurred
  page_section VARCHAR(100), -- e.g., "assignment_list", "assignment_details", "submission_form", "peer_ratings"

  -- Metadata (flexible JSON for additional data)
  metadata JSONB, -- Can store: file_name, file_size, error_message, button_name, tab_name, rating_value, etc.

  -- Technical Context
  user_agent TEXT, -- Browser and device info
  session_id VARCHAR(255), -- To track user sessions
  screen_resolution VARCHAR(50), -- e.g., "1920x1080"

  -- Performance Tracking
  load_time_ms INTEGER, -- Time taken for page/modal to load

  -- Indexes for faster querying
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- INDEXES FOR PERFORMANCE
-- ==========================================

-- Index on student_email for fast filtering by student
CREATE INDEX IF NOT EXISTS idx_assignment_actions_student_email
ON public.assignment_actions(student_email);

-- Index on timestamp for date range queries
CREATE INDEX IF NOT EXISTS idx_assignment_actions_timestamp
ON public.assignment_actions(timestamp DESC);

-- Index on action_type for filtering by action type
CREATE INDEX IF NOT EXISTS idx_assignment_actions_action_type
ON public.assignment_actions(action_type);

-- Index on action_category for filtering by category
CREATE INDEX IF NOT EXISTS idx_assignment_actions_action_category
ON public.assignment_actions(action_category);

-- Index on assignment_id for filtering by assignment
CREATE INDEX IF NOT EXISTS idx_assignment_actions_assignment_id
ON public.assignment_actions(assignment_id);

-- Index on assignment_subject for filtering by subject
CREATE INDEX IF NOT EXISTS idx_assignment_actions_assignment_subject
ON public.assignment_actions(assignment_subject);

-- Index on batch for filtering by batch
CREATE INDEX IF NOT EXISTS idx_assignment_actions_batch
ON public.assignment_actions(batch);

-- Composite index for common queries (student + date range)
CREATE INDEX IF NOT EXISTS idx_assignment_actions_student_timestamp
ON public.assignment_actions(student_email, timestamp DESC);

-- GIN index on metadata JSONB for fast JSON queries
CREATE INDEX IF NOT EXISTS idx_assignment_actions_metadata
ON public.assignment_actions USING GIN (metadata);

-- ==========================================
-- ROW LEVEL SECURITY (RLS)
-- ==========================================

-- Enable RLS
ALTER TABLE public.assignment_actions ENABLE ROW LEVEL SECURITY;

-- Policy: Allow all authenticated users to insert their own actions
CREATE POLICY "Students can insert their own actions"
ON public.assignment_actions
FOR INSERT
TO authenticated
WITH CHECK (true); -- Allow all inserts (we validate email in application)

-- Policy: Allow anon users to insert (for unauthenticated tracking)
CREATE POLICY "Anonymous users can insert actions"
ON public.assignment_actions
FOR INSERT
TO anon
WITH CHECK (true);

-- Policy: Allow all users to read all actions (admins need this for dashboard)
CREATE POLICY "Anyone can read all actions"
ON public.assignment_actions
FOR SELECT
TO authenticated, anon
USING (true);

-- ==========================================
-- HELPER VIEWS
-- ==========================================

-- View: Recent actions (last 7 days)
CREATE OR REPLACE VIEW public.assignment_actions_recent AS
SELECT * FROM public.assignment_actions
WHERE timestamp >= NOW() - INTERVAL '7 days'
ORDER BY timestamp DESC;

-- View: Error actions only
CREATE OR REPLACE VIEW public.assignment_actions_errors AS
SELECT * FROM public.assignment_actions
WHERE action_category = 'error'
ORDER BY timestamp DESC;

-- View: File upload actions only
CREATE OR REPLACE VIEW public.assignment_actions_uploads AS
SELECT * FROM public.assignment_actions
WHERE action_category = 'upload'
ORDER BY timestamp DESC;

-- View: Action summary by student
CREATE OR REPLACE VIEW public.assignment_actions_summary_by_student AS
SELECT
  student_email,
  student_name,
  batch,
  COUNT(*) as total_actions,
  COUNT(CASE WHEN action_category = 'error' THEN 1 END) as error_count,
  COUNT(CASE WHEN action_category = 'upload' THEN 1 END) as upload_count,
  COUNT(CASE WHEN action_category = 'click' THEN 1 END) as click_count,
  COUNT(CASE WHEN action_type LIKE '%success%' THEN 1 END) as success_count,
  MIN(timestamp) as first_action,
  MAX(timestamp) as last_action
FROM public.assignment_actions
GROUP BY student_email, student_name, batch
ORDER BY total_actions DESC;

-- View: Action summary by assignment
CREATE OR REPLACE VIEW public.assignment_actions_summary_by_assignment AS
SELECT
  assignment_id,
  assignment_name,
  assignment_subject,
  COUNT(*) as total_actions,
  COUNT(DISTINCT student_email) as unique_students,
  COUNT(CASE WHEN action_category = 'error' THEN 1 END) as error_count,
  COUNT(CASE WHEN action_type = 'submission_success' THEN 1 END) as submission_count,
  MIN(timestamp) as first_action,
  MAX(timestamp) as last_action
FROM public.assignment_actions
WHERE assignment_id IS NOT NULL
GROUP BY assignment_id, assignment_name, assignment_subject
ORDER BY total_actions DESC;

-- ==========================================
-- COMMENTS (for documentation)
-- ==========================================

COMMENT ON TABLE public.assignment_actions IS 'Tracks every action students take in the Assignment Platform for analytics and debugging';
COMMENT ON COLUMN public.assignment_actions.action_type IS 'Specific type of action (e.g., button_click, file_upload_success, error_file_missing, tab_switch_to_active)';
COMMENT ON COLUMN public.assignment_actions.action_category IS 'High-level category: click, upload, error, navigation, form, rating';
COMMENT ON COLUMN public.assignment_actions.metadata IS 'JSON object containing additional context like {file_name, file_size, error_message, button_name, etc.}';
COMMENT ON COLUMN public.assignment_actions.session_id IS 'Unique session identifier to track user sessions';

-- ==========================================
-- SAMPLE DATA (for testing)
-- ==========================================

-- Uncomment to insert sample data for testing
/*
INSERT INTO public.assignment_actions (
  student_email,
  student_name,
  batch,
  action_type,
  action_category,
  action_description,
  assignment_id,
  assignment_name,
  assignment_subject,
  term,
  page_section,
  metadata
) VALUES
(
  'student@example.com',
  'John Doe',
  'Batch 1',
  'button_click',
  'click',
  'Clicked "Submit Assignment" button',
  '2025-SU-20251218-001',
  'Data Structures Assignment',
  'Computer Science',
  'Term 1',
  'submission_form',
  '{"button_name": "Submit Assignment", "form_valid": true}'::jsonb
),
(
  'student@example.com',
  'John Doe',
  'Batch 1',
  'file_upload_error',
  'error',
  'File upload failed: File size exceeds limit',
  '2025-SU-20251218-001',
  'Data Structures Assignment',
  'Computer Science',
  'Term 1',
  'submission_form',
  '{"file_name": "assignment.pdf", "file_size": 52428800, "error_message": "File size exceeds 50MB limit", "max_size": 52428800}'::jsonb
);
*/

-- ==========================================
-- SUCCESS MESSAGE
-- ==========================================

DO $$
BEGIN
  RAISE NOTICE '✅ Assignment Actions Tracking table created successfully!';
  RAISE NOTICE '📊 Table: public.assignment_actions';
  RAISE NOTICE '🔍 Views created: assignment_actions_recent, assignment_actions_errors, assignment_actions_uploads';
  RAISE NOTICE '📈 Summary views: assignment_actions_summary_by_student, assignment_actions_summary_by_assignment';
  RAISE NOTICE '🔒 Row Level Security (RLS) enabled with policies';
  RAISE NOTICE '⚡ Indexes created for optimal query performance';
END $$;
