import React, { useState, useEffect, useMemo } from 'react';
import { Search, Filter, Download, Activity, Video, FileText, Eye, ChevronDown, ChevronUp, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { activityService, UserActivityLog } from '../../services/supabaseClient';
import toast from 'react-hot-toast';

interface StudentSummary {
  email: string;
  name: string;
  batch: string;
  lastActive: string;
  totalActivities: number;
  activities: UserActivityLog[];
}

const PortalUsageTracker: React.FC = () => {
  const [activities, setActivities] = useState<UserActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchEmail, setSearchEmail] = useState('');
  const [filterBatch, setFilterBatch] = useState('');
  const [filterActionType, setFilterActionType] = useState('');
  const [isTimelineCollapsed, setIsTimelineCollapsed] = useState(false);
  const [isBatchListCollapsed, setIsBatchListCollapsed] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<StudentSummary | null>(null);
  const [showStudentModal, setShowStudentModal] = useState(false);

  // Get unique batches dynamically from activities
  const uniqueBatches = useMemo(() => {
    const batches = activities
      .map(a => a.batch)
      .filter((batch): batch is string => !!batch);
    return ['', ...Array.from(new Set(batches)).sort()];
  }, [activities]);

  // Get unique action types dynamically
  const uniqueActionTypes = useMemo(() => {
    const actionTypes = activities.map(a => a.action_type);
    return ['', ...Array.from(new Set(actionTypes)).sort()];
  }, [activities]);

  // Generate student summaries
  const studentSummaries = useMemo(() => {
    const studentMap = new Map<string, StudentSummary>();

    activities.forEach(activity => {
      const email = activity.student_email;
      if (!studentMap.has(email)) {
        // Extract name from email (before @)
        const name = email.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

        studentMap.set(email, {
          email,
          name,
          batch: activity.batch || 'N/A',
          lastActive: activity.timestamp || '',
          totalActivities: 0,
          activities: []
        });
      }

      const student = studentMap.get(email)!;
      student.totalActivities++;
      student.activities.push(activity);

      // Update last active if this activity is more recent
      if (activity.timestamp && (!student.lastActive || new Date(activity.timestamp) > new Date(student.lastActive))) {
        student.lastActive = activity.timestamp;
      }
    });

    // Sort by last active (most recent first)
    return Array.from(studentMap.values()).sort((a, b) =>
      new Date(b.lastActive).getTime() - new Date(a.lastActive).getTime()
    );
  }, [activities]);

  // Filter student summaries based on current filters
  const filteredStudentSummaries = useMemo(() => {
    return studentSummaries.filter(student => {
      if (searchEmail && !student.email.toLowerCase().includes(searchEmail.toLowerCase())) {
        return false;
      }
      if (filterBatch && student.batch !== filterBatch) {
        return false;
      }
      return true;
    });
  }, [studentSummaries, searchEmail, filterBatch]);

  useEffect(() => {
    fetchActivities();
  }, []);

  const fetchActivities = async () => {
    setLoading(true);
    try {
      const result = await activityService.getAllActivity(1000, {
        studentEmail: searchEmail || undefined,
        batch: filterBatch || undefined,
        actionType: filterActionType || undefined,
      });

      if (result.success && result.data) {
        setActivities(result.data);
      } else {
        toast.error('Failed to fetch activities');
      }
    } catch (error) {
      console.error('Error fetching activities:', error);
      toast.error('Error loading activity data');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    fetchActivities();
  };

  const handleClearFilters = () => {
    setSearchEmail('');
    setFilterBatch('');
    setFilterActionType('');
  };

  const handleExportCSV = () => {
    const csv = [
      ['Timestamp', 'Student Email', 'Batch', 'Action Type', 'Action Detail', 'Recording Name', 'Watch Duration (min)', 'Watch %', 'Status'],
      ...activities.map(a => [
        new Date(a.timestamp || '').toLocaleString(),
        a.student_email,
        a.batch || '',
        a.action_type,
        a.action_detail || '',
        a.recording_name || '',
        a.watch_duration_seconds ? (a.watch_duration_seconds / 60).toFixed(1) : '',
        a.watch_percentage ? a.watch_percentage.toFixed(1) : '',
        a.completion_status || '',
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `portal-usage-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    toast.success('Activity data exported!');
  };

  const handleExportBatchListCSV = () => {
    const csv = [
      ['Email', 'Name', 'Batch', 'Last Active', 'Total Activities'],
      ...filteredStudentSummaries.map(s => [
        s.email,
        s.name,
        s.batch,
        new Date(s.lastActive).toLocaleString(),
        s.totalActivities.toString(),
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `batch-list-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    toast.success('Batch list exported!');
  };

  const handleViewStudent = (student: StudentSummary) => {
    setSelectedStudent(student);
    setShowStudentModal(true);
  };

  const getActionIcon = (actionType: string) => {
    if (actionType.includes('recording')) return <Video className="h-4 w-4" />;
    if (actionType === 'form_interaction') return <FileText className="h-4 w-4" />;
    if (actionType === 'page_view') return <Eye className="h-4 w-4" />;
    return <Activity className="h-4 w-4" />;
  };

  const getActionColor = (actionType: string) => {
    if (actionType === 'recording_completed') return 'text-green-600 bg-green-50 dark:bg-green-900/20';
    if (actionType === 'recording_watched') return 'text-blue-600 bg-blue-50 dark:bg-blue-900/20';
    if (actionType === 'form_interaction') return 'text-purple-600 bg-purple-50 dark:bg-purple-900/20';
    if (actionType === 'page_view') return 'text-gray-600 bg-gray-50 dark:bg-gray-900/20';
    return 'text-orange-600 bg-orange-50 dark:bg-orange-900/20';
  };

  const hasActiveFilters = searchEmail || filterBatch || filterActionType;

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Portal Usage Tracker</h1>
            <p className="text-muted-foreground mt-1">Monitor student activity and engagement</p>
          </div>
          <Button onClick={handleExportCSV} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-4">
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">
                    Student Email
                  </label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input
                      type="text"
                      value={searchEmail}
                      onChange={(e) => setSearchEmail(e.target.value)}
                      placeholder="Search by email..."
                      className="w-full pl-10 pr-3 py-2 border border-border rounded-md bg-background text-foreground"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">
                    Batch
                  </label>
                  <select
                    value={filterBatch}
                    onChange={(e) => setFilterBatch(e.target.value)}
                    className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground"
                  >
                    <option value="">All Batches</option>
                    {uniqueBatches.slice(1).map(batch => (
                      <option key={batch} value={batch}>{batch}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">
                    Action Type
                  </label>
                  <select
                    value={filterActionType}
                    onChange={(e) => setFilterActionType(e.target.value)}
                    className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground"
                  >
                    <option value="">All Actions</option>
                    {uniqueActionTypes.slice(1).map(actionType => (
                      <option key={actionType} value={actionType}>
                        {actionType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-end gap-2">
                  <Button onClick={handleSearch} className="flex-1">
                    <Search className="h-4 w-4 mr-2" />
                    Search
                  </Button>
                  {hasActiveFilters && (
                    <Button onClick={handleClearFilters} variant="outline">
                      Clear
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Activity Timeline - Collapsible */}
        <Card>
          <CardHeader
            className="cursor-pointer hover:bg-accent/50 transition-colors"
            onClick={() => setIsTimelineCollapsed(!isTimelineCollapsed)}
          >
            <CardTitle className="flex items-center justify-between">
              <span>Activity Timeline</span>
              <div className="flex items-center gap-2">
                <span className="text-sm font-normal text-muted-foreground">
                  {activities.length} activities
                </span>
                {isTimelineCollapsed ? (
                  <ChevronDown className="h-5 w-5" />
                ) : (
                  <ChevronUp className="h-5 w-5" />
                )}
              </div>
            </CardTitle>
          </CardHeader>
          {!isTimelineCollapsed && (
            <CardContent>
              {loading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                  <p className="text-muted-foreground mt-4">Loading activities...</p>
                </div>
              ) : activities.length === 0 ? (
                <div className="text-center py-12">
                  <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No activity data found</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[600px] overflow-y-auto">
                  {activities.map((activity, index) => (
                    <div
                      key={activity.id || index}
                      className="flex items-start gap-4 p-4 rounded-lg border border-border hover:bg-accent/50 transition-colors"
                    >
                      <div className={`p-2 rounded-lg ${getActionColor(activity.action_type)}`}>
                        {getActionIcon(activity.action_type)}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <p className="font-medium text-foreground">
                              {activity.student_email}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {activity.action_detail || activity.action_type}
                            </p>
                            {activity.recording_name && (
                              <p className="text-xs text-muted-foreground mt-1">
                                📹 {activity.recording_name}
                              </p>
                            )}
                          </div>

                          <div className="text-right">
                            <p className="text-xs text-muted-foreground">
                              {new Date(activity.timestamp || '').toLocaleString()}
                            </p>
                            {activity.batch && (
                              <span className="inline-block mt-1 px-2 py-0.5 text-xs bg-primary/10 text-primary rounded">
                                {activity.batch}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Video engagement stats */}
                        {activity.watch_duration_seconds && activity.watch_duration_seconds > 0 && (
                          <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
                            <span>
                              ⏱️ {(activity.watch_duration_seconds / 60).toFixed(0)} min watched
                            </span>
                            {activity.watch_percentage && (
                              <span className={`font-medium ${
                                activity.watch_percentage >= 90 ? 'text-green-600' :
                                activity.watch_percentage >= 50 ? 'text-blue-600' :
                                'text-orange-600'
                              }`}>
                                {activity.watch_percentage.toFixed(1)}% completion
                              </span>
                            )}
                            {activity.completion_status && (
                              <span className={`px-2 py-0.5 rounded ${
                                activity.completion_status === 'completed' ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400' :
                                activity.completion_status === 'partial' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400' :
                                'bg-gray-100 text-gray-700 dark:bg-gray-900/20 dark:text-gray-400'
                              }`}>
                                {activity.completion_status}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          )}
        </Card>

        {/* Batch List - Collapsible Table */}
        <Card>
          <CardHeader
            className="cursor-pointer hover:bg-accent/50 transition-colors"
            onClick={() => setIsBatchListCollapsed(!isBatchListCollapsed)}
          >
            <CardTitle className="flex items-center justify-between">
              <span>Batch List</span>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleExportBatchListCSV();
                  }}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
                <span className="text-sm font-normal text-muted-foreground">
                  {filteredStudentSummaries.length} students
                </span>
                {isBatchListCollapsed ? (
                  <ChevronDown className="h-5 w-5" />
                ) : (
                  <ChevronUp className="h-5 w-5" />
                )}
              </div>
            </CardTitle>
          </CardHeader>
          {!isBatchListCollapsed && (
            <CardContent>
              {loading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                  <p className="text-muted-foreground mt-4">Loading student data...</p>
                </div>
              ) : filteredStudentSummaries.length === 0 ? (
                <div className="text-center py-12">
                  <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No students found</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b border-border bg-muted/50">
                        <th className="text-left p-3 text-sm font-semibold text-foreground">Email</th>
                        <th className="text-left p-3 text-sm font-semibold text-foreground">Name</th>
                        <th className="text-left p-3 text-sm font-semibold text-foreground">Batch</th>
                        <th className="text-left p-3 text-sm font-semibold text-foreground">Last Active</th>
                        <th className="text-center p-3 text-sm font-semibold text-foreground">Activities</th>
                        <th className="text-center p-3 text-sm font-semibold text-foreground">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredStudentSummaries.map((student, index) => (
                        <tr
                          key={student.email}
                          className="border-b border-border hover:bg-accent/50 transition-colors"
                        >
                          <td className="p-3 text-sm text-foreground">{student.email}</td>
                          <td className="p-3 text-sm text-foreground font-medium">{student.name}</td>
                          <td className="p-3">
                            <span className="inline-block px-2 py-1 text-xs bg-primary/10 text-primary rounded">
                              {student.batch}
                            </span>
                          </td>
                          <td className="p-3 text-sm text-muted-foreground">
                            {new Date(student.lastActive).toLocaleString()}
                          </td>
                          <td className="p-3 text-center">
                            <span className="inline-block px-2 py-1 text-xs bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400 rounded font-semibold">
                              {student.totalActivities}
                            </span>
                          </td>
                          <td className="p-3 text-center">
                            <button
                              onClick={() => handleViewStudent(student)}
                              className="inline-flex items-center justify-center p-2 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary transition-colors"
                              title={`View ${student.name}'s activities`}
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          )}
        </Card>
      </div>

      {/* Student Activity Modal */}
      {showStudentModal && selectedStudent && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-background rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-border">
              <div>
                <h2 className="text-2xl font-bold text-foreground">{selectedStudent.name}</h2>
                <p className="text-sm text-muted-foreground">{selectedStudent.email}</p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="inline-block px-2 py-1 text-xs bg-primary/10 text-primary rounded">
                    {selectedStudent.batch}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {selectedStudent.totalActivities} total activities
                  </span>
                </div>
              </div>
              <button
                onClick={() => setShowStudentModal(false)}
                className="p-2 hover:bg-accent rounded-lg transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Content - Activity List */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-3">
                {selectedStudent.activities
                  .sort((a, b) => new Date(b.timestamp || '').getTime() - new Date(a.timestamp || '').getTime())
                  .map((activity, index) => (
                    <div
                      key={activity.id || index}
                      className="flex items-start gap-4 p-4 rounded-lg border border-border bg-card"
                    >
                      <div className={`p-2 rounded-lg ${getActionColor(activity.action_type)}`}>
                        {getActionIcon(activity.action_type)}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <p className="font-medium text-foreground">
                              {activity.action_type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {activity.action_detail || activity.action_type}
                            </p>
                            {activity.recording_name && (
                              <p className="text-xs text-muted-foreground mt-1">
                                📹 {activity.recording_name}
                              </p>
                            )}
                          </div>

                          <div className="text-right">
                            <p className="text-xs text-muted-foreground">
                              {new Date(activity.timestamp || '').toLocaleString()}
                            </p>
                          </div>
                        </div>

                        {/* Video engagement stats */}
                        {activity.watch_duration_seconds && activity.watch_duration_seconds > 0 && (
                          <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
                            <span>
                              ⏱️ {(activity.watch_duration_seconds / 60).toFixed(0)} min watched
                            </span>
                            {activity.watch_percentage && (
                              <span className={`font-medium ${
                                activity.watch_percentage >= 90 ? 'text-green-600' :
                                activity.watch_percentage >= 50 ? 'text-blue-600' :
                                'text-orange-600'
                              }`}>
                                {activity.watch_percentage.toFixed(1)}% completion
                              </span>
                            )}
                            {activity.completion_status && (
                              <span className={`px-2 py-0.5 rounded ${
                                activity.completion_status === 'completed' ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400' :
                                activity.completion_status === 'partial' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400' :
                                'bg-gray-100 text-gray-700 dark:bg-gray-900/20 dark:text-gray-400'
                              }`}>
                                {activity.completion_status}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PortalUsageTracker;
