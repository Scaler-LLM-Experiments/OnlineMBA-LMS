/**
 * SSB Sessions Management System - Backend Zoom
 * Complete Zoom + Google Calendar Integration
 * Handles: Meeting creation, recording sync, Google Drive downloads
 */

// ==================== CONFIGURATION ====================

const CONFIG = {
  // Google Sheets Configuration
  SHEET_ID: "1b5MrRFysC3zf8ftsGJcjhUEjh5P3Q20fYAconTBm824",

  SHEETS: {
    CREATE_ZOOM: "Create Zoom + Google Calendar",
    ZOOM_LIVE: "Zoom Live",
    ZOOM_RECORDING: "Zoom Recordings",
    STUDENT_DATA: "Student Data",
    ZOOM_LOGIN: "Zoom Login",
    ZOOM_LOG: "Zoom LOG"
  },

  // Zoom API Configuration (Server-to-Server OAuth)
  ZOOM: {
    ACCOUNT_ID: "XOzfPngYTv2BfV822nKjhw",
    CLIENT_ID: "xS5gKNgfQFGBrCgsDQCTNg",
    CLIENT_SECRET: "JJ1lBN7LEcTRs8YK2Q7R2KqeJASOeulT",
    SDK_KEY: "hW7JTiE9TYewkWQ9DdQ4w",
    SDK_SECRET: "iv628tejlub254TUjj1nAglYSfHu3ddi"
  },

  // Google Drive Configuration
  DRIVE: {
    MAIN_FOLDER_ID: "18u-3233E10NZRB7PhMiWYAbNkzCLlBRD",
    MAIN_FOLDER_NAME: "SSB Zoom Recordings"
  },

  // Timezone
  TIMEZONE: "Asia/Kolkata",

  // Status values
  STATUS: {
    CREATED: "Created",
    SCHEDULED: "Scheduled",
    LIVE: "Live",
    COMPLETED: "Completed",
    CANCELLED: "Cancelled"
  },

  // Column Indexes for "Create Zoom + Google Calendar" Sheet
  CREATE_COLS: {
    CHECK_BOX: 0,                    // Column A
    BATCH: 1,                        // Column B
    TERM: 2,                         // Column C
    DOMAIN: 3,                       // Column D
    SUBJECT: 4,                      // Column E
    SESSION_NAME: 5,                 // Column F
    DATE: 6,                         // Column G
    START_TIME: 7,                   // Column H (was I)
    DURATION: 8,                     // Column I (was K)
    ZOOM_LIVE_LINK: 9,              // Column J (was L)
    MEETING_ID: 10,                  // Column K (was M)
    MEETING_PASSWORD: 11,            // Column L (was N)
    CALENDAR_EVENT_ID: 12,           // Column M (was O)
    CALENDAR_EVENT_LINK: 13,         // Column N (was P)
    INSTRUCTOR: 14,                  // Column O (was Q)
    PARTICIPANTS_COUNT: 15,          // Column P (was R)
    STATUS: 16,                      // Column Q (was S)
    EDIT_CHECK_BOX: 17,              // Column R (was T)
    SESSION_NAME_NEW: 18,            // Column S (was U)
    DATE_NEW: 19,                    // Column T (was V)
    DAY_NEW: 20,                     // Column U (was W)
    START_TIME_NEW: 21,              // Column V (was X)
    END_TIME_NEW: 22,                // Column W (was Y)
    DURATION_NEW: 23,                // Column X (was Z)
    NEW_STATUS: 24,                  // Column Y (was AA)
    CANCELLED: 25,                   // Column Z (was AB)
    CANCELLATION_REASON: 26          // Column AA (was AC)
  },

  // Column Indexes for "Zoom Live" Sheet (12 columns total)
  LIVE_COLS: {
    BATCH: 0,
    TERM: 1,
    DOMAIN: 2,
    SUBJECT: 3,
    SESSION_NAME: 4,
    DATE: 5,
    START_TIME: 6,
    DURATION: 7,
    ZOOM_LIVE_LINK: 8,
    MEETING_ID: 9,
    MEETING_PASSWORD: 10,
    FULL_SYNCED: 11  // Column L - Marks if all recordings fully synced to Drive & sheet
  },

  // Column Indexes for "Zoom Recording" Sheet (All 120+ columns)
  RECORDING_COLS: {
    BATCH: 0,
    TERM: 1,
    DOMAIN: 2,
    SUBJECT: 3,
    SESSION_NAME: 4,
    DATE: 5,
    MEETING_ID: 6,
    MEETING_UUID: 7,
    MEETING_PASSWORD: 8,
    DRIVE_SYNC: 9,
    DRIVE_FOLDER_LINK: 10,

    // Speaker View (11-16)
    SPEAKER_VIEW_PLAY_URL: 11,
    SPEAKER_VIEW_DOWNLOAD_URL: 12,
    SPEAKER_VIEW_DRIVE_URL: 13,
    SPEAKER_VIEW_FILE_SIZE: 14,
    SPEAKER_VIEW_START: 15,
    SPEAKER_VIEW_END: 16,

    // Gallery View (17-22)
    GALLERY_VIEW_PLAY_URL: 17,
    GALLERY_VIEW_DOWNLOAD_URL: 18,
    GALLERY_VIEW_DRIVE_URL: 19,
    GALLERY_VIEW_FILE_SIZE: 20,
    GALLERY_VIEW_START: 21,
    GALLERY_VIEW_END: 22,

    // Screen Share Speaker (23-28)
    SCREEN_SHARE_SPEAKER_PLAY_URL: 23,
    SCREEN_SHARE_SPEAKER_DOWNLOAD_URL: 24,
    SCREEN_SHARE_SPEAKER_DRIVE_URL: 25,
    SCREEN_SHARE_SPEAKER_FILE_SIZE: 26,
    SCREEN_SHARE_SPEAKER_START: 27,
    SCREEN_SHARE_SPEAKER_END: 28,

    // Screen Share Speaker CC (29-34)
    SCREEN_SHARE_SPEAKER_CC_PLAY_URL: 29,
    SCREEN_SHARE_SPEAKER_CC_DOWNLOAD_URL: 30,
    SCREEN_SHARE_SPEAKER_CC_DRIVE_URL: 31,
    SCREEN_SHARE_SPEAKER_CC_FILE_SIZE: 32,
    SCREEN_SHARE_SPEAKER_CC_START: 33,
    SCREEN_SHARE_SPEAKER_CC_END: 34,

    // Screen Share Gallery (35-40)
    SCREEN_SHARE_GALLERY_PLAY_URL: 35,
    SCREEN_SHARE_GALLERY_DOWNLOAD_URL: 36,
    SCREEN_SHARE_GALLERY_DRIVE_URL: 37,
    SCREEN_SHARE_GALLERY_FILE_SIZE: 38,
    SCREEN_SHARE_GALLERY_START: 39,
    SCREEN_SHARE_GALLERY_END: 40,

    // Screen Share Only (41-46)
    SCREEN_SHARE_ONLY_PLAY_URL: 41,
    SCREEN_SHARE_ONLY_DOWNLOAD_URL: 42,
    SCREEN_SHARE_ONLY_DRIVE_URL: 43,
    SCREEN_SHARE_ONLY_FILE_SIZE: 44,
    SCREEN_SHARE_ONLY_START: 45,
    SCREEN_SHARE_ONLY_END: 46,

    // Active Speaker (47-52)
    ACTIVE_SPEAKER_PLAY_URL: 47,
    ACTIVE_SPEAKER_DOWNLOAD_URL: 48,
    ACTIVE_SPEAKER_DRIVE_URL: 49,
    ACTIVE_SPEAKER_FILE_SIZE: 50,
    ACTIVE_SPEAKER_START: 51,
    ACTIVE_SPEAKER_END: 52,

    // Audio Only (53-58)
    AUDIO_ONLY_PLAY_URL: 53,
    AUDIO_ONLY_DOWNLOAD_URL: 54,
    AUDIO_ONLY_DRIVE_URL: 55,
    AUDIO_ONLY_FILE_SIZE: 56,
    AUDIO_ONLY_START: 57,
    AUDIO_ONLY_END: 58,

    // Transcript (59-61)
    TRANSCRIPT_DOWNLOAD_URL: 59,
    TRANSCRIPT_DRIVE_URL: 60,
    TRANSCRIPT_FILE_SIZE: 61,

    // Closed Captions (62-64)
    CLOSED_CAPTIONS_DOWNLOAD_URL: 62,
    CLOSED_CAPTIONS_DRIVE_URL: 63,
    CLOSED_CAPTIONS_FILE_SIZE: 64,

    // Chat (65-68)
    CHAT_DOWNLOAD_URL: 65,
    CHAT_DRIVE_URL: 66,
    CHAT_FILE_SIZE: 67,
    CHAT_MESSAGE_COUNT: 68,

    // Timeline (69-71)
    TIMELINE_DOWNLOAD_URL: 69,
    TIMELINE_DRIVE_URL: 70,
    TIMELINE_FILE_SIZE: 71,

    // Whiteboards (72-84)
    WHITEBOARD_COUNT: 72,
    WHITEBOARD_1_NAME: 73,
    WHITEBOARD_1_ZOOM_URL: 74,
    WHITEBOARD_1_DRIVE_URL: 75,
    WHITEBOARD_1_FILE_SIZE: 76,
    WHITEBOARD_2_NAME: 77,
    WHITEBOARD_2_ZOOM_URL: 78,
    WHITEBOARD_2_DRIVE_URL: 79,
    WHITEBOARD_2_FILE_SIZE: 80,
    WHITEBOARD_3_NAME: 81,
    WHITEBOARD_3_ZOOM_URL: 82,
    WHITEBOARD_3_DRIVE_URL: 83,
    WHITEBOARD_3_FILE_SIZE: 84,
    ADDITIONAL_WHITEBOARDS: 85,

    // Poll Results (86-89)
    POLL_RESULTS_DRIVE_URL: 86,
    POLL_RESULTS_FILE_SIZE: 87,
    POLL_COUNT: 88,
    TOTAL_POLL_RESPONSES: 89,

    // Participant List (90-94)
    PARTICIPANT_LIST_DRIVE_URL: 90,
    PARTICIPANT_LIST_FILE_SIZE: 91,
    TOTAL_PARTICIPANTS: 92,
    UNIQUE_PARTICIPANTS: 93,
    AVERAGE_DURATION: 94,
    TOTAL_JOIN_COUNT: 95,

    // Q&A (96-98)
    QA_DRIVE_URL: 96,
    QA_FILE_SIZE: 97,
    QUESTION_COUNT: 98,
    ANSWER_COUNT: 99,

    // Meeting Metadata (100-104)
    MEETING_TOPIC: 100,
    MEETING_START_TIME: 101,
    MEETING_END_TIME: 102,
    MEETING_DURATION: 103,
    HOST_NAME: 104,
    HOST_EMAIL: 105,

    // File Size Summary (106-108)
    TOTAL_FILE_SIZE_BYTES: 106,
    TOTAL_FILE_SIZE_MB: 107,
    TOTAL_FILE_SIZE_GB: 108,

    // Folder Structure (109-114)
    DRIVE_FOLDER_URL: 109,
    FOLDER_PATH: 110,
    VIDEOS_FOLDER_URL: 111,
    AUDIO_FOLDER_URL: 112,
    TRANSCRIPTS_FOLDER_URL: 113,
    CHAT_FOLDER_URL: 114,
    WHITEBOARDS_FOLDER_URL: 115,
    POLLS_FOLDER_URL: 116,

    // Status & Tracking (117-127)
    RECORDING_STATUS: 117,
    PROCESSING_STATUS: 118,
    DOWNLOAD_STATUS: 119,
    DOWNLOAD_STARTED: 120,
    DOWNLOAD_COMPLETED: 121,
    PROCESSING_TIME: 122,
    ERROR_MESSAGE: 123,
    RETRY_COUNT: 124,
    LAST_UPDATED: 125,
    NOTES: 126
  }
};

