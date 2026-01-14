import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { auth } from '../firebase/config';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { ArrowLeft, CheckCircle, Calendar, Clock, Users } from 'lucide-react';
import toast from 'react-hot-toast';
import { getFormById, getUserFormResponses, FormResponse, getStudentGroupStatus } from '../services/formsApi';

interface Question {
  id: string;
  questionType: string;
  questionText: string;
  questionDescription?: string;
  isRequired: string;
  options?: Array<{ optionText: string; optionValue: string }>;
  scaleMin?: number;
  scaleMax?: number;
  scaleMinLabel?: string;
  scaleMaxLabel?: string;
}

const FormResponseView: React.FC = () => {
  const { formId } = useParams<{ formId: string }>();
  const navigate = useNavigate();
  const user = auth.currentUser;

  const [formName, setFormName] = useState('');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [response, setResponse] = useState<FormResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [groupStatuses, setGroupStatuses] = useState<Record<string, any>>({});

  useEffect(() => {
    if (user?.email && formId) {
      fetchFormAndResponse();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formId, user]);

  const fetchFormAndResponse = async () => {
    if (!formId || !user?.email) return;

    try {
      setLoading(true);

      // Fetch form and questions
      const formResult = await getFormById(formId);
      if (formResult.success && formResult.data) {
        setFormName(formResult.data.form.name);
        setQuestions(formResult.data.questions as any);

        // Fetch group statuses for all group selection questions
        const groupSelectionQuestions = (formResult.data.questions as any[]).filter(
          q => q.questionType === 'Group Selection'
        );

        if (groupSelectionQuestions.length > 0 && user?.email) {
          console.log('📊 Fetching group statuses for questions:', groupSelectionQuestions.map(q => q.id));
          const statusMap: Record<string, any> = {};
          await Promise.all(
            groupSelectionQuestions.map(async (q) => {
              console.log('🔍 Fetching group status for question:', q.id);
              const statusResult = await getStudentGroupStatus(formId, q.id, user.email!);
              console.log('📥 Group status result for', q.id, ':', statusResult);
              if (statusResult.success && statusResult.data) {
                statusMap[q.id] = statusResult.data;
              }
            })
          );
          console.log('✅ Final group statuses map:', statusMap);
          setGroupStatuses(statusMap);
        }
      }

      // Fetch user's responses
      try {
        const responsesResult = await getUserFormResponses(formId);
        if (responsesResult.success && responsesResult.data) {
          const responses = responsesResult.data;
          const completedResponse = responses.find(r => r.isComplete === 'Yes');
          if (completedResponse) {
            setResponse(completedResponse);
          } else {
            // No completed response - create a dummy response to still show group status
            console.log('⚠️ No completed response found, but will show group status');
            setResponse({
              responseId: '',
              formId: formId,
              userEmail: user.email || '',
              userName: user.displayName || '',
              userBatch: '',
              submissionDateTime: '',
              responseData: {},
              isComplete: 'No',
              completionTimeSeconds: 0
            } as FormResponse);
          }
        }
      } catch (responseError) {
        console.error('Error fetching response, but continuing to show group status:', responseError);
        // Create a dummy response to still show group status
        setResponse({
          responseId: '',
          formId: formId,
          userEmail: user.email || '',
          userName: user.displayName || '',
          userBatch: '',
          submissionDateTime: '',
          responseData: {},
          isComplete: 'No',
          completionTimeSeconds: 0
        } as FormResponse);
      }
    } catch (error) {
      console.error('Error fetching form response:', error);
      toast.error('Error loading response');
    } finally {
      setLoading(false);
    }
  };

  const renderAnswer = (question: Question) => {
    // Special handling for Group Selection - check BEFORE checking responseData
    if (question.questionType === 'Group Selection') {
      const groupStatus = groupStatuses[question.id];

      console.log('🔍 Rendering Group Selection:', {
        questionId: question.id,
        groupStatus,
        allGroupStatuses: groupStatuses,
        hasResponseData: !!response?.responseData,
        answer: response?.responseData?.[question.id]
      });

      // Show group status if available (even if user doesn't have answer in their response)
      if (groupStatus?.isFilled && groupStatus?.groupMembers?.length > 0) {
        return (
          <div className="space-y-4">
            <div className="bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-200 dark:border-blue-800 rounded-lg p-6">
              <div className="flex items-start gap-3 mb-4">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/40 rounded-lg">
                  <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-blue-900 dark:text-blue-100 text-lg mb-1">
                    Group Formed By
                  </h4>
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    This group selection was filled by <span className="font-medium">{groupStatus.filledBy}</span>
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium text-blue-900 dark:text-blue-100">Group Members:</p>
                <div className="space-y-2">
                  {groupStatus.groupMembers.map((name: string, idx: number) => (
                    <div
                      key={idx}
                      className="flex items-center gap-3 p-3 bg-white dark:bg-gray-800 rounded-lg border border-blue-200 dark:border-blue-800"
                    >
                      <div className="w-2 h-2 rounded-full bg-blue-600 dark:bg-blue-400"></div>
                      <span className="text-foreground font-medium">{name}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );
      }

      // If no group status, check if user has answer in their own response
      if (response?.responseData) {
        const answer = response.responseData[question.id];
        if (Array.isArray(answer) && answer.length > 0) {
          return (
            <div className="space-y-3">
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <p className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-2">
                  Group Members:
                </p>
                <ul className="space-y-1">
                  {answer.map((name: string, idx: number) => (
                    <li key={idx} className="flex items-center gap-2 text-blue-800 dark:text-blue-200">
                      <div className="w-2 h-2 rounded-full bg-blue-600 dark:bg-blue-400"></div>
                      {name}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          );
        }
      }

      // No group data at all
      return <span className="text-muted-foreground italic">Not answered</span>;
    }

    // For all other question types, check responseData
    if (!response?.responseData) return null;

    const answer = response.responseData[question.id];
    if (!answer && answer !== 0) return <span className="text-muted-foreground italic">Not answered</span>;

    switch (question.questionType) {
      case 'Start Screen':
      case 'End Screen':
      case 'Statement':
        return null;

      case 'Short Text':
      case 'Long Text':
      case 'Email':
      case 'Phone Number':
      case 'Website':
      case 'Address':
        return <p className="text-foreground font-medium">{answer}</p>;

      case 'Number':
        return <p className="text-foreground font-medium">{answer}</p>;

      case 'Multiple Choice':
      case 'Dropdown':
        return (
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-primary flex items-center justify-center">
              <div className="w-2 h-2 rounded-full bg-white"></div>
            </div>
            <span className="text-foreground font-medium">{answer}</span>
          </div>
        );

      case 'Yes/No':
        return (
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-primary" />
            <span className="text-foreground font-medium">{answer}</span>
          </div>
        );

      case 'Rating':
        return (
          <div className="flex gap-1">
            {[...Array(question.scaleMax || 5)].map((_, i) => (
              <div
                key={i}
                className={`w-8 h-8 flex items-center justify-center rounded ${
                  i < answer ? 'bg-yellow-400 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-400'
                }`}
              >
                ★
              </div>
            ))}
            <span className="ml-2 text-foreground font-medium">{answer} / {question.scaleMax || 5}</span>
          </div>
        );

      case 'NPS':
        const npsValue = parseInt(answer);
        let npsCategory = '';
        let npsColor = '';
        if (npsValue >= 0 && npsValue <= 6) {
          npsCategory = 'Detractor';
          npsColor = 'text-red-600 dark:text-red-400';
        } else if (npsValue >= 7 && npsValue <= 8) {
          npsCategory = 'Passive';
          npsColor = 'text-yellow-600 dark:text-yellow-400';
        } else {
          npsCategory = 'Promoter';
          npsColor = 'text-green-600 dark:text-green-400';
        }

        return (
          <div className="space-y-2">
            <div className="flex gap-1">
              {[...Array(11)].map((_, i) => (
                <div
                  key={i}
                  className={`w-10 h-10 flex items-center justify-center rounded font-semibold ${
                    i === npsValue
                      ? 'bg-primary text-white'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                  }`}
                >
                  {i}
                </div>
              ))}
            </div>
            <p className={`font-semibold ${npsColor}`}>
              Score: {npsValue} - {npsCategory}
            </p>
          </div>
        );

      case 'Date':
        return <p className="text-foreground font-medium">{new Date(answer).toLocaleDateString()}</p>;

      case 'Time':
        return <p className="text-foreground font-medium">{answer}</p>;

      case 'File Upload':
        if (Array.isArray(answer)) {
          return (
            <div className="space-y-2">
              {answer.map((file: any, idx: number) => (
                <a
                  key={idx}
                  href={file.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-primary hover:underline"
                >
                  📎 {file.name}
                </a>
              ))}
            </div>
          );
        }
        return <p className="text-foreground font-medium">{answer}</p>;

      case 'Contact Info':
        if (typeof answer === 'object') {
          return (
            <div className="space-y-1 text-foreground">
              {answer.name && <p><strong>Name:</strong> {answer.name}</p>}
              {answer.email && <p><strong>Email:</strong> {answer.email}</p>}
              {answer.phone && <p><strong>Phone:</strong> {answer.phone}</p>}
              {answer.address && <p><strong>Address:</strong> {answer.address}</p>}
            </div>
          );
        }
        return <p className="text-foreground font-medium">{JSON.stringify(answer)}</p>;

      default:
        return <p className="text-foreground font-medium">{JSON.stringify(answer)}</p>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading your response...</p>
        </div>
      </div>
    );
  }

  if (!response) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-muted-foreground">No response found</p>
          <Button onClick={() => navigate('/forms')} className="mt-4">
            Back to Forms
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Button
            variant="ghost"
            onClick={() => navigate('/forms')}
            className="mb-2"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Forms
          </Button>
          <h1 className="text-3xl font-bold text-foreground">{formName}</h1>
          <p className="text-muted-foreground mt-1">Your submitted response</p>
        </div>
        <div className="text-right">
          <div className="flex items-center gap-2 text-green-600 dark:text-green-400 font-semibold">
            <CheckCircle className="h-5 w-5" />
            Completed
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
            <Calendar className="h-4 w-4" />
            {new Date(response.submissionDateTime).toLocaleDateString()}
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            {new Date(response.submissionDateTime).toLocaleTimeString()}
          </div>
        </div>
      </div>

      {/* Responses */}
      <div className="space-y-4">
        {questions
          .filter(q => q.questionType !== 'Start Screen' && q.questionType !== 'End Screen')
          .map((question, index) => (
            <Card key={question.id}>
              <CardContent className="p-6">
                <div className="space-y-4">
                  {/* Question */}
                  <div>
                    <h3 className="text-lg font-semibold text-foreground flex items-start gap-2">
                      <span className="text-primary">{index + 1}.</span>
                      <span>{question.questionText}</span>
                      {question.isRequired === 'Yes' && (
                        <span className="text-red-500">*</span>
                      )}
                    </h3>
                    {question.questionDescription && (
                      <p className="text-sm text-muted-foreground mt-1 ml-6">
                        {question.questionDescription}
                      </p>
                    )}
                  </div>

                  {/* Answer */}
                  <div className="ml-6 p-4 bg-muted/30 rounded-lg border border-border">
                    {renderAnswer(question)}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
      </div>

      {/* Footer */}
      <div className="flex justify-center pt-6 pb-12">
        <Button onClick={() => navigate('/forms')} size="lg">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Forms
        </Button>
      </div>
    </div>
  );
};

export default FormResponseView;
