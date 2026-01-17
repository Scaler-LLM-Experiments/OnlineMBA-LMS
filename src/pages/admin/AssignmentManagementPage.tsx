import React, { useState, useCallback } from 'react';
import { ClipboardList, ArrowLeft, Plus, List, RefreshCw, Activity } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AssignmentManagementCard } from '../../components/admin/AssignmentManagementCard';
import { RefreshStudentsPlatformModal } from '../../components/admin/RefreshStudentsPlatformModal';

type TabType = 'all' | 'create';

export function AssignmentManagementPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isRefreshModalOpen, setIsRefreshModalOpen] = useState(false);

  // Get tab from URL for browser back support
  const activeTab = (searchParams.get('tab') as TabType) || 'all';

  // URL-based tab setter for browser back support
  const setActiveTab = useCallback((tab: TabType) => {
    const params = new URLSearchParams(searchParams);
    if (tab === 'all') {
      params.delete('tab');
    } else {
      params.set('tab', tab);
    }
    const queryString = params.toString();
    navigate(queryString ? `/admin/assignments?${queryString}` : '/admin/assignments', { replace: false });
  }, [navigate, searchParams]);

  const tabs = [
    { id: 'all', label: 'View All', icon: List },
    { id: 'create', label: 'Create New', icon: Plus }
  ];

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
          <div className="p-3 bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-xl">
            <ClipboardList className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Assignment Management</h1>
            <p className="text-muted-foreground">Create and manage assignments with file uploads and submissions</p>
          </div>
        </div>
      </div>

      {/* Tabs and Action Buttons - Glass Morphism Style */}
      <div className="mb-6 flex items-center justify-between">
        <div className="inline-flex gap-2 p-1 rounded-xl border border-border/50 bg-card/30 backdrop-blur-xl">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as 'all' | 'create')}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-lg font-medium transition-all ${
                  activeTab === tab.id
                    ? 'bg-cyan-600 text-white shadow-lg'
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          {/* Track Actions Button */}
          <button
            onClick={() => navigate('/admin/assignments/track-actions')}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl border border-border/50 bg-gradient-to-r from-indigo-500 to-indigo-600 text-white font-medium shadow-lg hover:shadow-xl transition-all hover:scale-105"
          >
            <Activity className="w-4 h-4" />
            Track Actions
          </button>

          {/* Refresh Students Platform Button */}
          <button
            onClick={() => setIsRefreshModalOpen(true)}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl border border-border/50 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-medium shadow-lg hover:shadow-xl transition-all hover:scale-105"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh Students Platform
          </button>
        </div>
      </div>

      {/* Tab Content */}
      <div>
        <AssignmentManagementCard
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />
      </div>

      {/* Refresh Students Platform Modal */}
      <RefreshStudentsPlatformModal
        isOpen={isRefreshModalOpen}
        onClose={() => setIsRefreshModalOpen(false)}
      />
    </div>
  );
}

export default AssignmentManagementPage;
