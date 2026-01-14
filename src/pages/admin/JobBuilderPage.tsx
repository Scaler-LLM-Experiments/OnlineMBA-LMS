import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import {
  Save,
  ArrowLeft,
  Plus,
  Trash2,
  FileText,
  DollarSign,
  Calendar,
  HelpCircle,
  Settings,
  Upload,
  Check,
  X,
  Mail
} from 'lucide-react';
import { apiService } from '../../services/api';
import toast from 'react-hot-toast';
import { QuillEditor } from '../../components/QuillEditor';

// Indian cities list
const INDIAN_CITIES = [
  'Bangalore',
  'Delhi',
  'Gurgaon',
  'Hyderabad',
  'Chennai',
  'Mumbai',
  'Pune',
  'Noida',
  'Kolkata',
  'Ahmedabad',
  'Jaipur',
  'Chandigarh',
  'Kochi',
  'Indore',
  'Coimbatore',
  'Vadodara',
  'Lucknow',
  'Bhubaneswar',
  'Visakhapatnam',
  'Nagpur',
  'Surat',
  'Mysore',
  'Trivandrum',
  'Mangalore',
  'Nashik',
  'Rajkot',
  'Patna',
  'Ludhiana',
  'Agra',
  'Kanpur',
  'Remote'
];

const SOURCE_OPTIONS = ['SSB', 'Scaler', 'Adhiraj', 'Vidit', 'Others'];
const SOURCE_PERSON_OPTIONS = ['Anuj', 'Himanshu', 'Devangna', 'Priya', 'Amal', 'Amar', 'Parth'];

interface Question {
  number: number;
  text: string;
  type: string;
  options: string;
  required: string;
}

interface JobData {
  // Basic Info
  batch: string;
  type: string;
  placementType: string;
  source: string;
  sourcePerson: string;
  company: string;
  role: string;
  companyURL: string;
  location: string;
  workMode: string;
  eligibilityMonths: string;
  requiredSkills: string;
  roleTags: string;

  // Compensation
  ctcType: string;
  ctcValue: string;
  ctcValueSecondary: string;
  ctcDisplay: string;
  esopType: string;
  esopValue: string;
  esopValueSecondary: string;
  esopDisplay: string;
  bonusType: string;
  bonusValue: string;
  bonusValueSecondary: string;
  bonusDisplay: string;
  compensationDisplay: string;

  // PPO Details (for Internships)
  ppoOpportunity: string;
  ppoCTCRange: string;
  ppoIncludes: string;

  // JD & Instructions
  jdHTML: string;
  jdFileURL: string;
  applicationInstructions: string;

  // Admin URLs & Files
  adminURL1: string;
  adminURL2: string;
  adminURL3: string;
  adminURL4: string;
  adminURL5: string;
  fileAttachmentName1: string;
  fileAttachmentURL1: string;
  fileAttachmentName2: string;
  fileAttachmentURL2: string;
  fileAttachmentName3: string;
  fileAttachmentURL3: string;

  // Timeline
  applicationStartTime: string;
  applicationEndTime: string;

  // Questions
  questions: Question[];

  // Assignment
  hasAssignment: string;
  assignmentFileURL: string;
  assignmentDescription: string;
  assignmentDeadlineSameAsJob: string;
  assignmentDeadline: string;
  assignmentVisibility: string;

  // Eligibility
  showToBatchLevels: string;
  showToNoOfferStudents: string;
  showToStudentsWithOneFT_PPO: string;
  showToStudentsWithNoPPO: string;
  showToStudentsWithInternships: string;
  showToStudentsWithZeroOffers: string;
  customVisibilityRule: string;

  // Mail
  mailTo: string;
  mailCC: string;
  mailBCC: string;
  sendMail: string;

  // System
  status: string;
  createdBy: string;
}