// ==================== UTILITY FUNCTIONS ====================

function getSpreadsheet() {
  return SpreadsheetApp.openById(CONFIG.SHEET_ID);
}

function getSheet(sheetName) {
  return getSpreadsheet().getSheetByName(sheetName);
}

function getCurrentTimestamp() {
  return new Date();
}

function formatDate(date, format = "yyyy-MM-dd") {
  if (!date) return '';
  return Utilities.formatDate(new Date(date), CONFIG.TIMEZONE, format);
}

function formatTime(date, format = "HH:mm") {
  if (!date) return '';
  return Utilities.formatDate(new Date(date), CONFIG.TIMEZONE, format);
}

// OLD FUNCTION - DO NOT USE (kept for reference)
function parseDateTimeOLD(dateStr, timeStr) {
  return new Date(); // stub
}

// NEW WORKING VERSION - Nov 5 2025 - Renamed to avoid conflict with Code.js parseDateTime
function parseZoomDateTime(dateStr, timeStr) {
  try {
    logInfo('=== parseDateTime WORKING v4.0 - Nov 2 2025 ===');
    logInfo('Input timeStr: ' + timeStr + ' (type: ' + typeof timeStr + ')');
    let date;

    // Parse date
    if (dateStr instanceof Date) {
      date = new Date(dateStr);
    } else if (typeof dateStr === 'string') {
      // Format: "01-Nov-2025" or "dd-MMM-yyyy"
      const ddMmmYyyy = dateStr.match(/(\d{1,2})-([A-Za-z]{3})-(\d{4})/);
      if (ddMmmYyyy) {
        const day = parseInt(ddMmmYyyy[1]);
        const monthStr = ddMmmYyyy[2];
        const year = parseInt(ddMmmYyyy[3]);

        const monthMap = {
          'jan': 0, 'feb': 1, 'mar': 2, 'apr': 3, 'may': 4, 'jun': 5,
          'jul': 6, 'aug': 7, 'sep': 8, 'oct': 9, 'nov': 10, 'dec': 11
        };

        const month = monthMap[monthStr.toLowerCase()];
        date = new Date(year, month, day);
      } else {
        date = new Date(dateStr);
      }
    } else {
      date = new Date();
    }

    // Handle time - can be string or decimal from Google Sheets
    if (typeof timeStr === 'number') {
      // Google Sheets stores time as decimal (e.g., 0.9028 = 21:40)
      const totalMinutes = Math.round(timeStr * 24 * 60);
      const hours = Math.floor(totalMinutes / 60);
      const minutes = totalMinutes % 60;
      date.setHours(hours, minutes, 0, 0);
      logInfo('Parsed time from DECIMAL: ' + timeStr + ' -> ' + hours + ':' + minutes);
    } else if (typeof timeStr === 'string') {
      // Try to match time pattern with optional AM/PM
      const timeParts = timeStr.match(/(\d+):(\d+)\s*(AM|PM)?/i);
      if (timeParts) {
        let hours = parseInt(timeParts[1]);
        const minutes = parseInt(timeParts[2]);
        const meridiem = timeParts[3];

        logInfo('Matched time parts: hours=' + hours + ', minutes=' + minutes + ', meridiem=' + meridiem);

        if (meridiem) {
          const meridiemUpper = meridiem.toUpperCase();
          if (meridiemUpper === 'PM' && hours !== 12) {
            hours += 12;
          } else if (meridiemUpper === 'AM' && hours === 12) {
            hours = 0;
          }
        }

        date.setHours(hours, minutes, 0, 0);
        logInfo('Parsed time from STRING: "' + timeStr + '" -> ' + hours + ':' + minutes);
      } else {
        logWarning('Could not parse time string: ' + timeStr);
      }
    } else if (timeStr instanceof Date) {
      date.setHours(timeStr.getHours(), timeStr.getMinutes(), 0, 0);
      logInfo('Parsed time from DATE object: ' + timeStr.getHours() + ':' + timeStr.getMinutes());
    }

    logInfo('Final parsed datetime: ' + date.toString());
    return date;
  } catch (error) {
    logError('Error parsing date/time', error);
    return new Date();
  }
}

function calculateDuration(startTime, endTime) {
  const diffMs = endTime - startTime;
  const minutes = Math.floor(diffMs / (1000 * 60));
  return minutes;
}

function getOrCreateFolderZoom(parent, name) {
  try {
    const folders = parent.getFoldersByName(name);
    if (folders.hasNext()) {
      return folders.next();
    }
    logInfo(`Creating new folder: ${name}`);
    return parent.createFolder(name);
  } catch (error) {
    logError(`Error creating folder: ${name}`, error);
    throw error;
  }
}

function logInfo(message, data = null) {
  const timestamp = Utilities.formatDate(new Date(), CONFIG.TIMEZONE, "yyyy-MM-dd HH:mm:ss");
  console.log(`[${timestamp}] INFO: ${message}`);
  if (data) console.log(data);
}

function logError(message, error = null) {
  const timestamp = Utilities.formatDate(new Date(), CONFIG.TIMEZONE, "yyyy-MM-dd HH:mm:ss");
  console.error(`[${timestamp}] ERROR: ${message}`);
  if (error) console.error(error);
}

function logWarning(message, data = null) {
  const timestamp = Utilities.formatDate(new Date(), CONFIG.TIMEZONE, "yyyy-MM-dd HH:mm:ss");
  console.warn(`[${timestamp}] WARNING: ${message}`);
  if (data) console.warn(data);
}

// ==================== EMAIL VERIFICATION & LOGGING ====================

/**
 * Check if email exists in Zoom Login sheet
 * @param {string} email - Email address to check
 * @returns {boolean} - True if email exists in Zoom Login sheet
 */
function checkEmailInZoomLogin(email) {
  try {
    if (!email) {
      logWarning('checkEmailInZoomLogin: No email provided');
      return false;
    }

    const loginSheet = getSheet(CONFIG.SHEETS.ZOOM_LOGIN);
    if (!loginSheet) {
      logError('Zoom Login sheet not found');
      return false;
    }

    const data = loginSheet.getDataRange().getValues();

    // Skip header row (index 0), check from row 1 onwards
    for (let i = 1; i < data.length; i++) {
      const rowEmail = data[i][0]; // Column A
      if (rowEmail && rowEmail.toString().toLowerCase() === email.toLowerCase()) {
        logInfo(`Email verified: ${email} found in Zoom Login sheet`);
        return true;
      }
    }

    logWarning(`Email not found in Zoom Login sheet: ${email}`);
    return false;

  } catch (error) {
    logError('Error checking email in Zoom Login sheet', error);
    return false;
  }
}

/**
 * Log attendance to Zoom LOG sheet
 * @param {string} email - Email address of attendee
 * @param {string} sessionTitle - Session/meeting title
 * @param {Date} timestamp - Timestamp of join (optional, defaults to now)
 */
function logAttendanceToZoomLog(email, sessionTitle, timestamp = null) {
  try {
    if (!email || !sessionTitle) {
      logWarning('logAttendanceToZoomLog: Missing email or session title');
      return false;
    }

    const logSheet = getSheet(CONFIG.SHEETS.ZOOM_LOG);
    if (!logSheet) {
      logError('Zoom LOG sheet not found');
      return false;
    }

    // Use provided timestamp or current time
    const logTimestamp = timestamp || new Date();
    const formattedTimestamp = Utilities.formatDate(
      logTimestamp,
      CONFIG.TIMEZONE,
      "yyyy-MM-dd HH:mm:ss"
    );

    // Append row: Email Address, Session, Timestamp
    const logRow = [email, sessionTitle, formattedTimestamp];
    logSheet.appendRow(logRow);

    logInfo(`Logged attendance: ${email} joined "${sessionTitle}" at ${formattedTimestamp}`);
    return true;

  } catch (error) {
    logError('Error logging attendance to Zoom LOG', error);
    return false;
  }
}

// ==================== ZOOM API FUNCTIONS ====================

/**
 * Get Zoom OAuth Access Token (Server-to-Server OAuth)
 */
