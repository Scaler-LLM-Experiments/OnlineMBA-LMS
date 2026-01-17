/**
 * CENTRALIZED CONFIGURATION
 * ========================
 * Update these values when changing Google Sheet or Drive folder
 * All other files will reference this config
 */

const GLOBAL_CONFIG = {
  // ============================================
  // GOOGLE SHEET ID
  // ============================================
  // Get from URL: https://docs.google.com/spreadsheets/d/SHEET_ID/edit
  SHEET_ID: "1b5MrRFysC3zf8ftsGJcjhUEjh5P3Q20fYAconTBm824",

  // ============================================
  // GOOGLE DRIVE FOLDER ID
  // ============================================
  // Get from URL: https://drive.google.com/drive/folders/FOLDER_ID
  MAIN_DRIVE_FOLDER_ID: "18u-3233E10NZRB7PhMiWYAbNkzCLlBRD",

  // ============================================
  // TIMEZONE
  // ============================================
  TIMEZONE: "Asia/Kolkata"
};

/**
 * Helper function to get Sheet ID
 * @returns {string} Google Sheet ID
 */
function getGlobalSheetId() {
  return GLOBAL_CONFIG.SHEET_ID;
}

/**
 * Helper function to get Drive Folder ID
 * @returns {string} Google Drive Folder ID
 */
function getGlobalDriveFolderId() {
  return GLOBAL_CONFIG.MAIN_DRIVE_FOLDER_ID;
}

/**
 * Helper function to get Timezone
 * @returns {string} Timezone
 */
function getGlobalTimezone() {
  return GLOBAL_CONFIG.TIMEZONE;
}
