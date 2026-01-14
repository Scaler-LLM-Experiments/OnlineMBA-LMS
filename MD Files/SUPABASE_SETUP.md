# Supabase Setup Guide for Portal Usage Tracker

## Step 1: Create Supabase Project

1. Go to https://supabase.com and sign up/login
2. Click "New Project"
3. Fill in:
   - **Name**: `ssb-student-portal`
   - **Database Password**: Generate strong password (SAVE THIS!)
   - **Region**: Choose closest (e.g., Mumbai for India)
   - **Plan**: **Free**
4. Click "Create new project" (wait ~2 minutes)

## Step 2: Create Database Table

1. Go to **SQL Editor** in left sidebar
2. Click "New Query"
3. Copy and paste this SQL:

```sql
-- Create user_activity table
CREATE TABLE user_activity (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  student_email VARCHAR(255) NOT NULL,
  batch VARCHAR(50),
  action_type VARCHAR(50) NOT NULL,
  action_detail TEXT,

  -- Video/Recording tracking fields
  recording_id VARCHAR(100),
  recording_name TEXT,
  watch_duration_seconds INTEGER DEFAULT 0,
  video_duration_seconds INTEGER DEFAULT 0,
  watch_percentage NUMERIC(5,2) DEFAULT 0,
  completion_status VARCHAR(20),

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for fast queries
CREATE INDEX idx_student_email ON user_activity(student_email);
CREATE INDEX idx_timestamp ON user_activity(timestamp DESC);
CREATE INDEX idx_action_type ON user_activity(action_type);
CREATE INDEX idx_recording_id ON user_activity(recording_id);
CREATE INDEX idx_completion_status ON user_activity(completion_status);
CREATE INDEX idx_created_at ON user_activity(created_at);

-- Add comment
COMMENT ON TABLE user_activity IS 'Tracks user activity including page views, form interactions, and video engagement';

-- Disable RLS for development (enable later)
ALTER TABLE user_activity DISABLE ROW LEVEL SECURITY;
```

4. Click **"Run"** (Ctrl+Enter)
5. Should see "Success. No rows returned"

## Step 3: Get API Keys

1. Go to **Settings** (gear icon) → **API**
2. Copy these values:

   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon public key**: Long JWT token starting with `eyJh...`

## Step 4: Configure Environment Variables

1. Create `.env.local` file in project root:

```bash
# Supabase Configuration
REACT_APP_SUPABASE_URL=https://xxxxx.supabase.co
REACT_APP_SUPABASE_ANON_KEY=eyJhbG...your-actual-key...
```

2. Add to `.gitignore` (if not already):

```bash
.env.local
.env
```

## Step 5: Test the Setup

1. Start your dev server:
```bash
npm start
```

2. Login as admin
3. Go to **Admin** → **Portal Usage Tracker**
4. Should see empty dashboard (no errors!)

## Step 6: Set Up Auto-Delete (Optional)

To automatically delete logs older than 2 months:

1. Go to **Database** → **Functions**
2. Create new function named `delete_old_activity`
3. Paste:

```sql
CREATE OR REPLACE FUNCTION delete_old_activity()
RETURNS void AS $$
BEGIN
  DELETE FROM user_activity
  WHERE created_at < NOW() - INTERVAL '2 months';
END;
$$ LANGUAGE plpgsql;
```

4. Go to **Database** → **Cron Jobs** (enable if not active)
5. Create new cron job:
   - **Name**: `cleanup_old_activity`
   - **Schedule**: `0 0 * * 0` (every Sunday midnight)
   - **SQL**: `SELECT delete_old_activity();`

## Step 7: Enable Activity Tracking

Once Supabase is configured, activity tracking happens automatically:

- ✅ Page views tracked
- ✅ Form interactions tracked
- ✅ Video watch time tracked
- ✅ Active sessions (every 6 hours)

## Usage

### For Students:
Activity is tracked automatically in the background. No action needed.

### For Admins:
1. Go to **Admin** → **Portal Usage Tracker**
2. View all activity logs
3. Filter by:
   - Student email
   - Batch
   - Action type
4. Export to CSV
5. See video engagement stats

## Tracked Activities:

| Action Type | Description |
|------------|-------------|
| `page_view` | Student visits a page |
| `form_interaction` | Opens/submits a form |
| `resource_download` | Downloads a resource |
| `recording_opened` | Clicks on a recording |
| `recording_watched` | Watches a recording (logged every 5 min) |
| `recording_completed` | Finishes watching (>90%) |
| `session_active` | Active in portal (every 6 hours) |

## Troubleshooting

### "Activity tracking disabled"
- Check `.env.local` exists and has correct values
- Restart dev server after adding env vars

### "Error logging activity"
- Check RLS is disabled: Go to Authentication → Policies
- Or run: `ALTER TABLE user_activity DISABLE ROW LEVEL SECURITY;`

### Dashboard shows no data
- Make some test activity (navigate pages, open forms)
- Check Supabase → Table Editor → user_activity has rows

### Production Setup

For production, enable RLS:

```sql
-- Enable RLS
ALTER TABLE user_activity ENABLE ROW LEVEL SECURITY;

-- Allow all users to insert
CREATE POLICY "Allow insert for all"
ON user_activity FOR INSERT
WITH CHECK (true);

-- Allow all users to read (or restrict to admins)
CREATE POLICY "Allow read for all"
ON user_activity FOR SELECT
USING (true);
```

## Cost Estimation

**Free Tier Limits:**
- Database: 500 MB
- Bandwidth: 2 GB/month
- API Requests: 50,000/month

**Expected Usage:**
- ~120 logs/user/month
- 100 users × 120 logs × 2 months = 24,000 rows
- ~5 MB total storage
- Well within free tier! ✅

## Support

For issues:
1. Check Supabase docs: https://supabase.com/docs
2. Check browser console for errors
3. Check Supabase logs: Project → Logs → API/Database
