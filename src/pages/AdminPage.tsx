import React, { useState, useEffect } from 'react';
import {
  Shield,
  Video,
  BookOpen,
  Calendar,
  FileText,
  ArrowRight,
  ListChecks,
  ClipboardCheck,
  Briefcase,
  Activity,
  ClipboardList,
  Settings,
  Users,
  BarChart3,
  UserPlus,
  Loader2,
} from 'lucide-react';
import { useAuth } from '../features/auth/hooks/useAuth';
import { Navigate, useNavigate } from 'react-router-dom';
import { apiService } from '../services/api';

// Stats Card Component
const StatsCard = ({ icon, value, label, color, loading }: {
  icon: React.ReactNode;
  value: string | number;
  label: string;
  color: string;
  loading?: boolean;
}) => (
  <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-4 flex items-center gap-4">
    <div className={`p-3 ${color}`}>
      {icon}
    </div>
    <div>
      <div className="text-2xl font-bold text-gray-900 dark:text-white">
        {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : value}
      </div>
      <div className="text-sm text-gray-500 dark:text-gray-400">{label}</div>
    </div>
  </div>
);

// Admin Card Component
const AdminCard = ({
  icon: Icon,
  title,
  description,
  onClick,
  accentColor
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  onClick: () => void;
  accentColor: string;
}) => (
  <button
    onClick={onClick}
    className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-5 text-left hover:border-[#fd621b] dark:hover:border-[#fc9100] hover:shadow-lg hover:shadow-orange-500/10 transition-all group"
  >
    <div className="flex items-start gap-4">
      <div className={`p-3 ${accentColor} flex-shrink-0`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-gray-900 dark:text-white group-hover:text-[#fd621b] dark:group-hover:text-[#fc9100] transition-colors">
            {title}
          </h3>
          <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-[#fd621b] group-hover:translate-x-1 transition-all flex-shrink-0" />
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
          {description}
        </p>
      </div>
    </div>
  </button>
);

interface AdminStats {
  totalStudents: number;
  totalResources: number;
  totalAssignments: number;
  activeSessions: number;
}

export function AdminPage() {
  const { student, user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<AdminStats>({
    totalStudents: 0,
    totalResources: 0,
    totalAssignments: 0,
    activeSessions: 0,
  });
  const [loadingStats, setLoadingStats] = useState(true);

  // Fetch admin stats
  useEffect(() => {
    const fetchStats = async () => {
      if (!user?.email) return;

      setLoadingStats(true);
      try {
        // Fetch students count
        const studentsResult = await apiService.getEnrolledStudents(user.email);
        const totalStudents = studentsResult.success && studentsResult.data ? studentsResult.data.length : 0;

        // Fetch resources count
        const resourcesResult = await apiService.getResources(user.email);
        const totalResources = resourcesResult.success && resourcesResult.data ? resourcesResult.data.length : 0;

        // Fetch events count (using as proxy for active sessions)
        const eventsResult = await apiService.getEvents(user.email);
        const activeSessions = eventsResult.success && eventsResult.data ? eventsResult.data.length : 0;

        // Fetch policies count (using as proxy for assignments for now)
        const policiesResult = await apiService.getPolicies(user.email);
        const totalAssignments = policiesResult.success && policiesResult.data ? policiesResult.data.length : 0;

        setStats({
          totalStudents,
          totalResources,
          totalAssignments,
          activeSessions,
        });
      } catch (error) {
        console.error('Error fetching admin stats:', error);
      } finally {
        setLoadingStats(false);
      }
    };

    fetchStats();
  }, [user?.email]);

  // Redirect non-admin users
  if (!student?.isAdmin) {
    return <Navigate to="/overview" replace />;
  }

  const adminCards = [
    {
      id: 'zoom',
      title: 'Zoom Management',
      description: 'Manage Zoom sessions, live recordings, and sync data',
      icon: Video,
      accentColor: 'bg-blue-500',
      route: '/admin/zoom',
    },
    {
      id: 'resources',
      title: 'Resources Management',
      description: 'Manage course materials, lecture slides, and study resources',
      icon: BookOpen,
      accentColor: 'bg-green-500',
      route: '/admin/resources',
    },
    {
      id: 'events',
      title: 'Events & Announcements',
      description: 'Create and manage events, webinars, and announcements',
      icon: Calendar,
      accentColor: 'bg-purple-500',
      route: '/admin/events',
    },
    {
      id: 'policies',
      title: 'Policies & Documents',
      description: 'Manage policies, guidelines, and official documents',
      icon: FileText,
      accentColor: 'bg-[#fd621b]',
      route: '/admin/policies',
    },
    {
      id: 'forms',
      title: 'Form Management',
      description: 'Create and manage dynamic forms, surveys, and feedback',
      icon: ListChecks,
      accentColor: 'bg-indigo-500',
      route: '/admin/forms',
    },
    {
      id: 'exams',
      title: 'Exam Management',
      description: 'Create proctored exams with MCQ, coding questions and auto-grading',
      icon: ClipboardCheck,
      accentColor: 'bg-red-500',
      route: '/admin/exams',
    },
    {
      id: 'assignments',
      title: 'Assignment Management',
      description: 'Create and manage assignments with file uploads and submissions',
      icon: ClipboardList,
      accentColor: 'bg-cyan-500',
      route: '/admin/assignments',
    },
    {
      id: 'placement',
      title: 'Placement Management',
      description: 'Enable placement profiles and manage job postings',
      icon: Briefcase,
      accentColor: 'bg-teal-500',
      route: '/admin/placement',
    },
    {
      id: 'usage-tracker',
      title: 'Portal Usage Tracker',
      description: 'Monitor student activity, video engagement, and portal usage analytics',
      icon: Activity,
      accentColor: 'bg-pink-500',
      route: '/admin/usage-tracker',
    },
    {
      id: 'course-access',
      title: 'Course Access',
      description: 'Manage student enrollment, assign roll numbers, and control portal access',
      icon: UserPlus,
      accentColor: 'bg-amber-500',
      route: '/admin/course-access',
    }
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header Section */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-6">
          <div className="p-4 bg-[#fd621b]">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Admin Panel</h1>
            <p className="text-gray-500 dark:text-gray-400">Manage content, sessions, and administrative tasks</p>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard
            icon={<Users className="w-6 h-6 text-white" />}
            value={stats.totalStudents}
            label="Total Students"
            color="bg-blue-500"
            loading={loadingStats}
          />
          <StatsCard
            icon={<BookOpen className="w-6 h-6 text-white" />}
            value={stats.totalResources}
            label="Resources"
            color="bg-green-500"
            loading={loadingStats}
          />
          <StatsCard
            icon={<ClipboardList className="w-6 h-6 text-white" />}
            value={stats.totalAssignments}
            label="Policies"
            color="bg-[#fd621b]"
            loading={loadingStats}
          />
          <StatsCard
            icon={<BarChart3 className="w-6 h-6 text-white" />}
            value={stats.activeSessions}
            label="Events"
            color="bg-purple-500"
            loading={loadingStats}
          />
        </div>
      </div>

      {/* Management Modules */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Settings className="w-5 h-5 text-[#fd621b]" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Management Modules</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {adminCards.map((card) => (
            <AdminCard
              key={card.id}
              icon={card.icon}
              title={card.title}
              description={card.description}
              accentColor={card.accentColor}
              onClick={() => navigate(card.route)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export default AdminPage;
