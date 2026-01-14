/**
 * Rich Text Answer Editor
 * Used for Short Answer and Long Answer question types
 * Features:
 * - Restricted toolbar (exam-safe)
 * - Live word count with limit enforcement
 * - Clean text with light formatting only
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';

interface RichTextAnswerEditorProps {
  value: string;
  onChange: (value: string) => void;
  wordLimit: number;
  disabled?: boolean;
  placeholder?: string;
  minHeight?: string;
}

// Count words in HTML content
const countWords = (html: string): number => {
  if (!html) return 0;
  // Remove HTML tags
  const text = html.replace(/<[^>]*>/g, ' ')
    // Remove HTML entities
    .replace(/&nbsp;/g, ' ')
    .replace(/&[a-z]+;/gi, ' ')
    // Normalize whitespace
    .replace(/\s+/g, ' ')
    .trim();

  if (!text) return 0;
  return text.split(/\s+/).filter(word => word.length > 0).length;
};

// Strip HTML and get plain text
const getPlainText = (html: string): string => {
  if (!html) return '';
  return html.replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&[a-z]+;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
};

const RichTextAnswerEditor: React.FC<RichTextAnswerEditorProps> = ({
  value,
  onChange,
  wordLimit,
  disabled = false,
  placeholder = 'Type your answer here...',
  minHeight = '200px'
}) => {
  const [wordCount, setWordCount] = useState(0);
  const [isOverLimit, setIsOverLimit] = useState(false);
  const [lastValidContent, setLastValidContent] = useState(value);

  // Update word count when value changes
  useEffect(() => {
    const count = countWords(value);
    setWordCount(count);
    setIsOverLimit(count > wordLimit);
  }, [value, wordLimit]);

  // Handle content change with word limit enforcement
  const handleChange = useCallback((content: string) => {
    const newWordCount = countWords(content);

    if (newWordCount <= wordLimit) {
      setLastValidContent(content);
      onChange(content);
    } else {
      // Word limit exceeded - truncate to limit
      const plainText = getPlainText(content);
      const words = plainText.split(/\s+/);
      const truncatedWords = words.slice(0, wordLimit);
      const truncatedText = truncatedWords.join(' ');

      // Keep the last valid content and show warning
      onChange(lastValidContent);
    }
  }, [wordLimit, onChange, lastValidContent]);

  // Restricted toolbar modules (exam-safe)
  const modules = useMemo(() => ({
    toolbar: [
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'list': 'ordered' }, { 'list': 'bullet' }],
      [{ 'align': [] }],
      ['clean']
    ],
    clipboard: {
      matchVisual: false,
      // Prevent paste with external formatting
    }
  }), []);

  // Allowed formats (restricted for exam integrity)
  // Note: 'image' is allowed for inserted drawings/spreadsheets from answer tools
  const formats = [
    'bold', 'italic', 'underline', 'strike',
    'list', 'bullet',
    'align',
    'image'
  ];

  // Calculate percentage for visual indicator
  const percentage = Math.min((wordCount / wordLimit) * 100, 100);
  const getProgressColor = () => {
    if (percentage >= 100) return 'bg-red-500';
    if (percentage >= 80) return 'bg-amber-500';
    return 'bg-green-500';
  };

  return (
    <div className="rich-text-answer-editor">
      {/* Editor */}
      <div
        className={`border-2 rounded-xl overflow-hidden transition-all ${
          disabled
            ? 'opacity-60 cursor-not-allowed border-gray-200 dark:border-gray-700'
            : isOverLimit
              ? 'border-red-400 dark:border-red-600'
              : 'border-gray-200 dark:border-gray-700 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20'
        }`}
      >
        <ReactQuill
          theme="snow"
          value={value}
          onChange={handleChange}
          modules={modules}
          formats={formats}
          placeholder={placeholder}
          readOnly={disabled}
          className="bg-white dark:bg-gray-800"
          style={{ minHeight }}
        />
      </div>

      {/* Word Count Display */}
      <div className="mt-3 flex items-center justify-between gap-4">
        {/* Progress Bar */}
        <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-300 ${getProgressColor()}`}
            style={{ width: `${percentage}%` }}
          />
        </div>

        {/* Word Count Text */}
        <div className={`text-sm font-medium whitespace-nowrap ${
          isOverLimit
            ? 'text-red-600 dark:text-red-400'
            : wordCount >= wordLimit * 0.8
              ? 'text-amber-600 dark:text-amber-400'
              : 'text-gray-600 dark:text-gray-400'
        }`}>
          {wordCount} / {wordLimit} words
          {wordLimit - wordCount > 0 && (
            <span className="text-gray-400 dark:text-gray-500 ml-1">
              ({wordLimit - wordCount} remaining)
            </span>
          )}
        </div>
      </div>

      {/* Warning Message */}
      {isOverLimit && (
        <p className="mt-2 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
          <span>⚠️</span> Word limit exceeded. Please reduce your answer.
        </p>
      )}

      {/* Custom Styles */}
      <style>{`
        .rich-text-answer-editor .ql-container {
          font-family: inherit;
          font-size: 1rem;
          min-height: ${minHeight};
        }
        .rich-text-answer-editor .ql-editor {
          min-height: ${minHeight};
          padding: 1rem;
          line-height: 1.6;
        }
        .rich-text-answer-editor .ql-editor.ql-blank::before {
          font-style: normal;
          color: #9ca3af;
        }
        .rich-text-answer-editor .ql-toolbar {
          border: none;
          border-bottom: 1px solid #e5e7eb;
          background: #f9fafb;
        }
        .dark .rich-text-answer-editor .ql-toolbar {
          background: #1f2937;
          border-color: #374151;
        }
        .rich-text-answer-editor .ql-container {
          border: none;
        }
        .dark .rich-text-answer-editor .ql-editor {
          color: #f3f4f6;
        }
        .dark .rich-text-answer-editor .ql-editor.ql-blank::before {
          color: #6b7280;
        }
        /* Hide unwanted toolbar buttons */
        .rich-text-answer-editor .ql-toolbar .ql-image,
        .rich-text-answer-editor .ql-toolbar .ql-video,
        .rich-text-answer-editor .ql-toolbar .ql-link,
        .rich-text-answer-editor .ql-toolbar .ql-code-block {
          display: none !important;
        }
      `}</style>
    </div>
  );
};

export default RichTextAnswerEditor;
