/**
 * Resources Page
 * Online MBA - Learning materials and resources with hierarchical navigation
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  FolderOpen,
  FileText,
  Video,
  Link as LinkIcon,
  Search,
  Grid as GridIcon,
  List,
  Home,
  ChevronRight,
  ArrowLeft,
  Eye,
  Calendar,
  Upload,
  Layers,
  BookOpen,
  GraduationCap,
} from 'lucide-react';
import { useAuth } from '../../auth/hooks/useAuth';
import { apiService } from '../../../services/api';
import { useToast } from '../../../shared/components/ui/Toast';
import { cn } from '../../../lib/utils';

// ============================================
// Types
// ============================================

interface Resource {
  id: string;
  title: string;
  description?: string;
  resourceType: string;
  type: 'document' | 'video' | 'link' | 'folder';
  url?: string;
  fileSize?: string;
  createdAt: string;
  term?: string;
  domain?: string;
  subject?: string;
  files?: Array<{ name: string; url: string }>;
}

interface NavigationLevel {
  type: 'root' | 'term' | 'domain' | 'subject';
  value?: string;
  label?: string;
}

// ============================================
// Stats Card Component
// ============================================

const StatsCard = React.memo(function StatsCard({
  icon,
  value,
  label,
  isLoading,
}: {
  icon: React.ReactNode;
  value: number | string;
  label: string;
  isLoading?: boolean;
}) {
  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-4 flex items-center gap-4">
      <div className="text-[#fd621b]">{icon}</div>
      <div>
        {isLoading ? (
          <div className="h-8 w-12 bg-gray-200 dark:bg-gray-700 animate-pulse mb-1" />
        ) : (
          <div className="text-2xl font-bold text-gray-900 dark:text-white">{value}</div>
        )}
        <div className="text-sm text-gray-500 dark:text-gray-400">{label}</div>
      </div>
    </div>
  );
});

// ============================================
// Navigation Item Component (Folder/Term/Domain/Subject)
// ============================================

const NavigationItem = React.memo(function NavigationItem({
  icon,
  label,
  count,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  count?: number;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-4 flex items-center gap-4 hover:border-[#fd621b] dark:hover:border-[#fc9100] hover:bg-orange-50 dark:hover:bg-orange-900/10 transition-all group"
    >
      <div className="p-3 bg-gray-100 dark:bg-gray-700 group-hover:bg-orange-100 dark:group-hover:bg-orange-900/30 transition-colors">
        {icon}
      </div>
      <div className="flex-1 text-left">
        <div className="font-semibold text-gray-900 dark:text-white">{label}</div>
        {count !== undefined && (
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {count} {count === 1 ? 'item' : 'items'}
          </div>
        )}
      </div>
      <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-[#fd621b] transition-colors" />
    </button>
  );
});

// ============================================
// Resource Card Component
// ============================================

const ResourceCard = React.memo(function ResourceCard({
  resource,
  viewMode,
  onViewDetails,
}: {
  resource: Resource;
  viewMode: 'grid' | 'list';
  onViewDetails: () => void;
}) {
  const getIcon = () => {
    switch (resource.type) {
      case 'video':
        return <LinkIcon className="w-6 h-6 text-[#fd621b]" />;
      case 'link':
        return <LinkIcon className="w-6 h-6 text-[#fd621b]" />;
      case 'folder':
        return <FolderOpen className="w-6 h-6 text-[#fc9100]" />;
      default:
        return <FileText className="w-6 h-6 text-gray-600 dark:text-gray-400" />;
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'numeric',
        year: 'numeric',
      });
    } catch {
      return '';
    }
  };

  const getCategoryBadge = () => {
    const type = resource.resourceType || 'Document';
    const isVideo = type.toLowerCase().includes('video');
    return (
      <span
        className={cn(
          'px-3 py-1 text-xs font-medium border',
          isVideo
            ? 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600'
            : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600'
        )}
      >
        {type}
      </span>
    );
  };

  if (viewMode === 'list') {
    return (
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-4 flex items-center gap-4">
        <div className="p-3 bg-gray-100 dark:bg-gray-700">
          {getIcon()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Upload className="w-4 h-4 text-[#fd621b]" />
            {getCategoryBadge()}
          </div>
          <h3 className={cn(
            'font-semibold text-gray-900 dark:text-white truncate',
            resource.type === 'video' && 'text-[#fd621b] dark:text-orange-400'
          )}>
            {resource.title}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">{resource.subject}</p>
          <div className="flex items-center gap-4 mt-1 text-xs text-gray-400">
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {formatDate(resource.createdAt)}
            </span>
            {resource.term && <span>Term: {resource.term}</span>}
          </div>
        </div>
        <button
          onClick={onViewDetails}
          className="bg-[#fd621b] hover:bg-[#fc9100] text-white px-4 py-2 text-sm font-medium flex items-center gap-2 transition-colors"
        >
          <Eye className="w-4 h-4" />
          View Details
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 flex flex-col h-full">
      {/* Header */}
      <div className="p-4 flex items-start justify-between">
        <div className="p-3 bg-gray-100 dark:bg-gray-700">
          {getIcon()}
        </div>
        <div className="flex items-center gap-2">
          <Upload className="w-4 h-4 text-[#fd621b]" />
          {getCategoryBadge()}
        </div>
      </div>

      {/* Content */}
      <div className="px-4 pb-2 flex-1">
        <h3 className={cn(
          'font-semibold mb-1 line-clamp-2',
          resource.type === 'video'
            ? 'text-[#fd621b] dark:text-orange-400'
            : 'text-gray-900 dark:text-white'
        )}>
          {resource.title}
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
          {resource.subject}
        </p>
        <div className="flex items-center justify-between text-xs text-gray-400">
          <span className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            {formatDate(resource.createdAt)}
          </span>
          {resource.term && <span>Term: {resource.term}</span>}
        </div>
      </div>

      {/* Action Button */}
      <div className="p-4 pt-2">
        <button
          onClick={onViewDetails}
          className="w-full bg-[#fd621b] hover:bg-[#fc9100] text-white py-2.5 text-sm font-medium flex items-center justify-center gap-2 transition-colors"
        >
          <Eye className="w-4 h-4" />
          View Details
        </button>
      </div>
    </div>
  );
});

