import React, { useState } from 'react';
import { Calendar, ArrowLeft, Plus, List } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { EventsManagementCard } from '../../components/admin/EventsManagementCard';

export function EventsManagementPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'all' | 'create'>('all');

  const tabs = [
    { id: 'all', label: 'View All', icon: List },
    { id: 'create', label: 'Create New', icon: Plus }
  ];

  const handleEventCreated = () => {
    // Switch to "View All" tab to show the newly created/updated event
    setActiveTab('all');
  };

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
          <div className="p-3 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl">
            <Calendar className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Events & Announcements</h1>
            <p className="text-muted-foreground">Create and manage events, webinars, and announcements</p>
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
                    ? 'bg-purple-600 text-white shadow-lg'
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
        <EventsManagementCard
          activeTab={activeTab}
          onEventCreated={handleEventCreated}
          onSwitchToCreateTab={() => setActiveTab('create')}
        />
      </div>
    </div>
  );
}

export default EventsManagementPage;