function getZoomAccessToken() {
  try {
    const tokenUrl = 'https://zoom.us/oauth/token?grant_type=account_credentials&account_id=' + CONFIG.ZOOM.ACCOUNT_ID;

    const credentials = Utilities.base64Encode(CONFIG.ZOOM.CLIENT_ID + ':' + CONFIG.ZOOM.CLIENT_SECRET);

    const options = {
      method: 'post',
      headers: {
        'Authorization': 'Basic ' + credentials,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      muteHttpExceptions: true
    };

    const response = UrlFetchApp.fetch(tokenUrl, options);
    const result = JSON.parse(response.getContentText());

    if (result.access_token) {
      logInfo('Zoom access token obtained successfully');
      return result.access_token;
    } else {
      throw new Error('Failed to get access token: ' + JSON.stringify(result));
    }
  } catch (error) {
    logError('Error getting Zoom access token', error);
    throw error;
  }
}

/**
 * Create Zoom Meeting
 */
function createZoomMeeting(sessionData) {
  try {
    const accessToken = getZoomAccessToken();

    logInfo(`Creating meeting for: ${sessionData.sessionName}`);
    logInfo(`Input date: ${sessionData.date}, Input time: ${sessionData.startTime}`);

    const startDateTime = parseZoomDateTime(sessionData.date, sessionData.startTime);
    logInfo(`Parsed datetime object: ${startDateTime}`);

    // Duration is now required (no End Time to calculate from)
    if (!sessionData.duration) {
      throw new Error('Duration is required');
    }
    const duration = parseInt(sessionData.duration);
    logInfo(`Duration: ${duration} minutes`);

    // Format start time for Zoom API (ISO 8601)
    const zoomStartTime = Utilities.formatDate(
      startDateTime,
      CONFIG.TIMEZONE,
      "yyyy-MM-dd'T'HH:mm:ss"
    );
    logInfo(`Zoom start time (ISO): ${zoomStartTime}`);

    const meetingData = {
      topic: `${sessionData.batch} - ${sessionData.subject} x ${sessionData.sessionName}`,
      type: 2, // Scheduled meeting
      start_time: zoomStartTime,
      duration: duration,
      timezone: 'Asia/Kolkata',
      agenda: `Batch: ${sessionData.batch}\nTerm: ${sessionData.term}\nDomain: ${sessionData.domain}\nSubject: ${sessionData.subject}\nSession: ${sessionData.sessionName}`,
      settings: {
        host_video: true,
        participant_video: true,
        join_before_host: true,
        mute_upon_entry: true,
        waiting_room: false,
        audio: 'both',
        auto_recording: 'cloud' // Enable cloud recording
        // No registration required - users can join directly with the link
      }
    };

    // Log the complete JSON payload being sent to Zoom
    logInfo('=== ZOOM API REQUEST ===');
    logInfo('JSON Payload being sent to Zoom:');
    logInfo(JSON.stringify(meetingData, null, 2));
    logInfo('========================');

    const url = 'https://api.zoom.us/v2/users/me/meetings';
    const options = {
      method: 'post',
      headers: {
        'Authorization': 'Bearer ' + accessToken,
        'Content-Type': 'application/json'
      },
      payload: JSON.stringify(meetingData),
      muteHttpExceptions: true
    };

    const response = UrlFetchApp.fetch(url, options);
    const responseText = response.getContentText();
    const meeting = JSON.parse(responseText);

    // Log the complete response from Zoom
    logInfo('=== ZOOM API RESPONSE ===');
    logInfo('Response Code: ' + response.getResponseCode());
    logInfo('Response Body:');
    logInfo(JSON.stringify(meeting, null, 2));
    logInfo('=========================');

    if (meeting.id) {
      logInfo(`Created Zoom meeting: ${meeting.id}`);
      return {
        meetingId: meeting.id.toString(),
        password: meeting.password,
        joinUrl: meeting.join_url,
        startUrl: meeting.start_url
      };
    } else {
      throw new Error('Failed to create meeting: ' + JSON.stringify(meeting));
    }
  } catch (error) {
    logError('Error creating Zoom meeting', error);
    throw error;
  }
}

/**
 * Update Zoom Meeting
 */
function updateZoomMeeting(meetingId, updates) {
  try {
    const accessToken = getZoomAccessToken();

    const url = `https://api.zoom.us/v2/meetings/${meetingId}`;
    const options = {
      method: 'patch',
      headers: {
        'Authorization': 'Bearer ' + accessToken,
        'Content-Type': 'application/json'
      },
      payload: JSON.stringify(updates),
      muteHttpExceptions: true
    };

    UrlFetchApp.fetch(url, options);
    logInfo(`Updated Zoom meeting: ${meetingId}`);
    return true;
  } catch (error) {
    logError(`Error updating Zoom meeting ${meetingId}`, error);
    return false;
  }
}

/**
 * Delete/Cancel Zoom Meeting
 */
function deleteZoomMeeting(meetingId) {
  try {
    const accessToken = getZoomAccessToken();

    const url = `https://api.zoom.us/v2/meetings/${meetingId}`;
    const options = {
      method: 'delete',
      headers: {
        'Authorization': 'Bearer ' + accessToken
      },
      muteHttpExceptions: true
    };

    UrlFetchApp.fetch(url, options);
    logInfo(`Deleted Zoom meeting: ${meetingId}`);
    return true;
  } catch (error) {
    logError(`Error deleting Zoom meeting ${meetingId}`, error);
    return false;
  }
}

/**
 * Fetch Meeting Participants and Log to Zoom LOG
 * Use this after meeting ends to get attendance data
 */
function fetchAndLogMeetingParticipants(meetingId, sessionTitle) {
  try {
    logInfo(`Fetching participants for meeting: ${meetingId}`);

    const accessToken = getZoomAccessToken();
    const url = `https://api.zoom.us/v2/report/meetings/${meetingId}/participants?page_size=300`;

    const options = {
      method: 'get',
      headers: {
        'Authorization': 'Bearer ' + accessToken,
        'Content-Type': 'application/json'
      },
      muteHttpExceptions: true
    };

    const response = UrlFetchApp.fetch(url, options);
    const responseCode = response.getResponseCode();

    if (responseCode !== 200) {
      logWarning(`Could not fetch participants for meeting ${meetingId}. Response code: ${responseCode}`);
      logWarning(`Response: ${response.getContentText()}`);
      return { success: false, error: 'Meeting not found or not ended yet', count: 0 };
    }

    const data = JSON.parse(response.getContentText());

    if (!data.participants || data.participants.length === 0) {
      logWarning(`No participants found for meeting ${meetingId}`);
      return { success: true, count: 0 };
    }

    // Get Zoom LOG sheet
    const logSheet = getSheet(CONFIG.SHEETS.ZOOM_LOG);
    if (!logSheet) {
      logError('Zoom LOG sheet not found');
      return { success: false, error: 'Zoom LOG sheet not found', count: 0 };
    }

    // Prepare batch data for logging
    const logRows = [];

    for (const participant of data.participants) {
      const email = participant.user_email || participant.email || 'N/A';
      const name = participant.name || 'N/A';
      const joinTime = participant.join_time ? new Date(participant.join_time) : null;
      const leaveTime = participant.leave_time ? new Date(participant.leave_time) : null;
      const durationSeconds = participant.duration || 0; // Duration from Zoom API is in seconds
      const durationMinutes = Math.round(durationSeconds / 60); // Convert to minutes

      const formattedJoinTime = joinTime ? Utilities.formatDate(joinTime, CONFIG.TIMEZONE, "yyyy-MM-dd HH:mm:ss") : 'N/A';
      const formattedLeaveTime = leaveTime ? Utilities.formatDate(leaveTime, CONFIG.TIMEZONE, "yyyy-MM-dd HH:mm:ss") : 'N/A';

      // Row format: Email | Name | Meeting ID | Session | Join Time | Leave Time | Duration (minutes)
      logRows.push([
        email,
        name,
        meetingId,
        sessionTitle || `Meeting ${meetingId}`,
        formattedJoinTime,
        formattedLeaveTime,
        durationMinutes
      ]);

      logInfo(`Participant: ${name} (${email}) - Duration: ${durationMinutes} minutes (${durationSeconds} seconds)`);
    }

    // Append all rows at once for better performance
    if (logRows.length > 0) {
      logSheet.getRange(logSheet.getLastRow() + 1, 1, logRows.length, 7).setValues(logRows);
      logInfo(`Successfully logged ${logRows.length} participants for meeting ${meetingId}`);
    }

    return {
      success: true,
      count: logRows.length,
      participants: data.participants
    };

  } catch (error) {
    logError(`Error fetching participants for meeting ${meetingId}`, error);
    return { success: false, error: error.toString(), count: 0 };
  }
}

/**
 * Bulk fetch participants for multiple meetings from Zoom Live sheet
 * This can be called after pulling recordings/transcripts
 */
function bulkFetchParticipantsFromLive() {
  try {
    const liveSheet = getSheet(CONFIG.SHEETS.ZOOM_LIVE);
    if (!liveSheet) {
      logError('Zoom Live sheet not found');
      return { success: false, error: 'Zoom Live sheet not found' };
    }

    const data = liveSheet.getDataRange().getValues();
    const results = {
      total: 0,
      success: 0,
      failed: 0,
      details: []
    };

    // Skip header row
    for (let i = 1; i < data.length; i++) {
      const meetingId = data[i][CONFIG.LIVE_COLS.MEETING_ID];
      const sessionTitle = data[i][CONFIG.LIVE_COLS.SESSION_NAME] || `Meeting ${meetingId}`;
      const status = data[i][CONFIG.LIVE_COLS.STATUS];

      // Only fetch for completed meetings
      if (meetingId && (status === CONFIG.STATUS.COMPLETED || status === 'Recorded')) {
        results.total++;

        logInfo(`Processing meeting ${results.total}: ${meetingId}`);
        const result = fetchAndLogMeetingParticipants(meetingId, sessionTitle);

        if (result.success) {
          results.success++;
          results.details.push({
            meetingId: meetingId,
            sessionTitle: sessionTitle,
            participantCount: result.count
          });
        } else {
          results.failed++;
          logWarning(`Failed to fetch participants for ${meetingId}: ${result.error}`);
        }

        // Add small delay to avoid rate limiting
        Utilities.sleep(500);
      }
    }

    logInfo(`Bulk fetch complete: ${results.success}/${results.total} successful`);
    return results;

  } catch (error) {
    logError('Error in bulk fetch participants', error);
    return { success: false, error: error.toString() };
  }
}

/**
 * Fetch Zoom Meeting Recordings from Zoom API
 */
function fetchZoomRecordingsFromAPI(meetingId) {
  try {
    logInfo(`Fetching recordings for meeting ID: ${meetingId}`);
    const accessToken = getZoomAccessToken();

    const url = `https://api.zoom.us/v2/meetings/${meetingId}/recordings`;
    const options = {
      method: 'get',
      headers: {
        'Authorization': 'Bearer ' + accessToken
      },
      muteHttpExceptions: true
    };

    const response = UrlFetchApp.fetch(url, options);
    const responseCode = response.getResponseCode();
    const responseText = response.getContentText();

    logInfo(`Zoom API Response Code: ${responseCode}`);
    logInfo(`Zoom API Response: ${responseText}`);

    if (responseCode === 404) {
      logWarning(`Meeting ${meetingId} not found or has no recordings yet (404)`);
      return null;
    }

    if (responseCode !== 200) {
      logError(`Zoom API error for meeting ${meetingId}: ${responseCode} - ${responseText}`);
      return null;
    }

    const recordings = JSON.parse(responseText);

    if (recordings.recording_files && recordings.recording_files.length > 0) {
      logInfo(`Found ${recordings.recording_files.length} recording files for meeting ${meetingId}`);
      return recordings;
    } else {
      logWarning(`No recording files found for meeting ${meetingId}. Response: ${JSON.stringify(recordings)}`);
      return null;
    }
  } catch (error) {
    logError(`Error getting recordings for meeting ${meetingId}`, error);
    return null;
  }
}

/**
 * Fetch participants for a Zoom meeting from the Zoom API
 * Endpoint: GET /report/meetings/{meetingId}/participants
 * Returns array of participant objects with details like name, email, join/leave times, duration
 */
function fetchZoomParticipantsFromAPI(meetingId) {
  try {
    logInfo(`Fetching participants for meeting ID: ${meetingId}`);
    const accessToken = getZoomAccessToken();

    const url = `https://api.zoom.us/v2/report/meetings/${meetingId}/participants`;
    const options = {
      method: 'get',
      headers: {
        'Authorization': 'Bearer ' + accessToken
      },
      muteHttpExceptions: true
    };

    const response = UrlFetchApp.fetch(url, options);
    const responseCode = response.getResponseCode();
    const responseText = response.getContentText();

    logInfo(`Zoom Participants API Response Code: ${responseCode}`);

    if (responseCode === 404) {
      logWarning(`Meeting ${meetingId} not found or has no participant data yet (404)`);
      return [];
    }

    if (responseCode !== 200) {
      logError(`Zoom API error for participants of meeting ${meetingId}: ${responseCode} - ${responseText}`);
      return [];
    }

    const data = JSON.parse(responseText);

    if (data.participants && data.participants.length > 0) {
      logInfo(`Found ${data.participants.length} participants for meeting ${meetingId}`);
      return data.participants;
    } else {
      logWarning(`No participants found for meeting ${meetingId}`);
      return [];
    }
  } catch (error) {
    logError(`Error getting participants for meeting ${meetingId}`, error);
    return [];
  }
}

// ==================== GOOGLE CALENDAR FUNCTIONS ====================

/**
 * Create Google Calendar Event
 */
function createCalendarEvent(sessionData, zoomJoinUrl) {
  try {
    logInfo('=== CREATING CALENDAR EVENT ===');
    logInfo('Input - Date: ' + sessionData.date);
    logInfo('Input - Start Time: ' + sessionData.startTime);
    logInfo('Input - Duration: ' + sessionData.duration + ' minutes');

    const startDateTime = parseZoomDateTime(sessionData.date, sessionData.startTime);
    logInfo('Parsed Start DateTime: ' + startDateTime.toString());

    // Calculate end time from start time + duration
    const endDateTime = new Date(startDateTime);
    endDateTime.setMinutes(endDateTime.getMinutes() + parseInt(sessionData.duration));
    logInfo('Calculated End DateTime: ' + endDateTime.toString());

    // Match Zoom topic format: Batch - Subject x Session Name
    const eventTitle = `${sessionData.batch} - ${sessionData.subject} x ${sessionData.sessionName}`;
    logInfo('Event Title: ' + eventTitle);

    // Description with password and link
    const description = `
Batch: ${sessionData.batch}
Term: ${sessionData.term}
Domain: ${sessionData.domain}
Subject: ${sessionData.subject}
Session: ${sessionData.sessionName}

🔗 Join Zoom Meeting:
${zoomJoinUrl}

📋 Meeting Details:
Meeting ID: ${sessionData.meetingId}
Password: ${sessionData.password}
    `.trim();

    const event = {
      summary: eventTitle,
      description: description,
      location: zoomJoinUrl, // Add Zoom link to location
      start: {
        dateTime: startDateTime.toISOString(),
        timeZone: CONFIG.TIMEZONE
      },
      end: {
        dateTime: endDateTime.toISOString(),
        timeZone: CONFIG.TIMEZONE
      },
      attendees: [
        { email: 'classops@ssb.scaler.com' }
      ],
      conferenceData: null, // Disable Google Meet
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'email', minutes: 24 * 60 },
          { method: 'popup', minutes: 30 },
          { method: 'popup', minutes: 10 }
        ]
      }
    };

    logInfo('Calendar Event Payload:');
    logInfo('  Start: ' + event.start.dateTime + ' (' + CONFIG.TIMEZONE + ')');
    logInfo('  End: ' + event.end.dateTime + ' (' + CONFIG.TIMEZONE + ')');
    logInfo('  Location: ' + event.location);

    const calendarId = 'primary';
    const createdEvent = Calendar.Events.insert(event, calendarId);

    logInfo(`Created Calendar event: ${createdEvent.id}`);
    logInfo(`Calendar event link: ${createdEvent.htmlLink}`);
    logInfo('================================');

    return {
      eventId: createdEvent.id,
      eventLink: createdEvent.htmlLink
    };
  } catch (error) {
    logError('Error creating Calendar event', error);
    throw error;
  }
}

