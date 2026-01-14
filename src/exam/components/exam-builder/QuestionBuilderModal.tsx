/**
 * Question Builder Modal
 * Modal for adding/editing exam questions with support for:
 * - MCQ (Multiple Choice)
 * - MCQ_IMAGE (Multiple Choice with Image)
 * - SHORT_ANSWER (Short Answer)
 * - LONG_ANSWER (Long Answer)
 */

import React, { useState, useEffect } from 'react';
import { X, Upload, Plus, Minus, Calculator, Table as TableIcon, Grid3X3 } from 'lucide-react';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import type { Question, ExamSettings } from '../../services/examApi';

// Add CSS for table styling in the editor
const tableStyles = `
  .question-editor .ql-editor table {
    border-collapse: collapse;
    width: 100%;
    margin: 10px 0;
  }
  .question-editor .ql-editor table td,
  .question-editor .ql-editor table th {
    border: 1px solid #ccc;
    padding: 8px 12px;
    text-align: left;
  }
  .question-editor .ql-editor table tr:nth-child(even) {
    background-color: rgba(0, 0, 0, 0.02);
  }
  .dark .question-editor .ql-editor table td,
  .dark .question-editor .ql-editor table th {
    border-color: #4b5563;
  }
  .dark .question-editor .ql-editor table tr:nth-child(even) {
    background-color: rgba(255, 255, 255, 0.02);
  }
  .question-editor .ql-editor {
    min-height: 120px;
  }
  .question-editor .ql-toolbar {
    border-top-left-radius: 0.5rem;
    border-top-right-radius: 0.5rem;
    background: #f9fafb;
  }
  .dark .question-editor .ql-toolbar {
    background: #1f2937;
    border-color: #374151;
  }
  .dark .question-editor .ql-container {
    border-color: #374151;
  }
  .dark .question-editor .ql-editor {
    color: #f3f4f6;
  }
  .dark .question-editor .ql-editor.ql-blank::before {
    color: #6b7280;
  }
  .dark .question-editor .ql-stroke {
    stroke: #9ca3af;
  }
  .dark .question-editor .ql-fill {
    fill: #9ca3af;
  }
  .dark .question-editor .ql-picker {
    color: #9ca3af;
  }
  .dark .question-editor .ql-picker-options {
    background: #1f2937;
    border-color: #374151;
  }
`;

interface QuestionBuilderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (question: Question) => void;
  editingQuestion?: Question | null;
  questionNumber: number;
  examSettings?: ExamSettings;
}

// Quill modules configuration - defined outside component to prevent re-renders
const quillModules = {
  toolbar: [
    [{ 'header': [1, 2, 3, false] }],
    ['bold', 'italic', 'underline', 'strike'],
    [{ 'color': [] }, { 'background': [] }],
    [{ 'list': 'ordered'}, { 'list': 'bullet' }],
    [{ 'script': 'sub'}, { 'script': 'super' }],
    [{ 'indent': '-1'}, { 'indent': '+1' }],
    [{ 'align': [] }],
    ['formula', 'code-block'],
    ['link', 'image'],
    ['clean']
  ],
  clipboard: {
    // Preserve HTML formatting when pasting (including tables from Google Sheets)
    matchVisual: false,
  }
};

