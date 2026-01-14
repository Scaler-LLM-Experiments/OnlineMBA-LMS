# Forms System - Complete Google Sheets Schema

## Google Sheets URL
https://docs.google.com/spreadsheets/d/1K5DrHxTVignwR4841sYyzziLDNq-rw2lrlDNJWk_Ddk

---

## Sheet 1: Forms
**Purpose:** Store form metadata and configuration
**Total Columns:** 32 (A-AF)

| Column | Header | Description |
|--------|--------|-------------|
| A | Form_ID | Unique form identifier |
| B | Batch | Target batch (e.g., "2024") |
| C | Term | Academic term |
| D | Domain | Subject domain |
| E | Subject | Specific subject |
| F | Form_Name | Name of the form |
| G | Form_Description | Form description |
| H | Form_Type | Type of form (Assignment, Quiz, Survey, etc.) |
| I | Created_By | Creator email |
| J | Created_At | Creation timestamp |
| K | Start_DateTime | When form becomes active |
| L | End_DateTime | When form closes |
| M | Uploaded_File | Associated file URL |
| N | Drive_Link | Google Drive folder link |
| O | Attachment_Required | Yes/No |
| P | Response_Sheet_Link | Link to responses sheet |
| Q | Is_Active | Yes/No - Is form active |
| R | Show_At_Start_Until_Filled | Yes/No - Show on startup |
| S | Show_In_Tab | Yes/No - Show in navigation |
| T | Visible_To | Who can see this form (All/Batch-specific) |
| U | Max_Responses_Per_User | Maximum submissions per user |
| V | Show_Results_To_Respondents | Yes/No |
| W | Thank_You_Message | Confirmation message |
| X | Redirect_URL | URL to redirect after submission |
| Y | Allow_Edit_Response | Yes/No |
| Z | Require_Login | Yes/No - Authentication required |
| AA | Collect_Email | Yes/No - Collect email |
| AB | Total_Responses | Count of responses |
| AC | Last_Updated_At | Last modification timestamp |
| AD | Last_Updated_By | Last modifier email |
| AE | Status | Draft/Active/Closed |
| AF | Notes | Additional notes |

---

## Sheet 2: Form_Questions
**Purpose:** Store all question data with support for 34 question types
**Total Columns:** 61 (A-BI)

### Basic Fields (A-AB)

| Column | Header | Description |
|--------|--------|-------------|
| A | Question_ID | Unique question identifier |
| B | Form_ID | Parent form ID |
| C | Question_Order | Display order (1, 2, 3...) |
| D | Question_Type | Type (short_text, multiple_choice, etc.) |
| E | Question_Text | The question text |
| F | Question_Description | Help text/description |
| G | Is_Required | Yes/No |
| H | Placeholder_Text | Input placeholder |
| I | Validation_Type | Type of validation (None/Email/URL/Number/etc.) |
| J | Validation_Pattern | Regex pattern for validation |
| K | Validation_Message | Error message for validation |
| L | Min_Length | Minimum text length |
| M | Max_Length | Maximum text length |
| N | Min_Value | Minimum numeric value |
| O | Max_Value | Maximum numeric value |
| P | Min_Selections | Minimum choices to select |
| Q | Max_Selections | Maximum choices to select |
| R | Allow_Other_Option | Yes/No - Show "Other" option |
| S | File_Types_Allowed | Allowed file extensions (e.g., ".pdf,.jpg") |
| T | Max_File_Size_MB | Maximum file size |
| U | Scale_Start | Scale start value (legacy) |
| V | Scale_End | Scale end value (legacy) |
| W | Scale_Start_Label | Scale start label (legacy) |
| X | Scale_End_Label | Scale end label (legacy) |
| Y | Conditional_Logic_ID | Reference to conditional logic (deprecated) |
| Z | Created_At | Creation timestamp |
| AA | Updated_At | Last update timestamp |
| AB | Notes | Additional notes |

