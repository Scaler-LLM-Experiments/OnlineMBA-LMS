/**
 * Basic Details Tab
 * Tab 1: Exam Classification, Basic Information, Schedule, Instructions
 */

import React, { useEffect, useState } from 'react';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import './BasicDetailsTab.css';
import type { Exam } from '../../services/examApi';
import { getTermStructureExam, getExamTypes } from '../../services/examApi';
import type { TermMapping } from '../../../services/formsApi';

interface BasicDetailsTabProps {
  data: Partial<Exam>;
  onChange: (updates: Partial<Exam>) => void;
}

const BasicDetailsTab: React.FC<BasicDetailsTabProps> = ({ data, onChange }) => {
  const [examTypes, setExamTypes] = useState<string[]>([]);
  const [terms, setTerms] = useState<string[]>([]);
  const [termMappings, setTermMappings] = useState<TermMapping[]>([]);
  const [batches, setBatches] = useState<string[]>([]);
  const [availableDomains, setAvailableDomains] = useState<string[]>([]);
  const [availableSubjects, setAvailableSubjects] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('Exam Types State Updated:', examTypes);
  }, [examTypes]);

  useEffect(() => {
    fetchDropdownData();
  }, []);

  // Removed auto-selection of default values - user should select manually

  useEffect(() => {
    if (data.term && termMappings.length > 0) {
      // Get unique domains for selected term
      const filtered = termMappings.filter(m => m.term === data.term);
      const domains = Array.from(new Set(filtered.map(m => m.domain))).sort();
      setAvailableDomains(domains);

      // Reset domain and subject if current selections are invalid
      if (data.domain && !domains.includes(data.domain)) {
        onChange({ domain: '', subject: '' });
      }
    }
  }, [data.term, termMappings]);

  useEffect(() => {
    if (data.term && data.domain && termMappings.length > 0) {
      // Get unique subjects for selected term and domain
      const filtered = termMappings.filter(m =>
        m.term === data.term && m.domain === data.domain
      );
      const subjects = Array.from(new Set(filtered.map(m => m.subject))).sort();
      setAvailableSubjects(subjects);

      // Reset subject if current selection is invalid
      if (data.subject && !subjects.includes(data.subject)) {
        onChange({ subject: '' });
      }
    }
  }, [data.term, data.domain, termMappings]);

  const fetchDropdownData = async () => {
    try {
      setLoading(true);

      // Fetch term structure (terms, domains, subjects, batches)
      const termResult = await getTermStructureExam();
      console.log('Term Structure Result:', termResult);
      if (termResult.success && termResult.data) {
        setTerms(termResult.data.terms || []);
        setTermMappings(termResult.data.mappings || []);
        setBatches(termResult.data.batches || []);
      }

      // Fetch exam types from CATEGORY&TYPE sheet
      const typesResult = await getExamTypes();
      console.log('Exam Types Result:', typesResult);
      if (typesResult.success && typesResult.data) {
        console.log('Setting exam types:', typesResult.data);
        setExamTypes(typesResult.data);
      } else {
        console.log('Exam types not set - result not successful or no data');
      }
    } catch (error) {
      console.error('Error fetching dropdown data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: keyof Exam, value: any) => {
    onChange({ [field]: value });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Section 1: Exam Classification */}
      <section className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Exam Classification
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Categorize your exam for better organization
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Exam Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Exam Type <span className="text-red-500">*</span>
            </label>
            <select
              value={data.examType || ''}
              onChange={(e) => handleChange('examType', e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
              required
            >
              <option value="">Select exam type</option>
              {examTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Choose the type of assessment
            </p>
          </div>

          {/* Practice Mode */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Mode
            </label>
            <div className="flex items-center gap-4 h-[42px]">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="isPractice"
                  checked={!(data as any).isPractice}
                  onChange={() => handleChange('isPractice' as any, false)}
                  className="w-4 h-4 text-green-600 focus:ring-green-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">Exam Mode</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="isPractice"
                  checked={(data as any).isPractice === true}
                  onChange={() => handleChange('isPractice' as any, true)}
                  className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">Practice Mode</span>
              </label>
            </div>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Practice mode: No proctoring, students can review questions freely
            </p>
          </div>

          {/* Device Allowed */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Devices Allowed <span className="text-red-500">*</span>
            </label>
            <div className="space-y-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="deviceAllowed"
                  checked={(data as any).deviceAllowed === 'All'}
                  onChange={() => handleChange('deviceAllowed' as any, 'All')}
                  className="w-4 h-4 text-green-600 focus:ring-green-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">All Devices</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="deviceAllowed"
                  checked={(data as any).deviceAllowed === 'Laptop/Computer' || !(data as any).deviceAllowed}
                  onChange={() => handleChange('deviceAllowed' as any, 'Laptop/Computer')}
                  className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">Laptop/Computer (Windows or Mac)</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="deviceAllowed"
                  checked={(data as any).deviceAllowed === 'Mobile/Tab'}
                  onChange={() => handleChange('deviceAllowed' as any, 'Mobile/Tab')}
                  className="w-4 h-4 text-purple-600 focus:ring-purple-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">Mobile/Tab</span>
              </label>
            </div>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Restrict which devices students can use to take this exam
            </p>
          </div>

          {/* Batch */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Batch <span className="text-red-500">*</span>
            </label>
            <select
              value={(data as any).batch || ''}
              onChange={(e) => handleChange('batch' as any, e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
              required
            >
              <option value="">Select batch</option>
              {batches.map((batch) => (
                <option key={batch} value={batch}>
                  {batch}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Student batch for this exam
            </p>
          </div>

          {/* Term */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Term <span className="text-red-500">*</span>
            </label>
            <select
              value={data.term || ''}
              onChange={(e) => handleChange('term', e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
              required
            >
              <option value="">Select term</option>
              {terms.map((term) => (
                <option key={term} value={term}>
                  {term}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Academic term for this exam
            </p>
          </div>

          {/* Domain */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Domain <span className="text-red-500">*</span>
            </label>
            <select
              value={data.domain || ''}
              onChange={(e) => handleChange('domain', e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
              required
              disabled={!data.term}
            >
              <option value="">Select domain</option>
              {availableDomains.map((domain) => (
                <option key={domain} value={domain}>
                  {domain}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              {!data.term ? 'Select a term first' : 'Subject domain or category'}
            </p>
          </div>

          {/* Subject */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Subject <span className="text-red-500">*</span>
            </label>
            <select
              value={data.subject || ''}
              onChange={(e) => handleChange('subject', e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
              required
              disabled={!data.domain}
            >
              <option value="">Select subject</option>
              {availableSubjects.map((subject) => (
                <option key={subject} value={subject}>
                  {subject}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              {!data.domain ? 'Select a domain first' : 'Specific subject for the exam'}
            </p>
          </div>
        </div>
      </section>

      {/* Section 2: Basic Information */}
      <section className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Basic Information
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Essential details about the exam
          </p>
        </div>

        <div className="space-y-6">
          {/* Exam Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Exam Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={data.examTitle || ''}
              onChange={(e) => handleChange('examTitle', e.target.value)}
              placeholder="e.g., Data Structures Mid-Term Exam"
              className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Description
            </label>
            <textarea
              value={data.description || ''}
              onChange={(e) => handleChange('description', e.target.value)}
              placeholder="Brief description of the exam content and objectives"
              rows={3}
              className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>

          {/* Duration, Total Marks, Passing Marks */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Duration (minutes) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={data.duration !== undefined && data.duration !== null ? data.duration : ''}
                onChange={(e) => {
                  const val = e.target.value;
                  handleChange('duration', val === '' ? undefined : parseInt(val));
                }}
                min="1"
                placeholder="0"
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Total Marks <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={data.totalMarks !== undefined && data.totalMarks !== null ? data.totalMarks : ''}
                onChange={(e) => {
                  const val = e.target.value;
                  handleChange('totalMarks', val === '' ? undefined : parseInt(val));
                }}
                min="1"
                placeholder="0"
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Passing Marks
              </label>
              <input
                type="number"
                value={data.passingMarks !== undefined && data.passingMarks !== null ? data.passingMarks : ''}
                onChange={(e) => {
                  const val = e.target.value;
                  handleChange('passingMarks', val === '' ? undefined : parseInt(val));
                }}
                min="0"
                max={data.totalMarks || 100}
                placeholder="0"
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Section 3: Schedule */}
      <section className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Schedule
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Set when the exam will be available
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Start Date & Time <span className="text-red-500">*</span>
            </label>
            <input
              type="datetime-local"
              value={data.startDateTime || ''}
              onChange={(e) => handleChange('startDateTime', e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              End Date & Time <span className="text-red-500">*</span>
            </label>
            <input
              type="datetime-local"
              value={data.endDateTime || ''}
              onChange={(e) => handleChange('endDateTime', e.target.value)}
              min={data.startDateTime}
              className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
              required
            />
          </div>
        </div>
      </section>

      {/* Section 4: Instructions */}
      <section className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Instructions <span className="text-red-500">*</span>
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Guidelines for students taking the exam (required)
          </p>
        </div>

        <div>
          <ReactQuill
            theme="snow"
            value={data.instructions || ''}
            onChange={(value) => handleChange('instructions', value)}
            placeholder="Enter exam instructions, rules, and guidelines for students... (Required)"
            className="bg-white dark:bg-gray-700 rounded-lg"
            modules={{
              toolbar: [
                [{ 'header': [1, 2, 3, false] }],
                ['bold', 'italic', 'underline', 'strike'],
                [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                [{ 'indent': '-1'}, { 'indent': '+1' }],
                [{ 'color': [] }, { 'background': [] }],
                [{ 'align': [] }],
                ['link'],
                ['clean']
              ]
            }}
            style={{ minHeight: '200px' }}
          />
          <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
            <span className="text-red-500 font-medium">Required:</span> These instructions will be shown to students before they start the exam
          </p>
        </div>
      </section>
    </div>
  );
};

export default BasicDetailsTab;
