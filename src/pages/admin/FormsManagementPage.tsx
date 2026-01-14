import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import {
  ListChecks,
  Plus,
  Edit,
  Trash2,
  Copy,
  BarChart3,
  AlertCircle,
  CheckCircle2,
  Clock,
  Search,
  Filter
} from 'lucide-react';
import toast from 'react-hot-toast';
import { getForms, deleteForm, duplicateForm, updateFormStatus, type Form as ApiForm } from '../../services/formsApi';

export function FormsManagementPage() {
  const navigate = useNavigate();
  const [forms, setForms] = useState<ApiForm[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    fetchForms();
  }, []);

  const fetchForms = async () => {
    try {
      setLoading(true);
      // Admin panel: show ALL forms (Draft, Published, Archived, expired)
      const result = await getForms({ includeAllStatuses: true });

      if (result.success && result.data) {
        setForms(result.data);
      } else {
        toast.error(result.error || 'Failed to load forms');
      }
    } catch (error) {
      console.error('Error fetching forms:', error);
      toast.error('Failed to load forms');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateForm = () => {
    navigate('/admin/forms/new');
  };

  const handleEditForm = (formId: string) => {
    navigate(`/admin/forms/${formId}/edit`);
  };

  const handleDeleteForm = async (formId: string) => {
    if (window.confirm('Are you sure you want to archive this form?')) {
      try {
        const result = await deleteForm(formId);

        if (result.success) {
          toast.success('Form archived successfully');
          fetchForms(); // Refresh list
        } else {
          toast.error(result.error || 'Failed to archive form');
        }
      } catch (error) {
        console.error('Error deleting form:', error);
        toast.error('Failed to archive form');
      }
    }
  };

  const handleDuplicateForm = async (formId: string) => {
    try {
      const result = await duplicateForm(formId);

      if (result.success) {
        toast.success('Form duplicated successfully');
        fetchForms(); // Refresh list
      } else {
        toast.error(result.error || 'Failed to duplicate form');
      }
    } catch (error) {
      console.error('Error duplicating form:', error);
      toast.error('Failed to duplicate form');
    }
  };

  const handleViewResponses = (formId: string) => {
    navigate(`/admin/forms/${formId}/responses`);
  };

  const handleStatusChange = async (formId: string, newStatus: string) => {
    try {
      // Optimistic update
      setForms(prevForms =>
        prevForms.map(form =>
          form.id === formId ? { ...form, status: newStatus } : form
        )
      );

      const result = await updateFormStatus(formId, newStatus);

      if (result.success) {
        toast.success(`Form status changed to ${newStatus}`);
      } else {
        // Revert on error
        fetchForms();
        toast.error(result.error || 'Failed to update status');
      }
    } catch (error) {
      console.error('Error updating status:', error);
      fetchForms();
      toast.error('Failed to update status');
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _getStatusBadge = (status: string) => {
    switch (status) {
      case 'Published':
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300">Published</Badge>;
      case 'Draft':
        return <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300">Draft</Badge>;
      case 'Closed':
        return <Badge className="bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300">Closed</Badge>;
      case 'Archived':
        return <Badge className="bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300">Archived</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const filteredForms = forms.filter((form: ApiForm) => {
    // Apply status filter
    if (statusFilter !== 'all' && form.status !== statusFilter) return false;

    // Apply search filter
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      return (
        form.name.toLowerCase().includes(searchLower) ||
        form.type.toLowerCase().includes(searchLower) ||
        form.batch.toLowerCase().includes(searchLower)
      );
    }

    return true;
  });

  const stats = {
    total: forms.length,
    published: forms.filter(f => f.status === 'Published').length,
    draft: forms.filter(f => f.status === 'Draft').length,
    totalResponses: forms.reduce((sum, f) => sum + f.totalResponses, 0)
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading forms...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
            <ListChecks className="h-8 w-8 text-primary" />
            Form Management
          </h1>
          <p className="text-muted-foreground mt-1">
            Create and manage dynamic forms, surveys, and feedback
          </p>
        </div>
        <Button onClick={handleCreateForm} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Create New Form
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <ListChecks className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-2xl font-bold text-foreground">{stats.total}</p>
                <p className="text-sm text-muted-foreground">Total Forms</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-2xl font-bold text-foreground">{stats.published}</p>
                <p className="text-sm text-muted-foreground">Published</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-yellow-600" />
              <div>
                <p className="text-2xl font-bold text-foreground">{stats.draft}</p>
                <p className="text-sm text-muted-foreground">Drafts</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              <div>
                <p className="text-2xl font-bold text-foreground">{stats.totalResponses}</p>
                <p className="text-sm text-muted-foreground">Total Responses</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search forms..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-input rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 border border-input rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="all">All Status</option>
                <option value="Published">Published</option>
                <option value="Draft">Draft</option>
                <option value="Closed">Closed</option>
                <option value="Archived">Archived</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Forms List */}
      {filteredForms.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">No forms found</h3>
            <p className="text-muted-foreground mb-4">
              {searchTerm ? 'Try adjusting your search' : 'Get started by creating your first form'}
            </p>
            {!searchTerm && (
              <Button onClick={handleCreateForm} className="flex items-center gap-2 mx-auto">
                <Plus className="h-4 w-4" />
                Create New Form
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredForms.map((form) => (
            <Card
              key={form.id}
              className="hover:shadow-lg transition-all"
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 rounded-lg bg-primary/10 text-primary">
                        <ListChecks className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="text-xl font-semibold text-foreground">{form.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {form.type} • Created by {form.createdBy}
                        </p>
                      </div>
                    </div>

                    {form.description && (
                      <p className="text-muted-foreground mb-3 ml-14">{form.description}</p>
                    )}

                    <div className="flex flex-wrap gap-2 ml-14">
                      {/* Status Dropdown */}
                      <select
                        value={form.status}
                        onChange={(e) => handleStatusChange(form.id, e.target.value)}
                        className={`px-3 py-1 rounded-full text-xs font-medium border-0 cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary ${
                          form.status === 'Published'
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300'
                            : form.status === 'Draft'
                            ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300'
                            : form.status === 'Closed'
                            ? 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
                            : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300'
                        }`}
                      >
                        <option value="Published">Published</option>
                        <option value="Draft">Draft</option>
                        <option value="Closed">Closed</option>
                        <option value="Archived">Archived</option>
                      </select>

                      {form.isActive === 'Yes' && (
                        <Badge variant="outline" className="bg-green-50 text-green-700 dark:bg-green-900/20">
                          Active
                        </Badge>
                      )}

                      {form.showAtStartUntilFilled === 'Yes' && (
                        <Badge className="bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300">
                          Required at Startup
                        </Badge>
                      )}

                      <Badge variant="outline">{form.batch}</Badge>

                      <Badge variant="outline" className="flex items-center gap-1">
                        <BarChart3 className="h-3 w-3" />
                        {form.totalResponses} responses
                      </Badge>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 ml-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewResponses(form.id)}
                      className="flex items-center gap-1"
                    >
                      <BarChart3 className="h-4 w-4" />
                      Responses
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditForm(form.id)}
                      className="flex items-center gap-1"
                    >
                      <Edit className="h-4 w-4" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDuplicateForm(form.id)}
                      className="flex items-center gap-1"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteForm(form.id)}
                      className="flex items-center gap-1 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

export default FormsManagementPage;