### Extended Fields for 34 Question Types (AC-BI)

| Column | Header | Description | Used By |
|--------|--------|-------------|---------|
| AC | Randomize_Options | Yes/No - Randomize option order | Multiple Choice, Dropdown, Checkboxes |
| AD | Allow_Multiple_Selections | Yes/No - Allow multiple selections | Multiple Choice |
| AE | Selection_Limit_Type | unlimited/exact/range | Choice types |
| AF | Collect_Name | Yes/No - Collect name field | Contact Info |
| AG | Collect_Email | Yes/No - Collect email field | Contact Info |
| AH | Collect_Phone | Yes/No - Collect phone field | Contact Info |
| AI | Collect_Address | Yes/No - Collect address field | Contact Info |
| AJ | Rating_Type | star/heart/smiley | Rating |
| AK | Rating_Scale | 1-10 scale | Rating |
| AL | Scale_Min | Minimum scale value | Opinion Scale, NPS |
| AM | Scale_Max | Maximum scale value | Opinion Scale, NPS |
| AN | Scale_Min_Label | Label for minimum | Opinion Scale |
| AO | Scale_Max_Label | Label for maximum | Opinion Scale, NPS |
| AP | Scale_Mid_Label | Label for midpoint | Opinion Scale |
| AQ | Matrix_Rows | JSON array of row labels | Matrix |
| AR | Matrix_Columns | JSON array of column labels | Matrix |
| AS | Matrix_Type | single/multiple | Matrix |
| AT | Date_Format | MM/DD/YYYY, DD/MM/YYYY, YYYY-MM-DD | Date |
| AU | Restrict_Past_Dates | Yes/No - Disable past dates | Date |
| AV | Restrict_Future_Dates | Yes/No - Disable future dates | Date |
| AW | Media_URL | URL for video/audio/image | Video, Audio, Statement |
| AX | Media_Type | video/audio/image/none | Video, Audio |
| AY | Autoplay | Yes/No - Auto-play media | Video, Audio |
| AZ | Stripe_Amount | Payment amount | Stripe Payment |
| BA | Stripe_Currency | USD/EUR/GBP/INR | Stripe Payment |
| BB | Drive_Type | file/folder | Google Drive |
| BC | Calendly_URL | Calendly booking URL | Calendly |
| BD | AI_Context | AI context data | Clarify with AI |
| BE | AI_FAQ_Data | FAQ dataset | FAQ with AI |
| BF | Redirect_URL | Redirect target URL | Redirect to URL |
| BG | Redirect_Delay | Delay in seconds | Redirect to URL |
| BH | Statement_Content | Statement text | Statement |
| BI | Grouped_Question_IDs | JSON array of question IDs | Question Group, Multi-Question Page |

---

## Sheet 3: Form_Question_Options
**Purpose:** Store options for choice-based questions
**Total Columns:** 10 (A-J)

| Column | Header | Description |
|--------|--------|-------------|
| A | Option_ID | Unique option identifier |
| B | Question_ID | Parent question ID |
| C | Option_Order | Display order (1, 2, 3...) |
| D | Option_Text | Text shown to user |
| E | Option_Value | Value stored when selected |
| F | Has_Image | Yes/No - Has image |
| G | Image_URL | URL to image (for Picture Choice) |
| H | Jump_To_Question_ID | Question to jump to (for branching logic) |
| I | Created_At | Creation timestamp |
| J | Notes | Additional notes |

---

## Sheet 4: Form_Responses
**Purpose:** Store user form submissions
**Total Columns:** 13 (A-M)

