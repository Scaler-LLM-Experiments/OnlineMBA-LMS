import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { 
  FolderOpen, 
  Filter, 
  Search, 
  ExternalLink,
  FileText,
  Video,
  Link,
  Image,
  Calendar,
  Eye,
  Grid,
  List,
  ChevronRight,
  Home,
  ArrowLeft,
  Loader2,
  AlertCircle,
  BookOpen,
  TrendingUp,
  X,
  Upload,
  Target,
  BookMarked,
  ArrowUp
} from 'lucide-react';
import { apiService, type ContentItem } from '../services/api';
import { auth } from '../firebase/config';
import toast from 'react-hot-toast';
import { useActivityTracker } from '../hooks/useActivityTracker';

// Types for the dynamic folder structure
interface CourseResourcesData {
  availableTerms: string[];
  folderStructure: Record<string, {
    domains: Record<string, {
      subjects: Record<string, ContentItem[]>;
    }>;
  }>;
  flatMaterials: ContentItem[];
}

interface NavigationLevel {
  type: 'root' | 'term' | 'domain' | 'subject';
  term?: string;
  domain?: string;
  subject?: string;
  label: string;
}

const Resources: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { trackPageView, trackResourceDownload } = useActivityTracker();

  const [courseData, setCourseData] = useState<CourseResourcesData | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [currentLevel, setCurrentLevel] = useState<NavigationLevel>({
    type: 'root',
    label: 'Course Materials'
  });
  const [navigationHistory, setNavigationHistory] = useState<NavigationLevel[]>([]);
  const [selectedMaterial, setSelectedMaterial] = useState<ContentItem | null>(null);
  const [showMaterialModal, setShowMaterialModal] = useState(false);

  const user = auth.currentUser;

  // Track page view on mount
  useEffect(() => {
    trackPageView('Resources');
  }, [trackPageView]);

  const fetchCourseResources = async () => {
    try {
      console.log('Resources: Starting to load course resources...');
      setLoading(true); // Explicitly set loading to true
      
      
      if (!user?.email) {
        console.log('Resources: No user email found');
        toast.error('No user email found');
        setLoading(false);
        return;
      }

      const result = await apiService.getCourseResources(user.email);

      console.log('🔍 FULL API RESPONSE:', JSON.stringify(result, null, 2));

      if (!result.success) {
        console.log('❌ Resources: API call failed:', result.error);
        toast.error(`Failed to load course resources: ${result.error || 'Unknown error'}`);
        setLoading(false);
        return;
      }

      console.log('📊 Available Terms:', result.data?.availableTerms);
      console.log('📚 Total Materials:', result.data?.flatMaterials?.length);
      console.log('🗂️ Folder Structure:', result.data?.folderStructure);

      setCourseData(result.data || { availableTerms: [], folderStructure: {}, flatMaterials: [] });
      console.log('✅ Resources: Data loaded successfully');

      // Debug logging
      if ((result as any).debug) {
        console.log('=== 🐛 BACKEND DEBUG INFO ===');
        console.log('Student Batch:', (result as any).debug.studentBatch);
        console.log('Total Materials:', (result as any).debug.totalMaterials);
        console.log('From ALLINONE:', (result as any).debug.allInOneCount);
        console.log('From Resources Management:', (result as any).debug.resourceMgmtCount);
        console.log('Materials by Term:', (result as any).debug.termCounts);
        console.log('================================');
      } else {
        console.warn('⚠️ NO DEBUG INFO - Backend code NOT updated yet!');
      }

      setLoading(false);
      
    } catch (error) {
      console.error('Error fetching course resources:', error);
      toast.error('Failed to load course resources');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourseResources();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync state with URL when data loads or URL changes
  useEffect(() => {
    if (courseData) {
      syncStateWithUrl();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseData, location.pathname]);

  // Navigation functions
  const navigateToTerm = (term: string) => {
    const newPath = buildUrlPath([term]);
    navigate(newPath);
    setSearchTerm(''); // Clear search when navigating
  };

  const navigateToDomain = (term: string, domain: string) => {
    const newPath = buildUrlPath([term, domain]);
    navigate(newPath);
    setSearchTerm('');
  };

  const navigateToSubject = (term: string, domain: string, subject: string) => {
    const newPath = buildUrlPath([term, domain, subject]);
    navigate(newPath);
    setSearchTerm('');
  };

  const navigateBack = () => {
    if (navigationHistory.length > 0) {
      const previousLevel = navigationHistory[navigationHistory.length - 1];
      let newPath: string;
      
      if (previousLevel.type === 'root') {
        newPath = '/resources';
      } else if (previousLevel.type === 'term') {
        newPath = buildUrlPath([previousLevel.term!]);
      } else if (previousLevel.type === 'domain') {
        newPath = buildUrlPath([previousLevel.term!, previousLevel.domain!]);
      } else {
        newPath = '/resources';
      }
      
      navigate(newPath);
      setSearchTerm('');
    }
  };

  const navigateToRoot = () => {
    navigate('/resources');
    setSearchTerm('');
  };

  // Get current items based on navigation level
  const getCurrentItems = () => {
    if (!courseData) return [];
    
    switch (currentLevel.type) {
      case 'root':
        return courseData.availableTerms.map(term => ({
          id: term,
          title: term,
          type: 'folder' as const,
          count: Object.keys(courseData.folderStructure[term]?.domains || {}).length
        }));
      
      case 'term':
        if (!currentLevel.term || !courseData.folderStructure[currentLevel.term]) return [];
        return Object.keys(courseData.folderStructure[currentLevel.term].domains).map(domain => ({
          id: `${currentLevel.term}-${domain}`,
          title: domain,
          type: 'folder' as const,
          count: Object.keys(courseData.folderStructure[currentLevel.term!].domains[domain].subjects).length
        }));
      
      case 'domain':
        if (!currentLevel.term || !currentLevel.domain || 
            !courseData.folderStructure[currentLevel.term]?.domains[currentLevel.domain]) return [];
        return Object.keys(courseData.folderStructure[currentLevel.term].domains[currentLevel.domain].subjects).map(subject => ({
          id: `${currentLevel.term}-${currentLevel.domain}-${subject}`,
          title: subject,
          type: 'folder' as const,
          count: courseData.folderStructure[currentLevel.term!].domains[currentLevel.domain!].subjects[subject].length
        }));
      
      case 'subject':
        if (!currentLevel.term || !currentLevel.domain || !currentLevel.subject ||
            !courseData.folderStructure[currentLevel.term]?.domains[currentLevel.domain]?.subjects[currentLevel.subject]) return [];
        return courseData.folderStructure[currentLevel.term].domains[currentLevel.domain].subjects[currentLevel.subject];
      
      default:
        return [];
    }
  };

  // Search function that works across all materials
  const getSearchResults = () => {
    if (!courseData || !searchTerm.trim()) return [];
    
    return courseData.flatMaterials.filter(material => 
      material.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      material.subTitle?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      material.term?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      material.domain?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      material.subject?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  // Utility functions
  const getTypeIcon = (material: ContentItem) => {
    const attachments = (material as any).attachments || '';
    const resourceLink = (material as any).resourceLink || '';
    
    if (attachments.includes('.pdf') || attachments.includes('.doc')) {
      return <FileText className="h-5 w-5 text-blue-600" />;
    }
    if (attachments.includes('.mp4') || attachments.includes('.avi') || resourceLink.includes('youtube') || resourceLink.includes('vimeo')) {
      return <Video className="h-5 w-5 text-red-600" />;
    }
    if (resourceLink && resourceLink.startsWith('http')) {
      return <Link className="h-5 w-5 text-green-600" />;
    }
    if (attachments.includes('.jpg') || attachments.includes('.png') || attachments.includes('.gif')) {
      return <Image className="h-5 w-5 text-purple-600" />;
    }
    return <FileText className="h-5 w-5 text-gray-600" />;
  };

  const getTypeColor = (material: ContentItem) => {
    const attachments = (material as any).attachments || '';
    const resourceLink = (material as any).resourceLink || '';
    
    if (attachments.includes('.pdf') || attachments.includes('.doc')) {
      return 'bg-blue-100 text-blue-800 border-blue-200';
    }
    if (attachments.includes('.mp4') || attachments.includes('.avi') || resourceLink.includes('youtube') || resourceLink.includes('vimeo')) {
      return 'bg-red-100 text-red-800 border-red-200';
    }
    if (resourceLink && resourceLink.startsWith('http')) {
      return 'bg-green-100 text-green-800 border-green-200';
    }
    if (attachments.includes('.jpg') || attachments.includes('.png') || attachments.includes('.gif')) {
      return 'bg-purple-100 text-purple-800 border-purple-200';
    }
    return 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getPriorityColor = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case 'low': return 'text-green-600 bg-green-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'high': return 'text-red-600 bg-red-100';
      case 'urgent': return 'text-red-700 bg-red-200';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const openMaterialModal = (material: ContentItem) => {
    // Track resource view
    const resourceName = material.title || material.subTitle || 'Unknown Resource';
    trackResourceDownload(resourceName);

    console.log('Material data:', {
      term: material.term,
      priority: material.priority,
      fileURL: material.fileURL,
      attachments: (material as any).attachments,
      resourceLink: (material as any).resourceLink,
      driveLink: (material as any).driveLink,
      fileuploadLink: (material as any).fileuploadLink
    });
    setSelectedMaterial(material);
    setShowMaterialModal(true);
  };

  const closeMaterialModal = () => {
    setSelectedMaterial(null);
    setShowMaterialModal(false);
  };

  // URL synchronization functions
  const parseUrlPath = () => {
    const pathSegments = location.pathname
      .replace('/resources', '')
      .split('/')
      .filter(segment => segment.length > 0)
      .map(segment => decodeURIComponent(segment));
    
    return pathSegments;
  };

  const buildUrlPath = (segments: string[]) => {
    const encodedSegments = segments.map(segment => encodeURIComponent(segment));
    return `/resources${encodedSegments.length > 0 ? '/' + encodedSegments.join('/') : ''}`;
  };

  const syncStateWithUrl = () => {
    if (!courseData) return;
    
    const pathSegments = parseUrlPath();
    
    if (pathSegments.length === 0) {
      // Root level
      setCurrentLevel({ type: 'root', label: 'Course Materials' });
      setNavigationHistory([]);
    } else if (pathSegments.length === 1) {
      // Term level
      const term = pathSegments[0];
      if (courseData.availableTerms.includes(term)) {
        setCurrentLevel({ type: 'term', term, label: term });
        setNavigationHistory([{ type: 'root', label: 'Course Materials' }]);
      }
    } else if (pathSegments.length === 2) {
      // Domain level
      const [term, domain] = pathSegments;
      if (courseData.folderStructure[term]?.domains[domain]) {
        setCurrentLevel({ type: 'domain', term, domain, label: `${term} > ${domain}` });
        setNavigationHistory([
          { type: 'root', label: 'Course Materials' },
          { type: 'term', term, label: term }
        ]);
      }
    } else if (pathSegments.length === 3) {
      // Subject level
      const [term, domain, subject] = pathSegments;
      if (courseData.folderStructure[term]?.domains[domain]?.subjects[subject]) {
        setCurrentLevel({ type: 'subject', term, domain, subject, label: `${term} > ${domain} > ${subject}` });
        setNavigationHistory([
          { type: 'root', label: 'Course Materials' },
          { type: 'term', term, label: term },
          { type: 'domain', term, domain, label: `${term} > ${domain}` }
        ]);
      }
    }
  };

  // Render different views
  const renderBreadcrumbs = () => (
    <div className="flex items-center space-x-2 mb-4">
      <Button variant="ghost" size="sm" onClick={navigateToRoot}>
        <Home className="h-4 w-4" />
      </Button>
      {navigationHistory.length > 0 && (
        <Button variant="ghost" size="sm" onClick={navigateBack}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
      )}
      <div className="flex items-center text-sm text-muted-foreground">
        <span>Resources</span>
        {currentLevel.type !== 'root' && (
          <>
            <ChevronRight className="h-4 w-4 mx-1" />
            <span>{currentLevel.label}</span>
          </>
        )}
      </div>
    </div>
  );

  const renderFolderCard = (item: any) => (
    <Card 
      key={item.id} 
      className="hover:shadow-lg transition-all cursor-pointer group"
      onClick={() => {
        if (currentLevel.type === 'root') {
          navigateToTerm(item.title);
        } else if (currentLevel.type === 'term') {
          navigateToDomain(currentLevel.term!, item.title);
        } else if (currentLevel.type === 'domain') {
          navigateToSubject(currentLevel.term!, currentLevel.domain!, item.title);
        }
      }}
    >
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-3 rounded-lg bg-blue-50 border border-blue-200">
              <FolderOpen className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <CardTitle className="text-lg group-hover:text-primary transition-colors">
                {item.title}
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                {item.count} {currentLevel.type === 'subject' ? 'materials' : 'folders'}
              </p>
            </div>
          </div>
          <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
        </div>
      </CardHeader>
    </Card>
  );

  const renderMaterialCard = (material: ContentItem) => {
    if (viewMode === 'grid') {
      return (
        <Card key={material.id} className="hover:shadow-lg transition-all cursor-pointer group" onClick={() => openMaterialModal(material)}>
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between mb-3">
              <div className="p-3 rounded-lg bg-background border">
                {getTypeIcon(material)}
              </div>
              <div className="flex items-center space-x-2">
                {material.priority && material.priority.toLowerCase() !== 'none' && (
                  <ArrowUp className={`h-4 w-4 ${
                    material.priority.toLowerCase() === 'high' ? 'text-red-500' :
                    material.priority.toLowerCase() === 'medium' ? 'text-yellow-500' :
                    material.priority.toLowerCase() === 'low' ? 'text-green-500' :
                    'text-gray-500'
                  }`} />
                )}
                <Badge variant="outline" className={getTypeColor(material)}>
                  {material.eventType || 'Material'}
                </Badge>
              </div>
            </div>
            
            <CardTitle className="text-lg leading-tight group-hover:text-primary transition-colors">
              {material.subTitle}
            </CardTitle>
            <p className="text-sm text-muted-foreground line-clamp-2">
              {material.title}
            </p>
          </CardHeader>
          
          <CardContent className="pt-0">
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <div className="flex items-center space-x-1">
                  <Calendar className="h-4 w-4" />
                  <span>{new Date((material as any).dateAdded || material.createdAt).toLocaleDateString()}</span>
                </div>
                <div className="text-xs">
                  {material.term && <span className="mr-2">Term: {material.term}</span>}
                </div>
              </div>
              
              <div className="pt-2">
                <Button
                  size="sm"
                  className="w-full"
                  onClick={(e) => {
                    e.stopPropagation();
                    openMaterialModal(material);
                  }}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  View Details
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      );
    } else {
      return (
        <Card key={material.id} className="hover:shadow-md transition-all cursor-pointer" onClick={() => openMaterialModal(material)}>
          <CardContent className="p-4">
            <div className="flex items-center space-x-4">
              <div className="flex-shrink-0 p-2 rounded-lg bg-background border">
                {getTypeIcon(material)}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between mb-2">
                  <h4 className="text-lg font-medium truncate">{material.subTitle}</h4>
                  <div className="flex items-center space-x-2">
                    {material.priority && material.priority.toLowerCase() !== 'none' && (
                      <ArrowUp className={`h-4 w-4 ${
                        material.priority.toLowerCase() === 'high' ? 'text-red-500' :
                        material.priority.toLowerCase() === 'medium' ? 'text-yellow-500' :
                        material.priority.toLowerCase() === 'low' ? 'text-green-500' :
                        'text-gray-500'
                      }`} />
                    )}
                    <Badge variant="outline" className={getTypeColor(material)}>
                      {material.eventType || 'Material'}
                    </Badge>
                  </div>
                </div>
                
                <p className="text-sm text-muted-foreground mb-3 line-clamp-1">
                  {material.title}
                </p>
                
                <div className="flex items-center space-x-6 text-sm text-muted-foreground">
                  <div className="flex items-center space-x-1">
                    <Calendar className="h-4 w-4" />
                    <span>{new Date((material as any).dateAdded || material.createdAt).toLocaleDateString()}</span>
                  </div>
                  {material.term && <span>Term: {material.term}</span>}
                  {material.domain && <span>Domain: {material.domain}</span>}
                  {material.subject && <span>Subject: {material.subject}</span>}
                </div>
              </div>
              
              <div className="flex-shrink-0">
                <Button
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    openMaterialModal(material);
                  }}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  View Details
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      );
    }
  };

  // Show skeleton loading directly  
  if (loading || !courseData) {
    return (
      <div className="space-y-6">
        {/* Search/Filter Bar Skeleton */}
        <div className="flex gap-4">
          <div className="h-10 bg-muted rounded flex-1 animate-pulse"></div>
          <div className="h-10 w-32 bg-muted rounded animate-pulse"></div>
          <div className="h-10 w-24 bg-muted rounded animate-pulse"></div>
        </div>
        
        {/* Breadcrumb Skeleton */}
        <div className="h-6 bg-muted rounded w-1/3 animate-pulse"></div>
        
        {/* Content Grid Skeleton */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="bg-card rounded-lg p-6 border animate-pulse">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="h-5 w-5 bg-muted rounded"></div>
                  <div className="h-5 bg-muted rounded flex-1"></div>
                </div>
                <div className="space-y-2">
                  <div className="h-4 bg-muted rounded w-full"></div>
                  <div className="h-4 bg-muted rounded w-3/4"></div>
                </div>
                <div className="flex justify-between items-center">
                  <div className="h-6 w-16 bg-muted rounded"></div>
                  <div className="h-8 w-20 bg-muted rounded"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const currentItems = searchTerm ? getSearchResults() : getCurrentItems();
  const showingMaterials = currentLevel.type === 'subject' || searchTerm;

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <FolderOpen className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-2xl font-bold">{courseData.flatMaterials.length}</p>
                <p className="text-sm text-muted-foreground">Total Materials</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <FileText className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-2xl font-bold">{courseData.availableTerms.length}</p>
                <p className="text-sm text-muted-foreground">Terms Available</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <BookOpen className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-2xl font-bold">
                  {Object.values(courseData.folderStructure).reduce((total, term) => 
                    total + Object.keys(term.domains).length, 0
                  )}
                </p>
                <p className="text-sm text-muted-foreground">Domains</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-orange-600" />
              <div>
                <p className="text-2xl font-bold">
                  {Object.values(courseData.folderStructure).reduce((total, term) => 
                    total + Object.values(term.domains).reduce((domTotal, domain) => 
                      domTotal + Object.keys(domain.subjects).length, 0
                    ), 0
                  )}
                </p>
                <p className="text-sm text-muted-foreground">Subjects</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Navigation and Search */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center">
              <Filter className="mr-2 h-5 w-5" />
              Search & Navigate
            </CardTitle>
            {showingMaterials && (
              <div className="flex items-center space-x-2">
                <Button
                  size="sm"
                  variant={viewMode === 'grid' ? 'default' : 'outline'}
                  onClick={() => setViewMode('grid')}
                >
                  <Grid className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant={viewMode === 'list' ? 'default' : 'outline'}
                  onClick={() => setViewMode('list')}
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {renderBreadcrumbs()}
            
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <input
                type="text"
                placeholder="Search materials across all terms..."
                className="w-full pl-10 pr-4 py-2 border border-input rounded-lg bg-background focus:ring-2 focus:ring-ring focus:border-transparent"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Content Display */}
      {currentItems.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <FolderOpen className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">
              {searchTerm ? 'No materials found' : 'No items available'}
            </h3>
            <p className="text-muted-foreground">
              {searchTerm 
                ? 'Try adjusting your search terms'
                : 'This section is empty or no materials have been published yet'
              }
            </p>
          </CardContent>
        </Card>
      ) : showingMaterials ? (
        viewMode === 'grid' ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {currentItems.map((material) => renderMaterialCard(material as ContentItem))}
          </div>
        ) : (
          <div className="space-y-4">
            {currentItems.map((material) => renderMaterialCard(material as ContentItem))}
          </div>
        )
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {currentItems.map((item) => renderFolderCard(item))}
        </div>
      )}

      {/* Material Details Modal */}
      {showMaterialModal && selectedMaterial && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-gray-200 dark:border-gray-700">
            <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{selectedMaterial.title}</h2>
              <Button variant="ghost" size="sm" onClick={closeMaterialModal} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="p-6 space-y-6 bg-white dark:bg-gray-800 text-gray-900 dark:text-white">
              {/* Basic Information */}
              <div className="space-y-3">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">Description</h3>
                <p className="text-gray-600 dark:text-gray-300">{selectedMaterial.subTitle || 'No description available'}</p>
                
                {selectedMaterial.priority && selectedMaterial.priority.toLowerCase() !== 'none' && (
                  <div className="flex items-center space-x-2 text-sm">
                    <span className="font-medium text-gray-700 dark:text-gray-300">Priority:</span>
                    <div className="flex items-center space-x-1">
                      <ArrowUp className={`h-4 w-4 ${
                        selectedMaterial.priority.toLowerCase() === 'high' ? 'text-red-500' :
                        selectedMaterial.priority.toLowerCase() === 'medium' ? 'text-yellow-500' :
                        selectedMaterial.priority.toLowerCase() === 'low' ? 'text-green-500' :
                        'text-gray-500'
                      }`} />
                      <Badge variant="outline" className={getPriorityColor(selectedMaterial.priority)}>
                        {selectedMaterial.priority}
                      </Badge>
                    </div>
                  </div>
                )}
                
                {selectedMaterial.term && (
                  <div className="flex items-center space-x-2 text-sm">
                    <span className="font-medium text-gray-700 dark:text-gray-300">Term:</span>
                    <Badge variant="outline" className="text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600">{selectedMaterial.term}</Badge>
                  </div>
                )}
                
                {selectedMaterial.domain && (
                  <div className="flex items-center space-x-2 text-sm">
                    <span className="font-medium text-gray-700 dark:text-gray-300">Domain:</span>
                    <Badge variant="outline" className="text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600">{selectedMaterial.domain}</Badge>
                  </div>
                )}
                
                {selectedMaterial.subject && (
                  <div className="flex items-center space-x-2 text-sm">
                    <span className="font-medium text-gray-700 dark:text-gray-300">Subject:</span>
                    <Badge variant="outline" className="text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600">{selectedMaterial.subject}</Badge>
                  </div>
                )}
              </div>

              {/* File Links Section */}
              <div className="space-y-3">
                <h3 className="text-lg font-medium flex items-center text-gray-900 dark:text-white">
                  <ExternalLink className="h-5 w-5 mr-2 text-gray-600 dark:text-gray-400" />
                  Access Links
                </h3>

                {/* Files from Resource Management (File 1-5) */}
                {(selectedMaterial as any).files && Array.isArray((selectedMaterial as any).files) && (selectedMaterial as any).files.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Files</h4>
                    {(selectedMaterial as any).files.map((file: any, idx: number) => (
                      <div key={idx} className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <FileText className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                            <span className="font-medium text-gray-900 dark:text-white">{file.name}</span>
                          </div>
                          <Button
                            size="sm"
                            onClick={() => window.open(file.url, '_blank')}
                            className="bg-blue-600 hover:bg-blue-700 text-white dark:bg-blue-500 dark:hover:bg-blue-600"
                          >
                            Open
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* URLs from Resource Management */}
                {(selectedMaterial as any).urls && Array.isArray((selectedMaterial as any).urls) && (selectedMaterial as any).urls.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Links</h4>
                    {(selectedMaterial as any).urls.map((urlItem: any, idx: number) => (
                      <div key={idx} className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <Link className="h-4 w-4 text-green-600 dark:text-green-400" />
                            <span className="font-medium text-gray-900 dark:text-white">{urlItem.name}</span>
                          </div>
                          <Button
                            size="sm"
                            onClick={() => window.open(urlItem.url, '_blank')}
                            className="bg-green-600 hover:bg-green-700 text-white dark:bg-green-500 dark:hover:bg-green-600"
                          >
                            Open
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Legacy fields for backward compatibility with ALL IN ONE resources */}
                {!(selectedMaterial as any).files?.length && !(selectedMaterial as any).urls?.length && (
                  <>
                    {selectedMaterial.fileURL && selectedMaterial.fileURL.trim() && (
                      <div className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <ExternalLink className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                            <span className="font-medium text-gray-900 dark:text-white">File Link</span>
                          </div>
                          <Button
                            size="sm"
                            onClick={() => window.open(selectedMaterial.fileURL!, '_blank')}
                            className="bg-blue-600 hover:bg-blue-700 text-white dark:bg-blue-500 dark:hover:bg-blue-600"
                          >
                            Open File
                          </Button>
                        </div>
                      </div>
                    )}

                    {(selectedMaterial as any).attachments && (selectedMaterial as any).attachments.trim() && (selectedMaterial as any).attachments.startsWith('http') && (
                      <div className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <ExternalLink className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                            <span className="font-medium text-gray-900 dark:text-white">Attachment</span>
                          </div>
                          <Button
                            size="sm"
                            onClick={() => window.open((selectedMaterial as any).attachments, '_blank')}
                            className="bg-blue-600 hover:bg-blue-700 text-white dark:bg-blue-500 dark:hover:bg-blue-600"
                          >
                            Open File
                          </Button>
                        </div>
                      </div>
                    )}

                    {(selectedMaterial as any).resourceLink && (selectedMaterial as any).resourceLink.trim() && (selectedMaterial as any).resourceLink.startsWith('http') && (
                      <div className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <Upload className="h-4 w-4 text-green-600 dark:text-green-400" />
                            <span className="font-medium text-gray-900 dark:text-white">File Upload Link</span>
                          </div>
                          <Button
                            size="sm"
                            onClick={() => window.open((selectedMaterial as any).resourceLink, '_blank')}
                            className="bg-green-600 hover:bg-green-700 text-white dark:bg-green-500 dark:hover:bg-green-600"
                          >
                            Open Link
                          </Button>
                        </div>
                      </div>
                    )}
                  </>
                )}

                {!(selectedMaterial as any).files?.length &&
                 !(selectedMaterial as any).urls?.length &&
                 !selectedMaterial.fileURL?.trim() &&
                 !(selectedMaterial as any).attachments?.trim() &&
                 !(selectedMaterial as any).resourceLink?.trim() && (
                  <p className="text-gray-500 dark:text-gray-400 text-sm italic">No access links available</p>
                )}
              </div>

              {/* Learning Content Section */}
              {((selectedMaterial as any).learningObjectives || (selectedMaterial as any).prerequisites) && (
                <div className="space-y-4">
                  <h3 className="text-lg font-medium flex items-center text-gray-900 dark:text-white">
                    <BookMarked className="h-5 w-5 mr-2 text-gray-600 dark:text-gray-400" />
                    Learning Content
                  </h3>
                  
                  {(selectedMaterial as any).learningObjectives && (selectedMaterial as any).learningObjectives.trim() && (
                    <div className="space-y-2">
                      <h4 className="text-md font-medium flex items-center text-blue-700 dark:text-blue-400">
                        <Target className="h-4 w-4 mr-2" />
                        Learning Objectives
                      </h4>
                      <div 
                        className="prose prose-sm max-w-none p-4 border border-blue-200 dark:border-blue-800 rounded-lg bg-blue-50/50 dark:bg-blue-900/20 text-gray-900 dark:text-gray-100"
                        dangerouslySetInnerHTML={{ __html: (selectedMaterial as any).learningObjectives }}
                      />
                    </div>
                  )}
                  
                  {(selectedMaterial as any).prerequisites && (selectedMaterial as any).prerequisites.trim() && (
                    <div className="space-y-2">
                      <h4 className="text-md font-medium flex items-center text-orange-700 dark:text-orange-400">
                        <BookMarked className="h-4 w-4 mr-2" />
                        Prerequisites
                      </h4>
                      <div 
                        className="prose prose-sm max-w-none p-4 border border-orange-200 dark:border-orange-800 rounded-lg bg-orange-50/50 dark:bg-orange-900/20 text-gray-900 dark:text-gray-100"
                        dangerouslySetInnerHTML={{ __html: (selectedMaterial as any).prerequisites }}
                      />
                    </div>
                  )}
                </div>
              )}
              
              {/* Action Buttons */}
              <div className="flex justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
                <Button 
                  variant="outline" 
                  onClick={closeMaterialModal}
                  className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Resources;