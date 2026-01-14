/**
 * Admin Exam Builder Page
 * Create and edit exams with 5 tabs:
 * 1. Basic Details
 * 2. Questions
 * 3. Settings
 * 4. Password Setup
 * 5. Preview
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, Eye, CheckCircle, X } from 'lucide-react';
import {
  createExam,
  updateExam,
  getExamById,
  publishExam,
  validateExam,
  type Exam,
  type Question,
  type ExamSettings
} from '../../services/examApi';
import BasicDetailsTab from '../../components/exam-builder/BasicDetailsTab';
import QuestionsTab from '../../components/exam-builder/QuestionsTab';
import SettingsTab from '../../components/exam-builder/SettingsTab';
import PasswordTab from '../../components/exam-builder/PasswordTab';
import PreviewTab from '../../components/exam-builder/PreviewTab';

type TabId = 'basic' | 'questions' | 'settings' | 'password' | 'preview';

interface Tab {
  id: TabId;
  label: string;
  completed: boolean;
}

const ExamBuilderPage: React.FC = () => {
  const navigate = useNavigate();
  const { examId } = useParams<{ examId?: string }>();
  const isEditMode = !!examId;

  const [activeTab, setActiveTab] = useState<TabId>('basic');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showUnsavedModal, setShowUnsavedModal] = useState(false);
  const [pendingTab, setPendingTab] = useState<TabId | null>(null);
  const [savedExamData, setSavedExamData] = useState<Partial<Exam> | null>(null);

  // Modal states
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Exam data
  const [examData, setExamData] = useState<Partial<Exam>>({
    status: 'DRAFT',
    passwordType: 'SAME',
    settings: {
      randomizeQuestions: false,
      randomizeOptions: false,
      enableRoughSpace: true,
      enableNegativeMarking: false,
      negativeMarkingType: 'exam',
      negativeMarksValue: 0,
      showResultsImmediately: false,
      showCorrectAnswers: false,
      autoSubmitOnTimeUp: true,
      gracePeriod: 10,
      proctoring: {
        webcamRequired: true,
        enforceScreensharing: true,
        allowWindowSwitching: false,
        alertsOnViolation: true,
        beepAlerts: false,
        allowTextSelection: false,
        allowCopyPaste: false,
        allowRightClick: false,
        allowRestrictedEvents: false,
        allowTabSwitching: false,
        exitCloseWarnings: true,
        fullscreenMandatory: true,
        singleSessionLogin: true,
        logoutOnViolation: false,
        disqualifyOnViolation: true,
        maxViolationsBeforeAction: 5,
        allowedIPs: [],
        ipRestrictionEnabled: false
      }
    },
    questions: []
  });

  const [tabs, setTabs] = useState<Tab[]>([
    { id: 'basic', label: 'Basic Details', completed: false },
    { id: 'questions', label: 'Questions', completed: false },
    { id: 'settings', label: 'Settings', completed: false },
    { id: 'password', label: 'Password Setup', completed: false },
    { id: 'preview', label: 'Preview', completed: false }
  ]);

  // Load exam if editing
  useEffect(() => {
    if (isEditMode && examId) {
      loadExam();
    }
  }, [examId]);

  const loadExam = async () => {
    try {
      setLoading(true);
      const response = await getExamById(examId!);
      if (response.success && response.data) {
        const exam = response.data;
        const loadedData = {
          ...exam,
          examId: exam['Exam ID'] || exam.examId,
          examTitle: exam['Exam Title'] || exam.examTitle,
          examType: exam['Exam Type'] || exam.examType,
          batch: exam.Batch || exam.batch,
          term: exam.Term || exam.term,
          domain: exam.Domain || exam.domain,
          subject: exam.Subject || exam.subject,
          description: exam.Description || exam.description,
          duration: exam['Duration (minutes)'] || exam.duration,
          totalMarks: exam['Total Marks'] || exam.totalMarks,
          passingMarks: exam['Passing Marks'] || exam.passingMarks,
          startDateTime: exam['Start DateTime'] || exam.startDateTime,
          endDateTime: exam['End DateTime'] || exam.endDateTime,
          instructions: exam.Instructions || exam.instructions,
          status: exam.Status || exam.status,
          passwordType: exam['Password Type'] || exam.passwordType,
          masterPassword: exam['Master Password'] || exam.masterPassword,
          isPractice: exam['Is Practice'] === 'Yes' || exam.isPractice === true,
          settings: exam.settings || examData.settings,
          questions: exam.questions || []
        };
        setExamData(loadedData);
        setSavedExamData({ ...loadedData }); // Set initial saved state
        updateTabCompletion(exam);
      }
    } catch (error) {
      console.error('Failed to load exam:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateTabCompletion = (data: Partial<Exam>) => {
    const newTabs = [...tabs];

    // Basic Details - Instructions now required, passing marks optional, batch required
    newTabs[0].completed = !!(
      data.examTitle &&
      data.examType &&
      data.batch &&
      data.term &&
      data.domain &&
      data.subject &&
      data.duration &&
      data.totalMarks &&
      data.startDateTime &&
      data.endDateTime &&
      data.instructions &&
      data.instructions.trim().length > 0
    );

    // Questions
    newTabs[1].completed = (data.questions?.length || 0) > 0;

    // Settings (always completed as it has defaults)
    newTabs[2].completed = true;

    // Password
    newTabs[3].completed = !!(
      data.passwordType === 'SAME' ? data.masterPassword : true
    );

    // Preview (completed when ready to publish)
    newTabs[4].completed = newTabs[0].completed && newTabs[1].completed && newTabs[3].completed;

    setTabs(newTabs);
  };

  const handleDataChange = (updates: Partial<Exam>) => {
    const newData = { ...examData, ...updates };
    setExamData(newData);

    // Check if there are actual changes from saved state
    if (savedExamData) {
      const hasChanges = JSON.stringify(newData) !== JSON.stringify(savedExamData);
      setHasUnsavedChanges(hasChanges);
    } else {
      // If no saved state yet, consider it changed
      setHasUnsavedChanges(true);
    }

    updateTabCompletion(newData);
  };

  const handleSaveDraft = async () => {
    try {
      setSaving(true);

      if (isEditMode && examData.examId) {
        const response = await updateExam(examData.examId, examData);
        if (response.success) {
          setSavedExamData({ ...examData }); // Update saved state
          setHasUnsavedChanges(false);
          // Show success message
          setSuccessMessage('Draft saved successfully!');
          setShowSuccessModal(true);
          setTimeout(() => {
            setShowSuccessModal(false);
          }, 2000);
        } else {
          throw new Error(response.message || 'Failed to save draft');
        }
      } else {
        const response = await createExam(examData);
        if (response.success) {
          const savedData = { ...examData, examId: response.examId };
          setSavedExamData(savedData); // Update saved state
          setHasUnsavedChanges(false);
          // Show success message
          setSuccessMessage('Draft created successfully! Redirecting to edit mode...');
          setShowSuccessModal(true);
          setTimeout(() => {
            setShowSuccessModal(false);
            // Redirect to edit mode
            navigate(`/admin/exams/edit/${response.examId}`);
          }, 1500);
        } else {
          throw new Error(response.message || 'Failed to create draft');
        }
      }
    } catch (error: any) {
      console.error('Failed to save draft:', error);
      setErrorMessage(error.message || 'Failed to save draft. Please try again.');
      setShowErrorModal(true);
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async () => {
    try {
      // Validate exam
      const validation = validateExam(examData);
      if (!validation.valid) {
        setErrorMessage('Please fix the following errors:\n\n' + validation.errors.map(err => `• ${err}`).join('\n'));
        setShowErrorModal(true);
        return;
      }

      setSaving(true);

      let currentExamId = examData.examId;

      // Save first if new
      if (!isEditMode || !currentExamId) {
        console.log('Creating exam with data:', { ...examData, status: 'ACTIVE' });
        const createResponse = await createExam({ ...examData, status: 'ACTIVE' });
        console.log('Create exam response:', createResponse);
        if (!createResponse.success) {
          throw new Error(createResponse.message || 'Failed to create exam');
        }
        currentExamId = createResponse.examId;
      } else {
        // Update exam data first, then publish
        const updateResponse = await updateExam(currentExamId, { ...examData, status: 'ACTIVE', publishedAt: new Date().toISOString() });
        if (!updateResponse.success) {
          throw new Error(updateResponse.message || 'Failed to update exam');
        }
      }

      setHasUnsavedChanges(false);
      // Show success message
      setSuccessMessage('Exam published successfully! Students can now see it.');
      setShowSuccessModal(true);
      setTimeout(() => {
        navigate('/admin/exams');
      }, 2000);
    } catch (error) {
      console.error('Failed to publish exam:', error);
      setErrorMessage('Failed to publish exam. Please try again.');
      setShowErrorModal(true);
    } finally {
      setSaving(false);
    }
  };

  const handleTabChange = (tabId: TabId) => {
    if (hasUnsavedChanges) {
      setPendingTab(tabId);
      setShowUnsavedModal(true);
    } else {
      setActiveTab(tabId);
    }
  };

  const handleSaveAndSwitch = async () => {
    await handleSaveDraft();
    setShowUnsavedModal(false);
    if (pendingTab) {
      setActiveTab(pendingTab);
      setPendingTab(null);
    }
  };

  const handleDiscardAndSwitch = () => {
    setShowUnsavedModal(false);
    setHasUnsavedChanges(false);
    if (pendingTab) {
      // Revert to saved data
      if (savedExamData) {
        setExamData({ ...savedExamData });
      }
      setActiveTab(pendingTab);
      setPendingTab(null);
    }
  };

  const handleCancelSwitch = () => {
    setShowUnsavedModal(false);
    setPendingTab(null);
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'basic':
        return <BasicDetailsTab data={examData} onChange={handleDataChange} />;
      case 'questions':
        return (
          <QuestionsTab
            questions={(examData.questions || []) as any}
            onQuestionsChange={(questions: any) => handleDataChange({ questions })}
            examSettings={examData.settings}
            totalMarks={examData.totalMarks}
            onAutoSwitchNegativeMarking={() => {
              // Auto-switch to question-based negative marking when a question has negative marks
              handleDataChange({
                settings: {
                  ...examData.settings,
                  enableNegativeMarking: true,
                  negativeMarkingType: 'question'
                } as ExamSettings
              });
            }}
          />
        );
      case 'settings':
        return (
          <SettingsTab
            settings={(examData.settings || {}) as any}
            onSettingsChange={(settings: ExamSettings) => handleDataChange({ settings })}
          />
        );
      case 'password':
        return (
          <PasswordTab
            passwordType={examData.passwordType || 'SAME'}
            masterPassword={examData.masterPassword || ''}
            onPasswordTypeChange={(passwordType: string) => handleDataChange({ passwordType: passwordType as any })}
            onMasterPasswordChange={(masterPassword: string) => handleDataChange({ masterPassword })}
            examData={examData}
          />
        );
      case 'preview':
        return <PreviewTab examData={examData} onPublish={handlePublish} />;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/admin/exams')}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {isEditMode ? 'Edit Exam' : 'Create New Exam'}
                </h1>
                {examData.examTitle && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {examData.examTitle}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleSaveDraft}
                disabled={saving}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 font-medium transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                {saving ? 'Saving...' : 'Save as Draft'}
              </button>
              <button
                onClick={handlePublish}
                disabled={saving || !tabs[4].completed}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <CheckCircle className="w-4 h-4" />
                {examData.status === 'ACTIVE'
                  ? 'Update Published Exam'
                  : examData.status === 'DRAFT' && isEditMode
                  ? 'Publish Exam'
                  : 'Publish Exam'}
              </button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex gap-1 border-b border-gray-200 dark:border-gray-700">
            {tabs
              .filter(tab => {
                // Hide Settings and Password tabs for Practice Mode
                if ((examData as any).isPractice === true) {
                  return tab.id !== 'settings' && tab.id !== 'password';
                }
                return true;
              })
              .map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`px-6 py-3 font-medium text-sm relative transition-colors ${
                  activeTab === tab.id
                    ? 'text-green-600 dark:text-green-400'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <span className="flex items-center gap-2">
                  {tab.label}
                  {tab.completed && (
                    <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                  )}
                </span>
                {activeTab === tab.id && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-green-600 dark:bg-green-400" />
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {renderTabContent()}
      </div>

      {/* Unsaved Changes Warning */}
      {hasUnsavedChanges && (
        <div className="fixed bottom-4 right-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 shadow-lg">
          <p className="text-sm text-yellow-800 dark:text-yellow-200">
            You have unsaved changes
          </p>
        </div>
      )}

      {/* Unsaved Changes Modal */}
      {showUnsavedModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Unsaved Changes
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
              You have unsaved changes. Do you want to save them before switching tabs?
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={handleCancelSwitch}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDiscardAndSwitch}
                className="px-4 py-2 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
              >
                Discard Changes
              </button>
              <button
                onClick={handleSaveAndSwitch}
                disabled={saving}
                className="px-4 py-2 text-sm font-medium bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                {saving ? 'Saving...' : 'Save & Continue'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Error Modal */}
      {showErrorModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
            <div className="flex items-start gap-3 mb-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
                <X className="w-5 h-5 text-red-600 dark:text-red-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Error
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-line">
                  {errorMessage}
                </p>
              </div>
            </div>
            <div className="flex justify-end">
              <button
                onClick={() => setShowErrorModal(false)}
                className="px-4 py-2 text-sm font-medium bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
            <div className="flex items-start gap-3 mb-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Success
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {successMessage}
                </p>
              </div>
            </div>
            <div className="flex justify-end">
              <button
                onClick={() => {
                  setShowSuccessModal(false);
                  // Only navigate if it's a publish success (not draft save)
                  if (successMessage.includes('published')) {
                    navigate('/admin/exams');
                  }
                }}
                className="px-4 py-2 text-sm font-medium bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExamBuilderPage;
