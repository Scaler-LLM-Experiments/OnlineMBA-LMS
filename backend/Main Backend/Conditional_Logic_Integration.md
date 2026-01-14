# Conditional Logic Backend Integration Guide

## Step 1: Add Column Headers to Form_Conditional_Logic Sheet

In Google Sheets (https://docs.google.com/spreadsheets/d/1K5DrHxTVignwR4841sYyzziLDNq-rw2lrlDNJWk_Ddk), create a new sheet called **Form_Conditional_Logic** with these column headers:

| Column | Header |
|--------|--------|
| A | Rule_ID |
| B | Question_ID |
| C | Form_ID |
| D | Target_Question_Index |
| E | Operator |
| F | Value |
| G | Action |
| H | Rule_Order |
| I | Created_At |
| J | Notes |

---

## Step 2: Add Conditional Logic Functions to Code.js

Copy all functions from `Conditional_Logic_Functions.js` and paste them into `Code.js` at **line 9267** (right after the `deleteOption` function ends and before the `// ==================== RESPONSE ANALYTICS` section).

The functions to add are:
- `createConditionalRules(questionId, formId, rules)`
- `getConditionalRules(questionId)`
- `updateConditionalRules(questionId, formId, rules)`
- `deleteConditionalRules(questionId)`

---

## Step 3: Modify createQuestion Function (Line 8821)

**Find this code at the END of the createQuestion function (around line 8898):**

```javascript
    questionSheet.appendRow(row);

    Logger.log(`✅ Question created: ${questionId} with type ${questionData.questionType}`);

    return {
      success: true,
      questionId: questionId
    };
```

**Replace with:**

```javascript
    questionSheet.appendRow(row);

    Logger.log(`✅ Question created: ${questionId} with type ${questionData.questionType}`);

    // Create conditional logic rules if provided
    if (questionData.conditionalRules && questionData.conditionalRules.length > 0) {
      Logger.log(`🔀 Creating conditional rules for question: ${questionId}`);
      createConditionalRules(questionId, questionData.formId, questionData.conditionalRules);
    }

    return {
      success: true,
      questionId: questionId
    };
```

---

## Step 4: Modify updateQuestion Function (Line 8920)

**Find this code at the END of the updateQuestion function (around line 9117):**

```javascript
    // Update timestamp
    questionSheet.getRange(rowIndex, 27).setValue(timestamp); // AA - Updated_At

    Logger.log(`✅ Question updated: ${questionId}`);

    return { success: true };
```

**Replace with:**

```javascript
    // Update timestamp
    questionSheet.getRange(rowIndex, 27).setValue(timestamp); // AA - Updated_At

    // Update conditional logic rules if provided
    if (questionData.conditionalRules !== undefined) {
      Logger.log(`🔀 Updating conditional rules for question: ${questionId}`);
      // Get formId from the question row
      const formId = data[rowIndex - 1][1]; // Column B
      updateConditionalRules(questionId, formId, questionData.conditionalRules);
    }

    Logger.log(`✅ Question updated: ${questionId}`);

    return { success: true };
```

---

## Step 5: Modify deleteQuestion Function (Line 9135)

**Find this code in the deleteQuestion function (around line 9162):**

```javascript
    // Delete row
    questionSheet.deleteRow(rowIndex);

    // Also delete associated options
    const optionSheet = spreadsheet.getSheetByName(FORMS_API_CONFIG.SHEETS.OPTIONS);
    const optionData = optionSheet.getDataRange().getValues();

    for (let i = optionData.length - 1; i >= 1; i--) {
      if (optionData[i][1] === questionId) { // Question_ID column
        optionSheet.deleteRow(i + 1);
      }
    }

    Logger.log(`✅ Question deleted: ${questionId}`);

    return { success: true };
```

**Replace with:**

```javascript
    // Delete row
    questionSheet.deleteRow(rowIndex);

    // Also delete associated options
    const optionSheet = spreadsheet.getSheetByName(FORMS_API_CONFIG.SHEETS.OPTIONS);
    const optionData = optionSheet.getDataRange().getValues();

    for (let i = optionData.length - 1; i >= 1; i--) {
      if (optionData[i][1] === questionId) { // Question_ID column
        optionSheet.deleteRow(i + 1);
      }
    }

    // Delete associated conditional logic rules
    deleteConditionalRules(questionId);

    Logger.log(`✅ Question deleted: ${questionId}`);

    return { success: true };
```

---

## Step 6: Modify getFormById Function (around Line 8200)

**Find the section where questions are being built (around line 8240):**

Look for code that builds the question object with options. It will look something like:

```javascript
        questions.push({
          id: row[0],
          formId: row[1],
          order: row[2],
          type: row[3],
          text: row[4],
          // ... more fields ...
          options: questionOptions
        });
```

**Add this line AFTER the options are added:**

```javascript
        // Get conditional logic rules
        const rulesResult = getConditionalRules(row[0]); // row[0] is Question_ID
        const conditionalRules = rulesResult.success ? rulesResult.data.map(r => ({
          questionIndex: r.questionIndex,
          operator: r.operator,
          value: r.value
        })) : [];

        questions.push({
          id: row[0],
          formId: row[1],
          order: row[2],
          type: row[3],
          text: row[4],
          // ... more fields ...
          options: questionOptions,
          conditionalRules: conditionalRules,  // ADD THIS
          hasConditionalLogic: conditionalRules.length > 0  // ADD THIS
        });
```

---

## Step 7: Update formsApi.ts (Frontend)

The frontend createQuestion and updateQuestion functions in `/src/services/formsApi.ts` already use the spread operator (`...questionData`), so they will automatically pass the `conditionalRules` field to the backend. No changes needed!

---

## Testing Checklist

After making all changes:

1. ✅ Create Form_Conditional_Logic sheet with column headers
2. ✅ Add 4 conditional logic functions to Code.js
3. ✅ Modify createQuestion to save conditional rules
4. ✅ Modify updateQuestion to update conditional rules
5. ✅ Modify deleteQuestion to delete conditional rules
6. ✅ Modify getFormById to retrieve conditional rules
7. ✅ Deploy to Google Apps Script: `clasp push --force`
8. ✅ Test creating a form with conditional logic
9. ✅ Test editing conditional logic rules
10. ✅ Test deleting questions with conditional logic

---

## Summary

This integration adds full backend support for conditional logic rules. When you:
- **Create a question** with `hasConditionalLogic: true` and `conditionalRules: [{questionIndex, operator, value}]`, the rules are saved to Form_Conditional_Logic sheet
- **Update a question**, the rules are deleted and recreated
- **Delete a question**, associated rules are automatically deleted
- **Get a form**, conditional rules are loaded and attached to questions

The frontend already has full UI support, so once the backend is updated, conditional logic will be fully functional!
