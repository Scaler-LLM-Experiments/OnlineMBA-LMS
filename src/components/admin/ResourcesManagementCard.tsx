import React, { useState, useEffect } from 'react';
import { BookOpen, Plus, RefreshCw, Edit2, Trash2, Save, X, FolderPlus, Link as LinkIcon, Upload, File, CheckCircle, AlertCircle, Loader } from 'lucide-react';
import { apiService, ResourceData, URLLink, FileAttachment } from '../../services/api';
import { useAuth } from '../../features/auth/hooks/useAuth';
import toast from 'react-hot-toast';

interface FileUpload {
  file: File;
  name: string;
  customName: string; // Name without extension
  extension: string;
  url?: string;
  status: 'ready' | 'uploading' | 'uploaded' | 'error';
  progress?: number;
  folderId?: string;
  error?: string;
}

interface ResourceFormData extends Omit<ResourceData, 'files' | 'urls'> {
  files: FileAttachment[];
  urls: URLLink[];
  pendingFiles: FileUpload[]; // Files ready to upload
  // Custom fields for "Other" selections
  batchCustom?: string;
  termCustom?: string;
  domainCustom?: string;
  subjectCustom?: string;
  sessionNameCustom?: string;
}

// These are fallback defaults if backend doesn't provide them
const DEFAULT_RESOURCE_TYPES = [
  'Lecture Slides',
  'Reading Material',
  'Assignment',
  'Course Material',
  'Reference Book',
  'Video Tutorial',
  'Practice Problems',
  'Case Study',
  'Course Outline',
  'Other'
];

const DEFAULT_RESOURCE_LEVELS = ['Session', 'Subject', 'Domain', 'Term', 'Other'];

interface ResourcesManagementCardProps {
  activeTab: 'all' | 'create';
  onTabChange?: (tab: 'all' | 'create') => void;
}

interface FolderOptionsType {
  batches?: string[];
  terms?: string[];
  domains?: string[];
  subjects?: string[];
  sessions?: string[];
  resourceTypes?: string[];
  resourceLevels?: string[];
  hierarchy?: {
    batches?: { [batch: string]: string[] };
    terms?: { [key: string]: string[] }; // key format: "batch|term"
    domains?: { [key: string]: string[] }; // key format: "batch|term|domain"
  };
}

