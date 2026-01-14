import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import {
  Briefcase,
  MapPin,
  Calendar,
  IndianRupee,
  Building2,
  Filter,
  Search,
  X,
  ExternalLink,
  Upload,
  FileText,
  CheckCircle2
} from 'lucide-react';
import { apiService } from '../../services/api';
import { formatDateTimeBackend } from '../../utils/dateUtils';
import { auth } from '../../firebase/config';
import toast from 'react-hot-toast';

interface Job {
  jobId: string;
  company: string;
  role: string;
  location: string;
  workMode: string;
  type: string;
  compensationDisplay: string;
  applicationEndTime: string;
  status: string;
  jdHTML?: string;
}

type TabType = 'active' | 'upcoming' | 'expired' | 'applied';

const JobOpeningsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('active');
  const [jobs, setJobs] = useState<Job[]>([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [tabLoading, setTabLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [showApplicationModal, setShowApplicationModal] = useState(false);
  const [applicationData, setApplicationData] = useState({
    coverLetter: '',
    resumeFile: null as File | null,
    additionalFile: null as File | null,
    answers: {} as Record<string, string>
  });
  const [submitting, setSubmitting] = useState(false);
  const user = auth.currentUser;

  useEffect(() => {
    if (initialLoading) {
      fetchJobs(true);
    } else {
      fetchJobs(false);
    }
  }, [activeTab]);

  const fetchJobs = async (isInitial: boolean = false) => {
    try {
      if (isInitial) {
        setInitialLoading(true);
      } else {
        setTabLoading(true);
      }

      const result = await apiService.getAllJobPostings();

      if (result.success && result.data) {
        const now = new Date();
        const filtered = result.data.filter((job: Job) => {
          const endDate = new Date(job.applicationEndTime);

          switch (activeTab) {
            case 'active':
              return job.status === 'Active' && endDate > now;
            case 'upcoming':
              return job.status === 'Draft';
            case 'expired':
              return job.status === 'Expired' || endDate < now;
            case 'applied':
              return false;
            default:
              return true;
          }
        });

        setJobs(filtered);
      } else {
        toast.error('Failed to load job openings');
      }
    } catch (error) {
      console.error('Error fetching jobs:', error);
      toast.error('Error loading jobs');
    } finally {
      if (isInitial) {
        setInitialLoading(false);
      } else {
        setTabLoading(false);
      }
    }
  };

  const filteredJobs = jobs.filter((job) =>
    job.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
    job.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
    job.location.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleApplyClick = (job: Job) => {
    setSelectedJob(job);
    setShowApplicationModal(true);
  };

  const handleSubmitApplication = async () => {
    if (!user || !selectedJob) {
      toast.error('Please login to apply');
      return;
    }

    if (!applicationData.resumeFile) {
      toast.error('Please upload your resume');
      return;
    }

    if (!applicationData.coverLetter.trim()) {
      toast.error('Please write a cover letter');
      return;
    }

    try {
      setSubmitting(true);

      // Convert files to base64
      const resumeBase64 = await fileToBase64(applicationData.resumeFile);
      const additionalFileBase64 = applicationData.additionalFile
        ? await fileToBase64(applicationData.additionalFile)
        : null;

      const application = {
        jobId: selectedJob.jobId,
        studentEmail: user.email,
        studentName: user.displayName,
        coverLetter: applicationData.coverLetter,
        resumeFileName: applicationData.resumeFile.name,
        resumeData: resumeBase64,
        additionalFileName: applicationData.additionalFile?.name,
        additionalFileData: additionalFileBase64,
        answers: applicationData.answers,
        timestamp: new Date().toISOString()
      };

      const result = await apiService.submitJobApplication(application);

      if (result.success) {
        toast.success('Application submitted successfully!');
        setShowApplicationModal(false);
        setApplicationData({
          coverLetter: '',
          resumeFile: null,
          additionalFile: null,
          answers: {}
        });
        // Refresh jobs to update applied status
        fetchJobs();
      } else {
        toast.error(result.error || 'Failed to submit application');
      }
    } catch (error) {
      console.error('Error submitting application:', error);
      toast.error('Error submitting application');
    } finally {
      setSubmitting(false);
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const base64 = reader.result as string;
        resolve(base64.split(',')[1]);
      };
      reader.onerror = (error) => reject(error);
    });
  };

  const tabs = [
    { id: 'active', label: 'Active', count: jobs.filter(j => j.status === 'Active').length },
    { id: 'upcoming', label: 'Upcoming', count: jobs.filter(j => j.status === 'Draft').length },
    { id: 'expired', label: 'Expired', count: jobs.filter(j => j.status === 'Expired').length },
    { id: 'applied', label: 'Applied', count: 0 },
  ];

  if (initialLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-12 h-12 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-sm text-muted-foreground">Loading job openings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Job Openings</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Browse and apply to placement opportunities
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="flex gap-1">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabType)}
                className={`
                  flex items-center gap-2 px-6 py-3 rounded-t-lg font-medium transition-all
                  ${isActive
                    ? 'bg-card text-primary border-t border-l border-r border-border'
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
                  }
                `}
              >
                <span>{tab.label}</span>
                {tab.count > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    {tab.count}
                  </Badge>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content Wrapper */}
      <div className="bg-card border-t border-border p-6 space-y-6">
        {/* Search and Filters */}
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by company, role, or location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border rounded-lg bg-card focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </div>
          <Button variant="outline" className="gap-2">
            <Filter size={16} />
            Filters
          </Button>
        </div>

        {/* Job Grid */}
        {tabLoading ? (
          <div className="flex items-center justify-center min-h-[300px]">
            <div className="text-center">
              <div className="w-10 h-10 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
              <p className="text-sm text-muted-foreground">Loading jobs...</p>
            </div>
          </div>
        ) : filteredJobs.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center">
              <Briefcase size={48} className="text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">
                No jobs found
              </h3>
              <p className="text-sm text-muted-foreground">
                {activeTab === 'active' && 'There are no active job openings at the moment'}
                {activeTab === 'upcoming' && 'No upcoming jobs scheduled'}
                {activeTab === 'expired' && 'No expired jobs'}
                {activeTab === 'applied' && "You haven't applied to any jobs yet"}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {filteredJobs.map((job) => (
              <Card
                key={job.jobId}
                className="hover:shadow-lg transition-all cursor-pointer group"
                onClick={() => setSelectedJob(job)}
              >
                <CardContent className="p-5">
                  <div className="flex items-start gap-4 mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                      {job.company.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-foreground text-base mb-1 truncate group-hover:text-blue-600 transition-colors">
                        {job.role}
                      </h3>
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <Building2 size={14} />
                        {job.company}
                      </p>
                    </div>
                    <Badge variant={job.status === 'Active' ? 'default' : 'secondary'}>
                      {job.status}
                    </Badge>
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin size={16} />
                      <span>{job.location} • {job.workMode}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Briefcase size={16} />
                      <span>{job.type}</span>
                    </div>
                    {job.compensationDisplay && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <IndianRupee size={16} />
                        <span>₹{job.compensationDisplay}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar size={16} />
                      <span>Deadline: {formatDateTimeBackend(job.applicationEndTime)}</span>
                    </div>
                  </div>

                  <Button size="sm" variant="outline" className="w-full group-hover:bg-accent transition-colors">
                    View Details
                    <ExternalLink size={14} className="ml-2" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Job Details Modal */}
      {selectedJob && !showApplicationModal && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedJob(null)}
        >
          <Card
            className="max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <CardHeader className="border-b">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4 flex-1">
                  <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-xl">
                    {selectedJob.company.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <CardTitle className="text-2xl mb-1">
                      {selectedJob.role}
                    </CardTitle>
                    <p className="text-muted-foreground flex items-center gap-2">
                      <Building2 size={16} />
                      {selectedJob.company}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedJob(null)}
                  className="p-2 hover:bg-accent rounded-lg transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="mt-4 flex flex-wrap gap-3">
                <Badge variant="secondary">
                  <MapPin size={14} className="mr-1" />
                  {selectedJob.location} • {selectedJob.workMode}
                </Badge>
                <Badge variant="secondary">
                  <Briefcase size={14} className="mr-1" />
                  {selectedJob.type}
                </Badge>
                {selectedJob.compensationDisplay && (
                  <Badge variant="secondary">
                    <IndianRupee size={14} className="mr-1" />
                    ₹{selectedJob.compensationDisplay}
                  </Badge>
                )}
                <Badge variant="secondary">
                  <Calendar size={14} className="mr-1" />
                  {formatDateTimeBackend(selectedJob.applicationEndTime)}
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="overflow-y-auto max-h-[calc(90vh-300px)] p-6">
              <div className="prose prose-sm max-w-none">
                {selectedJob.jdHTML ? (
                  <div dangerouslySetInnerHTML={{ __html: selectedJob.jdHTML }} />
                ) : (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">No job description available</p>
                  </div>
                )}
              </div>
            </CardContent>

            <div className="border-t p-6">
              <div className="flex gap-3">
                <Button
                  className="flex-1"
                  onClick={() => {
                    setShowApplicationModal(true);
                  }}
                >
                  Apply Now
                </Button>
                <Button variant="outline" onClick={() => setSelectedJob(null)}>
                  Close
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Application Modal */}
      {showApplicationModal && selectedJob && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4"
          onClick={() => setShowApplicationModal(false)}
        >
          <Card
            className="max-w-3xl w-full max-h-[90vh] overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <CardHeader className="border-b">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-xl mb-1">Apply to {selectedJob.role}</CardTitle>
                  <p className="text-sm text-muted-foreground">{selectedJob.company}</p>
                </div>
                <button
                  onClick={() => setShowApplicationModal(false)}
                  className="p-2 hover:bg-accent rounded-lg transition-colors"
                  disabled={submitting}
                >
                  <X size={20} />
                </button>
              </div>
            </CardHeader>

            <CardContent className="overflow-y-auto max-h-[calc(90vh-200px)] p-6">
              <div className="space-y-6">
                {/* Cover Letter */}
                <div>
                  <Label className="text-sm font-medium mb-2 block">
                    Cover Letter <span className="text-red-500">*</span>
                  </Label>
                  <Textarea
                    value={applicationData.coverLetter}
                    onChange={(e) => setApplicationData({ ...applicationData, coverLetter: e.target.value })}
                    placeholder="Why are you interested in this role? What makes you a good fit?"
                    rows={6}
                    disabled={submitting}
                    className="resize-none"
                  />
                </div>

                {/* Resume Upload */}
                <div>
                  <Label className="text-sm font-medium mb-2 block">
                    Resume (PDF) <span className="text-red-500">*</span>
                  </Label>
                  <div className="border-2 border-dashed rounded-lg p-6 text-center hover:border-blue-600 transition-colors">
                    <input
                      type="file"
                      accept=".pdf"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          if (file.type !== 'application/pdf') {
                            toast.error('Please upload a PDF file');
                            return;
                          }
                          if (file.size > 10 * 1024 * 1024) {
                            toast.error('File size must be less than 10MB');
                            return;
                          }
                          setApplicationData({ ...applicationData, resumeFile: file });
                        }
                      }}
                      disabled={submitting}
                      className="hidden"
                      id="resume-upload"
                    />
                    <label htmlFor="resume-upload" className="cursor-pointer">
                      {applicationData.resumeFile ? (
                        <div className="flex items-center justify-center gap-2 text-green-600">
                          <CheckCircle2 size={20} />
                          <span className="text-sm font-medium">{applicationData.resumeFile.name}</span>
                        </div>
                      ) : (
                        <>
                          <Upload size={32} className="text-muted-foreground mx-auto mb-3" />
                          <p className="text-sm font-medium text-foreground mb-1">
                            Click to upload resume
                          </p>
                          <p className="text-xs text-muted-foreground">PDF (Max 10MB)</p>
                        </>
                      )}
                    </label>
                  </div>
                </div>

                {/* Additional File Upload (Optional) */}
                <div>
                  <Label className="text-sm font-medium mb-2 block">
                    Additional Documents (Optional)
                  </Label>
                  <div className="border-2 border-dashed rounded-lg p-6 text-center hover:border-blue-600 transition-colors">
                    <input
                      type="file"
                      accept=".pdf"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          if (file.type !== 'application/pdf') {
                            toast.error('Please upload a PDF file');
                            return;
                          }
                          if (file.size > 10 * 1024 * 1024) {
                            toast.error('File size must be less than 10MB');
                            return;
                          }
                          setApplicationData({ ...applicationData, additionalFile: file });
                        }
                      }}
                      disabled={submitting}
                      className="hidden"
                      id="additional-upload"
                    />
                    <label htmlFor="additional-upload" className="cursor-pointer">
                      {applicationData.additionalFile ? (
                        <div className="flex items-center justify-center gap-2 text-green-600">
                          <CheckCircle2 size={20} />
                          <span className="text-sm font-medium">{applicationData.additionalFile.name}</span>
                        </div>
                      ) : (
                        <>
                          <FileText size={24} className="text-muted-foreground mx-auto mb-2" />
                          <p className="text-sm font-medium text-foreground mb-1">
                            Click to upload additional documents
                          </p>
                          <p className="text-xs text-muted-foreground">Portfolio, certificates, etc. (PDF, Max 10MB)</p>
                        </>
                      )}
                    </label>
                  </div>
                </div>
              </div>
            </CardContent>

            <div className="border-t p-6">
              <div className="flex gap-3">
                <Button
                  onClick={handleSubmitApplication}
                  disabled={submitting || !applicationData.resumeFile || !applicationData.coverLetter.trim()}
                  className="flex-1"
                >
                  {submitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      Submitting...
                    </>
                  ) : (
                    'Submit Application'
                  )}
                </Button>
                <Button variant="outline" onClick={() => setShowApplicationModal(false)} disabled={submitting}>
                  Cancel
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default JobOpeningsPage;