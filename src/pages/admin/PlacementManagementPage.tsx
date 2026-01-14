import React from 'react';
import { Briefcase, ArrowLeft, Building2, ArrowRight, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PlacementManagementCard } from '../../components/admin/PlacementManagementCard';

export function PlacementManagementPage() {
  const navigate = useNavigate();

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate('/admin')}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Admin Panel</span>
        </button>

        <div className="flex items-center gap-3 mb-2">
          <div className="p-3 bg-gradient-to-br from-teal-500 to-teal-600 rounded-xl">
            <Briefcase className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Placement Management</h1>
            <p className="text-muted-foreground">Enable and manage student placement profiles and job postings</p>
          </div>
        </div>
      </div>

      {/* Management Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Placement Profile Management */}
        <div className="max-w-2xl">
          <PlacementManagementCard />
        </div>

        {/* Job Portal Management */}
        <div className="group relative overflow-hidden rounded-xl border border-border/50 bg-card/30 backdrop-blur-xl p-6 transition-all duration-300 hover:shadow-xl hover:shadow-cyan-500/20 hover:border-cyan-500/50">
          {/* Glass morphism overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

          {/* Content */}
          <div className="relative">
            {/* Icon and Title */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-gradient-to-br from-cyan-500 to-cyan-600 shadow-lg">
                  <Building2 className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-foreground">
                    Job Portal
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Manage placement opportunities, internships, and job postings
                  </p>
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="mt-6 space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-cyan-500 mt-2"></div>
                <p className="text-sm text-muted-foreground">
                  Create and manage job postings with detailed information
                </p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-cyan-500 mt-2"></div>
                <p className="text-sm text-muted-foreground">
                  Track applications and student responses
                </p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-cyan-500 mt-2"></div>
                <p className="text-sm text-muted-foreground">
                  Manage eligibility criteria and visibility rules
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-6 pt-4 border-t border-border/50 space-y-3">
              <button
                onClick={() => navigate('/admin/jobs')}
                className="w-full px-4 py-2.5 rounded-lg bg-cyan-600 hover:bg-cyan-700 text-white border border-cyan-600 transition-colors font-medium flex items-center justify-center gap-2"
              >
                <ArrowRight className="w-4 h-4" />
                Go to Job Portal
              </button>
              <a
                href="/admin/jobs/new"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full px-4 py-2.5 rounded-lg bg-cyan-600/10 hover:bg-cyan-600/20 text-cyan-600 dark:text-cyan-400 border border-cyan-600/20 transition-colors font-medium flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Create New Job Posting
              </a>
            </div>

            {/* Hover indicator */}
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-cyan-500 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default PlacementManagementPage;
