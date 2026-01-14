import React, { useState, useEffect } from 'react';
import {
  Activity,
  ArrowLeft,
  Filter,
  Download,
  Search,
  RefreshCw,
  AlertCircle,
  Upload,
  MousePointer,
  Navigation,
  Star,
  FileText,
  X
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { assignmentTrackingService, TrackingFilters } from '../../services/assignmentTrackingService';
import toast from 'react-hot-toast';

export function AssignmentActionsTrackerPage() {
  const navigate = useNavigate();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [actions, setActions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<TrackingFilters>({
    limit: 100,
    offset: 0,
  });

  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFromFilter, setDateFromFilter] = useState('');
  const [dateToFilter, setDateToFilter] = useState('');

  // Summary states
  const [showSummary, setShowSummary] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [summaryByStudent, setSummaryByStudent] = useState<any[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [summaryByAssignment, setSummaryByAssignment] = useState<any[]>([]);

  useEffect(() => {
    fetchActions();
  }, [filters]);

  const fetchActions = async () => {
    setLoading(true);
    try {
      const data = await assignmentTrackingService.getActions(filters);
      setActions(data);
    } catch (error) {
      console.error('Error fetching actions:', error);
      toast.error('Failed to load action tracking data');
    } finally {
      setLoading(false);
    }
  };

  const handleApplyFilters = () => {
    setFilters({
      date_from: dateFromFilter || undefined,
      date_to: dateToFilter || undefined,
      limit: 500, // Fetch more for client-side filtering
      offset: 0,
    });
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setDateFromFilter('');
    setDateToFilter('');
    setFilters({ limit: 500, offset: 0 });
  };

  // Filter actions locally based on search query
  const filteredActions = actions.filter(action => {
    if (!searchQuery) return true;

    const query = searchQuery.toLowerCase();

    return (
      action.student_email?.toLowerCase().includes(query) ||
      action.student_name?.toLowerCase().includes(query) ||
      action.batch?.toLowerCase().includes(query) ||
      action.action_type?.toLowerCase().includes(query) ||
      action.action_category?.toLowerCase().includes(query) ||
      action.action_description?.toLowerCase().includes(query) ||
      action.assignment_name?.toLowerCase().includes(query) ||
      action.assignment_subject?.toLowerCase().includes(query) ||
      action.term?.toLowerCase().includes(query) ||
      action.page_section?.toLowerCase().includes(query) ||
      JSON.stringify(action.metadata || {}).toLowerCase().includes(query)
    );
  });

  const handleExportCSV = () => {
    if (filteredActions.length === 0) {
      toast.error('No data to export');
      return;
    }

    const headers = [
      'Timestamp',
      'Student Email',
      'Student Name',
      'Batch',
      'Action Type',
      'Action Category',
      'Description',
      'Assignment ID',
      'Assignment Name',
      'Subject',
      'Term',
      'Page Section',
      'Metadata'
    ];

    const csvContent = [
      headers.join(','),
      ...filteredActions.map(action => [
        new Date(action.timestamp).toLocaleString(),
        action.student_email,
        action.student_name || '',
        action.batch || '',
        action.action_type,
        action.action_category,
        `"${action.action_description.replace(/"/g, '""')}"`,
        action.assignment_id || '',
        action.assignment_name ? `"${action.assignment_name.replace(/"/g, '""')}"` : '',
        action.assignment_subject || '',
        action.term || '',
        action.page_section || '',
        action.metadata ? `"${JSON.stringify(action.metadata).replace(/"/g, '""')}"` : ''
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `assignment_actions_${new Date().toISOString()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success(`Exported ${filteredActions.length} action${filteredActions.length === 1 ? '' : 's'} to CSV`);
  };

  const fetchSummary = async () => {
    setShowSummary(true);
    try {
      const [studentSummary, assignmentSummary] = await Promise.all([
        assignmentTrackingService.getActionSummaryByStudent(),
        assignmentTrackingService.getActionSummaryByAssignment(),
      ]);
      setSummaryByStudent(studentSummary);
      setSummaryByAssignment(assignmentSummary);
    } catch (error) {
      console.error('Error fetching summary:', error);
      toast.error('Failed to load summary data');
    }
  };

  const getActionCategoryIcon = (category: string) => {
    switch (category) {
      case 'click':
        return <MousePointer className="w-4 h-4" />;
      case 'upload':
        return <Upload className="w-4 h-4" />;
      case 'error':
        return <AlertCircle className="w-4 h-4" />;
      case 'navigation':
        return <Navigation className="w-4 h-4" />;
      case 'rating':
        return <Star className="w-4 h-4" />;
      case 'form':
        return <FileText className="w-4 h-4" />;
      default:
        return <Activity className="w-4 h-4" />;
    }
  };

  const getActionCategoryColor = (category: string) => {
    switch (category) {
      case 'click':
        return 'bg-blue-500';
      case 'upload':
        return 'bg-green-500';
      case 'error':
        return 'bg-red-500';
      case 'navigation':
        return 'bg-purple-500';
      case 'rating':
        return 'bg-yellow-500';
      case 'form':
        return 'bg-cyan-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate('/admin/assignments')}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Assignment Management</span>
        </button>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl">
              <Activity className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Assignment Actions Tracker</h1>
              <p className="text-muted-foreground">Comprehensive tracking of all student actions in the Assignment Platform</p>
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={() => fetchSummary()}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Activity className="w-4 h-4" />
              View Summary
            </Button>
            <Button
              onClick={handleExportCSV}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Export CSV
            </Button>
            <Button
              onClick={() => fetchActions()}
              variant="outline"
              className="flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </Button>
          </div>
        </div>
      </div>

      {/* Universal Search & Filters */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="w-5 h-5" />
            Search & Filter
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Universal Search Bar */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-foreground mb-2">
              Universal Search
              <span className="text-xs text-muted-foreground ml-2">
                (Search across email, name, batch, subject, action type, description, and more)
              </span>
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search anything... (e.g., student email, action type, subject, batch, error message)"
                className="w-full pl-10 pr-4 py-3 rounded-lg border-2 border-border bg-background text-foreground text-base focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>

          {/* Date Range Filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Date From</label>
              <input
                type="datetime-local"
                value={dateFromFilter}
                onChange={(e) => setDateFromFilter(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Date To</label>
              <input
                type="datetime-local"
                value={dateToFilter}
                onChange={(e) => setDateToFilter(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground"
              />
            </div>
          </div>

          <div className="flex gap-2">
            <Button onClick={handleApplyFilters} className="flex items-center gap-2">
              <Filter className="w-4 h-4" />
              Apply Date Filters
            </Button>
            <Button onClick={handleClearFilters} variant="outline">
              Clear All
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Actions Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            Recent Actions
            {searchQuery && (
              <span className="text-sm font-normal text-muted-foreground ml-2">
                ({filteredActions.length} of {actions.length} results)
              </span>
            )}
            {!searchQuery && (
              <span className="text-sm font-normal text-muted-foreground ml-2">
                ({actions.length} total)
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto text-muted-foreground" />
              <p className="text-muted-foreground mt-2">Loading actions...</p>
            </div>
          ) : filteredActions.length === 0 ? (
            <div className="text-center py-8">
              <AlertCircle className="w-8 h-8 mx-auto text-muted-foreground" />
              <p className="text-muted-foreground mt-2">
                {searchQuery ? `No actions found matching "${searchQuery}"` : 'No actions found'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 px-2 text-sm font-medium text-foreground">Timestamp</th>
                    <th className="text-left py-2 px-2 text-sm font-medium text-foreground">Student</th>
                    <th className="text-left py-2 px-2 text-sm font-medium text-foreground">Category</th>
                    <th className="text-left py-2 px-2 text-sm font-medium text-foreground">Action</th>
                    <th className="text-left py-2 px-2 text-sm font-medium text-foreground">Assignment</th>
                    <th className="text-left py-2 px-2 text-sm font-medium text-foreground">Metadata</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredActions.map((action, index) => (
                    <tr key={index} className="border-b border-border hover:bg-accent/50 transition-colors">
                      <td className="py-2 px-2 text-sm text-foreground">
                        {new Date(action.timestamp).toLocaleString()}
                      </td>
                      <td className="py-2 px-2 text-sm">
                        <div className="font-medium text-foreground">{action.student_name || 'N/A'}</div>
                        <div className="text-xs text-muted-foreground">{action.student_email}</div>
                        {action.batch && <div className="text-xs text-muted-foreground">{action.batch}</div>}
                      </td>
                      <td className="py-2 px-2">
                        <Badge className={`flex items-center gap-1 ${getActionCategoryColor(action.action_category)} text-white`}>
                          {getActionCategoryIcon(action.action_category)}
                          <span className="text-xs">{action.action_category}</span>
                        </Badge>
                      </td>
                      <td className="py-2 px-2">
                        <div className="text-sm font-medium text-foreground">{action.action_type}</div>
                        <div className="text-xs text-muted-foreground">{action.action_description}</div>
                      </td>
                      <td className="py-2 px-2 text-sm">
                        {action.assignment_name && (
                          <div>
                            <div className="font-medium text-foreground">{action.assignment_name}</div>
                            <div className="text-xs text-muted-foreground">{action.assignment_subject}</div>
                          </div>
                        )}
                      </td>
                      <td className="py-2 px-2 text-xs text-muted-foreground">
                        {action.metadata && (
                          <details>
                            <summary className="cursor-pointer hover:text-foreground">View JSON</summary>
                            <pre className="mt-1 p-2 bg-accent rounded text-xs overflow-x-auto">
                              {JSON.stringify(action.metadata, null, 2)}
                            </pre>
                          </details>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Summary Modal */}
      {showSummary && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-4xl max-h-[80vh] overflow-y-auto">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Action Summary</CardTitle>
                <button onClick={() => setShowSummary(false)} className="p-2 hover:bg-accent rounded-lg">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Summary by Student */}
                <div>
                  <h3 className="text-lg font-semibold mb-2">Summary by Student</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-2">Student</th>
                          <th className="text-right py-2">Total Actions</th>
                          <th className="text-right py-2">Errors</th>
                          <th className="text-right py-2">Uploads</th>
                          <th className="text-right py-2">Clicks</th>
                        </tr>
                      </thead>
                      <tbody>
                        {summaryByStudent.map((summary, index) => (
                          <tr key={index} className="border-b">
                            <td className="py-2">
                              <div className="font-medium">{summary.student_name}</div>
                              <div className="text-xs text-muted-foreground">{summary.student_email}</div>
                            </td>
                            <td className="text-right py-2 font-semibold">{summary.total_actions}</td>
                            <td className="text-right py-2 text-red-500">{summary.error_count}</td>
                            <td className="text-right py-2 text-green-500">{summary.upload_count}</td>
                            <td className="text-right py-2 text-blue-500">{summary.click_count}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Summary by Assignment */}
                <div>
                  <h3 className="text-lg font-semibold mb-2">Summary by Assignment</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-2">Assignment</th>
                          <th className="text-right py-2">Total Actions</th>
                          <th className="text-right py-2">Unique Students</th>
                          <th className="text-right py-2">Errors</th>
                          <th className="text-right py-2">Submissions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {summaryByAssignment.map((summary, index) => (
                          <tr key={index} className="border-b">
                            <td className="py-2">
                              <div className="font-medium">{summary.assignment_name}</div>
                              <div className="text-xs text-muted-foreground">{summary.assignment_subject}</div>
                            </td>
                            <td className="text-right py-2 font-semibold">{summary.total_actions}</td>
                            <td className="text-right py-2 text-purple-500">{summary.unique_students}</td>
                            <td className="text-right py-2 text-red-500">{summary.error_count}</td>
                            <td className="text-right py-2 text-green-500">{summary.submission_count}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

export default AssignmentActionsTrackerPage;
