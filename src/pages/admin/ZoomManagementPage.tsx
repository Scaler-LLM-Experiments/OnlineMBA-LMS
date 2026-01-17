import React, { useCallback } from 'react';
import { Video, ArrowLeft, BarChart, PlayCircle, Download, Calendar } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ZoomManagementCard } from '../../components/admin/ZoomManagementCard';
import { ZoomCreateDataTable } from '../../components/admin/ZoomCreateDataTable';
import { ZoomLiveDataTable } from '../../components/admin/ZoomLiveDataTable';
import { ZoomRecordingDataTable } from '../../components/admin/ZoomRecordingDataTable';

type TabType = 'overview' | 'create' | 'live' | 'recordings';

export function ZoomManagementPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Get tab from URL for browser back support
  const activeTab = (searchParams.get('tab') as TabType) || 'overview';

  // URL-based tab setter for browser back support
  const setActiveTab = useCallback((tab: TabType) => {
    const params = new URLSearchParams(searchParams);
    if (tab === 'overview') {
      params.delete('tab');
    } else {
      params.set('tab', tab);
    }
    const queryString = params.toString();
    navigate(queryString ? `/admin/zoom?${queryString}` : '/admin/zoom', { replace: false });
  }, [navigate, searchParams]);

  const tabs = [
    { id: 'overview', label: 'Overview & Sync', icon: BarChart },
    { id: 'create', label: 'Create Zoom + Calendar', icon: Calendar },
    { id: 'live', label: 'Zoom Live', icon: PlayCircle },
    { id: 'recordings', label: 'Zoom Recordings', icon: Download }
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
          <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl">
            <Video className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Zoom Management</h1>
            <p className="text-muted-foreground">Manage Zoom sessions, live recordings, and sync data</p>
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
                onClick={() => setActiveTab(tab.id as 'overview' | 'create' | 'live' | 'recordings')}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-lg font-medium transition-all ${
                  activeTab === tab.id
                    ? 'bg-blue-600 text-white shadow-lg'
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
        {activeTab === 'overview' && <ZoomManagementCard />}
        {activeTab === 'create' && <ZoomCreateDataTable />}
        {activeTab === 'live' && <ZoomLiveDataTable />}
        {activeTab === 'recordings' && <ZoomRecordingDataTable />}
      </div>
    </div>
  );
}

export default ZoomManagementPage;
