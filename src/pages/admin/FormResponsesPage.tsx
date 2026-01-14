import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import {
  BarChart3,
  Download,
  ArrowLeft,
  User,
  Clock,
  FileText,
  Search,
  Eye,
  CheckCircle2,
  AlertCircle,
  Users
} from 'lucide-react';
import toast from 'react-hot-toast';
import { getFormById, getFormResponses, getAllStudents, type FormResponse } from '../../services/formsApi';

interface FormData {
  id: string;
  name: string;
  description: string;
  type: string;
  batch: string;
  totalResponses: number;
  status: string;
  createdBy: string;
  startDateTime: string;
  endDateTime: string;
}

export function FormResponsesPage() {
  const { formId } = useParams<{ formId: string }>();
  const navigate = useNavigate();

  const [form, setForm] = useState<FormData | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [questions, setQuestions] = useState<any[]>([]);
  const [responses, setResponses] = useState<FormResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedResponse, setSelectedResponse] = useState<FormResponse | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showPendingModal, setShowPendingModal] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [allStudents, setAllStudents] = useState<any[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [pendingStudents, setPendingStudents] = useState<any[]>([]);

  useEffect(() => {
    if (formId) {
      fetchFormAndResponses();
      fetchAllStudents();
    }
  }, [formId]);

  const fetchAllStudents = async () => {
    try {
      const result = await getAllStudents();
      if (result.success && result.data) {
        setAllStudents(result.data);
      }
    } catch (error) {
      console.error('Error fetching students:', error);
    }
  };

  const fetchFormAndResponses = async () => {
    if (!formId) return;

    setLoading(true);
    try {
      // Fetch form details
      const formResult = await getFormById(formId);
      if (formResult.success && formResult.data) {
        const formData = formResult.data.form;
        setForm({
          id: formData.id,
          name: formData.name,
          description: formData.description,
          type: formData.type,
          batch: formData.batch,
          totalResponses: formData.totalResponses,
          status: formData.status,
          createdBy: formData.createdBy,
          startDateTime: formData.startDateTime,
          endDateTime: formData.endDateTime
        });

        // Store questions for mapping
        setQuestions(formResult.data.questions || []);
      }

      // Fetch responses
      const responsesResult = await getFormResponses(formId);
      if (responsesResult.success && responsesResult.data) {
        setResponses(responsesResult.data);
      } else {
        toast.error(responsesResult.error || 'Failed to load responses');
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load form data');
    } finally {
      setLoading(false);
    }
  };

  const handleViewResponse = (response: FormResponse) => {
    setSelectedResponse(response);
    setShowDetailModal(true);
  };

  const handleShowPendingStudents = () => {
    // Get list of emails who have responded
    const respondedEmails = new Set(responses.map(r => r.userEmail.toLowerCase()));

    // Filter students from the form's batch who haven't responded
    const pending = allStudents.filter(student => {
      const studentEmail = student.email?.toLowerCase();
      const studentBatch = student.batch;
      const studentRole = student.role?.toLowerCase();

      // Check if student is in the form's batch, hasn't responded, and is not an admin
      return (
        studentBatch === form?.batch &&
        studentEmail &&
        !respondedEmails.has(studentEmail) &&
        studentRole !== 'admin'
      );
    });

    setPendingStudents(pending);
    setShowPendingModal(true);
  };

  const handleExportCSV = () => {
    if (responses.length === 0) {
      toast.error('No responses to export');
      return;
    }

    try {
      // Create CSV content - include all columns from the backend
      const headers = [
        'Response ID',
        'Form ID',
        'User Name',
        'Email',
        'Batch',
        'Submission Date',
        'Completion Time (s)',
        'Status',
        'IP Address',
        'Last Modified At',
        'Device Type',
        'Notes'
      ];

      // Add question headers from Response_JSON (responseData)
      const firstResponse = responses[0];
      const responseData = firstResponse.responseData;

      const questionIds = Object.keys(responseData || {});

      // Create a map of question ID to question text
      const questionIdToText: Record<string, string> = {};
      questions.forEach(q => {
        questionIdToText[q.id] = q.questionText || q.id;
      });

      // Use question text as headers instead of IDs
      const questionTextHeaders = questionIds.map(qId => questionIdToText[qId] || qId);

      // Add additional columns from response sheet (dynamic columns beyond column M)
      const additionalColumnNames: string[] = [];
      if (firstResponse.additionalColumns) {
        Object.keys(firstResponse.additionalColumns).forEach(colName => {
          additionalColumnNames.push(colName);
        });
      }

      const allHeaders = [...headers, ...questionTextHeaders, ...additionalColumnNames];

      // Create CSV rows
      const csvRows = [allHeaders.join(',')];

      responses.forEach(response => {
        const data = response.responseData;

        const row = [
          response.responseId,
          response.formId || formId || '',
          response.userName,
          response.userEmail,
          response.userBatch,
          response.submissionDateTime,
          response.completionTimeSeconds || 0,
          response.isComplete,
          response.ipAddress || '',
          response.lastModifiedAt || '',
          response.deviceType || '',
          response.notes || ''
        ];

        // Add answers from Response_JSON
        questionIds.forEach(qId => {
          const answer = data?.[qId] || '';
          row.push(typeof answer === 'string' ? answer : JSON.stringify(answer));
        });

        // Add additional columns (individual question columns from sheet)
        additionalColumnNames.forEach(colName => {
          const value = response.additionalColumns?.[colName] || '';
          row.push(typeof value === 'string' ? value : JSON.stringify(value));
        });

        csvRows.push(row.map(cell => `"${cell}"`).join(','));
      });

      // Download CSV
      const csvContent = csvRows.join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);

      link.setAttribute('href', url);
      link.setAttribute('download', `${form?.name || 'form'}_responses_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success('Responses exported successfully!');
    } catch (error) {
      console.error('Error exporting CSV:', error);
      toast.error('Failed to export responses');
    }
  };

  const filteredResponses = responses.filter(response => {
    if (!searchTerm.trim()) return true;

    const searchLower = searchTerm.toLowerCase();
    return (
      response.userName.toLowerCase().includes(searchLower) ||
      response.userEmail.toLowerCase().includes(searchLower) ||
      response.userBatch.toLowerCase().includes(searchLower)
    );
  });

  const stats = {
    total: responses.length,
    completed: responses.filter(r => r.isComplete === 'Yes').length,
    avgTime: responses.length > 0
      ? Math.round(responses.reduce((sum, r) => sum + (r.completionTimeSeconds || 0), 0) / responses.length)
      : 0,
    uniqueUsers: new Set(responses.map(r => r.userEmail)).size
  };

  // Calculate question analytics based on question types
  const getQuestionAnalytics = () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const analytics: any[] = [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const npsQuestions: any[] = [];

    console.log('🔍 Analyzing questions for analytics:', questions.map(q => ({ id: q.id, type: q.type, text: q.questionText })));

    questions.forEach((question) => {
      const questionId = question.id;
      const questionType = (question.questionType || question.type)?.toLowerCase();
      const questionText = question.questionText;

      console.log(`📊 Question "${questionText}" has type: "${questionType}"`);

      // Collect all answers for this question
      const answers = responses
        .map(r => r.responseData[questionId])
        .filter(a => a !== null && a !== undefined && a !== '');

      if (answers.length === 0) return;

      // Yes/No Questions
      if (questionType === 'yes/no' || questionType === 'yes_no' || questionType === 'yes / no') {
        const yesCount = answers.filter(a => String(a).toLowerCase() === 'yes').length;
        const noCount = answers.filter(a => String(a).toLowerCase() === 'no').length;

        analytics.push({
          type: 'yes_no',
          question: questionText,
          data: { yes: yesCount, no: noCount },
          total: yesCount + noCount
        });
      }

      // NPS Questions (1-10 scale) - collect for both individual and combined analytics
      if (questionType === 'nps' || questionType === 'net_promoter_score') {
        const npsScores = answers
          .map(a => parseInt(String(a)))
          .filter(n => !isNaN(n) && n >= 1 && n <= 10);

        // Add individual NPS card
        const detractors = npsScores.filter(n => n >= 1 && n <= 6).length;
        const passives = npsScores.filter(n => n === 7 || n === 8).length;
        const promoters = npsScores.filter(n => n >= 9 && n <= 10).length;

        const npsScore = npsScores.length > 0
          ? Math.round(((promoters - detractors) / npsScores.length) * 100)
          : 0;

        // Distribution by score
        const distribution: Record<number, number> = {};
        for (let i = 1; i <= 10; i++) {
          distribution[i] = npsScores.filter(n => n === i).length;
        }

        analytics.push({
          type: 'nps',
          question: questionText,
          data: {
            score: npsScore,
            detractors,
            passives,
            promoters,
            distribution,
            total: npsScores.length
          }
        });

        // Also collect for combined analytics
        npsQuestions.push({
          question: questionText,
          scores: npsScores
        });
      }

      // Rating Questions (1-5 stars)
      if (questionType === 'rating' || questionType === 'star_rating' || questionType === 'star rating') {
        const ratings = answers
          .map(a => parseInt(String(a)))
          .filter(n => !isNaN(n) && n >= 1 && n <= 5);

        const avgRating = ratings.length > 0
          ? (ratings.reduce((sum, r) => sum + r, 0) / ratings.length).toFixed(1)
          : '0';

        // Distribution by star
        const distribution: Record<number, number> = {};
        for (let i = 1; i <= 5; i++) {
          distribution[i] = ratings.filter(n => n === i).length;
        }

        analytics.push({
          type: 'rating',
          question: questionText,
          data: {
            average: parseFloat(avgRating),
            distribution,
            total: ratings.length
          }
        });
      }
    });

    // If we have MULTIPLE NPS questions, create a combined NPS analytics card
    if (npsQuestions.length > 1) {
      // Combine all NPS scores
      const allNpsScores = npsQuestions.flatMap(q => q.scores);

      // Calculate combined metrics
      const detractors = allNpsScores.filter(n => n >= 1 && n <= 6).length;
      const passives = allNpsScores.filter(n => n === 7 || n === 8).length;
      const promoters = allNpsScores.filter(n => n >= 9 && n <= 10).length;

      const combinedNpsScore = allNpsScores.length > 0
        ? Math.round(((promoters - detractors) / allNpsScores.length) * 100)
        : 0;

      // Combined distribution
      const combinedDistribution: Record<number, number> = {};
      for (let i = 1; i <= 10; i++) {
        combinedDistribution[i] = allNpsScores.filter(n => n === i).length;
      }

      // Calculate average score per question
      const questionBreakdown = npsQuestions.map((q) => {
        const scores = q.scores as number[];
        const d = scores.filter((n: number) => n >= 1 && n <= 6).length;
        // passives (scores 7-8) are not used in NPS calculation
        const pr = scores.filter((n: number) => n >= 9 && n <= 10).length;
        const score = scores.length > 0 ? Math.round(((pr - d) / scores.length) * 100) : 0;

        return {
          question: q.question,
          score,
          total: scores.length
        };
      });

      analytics.unshift({
        type: 'nps_combined',
        question: 'Overall NPS Score',
        data: {
          score: combinedNpsScore,
          detractors,
          passives,
          promoters,
          distribution: combinedDistribution,
          total: allNpsScores.length,
          questionCount: npsQuestions.length,
          breakdown: questionBreakdown
        }
      });
    }

    return analytics;
  };

  const questionAnalytics = getQuestionAnalytics();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading responses...</p>
        </div>
      </div>
    );
  }

  if (!form) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-12 text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">Form not found</h3>
            <p className="text-muted-foreground mb-4">The requested form could not be found.</p>
            <Button onClick={() => navigate('/admin/forms')} variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Forms
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
          <Button
            variant="outline"
            onClick={() => navigate('/admin/forms')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
              <BarChart3 className="h-8 w-8 text-primary" />
              {form.name} - Responses
            </h1>
            <p className="text-muted-foreground mt-1">
              {form.type} • {form.batch} • Created by {form.createdBy}
            </p>
          </div>
        </div>
        <Button
          onClick={handleExportCSV}
          disabled={responses.length === 0}
          className="flex items-center gap-2"
        >
          <Download className="h-4 w-4" />
          Export CSV
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card
          className="cursor-pointer hover:bg-accent/50 transition-colors"
          onClick={handleShowPendingStudents}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <FileText className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="text-2xl font-bold text-foreground">{stats.total}</p>
                  <p className="text-sm text-muted-foreground">Total Responses</p>
                </div>
              </div>
              <Eye className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-2xl font-bold text-foreground">{stats.completed}</p>
                <p className="text-sm text-muted-foreground">Completed</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-yellow-600" />
              <div>
                <p className="text-2xl font-bold text-foreground">{stats.avgTime}s</p>
                <p className="text-sm text-muted-foreground">Avg. Time</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-primary" />
              <div>
                <p className="text-2xl font-bold text-foreground">{stats.uniqueUsers}</p>
                <p className="text-sm text-muted-foreground">Unique Users</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Question Analytics - Dynamic based on question types */}
      {questionAnalytics.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-foreground">Question Analytics</h2>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {questionAnalytics.map((analytic, index) => (
              <Card key={index}>
                <CardContent className="p-6">
                  <h3 className="text-sm font-medium text-muted-foreground mb-4 line-clamp-2">
                    {analytic.question}
                  </h3>

                  {/* Yes/No Analytics */}
                  {analytic.type === 'yes_no' && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-green-500"></div>
                          <span className="text-sm text-foreground">Yes</span>
                        </div>
                        <span className="text-lg font-bold text-foreground">
                          {analytic.data.yes} ({Math.round((analytic.data.yes / analytic.total) * 100)}%)
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-red-500"></div>
                          <span className="text-sm text-foreground">No</span>
                        </div>
                        <span className="text-lg font-bold text-foreground">
                          {analytic.data.no} ({Math.round((analytic.data.no / analytic.total) * 100)}%)
                        </span>
                      </div>
                      <div className="mt-2 text-xs text-muted-foreground">
                        Total responses: {analytic.total}
                      </div>
                    </div>
                  )}

                  {/* Combined NPS Analytics */}
                  {analytic.type === 'nps_combined' && (
                    <div className="space-y-4">
                      <div className="text-center p-4 bg-muted/30 rounded-lg">
                        <p className="text-3xl font-bold text-foreground">{analytic.data.score}</p>
                        <p className="text-xs text-muted-foreground">
                          {analytic.data.questionCount > 1 ? `Combined NPS Score (${analytic.data.questionCount} questions)` : 'NPS Score'}
                        </p>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-red-600">Detractors (1-6)</span>
                          <span className="font-semibold">{analytic.data.detractors}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-yellow-600">Passives (7-8)</span>
                          <span className="font-semibold">{analytic.data.passives}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-green-600">Promoters (9-10)</span>
                          <span className="font-semibold">{analytic.data.promoters}</span>
                        </div>
                      </div>

                      {/* Score Distribution */}
                      <div className="mt-3">
                        <p className="text-xs text-muted-foreground mb-2">Score Distribution</p>
                        <div className="flex gap-1">
                          {Object.entries(analytic.data.distribution).map(([score, countVal]) => {
                            const count = countVal as number;
                            const maxCount = Math.max(...Object.values(analytic.data.distribution) as number[]);
                            const height = maxCount > 0 ? (count / maxCount) * 40 : 0;
                            return (
                              <div key={score} className="flex-1 flex flex-col items-center">
                                <div
                                  className="w-full bg-primary rounded-t"
                                  style={{ height: `${height}px`, minHeight: count > 0 ? '4px' : '0' }}
                                  title={`Score ${score}: ${count} responses`}
                                ></div>
                                <span className="text-xs text-muted-foreground mt-1">{score}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Question Breakdown (if multiple questions) */}
                      {analytic.data.questionCount > 1 && (
                        <div className="mt-4 pt-4 border-t border-border">
                          <p className="text-xs text-muted-foreground mb-2 font-semibold">Breakdown by Question</p>
                          <div className="space-y-2">
                            {analytic.data.breakdown.map((q: { question: string; score: number }, idx: number) => (
                              <div key={idx} className="flex items-center justify-between text-xs">
                                <span className="text-muted-foreground truncate flex-1 mr-2">{q.question}</span>
                                <span className="font-semibold text-foreground">{q.score}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="text-xs text-muted-foreground">
                        Total responses: {analytic.data.total}
                      </div>
                    </div>
                  )}

                  {/* NPS Analytics */}
                  {analytic.type === 'nps' && (
                    <div className="space-y-4">
                      <div className="text-center p-4 bg-muted/30 rounded-lg">
                        <p className="text-3xl font-bold text-foreground">{analytic.data.score}</p>
                        <p className="text-xs text-muted-foreground">NPS Score</p>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-red-600">Detractors (1-6)</span>
                          <span className="font-semibold">{analytic.data.detractors}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-yellow-600">Passives (7-8)</span>
                          <span className="font-semibold">{analytic.data.passives}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-green-600">Promoters (9-10)</span>
                          <span className="font-semibold">{analytic.data.promoters}</span>
                        </div>
                      </div>

                      {/* Score Distribution */}
                      <div className="mt-3">
                        <p className="text-xs text-muted-foreground mb-2">Score Distribution</p>
                        <div className="flex gap-1">
                          {Object.entries(analytic.data.distribution).map(([score, countVal]) => {
                            const count = countVal as number;
                            const maxCount = Math.max(...Object.values(analytic.data.distribution) as number[]);
                            const height = maxCount > 0 ? (count / maxCount) * 40 : 0;
                            return (
                              <div key={score} className="flex-1 flex flex-col items-center">
                                <div
                                  className="w-full bg-primary rounded-t"
                                  style={{ height: `${height}px`, minHeight: count > 0 ? '4px' : '0' }}
                                  title={`Score ${score}: ${count} responses`}
                                ></div>
                                <span className="text-xs text-muted-foreground mt-1">{score}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      <div className="text-xs text-muted-foreground">
                        Total responses: {analytic.data.total}
                      </div>
                    </div>
                  )}

                  {/* Rating Analytics */}
                  {analytic.type === 'rating' && (
                    <div className="space-y-4">
                      <div className="text-center p-4 bg-muted/30 rounded-lg">
                        <div className="flex items-center justify-center gap-2">
                          <p className="text-3xl font-bold text-foreground">{analytic.data.average}</p>
                          <span className="text-yellow-500 text-2xl">★</span>
                        </div>
                        <p className="text-xs text-muted-foreground">Average Rating</p>
                      </div>

                      {/* Star Distribution */}
                      <div className="space-y-2">
                        {[5, 4, 3, 2, 1].map((star) => {
                          const count = analytic.data.distribution[star] || 0;
                          const percentage = analytic.data.total > 0
                            ? Math.round((count / analytic.data.total) * 100)
                            : 0;

                          return (
                            <div key={star} className="flex items-center gap-2">
                              <span className="text-sm font-medium w-12">{star} ★</span>
                              <div className="flex-1 h-4 bg-muted rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-yellow-500"
                                  style={{ width: `${percentage}%` }}
                                ></div>
                              </div>
                              <span className="text-sm font-semibold w-12 text-right">{count}</span>
                            </div>
                          );
                        })}
                      </div>

                      <div className="text-xs text-muted-foreground">
                        Total responses: {analytic.data.total}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Search Bar */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search by name, email, or batch..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-input rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Responses Table */}
      {filteredResponses.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">No responses yet</h3>
            <p className="text-muted-foreground">
              {searchTerm ? 'No responses match your search' : 'Responses will appear here once users submit the form'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/50 border-b border-border">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider sticky left-0 bg-muted/50 z-10">
                      Name
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Batch
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Time (s)
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Status
                    </th>
                    {/* Dynamic question columns */}
                    {questions.map((question) => (
                      <th
                        key={question.id}
                        className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider min-w-[200px]"
                      >
                        {question.questionText}
                      </th>
                    ))}
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider sticky right-0 bg-muted/50 z-10">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredResponses.map((response) => (
                    <tr
                      key={response.responseId}
                      className="hover:bg-muted/30 transition-colors"
                    >
                      <td className="px-4 py-3 text-sm font-medium text-foreground sticky left-0 bg-background z-10">
                        {response.userName}
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        {response.userEmail}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <Badge variant="outline">{response.userBatch}</Badge>
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        {new Date(response.submissionDateTime).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        {response.completionTimeSeconds || 0}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {response.isComplete === 'Yes' ? (
                          <Badge className="bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300">
                            Complete
                          </Badge>
                        ) : (
                          <Badge variant="outline">Pending</Badge>
                        )}
                      </td>
                      {/* Dynamic answer columns */}
                      {questions.map((question) => {
                        const answer = response.responseData[question.id];
                        return (
                          <td key={question.id} className="px-4 py-3 text-sm text-foreground">
                            {answer !== null && answer !== undefined ? (
                              typeof answer === 'object' ? (
                                <span className="text-xs">{JSON.stringify(answer)}</span>
                              ) : (
                                String(answer)
                              )
                            ) : (
                              <span className="text-muted-foreground italic">-</span>
                            )}
                          </td>
                        );
                      })}
                      <td className="px-4 py-3 text-sm sticky right-0 bg-background z-10">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewResponse(response)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Response Detail Modal */}
      {showDetailModal && selectedResponse && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-background border border-border rounded-lg shadow-xl max-w-4xl w-full my-8">
            <div className="p-6 border-b border-border">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-foreground">Response Details</h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    Submitted by {selectedResponse.userName} ({selectedResponse.userEmail})
                  </p>
                </div>
                <Button
                  variant="outline"
                  onClick={() => setShowDetailModal(false)}
                  className="rounded-full h-8 w-8 p-0"
                >
                  ×
                </Button>
              </div>
            </div>

            <div className="p-6 space-y-6 max-h-[600px] overflow-y-auto">
              {/* Response Metadata */}
              <div className="grid grid-cols-2 gap-4 p-4 bg-muted/30 rounded-lg">
                <div>
                  <p className="text-sm text-muted-foreground">Response ID</p>
                  <p className="font-mono text-sm">{selectedResponse.responseId}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Batch</p>
                  <p className="font-semibold">{selectedResponse.userBatch}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Submitted At</p>
                  <p className="font-semibold">{selectedResponse.submissionDateTime}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Completion Time</p>
                  <p className="font-semibold">{selectedResponse.completionTimeSeconds || 0} seconds</p>
                </div>
              </div>

              {/* Response Answers */}
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-4">Answers</h3>
                <div className="space-y-4">
                  {(() => {
                    try {
                      const responseData = selectedResponse.responseData;

                      return Object.entries(responseData || {}).map(([questionId, answer], index) => {
                        // Find the question by ID
                        const question = questions.find(q => q.id === questionId);
                        const questionText = question?.questionText || `Question ${index + 1}`;

                        return (
                          <div key={questionId} className="p-4 bg-muted/30 rounded-lg">
                            <p className="text-sm font-medium text-foreground mb-2">{questionText}</p>
                            <p className="text-sm text-muted-foreground">
                              {typeof answer === 'object' ? JSON.stringify(answer, null, 2) : String(answer)}
                            </p>
                          </div>
                        );
                      });
                    } catch (error) {
                      return (
                        <p className="text-sm text-red-600">
                          Error parsing response data
                        </p>
                      );
                    }
                  })()}
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-border flex justify-end">
              <Button onClick={() => setShowDetailModal(false)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Pending Students Modal */}
      {showPendingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="relative w-full max-w-2xl max-h-[80vh] bg-background border border-border rounded-lg shadow-lg overflow-hidden">
            <div className="p-6 border-b border-border">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-foreground">
                    Students Yet to Fill Form
                  </h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    {pendingStudents.length} student(s) from {form?.batch} batch haven't submitted yet
                  </p>
                </div>
                <button
                  onClick={() => setShowPendingModal(false)}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-6 overflow-y-auto max-h-[calc(80vh-180px)]">
              {pendingStudents.length === 0 ? (
                <div className="text-center py-12">
                  <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4" />
                  <p className="text-lg font-medium text-foreground">All students have filled the form!</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Every student from the {form?.batch} batch has submitted their response.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {pendingStudents.map((student, index) => (
                    <div
                      key={student.email || index}
                      className="flex items-center justify-between p-4 bg-accent/50 rounded-lg border border-border hover:border-primary/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <User className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground">
                            {student.name}
                            {student.rollNo && (
                              <span className="ml-2 text-sm text-muted-foreground">({student.rollNo})</span>
                            )}
                          </p>
                          <p className="text-sm text-muted-foreground">{student.email}</p>
                        </div>
                      </div>
                      <Badge variant="outline" className="bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/20">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        Pending
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="p-6 border-t border-border flex justify-between items-center">
              <p className="text-sm text-muted-foreground">
                Total: {pendingStudents.length} pending out of {allStudents.filter(s => s.batch === form?.batch && s.role?.toLowerCase() !== 'admin').length} students in batch
              </p>
              <Button onClick={() => setShowPendingModal(false)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default FormResponsesPage;
