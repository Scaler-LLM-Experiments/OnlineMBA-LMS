/**
 * Students Corner Types and Interfaces
 * 
 * This file contains all type definitions for the Students Corner feature
 * including activities, leaderboard, and dashboard data structures.
 */

export type ActivityType = 'POST' | 'FORUM' | 'EVENT' | 'SKILL_OFFER' | 'SKILL_REQUEST';
export type ActivityStatus = 'Active' | 'Archived' | 'Flagged' | 'Pending';
export type LeaderboardTimeframe = 'week' | 'month' | 'all';

/**
 * Main Students Corner activity interface
 */
export interface StudentsCornerActivity {
  id: string;
  type: ActivityType;
  studentEmail: string;
  fullName: string;
  batch: string;
  timestamp: string;
  status: ActivityStatus;
  points: number;
  title: string;
  content: string;
  targetBatch: string;
  category: string;
  metadata: string; // JSON string with additional data
}

/**
 * Leaderboard entry interface
 */
export interface LeaderboardEntry {
  studentEmail: string;
  fullName: string;
  batch: string;
  totalPoints: number;
  rank: number;
  recentActivity: number;
}

/**
 * Students Corner dashboard statistics
 */
export interface StudentsCornerStats {
  totalActivities: number;
  myActivities: number;
  totalPoints: number;
  weeklyActivities: number;
  myRank: number;
  activitiesByType: {
    POST: number;
    FORUM: number;
    EVENT: number;
    SKILL_OFFER: number;
    SKILL_REQUEST: number;
  };
}

/**
 * Complete dashboard data interface
 */
export interface StudentsCornerDashboardData {
  student: {
    email: string;
    fullName: string;
    rollNo: string;
    batch: string;
  };
  stats: StudentsCornerStats;
  recentActivity: StudentsCornerActivity[];
  leaderboard: LeaderboardEntry[];
  lastSync: string;
}

/**
 * Form data for creating new activities
 */
export interface CreateActivityFormData {
  type: ActivityType;
  title: string;
  content: string;
  category?: string;
  metadata?: Record<string, any>;
  
  // Event-specific fields
  eventDate?: string;
  eventTime?: string;
  eventLocation?: string;
  
  // Skill exchange specific fields
  skillLevel?: 'Beginner' | 'Intermediate' | 'Advanced';
  duration?: string;
  preferredTime?: string;
}

/**
 * Activity creation response
 */
export interface CreateActivityResponse {
  success: boolean;
  data?: {
    id: string;
    type: ActivityType;
    title: string;
    points: number;
    message: string;
  };
  error?: string;
}

/**
 * Filter options for activity lists
 */
export interface ActivityFilters {
  type?: ActivityType;
  category?: string;
  batch?: string;
  dateRange?: {
    start: string;
    end: string;
  };
  search?: string;
  showOnlyMine?: boolean;
}

/**
 * Parsed metadata interfaces for different activity types
 */
export interface PostMetadata {
  tags?: string[];
  attachments?: string[];
  isAnonymous?: boolean;
}

export interface EventMetadata {
  eventDate: string;
  eventTime: string;
  eventLocation: string;
  maxAttendees?: number;
  currentAttendees?: number;
  rsvpRequired?: boolean;
  eventType: 'Workshop' | 'Study Group' | 'Social' | 'Competition' | 'Other';
}

export interface SkillExchangeMetadata {
  skillLevel: 'Beginner' | 'Intermediate' | 'Advanced';
  duration: string;
  preferredTime: string;
  contactMethod: 'Email' | 'LinkedIn' | 'Phone';
  isRemote?: boolean;
  subjects?: string[];
}

export interface ForumMetadata {
  isQuestion?: boolean;
  tags?: string[];
  category: 'Academic' | 'Career' | 'Technical' | 'General';
  isResolved?: boolean;
}

/**
 * Activity type configurations
 */
export interface ActivityTypeConfig {
  label: string;
  icon: string;
  color: string;
  description: string;
  points: number;
  formFields: string[];
}

/**
 * Activity type configurations map
 */
export const ACTIVITY_TYPE_CONFIGS: Record<ActivityType, ActivityTypeConfig> = {
  POST: {
    label: 'Post',
    icon: 'MessageSquare',
    color: 'bg-blue-100 text-blue-800',
    description: 'Share updates, insights, or general content with your peers',
    points: 10,
    formFields: ['title', 'content', 'category', 'tags']
  },
  FORUM: {
    label: 'Forum Discussion',
    icon: 'MessageCircle',
    color: 'bg-green-100 text-green-800',
    description: 'Start or join academic discussions and Q&A',
    points: 5,
    formFields: ['title', 'content', 'category', 'isQuestion']
  },
  EVENT: {
    label: 'Event',
    icon: 'Calendar',
    color: 'bg-purple-100 text-purple-800',
    description: 'Organize study groups, workshops, or social events',
    points: 25,
    formFields: ['title', 'content', 'eventDate', 'eventTime', 'eventLocation', 'maxAttendees']
  },
  SKILL_OFFER: {
    label: 'Skill Offer',
    icon: 'BookOpen',
    color: 'bg-orange-100 text-orange-800',
    description: 'Offer tutoring or mentoring in subjects you excel at',
    points: 15,
    formFields: ['title', 'content', 'subjects', 'skillLevel', 'duration', 'contactMethod']
  },
  SKILL_REQUEST: {
    label: 'Skill Request',
    icon: 'HelpCircle',
    color: 'bg-pink-100 text-pink-800',
    description: 'Request help or tutoring in specific subjects',
    points: 10,
    formFields: ['title', 'content', 'subjects', 'skillLevel', 'preferredTime', 'contactMethod']
  }
};

/**
 * Activity categories
 */
export const ACTIVITY_CATEGORIES = [
  'General',
  'Academic',
  'Career',
  'Technical',
  'Social',
  'Study Group',
  'Project Collaboration',
  'Job Search',
  'Internship',
  'Networking',
  'Skills Development'
] as const;

export type ActivityCategory = typeof ACTIVITY_CATEGORIES[number];

/**
 * Engagement Types and Interfaces
 */
export type EngagementType = 'LIKE' | 'COMMENT';

export interface StudentsCornerEngagement {
  id: string;
  activityId: string;
  studentEmail: string;
  fullName: string;
  batch: string;
  engagementType: EngagementType;
  commentText?: string;
  timestamp: string;
  points: number;
}

export interface ActivityEngagements {
  likes: number;
  comments: StudentsCornerComment[];
  userLiked: boolean;
}

export interface StudentsCornerComment {
  id: string;
  studentEmail: string;
  fullName: string;
  batch: string;
  text: string;
  timestamp: string;
}

export interface StudentMention {
  email: string;
  fullName: string;
  batch: string;
}

export interface CreateEngagementResponse {
  success: boolean;
  data?: {
    id: string;
    type: EngagementType;
    points: number;
    message: string;
  };
  error?: string;
}

