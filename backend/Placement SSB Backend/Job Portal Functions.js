// ================================================================================================
// JOB PORTAL FUNCTIONS - SSB Placement Management
// ================================================================================================

/**
 * Generate unique Job ID
 * Format: SSB-YYYY-TYPE-####
 * Example: SSB-2025-INT-0001
 */
function generateJobID(type) {
  const year = new Date().getFullYear();
  const typeCode = type === 'Internship' ? 'INT' : type === 'Full-Time' ? 'FT' : 'CON';

  try {
    const sheet = SpreadsheetApp.openById(JOB_PORTAL_SHEET_ID).getSheetByName(JOB_PORTAL_SHEET_NAME);
    const data = sheet.getDataRange().getValues();

    // Find highest number for this type and year
    let maxNum = 0;
    const prefix = `SSB-${year}-${typeCode}-`;

    for (let i = 1; i < data.length; i++) {
      const jobId = data[i][0];
      if (jobId && jobId.startsWith(prefix)) {
        const num = parseInt(jobId.split('-')[3]);
        if (num > maxNum) maxNum = num;
      }
    }

    const newNum = String(maxNum + 1).padStart(4, '0');
    return `${prefix}${newNum}`;

  } catch (error) {
    Logger.log(`Error generating Job ID: ${error.message}`);
    // Fallback to timestamp-based ID
    return `SSB-${year}-${typeCode}-${Date.now()}`;
  }
}

/**
 * Create Drive folder structure for a job posting
 * Structure: Main Folder / Batch / Company - Role - JobID / JobFileUploads, StudentResumes
 */
function createJobDriveFolders(batch, company, role, jobId) {
  try {
    Logger.log(`📁 Creating Drive folders for job: ${jobId}`);
    Logger.log(`📁 Batch: ${batch}, Company: ${company}, Role: ${role}`);
    Logger.log(`📁 Drive Folder ID: ${JOB_PORTAL_DRIVE_FOLDER_ID}`);

    // Validate required parameters
    if (!batch || batch.trim() === '') {
      throw new Error('Batch is required but was empty or null');
    }
    if (!company || company.trim() === '') {
      throw new Error('Company is required but was empty or null');
    }
    if (!role || role.trim() === '') {
      throw new Error('Role is required but was empty or null');
    }

    Logger.log('📁 Step 1: Accessing main folder...');
    const mainFolder = DriveApp.getFolderById(JOB_PORTAL_DRIVE_FOLDER_ID);
    Logger.log(`📁 Main folder accessed: ${mainFolder.getName()}`);

    // Create or get Batch folder
    Logger.log(`📁 Step 2: Creating/getting batch folder: ${batch}`);
    const batchFolder = getOrCreateFolder(mainFolder, batch);
    Logger.log(`📁 Batch folder ready: ${batchFolder.getName()}`);

    // Create job-specific folder
    const jobFolderName = `${company} - ${role} - ${jobId}`;
    Logger.log(`📁 Step 3: Creating job folder: ${jobFolderName}`);
    const jobFolder = getOrCreateFolder(batchFolder, jobFolderName);
    Logger.log(`📁 Job folder created: ${jobFolder.getUrl()}`);

    // Create subfolders
    Logger.log('📁 Step 4: Creating JobFileUploads subfolder...');
    const jobFilesFolder = getOrCreateFolder(jobFolder, 'JobFileUploads');
    Logger.log('📁 Step 5: Creating StudentResumes subfolder...');
    const studentResumesFolder = getOrCreateFolder(jobFolder, 'StudentResumes');
    Logger.log('📁 All folders created successfully!');

    return {
      success: true,
      jobFolderId: jobFolder.getId(),
      jobFolderUrl: jobFolder.getUrl(),
      studentResumesFolderId: studentResumesFolder.getId(),
      studentResumesFolderUrl: studentResumesFolder.getUrl(),
      jobFilesFolderId: jobFilesFolder.getId()
    };

  } catch (error) {
    Logger.log(`❌ Error creating job folders: ${error.message}`);
    Logger.log(`❌ Error stack: ${error.stack}`);
    return {
      success: false,
      error: `Failed to create Drive folders: ${error.message}. Folder ID: ${JOB_PORTAL_DRIVE_FOLDER_ID}`
    };
  }
}

/**
 * Create response sheet for job applications
 * Columns: ApplicationID, JobID, Timestamp, StudentEmail, StudentName, StudentBatch, ResumeURL, AssignmentFileURL, Question answers
 */