const QuestionBuilderModal: React.FC<QuestionBuilderModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingQuestion,
  questionNumber,
  examSettings
}) => {
  // Always show negative marks field - if user sets it, system will auto-switch to question-based
  const [questionData, setQuestionData] = useState<Partial<Question>>({
    questionType: 'MCQ',
    questionText: '',
    marks: 1,
    negativeMarks: 0,
    difficulty: 'Medium',
    enableRoughSpace: false,
    allowUpdateAfterSubmit: true,
    allowSeeQuestionAfterSubmit: true,
    // Short/Long Answer - wordLimit uses placeholder (50 for short, 100 for long)
    enableCalculator: false,
    enableScientificCalculator: false,
    enableTable: false,
    enableSpreadsheet: false
  });

  const [imagePreview, setImagePreview] = useState<string>('');
  const [numberOfOptions, setNumberOfOptions] = useState<number>(4); // Default: A, B, C, D
  const [validationError, setValidationError] = useState<string>('');
  const [selectedAnswers, setSelectedAnswers] = useState<string[]>([]);

  useEffect(() => {
    if (editingQuestion) {
      setQuestionData(editingQuestion);
      if (editingQuestion.questionImageUrl) {
        setImagePreview(editingQuestion.questionImageUrl);
      }
      // Count existing options
      const options = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];
      let count = 2; // Minimum A and B
      for (let i = 2; i < options.length; i++) {
        const optionKey = `option${options[i]}` as keyof Question;
        if (editingQuestion[optionKey]) {
          count = i + 1;
        }
      }
      setNumberOfOptions(Math.max(4, count)); // Minimum 4 options (A-D)

      // Initialize selected answers for multiple answer questions
      if (editingQuestion.hasMultipleAnswers && editingQuestion.correctAnswer) {
        setSelectedAnswers(editingQuestion.correctAnswer.split(',').map(a => a.trim()));
      } else {
        setSelectedAnswers([]);
      }
    } else {
      setQuestionData({
        questionType: 'MCQ',
        questionText: '',
        marks: 1,
        negativeMarks: 0,
        difficulty: 'Medium',
        enableRoughSpace: false,
        allowUpdateAfterSubmit: true,
        allowSeeQuestionAfterSubmit: true,
        hasMultipleAnswers: false,
        // Short/Long Answer - wordLimit uses placeholder (50 for short, 100 for long)
        enableCalculator: false,
        enableScientificCalculator: false,
        enableTable: false,
        enableSpreadsheet: false
      });
      setImagePreview('');
      setNumberOfOptions(4);
      setSelectedAnswers([]);
    }
  }, [editingQuestion, isOpen]);

  const handleChange = (field: keyof Question, value: any) => {
    // Handle question type change - clear type-specific fields
    if (field === 'questionType') {
      const newType = value as string;
      const isMCQType = newType === 'MCQ' || newType === 'MCQ_IMAGE';
      const isTextType = newType === 'SHORT_ANSWER' || newType === 'LONG_ANSWER';

      if (isTextType) {
        // Changing to SHORT_ANSWER or LONG_ANSWER - clear MCQ fields
        setQuestionData(prev => ({
          ...prev,
          questionType: newType,
          // Clear MCQ-specific fields
          optionA: undefined,
          optionB: undefined,
          optionC: undefined,
          optionD: undefined,
          optionE: undefined,
          optionF: undefined,
          optionG: undefined,
          optionH: undefined,
          optionI: undefined,
          optionJ: undefined,
          correctAnswer: undefined,
          hasMultipleAnswers: false,
          questionImageUrl: newType === 'SHORT_ANSWER' || newType === 'LONG_ANSWER' ? undefined : prev.questionImageUrl,
        }));
        setSelectedAnswers([]);
        setImagePreview('');
        setNumberOfOptions(4);
      } else if (isMCQType) {
        // Changing to MCQ or MCQ_IMAGE - clear text answer fields
        setQuestionData(prev => ({
          ...prev,
          questionType: newType,
          // Clear text-answer specific fields (wordLimit stays as it might be reused)
          wordLimit: undefined,
        }));
      } else {
        setQuestionData(prev => ({ ...prev, [field]: value }));
      }
      return;
    }

    setQuestionData(prev => ({ ...prev, [field]: value }));

    // Clear selected answers when toggling hasMultipleAnswers
    if (field === 'hasMultipleAnswers') {
      setSelectedAnswers([]);
      setQuestionData(prev => ({ ...prev, correctAnswer: '' }));
    }
  };

  const handleMultipleAnswerToggle = (option: string) => {
    setSelectedAnswers(prev => {
      if (prev.includes(option)) {
        return prev.filter(a => a !== option);
      } else {
        return [...prev, option];
      }
    });
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // For now, just show preview. In production, upload to Google Drive
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
        handleChange('questionImageUrl', reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Helper function to strip HTML tags and check if content is empty
  const isEmptyHtml = (html: string | undefined): boolean => {
    if (!html) return true;
    // Remove HTML tags
    const tmp = document.createElement('DIV');
    tmp.innerHTML = html;
    const text = tmp.textContent || tmp.innerText || '';
    // Check if remaining text is just whitespace
    return !text.trim();
  };

  const handleSave = () => {
    // Clear previous errors
    setValidationError('');

    // Validation - Question Text (must handle ReactQuill's HTML output)
    if (isEmptyHtml(questionData.questionText)) {
      setValidationError('Question text is required');
      return;
    }

    // Validation - Marks must be greater than 0
    if (!questionData.marks || questionData.marks <= 0) {
      setValidationError('Marks must be greater than 0');
      return;
    }

    if (questionData.questionType === 'MCQ' || questionData.questionType === 'MCQ_IMAGE') {
      // Check that at least options A and B have content (not just whitespace)
      const optionA = (questionData.optionA as string || '').trim();
      const optionB = (questionData.optionB as string || '').trim();

      if (!optionA || !optionB) {
        setValidationError('At least options A and B are required for MCQ questions');
        return;
      }

      // Check correct answer based on multiple answer setting
      if (questionData.hasMultipleAnswers) {
        if (selectedAnswers.length === 0) {
          setValidationError('Please select at least one correct answer');
          return;
        }
        // Verify all selected answers have content
        for (const answer of selectedAnswers) {
          const optionValue = (questionData[`option${answer}` as keyof Question] as string || '').trim();
          if (!optionValue) {
            setValidationError(`Option ${answer} is selected as correct but has no content`);
            return;
          }
        }
      } else {
        if (!questionData.correctAnswer) {
          setValidationError('Please select the correct answer');
          return;
        }
        // Verify the selected answer option has content
        const selectedOption = (questionData[`option${questionData.correctAnswer}` as keyof Question] as string || '').trim();
        if (!selectedOption) {
          setValidationError(`Option ${questionData.correctAnswer} is selected as correct but has no content`);
          return;
        }
      }
    }

    // Build the correct answer string for multiple answers
    let correctAnswerValue = questionData.correctAnswer;
    if (questionData.hasMultipleAnswers && selectedAnswers.length > 0) {
      correctAnswerValue = selectedAnswers.sort().join(',');
    }

    const finalQuestion: Question = {
      ...questionData as Question,
      correctAnswer: correctAnswerValue,
      questionNumber: editingQuestion?.questionNumber || questionNumber,
      questionId: editingQuestion?.questionId || `Q${Date.now()}`
    };

    onSave(finalQuestion);
    onClose();
  };

  if (!isOpen) return null;

  const isMCQ = questionData.questionType === 'MCQ' || questionData.questionType === 'MCQ_IMAGE';
  const showImageUpload = questionData.questionType === 'MCQ_IMAGE';

  return (
    <>
      <style>{tableStyles}</style>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            {editingQuestion ? 'Edit Question' : `Add Question ${questionNumber}`}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Question Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Question Type <span className="text-red-500">*</span>
            </label>
            <select
              value={questionData.questionType}
              onChange={(e) => handleChange('questionType', e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="MCQ">Multiple Choice (Text)</option>
              <option value="MCQ_IMAGE">Multiple Choice (With Image)</option>
              <option value="SHORT_ANSWER">Short Answer</option>
              <option value="LONG_ANSWER">Long Answer</option>
            </select>
          </div>

          {/* Question Text */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Question Text <span className="text-red-500">*</span>
            </label>
            <ReactQuill
              theme="snow"
              value={questionData.questionText || ''}
              onChange={(value) => handleChange('questionText', value)}
              placeholder="Enter your question here..."
              className="bg-white dark:bg-gray-700 rounded-lg question-editor"
              modules={quillModules}
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-1">
              <TableIcon className="w-3 h-3" />
              Tip: You can copy-paste tables directly from Google Sheets or Excel
            </p>
          </div>

          {/* Image Upload (for MCQ_IMAGE) */}
          {showImageUpload && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Question Image
              </label>
              <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-4">
                {imagePreview ? (
                  <div className="space-y-3">
                    <img
                      src={imagePreview}
                      alt="Question"
                      className="max-h-64 mx-auto rounded-lg"
                    />
                    <button
                      onClick={() => {
                        setImagePreview('');
                        handleChange('questionImageUrl', '');
                      }}
                      className="text-sm text-red-600 dark:text-red-400 hover:underline"
                    >
                      Remove Image
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center cursor-pointer">
                    <Upload className="w-12 h-12 text-gray-400 mb-2" />
                    <span className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                      Click to upload image
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-500">
                      PNG, JPG up to 5MB
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
            </div>
          )}

          {/* MCQ Options */}
          {isMCQ && (
            <div className="space-y-4">
              {/* Multiple Answers Toggle */}
              <div className="flex items-center gap-3 bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                <input
                  type="checkbox"
                  id="hasMultipleAnswers"
                  checked={questionData.hasMultipleAnswers || false}
                  onChange={(e) => handleChange('hasMultipleAnswers', e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="hasMultipleAnswers" className="text-sm font-medium text-blue-900 dark:text-blue-200">
                  This question has more than 1 correct answer
                </label>
              </div>

              <div className="flex items-center justify-between">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Answer Options <span className="text-red-500">*</span>
                  <span className="text-xs font-normal text-gray-500 dark:text-gray-400 ml-2">
                    ({numberOfOptions} options)
                  </span>
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setNumberOfOptions(Math.max(2, numberOfOptions - 1))}
                    disabled={numberOfOptions <= 2}
                    className="p-1.5 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded disabled:opacity-30 disabled:cursor-not-allowed"
                    title="Remove option"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setNumberOfOptions(Math.min(10, numberOfOptions + 1))}
                    disabled={numberOfOptions >= 10}
                    className="p-1.5 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 rounded disabled:opacity-30 disabled:cursor-not-allowed"
                    title="Add option"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'].slice(0, numberOfOptions).map((option) => (
                <div key={option} className="flex items-start gap-3">
                  {questionData.hasMultipleAnswers ? (
                    <input
                      type="checkbox"
                      checked={selectedAnswers.includes(option)}
                      onChange={() => handleMultipleAnswerToggle(option)}
                      className="mt-3 w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                    />
                  ) : (
                    <input
                      type="radio"
                      name="correctAnswer"
                      checked={questionData.correctAnswer === option}
                      onChange={() => handleChange('correctAnswer', option)}
                      className="mt-3"
                    />
                  )}
                  <div className="flex-1">
                    <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                      Option {option} {(option === 'A' || option === 'B') && <span className="text-red-500">*</span>}
                    </label>
                    <input
                      type="text"
                      value={questionData[`option${option}` as keyof Question] as string || ''}
                      onChange={(e) => handleChange(`option${option}` as keyof Question, e.target.value)}
                      placeholder={`Enter option ${option}`}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      required={option === 'A' || option === 'B'}
                    />
                  </div>
                </div>
              ))}
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {questionData.hasMultipleAnswers
                  ? 'Select all checkboxes that are correct answers. Use +/- buttons to add/remove options (2-10 options).'
                  : 'Select the radio button next to the correct answer. Use +/- buttons to add/remove options (2-10 options).'}
              </p>
            </div>
          )}

          {/* Short/Long Answer Settings - Word Limit */}
          {(questionData.questionType === 'SHORT_ANSWER' || questionData.questionType === 'LONG_ANSWER') && (
            <div className="space-y-3 border border-blue-200 dark:border-blue-800 rounded-xl p-5 bg-blue-50/50 dark:bg-blue-900/10">
              <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-200 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-800 flex items-center justify-center text-xs">✎</span>
                Answer Settings
              </h4>

              {/* Word Limit */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Word Limit
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    value={questionData.wordLimit ?? ''}
                    onChange={(e) => handleChange('wordLimit', e.target.value ? parseInt(e.target.value) : undefined)}
                    min="10"
                    max="5000"
                    placeholder={questionData.questionType === 'SHORT_ANSWER' ? '50' : '100'}
                    className="w-32 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <span className="text-sm text-gray-600 dark:text-gray-400">words maximum</span>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {questionData.questionType === 'SHORT_ANSWER'
                    ? 'Default: 50 words for short answers'
                    : 'Default: 100 words for long answers'}
                </p>
              </div>
            </div>
          )}

          {/* Available Tools - For All Question Types */}
          <div className="space-y-3 border border-gray-200 dark:border-gray-700 rounded-xl p-5 bg-gray-50 dark:bg-gray-900/50">
            <h4 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <Calculator className="w-4 h-4 text-gray-600 dark:text-gray-400" />
              Available Tools
            </h4>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Select tools students can access while answering this question
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Calculator */}
              <label className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                questionData.enableCalculator
                  ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
              }`}>
                <input
                  type="checkbox"
                  checked={questionData.enableCalculator || false}
                  onChange={(e) => handleChange('enableCalculator', e.target.checked)}
                  className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                />
                <div className="flex items-center gap-2">
                  <Calculator className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                  <div>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">Calculator</span>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Basic arithmetic</p>
                  </div>
                </div>
              </label>

              {/* Scientific Calculator */}
              <label className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                questionData.enableScientificCalculator
                  ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
              }`}>
                <input
                  type="checkbox"
                  checked={questionData.enableScientificCalculator || false}
                  onChange={(e) => handleChange('enableScientificCalculator', e.target.checked)}
                  className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                />
                <div className="flex items-center gap-2">
                  <Calculator className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  <div>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">Scientific Calculator</span>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Trig, log, powers</p>
                  </div>
                </div>
              </label>

              {/* Table */}
              <label className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                questionData.enableTable
                  ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
              }`}>
                <input
                  type="checkbox"
                  checked={questionData.enableTable || false}
                  onChange={(e) => handleChange('enableTable', e.target.checked)}
                  className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                />
                <div className="flex items-center gap-2">
                  <TableIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  <div>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">Simple Table</span>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Basic editable table</p>
                  </div>
                </div>
              </label>

              {/* Spreadsheet */}
              <label className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                questionData.enableSpreadsheet
                  ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
              }`}>
                <input
                  type="checkbox"
                  checked={questionData.enableSpreadsheet || false}
                  onChange={(e) => handleChange('enableSpreadsheet', e.target.checked)}
                  className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                />
                <div className="flex items-center gap-2">
                  <Grid3X3 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  <div>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">Spreadsheet Mode</span>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Excel-like for accounting</p>
                  </div>
                </div>
              </label>
            </div>

            {/* Tool Info */}
            {(questionData.enableCalculator && questionData.enableScientificCalculator) && (
              <p className="text-xs text-amber-600 dark:text-amber-400 mt-2 flex items-center gap-1">
                <span>ℹ️</span> When both calculators are enabled, only Scientific Calculator will be shown to students
              </p>
            )}
          </div>

          {/* Marks, Negative Marks, Difficulty */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Marks <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={questionData.marks ?? ''}
                onChange={(e) => handleChange('marks', parseFloat(e.target.value) || 0)}
                min="0"
                step="0.5"
                placeholder="0"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Negative Marks
              </label>
              <input
                type="number"
                value={questionData.negativeMarks ?? ''}
                onChange={(e) => handleChange('negativeMarks', parseFloat(e.target.value) || 0)}
                min="0"
                step="0.25"
                placeholder="0"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Setting this will auto-enable question-based negative marking
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Difficulty <span className="text-red-500">*</span>
              </label>
              <select
                value={questionData.difficulty}
                onChange={(e) => handleChange('difficulty', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="Easy">Easy</option>
                <option value="Medium">Medium</option>
                <option value="Hard">Hard</option>
              </select>
            </div>
          </div>

          {/* Explanation */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Explanation (Optional)
            </label>
            <textarea
              value={questionData.explanation || ''}
              onChange={(e) => handleChange('explanation', e.target.value)}
              placeholder="Provide an explanation for the correct answer..."
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>

          {/* Enable Rough Space */}
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="enableRoughSpace"
              checked={questionData.enableRoughSpace || false}
              onChange={(e) => handleChange('enableRoughSpace', e.target.checked)}
              className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
            />
            <label htmlFor="enableRoughSpace" className="text-sm text-gray-700 dark:text-gray-300">
              Enable rough space for this question
            </label>
          </div>

          {/* Answer Submission Settings */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4">
            <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
              Answer Submission Settings
            </h4>

            <div className="space-y-3">
              {/* Allow Update After Submit */}
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="allowUpdateAfterSubmit"
                  checked={questionData.allowUpdateAfterSubmit !== false}
                  onChange={(e) => handleChange('allowUpdateAfterSubmit', e.target.checked)}
                  className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                />
                <label htmlFor="allowUpdateAfterSubmit" className="text-sm text-gray-700 dark:text-gray-300">
                  Allow students to update their answer after submitting
                </label>
              </div>

              {/* Allow See Question After Submit */}
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="allowSeeQuestionAfterSubmit"
                  checked={questionData.allowSeeQuestionAfterSubmit !== false}
                  onChange={(e) => handleChange('allowSeeQuestionAfterSubmit', e.target.checked)}
                  className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                />
                <label htmlFor="allowSeeQuestionAfterSubmit" className="text-sm text-gray-700 dark:text-gray-300">
                  Allow students to see the question after submitting
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 px-6 py-4">
          {validationError && (
            <div className="mb-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-2">
              <X className="w-4 h-4 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-600 dark:text-red-400">{validationError}</p>
            </div>
          )}
          <div className="flex items-center justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
            >
              {editingQuestion ? 'Update Question' : 'Add Question'}
            </button>
          </div>
        </div>
        </div>
      </div>
    </>
  );
};

export default QuestionBuilderModal;