/**
 * Update Google Calendar Event
 */
function updateCalendarEvent(eventId, updates) {
  try {
    const calendarId = 'primary';
    const event = Calendar.Events.get(calendarId, eventId);

    // Merge updates
    Object.assign(event, updates);

    Calendar.Events.update(event, calendarId, eventId);
    logInfo(`Updated Calendar event: ${eventId}`);
    return true;
  } catch (error) {
    logError(`Error updating Calendar event ${eventId}`, error);
    return false;
  }
}

/**
 * Delete Google Calendar Event
 */
function deleteCalendarEvent(eventId) {
  try {
    const calendarId = 'primary';
    Calendar.Events.remove(calendarId, eventId);
    logInfo(`Deleted Calendar event: ${eventId}`);
    return true;
  } catch (error) {
    logError(`Error deleting Calendar event ${eventId}`, error);
    return false;
  }
}

// ==================== SYNC ENGINE ====================

/**
 * Main sync function - triggered when checkbox is checked
 */
function syncCreateToLive() {
  const results = {
    processed: 0,
    created: 0,
    updated: 0,
    errors: []
  };

  try {
    logInfo('Starting Create → Live sync...');

    const createSheet = getSheet(CONFIG.SHEETS.CREATE_ZOOM);
    const liveSheet = getSheet(CONFIG.SHEETS.ZOOM_LIVE);

    const createData = createSheet.getDataRange().getValues();
    const liveData = liveSheet.getDataRange().getValues();

    // Build map of existing live sessions by Meeting ID
    const liveMap = new Map();
    for (let i = 1; i < liveData.length; i++) {
      const meetingId = liveData[i][CONFIG.LIVE_COLS.MEETING_ID];
      if (meetingId) {
        liveMap.set(meetingId.toString(), i + 1);
      }
    }

    // Process each checked row in Create sheet
    for (let i = 1; i < createData.length; i++) {
      const row = createData[i];
      const rowIndex = i + 1;

      const isChecked = row[CONFIG.CREATE_COLS.CHECK_BOX];
      if (!isChecked) continue;

      results.processed++;

      try {
        // Extract session data
        const sessionData = {
          batch: row[CONFIG.CREATE_COLS.BATCH],
          term: row[CONFIG.CREATE_COLS.TERM],
          domain: row[CONFIG.CREATE_COLS.DOMAIN],
          subject: row[CONFIG.CREATE_COLS.SUBJECT],
          sessionName: row[CONFIG.CREATE_COLS.SESSION_NAME],
          date: row[CONFIG.CREATE_COLS.DATE],
          startTime: row[CONFIG.CREATE_COLS.START_TIME],
          duration: row[CONFIG.CREATE_COLS.DURATION]
        };

        logInfo(`Row ${rowIndex} - Extracted data: Date="${sessionData.date}", StartTime="${sessionData.startTime}", Duration="${sessionData.duration}"`);

        // Validate required fields (Duration is now required since no End Time)
        if (!sessionData.sessionName || !sessionData.date || !sessionData.startTime || !sessionData.duration) {
          logWarning(`Missing required fields at row ${rowIndex}`);
          results.errors.push({ row: rowIndex, error: 'Missing required fields (Session Name, Date, Start Time, Duration)' });
          continue;
        }

        let meetingId = row[CONFIG.CREATE_COLS.MEETING_ID];
        let password = row[CONFIG.CREATE_COLS.MEETING_PASSWORD];
        let joinUrl = row[CONFIG.CREATE_COLS.ZOOM_LIVE_LINK];
        let calendarEventId = row[CONFIG.CREATE_COLS.CALENDAR_EVENT_ID];
        let calendarEventLink = row[CONFIG.CREATE_COLS.CALENDAR_EVENT_LINK];
        let status = row[CONFIG.CREATE_COLS.STATUS];

        // Check if already has Zoom meeting created
        const alreadyCreated = meetingId && status &&
          (status === CONFIG.STATUS.CREATED ||
           status === CONFIG.STATUS.SCHEDULED ||
           status === CONFIG.STATUS.LIVE ||
           status === CONFIG.STATUS.COMPLETED);

        // Create Zoom meeting if not exists
        if (!meetingId) {
          const meeting = createZoomMeeting(sessionData);
          // Original Meeting ID from Zoom API (we'll override this)
          const originalMeetingId = meeting.meetingId;
          password = meeting.password;
          joinUrl = meeting.joinUrl;

          // Override Meeting ID with PMI (Personal Meeting ID)
          const PMI_MEETING_ID = "8521596679";
          meetingId = PMI_MEETING_ID;

          logInfo(`Row ${rowIndex}: Created Zoom meeting ${originalMeetingId}, overriding with PMI: ${PMI_MEETING_ID}`);

          // Update Create sheet with overridden Meeting ID
          createSheet.getRange(rowIndex, CONFIG.CREATE_COLS.MEETING_ID + 1).setValue(meetingId);
          createSheet.getRange(rowIndex, CONFIG.CREATE_COLS.MEETING_PASSWORD + 1).setValue(password);
          createSheet.getRange(rowIndex, CONFIG.CREATE_COLS.ZOOM_LIVE_LINK + 1).setValue(joinUrl);
          createSheet.getRange(rowIndex, CONFIG.CREATE_COLS.STATUS + 1).setValue(CONFIG.STATUS.CREATED);

          results.created++;
        } else if (alreadyCreated) {
          logInfo(`Row ${rowIndex}: Meeting already exists (${meetingId}), will sync to Live if needed`);
        }

        // Create Calendar event if not exists
        if (!calendarEventId && joinUrl) {
          const calendarEvent = createCalendarEvent({
            ...sessionData,
            meetingId: meetingId,
            password: password
          }, joinUrl);

          calendarEventId = calendarEvent.eventId;
          calendarEventLink = calendarEvent.eventLink;

          // Update Create sheet with Calendar details
          createSheet.getRange(rowIndex, CONFIG.CREATE_COLS.CALENDAR_EVENT_ID + 1).setValue(calendarEventId);
          createSheet.getRange(rowIndex, CONFIG.CREATE_COLS.CALENDAR_EVENT_LINK + 1).setValue(calendarEventLink);
        }

        // Create Google Drive folder structure for recordings
        logInfo(`Row ${rowIndex}: Creating Drive folder structure...`);
        const mainFolder = DriveApp.getFolderById(CONFIG.DRIVE.MAIN_FOLDER_ID);
        const batchFolder = getOrCreateFolderZoom(mainFolder, sessionData.batch);
        const termFolder = getOrCreateFolderZoom(batchFolder, sessionData.term);
        const domainFolder = getOrCreateFolderZoom(termFolder, sessionData.domain);
        const subjectFolder = getOrCreateFolderZoom(domainFolder, sessionData.subject);
        const sessionFolder = getOrCreateFolderZoom(subjectFolder, sessionData.sessionName);
        logInfo(`Row ${rowIndex}: Session folder created: ${sessionFolder.getUrl()}`);

        // Create organized subfolders for recordings (create at this stage, not during recording sync)
        const videosFolder = getOrCreateFolderZoom(sessionFolder, '01 - Videos');
        const audioFolder = getOrCreateFolderZoom(sessionFolder, '02 - Audio');
        const transcriptsFolder = getOrCreateFolderZoom(sessionFolder, '03 - Transcripts');
        const chatFolder = getOrCreateFolderZoom(sessionFolder, '04 - Chat');
        const whiteboardsFolder = getOrCreateFolderZoom(sessionFolder, '05 - Whiteboards');
        const pollsFolder = getOrCreateFolderZoom(sessionFolder, '06 - Polls');
        logInfo(`Row ${rowIndex}: All subfolders created successfully`);

        // Prepare Live sheet row (12 columns) - Convert all to plain text strings
        const liveRowData = [
          sessionData.batch,
          sessionData.term,
          sessionData.domain,
          sessionData.subject,
          sessionData.sessionName,
          sessionData.date,
          sessionData.startTime,
          sessionData.duration,
          joinUrl,
          meetingId,
          password,
          ''      // FULL_SYNCED - empty initially, will be set to TRUE after recording sync
        ];

        // Convert all values to plain text strings to prevent auto-formatting
        const liveRow = liveRowData.map(value => {
          if (value === null || value === undefined) return '';
          return String(value);
        });

        // Find existing row by unique combination (not just Meeting ID)
        // Since all meetings use same PMI, we need unique combination: Domain, Subject, Session Name, Date, Start Time, Duration
        let liveRowIndex = -1;
        for (let j = 1; j < liveData.length; j++) {
          const existingRow = liveData[j];
          const matchesDomain = String(existingRow[CONFIG.LIVE_COLS.DOMAIN]) === String(sessionData.domain);
          const matchesSubject = String(existingRow[CONFIG.LIVE_COLS.SUBJECT]) === String(sessionData.subject);
          const matchesSessionName = String(existingRow[CONFIG.LIVE_COLS.SESSION_NAME]) === String(sessionData.sessionName);
          const matchesDate = String(existingRow[CONFIG.LIVE_COLS.DATE]) === String(sessionData.date);
          const matchesStartTime = String(existingRow[CONFIG.LIVE_COLS.START_TIME]) === String(sessionData.startTime);
          const matchesDuration = String(existingRow[CONFIG.LIVE_COLS.DURATION]) === String(sessionData.duration);

          if (matchesDomain && matchesSubject && matchesSessionName && matchesDate && matchesStartTime && matchesDuration) {
            liveRowIndex = j + 1;
            break;
          }
        }

        // Update or create in Live sheet with plain text formatting
        if (liveRowIndex > 0) {
          // Update existing row
          const range = liveSheet.getRange(liveRowIndex, 1, 1, liveRow.length);
          range.clearFormat();  // Clear all formatting
          range.setNumberFormat('@');  // Set to plain text format
          range.setValues([liveRow]);
          logInfo(`Row ${rowIndex}: Updated in Live sheet (plain text)`);
        } else {
          // Append new row
          liveSheet.appendRow(liveRow);
          // Format the newly added row as plain text
          const lastRow = liveSheet.getLastRow();
          const range = liveSheet.getRange(lastRow, 1, 1, liveRow.length);
          range.clearFormat();
          range.setNumberFormat('@');  // Plain text format
          logInfo(`Row ${rowIndex}: Added to Live sheet (plain text)`);
        }

        // Prepare Zoom Recordings sheet row (29 columns) with basic info
        // This row will be updated later when recordings are synced
        const recordingSheet = getSheet(CONFIG.SHEETS.ZOOM_RECORDING);
        const recordingRowData = [
          sessionData.batch,        // 0 - Batch
          sessionData.term,         // 1 - Term
          sessionData.domain,       // 2 - Domain
          sessionData.subject,      // 3 - Subject
          sessionData.sessionName,  // 4 - Session Name
          sessionData.date,         // 5 - Date
          sessionData.startTime,    // 6 - Start Time
          sessionData.duration,     // 7 - Duration (min)
          meetingId,                // 8 - Meeting ID
          password,                 // 9 - Meeting Password
          '',                       // 10 - Manual Download (empty by default)
          '',                       // 11 - Speaker View Link
          '',                       // 12 - Gallery View Link
          '',                       // 13 - Screen Share Link
          '',                       // 14 - Active Speaker Link
          '',                       // 15 - Transcript Link
          '',                       // 16 - Audio Link
          '',                       // 17 - Chat Link
          'No',                     // 18 - Publish (default to No until recordings are ready)
          '',                       // 19 - File1 Name
          '',                       // 20 - File1
          '',                       // 21 - File2 Name
          '',                       // 22 - File2
          '',                       // 23 - File3 Name
          '',                       // 24 - File3
          '',                       // 25 - File4 Name
          '',                       // 26 - File4
          '',                       // 27 - File5 Name
          ''                        // 28 - File5
        ];

        // Convert all values to plain text strings
        const recordingRow = recordingRowData.map(value => {
          if (value === null || value === undefined) return '';
          return String(value);
        });

        // Check if recording row already exists using unique combination (not just Meeting ID)
        // Since all meetings use same PMI, we need unique combination: Domain, Subject, Session Name, Date
        const recordingData = recordingSheet.getDataRange().getValues();
        let recordingRowIndex = -1;
        for (let j = 1; j < recordingData.length; j++) {
          const existingRow = recordingData[j];
          const matchesDomain = String(existingRow[2]) === String(sessionData.domain);      // Column 2 - Domain
          const matchesSubject = String(existingRow[3]) === String(sessionData.subject);    // Column 3 - Subject
          const matchesSessionName = String(existingRow[4]) === String(sessionData.sessionName); // Column 4 - Session Name
          const matchesDate = String(existingRow[5]) === String(sessionData.date);          // Column 5 - Date

          if (matchesDomain && matchesSubject && matchesSessionName && matchesDate) {
            recordingRowIndex = j + 1;
            break;
          }
        }

        if (recordingRowIndex > 0) {
          // Update existing recording row with plain text formatting
          const range = recordingSheet.getRange(recordingRowIndex, 1, 1, recordingRow.length);
          range.clearFormat();
          range.setNumberFormat('@');  // Plain text
          range.setValues([recordingRow]);
          logInfo(`Row ${rowIndex}: Updated existing row in Zoom Recordings sheet (plain text)`);
        } else {
          // Add new recording row
          recordingSheet.appendRow(recordingRow);
          // Format as plain text
          const lastRow = recordingSheet.getLastRow();
          const range = recordingSheet.getRange(lastRow, 1, 1, recordingRow.length);
          range.clearFormat();
          range.setNumberFormat('@');
          logInfo(`Row ${rowIndex}: Added new row to Zoom Recordings sheet (plain text, Publish=No)`);
        }

        results.updated++;

        // Uncheck the checkbox after successful processing
        logInfo(`Row ${rowIndex}: About to uncheck checkbox at column ${CONFIG.CREATE_COLS.CHECK_BOX + 1}`);
        const checkboxCell = createSheet.getRange(rowIndex, CONFIG.CREATE_COLS.CHECK_BOX + 1);
        checkboxCell.setValue(false);
        SpreadsheetApp.flush(); // Force immediate write
        logInfo(`Row ${rowIndex}: Checkbox unchecked and flushed`);

      } catch (error) {
        const errorMsg = `Row ${rowIndex}: ${error.toString()}\nStack: ${error.stack || 'No stack trace'}`;
        results.errors.push({ row: rowIndex, error: error.toString(), stack: error.stack });
        logError(errorMsg);
        console.error(errorMsg); // Force console output
      }
    }

    const syncSummary = `Sync completed - Processed: ${results.processed}, Created: ${results.created}, Updated: ${results.updated}, Errors: ${results.errors.length}`;
    logInfo(syncSummary);
    console.log(syncSummary);

    if (results.errors.length > 0) {
      console.error('ERRORS OCCURRED:');
      results.errors.forEach(err => console.error(`Row ${err.row}: ${err.error}`));
    }

    return results;

  } catch (error) {
    logError('Fatal error in sync operation', error);
    throw error;
  }
}