function createJobResponseSheet(jobId, company, role, questions, jobFolderId) {
  try {
    const sheetName = `${jobId} - Applications`;
    Logger.log(`📊 Creating response sheet: ${sheetName}`);

    Logger.log('📊 Step 1: Creating new spreadsheet...');
    const responseSheet = SpreadsheetApp.create(sheetName);
    Logger.log(`📊 Spreadsheet created with ID: ${responseSheet.getId()}`);

    Logger.log('📊 Step 2: Getting active sheet...');
    const sheet = responseSheet.getActiveSheet();

    // Build headers - NO underscores, use actual question text
    Logger.log('📊 Step 3: Building headers...');
    const headers = [
      'ApplicationID',
      'JobID',
      'Timestamp',
      'StudentEmail',
      'StudentName',
      'StudentBatch',
      'ResumeURL',
      'AssignmentFileURL'
    ];

    // Add question headers using actual question text (only for questions that exist)
    if (questions && questions.length > 0) {
      for (let i = 0; i < questions.length; i++) {
        const questionText = questions[i].text || `Question ${i + 1}`;
        headers.push(questionText);
      }
    }

    Logger.log(`📊 Step 4: Setting ${headers.length} headers...`);
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
    sheet.setFrozenRows(1);
    Logger.log('📊 Headers set successfully');

    // Move to job-specific folder (not main folder)
    Logger.log('📊 Step 5: Moving sheet to job-specific folder...');
    Logger.log(`📊 Job Folder ID: ${jobFolderId}`);
    const responseFile = DriveApp.getFileById(responseSheet.getId());
    Logger.log('📊 Step 6: Getting job folder...');
    const jobFolder = DriveApp.getFolderById(jobFolderId);
    Logger.log(`📊 Job folder accessed: ${jobFolder.getName()}`);
    Logger.log('📊 Step 7: Moving file...');
    responseFile.moveTo(jobFolder);
    Logger.log('📊 Response sheet created and moved successfully!');

    return {
      success: true,
      sheetId: responseSheet.getId(),
      sheetUrl: responseSheet.getUrl()
    };

  } catch (error) {
    Logger.log(`❌ Error creating response sheet: ${error.message}`);
    Logger.log(`❌ Error stack: ${error.stack}`);
    return {
      success: false,
      error: `Failed to create response sheet: ${error.message}. Job Folder ID: ${jobFolderId}`
    };
  }
}

/**
 * Send job notification email
 */
