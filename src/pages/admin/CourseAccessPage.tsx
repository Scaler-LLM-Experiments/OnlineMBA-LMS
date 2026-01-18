import React, { useState, useEffect, useCallback } from 'react';
import {
  UserPlus,
  ArrowLeft,
  Search,
  Users,
  Trash2,
  Edit2,
  Check,
  X,
  Loader2,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../features/auth/hooks/useAuth';
import { apiService, EnrolledStudent, EnrollStudentData } from '../../services/api';
import toast from 'react-hot-toast';

interface FormData {
  email: string;
  fullName: string;
  rollNo: string;
  batch: string;
  customBatch: string;
  role: string;
  customRole: string;
  rollNoMode: 'auto' | 'manual';
}

const ROLE_OPTIONS = ['Student', 'Admin', 'Teaching Assistant', 'Mentor', 'Other'];

export function CourseAccessPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  // State
  const [students, setStudents] = useState<EnrolledStudent[]>([]);
  const [batches, setBatches] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBatchFilter, setSelectedBatchFilter] = useState<string>('all');
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState<FormData>({
    email: '',
    fullName: '',
    rollNo: '',
    batch: '',
    customBatch: '',
    role: 'Student',
    customRole: '',
    rollNoMode: 'auto',
  });
  const [formErrors, setFormErrors] = useState<Partial<FormData>>({});

  // Fetch batches
  const fetchBatches = useCallback(async () => {
    try {
      const result = await apiService.getBatches();
      if (result.success && result.data?.batches) {
        setBatches(result.data.batches);
        if (result.data.batches.length > 0 && !formData.batch) {
          setFormData(prev => ({ ...prev, batch: result.data!.batches[0] }));
        }
      }
    } catch (error) {
      console.error('Error fetching batches:', error);
    }
  }, [formData.batch]);

  // Fetch enrolled students
  const fetchStudents = useCallback(async () => {
    if (!user?.email) return;

    try {
      setLoading(true);
      const result = await apiService.getEnrolledStudents(user.email);
      if (result.success && result.data) {
        setStudents(result.data);
      }
    } catch (error) {
      console.error('Error fetching students:', error);
      toast.error('Failed to load enrolled students');
    } finally {
      setLoading(false);
    }
  }, [user?.email]);

  useEffect(() => {
    fetchBatches();
    fetchStudents();
  }, [fetchBatches, fetchStudents]);

  // Generate next roll number
  const generateRollNumber = useCallback((batch: string): string => {
    const batchStudents = students.filter(s => s.batch === batch);
    const rollNumbers = batchStudents
      .map(s => {
        const match = s.rollNo?.match(/MBA(\d+)/i);
        return match ? parseInt(match[1], 10) : 0;
      })
      .filter(n => n > 0);

    const maxRoll = rollNumbers.length > 0 ? Math.max(...rollNumbers) : 0;
    const nextRoll = maxRoll + 1;
    return `MBA${String(nextRoll).padStart(3, '0')}`;
  }, [students]);

  // Update roll number when batch changes and auto mode is selected
  useEffect(() => {
    if (formData.rollNoMode === 'auto' && formData.batch) {
      const newRollNo = generateRollNumber(formData.batch);
      setFormData(prev => ({ ...prev, rollNo: newRollNo }));
    }
  }, [formData.batch, formData.rollNoMode, generateRollNumber]);

  // Validate form
  const validateForm = (): boolean => {
    const errors: Partial<FormData> = {};

    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Invalid email format';
    } else if (students.some(s => s.email.toLowerCase() === formData.email.toLowerCase() && !editingId)) {
      errors.email = 'This email is already enrolled';
    }

    if (!formData.fullName.trim()) {
      errors.fullName = 'Full name is required';
    }

    if (!formData.batch) {
      errors.batch = 'Batch is required';
    } else if (formData.batch === 'Other' && !formData.customBatch.trim()) {
      errors.customBatch = 'Please enter a custom batch name';
    }

    if (formData.rollNoMode === 'manual' && !formData.rollNo.trim()) {
      errors.rollNo = 'Roll number is required';
    } else if (formData.rollNoMode === 'manual') {
      const duplicateRoll = students.find(
        s => s.rollNo?.toLowerCase() === formData.rollNo.toLowerCase() &&
             s.email !== editingId
      );
      if (duplicateRoll) {
        errors.rollNo = 'This roll number is already assigned';
      }
    }

    if (formData.role === 'Other' && !formData.customRole.trim()) {
      errors.customRole = 'Please specify the custom role';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle form submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm() || !user?.email) return;

    setSubmitting(true);
    try {
      // Determine the actual role value
      const actualRole = formData.role === 'Other' ? formData.customRole.trim() : formData.role;
      // Determine the actual batch value
      const actualBatch = formData.batch === 'Other' ? formData.customBatch.trim() : formData.batch;

      const studentData: EnrollStudentData = {
        email: formData.email.trim().toLowerCase(),
        fullName: formData.fullName.trim(),
        rollNo: formData.rollNo,
        batch: actualBatch,
        role: actualRole,
      };

      const result = editingId
        ? await apiService.updateEnrolledStudent(user.email, editingId, studentData)
        : await apiService.enrollStudent(user.email, studentData);

      if (result.success) {
        toast.success(editingId ? 'Student updated successfully' : 'Student enrolled successfully');
        resetForm();
        fetchStudents();
      } else {
        toast.error(result.error || 'Failed to save student');
      }
    } catch (error) {
      console.error('Error saving student:', error);
      toast.error('An error occurred while saving');
    } finally {
      setSubmitting(false);
    }
  };

  // Reset form
  const resetForm = () => {
    const defaultBatch = formData.batch === 'Other' ? (batches[0] || '') : (formData.batch || (batches[0] || ''));
    setFormData({
      email: '',
      fullName: '',
      rollNo: defaultBatch ? generateRollNumber(defaultBatch) : '',
      batch: defaultBatch,
      customBatch: '',
      role: 'Student',
      customRole: '',
      rollNoMode: 'auto',
    });
    setFormErrors({});
    setEditingId(null);
  };

  // Edit student
  const handleEdit = (student: EnrolledStudent) => {
    setEditingId(student.email);
    // Check if role is a predefined option or custom
    const isCustomRole = student.role && !ROLE_OPTIONS.includes(student.role);
    // Check if batch is a predefined option or custom
    const isCustomBatch = student.batch && !batches.includes(student.batch);
    setFormData({
      email: student.email,
      fullName: student.fullName,
      rollNo: student.rollNo,
      batch: isCustomBatch ? 'Other' : student.batch,
      customBatch: isCustomBatch ? student.batch : '',
      role: isCustomRole ? 'Other' : (student.role || 'Student'),
      customRole: isCustomRole ? student.role : '',
      rollNoMode: 'manual',
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Delete student
  const handleDelete = async (email: string) => {
    if (!user?.email) return;

    if (!window.confirm('Are you sure you want to remove this student\'s access?')) return;

    try {
      const result = await apiService.removeStudentAccess(user.email, email);
      if (result.success) {
        toast.success('Student access removed');
        fetchStudents();
      } else {
        toast.error(result.error || 'Failed to remove access');
      }
    } catch (error) {
      console.error('Error removing student:', error);
      toast.error('An error occurred');
    }
  };

  // Filter students
  const filteredStudents = students.filter(student => {
    const matchesSearch =
      student.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.rollNo?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesBatch = selectedBatchFilter === 'all' || student.batch === selectedBatchFilter;

    return matchesSearch && matchesBatch;
  });

  // Stats
  const stats = {
    total: students.length,
    byBatch: batches.reduce((acc, batch) => {
      acc[batch] = students.filter(s => s.batch === batch).length;
      return acc;
    }, {} as Record<string, number>),
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate('/admin')}
          className="flex items-center gap-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Admin Panel</span>
        </button>

        <div className="flex items-center gap-4 mb-2">
          <div className="p-4 bg-[#fd621b]">
            <UserPlus className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Course Access Management</h1>
            <p className="text-gray-500 dark:text-gray-400">Enroll students and manage course access</p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500">
              <Users className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Total Students</p>
            </div>
          </div>
        </div>
        {batches.slice(0, 3).map(batch => (
          <div key={batch} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-[#fd621b]">
                <Users className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.byBatch[batch] || 0}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{batch}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Enrollment Form */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-[#fd621b]" />
              {editingId ? 'Edit Student' : 'Enroll New Student'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Student Email *
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  disabled={!!editingId}
                  className={`w-full px-3 py-2 border ${formErrors.email ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#fd621b] disabled:opacity-50`}
                  placeholder="student@example.com"
                />
                {formErrors.email && (
                  <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {formErrors.email}
                  </p>
                )}
              </div>

              {/* Full Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  value={formData.fullName}
                  onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
                  className={`w-full px-3 py-2 border ${formErrors.fullName ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#fd621b]`}
                  placeholder="John Doe"
                />
                {formErrors.fullName && (
                  <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {formErrors.fullName}
                  </p>
                )}
              </div>

              {/* Batch */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Batch *
                </label>
                <select
                  value={formData.batch}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    batch: e.target.value,
                    customBatch: e.target.value === 'Other' ? prev.customBatch : ''
                  }))}
                  className={`w-full px-3 py-2 border ${formErrors.batch ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#fd621b]`}
                >
                  <option value="">Select Batch</option>
                  {batches.map(batch => (
                    <option key={batch} value={batch}>{batch}</option>
                  ))}
                  <option value="Other">Other (Custom)</option>
                </select>
                {formErrors.batch && (
                  <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {formErrors.batch}
                  </p>
                )}

                {/* Custom Batch Input - shown when "Other" is selected */}
                {formData.batch === 'Other' && (
                  <div className="mt-2">
                    <input
                      type="text"
                      value={formData.customBatch}
                      onChange={(e) => setFormData(prev => ({ ...prev, customBatch: e.target.value }))}
                      placeholder="Enter custom batch name (e.g., SSB 2026)"
                      className={`w-full px-3 py-2 border ${formErrors.customBatch ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#fd621b]`}
                    />
                    {formErrors.customBatch && (
                      <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {formErrors.customBatch}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Roll Number Mode */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Roll Number
                </label>
                <div className="flex gap-4 mb-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="rollNoMode"
                      checked={formData.rollNoMode === 'auto'}
                      onChange={() => setFormData(prev => ({
                        ...prev,
                        rollNoMode: 'auto',
                        rollNo: prev.batch ? generateRollNumber(prev.batch) : ''
                      }))}
                      className="text-[#fd621b] focus:ring-[#fd621b]"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">Assign Auto</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="rollNoMode"
                      checked={formData.rollNoMode === 'manual'}
                      onChange={() => setFormData(prev => ({ ...prev, rollNoMode: 'manual', rollNo: '' }))}
                      className="text-[#fd621b] focus:ring-[#fd621b]"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">Enter Manually</span>
                  </label>
                </div>
                <input
                  type="text"
                  value={formData.rollNo}
                  onChange={(e) => setFormData(prev => ({ ...prev, rollNo: e.target.value.toUpperCase() }))}
                  disabled={formData.rollNoMode === 'auto'}
                  className={`w-full px-3 py-2 border ${formErrors.rollNo ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#fd621b] disabled:bg-gray-100 dark:disabled:bg-gray-800`}
                  placeholder={formData.rollNoMode === 'auto' ? 'Auto-generated' : 'e.g., MBA001'}
                />
                {formData.rollNoMode === 'auto' && formData.rollNo && (
                  <p className="mt-1 text-sm text-green-600 dark:text-green-400">
                    Next available: {formData.rollNo}
                  </p>
                )}
                {formErrors.rollNo && (
                  <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {formErrors.rollNo}
                  </p>
                )}
              </div>

              {/* Role */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Role
                </label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    role: e.target.value,
                    customRole: e.target.value === 'Other' ? prev.customRole : ''
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#fd621b]"
                >
                  {ROLE_OPTIONS.map(role => (
                    <option key={role} value={role}>{role}</option>
                  ))}
                </select>

                {/* Custom Role Input - shown when "Other" is selected */}
                {formData.role === 'Other' && (
                  <div className="mt-2">
                    <input
                      type="text"
                      value={formData.customRole}
                      onChange={(e) => setFormData(prev => ({ ...prev, customRole: e.target.value }))}
                      placeholder="Enter custom role (e.g., Faculty, Coordinator)"
                      className={`w-full px-3 py-2 border ${formErrors.customRole ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#fd621b]`}
                    />
                    {formErrors.customRole && (
                      <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {formErrors.customRole}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-4 py-2 bg-[#fd621b] hover:bg-[#e55a18] text-white font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : editingId ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    <UserPlus className="w-4 h-4" />
                  )}
                  {editingId ? 'Update' : 'Enroll Student'}
                </button>
                {editingId && (
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 font-medium transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>

        {/* Students List */}
        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
            {/* Search and Filter Header */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search by name, email, or roll no..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#fd621b]"
                  />
                </div>
                <select
                  value={selectedBatchFilter}
                  onChange={(e) => setSelectedBatchFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#fd621b]"
                >
                  <option value="all">All Batches</option>
                  {batches.map(batch => (
                    <option key={batch} value={batch}>{batch}</option>
                  ))}
                </select>
                <button
                  onClick={fetchStudents}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  title="Refresh"
                >
                  <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>

            {/* Students Table */}
            <div className="overflow-x-auto">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-[#fd621b]" />
                </div>
              ) : filteredStudents.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-3" />
                  <p className="text-gray-500 dark:text-gray-400">
                    {searchTerm || selectedBatchFilter !== 'all'
                      ? 'No students match your search'
                      : 'No students enrolled yet'}
                  </p>
                </div>
              ) : (
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-900">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Roll No
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Student
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Batch
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Role
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {filteredStudents.map((student) => (
                      <tr key={student.email} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className="font-mono text-sm font-medium text-[#fd621b]">
                            {student.rollNo || '--'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">
                              {student.fullName}
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              {student.email}
                            </p>
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className="px-2 py-1 text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
                            {student.batch}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                          {student.role || 'Student'}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleEdit(student)}
                              className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors"
                              title="Edit"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(student.email)}
                              className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
                              title="Remove Access"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Footer */}
            {filteredStudents.length > 0 && (
              <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700 text-sm text-gray-500 dark:text-gray-400">
                Showing {filteredStudents.length} of {students.length} students
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default CourseAccessPage;
