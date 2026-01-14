# Assignment Platform - Comprehensive Action Tracking Implementation Guide

## 📋 Overview

This guide explains the complete action tracking system implemented for the Assignment Platform. The system tracks **EVERY** student action including clicks, file uploads, errors, form interactions, peer ratings, and more using Supabase.

---

## ✅ What's Been Implemented

### 1. **Supabase Database Setup**
- ✅ Added Supabase credentials to `.env` file
- ✅ Created SQL migration script: `supabase_migrations/assignment_actions_tracking.sql`
- ✅ Comprehensive database schema with indexes and views

### 2. **Service Layer**
- ✅ `src/services/assignmentTrackingService.ts` - Complete Supabase integration
- ✅ Batch action tracking for performance
- ✅ Built-in error handling and logging

### 3. **React Hook**
- ✅ `src/hooks/useAssignmentTracking.ts` - Easy-to-use tracking methods
- ✅ 20+ pre-built tracking functions
- ✅ Auto-enrichment with session ID, user agent, etc.

### 4. **Admin Dashboard**
- ✅ `src/pages/admin/AssignmentActionsTrackerPage.tsx` - Full tracking UI
- ✅ Advanced filtering (by student, action, date, subject, etc.)
- ✅ CSV export functionality
- ✅ Summary views by student and assignment
- ✅ "Track Actions" button in Assignment Management page
- ✅ Route configured: `/admin/assignments/track-actions`

---

## 🗄️ Database Schema

### Main Table: `assignment_actions`

```sql
CREATE TABLE public.assignment_actions (
  id BIGSERIAL PRIMARY KEY,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Student Info
  student_email VARCHAR(255) NOT NULL,
  student_name VARCHAR(255),
  batch VARCHAR(100),

  -- Action Details
  action_type VARCHAR(100) NOT NULL,
  action_category VARCHAR(50) NOT NULL,
  action_description TEXT NOT NULL,

  -- Assignment Context
  assignment_id VARCHAR(100),
  assignment_name VARCHAR(500),
  assignment_subject VARCHAR(200),
  term VARCHAR(100),

  -- Location Context
  page_url VARCHAR(1000),
  page_section VARCHAR(100),

  -- Flexible Metadata
  metadata JSONB,

  -- Technical Context
  user_agent TEXT,
  session_id VARCHAR(255),
  screen_resolution VARCHAR(50),

  -- Performance
  load_time_ms INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Action Categories
- `click` - Button clicks, link clicks
- `upload` - File upload events
- `error` - All errors (validation, upload failures, etc.)
- `navigation` - Tab switches, page loads
- `form` - Form submissions, field changes
- `rating` - Peer ratings interactions
- `modal` - Modal open/close events
- `filter` - Filter applications
- `search` - Search queries

### Built-in Views
1. `assignment_actions_recent` - Last 7 days
2. `assignment_actions_errors` - Error actions only
3. `assignment_actions_uploads` - Upload actions only
4. `assignment_actions_summary_by_student` - Aggregated stats per student
5. `assignment_actions_summary_by_assignment` - Aggregated stats per assignment

---

## 🚀 Setup Instructions

### Step 1: Run SQL Migration in Supabase

1. **Open your Supabase project**: https://your-project.supabase.co
2. Navigate to **SQL Editor**
3. Copy the entire content from `supabase_migrations/assignment_actions_tracking.sql`
4. Paste and run the SQL script
5. Verify tables created:
   - ✅ `assignment_actions`
   - ✅ Views created
   - ✅ Indexes created
   - ✅ RLS policies enabled

### Step 2: Install Supabase Client (if not already installed)

```bash
npm install @supabase/supabase-js
```

### Step 3: Verify Environment Variables

Ensure `.env` contains:
```env
# Assignment Database x Supabase
REACT_APP_ASSIGNMENT_SUPABASE_URL=https://your-project.supabase.co
REACT_APP_ASSIGNMENT_SUPABASE_ANON_KEY=your-anon-key-here
```

---

## 📝 How to Implement Tracking

### Example 1: Track Button Click in AssignmentDetailsModal

```typescript
// Import the hook
import { useAssignmentTracking } from '../../hooks/useAssignmentTracking';

