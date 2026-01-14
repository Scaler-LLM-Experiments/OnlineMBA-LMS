import React from 'react';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';

interface QuillEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export const QuillEditor: React.FC<QuillEditorProps> = ({ value, onChange, placeholder }) => {
  const modules = {
    toolbar: [
      [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
      [{ 'font': [] }],
      [{ 'size': ['small', false, 'large', 'huge'] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'color': [] }, { 'background': [] }],
      [{ 'script': 'sub' }, { 'script': 'super' }],
      [{ 'list': 'ordered' }, { 'list': 'bullet' }],
      [{ 'indent': '-1' }, { 'indent': '+1' }],
      [{ 'align': [] }],
      ['blockquote', 'code-block'],
      ['link', 'image', 'video'],
      ['clean']
    ]
  };

  const formats = [
    'header', 'font', 'size',
    'bold', 'italic', 'underline', 'strike',
    'color', 'background',
    'script',
    'list', 'bullet', 'indent',
    'align',
    'blockquote', 'code-block',
    'link', 'image', 'video'
  ];

  return (
    <div className="quill-editor-wrapper">
      <style dangerouslySetInnerHTML={{
        __html: `
          .quill-editor-wrapper .ql-container {
            min-height: 200px;
            font-size: 14px;
          }

          .quill-editor-wrapper .ql-editor {
            min-height: 200px;
          }

          .quill-editor-wrapper .ql-toolbar {
            border-top-left-radius: 0.5rem;
            border-top-right-radius: 0.5rem;
            background: hsl(var(--muted));
            border: 1px solid hsl(var(--border));
          }

          .quill-editor-wrapper .ql-container {
            border-bottom-left-radius: 0.5rem;
            border-bottom-right-radius: 0.5rem;
            border: 1px solid hsl(var(--border));
            border-top: none;
          }

          .quill-editor-wrapper .ql-editor.ql-blank::before {
            color: hsl(var(--muted-foreground));
            font-style: italic;
          }

          .dark .quill-editor-wrapper .ql-toolbar {
            background: hsl(var(--muted));
            border-color: hsl(var(--border));
          }

          .dark .quill-editor-wrapper .ql-container {
            background: hsl(var(--background));
            color: hsl(var(--foreground));
            border-color: hsl(var(--border));
          }

          .dark .quill-editor-wrapper .ql-editor {
            color: hsl(var(--foreground));
          }

          .dark .quill-editor-wrapper .ql-stroke {
            stroke: hsl(var(--foreground));
          }

          .dark .quill-editor-wrapper .ql-fill {
            fill: hsl(var(--foreground));
          }

          .dark .quill-editor-wrapper .ql-picker-label {
            color: hsl(var(--foreground));
          }

          .dark .quill-editor-wrapper .ql-picker-options {
            background: hsl(var(--background));
            border-color: hsl(var(--border));
          }
        `
      }} />
      <ReactQuill
        theme="snow"
        value={value}
        onChange={onChange}
        modules={modules}
        formats={formats}
        placeholder={placeholder}
        className="bg-background"
      />
    </div>
  );
};
