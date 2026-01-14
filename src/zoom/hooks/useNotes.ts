import { useState, useEffect, useCallback } from 'react';
import { Note, NoteInput } from '../../types';
import { api } from '../services/api';
import { useAuth } from '../../features/auth/hooks/useAuth';
import toast from 'react-hot-toast';
import { debounce } from '../../utils/helpers';

export function useNotes(sessionId?: string) {
  const { user } = useAuth();
  const [notes, setNotes] = useState<Note[]>([]);
  const [currentNote, setCurrentNote] = useState<Note | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user?.email) {
      fetchNotes();
    }
  }, [user, sessionId]);

  const fetchNotes = async () => {
    if (!user?.email) return;

    try {
      setLoading(true);

      if (sessionId) {
        const response = await api.getNote(user.email, sessionId);
        if (response.success && response.data) {
          setCurrentNote(response.data.note);
        }
      } else {
        const response = await api.getNotes(user.email);
        if (response.success && response.data) {
          // Backend returns array directly in data, not data.notes
          setNotes(Array.isArray(response.data) ? response.data : (response.data.notes || []));
        }
      }
    } catch (error) {
      console.error('Error fetching notes:', error);
      setNotes([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  const saveNote = async (noteData: NoteInput, skipRefetch = false) => {
    if (!user?.email) return;

    try {
      setSaving(true);

      console.log('🔧 useNotes.saveNote called with:', noteData);

      const response = await api.saveNote({
        ...noteData,
        studentId: user.email,
      });

      console.log('🔧 API response:', response);

      if (response.success && response.data) {
        if (!skipRefetch) {
          toast.success('Note saved successfully');
          await fetchNotes();
        }
        return response.data;
      } else {
        console.error('❌ Save failed:', response.error || 'Unknown error');
        toast.error(response.error || 'Failed to save note');
        return null;
      }
    } catch (error: any) {
      console.error('❌ Save exception:', error);
      toast.error('Failed to save note');
      throw error;
    } finally {
      setSaving(false);
    }
  };

  const updateNoteContent = (noteId: string, content: string) => {
    setNotes(prevNotes =>
      prevNotes.map(note =>
        note.noteId === noteId ? { ...note, noteContent: content } : note
      )
    );
  };

  // Auto-save with debounce
  const autoSave = useCallback(
    debounce((noteData: NoteInput) => {
      saveNote(noteData);
    }, 2000),
    [user]
  );

  const deleteNote = async (noteId: string) => {
    if (!user?.email) return;

    try {
      const response = await api.deleteNote(noteId, user.email);

      if (response.success) {
        toast.success('Note deleted');
        await fetchNotes();
      }
    } catch (error) {
      toast.error('Failed to delete note');
    }
  };

  const togglePin = async (noteId: string) => {
    if (!user?.email) return;

    // Optimistically update the UI immediately
    setNotes(prevNotes =>
      prevNotes.map(note =>
        note.noteId === noteId
          ? { ...note, isPinned: note.isPinned === 'Yes' || note.isPinned === true ? 'No' : 'Yes' }
          : note
      )
    );

    try {
      const response = await api.togglePinNote(noteId, user.email);

      if (!response.success) {
        // Rollback on error
        setNotes(prevNotes =>
          prevNotes.map(note =>
            note.noteId === noteId
              ? { ...note, isPinned: note.isPinned === 'Yes' || note.isPinned === true ? 'No' : 'Yes' }
              : note
          )
        );
        toast.error('Failed to update note');
      }
    } catch (error) {
      // Rollback on error
      setNotes(prevNotes =>
        prevNotes.map(note =>
          note.noteId === noteId
            ? { ...note, isPinned: note.isPinned === 'Yes' || note.isPinned === true ? 'No' : 'Yes' }
            : note
        )
      );
      toast.error('Failed to update note');
    }
  };

  return {
    notes,
    currentNote,
    loading,
    saving,
    saveNote,
    autoSave,
    deleteNote,
    togglePin,
    refetch: fetchNotes,
    updateNoteContent,
  };
}

export function useNotesHierarchy() {
  const { user } = useAuth();
  const [hierarchy, setHierarchy] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.email) {
      fetchHierarchy();
    }
  }, [user]);

  const fetchHierarchy = async () => {
    if (!user?.email) return;

    try {
      setLoading(true);
      const response = await api.getNotesHierarchy(user.email);

      if (response.success && response.data) {
        setHierarchy(response.data.hierarchy);
      }
    } catch (error) {
      console.error('Error fetching notes hierarchy:', error);
    } finally {
      setLoading(false);
    }
  };

  return { hierarchy, loading, refetch: fetchHierarchy };
}

export function useNoteSearch() {
  const { user } = useAuth();
  const [results, setResults] = useState<Note[]>([]);
  const [loading, setLoading] = useState(false);

  const search = useCallback(
    debounce(async (query: string) => {
      if (!user?.email || !query.trim()) {
        setResults([]);
        return;
      }

      setLoading(true);
      try {
        const response = await api.searchNotes(user.email, query);

        if (response.success && response.data) {
          setResults(response.data.notes);
        }
      } catch (error) {
        console.error('Error searching notes:', error);
      } finally {
        setLoading(false);
      }
    }, 300),
    [user]
  );

  return { results, loading, search };
}