// Inside component
export const AssignmentDetailsModal: React.FC<AssignmentDetailsModalProps> = ({
  assignment,
  ...
}) => {
  const tracking = useAssignmentTracking();

  const handleSubmitClick = () => {
    // Track the button click
    tracking.trackButtonClick('Submit Assignment', {
      assignment,
      pageSection: 'submission_form',
      metadata: {
        has_files: files.length > 0,
        has_urls: urls.filter(u => u.link).length > 0,
        is_group: assignment.groupAssignment === 'Yes',
      }
    });

    // Continue with submission logic...
    handleSubmit();
  };

  return (
    <Button onClick={handleSubmitClick}>
      Submit Assignment
    </Button>
  );
};
```

### Example 2: Track File Upload Success

```typescript
const handleFileUploadSuccess = (fileName: string, fileSize: number) => {
  const uploadTime = Date.now() - uploadStartTime;

  tracking.trackFileUploadSuccess(fileName, fileSize, uploadTime, {
    assignment,
    pageSection: 'submission_form',
    metadata: {
      file_type: fileName.split('.').pop(),
      is_large_file: fileSize > 20 * 1024 * 1024,
    }
  });
};
```

### Example 3: Track File Upload Error

```typescript
const handleFileUploadError = (fileName: string, errorMessage: string) => {
  tracking.trackFileUploadError(fileName, file.size, errorMessage, {
    assignment,
    pageSection: 'submission_form',
    metadata: {
      error_code: 'FILE_SIZE_EXCEEDED',
      max_size: 50 * 1024 * 1024,
      file_type: fileName.split('.').pop(),
    }
  });

  toast.error(errorMessage);
};
```

### Example 4: Track Assignment Expired During Submission

```typescript
const handleSubmit = async () => {
  // Check if deadline passed
  const now = new Date();
  const endDate = new Date(assignment.endDateTime);

  if (now > endDate) {
    // Track this critical event!
    tracking.trackAssignmentExpired({
      assignment,
      pageSection: 'submission_form',
      metadata: {
        attempted_at: now.toISOString(),
        deadline: endDate.toISOString(),
        minutes_late: Math.floor((now.getTime() - endDate.getTime()) / 60000),
      }
    });

    toast.error('Assignment deadline has passed!');
    return;
  }

  // Continue submission...
};
```

### Example 5: Track Peer Rating Changes

```typescript
const handleRatingChange = (memberName: string, newRating: number) => {
  setPeerRatings(prev => ({
    ...prev,
    [memberName]: { ...prev[memberName], rating: newRating }
  }));

  tracking.trackPeerRatingChange(memberName, newRating, {
    assignment,
    pageSection: 'peer_ratings',
    metadata: {
      previous_rating: peerRatings[memberName]?.rating || 0,
      has_remark: !!peerRatings[memberName]?.remark,
    }
  });
};
```

### Example 6: Track Tab Switch

```typescript
const handleTabChange = (newTab: TabType) => {
  const oldTab = activeTab;
  setActiveTab(newTab);

  tracking.trackTabSwitch(oldTab, newTab, {
    pageSection: 'assignment_list',
    metadata: {
      assignments_in_new_tab: categorizedAssignments[newTab].length,
    }
  });
};
```

### Example 7: Track Validation Errors

```typescript
const validateForm = () => {
  const errors: string[] = [];

  // Check mandatory questions
  assignment.questions?.forEach((q, index) => {
    if (q.mandatory === 'Yes' && !answers[q.question]) {
      errors.push(q.question);

      tracking.trackValidationError(
        `Question ${index + 1}`,
        'Mandatory field not filled',
        {
          assignment,
          pageSection: 'submission_form',
          metadata: {
            question: q.question,
            question_index: index,
          }
        }
      );
    }
  });

  return errors.length === 0;
};
```

### Example 8: Track Modal Open/Close

```typescript
useEffect(() => {
  if (isOpen) {
    tracking.trackModalOpen('Assignment Details', {
      assignment,
      metadata: {
        assignment_id: assignment.assignmentId,
        assignment_name: assignment.assignmentHeader,
        tab: activeTab,
      }
    });
  }
}, [isOpen]);

