// ==================== CONDITIONAL LOGIC CRUD ====================
// INSERT THESE FUNCTIONS INTO Code.js AFTER LINE 9266 (after deleteOption function)
// BEFORE THE "// ==================== RESPONSE ANALYTICS ====================" SECTION

/**
 * Create conditional logic rules for a question
 * @param {string} questionId - Question ID
 * @param {string} formId - Form ID
 * @param {Array} rules - Array of conditional rules [{questionIndex, operator, value}]
 * @returns {Object} {success}
 */
function createConditionalRules(questionId, formId, rules) {
  try {
    if (!rules || rules.length === 0) {
      return { success: true }; // No rules to create
    }

    Logger.log(`🔀 Creating ${rules.length} conditional rules for question: ${questionId}`);

    const spreadsheet = SpreadsheetApp.openById(FORMS_API_CONFIG.SHEET_ID);
    const logicSheet = spreadsheet.getSheetByName(FORMS_API_CONFIG.SHEETS.CONDITIONAL_LOGIC);

    const timestamp = formatFormsTimestamp();

    for (let i = 0; i < rules.length; i++) {
      const rule = rules[i];
      const ruleId = generateFormsId('RULE');

      const row = [
        ruleId,                                   // A - Rule_ID
        questionId,                               // B - Question_ID
        formId,                                   // C - Form_ID
        rule.questionIndex,                       // D - Target_Question_Index
        rule.operator || 'equals',                // E - Operator
        rule.value || '',                         // F - Value
        'show',                                   // G - Action (show/hide)
        i + 1,                                    // H - Rule_Order
        timestamp,                                // I - Created_At
        ''                                        // J - Notes
      ];

      logicSheet.appendRow(row);
    }

    Logger.log(`✅ Created ${rules.length} conditional rules`);

    return { success: true };

  } catch (error) {
    Logger.log(`❌ Error creating conditional rules: ${error.message}`);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Get conditional logic rules for a question
 * @param {string} questionId - Question ID
 * @returns {Object} {success, data: [rules]}
 */
function getConditionalRules(questionId) {
  try {
    const spreadsheet = SpreadsheetApp.openById(FORMS_API_CONFIG.SHEET_ID);
    const logicSheet = spreadsheet.getSheetByName(FORMS_API_CONFIG.SHEETS.CONDITIONAL_LOGIC);

    const data = logicSheet.getDataRange().getValues();
    const rules = [];

    for (let i = 1; i < data.length; i++) {
      const row = data[i];

      if (row[1] === questionId) { // Question_ID column
        rules.push({
          ruleId: row[0],
          questionId: row[1],
          formId: row[2],
          questionIndex: row[3],
          operator: row[4],
          value: row[5],
          action: row[6],
          order: row[7],
          createdAt: row[8],
          notes: row[9]
        });
      }
    }

    // Sort by order
    rules.sort((a, b) => a.order - b.order);

    return {
      success: true,
      data: rules
    };

  } catch (error) {
    Logger.log(`❌ Error getting conditional rules: ${error.message}`);
    return {
      success: false,
      error: error.message,
      data: []
    };
  }
}

/**
 * Update conditional logic rules for a question
 * Deletes existing rules and creates new ones
 * @param {string} questionId - Question ID
 * @param {string} formId - Form ID
 * @param {Array} rules - New array of conditional rules
 * @returns {Object} {success}
 */
function updateConditionalRules(questionId, formId, rules) {
  try {
    Logger.log(`🔀 Updating conditional rules for question: ${questionId}`);

    // Delete existing rules
    const deleteResult = deleteConditionalRules(questionId);
    if (!deleteResult.success) {
      return deleteResult;
    }

    // Create new rules
    const createResult = createConditionalRules(questionId, formId, rules);
    return createResult;

  } catch (error) {
    Logger.log(`❌ Error updating conditional rules: ${error.message}`);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Delete all conditional logic rules for a question
 * @param {string} questionId - Question ID
 * @returns {Object} {success}
 */
function deleteConditionalRules(questionId) {
  try {
    Logger.log(`🗑️ Deleting conditional rules for question: ${questionId}`);

    const spreadsheet = SpreadsheetApp.openById(FORMS_API_CONFIG.SHEET_ID);
    const logicSheet = spreadsheet.getSheetByName(FORMS_API_CONFIG.SHEETS.CONDITIONAL_LOGIC);

    const data = logicSheet.getDataRange().getValues();

    // Delete rows in reverse order to avoid index shifting
    for (let i = data.length - 1; i >= 1; i--) {
      if (data[i][1] === questionId) { // Question_ID column
        logicSheet.deleteRow(i + 1);
      }
    }

    Logger.log(`✅ Deleted conditional rules for question: ${questionId}`);

    return { success: true };

  } catch (error) {
    Logger.log(`❌ Error deleting conditional rules: ${error.message}`);
    return {
      success: false,
      error: error.message
    };
  }
}