export const JobBuilderPage: React.FC = () => {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const isEditMode = !!jobId;

  const [activeSection, setActiveSection] = useState('basic-info');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(isEditMode);
  const [batches, setBatches] = useState<string[]>([]);
  const [sourceOthersText, setSourceOthersText] = useState('');
  const [sourcePersonOthersText, setSourcePersonOthersText] = useState('');
  const [locationOthersText, setLocationOthersText] = useState('');
  const [pendingFileUploads, setPendingFileUploads] = useState<{[key: string]: File}>({});
  const [jdFile, setJdFile] = useState<File | null>(null);

  const [formData, setFormData] = useState<JobData>({
    batch: '',
    type: '',
    placementType: '',
    source: '',
    sourcePerson: '',
    company: '',
    role: '',
    companyURL: '',
    location: '',
    workMode: '',
    eligibilityMonths: '',
    requiredSkills: '',
    roleTags: '',
    ctcType: '',
    ctcValue: '',
    ctcValueSecondary: '',
    ctcDisplay: '',
    esopType: '',
    esopValue: '',
    esopValueSecondary: '',
    esopDisplay: '',
    bonusType: '',
    bonusValue: '',
    bonusValueSecondary: '',
    bonusDisplay: '',
    compensationDisplay: '',
    ppoOpportunity: '',
    ppoCTCRange: '',
    ppoIncludes: '',
    jdHTML: '',
    jdFileURL: '',
    applicationInstructions: '',
    adminURL1: '',
    adminURL2: '',
    adminURL3: '',
    adminURL4: '',
    adminURL5: '',
    fileAttachmentName1: '',
    fileAttachmentURL1: '',
    fileAttachmentName2: '',
    fileAttachmentURL2: '',
    fileAttachmentName3: '',
    fileAttachmentURL3: '',
    applicationStartTime: '',
    applicationEndTime: '',
    questions: [],
    hasAssignment: '',
    assignmentFileURL: '',
    assignmentDescription: '',
    assignmentDeadlineSameAsJob: '',
    assignmentDeadline: '',
    assignmentVisibility: '',
    showToBatchLevels: '',
    showToNoOfferStudents: '',
    showToStudentsWithOneFT_PPO: '',
    showToStudentsWithNoPPO: '',
    showToStudentsWithInternships: '',
    showToStudentsWithZeroOffers: '',
    customVisibilityRule: '',
    mailTo: '',
    mailCC: '',
    mailBCC: '',
    sendMail: 'Yes',
    status: 'Draft',
    createdBy: ''
  });

  useEffect(() => {
    fetchBatches();
    if (isEditMode) {
      fetchJob();
    }
  }, [jobId]);

  // Auto-generate Overall Compensation Display
  useEffect(() => {
    const parts = [];

    // Add CTC - use ctcDisplay if available, otherwise auto-generate from ctcType and ctcValue
    if (formData.ctcDisplay) {
      parts.push(formData.ctcDisplay);
    } else if (formData.ctcType && formData.ctcType !== 'None' && formData.ctcValue) {
      // Auto-generate CTC display based on type
      const ctcVal = parseFloat(formData.ctcValue);
      const ctcValUpper = formData.ctcValueSecondary ? parseFloat(formData.ctcValueSecondary) : null;

      if (formData.ctcType === 'Fixed') {
        parts.push(`${ctcVal} LPA`);
      } else if (formData.ctcType === 'Range' && ctcValUpper) {
        parts.push(`${ctcVal}-${ctcValUpper} LPA`);
      } else if (formData.ctcType === 'Upto') {
        parts.push(`Up to ${ctcVal} LPA`);
      } else if (formData.ctcType === 'MonthlyStipend') {
        // Format as monthly stipend (value is in thousands, e.g., 30 = ₹30K/month)
        if (ctcValUpper) {
          parts.push(`₹${ctcVal}K-${ctcValUpper}K/month`);
        } else {
          parts.push(`₹${ctcVal}K/month`);
        }
      }
    }

    // Add ESOP if available
    if (formData.esopType !== 'None' && formData.esopDisplay) {
      parts.push(formData.esopDisplay);
    }

    // Add Bonus if available
    if (formData.bonusType !== 'None' && formData.bonusDisplay) {
      parts.push(formData.bonusDisplay);
    }

    // Auto-generate compensation display
    if (parts.length > 0) {
      const autoGenerated = parts.join(' + ');
      // Always update - this field is auto-generated from the inputs above
      updateField('compensationDisplay', autoGenerated);
    } else {
      // Clear if no components are selected
      updateField('compensationDisplay', '');
    }
  }, [formData.ctcDisplay, formData.ctcType, formData.ctcValue, formData.ctcValueSecondary, formData.esopType, formData.esopDisplay, formData.bonusType, formData.bonusDisplay]);

  const fetchBatches = async () => {
    try {
      const result = await apiService.getBatches();
      if (result.success && result.data?.batches) {
        setBatches(result.data.batches);
      }
    } catch (error) {
      console.error('Error fetching batches:', error);
    }
  };

  const fetchJob = async () => {
    if (!jobId) return;

    try {
      setLoading(true);
      const result = await apiService.getJobPosting(jobId);

      if (result.success && result.data) {
        setFormData(result.data);
      } else {
        toast.error('Failed to load job');
        navigate('/admin/jobs');
      }
    } catch (error) {
      console.error('Error fetching job:', error);
      toast.error('Error loading job');
      navigate('/admin/jobs');
    } finally {
      setLoading(false);
    }
  };

  const updateField = (field: keyof JobData, value: string | boolean | string[] | Question[]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const addQuestion = () => {
    const newQuestion: Question = {
      number: formData.questions.length + 1,
      text: '',
      type: 'Text',
      options: '',
      required: 'No'
    };
    setFormData(prev => ({
      ...prev,
      questions: [...prev.questions, newQuestion]
    }));
  };

  const updateQuestion = (index: number, field: keyof Question, value: string) => {
    const updated = [...formData.questions];
    updated[index] = { ...updated[index], [field]: value };
    setFormData(prev => ({ ...prev, questions: updated }));
  };

  const removeQuestion = (index: number) => {
    const updated = formData.questions.filter((_, i) => i !== index);
    // Renumber questions
    updated.forEach((q, i) => {
      q.number = i + 1;
    });
    setFormData(prev => ({ ...prev, questions: updated }));
  };

  const handleFileSelect = (key: string, file: File | null) => {
    if (!file) return;

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error('File size must be less than 10MB');
      return;
    }

    // Stage the file
    setPendingFileUploads(prev => ({ ...prev, [key]: file }));
    toast.success(`${file.name} staged for upload`);
  };

  const handleJdFileSelect = (file: File | null) => {
    if (!file) return;

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error('File size must be less than 10MB');
      return;
    }

    setJdFile(file);
    toast.success(`${file.name} staged for upload`);
  };

  const removeFileStaging = (key: string) => {
    setPendingFileUploads(prev => {
      const updated = { ...prev };
      delete updated[key];
      return updated;
    });
  };

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setActiveSection(sectionId);
    }
  };

  const handleSave = async () => {
    // Validation
    if (!formData.company || !formData.role || !formData.batch) {
      toast.error('Please fill in Company, Role, and Batch');
      scrollToSection('basic-info');
      return;
    }

    // Check required fields - eligibilityMonths is only required for non-Internship types
    const missingFields = [];
    if (!formData.type) missingFields.push('Type');
    if (!formData.placementType) missingFields.push('Placement Type');
    if (!formData.source) missingFields.push('Source');
    if ((formData.source === 'SSB' || formData.source === 'Scaler') && !formData.sourcePerson) missingFields.push('Source Person Name');
    if (!formData.roleTags) missingFields.push('Role Tags');
    if (!formData.location) missingFields.push('Location');
    if (!formData.workMode) missingFields.push('Work Mode');
    if (formData.type !== 'Internship' && !formData.eligibilityMonths) missingFields.push('Eligibility');

    if (missingFields.length > 0) {
      toast.error(`Please fill in all required fields: ${missingFields.join(', ')}`);
      scrollToSection('basic-info');
      return;
    }

    if (!formData.applicationStartTime || !formData.applicationEndTime) {
      toast.error('Please set application start and end times');
      scrollToSection('timeline');
      return;
    }

    // Validate mail fields for new job postings
    if (!isEditMode && formData.sendMail === 'Yes') {
      if (!formData.mailTo || formData.mailTo.trim() === '') {
        toast.error('Please provide at least one email address in the To field');
        scrollToSection('mail');
        return;
      }
    }

    // Validate mail fields if sendMail is checked
    if (formData.sendMail === 'Yes' && (!formData.mailTo || formData.mailTo.trim() === '')) {
      toast.error('Please provide at least one email address in the To field');
      scrollToSection('mail');
      return;
    }

    try {
      setSaving(true);
      let currentJobId = jobId;
      let updatedFormData = { ...formData };

      // Step 1: Create/Update the job first (to get jobId if creating new)
      const result = isEditMode
        ? await apiService.updateJobPosting(jobId!, formData)
        : await apiService.createJobPosting(formData);

      if (!result.success) {
        toast.error(result.error || 'Failed to save job');
        return;
      }

      // Get the jobId (from creation or existing)
      if (!isEditMode && result.data && 'jobId' in result.data) {
        currentJobId = result.data.jobId;
      }

      // Step 2: Upload files if any are staged
      const hasFiles = jdFile || Object.keys(pendingFileUploads).length > 0;

      if (hasFiles && currentJobId) {
        toast.loading('Uploading files...', { id: 'file-upload' });

        // Upload JD file if present
        if (jdFile) {
          const jdUploadResult = await apiService.uploadJobFile(jdFile, currentJobId, 'jd');
          if (jdUploadResult.success && jdUploadResult.data?.fileUrl) {
            updatedFormData.jdFileURL = jdUploadResult.data.fileUrl;
          } else {
            toast.error('Failed to upload JD file', { id: 'file-upload' });
          }
        }

        // Upload attachment files
        for (const [key, file] of Object.entries(pendingFileUploads)) {
          const attachmentUploadResult = await apiService.uploadJobFile(file, currentJobId, 'attachment');
          if (attachmentUploadResult.success && attachmentUploadResult.data?.fileUrl) {
            // Map attachment1, attachment2, attachment3 to fileAttachmentURL1, etc.
            const attachmentNum = key.replace('attachment', '');
            const fieldName = `fileAttachmentURL${attachmentNum}` as 'fileAttachmentURL1' | 'fileAttachmentURL2' | 'fileAttachmentURL3';
            updatedFormData[fieldName] = attachmentUploadResult.data.fileUrl;
          } else {
            toast.error(`Failed to upload ${file.name}`, { id: 'file-upload' });
          }
        }

        toast.success('Files uploaded successfully!', { id: 'file-upload' });

        // Step 3: Update the job with file URLs
        const updateResult = await apiService.updateJobPosting(currentJobId, updatedFormData);
        if (!updateResult.success) {
          toast.error('Job saved but failed to update file URLs');
        }
      }

      toast.success(isEditMode ? 'Job updated successfully!' : 'Job created successfully!');
      navigate('/admin/jobs');

    } catch (error) {
      console.error('Error saving job:', error);
      toast.error('Error saving job');
    } finally {
      setSaving(false);
    }
  };

  const sections = [
    { id: 'basic-info', name: 'Basic Info', icon: FileText },
    { id: 'compensation', name: 'Compensation', icon: DollarSign },
    { id: 'jd-instructions', name: 'JD & Instructions', icon: FileText },
    { id: 'timeline', name: 'Timeline', icon: Calendar },
    { id: 'questions', name: 'Questions', icon: HelpCircle },
    { id: 'assignment', name: 'Assignment', icon: Upload },
    { id: 'eligibility', name: 'Eligibility', icon: Settings },
    { id: 'mail', name: 'Mail', icon: Mail }
  ];

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading job...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex overflow-hidden bg-background">
      {/* Sticky Sidebar Navigation */}
      <div className="w-64 flex-shrink-0 border-r border-border bg-card overflow-y-auto">
        <div className="p-6 space-y-2 sticky top-0 bg-card">
          <h3 className="text-sm font-semibold text-muted-foreground mb-4">SECTIONS</h3>
          {sections.map((section) => {
            const Icon = section.icon;
            return (
              <button
                key={section.id}
                onClick={() => scrollToSection(section.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-all ${
                  activeSection === section.id
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                }`}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                <span className="text-sm font-medium">{section.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Fixed Header */}
        <div className="flex-shrink-0 border-b border-border bg-card px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="outline" size="sm" onClick={() => navigate('/admin/jobs')}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-foreground">
                  {isEditMode ? 'Edit Job Posting' : 'Create Job Posting'}
                </h1>
                {isEditMode && <p className="text-sm text-muted-foreground mt-0.5">Job ID: {jobId}</p>}
              </div>
            </div>
            <Button onClick={handleSave} disabled={saving} className="gap-2">
              <Save className="w-4 h-4" />
              {saving ? 'Saving...' : 'Save Job'}
            </Button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-4xl mx-auto space-y-8">

          {/* Basic Info Section */}
          <Card id="basic-info" className="scroll-mt-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Basic Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="company">Company Name *</Label>
                  <Input
                    id="company"
                    value={formData.company}
                    onChange={(e) => updateField('company', e.target.value)}
                    placeholder="Scaler"
                  />
                </div>

                <div>
                  <Label htmlFor="role">Role *</Label>
                  <Input
                    id="role"
                    value={formData.role}
                    onChange={(e) => updateField('role', e.target.value)}
                    placeholder="e.g., Founders Office Intern"
                  />
                </div>

                <div>
                  <Label htmlFor="batch">Batch *</Label>
                  <select
                    id="batch"
                    value={formData.batch}
                    onChange={(e) => updateField('batch', e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg bg-background"
                  >
                    <option value="">Select Batch</option>
                    {batches.map(batch => (
                      <option key={batch} value={batch}>{batch}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <Label htmlFor="type">Type *</Label>
                  <select
                    id="type"
                    value={formData.type}
                    onChange={(e) => updateField('type', e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg bg-background"
                    required
                  >
                    <option value="">Select Type</option>
                    <option value="Internship">Internship</option>
                    <option value="Full-Time">Full-Time</option>
                    <option value="Contract">Contract</option>
                  </select>
                </div>

                <div>
                  <Label htmlFor="placementType">Placement Type *</Label>
                  <select
                    id="placementType"
                    value={formData.placementType}
                    onChange={(e) => updateField('placementType', e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg bg-background"
                    required
                  >
                    <option value="">Select Placement Type</option>
                    <option value="Dream Company">Dream Company</option>
                    <option value="Non-Dream Company">Non-Dream Company</option>
                  </select>
                </div>

                <div>
                  <Label htmlFor="source">Source *</Label>
                  <select
                    id="source"
                    value={SOURCE_OPTIONS.includes(formData.source) ? formData.source : (formData.source ? 'Others' : '')}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value === 'Others') {
                        // Keep 'Others' selected and clear the source field to trigger text input
                        setSourceOthersText('Others');
                        updateField('source', sourceOthersText === 'Others' ? '' : sourceOthersText);
                        updateField('sourcePerson', '');
                        setSourcePersonOthersText('');
                      } else if (value === '') {
                        updateField('source', '');
                        setSourceOthersText('');
                        updateField('sourcePerson', '');
                        setSourcePersonOthersText('');
                      } else {
                        updateField('source', value);
                        setSourceOthersText('');
                        // Clear source person when changing source
                        updateField('sourcePerson', '');
                        setSourcePersonOthersText('');
                      }
                    }}
                    className="w-full px-3 py-2 border rounded-lg bg-background"
                  >
                    <option value="">Select Source</option>
                    {SOURCE_OPTIONS.map(option => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                  {(sourceOthersText === 'Others' || (!SOURCE_OPTIONS.includes(formData.source) && formData.source && formData.source !== 'SSB' && formData.source !== 'Scaler')) && (
                    <Input
                      className="mt-2"
                      value={sourceOthersText === 'Others' ? '' : (sourceOthersText || formData.source)}
                      onChange={(e) => {
                        setSourceOthersText(e.target.value);
                        updateField('source', e.target.value);
                      }}
                      placeholder="Enter source name"
                    />
                  )}
                </div>

                {(formData.source === 'SSB' || formData.source === 'Scaler') && (
                  <div>
                    <Label htmlFor="sourcePerson">Source Person Name *</Label>
                    <select
                      id="sourcePerson"
                      value={SOURCE_PERSON_OPTIONS.includes(formData.sourcePerson) ? formData.sourcePerson : (formData.sourcePerson ? 'Others' : '')}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (value === 'Others') {
                          setSourcePersonOthersText('Others');
                          updateField('sourcePerson', sourcePersonOthersText === 'Others' ? '' : sourcePersonOthersText);
                        } else if (value === '') {
                          updateField('sourcePerson', '');
                          setSourcePersonOthersText('');
                        } else {
                          updateField('sourcePerson', value);
                          setSourcePersonOthersText('');
                        }
                      }}
                      className="w-full px-3 py-2 border rounded-lg bg-background"
                      required
                    >
                      <option value="">Select Person</option>
                      {SOURCE_PERSON_OPTIONS.map(option => (
                        <option key={option} value={option}>{option}</option>
                      ))}
                      <option value="Others">Others</option>
                    </select>
                    {(sourcePersonOthersText === 'Others' || (!SOURCE_PERSON_OPTIONS.includes(formData.sourcePerson) && formData.sourcePerson)) && (
                      <Input
                        className="mt-2"
                        value={sourcePersonOthersText === 'Others' ? '' : (sourcePersonOthersText || formData.sourcePerson)}
                        onChange={(e) => {
                          setSourcePersonOthersText(e.target.value);
                          updateField('sourcePerson', e.target.value);
                        }}
                        placeholder="Enter person name"
                        required
                      />
                    )}
                  </div>
                )}

                <div>
                  <Label htmlFor="roleTags">Role Tags *</Label>
                  <select
                    id="roleTags"
                    value={formData.roleTags}
                    onChange={(e) => updateField('roleTags', e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg bg-background"
                    required
                  >
                    <option value="">Select Role Tag</option>
                    <option value="Generalist - Founders Office / Strategy / Program / Project">Generalist - Founders Office / Strategy / Program / Project</option>
                    <option value="Product Roles">Product Roles</option>
                    <option value="Marketing Roles">Marketing Roles</option>
                    <option value="Consulting Roles">Consulting Roles</option>
                    <option value="Investment Roles">Investment Roles</option>
                    <option value="Sales Roles">Sales Roles</option>
                    <option value="HR Roles">HR Roles</option>
                  </select>
                </div>

                <div>
                  <Label htmlFor="companyURL">Company URL</Label>
                  <Input
                    id="companyURL"
                    value={formData.companyURL}
                    onChange={(e) => updateField('companyURL', e.target.value)}
                    placeholder="https://company.com"
                  />
                </div>

                <div>
                  <Label htmlFor="location">Location *</Label>
                  <select
                    id="location"
                    value={INDIAN_CITIES.includes(formData.location) ? formData.location : (formData.location ? 'Others' : '')}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value === 'Others') {
                        // Keep 'Others' selected and trigger text input
                        setLocationOthersText('Others');
                        updateField('location', locationOthersText === 'Others' ? '' : locationOthersText);
                      } else if (value === '') {
                        updateField('location', '');
                        setLocationOthersText('');
                      } else {
                        updateField('location', value);
                        setLocationOthersText('');
                      }
                    }}
                    className="w-full px-3 py-2 border rounded-lg bg-background"
                    required
                  >
                    <option value="">Select Location</option>
                    {INDIAN_CITIES.map(city => (
                      <option key={city} value={city}>{city}</option>
                    ))}
                    <option value="Others">Others</option>
                  </select>
                  {(locationOthersText === 'Others' || (!INDIAN_CITIES.includes(formData.location) && formData.location)) && (
                    <Input
                      className="mt-2"
                      value={locationOthersText === 'Others' ? '' : (locationOthersText || formData.location)}
                      onChange={(e) => {
                        setLocationOthersText(e.target.value);
                        updateField('location', e.target.value);
                      }}
                      placeholder="Enter city name"
                      required
                    />
                  )}
                </div>

                <div>
                  <Label htmlFor="workMode">Work Mode *</Label>
                  <select
                    id="workMode"
                    value={formData.workMode}
                    onChange={(e) => updateField('workMode', e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg bg-background"
                    required
                  >
                    <option value="">Select Work Mode</option>
                    <option value="Onsite">Onsite</option>
                    <option value="Remote">Remote</option>
                    <option value="Hybrid">Hybrid</option>
                  </select>
                </div>

                <div>
                  <Label htmlFor="eligibilityMonths">
                    Eligibility (Months of Experience){formData.type !== 'Internship' && ' *'}
                  </Label>
                  <Input
                    id="eligibilityMonths"
                    type="number"
                    value={formData.eligibilityMonths}
                    onChange={(e) => updateField('eligibilityMonths', e.target.value)}
                    placeholder="e.g., 12"
                    required={formData.type !== 'Internship'}
                  />
                </div>

                <div>
                  <Label htmlFor="status">Status</Label>
                  <select
                    id="status"
                    value={formData.status}
                    onChange={(e) => updateField('status', e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg bg-background"
                  >
                    <option value="Draft">Draft</option>
                    <option value="Active">Active</option>
                    <option value="Expired">Expired</option>
                    <option value="Archived">Archived</option>
                  </select>
                </div>
              </div>

              <div>
                <Label htmlFor="requiredSkills">Required Skills (comma separated)</Label>
                <Input
                  id="requiredSkills"
                  value={formData.requiredSkills}
                  onChange={(e) => updateField('requiredSkills', e.target.value)}
                  placeholder="e.g., SQL, GTM, Python"
                />
              </div>
            </CardContent>
          </Card>

          {/* Compensation Section */}
          <Card id="compensation" className="scroll-mt-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                Compensation
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* CTC Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">CTC Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="ctcType">CTC Type</Label>
                    <select
                      id="ctcType"
                      value={formData.ctcType}
                      onChange={(e) => updateField('ctcType', e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg bg-background"
                    >
                      <option value="">Select CTC Type</option>
                      <option value="Fixed">Fixed</option>
                      <option value="Range">Range</option>
                      <option value="Upto">Upto</option>
                      <option value="MonthlyStipend">Monthly Stipend</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div>
                    <Label htmlFor="ctcValue">
                      {formData.ctcType === 'MonthlyStipend' ? 'Stipend Value (in thousands)' : 'CTC Value (Lower/Fixed)'}
                    </Label>
                    <Input
                      id="ctcValue"
                      type="number"
                      value={formData.ctcValue}
                      onChange={(e) => updateField('ctcValue', e.target.value)}
                      placeholder={formData.ctcType === 'MonthlyStipend' ? 'e.g., 30 for ₹30K/month' : 'e.g., 12'}
                    />
                  </div>

                  {(formData.ctcType === 'Range' || formData.ctcType === 'MonthlyStipend') && (
                    <div>
                      <Label htmlFor="ctcValueSecondary">
                        {formData.ctcType === 'MonthlyStipend' ? 'Stipend Upper Value (Optional, in thousands)' : 'CTC Value (Upper)'}
                      </Label>
                      <Input
                        id="ctcValueSecondary"
                        type="number"
                        value={formData.ctcValueSecondary}
                        onChange={(e) => updateField('ctcValueSecondary', e.target.value)}
                        placeholder={formData.ctcType === 'MonthlyStipend' ? 'e.g., 40 for ₹30K-40K/month' : 'e.g., 13'}
                      />
                    </div>
                  )}

                  <div className="md:col-span-2">
                    <Label htmlFor="ctcDisplay">CTC Display Text</Label>
                    <Input
                      id="ctcDisplay"
                      value={formData.ctcDisplay}
                      onChange={(e) => updateField('ctcDisplay', e.target.value)}
                      placeholder="e.g., 12-13 LPA"
                    />
                  </div>
                </div>
              </div>

              {/* ESOP Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">ESOP Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="esopType">ESOP Type</Label>
                    <select
                      id="esopType"
                      value={formData.esopType}
                      onChange={(e) => updateField('esopType', e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg bg-background"
                    >
                      <option value="">Select ESOP Type</option>
                      <option value="None">None</option>
                      <option value="FixedValue">Fixed Value</option>
                      <option value="Percentage">Percentage</option>
                      <option value="TextDescription">Text Description</option>
                    </select>
                  </div>

                  {formData.esopType && formData.esopType !== 'None' && (
                    <>
                      <div>
                        <Label htmlFor="esopValue">ESOP Value</Label>
                        <Input
                          id="esopValue"
                          type="number"
                          value={formData.esopValue}
                          onChange={(e) => updateField('esopValue', e.target.value)}
                          placeholder="e.g., 500000"
                        />
                      </div>

                      <div>
                        <Label htmlFor="esopValueSecondary">ESOP Value (Upper)</Label>
                        <Input
                          id="esopValueSecondary"
                          type="number"
                          value={formData.esopValueSecondary}
                          onChange={(e) => updateField('esopValueSecondary', e.target.value)}
                          placeholder="Optional"
                        />
                      </div>

                      <div className="md:col-span-2">
                        <Label htmlFor="esopDisplay">ESOP Display Text</Label>
                        <select
                          id="esopDisplay"
                          value={formData.esopDisplay}
                          onChange={(e) => updateField('esopDisplay', e.target.value)}
                          className="w-full px-3 py-2 border rounded-lg bg-background"
                        >
                          <option value="">Select Display Option</option>
                          <option value="ESOPs">ESOPs</option>
                          <option value="ESOPs (based on interview performance)">ESOPs (based on interview performance)</option>
                        </select>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Bonus Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Bonus Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="bonusType">Bonus Type</Label>
                    <select
                      id="bonusType"
                      value={formData.bonusType}
                      onChange={(e) => updateField('bonusType', e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg bg-background"
                    >
                      <option value="">Select Bonus Type</option>
                      <option value="None">None</option>
                      <option value="FixedValue">Fixed Value</option>
                      <option value="Percentage">Percentage</option>
                      <option value="Range">Range</option>
                      <option value="TextDescription">Text Description</option>
                    </select>
                  </div>

                  {formData.bonusType && formData.bonusType !== 'None' && (
                    <>
                      <div>
                        <Label htmlFor="bonusValue">Bonus Value</Label>
                        <Input
                          id="bonusValue"
                          type="number"
                          value={formData.bonusValue}
                          onChange={(e) => updateField('bonusValue', e.target.value)}
                          placeholder="e.g., 200000"
                        />
                      </div>

                      <div>
                        <Label htmlFor="bonusValueSecondary">Bonus Value (Upper)</Label>
                        <Input
                          id="bonusValueSecondary"
                          type="number"
                          value={formData.bonusValueSecondary}
                          onChange={(e) => updateField('bonusValueSecondary', e.target.value)}
                          placeholder="Optional"
                        />
                      </div>

                      <div className="md:col-span-2">
                        <Label htmlFor="bonusDisplay">Bonus Display Text</Label>
                        <select
                          id="bonusDisplay"
                          value={formData.bonusDisplay}
                          onChange={(e) => updateField('bonusDisplay', e.target.value)}
                          className="w-full px-3 py-2 border rounded-lg bg-background"
                        >
                          <option value="">Select Display Option</option>
                          <option value="Bonus">Bonus</option>
                          <option value="Bonus (based on interview performance)">Bonus (based on interview performance)</option>
                        </select>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Overall Compensation Display */}
              <div>
                <Label htmlFor="compensationDisplay">Overall Compensation Display</Label>
                <Input
                  id="compensationDisplay"
                  value={formData.compensationDisplay}
                  onChange={(e) => updateField('compensationDisplay', e.target.value)}
                  placeholder="e.g., 12-13 LPA + ESOPs + ₹2L joining bonus"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  This will be shown to students. Leave blank to auto-generate.
                </p>
              </div>

              {/* PPO Section - Only for Internships */}
              {formData.type === 'Internship' && (
                <div className="space-y-4 pt-6 border-t">
                  <h3 className="text-lg font-semibold">PPO (Pre-Placement Offer) Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="ppoOpportunity">PPO Opportunity</Label>
                      <select
                        id="ppoOpportunity"
                        value={formData.ppoOpportunity}
                        onChange={(e) => updateField('ppoOpportunity', e.target.value)}
                        className="w-full px-3 py-2 border rounded-lg bg-background"
                      >
                        <option value="">Select PPO Opportunity</option>
                        <option value="No">No</option>
                        <option value="Yes">Yes</option>
                        <option value="Maybe">Maybe</option>
                      </select>
                    </div>

                    {(formData.ppoOpportunity === 'Yes' || formData.ppoOpportunity === 'Maybe') && (
                      <>
                        <div>
                          <Label htmlFor="ppoCTCRange">PPO CTC Range</Label>
                          <Input
                            id="ppoCTCRange"
                            value={formData.ppoCTCRange}
                            onChange={(e) => updateField('ppoCTCRange', e.target.value)}
                            placeholder="e.g., 12-15 LPA"
                          />
                          <p className="text-xs text-muted-foreground mt-1">
                            Expected CTC range if converted to full-time
                          </p>
                        </div>

                        <div className="md:col-span-2">
                          <Label htmlFor="ppoIncludes">PPO May Include (Select all that apply)</Label>
                          <div className="space-y-2 mt-2">
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={formData.ppoIncludes?.includes('ESOPs')}
                                onChange={(e) => {
                                  const includes = formData.ppoIncludes ? formData.ppoIncludes.split(', ') : [];
                                  if (e.target.checked) {
                                    includes.push('ESOPs');
                                  } else {
                                    const index = includes.indexOf('ESOPs');
                                    if (index > -1) includes.splice(index, 1);
                                  }
                                  updateField('ppoIncludes', includes.join(', '));
                                }}
                                className="w-4 h-4 rounded border-gray-300"
                              />
                              <span className="text-sm">ESOPs</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={formData.ppoIncludes?.includes('Joining Bonus')}
                                onChange={(e) => {
                                  const includes = formData.ppoIncludes ? formData.ppoIncludes.split(', ') : [];
                                  if (e.target.checked) {
                                    includes.push('Joining Bonus');
                                  } else {
                                    const index = includes.indexOf('Joining Bonus');
                                    if (index > -1) includes.splice(index, 1);
                                  }
                                  updateField('ppoIncludes', includes.join(', '));
                                }}
                                className="w-4 h-4 rounded border-gray-300"
                              />
                              <span className="text-sm">Joining Bonus</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={formData.ppoIncludes?.includes('Performance Bonus')}
                                onChange={(e) => {
                                  const includes = formData.ppoIncludes ? formData.ppoIncludes.split(', ') : [];
                                  if (e.target.checked) {
                                    includes.push('Performance Bonus');
                                  } else {
                                    const index = includes.indexOf('Performance Bonus');
                                    if (index > -1) includes.splice(index, 1);
                                  }
                                  updateField('ppoIncludes', includes.join(', '));
                                }}
                                className="w-4 h-4 rounded border-gray-300"
                              />
                              <span className="text-sm">Performance Bonus</span>
                            </label>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* JD & Instructions Section */}
          <Card id="jd-instructions" className="scroll-mt-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Job Description & Instructions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label htmlFor="jdHTML">Job Description</Label>
                <QuillEditor
                  value={formData.jdHTML}
                  onChange={(value) => updateField('jdHTML', value)}
                  placeholder="Enter job description with rich formatting..."
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Use the toolbar to format your job description with advanced formatting options.
                </p>
              </div>

              {/* JD File Upload */}
              <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-950/30 border-2 border-blue-200 dark:border-blue-800 shadow-lg">
                <Label htmlFor="jdFile" className="text-base font-semibold text-blue-900 dark:text-blue-100">
                  JD File Upload
                </Label>
                <div className="space-y-2 mt-2">
                  <Input
                    id="jdFile"
                    type="file"
                    accept="image/*,.pdf,.doc,.docx"
                    onChange={(e) => {
                      const file = e.target.files?.[0] || null;
                      handleJdFileSelect(file);
                    }}
                    className="cursor-pointer border-blue-300 dark:border-blue-700 focus:ring-blue-500"
                  />
                  {jdFile && (
                    <div className="flex items-center justify-between p-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-green-600 dark:text-green-400" />
                        <span className="text-sm text-green-700 dark:text-green-300">{jdFile.name}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setJdFile(null)}
                        className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                  <p className="text-xs text-blue-700 dark:text-blue-300">
                    Upload job description as PDF, Word document, or image (Max 10MB)
                  </p>
                </div>
              </div>

              <div>
                <Label htmlFor="applicationInstructions">Application Instructions</Label>
                <Textarea
                  id="applicationInstructions"
                  value={formData.applicationInstructions}
                  onChange={(e) => updateField('applicationInstructions', e.target.value)}
                  rows={5}
                  placeholder="Upload single PDF with resume..."
                />
              </div>

              {/* Admin URLs */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Admin Resource Links (Optional)</h3>
                {[1, 2, 3, 4, 5].map(num => (
                  <div key={num}>
                    <Label htmlFor={`adminURL${num}`}>Admin URL {num}</Label>
                    <Input
                      id={`adminURL${num}`}
                      value={formData[`adminURL${num}` as keyof JobData] as string}
                      onChange={(e) => updateField(`adminURL${num}` as keyof JobData, e.target.value)}
                      placeholder="https://..."
                    />
                  </div>
                ))}
              </div>

              {/* File Attachments */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">File Attachments (Optional)</h3>
                <p className="text-sm text-muted-foreground">Upload files to attach to this job posting. Files will be uploaded when you save.</p>
                {[1, 2, 3].map(num => (
                  <div key={num} className="space-y-2">
                    <Label htmlFor={`fileAttachment${num}`}>File Attachment {num}</Label>
                    <Input
                      id={`fileAttachment${num}`}
                      type="file"
                      accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0] || null;
                        if (file) {
                          handleFileSelect(`attachment${num}`, file);
                          // Auto-populate the name field with filename
                          updateField(`fileAttachmentName${num}` as keyof JobData, file.name);
                        }
                      }}
                      className="cursor-pointer"
                    />
                    {pendingFileUploads[`attachment${num}`] && (
                      <div className="flex items-center justify-between p-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                        <div className="flex items-center gap-2">
                          <Check className="w-4 h-4 text-green-600 dark:text-green-400" />
                          <span className="text-sm text-green-700 dark:text-green-300">
                            {pendingFileUploads[`attachment${num}`].name}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            removeFileStaging(`attachment${num}`);
                            updateField(`fileAttachmentName${num}` as keyof JobData, '');
                          }}
                          className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                    {/* Show existing URL if in edit mode and no pending upload */}
                    {!pendingFileUploads[`attachment${num}`] && formData[`fileAttachmentURL${num}` as keyof JobData] && (
                      <div className="p-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                        <a
                          href={formData[`fileAttachmentURL${num}` as keyof JobData] as string}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                        >
                          {(formData[`fileAttachmentName${num}` as keyof JobData] as string) || 'View existing file'}
                        </a>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Timeline Section */}
          <Card id="timeline" className="scroll-mt-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Application Timeline
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="applicationStartTime">Application Start Time *</Label>
                  <Input
                    id="applicationStartTime"
                    type="datetime-local"
                    value={formData.applicationStartTime}
                    onChange={(e) => updateField('applicationStartTime', e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="applicationEndTime">Application End Time *</Label>
                  <Input
                    id="applicationEndTime"
                    type="datetime-local"
                    value={formData.applicationEndTime}
                    onChange={(e) => updateField('applicationEndTime', e.target.value)}
                  />
                </div>
              </div>

              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  <strong>Note:</strong> Applications will be accepted between these times. The job will automatically appear to eligible students during this period.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Questions Section */}
          <Card id="questions" className="scroll-mt-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <HelpCircle className="w-5 h-5" />
                Application Questions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Application Questions (Max 30)</h3>
                <Button
                  onClick={addQuestion}
                  disabled={formData.questions.length >= 30}
                  size="sm"
                  className="gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Add Question
                </Button>
              </div>

              {formData.questions.length === 0 ? (
                <div className="text-center p-8 border-2 border-dashed rounded-lg">
                  <HelpCircle className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-20" />
                  <p className="text-muted-foreground mb-4">No questions added yet</p>
                  <Button onClick={addQuestion} size="sm">
                    <Plus className="w-4 h-4 mr-2" />
                    Add First Question
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {formData.questions.map((q, index) => (
                    <Card key={index}>
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-base">Question {q.number}</CardTitle>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeQuestion(index)}
                            className="text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div>
                          <Label>Question Text</Label>
                          <Input
                            value={q.text}
                            onChange={(e) => updateQuestion(index, 'text', e.target.value)}
                            placeholder="Enter your question..."
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <Label>Answer Type</Label>
                            <select
                              value={q.type}
                              onChange={(e) => updateQuestion(index, 'type', e.target.value)}
                              className="w-full px-3 py-2 border rounded-lg bg-background"
                            >
                              <option value="Text">Text</option>
                              <option value="Multiple Choice">Multiple Choice</option>
                              <option value="Checkbox">Checkbox</option>
                            </select>
                          </div>

                          <div>
                            <Label>Required?</Label>
                            <select
                              value={q.required}
                              onChange={(e) => updateQuestion(index, 'required', e.target.value)}
                              className="w-full px-3 py-2 border rounded-lg bg-background"
                            >
                              <option value="Yes">Yes</option>
                              <option value="No">No</option>
                            </select>
                          </div>
                        </div>

                        {(q.type === 'Multiple Choice' || q.type === 'Checkbox') && (
                          <div>
                            <Label>Options (comma separated)</Label>
                            <Input
                              value={q.options}
                              onChange={(e) => updateQuestion(index, 'options', e.target.value)}
                              placeholder="Option 1, Option 2, Option 3"
                            />
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Assignment Section */}
          <Card id="assignment" className="scroll-mt-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="w-5 h-5" />
                Assignment
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label htmlFor="hasAssignment">Has Assignment?</Label>
                <select
                  id="hasAssignment"
                  value={formData.hasAssignment}
                  onChange={(e) => updateField('hasAssignment', e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg bg-background"
                >
                  <option value="">Select Assignment Status</option>
                  <option value="No">No</option>
                  <option value="Yes">Yes</option>
                </select>
              </div>

              {formData.hasAssignment === 'Yes' && (
                <>
                  <div>
                    <Label htmlFor="assignmentVisibility">Assignment Visibility</Label>
                    <select
                      id="assignmentVisibility"
                      value={formData.assignmentVisibility}
                      onChange={(e) => updateField('assignmentVisibility', e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg bg-background"
                    >
                      <option value="">Select Assignment Visibility</option>
                      <option value="Batch(s)">Batch(s) - All eligible students in selected batch(es)</option>
                      <option value="Applied Students Only">Applied Students Only - Only students who already applied</option>
                    </select>
                    <p className="text-xs text-muted-foreground mt-1">
                      Control who can see and submit the assignment. Use "Applied Students Only" when adding assignment after applications have been received.
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="assignmentFileURL">Assignment File URL</Label>
                    <Input
                      id="assignmentFileURL"
                      value={formData.assignmentFileURL}
                      onChange={(e) => updateField('assignmentFileURL', e.target.value)}
                      placeholder="https://drive.google.com/..."
                    />
                  </div>

                  <div>
                    <Label htmlFor="assignmentDescription">Assignment Description</Label>
                    <Textarea
                      id="assignmentDescription"
                      value={formData.assignmentDescription}
                      onChange={(e) => updateField('assignmentDescription', e.target.value)}
                      rows={5}
                      placeholder="Describe the assignment..."
                    />
                  </div>

                  <div>
                    <Label htmlFor="assignmentDeadlineSameAsJob">Assignment Deadline</Label>
                    <select
                      id="assignmentDeadlineSameAsJob"
                      value={formData.assignmentDeadlineSameAsJob}
                      onChange={(e) => updateField('assignmentDeadlineSameAsJob', e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg bg-background"
                    >
                      <option value="">Select Assignment Deadline</option>
                      <option value="Yes">Same as job deadline</option>
                      <option value="No">Custom deadline</option>
                    </select>
                  </div>

                  {formData.assignmentDeadlineSameAsJob === 'No' && (
                    <div>
                      <Label htmlFor="assignmentDeadline">Custom Assignment Deadline</Label>
                      <Input
                        id="assignmentDeadline"
                        type="datetime-local"
                        value={formData.assignmentDeadline}
                        onChange={(e) => updateField('assignmentDeadline', e.target.value)}
                      />
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          {/* Eligibility Section */}
          <Card id="eligibility" className="scroll-mt-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Eligibility & Visibility
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label htmlFor="showToBatchLevels">Show to Batch Levels</Label>
                <Input
                  id="showToBatchLevels"
                  value={formData.showToBatchLevels}
                  onChange={(e) => updateField('showToBatchLevels', e.target.value)}
                  placeholder="e.g., SSB 2025, SSB 2024"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Leave blank to use the main batch field
                </p>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Eligibility Filters</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="showToNoOfferStudents">Show to No Offer Students</Label>
                    <select
                      id="showToNoOfferStudents"
                      value={formData.showToNoOfferStudents}
                      onChange={(e) => updateField('showToNoOfferStudents', e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg bg-background"
                    >
                      <option value="">Select Option</option>
                      <option value="No">No</option>
                      <option value="Yes">Yes</option>
                    </select>
                  </div>

                  <div>
                    <Label htmlFor="showToStudentsWithOneFT_PPO">Show to Students with 1 FT/PPO</Label>
                    <select
                      id="showToStudentsWithOneFT_PPO"
                      value={formData.showToStudentsWithOneFT_PPO}
                      onChange={(e) => updateField('showToStudentsWithOneFT_PPO', e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg bg-background"
                    >
                      <option value="">Select Option</option>
                      <option value="No">No</option>
                      <option value="Yes">Yes</option>
                    </select>
                  </div>

                  <div>
                    <Label htmlFor="showToStudentsWithNoPPO">Show to Students with No PPO</Label>
                    <select
                      id="showToStudentsWithNoPPO"
                      value={formData.showToStudentsWithNoPPO}
                      onChange={(e) => updateField('showToStudentsWithNoPPO', e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg bg-background"
                    >
                      <option value="">Select Option</option>
                      <option value="No">No</option>
                      <option value="Yes">Yes</option>
                    </select>
                  </div>

                  <div>
                    <Label htmlFor="showToStudentsWithInternships">Show to Students with Internships</Label>
                    <select
                      id="showToStudentsWithInternships"
                      value={formData.showToStudentsWithInternships}
                      onChange={(e) => updateField('showToStudentsWithInternships', e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg bg-background"
                    >
                      <option value="">Select Option</option>
                      <option value="No">No</option>
                      <option value="Yes">Yes</option>
                    </select>
                  </div>

                  <div>
                    <Label htmlFor="showToStudentsWithZeroOffers">Show to Students with Zero Offers</Label>
                    <select
                      id="showToStudentsWithZeroOffers"
                      value={formData.showToStudentsWithZeroOffers}
                      onChange={(e) => updateField('showToStudentsWithZeroOffers', e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg bg-background"
                    >
                      <option value="">Select Option</option>
                      <option value="No">No</option>
                      <option value="Yes">Yes</option>
                    </select>
                  </div>
                </div>
              </div>

              <div>
                <Label htmlFor="customVisibilityRule">Custom Visibility Rule (Advanced)</Label>
                <Textarea
                  id="customVisibilityRule"
                  value={formData.customVisibilityRule}
                  onChange={(e) => updateField('customVisibilityRule', e.target.value)}
                  rows={3}
                  placeholder="Custom business logic for visibility..."
                />
              </div>

              <div>
                <Label htmlFor="status">Job Status</Label>
                <select
                  id="status"
                  value={formData.status}
                  onChange={(e) => updateField('status', e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg bg-background"
                >
                  <option value="Draft">Draft</option>
                  <option value="Active">Active</option>
                  <option value="Expired">Expired</option>
                  <option value="Archived">Archived</option>
                </select>
                <p className="text-xs text-muted-foreground mt-1">
                  Only Active jobs will be visible to students
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Mail Section */}
          <Card id="mail" className="scroll-mt-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="w-5 h-5" />
                Email Notification
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center gap-2 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <input
                  type="checkbox"
                  id="sendMail"
                  checked={formData.sendMail === 'Yes'}
                  onChange={(e) => updateField('sendMail', e.target.checked ? 'Yes' : '')}
                  className="w-4 h-4"
                />
                <Label htmlFor="sendMail" className="cursor-pointer">
                  Send email notification for this job posting
                </Label>
              </div>

              {!isEditMode && (
                <p className="text-sm text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 p-3 rounded-lg">
                  Note: Email notification is mandatory for new job postings
                </p>
              )}

              <div>
                <Label htmlFor="mailTo">To *</Label>
                <Input
                  id="mailTo"
                  type="text"
                  value={formData.mailTo}
                  onChange={(e) => updateField('mailTo', e.target.value)}
                  placeholder="Enter email addresses (comma separated)"
                  disabled={formData.sendMail !== 'Yes'}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Multiple emails separated by commas
                </p>
              </div>

              <div>
                <Label htmlFor="mailCC">CC</Label>
                <Input
                  id="mailCC"
                  type="text"
                  value={formData.mailCC}
                  onChange={(e) => updateField('mailCC', e.target.value)}
                  placeholder="Enter CC email addresses (comma separated)"
                  disabled={formData.sendMail !== 'Yes'}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Optional - Multiple emails separated by commas
                </p>
              </div>

              <div>
                <Label htmlFor="mailBCC">BCC</Label>
                <Input
                  id="mailBCC"
                  type="text"
                  value={formData.mailBCC}
                  onChange={(e) => updateField('mailBCC', e.target.value)}
                  placeholder="Enter BCC email addresses (comma separated)"
                  disabled={formData.sendMail !== 'Yes'}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Optional - Multiple emails separated by commas
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Bottom Action Bar */}
          <div className="flex justify-between items-center sticky bottom-0 bg-background py-4 border-t border-border">
            <Button variant="outline" onClick={() => navigate('/admin/jobs')}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving} className="gap-2">
              <Save className="w-4 h-4" />
              {saving ? 'Saving...' : (isEditMode ? 'Update Job Posting' : 'Create Job Posting')}
            </Button>
          </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default JobBuilderPage;
