import React, { useState } from 'react';
import { CheckCircle2, Clock, FileText, Settings, Lock, AlertCircle, ChevronDown, ChevronUp, Calculator, Table, Grid3X3, Hash } from 'lucide-react';

interface PreviewTabProps {
  examData: any;
  onPublish: () => void;
}

export default function PreviewTab({ examData, onPublish }: PreviewTabProps) {
  const isPractice = examData.isPractice === true;
  const [expandedQuestions, setExpandedQuestions] = useState<Set<number>>(new Set());

  const toggleQuestion = (index: number) => {
    const newExpanded = new Set(expandedQuestions);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedQuestions(newExpanded);
  };

  const expandAll = () => {
    const allIndexes = new Set<number>((examData.questions || []).map((_: any, i: number) => i));
    setExpandedQuestions(allIndexes);
  };

  const collapseAll = () => {
    setExpandedQuestions(new Set());
  };

  // Get option labels
  const getOptionLabel = (index: number) => String.fromCharCode(65 + index); // A, B, C, D...

  // Strip HTML tags for preview
  const stripHtml = (html: string) => {
    if (!html) return '';
    const tmp = document.createElement('DIV');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
  };

  // Get question type badge color
  const getTypeBadgeColor = (type: string) => {
    switch (type) {
      case 'MCQ': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300';
      case 'MCQ_IMAGE': return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300';
      case 'SHORT_ANSWER': return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300';
      case 'LONG_ANSWER': return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300';
      default: return 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-300';
    }
  };

  // Get difficulty badge color
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300';
      case 'Medium': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300';
      case 'Hard': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300';
      default: return 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-300';
    }
  };

  const allChecks = [
    {
      label: 'Basic details completed',
      completed: examData.examTitle && examData.examType && examData.subject,
      icon: FileText
    },
    {
      label: 'At least one question added',
      completed: (examData.questions || []).length > 0,
      icon: FileText
    },
    {
      label: 'Duration and marks configured',
      completed: examData.duration > 0 && examData.totalMarks > 0,
      icon: Clock
    },
    {
      label: 'Password configured',
      completed: examData.passwordType === 'UNIQUE' || examData.masterPassword,
      icon: Lock,
      hideForPractice: true
    },
    {
      label: 'Settings configured',
      completed: examData.settings && examData.settings.proctoring,
      icon: Settings,
      hideForPractice: true
    }
  ];

  // Filter checks based on practice mode
  const readinessChecks = isPractice
    ? allChecks.filter(check => !check.hideForPractice)
    : allChecks;

  const allChecksCompleted = readinessChecks.every(check => check.completed);

  return (
    <div className="space-y-6">
      {/* Exam Summary */}
      <div className="p-6 border border-border rounded-xl bg-card">
        <h3 className="text-xl font-bold text-foreground mb-4">{examData.examTitle || 'Untitled Exam'}</h3>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div>
            <p className="text-sm text-muted-foreground">Type</p>
            <p className="font-medium text-foreground">{examData.examType || '-'}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Subject</p>
            <p className="font-medium text-foreground">{examData.subject || '-'}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Duration</p>
            <p className="font-medium text-foreground">{examData.duration || 0} mins</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Total Marks</p>
            <p className="font-medium text-foreground">{examData.totalMarks || 0}</p>
          </div>
        </div>

        {examData.description && (
          <div className="mb-4">
            <p className="text-sm text-muted-foreground mb-1">Description</p>
            <p className="text-sm text-foreground">{examData.description}</p>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-muted-foreground mb-1">Start Date & Time</p>
            <p className="text-sm font-medium text-foreground">{examData.startDateTime || 'Not set'}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground mb-1">End Date & Time</p>
            <p className="text-sm font-medium text-foreground">{examData.endDateTime || 'Not set'}</p>
          </div>
        </div>
      </div>

      {/* Readiness Checklist */}
      <div className="p-6 border border-border rounded-xl bg-card">
        <h4 className="font-semibold text-foreground mb-4">Pre-Publish Checklist</h4>
        <div className="space-y-3">
          {readinessChecks.map((check, index) => {
            const Icon = check.icon;
            return (
              <div
                key={index}
                className={`flex items-center gap-3 p-3 rounded-lg ${
                  check.completed
                    ? 'bg-green-500/10 border border-green-500/20'
                    : 'bg-orange-500/10 border border-orange-500/20'
                }`}
              >
                {check.completed ? (
                  <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                )}
                <Icon className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-foreground">{check.label}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Questions Summary Stats */}
      <div className="p-6 border border-border rounded-xl bg-card">
        <h4 className="font-semibold text-foreground mb-4">Questions Summary</h4>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-4 bg-secondary/10 rounded-lg">
            <p className="text-2xl font-bold text-foreground">{(examData.questions || []).length}</p>
            <p className="text-sm text-muted-foreground">Total Questions</p>
          </div>
          <div className="text-center p-4 bg-secondary/10 rounded-lg">
            <p className="text-2xl font-bold text-foreground">
              {(examData.questions || []).reduce((sum: number, q: any) => sum + (q.marks || 0), 0)}
            </p>
            <p className="text-sm text-muted-foreground">Sum of Marks</p>
          </div>
          <div className="text-center p-4 bg-secondary/10 rounded-lg">
            <p className="text-2xl font-bold text-foreground">{examData.passingMarks || 0}</p>
            <p className="text-sm text-muted-foreground">Passing Marks</p>
          </div>
        </div>
      </div>

      {/* Detailed Questions Preview */}
      {(examData.questions || []).length > 0 && (
        <div className="p-6 border border-border rounded-xl bg-card">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-semibold text-foreground">Questions Detail Preview</h4>
            <div className="flex items-center gap-2">
              <button
                onClick={expandAll}
                className="text-xs px-3 py-1.5 text-primary hover:bg-primary/10 rounded-lg transition-colors"
              >
                Expand All
              </button>
              <button
                onClick={collapseAll}
                className="text-xs px-3 py-1.5 text-primary hover:bg-primary/10 rounded-lg transition-colors"
              >
                Collapse All
              </button>
            </div>
          </div>

          <div className="space-y-3">
            {(examData.questions || []).map((question: any, index: number) => {
              const isExpanded = expandedQuestions.has(index);
              const options = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J']
                .map(letter => ({ letter, value: question[`option${letter}`] }))
                .filter(opt => opt.value && opt.value.trim() !== '');

              return (
                <div
                  key={index}
                  className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden"
                >
                  {/* Question Header - Always Visible */}
                  <button
                    onClick={() => toggleQuestion(index)}
                    className="w-full flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-left"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-semibold text-sm">
                        {index + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">
                          {stripHtml(question.questionText) || 'No question text'}
                        </p>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <span className={`text-xs px-2 py-0.5 rounded-full ${getTypeBadgeColor(question.questionType)}`}>
                            {question.questionType?.replace('_', ' ') || 'MCQ'}
                          </span>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${getDifficultyColor(question.difficulty)}`}>
                            {question.difficulty || 'Medium'}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {question.marks || 0} marks
                          </span>
                        </div>
                      </div>
                    </div>
                    {isExpanded ? (
                      <ChevronUp className="w-5 h-5 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-muted-foreground" />
                    )}
                  </button>

                  {/* Question Details - Expandable */}
                  {isExpanded && (
                    <div className="p-4 border-t border-gray-200 dark:border-gray-700 space-y-4">
                      {/* Question Text */}
                      <div>
                        <p className="text-xs font-medium text-muted-foreground mb-1">Question</p>
                        <div
                          className="text-sm text-foreground prose dark:prose-invert max-w-none"
                          dangerouslySetInnerHTML={{ __html: question.questionText || '' }}
                        />
                      </div>

                      {/* Question Image */}
                      {question.questionImageUrl && (
                        <div>
                          <p className="text-xs font-medium text-muted-foreground mb-1">Image</p>
                          <img
                            src={question.questionImageUrl}
                            alt="Question"
                            className="max-w-md rounded-lg border border-gray-200 dark:border-gray-700"
                          />
                        </div>
                      )}

                      {/* MCQ Options */}
                      {(question.questionType === 'MCQ' || question.questionType === 'MCQ_IMAGE') && options.length > 0 && (
                        <div>
                          <p className="text-xs font-medium text-muted-foreground mb-2">Options</p>
                          <div className="space-y-2">
                            {options.map((opt) => {
                              const isCorrect = question.correctAnswer?.split(',').map((a: string) => a.trim()).includes(opt.letter);
                              return (
                                <div
                                  key={opt.letter}
                                  className={`flex items-start gap-2 p-2 rounded-lg ${
                                    isCorrect
                                      ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
                                      : 'bg-gray-50 dark:bg-gray-800/50'
                                  }`}
                                >
                                  <span className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-medium ${
                                    isCorrect
                                      ? 'bg-green-500 text-white'
                                      : 'bg-gray-200 dark:bg-gray-700 text-foreground'
                                  }`}>
                                    {opt.letter}
                                  </span>
                                  <span className="text-sm text-foreground flex-1">{opt.value}</span>
                                  {isCorrect && (
                                    <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400" />
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Short/Long Answer - Word Limit */}
                      {(question.questionType === 'SHORT_ANSWER' || question.questionType === 'LONG_ANSWER') && (
                        <div>
                          <p className="text-xs font-medium text-muted-foreground mb-2">Word Limit</p>
                          <span className="flex items-center gap-1 text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full w-fit">
                            <Hash className="w-3 h-3" />
                            {question.wordLimit || (question.questionType === 'SHORT_ANSWER' ? 50 : 100)} words max
                          </span>
                        </div>
                      )}

                      {/* Available Tools - For All Question Types */}
                      {(question.enableCalculator || question.enableScientificCalculator || question.enableTable || question.enableSpreadsheet) && (
                        <div>
                          <p className="text-xs font-medium text-muted-foreground mb-2">Available Tools</p>
                          <div className="flex flex-wrap gap-2">
                            {question.enableCalculator && (
                              <span className="flex items-center gap-1 text-xs px-2 py-1 bg-gray-100 dark:bg-gray-800 text-foreground rounded-full">
                                <Calculator className="w-3 h-3" />
                                Calculator
                              </span>
                            )}
                            {question.enableScientificCalculator && (
                              <span className="flex items-center gap-1 text-xs px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full">
                                <Calculator className="w-3 h-3" />
                                Scientific
                              </span>
                            )}
                            {question.enableTable && (
                              <span className="flex items-center gap-1 text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full">
                                <Table className="w-3 h-3" />
                                Table
                              </span>
                            )}
                            {question.enableSpreadsheet && (
                              <span className="flex items-center gap-1 text-xs px-2 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 rounded-full">
                                <Grid3X3 className="w-3 h-3" />
                                Spreadsheet
                              </span>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Marks & Settings */}
                      <div className="flex flex-wrap gap-4 pt-2 border-t border-gray-200 dark:border-gray-700">
                        <div>
                          <p className="text-xs text-muted-foreground">Marks</p>
                          <p className="text-sm font-medium text-foreground">{question.marks || 0}</p>
                        </div>
                        {question.negativeMarks > 0 && (
                          <div>
                            <p className="text-xs text-muted-foreground">Negative Marks</p>
                            <p className="text-sm font-medium text-red-600 dark:text-red-400">-{question.negativeMarks}</p>
                          </div>
                        )}
                        {question.explanation && (
                          <div className="flex-1">
                            <p className="text-xs text-muted-foreground">Explanation</p>
                            <p className="text-sm text-foreground">{question.explanation}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Publish Button */}
      <div className="flex items-center justify-between p-6 border border-border rounded-xl bg-card">
        <div>
          <p className="font-medium text-foreground mb-1">Ready to publish?</p>
          <p className="text-sm text-muted-foreground">
            {allChecksCompleted
              ? 'Your exam is ready to be published!'
              : 'Please complete all checklist items before publishing'}
          </p>
        </div>
        <button
          onClick={onPublish}
          disabled={!allChecksCompleted}
          className={`px-6 py-3 rounded-lg font-medium transition-colors ${
            allChecksCompleted
              ? 'bg-primary text-primary-foreground hover:bg-primary/90'
              : 'bg-secondary text-secondary-foreground cursor-not-allowed opacity-50'
          }`}
        >
          Publish Exam
        </button>
      </div>
    </div>
  );
}
