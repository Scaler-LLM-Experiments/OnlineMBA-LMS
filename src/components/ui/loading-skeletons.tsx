import React from 'react';
import { Card, CardContent } from './card';
import { Skeleton } from './skeleton';

// Card Grid Skeleton (for Dashboard, Announcements, Assignments, etc.)
export const CardGridSkeleton: React.FC<{ 
  columns?: 2 | 3 | 4;
  items?: number;
}> = ({ columns = 4, items = 8 }) => (
  <div className="space-y-6">
    <div className={`grid gap-4 ${
      columns === 2 ? 'md:grid-cols-2' :
      columns === 3 ? 'md:grid-cols-3' :
      'md:grid-cols-2 lg:grid-cols-4'
    }`}>
      {Array.from({ length: items }).map((_, i) => (
        <Card key={i}>
          <CardContent className="p-6">
            <div className="space-y-3">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-8 w-1/2" />
              <div className="space-y-2">
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-2/3" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  </div>
);

// Profile/Form Skeleton (for Profile, detailed forms)
export const ProfileSkeleton: React.FC = () => (
  <div className="space-y-6">
    <Card>
      <CardContent className="p-8">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center space-x-4">
            <Skeleton className="h-16 w-16 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-32" />
            </div>
          </div>
          {/* Form fields */}
          <div className="grid gap-4 md:grid-cols-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-10 w-full" />
              </div>
            ))}
          </div>
          {/* Large text area */}
          <div className="space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-32 w-full" />
          </div>
        </div>
      </CardContent>
    </Card>
  </div>
);

// List Skeleton (for Resources, Calendar events, etc.)
export const ListSkeleton: React.FC<{ 
  items?: number;
  showSearch?: boolean;
}> = ({ items = 6, showSearch = true }) => (
  <div className="space-y-6">
    {/* Search/Filter bar */}
    {showSearch && (
      <div className="flex gap-4">
        <Skeleton className="h-10 flex-1" />
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-10 w-24" />
      </div>
    )}
    
    {/* List items */}
    <div className="space-y-4">
      {Array.from({ length: items }).map((_, i) => (
        <Card key={i}>
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="space-y-3 flex-1">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-4 w-20" />
                </div>
                <Skeleton className="h-6 w-3/4" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-2/3" />
                </div>
                <div className="flex gap-2">
                  <Skeleton className="h-6 w-16" />
                  <Skeleton className="h-6 w-20" />
                </div>
              </div>
              <Skeleton className="h-8 w-24" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  </div>
);

// Calendar Grid Skeleton
export const CalendarSkeleton: React.FC = () => (
  <div className="space-y-6">
    {/* Stats cards */}
    <div className="grid gap-4 md:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <Card key={i}>
          <CardContent className="p-4">
            <div className="space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-8 w-1/2" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
    
    {/* Calendar grid */}
    <Card>
      <CardContent className="p-6">
        <div className="space-y-4">
          <Skeleton className="h-8 w-48" />
          <div className="grid grid-cols-7 gap-2">
            {Array.from({ length: 35 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  </div>
);

// Simple Center Loading (for Resources, simple loading states)
export const CenterLoadingSkeleton: React.FC<{ 
  message?: string;
  showSpinner?: boolean;
}> = ({ message = "Loading...", showSpinner = true }) => (
  <div className="flex items-center justify-center h-64">
    <div className="flex items-center space-x-3">
      {showSpinner && <Skeleton className="h-6 w-6 rounded-full" />}
      <span className="text-muted-foreground">{message}</span>
    </div>
  </div>
);

// Policies/Documents Grid Skeleton
export const DocumentGridSkeleton: React.FC = () => (
  <div className="space-y-6">
    <div className="grid gap-6 sm:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 9 }).map((_, i) => (
        <Card key={i}>
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Skeleton className="h-8 w-8" />
                <Skeleton className="h-6 w-3/4" />
              </div>
              <Skeleton className="h-4 w-1/2" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
              </div>
              <div className="flex justify-between items-center">
                <Skeleton className="h-6 w-20" />
                <Skeleton className="h-8 w-24" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  </div>
);