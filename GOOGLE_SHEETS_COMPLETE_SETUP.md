# Complete Google Sheets Setup Guide for Online MBA LMS

This document contains ALL the Google Sheets you need to create for the Online MBA LMS project.

---

## OVERVIEW

You need to create **3 Google Spreadsheets**:

| Spreadsheet | Purpose |
|-------------|---------|
| **Main Portal** | Students, Sessions, Resources, Events, Policies, Community |
| **Exam Portal** | Exams, Questions, Responses, Proctoring |
| **Assignment Portal** | Assignments, Submissions, Groups |

---

## SPREADSHEET 1: MAIN PORTAL

Create a new Google Spreadsheet and add these sheets (tabs):

### Sheet 1: "Student Data"
| Column | Header | Example |
|--------|--------|---------|
| A | Email | student@example.com |
| B | Name | John Doe |
| C | Roll No | MBA2024001 |
| D | Batch | MBA-2024 |
| E | Phone | 9876543210 |
| F | Status | Active |

### Sheet 2: "Term"
| Column | Header | Example |
|--------|--------|---------|
| A | Batch | MBA-2024 |
| B | Term | Term-1 |
| C | Domain | Finance |
| D | Subject | Accounting |

**Sample Data:**
```
Batch       | Term    | Domain      | Subject
MBA-2024    | Term-1  | Finance     | Accounting
MBA-2024    | Term-1  | Finance     | Economics
MBA-2024    | Term-1  | Marketing   | Consumer Behavior
MBA-2024    | Term-1  | Marketing   | Digital Marketing
MBA-2024    | Term-2  | Operations  | Supply Chain
MBA-2024    | Term-2  | Operations  | Project Management
MBA-2024    | Term-2  | HR          | Organizational Behavior
```

### Sheet 3: "Zoom Live"
| Column | Header | Example |
|--------|--------|---------|
| A | Batch | MBA-2024 |
| B | Term | Term-1 |
| C | Domain | Finance |
| D | Subject | Accounting |
| E | Session Name | Session 1 |
| F | Date | 15-Jan-2025 |
| G | Start Time | 10:00 AM |
| H | Duration | 60 |
| I | Zoom Live Link | https://zoom.us/j/123 |
| J | Meeting ID | 123456789 |
| K | Meeting Password | abc123 |
| L | Topic | Introduction to Accounting |

### Sheet 4: "Zoom Recordings"
| Column | Header | Example |
|--------|--------|---------|
| A | Session ID | REC001 |
| B | Batch | MBA-2024 |
| C | Term | Term-1 |
| D | Domain | Finance |
| E | Subject | Accounting |
| F | Session Name | Session 1 |
| G | Topic | Introduction to Accounting |
| H | Date | 15-Jan-2025 |
| I | Start Time | 10:00 AM |
| J | Duration | 60 |
| K | Speaker View URL | https://drive.google.com/... |
| L | Gallery View URL | https://drive.google.com/... |
| M | Screen Share URL | https://drive.google.com/... |
| N | Chat URL | https://drive.google.com/... |
| O | Thumbnail | https://drive.google.com/... |

### Sheet 5: "Resources Material"
| Column | Header | Example |
|--------|--------|---------|
| A | ID_RES | RES001 |
| B | Publish_RES | Yes |
| C | Posted By_RES | admin@example.com |
| D | Created at_RES | 2025-01-15 10:00:00 |
| E | Edited at_RES | |
| F | Edited by_RES | |
| G | StartDateTime_RES | 2025-01-15 |
| H | EndDateTime_RES | 2025-12-31 |
| I | Target Batch_RES | MBA-2024 |
| J | Show Other Batches_RES | No |
| K | Title_RES | Accounting Basics |
| L | Description_RES | Introduction to accounting principles |
| M | Term_RES | Term-1 |
| N | Domain_RES | Finance |
| O | Subject_RES | Accounting |
| P | Session Name_RES | Session 1 |
| Q | Level_RES | Subject |
| R | Resource Type_RES | Lecture Slides |
| S | Resource Type Custom_RES | |
| T | Priority_RES | Medium |
| U | Learning Objectives_RES | Understand basics |
| V | Prerequisites_RES | None |
| W | File 1 Name_RES | Slides.pdf |
| X | File 1 URL_RES | https://drive.google.com/... |
| Y | File 2 Name_RES | |
| Z | File 2 URL_RES | |
| AA | File 3 Name_RES | |
| AB | File 3 URL_RES | |
| AC | File 4 Name_RES | |
| AD | File 4 URL_RES | |
| AE | File 5 Name_RES | |
| AF | File 5 URL_RES | |
| AG | URLs_RES | Video Tutorial\|https://youtube.com/... |
| AH | Drive Folder Link_RES | https://drive.google.com/... |
| AI | File Count_RES | 1 |
| AJ | Status_RES | Published |
| AK | Notes_RES | |