// ============================================
// Main Component
// ============================================

export default function ResourcesPage() {
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Get navigation state from URL params
  const selectedTerm = searchParams.get('term') || undefined;
  const selectedDomain = searchParams.get('domain') || undefined;
  const selectedSubject = searchParams.get('subject') || undefined;

  // Build navigation path from URL params
  const navigationPath = useMemo((): NavigationLevel[] => {
    const path: NavigationLevel[] = [{ type: 'root' }];

    if (selectedTerm) {
      path.push({ type: 'term', value: selectedTerm, label: selectedTerm });
    }
    if (selectedDomain) {
      path.push({ type: 'domain', value: selectedDomain, label: selectedDomain });
    }
    if (selectedSubject) {
      path.push({ type: 'subject', value: selectedSubject, label: selectedSubject });
    }

    return path;
  }, [selectedTerm, selectedDomain, selectedSubject]);

  // Fetch resources
  const fetchResources = useCallback(async () => {
    if (!user?.email) return;

    try {
      setLoading(true);
      const result = await apiService.getResources(user.email);

      if (result.success && result.data) {
        const mappedResources: Resource[] = result.data.map((item: any) => {
          // Extract URL from various possible sources
          // PRIORITY: Individual file URL > files array > urls array > folder link
          let resourceUrl = '';

          // First priority: Check individual file fields (actual file URLs)
          resourceUrl = item.file1Url || item.file2Url || item.file3Url || item.file4Url || item.file5Url || item.fileUrl;

          // Second priority: Check files array
          if (!resourceUrl && item.files && item.files.length > 0 && item.files[0].url) {
            resourceUrl = item.files[0].url;
          }

          // Third priority: Check urls array
          if (!resourceUrl && item.urls && item.urls.length > 0 && item.urls[0].url) {
            resourceUrl = item.urls[0].url;
          }

          // Fourth priority: Direct URL fields (not folder)
          if (!resourceUrl) {
            resourceUrl = item.url || item.link || item.driveLink || item.driveUrl;
          }

          // Last resort: Folder link (only if nothing else is available)
          if (!resourceUrl) {
            resourceUrl = item.driveFolderLink;
          }

          return {
            id: item.id || item.resourceId || Math.random().toString(),
            title: item.title || item.name || 'Untitled',
            description: item.description,
            resourceType: item.resourceType || item.category || 'Document',
            type: determineResourceType(item),
            url: resourceUrl,
            fileSize: item.fileSize,
            createdAt: item.createdAt || new Date().toISOString(),
            term: item.term,
            domain: item.domain,
            subject: item.subject,
            files: item.files,
          };
        });

        setResources(mappedResources);
      }
    } catch (error) {
      toast.error('Failed to load resources');
    } finally {
      setLoading(false);
    }
  }, [user?.email, toast]);

  useEffect(() => {
    fetchResources();
  }, [fetchResources]);

  // Compute stats
  const stats = useMemo(() => {
    const terms = new Set(resources.map(r => r.term).filter(Boolean));
    const domains = new Set(resources.map(r => r.domain).filter(Boolean));
    const subjects = new Set(resources.map(r => r.subject).filter(Boolean));

    return {
      total: resources.length,
      terms: terms.size,
      domains: domains.size,
      subjects: subjects.size,
    };
  }, [resources]);

  // Get current navigation level from URL params
  const currentLevel = useMemo((): NavigationLevel => {
    if (selectedSubject) {
      return { type: 'subject', value: selectedSubject, label: selectedSubject };
    }
    if (selectedDomain) {
      return { type: 'domain', value: selectedDomain, label: selectedDomain };
    }
    if (selectedTerm) {
      return { type: 'term', value: selectedTerm, label: selectedTerm };
    }
    return { type: 'root' };
  }, [selectedTerm, selectedDomain, selectedSubject]);

  // Get items for current level
  const currentItems = useMemo(() => {
    if (currentLevel.type === 'root') {
      // Show terms
      const termCounts = new Map<string, number>();
      resources.forEach(r => {
        if (r.term) {
          termCounts.set(r.term, (termCounts.get(r.term) || 0) + 1);
        }
      });
      return Array.from(termCounts.entries()).map(([term, count]) => ({
        type: 'term' as const,
        label: term,
        count,
      }));
    }

    if (currentLevel.type === 'term') {
      // Show domains for selected term
      const domainCounts = new Map<string, number>();
      resources
        .filter(r => r.term === currentLevel.value)
        .forEach(r => {
          if (r.domain) {
            domainCounts.set(r.domain, (domainCounts.get(r.domain) || 0) + 1);
          }
        });
      return Array.from(domainCounts.entries()).map(([domain, count]) => ({
        type: 'domain' as const,
        label: domain,
        count,
      }));
    }

    if (currentLevel.type === 'domain') {
      // Show subjects for selected term and domain
      const subjectCounts = new Map<string, number>();
      resources
        .filter(r => r.term === selectedTerm && r.domain === currentLevel.value)
        .forEach(r => {
          if (r.subject) {
            subjectCounts.set(r.subject, (subjectCounts.get(r.subject) || 0) + 1);
          }
        });
      return Array.from(subjectCounts.entries()).map(([subject, count]) => ({
        type: 'subject' as const,
        label: subject,
        count,
      }));
    }

    return [];
  }, [resources, currentLevel, selectedTerm]);

  // Get resources for current subject (when at subject level)
  const currentResources = useMemo(() => {
    if (currentLevel.type !== 'subject') return [];

    return resources.filter(r =>
      r.term === selectedTerm &&
      r.domain === selectedDomain &&
      r.subject === currentLevel.value
    );
  }, [resources, currentLevel, selectedTerm, selectedDomain]);

  // Filtered resources based on search
  const filteredResources = useMemo(() => {
    if (!searchTerm) return currentResources;
    const term = searchTerm.toLowerCase();
    return currentResources.filter(r =>
      r.title.toLowerCase().includes(term) ||
      (r.description || '').toLowerCase().includes(term)
    );
  }, [currentResources, searchTerm]);

  // Navigation handlers - using URL params for browser back support
  const navigateTo = useCallback((type: NavigationLevel['type'], value: string) => {
    const params = new URLSearchParams();

    if (type === 'term') {
      params.set('term', value);
    } else if (type === 'domain') {
      if (selectedTerm) params.set('term', selectedTerm);
      params.set('domain', value);
    } else if (type === 'subject') {
      if (selectedTerm) params.set('term', selectedTerm);
      if (selectedDomain) params.set('domain', selectedDomain);
      params.set('subject', value);
    }

    navigate(`/resources?${params.toString()}`);
    setSearchTerm('');
  }, [navigate, selectedTerm, selectedDomain]);

  const navigateBack = useCallback(() => {
    if (selectedSubject) {
      // Go back to domain level
      const params = new URLSearchParams();
      if (selectedTerm) params.set('term', selectedTerm);
      if (selectedDomain) params.set('domain', selectedDomain);
      navigate(`/resources?${params.toString()}`);
    } else if (selectedDomain) {
      // Go back to term level
      const params = new URLSearchParams();
      if (selectedTerm) params.set('term', selectedTerm);
      navigate(`/resources?${params.toString()}`);
    } else if (selectedTerm) {
      // Go back to root
      navigate('/resources');
    }
    setSearchTerm('');
  }, [navigate, selectedTerm, selectedDomain, selectedSubject]);

  const navigateToLevel = useCallback((index: number) => {
    const params = new URLSearchParams();

    if (index === 0) {
      // Root level - no params
      navigate('/resources');
    } else if (index === 1 && selectedTerm) {
      // Term level
      params.set('term', selectedTerm);
      navigate(`/resources?${params.toString()}`);
    } else if (index === 2 && selectedTerm && selectedDomain) {
      // Domain level
      params.set('term', selectedTerm);
      params.set('domain', selectedDomain);
      navigate(`/resources?${params.toString()}`);
    } else if (index === 3 && selectedTerm && selectedDomain && selectedSubject) {
      // Subject level (current)
      params.set('term', selectedTerm);
      params.set('domain', selectedDomain);
      params.set('subject', selectedSubject);
      navigate(`/resources?${params.toString()}`);
    }

    setSearchTerm('');
  }, [navigate, selectedTerm, selectedDomain, selectedSubject]);

  const handleViewDetails = (resource: Resource) => {
    if (resource.url) {
      window.open(resource.url, '_blank');
    } else {
      toast.error('This resource has no file or link attached');
    }
  };


  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatsCard
          icon={<FolderOpen className="w-6 h-6" />}
          value={stats.total}
          label="Total Materials"
          isLoading={loading}
        />
        <StatsCard
          icon={<FileText className="w-6 h-6" />}
          value={stats.terms}
          label="Terms Available"
          isLoading={loading}
        />
        <StatsCard
          icon={<Layers className="w-6 h-6" />}
          value={stats.domains}
          label="Domains"
          isLoading={loading}
        />
        <StatsCard
          icon={<GraduationCap className="w-6 h-6" />}
          value={stats.subjects}
          label="Subjects"
          isLoading={loading}
        />
      </div>

      {/* Search & Navigate Card */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-4 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Search className="w-5 h-5" />
            Search & Navigate
          </h2>
          <div className="flex border border-gray-200 dark:border-gray-700 overflow-hidden">
            <button
              onClick={() => setViewMode('grid')}
              className={cn(
                'p-2 transition-colors',
                viewMode === 'grid'
                  ? 'bg-[#fd621b] text-white'
                  : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
              )}
            >
              <GridIcon className="w-5 h-5" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={cn(
                'p-2 transition-colors',
                viewMode === 'list'
                  ? 'bg-[#fd621b] text-white'
                  : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
              )}
            >
              <List className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Breadcrumb Navigation */}
        <div className="flex items-center gap-2 mb-4 text-sm flex-wrap">
          {/* Back button - only show when not at root */}
          {navigationPath.length > 1 && (
            <button
              onClick={navigateBack}
              className="flex items-center gap-1 text-gray-600 dark:text-gray-400 hover:text-[#fd621b] dark:hover:text-orange-400 transition-colors mr-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
          )}
          {/* Home/Root button */}
          <button
            onClick={() => navigateToLevel(0)}
            className="flex items-center gap-1 text-gray-600 dark:text-gray-400 hover:text-[#fd621b] dark:hover:text-orange-400 transition-colors"
          >
            <Home className="w-4 h-4" />
          </button>
          {navigationPath.map((level, index) => (
            <React.Fragment key={index}>
              {index > 0 && <ChevronRight className="w-4 h-4 text-gray-400" />}
              <button
                onClick={() => navigateToLevel(index)}
                className={cn(
                  'hover:text-[#fd621b] dark:hover:text-orange-400 transition-colors',
                  index === navigationPath.length - 1
                    ? 'text-[#fd621b] dark:text-orange-400 font-medium'
                    : 'text-gray-600 dark:text-gray-400'
                )}
              >
                {level.type === 'root' ? 'Resources' : level.label}
              </button>
            </React.Fragment>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder={currentLevel.type === 'subject'
              ? "Search materials in this subject..."
              : "Search materials across all terms..."
            }
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#fd621b] focus:border-transparent"
          />
        </div>
      </div>

      {/* Content Area */}
      {loading ? (
        // Loading skeleton for content
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-48 bg-gray-200 dark:bg-gray-700 animate-pulse" />
          ))}
        </div>
      ) : currentLevel.type === 'subject' ? (
        // Show resources for selected subject
        <>
          {filteredResources.length === 0 ? (
            <div className="text-center py-12 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
              <BookOpen className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                No resources found
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                {searchTerm
                  ? 'Try adjusting your search criteria'
                  : 'No materials available for this subject yet'
                }
              </p>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredResources.map((resource) => (
                <ResourceCard
                  key={resource.id}
                  resource={resource}
                  viewMode={viewMode}
                  onViewDetails={() => handleViewDetails(resource)}
                />
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {filteredResources.map((resource) => (
                <ResourceCard
                  key={resource.id}
                  resource={resource}
                  viewMode={viewMode}
                  onViewDetails={() => handleViewDetails(resource)}
                />
              ))}
            </div>
          )}
        </>
      ) : (
        // Show navigation items (terms, domains, or subjects)
        <>
          {currentItems.length === 0 ? (
            <div className="text-center py-12 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
              <FolderOpen className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                No {currentLevel.type === 'root' ? 'terms' : currentLevel.type === 'term' ? 'domains' : 'subjects'} available
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                Resources will appear here once they are added
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {currentItems.map((item) => (
                <NavigationItem
                  key={item.label}
                  icon={
                    item.type === 'term' ? (
                      <FileText className="w-6 h-6 text-[#fd621b]" />
                    ) : item.type === 'domain' ? (
                      <Layers className="w-6 h-6 text-[#fc9100]" />
                    ) : (
                      <GraduationCap className="w-6 h-6 text-[#fd621b]" />
                    )
                  }
                  label={item.label}
                  count={item.count}
                  onClick={() => navigateTo(item.type, item.label)}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

// Helper function
function determineResourceType(item: any): Resource['type'] {
  if (item.type === 'video' || item.resourceType?.toLowerCase().includes('video')) {
    return 'video';
  }
  if (item.type === 'link' || item.resourceType?.toLowerCase().includes('link')) {
    return 'link';
  }
  if (item.type === 'folder' || item.resourceType?.toLowerCase().includes('folder')) {
    return 'folder';
  }
  return 'document';
}