/**
 * Handle edit operations (when Edit CheckBox is checked)
 */
function handleEditOperations() {
  const createSheet = getSheet(CONFIG.SHEETS.CREATE_ZOOM);
  const data = createSheet.getDataRange().getValues();

  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const rowIndex = i + 1;

    const editChecked = row[CONFIG.CREATE_COLS.EDIT_CHECK_BOX];
    if (!editChecked) continue;

    try {
      const meetingId = row[CONFIG.CREATE_COLS.MEETING_ID];
      const calendarEventId = row[CONFIG.CREATE_COLS.CALENDAR_EVENT_ID];

      // Check if cancelling
      if (row[CONFIG.CREATE_COLS.CANCELLED]) {
        // Delete Zoom meeting
        if (meetingId) {
          deleteZoomMeeting(meetingId);
        }

        // Delete Calendar event
        if (calendarEventId) {
          deleteCalendarEvent(calendarEventId);
        }

        // Update status
        createSheet.getRange(rowIndex, CONFIG.CREATE_COLS.STATUS + 1).setValue(CONFIG.STATUS.CANCELLED);
        createSheet.getRange(rowIndex, CONFIG.CREATE_COLS.EDIT_CHECK_BOX + 1).setValue(false);
        continue;
      }

      // Apply edits if new values exist
      const updates = {};

      if (row[CONFIG.CREATE_COLS.SESSION_NAME_NEW]) {
        updates.topic = row[CONFIG.CREATE_COLS.SESSION_NAME_NEW];
        createSheet.getRange(rowIndex, CONFIG.CREATE_COLS.SESSION_NAME + 1)
          .setValue(row[CONFIG.CREATE_COLS.SESSION_NAME_NEW]);
      }

      if (row[CONFIG.CREATE_COLS.DATE_NEW]) {
        createSheet.getRange(rowIndex, CONFIG.CREATE_COLS.DATE + 1)
          .setValue(row[CONFIG.CREATE_COLS.DATE_NEW]);
      }

      if (row[CONFIG.CREATE_COLS.START_TIME_NEW]) {
        createSheet.getRange(rowIndex, CONFIG.CREATE_COLS.START_TIME + 1)
          .setValue(row[CONFIG.CREATE_COLS.START_TIME_NEW]);
      }

      // Update Zoom meeting if there are changes
      if (Object.keys(updates).length > 0 && meetingId) {
        updateZoomMeeting(meetingId, updates);
      }

      // Uncheck edit checkbox
      createSheet.getRange(rowIndex, CONFIG.CREATE_COLS.EDIT_CHECK_BOX + 1).setValue(false);

      // Clear "New" columns
      createSheet.getRange(rowIndex, CONFIG.CREATE_COLS.SESSION_NAME_NEW + 1).clearContent();
      createSheet.getRange(rowIndex, CONFIG.CREATE_COLS.DATE_NEW + 1).clearContent();
      createSheet.getRange(rowIndex, CONFIG.CREATE_COLS.START_TIME_NEW + 1).clearContent();
      createSheet.getRange(rowIndex, CONFIG.CREATE_COLS.END_TIME_NEW + 1).clearContent();

    } catch (error) {
      logError(`Error handling edit for row ${rowIndex}`, error);
    }
  }
}

// ==================== RECORDING SYNC ====================

/**
 * Fetch participants from Zoom API and log to Zoom LOG sheet
 * ALWAYS called regardless of Manual Download setting
 */
