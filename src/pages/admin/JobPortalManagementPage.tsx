import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import {
  Plus,
  Edit,
  Trash2,
  Eye,
  Briefcase,
  MapPin,
  Calendar,
  Users,
  Filter,
  ExternalLink
} from 'lucide-react';
import { apiService } from '../../services/api';
import toast from 'react-hot-toast';
import { formatDateTimeBackend } from '../../utils/dateUtils';

interface JobPosting {
  jobId: string;
  batch: string;
  type: string;
  placementType: string;
  source: string;
  company: string;
  role: string;
  location: string;
  workMode: string;
  ctcDisplay: string;
  compensationDisplay: string;
  applicationStartTime: string;
  applicationEndTime: string;
  status: string;
  applicationsCount: number;
  driveLink: string;
  sheetsLink: string;
  createdAt: string;
}

export const JobPortalManagementPage: React.FC = () => {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState<JobPosting[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<string>('All');
  const [filterStatus, setFilterStatus] = useState<string>('All');
  const [filterBatch, setFilterBatch] = useState<string>('All');

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const result = await apiService.getAllJobPostings();

      if (result.success && result.data) {
        setJobs(result.data);
      } else {
        toast.error('Failed to load job postings');
      }
    } catch (error) {
      console.error('Error fetching jobs:', error);
      toast.error('Error loading job postings');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (jobId: string) => {
    if (!window.confirm(`Are you sure you want to delete job ${jobId}?`)) {
      return;
    }

    try {
      const result = await apiService.deleteJobPosting(jobId);

      if (result.success) {
        toast.success('Job posting deleted successfully');
        fetchJobs();
      } else {
        toast.error(result.error || 'Failed to delete job');
      }
    } catch (error) {
      console.error('Error deleting job:', error);
      toast.error('Error deleting job');
    }
  };

  const getFilteredJobs = () => {
    return jobs.filter(job => {
      if (filterType !== 'All' && job.type !== filterType) return false;
      if (filterStatus !== 'All' && job.status !== filterStatus) return false;
      if (filterBatch !== 'All' && job.batch !== filterBatch) return false;
      return true;
    });
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'active': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300';
      case 'draft': return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300';
      case 'expired': return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300';
      case 'archived': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'Internship': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300';
      case 'Full-Time': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300';
      case 'Contract': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300';
    }
  };

  const filteredJobs = getFilteredJobs();
  const uniqueBatches = Array.from(new Set(jobs.map(j => j.batch).filter(Boolean)));

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading job postings...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Job Portal</h1>
          <p className="text-muted-foreground mt-1">Manage placement opportunities</p>
        </div>
        <a
          href="/admin/jobs/new"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
        >
          <Plus className="w-4 h-4" />
          Create Job Posting
        </a>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Jobs</p>
                <p className="text-2xl font-bold">{jobs.length}</p>
              </div>
              <Briefcase className="w-8 h-8 text-primary opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active</p>
                <p className="text-2xl font-bold text-green-600">
                  {jobs.filter(j => j.status === 'Active').length}
                </p>
              </div>
              <Briefcase className="w-8 h-8 text-green-600 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Applications</p>
                <p className="text-2xl font-bold text-blue-600">
                  {jobs.reduce((sum, j) => sum + (j.applicationsCount || 0), 0)}
                </p>
              </div>
              <Users className="w-8 h-8 text-blue-600 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Drafts</p>
                <p className="text-2xl font-bold text-gray-600">
                  {jobs.filter(j => j.status === 'Draft').length}
                </p>
              </div>
              <Briefcase className="w-8 h-8 text-gray-600 opacity-20" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            <CardTitle>Filters</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Type</label>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg bg-background"
              >
                <option value="All">All Types</option>
                <option value="Internship">Internship</option>
                <option value="Full-Time">Full-Time</option>
                <option value="Contract">Contract</option>
              </select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Status</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg bg-background"
              >
                <option value="All">All Status</option>
                <option value="Active">Active</option>
                <option value="Draft">Draft</option>
                <option value="Expired">Expired</option>
                <option value="Archived">Archived</option>
              </select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Batch</label>
              <select
                value={filterBatch}
                onChange={(e) => setFilterBatch(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg bg-background"
              >
                <option value="All">All Batches</option>
                {uniqueBatches.map(batch => (
                  <option key={batch} value={batch}>{batch}</option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Job Listings */}
      <div className="space-y-4">
        {filteredJobs.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Briefcase className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-20" />
              <h3 className="text-lg font-semibold mb-2">No job postings found</h3>
              <p className="text-muted-foreground mb-4">
                {jobs.length === 0
                  ? 'Get started by creating your first job posting'
                  : 'Try adjusting your filters'}
              </p>
              {jobs.length === 0 && (
                <a
                  href="/admin/jobs/new"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create Job Posting
                </a>
              )}
            </CardContent>
          </Card>
        ) : (
          filteredJobs.map(job => (
            <Card key={job.jobId} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-start gap-3 mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-xl font-bold text-foreground">
                            {job.company} - {job.role}
                          </h3>
                          <Badge className={getTypeColor(job.type)}>{job.type}</Badge>
                          {job.placementType && (
                            <Badge className={
                              job.placementType === 'Dream Company'
                                ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300'
                                : 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300'
                            }>
                              {job.placementType}
                            </Badge>
                          )}
                          <Badge className={getStatusColor(job.status)}>{job.status}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-3">Job ID: {job.jobId}</p>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div className="flex items-center gap-2 text-sm">
                            <MapPin className="w-4 h-4 text-muted-foreground" />
                            <span>{job.location} ({job.workMode})</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <span className="text-base font-semibold text-muted-foreground">₹</span>
                            <span>{job.compensationDisplay || job.ctcDisplay}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <Calendar className="w-4 h-4 text-muted-foreground" />
                            <span>Deadline: {formatDateTimeBackend(job.applicationEndTime)}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <Users className="w-4 h-4 text-muted-foreground" />
                            <span>{job.applicationsCount || 0} applications</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 ml-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(job.sheetsLink, '_blank')}
                      title="View Responses"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/admin/jobs/${job.jobId}/responses`)}
                      title="View Details"
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/admin/jobs/${job.jobId}/edit`)}
                      title="Edit"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(job.jobId)}
                      className="text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default JobPortalManagementPage;
