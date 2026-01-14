import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { AlertCircle, FileText, Clock, Users, ChevronLeft, ChevronRight } from 'lucide-react';
import { auth } from '../firebase/config';
import { getForms, getUserFormResponses } from '../services/formsApi';
import { useAuth } from '../features/auth/hooks/useAuth';

interface RequiredForm {
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
  visibleTo?: string;
  showAtStartUntilFilled?: string;
}

const RequiredFormsModal: React.FC = () => {
  const [requiredForms, setRequiredForms] = useState<RequiredForm[]>([]);
  const [currentFormIndex, setCurrentFormIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [timeRemaining, setTimeRemaining] = useState<string>('');
  const [lastClickedDirection, setLastClickedDirection] = useState<'left' | 'right' | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const user = auth.currentUser;
  const { student } = useAuth();

  const requiredForm = requiredForms[currentFormIndex] || null;

  // Parse date from backend format - handles multiple formats
  const parseDate = (dateStr: string) => {
    if (!dateStr) return null;

    // Check if it's ISO 8601 format (e.g., "2025-11-27T02:30:00.000Z")
    if (dateStr.includes('T') && (dateStr.includes('Z') || dateStr.includes('+'))) {
      return new Date(dateStr);
    }

    // Handle both formats: "DD-MMM-YYYY HH:mm:ss" and "DD/MM/YYYY HH:mm:ss"
    const parts = dateStr.split(' ');
    const timeParts = parts[1] ? parts[1].split(':') : ['0', '0', '0'];

    // Check if using new format (DD-MMM-YYYY) with dashes
    if (parts[0].includes('-')) {
      const dateParts = parts[0].split('-');
      const monthMap: { [key: string]: number } = {
        'jan': 0, 'feb': 1, 'mar': 2, 'apr': 3, 'may': 4, 'jun': 5,
        'jul': 6, 'aug': 7, 'sep': 8, 'oct': 9, 'nov': 10, 'dec': 11
      };

      const day = parseInt(dateParts[0]);
      const monthStr = dateParts[1].toLowerCase();
      const year = parseInt(dateParts[2]);
      const month = monthMap[monthStr];

      if (month === undefined) return null;

      return new Date(
        year,
        month,
        day,
        parseInt(timeParts[0]),
        parseInt(timeParts[1]),
        parseInt(timeParts[2])
      );
    } else {
      // Old format DD/MM/YYYY
      const dateParts = parts[0].split('/');
      return new Date(
        parseInt(dateParts[2]), // year
        parseInt(dateParts[1]) - 1, // month (0-indexed)
        parseInt(dateParts[0]), // day
        parseInt(timeParts[0]), // hours
        parseInt(timeParts[1]), // minutes
        parseInt(timeParts[2]) // seconds
      );
    }
  };

  // Calculate time remaining
  const calculateTimeRemaining = (endDate: Date) => {
    const now = new Date();
    const diff = endDate.getTime() - now.getTime();

    if (diff <= 0) return 'Expired';

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (days > 0) {
      return `${days}d ${hours}h remaining`;
    } else if (hours > 0) {
      return `${hours}h ${minutes}m remaining`;
    } else {
      return `${minutes}m remaining`;
    }
  };

  useEffect(() => {
    if (student?.email) {
      // Add a small delay to avoid race conditions with other components fetching on mount
      const timer = setTimeout(() => {
        checkForRequiredForms();
      }, 500);
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, location.pathname]); // Re-check when user navigates

  // Update countdown timer every minute
  useEffect(() => {
    if (requiredForm?.endDateTime) {
      const updateTimer = () => {
        const endDate = parseDate(requiredForm.endDateTime!);
        if (endDate) {
          const remaining = calculateTimeRemaining(endDate);
          setTimeRemaining(remaining);
        }
      };

      updateTimer(); // Initial update
      const interval = setInterval(updateTimer, 60000); // Update every minute

      return () => clearInterval(interval);
    }
  }, [requiredForm]);

  const checkForRequiredForms = async () => {
    if (!student?.email) return;

    try {
      setLoading(true);

      // Fetch ALL active forms (not just showAtStartUntilFilled)
      const result = await getForms({
        isActive: 'Yes',
        includeUserEmail: true
      });

      if (result.success && result.data) {
        const forms = result.data as any[];
        const uncompletedForms: RequiredForm[] = [];

        // Check each form to see if user has completed it
        for (const form of forms) {
          // Check visibleTo filter - restrict form visibility by student email address
          if (form.visibleTo && form.visibleTo.trim() && form.visibleTo.trim().toLowerCase() !== 'all') {
            // Parse emails from visibleTo field (supports both comma-separated and newline-separated)
            const emailArray: string[] = form.visibleTo.split(/[\n,]+/);
            const allowedEmails = emailArray
              .map(email => email.trim().toLowerCase())
              .filter(email => email.length > 0);

            // Check if current user's email is in the allowed list
            const currentUserEmail = student?.email?.toLowerCase();
            if (currentUserEmail && !allowedEmails.includes(currentUserEmail)) {
              continue; // Skip this form if user's email is not in the list
            }
          }
          // If visibleTo is empty or "All", show to all students in the batch (backend already filters by batch)

          // Check if within date range
          const now = new Date();
          const start = form.startDateTime ? parseDate(form.startDateTime) : null;
          const end = form.endDateTime ? parseDate(form.endDateTime) : null;

          // Skip if not yet started or already ended
          if (start && now < start) {
            continue;
          }
          if (end && now > end) {
            continue;
          }

          // Check if user has completed this form
          const responsesResult = await getUserFormResponses(form.id);

          if (responsesResult.success && responsesResult.data) {
            const responses = responsesResult.data as any[];
            const completedResponse = responses.find(r => r.isComplete === 'Yes');

            // If not completed, add to uncompleted forms list
            if (!completedResponse) {
              console.log('📝 Adding uncompleted form:', form);
              uncompletedForms.push(form);
            }
          } else {
            // No responses yet, so form is not completed
            console.log('📝 Adding form with no responses:', form);
            uncompletedForms.push(form);
          }
        }

        // Sort uncompleted forms by End_DateTime (closest to end first)
        const sortedForms = uncompletedForms.sort((a, b) => {
          // If no end date, put it at the end
          if (!a.endDateTime) return 1;
          if (!b.endDateTime) return -1;

          const endA = parseDate(a.endDateTime);
          const endB = parseDate(b.endDateTime);

          if (!endA) return 1;
          if (!endB) return -1;

          // Earlier end date comes first (closer to deadline)
          return endA.getTime() - endB.getTime();
        });

        // Prioritize forms with Show_At_Start_Until_Filled = Yes at the beginning
        const priorityForms = sortedForms.filter(f => f.showAtStartUntilFilled?.toLowerCase() === 'yes');
        const regularForms = sortedForms.filter(f => f.showAtStartUntilFilled?.toLowerCase() !== 'yes');

        const finalSortedForms = [...priorityForms, ...regularForms];

        console.log(`📝 Found ${finalSortedForms.length} uncompleted forms`);
        setRequiredForms(finalSortedForms);
        setCurrentFormIndex(0); // Reset to first form
      }
    } catch (error) {
      // Silently fail - this is usually a transient error during initial page load
      // The component will retry when user navigates or refreshes
      setRequiredForms([]);
    } finally {
      setLoading(false);
    }
  };

  const handleFillForm = () => {
    if (requiredForm) {
      navigate(`/forms/${requiredForm.id}`);
    }
  };

  const handlePrevious = () => {
    if (currentFormIndex > 0) {
      setCurrentFormIndex(currentFormIndex - 1);
      setLastClickedDirection('left');
    }
  };

  const handleNext = () => {
    if (currentFormIndex < requiredForms.length - 1) {
      setCurrentFormIndex(currentFormIndex + 1);
      setLastClickedDirection('right');
    }
  };

  // Don't show modal for admin users
  if (student?.isAdmin) {
    return null;
  }

  // Don't render anything if loading or no required forms
  if (loading || requiredForms.length === 0) {
    return null;
  }

  // Don't show modal if user is currently on any of the required form fill pages
  // This allows them to fill forms without the modal blocking them
  if (requiredForms.some(form => location.pathname === `/forms/${form.id}`)) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <Card className="max-w-2xl w-full shadow-2xl border-2 border-primary animate-in fade-in zoom-in duration-300">
        <CardContent className="p-8">
          {/* Header */}
          <div className="flex items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-red-100 dark:bg-red-900/20 rounded-full">
                <AlertCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-foreground">
                  {requiredForm?.showAtStartUntilFilled?.toLowerCase() === 'yes'
                    ? 'Required Form'
                    : 'Pending Forms'}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {requiredForm?.showAtStartUntilFilled?.toLowerCase() === 'yes'
                    ? 'Please complete this form to continue'
                    : 'You have pending forms to fill'}
                </p>
              </div>
            </div>

            {/* Form counter */}
            {requiredForms.length > 1 && (
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-sm px-3 py-1">
                  {currentFormIndex + 1} of {requiredForms.length}
                </Badge>
              </div>
            )}
          </div>

          {/* Form Details */}
          <div className="space-y-4 mb-6">
            <div className="p-4 bg-muted/50 rounded-lg border border-border">
              <div className="flex items-start gap-3">
                <FileText className="h-6 w-6 text-primary mt-1" />
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-foreground mb-2">{requiredForm.name}</h3>

                  {requiredForm.description && (
                    <p className="text-muted-foreground mb-3">{requiredForm.description}</p>
                  )}

                  <div className="flex flex-wrap gap-2">
                    {requiredForm.showAtStartUntilFilled?.toLowerCase() === 'yes' && (
                      <Badge variant="outline" className="bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300">
                        Required
                      </Badge>
                    )}

                    <Badge variant="outline">
                      {requiredForm.type}
                    </Badge>

                    {requiredForm.batch && (
                      <Badge variant="outline" className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {requiredForm.batch}
                      </Badge>
                    )}

                    {(requiredForm.term || requiredForm.domain || requiredForm.subject) && (
                      <Badge variant="outline">
                        {[requiredForm.term, requiredForm.domain, requiredForm.subject].filter(Boolean).join(' • ')}
                      </Badge>
                    )}

                    {requiredForm.endDateTime && timeRemaining && (
                      <Badge variant="outline" className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {timeRemaining}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-800 rounded-lg">
              <p className="text-sm text-yellow-800 dark:text-yellow-200 flex items-start gap-2">
                <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span>
                  {requiredForm?.showAtStartUntilFilled?.toLowerCase() === 'yes'
                    ? 'This form must be completed to continue using the portal. You can access other tabs after filling this form.'
                    : 'You have pending forms to complete. Navigate through forms using the arrows below.'}
                </span>
              </p>
            </div>
          </div>

          {/* Action Buttons with Navigation */}
          <div className="flex items-center justify-center gap-4">
            {/* Left Arrow */}
            {requiredForms.length > 1 && (
              <Button
                onClick={handlePrevious}
                disabled={currentFormIndex === 0}
                variant="outline"
                size="lg"
                className={`px-4 py-6 transition-all ${
                  lastClickedDirection === 'left'
                    ? 'bg-green-500 hover:bg-green-600 text-white border-green-500'
                    : 'bg-gray-200 hover:bg-gray-300 text-gray-700 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-300 border-gray-300 dark:border-gray-600'
                }`}
              >
                <ChevronLeft className="h-6 w-6" />
              </Button>
            )}

            {/* Fill Form Button */}
            <Button
              onClick={handleFillForm}
              size="lg"
              className="px-8 py-6 text-lg font-semibold shadow-lg hover:shadow-xl transition-all"
            >
              <FileText className="h-5 w-5 mr-2" />
              Fill Form Now
            </Button>

            {/* Right Arrow */}
            {requiredForms.length > 1 && (
              <Button
                onClick={handleNext}
                disabled={currentFormIndex === requiredForms.length - 1}
                variant="outline"
                size="lg"
                className={`px-4 py-6 transition-all ${
                  lastClickedDirection === 'right'
                    ? 'bg-green-500 hover:bg-green-600 text-white border-green-500'
                    : 'bg-gray-200 hover:bg-gray-300 text-gray-700 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-300 border-gray-300 dark:border-gray-600'
                }`}
              >
                <ChevronRight className="h-6 w-6" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RequiredFormsModal;
