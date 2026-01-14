import { useState, useEffect } from 'react';
import { Session, SessionFilters } from '../../types';
import { api } from '../services/api';
import toast from 'react-hot-toast';

export function useSessions(filters?: SessionFilters) {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Only fetch if filters are provided
    if (filters !== undefined) {
      fetchSessions();
    } else {
      // Reset state when no filters
      setSessions([]);
      setLoading(false);
      setError(null);
    }
  }, [filters?.type, filters?.batch, filters?.domain, filters?.subject, filters?.term]);

  const fetchSessions = async () => {
    if (!filters) return;

    try {
      setLoading(true);
      setError(null);

      const response = await api.getSessions(filters);

      if (response.success && response.data) {
        setSessions(response.data.sessions);
      } else {
        const errorMsg = response.message || 'Failed to fetch sessions';
        setError(errorMsg);
        toast.error(errorMsg);
      }
    } catch (err: any) {
      setError(err.message);
      toast.error('Failed to fetch sessions');
    } finally {
      setLoading(false);
    }
  };

  const refetch = () => {
    fetchSessions();
  };

  return { sessions, loading, error, refetch };
}

export function useLiveSessions(batch?: string) {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLiveSessions();
    // Refetch every 30 seconds to update live status
    const interval = setInterval(fetchLiveSessions, 30000);
    return () => clearInterval(interval);
  }, [batch]);

  const fetchLiveSessions = async () => {
    try {
      const response = await api.getLiveSessions(batch);
      if (response.success && response.data) {
        setSessions(response.data.sessions);
      }
    } catch (error) {
      console.error('Error fetching live sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  return { sessions, loading, refetch: fetchLiveSessions };
}

export function useRecordings(filters?: Omit<SessionFilters, 'type'>) {
  const [recordings, setRecordings] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRecordings();
  }, [filters?.batch, filters?.domain, filters?.subject]);

  const fetchRecordings = async () => {
    try {
      setLoading(true);
      const response = await api.getRecordings(filters);

      if (response.success && response.data) {
        setRecordings(response.data.sessions);
      }
    } catch (error) {
      console.error('Error fetching recordings:', error);
    } finally {
      setLoading(false);
    }
  };

  return { recordings, loading, refetch: fetchRecordings };
}
