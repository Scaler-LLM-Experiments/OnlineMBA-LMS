import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, useParams } from 'react-router-dom';
import { Video, Film, FileEdit } from 'lucide-react';
import { LiveSessionsPage } from './LiveSessionsPage';
import { RecordingsPage } from './RecordingsPage';
import { NotesPage } from './NotesPage';

type TabType = 'live' | 'recordings' | 'notes';

export function SessionsPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const params = useParams();
  const [activeTab, setActiveTab] = useState<TabType>('live');

  // Update active tab based on URL query parameter
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam === 'recordings') {
      setActiveTab('recordings');
    } else {
      setActiveTab('live');
    }
  }, [searchParams]);

  // Handle tab change with URL updates - preserve path parameters
  const handleTabChange = (tab: TabType) => {
    const { term, domain, subject } = params;
    let path = '/sessions';

    // Build path with parameters if they exist
    if (term) {
      path += `/${term}`;
      if (domain) {
        path += `/${domain}`;
        if (subject) {
          path += `/${subject}`;
        }
      }
    }

    if (tab === 'live') {
      navigate(path);
    } else if (tab === 'recordings') {
      navigate(`${path}?tab=recordings`);
    } else if (tab === 'notes') {
      // Navigate to my-notes with same parameters
      let notesPath = '/my-notes';
      if (term) {
        notesPath += `/${term}`;
        if (domain) {
          notesPath += `/${domain}`;
          if (subject) {
            notesPath += `/${subject}`;
          }
        }
      }
      navigate(notesPath);
    }
  };

  const tabs = [
    { id: 'live' as TabType, label: 'Live & Upcoming', icon: Video },
    { id: 'recordings' as TabType, label: 'Recordings', icon: Film },
    { id: 'notes' as TabType, label: 'My Notes', icon: FileEdit },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header with Tabs - Only show for live and recordings */}
      {activeTab !== 'notes' && (
        <div className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
          <div className="px-6 pt-6 pb-0">
            <h1 className="text-3xl font-bold text-foreground mb-6">Sessions</h1>

            {/* Tabs */}
            <div className="flex gap-1">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;

                return (
                  <button
                    key={tab.id}
                    onClick={() => handleTabChange(tab.id)}
                    className={`
                      flex items-center gap-2 px-6 py-3 rounded-t-lg font-medium transition-all
                      ${isActive
                        ? 'bg-card text-primary border-t border-l border-r border-border'
                        : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
                      }
                    `}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Tab Content */}
      <div className={activeTab !== 'notes' ? 'bg-card border-t border-border' : ''}>
        {activeTab === 'live' && <LiveSessionsPage />}
        {activeTab === 'recordings' && <RecordingsPage />}
        {activeTab === 'notes' && <NotesPage />}
      </div>
    </div>
  );
}

export default SessionsPage;
