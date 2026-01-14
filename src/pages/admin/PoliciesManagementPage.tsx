import React, { useState } from 'react';
import { FileText, ArrowLeft, Plus, List } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PoliciesManagementCard } from '../../components/admin/PoliciesManagementCard';

export function PoliciesManagementPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'all' | 'create'>('all');

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
          <div className="p-3 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl">
            <FileText className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Policies & Documents</h1>
            <p className="text-muted-foreground">Manage policies, guidelines, and official documents</p>
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
                    ? 'bg-orange-600 text-white shadow-lg'
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
        <PoliciesManagementCard
          activeTab={activeTab}
          onSwitchToCreateTab={() => setActiveTab('create')}
        />
      </div>
    </div>
  );
}

export default PoliciesManagementPage;