function fetchAndLogParticipants(meetingId, sessionRow, rowIndex) {
  try {
    logInfo(`Fetching participants for meeting ${meetingId}...`);

    // Call Zoom API to get participants
    const participants = fetchZoomParticipantsFromAPI(meetingId);

    if (!participants || participants.length === 0) {
      logInfo(`No participants found for meeting ${meetingId}`);
      return;
    }

    // Get Zoom LOG sheet
    const logSheet = getSheet(CONFIG.SHEETS.ZOOM_LOG);

    // Log each participant
    for (const participant of participants) {
      const logRow = [
        sessionRow[0],                    // Batch
        sessionRow[1],                    // Term
        sessionRow[2],                    // Domain
        sessionRow[3],                    // Subject
        sessionRow[4],                    // Session Name
        sessionRow[5],                    // Date
        meetingId,                        // Meeting ID
        participant.name || '',           // Participant Name
        participant.user_email || '',     // Participant Email
        participant.join_time || '',      // Join Time
        participant.leave_time || '',     // Leave Time
        participant.duration || 0,        // Duration (minutes)
        participant.user_id || '',        // User ID
        new Date().toISOString()          // Log Timestamp
      ];

      logSheet.appendRow(logRow);
    }

    logInfo(`Successfully logged ${participants.length} participants for meeting ${meetingId} to Zoom LOG`);

  } catch (error) {
    logError(`Error fetching/logging participants for meeting ${meetingId}`, error);
    // Don't throw - we still want to continue processing recordings even if participant logging fails
  }
}

/**
 * Sync Zoom recordings to Google Drive and update Recording sheet
 * NEW LOGIC: Loops through Zoom Recordings sheet (not Zoom Live)
 * Only downloads recordings if Manual Download = "No"
 * ALWAYS fetches and logs participants regardless of Manual Download setting
 */
function syncZoomRecordings() {
  const results = {
    processed: 0,
    skipped: 0,
    downloaded: 0,
    errors: []
  };

  try {
    logInfo('Starting Zoom recordings sync...');

    const startTime = new Date().getTime();
    const MAX_EXECUTION_TIME = 5 * 60 * 1000; // 5 minutes (leave 1 minute buffer before 6-min timeout)

    const liveSheet = getSheet(CONFIG.SHEETS.ZOOM_LIVE);
    const recordingSheet = getSheet(CONFIG.SHEETS.ZOOM_RECORDING);

    if (!liveSheet || !recordingSheet) {
      throw new Error('Required sheets not found');
    }

    // NEW LOGIC: Loop through Zoom Recordings sheet (not Zoom Live)
    const recordingData = recordingSheet.getDataRange().getValues();

    logInfo(`Checking Zoom Recordings sheet for meetings to sync...`);

    // Process each recording
    for (let i = 1; i < recordingData.length; i++) {
      // Check execution time before processing each meeting to avoid timeout
      const elapsedTime = new Date().getTime() - startTime;
      if (elapsedTime > MAX_EXECUTION_TIME) {
        const remainingMeetings = recordingData.length - 1 - results.processed - results.skipped;
        logInfo(`Execution time limit approaching (${(elapsedTime / 1000 / 60).toFixed(1)} min). Stopping to avoid timeout. ${remainingMeetings} meetings remaining - will be processed in next run.`);
        break; // Exit loop, let next scheduled run continue
      }

      const row = recordingData[i];
      const rowIndex = i + 1;

      // Column indexes for Zoom Recordings sheet
      const meetingId = row[8];           // Column 8 - Meeting ID
      const sessionName = row[4];         // Column 4 - Session Name
      const manualDownload = row[10];     // Column 10 - Manual Download

      if (!meetingId || !sessionName) continue;

      results.processed++;
      const downloadStartTime = new Date();

      try {
        logInfo(`Processing meeting ${meetingId} (${sessionName})...`);

        // ALWAYS fetch and log participants first (regardless of Manual Download setting)
        fetchAndLogParticipants(meetingId, row, rowIndex);

        // Check Manual Download setting
        // Only download recordings if Manual Download = "No"
        if (manualDownload !== 'No') {
          logInfo(`Skipping recording download for meeting ${meetingId} - Manual Download is "${manualDownload}" (must be "No" to auto-download)`);
          results.skipped++;
          continue;
        }

        logInfo(`Manual Download = "No" for meeting ${meetingId}, proceeding with recording download...`);

        // Get recordings from Zoom API
        const recordings = fetchZoomRecordingsFromAPI(meetingId);

        if (!recordings || !recordings.recording_files || recordings.recording_files.length === 0) {
          logInfo(`No recordings yet for meeting ${meetingId}`);
          continue;
        }

        // Get Drive folder structure (already created during syncCreateToLive)
        // Navigate to existing folders: SSB Zoom Recordings/Batch/Term/Domain/Subject/SessionName
        const mainFolder = DriveApp.getFolderById(CONFIG.DRIVE.MAIN_FOLDER_ID);
        const batchFolder = getOrCreateFolderZoom(mainFolder, row[0]);      // Column 0 - Batch
        const termFolder = getOrCreateFolderZoom(batchFolder, row[1]);      // Column 1 - Term
        const domainFolder = getOrCreateFolderZoom(termFolder, row[2]);     // Column 2 - Domain
        const subjectFolder = getOrCreateFolderZoom(domainFolder, row[3]);  // Column 3 - Subject
        const sessionFolder = getOrCreateFolderZoom(subjectFolder, row[4]); // Column 4 - Session Name

        // Get existing subfolders (already created during syncCreateToLive)
        const videosFolder = getOrCreateFolderZoom(sessionFolder, '01 - Videos');
        const audioFolder = getOrCreateFolderZoom(sessionFolder, '02 - Audio');
        const transcriptsFolder = getOrCreateFolderZoom(sessionFolder, '03 - Transcripts');
        const chatFolder = getOrCreateFolderZoom(sessionFolder, '04 - Chat');
        const whiteboardsFolder = getOrCreateFolderZoom(sessionFolder, '05 - Whiteboards');
        const pollsFolder = getOrCreateFolderZoom(sessionFolder, '06 - Polls');

        // Initialize data structure for all recording types (127 columns)
        const recordingData = new Array(127).fill('');

        // Basic session info (columns 0-10)
        recordingData[0] = row[CONFIG.LIVE_COLS.BATCH];
        recordingData[1] = row[CONFIG.LIVE_COLS.TERM];
        recordingData[2] = row[CONFIG.LIVE_COLS.DOMAIN];
        recordingData[3] = row[CONFIG.LIVE_COLS.SUBJECT];
        recordingData[4] = row[CONFIG.LIVE_COLS.SESSION_NAME];
        recordingData[5] = row[CONFIG.LIVE_COLS.DATE];
        recordingData[6] = meetingId;
        recordingData[7] = recordings.uuid || '';
        recordingData[8] = row[CONFIG.LIVE_COLS.MEETING_PASSWORD] || '';
        recordingData[9] = 'TRUE';
        recordingData[10] = sessionFolder.getUrl();

        // Meeting metadata from Zoom API
        recordingData[100] = recordings.topic || '';
        recordingData[101] = recordings.start_time || '';
        recordingData[104] = recordings.host_id || '';
        recordingData[105] = recordings.host_email || '';

        let totalFileSize = 0;
        let totalDuration = 0;
        const whiteboards = [];

        // Process each recording file
        for (const file of recordings.recording_files) {
          try {
            const recordingType = (file.recording_type || '').toLowerCase();
            const fileType = (file.file_type || '').toLowerCase();
            const fileExtension = (file.file_extension || file.file_type || 'mp4').toLowerCase();

            // Use Zoom file ID for consistent naming (won't change between runs)
            const fileName = file.file_name || `${recordingType}_${file.id}.${fileExtension}`;

            logInfo(`Processing file: ${fileName} (type: ${recordingType})`);

            // Determine target folder based on file type
            let targetFolder = videosFolder;
            if (recordingType.includes('audio') || fileType === 'm4a') {
              targetFolder = audioFolder;
            } else if (recordingType.includes('transcript') || fileType === 'vtt' || fileType === 'txt') {
              targetFolder = transcriptsFolder;
            } else if (recordingType.includes('chat')) {
              targetFolder = chatFolder;
            } else if (recordingType.includes('timeline')) {
              targetFolder = sessionFolder;
            }

            // Check if file already exists in Drive, or download from Zoom
            let driveFile = null;
            let driveUrl = '';
            let fileSize = file.file_size || 0;

            // First, check if file already exists in the target folder (with or without extension)
            logInfo(`Checking if ${fileName} exists in folder: ${targetFolder.getName()}`);
            let existingFiles = targetFolder.getFilesByName(fileName);
            if (!existingFiles.hasNext()) {
              // Try without extension (some files might not have it)
              const fileNameWithoutExt = fileName.replace(/\.[^/.]+$/, '');
              logInfo(`Not found with extension, trying without: ${fileNameWithoutExt}`);
              existingFiles = targetFolder.getFilesByName(fileNameWithoutExt);
            }

            if (existingFiles.hasNext()) {
              driveFile = existingFiles.next();
              driveUrl = driveFile.getUrl();
              fileSize = driveFile.getSize();
              totalFileSize += fileSize;
              logInfo(`✓ File already exists in Drive: ${driveFile.getName()} (${(fileSize / (1024 * 1024)).toFixed(2)} MB) - skipping download, using existing file`);
            } else if (file.download_url) {
              try {
                // Use chunked download for all files to handle large videos
                if (file.file_size && file.file_size > 10 * 1024 * 1024) { // > 10MB - use chunked download
                  logInfo(`Downloading file: ${fileName} (${(file.file_size / (1024 * 1024)).toFixed(2)} MB) using chunked download`);
                  driveFile = downloadZoomFileChunked(file.download_url, fileName, file.file_size, targetFolder, meetingId);
                  driveUrl = driveFile.getUrl();
                  fileSize = driveFile.getSize();
                  totalFileSize += fileSize;
                  results.downloaded++;
                  logInfo(`✓ Downloaded to Drive: ${fileName} (${(fileSize / (1024 * 1024)).toFixed(2)} MB)`);
                } else {
                  // Small files: Direct download
                  logInfo(`Direct download for small file: ${fileName}`);
                  const accessToken = getZoomAccessToken();
                  const response = UrlFetchApp.fetch(file.download_url, {
                    method: 'get',
                    headers: {
                      'Authorization': 'Bearer ' + accessToken
                    },
                    muteHttpExceptions: true
                  });
                  const fileBlob = response.getBlob();
                  fileBlob.setName(fileName);
                  driveFile = targetFolder.createFile(fileBlob);
                  driveUrl = driveFile.getUrl();
                  fileSize = driveFile.getSize();
                  totalFileSize += fileSize;
                  results.downloaded++;
                  logInfo(`✓ Downloaded to Drive: ${fileName} (${(fileSize / (1024 * 1024)).toFixed(2)} MB)`);
                }

              } catch (downloadError) {
                logError(`✗ Failed to process ${fileName}`, downloadError);
                recordingData[123] = `Processing failed: ${fileName} - ${downloadError.toString()}`;
                // Store Zoom URL as fallback
                driveUrl = file.play_url || file.download_url;
                fileSize = file.file_size || 0;
                logInfo(`Fallback: Storing Zoom URL for ${fileName}`);
              }
            }

            // Categorize and populate columns based on recording type
            const playUrl = file.play_url || '';
            const downloadUrl = file.download_url || '';
            const startTime = file.recording_start || '';
            const endTime = file.recording_end || '';

            // Speaker View (11-16)
            if (recordingType === 'shared_screen_with_speaker_view' || recordingType === 'speaker_view') {
              recordingData[11] = playUrl;
              recordingData[12] = downloadUrl;
              recordingData[13] = driveUrl;
              recordingData[14] = fileSize;
              recordingData[15] = startTime;
              recordingData[16] = endTime;
            }
            // Gallery View (17-22)
            else if (recordingType === 'shared_screen_with_gallery_view' || recordingType === 'gallery_view') {
              recordingData[17] = playUrl;
              recordingData[18] = downloadUrl;
              recordingData[19] = driveUrl;
              recordingData[20] = fileSize;
              recordingData[21] = startTime;
              recordingData[22] = endTime;
            }
            // Screen Share with Speaker (23-28)
            else if (recordingType === 'shared_screen_with_speaker_view(cc)') {
              recordingData[23] = playUrl;
              recordingData[24] = downloadUrl;
              recordingData[25] = driveUrl;
              recordingData[26] = fileSize;
              recordingData[27] = startTime;
              recordingData[28] = endTime;
            }
            // Screen Share with Speaker CC (29-34)
            else if (recordingType.includes('cc') && recordingType.includes('speaker')) {
              recordingData[29] = playUrl;
              recordingData[30] = downloadUrl;
              recordingData[31] = driveUrl;
              recordingData[32] = fileSize;
              recordingData[33] = startTime;
              recordingData[34] = endTime;
            }
            // Screen Share with Gallery (35-40)
            else if (recordingType === 'shared_screen_with_gallery_view' || recordingType.includes('gallery')) {
              recordingData[35] = playUrl;
              recordingData[36] = downloadUrl;
              recordingData[37] = driveUrl;
              recordingData[38] = fileSize;
              recordingData[39] = startTime;
              recordingData[40] = endTime;
            }
            // Screen Share Only (41-46)
            else if (recordingType === 'shared_screen') {
              recordingData[41] = playUrl;
              recordingData[42] = downloadUrl;
              recordingData[43] = driveUrl;
              recordingData[44] = fileSize;
              recordingData[45] = startTime;
              recordingData[46] = endTime;
            }
            // Active Speaker (47-52)
            else if (recordingType === 'active_speaker') {
              recordingData[47] = playUrl;
              recordingData[48] = downloadUrl;
              recordingData[49] = driveUrl;
              recordingData[50] = fileSize;
              recordingData[51] = startTime;
              recordingData[52] = endTime;
            }
            // Audio Only (53-58)
            else if (recordingType === 'audio_only' || fileType === 'm4a') {
              recordingData[53] = playUrl;
              recordingData[54] = downloadUrl;
              recordingData[55] = driveUrl;
              recordingData[56] = fileSize;
              recordingData[57] = startTime;
              recordingData[58] = endTime;
            }
            // Audio Transcript (59-61)
            else if (recordingType === 'audio_transcript' || fileType === 'vtt') {
              recordingData[59] = downloadUrl;
              recordingData[60] = driveUrl;
              recordingData[61] = fileSize;
            }
            // Closed Captions (62-64)
            else if (recordingType === 'closed_caption' || recordingType.includes('cc')) {
              recordingData[62] = downloadUrl;
              recordingData[63] = driveUrl;
              recordingData[64] = fileSize;
            }
            // Chat (65-68)
            else if (recordingType === 'chat' || recordingType.includes('chat')) {
              recordingData[65] = downloadUrl;
              recordingData[66] = driveUrl;
              recordingData[67] = fileSize;
              // Parse chat file to count messages if needed
              recordingData[68] = ''; // Message count - would need to parse file
            }
            // Timeline (69-71)
            else if (recordingType === 'timeline') {
              recordingData[69] = downloadUrl;
              recordingData[70] = driveUrl;
              recordingData[71] = fileSize;
            }

          } catch (fileError) {
            logError(`Error processing file in meeting ${meetingId}`, fileError);
            recordingData[123] = `Error: ${fileError.toString()}`;
          }
        }

        // Calculate meeting duration
        if (recordings.start_time && recordings.recording_files.length > 0) {
          const startTime = new Date(recordings.start_time);
          const lastFile = recordings.recording_files[recordings.recording_files.length - 1];
          if (lastFile.recording_end) {
            const endTime = new Date(lastFile.recording_end);
            totalDuration = Math.round((endTime - startTime) / 60000); // minutes
            recordingData[102] = endTime.toISOString();
          }
        }
        recordingData[103] = totalDuration;

        // File size summary (106-108)
        recordingData[106] = totalFileSize;
        recordingData[107] = (totalFileSize / (1024 * 1024)).toFixed(2); // MB
        recordingData[108] = (totalFileSize / (1024 * 1024 * 1024)).toFixed(4); // GB

        // Folder structure URLs (109-116)
        recordingData[109] = sessionFolder.getUrl();
        recordingData[110] = `${row[CONFIG.LIVE_COLS.BATCH]}/${row[CONFIG.LIVE_COLS.TERM]}/${row[CONFIG.LIVE_COLS.DOMAIN]}/${row[CONFIG.LIVE_COLS.SUBJECT]}/${row[CONFIG.LIVE_COLS.SESSION_NAME]}`;
        recordingData[111] = videosFolder.getUrl();
        recordingData[112] = audioFolder.getUrl();
        recordingData[113] = transcriptsFolder.getUrl();
        recordingData[114] = chatFolder.getUrl();
        recordingData[115] = whiteboardsFolder.getUrl();
        recordingData[116] = pollsFolder.getUrl();

        // Status & tracking (117-126)
        recordingData[117] = recordings.recording_count > 0 ? 'Available' : 'Processing';
        recordingData[118] = 'Completed';
        recordingData[119] = 'Success';
        recordingData[120] = downloadStartTime.toISOString();
        recordingData[121] = new Date().toISOString();

        const processingTime = Math.round((new Date() - downloadStartTime) / 60000);
        recordingData[122] = processingTime;
        recordingData[123] = ''; // Error message (empty if success)
        recordingData[124] = 0; // Retry count
        recordingData[125] = new Date().toISOString();
        recordingData[126] = `Synced ${results.downloaded} files, Total size: ${recordingData[107]} MB`;

        // Find existing row in Recording sheet by Meeting ID (should exist from meeting creation)
        const allRecordingData = recordingSheet.getDataRange().getValues();
        let existingRecordingRowIndex = -1;
        for (let k = 1; k < allRecordingData.length; k++) {
          if (allRecordingData[k][8] === meetingId) {  // Column 8 is Meeting ID
            existingRecordingRowIndex = k + 1;
            break;
          }
        }

        if (existingRecordingRowIndex > 0) {
          // Update existing row (only update the recording link columns, keep basic info)
          recordingSheet.getRange(existingRecordingRowIndex, 1, 1, recordingData.length).setValues([recordingData]);
          logInfo(`Updated existing recording row for meeting ${meetingId}`);
        } else {
          // Fallback: append if row doesn't exist (shouldn't happen normally)
          recordingSheet.appendRow(recordingData);
          logInfo(`Appended new recording row for meeting ${meetingId}`);
        }

        // Mark as fully synced in Zoom Live sheet (ONLY after everything is complete)
        // Find corresponding row in Zoom Live using unique combination (not Meeting ID)
        const liveData = liveSheet.getDataRange().getValues();
        let liveRowIndex = -1;

        for (let j = 1; j < liveData.length; j++) {
          const liveRow = liveData[j];
          const matchesDomain = String(liveRow[CONFIG.LIVE_COLS.DOMAIN]) === String(row[2]);
          const matchesSubject = String(liveRow[CONFIG.LIVE_COLS.SUBJECT]) === String(row[3]);
          const matchesSessionName = String(liveRow[CONFIG.LIVE_COLS.SESSION_NAME]) === String(row[4]);
          const matchesDate = String(liveRow[CONFIG.LIVE_COLS.DATE]) === String(row[5]);
          const matchesStartTime = String(liveRow[CONFIG.LIVE_COLS.START_TIME]) === String(row[6]);
          const matchesDuration = String(liveRow[CONFIG.LIVE_COLS.DURATION]) === String(row[7]);

          if (matchesDomain && matchesSubject && matchesSessionName && matchesDate && matchesStartTime && matchesDuration) {
            liveRowIndex = j + 1;
            break;
          }
        }

        if (liveRowIndex > 0) {
          liveSheet.getRange(liveRowIndex, CONFIG.LIVE_COLS.FULL_SYNCED + 1).setValue('TRUE');
          logInfo(`Successfully synced recordings for meeting ${meetingId} - marked row ${liveRowIndex} as FULL_SYNCED in Zoom Live`);
        } else {
          logWarning(`Could not find matching row in Zoom Live for meeting ${meetingId} (${sessionName}) to mark as FULL_SYNCED`);
        }

      } catch (error) {
        results.errors.push({ meetingId: meetingId, error: error.toString() });
        logError(`Error processing recordings for meeting ${meetingId}`, error);

        // Still write a row with error info
        const errorRow = new Array(127).fill('');
        errorRow[0] = row[CONFIG.LIVE_COLS.BATCH];
        errorRow[1] = row[CONFIG.LIVE_COLS.TERM];
        errorRow[2] = row[CONFIG.LIVE_COLS.DOMAIN];
        errorRow[3] = row[CONFIG.LIVE_COLS.SUBJECT];
        errorRow[4] = row[CONFIG.LIVE_COLS.SESSION_NAME];
        errorRow[5] = row[CONFIG.LIVE_COLS.DATE];
        errorRow[6] = meetingId;
        errorRow[119] = 'Failed';
        errorRow[123] = error.toString();
        errorRow[125] = new Date().toISOString();
        recordingSheet.appendRow(errorRow);
      }
    }

    logInfo(`Recording sync completed: ${results.skipped} skipped (already synced), ${results.processed} processed, ${results.downloaded} files downloaded, ${results.errors.length} errors`);
    return results;

  } catch (error) {
    logError('Fatal error in recording sync', error);
    throw error;
  }
}

