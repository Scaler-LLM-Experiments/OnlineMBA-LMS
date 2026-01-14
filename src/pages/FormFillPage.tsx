import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { auth } from '../firebase/config';
import { Button } from '../components/ui/button';
import {
  Check,
  X,
  Star,
  Heart,
  Smile,
  Upload,
  Calendar as CalendarIcon,
  Link2,
  ArrowRight,
  ArrowLeft,
  Mail,
  Phone,
  MapPin,
  Users,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { getFormById, submitFormResponse, uploadStudentFile, type Question, getAvailableStudentsForQuestion, type Student, getStudentGroupStatus, validateGroupMembers, getUserFormResponses } from '../services/formsApi';
import { useActivityTracker } from '../hooks/useActivityTracker';

interface FormData {
  id: string;
  name: string;
  description: string;
  type: string;
  batch: string;
  confirmationMessage: string;
}

interface Response {
  [questionId: string]: any;
}

export function FormFillPage() {
  const { formId } = useParams<{ formId: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<FormData | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [responses, setResponses] = useState<Response>({});
  const [submitting, setSubmitting] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [startTime] = useState<number>(Date.now());
  const [groupSelectionStatus, setGroupSelectionStatus] = useState<Record<string, { isFilled: boolean; groupMembers: string[]; availableStudentsCount?: number }>>({});
  const [groupSelectionRefreshCallbacks, setGroupSelectionRefreshCallbacks] = useState<Record<string, () => void>>({});
  const inputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { trackFormInteraction } = useActivityTracker();

  const user = auth.currentUser;

  useEffect(() => {
    if (formId && user?.email) {
      fetchForm();
    }
  }, [formId, user]);

  // Auto-focus input when question changes
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    } else if (textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [currentIndex]);

  const fetchForm = async () => {
    if (!formId) return;

    try {
      setLoading(true);
      const result = await getFormById(formId);

      if (result.success && result.data) {
        const formData = result.data.form as any;
        setForm(formData);

        // Sort questions by order
        const sortedQuestions = (result.data.questions || []).sort((a, b) => (a.questionOrder || a.order || 0) - (b.questionOrder || b.order || 0));
        console.log('🔍 Loaded questions:', sortedQuestions);
        sortedQuestions.forEach(q => {
          console.log(`🔍 Question ${q.questionText}: isRequired = "${q.isRequired}" (type: ${typeof q.isRequired})`);
        });
        setQuestions(sortedQuestions);

        // Check if user has already submitted this form
        const userResponsesResult = await getUserFormResponses(formId);

        if (userResponsesResult.success && userResponsesResult.data && userResponsesResult.data.length > 0) {
          const completedResponses = userResponsesResult.data.filter(r => r.isComplete === 'Yes');
          const userResponseCount = completedResponses.length;

          console.log('📝 User has', userResponseCount, 'completed response(s) for this form');

          const allowEditResponse = formData.allowEditResponse === 'Yes';
          const maxResponses = formData.maxResponsesPerUser || 1;

          // Case 1: User can edit their response - load existing data
          if (allowEditResponse && userResponseCount > 0) {
            console.log('✏️ Loading existing response for editing...');
            const latestResponse = completedResponses[0];
            if (latestResponse.responseData) {
              setResponses(latestResponse.responseData);
              toast('Editing your previous response', { icon: '✏️' });
            }
          }
          // Case 2: User has reached max submissions - block access
          else if (userResponseCount >= maxResponses) {
            console.log('🚫 User has reached max submissions, blocking access');
            toast.error('You have already completed this form');
            setIsComplete(true);
            return;
          }
          // Case 3: User can submit more responses (maxResponses > userResponseCount)
          else {
            console.log('✅ User can submit another response');
          }
        }

        // Track form opened
        trackFormInteraction(formData.name, 'opened');
      } else {
        toast.error(result.error || 'Failed to load form');
        navigate('/forms');
      }
    } catch (error) {
      console.error('Error fetching form:', error);
      toast.error('Error loading form');
      navigate('/forms');
    } finally {
      setLoading(false);
    }
  };

  const currentQuestion = questions[currentIndex];
  const progress = questions.length > 0 ? ((currentIndex + 1) / questions.length) * 100 : 0;

  // Check if a question should be visible based on conditional logic
  const isQuestionVisible = (question: Question): boolean => {
    // Always show Start Screen and End Screen
    if (question.questionType === 'Start Screen' || question.questionType === 'End Screen') {
      return true;
    }

    // Check if question has conditional logic with "show" or "hide" actions
    const hasConditionalLogic = question.hasConditionalLogic === 'Yes' || question.hasConditionalLogic === true;
    const conditionalRules = question.conditionalRules || [];

    if (!hasConditionalLogic || conditionalRules.length === 0) {
      // No conditional logic, always show
      return true;
    }

    console.log(`🔍 Checking conditional logic for "${question.questionText}":`, {
      hasConditionalLogic,
      rulesCount: conditionalRules.length,
      rules: conditionalRules
    });

    // Check each rule
    for (const rule of conditionalRules) {
      const action = rule.action?.toLowerCase();

      // Only handle show/hide actions here
      if (action !== 'show' && action !== 'hide') {
        continue;
      }

      // Get the question that the rule references (by index)
      const targetIndex = parseInt(rule.questionIndex);
      if (isNaN(targetIndex) || targetIndex < 0 || targetIndex >= questions.length) {
        console.warn(`⚠️ Invalid target index: ${rule.questionIndex}`);
        continue;
      }

      const targetQuestion = questions[targetIndex];
      const targetQuestionKey = targetQuestion.questionId || targetQuestion.id;
      const targetResponse = responses[targetQuestionKey];

      console.log(`  🔍 Rule: targetIndex=${targetIndex}, operator="${rule.operator}", value=${rule.value}, response=${targetResponse}`);

      // Evaluate the rule condition
      const conditionMet = evaluateRuleCondition(rule.operator, rule.value, targetResponse);

      console.log(`  ${conditionMet ? '✅' : '❌'} Condition ${conditionMet ? 'MET' : 'NOT MET'} - Action: ${action}`);

      // Apply the action
      if (action === 'show') {
        // Show only if condition is met
        if (conditionMet) {
          console.log(`  ✅ SHOWING question`);
          return true;
        }
      } else if (action === 'hide') {
        // Hide if condition is met
        if (conditionMet) {
          console.log(`  ❌ HIDING question`);
          return false;
        }
      }
    }

    // Default behavior:
    // - If there are "show" rules and none matched, hide the question
    // - If there are only "hide" rules and none matched, show the question
    const hasShowRules = conditionalRules.some(r => r.action?.toLowerCase() === 'show');
    const result = !hasShowRules;
    console.log(`  Default: hasShowRules=${hasShowRules}, result=${result ? 'SHOW' : 'HIDE'}`);
    return result;
  };

  // Evaluate a single rule condition
  const evaluateRuleCondition = (operator: string, ruleValue: any, response: any): boolean => {
    // Normalize operator to handle both snake_case and title case with spaces
    const normalizedOp = operator?.toLowerCase().replace(/\s+/g, '_');

    switch (normalizedOp) {
      case 'equals':
      case 'is':
        return String(response) === String(ruleValue);

      case 'not_equals':
      case 'is_not':
        return String(response) !== String(ruleValue);

      case 'contains':
        if (Array.isArray(response)) {
          return response.includes(ruleValue);
        }
        return String(response).toLowerCase().includes(String(ruleValue).toLowerCase());

      case 'does_not_contain':
        if (Array.isArray(response)) {
          return !response.includes(ruleValue);
        }
        return !String(response).toLowerCase().includes(String(ruleValue).toLowerCase());

      case 'greater_than':
        return parseFloat(response) > parseFloat(ruleValue);

      case 'less_than':
        return parseFloat(response) < parseFloat(ruleValue);

      case 'greater_than_or_equal':
        return parseFloat(response) >= parseFloat(ruleValue);

      case 'less_than_or_equal':
        return parseFloat(response) <= parseFloat(ruleValue);

      case 'is_empty':
      case 'is_blank':
        return !response || response === '' || (Array.isArray(response) && response.length === 0);

      case 'is_not_empty':
      case 'is_not_blank':
        return !!response && response !== '' && (!Array.isArray(response) || response.length > 0);

      case 'starts_with':
        return String(response).toLowerCase().startsWith(String(ruleValue).toLowerCase());

      case 'ends_with':
        return String(response).toLowerCase().endsWith(String(ruleValue).toLowerCase());

      default:
        console.warn(`Unknown operator: ${operator} (normalized: ${normalizedOp})`);
        return false;
    }
  };

  const handleNext = async () => {
    const current = questions[currentIndex];
    const questionKey = current.questionId || current.id;

    // Validate Group Selection min/max (must come before general required check)
    if (current.questionType === 'Group Selection') {
      // Check if group is already filled by someone else (read-only view)
      const groupStatus = groupSelectionStatus[questionKey];
      if (groupStatus?.isFilled && groupStatus?.groupMembers?.length > 0) {
        // Bypass validation - group already formed by someone else
        console.log('✅ Group Selection bypassing validation - already filled by someone else');
        // Ensure the group members are in responses for submission
        if (!responses[questionKey]) {
          setResponses(prev => ({
            ...prev,
            [questionKey]: groupStatus.groupMembers
          }));
        }
        // Continue to next question
      } else {
        // Normal validation for users who need to fill the group
        const selectedStudents = responses[questionKey] || [];
        const minSize = current.minGroupSize || 3;
        const maxSize = current.maxGroupSize || 5;

        console.log('🔍 Group Selection validation:', {
          questionText: current.questionText,
          isRequired: current.isRequired,
          isRequiredType: typeof current.isRequired,
          selectedCount: selectedStudents.length,
          minSize,
          maxSize
        });

        // Check if required (handle both boolean true and string 'Yes')
        const isRequired = (current.isRequired as any) === true || (current.isRequired as any) === 'Yes' || (current.isRequired as any) === 'TRUE';
        if (isRequired && selectedStudents.length === 0) {
          toast.error('This question is required');
          return;
        }

        // Get available students count for this question
        const availableStudentsCount = groupSelectionStatus[questionKey]?.availableStudentsCount;

        console.log('🔍 Group Selection Validation Debug:', {
          questionKey,
          availableStudentsCount,
          minSize,
          selectedCount: selectedStudents.length,
          groupSelectionStatus: groupSelectionStatus
        });

        // Calculate effective minimum - bypass minimum requirement if only 3 or fewer students available
        const effectiveMinSize = availableStudentsCount !== undefined && availableStudentsCount <= minSize
          ? availableStudentsCount
          : minSize;

        console.log('✅ Effective minimum size:', effectiveMinSize);

        if (selectedStudents.length > 0 && selectedStudents.length < effectiveMinSize) {
          if (availableStudentsCount !== undefined && availableStudentsCount <= minSize) {
            toast.error(`Please select all ${availableStudentsCount} remaining students for your group`);
          } else {
            toast.error(`Please select at least ${minSize} students for your group`);
          }
          return;
        }

        if (selectedStudents.length > maxSize) {
          toast.error(`Please select no more than ${maxSize} students for your group`);
          return;
        }

        // Backend validation - check if selected members are still available
        if (selectedStudents.length > 0) {
          const loadingToast = toast.loading('Validating group members...');

          try {
            const validationResult = await validateGroupMembers(
              formId || '',
              questionKey,
              selectedStudents
            );

            console.log('🔍 Full validation result:', validationResult);

            toast.dismiss(loadingToast);

            // Log debug info from backend
            if (validationResult.data?.debugLog) {
              console.log('🔍 Backend Validation Debug:');
              validationResult.data.debugLog.forEach((log: string) => console.log(log));
            } else {
              console.log('⚠️ No debugLog in validation result');
            }

            if (!validationResult.success || !validationResult.data?.available) {
              const unavailableMembers = validationResult.data?.unavailableMembers || [];
              const message = validationResult.data?.message || 'Some selected group members are no longer available';

              toast.error(message);

              // Clear the invalid selection
              setResponses(prev => ({
                ...prev,
                [questionKey]: []
              }));

              // Trigger refresh of available students
              if (groupSelectionRefreshCallbacks[questionKey]) {
                groupSelectionRefreshCallbacks[questionKey]();
              }

              return; // Stay on current question
            }
          } catch (error: any) {
            toast.dismiss(loadingToast);
            toast.error('Failed to validate group members. Please try again.');
            return;
          }
        }
      }
    }
    // Validate required fields for other question types
    else {
      const isRequired = (current.isRequired as any) === true || (current.isRequired as any) === 'Yes' || (current.isRequired as any) === 'TRUE';
      if (isRequired) {
        const response = responses[questionKey];

        // Check if response is empty or only whitespace for text-based inputs
        if (current.questionType === 'Short Text' || current.questionType === 'Long Text') {
          const trimmedResponse = typeof response === 'string' ? response.trim() : '';

          if (!trimmedResponse) {
            toast.error('This question is required');
            return;
          }

          // Minimum character requirement for required fields
          const minChars = 100;
          if (trimmedResponse.length < minChars) {
            toast.error(`Please enter at least ${minChars} characters`);
            return;
          }
        } else if (!response) {
          // For other question types, just check if response exists
          toast.error('This question is required');
          return;
        }
      }
    }

    // Find next visible question
    let nextIndex = currentIndex + 1;
    while (nextIndex < questions.length && !isQuestionVisible(questions[nextIndex])) {
      nextIndex++;
    }

    // Check if this is the last question OR next question is End Screen
    if (nextIndex >= questions.length) {
      handleSubmit();
    } else if (questions[nextIndex]?.questionType === 'End Screen') {
      // Submit form before showing End Screen
      handleSubmit();
      setCurrentIndex(nextIndex);
    } else {
      setCurrentIndex(nextIndex);
    }
  };

  // Evaluate conditional logic rules for current question
  const evaluateConditionalLogic = (question: Question, currentResponse: any): number => {
    // Check if question has conditional logic
    const hasConditionalLogic = question.hasConditionalLogic === 'Yes' || question.hasConditionalLogic === true;
    const conditionalRules = question.conditionalRules || [];

    if (!hasConditionalLogic || conditionalRules.length === 0) {
      // No conditional logic, proceed to next question
      return currentIndex + 1;
    }

    // Sort rules by order
    const sortedRules = [...conditionalRules].sort((a: any, b: any) => (a.order || 0) - (b.order || 0));

    // Evaluate each rule
    for (const rule of sortedRules) {
      if (evaluateRule(rule, currentResponse)) {
        // Rule matched, execute action
        return executeRuleAction(rule);
      }
    }

    // No rules matched, proceed normally
    return currentIndex + 1;
  };

  // Evaluate a single conditional rule
  const evaluateRule = (rule: any, response: any): boolean => {
    const operator = rule.operator;
    const ruleValue = rule.value;

    // Normalize operator to handle both snake_case and Title Case
    const normalizedOperator = operator.toLowerCase().replace(/\s+/g, '_');

    // Handle different operators
    switch (normalizedOperator) {
      case 'equals':
      case 'is':
        return String(response) === String(ruleValue);

      case 'not_equals':
      case 'is_not':
        return String(response) !== String(ruleValue);

      case 'contains':
        if (Array.isArray(response)) {
          return response.includes(ruleValue);
        }
        return String(response).toLowerCase().includes(String(ruleValue).toLowerCase());

      case 'does_not_contain':
        if (Array.isArray(response)) {
          return !response.includes(ruleValue);
        }
        return !String(response).toLowerCase().includes(String(ruleValue).toLowerCase());

      case 'greater_than':
        return parseFloat(response) > parseFloat(ruleValue);

      case 'less_than':
        return parseFloat(response) < parseFloat(ruleValue);

      case 'greater_than_or_equal':
        return parseFloat(response) >= parseFloat(ruleValue);

      case 'less_than_or_equal':
        return parseFloat(response) <= parseFloat(ruleValue);

      case 'is_empty':
      case 'is_blank':
        return !response || response === '' || (Array.isArray(response) && response.length === 0);

      case 'is_not_empty':
      case 'is_not_blank':
        return !!response && response !== '' && (!Array.isArray(response) || response.length > 0);

      case 'starts_with':
        return String(response).toLowerCase().startsWith(String(ruleValue).toLowerCase());

      case 'ends_with':
        return String(response).toLowerCase().endsWith(String(ruleValue).toLowerCase());

      default:
        console.warn(`Unknown operator: ${operator}`);
        return false;
    }
  };

  // Execute the action specified in the rule
  const executeRuleAction = (rule: any): number => {
    const action = rule.action;
    const targetIndex = parseInt(rule.questionIndex);

    switch (action) {
      case 'Jump to':
      case 'Go to':
        // Jump to specific question by index
        if (!isNaN(targetIndex) && targetIndex >= 0 && targetIndex < questions.length) {
          return targetIndex;
        }
        console.warn(`Invalid target index: ${targetIndex}`);
        return currentIndex + 1;

      case 'Skip':
      case 'Skip Next':
        // Skip next question
        return currentIndex + 2;

      case 'Skip to End':
      case 'Submit':
        // Jump to last question (which will trigger submit)
        return questions.length - 1;

      case 'Show':
      case 'Hide':
        // These actions would require different implementation
        // For now, proceed normally
        console.warn(`Action '${action}' not yet implemented for navigation`);
        return currentIndex + 1;

      default:
        console.warn(`Unknown action: ${action}`);
        return currentIndex + 1;
    }
  };

  const handlePrevious = () => {
    // Find previous visible question
    let prevIndex = currentIndex - 1;
    while (prevIndex >= 0 && !isQuestionVisible(questions[prevIndex])) {
      prevIndex--;
    }

    if (prevIndex >= 0) {
      setCurrentIndex(prevIndex);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleNext();
    }
  };

  const updateResponse = (questionId: string, value: any) => {
    setResponses(prev => ({
      ...prev,
      [questionId]: value
    }));
  };

  const handleSubmit = async () => {
    if (!formId) {
      console.error('❌ No formId!');
      return;
    }

    try {
      setSubmitting(true);

      // DEBUG: Log what we're sending
      console.log('🔍 SUBMITTING FORM:');
      console.log('Form ID:', formId);
      console.log('Responses object:', responses);
      console.log('Number of responses:', Object.keys(responses).length);

      // STEP 1: Upload all files first
      const processedResponses = { ...responses };
      const fileUploadPromises: Promise<void>[] = [];

      for (const questionId in responses) {
        const question = questions.find(q => q.id === questionId);
        const answer = responses[questionId];

        // Check if this is a file upload question
        if (question?.questionType === 'File Upload' && answer instanceof File) {
          console.log('📎 Found file upload for question:', questionId, 'File:', answer.name);

          // Create upload promise
          const uploadPromise = (async () => {
            try {
              const uploadResult = await uploadStudentFile(formId, answer, user?.displayName || user?.email || 'Unknown');

              if (uploadResult.success && uploadResult.data?.fileUrl) {
                // Replace File object with URL
                processedResponses[questionId] = uploadResult.data.fileUrl;
                console.log('✅ File uploaded successfully:', uploadResult.data.fileUrl);
              } else {
                console.error('❌ File upload failed:', uploadResult.error);
                throw new Error(uploadResult.error || 'File upload failed');
              }
            } catch (error) {
              console.error('❌ Error uploading file:', error);
              throw error;
            }
          })();

          fileUploadPromises.push(uploadPromise);
        }
      }

      // Wait for all file uploads to complete
      if (fileUploadPromises.length > 0) {
        console.log(`⏳ Uploading ${fileUploadPromises.length} file(s)...`);
        await Promise.all(fileUploadPromises);
        console.log('✅ All files uploaded successfully');
      }

      // STEP 2: Calculate completion time in seconds
      const completionTimeSeconds = Math.floor((Date.now() - startTime) / 1000);

      // STEP 3: Submit form response with file URLs
      console.log('📤 Submitting form with processed responses:', processedResponses);
      const result = await submitFormResponse(formId, processedResponses, completionTimeSeconds);

      // DEBUG: Log result
      console.log('📥 BACKEND RESULT:', result);

      if (result.success) {
        toast.success('Form submitted successfully!');
        setIsComplete(true);

        // Track form submission
        if (form) {
          trackFormInteraction(form.name, 'submitted');
        }

        // Check for redirect URL question
        const redirectQuestion = questions.find(q => q.questionType === 'Redirect to URL');
        if (redirectQuestion && redirectQuestion.redirectUrl) {
          // Redirect after a brief delay
          setTimeout(() => {
            window.location.href = redirectQuestion.redirectUrl!;
          }, 2000);
        }
      } else {
        // Handle specific error cases
        if (result.error === 'FORM_EXPIRED') {
          toast.error(
            <div>
              <p className="font-semibold">Form Deadline Passed</p>
              <p className="text-sm mt-1">{result.message || 'This form is no longer accepting submissions.'}</p>
            </div>,
            { duration: 6000 }
          );
          // Redirect back to forms after showing error
          setTimeout(() => navigate('/forms'), 3000);
        } else if (result.error === 'GROUP_MEMBERS_UNAVAILABLE') {
          toast.error(
            <div>
              <p className="font-semibold">Group Members No Longer Available</p>
              <p className="text-sm mt-1">{result.message}</p>
              <p className="text-sm mt-2 font-medium">
                Unavailable: {(result as any).unavailableMembers?.join(', ')}
              </p>
              <p className="text-sm mt-2">Please go back and select different members.</p>
            </div>,
            { duration: 8000 }
          );
        } else {
          toast.error(result.error || 'Failed to submit form');
        }
        console.error('❌ Submission failed:', result.error);
      }
    } catch (error) {
      console.error('❌ Error submitting form:', error);
      toast.error('Failed to submit form');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading form...</p>
        </div>
      </div>
    );
  }

  if (isComplete) {
    return (
      <div className="bg-gradient-to-br from-green-50 via-background to-green-100 dark:from-green-950/20 dark:via-background dark:to-green-900/20 border border-border rounded-lg p-12 min-h-[600px] flex items-center justify-center">
        <div className="max-w-2xl w-full text-center space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto">
            <Check className="h-10 w-10 text-green-600 dark:text-green-400" />
          </div>
          <h1 className="text-4xl font-bold text-foreground">Thank you!</h1>
          <p className="text-xl text-muted-foreground">
            {form?.confirmationMessage || 'Your response has been recorded.'}
          </p>
          <button
            onClick={() => navigate('/forms')}
            className="mt-8 px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          >
            Back to Forms
          </button>
        </div>
      </div>
    );
  }

  if (!currentQuestion) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">No questions found in this form.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Form Header with Name and Description */}
      <div className="bg-background border border-border rounded-lg shadow-sm overflow-hidden">
        {/* Progress Bar */}
        <div className="h-2 bg-gray-200 dark:bg-gray-800">
          <div
            className="h-full bg-primary transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="px-6 py-5">
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1 min-w-0">
              <h2 className="text-2xl font-bold text-foreground">{form?.name}</h2>
              {form?.description && (
                <p className="text-muted-foreground mt-2">{form.description}</p>
              )}
            </div>
            <div className="flex-shrink-0 flex items-center gap-3">
              <div className="text-sm font-medium text-muted-foreground bg-muted rounded-lg px-4 py-2">
                Question {currentIndex + 1} of {questions.length}
              </div>
              <button
                onClick={() => navigate('/forms')}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors px-3 py-2 rounded-md hover:bg-muted"
              >
                Exit
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="bg-gradient-to-br from-primary/5 via-background to-primary/10 border border-border rounded-lg p-8 md:p-12 min-h-[600px] flex flex-col">
        <div className="flex-1 flex items-center justify-center">
          <div className="max-w-3xl w-full">
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-300" key={currentIndex}>
              <QuestionRenderer
                question={currentQuestion}
                value={responses[currentQuestion.questionId || currentQuestion.id]}
                onChange={(value) => updateResponse(currentQuestion.questionId || currentQuestion.id, value)}
                onKeyPress={handleKeyPress}
                inputRef={inputRef}
                textareaRef={textareaRef}
                onNext={handleNext}
                formId={formId}
                setGroupSelectionStatus={setGroupSelectionStatus}
                setGroupSelectionRefreshCallbacks={setGroupSelectionRefreshCallbacks}
              />
            </div>

            {/* Navigation Buttons - Hidden for Start Screen and End Screen */}
            {currentQuestion.questionType !== 'Start Screen' && currentQuestion.questionType !== 'End Screen' && (
              <>
                <div className="flex items-center justify-between mt-8">
                  <button
                    onClick={handlePrevious}
                    disabled={currentIndex === 0}
                    className="flex items-center gap-2 px-4 py-2 text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    <ArrowLeft className="h-5 w-5" />
                    Previous
                  </button>

                  <button
                    onClick={handleNext}
                    disabled={submitting}
                    className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-all shadow-lg hover:shadow-xl"
                  >
                    {submitting ? (
                      'Submitting...'
                    ) : (() => {
                      // Check if next question is End Screen or we're at the last question
                      let nextIndex = currentIndex + 1;
                      while (nextIndex < questions.length && !isQuestionVisible(questions[nextIndex])) {
                        nextIndex++;
                      }
                      const nextQuestion = questions[nextIndex];
                      const isLastOrBeforeEndScreen = nextIndex >= questions.length || nextQuestion?.questionType === 'End Screen';

                      return isLastOrBeforeEndScreen ? (
                        <>
                          Submit <Check className="h-5 w-5" />
                        </>
                      ) : (
                        <>
                          Next <ArrowRight className="h-5 w-5" />
                        </>
                      );
                    })()}
                  </button>
                </div>

                {/* Keyboard Hint */}
                <div className="mt-4 text-center text-sm text-muted-foreground">
                  Press <kbd className="px-2 py-1 bg-muted rounded">Enter ↵</kbd> to continue
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Question Renderer Component
// ============================================================================

interface QuestionRendererProps {
  question: Question;
  value: any;
  onChange: (value: any) => void;
  onKeyPress: (e: React.KeyboardEvent) => void;
  inputRef: React.RefObject<HTMLInputElement | null>;
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
  onNext?: () => void;
  formId?: string;
  setGroupSelectionStatus?: React.Dispatch<React.SetStateAction<Record<string, { isFilled: boolean; groupMembers: string[] }>>>;
  setGroupSelectionRefreshCallbacks?: React.Dispatch<React.SetStateAction<Record<string, () => void>>>;
}

function QuestionRenderer({ question, value, onChange, onKeyPress, inputRef, textareaRef, onNext, formId, setGroupSelectionStatus, setGroupSelectionRefreshCallbacks }: QuestionRendererProps) {
  const isStartOrEndScreen = question.questionType === 'Start Screen' || question.questionType === 'End Screen';

  return (
    <div className="space-y-6">
      {/* Question Number - Hide for Start/End Screen */}
      {!isStartOrEndScreen && (
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-primary">
            {question.questionOrder || question.order}
          </span>
          <ArrowRight className="h-4 w-4 text-primary" />
        </div>
      )}

      {/* Question Text */}
      <h2 className={`font-bold text-foreground leading-tight ${isStartOrEndScreen ? 'text-4xl md:text-5xl text-center' : 'text-3xl md:text-4xl'}`}>
        {question.questionText}
        {question.isRequired === 'Yes' && !isStartOrEndScreen && (
          <span className="text-red-500 ml-2">*</span>
        )}
      </h2>

      {/* Question Description - Always show if present */}
      {question.questionDescription && (
        <div className={`bg-muted/50 rounded-lg p-4 border-l-4 border-primary ${isStartOrEndScreen ? 'text-center' : ''}`}>
          <p className="text-lg text-foreground leading-relaxed whitespace-pre-wrap">
            {question.questionDescription}
          </p>
        </div>
      )}

      {/* Question Input based on type */}
      <div className="mt-8">
        {renderQuestionInput(question, value, onChange, onKeyPress, inputRef, textareaRef, onNext, formId, setGroupSelectionStatus, setGroupSelectionRefreshCallbacks)}
      </div>
    </div>
  );
}

// ============================================================================
// Render Question Input by Type
// ============================================================================

function renderQuestionInput(
  question: Question,
  value: any,
  onChange: (value: any) => void,
  onKeyPress: (e: React.KeyboardEvent) => void,
  inputRef: React.RefObject<HTMLInputElement | null>,
  textareaRef: React.RefObject<HTMLTextAreaElement | null>,
  onNext?: () => void,
  formId?: string,
  setGroupSelectionStatus?: React.Dispatch<React.SetStateAction<Record<string, { isFilled: boolean; groupMembers: string[] }>>>,
  setGroupSelectionRefreshCallbacks?: React.Dispatch<React.SetStateAction<Record<string, () => void>>>
) {
  const type = question.questionType;

  switch (type) {
    case 'Start Screen':
      return <StartScreenInput onChange={onChange} onNext={onNext} />;

    case 'Short Text':
      return <ShortTextInput value={value} onChange={onChange} onKeyPress={onKeyPress} inputRef={inputRef} placeholder={question.placeholderText} />;

    case 'Long Text':
      return <LongTextInput value={value} onChange={onChange} textareaRef={textareaRef} placeholder={question.placeholderText} />;

    case 'Email':
      return <EmailInput value={value} onChange={onChange} onKeyPress={onKeyPress} inputRef={inputRef} />;

    case 'Phone Number':
      return <PhoneInput value={value} onChange={onChange} onKeyPress={onKeyPress} inputRef={inputRef} />;

    case 'Number':
      return <NumberInput value={value} onChange={onChange} onKeyPress={onKeyPress} inputRef={inputRef} question={question} />;

    case 'Yes/No':
      return <YesNoInput value={value} onChange={onChange} />;

    case 'Multiple Choice':
      return <MultipleChoiceInput value={value} onChange={onChange} question={question} />;

    case 'Dropdown':
      return <DropdownInput value={value} onChange={onChange} question={question} />;

    case 'Checkboxes':
      return <CheckboxesInput value={value} onChange={onChange} question={question} />;

    case 'Rating':
      return <RatingInput value={value} onChange={onChange} question={question} />;

    case 'Opinion Scale':
      return <OpinionScaleInput value={value} onChange={onChange} question={question} />;

    case 'NPS':
      return <NPSInput value={value} onChange={onChange} />;

    case 'Date':
      return <DateInput value={value} onChange={onChange} onKeyPress={onKeyPress} inputRef={inputRef} />;

    case 'File Upload':
      return <FileUploadInput value={value} onChange={onChange} question={question} />;

    case 'Website':
      return <WebsiteInput value={value} onChange={onChange} onKeyPress={onKeyPress} inputRef={inputRef} />;

    case 'Contact Info':
      return <ContactInfoInput value={value} onChange={onChange} question={question} />;

    case 'Address':
      return <AddressInput value={value} onChange={onChange} textareaRef={textareaRef} />;

    case 'Legal':
      return <LegalInput value={value} onChange={onChange} question={question} />;

    case 'Statement':
      return <StatementInput question={question} onChange={onChange} />;

    case 'End Screen':
      return <EndScreenInput question={question} />;

    case 'Picture Choice':
      return <PictureChoiceInput value={value} onChange={onChange} question={question} />;

    case 'Video and Audio':
      return <VideoAndAudioInput value={value} onChange={onChange} question={question} />;

    case 'Razorpay / Payment link':
      return <RazorpayInput value={value} onChange={onChange} question={question} />;

    case 'Google Drive':
      return <GoogleDriveInput value={value} onChange={onChange} question={question} />;

    case 'Calendly':
      return <CalendlyInput value={value} onChange={onChange} question={question} />;

    case 'Ranking':
      return <RankingInput value={value} onChange={onChange} question={question} />;

    case 'Matrix':
      return <MatrixInput value={value} onChange={onChange} question={question} />;

    case 'Partial Submit Point':
      return <PartialSubmitPointInput onChange={onChange} />;

    case 'Redirect to URL':
      return <RedirectToURLInput question={question} onChange={onChange} />;

    case 'Group Selection':
      return (
        <GroupSelectionInput
          value={value}
          onChange={onChange}
          question={question}
          formId={formId || ''}
          onGroupStatusChange={setGroupSelectionStatus ? (status: { isFilled: boolean; groupMembers: string[]; availableStudentsCount?: number }) => {
            const questionKey = question.questionId || question.id;
            setGroupSelectionStatus(prev => ({
              ...prev,
              [questionKey]: { ...prev[questionKey], ...status }
            }));
          } : undefined}
          onRegisterRefresh={setGroupSelectionRefreshCallbacks ? (callback: () => void) => {
            const questionKey = question.questionId || question.id;
            setGroupSelectionRefreshCallbacks(prev => ({
              ...prev,
              [questionKey]: callback
            }));
          } : undefined}
        />
      );

    default:
      return (
        <div className="text-muted-foreground">
          Question type "{type}" is not yet implemented. Coming soon!
        </div>
      );
  }
}

// ============================================================================
// Individual Question Type Components
// ============================================================================

// Start Screen
function StartScreenInput({ onChange, onNext }: { onChange: (value: any) => void; onNext?: () => void }) {
  const handleStart = () => {
    onChange('started');
    // Navigate to next question after a brief delay for smooth transition
    setTimeout(() => {
      if (onNext) onNext();
    }, 300);
  };

  return (
    <div className="flex items-center justify-center">
      <button
        onClick={handleStart}
        className="px-8 py-4 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-all text-lg font-medium shadow-lg hover:shadow-xl flex items-center gap-3"
      >
        Start <ArrowRight className="h-5 w-5" />
      </button>
    </div>
  );
}

// Short Text Input
function ShortTextInput({
  value,
  onChange,
  onKeyPress,
  inputRef,
  placeholder
}: {
  value: string;
  onChange: (value: string) => void;
  onKeyPress: (e: React.KeyboardEvent) => void;
  inputRef: React.RefObject<HTMLInputElement | null>;
  placeholder?: string;
}) {
  const minLength = 100;
  // Count only non-whitespace characters
  const currentLength = (value || '').replace(/\s/g, '').length;
  const isBelowMin = currentLength < minLength;
  const progressPercent = Math.min((currentLength / minLength) * 100, 100);

  return (
    <div className="space-y-2">
      <input
        ref={inputRef}
        type="text"
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        onKeyPress={onKeyPress}
        placeholder={placeholder || 'Type your answer here...'}
        className="w-full text-2xl bg-transparent border-b-2 border-muted-foreground/30 focus:border-primary outline-none py-3 text-foreground placeholder:text-muted-foreground/50 transition-colors"
      />
      <div className="space-y-2">
        <div className="flex justify-between items-center text-sm">
          <span className={`transition-colors ${
            isBelowMin
              ? 'text-orange-600 dark:text-orange-400 font-medium'
              : 'text-green-600 dark:text-green-400 font-medium'
          }`}>
            {currentLength} characters (spaces not counted)
          </span>
          {isBelowMin && (
            <span className="text-orange-600 dark:text-orange-400 text-xs">
              {minLength - currentLength} more needed (min: {minLength})
            </span>
          )}
          {!isBelowMin && (
            <span className="text-green-600 dark:text-green-400 text-xs">
              ✓ Minimum reached
            </span>
          )}
        </div>
        {/* Progress bar */}
        <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-300 ${
              isBelowMin ? 'bg-orange-500' : 'bg-green-500'
            }`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>
    </div>
  );
}

// Long Text Input
function LongTextInput({
  value,
  onChange,
  textareaRef,
  placeholder
}: {
  value: string;
  onChange: (value: string) => void;
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
  placeholder?: string;
}) {
  const minLength = 100;
  // Count only non-whitespace characters
  const currentLength = (value || '').replace(/\s/g, '').length;
  const isBelowMin = currentLength < minLength;
  const progressPercent = Math.min((currentLength / minLength) * 100, 100);

  return (
    <div className="space-y-2">
      <textarea
        ref={textareaRef}
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder || 'Type your answer here...'}
        rows={6}
        className="w-full text-xl bg-background border-2 border-muted-foreground/30 focus:border-primary outline-none rounded-lg p-4 text-foreground placeholder:text-muted-foreground/50 transition-colors resize-none"
      />
      <div className="space-y-2 px-1">
        <div className="flex justify-between items-center text-sm">
          <span className={`transition-colors ${
            isBelowMin
              ? 'text-orange-600 dark:text-orange-400 font-medium'
              : 'text-green-600 dark:text-green-400 font-medium'
          }`}>
            {currentLength} characters (spaces not counted)
          </span>
          {isBelowMin && (
            <span className="text-orange-600 dark:text-orange-400 text-xs">
              {minLength - currentLength} more needed (min: {minLength})
            </span>
          )}
          {!isBelowMin && (
            <span className="text-green-600 dark:text-green-400 text-xs">
              ✓ Minimum reached
            </span>
          )}
        </div>
        {/* Progress bar */}
        <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-300 ${
              isBelowMin ? 'bg-orange-500' : 'bg-green-500'
            }`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>
    </div>
  );
}

// Email Input
function EmailInput({
  value,
  onChange,
  onKeyPress,
  inputRef
}: {
  value: string;
  onChange: (value: string) => void;
  onKeyPress: (e: React.KeyboardEvent) => void;
  inputRef: React.RefObject<HTMLInputElement | null>;
}) {
  return (
    <div className="relative">
      <Mail className="absolute left-0 top-3 h-6 w-6 text-muted-foreground" />
      <input
        ref={inputRef}
        type="email"
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        onKeyPress={onKeyPress}
        placeholder="name@example.com"
        className="w-full text-2xl bg-transparent border-b-2 border-muted-foreground/30 focus:border-primary outline-none py-3 pl-10 text-foreground placeholder:text-muted-foreground/50 transition-colors"
      />
    </div>
  );
}

// Phone Input
function PhoneInput({
  value,
  onChange,
  onKeyPress,
  inputRef
}: {
  value: string;
  onChange: (value: string) => void;
  onKeyPress: (e: React.KeyboardEvent) => void;
  inputRef: React.RefObject<HTMLInputElement | null>;
}) {
  return (
    <div className="relative">
      <Phone className="absolute left-0 top-3 h-6 w-6 text-muted-foreground" />
      <input
        ref={inputRef}
        type="tel"
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        onKeyPress={onKeyPress}
        placeholder="+1 (555) 000-0000"
        className="w-full text-2xl bg-transparent border-b-2 border-muted-foreground/30 focus:border-primary outline-none py-3 pl-10 text-foreground placeholder:text-muted-foreground/50 transition-colors"
      />
    </div>
  );
}

// Number Input
function NumberInput({
  value,
  onChange,
  onKeyPress,
  inputRef,
  question
}: {
  value: number;
  onChange: (value: number) => void;
  onKeyPress: (e: React.KeyboardEvent) => void;
  inputRef: React.RefObject<HTMLInputElement | null>;
  question: Question;
}) {
  return (
    <input
      ref={inputRef}
      type="number"
      value={value || ''}
      onChange={(e) => onChange(parseFloat(e.target.value))}
      onKeyPress={onKeyPress}
      min={question.minValue}
      max={question.maxValue}
      placeholder="Enter a number..."
      className="w-full text-2xl bg-transparent border-b-2 border-muted-foreground/30 focus:border-primary outline-none py-3 text-foreground placeholder:text-muted-foreground/50 transition-colors"
    />
  );
}

// Yes/No Input
function YesNoInput({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return (
    <div className="flex gap-4">
      <button
        onClick={() => onChange('Yes')}
        className={`flex-1 py-6 rounded-xl border-2 transition-all text-xl font-medium ${
          value === 'Yes'
            ? 'border-green-500 bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-300 shadow-lg'
            : 'border-muted-foreground/30 hover:border-green-500/50 text-muted-foreground hover:text-foreground'
        }`}
      >
        <Check className="h-6 w-6 mx-auto mb-2" />
        Yes
      </button>
      <button
        onClick={() => onChange('No')}
        className={`flex-1 py-6 rounded-xl border-2 transition-all text-xl font-medium ${
          value === 'No'
            ? 'border-red-500 bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-300 shadow-lg'
            : 'border-muted-foreground/30 hover:border-red-500/50 text-muted-foreground hover:text-foreground'
        }`}
      >
        <X className="h-6 w-6 mx-auto mb-2" />
        No
      </button>
    </div>
  );
}

// Multiple Choice Input
function MultipleChoiceInput({ value, onChange, question }: { value: any; onChange: (value: any) => void; question: Question }) {
  const options = question.options || [];
  const allowMultiple = question.allowMultipleSelections === 'Yes';

  const handleSelect = (optionValue: string) => {
    if (allowMultiple) {
      const currentValues = Array.isArray(value) ? value : [];
      if (currentValues.includes(optionValue)) {
        onChange(currentValues.filter((v: string) => v !== optionValue));
      } else {
        onChange([...currentValues, optionValue]);
      }
    } else {
      onChange(optionValue);
    }
  };

  const isSelected = (optionValue: string) => {
    if (allowMultiple) {
      return Array.isArray(value) && value.includes(optionValue);
    }
    return value === optionValue;
  };

  return (
    <div className="space-y-3">
      {options.map((option, index) => (
        <button
          key={index}
          onClick={() => handleSelect(option.optionText)}
          className={`w-full text-left px-6 py-4 rounded-xl border-2 transition-all text-lg ${
            isSelected(option.optionText)
              ? 'border-primary bg-primary/10 text-foreground shadow-lg'
              : 'border-muted-foreground/30 hover:border-primary/50 text-muted-foreground hover:text-foreground'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
              isSelected(option.optionText) ? 'border-primary bg-primary' : 'border-muted-foreground/50'
            }`}>
              {isSelected(option.optionText) && <Check className="h-4 w-4 text-primary-foreground" />}
            </div>
            <span className="flex-1">{option.optionText}</span>
          </div>
        </button>
      ))}
    </div>
  );
}

// Dropdown Input
function DropdownInput({ value, onChange, question }: { value: string; onChange: (value: string) => void; question: Question }) {
  const options = question.options || [];

  return (
    <select
      value={value || ''}
      onChange={(e) => onChange(e.target.value)}
      className="w-full text-xl bg-background border-2 border-muted-foreground/30 focus:border-primary outline-none rounded-lg px-4 py-3 text-foreground transition-colors"
    >
      <option value="">Select an option...</option>
      {options.map((option, index) => (
        <option key={index} value={option.optionText}>
          {option.optionText}
        </option>
      ))}
    </select>
  );
}

// Checkboxes Input
function CheckboxesInput({ value, onChange, question }: { value: string[]; onChange: (value: string[]) => void; question: Question }) {
  const options = question.options || [];

  const handleToggle = (optionValue: string) => {
    const currentValues = Array.isArray(value) ? value : [];
    if (currentValues.includes(optionValue)) {
      onChange(currentValues.filter(v => v !== optionValue));
    } else {
      onChange([...currentValues, optionValue]);
    }
  };

  const isChecked = (optionValue: string) => Array.isArray(value) && value.includes(optionValue);

  return (
    <div className="space-y-3">
      {options.map((option, index) => (
        <button
          key={index}
          onClick={() => handleToggle(option.optionText)}
          className={`w-full text-left px-6 py-4 rounded-xl border-2 transition-all text-lg ${
            isChecked(option.optionText)
              ? 'border-primary bg-primary/10 text-foreground shadow-lg'
              : 'border-muted-foreground/30 hover:border-primary/50 text-muted-foreground hover:text-foreground'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className={`w-6 h-6 rounded border-2 flex items-center justify-center ${
              isChecked(option.optionText) ? 'border-primary bg-primary' : 'border-muted-foreground/50'
            }`}>
              {isChecked(option.optionText) && <Check className="h-4 w-4 text-primary-foreground" />}
            </div>
            <span className="flex-1">{option.optionText}</span>
          </div>
        </button>
      ))}
    </div>
  );
}

// Rating Input (Stars/Hearts/Smiley)
function RatingInput({ value, onChange, question }: { value: number; onChange: (value: number) => void; question: Question }) {
  const ratingType = question.ratingType || 'star';
  const ratingScale = parseInt(question.ratingScale || '5');

  const Icon = ratingType === 'heart' ? Heart : ratingType === 'smiley' ? Smile : Star;

  return (
    <div className="flex gap-4 justify-center">
      {Array.from({ length: ratingScale }, (_, i) => i + 1).map((rating) => (
        <button
          key={rating}
          onClick={() => onChange(rating)}
          onMouseEnter={(e) => {
            // Preview hover effect
            const buttons = e.currentTarget.parentElement?.querySelectorAll('button');
            buttons?.forEach((btn, idx) => {
              if (idx < rating) {
                btn.classList.add('scale-110');
              } else {
                btn.classList.remove('scale-110');
              }
            });
          }}
          className={`transition-all duration-200 ${
            value >= rating ? 'scale-110' : 'scale-100 opacity-40'
          }`}
        >
          <Icon
            className={`h-12 w-12 md:h-16 md:w-16 ${
              value >= rating
                ? 'fill-yellow-400 text-yellow-400'
                : 'fill-muted text-muted-foreground'
            }`}
          />
        </button>
      ))}
    </div>
  );
}

// Opinion Scale Input
function OpinionScaleInput({ value, onChange, question }: { value: number; onChange: (value: number) => void; question: Question }) {
  const min = parseInt(question.scaleMin || '1');
  const max = parseInt(question.scaleMax || '5');
  const minLabel = question.scaleMinLabel || '';
  const maxLabel = question.scaleMaxLabel || '';

  return (
    <div className="space-y-4">
      <div className="flex gap-2 justify-center">
        {Array.from({ length: max - min + 1 }, (_, i) => min + i).map((num) => (
          <button
            key={num}
            onClick={() => onChange(num)}
            className={`w-14 h-14 rounded-lg border-2 transition-all text-lg font-medium ${
              value === num
                ? 'border-primary bg-primary text-primary-foreground shadow-lg scale-110'
                : 'border-muted-foreground/30 hover:border-primary/50 text-muted-foreground hover:text-foreground'
            }`}
          >
            {num}
          </button>
        ))}
      </div>
      {(minLabel || maxLabel) && (
        <div className="flex justify-between text-sm text-muted-foreground px-2">
          <span>{minLabel}</span>
          <span>{maxLabel}</span>
        </div>
      )}
    </div>
  );
}

// NPS Input (0-10 scale)
function NPSInput({ value, onChange }: { value: number; onChange: (value: number) => void }) {
  return (
    <div className="space-y-4">
      <div className="flex gap-2 flex-wrap justify-center">
        {Array.from({ length: 10 }, (_, i) => i + 1).map((num) => (
          <button
            key={num}
            onClick={() => onChange(num)}
            className={`w-12 h-12 rounded-lg border-2 transition-all text-lg font-medium ${
              value === num
                ? 'border-primary bg-primary text-primary-foreground shadow-lg scale-110'
                : 'border-muted-foreground/30 hover:border-primary/50 text-muted-foreground hover:text-foreground'
            }`}
          >
            {num}
          </button>
        ))}
      </div>
      <div className="flex justify-between text-sm text-muted-foreground px-2">
        <span>Not likely</span>
        <span>Extremely likely</span>
      </div>
    </div>
  );
}

// Date Input
function DateInput({
  value,
  onChange,
  onKeyPress,
  inputRef
}: {
  value: string;
  onChange: (value: string) => void;
  onKeyPress: (e: React.KeyboardEvent) => void;
  inputRef: React.RefObject<HTMLInputElement | null>;
}) {
  return (
    <div className="relative">
      <CalendarIcon className="absolute left-0 top-3 h-6 w-6 text-muted-foreground" />
      <input
        ref={inputRef}
        type="date"
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        onKeyPress={onKeyPress}
        className="w-full text-2xl bg-transparent border-b-2 border-muted-foreground/30 focus:border-primary outline-none py-3 pl-10 text-foreground transition-colors"
      />
    </div>
  );
}

// File Upload Input
function FileUploadInput({ value, onChange, question }: { value: File; onChange: (value: File) => void; question: Question }) {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onChange(file);
    }
  };

  return (
    <div className="border-2 border-dashed border-muted-foreground/30 rounded-xl p-12 text-center hover:border-primary/50 transition-colors cursor-pointer">
      <input
        type="file"
        onChange={handleFileChange}
        accept={question.fileTypesAllowed}
        className="hidden"
        id="file-upload"
      />
      <label htmlFor="file-upload" className="cursor-pointer">
        <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
        <p className="text-lg font-medium text-foreground mb-2">
          {value ? value.name : 'Click to upload or drag and drop'}
        </p>
        <p className="text-sm text-muted-foreground">
          {question.fileTypesAllowed || 'Any file type'} • Max {question.maxFileSizeMB || 10}MB
        </p>
      </label>
    </div>
  );
}

// Website Input
function WebsiteInput({
  value,
  onChange,
  onKeyPress,
  inputRef
}: {
  value: string;
  onChange: (value: string) => void;
  onKeyPress: (e: React.KeyboardEvent) => void;
  inputRef: React.RefObject<HTMLInputElement | null>;
}) {
  return (
    <div className="relative">
      <Link2 className="absolute left-0 top-3 h-6 w-6 text-muted-foreground" />
      <input
        ref={inputRef}
        type="url"
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        onKeyPress={onKeyPress}
        placeholder="https://example.com"
        className="w-full text-2xl bg-transparent border-b-2 border-muted-foreground/30 focus:border-primary outline-none py-3 pl-10 text-foreground placeholder:text-muted-foreground/50 transition-colors"
      />
    </div>
  );
}

// Contact Info Input
function ContactInfoInput({ value, onChange, question }: { value: any; onChange: (value: any) => void; question: Question }) {
  const collectName = question.collectName === 'Yes';
  const collectEmail = question.collectEmail === 'Yes';
  const collectPhone = question.collectPhone === 'Yes';
  const collectAddress = question.collectAddress === 'Yes';

  const handleChange = (field: string, fieldValue: string) => {
    onChange({
      ...value,
      [field]: fieldValue
    });
  };

  return (
    <div className="space-y-4">
      {collectName && (
        <input
          type="text"
          value={value?.name || ''}
          onChange={(e) => handleChange('name', e.target.value)}
          placeholder="Full Name"
          className="w-full text-xl bg-background border-2 border-muted-foreground/30 focus:border-primary outline-none rounded-lg px-4 py-3 text-foreground transition-colors"
        />
      )}
      {collectEmail && (
        <input
          type="email"
          value={value?.email || ''}
          onChange={(e) => handleChange('email', e.target.value)}
          placeholder="Email Address"
          className="w-full text-xl bg-background border-2 border-muted-foreground/30 focus:border-primary outline-none rounded-lg px-4 py-3 text-foreground transition-colors"
        />
      )}
      {collectPhone && (
        <input
          type="tel"
          value={value?.phone || ''}
          onChange={(e) => handleChange('phone', e.target.value)}
          placeholder="Phone Number"
          className="w-full text-xl bg-background border-2 border-muted-foreground/30 focus:border-primary outline-none rounded-lg px-4 py-3 text-foreground transition-colors"
        />
      )}
      {collectAddress && (
        <textarea
          value={value?.address || ''}
          onChange={(e) => handleChange('address', e.target.value)}
          placeholder="Address"
          rows={3}
          className="w-full text-xl bg-background border-2 border-muted-foreground/30 focus:border-primary outline-none rounded-lg px-4 py-3 text-foreground transition-colors resize-none"
        />
      )}
    </div>
  );
}

// Address Input
function AddressInput({
  value,
  onChange,
  textareaRef
}: {
  value: string;
  onChange: (value: string) => void;
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
}) {
  return (
    <div className="relative">
      <MapPin className="absolute left-4 top-4 h-6 w-6 text-muted-foreground" />
      <textarea
        ref={textareaRef}
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Enter your address..."
        rows={4}
        className="w-full text-xl bg-background border-2 border-muted-foreground/30 focus:border-primary outline-none rounded-lg pl-14 pr-4 py-3 text-foreground placeholder:text-muted-foreground/50 transition-colors resize-none"
      />
    </div>
  );
}

// Legal Input (Checkbox agreement)
function LegalInput({ value, onChange, question }: { value: boolean; onChange: (value: boolean) => void; question: Question }) {
  return (
    <button
      onClick={() => onChange(!value)}
      className={`w-full text-left px-6 py-4 rounded-xl border-2 transition-all ${
        value
          ? 'border-primary bg-primary/10 text-foreground shadow-lg'
          : 'border-muted-foreground/30 hover:border-primary/50 text-muted-foreground hover:text-foreground'
      }`}
    >
      <div className="flex items-start gap-3">
        <div className={`w-6 h-6 rounded border-2 flex items-center justify-center mt-0.5 flex-shrink-0 ${
          value ? 'border-primary bg-primary' : 'border-muted-foreground/50'
        }`}>
          {value && <Check className="h-4 w-4 text-primary-foreground" />}
        </div>
        <span className="flex-1">
          I agree to the {question.questionText || 'terms and conditions'}
        </span>
      </div>
    </button>
  );
}

// Statement (Display only)
function StatementInput({ question, onChange }: { question: Question; onChange: (value: any) => void }) {
  // Auto-mark as viewed
  React.useEffect(() => {
    onChange('viewed');
  }, []);

  return (
    <div className="bg-muted/30 rounded-xl p-8 text-center">
      <p className="text-lg text-foreground whitespace-pre-wrap">
        {question.questionDescription || question.questionText}
      </p>
    </div>
  );
}

// End Screen
function EndScreenInput({ question }: { question: Question }) {
  return (
    <div className="text-center space-y-6">
      <div className="w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto">
        <Check className="h-10 w-10 text-green-600 dark:text-green-400" />
      </div>
      <p className="text-xl text-foreground">
        {question.questionDescription || question.questionText}
      </p>
    </div>
  );
}

// Picture Choice Input
function PictureChoiceInput({ value, onChange, question }: { value: any; onChange: (value: any) => void; question: Question }) {
  const options = question.options || [];
  const allowMultiple = question.allowMultipleSelections === 'Yes';

  const handleSelect = (optionValue: string) => {
    if (allowMultiple) {
      const currentValues = Array.isArray(value) ? value : [];
      if (currentValues.includes(optionValue)) {
        onChange(currentValues.filter((v: string) => v !== optionValue));
      } else {
        onChange([...currentValues, optionValue]);
      }
    } else {
      onChange(optionValue);
    }
  };

  const isSelected = (optionValue: string) => {
    if (allowMultiple) {
      return Array.isArray(value) && value.includes(optionValue);
    }
    return value === optionValue;
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
      {options.map((option, index) => (
        <button
          key={index}
          onClick={() => handleSelect(option.optionText)}
          className={`relative aspect-square rounded-xl border-4 transition-all overflow-hidden ${
            isSelected(option.optionText)
              ? 'border-primary shadow-xl scale-105'
              : 'border-muted-foreground/30 hover:border-primary/50 hover:scale-102'
          }`}
        >
          {option.imageUrl ? (
            <img src={option.imageUrl} alt={option.optionText} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-muted flex items-center justify-center">
              <span className="text-muted-foreground">No image</span>
            </div>
          )}
          <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white p-2 text-sm">
            {option.optionText}
          </div>
          {isSelected(option.optionText) && (
            <div className="absolute top-2 right-2 w-8 h-8 rounded-full bg-primary flex items-center justify-center">
              <Check className="h-5 w-5 text-primary-foreground" />
            </div>
          )}
        </button>
      ))}
    </div>
  );
}

// Video and Audio Input
function VideoAndAudioInput({ value, onChange, question }: { value: any; onChange: (value: any) => void; question: Question }) {
  const mediaType = question.mediaType || 'video'; // 'video' or 'audio'
  const [embedUrl, setEmbedUrl] = useState(value?.url || '');
  const [uploadedFile, setUploadedFile] = useState(value?.file || null);

  const handleUrlChange = (url: string) => {
    setEmbedUrl(url);
    onChange({ type: 'url', url });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // For now, store file info - actual upload happens on form submission
    setUploadedFile(file);
    onChange({ type: 'file', file: file.name, size: file.size });
  };

  const getYouTubeEmbedUrl = (url: string) => {
    const videoIdMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&]+)/);
    return videoIdMatch ? `https://www.youtube.com/embed/${videoIdMatch[1]}` : null;
  };

  const getVimeoEmbedUrl = (url: string) => {
    const videoIdMatch = url.match(/vimeo\.com\/(\d+)/);
    return videoIdMatch ? `https://player.vimeo.com/video/${videoIdMatch[1]}` : null;
  };

  const getEmbedUrl = () => {
    if (embedUrl.includes('youtube.com') || embedUrl.includes('youtu.be')) {
      return getYouTubeEmbedUrl(embedUrl);
    }
    if (embedUrl.includes('vimeo.com')) {
      return getVimeoEmbedUrl(embedUrl);
    }
    return embedUrl; // Direct URL
  };

  return (
    <div className="space-y-6">
      {mediaType === 'video' ? (
        <>
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Video URL (YouTube, Vimeo, or direct link)
            </label>
            <input
              type="url"
              value={embedUrl}
              onChange={(e) => handleUrlChange(e.target.value)}
              placeholder="https://www.youtube.com/watch?v=..."
              className="w-full px-4 py-3 border border-input rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          {embedUrl && (
            <div className="aspect-video w-full rounded-lg overflow-hidden bg-black">
              <iframe
                src={getEmbedUrl() || ''}
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          )}
        </>
      ) : (
        <>
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Upload Audio File
            </label>
            <input
              type="file"
              accept="audio/*"
              onChange={handleFileUpload}
              className="w-full px-4 py-3 border border-input rounded-lg bg-background text-foreground file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
            />
          </div>
          {uploadedFile && (
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm text-foreground">Uploaded: {uploadedFile}</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// Razorpay / Payment Link Input
function RazorpayInput({ value, onChange, question }: { value: any; onChange: (value: any) => void; question: Question }) {
  const amount = question.stripeAmount || '0';
  const currency = question.stripeCurrency || 'INR';

  const handlePayment = () => {
    // Open Razorpay payment link or show payment interface
    const paymentUrl = `https://razorpay.me/@yourhandle/${amount}${currency}`;
    window.open(paymentUrl, '_blank');
    onChange({ status: 'initiated', amount, currency, timestamp: new Date().toISOString() });
  };

  return (
    <div className="space-y-6">
      <div className="p-6 bg-muted/50 rounded-xl border border-border">
        <div className="text-center space-y-4">
          <div className="text-4xl font-bold text-foreground">
            {currency === 'INR' ? '₹' : currency === 'USD' ? '$' : currency} {amount}
          </div>
          <p className="text-muted-foreground">
            {question.questionDescription || 'Complete your payment to continue'}
          </p>
          <Button
            onClick={handlePayment}
            size="lg"
            className="w-full max-w-xs"
          >
            Pay Now
          </Button>
        </div>
      </div>
      <p className="text-xs text-muted-foreground text-center">
        You will be redirected to Razorpay payment page
      </p>
    </div>
  );
}

// Google Drive Input
function GoogleDriveInput({ value, onChange, question }: { value: any; onChange: (value: any) => void; question: Question }) {
  const driveType = question.driveType || 'file'; // 'file' or 'folder'
  const [driveUrl, setDriveUrl] = useState(value || '');

  const handleUrlChange = (url: string) => {
    setDriveUrl(url);
    onChange(url);
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          Google Drive {driveType === 'folder' ? 'Folder' : 'File'} URL
        </label>
        <input
          type="url"
          value={driveUrl}
          onChange={(e) => handleUrlChange(e.target.value)}
          placeholder="https://drive.google.com/..."
          className="w-full px-4 py-3 border border-input rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>
      {driveUrl && (
        <div className="p-4 bg-muted rounded-lg">
          <p className="text-sm text-foreground flex items-center gap-2">
            <Link2 className="h-4 w-4" />
            Drive link saved
          </p>
        </div>
      )}
    </div>
  );
}

// Calendly Input
function CalendlyInput({ value, onChange, question }: { value: any; onChange: (value: any) => void; question: Question }) {
  const calendlyUrl = question.calendlyUrl || '';

  React.useEffect(() => {
    if (calendlyUrl) {
      // Mark as viewed
      onChange({ viewed: true, timestamp: new Date().toISOString() });
    }
  }, [calendlyUrl]);

  return (
    <div className="space-y-4">
      {calendlyUrl ? (
        <div className="w-full h-[600px] rounded-lg overflow-hidden border border-border">
          <iframe
            src={calendlyUrl}
            width="100%"
            height="100%"
            frameBorder="0"
          />
        </div>
      ) : (
        <div className="p-6 bg-muted rounded-lg text-center text-muted-foreground">
          No Calendly URL configured
        </div>
      )}
    </div>
  );
}

// Ranking Input (Drag and Drop)
function RankingInput({ value, onChange, question }: { value: any; onChange: (value: any) => void; question: Question }) {
  const options = question.options || [];
  const [rankedItems, setRankedItems] = useState<any[]>(value || options.map(opt => opt.optionValue));
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const newItems = [...rankedItems];
    const draggedItem = newItems[draggedIndex];
    newItems.splice(draggedIndex, 1);
    newItems.splice(index, 0, draggedItem);

    setRankedItems(newItems);
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    onChange(rankedItems);
  };

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">Drag to reorder (1 = highest priority)</p>
      {rankedItems.map((item, index) => {
        const option = options.find(opt => opt.optionValue === item);
        return (
          <div
            key={item}
            draggable
            onDragStart={() => handleDragStart(index)}
            onDragOver={(e) => handleDragOver(e, index)}
            onDragEnd={handleDragEnd}
            className={`p-4 bg-background border-2 border-border rounded-lg cursor-move transition-all ${
              draggedIndex === index ? 'opacity-50 scale-95' : 'hover:border-primary'
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold">
                {index + 1}
              </span>
              <span className="text-foreground">{option?.optionText || item}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// Matrix Input (Grid Layout)
function MatrixInput({ value, onChange, question }: { value: any; onChange: (value: any) => void; question: Question }) {
  // Parse rows and columns from JSON strings
  const rows = React.useMemo(() => {
    try {
      return question.matrixRows ? JSON.parse(question.matrixRows as string) : [];
    } catch {
      return [];
    }
  }, [question.matrixRows]);

  const columns = React.useMemo(() => {
    try {
      return question.matrixColumns ? JSON.parse(question.matrixColumns as string) : [];
    } catch {
      return [];
    }
  }, [question.matrixColumns]);

  const [selections, setSelections] = useState<Record<string, string>>(value || {});

  const handleSelect = (rowId: string, columnValue: string) => {
    const newSelections = { ...selections, [rowId]: columnValue };
    setSelections(newSelections);
    onChange(newSelections);
  };

  if (rows.length === 0 || columns.length === 0) {
    return (
      <div className="p-6 bg-muted rounded-lg text-center text-muted-foreground">
        Matrix not configured. Please configure rows and columns in form builder.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr>
            <th className="border border-border p-3 bg-muted text-left text-sm font-medium"></th>
            {columns.map((col: any, idx: number) => (
              <th key={idx} className="border border-border p-3 bg-muted text-center text-sm font-medium">
                {col.columnText}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row: any, rowIdx: number) => (
            <tr key={rowIdx}>
              <td className="border border-border p-3 bg-muted/50 font-medium text-sm">
                {row.rowText}
              </td>
              {columns.map((col: any, colIdx: number) => (
                <td key={colIdx} className="border border-border p-3 text-center">
                  <input
                    type="radio"
                    name={`matrix-${rowIdx}`}
                    checked={selections[row.rowValue] === col.columnValue}
                    onChange={() => handleSelect(row.rowValue, col.columnValue)}
                    className="w-5 h-5 text-primary"
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Partial Submit Point Input
function PartialSubmitPointInput({ onChange }: { onChange: (value: any) => void }) {
  const handleSaveProgress = () => {
    onChange({ action: 'save_progress', timestamp: new Date().toISOString() });
    toast.success('Progress saved! You can continue later.');
  };

  return (
    <div className="text-center space-y-6 py-8">
      <div className="w-20 h-20 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mx-auto">
        <Upload className="h-10 w-10 text-blue-600 dark:text-blue-400" />
      </div>
      <div className="space-y-2">
        <h3 className="text-2xl font-bold text-foreground">Save Your Progress</h3>
        <p className="text-muted-foreground max-w-md mx-auto">
          You can save your progress here and continue filling this form later.
        </p>
      </div>
      <Button onClick={handleSaveProgress} size="lg">
        Save & Continue Later
      </Button>
    </div>
  );
}

// Redirect to URL Input
function RedirectToURLInput({ question, onChange }: { question: Question; onChange: (value: any) => void }) {
  React.useEffect(() => {
    onChange('redirect_acknowledged');
  }, []);

  return (
    <div className="text-center space-y-6 py-8">
      <div className="w-20 h-20 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center mx-auto">
        <ArrowRight className="h-10 w-10 text-purple-600 dark:text-purple-400" />
      </div>
      <div className="space-y-2">
        <h3 className="text-2xl font-bold text-foreground">Redirecting...</h3>
        <p className="text-muted-foreground max-w-md mx-auto">
          {question.questionDescription || 'You will be redirected after submitting this form.'}
        </p>
      </div>
    </div>
  );
}

// Group Selection Input
function GroupSelectionInput({
  value,
  onChange,
  question,
  formId,
  onGroupStatusChange,
  onRegisterRefresh
}: {
  value: any;
  onChange: (value: any) => void;
  question: Question;
  formId: string;
  onGroupStatusChange?: (status: { isFilled: boolean; groupMembers: string[]; availableStudentsCount?: number }) => void;
  onRegisterRefresh?: (callback: () => void) => void;
}) {
  const [availableStudents, setAvailableStudents] = useState<Student[]>([]);
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [groupStatus, setGroupStatus] = useState<any>(null);
  const user = auth.currentUser;

  // Register refresh callback on mount
  useEffect(() => {
    if (onRegisterRefresh) {
      onRegisterRefresh(loadAvailableStudents);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    loadGroupStatus();
    loadAvailableStudents();
  }, [formId, question.id]);

  // Sync selectedStudents with value prop (for when parent clears selection)
  useEffect(() => {
    if (Array.isArray(value)) {
      setSelectedStudents(value);
    } else if (!value) {
      setSelectedStudents([]);
    }
  }, [value]);

  async function loadGroupStatus() {
    if (!user?.email || !question.id) return;
    try {
      const result = await getStudentGroupStatus(formId, question.id, user.email);
      if (result.success && result.data) {
        setGroupStatus(result.data);
        // Notify parent component about group status
        if (onGroupStatusChange && result.data.isFilled) {
          onGroupStatusChange({
            isFilled: result.data.isFilled,
            groupMembers: result.data.groupMembers || []
          });
        }
        // DO NOT set the value - we want to show read-only view without saving to this user's response
        // The response view will fetch and display the group status dynamically
      }
    } catch (err) {
      console.error('Error loading group status:', err);
    }
  }

  useEffect(() => {
    // Initialize with current user's ID if available
    if (user?.email && availableStudents.length > 0) {
      const currentStudent = availableStudents.find(s => s.email === user.email);
      if (currentStudent && !selectedStudents.includes(currentStudent.id)) {
        const newSelection = [currentStudent.id];
        setSelectedStudents(newSelection);
        onChange(newSelection);
      }
    }
  }, [availableStudents, user]);

  async function loadAvailableStudents() {
    try {
      setLoading(true);
      setError(null);
      const result = await getAvailableStudentsForQuestion(formId, question.id || '');
      console.log('🔍 API Response:', result);
      console.log('🔍 Students data:', result.data);
      if (result.success && result.data) {
        setAvailableStudents(result.data);
        // Notify parent about available students count
        if (onGroupStatusChange) {
          onGroupStatusChange({
            isFilled: false,
            groupMembers: [],
            availableStudentsCount: result.data.length
          });
        }
      } else {
        setError(result.error || 'Failed to load students');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  }

  const handleStudentToggle = (studentId: string) => {
    const currentStudent = availableStudents.find(s => s.email === user?.email);
    const maxSize = question.maxGroupSize || 5;

    const clickedStudent = availableStudents.find(s => s.id === studentId);
    console.log('🔍 Toggle student ID:', studentId);
    console.log('🔍 Toggle student object:', clickedStudent);
    console.log('🔍 Current selection:', selectedStudents);

    // Don't allow deselecting the current user
    if (currentStudent && studentId === currentStudent.id) {
      return;
    }

    let newSelection: string[];
    if (selectedStudents.includes(studentId)) {
      newSelection = selectedStudents.filter(id => id !== studentId);
    } else {
      // Check if we've reached max size
      if (selectedStudents.length >= maxSize) {
        return; // Don't allow selecting more
      }
      newSelection = [...selectedStudents, studentId];
    }

    console.log('🔍 New selection:', newSelection);
    setSelectedStudents(newSelection);
    onChange(newSelection);
  };

  const minSize = question.minGroupSize || 3;
  const maxSize = question.maxGroupSize || 5;
  const currentSize = selectedStudents.length;

  // Bypass minimum requirement if there are only 3 or fewer students left available
  const effectiveMinSize = availableStudents.length <= minSize ? availableStudents.length : minSize;
  const isValidSize = currentSize >= effectiveMinSize && currentSize <= maxSize;
  const currentStudent = availableStudents.find(s => s.email === user?.email);

  // Show read-only view if group is already filled
  if (groupStatus?.isFilled && groupStatus?.groupMembers?.length > 0) {
    return (
      <div className="space-y-4">
        <div className="bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-200 dark:border-blue-800 rounded-lg p-6">
          <div className="flex items-start gap-3 mb-4">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/40 rounded-lg">
              <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-blue-900 dark:text-blue-100 text-lg mb-1">
                Group Already Formed
              </h4>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                This group selection was filled by <span className="font-medium">{groupStatus.filledBy}</span>
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium text-blue-900 dark:text-blue-100">Group Members:</p>
            <div className="space-y-2">
              {groupStatus.groupMembers.map((name: string, idx: number) => (
                <div
                  key={idx}
                  className="flex items-center gap-3 p-3 bg-white dark:bg-gray-800 rounded-lg border border-blue-200 dark:border-blue-800"
                >
                  <div className="w-2 h-2 rounded-full bg-blue-600 dark:bg-blue-400"></div>
                  <span className="text-foreground font-medium">{name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 rounded-lg p-4">
          <p className="text-sm text-muted-foreground italic text-center">
            You can continue filling the rest of the form
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        <p className="text-muted-foreground mt-4">Loading students...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600 dark:text-red-400">{error}</p>
        <Button onClick={loadAvailableStudents} className="mt-4">
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">
          {availableStudents.length <= minSize
            ? `Select all ${availableStudents.length} remaining students to form your group (including yourself)`
            : `Select ${minSize}-{maxSize} students to form your group (including yourself)`
          }
        </p>
        <p className="text-xs text-muted-foreground">
          Current selection: {currentSize} student{currentSize !== 1 ? 's' : ''}
          {!isValidSize && (
            <span className="text-orange-600 dark:text-orange-400 ml-2">
              {availableStudents.length <= minSize
                ? `(Please select all ${availableStudents.length} remaining students)`
                : `(Please select between ${minSize} and ${maxSize} students)`
              }
            </span>
          )}
        </p>
      </div>

      <div className="space-y-2 max-h-96 overflow-y-auto border border-input rounded-lg p-4 bg-background">
        {availableStudents.map((student) => {
          const isCurrentUser = student.email === user?.email;
          const isSelected = selectedStudents.includes(student.id);

          return (
            <div
              key={student.id}
              onClick={() => !isCurrentUser && handleStudentToggle(student.id)}
              className={`
                flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all
                ${isSelected
                  ? 'bg-primary/10 border-primary'
                  : 'bg-background border-input hover:border-primary/50'
                }
                ${isCurrentUser ? 'cursor-not-allowed opacity-75' : ''}
              `}
            >
              <div className={`
                w-5 h-5 rounded border-2 flex items-center justify-center transition-all
                ${isSelected
                  ? 'bg-primary border-primary'
                  : 'bg-background border-input'
                }
              `}>
                {isSelected && <Check className="h-3 w-3 text-primary-foreground" />}
              </div>
              <div className="flex-1">
                <p className="font-medium text-foreground">
                  {student.name}
                  {isCurrentUser && (
                    <span className="ml-2 text-xs bg-primary/20 text-primary px-2 py-0.5 rounded">
                      You
                    </span>
                  )}
                </p>
                <p className="text-xs text-muted-foreground">{student.email}</p>
                {student.batch && (
                  <p className="text-xs text-muted-foreground">Batch: {student.batch}</p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {!isValidSize && currentSize > 0 && (
        <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
          <p className="text-sm text-orange-800 dark:text-orange-200">
            {currentSize < effectiveMinSize
              ? `Please select at least ${effectiveMinSize - currentSize} more student${effectiveMinSize - currentSize !== 1 ? 's' : ''}`
              : `Please remove ${currentSize - maxSize} student${currentSize - maxSize !== 1 ? 's' : ''}`
            }
          </p>
        </div>
      )}
    </div>
  );
}

export default FormFillPage;
