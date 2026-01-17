import React, { useCallback } from 'react';
import { BookOpen, ArrowLeft, Plus, List } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ResourcesManagementCard } from '../../components/admin/ResourcesManagementCard';

type TabType = 'all' | 'create';

export function ResourcesManagementPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

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
    navigate(queryString ? `/admin/resources?${queryString}` : '/admin/resources', { replace: false });
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
          <div className="p-3 bg-gradient-to-br from-green-500 to-green-600 rounded-xl">
            <BookOpen className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Resources Management</h1>
            <p className="text-muted-foreground">Manage course materials, lecture slides, and study resources</p>
          </div>
        </div>
      </div>

      {/* Tabs - Glass Morphism Style */}
      <div className="mb-6">
        <div className="inline-flex gap-2 p-1 rounded-xl border border-border/50 bg-card/30 backdrop-blur-xl">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as 'all' | 'create')}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-lg font-medium transition-all ${
                  activeTab === tab.id
                    ? 'bg-green-600 text-white shadow-lg'
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content */}
      <div>
        <ResourcesManagementCard
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />
      </div>
    </div>
  );
}

export default ResourcesManagementPage;
