import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import {
  ArrowLeft,
  CheckCircle2,
  Upload,
  X,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { getFormById, submitFormResponse, uploadStudentAttachment, type Question } from '../services/formsApi';
import { auth } from '../firebase/config';

interface FormData {
  id: string;
  name: string;
  description: string;
  type: string;
  batch: string;
  confirmationMessage: string;
  showProgressBar: string;
  questions: Question[];
}

export function FormSubmissionPage() {
  const { formId } = useParams<{ formId: string }>();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState<FormData | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [uploadingFiles, setUploadingFiles] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (formId) {
      fetchForm();
    }
  }, [formId]);

  const fetchForm = async () => {
    if (!formId) return;

    setLoading(true);
    try {
      const result = await getFormById(formId);
      if (result.success && result.data) {
        setFormData(result.data as unknown as FormData);

        // Initialize answers with default values
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const initialAnswers: Record<string, any> = {};
        result.data.questions.forEach((q) => {
          if (q.defaultValue) {
            initialAnswers[q.id] = q.defaultValue;
          } else if (q.questionType === 'Checkboxes') {
            initialAnswers[q.id] = [];
          }
        });
        setAnswers(initialAnswers);
      } else {
        toast.error(result.error || 'Failed to load form');
        navigate('/forms');
      }
    } catch (error) {
      console.error('Error fetching form:', error);
      toast.error('Failed to load form');
      navigate('/forms');
    } finally {
      setLoading(false);
    }
  };

  const validateAnswers = (): boolean => {
    if (!formData) return false;

    const newErrors: Record<string, string> = {};

    formData.questions.forEach((question) => {
      const answer = answers[question.id];

      // Check required
      if (question.isRequired === 'Yes') {
        if (!answer || (Array.isArray(answer) && answer.length === 0) || answer === '') {
          newErrors[question.id] = 'This question is required';
          return;
        }
      }

      // Skip validation if no answer provided for optional questions
      if (!answer || answer === '') return;

      // Type-specific validation
      switch (question.questionType) {
        case 'Email':
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(answer)) {
            newErrors[question.id] = 'Please enter a valid email address';
          }
          break;

        case 'URL':
          try {
            new URL(answer);
          } catch {
            newErrors[question.id] = 'Please enter a valid URL';
          }
          break;

        case 'Phone':
          const phoneRegex = /^[\d\s\-+()]+$/;
          if (!phoneRegex.test(answer)) {
            newErrors[question.id] = 'Please enter a valid phone number';
          }
          break;

        case 'Number':
          const num = parseFloat(answer);
          if (isNaN(num)) {
            newErrors[question.id] = 'Please enter a valid number';
          } else {
            if (question.minValue && num < parseFloat(question.minValue)) {
              newErrors[question.id] = `Minimum value is ${question.minValue}`;
            }
            if (question.maxValue && num > parseFloat(question.maxValue)) {
              newErrors[question.id] = `Maximum value is ${question.maxValue}`;
            }
          }
          break;

        case 'Short Text':
        case 'Long Text':
          if (question.minLength && answer.length < parseInt(question.minLength)) {
            newErrors[question.id] = `Minimum length is ${question.minLength} characters`;
          }
          if (question.maxLength && answer.length > parseInt(question.maxLength)) {
            newErrors[question.id] = `Maximum length is ${question.maxLength} characters`;
          }
          break;

        case 'Checkboxes':
          if (question.maxSelections && Array.isArray(answer)) {
            const maxSelections = parseInt(question.maxSelections);
            if (answer.length > maxSelections) {
              newErrors[question.id] = `You can select at most ${maxSelections} options`;
            }
          }
          break;
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleFileUpload = async (questionId: string, file: File) => {
    if (!formData) return;

    const user = auth.currentUser;
    if (!user) {
      toast.error('Please log in to upload files');
      return;
    }

    const question = formData.questions.find((q) => q.id === questionId);
    if (!question) return;

    // Validate file type
    if (question.allowedFileTypes) {
      const allowedTypes = question.allowedFileTypes.split(',').map((t) => t.trim().toLowerCase());
      const fileExt = '.' + file.name.split('.').pop()?.toLowerCase();
      if (!allowedTypes.includes(fileExt)) {
        toast.error(`File type not allowed. Allowed types: ${question.allowedFileTypes}`);
        return;
      }
    }

    // Validate file size
    if (question.maxFileSize) {
      const maxSizeMB = parseFloat(question.maxFileSize);
      const fileSizeMB = file.size / (1024 * 1024);
      if (fileSizeMB > maxSizeMB) {
        toast.error(`File size exceeds ${maxSizeMB}MB limit`);
        return;
      }
    }

    setUploadingFiles({ ...uploadingFiles, [questionId]: true });

    try {
      // TODO: Get form folder ID from formData (need to add this to the backend response)
      // For now, we'll skip the actual upload and just store file info
      const result = await uploadStudentAttachment(
        'PLACEHOLDER_FOLDER_ID', // This should come from formData
        user.displayName || user.email || 'Unknown',
        file
      );

      if (result.success && result.data) {
        setAnswers({
          ...answers,
          [questionId]: {
            fileName: file.name,
            fileUrl: result.data.fileUrl,
            fileId: result.data.fileId,
          },
        });
        toast.success('File uploaded successfully');
      } else {
        toast.error(result.error || 'Failed to upload file');
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      toast.error('Failed to upload file');
    } finally {
      setUploadingFiles({ ...uploadingFiles, [questionId]: false });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    console.log('🚀 handleSubmit called');
    console.log('Form ID:', formId);
    console.log('Form Data:', formData);
    console.log('Answers:', answers);

    if (!formId || !formData) {
      console.log('❌ Missing formId or formData');
      return;
    }

    // Validate
    if (!validateAnswers()) {
      console.log('❌ Validation failed');
      toast.error('Please fix the errors before submitting');
      // Scroll to first error
      const firstErrorKey = Object.keys(errors)[0];
      if (firstErrorKey) {
        document.getElementById(`question-${firstErrorKey}`)?.scrollIntoView({ behavior: 'smooth' });
      }
      return;
    }

    console.log('✅ Validation passed, starting submission...');
    setSubmitting(true);

    try {
      console.log('📤 Calling submitFormResponse with:', { formId, answers });
      const result = await submitFormResponse(formId, answers);

      console.log('📥 Submission result:', result);

      if (result.success) {
        console.log('✅ Submission successful!');
        setSubmitted(true);
        toast.success('Form submitted successfully!');

        // Log the sheet URL for debugging
        if (result.data?.sheetUrl) {
          console.log('✅ Response saved to:', result.data.sheetUrl);
          alert(`Response saved to: ${result.data.sheetUrl}`);
        }
      } else {
        console.error('❌ Submission failed:', result.error);
        toast.error(result.error || 'Failed to submit form');
        alert(`Submission failed: ${result.error}`);
      }
    } catch (error) {
      console.error('❌ Error submitting form:', error);
      toast.error('Failed to submit form');
      alert(`Error: ${error}`);
    } finally {
      console.log('🏁 Submission completed, resetting submitting state');
      setSubmitting(false);
    }
  };

  const renderQuestion = (question: Question) => {
    const answer = answers[question.id];
    const error = errors[question.id];
    const isUploading = uploadingFiles[question.id];

    const questionLabel = (
      <label className="block text-base font-medium text-foreground mb-2">
        {question.questionText}
        {question.isRequired === 'Yes' && <span className="text-red-600 ml-1">*</span>}
      </label>
    );

    const helpText = question.helpText && (
      <p className="text-sm text-muted-foreground mb-3">{question.helpText}</p>
    );

    const errorMessage = error && (
      <p className="text-sm text-red-600 mt-2 flex items-center gap-1">
        <AlertCircle className="h-4 w-4" />
        {error}
      </p>
    );

    switch (question.questionType) {
      case 'Short Text':
      case 'Email':
      case 'URL':
      case 'Phone':
        return (
          <div key={question.id} id={`question-${question.id}`} className="space-y-2">
            {questionLabel}
            {helpText}
            <input
              type={question.questionType === 'Email' ? 'email' : 'text'}
              value={answer || ''}
              onChange={(e) => setAnswers({ ...answers, [question.id]: e.target.value })}
              placeholder={question.placeholder}
              className={`w-full px-4 py-2 border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary ${
                error ? 'border-red-500' : 'border-input'
              }`}
            />
            {errorMessage}
          </div>
        );

      case 'Long Text':
        return (
          <div key={question.id} id={`question-${question.id}`} className="space-y-2">
            {questionLabel}
            {helpText}
            <textarea
              value={answer || ''}
              onChange={(e) => setAnswers({ ...answers, [question.id]: e.target.value })}
              placeholder={question.placeholder}
              rows={4}
              className={`w-full px-4 py-2 border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary ${
                error ? 'border-red-500' : 'border-input'
              }`}
            />
            {errorMessage}
          </div>
        );

      case 'Number':
        return (
          <div key={question.id} id={`question-${question.id}`} className="space-y-2">
            {questionLabel}
            {helpText}
            <input
              type="number"
              value={answer || ''}
              onChange={(e) => setAnswers({ ...answers, [question.id]: e.target.value })}
              placeholder={question.placeholder}
              min={question.minValue}
              max={question.maxValue}
              className={`w-full px-4 py-2 border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary ${
                error ? 'border-red-500' : 'border-input'
              }`}
            />
            {errorMessage}
          </div>
        );

      case 'Date':
        return (
          <div key={question.id} id={`question-${question.id}`} className="space-y-2">
            {questionLabel}
            {helpText}
            <input
              type="date"
              value={answer || ''}
              onChange={(e) => setAnswers({ ...answers, [question.id]: e.target.value })}
              className={`w-full px-4 py-2 border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary ${
                error ? 'border-red-500' : 'border-input'
              }`}
            />
            {errorMessage}
          </div>
        );

      case 'Time':
        return (
          <div key={question.id} id={`question-${question.id}`} className="space-y-2">
            {questionLabel}
            {helpText}
            <input
              type="time"
              value={answer || ''}
              onChange={(e) => setAnswers({ ...answers, [question.id]: e.target.value })}
              className={`w-full px-4 py-2 border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary ${
                error ? 'border-red-500' : 'border-input'
              }`}
            />
            {errorMessage}
          </div>
        );

      case 'Multiple Choice':
        return (
          <div key={question.id} id={`question-${question.id}`} className="space-y-2">
            {questionLabel}
            {helpText}
            <div className="space-y-2">
              {question.options?.map((option) => (
                <label key={option.id} className="flex items-center gap-3 cursor-pointer p-3 rounded-lg border border-input hover:bg-accent/50 transition-colors">
                  <input
                    type="radio"
                    name={question.id}
                    value={option.optionValue}
                    checked={answer === option.optionValue}
                    onChange={(e) => setAnswers({ ...answers, [question.id]: e.target.value })}
                    className="w-4 h-4 text-primary focus:ring-primary"
                  />
                  <span className="text-foreground">{option.optionText}</span>
                </label>
              ))}
            </div>
            {errorMessage}
          </div>
        );

      case 'Checkboxes':
        return (
          <div key={question.id} id={`question-${question.id}`} className="space-y-2">
            {questionLabel}
            {helpText}
            <div className="space-y-2">
              {question.options?.map((option) => (
                <label key={option.id} className="flex items-center gap-3 cursor-pointer p-3 rounded-lg border border-input hover:bg-accent/50 transition-colors">
                  <input
                    type="checkbox"
                    value={option.optionValue}
                    checked={Array.isArray(answer) && answer.includes(option.optionValue)}
                    onChange={(e) => {
                      const currentAnswers = Array.isArray(answer) ? answer : [];
                      if (e.target.checked) {
                        setAnswers({ ...answers, [question.id]: [...currentAnswers, option.optionValue] });
                      } else {
                        setAnswers({
                          ...answers,
                          [question.id]: currentAnswers.filter((v) => v !== option.optionValue),
                        });
                      }
                    }}
                    className="w-4 h-4 text-primary focus:ring-primary rounded"
                  />
                  <span className="text-foreground">{option.optionText}</span>
                </label>
              ))}
            </div>
            {errorMessage}
          </div>
        );

      case 'Dropdown':
        return (
          <div key={question.id} id={`question-${question.id}`} className="space-y-2">
            {questionLabel}
            {helpText}
            <select
              value={answer || ''}
              onChange={(e) => setAnswers({ ...answers, [question.id]: e.target.value })}
              className={`w-full px-4 py-2 border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary ${
                error ? 'border-red-500' : 'border-input'
              }`}
            >
              <option value="">-- Select an option --</option>
              {question.options?.map((option) => (
                <option key={option.id} value={option.optionValue}>
                  {option.optionText}
                </option>
              ))}
            </select>
            {errorMessage}
          </div>
        );

      case 'File Upload':
        return (
          <div key={question.id} id={`question-${question.id}`} className="space-y-2">
            {questionLabel}
            {helpText}
            {question.allowedFileTypes && (
              <p className="text-xs text-muted-foreground">
                Allowed types: {question.allowedFileTypes}
              </p>
            )}
            {question.maxFileSize && (
              <p className="text-xs text-muted-foreground">
                Max size: {question.maxFileSize}MB
              </p>
            )}

            {answer?.fileName ? (
              <div className="flex items-center gap-3 p-4 border border-input rounded-md bg-accent/20">
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">{answer.fileName}</p>
                  <a
                    href={answer.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-primary hover:underline"
                  >
                    View File
                  </a>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    const newAnswers = { ...answers };
                    delete newAnswers[question.id];
                    setAnswers(newAnswers);
                  }}
                  className="text-red-600 hover:text-red-700"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <input
                  type="file"
                  id={`file-${question.id}`}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      handleFileUpload(question.id, file);
                    }
                  }}
                  className="hidden"
                  accept={question.allowedFileTypes}
                />
                <label
                  htmlFor={`file-${question.id}`}
                  className="flex items-center gap-2 px-4 py-2 border border-input rounded-md bg-background hover:bg-accent cursor-pointer transition-colors"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4" />
                      Choose File
                    </>
                  )}
                </label>
              </div>
            )}
            {errorMessage}
          </div>
        );

      case 'Rating':
        return (
          <div key={question.id} id={`question-${question.id}`} className="space-y-2">
            {questionLabel}
            {helpText}
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((rating) => (
                <button
                  key={rating}
                  type="button"
                  onClick={() => setAnswers({ ...answers, [question.id]: rating })}
                  className={`w-12 h-12 rounded-lg border-2 font-semibold transition-all ${
                    answer === rating
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-input hover:border-primary'
                  }`}
                >
                  {rating}
                </button>
              ))}
            </div>
            {errorMessage}
          </div>
        );

      case 'Linear Scale':
        const minValue = parseInt(question.minValue || '1');
        const maxValue = parseInt(question.maxValue || '10');
        const scale = Array.from({ length: maxValue - minValue + 1 }, (_, i) => minValue + i);

        return (
          <div key={question.id} id={`question-${question.id}`} className="space-y-2">
            {questionLabel}
            {helpText}
            <div className="flex items-center gap-1 flex-wrap">
              {scale.map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setAnswers({ ...answers, [question.id]: value })}
                  className={`w-10 h-10 rounded-lg border-2 font-semibold transition-all ${
                    answer === value
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-input hover:border-primary'
                  }`}
                >
                  {value}
                </button>
              ))}
            </div>
            {errorMessage}
          </div>
        );

      default:
        return (
          <div key={question.id} id={`question-${question.id}`} className="space-y-2">
            {questionLabel}
            {helpText}
            <input
              type="text"
              value={answer || ''}
              onChange={(e) => setAnswers({ ...answers, [question.id]: e.target.value })}
              placeholder={question.placeholder}
              className={`w-full px-4 py-2 border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary ${
                error ? 'border-red-500' : 'border-input'
              }`}
            />
            {errorMessage}
          </div>
        );
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

  if (submitted && formData) {
    return (
      <div className="p-6 max-w-3xl mx-auto">
        <Card className="border-2 border-green-500">
          <CardContent className="p-12 text-center">
            <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="h-10 w-10 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-3">Form Submitted!</h2>
            <p className="text-muted-foreground mb-6">
              {formData.confirmationMessage || 'Thank you for your submission!'}
            </p>
            <Button onClick={() => navigate('/forms')} className="flex items-center gap-2 mx-auto">
              <ArrowLeft className="h-4 w-4" />
              Back to Forms
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!formData) {
    return (
      <div className="p-6 max-w-3xl mx-auto">
        <Card>
          <CardContent className="p-12 text-center">
            <AlertCircle className="h-12 w-12 text-red-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-foreground mb-3">Form Not Found</h2>
            <p className="text-muted-foreground mb-6">
              The form you're looking for could not be found.
            </p>
            <Button onClick={() => navigate('/forms')} className="flex items-center gap-2 mx-auto">
              <ArrowLeft className="h-4 w-4" />
              Back to Forms
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const progress = formData.showProgressBar === 'Yes'
    ? Math.round((Object.keys(answers).length / formData.questions.length) * 100)
    : null;

  return (
    <div className="p-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <Button
          variant="outline"
          onClick={() => navigate('/forms')}
          className="flex items-center gap-2 mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h1 className="text-3xl font-bold text-foreground mb-2">{formData.name}</h1>
                {formData.description && (
                  <p className="text-muted-foreground">{formData.description}</p>
                )}
              </div>
              <Badge className="bg-primary text-primary-foreground">{formData.type}</Badge>
            </div>

            {progress !== null && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">Progress</span>
                  <span className="text-sm font-medium text-foreground">{progress}%</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-primary h-2 rounded-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit}>
        <Card>
          <CardContent className="p-6 space-y-6">
            {formData.questions
              .sort((a, b) => a.order - b.order)
              .map((question) => renderQuestion(question))}
          </CardContent>
        </Card>

        {/* Submit Button */}
        <div className="mt-6 flex justify-end">
          <Button
            type="submit"
            disabled={submitting}
            className="flex items-center gap-2 min-w-[150px]"
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4" />
                Submit Form
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}

export default FormSubmissionPage;
