import React, { useState, useEffect } from 'react';
import { auth } from '../firebase/config';
import { apiService } from '../services/api';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Skeleton } from '../components/ui/skeleton';
import { 
  Users,
  Trophy,
  TrendingUp,
  Plus,
  Activity,
  Filter,
  Search,
  MessageSquare,
  MessageCircle,
  Calendar,
  BookOpen
} from 'lucide-react';
import { 
  StudentsCornerDashboardData, 
  StudentsCornerActivity,
  ActivityType
} from '../types/studentsCorner';
import CreateActivityModal from '../components/students-corner/CreateActivityModal';
import ActivityCard from '../components/students-corner/ActivityCard';
import ActivityDetailModal from '../components/students-corner/ActivityDetailModal';
import Leaderboard from '../components/students-corner/Leaderboard';
import toast from 'react-hot-toast';
import { useActivityTracker } from '../hooks/useActivityTracker';

const StudentsCorner: React.FC = () => {
  const user = auth.currentUser;
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<StudentsCornerDashboardData | null>(null);
  const [selectedTab, setSelectedTab] = useState<'all' | ActivityType>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDisclaimer, setShowDisclaimer] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<StudentsCornerActivity | null>(null);
  const { trackPageView } = useActivityTracker();

  // Track page view
  useEffect(() => {
    trackPageView('Students Corner');
  }, [trackPageView]);

  useEffect(() => {
    // Check if disclaimer has been shown in this session
    const disclaimerShown = sessionStorage.getItem('studentsCornerDisclaimerShown');
    if (!disclaimerShown) {
      setShowDisclaimer(true);
    }
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    if (!user?.email) return;

    try {
      setLoading(true);
      const response = await apiService.getStudentsCornerDashboard(user.email);
      
      if (response.success && response.data) {
        setDashboardData(response.data);
      } else {
        toast.error(response.error || 'Failed to load Students Corner data');
      }
    } catch (error) {
      console.error('Error loading dashboard:', error);
      toast.error('Failed to load Students Corner dashboard');
    } finally {
      setLoading(false);
    }
  };




  const handleDisclaimerAccept = () => {
    sessionStorage.setItem('studentsCornerDisclaimerShown', 'true');
    setShowDisclaimer(false);
  };

  const handleActivityInteraction = (activityId: string, action: 'like' | 'comment') => {
    if (action === 'comment') {
      // Find the activity and open the detail modal
      const activity = dashboardData?.recentActivity.find(a => a.id === activityId);
      if (activity) {
        setSelectedActivity(activity);
        setShowDetailModal(true);
      }
    }
  };


  const renderRecentActivity = () => {
    if (!dashboardData?.recentActivity.length) {
      return (
        <Card>
          <CardContent className="p-8 text-center">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Activities Yet</h3>
            <p className="text-muted-foreground mb-4">
              Be the first to share something with your fellow students!
            </p>
            <Button onClick={() => setShowCreateModal(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create First Post
            </Button>
          </CardContent>
        </Card>
      );
    }

    const filteredActivities = selectedTab === 'all' 
      ? dashboardData.recentActivity 
      : dashboardData.recentActivity.filter(activity => activity.type === selectedTab);

    return (
      <div className="space-y-4">
        {filteredActivities.map(activity => (
          <ActivityCard
            key={activity.id}
            activity={activity}
            onInteract={handleActivityInteraction}
            showFullContent={false}
            compact={false}
            onEngagementUpdate={loadDashboard}
          />
        ))}
      </div>
    );
  };


  if (loading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-8 w-64 mb-2" />
            <Skeleton className="h-4 w-96" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>
        
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-8 w-1/2" />
                  <Skeleton className="h-3 w-full" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="space-y-3">
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-1/4" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-2/3" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Fixed Header */}
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="container mx-auto p-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">Students Corner</h1>
              <p className="text-muted-foreground">
                Connect, collaborate, and grow with your fellow SSB students
              </p>
            </div>
            <div className="mt-4 sm:mt-0">
              <Button onClick={() => setShowCreateModal(true)} size="lg" className="shadow-lg">
                <Plus className="h-4 w-4 mr-2" />
                Create Activity
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="container mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Side - Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Search and Activity Navigation - Combined Sticky Container */}
            <div className="sticky top-[120px] z-30 space-y-4">
              {/* Search and Filters */}
              <Card className="shadow-sm">
                <CardContent className="p-4">
                  <div className="flex flex-col sm:flex-row gap-4">
                    {/* Search */}
                    <div className="flex-1">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <input
                          type="text"
                          placeholder="Search activities, events, skills..."
                          className="w-full pl-10 pr-4 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                        />
                      </div>
                    </div>

                    {/* Filter Button */}
                    <Button variant="outline" className="flex items-center gap-2 shrink-0">
                      <Filter className="h-4 w-4" />
                      Filters
                    </Button>

                    {/* Create Activity Button (Mobile) */}
                    <Button 
                      onClick={() => setShowCreateModal(true)} 
                      className="lg:hidden flex items-center gap-2"
                    >
                      <Plus className="h-4 w-4" />
                      Create
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Tab Navigation - More Prominent */}
              <Card className="shadow-sm">
                <CardContent className="p-4">
                  <div className="flex flex-wrap gap-2">
                    {[
                      { key: 'all' as const, label: 'All Activities', count: dashboardData?.recentActivity.length || 0, icon: Activity },
                      { key: 'POST' as const, label: 'Posts', count: dashboardData?.stats.activitiesByType.POST || 0, icon: MessageSquare },
                      { key: 'FORUM' as const, label: 'Forums', count: dashboardData?.stats.activitiesByType.FORUM || 0, icon: MessageCircle },
                      { key: 'EVENT' as const, label: 'Events', count: dashboardData?.stats.activitiesByType.EVENT || 0, icon: Calendar },
                      { key: 'SKILL_OFFER' as const, label: 'Skills', count: (dashboardData?.stats.activitiesByType.SKILL_OFFER || 0) + (dashboardData?.stats.activitiesByType.SKILL_REQUEST || 0), icon: BookOpen },
                    ].map((tab) => {
                      const IconComponent = tab.icon;
                      return (
                        <Button
                          key={tab.key}
                          variant={selectedTab === tab.key ? "default" : "outline"}
                          size="sm"
                          onClick={() => setSelectedTab(tab.key)}
                          className="flex items-center gap-2 h-10"
                        >
                          <IconComponent className="h-4 w-4" />
                          {tab.label}
                          {tab.count > 0 && (
                            <Badge variant="secondary" className="ml-1 h-5 min-w-5 text-xs">
                              {tab.count}
                            </Badge>
                          )}
                        </Button>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Activity Feed */}
            <div className="space-y-4 pt-4">
              {renderRecentActivity()}
            </div>

            {/* Load More Button */}
            {dashboardData?.recentActivity.length && dashboardData.recentActivity.length >= 10 && (
              <div className="text-center">
                <Button variant="outline" size="lg" onClick={() => {}}>
                  Load More Activities
                </Button>
              </div>
            )}
          </div>

          {/* Right Side - Fixed Panels */}
          <div className="lg:col-span-1">
            <div className="sticky top-[120px] z-10 space-y-4">
              {/* Enhanced Quick Stats - Priority Panel */}
              {dashboardData && (
                <Card className="lg:block hidden">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Your Stats</CardTitle>
                    <Trophy className="h-4 w-4 text-yellow-500" />
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {/* Points and Rank - Compact */}
                    <div className="text-center p-3 bg-primary/5 rounded-lg border">
                      <div className="text-xl font-bold text-primary mb-1">
                        {dashboardData.stats.totalPoints}
                      </div>
                      <div className="text-xs text-muted-foreground mb-1">Total Points</div>
                      <div className="text-xs font-medium">
                        Rank #{dashboardData.stats.myRank || 'Unranked'}
                      </div>
                    </div>

                    {/* Activity Stats - Compact */}
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-1">
                          <Activity className="h-3 w-3 text-muted-foreground" />
                          <span className="text-muted-foreground">My Activities</span>
                        </div>
                        <span className="font-medium">{dashboardData.stats.myActivities}</span>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-1">
                          <TrendingUp className="h-3 w-3 text-muted-foreground" />
                          <span className="text-muted-foreground">This Week</span>
                        </div>
                        <span className="font-medium">{dashboardData.stats.weeklyActivities}</span>
                      </div>

                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-1">
                          <Users className="h-3 w-3 text-muted-foreground" />
                          <span className="text-muted-foreground">Community</span>
                        </div>
                        <span className="font-medium">{dashboardData.stats.totalActivities}</span>
                      </div>
                    </div>

                    {/* Activity Breakdown - Grid */}
                    <div className="pt-2 border-t">
                      <div className="text-xs font-medium text-muted-foreground mb-2">Activity Types</div>
                      <div className="grid grid-cols-2 gap-1 text-xs">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Posts</span>
                          <span className="font-medium">{dashboardData.stats.activitiesByType.POST}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Forums</span>
                          <span className="font-medium">{dashboardData.stats.activitiesByType.FORUM}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Events</span>
                          <span className="font-medium">{dashboardData.stats.activitiesByType.EVENT}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Skills</span>
                          <span className="font-medium">
                            {(dashboardData.stats.activitiesByType.SKILL_OFFER || 0) + 
                             (dashboardData.stats.activitiesByType.SKILL_REQUEST || 0)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Top Contributors - Compact */}
              <div>
                {dashboardData?.leaderboard.length ? (
                  <Leaderboard 
                    data={dashboardData.leaderboard}
                    loading={loading}
                    showFullLeaderboard={false}
                  />
                ) : (
                  <Card>
                    <CardContent className="p-4 text-center">
                      <Trophy className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
                      <h3 className="text-sm font-semibold mb-1">No Contributors Yet</h3>
                      <p className="text-xs text-muted-foreground mb-3">
                        Be the first to earn points!
                      </p>
                      <Button 
                        onClick={() => setShowCreateModal(true)}
                        size="sm"
                      >
                        Create Activity
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Create Activity Modal */}
      <CreateActivityModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={() => loadDashboard()}
      />

      {/* Activity Detail Modal */}
      {selectedActivity && (
        <ActivityDetailModal
          activity={selectedActivity}
          isOpen={showDetailModal}
          onClose={() => {
            setShowDetailModal(false);
            setSelectedActivity(null);
          }}
          onEngagementUpdate={() => loadDashboard()}
        />
      )}

      {/* Community Guidelines Disclaimer Modal */}
      {showDisclaimer && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-lg">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 p-3 bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center">
                <Users className="h-8 w-8 text-blue-600" />
              </div>
              <CardTitle className="text-xl font-semibold text-center">
                Welcome to Students Corner!
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center text-sm text-muted-foreground mb-4">
                A respectful community for SSB students to connect and collaborate
              </div>
              
              <div className="space-y-3 text-sm">
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <h4 className="font-semibold text-amber-800 mb-2">Community Guidelines</h4>
                  <ul className="space-y-1 text-amber-700 text-xs">
                    <li>• Use respectful and professional language at all times</li>
                    <li>• Be kind and supportive to your fellow students</li>
                    <li>• No offensive, discriminatory, or inappropriate content</li>
                    <li>• Keep discussions relevant and constructive</li>
                    <li>• Respect privacy and confidentiality</li>
                  </ul>
                </div>
                
                <div className="text-xs text-muted-foreground text-center">
                  By participating in Students Corner, you agree to maintain a positive 
                  and respectful environment for all SSB students.
                </div>
              </div>
              
              <Button 
                onClick={handleDisclaimerAccept}
                className="w-full"
                size="lg"
              >
                I Understand & Agree
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default StudentsCorner;