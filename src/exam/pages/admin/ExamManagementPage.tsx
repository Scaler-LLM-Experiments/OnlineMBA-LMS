/**
 * Admin Exam Management Page
 * View, create, edit, and manage exams
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  Search,
  Filter,
  Edit2,
  Trash2,
  Copy,
  Eye,
  BarChart3,
  Clock,
  CheckCircle,
  FileText
} from 'lucide-react';
import { getAllExams, deleteExam, updateExam, type Exam, type ExamFilters } from '../../services/examApi';

const ExamManagementPage: React.FC = () => {
  const navigate = useNavigate();
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<ExamFilters>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [examToDelete, setExamToDelete] = useState<Exam | null>(null);

  // Load exams on mount only (like Forms Management)
  useEffect(() => {
    loadExams();
  }, []); // Empty dependency array - run once on mount

  const loadExams = async () => {
    try {
      setLoading(true);
      // Simple fetch without filters initially (like Forms Management)
      const response = await getAllExams();
      if (response.success) {
        setExams(response.data || []);
      } else {
        console.error('Failed to load exams:', response.error);
      }
    } catch (error) {
      console.error('Failed to load exams:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    loadExams();
  };

  const handleDelete = async () => {
    if (!examToDelete) return;

    try {
      const response = await deleteExam((examToDelete as any)['Exam ID'] || examToDelete.examId || '');
      if (response.success) {
        setExams(exams.filter(e =>
          ((e as any)['Exam ID'] || e.examId) !== ((examToDelete as any)['Exam ID'] || examToDelete.examId)
        ));
        setShowDeleteModal(false);
        setExamToDelete(null);
      }
    } catch (error) {
      console.error('Failed to delete exam:', error);
    }
  };

  const handleStatusChange = async (examId: string, newStatus: string) => {
    try {
      // Backend expects 'Status' (capital S) as column name
      const response = await updateExam(examId, { Status: newStatus } as any);
      if (response.success) {
        // Update local state
        setExams(exams.map(exam => {
          const currentExamId = (exam as any)['Exam ID'] || exam.examId;
          if (currentExamId === examId) {
            return {
              ...exam,
              Status: newStatus,
              status: newStatus as any
            } as Exam;
          }
          return exam;
        }));
      }
    } catch (error) {
      console.error('Failed to update exam status:', error);
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'DRAFT':
        return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300';
      case 'ACTIVE':
        return 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300';
      case 'COMPLETED':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300';
      case 'ARCHIVED':
        return 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getTypeBadgeClass = (type: string) => {
    switch (type) {
      case 'Quiz':
        return 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300';
      case 'Mid-Term':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300';
      case 'End-Term':
        return 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Exam Management
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Create, edit, and manage assessments for your students
        </p>
      </div>

      {/* Filters and Actions */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        {/* Search */}
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search exams by title or subject..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
        </div>

        {/* Status Filter */}
        <select
          value={filters.status || ''}
          onChange={(e) => setFilters({ ...filters, status: e.target.value as any })}
          className="px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500"
        >
          <option value="">All Exams</option>
          <option value="DRAFT">Drafts</option>
          <option value="ACTIVE">Active</option>
          <option value="COMPLETED">Completed</option>
          <option value="ARCHIVED">Archived</option>
        </select>

        {/* Type Filter */}
        <select
          value={filters.examType || ''}
          onChange={(e) => setFilters({ ...filters, examType: e.target.value as any })}
          className="px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500"
        >
          <option value="">All Types</option>
          <option value="Quiz">Quiz</option>
          <option value="Mid-Term">Mid-Term</option>
          <option value="End-Term">End-Term</option>
        </select>

        {/* Term Filter */}
        <select
          value={filters.term || ''}
          onChange={(e) => setFilters({ ...filters, term: e.target.value as any })}
          className="px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500"
        >
          <option value="">All Terms</option>
          <option value="Term 1">Term 1</option>
          <option value="Term 2">Term 2</option>
          <option value="Term 3">Term 3</option>
        </select>

        {/* Create Button */}
        <button
          onClick={() => navigate('/admin/exams/create')}
          className="px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium flex items-center gap-2 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Create New Exam
        </button>
      </div>

      {/* Exams List */}
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
        </div>
      ) : exams.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600">
          <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            No exams created yet
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Create your first exam to get started with assessments
          </p>
          <button
            onClick={() => navigate('/admin/exams/create')}
            className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium inline-flex items-center gap-2 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Create New Exam
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {exams.map((exam) => {
            const examAny = exam as any;
            const examId = examAny['Exam ID'] || exam.examId || '';
            const examTitle = examAny['Exam Title'] || exam.examTitle || '';
            const examType = examAny['Exam Type'] || exam.examType || '';
            const status = examAny.Status || exam.status || '';
            const subject = examAny.Subject || exam.subject || '';
            const duration = examAny['Duration (minutes)'] || exam.duration || 0;
            const totalMarks = examAny['Total Marks'] || exam.totalMarks || 0;
            const totalQuestions = examAny['Total Questions'] || exam.totalQuestions || 0;

            return (
              <div
                key={examId}
                className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow p-6"
              >
                {/* Badges */}
                <div className="flex items-center gap-2 mb-3">
                  {/* Status Dropdown */}
                  <select
                    value={status}
                    onChange={(e) => handleStatusChange(examId, e.target.value)}
                    className={`px-2.5 py-1 rounded-full text-xs font-medium cursor-pointer border-0 focus:ring-2 focus:ring-offset-0 ${getStatusBadgeClass(status)}`}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <option value="DRAFT">DRAFT</option>
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="COMPLETED">COMPLETED</option>
                    <option value="ARCHIVED">ARCHIVED</option>
                  </select>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${getTypeBadgeClass(examType)}`}>
                    {examType}
                  </span>
                </div>

                {/* Title */}
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2">
                  {examTitle}
                </h3>

                {/* Subject */}
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  {subject}
                </p>

                {/* Stats */}
                <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400 mb-4">
                  <div className="flex items-center gap-1">
                    <FileText className="w-4 h-4" />
                    {totalQuestions} questions
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {duration} min
                  </div>
                  <div className="flex items-center gap-1">
                    <CheckCircle className="w-4 h-4" />
                    {totalMarks} marks
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <button
                    onClick={() => navigate(`/admin/exams/edit/${examId}`)}
                    className="flex-1 px-3 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors flex items-center justify-center gap-1"
                    title="Edit"
                  >
                    <Edit2 className="w-4 h-4" />
                    Edit
                  </button>
                  <button
                    onClick={() => navigate(`/admin/exams/view/${examId}`)}
                    className="flex-1 px-3 py-2 text-sm font-medium text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors flex items-center justify-center gap-1"
                    title="View"
                  >
                    <Eye className="w-4 h-4" />
                    View
                  </button>
                  <button
                    onClick={() => {
                      setExamToDelete(exam);
                      setShowDeleteModal(true);
                    }}
                    className="px-3 py-2 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && examToDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Delete Exam?
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              This will permanently delete the exam and all associated data. This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setExamToDelete(null);
                }}
                className="flex-1 px-4 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
              >
                Delete Exam
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExamManagementPage;
