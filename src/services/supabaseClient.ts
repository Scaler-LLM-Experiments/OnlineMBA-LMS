import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || '';
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || '';

const hasCredentials = supabaseUrl && supabaseAnonKey;

if (!hasCredentials) {
  console.warn('⚠️ Supabase credentials not configured. Activity tracking will be disabled.');
  console.warn('💡 To enable activity tracking, follow SUPABASE_SETUP.md');
}

// Only create client if credentials are provided, otherwise use a null client
export const supabase = hasCredentials
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null as any;

// Types for our activity logs
export interface UserActivityLog {
  id?: string;
  timestamp?: string;
  student_email: string;
  batch?: string;
  action_type: string;
  action_detail?: string;
  recording_id?: string;
  recording_name?: string;
  watch_duration_seconds?: number;
  video_duration_seconds?: number;
  watch_percentage?: number;
  completion_status?: string;
  created_at?: string;
}

// Activity tracking service
export const activityService = {
  /**
   * Log a user activity
   */
  async logActivity(activity: UserActivityLog) {
    try {
      if (!supabase || !hasCredentials) {
        // Silently skip if Supabase not configured
        return { success: false, error: 'No credentials' };
      }

      const { data, error } = await supabase
        .from('user_activity')
        .insert([activity]);

      if (error) {
        console.error('Error logging activity:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (error) {
      console.error('Exception logging activity:', error);
      return { success: false, error: String(error) };
    }
  },

  /**
   * Get user activity logs
   */
  async getUserActivity(
    studentEmail: string,
    limit: number = 100,
    actionType?: string
  ) {
    try {
      let query = supabase
        .from('user_activity')
        .select('*')
        .eq('student_email', studentEmail)
        .order('timestamp', { ascending: false })
        .limit(limit);

      if (actionType) {
        query = query.eq('action_type', actionType);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching activity:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (error) {
      console.error('Exception fetching activity:', error);
      return { success: false, error: String(error) };
    }
  },

  /**
   * Get all activity logs (admin only)
   */
  async getAllActivity(
    limit: number = 100,
    filters?: {
      studentEmail?: string;
      batch?: string;
      actionType?: string;
      startDate?: string;
      endDate?: string;
    }
  ) {
    try {
      let query = supabase
        .from('user_activity')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(limit);

      if (filters?.studentEmail) {
        query = query.eq('student_email', filters.studentEmail);
      }
      if (filters?.batch) {
        query = query.eq('batch', filters.batch);
      }
      if (filters?.actionType) {
        query = query.eq('action_type', filters.actionType);
      }
      if (filters?.startDate) {
        query = query.gte('timestamp', filters.startDate);
      }
      if (filters?.endDate) {
        query = query.lte('timestamp', filters.endDate);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching all activity:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (error) {
      console.error('Exception fetching all activity:', error);
      return { success: false, error: String(error) };
    }
  },

  /**
   * Get video engagement stats for a student
   */
  async getVideoEngagement(studentEmail: string) {
    try {
      const { data, error } = await supabase
        .from('user_activity')
        .select('*')
        .eq('student_email', studentEmail)
        .in('action_type', ['recording_opened', 'recording_watched', 'recording_completed'])
        .order('timestamp', { ascending: false });

      if (error) {
        console.error('Error fetching video engagement:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (error) {
      console.error('Exception fetching video engagement:', error);
      return { success: false, error: String(error) };
    }
  },

  /**
   * Get activity stats (for dashboard)
   */
  async getActivityStats(studentEmail?: string) {
    try {
      let query = supabase.from('user_activity').select('*');

      if (studentEmail) {
        query = query.eq('student_email', studentEmail);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching stats:', error);
        return { success: false, error: error.message };
      }

      // Calculate stats
      const stats = {
        totalActivities: data?.length || 0,
        pageViews: data?.filter((a: any) => a.action_type === 'page_view').length || 0,
        formsInteracted: data?.filter((a: any) => a.action_type === 'form_interaction').length || 0,
        recordingsWatched: data?.filter((a: any) => a.action_type.includes('recording')).length || 0,
        completedRecordings: data?.filter((a: any) => a.action_type === 'recording_completed').length || 0,
        avgWatchPercentage: data
          ?.filter((a: any) => a.watch_percentage > 0)
          .reduce((sum: number, a: any) => sum + (a.watch_percentage || 0), 0) /
          (data?.filter((a: any) => a.watch_percentage > 0).length || 1) || 0,
      };

      return { success: true, data: stats };
    } catch (error) {
      console.error('Exception calculating stats:', error);
      return { success: false, error: String(error) };
    }
  },
};