### Sheet 6: "Events & Announcements"
| Column | Header | Example |
|--------|--------|---------|
| A | ID | EVT001 |
| B | Category Type | EVENTS |
| C | Event Type | Workshop |
| D | Announcement Type | |
| E | Title | Career Workshop |
| F | Subtitle | Resume Building |
| G | Description | Learn resume tips |
| H | Priority | High |
| I | Batch | MBA-2024 |
| J | Start DateTime | 2025-01-20 14:00 |
| K | End DateTime | 2025-01-20 16:00 |
| L | Posted By | admin@example.com |
| M | Status | Published |
| N | Publish | Yes |
| O | Requires Acknowledgement | No |
| P | Files | |
| Q | Created At | 2025-01-15 |

### Sheet 7: "Policy & Documents"
| Column | Header | Example |
|--------|--------|---------|
| A | ID | POL001 |
| B | Policy Name | Academic Integrity |
| C | Description | Rules for academic conduct |
| D | Full Content | (HTML content) |
| E | Category | Academic |
| F | Batch | MBA-2024 |
| G | Requires Acknowledgement | Yes |
| H | Start DateTime | 2025-01-01 |
| I | End DateTime | 2025-12-31 |
| J | Status | Published |
| K | Posted By | admin@example.com |
| L | Created At | 2025-01-01 |
| M | File URL | |

### Sheet 8: "Students Corner - Activity"
| Column | Header | Example |
|--------|--------|---------|
| A | Post ID | POST001 |
| B | Author Email | student@example.com |
| C | Author Name | John Doe |
| D | Post Type | Discussion |
| E | Title | Study Group |
| F | Content | Looking for study partners |
| G | Likes | 5 |
| H | Comments Count | 3 |
| I | Created At | 2025-01-15 10:00:00 |
| J | Status | Active |
| K | Batch | MBA-2024 |

### Sheet 9: "Acknowledgement Data"
| Column | Header | Example |
|--------|--------|---------|
| A | ID | ACK001 |
| B | Student Email | student@example.com |
| C | Content ID | POL001 |
| D | Content Type | Policy |
| E | Acknowledged At | 2025-01-15 10:00:00 |

### Sheet 10: "Notes"
| Column | Header | Example |
|--------|--------|---------|
| A | Note ID | NOTE001 |
| B | Student Email | student@example.com |
| C | Session ID | REC001 |
| D | Content | (Base64 encoded) |
| E | Tags | accounting,basics |
| F | Is Pinned | No |
| G | Created At | 2025-01-15 |
| H | Updated At | 2025-01-15 |

### Sheet 11: "SSB Calendar"
| Column | Header | Example |
|--------|--------|---------|
| A | Event ID | CAL001 |
| B | Batch | MBA-2024 |
| C | Event Type | Session |
| D | Event Name | Finance Class |
| E | Description | Weekly class |
| F | Start Date | 15-Jan-2025 |
| G | Start Time | 10:00 AM |
| H | End Date | 15-Jan-2025 |
| I | End Time | 11:00 AM |
| J | Location | Online |
| K | Link | https://zoom.us/... |
| L | Student Level Show | No |
| M | Attendees | |

