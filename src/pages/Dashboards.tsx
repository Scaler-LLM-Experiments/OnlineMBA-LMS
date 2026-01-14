import React, { useState, useEffect } from 'react';
import { auth } from '../firebase/config';
import { apiService } from '../services/api';
import { CenterLoadingSkeleton } from '../components/ui/loading-skeletons';
import {
  LayoutDashboard,
  ClipboardList,
  Users,
  TrendingUp,
  ExternalLink,
  Calendar,
  AlertCircle,
  CheckCircle,
  X,
  MapPin
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useActivityTracker } from '../hooks/useActivityTracker';
import { useAuth } from '../features/auth/hooks/useAuth';

interface DashboardLink {
  name: string;
  link: string;
  description: string;
  type: string;
  category?: string;
  eventType?: string;
  visibility?: string;
  sop?: string;
  status?: string;
  priority?: string;
}

const Dashboards: React.FC = () => {
  const [dashboards, setDashboards] = useState<DashboardLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [selectedDashboard, setSelectedDashboard] = useState<DashboardLink | null>(null);
  const user = auth.currentUser;
  const { student } = useAuth();
  const { trackPageView } = useActivityTracker();

  // Track page view
  useEffect(() => {
    trackPageView('Dashboards');
  }, [trackPageView]);

  useEffect(() => {
    const fetchDashboards = async () => {
      if (!student?.email) return;
      
      try {
        console.log('Fetching dashboards for user:', student.email);
        const result = await apiService.getDashboardLinks(student.email);
        
        console.log('Dashboard API response:', result);
        
        if (result.success) {
          console.log('Dashboards found:', result.data?.length || 0);
          setDashboards(result.data || []);
        } else {
          console.error('Failed to fetch dashboards:', result.error);
          toast.error('Failed to load dashboards: ' + (result.error || 'Unknown error'));
        }
      } catch (error) {
        console.error('Error fetching dashboards:', error);
        toast.error('Error loading dashboards');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboards();
  }, [user]);

  const getDashboardIcon = (type: string) => {
    switch (type) {
      case 'seating': return <MapPin className="w-6 h-6" />;
      case 'general': return <MapPin className="w-6 h-6" />;
      case 'attendance': return <Calendar className="w-6 h-6" />;
      case 'assignment': return <ClipboardList className="w-6 h-6" />;
      case 'academic': return (
        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 3L1 9L12 15L21 12V17H23V9L12 3ZM5 13.18V17.18L12 21L19 17.18V13.18L12 17L5 13.18Z"/>
        </svg>
      );
      case 'mentorship': return <Users className="w-6 h-6" />;
      case 'placement': return <TrendingUp className="w-6 h-6" />;
      default: return <LayoutDashboard className="w-6 h-6" />;
    }
  };

  const getDashboardColor = (type: string) => {
    switch (type) {
      case 'seating': return {
        gradient: 'from-purple-50 to-violet-50',
        border: 'border-purple-200',
        icon: 'text-purple-700',
        accent: 'bg-purple-500',
        iconBg: 'bg-purple-50'
      };
      case 'general': return {
        gradient: 'from-purple-50 to-violet-50',
        border: 'border-purple-200',
        icon: 'text-purple-700',
        accent: 'bg-purple-500',
        iconBg: 'bg-purple-50'
      };
      case 'attendance': return {
        gradient: 'from-emerald-50 to-green-50',
        border: 'border-emerald-200',
        icon: 'text-emerald-700',
        accent: 'bg-emerald-500',
        iconBg: 'bg-emerald-50'
      };
      case 'assignment': return {
        gradient: 'from-yellow-50 to-amber-50',
        border: 'border-yellow-200',
        icon: 'text-amber-700',
        accent: 'bg-[#ffc300]',
        iconBg: 'bg-yellow-50'
      };
      case 'academic': return {
        gradient: 'from-blue-50 to-sky-50',
        border: 'border-blue-200',
        icon: 'text-blue-700',
        accent: 'bg-blue-500',
        iconBg: 'bg-blue-50'
      };
      case 'mentorship': return {
        gradient: 'from-orange-50 to-orange-100',
        border: 'border-orange-200',
        icon: 'text-orange-700',
        accent: 'bg-orange-500',
        iconBg: 'bg-orange-50'
      };
      case 'placement': return {
        gradient: 'from-red-50 to-red-100',
        border: 'border-red-200',
        icon: 'text-red-700',
        accent: 'bg-red-500',
        iconBg: 'bg-red-50'
      };
      default: return {
        gradient: 'from-gray-50 to-gray-100',
        border: 'border-gray-200',
        icon: 'text-gray-600',
        accent: 'bg-gray-500',
        iconBg: 'bg-gray-50'
      };
    }
  };

  const handleDashboardClick = (dashboard: DashboardLink) => {
    // Special handling for placement dashboard - open directly in new tab
    if (dashboard.type === 'placement') {
      window.open('/placement', '_blank');
      return;
    }

    // Special handling for assignment dashboard - open directly in new tab
    if (dashboard.type === 'assignment') {
      window.open('/assignments-platform', '_blank');
      return;
    }

    setSelectedDashboard(dashboard);
    setShowConfirmDialog(true);
  };

  const handleConfirmAccess = () => {
    if (selectedDashboard) {
      window.open(selectedDashboard.link, '_blank');
      setShowConfirmDialog(false);
      setSelectedDashboard(null);
    }
  };

  const handleCancelAccess = () => {
    setShowConfirmDialog(false);
    setSelectedDashboard(null);
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="mb-6 space-y-2">
          <div className="h-8 bg-muted rounded w-1/3 animate-pulse"></div>
          <div className="h-5 bg-muted rounded w-2/3 animate-pulse"></div>
        </div>
        
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-card rounded-lg p-6 border animate-pulse">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 bg-muted rounded"></div>
                  <div className="h-6 bg-muted rounded flex-1"></div>
                </div>
                <div className="space-y-2">
                  <div className="h-4 bg-muted rounded w-full"></div>
                  <div className="h-4 bg-muted rounded w-3/4"></div>
                </div>
                <div className="flex justify-between items-center">
                  <div className="h-6 w-20 bg-muted rounded"></div>
                  <div className="h-8 w-24 bg-muted rounded"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-foreground">Dashboards</h1>
        <p className="text-muted-foreground mt-2">
          Access your specialized dashboards for different aspects of your academic journey
        </p>
      </div>

      {dashboards.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
          <AlertCircle className="w-16 h-16 text-muted-foreground mb-4" />
          <h3 className="text-xl font-semibold text-foreground mb-2">No Dashboards Available</h3>
          <p className="text-muted-foreground">
            No dashboard links are currently available for your account.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {dashboards
            .sort((a, b) => {
              const order = ['seating', 'general', 'attendance', 'assignment', 'academic', 'mentorship', 'placement'];
              const indexA = order.indexOf(a.type);
              const indexB = order.indexOf(b.type);
              
              // If type not found in order array, put it at the end
              if (indexA === -1 && indexB === -1) return 0;
              if (indexA === -1) return 1;
              if (indexB === -1) return -1;
              
              return indexA - indexB;
            })
            .map((dashboard, index) => {
            const colors = getDashboardColor(dashboard.type);
            // Only Placement dashboard is restricted for non-admin users
            const isRestricted = (dashboard.type === 'placement')
              ? !student?.isAdmin
              : dashboard.visibility === 'Restricted';

            return (
              <div
                key={index}
                onClick={() => isRestricted ? null : handleDashboardClick(dashboard)}
                className={`
                  relative overflow-hidden rounded-xl border-2 ${colors.border}
                  bg-gradient-to-br ${colors.gradient}
                  ${isRestricted ? 'cursor-not-allowed opacity-75' : 'cursor-pointer hover:shadow-xl hover:scale-[1.02] hover:-translate-y-1'}
                  transition-all duration-300
                  group
                `}
              >
                {/* Priority indicator */}
                {dashboard.priority === 'High' && (
                  <div className="absolute top-4 right-4">
                    <div className={`w-3 h-3 rounded-full ${colors.accent} shadow-lg`}></div>
                  </div>
                )}
                
                {/* Card content */}
                <div className="p-6">
                  {/* Header section */}
                  <div className="flex items-start justify-between mb-4">
                    <div className={`
                      flex items-center justify-center w-12 h-12 rounded-xl
                      ${colors.iconBg} border border-white/50 shadow-lg ${colors.icon}
                      group-hover:scale-110 group-hover:rotate-3 transition-all duration-300
                    `}>
                      {getDashboardIcon(dashboard.type)}
                    </div>
                    <ExternalLink className="w-5 h-5 text-gray-400 group-hover:text-gray-600 transition-colors duration-200" />
                  </div>

                  {/* Title and category */}
                  <div className="space-y-2 mb-4">
                    <h3 className="text-xl font-bold text-[#3a3a3a] group-hover:text-black transition-colors">
                      {dashboard.name}
                    </h3>
                    {dashboard.category && (
                      <div className="flex items-center space-x-2">
                        <span className={`
                          inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold
                          ${colors.accent} text-white shadow-sm
                        `}>
                          {dashboard.category}
                        </span>
                        {isRestricted && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-red-100 text-red-800 border border-red-200">
                            🔒 Restricted
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Description - Blurred if restricted */}
                  {dashboard.description && (
                    <p className={`text-sm text-[#3a3a3a]/80 leading-relaxed mb-4 min-h-[3rem] line-clamp-3 ${
                      isRestricted ? 'blur-sm select-none' : ''
                    }`}>
                      {dashboard.description}
                    </p>
                  )}

                  {/* SOP indicator - Blurred if restricted */}
                  {dashboard.sop && (
                    <div className={`flex items-center space-x-2 pt-2 border-t border-white/50 ${
                      isRestricted ? 'blur-sm select-none' : ''
                    }`}>
                      <AlertCircle className="w-4 h-4 text-[#3a3a3a]/60" />
                      <span className="text-xs text-[#3a3a3a]/70 font-medium">
                        Standard Operating Procedure Available
                      </span>
                    </div>
                  )}

                  {/* Restricted access overlay */}
                  {isRestricted && (
                    <div className="absolute inset-0 bg-black/20 flex items-center justify-center pointer-events-none">
                      <div className="bg-white/90 backdrop-blur-sm rounded-lg p-3 text-center shadow-lg border border-red-200">
                        <div className="text-red-600 text-2xl mb-1">🔒</div>
                        <p className="text-xs font-medium text-red-800">Access Restricted</p>
                        <p className="text-xs text-red-600">Will be granted as required</p>
                      </div>
                    </div>
                  )}

                  {/* Hover effect overlay */}
                  <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                </div>

                {/* Bottom accent line */}
                <div className={`h-1 ${colors.accent} transform scale-x-0 ${!isRestricted ? 'group-hover:scale-x-100' : ''} transition-transform duration-300 origin-left`}></div>
              </div>
            );
          })}
        </div>
      )}

      <div className="mt-8 p-4 bg-muted/50 rounded-lg border border-border">
        <div className="flex items-start space-x-3">
          <AlertCircle className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
          <div>
            <h4 className="font-medium text-foreground">Important Note</h4>
            <p className="text-sm text-muted-foreground mt-1">
              For best results, ensure you're logged into your SSB Scaler Gmail account (@ssb.scaler.com) 
              in this browser before accessing any dashboard links.
            </p>
          </div>
        </div>
      </div>

      {/* Custom Confirmation Dialog */}
      {showConfirmDialog && selectedDashboard && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 transform transition-all border border-gray-200">
            <div className="p-6">
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className={`
                    flex items-center justify-center w-12 h-12 rounded-xl border 
                    ${getDashboardColor(selectedDashboard.type).iconBg} 
                    ${getDashboardColor(selectedDashboard.type).border} 
                    ${getDashboardColor(selectedDashboard.type).icon}
                  `}>
                    {getDashboardIcon(selectedDashboard.type)}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-[#3a3a3a]">{selectedDashboard.name}</h3>
                    <p className="text-sm text-[#3a3a3a]/70">{selectedDashboard.category || 'Dashboard Access'}</p>
                  </div>
                </div>
                <button
                  onClick={handleCancelAccess}
                  className="text-[#3a3a3a]/60 hover:text-[#3a3a3a] transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Content */}
              <div className="space-y-4">
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="text-sm font-medium text-amber-800">
                        Authentication Required
                      </h4>
                      <p className="text-sm text-amber-700 mt-1">
                        Please ensure you're logged into your <strong>SSB Scaler Gmail account</strong> (@ssb.scaler.com) 
                        in this browser to avoid authentication errors.
                      </p>
                    </div>
                  </div>
                </div>

                {selectedDashboard.description && (
                  <div className="bg-[#f4f4f4] rounded-lg p-4 border border-gray-200">
                    <h4 className="text-sm font-medium text-[#3a3a3a] mb-2">About this Dashboard</h4>
                    <p className="text-sm text-[#3a3a3a]/80">{selectedDashboard.description}</p>
                  </div>
                )}

                {selectedDashboard.sop && (
                  <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="w-4 h-4 text-[#1d8f5b]" />
                      <span className="text-sm font-medium text-emerald-800">
                        Standard Operating Procedure
                      </span>
                    </div>
                    <div className="mt-2">
                      {selectedDashboard.sop.startsWith('http') ? (
                        <a 
                          href={selectedDashboard.sop} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-sm text-[#1d8f5b] hover:text-emerald-800 underline decoration-dotted flex items-center space-x-1"
                        >
                          <span>View SOP Documentation</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      ) : (
                        <p className="text-sm text-emerald-700">{selectedDashboard.sop}</p>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex space-x-3 mt-6">
                <button
                  onClick={handleCancelAccess}
                  className="flex-1 px-4 py-2 text-sm font-medium text-[#3a3a3a] bg-[#f4f4f4] hover:bg-gray-200 rounded-lg transition-colors border border-gray-300"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmAccess}
                  className="flex-1 px-4 py-2 text-sm font-medium text-black bg-[#ffc300] hover:bg-[#e6b000] rounded-lg transition-colors flex items-center justify-center space-x-2 shadow-md hover:shadow-lg"
                >
                  <span>Continue to Dashboard</span>
                  <ExternalLink className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboards;