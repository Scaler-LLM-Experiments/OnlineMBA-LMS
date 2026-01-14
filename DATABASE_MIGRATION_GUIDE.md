# Database Migration Guide: Google Sheets → Supabase

## Why Migrate to Supabase?

| Feature | Google Sheets | Supabase |
|---------|---------------|----------|
| **Speed** | Slow (2-5s per request) | Fast (<100ms) |
| **Concurrent Users** | ~50 | Unlimited |
| **API Calls/Day** | 20,000 | Unlimited |
| **Real-time** | No | Yes (WebSocket) |
| **Complex Queries** | Limited | Full SQL |
| **File Storage** | Google Drive | Built-in (S3-compatible) |
| **Auth** | Separate (Firebase) | Built-in |
| **Cost** | Free (with limits) | Free tier → $25/mo |

---

## Database Schema Design

### 1. Users & Authentication

```sql
-- Students table
CREATE TABLE students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  roll_number TEXT,
  batch_id UUID REFERENCES batches(id),
  avatar_url TEXT,
  phone TEXT,
  linkedin_url TEXT,
  github_url TEXT,
  portfolio_url TEXT,
  about TEXT,
  location TEXT,
  is_admin BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Batches table
CREATE TABLE batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE students ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only read their own data
CREATE POLICY "Users can view own profile" ON students
  FOR SELECT USING (auth.email() = email);

-- Policy: Admins can view all
CREATE POLICY "Admins can view all students" ON students
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM students WHERE email = auth.email() AND is_admin = true)
  );
```

### 2. Course Structure

```sql
-- Terms
CREATE TABLE terms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  batch_id UUID REFERENCES batches(id),
  order_index INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Domains
CREATE TABLE domains (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  term_id UUID REFERENCES terms(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Subjects
CREATE TABLE subjects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  domain_id UUID REFERENCES domains(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for fast lookups
CREATE INDEX idx_terms_batch ON terms(batch_id);
CREATE INDEX idx_domains_term ON domains(term_id);
CREATE INDEX idx_subjects_domain ON subjects(domain_id);
```

### 3. Sessions & Recordings

```sql
-- Live Sessions
CREATE TABLE live_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_number TEXT NOT NULL,
  password TEXT,
  session_name TEXT NOT NULL,
  batch_id UUID REFERENCES batches(id),
  subject_id UUID REFERENCES subjects(id),
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  status TEXT DEFAULT 'scheduled',
  zoom_link TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Recordings
CREATE TABLE recordings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_name TEXT NOT NULL,
  subject_id UUID REFERENCES subjects(id),
  speaker_view_url TEXT,
  gallery_view_url TEXT,
  screen_share_url TEXT,
  active_speaker_url TEXT,
  duration INTEGER, -- minutes
  recorded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Session Notes (student notes)
CREATE TABLE session_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES students(id),
  recording_id UUID REFERENCES recordings(id),
  content TEXT, -- HTML content
  tags TEXT[],
  is_pinned BOOLEAN DEFAULT FALSE,
  video_timestamp INTEGER, -- seconds
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast note lookups
CREATE INDEX idx_notes_student ON session_notes(student_id);
CREATE INDEX idx_notes_recording ON session_notes(recording_id);
```

### 4. Content Management

```sql
-- Announcements
CREATE TABLE announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  subtitle TEXT,
  description TEXT,
  type TEXT, -- 'announcement', 'event'
  priority TEXT DEFAULT 'medium',
  batch_id UUID REFERENCES batches(id),
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  location TEXT,
  registration_link TEXT,
  cover_image_url TEXT,
  requires_acknowledgement BOOLEAN DEFAULT FALSE,
  posted_by UUID REFERENCES students(id),
  status TEXT DEFAULT 'published',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Resources
CREATE TABLE resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  resource_type TEXT,
  level TEXT, -- 'term', 'domain', 'subject', 'session'
  batch_id UUID REFERENCES batches(id),
  term_id UUID REFERENCES terms(id),
  domain_id UUID REFERENCES domains(id),
  subject_id UUID REFERENCES subjects(id),
  file_urls JSONB, -- [{name, url}]
  link_urls JSONB, -- [{name, url}]
  status TEXT DEFAULT 'published',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Policies
CREATE TABLE policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  full_content TEXT, -- HTML
  category TEXT,
  batch_id UUID REFERENCES batches(id),
  requires_acknowledgement BOOLEAN DEFAULT FALSE,
  status TEXT DEFAULT 'published',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Acknowledgements
CREATE TABLE acknowledgements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES students(id),
  content_type TEXT, -- 'announcement', 'policy'
  content_id UUID,
  acknowledged_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(student_id, content_type, content_id)
);
```

### 5. Exams & Proctoring

```sql
-- Exams
CREATE TABLE exams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  type TEXT, -- 'quiz', 'midterm', 'final'
  subject_id UUID REFERENCES subjects(id),
  batch_id UUID REFERENCES batches(id),
  duration INTEGER NOT NULL, -- minutes
  total_marks INTEGER NOT NULL,
  passing_marks INTEGER,
  status TEXT DEFAULT 'draft',
  proctoring_settings JSONB,
  password_config JSONB,
  start_time TIMESTAMPTZ,
  end_time TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Questions
CREATE TABLE questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_id UUID REFERENCES exams(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- 'mcq', 'mcq_multiple', 'short', 'long'
  question_text TEXT NOT NULL,
  options JSONB, -- [{id, text, isCorrect}]
  correct_answer TEXT,
  marks INTEGER NOT NULL,
  negative_marks NUMERIC DEFAULT 0,
  explanation TEXT,
  order_index INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Exam Attempts
CREATE TABLE exam_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_id UUID REFERENCES exams(id),
  student_id UUID REFERENCES students(id),
  started_at TIMESTAMPTZ DEFAULT NOW(),
  submitted_at TIMESTAMPTZ,
  status TEXT DEFAULT 'in_progress',
  score NUMERIC,
  answers JSONB, -- [{questionId, answer, isCorrect, marks}]
  violations JSONB, -- [{type, timestamp, details}]
  device_info JSONB,
  UNIQUE(exam_id, student_id)
);

-- Exam Sessions (for proctoring)
CREATE TABLE exam_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  attempt_id UUID REFERENCES exam_attempts(id),
  session_token TEXT UNIQUE NOT NULL,
  device_hash TEXT,
  ip_address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT TRUE
);

-- Index for session lookups
CREATE INDEX idx_exam_sessions_token ON exam_sessions(session_token);
```

### 6. Assignments

```sql
-- Assignments
CREATE TABLE assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  instructions TEXT,
  subject_id UUID REFERENCES subjects(id),
  batch_id UUID REFERENCES batches(id),
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  max_file_size INTEGER, -- bytes
  allowed_file_types TEXT[],
  is_group_assignment BOOLEAN DEFAULT FALSE,
  group_size INTEGER,
  has_peer_rating BOOLEAN DEFAULT FALSE,
  status TEXT DEFAULT 'draft',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Assignment Submissions
CREATE TABLE assignment_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id UUID REFERENCES assignments(id),
  student_id UUID REFERENCES students(id),
  group_id UUID,
  files JSONB, -- [{name, url, size}]
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  status TEXT DEFAULT 'submitted',
  grade NUMERIC,
  feedback TEXT,
  UNIQUE(assignment_id, student_id)
);

-- Peer Ratings
CREATE TABLE peer_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id UUID REFERENCES assignment_submissions(id),
  rater_id UUID REFERENCES students(id),
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  remarks TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(submission_id, rater_id)
);
```

### 7. Forms & Surveys

```sql
-- Forms
CREATE TABLE forms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  type TEXT, -- 'survey', 'feedback', 'registration'
  batch_id UUID REFERENCES batches(id),
  questions JSONB, -- Form builder config
  is_required BOOLEAN DEFAULT FALSE,
  deadline TIMESTAMPTZ,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Form Responses
CREATE TABLE form_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  form_id UUID REFERENCES forms(id),
  student_id UUID REFERENCES students(id),
  responses JSONB, -- {questionId: answer}
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(form_id, student_id)
);
```

### 8. Placement & Jobs

```sql
-- Job Postings
CREATE TABLE job_postings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  company TEXT NOT NULL,
  company_logo_url TEXT,
  description TEXT,
  requirements TEXT[],
  location TEXT,
  job_type TEXT, -- 'full_time', 'internship', 'contract'
  salary_range JSONB, -- {min, max, currency}
  deadline TIMESTAMPTZ,
  batch_id UUID REFERENCES batches(id),
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Job Applications
CREATE TABLE job_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID REFERENCES job_postings(id),
  student_id UUID REFERENCES students(id),
  resume_url TEXT,
  cover_letter TEXT,
  status TEXT DEFAULT 'pending',
  applied_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(job_id, student_id)
);

-- Placement Profiles
CREATE TABLE placement_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES students(id) UNIQUE,
  experience JSONB, -- [{company, role, duration, ctc}]
  internships JSONB,
  projects JSONB, -- [{title, description, link}]
  domains JSONB, -- [{name, resumeUrl}]
  preferred_locations TEXT[],
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 9. Community (Students Corner)

```sql
-- Posts
CREATE TABLE community_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id UUID REFERENCES students(id),
  type TEXT, -- 'discussion', 'resource', 'question'
  title TEXT NOT NULL,
  content TEXT,
  attachments JSONB,
  likes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  is_pinned BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Post Likes
CREATE TABLE post_likes (
  post_id UUID REFERENCES community_posts(id) ON DELETE CASCADE,
  student_id UUID REFERENCES students(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (post_id, student_id)
);

-- Comments
CREATE TABLE post_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES community_posts(id) ON DELETE CASCADE,
  author_id UUID REFERENCES students(id),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Leaderboard (materialized view for performance)
CREATE MATERIALIZED VIEW leaderboard AS
SELECT
  s.id,
  s.full_name,
  s.avatar_url,
  s.batch_id,
  COUNT(DISTINCT cp.id) as posts_count,
  COUNT(DISTINCT pc.id) as comments_count,
  COUNT(DISTINCT pl.post_id) as likes_given,
  (COUNT(DISTINCT cp.id) * 10 + COUNT(DISTINCT pc.id) * 5) as points
FROM students s
LEFT JOIN community_posts cp ON cp.author_id = s.id
LEFT JOIN post_comments pc ON pc.author_id = s.id
LEFT JOIN post_likes pl ON pl.student_id = s.id
GROUP BY s.id
ORDER BY points DESC;

-- Refresh leaderboard periodically
CREATE OR REPLACE FUNCTION refresh_leaderboard()
RETURNS TRIGGER AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY leaderboard;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;
```

---

## Supabase Setup Steps

### Step 1: Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Create new project
3. Note down:
   - Project URL
   - Anon Key (public)
   - Service Role Key (private - for admin operations)

### Step 2: Run Schema Migrations

1. Go to SQL Editor in Supabase Dashboard
2. Run each CREATE TABLE statement above
3. Or use Supabase CLI:

```bash
# Install Supabase CLI
npm install -g supabase

# Initialize
supabase init

# Link to project
supabase link --project-ref YOUR_PROJECT_REF

# Run migrations
supabase db push
```

### Step 3: Set Up Row Level Security (RLS)

```sql
-- Enable RLS on all tables
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE live_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE recordings ENABLE ROW LEVEL SECURITY;
-- ... enable for all tables

-- Students: Users can view own data
CREATE POLICY "students_select_own" ON students
  FOR SELECT USING (auth.email() = email);

-- Students: Admins can view all
CREATE POLICY "students_admin_select" ON students
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM students WHERE email = auth.email() AND is_admin = true)
  );

-- Sessions: Students can view sessions in their batch
CREATE POLICY "sessions_batch_select" ON live_sessions
  FOR SELECT USING (
    batch_id IN (SELECT batch_id FROM students WHERE email = auth.email())
  );

-- Similar policies for other tables...
```

### Step 4: Create Database Functions

```sql
-- Function to get student dashboard
CREATE OR REPLACE FUNCTION get_student_dashboard(student_email TEXT)
RETURNS JSON AS $$
DECLARE
  result JSON;
  student_batch UUID;
BEGIN
  -- Get student's batch
  SELECT batch_id INTO student_batch FROM students WHERE email = student_email;

  SELECT json_build_object(
    'liveSessions', (
      SELECT json_agg(ls) FROM live_sessions ls
      WHERE batch_id = student_batch
      AND start_time <= NOW() AND end_time >= NOW()
    ),
    'upcomingSessions', (
      SELECT json_agg(ls) FROM live_sessions ls
      WHERE batch_id = student_batch
      AND start_time > NOW()
      ORDER BY start_time LIMIT 5
    ),
    'announcements', (
      SELECT json_agg(a) FROM announcements a
      WHERE batch_id = student_batch
      AND status = 'published'
      ORDER BY created_at DESC LIMIT 10
    ),
    'pendingForms', (
      SELECT json_agg(f) FROM forms f
      WHERE batch_id = student_batch
      AND is_required = true
      AND id NOT IN (
        SELECT form_id FROM form_responses fr
        JOIN students s ON fr.student_id = s.id
        WHERE s.email = student_email
      )
    )
  ) INTO result;

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### Step 5: Update React App

```typescript
// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL!;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

```typescript
// src/services/supabaseApi.ts
import { supabase } from '../lib/supabase';

export const supabaseApi = {
  // Get student profile
  async getStudentProfile(email: string) {
    const { data, error } = await supabase
      .from('students')
      .select('*')
      .eq('email', email)
      .single();

    if (error) throw error;
    return data;
  },

  // Get live sessions
  async getLiveSessions(batchId: string) {
    const now = new Date().toISOString();
    const { data, error } = await supabase
      .from('live_sessions')
      .select(`
        *,
        subject:subjects(name, domain:domains(name, term:terms(name)))
      `)
      .eq('batch_id', batchId)
      .lte('start_time', now)
      .gte('end_time', now);

    if (error) throw error;
    return data;
  },

  // Get recordings with filters
  async getRecordings(filters: {
    batchId?: string;
    termId?: string;
    domainId?: string;
    subjectId?: string;
  }) {
    let query = supabase
      .from('recordings')
      .select(`
        *,
        subject:subjects(
          name,
          domain:domains(
            name,
            term:terms(name, batch:batches(name))
          )
        )
      `);

    if (filters.subjectId) {
      query = query.eq('subject_id', filters.subjectId);
    }

    const { data, error } = await query.order('recorded_at', { ascending: false });
    if (error) throw error;
    return data;
  },

  // Real-time subscriptions
  subscribeToAnnouncements(batchId: string, callback: (announcement: any) => void) {
    return supabase
      .channel('announcements')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'announcements',
          filter: `batch_id=eq.${batchId}`,
        },
        (payload) => callback(payload.new)
      )
      .subscribe();
  },

  // Submit assignment
  async submitAssignment(assignmentId: string, studentId: string, files: any[]) {
    const { data, error } = await supabase
      .from('assignment_submissions')
      .upsert({
        assignment_id: assignmentId,
        student_id: studentId,
        files,
        submitted_at: new Date().toISOString(),
        status: 'submitted',
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Call database function
  async getStudentDashboard(email: string) {
    const { data, error } = await supabase
      .rpc('get_student_dashboard', { student_email: email });

    if (error) throw error;
    return data;
  },
};
```

### Step 6: Update .env

```env
# Supabase Configuration
REACT_APP_SUPABASE_URL=https://your-project.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your-anon-key

# Keep Firebase for now (or migrate to Supabase Auth)
REACT_APP_FIREBASE_API_KEY=...
```

---

## Migration Strategy

### Phase 1: Parallel Running (Week 1-2)
1. Set up Supabase with schema
2. Write data to BOTH Google Sheets AND Supabase
3. Read from Google Sheets (existing)
4. Verify data consistency

### Phase 2: Switch Reads (Week 3)
1. Switch reads to Supabase
2. Keep writing to both
3. Monitor performance

### Phase 3: Full Migration (Week 4)
1. Stop writing to Google Sheets
2. Supabase becomes primary
3. Keep Google Sheets as backup

### Data Migration Script

```javascript
// migrate-to-supabase.js
const { google } = require('googleapis');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function migrateStudents() {
  // Get data from Google Sheets
  const sheets = google.sheets({ version: 'v4', auth });
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: 'STUDENT_DATA!A:Z',
  });

  const rows = response.data.values;
  const headers = rows[0];

  // Transform and insert into Supabase
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const student = {
      email: row[headers.indexOf('Email')],
      full_name: row[headers.indexOf('Full Name')],
      roll_number: row[headers.indexOf('Roll Number')],
      // ... map all fields
    };

    const { error } = await supabase
      .from('students')
      .upsert(student, { onConflict: 'email' });

    if (error) console.error('Error migrating:', student.email, error);
  }
}

// Run migrations
migrateStudents();
```

---

## Benefits After Migration

| Metric | Google Sheets | Supabase |
|--------|---------------|----------|
| API Response Time | 2-5 seconds | <100ms |
| Concurrent Users | ~50 | 10,000+ |
| Real-time Updates | No | Yes |
| Complex Queries | Limited | Full SQL |
| File Storage | Google Drive | Built-in |
| Cost (1000 users) | Free | Free tier |
| Cost (10000 users) | Hits limits | ~$25/mo |

---

## Zoom Integration with Supabase

Store Zoom webhook events for automatic session management:

```sql
-- Zoom webhooks table
CREATE TABLE zoom_webhooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL,
  meeting_id TEXT,
  processed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Function to process meeting started
CREATE OR REPLACE FUNCTION process_meeting_started()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.event_type = 'meeting.started' THEN
    UPDATE live_sessions
    SET status = 'live'
    WHERE meeting_number = NEW.payload->>'id';
  END IF;

  IF NEW.event_type = 'meeting.ended' THEN
    UPDATE live_sessions
    SET status = 'ended'
    WHERE meeting_number = NEW.payload->>'id';
  END IF;

  NEW.processed = TRUE;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_zoom_webhook
  BEFORE INSERT ON zoom_webhooks
  FOR EACH ROW
  EXECUTE FUNCTION process_meeting_started();
```

---

## Summary

**Recommended Path:**
1. **Immediate:** Keep Google Sheets working
2. **Short-term (1-2 weeks):** Set up Supabase in parallel
3. **Medium-term (1 month):** Migrate fully to Supabase
4. **Long-term:** Consider self-hosted PostgreSQL if needed

**Total Cost:**
- Supabase Free Tier: $0/month (up to 500MB database, 1GB storage)
- Supabase Pro: $25/month (8GB database, 100GB storage)
- Self-hosted: VPS cost (~$10-20/month)