### Sheet 12: "Forms"
| Column | Header | Example |
|--------|--------|---------|
| A | Form ID | FORM001 |
| B | Title | Feedback Form |
| C | Description | Course feedback |
| D | Type | Survey |
| E | Batch | MBA-2024 |
| F | Is Required | Yes |
| G | Deadline | 2025-01-31 |
| H | Status | Active |
| I | Created At | 2025-01-01 |
| J | Created By | admin@example.com |

### Sheet 13: "Form_Responses"
| Column | Header | Example |
|--------|--------|---------|
| A | Response ID | RESP001 |
| B | Form ID | FORM001 |
| C | Student Email | student@example.com |
| D | Responses | (JSON) |
| E | Submitted At | 2025-01-15 |

---

## SPREADSHEET 2: EXAM PORTAL

Create a new Google Spreadsheet for Exams:

### Sheet 1: "Exams_Master"
| Column | Header | Example |
|--------|--------|---------|
| A | Exam ID | EXAM001 |
| B | Exam Title | Midterm Finance |
| C | Exam Type | MCQ |
| D | Batch | MBA-2024 |
| E | Term | Term-1 |
| F | Domain | Finance |
| G | Subject | Accounting |
| H | Description | Midterm examination |
| I | Duration | 60 |
| J | Total Marks | 100 |
| K | Passing Marks | 40 |
| L | Start DateTime | 2025-02-01 10:00 |
| M | End DateTime | 2025-02-01 12:00 |
| N | Instructions | Read carefully |
| O | Status | Published |
| P | Password Type | Master |
| Q | Master Password | exam123 |
| R | Is Practice | No |
| S | Created By | admin@example.com |
| T | Created At | 2025-01-15 |
| U | Total Questions | 50 |
| V | View Result | Yes |
| W | Device Allowed | Any |

### Sheet 2: "Exam_Questions"
| Column | Header | Example |
|--------|--------|---------|
| A | Question ID | Q001 |
| B | Exam ID | EXAM001 |
| C | Question Number | 1 |
| D | Question Type | MCQ |
| E | Question Text | What is accounting? |
| F | Question Image URL | |
| G | Option A | Recording transactions |
| H | Option B | Making sales |
| I | Option C | Managing staff |
| J | Option D | None of above |
| K | Option E | |
| L | Option F | |
| M | Option G | |
| N | Option H | |
| O | Option I | |
| P | Option J | |
| Q | More than 1 Answer | No |
| R | Correct Answer | A |
| S | Marks | 2 |
| T | Negative Marks | 0 |
| U | Difficulty | Easy |
| V | Explanation | Accounting is... |

### Sheet 3: "Exam_Responses"
| Column | Header | Example |
|--------|--------|---------|
| A | Response ID | ERESP001 |
| B | Exam ID | EXAM001 |
| C | Student Email | student@example.com |
| D | Student Name | John Doe |
| E | Start Time | 2025-02-01 10:00 |
| F | Submit Time | 2025-02-01 10:45 |
| G | Time Taken | 45 |
| H | Total Score | 80 |
| I | Percentage | 80 |
| J | Status | Submitted |
| K | Answers | (JSON) |
| L | Auto Submitted | No |

### Sheet 4: "Exam_Passwords"
| Column | Header | Example |
|--------|--------|---------|
| A | Password ID | PWD001 |
| B | Exam ID | EXAM001 |
| C | Student Email | student@example.com |
| D | Password | abc123 |
| E | Generated At | 2025-01-30 |
| F | Used | No |

### Sheet 5: "Batch List"
| Column | Header | Example |
|--------|--------|---------|
| A | Batch | MBA-2024 |
| B | Status | Active |

---

## SPREADSHEET 3: ASSIGNMENT PORTAL

Create a new Google Spreadsheet for Assignments:

### Sheet 1: "Assignment Creator"
| Column | Header | Example |
|--------|--------|---------|
| A | AssignmentID | ASN001 |
| B | Batch | MBA-2024 |
| C | Term | Term-1 |
| D | Subject | Accounting |
| E | Publish | Yes |
| F | AssignmentHeader | Case Study 1 |
| G | SubHeader | Financial Analysis |
| H | AssignmentDetails | (HTML content) |
| I | StartDateTime | 2025-01-20 00:00 |
| J | EndDateTime | 2025-01-27 23:59 |
| K | TotalMarks | 100 |
| L | Status | Active |
| M | Created At | 2025-01-15 |
| N | GroupAssignment | No |
| O | AttachmentMandatory | Yes |
| P | FileTypes | pdf,doc,docx |

### Sheet 2: "Subject Term"
| Column | Header | Example |
|--------|--------|---------|
| A | Batch | MBA-2024 |
| B | Term | Term-1 |
| C | Domain | Finance |
| D | Subject | Accounting |

(Same structure as "Term" sheet in Main Portal)

### Sheet 3: "Assignment Submissions"
| Column | Header | Example |
|--------|--------|---------|
| A | Submission ID | SUB001 |
| B | Assignment ID | ASN001 |
| C | Student Email | student@example.com |
| D | Student Name | John Doe |
| E | Submitted At | 2025-01-25 10:00 |
| F | File URLs | (JSON) |
| G | Answers | (JSON) |
| H | Status | Submitted |
| I | Marks | 85 |
| J | Feedback | Good work |
| K | Graded By | instructor@example.com |
| L | Graded At | 2025-01-28 |

---

## GOOGLE DRIVE FOLDERS

Create these folders in Google Drive:

1. **LMS Resources** - For resource files
2. **LMS Assignments** - For assignment submissions
3. **LMS Exams** - For exam-related files

Note the Folder IDs from the URLs (the long string after `/folders/`).

---

## YOUR TASKS (What You Need To Do)

### Step 1: Create Google Spreadsheets
1. Go to [Google Sheets](https://sheets.google.com)
2. Create 3 new spreadsheets:
   - "Online MBA - Main Portal"
   - "Online MBA - Exams"
   - "Online MBA - Assignments"
3. In each spreadsheet, create the sheets (tabs) listed above
4. Add the column headers to Row 1 of each sheet
5. **Copy the Spreadsheet IDs** from the URLs

### Step 2: Create Google Drive Folders
1. Go to [Google Drive](https://drive.google.com)
2. Create folders: "LMS Resources", "LMS Assignments", "LMS Exams"
3. **Copy the Folder IDs** from the URLs

### Step 3: Deploy Google Apps Script Backend
1. Go to [Google Apps Script](https://script.google.com)
2. Create a new project
3. Copy the backend code (I'll provide this)
4. Update the Sheet IDs and Folder IDs in the config
5. Deploy as Web App
6. **Copy the Web App URL**

### Step 4: Update React App Environment
Create/update `.env` file in your project:

```env
REACT_APP_BACKEND_API_URL=YOUR_MAIN_BACKEND_WEB_APP_URL
REACT_APP_EXAM_API_URL=YOUR_EXAM_BACKEND_WEB_APP_URL
REACT_APP_ASSIGNMENT_API_URL=YOUR_ASSIGNMENT_BACKEND_WEB_APP_URL
```

### Step 5: Add Sample Data
1. Add yourself to "Student Data" sheet
2. Add batch/term/domain/subject hierarchy to "Term" sheet
3. Test the application

---

## QUICK START - MINIMUM REQUIRED

To get started quickly, you only need:

1. **Main Portal Spreadsheet** with these sheets:
   - Student Data (add your email)
   - Term (add your batch hierarchy)
   - Zoom Live (can be empty)
   - Zoom Recordings (can be empty)

2. **Update .env** with your backend URL

3. **Add yourself as admin** in the code (already done for mohit000pareek@gmail.com)

---

## NEED HELP?

The backend code is located in:
- `/backend/Main Backend/` - Main portal backend
- `/backend/Exam Backend/` - Exam backend
- `/backend/Assignment Backend/` - Assignment backend

Copy these to Google Apps Script and update the configuration.
