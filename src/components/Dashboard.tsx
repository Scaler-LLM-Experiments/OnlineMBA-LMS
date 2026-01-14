import React, { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { auth } from '../firebase/config';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { BookOpen, Calendar, FileText, Bell, LogOut, Star } from 'lucide-react';
import { apiService, type StudentProfile, type ContentItem } from '../services/api';
import toast from 'react-hot-toast';

interface DashboardProps {
  user: User;
}

const Dashboard: React.FC<DashboardProps> = ({ user }) => {
  const [studentProfile, setStudentProfile] = useState<StudentProfile | null>(null);
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, [user.email]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      console.log('Fetching dashboard data for:', user.email);
      
      if (!user.email) {
        toast.error('No email found for user');
        return;
      }

      // Check if user exists in Student Login sheet
      const profileResult = await apiService.getStudentProfile(user.email);
      
      if (!profileResult.success) {
        toast.error('Student not found in database. Please contact administrator.');
        console.error('Profile error:', profileResult.error);
        return;
      }

      // Fetch dashboard data
      const dashboardResult = await apiService.getStudentDashboard(user.email);
      
      if (!dashboardResult.success) {
        toast.error('Failed to load dashboard data');
        console.error('Dashboard error:', dashboardResult.error);
        return;
      }

      setStudentProfile(profileResult.data!);
      setDashboardData(dashboardResult.data!);
      toast.success('Dashboard loaded successfully!');
      
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'high': return 'text-red-600 bg-red-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      case 'low': return 'text-green-600 bg-green-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'ASSIGNMENTS & TASKS': return <FileText className="w-5 h-5" />;
      case 'COURSE MATERIAL': return <BookOpen className="w-5 h-5" />;
      case 'ANNOUNCEMENTS': return <Bell className="w-5 h-5" />;
      case 'EVENTS': return <Calendar className="w-5 h-5" />;
      default: return <Star className="w-5 h-5" />;
    }
  };

  if (loading) {
    return (
      <div className="cosmic-bg min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-ssb-green border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white text-xl">Loading your cosmic dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="cosmic-bg min-h-screen relative overflow-hidden">
      {/* Minimal star field */}
      <div className="star-field">
        {Array.from({ length: 20 }, (_, i) => (
          <div
            key={`star-${i}`}
            className="star star-medium"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`
            }}
          />
        ))}
      </div>

      {/* Solar system background */}
      <div className="solar-system">
        <div className="sun"></div>
        {Array.from({ length: 6 }, (_, i) => (
          <React.Fragment key={i}>
            <div className={`orbit orbit-${i + 1}`}></div>
            <div className={`planet planet-${i + 1}`}></div>
          </React.Fragment>
        ))}
      </div>

      {/* Main Content */}
      <div className="relative z-10 p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="ultimate-glass rounded-3xl p-6 mb-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <img 
                  src="https://d2beiqkhq929f0.cloudfront.net/public_assets/assets/000/090/511/original/Copy_of_Logo-White.png?1727164234" 
                  alt="SSB Logo" 
                  className="h-12 w-auto bg-ssb-green p-2 rounded-lg"
                />
                <div>
                  <h1 className="text-2xl font-bold text-white">
                    Welcome back, {studentProfile?.fullName || user.displayName}
                  </h1>
                  <p className="text-gray-300">
                    {studentProfile?.rollNo} • {studentProfile?.batch}
                  </p>
                </div>
              </div>
              <Button 
                onClick={() => auth.signOut()}
                variant="outline"
                className="bg-white/10 border-white/20 text-white hover:bg-white/20"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card className="ultimate-glass border-none text-white">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-300">Total Items</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-white">{dashboardData?.stats?.total || 0}</div>
                <p className="text-xs text-gray-400 mt-1">All content items</p>
              </CardContent>
            </Card>

            <Card className="ultimate-glass border-none text-white">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-300">Active</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-ssb-green">{dashboardData?.stats?.active || 0}</div>
                <p className="text-xs text-gray-400 mt-1">Requiring attention</p>
              </CardContent>
            </Card>

            <Card className="ultimate-glass border-none text-white">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-300">Upcoming</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-ssb-gold">{dashboardData?.stats?.upcoming || 0}</div>
                <p className="text-xs text-gray-400 mt-1">Due soon</p>
              </CardContent>
            </Card>

            <Card className="ultimate-glass border-none text-white">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-300">Requires Ack</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-orange-400">{dashboardData?.stats?.requiresAck || 0}</div>
                <p className="text-xs text-gray-400 mt-1">This term</p>
              </CardContent>
            </Card>
          </div>

          {/* Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {dashboardData?.content?.map((item: ContentItem) => (
              <Card key={item.id} className="ultimate-glass border-none text-white hover:scale-105 transition-transform">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-ssb-green/20 rounded-lg">
                        {getCategoryIcon(item.category)}
                      </div>
                      <div>
                        <CardTitle className="text-lg text-white">{item.title}</CardTitle>
                        <p className="text-sm text-gray-300">{item.subTitle}</p>
                      </div>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(item.priority)}`}>
                      {item.priority}
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-400">Category</span>
                      <span className="text-gray-200">{item.category}</span>
                    </div>
                    
                    {item.subject && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-400">Subject</span>
                        <span className="text-gray-200">{item.subject}</span>
                      </div>
                    )}
                    
                    {item.term && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-400">Term</span>
                        <span className="text-gray-200">{item.term}</span>
                      </div>
                    )}

                    {item.daysUntilDeadline !== null && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-400">Due in</span>
                        <span className={`font-medium ${item.daysUntilDeadline <= 3 ? 'text-red-400' : 'text-green-400'}`}>
                          {item.daysUntilDeadline} days
                        </span>
                      </div>
                    )}

                    <div className="flex items-center space-x-4 pt-3 border-t border-white/10">
                      {item.hasFiles && (
                        <span className="text-xs bg-blue-500/20 text-blue-300 px-2 py-1 rounded-full">
                          Has Files
                        </span>
                      )}
                      {item.requiresAcknowledgment && (
                        <span className="text-xs bg-orange-500/20 text-orange-300 px-2 py-1 rounded-full">
                          Requires Ack
                        </span>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Quick Actions */}
          <div className="mt-8">
            <Card className="ultimate-glass border-none text-white">
              <CardHeader>
                <CardTitle className="text-xl text-white">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Button className="bg-ssb-green/20 hover:bg-ssb-green/30 text-white border-ssb-green/30">
                    <FileText className="w-4 h-4 mr-2" />
                    Assignments
                  </Button>
                  <Button className="bg-blue-500/20 hover:bg-blue-500/30 text-white border-blue-500/30">
                    <BookOpen className="w-4 h-4 mr-2" />
                    Course Material
                  </Button>
                  <Button className="bg-purple-500/20 hover:bg-purple-500/30 text-white border-purple-500/30">
                    <Calendar className="w-4 h-4 mr-2" />
                    Events
                  </Button>
                  <Button className="bg-orange-500/20 hover:bg-orange-500/30 text-white border-orange-500/30">
                    <Bell className="w-4 h-4 mr-2" />
                    Announcements
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Version Info */}
      <div className="absolute bottom-8 right-8 ultimate-glass rounded-xl px-4 py-2">
        <span className="text-gray-300 text-sm">Portal v2.0 ⚡</span>
      </div>
    </div>
  );
};

export default Dashboard;