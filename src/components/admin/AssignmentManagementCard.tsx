import React, { useState, useEffect } from 'react';
import { ClipboardList, Plus, RefreshCw, Edit2, Trash2, Save, X, Eye, FileText, Calendar, Users, Upload, Paperclip, Search, Filter } from 'lucide-react';
import { assignmentApiService, AssignmentData } from '../../services/assignmentApi';
import { useAuth } from '../../features/auth/hooks/useAuth';
import toast from 'react-hot-toast';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';

interface AssignmentManagementCardProps {
  activeTab?: 'all' | 'create';
  onTabChange?: (tab: 'all' | 'create') => void;
}

export function AssignmentManagementCard({ activeTab = 'all', onTabChange }: AssignmentManagementCardProps) {
  const { student } = useAuth();
  const [assignments, setAssignments] = useState<AssignmentData[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [batches, setBatches] = useState<string[]>([]);
  const [terms, setTerms] = useState<string[]>([]);
  const [domains, setDomains] = useState<string[]>([]);
  const [subjects, setSubjects] = useState<string[]>([]);
  const [fileTypes, setFileTypes] = useState<string[]>([]);
  const [hierarchy, setHierarchy] = useState<any>(null);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [questionCount, setQuestionCount] = useState(1);
  const [assignmentURLs, setAssignmentURLs] = useState<{ name: string; url: string }[]>([{ name: '', url: '' }]);
  const [selectedFileTypes, setSelectedFileTypes] = useState<string[]>([]);

  // "Others" option states
  const [showBatchOther, setShowBatchOther] = useState(false);
  const [showTermOther, setShowTermOther] = useState(false);
  const [showDomainOther, setShowDomainOther] = useState(false);
  const [showSubjectOther, setShowSubjectOther] = useState(false);
  const [customBatch, setCustomBatch] = useState('');
  const [customTerm, setCustomTerm] = useState('');
  const [customDomain, setCustomDomain] = useState('');
  const [customSubject, setCustomSubject] = useState('');

  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [filterBatch, setFilterBatch] = useState('');
  const [filterTerm, setFilterTerm] = useState('');
  const [filterSubject, setFilterSubject] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  const [formData, setFormData] = useState<Partial<AssignmentData>>({
    batch: '',
    term: '',
    domain: '',
    subject: '',
    publish: 'Yes',
    assignmentHeader: '',
    subHeader: '',
    assignmentDetails: '',
    startDateTime: '',
    endDateTime: '',
    totalMarks: '',
    folderName: '',
    createInDrive: 'Yes',
    groupAssignment: 'No',
    groupRatingRemarkEnabled: 'No',
    maximumGroupMembers: '',
    attachmentMandatory: 'Yes',
    urlMandatory: 'No',
    fileTypes: '',
    q1: '', q1Mandatory: '',
    q2: '', q2Mandatory: '',
    q3: '', q3Mandatory: '',
    q4: '', q4Mandatory: '',
    q5: '', q5Mandatory: '',
    q6: '', q6Mandatory: '',
    q7: '', q7Mandatory: '',
    q8: '', q8Mandatory: '',
    q9: '', q9Mandatory: '',
    q10: '', q10Mandatory: '',
    q11: '', q11Mandatory: '',
    q12: '', q12Mandatory: '',
    q13: '', q13Mandatory: '',
    q14: '', q14Mandatory: '',
    q15: '', q15Mandatory: '',
    q16: '', q16Mandatory: '',
    q17: '', q17Mandatory: '',
    q18: '', q18Mandatory: '',
    q19: '', q19Mandatory: '',
    q20: '', q20Mandatory: '',
  });

  const fetchDropdowns = async () => {
    if (!student?.email) return;

    try {
      const result = await assignmentApiService.getAssignmentDropdowns(student.email);
      if (result.success && result.data) {
        setBatches(result.data.batches);
        setTerms(result.data.terms);
        setFileTypes(result.data.fileTypes);
        setHierarchy(result.data.hierarchy);
      }
    } catch (error) {
      console.error('Error fetching dropdowns:', error);
    }
  };

  const fetchAssignments = async () => {
    if (!student?.email) return;

    setLoading(true);
    try {
      const result = await assignmentApiService.getAssignments(student.email);
      if (result.success && result.data) {
        setAssignments(result.data);
      } else {
        toast.error(result.error || 'Failed to fetch assignments');
      }
    } catch (error) {
      toast.error('Error fetching assignments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Wait for student email to be available before fetching
    if (!student?.email) return;

    fetchDropdowns();
    if (activeTab === 'all') {
      fetchAssignments();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, student?.email]); // Re-run when activeTab changes or student email becomes available

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!student?.email) return;

    // Get final values (use custom values if "Others" was selected)
    const finalBatch = showBatchOther ? customBatch.trim() : formData.batch;
    const finalTerm = showTermOther ? customTerm.trim() : formData.term;
    const finalDomain = showDomainOther ? customDomain.trim() : formData.domain;
    const finalSubject = showSubjectOther ? customSubject.trim() : formData.subject;

    // Validation
    if (!finalBatch || !finalTerm || !finalSubject || !formData.assignmentHeader) {
      toast.error('Please fill in all required fields (Batch, Term, Subject, Assignment Header)');
      return;
    }

    // Check if we need to save new Subject Term entry
    const needsNewEntry = showBatchOther || showTermOther || showDomainOther || showSubjectOther;
    if (needsNewEntry) {
      try {
        const saveResult = await assignmentApiService.saveSubjectTermEntry(
          student.email,
          finalBatch,
          finalTerm,
          finalDomain || '',
          finalSubject
        );
        if (!saveResult.success) {
          toast.error('Failed to save new dropdown values: ' + saveResult.error);
          return;
        }
        toast.success('New dropdown values saved successfully!');
      } catch (error) {
        toast.error('Error saving new dropdown values');
        return;
      }
    }

    setLoading(true);
    try {
      // Convert uploaded files to base64
      const uploadedFilesData: { name: string; data: string; mimeType: string }[] = [];
      if (uploadedFiles.length > 0) {
        toast.loading('Uploading files...', { duration: 2000 });
        for (const file of uploadedFiles) {
          const base64 = await fileToBase64(file);
          uploadedFilesData.push({
            name: file.name,
            data: base64,
            mimeType: file.type,
          });
        }
      }

      // Filter out empty assignment URLs
      const validURLs = assignmentURLs.filter(
        url => url.name.trim() !== '' || url.url.trim() !== ''
      );

      // Build file types string from selected types
      const fileTypesString = selectedFileTypes.join(',');

      // Convert datetime to backend format (DD-MMM-YYYY HH:mm:ss)
      const formattedStartDateTime = formData.startDateTime ? convertToBackendDateTime(formData.startDateTime) : '';
      const formattedEndDateTime = formData.endDateTime ? convertToBackendDateTime(formData.endDateTime) : '';

      let result;

      if (editingId) {
        const updatePayload = {
          ...formData,
          batch: finalBatch,
          term: finalTerm,
          domain: finalDomain,
          subject: finalSubject,
          startDateTime: formattedStartDateTime,
          endDateTime: formattedEndDateTime,
          fileTypes: fileTypesString,
          assignmentURLs: validURLs.length > 0 ? validURLs : undefined,
          editedBy: student.email,
          uploadedFiles: uploadedFilesData.length > 0 ? uploadedFilesData : undefined,
        } as AssignmentData;

        console.log('🔍 DEBUG - Update Assignment Payload:');
        console.log('  📋 assignmentId:', editingId);
        console.log('  👥 groupAssignment:', updatePayload.groupAssignment);
        console.log('  ⭐ groupRatingRemarkEnabled:', updatePayload.groupRatingRemarkEnabled);
        console.log('  🔢 maximumGroupMembers:', updatePayload.maximumGroupMembers);
        console.log('  📦 Full payload:', JSON.stringify(updatePayload, null, 2));

        result = await assignmentApiService.updateAssignment(
          student.email,
          editingId,
          updatePayload
        );
      } else {
        result = await assignmentApiService.createAssignment(
          student.email,
          {
            ...formData,
            batch: finalBatch,
            term: finalTerm,
            domain: finalDomain,
            subject: finalSubject,
            startDateTime: formattedStartDateTime,
            endDateTime: formattedEndDateTime,
            fileTypes: fileTypesString,
            assignmentURLs: validURLs.length > 0 ? validURLs : undefined,
            uploadedFiles: uploadedFilesData.length > 0 ? uploadedFilesData : undefined,
          } as AssignmentData
        );
      }

      if (result.success) {
        toast.success(editingId ? 'Assignment updated successfully' : 'Assignment created successfully');
        resetForm();
        fetchAssignments();
        // Switch back to View All tab after successful save
        if (onTabChange) {
          onTabChange('all');
        }
      } else {
        toast.error(result.error || 'Failed to save assignment');
      }
    } catch (error) {
      toast.error('Error saving assignment');
    } finally {
      setLoading(false);
    }
  };

  // Helper function to convert file to base64
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          resolve(reader.result);
        } else {
          reject(new Error('Failed to convert file to base64'));
        }
      };
      reader.onerror = (error) => reject(error);
    });
  };

  const handleEdit = (assignment: AssignmentData) => {
    setEditingId(assignment.assignmentId || null);

    // Debug: Log the datetime values before conversion
    console.log('📅 Edit Assignment - Raw dates from backend:');
    console.log('  StartDateTime:', assignment.startDateTime);
    console.log('  EndDateTime:', assignment.endDateTime);

    const convertedStartDateTime = assignment.startDateTime ? convertToDatetimeLocal(assignment.startDateTime) : '';
    const convertedEndDateTime = assignment.endDateTime ? convertToDatetimeLocal(assignment.endDateTime) : '';

    console.log('📅 Converted dates for form:');
    console.log('  StartDateTime:', convertedStartDateTime);
    console.log('  EndDateTime:', convertedEndDateTime);

    setFormData({
      ...assignment,
      // Convert backend datetime format to datetime-local format for editing
      startDateTime: convertedStartDateTime,
      endDateTime: convertedEndDateTime,
      // Ensure peer rating fields have defaults for old assignments
      groupRatingRemarkEnabled: assignment.groupRatingRemarkEnabled || 'No',
      maximumGroupMembers: assignment.maximumGroupMembers || '',
    });

    // Populate domains and subjects based on the assignment's batch and term
    if (assignment.batch && assignment.term && hierarchy) {
      const batchData = hierarchy[assignment.batch];
      if (batchData && batchData[assignment.term]) {
        // Populate domains
        const availableDomains = Object.keys(batchData[assignment.term]);
        setDomains(availableDomains.sort());

        // Populate subjects based on domain (if domain exists) or all subjects for batch+term
        if (assignment.domain && batchData[assignment.term][assignment.domain]) {
          // If domain is set, show subjects for that domain
          setSubjects(batchData[assignment.term][assignment.domain].sort());
        } else {
          // No domain or domain not found, show all subjects for batch+term
          const allSubjects = new Set<string>();
          availableDomains.forEach(domain => {
            if (batchData[assignment.term][domain]) {
              batchData[assignment.term][domain].forEach((subject: string) => allSubjects.add(subject));
            }
          });
          setSubjects(Array.from(allSubjects).sort());
        }
      }
    }

    // Count how many questions exist
    let count = 0;
    for (let i = 1; i <= 20; i++) {
      const qKey = `q${i}` as keyof AssignmentData;
      if (assignment[qKey] && String(assignment[qKey]).trim() !== '') {
        count = i;
      }
    }
    setQuestionCount(count > 0 ? count : 1);

    // Load assignment URLs
    if (assignment.assignmentURLs && assignment.assignmentURLs.length > 0) {
      setAssignmentURLs(assignment.assignmentURLs);
    } else {
      setAssignmentURLs([{ name: '', url: '' }]);
    }

    // Load file types
    if (assignment.fileTypes) {
      const types = assignment.fileTypes.split(',').map(t => t.trim()).filter(t => t);
      setSelectedFileTypes(types);
    } else {
      setSelectedFileTypes([]);
    }

    // Switch to create tab to show the form
    if (onTabChange) {
      onTabChange('create');
    }
  };

  const handleDelete = async (assignmentId: string) => {
    if (!student?.email) return;
    // eslint-disable-next-line no-restricted-globals
    if (!confirm('Are you sure you want to delete this assignment?')) return;

    setLoading(true);
    try {
      const result = await assignmentApiService.deleteAssignment(student.email, assignmentId);
      if (result.success) {
        toast.success('Assignment deleted successfully');
        fetchAssignments();
      } else {
        toast.error(result.error || 'Failed to delete assignment');
      }
    } catch (error) {
      toast.error('Error deleting assignment');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (assignmentId: string, status: string) => {
    if (!student?.email) return;

    setLoading(true);
    try {
      const result = await assignmentApiService.changeAssignmentStatus(
        student.email,
        assignmentId,
        status
      );
      if (result.success) {
        toast.success(`Assignment ${status.toLowerCase()} successfully`);
        fetchAssignments();
      } else {
        toast.error(result.error || 'Failed to change status');
      }
    } catch (error) {
      toast.error('Error changing status');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setUploadedFiles([]);
    setQuestionCount(1);
    setAssignmentURLs([{ name: '', url: '' }]);
    setSelectedFileTypes([]);
    setFormData({
      batch: '',
      term: '',
      domain: '',
      subject: '',
      publish: 'Yes',
      assignmentHeader: '',
      subHeader: '',
      assignmentDetails: '',
      startDateTime: '',
      endDateTime: '',
      totalMarks: '',
      folderName: '',
      createInDrive: 'Yes',
      groupAssignment: 'No',
      groupRatingRemarkEnabled: 'No',
      maximumGroupMembers: '',
      attachmentMandatory: 'Yes',
      urlMandatory: 'No',
      fileTypes: '',
      q1: '', q1Mandatory: '',
      q2: '', q2Mandatory: '',
      q3: '', q3Mandatory: '',
      q4: '', q4Mandatory: '',
      q5: '', q5Mandatory: '',
      q6: '', q6Mandatory: '',
      q7: '', q7Mandatory: '',
      q8: '', q8Mandatory: '',
      q9: '', q9Mandatory: '',
      q10: '', q10Mandatory: '',
      q11: '', q11Mandatory: '',
      q12: '', q12Mandatory: '',
      q13: '', q13Mandatory: '',
      q14: '', q14Mandatory: '',
      q15: '', q15Mandatory: '',
      q16: '', q16Mandatory: '',
      q17: '', q17Mandatory: '',
      q18: '', q18Mandatory: '',
      q19: '', q19Mandatory: '',
      q20: '', q20Mandatory: '',
    });
  };

  const handleBatchChange = (batch: string) => {
    if (batch === '__others__') {
      setShowBatchOther(true);
      setFormData(prev => ({ ...prev, batch: '', term: '', domain: '', subject: '' }));
    } else {
      setShowBatchOther(false);
      setCustomBatch('');
      setFormData(prev => ({ ...prev, batch, term: '', domain: '', subject: '' }));
    }
    setDomains([]);
    setSubjects([]);
    setShowTermOther(false);
    setShowDomainOther(false);
    setShowSubjectOther(false);
  };

  const handleTermChange = (term: string) => {
    if (term === '__others__') {
      setShowTermOther(true);
      setFormData(prev => ({ ...prev, term: '', domain: '', subject: '' }));
      setSubjects([]);
      return;
    }

    setShowTermOther(false);
    setCustomTerm('');
    setFormData(prev => ({ ...prev, term, domain: '', subject: '' }));
    setSubjects([]);
    setShowDomainOther(false);
    setShowSubjectOther(false);

    // Update domains based on selected batch and term
    const currentBatch = showBatchOther ? customBatch : formData.batch;
    if (currentBatch && term && hierarchy && !showBatchOther) {
      const batchData = hierarchy[currentBatch];
      if (batchData && batchData[term]) {
        const availableDomains = Object.keys(batchData[term]);
        setDomains(availableDomains.sort());

        // Also populate all subjects for this batch+term (across all domains)
        const allSubjects = new Set<string>();
        availableDomains.forEach(domain => {
          if (batchData[term][domain]) {
            batchData[term][domain].forEach((subject: string) => allSubjects.add(subject));
          }
        });
        setSubjects(Array.from(allSubjects).sort());
      } else {
        setDomains([]);
        setSubjects([]);
      }
    }
  };

  const handleDomainChange = (domain: string) => {
    if (domain === '__others__') {
      setShowDomainOther(true);
      setFormData(prev => ({ ...prev, domain: '', subject: '' }));
      return;
    }

    setShowDomainOther(false);
    setCustomDomain('');
    setFormData(prev => ({ ...prev, domain, subject: '' }));
    setShowSubjectOther(false);

    // Update subjects based on selected batch, term, and domain
    const currentBatch = showBatchOther ? customBatch : formData.batch;
    const currentTerm = showTermOther ? customTerm : formData.term;

    if (currentBatch && currentTerm && hierarchy && !showBatchOther && !showTermOther) {
      const batchData = hierarchy[currentBatch];
      if (batchData && batchData[currentTerm]) {
        if (domain && batchData[currentTerm][domain]) {
          // Filter subjects by domain
          setSubjects(batchData[currentTerm][domain].sort());
        } else if (!domain) {
          // No domain selected, show all subjects for batch+term
          const allSubjects = new Set<string>();
          Object.keys(batchData[currentTerm]).forEach(d => {
            if (batchData[currentTerm][d]) {
              batchData[currentTerm][d].forEach((subject: string) => allSubjects.add(subject));
            }
          });
          setSubjects(Array.from(allSubjects).sort());
        } else {
          setSubjects([]);
        }
      }
    }
  };

  const handleSubjectChange = (subject: string) => {
    if (subject === '__others__') {
      setShowSubjectOther(true);
      setFormData(prev => ({ ...prev, subject: '' }));
    } else {
      setShowSubjectOther(false);
      setCustomSubject('');
      setFormData(prev => ({ ...prev, subject }));
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (uploadedFiles.length + files.length > 5) {
      toast.error('You can upload maximum 5 files');
      return;
    }
    setUploadedFiles(prev => [...prev, ...files]);
  };

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const addQuestion = () => {
    if (questionCount < 20) {
      setQuestionCount(questionCount + 1);
    } else {
      toast.error('Maximum 20 questions allowed');
    }
  };

  const removeQuestion = (qNum: number) => {
    if (questionCount === 1) {
      toast.error('At least one question is required');
      return;
    }

    const newFormData: any = { ...formData };

    // Shift all questions after qNum down by one
    for (let i = qNum; i < questionCount; i++) {
      const currentKey = `q${i}`;
      const nextKey = `q${i + 1}`;
      const currentMandatoryKey = `q${i}Mandatory`;
      const nextMandatoryKey = `q${i + 1}Mandatory`;

      newFormData[currentKey] = newFormData[nextKey] || '';
      newFormData[currentMandatoryKey] = newFormData[nextMandatoryKey] || 'No';
    }

    // Clear the last question
    const lastKey = `q${questionCount}`;
    const lastMandatoryKey = `q${questionCount}Mandatory`;
    newFormData[lastKey] = '';
    newFormData[lastMandatoryKey] = 'No';

    setFormData(newFormData);
    setQuestionCount(questionCount - 1);
  };

  const addAssignmentURL = () => {
    if (assignmentURLs.length < 5) {
      setAssignmentURLs([...assignmentURLs, { name: '', url: '' }]);
    } else {
      toast.error('Maximum 5 URLs allowed');
    }
  };

  const removeAssignmentURL = (index: number) => {
    if (assignmentURLs.length === 1) {
      toast.error('At least one URL field is required');
      return;
    }
    setAssignmentURLs(assignmentURLs.filter((_, i) => i !== index));
  };

  const updateAssignmentURL = (index: number, field: 'name' | 'url', value: string) => {
    const newURLs = [...assignmentURLs];
    newURLs[index][field] = value;
    setAssignmentURLs(newURLs);
  };

  const toggleFileType = (type: string) => {
    setSelectedFileTypes(prev => {
      if (prev.includes(type)) {
        return prev.filter(t => t !== type);
      } else {
        return [...prev, type];
      }
    });
  };

  const toggleAllFileTypes = () => {
    if (selectedFileTypes.length === fileTypes.length) {
      setSelectedFileTypes([]);
    } else {
      setSelectedFileTypes([...fileTypes]);
    }
  };

  const resetFileTypes = () => {
    setSelectedFileTypes([]);
  };

  const formatDateTime = (dateStr: string) => {
    if (!dateStr) return 'N/A';
    try {
      return new Date(dateStr).toLocaleString('en-IN', {
        dateStyle: 'medium',
        timeStyle: 'short',
      });
    } catch {
      return dateStr;
    }
  };

  // Convert datetime-local format (YYYY-MM-DDTHH:mm) to backend format (DD-MMM-YYYY HH:mm:ss)
  const convertToBackendDateTime = (datetimeLocal: string): string => {
    if (!datetimeLocal) return '';
    try {
      const date = new Date(datetimeLocal);
      const day = String(date.getDate()).padStart(2, '0');
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const month = monthNames[date.getMonth()];
      const year = date.getFullYear();
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      const seconds = String(date.getSeconds()).padStart(2, '0');
      return `${day}-${month}-${year} ${hours}:${minutes}:${seconds}`;
    } catch {
      return datetimeLocal;
    }
  };

  // Convert backend format (DD-MMM-YYYY HH:mm:ss OR ISO 8601) to datetime-local format (YYYY-MM-DDTHH:mm)
  const convertToDatetimeLocal = (backendDateTime: string): string => {
    if (!backendDateTime) {
      console.warn('⚠️ convertToDatetimeLocal: Empty datetime received');
      return '';
    }

    try {
      console.log('🔄 Converting backend datetime:', backendDateTime);

      // Check if it's ISO 8601 format (e.g., 2025-12-10T13:29:00.000Z)
      if (backendDateTime.includes('T') && (backendDateTime.includes('Z') || backendDateTime.includes('+'))) {
        console.log('📅 Detected ISO 8601 format, converting...');
        const date = new Date(backendDateTime);

        if (isNaN(date.getTime())) {
          console.error('❌ Invalid ISO date:', backendDateTime);
          return '';
        }

        // Convert to local datetime-local format (YYYY-MM-DDTHH:mm)
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');

        const result = `${year}-${month}-${day}T${hours}:${minutes}`;
        console.log('✅ ISO conversion successful:', result);
        return result;
      }

      // Parse DD-MMM-YYYY HH:mm:ss format
      const parts = backendDateTime.trim().split(' ');
      if (parts.length !== 2) {
        console.error(`❌ Invalid datetime format - expected 2 parts separated by space, got ${parts.length}:`, backendDateTime);
        return '';
      }

      const dateParts = parts[0].split('-');
      const timeParts = parts[1].split(':');

      if (dateParts.length !== 3) {
        console.error(`❌ Invalid date format - expected 3 parts separated by -, got ${dateParts.length}:`, parts[0]);
        return '';
      }

      if (timeParts.length !== 3) {
        console.error(`❌ Invalid time format - expected 3 parts separated by :, got ${timeParts.length}:`, parts[1]);
        return '';
      }

      const day = dateParts[0].padStart(2, '0');
      const monthStr = dateParts[1];
      const year = dateParts[2];
      const hours = timeParts[0].padStart(2, '0');
      const minutes = timeParts[1].padStart(2, '0');

      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const monthIndex = monthNames.indexOf(monthStr);

      if (monthIndex === -1) {
        console.error(`❌ Invalid month name: ${monthStr}. Expected one of:`, monthNames);
        return '';
      }

      const month = String(monthIndex + 1).padStart(2, '0');
      const result = `${year}-${month}-${day}T${hours}:${minutes}`;

      console.log('✅ Conversion successful:', result);
      return result;
    } catch (error) {
      console.error('❌ Error in convertToDatetimeLocal:', error);
      return '';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'Disabled':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'Deleted':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
    }
  };

  // Get unique subjects from all assignments for filter dropdown
  const allSubjectsFromAssignments = Array.from(
    new Set(assignments.map(a => a.subject).filter(Boolean))
  ).sort();

  // Filter assignments based on search and filter criteria
  const filteredAssignments = assignments.filter(assignment => {
    // Search filter (searches in assignment header, subheader, and subject)
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = !searchTerm ||
      assignment.assignmentHeader?.toLowerCase().includes(searchLower) ||
      assignment.subHeader?.toLowerCase().includes(searchLower) ||
      assignment.subject?.toLowerCase().includes(searchLower);

    // Batch filter
    const matchesBatch = !filterBatch || assignment.batch === filterBatch;

    // Term filter
    const matchesTerm = !filterTerm || assignment.term === filterTerm;

    // Subject filter
    const matchesSubject = !filterSubject || assignment.subject === filterSubject;

    // Status filter
    const matchesStatus = !filterStatus || assignment.status === filterStatus;

    return matchesSearch && matchesBatch && matchesTerm && matchesSubject && matchesStatus;
  });

  // Clear all filters
  const clearFilters = () => {
    setSearchTerm('');
    setFilterBatch('');
    setFilterTerm('');
    setFilterSubject('');
    setFilterStatus('');
  };

  return (
    <div className="space-y-6">
      {activeTab === 'create' ? (
        <div className="bg-card border border-border rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-foreground">
              {editingId ? 'Edit Assignment' : 'Create New Assignment'}
            </h2>
            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                Cancel Edit
              </button>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Basic Information
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Batch <span className="text-red-500">*</span>
                  </label>
                  {!showBatchOther ? (
                    <select
                      value={formData.batch}
                      onChange={(e) => handleBatchChange(e.target.value)}
                      className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      <option value="">Select Batch</option>
                      {batches.map((batch) => (
                        <option key={batch} value={batch}>
                          {batch}
                        </option>
                      ))}
                      <option value="__others__">➕ Others (Enter Custom)</option>
                    </select>
                  ) : (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={customBatch}
                        onChange={(e) => setCustomBatch(e.target.value)}
                        className="flex-1 px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter custom batch"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setShowBatchOther(false);
                          setCustomBatch('');
                        }}
                        className="px-3 py-2 text-sm bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-lg"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Term <span className="text-red-500">*</span>
                  </label>
                  {!showTermOther ? (
                    <select
                      value={formData.term}
                      onChange={(e) => handleTermChange(e.target.value)}
                      className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                      disabled={!formData.batch && !showBatchOther}
                    >
                      <option value="">Select Term</option>
                      {terms.map((term) => (
                        <option key={term} value={term}>
                          {term}
                        </option>
                      ))}
                      <option value="__others__">➕ Others (Enter Custom)</option>
                    </select>
                  ) : (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={customTerm}
                        onChange={(e) => setCustomTerm(e.target.value)}
                        className="flex-1 px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter custom term"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setShowTermOther(false);
                          setCustomTerm('');
                        }}
                        className="px-3 py-2 text-sm bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-lg"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Domain
                  </label>
                  {!showDomainOther ? (
                    <select
                      value={formData.domain}
                      onChange={(e) => handleDomainChange(e.target.value)}
                      className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500"
                      disabled={!formData.term && !showTermOther}
                    >
                      <option value="">Select Domain (Optional)</option>
                      {domains.map((domain) => (
                        <option key={domain} value={domain}>
                          {domain}
                        </option>
                      ))}
                      <option value="__others__">➕ Others (Enter Custom)</option>
                    </select>
                  ) : (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={customDomain}
                        onChange={(e) => setCustomDomain(e.target.value)}
                        className="flex-1 px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter custom domain (optional)"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setShowDomainOther(false);
                          setCustomDomain('');
                        }}
                        className="px-3 py-2 text-sm bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-lg"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Subject <span className="text-red-500">*</span>
                  </label>
                  {!showSubjectOther ? (
                    <select
                      value={formData.subject}
                      onChange={(e) => handleSubjectChange(e.target.value)}
                      className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                      disabled={!formData.term && !showTermOther}
                    >
                      <option value="">Select Subject</option>
                      {subjects.map((subject) => (
                        <option key={subject} value={subject}>
                          {subject}
                        </option>
                      ))}
                      <option value="__others__">➕ Others (Enter Custom)</option>
                    </select>
                  ) : (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={customSubject}
                        onChange={(e) => setCustomSubject(e.target.value)}
                        className="flex-1 px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter custom subject"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setShowSubjectOther(false);
                          setCustomSubject('');
                        }}
                        className="px-3 py-2 text-sm bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-lg"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Assignment Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.assignmentHeader}
                  onChange={(e) => setFormData({ ...formData, assignmentHeader: e.target.value })}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter assignment title"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Subtitle (Optional)
                </label>
                <input
                  type="text"
                  value={formData.subHeader}
                  onChange={(e) => setFormData({ ...formData, subHeader: e.target.value })}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter subtitle"
                />
              </div>

              <div className="p-4 bg-blue-50 dark:bg-blue-900/10 rounded-lg border border-blue-200 dark:border-blue-800 space-y-4">
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="groupAssignment"
                    checked={formData.groupAssignment === 'Yes'}
                    onChange={(e) => setFormData({
                      ...formData,
                      groupAssignment: e.target.checked ? 'Yes' : 'No',
                      groupRatingRemarkEnabled: e.target.checked ? 'Yes' : 'No',
                      maximumGroupMembers: e.target.checked ? formData.maximumGroupMembers : ''
                    })}
                    className="w-4 h-4 text-blue-600 bg-background border-border rounded focus:ring-blue-500"
                  />
                  <label htmlFor="groupAssignment" className="text-sm font-medium text-foreground">
                    Group Assignment
                  </label>
                </div>

                {/* Peer Rating & Remarks Section */}
                {formData.groupAssignment === 'Yes' && (
                  <div className="pl-7 space-y-3 border-l-2 border-blue-300 dark:border-blue-700">
                    <div className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        id="groupRatingRemarkEnabled"
                        checked={formData.groupRatingRemarkEnabled === 'Yes'}
                        onChange={(e) => {
                          setFormData({
                            ...formData,
                            groupRatingRemarkEnabled: e.target.checked ? 'Yes' : 'No',
                            maximumGroupMembers: e.target.checked ? formData.maximumGroupMembers : ''
                          });
                        }}
                        className="w-4 h-4 text-orange-600 bg-background border-border rounded focus:ring-orange-500"
                      />
                      <label htmlFor="groupRatingRemarkEnabled" className="text-sm font-medium text-foreground">
                        Enable Peer Rating & Remarks
                      </label>
                    </div>

                    {formData.groupRatingRemarkEnabled === 'Yes' && (
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                          Maximum Group Members <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="number"
                          min="1"
                          max="20"
                          required
                          value={formData.maximumGroupMembers || ''}
                          onChange={(e) => setFormData({ ...formData, maximumGroupMembers: e.target.value })}
                          className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-orange-500"
                          placeholder="Enter maximum number of group members (e.g., 5)"
                        />
                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                          This determines how many peer rating slots will be created in the response sheet
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Assignment Details
                </label>
                <div className="bg-background border border-border rounded-lg">
                  <ReactQuill
                    theme="snow"
                    modules={{
                      toolbar: [
                        [{ 'header': [1, 2, 3, false] }],
                        ['bold', 'italic', 'underline', 'strike'],
                        ['blockquote', 'code-block'],
                        [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                        [{ 'indent': '-1'}, { 'indent': '+1' }],
                        [{ 'align': [] }],
                        [{ 'color': [] }, { 'background': [] }],
                        [{ 'font': [] }],
                        [{ 'size': ['small', false, 'large', 'huge'] }],
                        ['link', 'image', 'video'],
                        ['clean']
                      ]
                    }}
                    value={formData.assignmentDetails || ''}
                    onChange={(value) => setFormData({ ...formData, assignmentDetails: value })}
                    placeholder="Write your assignment details here..."
                    className="h-64"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Total Marks
                </label>
                <input
                  type="number"
                  value={formData.totalMarks}
                  onChange={(e) => setFormData({ ...formData, totalMarks: e.target.value })}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="100"
                />
              </div>

              {/* Submission Requirements */}
              <div className="space-y-4 p-6 bg-green-50 dark:bg-green-900/10 rounded-lg border border-green-200 dark:border-green-800">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-green-500 rounded-lg">
                      <Paperclip className="w-5 h-5 text-white" />
                    </div>
                    <h3 className="text-lg font-semibold text-foreground">Submission Requirements</h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        id="fileUploadMandatory"
                        checked={formData.attachmentMandatory === 'Yes'}
                        onChange={(e) => setFormData({ ...formData, attachmentMandatory: e.target.checked ? 'Yes' : 'No' })}
                        className="w-4 h-4 text-green-600 bg-background border-border rounded focus:ring-green-500"
                      />
                      <label htmlFor="fileUploadMandatory" className="text-sm font-medium text-foreground">
                        File Upload Mandatory
                      </label>
                    </div>

                    <div className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        id="urlLinkMandatory"
                        checked={formData.urlMandatory === 'Yes'}
                        onChange={(e) => setFormData({ ...formData, urlMandatory: e.target.checked ? 'Yes' : 'No' })}
                        className="w-4 h-4 text-green-600 bg-background border-border rounded focus:ring-green-500"
                      />
                      <label htmlFor="urlLinkMandatory" className="text-sm font-medium text-foreground">
                        URL Link Mandatory
                      </label>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium text-foreground mb-3">Allowed File Types</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3 mb-3">
                      {fileTypes.map((type) => (
                        <div key={type} className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id={`filetype-${type}`}
                            checked={selectedFileTypes.includes(type)}
                            onChange={() => toggleFileType(type)}
                            className="w-4 h-4 text-green-600 bg-background border-border rounded focus:ring-green-500"
                          />
                          <label htmlFor={`filetype-${type}`} className="text-sm text-foreground uppercase">
                            {type}
                          </label>
                        </div>
                      ))}
                    </div>

                    <div className="flex items-center space-x-3 mb-4">
                      <input
                        type="checkbox"
                        id="allowAll"
                        checked={selectedFileTypes.length === fileTypes.length && fileTypes.length > 0}
                        onChange={toggleAllFileTypes}
                        className="w-4 h-4 text-green-600 bg-background border-border rounded focus:ring-green-500"
                      />
                      <label htmlFor="allowAll" className="text-sm font-medium text-foreground">
                        Allow All
                      </label>
                    </div>

                    <button
                      type="button"
                      onClick={resetFileTypes}
                      className="w-full px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors flex items-center justify-center gap-2"
                    >
                      <RefreshCw className="w-4 h-4" />
                      Reset All
                    </button>
                  </div>
              </div>

              {/* File Attachments Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                  <Paperclip className="w-5 h-5" />
                  File Attachments
                </h3>
                <div className="border-2 border-dashed border-border rounded-lg p-6 bg-background">
                  <input
                    type="file"
                    id="file-upload"
                    multiple
                    onChange={handleFileUpload}
                    className="hidden"
                    disabled={uploadedFiles.length >= 5}
                  />
                  <label
                    htmlFor="file-upload"
                    className={`flex flex-col items-center justify-center cursor-pointer ${
                      uploadedFiles.length >= 5 ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    <Upload className="w-12 h-12 text-primary mb-2" />
                    <p className="text-foreground font-medium mb-1">Drag & drop files here</p>
                    <p className="text-muted-foreground text-sm">or click to browse files</p>
                    <p className="text-muted-foreground text-xs mt-2">
                      {uploadedFiles.length}/5 files uploaded
                    </p>
                  </label>
                </div>

                {uploadedFiles.length > 0 && (
                  <div className="space-y-2">
                    {uploadedFiles.map((file, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 bg-muted rounded-lg"
                      >
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-primary" />
                          <span className="text-sm text-foreground">{file.name}</span>
                          <span className="text-xs text-muted-foreground">
                            ({(file.size / 1024).toFixed(2)} KB)
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeFile(index)}
                          className="text-red-500 hover:text-red-600"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Assignment URLs */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-foreground">Assignment URLs (Optional)</h3>
                    <p className="text-sm text-muted-foreground">Add up to 5 external links related to this assignment</p>
                  </div>
                  <button
                    type="button"
                    onClick={addAssignmentURL}
                    disabled={assignmentURLs.length >= 5}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Add URL ({assignmentURLs.length}/5)
                  </button>
                </div>

                {assignmentURLs.map((urlItem, index) => (
                  <div key={index} className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-background/50 rounded-lg border border-border">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Name/Title
                      </label>
                      <input
                        type="text"
                        value={urlItem.name}
                        onChange={(e) => updateAssignmentURL(index, 'name', e.target.value)}
                        className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="e.g., Reference Document"
                      />
                    </div>
                    <div className="flex gap-2">
                      <div className="flex-1">
                        <label className="block text-sm font-medium text-foreground mb-2">
                          URL
                        </label>
                        <input
                          type="url"
                          value={urlItem.url}
                          onChange={(e) => updateAssignmentURL(index, 'url', e.target.value)}
                          className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="https://..."
                        />
                      </div>
                      <div className="flex items-end">
                        <button
                          type="button"
                          onClick={() => removeAssignmentURL(index)}
                          className="px-3 py-2 text-red-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Remove URL"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Questions Section - Add up to 20 questions */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-foreground">Questions (Optional)</h3>
                  <p className="text-sm text-muted-foreground">Add up to 20 questions for this assignment</p>
                </div>
                <button
                  type="button"
                  onClick={addQuestion}
                  disabled={questionCount >= 20}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Add Question ({questionCount}/20)
                </button>
              </div>

              {Array.from({ length: questionCount }, (_, index) => index + 1).map((qNum) => {
                const qKey = `q${qNum}` as keyof typeof formData;
                const qMandatoryKey = `q${qNum}Mandatory` as keyof typeof formData;

                return (
                  <div key={qNum} className="space-y-2 p-4 bg-background/50 rounded-lg border border-border">
                    <div className="flex items-center justify-between">
                      <label className="block text-sm font-medium text-foreground">
                        Question {qNum}
                      </label>
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id={`q${qNum}Mandatory`}
                            checked={formData[qMandatoryKey] === 'Yes'}
                            onChange={(e) => setFormData({ ...formData, [qMandatoryKey]: e.target.checked ? 'Yes' : 'No' })}
                            className="w-4 h-4 text-blue-600 bg-background border-border rounded focus:ring-blue-500"
                          />
                          <label htmlFor={`q${qNum}Mandatory`} className="text-xs font-medium text-muted-foreground">
                            Mandatory
                          </label>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeQuestion(qNum)}
                          className="text-red-500 hover:text-red-600 transition-colors"
                          title="Delete question"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <textarea
                      value={formData[qKey] as string || ''}
                      onChange={(e) => setFormData({ ...formData, [qKey]: e.target.value })}
                      className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder={`Enter question ${qNum}...`}
                      rows={3}
                    />
                  </div>
                );
              })}
            </div>

            {/* Timing */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Schedule
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Start Date & Time <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.startDateTime}
                    onChange={(e) => setFormData({ ...formData, startDateTime: e.target.value })}
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    End Date & Time (Deadline) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.endDateTime}
                    onChange={(e) => setFormData({ ...formData, endDateTime: e.target.value })}
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Assignment Configuration */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <Users className="w-5 h-5" />
                Assignment Configuration
              </h3>

              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="createInDrive"
                  checked={formData.createInDrive === 'Yes'}
                  onChange={(e) => setFormData({ ...formData, createInDrive: e.target.checked ? 'Yes' : 'No' })}
                  className="w-4 h-4 text-blue-600 bg-background border-border rounded focus:ring-blue-500"
                  disabled={!!editingId}
                />
                <label htmlFor="createInDrive" className="text-sm font-medium text-foreground">
                  Create Drive Folders
                  {editingId && <span className="text-xs text-muted-foreground ml-1">(locked)</span>}
                </label>
              </div>

              {formData.createInDrive === 'Yes' && (
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Folder Name (Optional)
                  </label>
                  <input
                    type="text"
                    value={formData.folderName}
                    onChange={(e) => setFormData({ ...formData, folderName: e.target.value })}
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Assignment folder name (leave blank for auto-generated)"
                  />
                </div>
              )}
            </div>

            {/* Submit Buttons */}
            <div className="flex items-center justify-end gap-3 pt-4">
              {editingId && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-6 py-2.5 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center gap-2"
                >
                  <X className="w-4 h-4" />
                  Cancel
                </button>
              )}
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-400 transition-colors flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                {loading ? 'Saving...' : editingId ? 'Update Assignment' : 'Create Assignment'}
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-foreground">All Assignments</h2>
            <button
              onClick={fetchAssignments}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-400 transition-colors flex items-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>

          {/* Search and Filters */}
          <div className="mb-6 space-y-4">
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search assignments by title, subtitle, or subject..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Filter Dropdowns */}
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Filter className="w-4 h-4" />
                <span className="text-sm font-medium">Filters:</span>
              </div>

              <select
                value={filterBatch}
                onChange={(e) => setFilterBatch(e.target.value)}
                className="px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              >
                <option value="">All Batches</option>
                {batches.map((batch) => (
                  <option key={batch} value={batch}>
                    {batch}
                  </option>
                ))}
              </select>

              <select
                value={filterTerm}
                onChange={(e) => setFilterTerm(e.target.value)}
                className="px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              >
                <option value="">All Terms</option>
                {terms.map((term) => (
                  <option key={term} value={term}>
                    {term}
                  </option>
                ))}
              </select>

              <select
                value={filterSubject}
                onChange={(e) => setFilterSubject(e.target.value)}
                className="px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              >
                <option value="">All Subjects</option>
                {allSubjectsFromAssignments.map((subject) => (
                  <option key={subject} value={subject}>
                    {subject}
                  </option>
                ))}
              </select>

              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              >
                <option value="">All Status</option>
                <option value="Active">Active</option>
                <option value="Disabled">Disabled</option>
                <option value="Deleted">Deleted</option>
              </select>

              {(searchTerm || filterBatch || filterTerm || filterSubject || filterStatus) && (
                <button
                  onClick={clearFilters}
                  className="px-3 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
                >
                  <X className="w-4 h-4" />
                  Clear Filters
                </button>
              )}
            </div>

            {/* Results count */}
            {(searchTerm || filterBatch || filterTerm || filterSubject || filterStatus) && (
              <div className="text-sm text-muted-foreground">
                Showing {filteredAssignments.length} of {assignments.length} assignments
              </div>
            )}
          </div>

          {loading && assignments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2" />
              Loading assignments...
            </div>
          ) : filteredAssignments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <ClipboardList className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>{assignments.length === 0 ? 'No assignments found' : 'No assignments match your filters'}</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredAssignments.map((assignment) => (
                <div
                  key={assignment.assignmentId}
                  className="bg-background border border-border rounded-lg p-4 hover:shadow-lg transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-lg font-semibold text-foreground">
                          {assignment.assignmentHeader}
                        </h3>
                        <span
                          className={`text-xs px-2 py-1 rounded-full font-medium ${getStatusColor(
                            assignment.status || 'Active'
                          )}`}
                        >
                          {assignment.status}
                        </span>
                        {assignment.publish === 'Yes' && (
                          <span className="text-xs px-2 py-1 rounded-full font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                            Published
                          </span>
                        )}
                      </div>

                      {assignment.subHeader && (
                        <p className="text-sm text-muted-foreground mb-2">
                          {assignment.subHeader}
                        </p>
                      )}

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm text-muted-foreground mt-3">
                        <div>
                          <span className="font-medium">Batch:</span> {assignment.batch}
                        </div>
                        <div>
                          <span className="font-medium">Term:</span> {assignment.term}
                        </div>
                        <div>
                          <span className="font-medium">Subject:</span> {assignment.subject}
                        </div>
                        <div>
                          <span className="font-medium">Marks:</span> {assignment.totalMarks || 'N/A'}
                        </div>
                        <div className="col-span-2">
                          <span className="font-medium">Deadline:</span> {formatDateTime(assignment.endDateTime || '')}
                        </div>
                        {assignment.groupAssignment === 'Yes' && (
                          <div className="col-span-2">
                            <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400">
                              <Users className="w-3 h-3" />
                              Group Assignment
                            </span>
                          </div>
                        )}
                      </div>

                      {assignment.driveLink && (
                        <div className="flex gap-2 mt-3">
                          <a
                            href={assignment.driveLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1"
                          >
                            <FileText className="w-3 h-3" />
                            Drive Folder
                          </a>
                          {assignment.sheetsLink && (
                            <a
                              href={assignment.sheetsLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1"
                            >
                              <FileText className="w-3 h-3" />
                              Submissions Sheet
                            </a>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col gap-2">
                      <button
                        onClick={() => handleEdit(assignment)}
                        className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
                        title="Edit"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      {assignment.status === 'Active' && (
                        <button
                          onClick={() => handleStatusChange(assignment.assignmentId!, 'Disabled')}
                          className="p-2 text-yellow-600 hover:bg-yellow-50 dark:hover:bg-yellow-900/20 rounded transition-colors"
                          title="Disable"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      )}
                      {assignment.status === 'Disabled' && (
                        <button
                          onClick={() => handleStatusChange(assignment.assignmentId!, 'Active')}
                          className="p-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded transition-colors"
                          title="Activate"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(assignment.assignmentId!)}
                        className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