/**
 * Download file from Zoom using chunked download with stream-to-Drive
 * Includes automatic token refresh to handle URL expiration
 */
function downloadZoomFileChunked(downloadUrl, fileName, fileSize, targetFolder, meetingId) {
  try {
    const CHUNK_SIZE = 20 * 1024 * 1024; // 20MB chunks
    const TOKEN_REFRESH_INTERVAL = 3 * 60 * 1000; // 3 minutes in milliseconds

    const fileSizeMB = (fileSize / (1024 * 1024)).toFixed(2);
    logInfo(`Starting resumable download: ${fileName} (${fileSizeMB} MB)`);

    // Step 1: Initiate resumable upload session with Drive API
    const mimeType = getMimeType(fileName);
    const metadata = {
      name: fileName,
      mimeType: mimeType,
      parents: [targetFolder.getId()]
    };

    const initResponse = UrlFetchApp.fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable', {
      method: 'post',
      headers: {
        'Authorization': 'Bearer ' + ScriptApp.getOAuthToken(),
        'Content-Type': 'application/json'
      },
      payload: JSON.stringify(metadata),
      muteHttpExceptions: true
    });

    const uploadUrl = initResponse.getHeaders()['Location'];
    if (!uploadUrl) {
      throw new Error('Failed to get resumable upload URL from Drive API');
    }

    logInfo(`[${fileName}] Resumable upload session created`);

    // Step 2: Download chunks from Zoom and upload directly to Drive
    let bytesDownloaded = 0;
    let lastTokenRefresh = new Date().getTime();
    let currentDownloadUrl = downloadUrl;
    let currentAccessToken = getZoomAccessToken();
    const totalChunks = Math.ceil(fileSize / CHUNK_SIZE);
    let driveResponse; // Declare outside loop so it's accessible after

    while (bytesDownloaded < fileSize) {
      const rangeStart = bytesDownloaded;
      const rangeEnd = Math.min(bytesDownloaded + CHUNK_SIZE - 1, fileSize - 1);
      const chunkNumber = Math.floor(bytesDownloaded / CHUNK_SIZE) + 1;
      const percentComplete = ((bytesDownloaded / fileSize) * 100).toFixed(1);
      const downloadedMB = (bytesDownloaded / (1024 * 1024)).toFixed(2);

      // Check if Zoom token needs refresh (every 3 minutes)
      const currentTime = new Date().getTime();
      const timeSinceRefresh = currentTime - lastTokenRefresh;

      if (timeSinceRefresh > TOKEN_REFRESH_INTERVAL) {
        logInfo(`[${fileName}] Zoom token expired, refreshing... (${(timeSinceRefresh / 1000 / 60).toFixed(1)} min elapsed)`);

        // Get fresh Zoom token
        currentAccessToken = getZoomAccessToken();

        // Re-fetch meeting data to get new download URL
        const freshRecordings = fetchZoomRecordingsFromAPI(meetingId);
        if (freshRecordings && freshRecordings.recording_files) {
          // Find the matching file by recording type
          const matchingFile = freshRecordings.recording_files.find(f =>
            f.recording_type === fileName.split('_')[0] ||
            f.file_type === fileName.split('.').pop().toUpperCase()
          );

          if (matchingFile && matchingFile.download_url) {
            currentDownloadUrl = matchingFile.download_url;
            logInfo(`[${fileName}] Fresh Zoom download URL obtained`);
          } else {
            logWarning(`[${fileName}] Could not find matching file in refreshed data, using old URL`);
          }
        }

        lastTokenRefresh = currentTime;
      }

      logInfo(`[${fileName}] Chunk ${chunkNumber}/${totalChunks} (${percentComplete}% - ${downloadedMB}MB/${fileSizeMB}MB)`);

      // Download chunk from Zoom
      const zoomResponse = UrlFetchApp.fetch(currentDownloadUrl, {
        method: 'get',
        headers: {
          'Authorization': 'Bearer ' + currentAccessToken,
          'Range': `bytes=${rangeStart}-${rangeEnd}`
        },
        muteHttpExceptions: true
      });

      const responseCode = zoomResponse.getResponseCode();
      if (responseCode !== 206 && responseCode !== 200) {
        throw new Error(`Zoom chunk download failed with status ${responseCode}: ${zoomResponse.getContentText()}`);
      }

      const chunkData = zoomResponse.getBlob().getBytes();

      // Upload chunk directly to Drive (build file progressively)
      // Note: Content-Length is set automatically by UrlFetchApp based on payload
      driveResponse = UrlFetchApp.fetch(uploadUrl, {
        method: 'put',
        headers: {
          'Content-Range': `bytes ${rangeStart}-${rangeEnd}/${fileSize}`
        },
        payload: chunkData,
        muteHttpExceptions: true
      });

      const driveResponseCode = driveResponse.getResponseCode();

      // Drive returns 308 for incomplete, 200/201 for complete
      if (driveResponseCode !== 308 && driveResponseCode !== 200 && driveResponseCode !== 201) {
        throw new Error(`Drive upload failed with status ${driveResponseCode}: ${driveResponse.getContentText()}`);
      }

      bytesDownloaded = rangeEnd + 1;

      // Small delay to avoid rate limiting
      if (bytesDownloaded < fileSize) {
        Utilities.sleep(300);
      }
    }

    logInfo(`[${fileName}] Download complete, retrieving file from Drive...`);

    // Get the file ID from the last response
    const finalResponse = JSON.parse(driveResponse.getContentText());
    const driveFile = DriveApp.getFileById(finalResponse.id);

    logInfo(`[${fileName}] ✓ Successfully created ONE file in Drive: ${fileSizeMB} MB`);
    return driveFile;

  } catch (error) {
    logError(`Error in resumable download for ${fileName}`, error);
    throw error;
  }
}

