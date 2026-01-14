/**
 * Resources Page
 * Online MBA - Learning materials and resources
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  BookOpen,
  Search,
  Filter,
  FolderOpen,
  FileText,
  Video,
  Link as LinkIcon,
  Download,
  ExternalLink,
  ChevronRight,
  Grid as GridIcon,
  List,
} from 'lucide-react';
import { useAuth } from '../../auth/hooks/useAuth';
import { apiService } from '../../../services/api';
import {
  PageWrapper,
  PageHeader,
  Grid,
  EmptyState,
} from '../../../shared/components/layout/DashboardLayout';
import { Card, StatCard } from '../../../shared/components/ui/Card';
import { Button } from '../../../shared/components/ui/Button';
import { Input } from '../../../shared/components/ui/Input';
import { Badge } from '../../../shared/components/ui/Badge';
import { Select } from '../../../shared/components/ui/Select';
import { Tabs, TabPanel } from '../../../shared/components/ui/Tabs';
import { useToast } from '../../../shared/components/ui/Toast';
import { CardSkeleton } from '../../../shared/components/ui/Skeleton';
import { cn } from '../../../lib/utils';

// ============================================
// Types
// ============================================

interface Resource {
  id: string;
  title: string;
  description?: string;
  category: string;
  type: 'document' | 'video' | 'link' | 'folder';
  url?: string;
  fileSize?: string;
  createdAt: string;
  updatedAt?: string;
  tags?: string[];
  subject?: string;
  module?: string;
}

// ============================================
// Resource Card Component
// ============================================

const ResourceCard = React.memo(function ResourceCard({
  resource,
  viewMode,
}: {
  resource: Resource;
  viewMode: 'grid' | 'list';
}) {
  const getIcon = () => {
    switch (resource.type) {
      case 'video':
        return <Video className="w-5 h-5 text-error-500" />;
      case 'link':
        return <LinkIcon className="w-5 h-5 text-secondary-500" />;
      case 'folder':
        return <FolderOpen className="w-5 h-5 text-warning-500" />;
      default:
        return <FileText className="w-5 h-5 text-primary-500" />;
    }
  };

  const getTypeLabel = () => {
    switch (resource.type) {
      case 'video':
        return 'Video';
      case 'link':
        return 'Link';
      case 'folder':
        return 'Folder';
      default:
        return 'Document';
    }
  };

  const handleClick = () => {
    if (resource.url) {
      window.open(resource.url, '_blank');
    }
  };

  if (viewMode === 'list') {
    return (
      <div
        onClick={handleClick}
        className={cn(
          'flex items-center gap-4 p-4 bg-white dark:bg-neutral-900 rounded-xl',
          'border border-neutral-200 dark:border-neutral-800',
          'hover:border-primary-300 dark:hover:border-primary-700',
          'cursor-pointer transition-all duration-200',
          'group'
        )}
      >
        <div className="p-3 rounded-lg bg-neutral-100 dark:bg-neutral-800 group-hover:bg-primary-100 dark:group-hover:bg-primary-900/30 transition-colors">
          {getIcon()}
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-neutral-900 dark:text-neutral-100 truncate">
            {resource.title}
          </h3>
          {resource.description && (
            <p className="text-sm text-neutral-500 truncate mt-0.5">
              {resource.description}
            </p>
          )}
          <div className="flex items-center gap-2 mt-1">
            <Badge variant="default" size="sm">
              {resource.category}
            </Badge>
            {resource.module && (
              <span className="text-xs text-neutral-400">
                {resource.module}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          {resource.fileSize && (
            <span className="text-sm text-neutral-400">{resource.fileSize}</span>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <ExternalLink className="w-4 h-4" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <Card
      hoverable
      className="cursor-pointer group"
      onClick={handleClick}
    >
      <div className="p-5">
        <div className="flex items-start justify-between mb-4">
          <div className="p-3 rounded-lg bg-neutral-100 dark:bg-neutral-800 group-hover:bg-primary-100 dark:group-hover:bg-primary-900/30 transition-colors">
            {getIcon()}
          </div>
          <Badge variant="default" size="sm">
            {getTypeLabel()}
          </Badge>
        </div>

        <h3 className="font-semibold text-neutral-900 dark:text-neutral-100 mb-2 line-clamp-2">
          {resource.title}
        </h3>

        {resource.description && (
          <p className="text-sm text-neutral-500 line-clamp-2 mb-4">
            {resource.description}
          </p>
        )}

        <div className="flex items-center justify-between text-xs text-neutral-400">
          <span>{resource.category}</span>
          {resource.fileSize && <span>{resource.fileSize}</span>}
        </div>

        {resource.tags && resource.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-3">
            {resource.tags.slice(0, 3).map((tag, idx) => (
              <span
                key={idx}
                className="px-2 py-0.5 text-xs bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 rounded"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
});

// ============================================
// Main Component
// ============================================

export default function ResourcesPage() {
  const { user } = useAuth();
  const toast = useToast();

  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Fetch resources
  const fetchResources = useCallback(async () => {
    if (!user?.email) return;

    try {
      setLoading(true);
      const result = await apiService.getResources(user.email);

      if (result.success && result.data) {
        // Map API response to Resource type
        const mappedResources: Resource[] = result.data.map((item: any) => ({
          id: item.id || item.resourceId || Math.random().toString(),
          title: item.title || item.name || 'Untitled',
          description: item.description,
          category: item.category || item.type || 'General',
          type: determineResourceType(item),
          url: item.url || item.link || item.driveLink,
          fileSize: item.fileSize,
          createdAt: item.createdAt || new Date().toISOString(),
          tags: item.tags ? item.tags.split(',').map((t: string) => t.trim()) : [],
          subject: item.subject,
          module: item.module,
        }));

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

  // Get unique categories
  const categories = useMemo(() => {
    const uniqueCategories = Array.from(new Set(resources.map((r) => r.category)));
    return [
      { value: 'all', label: 'All Categories' },
      ...uniqueCategories.map((c) => ({ value: c, label: c })),
    ];
  }, [resources]);

  // Filter resources
  const filteredResources = useMemo(() => {
    return resources.filter((resource) => {
      const matchesSearch =
        resource.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (resource.description || '').toLowerCase().includes(searchTerm.toLowerCase());

      const matchesCategory =
        categoryFilter === 'all' || resource.category === categoryFilter;

      const matchesType = typeFilter === 'all' || resource.type === typeFilter;

      return matchesSearch && matchesCategory && matchesType;
    });
  }, [resources, searchTerm, categoryFilter, typeFilter]);

  // Stats
  const stats = useMemo(() => ({
    total: resources.length,
    documents: resources.filter((r) => r.type === 'document').length,
    videos: resources.filter((r) => r.type === 'video').length,
    links: resources.filter((r) => r.type === 'link').length,
  }), [resources]);

  // Type options
  const typeOptions = [
    { value: 'all', label: 'All Types' },
    { value: 'document', label: 'Documents' },
    { value: 'video', label: 'Videos' },
    { value: 'link', label: 'Links' },
    { value: 'folder', label: 'Folders' },
  ];

  if (loading) {
    return (
      <PageWrapper>
        <PageHeader
          title="Learning Resources"
          subtitle="Access course materials, recordings, and study resources"
        />
        <Grid cols={4} className="mb-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 bg-neutral-200 dark:bg-neutral-700 rounded-xl animate-pulse" />
          ))}
        </Grid>
        <Grid cols={3}>
          {[...Array(9)].map((_, i) => (
            <CardSkeleton key={i} lines={2} />
          ))}
        </Grid>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper>
      <PageHeader
        title="Learning Resources"
        subtitle="Access course materials, recordings, and study resources"
      />

      {/* Stats */}
      <Grid cols={4} className="mb-6">
        <StatCard
          label="Total Resources"
          value={stats.total}
          icon={<BookOpen className="w-5 h-5" />}
        />
        <StatCard
          label="Documents"
          value={stats.documents}
          icon={<FileText className="w-5 h-5" />}
        />
        <StatCard
          label="Videos"
          value={stats.videos}
          icon={<Video className="w-5 h-5" />}
        />
        <StatCard
          label="Links"
          value={stats.links}
          icon={<LinkIcon className="w-5 h-5" />}
        />
      </Grid>

      {/* Filters */}
      <Card className="mb-6">
        <div className="p-4">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search resources..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                leftIcon={<Search className="w-4 h-4" />}
              />
            </div>
            <div className="flex gap-4">
              <Select
                options={categories}
                value={categoryFilter}
                onChange={setCategoryFilter}
                fullWidth={false}
                className="w-44"
              />
              <Select
                options={typeOptions}
                value={typeFilter}
                onChange={setTypeFilter}
                fullWidth={false}
                className="w-36"
              />
              <div className="flex border border-neutral-200 dark:border-neutral-700 rounded-lg overflow-hidden">
                <button
                  onClick={() => setViewMode('grid')}
                  className={cn(
                    'p-2 transition-colors',
                    viewMode === 'grid'
                      ? 'bg-primary-500 text-white'
                      : 'bg-white dark:bg-neutral-800 text-neutral-600 hover:bg-neutral-100 dark:hover:bg-neutral-700'
                  )}
                >
                  <GridIcon className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={cn(
                    'p-2 transition-colors',
                    viewMode === 'list'
                      ? 'bg-primary-500 text-white'
                      : 'bg-white dark:bg-neutral-800 text-neutral-600 hover:bg-neutral-100 dark:hover:bg-neutral-700'
                  )}
                >
                  <List className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Resources */}
      {filteredResources.length === 0 ? (
        <EmptyState
          icon={<BookOpen className="w-16 h-16" />}
          title="No resources found"
          description="Try adjusting your search or filter criteria"
        />
      ) : viewMode === 'grid' ? (
        <Grid cols={3}>
          {filteredResources.map((resource) => (
            <ResourceCard
              key={resource.id}
              resource={resource}
              viewMode={viewMode}
            />
          ))}
        </Grid>
      ) : (
        <div className="space-y-2">
          {filteredResources.map((resource) => (
            <ResourceCard
              key={resource.id}
              resource={resource}
              viewMode={viewMode}
            />
          ))}
        </div>
      )}
    </PageWrapper>
  );
}

// Helper function
function determineResourceType(item: any): Resource['type'] {
  if (item.type === 'video' || item.category?.toLowerCase().includes('video')) {
    return 'video';
  }
  if (item.type === 'link' || item.category?.toLowerCase().includes('link')) {
    return 'link';
  }
  if (item.type === 'folder' || item.category?.toLowerCase().includes('folder')) {
    return 'folder';
  }
  return 'document';
}
