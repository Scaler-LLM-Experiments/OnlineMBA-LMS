# Exam Term Sheet Setup Guide

This document explains how the exam creation form fetches dropdown values from Google Sheets.

## Overview

The exam creation form now dynamically populates **Batch**, **Term**, **Domain**, and **Subject** dropdowns from the Google Sheet, eliminating hardcoded values and making it easy to update options.

---

## Google Sheet Configuration

**Sheet ID:** `1XlUlGT-smpkzL1uq-15BwyCVS7xG1FMehQJclP6Ff14`

This is the same sheet that stores exam data (`Exams_Master`, `Exam_Questions`, etc.)

---

## Required Subsheets

### 1. **Exam Term** Sheet

**Purpose:** Stores the hierarchical structure of Batch → Term → Domain → Subject

**Columns (must be exactly named):**

| Column Name | Description | Example |
|-------------|-------------|---------|
| `Batch` | Student batch/cohort | 2024-2026 |
| `Term` | Academic term | Term 1 |
| `Domain` | Subject domain/category | Marketing |
| `Subject` | Specific subject/course | Marketing Analytics |

**Example Data:**

```
| Batch      | Term   | Domain          | Subject                    |
|------------|--------|-----------------|----------------------------|
| 2024-2026  | Term 1 | Marketing       | Marketing Analytics        |
| 2024-2026  | Term 1 | Marketing       | Consumer Behavior          |
| 2024-2026  | Term 1 | Finance         | Financial Accounting       |
| 2024-2026  | Term 2 | Marketing       | Digital Marketing          |
| 2024-2026  | Term 2 | Finance         | Corporate Finance          |
| 2024-2026  | Term 3 | Operations      | Supply Chain Management    |
| 2025-2027  | Term 1 | Marketing       | Brand Management           |
| 2025-2027  | Term 1 | Finance         | Investment Analysis        |
```

**How It Works:**

1. Frontend calls `getTermStructure()` API
2. Backend reads "Exam Term" sheet
3. Returns:
   - Unique **batches** (sorted alphabetically)
   - Unique **terms** (sorted alphabetically)
   - Unique **domains** (sorted alphabetically)
   - Unique **subjects** (sorted alphabetically)
   - **Mappings** (relationships between term → domain → subject)

**Cascading Dropdowns:**
- When user selects a **Term**, only relevant **Domains** appear
- When user selects a **Domain**, only relevant **Subjects** appear

---

### 2. **Exam Category** Sheet

**Purpose:** Stores available exam types

**Required Columns:**
- `Category` - Must contain "EXAM" for exam types
- `Type` - The exam type name

**Example Data:**

```
| Category | Type        |
|----------|-------------|
| EXAM     | Quiz        |
| EXAM     | Mid-Term    |
| EXAM     | End-Term    |
```

**How It Works:**
- The system filters rows where `Category = "EXAM"`
- Returns the corresponding `Type` values
- Only EXAM category types are returned (case-insensitive)

**Fallback:** If this sheet doesn't exist or no EXAM types found, the system uses default types:
- End-Term
- Mid-Term
- Quiz

---

## API Endpoints

### `getTermStructureExam()`

**Request:**
```javascript
GET https://script.google.com/macros/s/.../exec?action=getTermStructureExam
```

**Response:**
```json
{
  "success": true,
  "data": {
    "terms": ["Term 1", "Term 2", "Term 3"],
    "domains": ["Finance", "Marketing", "Operations"],
    "subjects": [
      "Brand Management",
      "Consumer Behavior",
      "Corporate Finance",
      "Digital Marketing",
      "Financial Accounting",
      "Investment Analysis",
      "Marketing Analytics",
      "Supply Chain Management"
    ],
    "batches": ["2024-2026", "2025-2027"],
    "mappings": [
      {
        "batch": "2024-2026",
        "term": "Term 1",
        "domain": "Marketing",
        "subject": "Marketing Analytics"
      },
      {
        "batch": "2024-2026",
        "term": "Term 1",
        "domain": "Marketing",
        "subject": "Consumer Behavior"
      },
      // ... more mappings
    ]
  }
}
```

---

### `getExamTypes()`

**Request:**
```javascript
GET https://script.google.com/macros/s/.../exec?action=getExamTypes
```

**Response:**
```json
{
  "success": true,
  "data": [
    "End-Term",
    "Mid-Term",
    "Quiz"
  ]
}
```

**Note:** Only returns types where Category = "EXAM" in the Exam Category sheet

---

## Frontend Implementation

**File:** `src/exam/components/exam-builder/BasicDetailsTab.tsx`

**How It Works:**

1. **On Component Mount:**
   ```javascript
   useEffect(() => {
     fetchDropdownData();
   }, []);
   ```

2. **Fetch Data:**
   ```javascript
   const fetchDropdownData = async () => {
     // Fetch term structure
     const termResult = await getTermStructure();
     setTerms(termResult.data.terms);
     setTermMappings(termResult.data.mappings);
     setBatches(termResult.data.batches);

     // Fetch exam types
     const typesResult = await getExamTypes();
     setExamTypes(typesResult.data);
   };
   ```

