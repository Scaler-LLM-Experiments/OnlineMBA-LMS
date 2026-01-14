import React, { useState, useEffect } from 'react';
import { FileText, Plus, RefreshCw, Edit2, Trash2, Save, X, Link as LinkIcon } from 'lucide-react';
import { apiService, PolicyData, URLLink, FileAttachment } from '../../services/api';
import { useAuth } from '../../features/auth/hooks/useAuth';
import toast from 'react-hot-toast';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';

interface PolicyFormData extends Omit<PolicyData, 'files' | 'urls'> {
  files: FileAttachment[];
  urls: URLLink[];
}

const POLICY_TYPES = [
  'Academic Policy',
  'Code of Conduct',
  'Attendance Policy',
  'Assessment Policy',
  'Grading Policy',
  'Plagiarism Policy',
  'Leave Policy',
  'IT Usage Policy',
  'Library Policy',
  'General Guidelines',
  'Other'
];

const POLICY_CATEGORIES = [
  'Academic',
  'Administrative',
  'Student Conduct',
  'IT & Technology',
  'General',
  'Other'
];

interface PoliciesManagementCardProps {
  activeTab?: 'all' | 'create';
  onSwitchToCreateTab?: () => void;
}

export function PoliciesManagementCard({ activeTab = 'all', onSwitchToCreateTab }: PoliciesManagementCardProps) {
  const { student } = useAuth();
  const [policies, setPolicies] = useState<PolicyData[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [batches, setBatches] = useState<string[]>([]);

  const [formData, setFormData] = useState<Partial<PolicyFormData>>({
    title: '',
    description: '',
    fullContent: '',
    policyType: 'Academic Policy',
    category: 'Academic',
    version: '1.0',
    batch: '',
    targetBatch: '',
    showOtherBatches: 'No',
    effectiveDate: '',
    expiryDate: '',
    supersedes: '',
    files: [],
    urls: [],
    status: 'Active',
    notes: ''
  });

  useEffect(() => {
    fetchPolicies();
    fetchBatches();
  }, []);

  const fetchPolicies = async () => {
    if (!student?.email) return;

    try {
      setLoading(true);
      const response = await apiService.getPolicies(student.email, {});

      if (response.success && response.data) {
        setPolicies(response.data);
      } else {
        toast.error(response.error || 'Failed to load policies');
      }
    } catch (error) {
      console.error('Error fetching policies:', error);
      toast.error('Failed to load policies');
    } finally {
      setLoading(false);
    }
  };

  const fetchBatches = async () => {
    if (!student?.email) return;

    try {
      const response = await apiService.getAvailableFolders(student.email);

      if (response.success && response.data && response.data.batches) {
        setBatches(response.data.batches);
        if (response.data.batches.length > 0) {
          setFormData(prev => ({ ...prev, batch: response.data?.batches?.[0] || '' }));
        }
      }
    } catch (error) {
      console.error('Error fetching batches:', error);
    }
  };

  const handleInputChange = (field: keyof PolicyFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!student?.email) return;

    // Validation
    if (!formData.title || !formData.description || !formData.fullContent || !formData.batch) {
      toast.error('Please fill in all required fields (Title, Short Description, Full Content, and Batch)');
      return;
    }

    try {
      setLoading(true);

      const policyPayload: PolicyData = {
        title: formData.title!,
        description: formData.description!,
        fullContent: formData.fullContent!,
        policyType: formData.policyType!,
        category: formData.category!,
        version: formData.version,
        batch: formData.batch!,
        targetBatch: formData.targetBatch,
        showOtherBatches: formData.showOtherBatches,
        effectiveDate: formData.effectiveDate,
        expiryDate: formData.expiryDate,
        supersedes: formData.supersedes,
        files: formData.files || [],
        urls: formData.urls || [],
        postedBy: student.email,
        status: formData.status || 'Active',
        notes: formData.notes
      };

      let response;
      if (editingId) {
        response = await apiService.updatePolicy(student.email, editingId, policyPayload);
      } else {
        response = await apiService.createPolicy(student.email, policyPayload);
      }

      if (response.success) {
        toast.success(editingId ? 'Policy updated successfully' : 'Policy created successfully');
        resetForm();
        fetchPolicies();
      } else {
        toast.error(response.error || 'Failed to save policy');
      }
    } catch (error) {
      console.error('Error saving policy:', error);
      toast.error('Failed to save policy');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (policy: PolicyData) => {
    setEditingId(policy.id || null);
    setFormData({
      ...policy,
      files: policy.files || [],
      urls: policy.urls || []
    });
    // Automatically switch to "Create New" tab to show the edit form
    if (onSwitchToCreateTab) {
      onSwitchToCreateTab();
    }
  };

  const handleDelete = async (policyId: string) => {
    if (!student?.email || !window.confirm('Are you sure you want to delete this policy?')) return;

    try {
      setLoading(true);
      const response = await apiService.deletePolicy(student.email, policyId);

      if (response.success) {
        toast.success('Policy deleted successfully');
        fetchPolicies();
      } else {
        toast.error(response.error || 'Failed to delete policy');
      }
    } catch (error) {
      console.error('Error deleting policy:', error);
      toast.error('Failed to delete policy');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      fullContent: '',
      policyType: 'Academic Policy',
      category: 'Academic',
      version: '1.0',
      batch: batches[0] || '',
      targetBatch: '',
      showOtherBatches: 'No',
      effectiveDate: '',
      expiryDate: '',
      supersedes: '',
      files: [],
      urls: [],
      status: 'Active',
      notes: ''
    });
    setEditingId(null);
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div className="bg-card border border-border rounded-lg p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-600/10 rounded-lg">
            <FileText className="w-6 h-6 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-foreground">Policies & Documents</h2>
            <p className="text-sm text-muted-foreground">Manage policies and official documents</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchPolicies}
            disabled={loading}
            className="p-2 hover:bg-accent rounded-lg transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-5 h-5 text-muted-foreground ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Create/Edit Form */}
      {activeTab === 'create' && (
        <form onSubmit={handleSubmit} className="mb-6 p-4 bg-accent/30 rounded-lg border border-border">
          <h3 className="text-lg font-semibold text-foreground mb-4">
            {editingId ? 'Edit Policy' : 'Create New Policy/Document'}
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
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="Enter policy title"
                required
              />
            </div>

            {/* Short Description */}
            <div className="col-span-2">
              <label className="block text-sm font-medium text-foreground mb-2">
                Short Description <span className="text-red-500">*</span>
              </label>
              <textarea
                value={formData.description || ''}
                onChange={(e) => handleInputChange('description', e.target.value)}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="Enter brief policy description (shown in listing)"
                rows={2}
                required
              />
            </div>

            {/* Full Content - Rich Text Editor */}
            <div className="col-span-2">
              <label className="block text-sm font-medium text-foreground mb-2">
                Full Content <span className="text-red-500">*</span>
              </label>
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
                value={formData.fullContent || ''}
                onChange={(value) => handleInputChange('fullContent', value)}
                placeholder="Write the complete policy/document content here..."
                className="h-64 bg-background"
              />
            </div>

            {/* Policy Type */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Policy Type</label>
              <select
                value={formData.policyType || 'Academic Policy'}
                onChange={(e) => handleInputChange('policyType', e.target.value)}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                {POLICY_TYPES.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Category</label>
              <select
                value={formData.category || 'Academic'}
                onChange={(e) => handleInputChange('category', e.target.value)}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                {POLICY_CATEGORIES.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>

            {/* Version */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Version</label>
              <input
                type="text"
                value={formData.version || '1.0'}
                onChange={(e) => handleInputChange('version', e.target.value)}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="e.g., 1.0, 2.1"
              />
            </div>

            {/* Batch */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Batch <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.batch || ''}
                onChange={(e) => handleInputChange('batch', e.target.value)}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-purple-500"
                required
              >
                <option value="">Select Batch</option>
                {batches.map(batch => (
                  <option key={batch} value={batch}>{batch}</option>
                ))}
              </select>
            </div>

            {/* Effective Date */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Effective Date</label>
              <input
                type="date"
                value={formData.effectiveDate || ''}
                onChange={(e) => handleInputChange('effectiveDate', e.target.value)}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            {/* Expiry Date */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Expiry Date</label>
              <input
                type="date"
                value={formData.expiryDate || ''}
                onChange={(e) => handleInputChange('expiryDate', e.target.value)}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            {/* Supersedes */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Supersedes (Policy ID)</label>
              <input
                type="text"
                value={formData.supersedes || ''}
                onChange={(e) => handleInputChange('supersedes', e.target.value)}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="Previous policy ID this replaces"
              />
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Status</label>
              <select
                value={formData.status || 'Active'}
                onChange={(e) => handleInputChange('status', e.target.value)}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-purple-500"
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
                  className="flex items-center gap-1 px-3 py-1 text-xs bg-purple-600 hover:bg-purple-700 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed"
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
                      className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  <div className="col-span-7">
                    <input
                      type="url"
                      placeholder="https://..."
                      value={url.url}
                      onChange={(e) => handleUpdateURL(index, 'url', e.target.value)}
                      className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
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

            {/* Notes */}
            <div className="col-span-2">
              <label className="block text-sm font-medium text-foreground mb-2">Notes (Internal)</label>
              <textarea
                value={formData.notes || ''}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-purple-500"
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
              className="flex items-center gap-2 px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {editingId ? 'Update Policy' : 'Create Policy'}
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

      {/* Policies List */}
      {activeTab === 'all' && (
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-foreground">
            Policies & Documents ({policies.length})
          </h3>

          {loading && (
          <div className="text-center py-8 text-muted-foreground">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
            Loading policies...
          </div>
        )}

        {!loading && policies.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>No policies found. Create your first policy!</p>
          </div>
        )}

        {policies.map(policy => (
          <div key={policy.id} className="p-4 bg-accent/30 rounded-lg border border-border">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h4 className="font-semibold text-foreground">{policy.title}</h4>
                  {policy.version && (
                    <span className="text-xs px-2 py-0.5 bg-purple-600/10 text-purple-600 dark:text-purple-400 rounded">
                      v{policy.version}
                    </span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground mt-1">{policy.description}</p>
                <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                  <span className="px-2 py-1 bg-purple-600/10 text-purple-600 dark:text-purple-400 rounded">
                    {policy.policyType}
                  </span>
                  <span>{policy.category}</span>
                  <span>{policy.batch}</span>
                  {policy.effectiveDate && <span>Effective: {formatDate(policy.effectiveDate)}</span>}
                  <span className={`px-2 py-1 rounded ${
                    policy.status === 'Active'
                      ? 'bg-green-600/10 text-green-600 dark:text-green-400'
                      : 'bg-gray-600/10 text-gray-600 dark:text-gray-400'
                  }`}>
                    {policy.status}
                  </span>
                </div>
                {policy.supersedes && (
                  <p className="text-xs text-muted-foreground mt-2">
                    🔄 Supersedes: {policy.supersedes}
                  </p>
                )}
                {policy.urls && policy.urls.length > 0 && (
                  <div className="flex items-center gap-2 mt-2">
                    <LinkIcon className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                    <span className="text-xs text-muted-foreground">
                      {policy.urls.length} URL{policy.urls.length > 1 ? 's' : ''} attached
                    </span>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2 ml-4">
                <button
                  onClick={() => handleEdit(policy)}
                  className="p-2 text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded transition-colors"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(policy.id!)}
                  className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
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
