import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { auth } from '../firebase/config';
import { Card, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import {
  ListChecks,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText,
  Users,
  Search
} from 'lucide-react';
import toast from 'react-hot-toast';
import { getForms, getUserFormResponses, Form as ApiForm, getStudentGroupStatus, type GroupStatus } from '../services/formsApi';
import { useActivityTracker } from '../hooks/useActivityTracker';

interface Form {
  id: string;
  name: string;
  description: string;
  type: string;
  batch: string;
  term?: string;
  domain?: string;
  subject?: string;
  startDateTime: string;
  endDateTime?: string;
  isActive: string;
  showAtStartUntilFilled: string;
  showInTab: string;
  visibleTo?: string;
  maxResponsesPerUser: number;
  totalResponses: number;
  requireLogin: string;
  allowStudentViewResponse?: string;
  thankYouMessage?: string;
  status: string;
}

interface UserResponse {
  responseId: string;
  submissionDateTime: string;
  isComplete: string;
}

const Forms: React.FC = () => {
  const [forms, setForms] = useState<Form[]>([]);
  const [userResponses, setUserResponses] = useState<Record<string, UserResponse[]>>({});
  const [groupStatuses, setGroupStatuses] = useState<Record<string, GroupStatus>>({});
  const [loading, setLoading] = useState(true);
  const [responsesLoaded, setResponsesLoaded] = useState(false);
  const [filter, setFilter] = useState<'all' | 'available' | 'completed' | 'expired'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  const user = auth.currentUser;
  const { trackPageView } = useActivityTracker();

  // Track page view
  useEffect(() => {
    trackPageView('Forms');
  }, [trackPageView]);

  useEffect(() => {
    if (user?.email) {
      console.log('🔄 Location changed or user loaded, fetching forms...');
      fetchForms();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, location.pathname]);

  const fetchForms = async () => {
    if (!user?.email) {
      console.log('⚠️ No user email, skipping fetch');
      return;
    }

    try {
      setLoading(true);
      setResponsesLoaded(false);
      console.log('📋 Fetching forms...');

      // Fetch active forms for this student (filtered by their batch)
      const result = await getForms({ isActive: 'Yes', showInTab: 'Yes', includeUserEmail: true });

      if (!result.success) {
        console.error('❌ Failed to fetch forms:', result.error);
        toast.error(result.error || 'Failed to load forms');
        return;
      }

      if (result.data) {
        const formsList = result.data as ApiForm[];
        setForms(formsList as any);
        console.log(`✅ Loaded ${formsList.length} forms`);

        // No longer loading responses on page load - responses will be loaded on demand
        // The backend now returns userHasCompleted field with each form
        setUserResponses({});
        setResponsesLoaded(true);
        console.log('✅ Forms loaded (responses will load on demand)');

        // Fetch group statuses for forms with Group Selection questions
        const groupStatusMap: Record<string, GroupStatus> = {};
        await Promise.all(
          formsList.map(async (form) => {
            try {
              // Check if form has any Group Selection questions
              const groupSelectionQuestions = form.questions?.filter(
                (q: any) => q.questionType === 'Group Selection'
              ) || [];

              if (groupSelectionQuestions.length > 0 && user?.email) {
                // For each Group Selection question, check the status
                for (const question of groupSelectionQuestions) {
                  const statusResult = await getStudentGroupStatus(form.id, question.id || '', user.email);
                  if (statusResult.success && statusResult.data?.isFilled) {
                    // Store using a composite key: formId-questionId
                    groupStatusMap[`${form.id}-${question.id}`] = statusResult.data;
                  }
                }
              }
            } catch (err) {
              console.error(`Error fetching group status for form ${form.id}:`, err);
            }
          })
        );

        setGroupStatuses(groupStatusMap);
      } else {
        toast.error(result.error || 'Failed to load forms');
      }
    } catch (error) {
      console.error('Error fetching forms:', error);
      toast.error('Error loading forms');
    } finally {
      setLoading(false);
    }
  };

  const getFormStatus = (form: Form): 'available' | 'completed' | 'upcoming' | 'expired' => {
    const now = new Date();
    const start = form.startDateTime ? new Date(form.startDateTime) : null;
    const end = form.endDateTime ? new Date(form.endDateTime) : null;

    // Check date range first
    if (start && now < start) {
      return 'upcoming';
    }

    if (end && now > end) {
      return 'expired';
    }

    // Check if user has already completed this form using backend-provided flag
    if ((form as any).userHasCompleted) {
      return 'completed';
    }

    return 'available';
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'available':
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300">Available</Badge>;
      case 'completed':
        return <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300">Completed</Badge>;
      case 'upcoming':
        return <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300">Upcoming</Badge>;
      case 'expired':
        return <Badge className="bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300">Expired</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getFormTypeIcon = (type: string) => {
    const typeMap: Record<string, React.ReactNode> = {
      'Feedback': <FileText className="h-5 w-5" />,
      'Survey': <ListChecks className="h-5 w-5" />,
      'Selection': <CheckCircle2 className="h-5 w-5" />,
      'Registration': <Users className="h-5 w-5" />,
    };
    return typeMap[type] || <FileText className="h-5 w-5" />;
  };

  const handleFormClick = (form: Form, forceResubmit: boolean = false) => {
    const status = getFormStatus(form);

    if (status === 'available' || (status === 'completed' && forceResubmit)) {
      // Go to form fill page
      navigate(`/forms/${form.id}`);
    } else if (status === 'completed') {
      // Don't show toast - user should use the View Response or Resubmit buttons
      return;
    } else if (status === 'upcoming') {
      toast('This form is not yet available', { icon: '⏰' });
    } else if (status === 'expired') {
      toast.error('This form has expired');
    }
  };

  const filteredForms = forms.filter(form => {
    const status = getFormStatus(form);

    console.log('🔍 Filtering form:', {
      name: form.name,
      visibleTo: form.visibleTo,
      status,
      currentFilter: filter,
      userEmail: user?.email
    });

    // Apply visibleTo filter - restrict form visibility by student email
    if (form.visibleTo && form.visibleTo.trim() && form.visibleTo.trim().toLowerCase() !== 'all') {
      // Parse emails from visibleTo field (supports both comma-separated and newline-separated)
      const allowedEmails = form.visibleTo
        .split(/[\n,]+/)
        .map(email => email.trim().toLowerCase())
        .filter(email => email.length > 0);

      console.log('📧 Checking visibleTo:', {
        formName: form.name,
        allowedEmails,
        currentUserEmail: user?.email?.toLowerCase(),
        isAllowed: allowedEmails.includes(user?.email?.toLowerCase() || '')
      });

      // Check if current user's email is in the allowed list
      const currentUserEmail = user?.email?.toLowerCase();
      if (currentUserEmail && !allowedEmails.includes(currentUserEmail)) {
        console.log('❌ Form hidden - user email not in visibleTo list:', form.name);
        return false; // Hide form if user's email is not in the list
      }
    }
    // If visibleTo is empty or "All", show to all students in the batch (backend already filters by batch)

    // Apply status filter
    if (filter === 'available' && status !== 'available') {
      console.log('❌ Form hidden - status filter mismatch:', form.name, 'status:', status, 'filter:', filter);
      return false;
    }
    if (filter === 'completed' && status !== 'completed') {
      console.log('❌ Form hidden - status filter mismatch:', form.name, 'status:', status, 'filter:', filter);
      return false;
    }
    if (filter === 'expired' && status !== 'expired') {
      console.log('❌ Form hidden - status filter mismatch:', form.name, 'status:', status, 'filter:', filter);
      return false;
    }

    // Apply search filter
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      const matches = (
        form.name.toLowerCase().includes(searchLower) ||
        form.description?.toLowerCase().includes(searchLower) ||
        form.type.toLowerCase().includes(searchLower)
      );
      if (!matches) {
        console.log('❌ Form hidden - search filter mismatch:', form.name);
      }
      return matches;
    }

    console.log('✅ Form passed all filters:', form.name);
    return true;
  });

  const stats = {
    total: forms.length,
    available: forms.filter(f => getFormStatus(f) === 'available').length,
    completed: forms.filter(f => getFormStatus(f) === 'completed').length,
    expired: forms.filter(f => getFormStatus(f) === 'expired').length,
  };

  if (loading || !responsesLoaded) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">
            {loading ? 'Loading forms...' : 'Loading responses...'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
            <ListChecks className="h-8 w-8 text-primary" />
            Forms
          </h1>
          <p className="text-muted-foreground mt-1">
            Fill out surveys, feedback forms, and more
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
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
              <Clock className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-2xl font-bold text-foreground">{stats.available}</p>
                <p className="text-sm text-muted-foreground">Available</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="h-5 w-5 text-primary" />
              <div>
                <p className="text-2xl font-bold text-foreground">{stats.completed}</p>
                <p className="text-sm text-muted-foreground">Completed</p>
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
            <div className="flex gap-2">
              <Button
                variant={filter === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('all')}
              >
                All
              </Button>
              <Button
                variant={filter === 'available' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('available')}
              >
                Available
              </Button>
              <Button
                variant={filter === 'completed' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('completed')}
              >
                Completed
              </Button>
              <Button
                variant={filter === 'expired' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('expired')}
              >
                Expired
              </Button>
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
            <p className="text-muted-foreground">
              {searchTerm ? 'Try adjusting your search' : 'No forms available at this time'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredForms.map((form) => {
            const status = getFormStatus(form);

            return (
              <Card
                key={form.id}
                className={`cursor-pointer transition-all hover:shadow-lg ${
                  status === 'available' ? 'hover:border-primary ring-2 ring-green-500 dark:ring-green-400' : ''
                }`}
                onClick={() => handleFormClick(form)}
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 rounded-lg bg-primary/10 text-primary">
                          {getFormTypeIcon(form.type)}
                        </div>
                        <div>
                          <h3 className="text-xl font-semibold text-foreground">{form.name}</h3>
                          <p className="text-sm text-muted-foreground">{form.type}</p>
                        </div>
                      </div>

                      {form.description && (
                        <p className="text-muted-foreground mb-3 ml-14">{form.description}</p>
                      )}

                      <div className="flex flex-wrap gap-2 ml-14">
                        {getStatusBadge(status)}

                        {form.showAtStartUntilFilled === 'Yes' && status === 'available' && (
                          <Badge className="bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300">
                            Required
                          </Badge>
                        )}

                        {form.batch && (
                          <Badge variant="outline" className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            {form.batch}
                          </Badge>
                        )}

                        {(form.term || form.domain || form.subject) && (
                          <Badge variant="outline">
                            {[form.term, form.domain, form.subject].filter(Boolean).join(' • ')}
                          </Badge>
                        )}

                        {/* Group Selection Status Badge */}
                        {(() => {
                          // Check if any group selection question has been filled
                          const groupSelectionQuestions = (form as any).questions?.filter(
                            (q: any) => q.questionType === 'Group Selection'
                          ) || [];

                          const filledGroupQuestion = groupSelectionQuestions.find((q: any) =>
                            groupStatuses[`${form.id}-${q.id}`]?.isFilled
                          );

                          if (filledGroupQuestion) {
                            const status = groupStatuses[`${form.id}-${filledGroupQuestion.id}`];
                            return (
                              <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300 flex items-center gap-1">
                                <Users className="h-3 w-3" />
                                Group filled by {status.filledBy}
                              </Badge>
                            );
                          }
                          return null;
                        })()}
                      </div>
                    </div>

                    {status === 'available' && (
                      <Button className="ml-4">
                        Fill Form
                      </Button>
                    )}
                    {status === 'completed' && (
                      <div className="ml-4 flex gap-2 items-center">
                        {form.allowStudentViewResponse === 'Yes' ? (
                          <Button
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/forms/${form.id}/responses`);
                            }}
                          >
                            View Response
                          </Button>
                        ) : (
                          <span className="text-xs text-muted-foreground italic">
                            No View Response available
                          </span>
                        )}
                        {form.maxResponsesPerUser > 1 && (
                          <Button
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleFormClick(form, true);
                            }}
                          >
                            Resubmit
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Forms;