3. **Cascading Logic:**
   ```javascript
   // When term changes, filter domains
   useEffect(() => {
     if (data.term) {
       const filtered = termMappings.filter(m => m.term === data.term);
       const domains = Array.from(new Set(filtered.map(m => m.domain)));
       setAvailableDomains(domains);
     }
   }, [data.term, termMappings]);

   // When domain changes, filter subjects
   useEffect(() => {
     if (data.term && data.domain) {
       const filtered = termMappings.filter(m =>
         m.term === data.term && m.domain === data.domain
       );
       const subjects = Array.from(new Set(filtered.map(m => m.subject)));
       setAvailableSubjects(subjects);
     }
   }, [data.term, data.domain, termMappings]);
   ```

---

## How to Update Dropdown Options

### Adding New Batch
1. Open Google Sheet: `1XlUlGT-smpkzL1uq-15BwyCVS7xG1FMehQJclP6Ff14`
2. Go to "Exam Term" sheet
3. Add rows with new batch name (e.g., `2026-2028`)
4. Include Term, Domain, Subject mappings
5. Save - changes reflect immediately!

### Adding New Term
1. Go to "Exam Term" sheet
2. Add rows with new term (e.g., `Term 4`)
3. Include Domain and Subject mappings
4. Save

### Adding New Domain
1. Go to "Exam Term" sheet
2. Add rows with new domain (e.g., `HR Management`)
3. Include subjects under that domain
4. Save

### Adding New Subject
1. Go to "Exam Term" sheet
2. Add row with: Batch, Term, Domain, **New Subject**
3. Save

### Adding New Exam Type
1. Go to "Exam Category" sheet
2. Add new row with:
   - Category: `EXAM`
   - Type: `Your Exam Type Name` (e.g., "Final Exam", "Pop Quiz")
3. Save - changes reflect immediately!

---

## Benefits of This Approach

✅ **Centralized Management** - Update dropdowns in Google Sheet without code changes
✅ **Dynamic Cascading** - Term → Domain → Subject hierarchy maintained automatically
✅ **No Code Deployment** - Changes take effect immediately
✅ **Multiple Batches** - Support multiple cohorts simultaneously
✅ **Consistency** - Same structure used across all exams
✅ **Easy to Scale** - Add new terms/domains/subjects by just adding rows

---

## Troubleshooting

### Dropdowns Not Populating

1. **Check Sheet Name:**
   - Must be exactly `Exam Term` (case-sensitive)
   - Must be exactly `Exam Category` (case-sensitive)

2. **Check Column Names:**
   - "Exam Term" sheet: `Batch`, `Term`, `Domain`, `Subject`
   - "Exam Category" sheet: `Category` and `Type`

3. **Check Data:**
   - Ensure no empty rows in the middle of data
   - Column headers should be in Row 1
   - Data should start from Row 2

4. **Check API:**
   - Open browser console (F12)
   - Check Network tab for API calls
   - Look for errors in response
   - Look for console logs:
     - `Term Structure Result:` - Shows the response from getTermStructureExam
     - `Exam Types Result:` - Shows the response from getExamTypes
     - `Setting exam types:` - Shows the data being set to state
     - `Exam Types State Updated:` - Shows the current state value

5. **Fallback Behavior:**
   - If "Exam Category" sheet doesn't exist or no rows with Category="EXAM" found:
     - System uses default types: End-Term, Mid-Term, Quiz
   - If "Exam Term" sheet doesn't exist, Batch/Term/Domain/Subject dropdowns will be empty

### Cascading Not Working

1. **Check Mappings:**
   - Ensure every combination of Term → Domain → Subject exists
   - Example: If "Term 2" has "Finance", make sure "Finance" has subjects

2. **Check Spelling:**
   - Term/Domain/Subject names must match exactly (case-sensitive)
   - "Term 1" ≠ "term 1"
   - "Marketing" ≠ "marketing"

---

## Example Use Case

**Scenario:** Adding a new subject "AI in Marketing" for Term 3

**Steps:**

1. Open Google Sheet
2. Go to "Exam Term" sheet
3. Add row:
   ```
   | Batch      | Term   | Domain    | Subject            |
   | 2024-2026  | Term 3 | Marketing | AI in Marketing    |
   ```
4. Save
5. Refresh exam creation page
6. Select Term 3 → Marketing → "AI in Marketing" will appear!

---

## Notes

- Sheet must exist in the same Google Sheet as Exams_Master
- Data is cached in the backend for performance
- API calls are made once when the form loads
- Changes to sheet reflect on next page refresh
- No need to redeploy backend code when updating data

---

## Support

For issues or questions about the Exam Term sheet setup:
1. Verify sheet ID matches: `1XlUlGT-smpkzL1uq-15BwyCVS7xG1FMehQJclP6Ff14`
2. Check column names are exact matches
3. Ensure no duplicate entries
4. Clear browser cache if changes don't appear

---

**Last Updated:** 2025-01-05
**Version:** 1.0
