import React, { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { auth } from '../firebase/config';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { 
  BookOpen, 
  Calendar, 
  FileText, 
  Bell, 
  LogOut, 
  Star,
  Filter,
  Search,
  Clock,
  CheckCircle,
  AlertCircle,
  GraduationCap
} from 'lucide-react';
import { apiService, type StudentProfile, type ContentItem } from '../services/api';
import toast from 'react-hot-toast';

interface DashboardProps {
  user: User;
}

const CleanDashboard: React.FC<DashboardProps> = ({ user }) => {
  const [studentProfile, setStudentProfile] = useState<StudentProfile | null>(null);
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedPriority, setSelectedPriority] = useState<string>('all');

  useEffect(() => {
    fetchDashboardData();
  }, [user.email]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      if (!user.email) {
        toast.error('No email found for user');
        return;
      }

      // Check if user exists in Student Login sheet
      console.log('Fetching profile for:', user.email);
      const profileResult = await apiService.getStudentProfile(user.email);
      console.log('Profile result:', profileResult);
      
      if (!profileResult.success) {
        toast.error(`Student not found: ${profileResult.error || 'Unknown error'}`);
        console.error('Profile error:', profileResult);
        return;
      }

      // Fetch dashboard data from ALLINONE subsheet
      console.log('Fetching dashboard for:', user.email);
      const dashboardResult = await apiService.getStudentDashboard(user.email);
      console.log('Dashboard result:', dashboardResult);
      
      if (!dashboardResult.success) {
        toast.error(`Dashboard error: ${dashboardResult.error || 'Unknown error'}`);
        console.error('Dashboard error:', dashboardResult);
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
      case 'high': return 'border-red-200 bg-red-50 text-red-800';
      case 'medium': return 'border-yellow-200 bg-yellow-50 text-yellow-800';
      case 'low': return 'border-green-200 bg-green-50 text-green-800';
      default: return 'border-gray-200 bg-gray-50 text-gray-800';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'ASSIGNMENTS & TASKS': return <FileText className="w-5 h-5 text-blue-600" />;
      case 'COURSE MATERIAL': return <BookOpen className="w-5 h-5 text-green-600" />;
      case 'ANNOUNCEMENTS': return <Bell className="w-5 h-5 text-orange-600" />;
      case 'EVENTS': return <Calendar className="w-5 h-5 text-purple-600" />;
      case 'DASHBOARDS': return <GraduationCap className="w-5 h-5 text-indigo-600" />;
      default: return <Star className="w-5 h-5 text-gray-600" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'ASSIGNMENTS & TASKS': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'COURSE MATERIAL': return 'bg-green-100 text-green-800 border-green-200';
      case 'ANNOUNCEMENTS': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'EVENTS': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'DASHBOARDS': return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const filteredContent = dashboardData?.content?.filter((item: ContentItem) => {
    const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.subTitle.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    const matchesPriority = selectedPriority === 'all' || item.priority.toLowerCase() === selectedPriority;
    
    return matchesSearch && matchesCategory && matchesPriority;
  }) || [];

  const categories: string[] = Array.from(new Set(dashboardData?.content?.map((item: ContentItem) => item.category) || [])) as string[];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-ssb-green border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 text-xl">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-2 sm:space-x-4">
              <img 
                src="https://d2beiqkhq929f0.cloudfront.net/public_assets/assets/000/090/511/original/Copy_of_Logo-White.png?1727164234" 
                alt="SSB Logo" 
                className="h-8 sm:h-10 w-auto bg-ssb-green p-1 sm:p-2 rounded-lg"
              />
              <div className="min-w-0 flex-1">
                <h1 className="text-sm sm:text-xl font-semibold text-gray-900 truncate">
                  {studentProfile?.fullName || user.displayName}
                </h1>
                <p className="text-xs sm:text-sm text-gray-500 truncate">
                  {studentProfile?.rollNo} • {studentProfile?.batch}
                </p>
              </div>
            </div>
            <Button 
              onClick={() => auth.signOut()}
              variant="outline"
              size="sm"
              className="flex-shrink-0"
            >
              <LogOut className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">Sign Out</span>
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Items</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">{dashboardData?.stats?.total || 0}</div>
              <p className="text-xs text-gray-500 mt-1">All content</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Active</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-ssb-green">{dashboardData?.stats?.active || 0}</div>
              <p className="text-xs text-gray-500 mt-1">Requiring attention</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Upcoming</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-ssb-gold">{dashboardData?.stats?.upcoming || 0}</div>
              <p className="text-xs text-gray-500 mt-1">Due soon</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Requires Action</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-orange-600">{dashboardData?.stats?.requiresAck || 0}</div>
              <p className="text-xs text-gray-500 mt-1">Need acknowledgment</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="w-5 h-5" />
              Filters & Search
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search content..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ssb-green focus:border-transparent"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <select
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ssb-green focus:border-transparent"
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                >
                  <option value="all">All Categories</option>
                  {categories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
                
                <select
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ssb-green focus:border-transparent"
                  value={selectedPriority}
                  onChange={(e) => setSelectedPriority(e.target.value)}
                >
                  <option value="all">All Priorities</option>
                  <option value="high">High Priority</option>
                  <option value="medium">Medium Priority</option>
                  <option value="low">Low Priority</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Content Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredContent.map((item: ContentItem) => (
            <Card key={item.id} className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3">
                    <div className="p-2 rounded-lg bg-gray-100">
                      {getCategoryIcon(item.category)}
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-lg text-gray-900 leading-tight">{item.title}</CardTitle>
                      <p className="text-sm text-gray-600 mt-1">{item.subTitle}</p>
                    </div>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getPriorityColor(item.priority)}`}>
                    {item.priority}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-3">
                  <div className={`inline-block px-2 py-1 rounded-full text-xs font-medium border ${getCategoryColor(item.category)}`}>
                    {item.category}
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    {item.subject && (
                      <div>
                        <span className="text-gray-500">Subject:</span>
                        <p className="font-medium text-gray-900">{item.subject}</p>
                      </div>
                    )}
                    
                    {item.term && (
                      <div>
                        <span className="text-gray-500">Term:</span>
                        <p className="font-medium text-gray-900">{item.term}</p>
                      </div>
                    )}
                  </div>

                  {item.daysUntilDeadline !== null && (
                    <div className="flex items-center space-x-2">
                      <Clock className="w-4 h-4 text-gray-500" />
                      <span className={`text-sm font-medium ${
                        item.daysUntilDeadline <= 3 ? 'text-red-600' : 
                        item.daysUntilDeadline <= 7 ? 'text-yellow-600' : 'text-green-600'
                      }`}>
                        Due in {item.daysUntilDeadline} days
                      </span>
                    </div>
                  )}

                  <div className="flex items-center space-x-4 pt-3 border-t border-gray-100">
                    {item.hasFiles && (
                      <span className="flex items-center text-xs text-blue-600">
                        <FileText className="w-3 h-3 mr-1" />
                        Has Files
                      </span>
                    )}
                    {item.requiresAcknowledgment && (
                      <span className="flex items-center text-xs text-orange-600">
                        <AlertCircle className="w-3 h-3 mr-1" />
                        Requires Ack
                      </span>
                    )}
                    {item.status === 'Active' && (
                      <span className="flex items-center text-xs text-green-600">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Active
                      </span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredContent.length === 0 && (
          <Card>
            <CardContent className="text-center py-12">
              <div className="text-gray-400 mb-4">
                <Search className="w-16 h-16 mx-auto" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No content found</h3>
              <p className="text-gray-500">Try adjusting your search or filter criteria</p>
            </CardContent>
          </Card>
        )}

        {/* Quick Actions */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Button 
                variant="outline" 
                className="justify-start"
                onClick={() => setSelectedCategory('ASSIGNMENTS & TASKS')}
              >
                <FileText className="w-4 h-4 mr-2" />
                Assignments
              </Button>
              <Button 
                variant="outline" 
                className="justify-start"
                onClick={() => setSelectedCategory('COURSE MATERIAL')}
              >
                <BookOpen className="w-4 h-4 mr-2" />
                Course Material
              </Button>
              <Button 
                variant="outline" 
                className="justify-start"
                onClick={() => setSelectedCategory('EVENTS')}
              >
                <Calendar className="w-4 h-4 mr-2" />
                Events
              </Button>
              <Button 
                variant="outline" 
                className="justify-start"
                onClick={() => setSelectedCategory('ANNOUNCEMENTS')}
              >
                <Bell className="w-4 h-4 mr-2" />
                Announcements
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CleanDashboard;