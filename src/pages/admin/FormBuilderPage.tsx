import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import {
  Save,
  Eye,
  ArrowLeft,
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
  Copy,
  Settings,
  Type,
  Hash,
  Mail,
  Phone,
  Calendar,
  Link2,
  AlignLeft,
  CheckSquare,
  Circle,
  List,
  Star,
  ToggleLeft,
  Upload,
  User,
  Users,
  MapPin,
  FileText,
  Workflow,
  X,
  Bold,
  Italic,
  Underline,
  Highlighter,
  Palette,
  Image,
  Shield,
  Video,
  TrendingUp,
  BarChart3,
  ArrowUpDown,
  Grid3x3,
  DollarSign,
  FolderOpen,
  CalendarClock,
  FileQuestion,
  ListChecks,
  Layers,
  ExternalLink,
  AlertCircle,
  Check,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { createForm, updateForm, getFormById, createQuestion, updateQuestion, getTermStructure, getFormTypes, getAllStudents, type TermMapping, type Student } from '../../services/formsApi';

// Question type definitions organized by category (Typeform-style)
const QUESTION_TYPE_CATEGORIES = [
  {
    name: '🧾 Contact Info',
    icon: User,
    types: [
      { value: 'Contact Info', label: 'Contact Info', icon: User, description: 'Collects name, email, phone, and address' },
      { value: 'Email', label: 'Email', icon: Mail, description: 'Email address with validation' },
      { value: 'Phone Number', label: 'Phone Number', icon: Phone, description: 'Phone with country code support' },
      { value: 'Address', label: 'Address', icon: MapPin, description: 'Multi-line address input' },
      { value: 'Website', label: 'Website', icon: Link2, description: 'URL with validation' },
    ]
  },
  {
    name: '🟣 Choice',
    icon: Circle,
    types: [
      { value: 'Multiple Choice', label: 'Multiple Choice', icon: Circle, description: 'Single or multiple selection' },
      { value: 'Dropdown', label: 'Dropdown', icon: List, description: 'Compact dropdown menu' },
      { value: 'Picture Choice', label: 'Picture Choice', icon: Image, description: 'Select from image options' },
      { value: 'Yes/No', label: 'Yes/No', icon: ToggleLeft, description: 'Binary choice question' },
      { value: 'Legal', label: 'Legal', icon: Shield, description: 'Accept terms or policy' },
      { value: 'Checkboxes', label: 'Checkboxes', icon: CheckSquare, description: 'Multiple select checkboxes' },
      { value: 'Group Selection', label: 'Group Selection', icon: Users, description: 'Form groups of students' },
    ]
  },
  {
    name: '💬 Text & Video',
    icon: Type,
    types: [
      { value: 'Long Text', label: 'Long Text', icon: AlignLeft, description: 'Multi-line text input' },
      { value: 'Short Text', label: 'Short Text', icon: Type, description: 'Single line text' },
      { value: 'Video and Audio', label: 'Video and Audio', icon: Video, description: 'Embed video or audio' },
    ]
  },
  {
    name: '🟩 Rating & Ranking',
    icon: Star,
    types: [
      { value: 'NPS', label: 'Net Promoter Score (NPS)', icon: TrendingUp, description: '0-10 recommendation scale' },
      { value: 'Opinion Scale', label: 'Opinion Scale', icon: BarChart3, description: 'Custom numeric scale' },
      { value: 'Rating', label: 'Rating', icon: Star, description: 'Star/heart/smiley rating' },
      { value: 'Ranking', label: 'Ranking', icon: ArrowUpDown, description: 'Drag-and-drop ranking' },
      { value: 'Matrix', label: 'Matrix', icon: Grid3x3, description: 'Grid layout multi-dimensional' },
    ]
  },
  {
    name: '🟡 Other',
    icon: Hash,
    types: [
      { value: 'Number', label: 'Number', icon: Hash, description: 'Numeric input with range' },
      { value: 'Date', label: 'Date', icon: Calendar, description: 'Calendar date picker' },
      { value: 'File Upload', label: 'File Upload', icon: Upload, description: 'File attachment upload' },
    ]
  },
  {
    name: '💳 Integrations',
    icon: Workflow,
    types: [
      { value: 'Razorpay / Payment link', label: 'Razorpay / Payment link', icon: DollarSign, description: 'Collect payments' },
      { value: 'Google Drive', label: 'Google Drive', icon: FolderOpen, description: 'Link Drive files/folders' },
      { value: 'Calendly', label: 'Calendly', icon: CalendarClock, description: 'Booking widget' },
    ]
  },
  {
    name: '⚙️ Advanced',
    icon: Settings,
    types: [
      { value: 'Start Screen', label: 'Welcome Screen', icon: FileText, description: 'Form introduction screen' },
      { value: 'Partial Submit Point', label: 'Partial Submit Point', icon: ListChecks, description: 'Save progress mid-form' },
      { value: 'Statement', label: 'Statement', icon: FileQuestion, description: 'Text/media display block' },
      { value: 'Question Group', label: 'Question Group', icon: Layers, description: 'Group related questions' },
      { value: 'Multi-Question Page', label: 'Multi-Question Page', icon: Grid3x3, description: 'Multiple questions per screen' },
      { value: 'End Screen', label: 'End Screen', icon: FileText, description: 'Thank you / completion screen' },
      { value: 'Redirect to URL', label: 'Redirect to URL', icon: ExternalLink, description: 'Redirect after completion' },
    ]
  },
];

// Flat list for backward compatibility
const QUESTION_TYPES = QUESTION_TYPE_CATEGORIES.flatMap(cat => cat.types);

interface FormBuilderData {
  name: string;
  description: string;
  type: string;
  batch: string;
  term: string;
  domain: string;
  subject: string;
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
  isActive: boolean;
  showAtStartUntilFilled: boolean;
  maxResponsesPerUser: number;
  allowStudentViewResponse: boolean;
  visibleTo: string;
  confirmationMessage: string;
}

interface QuestionData {
  id?: string;
  formId?: string;
  questionText: string;
  questionType: string;
  isRequired: string;
  order: number;
  placeholder?: string;
  helpText?: string;
  defaultValue?: string;
  validationRule?: string;
  validationMessage?: string;
  minValue?: string;
  maxValue?: string;
  minLength?: string;
  maxLength?: string;
  allowedFileTypes?: string;
  maxFileSize?: string;
  maxSelections?: string;
  showOtherOption?: string;
  randomizeOptions?: string;
  allowMultipleSelections?: string;
  selectionLimitType?: string; // 'unlimited' | 'exact' | 'range'
  minSelections?: string;
  options?: Array<{ optionText: string; optionValue: string; order: number; imageUrl?: string }>;
  hasConditionalLogic?: boolean;
  conditionalRules?: Array<{
    questionIndex: number;
    operator: string;
    value: string;
  }>;

  // Contact Info specific
  collectName?: string;
  collectEmail?: string;
  collectPhone?: string;
  collectAddress?: string;

  // Rating specific
  ratingType?: string; // 'star' | 'heart' | 'smiley'
  ratingScale?: string; // number of icons

  // Scale specific (NPS, Opinion Scale)
  scaleMin?: string;
  scaleMax?: string;
  scaleMinLabel?: string;
  scaleMaxLabel?: string;
  scaleMidLabel?: string;

  // Matrix specific
  matrixRows?: Array<{ label: string; value: string }>;
  matrixColumns?: Array<{ label: string; value: string }>;
  matrixType?: string; // 'single' | 'multiple'

  // Date specific
  dateFormat?: string;
  restrictPast?: string;
  restrictFuture?: string;

  // Media specific (Video, Statement)
  mediaUrl?: string;
  mediaType?: string; // 'video' | 'audio' | 'image'
  autoplay?: string;

  // Integration specific
  stripeAmount?: string;
  stripeCurrency?: string;
  driveType?: string; // 'file' | 'folder'
  calendlyUrl?: string;

  // AI specific
  aiContext?: string;
  aiFaqData?: string;

  // Advanced specific
  redirectUrl?: string;
  redirectDelay?: string;
  statementContent?: string;
  groupedQuestionIds?: string[];

  // Group Selection specific
  minGroupSize?: number;
  maxGroupSize?: number;
  restrictStudents?: string; // 'Yes' or 'No'
  eligibleStudents?: string; // JSON array of student IDs
}

export function FormBuilderPage() {
  const navigate = useNavigate();
  const { formId } = useParams<{ formId?: string }>();
  const isEditMode = Boolean(formId);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showQuestionTypes, setShowQuestionTypes] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [activeQuestionIndex, setActiveQuestionIndex] = useState<number>(0); // Typeform-style: focus on one question at a time
  const [draggedQuestionIndex, setDraggedQuestionIndex] = useState<number | null>(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState<{ show: boolean; questionIndex: number | null }>({ show: false, questionIndex: null });

  // Dynamic dropdown data
  const [termMappings, setTermMappings] = useState<TermMapping[]>([]);
  const [batches, setBatches] = useState<string[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [, setTerms] = useState<string[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [, setDomains] = useState<string[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [, setSubjects] = useState<string[]>([]);
  const [formTypes, setFormTypes] = useState<string[]>([]);

  // Form metadata
  const [formData, setFormData] = useState<FormBuilderData>({
    name: '',
    description: '',
    type: '',
    batch: '',
    term: '',
    domain: '',
    subject: '',
    startDate: new Date().toISOString().split('T')[0],
    startTime: '00:00',
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endTime: '23:59',
    isActive: true,
    showAtStartUntilFilled: false,
    maxResponsesPerUser: 1,
    allowStudentViewResponse: false,
    visibleTo: '',
    confirmationMessage: 'Thank you for your submission!',
  });

  // Questions
  const [questions, setQuestions] = useState<QuestionData[]>([]);
  const [, setExpandedQuestionId] = useState<string | null>(null);

  // Fetch dropdown data on mount
  useEffect(() => {
    fetchDropdownData();
  }, []);

  // Fetch form data if editing
  useEffect(() => {
    if (isEditMode && formId) {
      fetchForm();
    }
  }, [formId, isEditMode]);

  // Helper function to parse both DD/MM/YYYY HH:MM:SS and dd-MMM-yyyy HH:mm:ss to date and time
  const parseDateTimeString = (dateTimeStr: string): { date: string; time: string } => {
    if (!dateTimeStr) return { date: '', time: '00:00' };

    const parts = dateTimeStr.split(' ');
    if (parts.length < 2) return { date: '', time: '00:00' };

    const datePart = parts[0];
    const timePart = parts[1]; // HH:MM:SS

    let day: string, month: string, year: string;

    // Check if it's dd-MMM-yyyy format (e.g., "14-Nov-2025")
    if (datePart.includes('-')) {
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const [dayStr, monthStr, yearStr] = datePart.split('-');
      day = dayStr;
      year = yearStr;
      // Convert month name to number
      const monthIndex = monthNames.indexOf(monthStr);
      month = monthIndex !== -1 ? String(monthIndex + 1).padStart(2, '0') : '01';
    } else {
      // Old format: DD/MM/YYYY
      [day, month, year] = datePart.split('/');
    }

    const [hour, minute] = timePart.split(':');

    // Convert to YYYY-MM-DD for HTML date input
    const date = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    const time = `${hour.padStart(2, '0')}:${minute.padStart(2, '0')}`;

    return { date, time };
  };

  // Helper function to format date and time to dd-MMM-yyyy HH:mm:ss
  const formatDateTime = (date: string, time: string): string => {
    if (!date) return '';

    // Input: date = YYYY-MM-DD, time = HH:MM
    const [year, month, day] = date.split('-');
    const [hour, minute] = time.split(':');

    // Month names array (0-indexed)
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthIndex = parseInt(month, 10) - 1;
    const monthName = monthNames[monthIndex];

    // Output: dd-MMM-yyyy HH:mm:ss (e.g., "14-Nov-2025 18:07:14")
    return `${day}-${monthName}-${year} ${hour}:${minute}:00`;
  };

  const fetchDropdownData = async () => {
    try {
      // Fetch term structure
      const termResult = await getTermStructure();
      if (termResult.success && termResult.data) {
        setTermMappings(termResult.data.mappings);
        setBatches(termResult.data.batches);
      }

      // Fetch form types
      const typesResult = await getFormTypes();
      if (typesResult.success && typesResult.data) {
        setFormTypes(typesResult.data);
      }
    } catch (error) {
      console.error('Error fetching dropdown data:', error);
      toast.error('Failed to load form options');
    }
  };

  // Cascading dropdown logic
  const getAvailableTerms = (): string[] => {
    if (!formData.batch || !termMappings || termMappings.length === 0) return [];
    const filtered = termMappings.filter(m => m.batch === formData.batch);
    return Array.from(new Set(filtered.map(m => m.term))).sort();
  };

  const getAvailableDomains = (): string[] => {
    if (!formData.batch || !formData.term || !termMappings || termMappings.length === 0) return [];
    const filtered = termMappings.filter(m =>
      m.batch === formData.batch && m.term === formData.term
    );
    return Array.from(new Set(filtered.map(m => m.domain))).sort();
  };

  const getAvailableSubjects = (): string[] => {
    if (!formData.batch || !formData.term || !formData.domain || !termMappings || termMappings.length === 0) return [];
    const filtered = termMappings.filter(m =>
      m.batch === formData.batch &&
      m.term === formData.term &&
      m.domain === formData.domain
    );
    return Array.from(new Set(filtered.map(m => m.subject))).sort();
  };

  // Reset dependent fields when parent changes
  const handleBatchChange = (batch: string) => {
    setFormData({
      ...formData,
      batch,
      term: '',
      domain: '',
      subject: ''
    });
  };

  const handleTermChange = (term: string) => {
    setFormData({
      ...formData,
      term,
      domain: '',
      subject: ''
    });
  };

  const handleDomainChange = (domain: string) => {
    setFormData({
      ...formData,
      domain,
      subject: ''
    });
  };

  const fetchForm = async () => {
    if (!formId) return;

    setLoading(true);
    try {
      const result = await getFormById(formId);
      if (result.success && result.data) {
        const formData = result.data.form;
        const questions = result.data.questions;

        // Parse start and end datetime strings
        const startDateTime = parseDateTimeString(formData.startDateTime);
        const endDateTime = parseDateTimeString(formData.endDateTime);

        // Populate form data
        setFormData({
          name: formData.name,
          description: formData.description,
          type: formData.type,
          batch: formData.batch,
          term: formData.term,
          domain: formData.domain,
          subject: formData.subject,
          startDate: startDateTime.date,
          startTime: startDateTime.time,
          endDate: endDateTime.date,
          endTime: endDateTime.time,
          isActive: formData.isActive === 'Yes',
          showAtStartUntilFilled: formData.showAtStartUntilFilled === 'Yes',
          maxResponsesPerUser: formData.maxResponsesPerUser || 1,
          allowStudentViewResponse: formData.allowStudentViewResponse === 'Yes',
          visibleTo: formData.visibleTo || '',
          confirmationMessage: formData.confirmationMessage || 'Thank you for your submission!',
        });

        // Populate questions
        if (questions && questions.length > 0) {
          setQuestions(questions as QuestionData[]);
        }
      } else {
        toast.error(result.error || 'Failed to load form');
      }
    } catch (error) {
      console.error('Error fetching form:', error);
      toast.error('Failed to load form');
    } finally {
      setLoading(false);
    }
  };

  const handleAddQuestion = (questionType: string) => {
    const newQuestion: QuestionData = {
      questionText: '',
      questionType,
      isRequired: 'No',
      order: questions.length + 1,
      placeholder: '',
      helpText: '',
      defaultValue: '',
      validationRule: '',
      validationMessage: '',
      minValue: '',
      maxValue: '',
      minLength: '',
      maxLength: '',
      allowedFileTypes: '',
      maxFileSize: '',
      maxSelections: '',
      showOtherOption: 'No',
      randomizeOptions: 'No',
      allowMultipleSelections: 'No',
      selectionLimitType: 'unlimited',
      minSelections: '1',
      options: ['Multiple Choice', 'Checkboxes', 'Dropdown'].includes(questionType)
        ? [
            { optionText: '', optionValue: 'option1', order: 1 },
            { optionText: '', optionValue: 'option2', order: 2 },
          ]
        : questionType === 'Yes/No'
        ? [
            { optionText: 'Yes', optionValue: 'yes', order: 1 },
            { optionText: 'No', optionValue: 'no', order: 2 },
          ]
        : questionType === 'Picture Choice'
        ? [
            { optionText: '', optionValue: 'option1', order: 1, imageUrl: '' },
            { optionText: '', optionValue: 'option2', order: 2, imageUrl: '' },
          ]
        : undefined,
    };

    // Set type-specific defaults
    if (questionType === 'Contact Info') {
      newQuestion.collectName = 'Yes';
      newQuestion.collectEmail = 'Yes';
      newQuestion.collectPhone = 'No';
      newQuestion.collectAddress = 'No';
    } else if (questionType === 'Rating') {
      newQuestion.ratingType = 'star';
      newQuestion.ratingScale = '5';
    } else if (questionType === 'NPS') {
      newQuestion.scaleMin = '0';
      newQuestion.scaleMax = '10';
      newQuestion.scaleMinLabel = 'Not likely';
      newQuestion.scaleMaxLabel = 'Very likely';
    } else if (questionType === 'Opinion Scale') {
      newQuestion.scaleMin = '1';
      newQuestion.scaleMax = '5';
      newQuestion.scaleMinLabel = '';
      newQuestion.scaleMaxLabel = '';
      newQuestion.scaleMidLabel = '';
    } else if (questionType === 'Matrix') {
      newQuestion.matrixRows = [
        { label: 'Row 1', value: 'row1' },
        { label: 'Row 2', value: 'row2' },
      ];
      newQuestion.matrixColumns = [
        { label: 'Column 1', value: 'col1' },
        { label: 'Column 2', value: 'col2' },
      ];
      newQuestion.matrixType = 'single';
    } else if (questionType === 'Date') {
      newQuestion.dateFormat = 'MM/DD/YYYY';
      newQuestion.restrictPast = 'No';
      newQuestion.restrictFuture = 'No';
    } else if (questionType === 'Video and Audio') {
      newQuestion.mediaUrl = '';
      newQuestion.mediaType = 'video';
      newQuestion.autoplay = 'No';
    } else if (questionType === 'Razorpay / Payment link') {
      newQuestion.stripeAmount = '';
      newQuestion.stripeCurrency = 'INR';
    } else if (questionType === 'Google Drive') {
      newQuestion.driveType = 'file';
    } else if (questionType === 'Calendly') {
      newQuestion.calendlyUrl = '';
    } else if (questionType === 'Redirect to URL') {
      newQuestion.redirectUrl = '';
      newQuestion.redirectDelay = '3';
    } else if (questionType === 'Statement') {
      newQuestion.statementContent = '';
      newQuestion.mediaUrl = '';
      newQuestion.mediaType = 'none';
    } else if (questionType === 'Group Selection') {
      newQuestion.minGroupSize = 3;
      newQuestion.maxGroupSize = 5;
    }

    let updatedQuestions = [...questions];
    let newQuestionIndex = updatedQuestions.length;

    // Start Screen always goes first
    if (questionType === 'Start Screen') {
      updatedQuestions.unshift(newQuestion);
      newQuestionIndex = 0;
    }
    // End Screen always goes last
    else if (questionType === 'End Screen') {
      updatedQuestions.push(newQuestion);
      newQuestionIndex = updatedQuestions.length - 1;
    }
    // Regular questions go before End Screen (if exists) or at the end
    else {
      const endScreenIndex = updatedQuestions.findIndex(q => q.questionType === 'End Screen');
      if (endScreenIndex !== -1) {
        updatedQuestions.splice(endScreenIndex, 0, newQuestion);
        newQuestionIndex = endScreenIndex;
      } else {
        updatedQuestions.push(newQuestion);
        newQuestionIndex = updatedQuestions.length - 1;
      }
    }

    // Update order for all questions
    updatedQuestions.forEach((q, i) => {
      q.order = i + 1;
    });

    setQuestions(updatedQuestions);
    setShowQuestionTypes(false);
    // Auto-focus on the newly added question
    setActiveQuestionIndex(newQuestionIndex);
    // Auto-expand the new question (for any legacy view)
    setTimeout(() => setExpandedQuestionId(String(newQuestionIndex)), 100);
  };

  const handleUpdateQuestion = (index: number, updates: Partial<QuestionData>) => {
    const updated = [...questions];
    updated[index] = { ...updated[index], ...updates };
    setQuestions(updated);
  };

  const handleDeleteQuestion = (index: number) => {
    const question = questions[index];

    // Check if question has content
    const hasContent = question.questionText?.trim() ||
                      (question.options && question.options.length > 0 && question.options.some(opt => opt.optionText?.trim())) ||
                      question.helpText?.trim() ||
                      question.placeholder?.trim();

    if (hasContent) {
      // Show custom confirmation modal
      setDeleteConfirmation({ show: true, questionIndex: index });
    } else {
      // Delete directly without confirmation for empty questions
      performDeleteQuestion(index);
    }
  };

  const performDeleteQuestion = (index: number) => {
    const updated = questions.filter((_, i) => i !== index);
    // Re-order remaining questions
    updated.forEach((q, i) => {
      q.order = i + 1;
    });
    setQuestions(updated);

    // Adjust active question index after deletion
    if (updated.length === 0) {
      setActiveQuestionIndex(0);
    } else if (activeQuestionIndex >= updated.length) {
      setActiveQuestionIndex(updated.length - 1);
    } else if (activeQuestionIndex > index) {
      setActiveQuestionIndex(activeQuestionIndex - 1);
    }

    toast.success('Question deleted');
    setDeleteConfirmation({ show: false, questionIndex: null });
  };

  const handleDuplicateQuestion = (index: number) => {
    const questionToDuplicate = { ...questions[index] };
    delete questionToDuplicate.id; // Remove ID so it creates a new one
    questionToDuplicate.questionText = `${questionToDuplicate.questionText} (Copy)`;
    questionToDuplicate.order = questions.length + 1;

    const updated = [...questions];
    updated.splice(index + 1, 0, questionToDuplicate);

    // Re-order
    updated.forEach((q, i) => {
      q.order = i + 1;
    });

    setQuestions(updated);
    // Auto-focus on the duplicated question
    setActiveQuestionIndex(index + 1);
    toast.success('Question duplicated');
  };

  const handleAddConditionalRule = (questionIndex: number) => {
    const updated = [...questions];
    if (!updated[questionIndex].conditionalRules) {
      updated[questionIndex].conditionalRules = [];
    }
    updated[questionIndex].conditionalRules!.push({
      questionIndex: -1,
      operator: 'equals',
      value: '',
    });
    setQuestions(updated);
  };

  const handleUpdateConditionalRule = (
    questionIndex: number,
    ruleIndex: number,
    updates: Partial<{ questionIndex: number; operator: string; value: string }>
  ) => {
    const updated = [...questions];
    updated[questionIndex].conditionalRules![ruleIndex] = {
      ...updated[questionIndex].conditionalRules![ruleIndex],
      ...updates,
    };
    setQuestions(updated);
  };

  const handleDeleteConditionalRule = (questionIndex: number, ruleIndex: number) => {
    const updated = [...questions];
    updated[questionIndex].conditionalRules = updated[questionIndex].conditionalRules!.filter(
      (_, i) => i !== ruleIndex
    );
    setQuestions(updated);
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _handleMoveQuestion = (index: number, direction: 'up' | 'down') => {
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === questions.length - 1)
    ) {
      return;
    }

    const updated = [...questions];
    const newIndex = direction === 'up' ? index - 1 : index + 1;

    // Swap
    [updated[index], updated[newIndex]] = [updated[newIndex], updated[index]];

    // Update order
    updated[index].order = index + 1;
    updated[newIndex].order = newIndex + 1;

    setQuestions(updated);
  };

  // Drag and drop handlers
  const handleDragStart = (index: number) => {
    const question = questions[index];
    // Prevent dragging Start Screen and End Screen
    if (question.questionType === 'Start Screen' || question.questionType === 'End Screen') {
      return;
    }
    setDraggedQuestionIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedQuestionIndex === null || draggedQuestionIndex === index) return;

    const updated = [...questions];
    const draggedItem = updated[draggedQuestionIndex];
    const targetItem = updated[index];

    // Prevent dropping on or reordering Start Screen or End Screen
    if (draggedItem.questionType === 'Start Screen' || draggedItem.questionType === 'End Screen') {
      return;
    }
    if (targetItem.questionType === 'Start Screen' || targetItem.questionType === 'End Screen') {
      return;
    }

    // Remove dragged item
    updated.splice(draggedQuestionIndex, 1);

    // Insert at new position
    updated.splice(index, 0, draggedItem);

    // Update order for all questions
    updated.forEach((q, i) => {
      q.order = i + 1;
    });

    setQuestions(updated);
    setDraggedQuestionIndex(index);

    // Update active question index if needed
    if (activeQuestionIndex === draggedQuestionIndex) {
      setActiveQuestionIndex(index);
    }
  };

  const handleDragEnd = () => {
    setDraggedQuestionIndex(null);
  };

  const handleAddOption = (questionIndex: number) => {
    const updated = [...questions];
    const question = updated[questionIndex];

    if (!question.options) {
      question.options = [];
    }

    question.options.push({
      optionText: '',
      optionValue: `option${question.options.length + 1}`,
      order: question.options.length + 1,
    });

    setQuestions(updated);
  };

  const handleUpdateOption = (
    questionIndex: number,
    optionIndex: number,
    updates: Partial<{ optionText: string; optionValue: string }>
  ) => {
    const updated = [...questions];
    const question = updated[questionIndex];

    if (question.options) {
      question.options[optionIndex] = {
        ...question.options[optionIndex],
        ...updates,
      };
    }

    setQuestions(updated);
  };

  const handleDeleteOption = (questionIndex: number, optionIndex: number) => {
    const updated = [...questions];
    const question = updated[questionIndex];

    if (question.options) {
      question.options = question.options.filter((_, i) => i !== optionIndex);
      // Re-order remaining options
      question.options.forEach((opt, i) => {
        opt.order = i + 1;
      });
    }

    setQuestions(updated);
  };

  const handleSaveForm = async () => {
    // Validation
    if (!formData.name.trim()) {
      toast.error('Please enter a form name');
      return;
    }

    if (questions.length === 0) {
      toast.error('Please add at least one question');
      return;
    }

    // Validate questions
    for (const question of questions) {
      if (!question.questionText.trim()) {
        toast.error('All questions must have text');
        return;
      }

      if (['Multiple Choice', 'Checkboxes', 'Dropdown'].includes(question.questionType)) {
        if (!question.options || question.options.length < 2) {
          toast.error(`Question "${question.questionText}" needs at least 2 options`);
          return;
        }
      }
    }

    setSaving(true);
    try {
      // Format datetime strings
      const formattedStartDate = formatDateTime(formData.startDate, formData.startTime);
      const formattedEndDate = formatDateTime(formData.endDate, formData.endTime);

      if (isEditMode && formId) {
        // Update existing form - send backend field names directly
        const updatePayload = {
          formName: formData.name,
          description: formData.description,
          formType: formData.type,
          batch: formData.batch,
          term: formData.term,
          domain: formData.domain,
          subject: formData.subject,
          startDateTime: formattedStartDate,
          endDateTime: formattedEndDate,
          isActive: formData.isActive ? 'Yes' : 'No',
          showAtStartUntilFilled: formData.showAtStartUntilFilled ? 'Yes' : 'No',
          maxResponsesPerUser: formData.maxResponsesPerUser,
          allowStudentViewResponse: formData.allowStudentViewResponse ? 'Yes' : 'No',
          visibleTo: formData.visibleTo || '',
          thankYouMessage: formData.confirmationMessage,
        };
        console.log('🔍 UPDATE FORM PAYLOAD:', updatePayload);
        const updateResult = await updateForm(formId, updatePayload as Parameters<typeof updateForm>[1]);

        if (!updateResult.success) {
          throw new Error(updateResult.error || 'Failed to update form');
        }

        // Update questions
        for (const question of questions) {
          if (question.id) {
            // Update existing question - include options for saving
            await updateQuestion(question.id, {
              formId,
              ...question,
              isRequired: question.isRequired === 'Yes',
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
            } as any);
          } else {
            // Create new question
            await createQuestion({
              formId,
              ...question,
              isRequired: question.isRequired === 'Yes',
            });
          }
        }

        toast.success('Form updated successfully!');
        navigate(`/admin/forms`);
      } else {
        // Create new form
        const createPayload = {
          name: formData.name,
          description: formData.description,
          type: formData.type,
          batch: formData.batch,
          term: formData.term,
          domain: formData.domain,
          subject: formData.subject,
          startDate: formattedStartDate,
          endDate: formattedEndDate,
          isActive: formData.isActive,
          showAtStartUntilFilled: formData.showAtStartUntilFilled,
          allowMultipleSubmissions: formData.maxResponsesPerUser > 1,
          confirmationMessage: formData.confirmationMessage,
        };
        console.log('🔍 CREATE FORM PAYLOAD:', createPayload);
        const createResult = await createForm(createPayload as Parameters<typeof createForm>[0]);

        // Log debug info if available
        const resultWithDebug = createResult as { debugLogs?: string[] };
        if (resultWithDebug.debugLogs) {
          console.log('🔧 BACKEND DEBUG LOGS:');
          resultWithDebug.debugLogs.forEach((log: string) => console.log(log));
        }

        if (!createResult.success || !createResult.data) {
          throw new Error(createResult.error || 'Failed to create form');
        }

        const newFormId = createResult.data.formId;

        // Create questions
        for (const question of questions) {
          await createQuestion({
            formId: newFormId,
            ...question,
            isRequired: question.isRequired === 'Yes',
          });
        }

        toast.success('Form created successfully!');
        navigate(`/admin/forms`);
      }
    } catch (error) {
      console.error('Error saving form:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to save form');
    } finally {
      setSaving(false);
    }
  };

  const handlePreview = () => {
    if (!formData.name) {
      toast.error('Please add a form name before previewing');
      return;
    }
    if (questions.length === 0) {
      toast.error('Please add at least one question before previewing');
      return;
    }
    setShowPreview(true);
  };

  const renderPreviewQuestion = (question: QuestionData, index: number) => {
    const questionType = question.questionType;
    const isRequired = question.isRequired === 'Yes';

    // Render Start Screen
    if (questionType === 'Start Screen') {
      return (
        <div key={index} className="mb-6 p-12 bg-gradient-to-br from-primary/10 to-primary/5 border-2 border-primary/20 rounded-xl text-center">
          <h1 className="text-4xl font-bold text-foreground mb-4">
            {question.questionText || 'Welcome'}
          </h1>
          {question.helpText && (
            <p className="text-lg text-muted-foreground mb-8">{question.helpText}</p>
          )}
          <button className="px-8 py-4 bg-primary text-primary-foreground rounded-lg font-semibold text-lg hover:bg-primary/90 transition-colors">
            {question.placeholder || 'Start'}
          </button>
        </div>
      );
    }

    // Render End Screen
    if (questionType === 'End Screen') {
      return (
        <div key={index} className="mb-6 p-12 bg-gradient-to-br from-green-500/10 to-green-500/5 border-2 border-green-500/20 rounded-xl text-center">
          <div className="mb-6">
            <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-4xl font-bold text-foreground mb-4">
              {question.questionText || 'Thank you!'}
            </h1>
            {question.helpText && (
              <p className="text-lg text-muted-foreground mb-8">{question.helpText}</p>
            )}
          </div>
          {question.defaultValue && (
            <button className="px-8 py-4 bg-primary text-primary-foreground rounded-lg font-semibold text-lg hover:bg-primary/90 transition-colors">
              {question.placeholder || 'Continue'}
            </button>
          )}
          {question.showOtherOption === 'Yes' && (
            <div className="flex items-center justify-center gap-4 mt-6">
              <span className="text-sm text-muted-foreground">Share:</span>
              <div className="flex gap-2">
                <button className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center">f</button>
                <button className="w-8 h-8 bg-sky-500 text-white rounded-full flex items-center justify-center">t</button>
                <button className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center">w</button>
              </div>
            </div>
          )}
        </div>
      );
    }

    return (
      <div key={index} className="mb-6 p-4 bg-card border border-border rounded-lg">
        <div className="mb-3">
          <label className="block text-base font-medium text-foreground">
            {question.questionText || `Question ${index + 1}`}
            {isRequired && <span className="text-red-500 ml-1">*</span>}
          </label>
          {question.helpText && (
            <p className="text-sm text-muted-foreground mt-1">{question.helpText}</p>
          )}
        </div>

        {/* Short Text */}
        {questionType === 'Short Text' && (
          <input
            type="text"
            placeholder={question.placeholder || 'Your answer...'}
            className="w-full px-4 py-2 border border-input rounded-md bg-background text-foreground"
            disabled
          />
        )}

        {/* Long Text */}
        {questionType === 'Long Text' && (
          <textarea
            placeholder={question.placeholder || 'Your answer...'}
            rows={4}
            className="w-full px-4 py-2 border border-input rounded-md bg-background text-foreground"
            disabled
          />
        )}

        {/* Multiple Choice */}
        {questionType === 'Multiple Choice' && question.options && (
          <div className="space-y-2">
            {question.options.map((option, optIdx) => (
              <label key={optIdx} className="flex items-center gap-3 p-3 border border-input rounded-md hover:bg-accent cursor-pointer">
                <input type="radio" name={`question-${index}`} className="h-4 w-4" disabled />
                <span className="text-foreground">{option.optionText}</span>
              </label>
            ))}
            {question.showOtherOption === 'Yes' && (
              <label className="flex items-center gap-3 p-3 border border-input rounded-md hover:bg-accent cursor-pointer">
                <input type="radio" name={`question-${index}`} className="h-4 w-4" disabled />
                <span className="text-foreground">Other</span>
              </label>
            )}
          </div>
        )}

        {/* Checkboxes */}
        {questionType === 'Checkboxes' && question.options && (
          <div className="space-y-2">
            {question.options.map((option, optIdx) => (
              <label key={optIdx} className="flex items-center gap-3 p-3 border border-input rounded-md hover:bg-accent cursor-pointer">
                <input type="checkbox" className="h-4 w-4" disabled />
                <span className="text-foreground">{option.optionText}</span>
              </label>
            ))}
            {question.showOtherOption === 'Yes' && (
              <label className="flex items-center gap-3 p-3 border border-input rounded-md hover:bg-accent cursor-pointer">
                <input type="checkbox" className="h-4 w-4" disabled />
                <span className="text-foreground">Other</span>
              </label>
            )}
          </div>
        )}

        {/* Dropdown */}
        {questionType === 'Dropdown' && question.options && (
          <select className="w-full px-4 py-2 border border-input rounded-md bg-background text-foreground" disabled>
            <option value="">Select an option...</option>
            {question.options.map((option, optIdx) => (
              <option key={optIdx} value={option.optionValue}>
                {option.optionText}
              </option>
            ))}
          </select>
        )}

        {/* Email */}
        {questionType === 'Email' && (
          <input
            type="email"
            placeholder={question.placeholder || 'email@example.com'}
            className="w-full px-4 py-2 border border-input rounded-md bg-background text-foreground"
            disabled
          />
        )}

        {/* Phone */}
        {questionType === 'Phone' && (
          <input
            type="tel"
            placeholder={question.placeholder || '+1 (555) 123-4567'}
            className="w-full px-4 py-2 border border-input rounded-md bg-background text-foreground"
            disabled
          />
        )}

        {/* Number */}
        {questionType === 'Number' && (
          <input
            type="number"
            placeholder={question.placeholder || '0'}
            min={question.minValue || undefined}
            max={question.maxValue || undefined}
            className="w-full px-4 py-2 border border-input rounded-md bg-background text-foreground"
            disabled
          />
        )}

        {/* Date */}
        {questionType === 'Date' && (
          <input
            type="date"
            className="w-full px-4 py-2 border border-input rounded-md bg-background text-foreground"
            disabled
          />
        )}

        {/* Time */}
        {questionType === 'Time' && (
          <input
            type="time"
            className="w-full px-4 py-2 border border-input rounded-md bg-background text-foreground"
            disabled
          />
        )}

        {/* URL */}
        {questionType === 'URL' && (
          <input
            type="url"
            placeholder={question.placeholder || 'https://example.com'}
            className="w-full px-4 py-2 border border-input rounded-md bg-background text-foreground"
            disabled
          />
        )}

        {/* File Upload */}
        {questionType === 'File Upload' && (
          <div className="border-2 border-dashed border-input rounded-md p-8 text-center">
            <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Click to upload or drag and drop</p>
            {question.allowedFileTypes && (
              <p className="text-xs text-muted-foreground mt-1">
                Allowed: {question.allowedFileTypes}
              </p>
            )}
            {question.maxFileSize && (
              <p className="text-xs text-muted-foreground">
                Max size: {question.maxFileSize}
              </p>
            )}
          </div>
        )}

        {/* Rating */}
        {questionType === 'Rating' && (
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((rating) => (
              <button
                key={rating}
                className="p-2 border border-input rounded-md hover:bg-accent"
                disabled
              >
                <Star className="h-6 w-6 text-yellow-500" />
              </button>
            ))}
          </div>
        )}

        {/* Linear Scale */}
        {questionType === 'Linear Scale' && (
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">{question.minValue || '1'}</span>
            <input
              type="range"
              min={question.minValue || '1'}
              max={question.maxValue || '10'}
              className="flex-1"
              disabled
            />
            <span className="text-sm text-muted-foreground">{question.maxValue || '10'}</span>
          </div>
        )}

        {/* Name */}
        {questionType === 'Name' && (
          <div className="grid grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="First name"
              className="w-full px-4 py-2 border border-input rounded-md bg-background text-foreground"
              disabled
            />
            <input
              type="text"
              placeholder="Last name"
              className="w-full px-4 py-2 border border-input rounded-md bg-background text-foreground"
              disabled
            />
          </div>
        )}

        {/* Address */}
        {questionType === 'Address' && (
          <div className="space-y-3">
            <input
              type="text"
              placeholder="Street address"
              className="w-full px-4 py-2 border border-input rounded-md bg-background text-foreground"
              disabled
            />
            <div className="grid grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="City"
                className="w-full px-4 py-2 border border-input rounded-md bg-background text-foreground"
                disabled
              />
              <input
                type="text"
                placeholder="State/Province"
                className="w-full px-4 py-2 border border-input rounded-md bg-background text-foreground"
                disabled
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="Zip/Postal code"
                className="w-full px-4 py-2 border border-input rounded-md bg-background text-foreground"
                disabled
              />
              <input
                type="text"
                placeholder="Country"
                className="w-full px-4 py-2 border border-input rounded-md bg-background text-foreground"
                disabled
              />
            </div>
          </div>
        )}
      </div>
    );
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

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            onClick={() => navigate('/admin/forms')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              {isEditMode ? 'Edit Form' : 'Create New Form'}
            </h1>
            <p className="text-muted-foreground mt-1">
              Build dynamic forms with drag-and-drop questions
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handlePreview} className="flex items-center gap-2">
            <Eye className="h-4 w-4" />
            Preview
          </Button>
          <Button
            onClick={handleSaveForm}
            disabled={saving}
            className="flex items-center gap-2"
          >
            <Save className="h-4 w-4" />
            {saving ? 'Saving...' : 'Save Form'}
          </Button>
        </div>
      </div>

      {/* Form Settings */}
      <Card>
        <CardContent className="p-6 space-y-4">
          <h2 className="text-xl font-semibold text-foreground mb-4">Form Settings</h2>

          <div className="grid grid-cols-2 gap-4">
            {/* Form Name */}
            <div className="col-span-2">
              <label className="block text-sm font-medium text-foreground mb-2">
                Form Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Course Feedback Survey"
                className="w-full px-4 py-2 border border-input rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            {/* Description */}
            <div className="col-span-2">
              <label className="block text-sm font-medium text-foreground mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Brief description of the form purpose"
                rows={2}
                className="w-full px-4 py-2 border border-input rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            {/* Type */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Type *</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full px-4 py-2 border border-input rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">Select a type...</option>
                {formTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>

            {/* Batch */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Batch *</label>
              <select
                value={formData.batch}
                onChange={(e) => handleBatchChange(e.target.value)}
                className="w-full px-4 py-2 border border-input rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">Select a batch...</option>
                <option value="All Batches">All Batches</option>
                {batches.map((batch) => (
                  <option key={batch} value={batch}>
                    {batch}
                  </option>
                ))}
              </select>
            </div>

            {/* Term */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Term (Optional)</label>
              <select
                value={formData.term}
                onChange={(e) => handleTermChange(e.target.value)}
                disabled={!formData.batch}
                className="w-full px-4 py-2 border border-input rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="">
                  {formData.batch ? 'Select a term...' : 'Select batch first...'}
                </option>
                {getAvailableTerms().map((term) => (
                  <option key={term} value={term}>
                    {term}
                  </option>
                ))}
              </select>
            </div>

            {/* Domain */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Domain (Optional)
              </label>
              <select
                value={formData.domain}
                onChange={(e) => handleDomainChange(e.target.value)}
                disabled={!formData.batch || !formData.term}
                className="w-full px-4 py-2 border border-input rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="">
                  {!formData.batch || !formData.term
                    ? 'Select batch and term first...'
                    : 'Select a domain...'}
                </option>
                {getAvailableDomains().map((domain) => (
                  <option key={domain} value={domain}>
                    {domain}
                  </option>
                ))}
              </select>
            </div>

            {/* Subject */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Subject (Optional)
              </label>
              <select
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                disabled={!formData.batch || !formData.term || !formData.domain}
                className="w-full px-4 py-2 border border-input rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="">
                  {!formData.batch || !formData.term || !formData.domain
                    ? 'Select batch, term and domain first...'
                    : 'Select a subject...'}
                </option>
                {getAvailableSubjects().map((subject) => (
                  <option key={subject} value={subject}>
                    {subject}
                  </option>
                ))}
              </select>
            </div>

            {/* Start Date & Time */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Start Date & Time *
              </label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  className="w-full px-4 py-2 border border-input rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <input
                  type="time"
                  value={formData.startTime}
                  onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                  className="w-full px-4 py-2 border border-input rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>

            {/* End Date & Time */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                End Date & Time *
              </label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  className="w-full px-4 py-2 border border-input rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <input
                  type="time"
                  value={formData.endTime}
                  onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                  className="w-full px-4 py-2 border border-input rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>

            {/* Max Responses Per User */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Max Responses Per User
              </label>
              <input
                type="number"
                min="1"
                value={formData.maxResponsesPerUser}
                onChange={(e) => setFormData({ ...formData, maxResponsesPerUser: parseInt(e.target.value) || 1 })}
                className="w-full px-4 py-2 border border-input rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            {/* Confirmation Message */}
            <div className="col-span-2">
              <label className="block text-sm font-medium text-foreground mb-2">
                Confirmation Message
              </label>
              <textarea
                value={formData.confirmationMessage}
                onChange={(e) =>
                  setFormData({ ...formData, confirmationMessage: e.target.value })
                }
                placeholder="Message shown after submission"
                rows={2}
                className="w-full px-4 py-2 border border-input rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          {/* Toggles */}
          <div className="space-y-3 pt-4 border-t border-border">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="w-5 h-5 text-primary focus:ring-primary border-input rounded"
              />
              <div>
                <span className="text-sm font-medium text-foreground">Active</span>
                <p className="text-xs text-muted-foreground">
                  Make this form visible to students
                </p>
              </div>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.showAtStartUntilFilled}
                onChange={(e) =>
                  setFormData({ ...formData, showAtStartUntilFilled: e.target.checked })
                }
                className="w-5 h-5 text-primary focus:ring-primary border-input rounded"
              />
              <div>
                <span className="text-sm font-medium text-foreground">
                  Required at Startup
                </span>
                <p className="text-xs text-muted-foreground">
                  Block portal access until this form is filled
                </p>
              </div>
            </label>


            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.allowStudentViewResponse}
                onChange={(e) =>
                  setFormData({ ...formData, allowStudentViewResponse: e.target.checked })
                }
                className="w-5 h-5 text-primary focus:ring-primary border-input rounded"
              />
              <div>
                <span className="text-sm font-medium text-foreground">
                  Allow Student to View Response
                </span>
                <p className="text-xs text-muted-foreground">
                  Students can view their submitted responses
                </p>
              </div>
            </label>

            {/* Restrict to Specific Students */}
            <div className="pt-4 border-t border-border space-y-3">
              <div className="flex items-start gap-3">
                <Mail className="h-5 w-5 text-primary mt-0.5" />
                <div className="flex-1 space-y-3">
                  <div>
                    <h4 className="text-sm font-semibold text-foreground">
                      Restrict to Specific Students (Optional)
                    </h4>
                    <p className="text-xs text-muted-foreground mt-1">
                      Leave empty to show to all students in selected Batch. Add emails to restrict visibility.
                    </p>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-2 block">
                      Student Emails (one per line or comma-separated)
                    </label>
                    <textarea
                      value={formData.visibleTo}
                      onChange={(e) => setFormData({ ...formData, visibleTo: e.target.value })}
                      placeholder="student1@example.com&#10;student2@example.com&#10;student3@example.com"
                      rows={4}
                      className="w-full px-3 py-2 text-sm border border-input rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-y font-mono"
                    />
                    <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      Students must match both Batch and email to see this form
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Typeform-Style Questions Section */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-foreground">Build Your Form</h2>

        {/* Three-Column Typeform Layout */}
        <div className="flex gap-0 border border-border rounded-lg overflow-hidden bg-background" style={{ minHeight: 'calc(100vh - 400px)', maxHeight: '800px' }}>

          {/* LEFT SIDEBAR - Question Navigation */}
          <div className="w-20 bg-muted/30 border-r border-border flex flex-col items-center py-4 gap-2 overflow-y-auto">
            {questions.map((question, index) => {
              const isScreen = question.questionType === 'Start Screen' || question.questionType === 'End Screen';
              return (
                <button
                  key={index}
                  draggable={!isScreen}
                  onDragStart={() => handleDragStart(index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDragEnd={handleDragEnd}
                  onClick={() => setActiveQuestionIndex(index)}
                  className={`
                    w-12 h-12 rounded-lg flex items-center justify-center text-sm font-semibold transition-all
                    ${isScreen ? 'cursor-default' : 'cursor-move'}
                    ${activeQuestionIndex === index
                      ? 'bg-primary text-primary-foreground shadow-md scale-110'
                      : 'bg-background text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                    }
                    ${draggedQuestionIndex === index ? 'opacity-50' : 'opacity-100'}
                  `}
                  title={
                    isScreen
                      ? `${question.questionText || question.questionType} (Fixed position)`
                      : `${question.questionText || `Question ${index + 1}`} (Drag to reorder)`
                  }
                >
                  {index + 1}
                </button>
              );
            })}

            {/* Add Question Button */}
            <button
              onClick={() => setShowQuestionTypes(!showQuestionTypes)}
              className="w-12 h-12 rounded-lg flex items-center justify-center bg-primary/10 text-primary hover:bg-primary/20 transition-all border-2 border-dashed border-primary/30 hover:border-primary"
              title="Add question"
            >
              <Plus className="h-5 w-5" />
            </button>
          </div>

          {/* CENTER AREA - Single Question Editor */}
          <div className="flex-1 flex flex-col bg-background overflow-hidden">
            {questions.length === 0 ? (
              /* Empty State */
              <div className="flex-1 flex items-center justify-center p-12">
                <div className="text-center max-w-lg">
                  <FileText className="h-24 w-24 text-muted-foreground mx-auto mb-6" />
                  <h3 className="text-3xl font-bold text-foreground mb-4">Start building your form</h3>
                  <p className="text-lg text-muted-foreground mb-8">
                    Choose a question type from the right sidebar to add your first question
                  </p>
                  <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <Plus className="h-4 w-4 text-primary" />
                      </div>
                      <span>Click + on the left</span>
                    </div>
                    <span>or</span>
                    <div className="flex items-center gap-1">
                      <span>Select type on the right →</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* Active Question Editor */
              (() => {
                const question = questions[activeQuestionIndex];
                if (!question) return null;
                const QuestionIcon = QUESTION_TYPES.find((t) => t.value === question.questionType)?.icon || FileText;

                return (
                  <div className="flex-1 flex flex-col overflow-y-auto">
                    {/* Question Header */}
                    <div className="border-b border-border p-6 bg-muted/20">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                            {activeQuestionIndex + 1}
                          </div>
                          <Badge variant="outline" className="flex items-center gap-1">
                            <QuestionIcon className="h-3 w-3" />
                            {question.questionType}
                          </Badge>
                          {question.isRequired === 'Yes' && (
                            <Badge className="bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300">
                              Required
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDuplicateQuestion(activeQuestionIndex)}
                            title="Duplicate"
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteQuestion(activeQuestionIndex)}
                            className="text-red-600 hover:text-red-700"
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* Question Content */}
                    <div className="flex-1 p-12">
                      <div className="max-w-3xl space-y-8">
                        {/* Question Text with Formatting Toolbar */}
                        <div className="relative group">
                          {/* Formatting Toolbar */}
                          <div className="flex items-center gap-1 mb-3 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity">
                            <button
                              type="button"
                              onClick={() => {
                                const textarea = document.querySelector(`textarea[data-question-id="${activeQuestionIndex}"]`) as HTMLTextAreaElement;
                                if (textarea) {
                                  const start = textarea.selectionStart;
                                  const end = textarea.selectionEnd;
                                  const selectedText = question.questionText.substring(start, end);
                                  const newText = question.questionText.substring(0, start) + `**${selectedText}**` + question.questionText.substring(end);
                                  handleUpdateQuestion(activeQuestionIndex, { questionText: newText });
                                }
                              }}
                              className="p-1.5 rounded hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
                              title="Bold"
                            >
                              <Bold className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                const textarea = document.querySelector(`textarea[data-question-id="${activeQuestionIndex}"]`) as HTMLTextAreaElement;
                                if (textarea) {
                                  const start = textarea.selectionStart;
                                  const end = textarea.selectionEnd;
                                  const selectedText = question.questionText.substring(start, end);
                                  const newText = question.questionText.substring(0, start) + `*${selectedText}*` + question.questionText.substring(end);
                                  handleUpdateQuestion(activeQuestionIndex, { questionText: newText });
                                }
                              }}
                              className="p-1.5 rounded hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
                              title="Italic"
                            >
                              <Italic className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                const textarea = document.querySelector(`textarea[data-question-id="${activeQuestionIndex}"]`) as HTMLTextAreaElement;
                                if (textarea) {
                                  const start = textarea.selectionStart;
                                  const end = textarea.selectionEnd;
                                  const selectedText = question.questionText.substring(start, end);
                                  const newText = question.questionText.substring(0, start) + `<u>${selectedText}</u>` + question.questionText.substring(end);
                                  handleUpdateQuestion(activeQuestionIndex, { questionText: newText });
                                }
                              }}
                              className="p-1.5 rounded hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
                              title="Underline"
                            >
                              <Underline className="h-4 w-4" />
                            </button>
                            <div className="w-px h-5 bg-border mx-1"></div>
                            <button
                              type="button"
                              onClick={() => {
                                const textarea = document.querySelector(`textarea[data-question-id="${activeQuestionIndex}"]`) as HTMLTextAreaElement;
                                if (textarea) {
                                  const start = textarea.selectionStart;
                                  const end = textarea.selectionEnd;
                                  const selectedText = question.questionText.substring(start, end);
                                  const newText = question.questionText.substring(0, start) + `<mark>${selectedText}</mark>` + question.questionText.substring(end);
                                  handleUpdateQuestion(activeQuestionIndex, { questionText: newText });
                                }
                              }}
                              className="p-1.5 rounded hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
                              title="Highlight"
                            >
                              <Highlighter className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                const textarea = document.querySelector(`textarea[data-question-id="${activeQuestionIndex}"]`) as HTMLTextAreaElement;
                                if (textarea) {
                                  const start = textarea.selectionStart;
                                  const end = textarea.selectionEnd;
                                  const selectedText = question.questionText.substring(start, end);
                                  const color = prompt('Enter color (e.g., red, #ff0000):');
                                  if (color) {
                                    const newText = question.questionText.substring(0, start) + `<span style="color:${color}">${selectedText}</span>` + question.questionText.substring(end);
                                    handleUpdateQuestion(activeQuestionIndex, { questionText: newText });
                                  }
                                }
                              }}
                              className="p-1.5 rounded hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
                              title="Text Color"
                            >
                              <Palette className="h-4 w-4" />
                            </button>
                          </div>

                          <textarea
                            data-question-id={activeQuestionIndex}
                            value={question.questionText || ''}
                            onChange={(e) => handleUpdateQuestion(activeQuestionIndex, { questionText: e.target.value })}
                            placeholder={
                              question.questionType === 'Start Screen'
                                ? 'Welcome! Enter your welcome message title...'
                                : question.questionType === 'End Screen'
                                ? 'Thank you for completing this form!'
                                : question.questionType === 'Contact Info'
                                ? 'What is your contact information?'
                                : question.questionType === 'Email'
                                ? 'What is your email address?'
                                : question.questionType === 'Phone'
                                ? 'What is your phone number?'
                                : question.questionType === 'Address'
                                ? 'What is your address?'
                                : question.questionType === 'URL'
                                ? 'What is your website URL?'
                                : question.questionType === 'Multiple Choice'
                                ? 'Your question here. Choose one option...'
                                : question.questionType === 'Checkboxes'
                                ? 'Your question here. Select all that apply...'
                                : question.questionType === 'Dropdown'
                                ? 'Your question here. Select from dropdown...'
                                : question.questionType === 'Yes/No'
                                ? 'Your yes/no question here...'
                                : question.questionType === 'Rating'
                                ? 'How would you rate...?'
                                : question.questionType === 'Linear Scale'
                                ? 'Rate from 1 to 10...'
                                : question.questionType === 'Short Text'
                                ? 'Your short answer question here...'
                                : question.questionType === 'Long Text'
                                ? 'Your long answer question here...'
                                : question.questionType === 'Number'
                                ? 'Your numeric question here...'
                                : question.questionType === 'Date'
                                ? 'When is...?'
                                : question.questionType === 'File Upload'
                                ? 'Please upload your file...'
                                : 'Your question here. Recall information with @'
                            }
                            rows={2}
                            className="w-full text-3xl font-semibold border-none bg-transparent focus:outline-none focus:ring-0 text-foreground placeholder:text-muted-foreground/50 px-0 resize-none overflow-hidden"
                            style={{ minHeight: '4rem' }}
                            onInput={(e) => {
                              const target = e.target as HTMLTextAreaElement;
                              target.style.height = 'auto';
                              target.style.height = target.scrollHeight + 'px';
                            }}
                          />
                        </div>

                        {/* Description */}
                        <div>
                          <textarea
                            value={question.helpText || ''}
                            onChange={(e) => handleUpdateQuestion(activeQuestionIndex, { helpText: e.target.value })}
                            placeholder={
                              question.questionType === 'Start Screen'
                                ? 'Add a subtitle or brief description of your form...'
                                : question.questionType === 'End Screen'
                                ? 'Add any final message or instructions...'
                                : 'Description (optional)'
                            }
                            rows={1}
                            className="w-full text-lg border-none bg-transparent focus:outline-none focus:ring-0 text-muted-foreground placeholder:text-muted-foreground/50 italic px-0 resize-none overflow-hidden"
                            onInput={(e) => {
                              const target = e.target as HTMLTextAreaElement;
                              target.style.height = 'auto';
                              target.style.height = target.scrollHeight + 'px';
                            }}
                          />
                        </div>

                        {/* Question-Type Specific Fields */}

                        {/* Start Screen Configuration */}
                        {question.questionType === 'Start Screen' && (
                          <div className="space-y-6 mt-10">
                            <div className="p-6 bg-primary/5 border border-primary/20 rounded-lg">
                              <h4 className="text-sm font-semibold text-foreground mb-4">Start Screen Preview</h4>
                              <div className="space-y-4">
                                <div>
                                  <label className="block text-xs font-medium text-muted-foreground mb-2">
                                    Button Text
                                  </label>
                                  <input
                                    type="text"
                                    value={question.placeholder || 'Start'}
                                    onChange={(e) => handleUpdateQuestion(activeQuestionIndex, { placeholder: e.target.value })}
                                    placeholder="e.g., Get Started, Begin Survey"
                                    className="w-full px-4 py-3 text-base border border-input rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs font-medium text-muted-foreground mb-2">
                                    Background Color (optional)
                                  </label>
                                  <input
                                    type="text"
                                    value={question.defaultValue || ''}
                                    onChange={(e) => handleUpdateQuestion(activeQuestionIndex, { defaultValue: e.target.value })}
                                    placeholder="e.g., #6366f1, blue, gradient"
                                    className="w-full px-4 py-3 text-base border border-input rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                                  />
                                </div>
                              </div>
                            </div>
                            <div className="text-xs text-muted-foreground italic">
                              This screen will be shown at the beginning of your form. Use the question text as the title and description as the subtitle.
                            </div>
                          </div>
                        )}

                        {/* End Screen Configuration */}
                        {question.questionType === 'End Screen' && (
                          <div className="space-y-6 mt-10">
                            <div className="p-6 bg-green-500/5 border border-green-500/20 rounded-lg">
                              <h4 className="text-sm font-semibold text-foreground mb-4">End Screen Preview</h4>
                              <div className="space-y-4">
                                <div>
                                  <label className="block text-xs font-medium text-muted-foreground mb-2">
                                    Redirect URL (optional)
                                  </label>
                                  <input
                                    type="text"
                                    value={question.defaultValue || ''}
                                    onChange={(e) => handleUpdateQuestion(activeQuestionIndex, { defaultValue: e.target.value })}
                                    placeholder="https://example.com/thank-you"
                                    className="w-full px-4 py-3 text-base border border-input rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs font-medium text-muted-foreground mb-2">
                                    Button Text (if redirect is set)
                                  </label>
                                  <input
                                    type="text"
                                    value={question.placeholder || 'Continue'}
                                    onChange={(e) => handleUpdateQuestion(activeQuestionIndex, { placeholder: e.target.value })}
                                    placeholder="e.g., Go to Dashboard, Visit Website"
                                    className="w-full px-4 py-3 text-base border border-input rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                                  />
                                </div>
                                <label className="flex items-center gap-3 cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={question.showOtherOption === 'Yes'}
                                    onChange={(e) =>
                                      handleUpdateQuestion(activeQuestionIndex, {
                                        showOtherOption: e.target.checked ? 'Yes' : 'No',
                                      })
                                    }
                                    className="w-4 h-4 text-primary focus:ring-primary border-input rounded"
                                  />
                                  <span className="text-xs font-medium text-foreground">
                                    Show social sharing options
                                  </span>
                                </label>
                              </div>
                            </div>
                            <div className="text-xs text-muted-foreground italic">
                              This screen will be shown after form submission. Use the question text as the main message and description for additional details.
                            </div>
                          </div>
                        )}

                        {/* Yes/No Custom UI */}
                        {question.questionType === 'Yes/No' && (
                          <div className="space-y-4 mt-10">
                            <div className="p-6 bg-muted/30 rounded-lg">
                              <h4 className="text-sm font-semibold text-foreground mb-4">Preview</h4>
                              <div className="flex gap-3">
                                <button
                                  type="button"
                                  className="flex-1 px-6 py-4 text-lg font-medium border-2 border-primary bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-colors"
                                >
                                  {question.options?.[0]?.optionText || 'Yes'}
                                </button>
                                <button
                                  type="button"
                                  className="flex-1 px-6 py-4 text-lg font-medium border-2 border-border bg-background text-foreground rounded-lg hover:bg-muted/50 transition-colors"
                                >
                                  {question.options?.[1]?.optionText || 'No'}
                                </button>
                              </div>
                            </div>
                            <div className="space-y-3">
                              <label className="block text-sm font-medium text-foreground">Customize Options (optional)</label>
                              <div className="space-y-2">
                                <input
                                  type="text"
                                  value={question.options?.[0]?.optionText || 'Yes'}
                                  onChange={(e) =>
                                    handleUpdateOption(activeQuestionIndex, 0, {
                                      optionText: e.target.value,
                                      optionValue: 'yes',
                                    })
                                  }
                                  placeholder="First option (e.g., Yes, Agree, True)"
                                  className="w-full px-4 py-3 text-base border border-input rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                                />
                                <input
                                  type="text"
                                  value={question.options?.[1]?.optionText || 'No'}
                                  onChange={(e) =>
                                    handleUpdateOption(activeQuestionIndex, 1, {
                                      optionText: e.target.value,
                                      optionValue: 'no',
                                    })
                                  }
                                  placeholder="Second option (e.g., No, Disagree, False)"
                                  className="w-full px-4 py-3 text-base border border-input rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                                />
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Dropdown with Text Input UI */}
                        {question.questionType === 'Dropdown' && (
                          <div className="space-y-4 mt-10">
                            <div className="p-6 bg-muted/30 rounded-lg">
                              <h4 className="text-sm font-semibold text-foreground mb-4">Preview</h4>
                              <select className="w-full px-4 py-3 text-base border border-input rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary">
                                <option>Select an option...</option>
                                {question.options?.map((option, idx) => (
                                  <option key={idx}>{option.optionText || `Option ${idx + 1}`}</option>
                                ))}
                              </select>
                            </div>
                            <div className="space-y-3">
                              <label className="block text-sm font-medium text-foreground">Options</label>
                              <div className="flex flex-wrap gap-2 mb-3">
                                {question.options?.map((option, optIndex) => (
                                  <div
                                    key={optIndex}
                                    className="inline-flex items-center gap-2 px-3 py-2 bg-primary/10 text-primary border border-primary/20 rounded-lg"
                                  >
                                    <span className="text-sm font-medium">{option.optionText || `Option ${optIndex + 1}`}</span>
                                    {question.options && question.options.length > 1 && (
                                      <button
                                        type="button"
                                        onClick={() => handleDeleteOption(activeQuestionIndex, optIndex)}
                                        className="hover:text-red-600 transition-colors"
                                      >
                                        <X className="h-3 w-3" />
                                      </button>
                                    )}
                                  </div>
                                ))}
                              </div>
                              <div className="flex gap-2">
                                <input
                                  type="text"
                                  id={`dropdown-input-${activeQuestionIndex}`}
                                  placeholder="Type an option and press Enter"
                                  className="flex-1 px-4 py-3 text-base border border-input rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                                      e.preventDefault();
                                      const newOption = e.currentTarget.value.trim();
                                      const currentOptions = question.options || [];
                                      handleUpdateQuestion(activeQuestionIndex, {
                                        options: [
                                          ...currentOptions,
                                          {
                                            optionText: newOption,
                                            optionValue: newOption,
                                            order: currentOptions.length + 1,
                                          },
                                        ],
                                      });
                                      e.currentTarget.value = '';
                                    }
                                  }}
                                />
                                <Button
                                  type="button"
                                  variant="outline"
                                  onClick={() => {
                                    const input = document.getElementById(`dropdown-input-${activeQuestionIndex}`) as HTMLInputElement;
                                    if (input && input.value.trim()) {
                                      const newOption = input.value.trim();
                                      const currentOptions = question.options || [];
                                      handleUpdateQuestion(activeQuestionIndex, {
                                        options: [
                                          ...currentOptions,
                                          {
                                            optionText: newOption,
                                            optionValue: newOption,
                                            order: currentOptions.length + 1,
                                          },
                                        ],
                                      });
                                      input.value = '';
                                    }
                                  }}
                                >
                                  <Plus className="h-4 w-4" />
                                </Button>
                              </div>
                              <p className="text-xs text-muted-foreground">Press Enter or click + to add each option</p>
                            </div>

                          </div>
                        )}

                        {/* Multiple Choice & Checkboxes - Keep existing UI */}
                        {(question.questionType === 'Multiple Choice' ||
                          question.questionType === 'Checkboxes') && (
                          <div className="space-y-4 mt-10">
                            {question.options?.map((option, optIndex) => (
                              <div key={optIndex} className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded border-2 border-border flex items-center justify-center text-sm font-semibold text-muted-foreground bg-muted/50">
                                  {String.fromCharCode(65 + optIndex)}
                                </div>
                                <input
                                  type="text"
                                  value={option.optionText}
                                  onChange={(e) =>
                                    handleUpdateOption(activeQuestionIndex, optIndex, {
                                      optionText: e.target.value,
                                      optionValue: e.target.value,
                                    })
                                  }
                                  placeholder={`Option ${optIndex + 1}`}
                                  className="flex-1 px-5 py-4 text-lg border border-input rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                                />
                                {question.options && question.options.length > 1 && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleDeleteOption(activeQuestionIndex, optIndex)}
                                    className="text-red-600 hover:text-red-700"
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                )}
                              </div>
                            ))}
                            <button
                              onClick={() => handleAddOption(activeQuestionIndex)}
                              className="text-sm text-primary hover:underline flex items-center gap-1"
                            >
                              <Plus className="h-4 w-4" />
                              Add choice
                            </button>
                          </div>
                        )}

                        {/* Choice Options Configuration - Works for all choice types */}
                        {(question.questionType === 'Multiple Choice' ||
                          question.questionType === 'Checkboxes' ||
                          question.questionType === 'Dropdown') &&
                          (() => {
                            const choiceType = question.questionType as 'Multiple Choice' | 'Checkboxes' | 'Dropdown';
                            return (
                              <div className="mt-6 pt-6 border-t border-border space-y-4">
                                {/* Multiple Selection Toggle (for Multiple Choice only) */}
                                {choiceType === 'Multiple Choice' && (
                                <div className="flex items-center justify-between">
                                  <label className="text-sm font-medium text-foreground">Allow Multiple Selections</label>
                                  <input
                                    type="checkbox"
                                    checked={question.allowMultipleSelections === 'Yes'}
                                    onChange={(e) =>
                                      handleUpdateQuestion(activeQuestionIndex, {
                                        allowMultipleSelections: e.target.checked ? 'Yes' : 'No',
                                      })
                                    }
                                    className="w-5 h-5 rounded border-input text-primary focus:ring-primary"
                                  />
                                </div>
                              )}

                              {/* Randomize Options Toggle */}
                              <div className="flex items-center justify-between">
                                <label className="text-sm font-medium text-foreground">Randomize Options</label>
                                <input
                                  type="checkbox"
                                  checked={question.randomizeOptions === 'Yes'}
                                  onChange={(e) =>
                                    handleUpdateQuestion(activeQuestionIndex, {
                                      randomizeOptions: e.target.checked ? 'Yes' : 'No',
                                    })
                                  }
                                  className="w-5 h-5 rounded border-input text-primary focus:ring-primary"
                                />
                              </div>

                              {/* Show Other Option Toggle */}
                              <div className="flex items-center justify-between">
                                <label className="text-sm font-medium text-foreground">Show "Other" Option</label>
                                <input
                                  type="checkbox"
                                  checked={question.showOtherOption === 'Yes'}
                                  onChange={(e) =>
                                    handleUpdateQuestion(activeQuestionIndex, {
                                      showOtherOption: e.target.checked ? 'Yes' : 'No',
                                    })
                                  }
                                  className="w-5 h-5 rounded border-input text-primary focus:ring-primary"
                                />
                              </div>

                              {/* Selection Limit (for Multiple Choice with multiple selections or Checkboxes) */}
                              {(choiceType === 'Checkboxes' ||
                                (choiceType === 'Multiple Choice' && question.allowMultipleSelections === 'Yes')) && (
                                <div className="space-y-3">
                                  <label className="text-sm font-medium text-foreground block">Selection Limit</label>
                                  <div className="space-y-2">
                                    <label className="flex items-center gap-2">
                                      <input
                                        type="radio"
                                        name={`selectionLimit-${activeQuestionIndex}`}
                                        checked={question.selectionLimitType === 'unlimited'}
                                        onChange={() =>
                                          handleUpdateQuestion(activeQuestionIndex, {
                                            selectionLimitType: 'unlimited',
                                          })
                                        }
                                        className="w-4 h-4 text-primary focus:ring-primary"
                                      />
                                      <span className="text-sm text-foreground">Unlimited</span>
                                    </label>
                                    <label className="flex items-center gap-2">
                                      <input
                                        type="radio"
                                        name={`selectionLimit-${activeQuestionIndex}`}
                                        checked={question.selectionLimitType === 'exact'}
                                        onChange={() =>
                                          handleUpdateQuestion(activeQuestionIndex, {
                                            selectionLimitType: 'exact',
                                          })
                                        }
                                        className="w-4 h-4 text-primary focus:ring-primary"
                                      />
                                      <span className="text-sm text-foreground">Exact number:</span>
                                      {question.selectionLimitType === 'exact' && (
                                        <input
                                          type="number"
                                          min="1"
                                          value={question.maxSelections || '1'}
                                          onChange={(e) =>
                                            handleUpdateQuestion(activeQuestionIndex, {
                                              maxSelections: e.target.value,
                                            })
                                          }
                                          className="w-20 px-2 py-1 text-sm border border-input rounded bg-background"
                                        />
                                      )}
                                    </label>
                                    <label className="flex items-center gap-2">
                                      <input
                                        type="radio"
                                        name={`selectionLimit-${activeQuestionIndex}`}
                                        checked={question.selectionLimitType === 'range'}
                                        onChange={() =>
                                          handleUpdateQuestion(activeQuestionIndex, {
                                            selectionLimitType: 'range',
                                          })
                                        }
                                        className="w-4 h-4 text-primary focus:ring-primary"
                                      />
                                      <span className="text-sm text-foreground">Range:</span>
                                      {question.selectionLimitType === 'range' && (
                                        <div className="flex items-center gap-2">
                                          <input
                                            type="number"
                                            min="1"
                                            value={question.minSelections || '1'}
                                            onChange={(e) =>
                                              handleUpdateQuestion(activeQuestionIndex, {
                                                minSelections: e.target.value,
                                              })
                                            }
                                            placeholder="Min"
                                            className="w-20 px-2 py-1 text-sm border border-input rounded bg-background"
                                          />
                                          <span className="text-sm text-muted-foreground">to</span>
                                          <input
                                            type="number"
                                            min={question.minSelections || '1'}
                                            value={question.maxSelections || ''}
                                            onChange={(e) =>
                                              handleUpdateQuestion(activeQuestionIndex, {
                                                maxSelections: e.target.value,
                                              })
                                            }
                                            placeholder="Max"
                                            className="w-20 px-2 py-1 text-sm border border-input rounded bg-background"
                                          />
                                        </div>
                                      )}
                                    </label>
                                  </div>
                                </div>
                              )}
                            </div>
                        );
                          })()}

                        {/* Placeholder for text inputs */}
                        {['Short Text', 'Long Text', 'Email', 'URL', 'Number'].includes(question.questionType) && (
                          <div className="mt-10">
                            <input
                              type="text"
                              value={question.placeholder || ''}
                              onChange={(e) => handleUpdateQuestion(activeQuestionIndex, { placeholder: e.target.value })}
                              placeholder={
                                question.questionType === 'Short Text'
                                  ? 'e.g., Enter your name'
                                  : question.questionType === 'Long Text'
                                  ? 'e.g., Share your thoughts...'
                                  : question.questionType === 'Email'
                                  ? 'e.g., your.email@example.com'
                                  : question.questionType === 'URL'
                                  ? 'e.g., https://yourwebsite.com'
                                  : question.questionType === 'Number'
                                  ? 'e.g., Enter a number'
                                  : 'Placeholder text'
                              }
                              className="w-full px-5 py-4 text-lg border border-input rounded-lg bg-muted/30 text-muted-foreground italic focus:outline-none focus:ring-2 focus:ring-primary"
                            />
                          </div>
                        )}

                        {/* ==================== COMPREHENSIVE CONFIGURATION PANELS ==================== */}

                        {/* Contact Info Configuration */}
                        {question.questionType === 'Contact Info' && (
                          <div className="mt-10 p-6 bg-muted/30 rounded-lg space-y-4">
                            <h4 className="text-sm font-semibold text-foreground mb-4">Collect Information</h4>
                            <div className="space-y-3">
                              {[
                                { key: 'collectName', label: 'Name' },
                                { key: 'collectEmail', label: 'Email' },
                                { key: 'collectPhone', label: 'Phone Number' },
                                { key: 'collectAddress', label: 'Address' },
                              ].map((field) => (
                                <label key={field.key} className="flex items-center justify-between">
                                  <span className="text-sm text-foreground">{field.label}</span>
                                  <input
                                    type="checkbox"
                                    checked={question[field.key as keyof QuestionData] === 'Yes'}
                                    onChange={(e) =>
                                      handleUpdateQuestion(activeQuestionIndex, {
                                        [field.key]: e.target.checked ? 'Yes' : 'No',
                                      })
                                    }
                                    className="w-5 h-5 rounded border-input text-primary focus:ring-primary"
                                  />
                                </label>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Picture Choice - Option Text and Image Upload */}
                        {question.questionType === 'Picture Choice' && question.options && (
                          <div className="space-y-6 mt-10">
                            {/* Option Inputs */}
                            {question.options.map((option, optIndex) => (
                              <div key={optIndex} className="p-4 border border-border rounded-lg space-y-3 bg-muted/20">
                                <div className="flex items-center justify-between">
                                  <h4 className="text-sm font-semibold text-foreground">
                                    Option {String.fromCharCode(65 + optIndex)}
                                  </h4>
                                  {question.options && question.options.length > 1 && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleDeleteOption(activeQuestionIndex, optIndex)}
                                      className="text-red-600 hover:text-red-700"
                                    >
                                      <X className="h-4 w-4" />
                                    </Button>
                                  )}
                                </div>

                                {/* Option Text */}
                                <div className="space-y-1">
                                  <label className="text-xs text-muted-foreground">Option Text</label>
                                  <input
                                    type="text"
                                    placeholder={`Option ${optIndex + 1} text`}
                                    value={option.optionText || ''}
                                    onChange={(e) => {
                                      const updated = [...questions];
                                      updated[activeQuestionIndex].options![optIndex].optionText = e.target.value;
                                      updated[activeQuestionIndex].options![optIndex].optionValue = e.target.value;
                                      setQuestions(updated);
                                    }}
                                    className="w-full px-3 py-2 text-sm border border-input rounded bg-background focus:ring-2 focus:ring-primary"
                                  />
                                </div>

                                {/* Image URL */}
                                <div className="space-y-1">
                                  <label className="text-xs text-muted-foreground">Image URL</label>
                                  <input
                                    type="url"
                                    placeholder="https://example.com/image.jpg"
                                    value={option.imageUrl || ''}
                                    onChange={(e) => {
                                      const updated = [...questions];
                                      updated[activeQuestionIndex].options![optIndex].imageUrl = e.target.value;
                                      setQuestions(updated);
                                    }}
                                    className="w-full px-3 py-2 text-sm border border-input rounded bg-background focus:ring-2 focus:ring-primary"
                                  />
                                </div>

                                {/* Image Preview */}
                                {option.imageUrl && (
                                  <div className="mt-2">
                                    <img
                                      src={option.imageUrl}
                                      alt={`Option ${String.fromCharCode(65 + optIndex)} preview`}
                                      className="max-w-full h-32 object-cover rounded border border-border"
                                      onError={(e) => {
                                        (e.target as HTMLImageElement).style.display = 'none';
                                      }}
                                    />
                                  </div>
                                )}
                              </div>
                            ))}

                            {/* Add Option Button */}
                            <button
                              onClick={() => handleAddOption(activeQuestionIndex)}
                              className="text-sm text-primary hover:underline flex items-center gap-1"
                            >
                              <Plus className="h-4 w-4" />
                              Add image option
                            </button>
                          </div>
                        )}

                        {/* Rating Configuration */}
                        {question.questionType === 'Rating' && (
                          <div className="mt-10 p-6 bg-muted/30 rounded-lg space-y-4">
                            <h4 className="text-sm font-semibold text-foreground mb-4">Rating Configuration</h4>
                            <div className="space-y-4">
                              <div>
                                <label className="block text-sm text-foreground mb-2">Rating Type</label>
                                <select
                                  value={question.ratingType || 'star'}
                                  onChange={(e) =>
                                    handleUpdateQuestion(activeQuestionIndex, { ratingType: e.target.value })
                                  }
                                  className="w-full px-3 py-2 border border-input rounded bg-background focus:ring-2 focus:ring-primary"
                                >
                                  <option value="star">⭐ Stars</option>
                                  <option value="heart">❤️ Hearts</option>
                                  <option value="smiley">😊 Smileys</option>
                                </select>
                              </div>
                              <div>
                                <label className="block text-sm text-foreground mb-2">Scale (1 to...)</label>
                                <input
                                  type="number"
                                  min="3"
                                  max="10"
                                  value={question.ratingScale || '5'}
                                  onChange={(e) =>
                                    handleUpdateQuestion(activeQuestionIndex, { ratingScale: e.target.value })
                                  }
                                  className="w-full px-3 py-2 border border-input rounded bg-background focus:ring-2 focus:ring-primary"
                                />
                              </div>
                            </div>
                          </div>
                        )}

                        {/* NPS Configuration */}
                        {question.questionType === 'NPS' && (
                          <div className="mt-10 p-6 bg-muted/30 rounded-lg space-y-4">
                            <h4 className="text-sm font-semibold text-foreground mb-4">Net Promoter Score (0-10)</h4>
                            <div className="space-y-4">
                              <div>
                                <label className="block text-sm text-foreground mb-2">Minimum Label (0)</label>
                                <input
                                  type="text"
                                  placeholder="Not likely at all"
                                  value={question.scaleMinLabel || ''}
                                  onChange={(e) =>
                                    handleUpdateQuestion(activeQuestionIndex, { scaleMinLabel: e.target.value })
                                  }
                                  className="w-full px-3 py-2 border border-input rounded bg-background focus:ring-2 focus:ring-primary"
                                />
                              </div>
                              <div>
                                <label className="block text-sm text-foreground mb-2">Maximum Label (10)</label>
                                <input
                                  type="text"
                                  placeholder="Extremely likely"
                                  value={question.scaleMaxLabel || ''}
                                  onChange={(e) =>
                                    handleUpdateQuestion(activeQuestionIndex, { scaleMaxLabel: e.target.value })
                                  }
                                  className="w-full px-3 py-2 border border-input rounded bg-background focus:ring-2 focus:ring-primary"
                                />
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Opinion Scale Configuration */}
                        {question.questionType === 'Opinion Scale' && (
                          <div className="mt-10 p-6 bg-muted/30 rounded-lg space-y-4">
                            <h4 className="text-sm font-semibold text-foreground mb-4">Opinion Scale</h4>
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label className="block text-sm text-foreground mb-2">Start Value</label>
                                <input
                                  type="number"
                                  value={question.scaleMin || '1'}
                                  onChange={(e) =>
                                    handleUpdateQuestion(activeQuestionIndex, { scaleMin: e.target.value })
                                  }
                                  className="w-full px-3 py-2 border border-input rounded bg-background focus:ring-2 focus:ring-primary"
                                />
                              </div>
                              <div>
                                <label className="block text-sm text-foreground mb-2">End Value</label>
                                <input
                                  type="number"
                                  value={question.scaleMax || '5'}
                                  onChange={(e) =>
                                    handleUpdateQuestion(activeQuestionIndex, { scaleMax: e.target.value })
                                  }
                                  className="w-full px-3 py-2 border border-input rounded bg-background focus:ring-2 focus:ring-primary"
                                />
                              </div>
                            </div>
                            <div className="space-y-2">
                              <input
                                type="text"
                                placeholder="Start label (optional)"
                                value={question.scaleMinLabel || ''}
                                onChange={(e) =>
                                  handleUpdateQuestion(activeQuestionIndex, { scaleMinLabel: e.target.value })
                                }
                                className="w-full px-3 py-2 text-sm border border-input rounded bg-background focus:ring-2 focus:ring-primary"
                              />
                              <input
                                type="text"
                                placeholder="Middle label (optional)"
                                value={question.scaleMidLabel || ''}
                                onChange={(e) =>
                                  handleUpdateQuestion(activeQuestionIndex, { scaleMidLabel: e.target.value })
                                }
                                className="w-full px-3 py-2 text-sm border border-input rounded bg-background focus:ring-2 focus:ring-primary"
                              />
                              <input
                                type="text"
                                placeholder="End label (optional)"
                                value={question.scaleMaxLabel || ''}
                                onChange={(e) =>
                                  handleUpdateQuestion(activeQuestionIndex, { scaleMaxLabel: e.target.value })
                                }
                                className="w-full px-3 py-2 text-sm border border-input rounded bg-background focus:ring-2 focus:ring-primary"
                              />
                            </div>
                          </div>
                        )}

                        {/* Group Selection Configuration */}
                        {question.questionType === 'Group Selection' && (
                          <div className="mt-10 p-6 bg-muted/30 rounded-lg space-y-4">
                            <h4 className="text-sm font-semibold text-foreground mb-4">Group Selection Configuration</h4>
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label className="block text-sm text-foreground mb-2">Minimum Group Size</label>
                                <input
                                  type="number"
                                  min="1"
                                  value={question.minGroupSize || 3}
                                  onChange={(e) =>
                                    handleUpdateQuestion(activeQuestionIndex, { minGroupSize: Number(e.target.value) })
                                  }
                                  className="w-full px-3 py-2 border border-input rounded bg-background focus:ring-2 focus:ring-primary"
                                />
                              </div>
                              <div>
                                <label className="block text-sm text-foreground mb-2">Maximum Group Size</label>
                                <input
                                  type="number"
                                  min={question.minGroupSize || 1}
                                  value={question.maxGroupSize || 5}
                                  onChange={(e) =>
                                    handleUpdateQuestion(activeQuestionIndex, { maxGroupSize: Number(e.target.value) })
                                  }
                                  className="w-full px-3 py-2 border border-input rounded bg-background focus:ring-2 focus:ring-primary"
                                />
                              </div>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              Students will select {question.minGroupSize || 3}-{question.maxGroupSize || 5} group members (including themselves)
                            </p>

                            {/* Student List */}
                            <div className="border-t border-border pt-4 mt-4">
                              <label className="flex items-center gap-2 mb-3 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={question.restrictStudents === 'Yes'}
                                  onChange={(e) =>
                                    handleUpdateQuestion(activeQuestionIndex, {
                                      restrictStudents: e.target.checked ? 'Yes' : 'No',
                                      eligibleStudents: e.target.checked ? question.eligibleStudents || '' : undefined
                                    })
                                  }
                                  className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                                />
                                <span className="text-sm font-medium text-foreground">Enter Student List</span>
                              </label>

                              {question.restrictStudents === 'Yes' && (
                                <div className="mt-3 space-y-2">
                                  <textarea
                                    value={question.eligibleStudents || ''}
                                    onChange={(e) =>
                                      handleUpdateQuestion(activeQuestionIndex, {
                                        eligibleStudents: e.target.value
                                      })
                                    }
                                    placeholder="Enter student names (one per line or comma-separated)&#10;e.g., John Doe, Jane Smith&#10;or&#10;John Doe&#10;Jane Smith"
                                    className="w-full min-h-[120px] p-3 bg-background border border-border rounded-lg text-sm font-mono resize-y focus:ring-2 focus:ring-primary focus:border-transparent"
                                  />
                                  <p className="text-xs text-muted-foreground">
                                    Enter student names separated by commas or one per line. Only these students will be eligible to form groups.
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Matrix Configuration */}
                        {question.questionType === 'Matrix' && (
                          <div className="mt-10 p-6 bg-muted/30 rounded-lg space-y-4">
                            <h4 className="text-sm font-semibold text-foreground mb-4">Matrix Configuration</h4>
                            <div>
                              <label className="block text-sm text-foreground mb-2">Answer Type</label>
                              <select
                                value={question.matrixType || 'single'}
                                onChange={(e) =>
                                  handleUpdateQuestion(activeQuestionIndex, { matrixType: e.target.value })
                                }
                                className="w-full px-3 py-2 border border-input rounded bg-background focus:ring-2 focus:ring-primary"
                              >
                                <option value="single">Single answer per row</option>
                                <option value="multiple">Multiple answers per row</option>
                              </select>
                            </div>
                            <div className="text-xs text-muted-foreground mt-2">
                              Configure rows and columns in the matrix editor (coming soon)
                            </div>
                          </div>
                        )}

                        {/* Date Configuration */}
                        {question.questionType === 'Date' && (
                          <div className="mt-10 p-6 bg-muted/30 rounded-lg space-y-4">
                            <h4 className="text-sm font-semibold text-foreground mb-4">Date Configuration</h4>
                            <div>
                              <label className="block text-sm text-foreground mb-2">Date Format</label>
                              <select
                                value={question.dateFormat || 'MM/DD/YYYY'}
                                onChange={(e) =>
                                  handleUpdateQuestion(activeQuestionIndex, { dateFormat: e.target.value })
                                }
                                className="w-full px-3 py-2 border border-input rounded bg-background focus:ring-2 focus:ring-primary"
                              >
                                <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                                <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                                <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                              </select>
                            </div>
                            <div className="space-y-2">
                              <label className="flex items-center justify-between">
                                <span className="text-sm text-foreground">Restrict past dates</span>
                                <input
                                  type="checkbox"
                                  checked={question.restrictPast === 'Yes'}
                                  onChange={(e) =>
                                    handleUpdateQuestion(activeQuestionIndex, {
                                      restrictPast: e.target.checked ? 'Yes' : 'No',
                                    })
                                  }
                                  className="w-5 h-5 rounded border-input text-primary focus:ring-primary"
                                />
                              </label>
                              <label className="flex items-center justify-between">
                                <span className="text-sm text-foreground">Restrict future dates</span>
                                <input
                                  type="checkbox"
                                  checked={question.restrictFuture === 'Yes'}
                                  onChange={(e) =>
                                    handleUpdateQuestion(activeQuestionIndex, {
                                      restrictFuture: e.target.checked ? 'Yes' : 'No',
                                    })
                                  }
                                  className="w-5 h-5 rounded border-input text-primary focus:ring-primary"
                                />
                              </label>
                            </div>
                          </div>
                        )}

                        {/* Video and Audio Configuration */}
                        {question.questionType === 'Video and Audio' && (
                          <div className="mt-10 p-6 bg-muted/30 rounded-lg space-y-4">
                            <h4 className="text-sm font-semibold text-foreground mb-4">Media Configuration</h4>
                            <div>
                              <label className="block text-sm text-foreground mb-2">Media Type</label>
                              <select
                                value={question.mediaType || 'video'}
                                onChange={(e) =>
                                  handleUpdateQuestion(activeQuestionIndex, { mediaType: e.target.value })
                                }
                                className="w-full px-3 py-2 border border-input rounded bg-background focus:ring-2 focus:ring-primary"
                              >
                                <option value="video">Video</option>
                                <option value="audio">Audio</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-sm text-foreground mb-2">Media URL or Embed Code</label>
                              <textarea
                                placeholder="https://youtube.com/watch?v=... or embed code"
                                value={question.mediaUrl || ''}
                                onChange={(e) =>
                                  handleUpdateQuestion(activeQuestionIndex, { mediaUrl: e.target.value })
                                }
                                rows={3}
                                className="w-full px-3 py-2 border border-input rounded bg-background focus:ring-2 focus:ring-primary"
                              />
                            </div>
                            <label className="flex items-center justify-between">
                              <span className="text-sm text-foreground">Autoplay</span>
                              <input
                                type="checkbox"
                                checked={question.autoplay === 'Yes'}
                                onChange={(e) =>
                                  handleUpdateQuestion(activeQuestionIndex, {
                                    autoplay: e.target.checked ? 'Yes' : 'No',
                                  })
                                }
                                className="w-5 h-5 rounded border-input text-primary focus:ring-primary"
                              />
                            </label>
                          </div>
                        )}

                        {/* Razorpay / Payment link Configuration */}
                        {question.questionType === 'Razorpay / Payment link' && (
                          <div className="mt-10 p-6 bg-muted/30 rounded-lg space-y-4">
                            <h4 className="text-sm font-semibold text-foreground mb-4">Razorpay / Payment link</h4>
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label className="block text-sm text-foreground mb-2">Amount</label>
                                <input
                                  type="number"
                                  step="0.01"
                                  placeholder="99.00"
                                  value={question.stripeAmount || ''}
                                  onChange={(e) =>
                                    handleUpdateQuestion(activeQuestionIndex, { stripeAmount: e.target.value })
                                  }
                                  className="w-full px-3 py-2 border border-input rounded bg-background focus:ring-2 focus:ring-primary"
                                />
                              </div>
                              <div>
                                <label className="block text-sm text-foreground mb-2">Currency</label>
                                <select
                                  value={question.stripeCurrency || 'USD'}
                                  onChange={(e) =>
                                    handleUpdateQuestion(activeQuestionIndex, { stripeCurrency: e.target.value })
                                  }
                                  className="w-full px-3 py-2 border border-input rounded bg-background focus:ring-2 focus:ring-primary"
                                >
                                  <option value="USD">USD ($)</option>
                                  <option value="EUR">EUR (€)</option>
                                  <option value="GBP">GBP (£)</option>
                                  <option value="INR">INR (₹)</option>
                                </select>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Calendly Configuration */}
                        {question.questionType === 'Calendly' && (
                          <div className="mt-10 p-6 bg-muted/30 rounded-lg space-y-4">
                            <h4 className="text-sm font-semibold text-foreground mb-4">Calendly Integration</h4>
                            <div>
                              <label className="block text-sm text-foreground mb-2">Calendly URL</label>
                              <input
                                type="url"
                                placeholder="https://calendly.com/your-link"
                                value={question.calendlyUrl || ''}
                                onChange={(e) =>
                                  handleUpdateQuestion(activeQuestionIndex, { calendlyUrl: e.target.value })
                                }
                                className="w-full px-3 py-2 border border-input rounded bg-background focus:ring-2 focus:ring-primary"
                              />
                            </div>
                          </div>
                        )}

                        {/* Google Drive Configuration */}
                        {question.questionType === 'Google Drive' && (
                          <div className="mt-10 p-6 bg-muted/30 rounded-lg space-y-4">
                            <h4 className="text-sm font-semibold text-foreground mb-4">Google Drive Link</h4>
                            <div>
                              <label className="block text-sm text-foreground mb-2">Link Type</label>
                              <select
                                value={question.driveType || 'file'}
                                onChange={(e) =>
                                  handleUpdateQuestion(activeQuestionIndex, { driveType: e.target.value })
                                }
                                className="w-full px-3 py-2 border border-input rounded bg-background focus:ring-2 focus:ring-primary"
                              >
                                <option value="file">File Link</option>
                                <option value="folder">Folder Link</option>
                              </select>
                            </div>
                          </div>
                        )}

                        {/* Redirect URL Configuration */}
                        {question.questionType === 'Redirect to URL' && (
                          <div className="mt-10 p-6 bg-muted/30 rounded-lg space-y-4">
                            <h4 className="text-sm font-semibold text-foreground mb-4">Redirect Configuration</h4>
                            <div>
                              <label className="block text-sm text-foreground mb-2">Redirect URL</label>
                              <input
                                type="url"
                                placeholder="https://example.com/thank-you"
                                value={question.redirectUrl || ''}
                                onChange={(e) =>
                                  handleUpdateQuestion(activeQuestionIndex, { redirectUrl: e.target.value })
                                }
                                className="w-full px-3 py-2 border border-input rounded bg-background focus:ring-2 focus:ring-primary"
                              />
                            </div>
                            <div>
                              <label className="block text-sm text-foreground mb-2">Delay (seconds)</label>
                              <input
                                type="number"
                                min="0"
                                max="10"
                                value={question.redirectDelay || '3'}
                                onChange={(e) =>
                                  handleUpdateQuestion(activeQuestionIndex, { redirectDelay: e.target.value })
                                }
                                className="w-full px-3 py-2 border border-input rounded bg-background focus:ring-2 focus:ring-primary"
                              />
                            </div>
                          </div>
                        )}

                        {/* Statement Configuration */}
                        {question.questionType === 'Statement' && (
                          <div className="mt-10 p-6 bg-muted/30 rounded-lg space-y-4">
                            <h4 className="text-sm font-semibold text-foreground mb-4">Statement Content</h4>
                            <div>
                              <label className="block text-sm text-foreground mb-2">Statement Text</label>
                              <textarea
                                placeholder="Enter your statement or instructions..."
                                value={question.statementContent || ''}
                                onChange={(e) =>
                                  handleUpdateQuestion(activeQuestionIndex, { statementContent: e.target.value })
                                }
                                rows={4}
                                className="w-full px-3 py-2 border border-input rounded bg-background focus:ring-2 focus:ring-primary"
                              />
                            </div>
                            <div>
                              <label className="block text-sm text-foreground mb-2">Optional Media URL</label>
                              <input
                                type="url"
                                placeholder="https://example.com/image.jpg"
                                value={question.mediaUrl || ''}
                                onChange={(e) =>
                                  handleUpdateQuestion(activeQuestionIndex, { mediaUrl: e.target.value })
                                }
                                className="w-full px-3 py-2 border border-input rounded bg-background focus:ring-2 focus:ring-primary"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Question Footer - Settings */}
                    <div className="border-t border-border p-6 bg-muted/20">
                      <div className="max-w-2xl mx-auto space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            {/* Don't show 'Required' checkbox for Start/End Screens */}
                            {!['Start Screen', 'End Screen'].includes(question.questionType) && (
                              <label className="flex items-center gap-3 cursor-pointer group">
                                <input
                                  type="checkbox"
                                  checked={question.isRequired === 'Yes'}
                                  onChange={(e) =>
                                    handleUpdateQuestion(activeQuestionIndex, {
                                      isRequired: e.target.checked ? 'Yes' : 'No',
                                    })
                                  }
                                  className="w-5 h-5 text-primary focus:ring-primary border-input rounded"
                                />
                                <span className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                                  Required
                                </span>
                              </label>
                            )}

                            {/* Logic Button */}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                handleUpdateQuestion(activeQuestionIndex, {
                                  hasConditionalLogic: !question.hasConditionalLogic,
                                });
                              }}
                              className="flex items-center gap-2"
                            >
                              <Workflow className="h-4 w-4" />
                              {question.hasConditionalLogic ? 'Hide Logic' : 'Add Logic'}
                            </Button>
                          </div>

                          {activeQuestionIndex > 0 && (
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setActiveQuestionIndex(activeQuestionIndex - 1)}
                              >
                                <ChevronUp className="h-4 w-4 mr-1" />
                                Previous
                              </Button>
                              {activeQuestionIndex < questions.length - 1 && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setActiveQuestionIndex(activeQuestionIndex + 1)}
                                >
                                  Next
                                  <ChevronDown className="h-4 w-4 ml-1" />
                                </Button>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Conditional Logic Section */}
                        {question.hasConditionalLogic && (
                          <div className="p-4 bg-background border border-border rounded-lg">
                            <div className="flex items-center justify-between mb-4">
                              <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                                <Workflow className="h-4 w-4" />
                                Conditional Logic
                              </h4>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleAddConditionalRule(activeQuestionIndex)}
                                className="text-xs"
                              >
                                <Plus className="h-3 w-3 mr-1" />
                                Add Rule
                              </Button>
                            </div>

                            <div className="space-y-3">
                              {question.conditionalRules && question.conditionalRules.length > 0 ? (
                                question.conditionalRules.map((rule, ruleIndex) => (
                                  <div key={ruleIndex} className="p-3 bg-muted/30 rounded-lg border border-border">
                                    <div className="flex items-start gap-2">
                                      <div className="flex-1 space-y-2">
                                        <div className="grid grid-cols-3 gap-2">
                                          {/* Select Question */}
                                          <select
                                            value={rule.questionIndex}
                                            onChange={(e) =>
                                              handleUpdateConditionalRule(activeQuestionIndex, ruleIndex, {
                                                questionIndex: Number(e.target.value),
                                              })
                                            }
                                            className="px-3 py-2 text-sm border border-input rounded-md bg-background text-foreground"
                                          >
                                            <option value={-1}>Select question...</option>
                                            {questions.slice(0, activeQuestionIndex).map((q, i) => (
                                              <option key={i} value={i}>
                                                Q{i + 1}: {q.questionText || `Question ${i + 1}`}
                                              </option>
                                            ))}
                                          </select>

                                          {/* Operator */}
                                          <select
                                            value={rule.operator}
                                            onChange={(e) =>
                                              handleUpdateConditionalRule(activeQuestionIndex, ruleIndex, {
                                                operator: e.target.value,
                                              })
                                            }
                                            className="px-3 py-2 text-sm border border-input rounded-md bg-background text-foreground"
                                          >
                                            <option value="equals">equals</option>
                                            <option value="not_equals">not equals</option>
                                            <option value="contains">contains</option>
                                            <option value="greater_than">greater than</option>
                                            <option value="less_than">less than</option>
                                          </select>

                                          {/* Value */}
                                          <input
                                            type="text"
                                            value={rule.value}
                                            onChange={(e) =>
                                              handleUpdateConditionalRule(activeQuestionIndex, ruleIndex, {
                                                value: e.target.value,
                                              })
                                            }
                                            placeholder="Value"
                                            className="px-3 py-2 text-sm border border-input rounded-md bg-background text-foreground"
                                          />
                                        </div>

                                        <p className="text-xs text-muted-foreground">
                                          Show this question only if the condition above is met
                                        </p>
                                      </div>

                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleDeleteConditionalRule(activeQuestionIndex, ruleIndex)}
                                        className="text-red-600 hover:text-red-700"
                                      >
                                        <X className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  </div>
                                ))
                              ) : (
                                <p className="text-sm text-muted-foreground text-center py-4">
                                  No rules yet. Click "Add Rule" to create a condition.
                                </p>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })()
            )}
          </div>

          {/* RIGHT SIDEBAR - Question Type Selector */}
          <div className="w-80 bg-muted/30 border-l border-border overflow-y-auto">
            <div className="p-4 border-b border-border sticky top-0 bg-muted/30 backdrop-blur-sm z-10">
              <h3 className="font-semibold text-foreground flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Question Types
              </h3>
              <p className="text-xs text-muted-foreground mt-1">Click to add a question</p>
            </div>

            <div className="p-4 space-y-6">
              {QUESTION_TYPE_CATEGORIES.map((category) => {
                const CategoryIcon = category.icon;
                return (
                  <div key={category.name}>
                    <div className="flex items-center gap-2 mb-3">
                      <CategoryIcon className="h-4 w-4 text-muted-foreground" />
                      <h4 className="text-sm font-semibold text-foreground">{category.name}</h4>
                    </div>
                    <div className="space-y-1">
                      {category.types.map((type) => {
                        const Icon = type.icon;

                        // Check if Start Screen or End Screen already exists
                        const hasStartScreen = questions.some(q => q.questionType === 'Start Screen');
                        const hasEndScreen = questions.some(q => q.questionType === 'End Screen');
                        const isDisabled =
                          (type.value === 'Start Screen' && hasStartScreen) ||
                          (type.value === 'End Screen' && hasEndScreen);

                        return (
                          <button
                            key={type.value}
                            onClick={() => {
                              if (!isDisabled) {
                                handleAddQuestion(type.value);
                                setShowQuestionTypes(false);
                              }
                            }}
                            disabled={isDisabled}
                            title={
                              isDisabled
                                ? `Only one ${type.label} allowed per form`
                                : type.description
                            }
                            className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors text-left group ${
                              isDisabled
                                ? 'opacity-50 cursor-not-allowed bg-muted/50'
                                : 'hover:bg-accent cursor-pointer'
                            }`}
                          >
                            <div className={`w-8 h-8 rounded flex items-center justify-center transition-colors ${
                              isDisabled
                                ? 'bg-muted'
                                : 'bg-background group-hover:bg-primary/10'
                            }`}>
                              <Icon className={`h-4 w-4 ${
                                isDisabled
                                  ? 'text-muted-foreground/50'
                                  : 'text-muted-foreground group-hover:text-primary'
                              }`} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className={`text-sm font-medium ${
                                isDisabled ? 'text-muted-foreground' : 'text-foreground'
                              }`}>
                                {type.label}
                                {isDisabled && (
                                  <span className="ml-2 text-xs">(Already added)</span>
                                )}
                              </div>
                              <div className="text-xs text-muted-foreground truncate">{type.description}</div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Save Button (Bottom) */}
      {questions.length > 0 && (
        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" onClick={handlePreview} className="flex items-center gap-2">
            <Eye className="h-4 w-4" />
            Preview
          </Button>
          <Button
            onClick={handleSaveForm}
            disabled={saving}
            className="flex items-center gap-2"
          >
            <Save className="h-4 w-4" />
            {saving ? 'Saving...' : 'Save Form'}
          </Button>
        </div>
      )}

      {/* Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-background border border-border rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-border bg-muted/30">
              <div>
                <h2 className="text-2xl font-bold text-foreground">{formData.name || 'Form Preview'}</h2>
                {formData.description && (
                  <p className="text-sm text-muted-foreground mt-1">{formData.description}</p>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowPreview(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            {/* Modal Body - Scrollable Questions */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="max-w-3xl mx-auto space-y-6">
                {questions.map((question, index) => renderPreviewQuestion(question, index))}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="border-t border-border p-6 bg-muted/30 flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {questions.length} question{questions.length !== 1 ? 's' : ''} in this form
              </p>
              <div className="flex items-center gap-2">
                <Button variant="outline" onClick={() => setShowPreview(false)}>
                  Close Preview
                </Button>
                <Button onClick={() => {
                  setShowPreview(false);
                  handleSaveForm();
                }} disabled={saving}>
                  <Save className="h-4 w-4 mr-2" />
                  {saving ? 'Saving...' : 'Save Form'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmation.show && deleteConfirmation.questionIndex !== null && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-background border border-border rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center flex-shrink-0">
                  <Trash2 className="h-6 w-6 text-red-600 dark:text-red-400" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-foreground mb-2">Delete Question?</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Are you sure you want to delete this question? This action cannot be undone.
                  </p>
                  <div className="flex items-center gap-3 justify-end">
                    <Button
                      variant="outline"
                      onClick={() => setDeleteConfirmation({ show: false, questionIndex: null })}
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => performDeleteQuestion(deleteConfirmation.questionIndex!)}
                      className="bg-red-600 hover:bg-red-700 text-white"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Question
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// MultiSelectStudents Component
// ============================================================================

interface MultiSelectStudentsProps {
  selectedStudents: string[];  // Array of student names (comma-separated can be parsed)
  formBatch?: string;
  onChange: (students: string[]) => void;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function _MultiSelectStudents({ selectedStudents, formBatch, onChange }: MultiSelectStudentsProps) {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadStudents();
  }, [formBatch]);

  async function loadStudents() {
    try {
      setLoading(true);
      const result = await getAllStudents();
      if (result.success && result.data) {
        let filteredStudents = result.data;

        // Filter by form batch if specified and not "All"
        if (formBatch && formBatch !== 'All' && formBatch !== '') {
          filteredStudents = filteredStudents.filter(s => s.batch === formBatch);
        }

        setStudents(filteredStudents);
      }
    } catch (error) {
      console.error('Error loading students:', error);
      toast.error('Failed to load students');
    } finally {
      setLoading(false);
    }
  }

  const handleToggleStudent = (studentName: string) => {
    if (selectedStudents.includes(studentName)) {
      onChange(selectedStudents.filter(name => name !== studentName));
    } else {
      onChange([...selectedStudents, studentName]);
    }
  };

  const handleSelectAll = () => {
    const filteredStudentNames = filteredStudents.map(s => s.name);
    onChange(filteredStudentNames);
  };

  const handleDeselectAll = () => {
    onChange([]);
  };

  const filteredStudents = students.filter(student =>
    student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="text-center py-4">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
        <p className="text-sm text-muted-foreground mt-2">Loading students...</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Search and Actions */}
      <div className="flex items-center gap-2">
        <input
          type="text"
          placeholder="Search students..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1 px-3 py-2 text-sm border border-input rounded bg-background focus:ring-2 focus:ring-primary"
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleSelectAll}
          className="text-xs"
        >
          Select All
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleDeselectAll}
          className="text-xs"
        >
          Clear
        </Button>
      </div>

      {/* Selected count */}
      <p className="text-xs text-muted-foreground">
        {selectedStudents.length} of {students.length} students selected
      </p>

      {/* Student list */}
      <div className="max-h-60 overflow-y-auto border border-input rounded-lg">
        {filteredStudents.length === 0 ? (
          <div className="p-4 text-center text-sm text-muted-foreground">
            {searchTerm ? 'No students found matching your search' : 'No students available'}
          </div>
        ) : (
          <div className="divide-y divide-border">
            {filteredStudents.map((student) => {
              const isSelected = selectedStudents.includes(student.name);

              return (
                <div
                  key={student.id}
                  onClick={() => handleToggleStudent(student.name)}
                  className={`
                    flex items-center gap-3 p-3 cursor-pointer hover:bg-muted/50 transition-colors
                    ${isSelected ? 'bg-primary/5' : ''}
                  `}
                >
                  <div className={`
                    w-4 h-4 rounded border-2 flex items-center justify-center transition-all flex-shrink-0
                    ${isSelected ? 'bg-primary border-primary' : 'bg-background border-input'}
                  `}>
                    {isSelected && <Check className="h-3 w-3 text-primary-foreground" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{student.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{student.email}</p>
                  </div>
                  {student.batch && (
                    <span className="text-xs bg-muted px-2 py-1 rounded text-muted-foreground flex-shrink-0">
                      {student.batch}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}


export default FormBuilderPage;
