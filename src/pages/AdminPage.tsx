import React from 'react';
import { Shield, Video, BookOpen, Calendar, FileText, ArrowRight, ListChecks, ClipboardCheck, Briefcase, Activity, ClipboardList } from 'lucide-react';
import { useAuth } from '../features/auth/hooks/useAuth';
import { Navigate, useNavigate } from 'react-router-dom';

export function AdminPage() {
  const { student } = useAuth();
  const navigate = useNavigate();

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
      color: 'from-blue-500 to-blue-600',
      route: '/admin/zoom',
      stats: { label: 'Sessions', value: '- -' }
    },
    {
      id: 'resources',
      title: 'Resources Management',
      description: 'Manage course materials, lecture slides, and study resources',
      icon: BookOpen,
      color: 'from-green-500 to-green-600',
      route: '/admin/resources',
      stats: { label: 'Resources', value: '- -' }
    },
    {
      id: 'events',
      title: 'Events & Announcements',
      description: 'Create and manage events, webinars, and announcements',
      icon: Calendar,
      color: 'from-purple-500 to-purple-600',
      route: '/admin/events',
      stats: { label: 'Events', value: '- -' }
    },
    {
      id: 'policies',
      title: 'Policies & Documents',
      description: 'Manage policies, guidelines, and official documents',
      icon: FileText,
      color: 'from-orange-500 to-orange-600',
      route: '/admin/policies',
      stats: { label: 'Policies', value: '- -' }
    },
    {
      id: 'forms',
      title: 'Form Management',
      description: 'Create and manage dynamic forms, surveys, and feedback',
      icon: ListChecks,
      color: 'from-indigo-500 to-indigo-600',
      route: '/admin/forms',
      stats: { label: 'Forms', value: '- -' }
    },
    {
      id: 'exams',
      title: 'Exam Management',
      description: 'Create proctored exams with MCQ, coding questions and auto-grading',
      icon: ClipboardCheck,
      color: 'from-red-500 to-red-600',
      route: '/admin/exams',
      stats: { label: 'Exams', value: '- -' }
    },
    {
      id: 'assignments',
      title: 'Assignment Management',
      description: 'Create and manage assignments with file uploads and submissions',
      icon: ClipboardList,
      color: 'from-cyan-500 to-cyan-600',
      route: '/admin/assignments',
      stats: { label: 'Assignments', value: '- -' }
    },
    {
      id: 'placement',
      title: 'Placement Management',
      description: 'Enable placement profiles and manage job postings',
      icon: Briefcase,
      color: 'from-teal-500 to-teal-600',
      route: '/admin/placement',
      stats: { label: 'Students', value: '- -' }
    },
    {
      id: 'usage-tracker',
      title: 'Portal Usage Tracker',
      description: 'Monitor student activity, video engagement, and portal usage analytics',
      icon: Activity,
      color: 'from-pink-500 to-pink-600',
      route: '/admin/usage-tracker',
      stats: { label: 'Activities', value: '- -' }
    }
  ];

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Admin Panel</h1>
            <p className="text-muted-foreground">Manage content, sessions, and administrative tasks</p>
          </div>
        </div>
      </div>

      {/* Admin Management Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {adminCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.id}
              onClick={() => navigate(card.route)}
              className="group relative overflow-hidden rounded-xl border border-border/50 bg-card/30 backdrop-blur-xl p-6 cursor-pointer transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:shadow-primary/20 hover:border-primary/50"
            >
              {/* Glass morphism overlay */}
              <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

              {/* Content */}
              <div className="relative">
                {/* Icon and Title */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-xl bg-gradient-to-br ${card.color} shadow-lg`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-foreground group-hover:text-primary transition-colors">
                        {card.title}
                      </h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        {card.description}
                      </p>
                    </div>
                  </div>
                  <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                </div>

                {/* Stats */}
                <div className="mt-6 pt-4 border-t border-border/50">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">{card.stats.label}</span>
                    <span className="text-2xl font-bold text-foreground">{card.stats.value}</span>
                  </div>
                </div>

                {/* Hover indicator */}
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-primary to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div className="mt-8 p-6 rounded-xl border border-border/50 bg-card/30 backdrop-blur-xl">
        <h3 className="text-lg font-semibold text-foreground mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button
            onClick={() => navigate('/admin/zoom')}
            className="px-4 py-3 rounded-lg bg-blue-600/10 hover:bg-blue-600/20 text-blue-600 dark:text-blue-400 border border-blue-600/20 transition-colors font-medium"
          >
            Sync Zoom
          </button>
          <button
            onClick={() => navigate('/admin/resources')}
            className="px-4 py-3 rounded-lg bg-green-600/10 hover:bg-green-600/20 text-green-600 dark:text-green-400 border border-green-600/20 transition-colors font-medium"
          >
            New Resource
          </button>
          <button
            onClick={() => navigate('/admin/events')}
            className="px-4 py-3 rounded-lg bg-purple-600/10 hover:bg-purple-600/20 text-purple-600 dark:text-purple-400 border border-purple-600/20 transition-colors font-medium"
          >
            New Event
          </button>
          <button
            onClick={() => navigate('/admin/policies')}
            className="px-4 py-3 rounded-lg bg-orange-600/10 hover:bg-orange-600/20 text-orange-600 dark:text-orange-400 border border-orange-600/20 transition-colors font-medium"
          >
            New Policy
          </button>
          <button
            onClick={() => navigate('/admin/forms')}
            className="px-4 py-3 rounded-lg bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-600 dark:text-indigo-400 border border-indigo-600/20 transition-colors font-medium"
          >
            New Form
          </button>
          <button
            onClick={() => navigate('/admin/exams/create')}
            className="px-4 py-3 rounded-lg bg-red-600/10 hover:bg-red-600/20 text-red-600 dark:text-red-400 border border-red-600/20 transition-colors font-medium"
          >
            New Exam
          </button>
        </div>
      </div>
    </div>
  );
}

export default AdminPage;