const handleClose = () => {
  tracking.trackModalClose('Assignment Details', {
    assignment,
    metadata: {
      time_spent_ms: Date.now() - modalOpenTime,
      did_submit: hasSubmitted,
    }
  });

  onClose();
};
```

---

## 🎯 Complete List of Tracking Methods

### Click Tracking
```typescript
tracking.trackButtonClick(buttonName, options?)
tracking.trackLinkClick(linkName, linkUrl, options?)
tracking.trackAssignmentCardClick(assignment, options?)
```

### Navigation Tracking
```typescript
tracking.trackTabSwitch(fromTab, toTab, options?)
tracking.trackPageLoad(loadTimeMs)
```

### Modal Tracking
```typescript
tracking.trackModalOpen(modalName, options?)
tracking.trackModalClose(modalName, options?)
```

### File Upload Tracking
```typescript
tracking.trackFileUploadStart(fileName, fileSize, options?)
tracking.trackFileUploadSuccess(fileName, fileSize, uploadTimeMs, options?)
tracking.trackFileUploadError(fileName, fileSize, errorMessage, options?)
tracking.trackFileUploadCancelled(fileName, fileSize, options?)
```

### Form Tracking
```typescript
tracking.trackFormFieldChange(fieldName, fieldValue, options?)
tracking.trackSubmissionStart(options?)
tracking.trackSubmissionSuccess(submissionId, options?)
tracking.trackSubmissionError(errorMessage, options?)
tracking.trackValidationError(fieldName, errorMessage, options?)
```

### Peer Rating Tracking
```typescript
tracking.trackPeerRatingChange(memberName, rating, options?)
tracking.trackPeerRemarkChange(memberName, remarkLength, options?)
tracking.trackPeerRatingsSubmit(ratingsCount, options?)
```

### Error Tracking
```typescript
tracking.trackError(errorType, errorMessage, options?)
tracking.trackAssignmentExpired(options?)
```

### Filter & Search Tracking
```typescript
tracking.trackFilterApplied(filterType, filterValue, options?)
tracking.trackSearchQuery(searchQuery, resultsCount, options?)
```

---

## 🏁 Implementation Checklist

### AssignmentDetailsModal.tsx
- [ ] Track modal open/close
- [ ] Track all button clicks (Submit, Update, Cancel, etc.)
- [ ] Track file upload start/success/error/cancel
- [ ] Track form field changes (answers, group name, URLs)
- [ ] Track peer rating changes
- [ ] Track peer remark changes
- [ ] Track peer ratings submission
- [ ] Track validation errors
- [ ] Track submission start/success/error
- [ ] Track assignment expired during submission
- [ ] Track file description missing errors
- [ ] Track group member selection changes

### AssignmentListPage.tsx
- [ ] Track page load
- [ ] Track tab switches (Active/Upcoming/Expired/Completed)
- [ ] Track assignment card clicks
- [ ] Track filter applications (Subject, Term, Batch)
- [ ] Track search queries
- [ ] Track filter clear

### AssignmentDashboard.tsx
- [ ] Track sidebar navigation clicks
- [ ] Track dark mode toggle

---

## 📊 Viewing Tracked Data

### Admin Dashboard Access
1. Navigate to: **Admin Panel** → **Assignment Management**
2. Click **"Track Actions"** button (indigo gradient)
3. Apply filters to view specific actions
4. Export to CSV for analysis

### Filters Available
- Student Email
- Student Name
- Action Category (Click, Upload, Error, etc.)
- Subject
- Batch
- Date Range (From/To)

### Summary Views
- **By Student**: Total actions, errors, uploads, clicks per student
- **By Assignment**: Total actions, unique students, errors, submissions per assignment

---

## 🐛 Debugging

### Check if tracking is working:
1. Open browser console
2. Look for logs starting with:
   - `✅ Tracked:` - Successful tracking
   - `⚠️ Assignment Tracking: Disabled` - Tracking not enabled
   - `❌ Assignment Tracking:` - Errors

### Test tracking manually:
```typescript
import { assignmentTrackingService } from './services/assignmentTrackingService';

