import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import {
  ArrowLeft,
  ExternalLink,
  Download,
  Users,
  Calendar,
  Briefcase,
  MapPin,
  DollarSign,
  FileText
} from 'lucide-react';
import { apiService } from '../../services/api';
import toast from 'react-hot-toast';
import { formatDateTimeBackend } from '../../utils/dateUtils';

interface JobPosting {
  jobId: string;
  batch: string;
  type: string;
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
  questions: Array<{
    number: number;
    text: string;
    type: string;
    options?: string;
    required: string;
  }>;
}

interface JobResponse {
  timestamp: string;
  studentName: string;
  studentEmail: string;
  rollNumber: string;
  answers: Record<string, string>;
  assignmentFileUrl?: string;
}

export const JobResponsesPage: React.FC = () => {
  const { jobId } = useParams<{ jobId: string }>();
  const navigate = useNavigate();
  const [job, setJob] = useState<JobPosting | null>(null);
  const [responses, setResponses] = useState<JobResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedResponse, setSelectedResponse] = useState<JobResponse | null>(null);

  useEffect(() => {
    if (jobId) {
      fetchJobDetails();
    }
  }, [jobId]);

  const fetchJobDetails = async () => {
    try {
      setLoading(true);
      const result = await apiService.getJobPosting(jobId!);

      if (result.success && result.data) {
        setJob(result.data);
        // In a full implementation, you would fetch responses from the response sheet
        // For now, we'll just show the job details
        setResponses([]);
      } else {
        toast.error('Failed to load job details');
      }
    } catch (error) {
      console.error('Error fetching job details:', error);
      toast.error('Error loading job details');
    } finally {
      setLoading(false);
    }
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

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading job details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-12 text-center">
            <Briefcase className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-20" />
            <h3 className="text-lg font-semibold mb-2">Job not found</h3>
            <p className="text-muted-foreground mb-4">The requested job posting could not be found.</p>
            <Button onClick={() => navigate('/admin/jobs')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Job Portal
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => navigate('/admin/jobs')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Job Applications</h1>
            <p className="text-muted-foreground mt-1">{job.company} - {job.role}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => window.open(job.sheetsLink, '_blank')}
            className="gap-2"
          >
            <ExternalLink className="w-4 h-4" />
            View in Sheets
          </Button>
          <Button
            variant="outline"
            onClick={() => navigate(`/admin/jobs/${jobId}/edit`)}
            className="gap-2"
          >
            Edit Job
          </Button>
        </div>
      </div>

      {/* Job Details Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-3">
              <Briefcase className="w-6 h-6" />
              Job Details
            </CardTitle>
            <div className="flex items-center gap-2">
              <Badge className={getTypeColor(job.type)}>{job.type}</Badge>
              <Badge className={getStatusColor(job.status)}>{job.status}</Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="flex items-start gap-3">
              <Briefcase className="w-5 h-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm text-muted-foreground">Company</p>
                <p className="font-semibold">{job.company}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <FileText className="w-5 h-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm text-muted-foreground">Role</p>
                <p className="font-semibold">{job.role}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm text-muted-foreground">Location</p>
                <p className="font-semibold">{job.location} ({job.workMode})</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <DollarSign className="w-5 h-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm text-muted-foreground">Compensation</p>
                <p className="font-semibold">{job.compensationDisplay || job.ctcDisplay}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Calendar className="w-5 h-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm text-muted-foreground">Application Deadline</p>
                <p className="font-semibold">{formatDateTimeBackend(job.applicationEndTime)}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Users className="w-5 h-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm text-muted-foreground">Batch</p>
                <p className="font-semibold">{job.batch}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Applications</p>
                <p className="text-2xl font-bold">{job.applicationsCount || 0}</p>
              </div>
              <Users className="w-8 h-8 text-primary opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Questions</p>
                <p className="text-2xl font-bold">{job.questions?.length || 0}</p>
              </div>
              <FileText className="w-8 h-8 text-blue-600 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Job ID</p>
                <p className="text-lg font-bold">{job.jobId}</p>
              </div>
              <Briefcase className="w-8 h-8 text-purple-600 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Source</p>
                <p className="text-lg font-bold">{job.source}</p>
              </div>
              <ExternalLink className="w-8 h-8 text-orange-600 opacity-20" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Applications Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-3">
              <Users className="w-6 h-6" />
              Applications
            </CardTitle>
            <Button variant="outline" className="gap-2" disabled>
              <Download className="w-4 h-4" />
              Export CSV
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {responses.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-20" />
              <h3 className="text-lg font-semibold mb-2">No applications yet</h3>
              <p className="text-muted-foreground mb-4">
                Applications will appear here once students start applying.
              </p>
              <Button
                variant="outline"
                onClick={() => window.open(job.sheetsLink, '_blank')}
                className="gap-2"
              >
                <ExternalLink className="w-4 h-4" />
                View Response Sheet
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3 font-semibold">#</th>
                    <th className="text-left p-3 font-semibold">Timestamp</th>
                    <th className="text-left p-3 font-semibold">Student Name</th>
                    <th className="text-left p-3 font-semibold">Email</th>
                    <th className="text-left p-3 font-semibold">Roll Number</th>
                    <th className="text-left p-3 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {responses.map((response, index) => (
                    <tr key={index} className="border-b hover:bg-muted/50">
                      <td className="p-3">{index + 1}</td>
                      <td className="p-3">{response.timestamp}</td>
                      <td className="p-3">{response.studentName}</td>
                      <td className="p-3">{response.studentEmail}</td>
                      <td className="p-3">{response.rollNumber}</td>
                      <td className="p-3">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedResponse(response)}
                        >
                          View
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Questions List */}
      {job.questions && job.questions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <FileText className="w-6 h-6" />
              Application Questions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {job.questions.map((question, index) => (
                <div key={index} className="border-l-4 border-primary pl-4 py-2">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="font-semibold text-foreground">
                        Q{question.number}: {question.text}
                      </p>
                      <div className="flex items-center gap-4 mt-2">
                        <Badge variant="outline" className="text-xs">
                          {question.type}
                        </Badge>
                        {question.required === 'Yes' && (
                          <Badge variant="outline" className="text-xs bg-red-50 text-red-600 dark:bg-red-900/20">
                            Required
                          </Badge>
                        )}
                      </div>
                      {question.options && (
                        <p className="text-sm text-muted-foreground mt-2">
                          Options: {question.options}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Response Detail Modal */}
      {selectedResponse && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Application Details</CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedResponse(null)}
                >
                  Close
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Student Name</p>
                  <p className="font-semibold">{selectedResponse.studentName}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-semibold">{selectedResponse.studentEmail}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Roll Number</p>
                  <p className="font-semibold">{selectedResponse.rollNumber}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Submitted At</p>
                  <p className="font-semibold">{selectedResponse.timestamp}</p>
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-semibold mb-3">Responses</h4>
                <div className="space-y-3">
                  {Object.entries(selectedResponse.answers).map(([question, answer], index) => (
                    <div key={index} className="bg-muted/30 p-3 rounded-lg">
                      <p className="text-sm font-medium text-muted-foreground mb-1">{question}</p>
                      <p className="text-foreground">{answer}</p>
                    </div>
                  ))}
                </div>
              </div>

              {selectedResponse.assignmentFileUrl && (
                <div className="border-t pt-4">
                  <h4 className="font-semibold mb-2">Assignment Submission</h4>
                  <Button
                    variant="outline"
                    onClick={() => window.open(selectedResponse.assignmentFileUrl, '_blank')}
                    className="gap-2"
                  >
                    <ExternalLink className="w-4 h-4" />
                    View Assignment File
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default JobResponsesPage;