function sendJobNotificationEmail(jobId, jobData) {
  try {
    // Parse email addresses
    const toAddresses = jobData.mailTo ? jobData.mailTo.split(',').map(e => e.trim()).filter(e => e) : [];
    const ccAddresses = jobData.mailCC ? jobData.mailCC.split(',').map(e => e.trim()).filter(e => e) : [];
    const bccAddresses = jobData.mailBCC ? jobData.mailBCC.split(',').map(e => e.trim()).filter(e => e) : [];

    if (toAddresses.length === 0) {
      return {
        success: false,
        error: 'No valid email addresses provided'
      };
    }

    // Build email subject - Format: {Role Title} at {Company Name} [Placement SSB {Batch}]
    const subject = `${jobData.role} at ${jobData.company} [Placement ${jobData.batch}]`;

    // Extract JD HTML content and remove any Google Drive links
    let jdContent = jobData.jdHTML || '';

    // Remove all Google Drive links from the content
    // Pattern matches: drive.google.com, docs.google.com links
    jdContent = jdContent.replace(/<a\s+[^>]*href=["']https?:\/\/(drive|docs)\.google\.com[^"']*["'][^>]*>(.*?)<\/a>/gi, '$2');

    // Also remove standalone Drive URLs (not in anchor tags)
    jdContent = jdContent.replace(/https?:\/\/(drive|docs)\.google\.com\/[^\s<"]*/gi, '[Link removed - View on portal]');

    // Portal link - No direct Drive links
    const portalLink = `https://scaler-school-of-business.web.app/student/jobs`;

    // Build assignment section (sanitize Drive links)
    let assignmentDesc = jobData.assignmentDescription || '';
    if (assignmentDesc) {
      assignmentDesc = assignmentDesc.replace(/<a\s+[^>]*href=["']https?:\/\/(drive|docs)\.google\.com[^"']*["'][^>]*>(.*?)<\/a>/gi, '$2');
      assignmentDesc = assignmentDesc.replace(/https?:\/\/(drive|docs)\.google\.com\/[^\s<"]*/gi, '[Link removed - View on portal]');
    }

    const assignmentSection = jobData.hasAssignment === 'Yes' ? `
      <div style="background-color: #fef3c7; padding: 15px; margin: 20px 0; border-left: 4px solid #f59e0b; border-radius: 4px;">
        <p style="margin: 0; font-size: 14px;"><strong>📎 Assignment Required</strong></p>
        ${assignmentDesc ? `<p style="margin: 5px 0 0 0; font-size: 13px;">${assignmentDesc}</p>` : ''}
      </div>
    ` : '';

    // Build How to Apply section
    const howToApplySection = `
      <div style="background-color: #f0f9ff; padding: 20px; margin: 20px 0; border-radius: 8px; border: 2px solid #0ea5e9;">
        <h3 style="margin: 0 0 15px 0; color: #0369a1;">How to Apply</h3>
        <p style="margin: 0 0 10px 0;">Find the assignment card titled:</p>
        <p style="margin: 0 0 15px 0; padding: 10px; background-color: white; border-radius: 4px; font-style: italic;">
          "<strong>Placement – ${jobData.role} at ${jobData.company}</strong>"
        </p>
        <p style="margin: 0 0 10px 0;">on your Placement Dashboard and upload a single PDF document containing:</p>
        <ul style="margin: 0; padding-left: 20px;">
          <li>Cover Letter (Page 1)</li>
          <li>Resume (Page 2)</li>
        </ul>
      </div>
    `;

    // Build Application Instructions note (also sanitize Drive links)
    let instructionsContent = jobData.applicationInstructions || '';
    if (instructionsContent) {
      // Remove Google Drive links from instructions
      instructionsContent = instructionsContent.replace(/<a\s+[^>]*href=["']https?:\/\/(drive|docs)\.google\.com[^"']*["'][^>]*>(.*?)<\/a>/gi, '$2');
      instructionsContent = instructionsContent.replace(/https?:\/\/(drive|docs)\.google\.com\/[^\s<"]*/gi, '[Link removed - View on portal]');
    }

    const instructionsNote = instructionsContent ? `
      <div style="background-color: #fef2f2; padding: 20px; margin: 20px 0; border-radius: 8px; border-left: 4px solid #ef4444;">
        <h3 style="margin: 0 0 10px 0; color: #991b1b;">Note from the Placement Team:</h3>
        <div style="margin: 0; line-height: 1.8;">${instructionsContent}</div>
      </div>
    ` : '';

    // Build email body
    const htmlBody = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
          .container { max-width: 650px; margin: 0 auto; padding: 20px; }
          .greeting { font-size: 16px; margin-bottom: 20px; }
          .company-intro { font-size: 15px; margin-bottom: 25px; line-height: 1.8; }
          .jd-section { margin: 25px 0; padding: 20px; background-color: #f9fafb; border-radius: 8px; }
          .job-details { background-color: white; padding: 20px; margin: 25px 0; border-radius: 8px; border: 1px solid #e5e7eb; }
          .detail-row { padding: 8px 0; border-bottom: 1px solid #f3f4f6; }
          .detail-row:last-child { border-bottom: none; }
          .detail-label { font-weight: bold; color: #4F46E5; display: inline-block; min-width: 180px; }
          .detail-value { color: #374151; }
          .footer { margin-top: 30px; padding-top: 20px; border-top: 2px solid #e5e7eb; text-align: center; font-size: 12px; color: #6b7280; }
          a { color: #4F46E5; text-decoration: none; }
          a:hover { text-decoration: underline; }
        </style>
      </head>
      <body>
        <div class="container">
          <p class="greeting">Hello Students,</p>

          <p class="company-intro">
            <strong>${jobData.company}</strong> is hiring for the role of <strong>${jobData.role}</strong> and is open to evaluating profiles from SSB.
          </p>

          <div style="text-align: center; margin: 25px 0;">
            <a href="${portalLink}" style="display: inline-block; padding: 12px 30px; background-color: #4F46E5; color: white; text-decoration: none; border-radius: 6px; font-weight: bold;">
              View Full Job Details on Portal
            </a>
          </div>

          <div class="jd-section">
            ${jdContent}
          </div>

          <div class="job-details">
            <div class="detail-row">
              <span class="detail-label">Company:</span>
              <span class="detail-value">${jobData.company}</span>
            </div>

            <div class="detail-row">
              <span class="detail-label">Role:</span>
              <span class="detail-value">${jobData.role}</span>
            </div>

            <div class="detail-row">
              <span class="detail-label">Location & Work Mode:</span>
              <span class="detail-value">${jobData.location}, ${jobData.workMode}</span>
            </div>

            ${jobData.eligibilityMonths ? `
            <div class="detail-row">
              <span class="detail-label">Eligibility:</span>
              <span class="detail-value">${jobData.eligibilityMonths} months of experience</span>
            </div>
            ` : ''}

            ${jobData.compensationDisplay ? `
            <div class="detail-row">
              <span class="detail-label">CTC Range:</span>
              <span class="detail-value">₹${jobData.compensationDisplay}</span>
            </div>
            ` : ''}

            <div class="detail-row">
              <span class="detail-label">Application Deadline:</span>
              <span class="detail-value">${jobData.applicationEndTime}</span>
            </div>

            ${jobData.roleTags ? `
            <div class="detail-row">
              <span class="detail-label">Role Tag:</span>
              <span class="detail-value">${jobData.roleTags}</span>
            </div>
            ` : ''}
          </div>

          ${assignmentSection}

          ${howToApplySection}

          ${instructionsNote}

          <div class="footer">
            <p>This is an automated notification from SSB Placement Team</p>
            <p>© ${new Date().getFullYear()} Scaler School of Business</p>
          </div>
        </div>
      </body>
      </html>
    `;

    // Send email
    const mailOptions = {
      to: toAddresses.join(','),
      subject: subject,
      htmlBody: htmlBody,
      name: 'SSB Job Portal'
    };

    if (ccAddresses.length > 0) {
      mailOptions.cc = ccAddresses.join(',');
    }

    if (bccAddresses.length > 0) {
      mailOptions.bcc = bccAddresses.join(',');
    }

    GmailApp.sendEmail(mailOptions.to, mailOptions.subject, '', {
      htmlBody: mailOptions.htmlBody,
      name: mailOptions.name,
      cc: mailOptions.cc,
      bcc: mailOptions.bcc
    });

    return {
      success: true,
      message: 'Email sent successfully'
    };

  } catch (error) {
    Logger.log(`Error sending email: ${error.message}`);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Create a new job posting
 */
function createJobPosting(jobData) {
  try {
    Logger.log('========== CREATE JOB POSTING START ==========');
    Logger.log('Job data received:', JSON.stringify(jobData));
    Logger.log('Sheet ID:', JOB_PORTAL_SHEET_ID);
    Logger.log('Sheet Name:', JOB_PORTAL_SHEET_NAME);

    Logger.log('Opening spreadsheet...');
    const spreadsheet = SpreadsheetApp.openById(JOB_PORTAL_SHEET_ID);
    Logger.log('Spreadsheet opened successfully:', spreadsheet.getName());

    Logger.log('Getting sheet by name:', JOB_PORTAL_SHEET_NAME);
    const sheet = spreadsheet.getSheetByName(JOB_PORTAL_SHEET_NAME);

    if (!sheet) {
      Logger.log('ERROR: Sheet not found!');
      Logger.log('Available sheets:', spreadsheet.getSheets().map(s => s.getName()).join(', '));
      return {
        success: false,
        error: `Sheet "${JOB_PORTAL_SHEET_NAME}" not found. Available sheets: ${spreadsheet.getSheets().map(s => s.getName()).join(', ')}`
      };
    }

    Logger.log('Sheet found successfully:', sheet.getName());

    // Generate Job ID
    Logger.log('🆔 Generating Job ID...');
    const jobId = generateJobID(jobData.type);
    Logger.log(`🆔 Generated Job ID: ${jobId}`);

    // Create Drive folders
    Logger.log('📁 Creating Drive folders...');
    const folderResult = createJobDriveFolders(
      jobData.batch,
      jobData.company,
      jobData.role,
      jobId
    );

    if (!folderResult.success) {
      Logger.log(`❌ Drive folder creation failed: ${folderResult.error}`);
      return {
        success: false,
        error: `Drive folder creation failed: ${folderResult.error}`,
        step: 'createDriveFolders'
      };
    }
    Logger.log('✅ Drive folders created successfully');

    // Create response sheet
    Logger.log('📊 Creating response sheet...');
    const sheetResult = createJobResponseSheet(jobId, jobData.company, jobData.role, jobData.questions || [], folderResult.jobFolderId);

    if (!sheetResult.success) {
      Logger.log(`❌ Response sheet creation failed: ${sheetResult.error}`);
      return {
        success: false,
        error: `Response sheet creation failed: ${sheetResult.error}`,
        step: 'createResponseSheet'
      };
    }
    Logger.log('✅ Response sheet created successfully');

    // Prepare row data (218 columns total based on schema)
    const row = [
      jobId, // JobID
      jobData.batch || '',
      jobData.type || '',
      jobData.placementType || '',
      jobData.company || '',
      jobData.role || '',
      jobData.source || '',
      jobData.sourcePerson || '',
      jobData.companyURL || '',
      jobData.location || '',
      jobData.workMode || '',
      jobData.eligibilityMonths || '',
      jobData.requiredSkills || '',
      jobData.roleTags || '',
      jobData.status || 'Draft',
      jobData.createdBy || '',
      formatTimestampForSheets(), // CreatedDate
      '', // LastUpdatedDate
      jobData.ctcType || '',
      jobData.ctcValue || '',
      jobData.ctcValueSecondary || '',
      jobData.ctcDisplay || '',
      jobData.esopType || '',
      jobData.esopValue || '',
      jobData.esopValueSecondary || '',
      jobData.esopDisplay || '',
      jobData.bonusType || '',
      jobData.bonusValue || '',
      jobData.bonusValueSecondary || '',
      jobData.bonusDisplay || '',
      jobData.compensationDisplay || '',
      jobData.ppoOpportunity || '',
      jobData.ppoCTCRange || '',
      jobData.ppoIncludes || '',
      jobData.jdHTML || '',
      jobData.jdFileURL || '',
      jobData.applicationInstructions || '',
      jobData.adminURL1 || '',
      jobData.adminURL2 || '',
      jobData.adminURL3 || '',
      jobData.adminURL4 || '',
      jobData.adminURL5 || '',
      jobData.fileAttachmentName1 || '',
      jobData.fileAttachmentURL1 || '',
      jobData.fileAttachmentName2 || '',
      jobData.fileAttachmentURL2 || '',
      jobData.fileAttachmentName3 || '',
      jobData.fileAttachmentURL3 || '',
      formatDateForSheets(jobData.applicationStartTime),
      formatDateForSheets(jobData.applicationEndTime)
    ];

    // Add 30 questions (Q1-Q30), each with Number, Text, Type, Options, Required (5 fields × 30 = 150 fields)
    // Only populate question numbers for questions that actually exist
    for (let i = 1; i <= 30; i++) {
      const q = jobData.questions?.find(q => q.number === i) || {};
      const hasQuestion = q.text && q.text.trim() !== '';

      row.push(hasQuestion ? (q.number || i) : '');  // Empty if no question
      row.push(q.text || '');
      row.push(q.type || '');
      row.push(q.options || '');
      row.push(q.required || '');
    }

    // Add assignment fields
    row.push(jobData.hasAssignment || '');
    row.push(jobData.assignmentFileURL || '');
    row.push(jobData.assignmentDescription || '');
    row.push(jobData.assignmentDeadlineSameAsJob || '');
    row.push(jobData.assignmentDeadline || '');
    row.push(jobData.assignmentVisibility || '');

    // Add eligibility rules
    row.push(jobData.showToBatchLevels || '');
    row.push(jobData.showToNoOfferStudents || '');
    row.push(jobData.showToStudentsWithOneFT_PPO || '');
    row.push(jobData.showToStudentsWithNoPPO || '');
    row.push(jobData.showToStudentsWithInternships || '');
    row.push(jobData.showToStudentsWithZeroOffers || '');
    row.push(jobData.customVisibilityRule || '');

    // Add mail fields
    row.push(jobData.mailTo || '');
    row.push(jobData.mailCC || '');
    row.push(jobData.mailBCC || '');
    row.push(jobData.sendMail || '');

    // Add tracking columns
    row.push(0); // ApplicationsCount
    row.push(folderResult.jobFolderUrl); // DriveLink
    row.push(sheetResult.sheetUrl); // SheetsLink

    // Append the row
    sheet.appendRow(row);

    Logger.log(`Job posting created successfully: ${jobId}`);

    // Send email notification if requested
    if (jobData.sendMail === 'Yes' && jobData.mailTo) {
      Logger.log('📧 Sending email notification...');
      const emailResult = sendJobNotificationEmail(jobId, jobData);
      if (emailResult.success) {
        Logger.log('✅ Email sent successfully');
      } else {
        Logger.log(`⚠️ Email sending failed: ${emailResult.error}`);
        // Don't fail the job creation if email fails
      }
    }

    return {
      success: true,
      jobId: jobId,
      message: 'Job posting created successfully',
      data: {
        jobId: jobId,
        driveUrl: folderResult.jobFolderUrl,
        responsesSheetUrl: sheetResult.sheetUrl
      }
    };

  } catch (error) {
    Logger.log(`❌❌❌ CRITICAL ERROR in createJobPosting: ${error.message}`);
    Logger.log(`❌ Error stack: ${error.stack}`);
    return {
      success: false,
      error: `Failed to create job posting: ${error.message}`,
      errorStack: error.stack,
      step: 'createJobPosting-main'
    };
  }
}

/**
 * Get all job postings
 */
function getAllJobPostings(filters) {
  try {
    Logger.log('========== GET ALL JOB POSTINGS START ==========');
    Logger.log('Sheet ID:', JOB_PORTAL_SHEET_ID);
    Logger.log('Sheet Name:', JOB_PORTAL_SHEET_NAME);
    Logger.log('Filters:', JSON.stringify(filters));

    Logger.log('Opening spreadsheet...');
    const spreadsheet = SpreadsheetApp.openById(JOB_PORTAL_SHEET_ID);
    Logger.log('Spreadsheet opened:', spreadsheet.getName());

    Logger.log('Getting sheet by name:', JOB_PORTAL_SHEET_NAME);
    const sheet = spreadsheet.getSheetByName(JOB_PORTAL_SHEET_NAME);

    if (!sheet) {
      Logger.log('ERROR: Sheet not found!');
      Logger.log('Available sheets:', spreadsheet.getSheets().map(s => s.getName()).join(', '));
      return {
        success: false,
        error: `Sheet "${JOB_PORTAL_SHEET_NAME}" not found. Available sheets: ${spreadsheet.getSheets().map(s => s.getName()).join(', ')}`
      };
    }

    Logger.log('Sheet found:', sheet.getName());
    Logger.log('Getting data range...');
    const data = sheet.getDataRange().getValues();
    Logger.log('Data rows found:', data.length);

    if (data.length <= 1) {
      return {
        success: true,
        data: []
      };
    }

    const headers = data[0];
    const jobs = [];

    for (let i = 1; i < data.length; i++) {
      const row = data[i];

      // Skip if JobID is empty
      if (!row[0]) continue;

      const job = {
        jobId: row[0],
        batch: row[1],
        type: row[2],
        placementType: row[3],
        company: row[4],
        role: row[5],
        source: row[6],
        sourcePerson: row[7],
        companyURL: row[8],
        location: row[9],
        workMode: row[10],
        eligibilityMonths: row[11],
        requiredSkills: row[12],
        roleTags: row[13],
        status: row[14],
        createdBy: row[15],
        createdAt: row[16],
        updatedAt: row[17],
        ctcType: row[18],
        ctcValue: row[19],
        ctcValueSecondary: row[20],
        ctcDisplay: row[21],
        esopType: row[22],
        esopValue: row[23],
        esopValueSecondary: row[24],
        esopDisplay: row[25],
        bonusType: row[26],
        bonusValue: row[27],
        bonusValueSecondary: row[28],
        bonusDisplay: row[29],
        compensationDisplay: row[30],
        ppoOpportunity: row[31],
        ppoCTCRange: row[32],
        ppoIncludes: row[33],
        jdHTML: row[34],
        jdFileURL: row[35],
        applicationInstructions: row[36],
        adminURL1: row[37],
        adminURL2: row[38],
        adminURL3: row[39],
        adminURL4: row[40],
        adminURL5: row[41],
        fileAttachmentName1: row[42],
        fileAttachmentURL1: row[43],
        fileAttachmentName2: row[44],
        fileAttachmentURL2: row[45],
        fileAttachmentName3: row[46],
        fileAttachmentURL3: row[47],
        applicationStartTime: row[48],
        applicationEndTime: row[49],
        mailTo: row[213],
        mailCC: row[214],
        mailBCC: row[215],
        sendMail: row[216],
        applicationsCount: row[217],
        driveLink: row[218],
        sheetsLink: row[219],
        jdLink: row[220]
      };

      // Apply filters if provided
      if (filters) {
        if (filters.batch && job.batch !== filters.batch) continue;
        if (filters.type && job.type !== filters.type) continue;
        if (filters.status && job.status !== filters.status) continue;
      }

      jobs.push(job);
    }

    return {
      success: true,
      data: jobs
    };

  } catch (error) {
    Logger.log(`Error getting job postings: ${error.message}`);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Get single job posting by ID
 */
function getJobPosting(jobId) {
  try {
    const sheet = SpreadsheetApp.openById(JOB_PORTAL_SHEET_ID).getSheetByName(JOB_PORTAL_SHEET_NAME);
    const data = sheet.getDataRange().getValues();

    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === jobId) {
        const row = data[i];

        // Parse questions - Questions start at column 50 (Q1_Number)
        const questions = [];
        for (let q = 1; q <= 30; q++) {
          const baseIndex = 50 + (q - 1) * 5; // 5 fields per question (Number, Text, Type, Options, Required)
          const qText = row[baseIndex + 1]; // Text is second field
          if (qText) {
            questions.push({
              number: row[baseIndex],
              text: qText,
              type: row[baseIndex + 2],
              options: row[baseIndex + 3],
              required: row[baseIndex + 4]
            });
          }
        }

        return {
          success: true,
          data: {
            jobId: row[0],
            batch: row[1],
            type: row[2],
            placementType: row[3],
            company: row[4],
            role: row[5],
            source: row[6],
            sourcePerson: row[7],
            companyURL: row[8],
            location: row[9],
            workMode: row[10],
            eligibilityMonths: row[11],
            requiredSkills: row[12],
            roleTags: row[13],
            status: row[14],
            createdBy: row[15],
            createdAt: row[16],
            updatedAt: row[17],
            ctcType: row[18],
            ctcValue: row[19],
            ctcValueSecondary: row[20],
            ctcDisplay: row[21],
            esopType: row[22],
            esopValue: row[23],
            esopValueSecondary: row[24],
            esopDisplay: row[25],
            bonusType: row[26],
            bonusValue: row[27],
            bonusValueSecondary: row[28],
            bonusDisplay: row[29],
            compensationDisplay: row[30],
            ppoOpportunity: row[31],
            ppoCTCRange: row[32],
            ppoIncludes: row[33],
            jdHTML: row[34],
            jdFileURL: row[35],
            applicationInstructions: row[36],
            adminURL1: row[37],
            adminURL2: row[38],
            adminURL3: row[39],
            adminURL4: row[40],
            adminURL5: row[41],
            fileAttachmentName1: row[42],
            fileAttachmentURL1: row[43],
            fileAttachmentName2: row[44],
            fileAttachmentURL2: row[45],
            fileAttachmentName3: row[46],
            fileAttachmentURL3: row[47],
            applicationStartTime: row[48],
            applicationEndTime: row[49],
            questions: questions,
            hasAssignment: row[200],
            assignmentFileURL: row[201],
            assignmentDescription: row[202],
            assignmentDeadlineSameAsJob: row[203],
            assignmentDeadline: row[204],
            assignmentVisibility: row[205],
            showToBatchLevels: row[206],
            showToNoOfferStudents: row[207],
            showToStudentsWithOneFT_PPO: row[208],
            showToStudentsWithNoPPO: row[209],
            showToStudentsWithInternships: row[210],
            showToStudentsWithZeroOffers: row[211],
            customVisibilityRule: row[212],
            mailTo: row[213],
            mailCC: row[214],
            mailBCC: row[215],
            sendMail: row[216],
            applicationsCount: row[217],
            driveLink: row[218],
            sheetsLink: row[219],
            jdLink: row[220]
          }
        };
      }
    }

    return {
      success: false,
      error: 'Job not found'
    };

  } catch (error) {
    Logger.log(`Error getting job posting: ${error.message}`);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Update job posting
 */
function updateJobPosting(jobId, updates) {
  try {
    const sheet = SpreadsheetApp.openById(JOB_PORTAL_SHEET_ID).getSheetByName(JOB_PORTAL_SHEET_NAME);
    const data = sheet.getDataRange().getValues();

    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === jobId) {
        const rowIndex = i + 1;

        // Update basic fields (columns 2-18)
        if (updates.batch !== undefined) sheet.getRange(rowIndex, 2).setValue(updates.batch);
        if (updates.type !== undefined) sheet.getRange(rowIndex, 3).setValue(updates.type);
        if (updates.placementType !== undefined) sheet.getRange(rowIndex, 4).setValue(updates.placementType);
        if (updates.company !== undefined) sheet.getRange(rowIndex, 5).setValue(updates.company);
        if (updates.role !== undefined) sheet.getRange(rowIndex, 6).setValue(updates.role);
        if (updates.source !== undefined) sheet.getRange(rowIndex, 7).setValue(updates.source);
        if (updates.sourcePerson !== undefined) sheet.getRange(rowIndex, 8).setValue(updates.sourcePerson);
        if (updates.companyURL !== undefined) sheet.getRange(rowIndex, 9).setValue(updates.companyURL);
        if (updates.location !== undefined) sheet.getRange(rowIndex, 10).setValue(updates.location);
        if (updates.workMode !== undefined) sheet.getRange(rowIndex, 11).setValue(updates.workMode);
        if (updates.eligibilityMonths !== undefined) sheet.getRange(rowIndex, 12).setValue(updates.eligibilityMonths);
        if (updates.requiredSkills !== undefined) sheet.getRange(rowIndex, 13).setValue(updates.requiredSkills);
        if (updates.roleTags !== undefined) sheet.getRange(rowIndex, 14).setValue(updates.roleTags);
        if (updates.status !== undefined) sheet.getRange(rowIndex, 15).setValue(updates.status);

        // Update compensation fields (columns 19-31)
        if (updates.ctcType !== undefined) sheet.getRange(rowIndex, 19).setValue(updates.ctcType);
        if (updates.ctcValue !== undefined) sheet.getRange(rowIndex, 20).setValue(updates.ctcValue);
        if (updates.ctcValueSecondary !== undefined) sheet.getRange(rowIndex, 21).setValue(updates.ctcValueSecondary);
        if (updates.ctcDisplay !== undefined) sheet.getRange(rowIndex, 22).setValue(updates.ctcDisplay);
        if (updates.esopType !== undefined) sheet.getRange(rowIndex, 23).setValue(updates.esopType);
        if (updates.esopValue !== undefined) sheet.getRange(rowIndex, 24).setValue(updates.esopValue);
        if (updates.esopValueSecondary !== undefined) sheet.getRange(rowIndex, 25).setValue(updates.esopValueSecondary);
        if (updates.esopDisplay !== undefined) sheet.getRange(rowIndex, 26).setValue(updates.esopDisplay);
        if (updates.bonusType !== undefined) sheet.getRange(rowIndex, 27).setValue(updates.bonusType);
        if (updates.bonusValue !== undefined) sheet.getRange(rowIndex, 28).setValue(updates.bonusValue);
        if (updates.bonusValueSecondary !== undefined) sheet.getRange(rowIndex, 29).setValue(updates.bonusValueSecondary);
        if (updates.bonusDisplay !== undefined) sheet.getRange(rowIndex, 30).setValue(updates.bonusDisplay);
        if (updates.compensationDisplay !== undefined) sheet.getRange(rowIndex, 31).setValue(updates.compensationDisplay);

        // Update PPO fields (columns 32-34)
        if (updates.ppoOpportunity !== undefined) sheet.getRange(rowIndex, 32).setValue(updates.ppoOpportunity);
        if (updates.ppoCTCRange !== undefined) sheet.getRange(rowIndex, 33).setValue(updates.ppoCTCRange);
        if (updates.ppoIncludes !== undefined) sheet.getRange(rowIndex, 34).setValue(updates.ppoIncludes);

        // Update JD & files (columns 35-48)
        if (updates.jdHTML !== undefined) sheet.getRange(rowIndex, 35).setValue(updates.jdHTML);
        if (updates.jdFileURL !== undefined) sheet.getRange(rowIndex, 36).setValue(updates.jdFileURL);
        if (updates.applicationInstructions !== undefined) sheet.getRange(rowIndex, 37).setValue(updates.applicationInstructions);
        if (updates.adminURL1 !== undefined) sheet.getRange(rowIndex, 38).setValue(updates.adminURL1);
        if (updates.adminURL2 !== undefined) sheet.getRange(rowIndex, 39).setValue(updates.adminURL2);
        if (updates.adminURL3 !== undefined) sheet.getRange(rowIndex, 40).setValue(updates.adminURL3);
        if (updates.adminURL4 !== undefined) sheet.getRange(rowIndex, 41).setValue(updates.adminURL4);
        if (updates.adminURL5 !== undefined) sheet.getRange(rowIndex, 42).setValue(updates.adminURL5);
        if (updates.fileAttachmentName1 !== undefined) sheet.getRange(rowIndex, 43).setValue(updates.fileAttachmentName1);
        if (updates.fileAttachmentURL1 !== undefined) sheet.getRange(rowIndex, 44).setValue(updates.fileAttachmentURL1);
        if (updates.fileAttachmentName2 !== undefined) sheet.getRange(rowIndex, 45).setValue(updates.fileAttachmentName2);
        if (updates.fileAttachmentURL2 !== undefined) sheet.getRange(rowIndex, 46).setValue(updates.fileAttachmentURL2);
        if (updates.fileAttachmentName3 !== undefined) sheet.getRange(rowIndex, 47).setValue(updates.fileAttachmentName3);
        if (updates.fileAttachmentURL3 !== undefined) sheet.getRange(rowIndex, 48).setValue(updates.fileAttachmentURL3);

        // Update timeline (columns 49-50)
        if (updates.applicationStartTime !== undefined) sheet.getRange(rowIndex, 49).setValue(formatDateForSheets(updates.applicationStartTime));
        if (updates.applicationEndTime !== undefined) sheet.getRange(rowIndex, 50).setValue(formatDateForSheets(updates.applicationEndTime));

        // Update questions (columns 51-200 = 30 questions × 5 fields)
        if (updates.questions) {
          for (let q = 1; q <= 30; q++) {
            const question = updates.questions.find(qu => qu.number === q);
            const baseCol = 50 + (q - 1) * 5; // Start at column 51 (index 50)
            if (question) {
              sheet.getRange(rowIndex, baseCol + 1).setValue(question.number || q);
              sheet.getRange(rowIndex, baseCol + 2).setValue(question.text || '');
              sheet.getRange(rowIndex, baseCol + 3).setValue(question.type || '');
              sheet.getRange(rowIndex, baseCol + 4).setValue(question.options || '');
              sheet.getRange(rowIndex, baseCol + 5).setValue(question.required || '');
            } else {
              // Clear the question if not provided
              sheet.getRange(rowIndex, baseCol + 1).setValue(q);
              sheet.getRange(rowIndex, baseCol + 2).setValue('');
              sheet.getRange(rowIndex, baseCol + 3).setValue('');
              sheet.getRange(rowIndex, baseCol + 4).setValue('');
              sheet.getRange(rowIndex, baseCol + 5).setValue('');
            }
          }
        }

        // Update assignment fields (columns 201-206)
        if (updates.hasAssignment !== undefined) sheet.getRange(rowIndex, 201).setValue(updates.hasAssignment);
        if (updates.assignmentFileURL !== undefined) sheet.getRange(rowIndex, 202).setValue(updates.assignmentFileURL);
        if (updates.assignmentDescription !== undefined) sheet.getRange(rowIndex, 203).setValue(updates.assignmentDescription);
        if (updates.assignmentDeadlineSameAsJob !== undefined) sheet.getRange(rowIndex, 204).setValue(updates.assignmentDeadlineSameAsJob);
        if (updates.assignmentDeadline !== undefined) sheet.getRange(rowIndex, 205).setValue(updates.assignmentDeadline);
        if (updates.assignmentVisibility !== undefined) sheet.getRange(rowIndex, 206).setValue(updates.assignmentVisibility);

        // Update eligibility fields (columns 207-213)
        if (updates.showToBatchLevels !== undefined) sheet.getRange(rowIndex, 207).setValue(updates.showToBatchLevels);
        if (updates.showToNoOfferStudents !== undefined) sheet.getRange(rowIndex, 208).setValue(updates.showToNoOfferStudents);
        if (updates.showToStudentsWithOneFT_PPO !== undefined) sheet.getRange(rowIndex, 209).setValue(updates.showToStudentsWithOneFT_PPO);
        if (updates.showToStudentsWithNoPPO !== undefined) sheet.getRange(rowIndex, 210).setValue(updates.showToStudentsWithNoPPO);
        if (updates.showToStudentsWithInternships !== undefined) sheet.getRange(rowIndex, 211).setValue(updates.showToStudentsWithInternships);
        if (updates.showToStudentsWithZeroOffers !== undefined) sheet.getRange(rowIndex, 212).setValue(updates.showToStudentsWithZeroOffers);
        if (updates.customVisibilityRule !== undefined) sheet.getRange(rowIndex, 213).setValue(updates.customVisibilityRule);

        // Update mail fields (columns 214-217)
        if (updates.mailTo !== undefined) sheet.getRange(rowIndex, 214).setValue(updates.mailTo);
        if (updates.mailCC !== undefined) sheet.getRange(rowIndex, 215).setValue(updates.mailCC);
        if (updates.mailBCC !== undefined) sheet.getRange(rowIndex, 216).setValue(updates.mailBCC);
        if (updates.sendMail !== undefined) sheet.getRange(rowIndex, 217).setValue(updates.sendMail);

        // Update LastUpdatedDate (column 18)
        sheet.getRange(rowIndex, 18).setValue(formatTimestampForSheets());

        return {
          success: true,
          message: 'Job posting updated successfully'
        };
      }
    }

    return {
      success: false,
      error: 'Job not found'
    };

  } catch (error) {
    Logger.log(`Error updating job posting: ${error.message}`);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Delete job posting
 */
function deleteJobPosting(jobId) {
  try {
    const sheet = SpreadsheetApp.openById(JOB_PORTAL_SHEET_ID).getSheetByName(JOB_PORTAL_SHEET_NAME);
    const data = sheet.getDataRange().getValues();

    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === jobId) {
        sheet.deleteRow(i + 1);

        return {
          success: true,
          message: 'Job posting deleted successfully'
        };
      }
    }

    return {
      success: false,
      error: 'Job not found'
    };

  } catch (error) {
    Logger.log(`Error deleting job posting: ${error.message}`);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Upload a file to the job's Drive folder
 * @param {Object} params - Upload parameters
 * @param {string} params.jobId - The job ID
 * @param {string} params.fileData - Base64 encoded file data
 * @param {string} params.fileName - Original file name
 * @param {string} params.mimeType - File MIME type
 * @param {string} params.fileType - Type of file: 'jd' or 'attachment'
 * @return {Object} Result with fileUrl
 */
function uploadJobFile(params) {
  try {
    Logger.log('========== UPLOAD JOB FILE START ==========');
    Logger.log('Job ID:', params.jobId);
    Logger.log('File Name:', params.fileName);
    Logger.log('File Type:', params.fileType);
    Logger.log('MIME Type:', params.mimeType);

    const { jobId, fileData, fileName, mimeType, fileType } = params;

    if (!jobId || !fileData || !fileName) {
      return {
        success: false,
        error: 'Missing required parameters: jobId, fileData, or fileName'
      };
    }

    // Get job details to find Drive folder
    const sheet = SpreadsheetApp.openById(JOB_PORTAL_SHEET_ID).getSheetByName(JOB_PORTAL_SHEET_NAME);
    const data = sheet.getDataRange().getValues();

    let driveLink = null;
    let rowIndex = -1;

    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === jobId) {
        driveLink = data[i][218]; // DriveLink is in column 218
        rowIndex = i + 1; // Sheet rows are 1-indexed
        break;
      }
    }

    if (!driveLink) {
      return {
        success: false,
        error: `Job ${jobId} not found or has no Drive folder`
      };
    }

    // Extract folder ID from Drive link
    const folderIdMatch = driveLink.match(/folders\/([a-zA-Z0-9_-]+)/);
    if (!folderIdMatch) {
      return {
        success: false,
        error: 'Could not extract folder ID from Drive link'
      };
    }

    const jobFolderId = folderIdMatch[1];
    Logger.log('Job folder ID:', jobFolderId);

    const jobFolder = DriveApp.getFolderById(jobFolderId);

    // Get or create JobFileUploads subfolder
    const uploadFolder = getOrCreateFolder(jobFolder, 'JobFileUploads');
    Logger.log('Upload folder:', uploadFolder.getName());

    // Decode base64 file data
    const fileBlob = Utilities.newBlob(
      Utilities.base64Decode(fileData),
      mimeType,
      fileName
    );

    // Upload file to Drive
    const uploadedFile = uploadFolder.createFile(fileBlob);
    Logger.log('File uploaded successfully:', uploadedFile.getId());

    // Make file accessible
    uploadedFile.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

    const fileUrl = uploadedFile.getUrl();
    Logger.log('File URL:', fileUrl);

    // If this is a JD file, update the JDLink column (220)
    if (fileType === 'jd' && rowIndex > 0) {
      Logger.log('Updating JDLink column for JD file');
      sheet.getRange(rowIndex, 221).setValue(fileUrl); // Column 220 (0-indexed) = column 221 (1-indexed)
    }

    return {
      success: true,
      data: {
        fileUrl: fileUrl,
        fileId: uploadedFile.getId(),
        fileName: uploadedFile.getName()
      }
    };

  } catch (error) {
    Logger.log(`Error uploading job file: ${error.message}`);
    Logger.log('Error stack:', error.stack);
    return {
      success: false,
      error: error.message
    };
  }
}
