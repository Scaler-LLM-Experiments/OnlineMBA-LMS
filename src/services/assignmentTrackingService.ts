/**
 * Assignment Platform - Comprehensive Action Tracking Service
 *
 * This service tracks EVERY action a student takes in the Assignment Platform
 * using Supabase for real-time analytics and debugging.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

// ==========================================
// TYPES & INTERFACES
// ==========================================

export type ActionCategory =
  | 'click'
  | 'upload'
  | 'error'
  | 'navigation'
  | 'form'
  | 'rating'
  | 'modal'
  | 'filter'
  | 'search';

export interface AssignmentAction {
  // Student Information
  student_email: string;
  student_name?: string;
  batch?: string;

  // Action Details
  action_type: string; // e.g., "button_click", "file_upload_success", "error_file_missing", "tab_switch_to_active"
  action_category: ActionCategory;
  action_description: string;

  // Assignment Context (optional)
  assignment_id?: string;
  assignment_name?: string;
  assignment_subject?: string;
  term?: string;

  // Page/Location Context
  page_url?: string;
  page_section?: string; // e.g., "assignment_list", "assignment_details", "submission_form"

  // Metadata (flexible for additional data)
  metadata?: Record<string, any>;

  // Technical Context
  user_agent?: string;
  session_id?: string;
  screen_resolution?: string;

  // Performance Tracking
  load_time_ms?: number;
}

export interface TrackingFilters {
  student_email?: string;
  student_name?: string;
  action_type?: string;
  action_category?: ActionCategory;
  assignment_id?: string;
  assignment_subject?: string;
  batch?: string;
  date_from?: string;
  date_to?: string;
  limit?: number;
  offset?: number;
}

// ==========================================
// ASSIGNMENT TRACKING SERVICE
// ==========================================

class AssignmentTrackingService {
  private supabase: SupabaseClient | null = null;
  private sessionId: string;
  private isEnabled: boolean = true;

  constructor() {
    this.sessionId = this.generateSessionId();
    this.initializeSupabase();
  }

  /**
   * Initialize Supabase client with Assignment Database credentials
   */
  private initializeSupabase() {
    const supabaseUrl = process.env.REACT_APP_ASSIGNMENT_SUPABASE_URL;
    const supabaseAnonKey = process.env.REACT_APP_ASSIGNMENT_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      console.warn('⚠️ Assignment Tracking: Supabase credentials not found. Tracking disabled.');
      this.isEnabled = false;
      return;
    }

    try {
      this.supabase = createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
          persistSession: false, // Don't persist auth session for tracking
        },
      });
      console.log('✅ Assignment Tracking: Supabase initialized');
    } catch (error) {
      console.error('❌ Assignment Tracking: Failed to initialize Supabase:', error);
      this.isEnabled = false;
    }
  }

  /**
   * Generate unique session ID for tracking user sessions
   */
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  }

  /**
   * Get current session ID
   */
  getSessionId(): string {
    return this.sessionId;
  }

  /**
   * Track an action in the Assignment Platform
   */
  async trackAction(action: AssignmentAction): Promise<void> {
    if (!this.isEnabled || !this.supabase) {
      console.log('🔕 Assignment Tracking: Disabled, skipping action:', action.action_type);
      return;
    }

    try {
      const enrichedAction = {
        ...action,
        timestamp: new Date().toISOString(),
        page_url: action.page_url || window.location.href,
        user_agent: action.user_agent || navigator.userAgent,
        session_id: action.session_id || this.sessionId,
        screen_resolution: action.screen_resolution || `${window.screen.width}x${window.screen.height}`,
      };

      const { error } = await this.supabase
        .from('assignment_actions')
        .insert([enrichedAction]);

      if (error) {
        console.error('❌ Assignment Tracking: Failed to insert action:', error);
      } else {
        console.log(
          '✅ Tracked:',
          action.action_category,
          '|',
          action.action_type,
          '|',
          action.action_description,
          action.metadata ? `| Metadata: ${JSON.stringify(action.metadata)}` : ''
        );
      }
    } catch (error) {
      console.error('❌ Assignment Tracking: Exception while tracking action:', error);
    }
  }

  /**
   * Batch track multiple actions (for performance)
   */
  async trackBatchActions(actions: AssignmentAction[]): Promise<void> {
    if (!this.isEnabled || !this.supabase || actions.length === 0) {
      return;
    }

    try {
      const enrichedActions = actions.map(action => ({
        ...action,
        timestamp: new Date().toISOString(),
        page_url: action.page_url || window.location.href,
        user_agent: action.user_agent || navigator.userAgent,
        session_id: action.session_id || this.sessionId,
        screen_resolution: action.screen_resolution || `${window.screen.width}x${window.screen.height}`,
      }));

      const { error } = await this.supabase
        .from('assignment_actions')
        .insert(enrichedActions);

      if (error) {
        console.error('❌ Assignment Tracking: Failed to insert batch actions:', error);
      } else {
        console.log(`✅ Tracked ${actions.length} actions in batch`);
      }
    } catch (error) {
      console.error('❌ Assignment Tracking: Exception while tracking batch actions:', error);
    }
  }

  /**
   * Get tracked actions with filters (for admin dashboard)
   */
  async getActions(filters?: TrackingFilters): Promise<any[]> {
    if (!this.isEnabled || !this.supabase) {
      return [];
    }

    try {
      let query = this.supabase
        .from('assignment_actions')
        .select('*')
        .order('timestamp', { ascending: false });

      // Apply filters
      if (filters?.student_email) {
        query = query.eq('student_email', filters.student_email);
      }
      if (filters?.student_name) {
        query = query.ilike('student_name', `%${filters.student_name}%`);
      }
      if (filters?.action_type) {
        query = query.eq('action_type', filters.action_type);
      }
      if (filters?.action_category) {
        query = query.eq('action_category', filters.action_category);
      }
      if (filters?.assignment_id) {
        query = query.eq('assignment_id', filters.assignment_id);
      }
      if (filters?.assignment_subject) {
        query = query.eq('assignment_subject', filters.assignment_subject);
      }
      if (filters?.batch) {
        query = query.eq('batch', filters.batch);
      }
      if (filters?.date_from) {
        query = query.gte('timestamp', filters.date_from);
      }
      if (filters?.date_to) {
        query = query.lte('timestamp', filters.date_to);
      }

      // Pagination
      const limit = filters?.limit || 100;
      const offset = filters?.offset || 0;
      query = query.range(offset, offset + limit - 1);

      const { data, error } = await query;

      if (error) {
        console.error('❌ Assignment Tracking: Failed to fetch actions:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('❌ Assignment Tracking: Exception while fetching actions:', error);
      return [];
    }
  }

  /**
   * Get action summary by student
   */
  async getActionSummaryByStudent(): Promise<any[]> {
    if (!this.isEnabled || !this.supabase) {
      return [];
    }

    try {
      const { data, error } = await this.supabase
        .from('assignment_actions_summary_by_student')
        .select('*')
        .order('total_actions', { ascending: false });

      if (error) {
        console.error('❌ Assignment Tracking: Failed to fetch summary:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('❌ Assignment Tracking: Exception while fetching summary:', error);
      return [];
    }
  }

  /**
   * Get action summary by assignment
   */
  async getActionSummaryByAssignment(): Promise<any[]> {
    if (!this.isEnabled || !this.supabase) {
      return [];
    }

    try {
      const { data, error } = await this.supabase
        .from('assignment_actions_summary_by_assignment')
        .select('*')
        .order('total_actions', { ascending: false });

      if (error) {
        console.error('❌ Assignment Tracking: Failed to fetch summary:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('❌ Assignment Tracking: Exception while fetching summary:', error);
      return [];
    }
  }

  /**
   * Get error actions only
   */
  async getErrorActions(limit: number = 100): Promise<any[]> {
    if (!this.isEnabled || !this.supabase) {
      return [];
    }

    try {
      const { data, error } = await this.supabase
        .from('assignment_actions_errors')
        .select('*')
        .limit(limit);

      if (error) {
        console.error('❌ Assignment Tracking: Failed to fetch errors:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('❌ Assignment Tracking: Exception while fetching errors:', error);
      return [];
    }
  }

  /**
   * Clear all tracking data (admin only - use with caution)
   */
  async clearAllActions(): Promise<boolean> {
    if (!this.isEnabled || !this.supabase) {
      return false;
    }

    try {
      const { error } = await this.supabase
        .from('assignment_actions')
        .delete()
        .gte('id', 0); // Delete all rows

      if (error) {
        console.error('❌ Assignment Tracking: Failed to clear actions:', error);
        return false;
      }

      console.log('✅ Assignment Tracking: All actions cleared');
      return true;
    } catch (error) {
      console.error('❌ Assignment Tracking: Exception while clearing actions:', error);
      return false;
    }
  }
}

// ==========================================
// EXPORT SINGLETON INSTANCE
// ==========================================

export const assignmentTrackingService = new AssignmentTrackingService();