/**
 * Get MIME type based on file extension
 */
function getMimeType(fileName) {
  const extension = fileName.split('.').pop().toLowerCase();
  const mimeTypes = {
    'mp4': 'video/mp4',
    'm4a': 'audio/mp4',
    'vtt': 'text/vtt',
    'txt': 'text/plain',
    'json': 'application/json',
    'pdf': 'application/pdf'
  };
  return mimeTypes[extension] || 'application/octet-stream';
}

// ==================== TRIGGERS ====================

/**
 * OnEdit trigger - handles checkbox clicks
 */
function onSheetEdit(e) {
  try {
    const sheet = e.source.getActiveSheet();
    const sheetName = sheet.getName();

    if (sheetName !== CONFIG.SHEETS.CREATE_ZOOM) {
      return;
    }

    const range = e.range;
    const col = range.getColumn();
    const row = range.getRow();

    // Check if CheckBOX column was edited
    if (col === CONFIG.CREATE_COLS.CHECK_BOX + 1) {
      const value = range.getValue();
      if (value === true) {
        logInfo(`CheckBOX checked at row ${row}, triggering sync...`);
        syncCreateToLive();
      }
    }

    // Check if Edit CheckBOX column was edited
    if (col === CONFIG.CREATE_COLS.EDIT_CHECK_BOX + 1) {
      const value = range.getValue();
      if (value === true) {
        logInfo(`Edit CheckBOX checked at row ${row}, handling edits...`);
        handleEditOperations();
      }
    }

  } catch (error) {
    logError('Error in onEdit trigger', error);
  }
}

/**
 * Scheduled sync - runs periodically
 */
function scheduledSync() {
  try {
    logInfo('Starting scheduled sync...');

    // Sync Create → Live
    const syncResults = syncCreateToLive();

    // Sync Zoom recordings
    const recordingResults = syncZoomRecordings();

    logInfo('Scheduled sync completed', {
      sync: syncResults,
      recordings: recordingResults
    });

  } catch (error) {
    logError('Error in scheduled sync', error);
  }
}

/**
 * Manual sync function (can be run from custom menu)
 */
function manualSync() {
  try {
    const results = syncCreateToLive();

    const message = `
Sync Completed!
----------------
Processed: ${results.processed}
Created: ${results.created}
Updated: ${results.updated}
Errors: ${results.errors.length}
    `.trim();

    SpreadsheetApp.getUi().alert(message);
    return results;

  } catch (error) {
    logError('Error in manual sync', error);
    SpreadsheetApp.getUi().alert('Sync failed: ' + error.toString());
    throw error;
  }
}

/**
 * Manual recording sync (can be run from custom menu)
 */
function manualRecordingSync() {
  try {
    const results = syncZoomRecordings();

    const message = `
Recording Sync Completed!
------------------------
Processed: ${results.processed}
Downloaded: ${results.downloaded}
Errors: ${results.errors.length}
    `.trim();

    SpreadsheetApp.getUi().alert(message);
    return results;

  } catch (error) {
    logError('Error in manual recording sync', error);
    SpreadsheetApp.getUi().alert('Recording sync failed: ' + error.toString());
    throw error;
  }
}

/**
 * Add custom menu on open
 */
function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('SSB Zoom')
    .addItem('Sync Create → Live', 'manualSync')
    .addItem('Sync Zoom Recordings', 'manualRecordingSync')
    .addSeparator()
    .addItem('Test Zoom Connection', 'testZoomConnection')
    .addItem('Debug Start Time Issue', 'debugStartTime')
    .addToUi();
}

/**
 * Test Zoom API connection
 */
function testZoomConnection() {
  try {
    getZoomAccessToken();
    SpreadsheetApp.getUi().alert('✅ Zoom connection successful!\nAccess token obtained.');
  } catch (error) {
    SpreadsheetApp.getUi().alert('❌ Zoom connection failed:\n' + error.toString());
  }
}

/**
 * Debug Start Time - Test start time extraction and parsing
 * Run this to debug start time issues
 */
function debugStartTime() {
  try {
    const createSheet = getSheet(CONFIG.SHEETS.CREATE_ZOOM);
    const data = createSheet.getDataRange().getValues();

    let debugOutput = '=== START TIME DEBUG ===\n\n';

    // Check first 5 data rows (skip header)
    for (let i = 1; i <= Math.min(5, data.length - 1); i++) {
      const row = data[i];
      debugOutput += `--- Row ${i + 1} ---\n`;
      debugOutput += `Session Name: ${row[CONFIG.CREATE_COLS.SESSION_NAME]}\n`;
      debugOutput += `Date (Column G, index ${CONFIG.CREATE_COLS.DATE}): "${row[CONFIG.CREATE_COLS.DATE]}" (type: ${typeof row[CONFIG.CREATE_COLS.DATE]})\n`;
      debugOutput += `Start Time (Column H, index ${CONFIG.CREATE_COLS.START_TIME}): "${row[CONFIG.CREATE_COLS.START_TIME]}" (type: ${typeof row[CONFIG.CREATE_COLS.START_TIME]})\n`;
      debugOutput += `Duration (Column I, index ${CONFIG.CREATE_COLS.DURATION}): "${row[CONFIG.CREATE_COLS.DURATION]}" (type: ${typeof row[CONFIG.CREATE_COLS.DURATION]})\n`;

      // Test parseZoomDateTime
      if (row[CONFIG.CREATE_COLS.DATE] && row[CONFIG.CREATE_COLS.START_TIME]) {
        const parsed = parseZoomDateTime(row[CONFIG.CREATE_COLS.DATE], row[CONFIG.CREATE_COLS.START_TIME]);
        debugOutput += `Parsed DateTime: ${parsed.toString()}\n`;
        debugOutput += `ISO Format: ${parsed.toISOString()}\n`;

        // Format for Zoom API
        const zoomFormat = Utilities.formatDate(parsed, CONFIG.TIMEZONE, "yyyy-MM-dd'T'HH:mm:ss");
        debugOutput += `Zoom API Format: ${zoomFormat}\n`;
      } else {
        debugOutput += `⚠️ Date or Start Time is empty!\n`;
      }
      debugOutput += '\n';
    }

    // Show column headers for verification
    debugOutput += '\n=== COLUMN HEADERS ===\n';
    const headers = data[0];
    debugOutput += `Column G (index 6): "${headers[6]}"\n`;
    debugOutput += `Column H (index 7): "${headers[7]}"\n`;
    debugOutput += `Column I (index 8): "${headers[8]}"\n`;

    logInfo(debugOutput);
    console.log(debugOutput);
    SpreadsheetApp.getUi().alert(debugOutput);

  } catch (error) {
    const errorMsg = 'Debug failed: ' + error.toString() + '\n' + error.stack;
    logError(errorMsg);
    SpreadsheetApp.getUi().alert(errorMsg);
  }
}