export function ResourcesManagementCard({ activeTab, onTabChange }: ResourcesManagementCardProps) {
  const { student } = useAuth();
  const [resources, setResources] = useState<ResourceData[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [folderOptions, setFolderOptions] = useState<FolderOptionsType>({});

  const [formData, setFormData] = useState<Partial<ResourceFormData>>({
    title: '',
    description: '',
    resourceType: 'Lecture Slides',
    level: 'Session',
    batch: '',
    term: '',
    domain: '',
    subject: '',
    sessionName: '',
    targetBatch: '',
    showOtherBatches: 'No',
    files: [],
    urls: [],
    pendingFiles: [],
    status: 'Active',
    notes: ''
  });

  // State for tracking custom values
  const [customResourceType, setCustomResourceType] = useState('');

  useEffect(() => {
    if (student?.email) {
      fetchResources();
      fetchFolderOptions(); // Re-enabled - Fetches from Term sheet
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [student?.email]);

  const fetchResources = async () => {
    if (!student?.email) return;

    try {
      setLoading(true);
      const response = await apiService.getResources(student.email, {});

      if (response.success && response.data) {
        setResources(response.data);
      } else {
        toast.error(response.error || 'Failed to load resources');
      }
    } catch (error) {
      console.error('Error fetching resources:', error);
      toast.error('Failed to load resources');
    } finally {
      setLoading(false);
    }
  };

  const fetchFolderOptions = async () => {
    console.log('📊 fetchFolderOptions called, student:', student);

    if (!student?.email) {
      console.log('❌ No student email available, cannot fetch dropdown data');
      return;
    }

    try {
      console.log('📊 Fetching dropdown data from Term sheet...');
      const response = await apiService.getTermDropdowns(student.email);

      console.log('📊 Dropdown data response:', response);

      if (response.success && response.data) {
        console.log('✅ Dropdown options loaded:', {
          batches: response.data.batches,
          terms: response.data.terms,
          domains: response.data.domains,
          subjects: response.data.subjects,
          sessions: response.data.sessions?.length,
          resourceTypes: response.data.resourceTypes,
          resourceLevels: response.data.resourceLevels
        });
        setFolderOptions(response.data);
        if (response.data?.batches && response.data.batches.length > 0) {
          // Don't auto-select if first option is "Other"
          const firstBatch = response.data.batches[0];
          if (firstBatch !== 'Other') {
            setFormData(prev => ({ ...prev, batch: firstBatch }));
          }
        }
      } else {
        console.error('❌ Failed to load dropdown options:', response.error);
      }
    } catch (error) {
      console.error('❌ Error fetching dropdown options:', error);
    }
  };

  const handleInputChange = (field: keyof ResourceFormData, value: any) => {
    setFormData(prev => {
      const updated = { ...prev, [field]: value };

      // Clear dependent fields when parent changes
      if (field === 'batch') {
        updated.term = '';
        updated.domain = '';
        updated.subject = '';
        updated.sessionName = '';
      } else if (field === 'term') {
        updated.domain = '';
        updated.subject = '';
        updated.sessionName = '';
      } else if (field === 'domain') {
        updated.subject = '';
        updated.sessionName = '';
      } else if (field === 'subject') {
        updated.sessionName = '';
      } else if (field === 'level') {
        // Clear fields not applicable to the new level
        if (value === 'Term') {
          updated.domain = '';
          updated.subject = '';
          updated.sessionName = '';
        } else if (value === 'Domain') {
          updated.subject = '';
          updated.sessionName = '';
        } else if (value === 'Subject') {
          updated.sessionName = '';
        }
      }

      return updated;
    });
  };

  const handleAddURL = () => {
    const currentUrls = formData.urls || [];
    if (currentUrls.length < 5) {
      setFormData(prev => ({
        ...prev,
        urls: [...currentUrls, { name: '', url: '' }]
      }));
    } else {
      toast.error('Maximum 5 URLs allowed');
    }
  };

  const handleUpdateURL = (index: number, field: 'name' | 'url', value: string) => {
    const updatedUrls = [...(formData.urls || [])];
    updatedUrls[index] = { ...updatedUrls[index], [field]: value };
    setFormData(prev => ({ ...prev, urls: updatedUrls }));
  };

  const handleRemoveURL = (index: number) => {
    const updatedUrls = (formData.urls || []).filter((_, i) => i !== index);
    setFormData(prev => ({ ...prev, urls: updatedUrls }));
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const currentPendingFiles = formData.pendingFiles || [];
    const currentUploadedFiles = formData.files || [];
    const totalFiles = currentPendingFiles.length + currentUploadedFiles.length;

    if (totalFiles + files.length > 5) {
      toast.error('Maximum 5 files allowed');
      return;
    }

    const newFiles: FileUpload[] = Array.from(files).map(file => {
      const lastDotIndex = file.name.lastIndexOf('.');
      const extension = lastDotIndex > 0 ? file.name.substring(lastDotIndex + 1) : '';
      const nameWithoutExt = lastDotIndex > 0 ? file.name.substring(0, lastDotIndex) : file.name;

      return {
        file,
        name: file.name,
        customName: nameWithoutExt,
        extension,
        status: 'ready' as const,
        progress: 0
      };
    });

    setFormData(prev => ({
      ...prev,
      pendingFiles: [...currentPendingFiles, ...newFiles]
    }));

    toast.success(`${files.length} file(s) added and ready to upload`);
    // Reset the input
    event.target.value = '';
  };

  const handleUpdateFileName = (index: number, newName: string) => {
    setFormData(prev => {
      const updated = { ...prev };
      if (updated.pendingFiles) {
        updated.pendingFiles[index] = {
          ...updated.pendingFiles[index],
          customName: newName
        };
      }
      return updated;
    });
  };

  const handleRemovePendingFile = (index: number) => {
    const updatedFiles = (formData.pendingFiles || []).filter((_, i) => i !== index);
    setFormData(prev => ({ ...prev, pendingFiles: updatedFiles }));
  };

  const handleRemoveUploadedFile = (index: number) => {
    const updatedFiles = (formData.files || []).filter((_, i) => i !== index);
    setFormData(prev => ({ ...prev, files: updatedFiles }));
  };

  const uploadFilesToDrive = async (): Promise<FileAttachment[]> => {
    console.log('📤 uploadFilesToDrive called, student:', student);
    console.log('📤 student?.email:', student?.email);

    if (!student?.email) {
      console.error('❌ No student email available for upload');
      return [];
    }
    if (!formData.pendingFiles || formData.pendingFiles.length === 0) return [];

    const uploadedFiles: FileAttachment[] = [];

    // Folder structure: Batch > Resources > Term > Domain > Subject
    const batch = formData.batch === 'Other' ? formData.batchCustom : formData.batch;
    const term = formData.term === 'Other' ? formData.termCustom : formData.term;
    const domain = formData.domain === 'Other' ? formData.domainCustom : formData.domain;
    const subject = formData.subject === 'Other' ? formData.subjectCustom : formData.subject;

    for (let i = 0; i < formData.pendingFiles.length; i++) {
      const fileUpload = formData.pendingFiles[i];
      const fileSize = fileUpload.file.size;
      const fileSizeMB = fileSize / (1024 * 1024);

      // Final filename with custom name and original extension
      const finalFileName = `${fileUpload.customName}.${fileUpload.extension}`;

      try {
        // Update status to uploading
        setFormData(prev => {
          const updated = { ...prev };
          if (updated.pendingFiles) {
            updated.pendingFiles[i] = { ...updated.pendingFiles[i], status: 'uploading', progress: 0 };
          }
          return updated;
        });

        let result: { success: boolean; data?: { url: string; folderId: string }; error?: string };

        if (fileSizeMB < 50) {
          // Direct upload for files < 50MB
          result = await apiService.uploadResourceFile(
            student.email,
            fileUpload.file,
            finalFileName,
            batch!,
            term,
            domain,
            subject,
            (progress) => {
              setFormData(prev => {
                const updated = { ...prev };
                if (updated.pendingFiles) {
                  updated.pendingFiles[i] = { ...updated.pendingFiles[i], progress };
                }
                return updated;
              });
            }
          );
        } else {
          // Resumable upload for files >= 50MB
          result = await apiService.uploadResourceFileResumable(
            student.email,
            fileUpload.file,
            finalFileName,
            batch!,
            term,
            domain,
            subject,
            (progress) => {
              setFormData(prev => {
                const updated = { ...prev };
                if (updated.pendingFiles) {
                  updated.pendingFiles[i] = { ...updated.pendingFiles[i], progress };
                }
                return updated;
              });
            }
          );
        }

        if (result.success && result.data) {
          uploadedFiles.push({
            name: finalFileName,
            url: result.data.url
          });

          // Update status to uploaded
          setFormData(prev => {
            const updated = { ...prev };
            if (updated.pendingFiles) {
              updated.pendingFiles[i] = {
                ...updated.pendingFiles[i],
                status: 'uploaded',
                progress: 100,
                url: result.data!.url,
                folderId: result.data!.folderId
              };
            }
            return updated;
          });
        } else {
          throw new Error(result.error || 'Upload failed');
        }
      } catch (error) {
        console.error(`Error uploading file ${fileUpload.name}:`, error);
        setFormData(prev => {
          const updated = { ...prev };
          if (updated.pendingFiles) {
            updated.pendingFiles[i] = {
              ...updated.pendingFiles[i],
              status: 'error',
              error: error instanceof Error ? error.message : 'Upload failed'
            };
          }
          return updated;
        });
        toast.error(`Failed to upload ${fileUpload.customName}.${fileUpload.extension}`);
      }
    }

    return uploadedFiles;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!student?.email) return;

    // Validation
    if (!formData.title || !formData.description || !formData.batch) {
      toast.error('Please fill in all required fields');
      return;
    }

    // Validate custom values when "Other" is selected
    if (formData.batch === 'Other' && !formData.batchCustom) {
      toast.error('Please enter a custom batch name');
      return;
    }
    if (formData.term === 'Other' && !formData.termCustom) {
      toast.error('Please enter a custom term name');
      return;
    }
    if (formData.domain === 'Other' && !formData.domainCustom) {
      toast.error('Please enter a custom domain name');
      return;
    }
    if (formData.subject === 'Other' && !formData.subjectCustom) {
      toast.error('Please enter a custom subject name');
      return;
    }
    if (formData.sessionName === 'Other' && !formData.sessionNameCustom) {
      toast.error('Please enter a custom session name');
      return;
    }

    try {
      setLoading(true);

      // Upload pending files first
      let uploadedFiles: FileAttachment[] = [];
      if (formData.pendingFiles && formData.pendingFiles.length > 0) {
        toast.loading(`Uploading ${formData.pendingFiles.length} file(s)...`);
        uploadedFiles = await uploadFilesToDrive();
        toast.dismiss();

        // Check if any uploads failed
        const failedUploads = formData.pendingFiles.filter(f => f.status === 'error');
        if (failedUploads.length > 0) {
          toast.error(`${failedUploads.length} file(s) failed to upload. Please try again.`);
          setLoading(false);
          return;
        }
      }

      // Combine previously uploaded files with newly uploaded files
      const allFiles = [...(formData.files || []), ...uploadedFiles];

      // Use custom values when "Other" is selected
      const resourcePayload: ResourceData = {
        title: formData.title!,
        description: formData.description!,
        resourceType: formData.resourceType!,
        level: formData.level!,
        batch: formData.batch === 'Other' ? formData.batchCustom! : formData.batch!,
        term: formData.term === 'Other' ? formData.termCustom : formData.term,
        domain: formData.domain === 'Other' ? formData.domainCustom : formData.domain,
        subject: formData.subject === 'Other' ? formData.subjectCustom : formData.subject,
        sessionName: formData.sessionName === 'Other' ? formData.sessionNameCustom : formData.sessionName,
        targetBatch: formData.targetBatch,
        showOtherBatches: formData.showOtherBatches,
        files: allFiles,
        urls: formData.urls || [],
        postedBy: student.email,
        status: formData.status || 'Active',
        notes: formData.notes
      };

      let response;
      if (editingId) {
        response = await apiService.updateResource(student.email, editingId, resourcePayload);
      } else {
        response = await apiService.createResource(student.email, resourcePayload);
      }

      if (response.success) {
        toast.success(editingId ? 'Resource updated successfully' : 'Resource created successfully');
        resetForm();
        fetchResources();
        // Switch back to View All tab after successful save
        if (onTabChange) {
          onTabChange('all');
        }
      } else {
        toast.error(response.error || 'Failed to save resource');
      }
    } catch (error) {
      console.error('Error saving resource:', error);
      toast.error('Failed to save resource');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (resource: ResourceData) => {
    setEditingId(resource.id || null);
    setFormData({
      ...resource,
      files: resource.files || [],
      urls: resource.urls || [],
      pendingFiles: [] // Reset pending files when editing
    });
    // Switch to create tab to show the form
    if (onTabChange) {
      onTabChange('create');
    }
  };

  const handleDelete = async (resourceId: string) => {
    if (!student?.email || !window.confirm('Are you sure you want to delete this resource?')) return;

    try {
      setLoading(true);
      const response = await apiService.deleteResource(student.email, resourceId);

      if (response.success) {
        toast.success('Resource deleted successfully');
        fetchResources();
      } else {
        toast.error(response.error || 'Failed to delete resource');
      }
    } catch (error) {
      console.error('Error deleting resource:', error);
      toast.error('Failed to delete resource');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      resourceType: 'Lecture Slides',
      level: 'Session',
      batch: folderOptions.batches?.[0] || '',
      term: '',
      domain: '',
      subject: '',
      sessionName: '',
      targetBatch: '',
      showOtherBatches: 'No',
      files: [],
      urls: [],
      pendingFiles: [],
      status: 'Active',
      notes: ''
    });
    setEditingId(null);
  };

  const isCustomValue = (value: string | undefined, options: string[] | undefined): boolean => {
    return !!value && value !== '__custom__' && (!options || !options.includes(value));
  };

  return (
    <div className="bg-card border border-border rounded-lg p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-600/10 rounded-lg">
            <BookOpen className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-foreground">Resources Management</h2>
            <p className="text-sm text-muted-foreground">Manage course resources and materials</p>
          </div>
        </div>
        {activeTab === 'all' && (
          <button
            onClick={fetchResources}
            disabled={loading}
            className="p-2 hover:bg-accent rounded-lg transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-5 h-5 text-muted-foreground ${loading ? 'animate-spin' : ''}`} />
          </button>
        )}
      </div>

      {/* Create/Edit Form */}
      {activeTab === 'create' && (
        <form onSubmit={handleSubmit} className="mb-6 p-4 bg-accent/30 rounded-lg border border-border">
          <h3 className="text-lg font-semibold text-foreground mb-4">
            {editingId ? 'Edit Resource' : 'Create New Resource'}
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Title */}
            <div className="col-span-2">
              <label className="block text-sm font-medium text-foreground mb-2">
                Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.title || ''}
                onChange={(e) => handleInputChange('title', e.target.value)}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter resource title"
                required
              />
            </div>

            {/* Description */}
            <div className="col-span-2">
              <label className="block text-sm font-medium text-foreground mb-2">
                Description <span className="text-red-500">*</span>
              </label>
              <textarea
                value={formData.description || ''}
                onChange={(e) => handleInputChange('description', e.target.value)}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter resource description"
                rows={3}
                required
              />
            </div>

            {/* Resource Type */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Resource Type
                <span className="text-xs text-muted-foreground ml-2">(Select or type custom)</span>
              </label>
              <select
                value={formData.resourceType && (folderOptions.resourceTypes || DEFAULT_RESOURCE_TYPES).includes(formData.resourceType) ? formData.resourceType : 'Other'}
                onChange={(e) => {
                  if (e.target.value === 'Other') {
                    handleInputChange('resourceType', 'Other');
                    setCustomResourceType('');
                  } else {
                    handleInputChange('resourceType', e.target.value);
                    setCustomResourceType('');
                  }
                }}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {(folderOptions.resourceTypes || DEFAULT_RESOURCE_TYPES).map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
              {formData.resourceType === 'Other' && (
                <input
                  type="text"
                  placeholder="Enter custom resource type"
                  value={customResourceType}
                  onChange={(e) => {
                    setCustomResourceType(e.target.value);
                    handleInputChange('resourceTypeCustom', e.target.value);
                  }}
                  className="w-full px-3 py-2 mt-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500"
                  autoFocus
                />
              )}
            </div>

            {/* Level */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Resource Level</label>
              <select
                value={formData.level || 'Session'}
                onChange={(e) => handleInputChange('level', e.target.value as any)}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {(folderOptions.resourceLevels || DEFAULT_RESOURCE_LEVELS).map(level => (
                  <option key={level} value={level}>{level} Level</option>
                ))}
              </select>
            </div>

            {/* Info Note */}
            <div className="col-span-2 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
              <p className="text-sm text-blue-400">
                <strong>Note:</strong> Dropdown options are automatically populated from:
                <br />• "Term" sheet (for Batch, Term, Domain, Subject hierarchy)
                <br />• Session 1-100 are auto-generated
                <br /><br />
                You can type custom values by selecting "Other (Custom)" from any dropdown.
              </p>
            </div>

            {/* Batch - Always shown */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Batch <span className="text-red-500">*</span>
                <span className="text-xs text-muted-foreground ml-2">(Select from dropdown or type custom)</span>
              </label>
              <select
                value={formData.batch && folderOptions.batches?.includes(formData.batch) && formData.batch !== 'Other' ? formData.batch : (formData.batch === 'Other' || (formData.batch && !folderOptions.batches?.includes(formData.batch)) ? 'Other' : '')}
                onChange={(e) => {
                  if (e.target.value === 'Other') {
                    handleInputChange('batch', 'Other');
                  } else {
                    handleInputChange('batch', e.target.value);
                  }
                }}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Select batch</option>
                {folderOptions.batches?.filter(b => b !== 'Other').map((batch: string) => (
                  <option key={batch} value={batch}>{batch}</option>
                ))}
                <option value="Other">Other (Custom)</option>
              </select>
              {formData.batch === 'Other' && (
                <input
                  type="text"
                  placeholder="Enter custom batch name"
                  value={formData.batchCustom || ''}
                  onChange={(e) => handleInputChange('batchCustom', e.target.value)}
                  className="w-full px-3 py-2 mt-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500"
                  autoFocus
                  required
                />
              )}
            </div>

            {/* Term - Show for all levels */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Term
                <span className="text-xs text-muted-foreground ml-2">(Select from dropdown or type custom)</span>
              </label>
              <select
                value={formData.term && formData.batch && formData.batch !== 'Other' && folderOptions.hierarchy?.batches?.[formData.batch]?.includes(formData.term) ? formData.term : (formData.term === 'Other' ? 'Other' : '')}
                onChange={(e) => {
                  if (e.target.value === 'Other') {
                    handleInputChange('term', 'Other');
                  } else {
                    handleInputChange('term', e.target.value);
                  }
                }}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={!formData.batch || formData.batch === 'Other'}
              >
                <option value="">Select term</option>
                {formData.batch && formData.batch !== 'Other' && folderOptions.hierarchy?.batches?.[formData.batch]?.filter((t: string) => t !== 'Other').map((term: string) => (
                  <option key={term} value={term}>{term}</option>
                ))}
                <option value="Other">Other (Custom)</option>
              </select>
              {formData.term === 'Other' && (
                <input
                  type="text"
                  placeholder="Enter custom term name"
                  value={formData.termCustom || ''}
                  onChange={(e) => handleInputChange('termCustom', e.target.value)}
                  className="w-full px-3 py-2 mt-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500"
                  autoFocus
                />
              )}
            </div>

            {/* Domain - Show only for Session, Subject, and Domain levels */}
            {['Session', 'Subject', 'Domain'].includes(formData.level || '') && (
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Domain
                  <span className="text-xs text-muted-foreground ml-2">(Select from dropdown or type custom)</span>
                </label>
                <select
                  value={formData.domain && formData.batch && formData.term && formData.batch !== 'Other' && formData.term !== 'Other' && folderOptions.hierarchy?.terms?.[`${formData.batch}|${formData.term}`]?.includes(formData.domain) ? formData.domain : (formData.domain === 'Other' ? 'Other' : '')}
                  onChange={(e) => {
                    if (e.target.value === 'Other') {
                      handleInputChange('domain', 'Other');
                    } else {
                      handleInputChange('domain', e.target.value);
                    }
                  }}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={!formData.batch || !formData.term || formData.batch === 'Other' || formData.term === 'Other'}
                >
                  <option value="">Select domain</option>
                  {formData.batch && formData.term && formData.batch !== 'Other' && formData.term !== 'Other' &&
                   folderOptions.hierarchy?.terms?.[`${formData.batch}|${formData.term}`]?.filter((d: string) => d !== 'Other').map((domain: string) => (
                    <option key={domain} value={domain}>{domain}</option>
                  ))}
                  <option value="Other">Other (Custom)</option>
                </select>
                {formData.domain === 'Other' && (
                  <input
                    type="text"
                    placeholder="Enter custom domain name"
                    value={formData.domainCustom || ''}
                    onChange={(e) => handleInputChange('domainCustom', e.target.value)}
                    className="w-full px-3 py-2 mt-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500"
                    autoFocus
                  />
                )}
              </div>
            )}

            {/* Subject - Show only for Session and Subject levels */}
            {['Session', 'Subject'].includes(formData.level || '') && (
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Subject
                  <span className="text-xs text-muted-foreground ml-2">(Select from dropdown or type custom)</span>
                </label>
                <select
                  value={formData.subject && formData.batch && formData.term && formData.domain && formData.batch !== 'Other' && formData.term !== 'Other' && formData.domain !== 'Other' && folderOptions.hierarchy?.domains?.[`${formData.batch}|${formData.term}|${formData.domain}`]?.includes(formData.subject) ? formData.subject : (formData.subject === 'Other' ? 'Other' : '')}
                  onChange={(e) => {
                    if (e.target.value === 'Other') {
                      handleInputChange('subject', 'Other');
                    } else {
                      handleInputChange('subject', e.target.value);
                    }
                  }}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={!formData.batch || !formData.term || !formData.domain ||
                           formData.batch === 'Other' || formData.term === 'Other' || formData.domain === 'Other'}
                >
                  <option value="">Select subject</option>
                  {formData.batch && formData.term && formData.domain &&
                   formData.batch !== 'Other' && formData.term !== 'Other' && formData.domain !== 'Other' &&
                   folderOptions.hierarchy?.domains?.[`${formData.batch}|${formData.term}|${formData.domain}`]?.filter((s: string) => s !== 'Other').map((subject: string) => (
                    <option key={subject} value={subject}>{subject}</option>
                  ))}
                  <option value="Other">Other (Custom)</option>
                </select>
                {formData.subject === 'Other' && (
                  <input
                    type="text"
                    placeholder="Enter custom subject name"
                    value={formData.subjectCustom || ''}
                    onChange={(e) => handleInputChange('subjectCustom', e.target.value)}
                    className="w-full px-3 py-2 mt-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500"
                    autoFocus
                  />
                )}
              </div>
            )}

            {/* Session Name - Show only for Session level */}
            {formData.level === 'Session' && (
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Session Name
                  <span className="text-xs text-muted-foreground ml-2">(Auto-formats as "Subject: Session N")</span>
                </label>
                <select
                  value={formData.sessionName && folderOptions.sessions?.includes(formData.sessionName) && formData.sessionName !== 'Other' ? formData.sessionName : (formData.sessionName === 'Other' ? 'Other' : '')}
                  onChange={(e) => {
                    if (e.target.value === 'Other') {
                      handleInputChange('sessionName', 'Other');
                    } else {
                      // Auto-populate format: "Subject: Session N"
                      const selectedSession = e.target.value;
                      if (formData.subject && formData.subject !== 'Other' && selectedSession) {
                        const sessionNum = selectedSession.replace('Session ', '');
                        handleInputChange('sessionName', `${formData.subject}: Session ${sessionNum}`);
                      } else {
                        handleInputChange('sessionName', selectedSession);
                      }
                    }
                  }}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={!formData.batch || !formData.term || !formData.domain || !formData.subject ||
                           formData.batch === 'Other' || formData.term === 'Other' ||
                           formData.domain === 'Other' || formData.subject === 'Other'}
                >
                  <option value="">Select session</option>
                  {folderOptions.sessions?.filter(s => s !== 'Other').map((session: string) => (
                    <option key={session} value={session}>{session}</option>
                  ))}
                  <option value="Other">Other (Custom)</option>
                </select>
                {formData.sessionName === 'Other' && (
                  <input
                    type="text"
                    placeholder="Enter custom session name (e.g., Subject: Session X)"
                    value={formData.sessionNameCustom || ''}
                    onChange={(e) => handleInputChange('sessionNameCustom', e.target.value)}
                    className="w-full px-3 py-2 mt-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500"
                    autoFocus
                  />
                )}
              </div>
            )}

            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Status</label>
              <select
                value={formData.status || 'Active'}
                onChange={(e) => handleInputChange('status', e.target.value)}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="Active">Active</option>
                <option value="Archived">Archived</option>
              </select>
            </div>

            {/* URLs Section */}
            <div className="col-span-2">
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-foreground">
                  Additional URLs (up to 5)
                </label>
                <button
                  type="button"
                  onClick={handleAddURL}
                  disabled={(formData.urls || []).length >= 5}
                  className="flex items-center gap-1 px-3 py-1 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <LinkIcon className="w-3 h-3" />
                  Add URL
                </button>
              </div>

              {(formData.urls || []).map((url, index) => (
                <div key={index} className="grid grid-cols-12 gap-2 mb-2">
                  <div className="col-span-4">
                    <input
                      type="text"
                      placeholder="Link Name"
                      value={url.name}
                      onChange={(e) => handleUpdateURL(index, 'name', e.target.value)}
                      className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="col-span-7">
                    <input
                      type="url"
                      placeholder="https://..."
                      value={url.url}
                      onChange={(e) => handleUpdateURL(index, 'url', e.target.value)}
                      className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="col-span-1 flex items-center">
                    <button
                      type="button"
                      onClick={() => handleRemoveURL(index)}
                      className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}

              {(formData.urls || []).length === 0 && (
                <p className="text-sm text-muted-foreground">No additional URLs added. Click "Add URL" to add one.</p>
              )}
            </div>

            {/* Files Section */}
            <div className="col-span-2">
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-foreground">
                  File Attachments (up to 5)
                </label>
                <label
                  className={`flex items-center gap-1 px-3 py-1 text-xs bg-green-600 hover:bg-green-700 text-white rounded cursor-pointer transition-colors ${
                    ((formData.pendingFiles || []).length + (formData.files || []).length >= 5) ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  <Upload className="w-3 h-3" />
                  Select Files
                  <input
                    type="file"
                    multiple
                    onChange={handleFileSelect}
                    disabled={(formData.pendingFiles || []).length + (formData.files || []).length >= 5}
                    className="hidden"
                    accept="*/*"
                  />
                </label>
              </div>

              {/* Pending Files (Ready to Upload) */}
              {(formData.pendingFiles || []).length > 0 && (
                <div className="mb-3">
                  <h4 className="text-xs font-medium text-muted-foreground mb-2">Ready to Upload:</h4>
                  {(formData.pendingFiles || []).map((fileUpload, index) => {
                    const fileSizeMB = (fileUpload.file.size / (1024 * 1024)).toFixed(2);
                    const isLarge = fileUpload.file.size >= 50 * 1024 * 1024;

                    return (
                      <div key={index} className="mb-2 p-3 bg-background border border-border rounded-lg">
                        <div className="flex items-start gap-2">
                          <div className="flex-shrink-0 mt-1">
                            {fileUpload.status === 'ready' && <File className="w-4 h-4 text-blue-500" />}
                            {fileUpload.status === 'uploading' && <Loader className="w-4 h-4 text-blue-500 animate-spin" />}
                            {fileUpload.status === 'uploaded' && <CheckCircle className="w-4 h-4 text-green-500" />}
                            {fileUpload.status === 'error' && <AlertCircle className="w-4 h-4 text-red-500" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            {fileUpload.status === 'ready' ? (
                              <div className="flex items-center gap-2">
                                <input
                                  type="text"
                                  value={fileUpload.customName}
                                  onChange={(e) => handleUpdateFileName(index, e.target.value)}
                                  className="flex-1 px-2 py-1 text-sm bg-background border border-border rounded text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  placeholder="File name"
                                />
                                <span className="text-sm text-muted-foreground">.{fileUpload.extension}</span>
                              </div>
                            ) : (
                              <p className="text-sm font-medium text-foreground truncate">
                                {fileUpload.customName}.{fileUpload.extension}
                              </p>
                            )}
                            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                              <span>{fileSizeMB} MB</span>
                              {isLarge && <span className="text-orange-500">(Resumable Upload)</span>}
                              {fileUpload.status === 'uploading' && fileUpload.progress !== undefined && (
                                <span>• {fileUpload.progress}%</span>
                              )}
                              {fileUpload.status === 'uploaded' && <span className="text-green-500">• Uploaded</span>}
                              {fileUpload.status === 'error' && <span className="text-red-500">• {fileUpload.error}</span>}
                            </div>
                            {fileUpload.status === 'uploading' && fileUpload.progress !== undefined && (
                              <div className="mt-2 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                                <div
                                  className="bg-blue-500 h-1.5 rounded-full transition-all"
                                  style={{ width: `${fileUpload.progress}%` }}
                                />
                              </div>
                            )}
                          </div>
                          {fileUpload.status === 'ready' && (
                            <button
                              type="button"
                              onClick={() => handleRemovePendingFile(index)}
                              className="p-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Previously Uploaded Files */}
              {(formData.files || []).length > 0 && (
                <div className="mb-3">
                  <h4 className="text-xs font-medium text-muted-foreground mb-2">Uploaded Files:</h4>
                  {(formData.files || []).map((file, index) => (
                    <div key={index} className="flex items-center gap-2 mb-2 p-2 bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800 rounded-lg">
                      <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{file.name}</p>
                        <a
                          href={file.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-blue-500 hover:underline truncate block"
                        >
                          View File
                        </a>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveUploadedFile(index)}
                        className="p-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {((formData.files || []).length === 0 && (formData.pendingFiles || []).length === 0) && (
                <p className="text-sm text-muted-foreground">No file attachments. Click "Select Files" to upload files.</p>
              )}

              <div className="mt-2 p-2 bg-green-500/10 border border-green-500/30 rounded text-xs text-green-400">
                <strong>How it works:</strong> Select up to 5 files. Files will be uploaded to Google Drive when you click "Create Resource" or "Update Resource".
                Files &lt;50MB use direct upload, files ≥50MB use resumable upload.
              </div>
            </div>

            {/* Notes */}
            <div className="col-span-2">
              <label className="block text-sm font-medium text-foreground mb-2">Notes (Internal)</label>
              <textarea
                value={formData.notes || ''}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Internal notes (not visible to students)"
                rows={2}
              />
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex items-center gap-3 mt-6">
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {editingId ? 'Update Resource' : 'Create Resource'}
            </button>
            <button
              type="button"
              onClick={resetForm}
              className="px-6 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-foreground rounded-lg transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Resources List */}
      {activeTab === 'all' && (
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-foreground">
            Resources ({resources.length})
          </h3>

          {loading && (
            <div className="text-center py-8 text-muted-foreground">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
              Loading resources...
            </div>
          )}

          {!loading && resources.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <BookOpen className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>No resources found. Create your first resource!</p>
            </div>
          )}

          {!loading && resources.map(resource => (
            <div key={resource.id} className="p-4 bg-accent/30 rounded-lg border border-border">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="font-semibold text-foreground">{resource.title}</h4>
                  <p className="text-sm text-muted-foreground mt-1">{resource.description}</p>
                  <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground flex-wrap">
                    <span className="px-2 py-1 bg-blue-600/10 text-blue-600 dark:text-blue-400 rounded">
                      {resource.resourceType}
                    </span>
                    <span>{resource.level}</span>
                    <span>{resource.batch}</span>
                    {resource.term && <span>{resource.term}</span>}
                    {resource.domain && <span>{resource.domain}</span>}
                    {resource.subject && <span>{resource.subject}</span>}
                    {resource.sessionName && <span>{resource.sessionName}</span>}
                    <span className={`px-2 py-1 rounded ${
                      resource.status === 'Active'
                        ? 'bg-green-600/10 text-green-600 dark:text-green-400'
                        : 'bg-gray-600/10 text-gray-600 dark:text-gray-400'
                    }`}>
                      {resource.status}
                    </span>
                  </div>
                  {((resource.urls && resource.urls.length > 0) || (resource.files && resource.files.length > 0)) && (
                    <div className="flex items-center gap-4 mt-2">
                      {resource.urls && resource.urls.length > 0 && (
                        <div className="flex items-center gap-2">
                          <LinkIcon className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                          <span className="text-xs text-muted-foreground">
                            {resource.urls.length} URL{resource.urls.length > 1 ? 's' : ''}
                          </span>
                        </div>
                      )}
                      {resource.files && resource.files.length > 0 && (
                        <div className="flex items-center gap-2">
                          <Upload className="w-4 h-4 text-green-600 dark:text-green-400" />
                          <span className="text-xs text-muted-foreground">
                            {resource.files.length} File{resource.files.length > 1 ? 's' : ''}
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2 ml-4">
                  <button
                    onClick={() => handleEdit(resource)}
                    className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
                    title="Edit resource"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(resource.id!)}
                    className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                    title="Delete resource"
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
  );
}