import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import {
  FileText,
  Briefcase,
  Building2,
  MapPin,
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  Eye,
  Download
} from 'lucide-react';
import { apiService } from '../../services/api';
import { formatDateTimeBackend } from '../../utils/dateUtils';
import { auth } from '../../firebase/config';
import toast from 'react-hot-toast';

interface Application {
  applicationId: string;
  jobId: string;
  company: string;
  role: string;
  location: string;
  timestamp: string;
  status: string;
  resumeUrl?: string;
  coverLetter?: string;
  additionalFileUrl?: string;
}

type FilterType = 'all' | 'pending' | 'reviewed' | 'accepted' | 'rejected';

const ApplicationsPage: React.FC = () => {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);
  const user = auth.currentUser;

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    if (!user?.email) {
      toast.error('Please login to view applications');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const result = await apiService.getStudentApplications(user.email);

      if (result.success && result.data) {
        setApplications(result.data);
      } else {
        toast.error('Failed to load applications');
      }
    } catch (error) {
      console.error('Error fetching applications:', error);
      toast.error('Error loading applications');
    } finally {
      setLoading(false);
    }
  };

  const filteredApplications = applications.filter((app) => {
    if (activeFilter === 'all') return true;
    return app.status.toLowerCase() === activeFilter;
  });

  const getStatusBadge = (status: string) => {
    const statusLower = status.toLowerCase();
    if (statusLower === 'accepted' || statusLower === 'selected') {
      return <Badge className="bg-green-500 hover:bg-green-600"><CheckCircle2 size={14} className="mr-1" /> Accepted</Badge>;
    } else if (statusLower === 'rejected') {
      return <Badge variant="destructive"><XCircle size={14} className="mr-1" /> Rejected</Badge>;
    } else if (statusLower === 'reviewed') {
      return <Badge className="bg-blue-500 hover:bg-blue-600"><Eye size={14} className="mr-1" /> Reviewed</Badge>;
    } else {
      return <Badge variant="secondary"><Clock size={14} className="mr-1" /> Pending</Badge>;
    }
  };

  const filters = [
    { id: 'all', label: 'All', count: applications.length },
    { id: 'pending', label: 'Pending', count: applications.filter(a => a.status.toLowerCase() === 'pending').length },
    { id: 'reviewed', label: 'Reviewed', count: applications.filter(a => a.status.toLowerCase() === 'reviewed').length },
    { id: 'accepted', label: 'Accepted', count: applications.filter(a => ['accepted', 'selected'].includes(a.status.toLowerCase())).length },
    { id: 'rejected', label: 'Rejected', count: applications.filter(a => a.status.toLowerCase() === 'rejected').length },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-12 h-12 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-sm text-muted-foreground">Loading applications...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Your Applications</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Track the status of your job applications
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="border-b">
        <div className="flex gap-8">
          {filters.map((filter) => (
            <button
              key={filter.id}
              onClick={() => setActiveFilter(filter.id as FilterType)}
              className={`relative pb-3 text-sm font-medium transition-colors ${
                activeFilter === filter.id
                  ? 'text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {filter.label}
              {filter.count > 0 && (
                <Badge variant="secondary" className="ml-2 text-xs">
                  {filter.count}
                </Badge>
              )}
              {activeFilter === filter.id && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600"></span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Applications List */}
      {filteredApplications.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <div className="max-w-md mx-auto">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText size={32} className="text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                No Applications Found
              </h3>
              <p className="text-sm text-muted-foreground">
                {activeFilter === 'all'
                  ? "You haven't applied to any jobs yet. Browse job openings to get started!"
                  : `No ${activeFilter} applications found.`}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredApplications.map((application) => (
            <Card key={application.applicationId} className="hover:shadow-md transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4 flex-1">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                      {application.company.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-foreground text-base mb-1">
                        {application.role}
                      </h3>
                      <div className="space-y-1.5">
                        <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                          <Building2 size={14} />
                          {application.company}
                        </p>
                        {application.location && (
                          <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                            <MapPin size={14} />
                            {application.location}
                          </p>
                        )}
                        <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                          <Calendar size={14} />
                          Applied on {formatDateTimeBackend(application.timestamp)}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-3">
                    {getStatusBadge(application.status)}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setSelectedApplication(application)}
                    >
                      <Eye size={14} className="mr-1" />
                      View Details
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Application Details Modal */}
      {selectedApplication && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedApplication(null)}
        >
          <Card
            className="max-w-3xl w-full max-h-[90vh] overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <CardHeader className="border-b">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-xl mb-1">Application Details</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {selectedApplication.role} at {selectedApplication.company}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedApplication(null)}
                  className="p-2 hover:bg-accent rounded-lg transition-colors"
                >
                  <FileText size={20} />
                </button>
              </div>
              <div className="mt-3">
                {getStatusBadge(selectedApplication.status)}
              </div>
            </CardHeader>

            <CardContent className="overflow-y-auto max-h-[calc(90vh-200px)] p-6">
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-semibold text-foreground mb-1">Application ID</h4>
                  <p className="text-sm text-muted-foreground">{selectedApplication.applicationId}</p>
                </div>

                <div>
                  <h4 className="text-sm font-semibold text-foreground mb-1">Submitted On</h4>
                  <p className="text-sm text-muted-foreground">
                    {formatDateTimeBackend(selectedApplication.timestamp)}
                  </p>
                </div>

                {selectedApplication.coverLetter && (
                  <div>
                    <h4 className="text-sm font-semibold text-foreground mb-2">Cover Letter</h4>
                    <div className="p-4 bg-muted rounded-lg">
                      <p className="text-sm text-foreground whitespace-pre-wrap">
                        {selectedApplication.coverLetter}
                      </p>
                    </div>
                  </div>
                )}

                <div>
                  <h4 className="text-sm font-semibold text-foreground mb-2">Attachments</h4>
                  <div className="space-y-2">
                    {selectedApplication.resumeUrl && (
                      <a
                        href={selectedApplication.resumeUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 p-3 border rounded-lg hover:bg-accent transition-colors"
                      >
                        <FileText size={18} className="text-blue-600" />
                        <span className="text-sm font-medium flex-1">Resume</span>
                        <Download size={16} />
                      </a>
                    )}
                    {selectedApplication.additionalFileUrl && (
                      <a
                        href={selectedApplication.additionalFileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 p-3 border rounded-lg hover:bg-accent transition-colors"
                      >
                        <FileText size={18} className="text-blue-600" />
                        <span className="text-sm font-medium flex-1">Additional Documents</span>
                        <Download size={16} />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>

            <div className="border-t p-6">
              <Button variant="outline" onClick={() => setSelectedApplication(null)} className="w-full">
                Close
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default ApplicationsPage;