| Column | Header | Description |
|--------|--------|-------------|
| A | Response_ID | Unique response identifier |
| B | Form_ID | Parent form ID |
| C | User_Email | Respondent email |
| D | User_Name | Respondent name |
| E | User_Batch | Respondent batch |
| F | Submission_DateTime | Submission timestamp |
| G | Response_JSON | JSON object with all answers |
| H | IP_Address | Submitter IP address |
| I | Completion_Time_Seconds | Time taken to complete |
| J | Is_Complete | Yes/No - Fully completed |
| K | Last_Modified_At | Last modification timestamp |
| L | Device_Type | Device used (Mobile/Desktop/Tablet) |
| M | Notes | Additional notes |

---

## Sheet 5: Form_Conditional_Logic (NEW - NEEDS TO BE CREATED)
**Purpose:** Store conditional logic rules for questions
**Total Columns:** 10 (A-J)

| Column | Header | Description |
|--------|--------|-------------|
| A | Rule_ID | Unique rule identifier |
| B | Question_ID | Question that has this rule |
| C | Form_ID | Parent form ID |
| D | Target_Question_Index | Index of question to check (0-based) |
| E | Operator | Comparison operator (equals, not_equals, contains, greater_than, less_than) |
| F | Value | Value to compare against |
| G | Action | Action to take (show/hide) |
| H | Rule_Order | Order of rule execution (1, 2, 3...) |
| I | Created_At | Creation timestamp |
| J | Notes | Additional notes |

---

## Setup Checklist

### ✅ Already Exists:
- [x] Forms sheet (32 columns)
- [x] Form_Questions sheet (needs columns AC-BI added)
- [x] Form_Question_Options sheet (10 columns)
- [x] Form_Responses sheet (13 columns)

### ⚠️ Needs Action:
- [ ] **Add columns AC through BI** to Form_Questions sheet
- [ ] **Create Form_Conditional_Logic sheet** with columns A-J
- [ ] **Update backend Code.js** with conditional logic functions
- [ ] **Deploy updated backend** with `clasp push --force`

---

## Quick Setup Guide

### Step 1: Update Form_Questions Sheet
1. Open: https://docs.google.com/spreadsheets/d/1K5DrHxTVignwR4841sYyzziLDNq-rw2lrlDNJWk_Ddk
2. Go to "Form_Questions" tab
3. Add column headers AC through BI (copy from table above)

### Step 2: Create Form_Conditional_Logic Sheet
1. In the same spreadsheet, create a new sheet called "Form_Conditional_Logic"
2. Add column headers A through J (copy from table above)

### Step 3: Update Backend
1. Follow instructions in `Conditional_Logic_Integration.md`
2. Run `clasp push --force` to deploy

### Step 4: Test
1. Navigate to Admin Panel > Forms
2. Create a new form with questions
3. Add conditional logic rules
4. Save and verify data appears in Google Sheets

---

## Data Examples

### Example: Question with Conditional Logic
```javascript
{
  questionText: "What is your preferred contact method?",
  questionType: "multiple_choice",
  options: ["Email", "Phone", "SMS"],
  hasConditionalLogic: true,
  conditionalRules: [
    {
      questionIndex: 0,  // Check question at index 0
      operator: "equals",
      value: "Phone"
    }
  ]
}
```

This means: "Show this question only if Question 1's answer equals 'Phone'"

### Example: Matrix Question
```javascript
{
  questionText: "Rate our services",
  questionType: "matrix",
  matrixRows: ["Service Quality", "Response Time", "Pricing"],
  matrixColumns: ["Poor", "Fair", "Good", "Excellent"],
  matrixType: "single"
}
```

### Example: Contact Info Question
```javascript
{
  questionText: "Your contact information",
  questionType: "contact_info",
  collectName: "Yes",
  collectEmail: "Yes",
  collectPhone: "Yes",
  collectAddress: "No"
}
```

---

## Summary

**Total Sheets:** 5
**Total Columns Across All Sheets:** 126
**Question Types Supported:** 34
**Backend Functions:** 25+ CRUD operations
**Frontend Integration:** Complete with React/TypeScript

**Status:** Ready for deployment after adding missing columns and conditional logic sheet!

Generated: 2025-11-12
