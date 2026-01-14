import { useState, useEffect, useCallback } from 'react';
import { assignmentApiService } from '../services/assignmentApi';
import { useAuth } from '../features/auth/hooks/useAuth';

interface RefreshNotification {
  refreshRequired: boolean;
  timestamp?: string;
  reason?: string;
  bannerNotice?: string;
  requireFullScreen?: boolean;
}

export function useRefreshNotification() {
  const { user } = useAuth();
  const [notification, setNotification] = useState<RefreshNotification | null>(null);
  const [loading, setLoading] = useState(false);

  const checkRefresh = useCallback(async () => {
    if (!user?.email) return;

    try {
      const result = await assignmentApiService.checkRefreshRequired(user.email);

      if (result.success && result.data) {
        if (result.data.refreshRequired) {
          setNotification(result.data);
        } else {
          setNotification(null);
        }
      }
    } catch (error) {
      console.error('Error checking refresh status:', error);
    }
  }, [user?.email]);

  const acknowledgeRefresh = useCallback(async () => {
    if (!user?.email) return;

    setLoading(true);

    // Fire the acknowledgment asynchronously (don't wait for completion)
    assignmentApiService.acknowledgeRefresh(user.email).then(result => {
      if (result.success) {
        console.log('✅ Refresh acknowledged successfully');
      } else {
        console.error('⚠️ Refresh acknowledgment may have failed:', result.error);
      }
    }).catch(error => {
      console.error('⚠️ Error acknowledging refresh:', error);
    });

    // Refresh the page immediately without waiting for backend
    setNotification(null);
    window.location.reload();
  }, [user?.email]);

  const dismissBanner = useCallback(async () => {
    if (!user?.email || notification?.requireFullScreen) return;

    setLoading(true);

    try {
      const result = await assignmentApiService.acknowledgeRefresh(user.email);

      if (result.success) {
        setNotification(null);
      }
    } catch (error) {
      console.error('Error dismissing banner:', error);
    } finally {
      setLoading(false);
    }
  }, [user?.email, notification?.requireFullScreen]);

  // Poll for refresh notifications every 30 seconds
  useEffect(() => {
    if (!user?.email) return;

    // Check immediately on mount
    checkRefresh();

    // Then poll every 30 seconds
    const interval = setInterval(checkRefresh, 30000);

    return () => clearInterval(interval);
  }, [user?.email, checkRefresh]);

  return {
    notification,
    loading,
    acknowledgeRefresh,
    dismissBanner,
  };
}