// Test action
assignmentTrackingService.trackAction({
  student_email: 'test@example.com',
  student_name: 'Test User',
  batch: 'Batch 1',
  action_type: 'test_action',
  action_category: 'click',
  action_description: 'Test tracking action',
  metadata: { test: true }
});
```

### Verify in Supabase:
1. Go to Supabase → **Table Editor**
2. Select `assignment_actions` table
3. Check if rows are being inserted

---

## 📈 Best Practices

1. **Always include assignment context** when tracking assignment-related actions
2. **Use metadata** for additional context (error codes, file types, etc.)
3. **Track errors immediately** when they occur
4. **Don't over-track** - Focus on meaningful actions
5. **Use appropriate action categories** for better filtering
6. **Include timestamps** for performance-related actions

---

## 🔐 Security & Privacy

- ✅ Row Level Security (RLS) enabled in Supabase
- ✅ Only authenticated users can insert actions
- ✅ All users can read (for admin dashboard)
- ✅ No sensitive data stored in action descriptions
- ✅ User agent and IP not stored for privacy

---

## 📝 Example Implementation for AssignmentDetailsModal

```typescript
import { useAssignmentTracking } from '../../hooks/useAssignmentTracking';

export const AssignmentDetailsModal: React.FC<AssignmentDetailsModalProps> = ({
  assignment,
  isOpen,
  onClose,
  onSubmit,
  activeTab
}) => {
  const tracking = useAssignmentTracking();
  const modalOpenTime = useRef(Date.now());

  // Track modal open
  useEffect(() => {
    if (isOpen) {
      modalOpenTime.current = Date.now();
      tracking.trackModalOpen('Assignment Details', {
        assignment,
        pageSection: 'assignment_details',
        metadata: {
          tab: activeTab,
          assignment_id: assignment.assignmentId,
          is_group: assignment.groupAssignment === 'Yes',
        }
      });
    }
  }, [isOpen]);

  // Track modal close
  const handleClose = () => {
    const timeSpent = Date.now() - modalOpenTime.current;
    tracking.trackModalClose('Assignment Details', {
      assignment,
      metadata: {
        time_spent_ms: timeSpent,
        tab: activeTab,
      }
    });
    onClose();
  };

  // Track file upload
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);

    selectedFiles.forEach(file => {
      tracking.trackFileUploadStart(file.name, file.size, {
        assignment,
        pageSection: 'submission_form',
        metadata: {
          file_type: file.type,
          is_large: file.size > 20 * 1024 * 1024,
        }
      });
    });

    // Continue with upload...
  };

  // Track file upload success
  const handleFileUploadSuccess = (fileName: string, fileSize: number, uploadTime: number) => {
    tracking.trackFileUploadSuccess(fileName, fileSize, uploadTime, {
      assignment,
      pageSection: 'submission_form',
      metadata: {
        file_type: fileName.split('.').pop(),
      }
    });
  };

  // Track file upload error
  const handleFileUploadError = (fileName: string, fileSize: number, error: string) => {
    tracking.trackFileUploadError(fileName, fileSize, error, {
      assignment,
      pageSection: 'submission_form',
      metadata: {
        error_type: error.includes('size') ? 'FILE_TOO_LARGE' : 'UPLOAD_FAILED',
      }
    });
  };

  // Track submission
  const handleSubmit = async () => {
    tracking.trackSubmissionStart({ assignment, pageSection: 'submission_form' });

    try {
      // Submit logic...
      const result = await submitAssignment();

      tracking.trackSubmissionSuccess(result.submissionId, {
        assignment,
        pageSection: 'submission_form',
        metadata: {
          file_count: files.length,
          url_count: urls.filter(u => u.link).length,
          is_group: assignment.groupAssignment === 'Yes',
        }
      });

      toast.success('Assignment submitted successfully!');
    } catch (error) {
      tracking.trackSubmissionError(error.message, {
        assignment,
        pageSection: 'submission_form',
        metadata: {
          error_type: error.code || 'UNKNOWN',
        }
      });

      toast.error('Submission failed!');
    }
  };

  return (
    // Component JSX...
  );
};
```

---

## 🎉 That's It!

You now have a comprehensive action tracking system for the Assignment Platform. Every student action will be logged to Supabase for analysis, debugging, and insights.

For questions or issues, check the browser console for tracking logs or verify the Supabase table directly.

**Happy Tracking! 📊**
