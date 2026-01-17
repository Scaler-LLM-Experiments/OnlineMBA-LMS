import React, { useState } from 'react';
import { Key, Users, Download, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

interface PasswordTabProps {
  passwordType: string;
  masterPassword: string;
  onPasswordTypeChange: (type: string) => void;
  onMasterPasswordChange: (password: string) => void;
  examData?: any; // Full exam data including batch, examId
}

export default function PasswordTab({
  passwordType,
  masterPassword,
  onPasswordTypeChange,
  onMasterPasswordChange,
  examData
}: PasswordTabProps) {
  const [generatingPasswords, setGeneratingPasswords] = useState(false);
  const [passwordsGenerated, setPasswordsGenerated] = useState(false);
  const [generationError, setGenerationError] = useState('');
  const [studentCount, setStudentCount] = useState(0);

  const generateRandomPassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let password = '';
    for (let i = 0; i < 8; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    onMasterPasswordChange(password);
  };

  const generateUniquePasswords = async () => {
    if (!examData?.examId || !examData?.batch) {
      setGenerationError('Please save the exam and set the batch before generating passwords');
      return;
    }

    try {
      setGeneratingPasswords(true);
      setGenerationError('');

      // Call backend to generate and save passwords
      const examBackendUrl = process.env.REACT_APP_EXAM_BACKEND_URL || '';
      const response = await fetch(
        examBackendUrl,
        {
          method: 'POST',
          mode: 'cors',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            action: 'generateAndSavePasswords',
            examId: examData.examId,
            passwordType: 'UNIQUE',
            batchName: examData.batch
          })
        }
      );

      const result = await response.json();

      if (result.success) {
        setPasswordsGenerated(true);
        setStudentCount(result.count || 0);
        setTimeout(() => setPasswordsGenerated(false), 5000);
      } else {
        setGenerationError(result.message || 'Failed to generate passwords');
      }
    } catch (error) {
      console.error('Error generating passwords:', error);
      setGenerationError('Failed to generate passwords. Please try again.');
    } finally {
      setGeneratingPasswords(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-2">Password Management</h3>
        <p className="text-sm text-muted-foreground">
          Configure how students will access this exam
        </p>
      </div>

      {/* Password Type Selection */}
      <div className="space-y-4">
        <label className="block">
          <div className="flex items-center gap-3 p-4 border-2 border-border rounded-lg hover:border-primary/50 transition-colors cursor-pointer">
            <input
              type="radio"
              name="passwordType"
              value="SAME"
              checked={passwordType === 'SAME'}
              onChange={(e) => onPasswordTypeChange(e.target.value)}
              className="w-5 h-5"
            />
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <Key className="w-4 h-4 text-primary" />
                <p className="font-medium text-foreground">Same Password for All</p>
              </div>
              <p className="text-sm text-muted-foreground">
                All students use the same master password to access the exam
              </p>
            </div>
          </div>
        </label>

        <label className="block">
          <div className="flex items-center gap-3 p-4 border-2 border-border rounded-lg hover:border-primary/50 transition-colors cursor-pointer">
            <input
              type="radio"
              name="passwordType"
              value="UNIQUE"
              checked={passwordType === 'UNIQUE'}
              onChange={(e) => onPasswordTypeChange(e.target.value)}
              className="w-5 h-5"
            />
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <Users className="w-4 h-4 text-primary" />
                <p className="font-medium text-foreground">Unique Password per Student</p>
              </div>
              <p className="text-sm text-muted-foreground">
                Generate unique passwords for each student
              </p>
            </div>
          </div>
        </label>
      </div>

      {/* Master Password Section */}
      {passwordType === 'SAME' && (
        <div className="p-6 border border-border rounded-lg bg-secondary/5">
          <label className="block mb-4">
            <span className="text-sm font-medium text-foreground">Master Password</span>
            <div className="flex gap-2 mt-2">
              <input
                type="text"
                value={masterPassword}
                onChange={(e) => onMasterPasswordChange(e.target.value)}
                placeholder="Enter master password"
                className="flex-1 px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <button
                type="button"
                onClick={generateRandomPassword}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
              >
                Generate
              </button>
            </div>
          </label>
          <p className="text-xs text-muted-foreground">
            This password will be shared with all students to access the exam
          </p>
        </div>
      )}

      {/* Unique Password Section */}
      {passwordType === 'UNIQUE' && (
        <div className="p-6 border border-border rounded-lg bg-secondary/5 space-y-4">
          <div>
            <p className="text-sm font-medium text-foreground mb-2">
              Automatic Password Generation
            </p>
            <p className="text-xs text-muted-foreground mb-4">
              Passwords will be automatically generated for all students in the batch from the Batch List.
            </p>
          </div>

          {/* Generate Passwords Button */}
          <div>
            <button
              onClick={generateUniquePasswords}
              disabled={generatingPasswords || !examData?.examId || !examData?.batch}
              className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {generatingPasswords ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Generating Passwords...
                </>
              ) : (
                <>
                  <Key className="w-4 h-4" />
                  Generate Unique Passwords
                </>
              )}
            </button>
            {!examData?.examId && (
              <p className="text-xs text-orange-600 dark:text-orange-400 mt-2">
                Please save the exam as draft first before generating passwords
              </p>
            )}
            {!examData?.batch && examData?.examId && (
              <p className="text-xs text-orange-600 dark:text-orange-400 mt-2">
                Please set the batch in Basic Details before generating passwords
              </p>
            )}
          </div>

          {/* Success Message */}
          {passwordsGenerated && (
            <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-green-900 dark:text-green-100">
                  Passwords Generated Successfully!
                </p>
                <p className="text-xs text-green-700 dark:text-green-300 mt-1">
                  {studentCount} unique passwords have been generated and saved to the Exam_Passwords sheet.
                </p>
              </div>
            </div>
          )}

          {/* Error Message */}
          {generationError && (
            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-red-900 dark:text-red-100">
                  Error Generating Passwords
                </p>
                <p className="text-xs text-red-700 dark:text-red-300 mt-1">
                  {generationError}
                </p>
              </div>
            </div>
          )}

          <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
            <p className="text-sm text-blue-600 dark:text-blue-400">
              Click "Generate Unique Passwords" to create individual passwords for each student in the batch. Passwords will be stored in the Exam_Passwords sheet and can be downloaded or emailed to students.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
