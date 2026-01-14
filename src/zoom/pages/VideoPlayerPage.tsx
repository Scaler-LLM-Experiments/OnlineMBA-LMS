import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  FileText, X, ChevronRight, ChevronDown, BookOpen, StickyNote, Plus, Save, Edit2,
  Bold, Italic, List, Tag, Strikethrough, Heading1, Heading2, HelpCircle, CheckSquare,
  Key, AlertCircle, ListOrdered, Indent, Outdent, Clock,
  Image as ImageIcon, Pin, Search
} from 'lucide-react';
import { useAuth } from '../../features/auth/hooks/useAuth';
import { api } from '../../services/api';
import toast from 'react-hot-toast';

interface SessionData {
  sessionId: string;
  sessionName: string;
  term?: string;
  domain?: string;
  subject?: string;
  views: string[];
}

interface NoteCard {
  noteId?: string;
  noteType: string;
  noteTitle: string;
  noteContent: string;
  images: string[];
  timestamp: string;
  isPinned?: string;
  tags?: string[];
  sessionName?: string;
  date?: string;
  startTime?: string;
  type?: string;
}

interface SessionGroup {
  sessionName: string;
  date: string;
  startTime: string;
  notes: NoteCard[];
}

// Note types with icons and colors
const NOTE_TYPES = [
  { value: 'Topic', icon: BookOpen, color: 'bg-purple-500' },
  { value: 'Question', icon: HelpCircle, color: 'bg-blue-500' },
  { value: 'Pointers', icon: FileText, color: 'bg-green-500' },
  { value: 'To Do List', icon: CheckSquare, color: 'bg-orange-500' },
  { value: 'Keywords', icon: Key, color: 'bg-yellow-500' },
  { value: 'Important', icon: AlertCircle, color: 'bg-red-500' },
];

// Predefined tags for notes
const PREDEFINED_TAGS = [
  'Important',
  'Quiz',
  'Mid-Term',
  'End-Term',
  'Revisit / Revise',
  'Exam',
  'Assignment',
  'Group Activity',
  'Practice',
  'Article',
  'Case',
  'URL(s)'
];

// Extract file ID from Google Drive URL
const extractFileId = (url: string): string | null => {
  if (!url || !url.includes('drive.google.com')) return null;

  // Format: https://drive.google.com/file/d/FILE_ID/...
  const fileMatch = url.match(/\/file\/d\/([^/]+)/);
  if (fileMatch) return fileMatch[1];

  // Format: https://drive.google.com/open?id=FILE_ID
  const openMatch = url.match(/[?&]id=([^&]+)/);
  if (openMatch) return openMatch[1];

  return null;
};

// Convert Google Drive URL to proper embed format for iframe embedding
const convertToEmbedUrl = (url: string): string => {
  if (!url) return '';

  const fileId = extractFileId(url);
  if (fileId) {
    // Use preview format for iframe embedding
    return `https://drive.google.com/file/d/${fileId}/preview`;
  }

  return url;
};

export function VideoPlayerPage() {
  const [searchParams] = useSearchParams();
  const { student } = useAuth();
  const [sessionData, setSessionData] = useState<SessionData | null>(null);
  const [videos, setVideos] = useState<{ id: string; url: string; label: string }[]>([]);
  const [selectedVideoIndex, setSelectedVideoIndex] = useState(0);
  const [files, setFiles] = useState<{ id: string; url: string; label: string; name: string }[]>([]);
  const [selectedFileIndex, setSelectedFileIndex] = useState<number | null>(null);
  const [showSplitScreen, setShowSplitScreen] = useState(false);
  const [splitPosition, setSplitPosition] = useState(50); // Percentage for split position
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Notes sidebar state
  const [showNotesSidebar, setShowNotesSidebar] = useState(false);
  const [liveSessionGroups, setLiveSessionGroups] = useState<SessionGroup[]>([]);
  const [recordingNotes, setRecordingNotes] = useState<NoteCard[]>([]);
  const [pastRecordingSessions, setPastRecordingSessions] = useState<SessionGroup[]>([]);
  const [loadingNotes, setLoadingNotes] = useState(false);
  const [expandedLiveNotes, setExpandedLiveNotes] = useState(true);
  const [expandedRecordingNotes, setExpandedRecordingNotes] = useState(true);
  const [expandedPastRecording, setExpandedPastRecording] = useState(true);
  const [expandedSessions, setExpandedSessions] = useState<{ [key: string]: boolean }>({});

  // Recording note editor state
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [noteType, setNoteType] = useState('Topic');
  const [noteTitle, setNoteTitle] = useState('');
  const [, setNoteContent] = useState('');
  const [noteImages, setNoteImages] = useState<string[]>([]);
  const [noteTags, setNoteTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [isSavingNote, setIsSavingNote] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [, setShowColorPicker] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [, setShowHighlightPicker] = useState(false);
  const [expandedImage, setExpandedImage] = useState<string | null>(null);
  const [showTagsModal, setShowTagsModal] = useState(false);
  const [tempTags, setTempTags] = useState<string[]>([]);
  const [showRecordingSearch, setShowRecordingSearch] = useState(false);
  const [recordingSearchQuery, setRecordingSearchQuery] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date());
  const editorRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Update timestamp every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  // Handle keyboard events for image lightbox
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && expandedImage) {
        setExpandedImage(null);
      }
    };

    if (expandedImage) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [expandedImage]);

  // Handle drag resize for split screen with smooth animation
  useEffect(() => {
    let animationFrameId: number;

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;

      // Cancel any pending animation frame
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }

      // Use requestAnimationFrame for smooth updates
      animationFrameId = requestAnimationFrame(() => {
        const container = document.getElementById('video-content-area');
        if (!container) return;

        const rect = container.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const percentage = (x / rect.width) * 100;

        // Limit between 20% and 80% to prevent too small panels
        const clampedPercentage = Math.min(Math.max(percentage, 20), 80);
        setSplitPosition(clampedPercentage);
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
      // Prevent pointer events on iframes during drag
      const iframes = document.querySelectorAll('iframe');
      iframes.forEach(iframe => {
        (iframe as HTMLElement).style.pointerEvents = 'none';
      });
    } else {
      // Re-enable pointer events on iframes
      const iframes = document.querySelectorAll('iframe');
      iframes.forEach(iframe => {
        (iframe as HTMLElement).style.pointerEvents = 'auto';
      });
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [isDragging]);

  useEffect(() => {
    const dataParam = searchParams.get('data');
    if (dataParam) {
      try {
        const data: SessionData = JSON.parse(decodeURIComponent(dataParam));
        setSessionData(data);

        // Create video list
        const viewLabels = ['Speaker View', 'Screen Share', 'Screen Share + Speaker', 'Gallery View'];
        const videoList = data.views.map((url, index) => ({
          id: `video-${index}`,
          url: convertToEmbedUrl(url),
          label: viewLabels[index] || `View ${index + 1}`
        }));

        // Create files list from file1-file5
        const filesList: { id: string; url: string; label: string; name: string }[] = [];
        const dataRecord = data as unknown as Record<string, string>;
        for (let i = 1; i <= 5; i++) {
          const fileUrl = dataRecord[`file${i}`];
          const fileName = dataRecord[`file${i}Name`];
          if (fileUrl && fileUrl.trim()) {
            filesList.push({
              id: `file-${i}`,
              url: convertToEmbedUrl(fileUrl),
              label: `File ${i}`,
              name: fileName || `File ${i}`
            });
          }
        }

        setVideos(videoList);
        setFiles(filesList);
        setIsLoading(false);
      } catch (error) {
        console.error('Failed to parse video player data:', error);
        setIsLoading(false);
      }
    }
  }, [searchParams]);

  // Disable right-click on video player
  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      return false;
    };

    document.addEventListener('contextmenu', handleContextMenu);
    return () => document.removeEventListener('contextmenu', handleContextMenu);
  }, []);

  // Rich text formatting
  const formatText = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
  };

  // Insert timestamp
  const insertTimestamp = () => {
    const timestamp = `[${currentTime.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    })}] `;
    document.execCommand('insertText', false, timestamp);
  };

  // Image handling
  const handleFiles = (files: File[]) => {
    files.forEach(file => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          setNoteImages(prev => [...prev, e.target?.result as string]);
        };
        reader.readAsDataURL(file);
      }
    });
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    handleFiles(files);
  };

  // Helper function to strip HTML tags for search
  const stripHtml = (html: string) => {
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
  };

  // Open tags modal for a note
  const openTagsModal = (note: NoteCard) => {
    setEditingNoteId(note.noteId || null);
    setTempTags(note.tags || []);
    setTagInput('');
    setShowTagsModal(true);
  };

  // Add predefined tag
  const addPredefinedTag = (tag: string) => {
    if (tempTags.length < 3 && !tempTags.includes(tag)) {
      setTempTags([...tempTags, tag]);
    }
  };

  // Remove a tag from modal
  const removeTagFromModal = (tagToRemove: string) => {
    setTempTags(tempTags.filter(tag => tag !== tagToRemove));
  };

  // Save tags
  const saveTags = async () => {
    if (!editingNoteId || !student?.email) return;
    if (tempTags.length === 0) {
      toast.error('Please add at least 1 tag');
      return;
    }

    // Store original tags for potential revert
    const originalTags = recordingNotes.find(n => n.noteId === editingNoteId)?.tags || [];

    // Optimistic update
    setRecordingNotes(prev => prev.map(note =>
      note.noteId === editingNoteId ? { ...note, tags: tempTags } : note
    ));

    setShowTagsModal(false);
    toast.success('Tags updated!');

    try {
      const response = await api.updateNoteTags(editingNoteId, student.email, tempTags);
      if (!response.success) {
        // Revert on error
        setRecordingNotes(prev => prev.map(note =>
          note.noteId === editingNoteId ? { ...note, tags: originalTags } : note
        ));
        toast.error(response.error || 'Failed to save tags');
      }
    } catch (error) {
      console.error('Error saving tags:', error);
      setRecordingNotes(prev => prev.map(note =>
        note.noteId === editingNoteId ? { ...note, tags: originalTags } : note
      ));
      toast.error('Failed to save tags');
    }
  };

  // Toggle pin status
  const togglePin = async (noteId: string | undefined) => {
    if (!student?.email || !noteId) return;

    // Optimistic update
    setRecordingNotes(prev => prev.map(note =>
      note.noteId === noteId
        ? { ...note, isPinned: note.isPinned === 'Yes' ? 'No' : 'Yes' }
        : note
    ));

    const isPinning = recordingNotes.find(n => n.noteId === noteId)?.isPinned !== 'Yes';
    toast.success(isPinning ? 'Note pinned!' : 'Note unpinned!', { duration: 1500 });

    try {
      const response = await api.togglePinNote(noteId, student.email);
      if (!response.success) {
        // Revert on error
        setRecordingNotes(prev => prev.map(note =>
          note.noteId === noteId
            ? { ...note, isPinned: note.isPinned === 'Yes' ? 'No' : 'Yes' }
            : note
        ));
        toast.error(response.error || 'Failed to toggle pin');
      }
    } catch (error) {
      console.error('Error toggling pin:', error);
      setRecordingNotes(prev => prev.map(note =>
        note.noteId === noteId
          ? { ...note, isPinned: note.isPinned === 'Yes' ? 'No' : 'Yes' }
          : note
      ));
      toast.error('Failed to toggle pin');
    }
  };

  // Handle line toggle for To Do List
  const handleLineToggle = async (noteId: string | undefined, clickedElement: HTMLElement) => {
    if (!noteId || !student?.email) return;

    const noteToUpdate = recordingNotes.find(n => n.noteId === noteId);
    if (!noteToUpdate || noteToUpdate.noteType !== 'To Do List') return;

    const originalContent = noteToUpdate.noteContent;
    const listItem = clickedElement.closest('li');
    if (!listItem) return;

    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = originalContent;
    const allListItems = Array.from(tempDiv.querySelectorAll('li'));
    const noteContentDiv = document.querySelector(`[data-note-id="${noteId}"]`);
    if (!noteContentDiv) return;

    const domListItems = Array.from(noteContentDiv.querySelectorAll('li'));
    const itemIndex = domListItems.indexOf(listItem);

    if (itemIndex >= 0 && itemIndex < allListItems.length) {
      const targetItem = allListItems[itemIndex] as HTMLElement;
      const currentStyle = targetItem.getAttribute('style') || '';
      const isStriked = currentStyle.includes('text-decoration: line-through') ||
                        currentStyle.includes('text-decoration:line-through');

      if (isStriked) {
        targetItem.setAttribute('style', 'color: red;');
      } else {
        targetItem.setAttribute('style', 'text-decoration: line-through; color: green;');
      }

      const updatedContent = tempDiv.innerHTML;

      // Optimistic update
      setRecordingNotes(prev => prev.map(note =>
        note.noteId === noteId ? { ...note, noteContent: updatedContent } : note
      ));

      // Save to backend
      try {
        const response = await api.updateNoteContent(noteId, student.email, updatedContent);
        if (!response.success) {
          setRecordingNotes(prev => prev.map(note =>
            note.noteId === noteId ? { ...note, noteContent: originalContent } : note
          ));
          toast.error(response.error || 'Failed to save');
        }
      } catch (error) {
        console.error('Error saving:', error);
        setRecordingNotes(prev => prev.map(note =>
          note.noteId === noteId ? { ...note, noteContent: originalContent } : note
        ));
        toast.error('Failed to save');
      }
    }
  };

  // Fetch live session notes when sidebar opens
  const fetchLiveSessionNotes = async () => {
    if (!student?.email || !sessionData) return;

    setLoadingNotes(true);
    try {
      // Fetch notes from live session with same batch/domain/subject/sessionName
      const response = await api.getSessionNotesBySubject(
        student.email,
        student.batch || '',
        sessionData.term || '',
        sessionData.domain || '',
        sessionData.subject || ''
      );

      if (response.success && response.data && Array.isArray(response.data)) {
        // Group live notes by session and separate recording notes
        const sessionGroups: SessionGroup[] = [];
        const currentRecordingNotes: NoteCard[] = [];
        const pastRecordingSessionsMap: { [key: string]: SessionGroup } = {};

        response.data.forEach((session: { sessionId: string; sessionName: string; date: string; startTime: string; notes?: NoteCard[] }) => {
          if (session.notes && Array.isArray(session.notes)) {
            const liveNotes: NoteCard[] = [];
            const sessionRecordingNotes: NoteCard[] = [];

            session.notes.forEach((note: NoteCard) => {
              if (note.type === 'Recording') {
                const recordingNote = {
                  ...note,
                  sessionName: session.sessionName,
                  date: session.date,
                  startTime: session.startTime
                };

                // Separate current session recording notes from past
                if (session.sessionId === sessionData?.sessionId) {
                  currentRecordingNotes.push(recordingNote);
                } else {
                  sessionRecordingNotes.push(recordingNote);
                }
              } else {
                // Default to Live if type is not set or is 'Live'
                liveNotes.push({
                  ...note,
                  sessionName: session.sessionName,
                  date: session.date,
                  startTime: session.startTime
                });
              }
            });

            // Only add session group if it has live notes
            if (liveNotes.length > 0) {
              // Sort notes within session by timestamp (newest first)
              liveNotes.sort((a, b) =>
                new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
              );

              sessionGroups.push({
                sessionName: session.sessionName,
                date: session.date,
                startTime: session.startTime,
                notes: liveNotes
              });
            }

            // Group past recording notes by session
            if (sessionRecordingNotes.length > 0 && session.sessionId !== sessionData?.sessionId) {
              sessionRecordingNotes.sort((a, b) =>
                new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
              );

              pastRecordingSessionsMap[session.sessionId] = {
                sessionName: session.sessionName,
                date: session.date,
                startTime: session.startTime,
                notes: sessionRecordingNotes
              };
            }
          }
        });

        // Sort session groups by date (newest first)
        sessionGroups.sort((a, b) => {
          const dateA = new Date(`${a.date} ${a.startTime}`).getTime();
          const dateB = new Date(`${b.date} ${b.startTime}`).getTime();
          return dateB - dateA;
        });

        // Convert past recording sessions to array and sort
        const pastRecordingSessionsArray = Object.values(pastRecordingSessionsMap);
        pastRecordingSessionsArray.sort((a, b) => {
          const dateA = new Date(`${a.date} ${a.startTime}`).getTime();
          const dateB = new Date(`${b.date} ${b.startTime}`).getTime();
          return dateB - dateA;
        });

        // Sort current recording notes by timestamp (newest first)
        currentRecordingNotes.sort((a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );

        setLiveSessionGroups(sessionGroups);
        setRecordingNotes(currentRecordingNotes);
        setPastRecordingSessions(pastRecordingSessionsArray);
      }
    } catch (error) {
      console.error('Error fetching live session notes:', error);
      toast.error('Failed to load live session notes');
    } finally {
      setLoadingNotes(false);
    }
  };

  // Toggle notes sidebar
  const toggleNotesSidebar = () => {
    const newState = !showNotesSidebar;
    setShowNotesSidebar(newState);

    // Fetch notes when opening
    if (newState && liveSessionGroups.length === 0) {
      fetchLiveSessionNotes();
    }
  };

  // Toggle session expansion
  const toggleSession = (sessionKey: string) => {
    setExpandedSessions(prev => ({
      ...prev,
      [sessionKey]: !prev[sessionKey]
    }));
  };

  // Calculate total note count
  const totalLiveNotes = liveSessionGroups.reduce((sum, group) => sum + group.notes.length, 0);

  // Save recording note
  const saveRecordingNote = async () => {
    if (!student?.email || !sessionData) return;

    const htmlContent = editorRef.current?.innerHTML || '';
    const contentText = editorRef.current?.innerText || '';

    if (!noteTitle.trim() && !contentText.trim()) {
      toast.error('Please add a title or content');
      return;
    }

    // Format title with note type
    const formattedTitle = noteTitle.trim()
      ? `${noteType}: ${noteTitle}`
      : noteType;

    setIsSavingNote(true);
    try {
      // Convert images to base64
      const imageData = await Promise.all(
        noteImages.map(async (url) => {
          if (url.startsWith('data:')) {
            const response = await fetch(url);
            const blob = await response.blob();
            return {
              data: url.split(',')[1],
              name: `image_${Date.now()}.png`,
              mimeType: blob.type
            };
          }
          return null;
        })
      );

      const validImages = imageData.filter(img => img !== null);

      const noteData = {
        studentId: student.email,
        studentName: student.name || '',
        batch: student.batch || '',
        term: sessionData.term || '',
        domain: sessionData.domain || '',
        subject: sessionData.subject || '',
        sessionName: sessionData.sessionName,
        date: new Date().toISOString().split('T')[0],
        startTime: new Date().toLocaleTimeString('en-US', { hour12: false }),
        sessionId: sessionData.sessionId,
        noteTitle: formattedTitle,
        noteContent: htmlContent,
        images: validImages,
        isPinned: 'No',
        tags: noteTags,
        type: 'Recording'
      };

      const response = await api.saveSessionNote(noteData);

      if (response.success && response.data) {
        toast.success('Recording note saved successfully');

        // Add note to the list
        const newNote: NoteCard = {
          noteId: response.data.noteId,
          noteType: noteType,
          noteTitle: formattedTitle,
          noteContent: htmlContent,
          images: noteImages,
          timestamp: new Date().toISOString(),
          isPinned: 'No',
          tags: noteTags
        };

        setRecordingNotes(prev => [newNote, ...prev]);

        // Reset form
        setNoteType('Topic');
        setNoteTitle('');
        setNoteContent('');
        setNoteImages([]);
        setNoteTags([]);
        setIsAddingNote(false);
        if (editorRef.current) {
          editorRef.current.innerHTML = '';
        }
      } else {
        toast.error(response.message || 'Failed to save note');
      }
    } catch (error) {
      console.error('Error saving recording note:', error);
      toast.error('Failed to save recording note');
    } finally {
      setIsSavingNote(false);
    }
  };

  // Text formatting functions
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _applyFormat = (command: string) => {
    document.execCommand(command, false);
    editorRef.current?.focus();
  };

  // Tag management
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _addTag = () => {
    const trimmedTag = tagInput.trim();
    if (trimmedTag && noteTags.length < 3 && !noteTags.includes(trimmedTag)) {
      setNoteTags([...noteTags, trimmedTag]);
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setNoteTags(noteTags.filter(tag => tag !== tagToRemove));
  };

  // Cancel adding note
  const cancelAddingNote = () => {
    setNoteType('Topic');
    setNoteTitle('');
    setNoteContent('');
    setNoteImages([]);
    setNoteTags([]);
    setTagInput('');
    setIsAddingNote(false);
    setEditingNoteId(null);
    if (editorRef.current) {
      editorRef.current.innerHTML = '';
    }
  };

  // Start editing a note
  const startEditingNote = (note: NoteCard) => {
    setEditingNoteId(note.noteId || null);

    // Extract note type from title (e.g., "Topic: My Title" -> "Topic")
    const titleParts = note.noteTitle.split(':');
    if (titleParts.length > 1) {
      const extractedType = titleParts[0].trim();
      setNoteType(extractedType);
      setNoteTitle(titleParts.slice(1).join(':').trim());
    } else {
      setNoteType(note.noteType || 'Topic');
      setNoteTitle(note.noteTitle);
    }

    setNoteContent(note.noteContent);
    setNoteImages(Array.isArray(note.images) ? note.images : []);
    setNoteTags(Array.isArray(note.tags) ? note.tags : []);
    setIsAddingNote(false);

    // Set editor content
    if (editorRef.current) {
      editorRef.current.innerHTML = note.noteContent;
    }
  };

  // Update existing note
  const updateRecordingNote = async () => {
    if (!student?.email || !editingNoteId) return;

    const htmlContent = editorRef.current?.innerHTML || '';
    const contentText = editorRef.current?.innerText || '';

    if (!noteTitle.trim() && !contentText.trim()) {
      toast.error('Please add a title or content');
      return;
    }

    // Format title with note type
    const formattedTitle = noteTitle.trim()
      ? `${noteType}: ${noteTitle}`
      : noteType;

    setIsSavingNote(true);
    try {
      const noteData = {
        noteId: editingNoteId,
        studentId: student.email,
        noteTitle: formattedTitle,
        noteContent: htmlContent,
        images: [],
        tags: noteTags
      };

      const response = await api.updateSessionNote(noteData);

      if (response.success) {
        toast.success('Note updated successfully');

        // Update note in the list
        setRecordingNotes(prev => prev.map(note =>
          note.noteId === editingNoteId
            ? { ...note, noteType: noteType, noteTitle: formattedTitle, noteContent: htmlContent, images: noteImages, tags: noteTags }
            : note
        ));

        // Reset form
        setNoteType('Topic');
        setNoteTitle('');
        setNoteContent('');
        setNoteImages([]);
        setNoteTags([]);
        setEditingNoteId(null);
        if (editorRef.current) {
          editorRef.current.innerHTML = '';
        }
      } else {
        toast.error(response.message || 'Failed to update note');
      }
    } catch (error) {
      console.error('Error updating note:', error);
      toast.error('Failed to update note');
    } finally {
      setIsSavingNote(false);
    }
  };

  // Delete a recording note
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _deleteRecordingNote = async (noteId: string) => {
    if (!student?.email) return;

    if (!window.confirm('Are you sure you want to delete this note?')) return;

    try {
      const response = await api.deleteSessionNote({
        studentId: student.email,
        noteId: noteId
      });

      if (response.success) {
        toast.success('Note deleted successfully');
        setRecordingNotes(prev => prev.filter(note => note.noteId !== noteId));
      } else {
        toast.error(response.message || 'Failed to delete note');
      }
    } catch (error) {
      console.error('Error deleting note:', error);
      toast.error('Failed to delete note');
    }
  };

  if (!sessionData || videos.length === 0) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-lg">Loading video player...</div>
      </div>
    );
  }

  const selectedVideo = videos[selectedVideoIndex];

  return (
    <div className="fixed inset-0 bg-gray-900 overflow-hidden flex flex-col">
      {/* Header */}
      <div className="z-50 bg-gray-800/90 backdrop-blur-sm border-b border-gray-700 px-6 py-4">
        <div className="flex flex-col gap-3">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-lg font-semibold text-white">{sessionData.sessionName}</h1>
              <p className="text-sm text-gray-400">
                {sessionData.term && `${sessionData.term} • `}
                {sessionData.domain && `${sessionData.domain} • `}
                {sessionData.subject}
              </p>
            </div>

            {/* Notes Button */}
            <button
              onClick={toggleNotesSidebar}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                showNotesSidebar
                  ? 'bg-primary text-white shadow-lg shadow-primary/30'
                  : 'bg-gray-700/50 text-gray-300 hover:bg-gray-700 hover:text-white'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Notes</span>
              {(totalLiveNotes > 0 || recordingNotes.length > 0) && (
                <span className="px-1.5 py-0.5 bg-white/20 rounded text-xs">
                  {totalLiveNotes + recordingNotes.length}
                </span>
              )}
            </button>
          </div>

          {/* Video & File Selector Buttons */}
          {(videos.length > 1 || files.length > 0) && (
            <div className="flex gap-2 flex-wrap">
              {/* Video Selector - Only show if multiple videos */}
              {videos.length > 1 && (
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">Video:</span>
                  {videos.map((video, index) => (
                    <button
                      key={video.id}
                      onClick={() => setSelectedVideoIndex(index)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        selectedVideoIndex === index
                          ? 'bg-primary text-white'
                          : 'bg-gray-700/50 text-gray-300 hover:bg-gray-700'
                      }`}
                    >
                      {video.label}
                    </button>
                  ))}
                </div>
              )}

              {/* File Selector Buttons */}
              {files.length > 0 && (
                <div className={`flex items-center gap-2 ${videos.length > 1 ? 'ml-4 pl-4 border-l border-gray-600' : ''}`}>
                  <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">Files:</span>
                  {files.map((file, index) => (
                    <button
                      key={file.id}
                      onClick={() => {
                        if (selectedFileIndex === index) {
                          // Toggle off split screen if clicking same file
                          setSelectedFileIndex(null);
                          setShowSplitScreen(false);
                        } else {
                          // Select new file and enable split screen
                          setSelectedFileIndex(index);
                          setShowSplitScreen(true);
                          setSplitPosition(50); // Reset to 50/50 split
                        }
                      }}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        selectedFileIndex === index
                          ? 'bg-green-600 text-white'
                          : 'bg-gray-700/50 text-gray-300 hover:bg-gray-700'
                      }`}
                      title={file.name}
                    >
                      {file.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Video/File Content Area */}
        <div
          id="video-content-area"
          className={`relative bg-black transition-all duration-300 ${
            showNotesSidebar ? 'flex-1' : 'w-full'
          }`}
        >
          {/* Loading Spinner */}
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-900/50 z-10">
              <div className="flex flex-col items-center gap-3">
                <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                <p className="text-white text-sm">Loading content...</p>
              </div>
            </div>
          )}

          {/* Split Screen View: Video + File */}
          {showSplitScreen && selectedFileIndex !== null ? (
            <div className="flex h-full">
              {/* Video iframe - Left Side */}
              {selectedVideo && (
                <div
                  className="relative bg-black"
                  style={{ width: `${splitPosition}%` }}
                >
                  <div className="absolute top-2 left-2 z-10 px-2 py-1 bg-blue-600/90 text-white text-xs font-medium rounded">
                    Video: {selectedVideo.label}
                  </div>
                  <iframe
                    sandbox="allow-forms allow-modals allow-orientation-lock allow-pointer-lock allow-presentation allow-same-origin allow-scripts allow-top-navigation allow-top-navigation-by-user-activation"
                    src={selectedVideo.url}
                    title={selectedVideo.label}
                    className="w-full h-full bg-black"
                    allow="autoplay"
                    onLoad={() => setIsLoading(false)}
                    style={{ border: 'none' }}
                  />
                </div>
              )}

              {/* Draggable Divider - Wider hit area for easier dragging */}
              <div
                className="relative w-3 bg-gray-700/50 hover:bg-green-500/30 cursor-col-resize transition-colors group flex items-center justify-center"
                onMouseDown={() => setIsDragging(true)}
                style={{ flexShrink: 0 }}
              >
                {/* Visual divider line */}
                <div className="absolute inset-y-0 left-1/2 transform -translate-x-1/2 w-0.5 bg-gray-600 group-hover:bg-green-500 transition-colors"></div>

                {/* Draggable handle */}
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-8 h-16 bg-gray-800 group-hover:bg-green-600 rounded-full flex items-center justify-center transition-all shadow-xl border-2 border-gray-600 group-hover:border-green-400 z-10">
                  <div className="flex flex-col gap-1.5">
                    <div className="w-1 h-1.5 bg-gray-400 group-hover:bg-white rounded-full transition-colors"></div>
                    <div className="w-1 h-1.5 bg-gray-400 group-hover:bg-white rounded-full transition-colors"></div>
                    <div className="w-1 h-1.5 bg-gray-400 group-hover:bg-white rounded-full transition-colors"></div>
                  </div>
                </div>
              </div>

              {/* File iframe - Right Side */}
              {files[selectedFileIndex] && (
                <div
                  className="relative bg-white"
                  style={{ width: `${100 - splitPosition}%` }}
                >
                  <div className="absolute top-2 left-2 z-10 px-2 py-1 bg-green-600/90 text-white text-xs font-medium rounded">
                    File: {files[selectedFileIndex].name}
                  </div>
                  <iframe
                    sandbox="allow-forms allow-modals allow-orientation-lock allow-pointer-lock allow-presentation allow-same-origin allow-scripts allow-top-navigation allow-top-navigation-by-user-activation"
                    src={files[selectedFileIndex].url}
                    title={files[selectedFileIndex].name}
                    className="w-full h-full bg-white"
                    allow="autoplay"
                    style={{ border: 'none' }}
                  />
                </div>
              )}
            </div>
          ) : (
            /* Single View: Video Only */
            selectedVideo && (
              <iframe
                sandbox="allow-forms allow-modals allow-orientation-lock allow-pointer-lock allow-presentation allow-same-origin allow-scripts allow-top-navigation allow-top-navigation-by-user-activation"
                src={selectedVideo.url}
                title={selectedVideo.label}
                className="w-full h-full bg-black"
                allow="autoplay"
                onLoad={() => setIsLoading(false)}
                style={{ border: 'none' }}
              />
            )
          )}
        </div>

        {/* Notes Sidebar */}
        <div className={`h-full bg-gradient-to-br from-gray-900 to-gray-800 border-l border-gray-700 transition-all duration-300 ease-in-out overflow-hidden ${
          showNotesSidebar ? 'w-96' : 'w-0'
        }`}>
          {showNotesSidebar && (
            <div className="h-full flex flex-col">
              {/* Sidebar Header */}
              <div className="flex-shrink-0 p-4 border-b border-gray-700 bg-gray-800/50 backdrop-blur-sm">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                    <FileText className="w-5 h-5 text-primary" />
                    Session Notes
                  </h2>
                  <button
                    onClick={() => setShowNotesSidebar(false)}
                    className="p-1.5 rounded-lg hover:bg-gray-700 text-gray-400 hover:text-white transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Scrollable Content */}
              <div className="flex-1 overflow-y-auto">
                {loadingNotes ? (
                  <div className="flex items-center justify-center h-32">
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-8 h-8 border-3 border-primary/30 border-t-primary rounded-full animate-spin"></div>
                      <p className="text-sm text-gray-400">Loading notes...</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4 p-4">
                    {/* Live Session Notes Section */}
                    <div className="rounded-xl bg-gradient-to-br from-blue-900/20 to-blue-800/10 border border-blue-500/30 overflow-hidden">
                      <button
                        onClick={() => setExpandedLiveNotes(!expandedLiveNotes)}
                        className="w-full p-4 flex items-center justify-between hover:bg-blue-500/10 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          {expandedLiveNotes ? (
                            <ChevronDown className="w-5 h-5 text-blue-400" />
                          ) : (
                            <ChevronRight className="w-5 h-5 text-blue-400" />
                          )}
                          <BookOpen className="w-5 h-5 text-blue-400" />
                          <span className="font-semibold text-white">Live Session Notes</span>
                        </div>
                        <span className="px-2 py-0.5 bg-blue-500/20 text-blue-300 text-xs font-medium rounded">
                          {totalLiveNotes} notes
                        </span>
                      </button>

                      {expandedLiveNotes && (
                        <div className="p-4 space-y-4 max-h-96 overflow-y-auto">
                          {liveSessionGroups.length === 0 ? (
                            <div className="text-center py-8">
                              <BookOpen className="w-12 h-12 mx-auto mb-3 text-gray-600" />
                              <p className="text-sm text-gray-400">No live session notes found</p>
                              <p className="text-xs text-gray-500 mt-1">Notes from the live session will appear here</p>
                            </div>
                          ) : (
                            liveSessionGroups.map((sessionGroup, _groupIndex) => {
                              const sessionKey = `${sessionGroup.sessionName}-${sessionGroup.date}`;
                              const isExpanded = expandedSessions[sessionKey] !== false; // Default to true

                              return (
                                <div key={sessionKey} className="border border-blue-500/20 rounded-lg overflow-hidden">
                                  {/* Session Header */}
                                  <button
                                    onClick={() => toggleSession(sessionKey)}
                                    className="w-full p-3 bg-blue-500/10 hover:bg-blue-500/20 transition-colors flex items-center justify-between"
                                  >
                                    <div className="flex items-center gap-2">
                                      {isExpanded ? (
                                        <ChevronDown className="w-4 h-4 text-blue-400" />
                                      ) : (
                                        <ChevronRight className="w-4 h-4 text-blue-400" />
                                      )}
                                      <div className="text-left">
                                        <h5 className="text-sm font-semibold text-white">{sessionGroup.sessionName}</h5>
                                        <p className="text-xs text-gray-400">
                                          {new Date(sessionGroup.date).toLocaleDateString()} • {sessionGroup.startTime}
                                        </p>
                                      </div>
                                    </div>
                                    <span className="px-2 py-0.5 bg-blue-500/30 text-blue-200 text-xs font-medium rounded">
                                      {sessionGroup.notes.length} {sessionGroup.notes.length === 1 ? 'note' : 'notes'}
                                    </span>
                                  </button>

                                  {/* Session Notes */}
                                  {isExpanded && (
                                    <div className="p-3 space-y-2">
                                      {sessionGroup.notes.map((note, noteIndex) => (
                                        <div
                                          key={note.noteId || noteIndex}
                                          className="p-3 rounded-lg bg-gray-800/50 border border-gray-700 hover:border-blue-500/50 transition-colors"
                                        >
                                          <div className="flex items-start justify-between mb-2">
                                            <h4 className="font-medium text-white text-sm">{note.noteTitle}</h4>
                                            <span className="text-xs text-gray-500">
                                              {new Date(note.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                          </div>
                                          <div
                                            className="text-sm text-gray-300 prose prose-sm dark:prose-invert max-w-none"
                                            dangerouslySetInnerHTML={{ __html: note.noteContent }}
                                          />
                                          {note.tags && Array.isArray(note.tags) && note.tags.length > 0 && (
                                            <div className="flex flex-wrap gap-1 mt-2">
                                              {note.tags.map((tag, idx) => (
                                                <span
                                                  key={idx}
                                                  className="px-2 py-0.5 bg-blue-500/20 text-blue-300 rounded text-xs"
                                                >
                                                  {tag}
                                                </span>
                                              ))}
                                            </div>
                                          )}
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              );
                            })
                          )}
                        </div>
                      )}
                    </div>

                    {/* Recording Notes Section */}
                    <div className="rounded-xl bg-gradient-to-br from-green-900/20 to-green-800/10 border border-green-500/30 overflow-hidden">
                      {/* Header with Pin Counter and Search */}
                      <div className="bg-green-500/10 border-b border-green-500/30">
                        <div className="p-4 flex items-center justify-between">
                          <button
                            onClick={() => setExpandedRecordingNotes(!expandedRecordingNotes)}
                            className="flex items-center gap-2 flex-1"
                          >
                            {expandedRecordingNotes ? (
                              <ChevronDown className="w-5 h-5 text-green-400" />
                            ) : (
                              <ChevronRight className="w-5 h-5 text-green-400" />
                            )}
                            <StickyNote className="w-5 h-5 text-green-400" />
                            <span className="font-semibold text-white">My Recording Notes</span>
                            <span className="px-2 py-0.5 bg-green-500/20 text-green-300 text-xs font-medium rounded">
                              {recordingNotes.length} notes
                            </span>
                          </button>
                          <button
                            onClick={() => setShowRecordingSearch(!showRecordingSearch)}
                            className="p-2 hover:bg-green-500/20 rounded transition-colors text-green-400"
                            title="Search notes"
                          >
                            <Search className="w-4 h-4" />
                          </button>
                        </div>

                        {/* Pin Counter */}
                        {(() => {
                          const pinnedCount = recordingNotes.filter(n => n.isPinned === 'Yes').length;
                          return pinnedCount > 0 && (
                            <div className="px-4 pb-3">
                              <div className="flex items-center gap-2 text-xs text-green-300">
                                <Pin className="w-3 h-3" />
                                <span>Pinned: <span className="font-semibold">{pinnedCount}</span>/10</span>
                              </div>
                            </div>
                          );
                        })()}

                        {/* Search Bar */}
                        {showRecordingSearch && (
                          <div className="px-4 pb-3">
                            <div className="relative">
                              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                              <input
                                type="text"
                                placeholder="Search notes..."
                                value={recordingSearchQuery}
                                onChange={(e) => setRecordingSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 bg-gray-900/50 border border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 text-white placeholder-gray-400"
                              />
                              {recordingSearchQuery && (
                                <button
                                  onClick={() => setRecordingSearchQuery('')}
                                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </div>
                        )}
                      </div>

                      {expandedRecordingNotes && (
                        <div className="p-4 space-y-3">
                          {/* Add Note Button */}
                          {!isAddingNote && !editingNoteId && (
                            <button
                              onClick={() => setIsAddingNote(true)}
                              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-green-500/20 hover:bg-green-500/30 border border-green-500/40 text-green-300 hover:text-green-200 transition-colors font-medium"
                            >
                              <Plus className="w-4 h-4" />
                              <span>Add Recording Note</span>
                            </button>
                          )}

                          {/* Note Editor (Add or Edit) */}
                          {(isAddingNote || editingNoteId) && (
                            <div className="p-4 rounded-lg bg-gray-800/90 backdrop-blur-sm border border-green-500/40 space-y-3">
                              <div className="flex items-center justify-between mb-2">
                                <h4 className="text-sm font-semibold text-white">
                                  {editingNoteId ? 'Edit Note' : 'New Recording Note'}
                                </h4>
                                <span className="text-xs text-gray-400">
                                  {currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}
                                </span>
                              </div>

                              {/* Note Type Selector */}
                              <div className="flex gap-2 flex-wrap">
                                {NOTE_TYPES.map((type) => {
                                  const Icon = type.icon;
                                  const isSelected = noteType === type.value;
                                  return (
                                    <button
                                      key={type.value}
                                      type="button"
                                      onClick={() => setNoteType(type.value)}
                                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                                        isSelected
                                          ? `${type.color} text-white shadow-lg`
                                          : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                      }`}
                                    >
                                      <Icon className="w-3.5 h-3.5" />
                                      {type.value}
                                    </button>
                                  );
                                })}
                              </div>

                              {/* Title Input */}
                              <input
                                type="text"
                                placeholder={`${noteType} title (optional)...`}
                                value={noteTitle}
                                onChange={(e) => setNoteTitle(e.target.value)}
                                className="w-full px-3 py-2 bg-gray-900/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-green-500 text-sm"
                              />

                              {/* Rich Text Formatting Toolbar */}
                              <div className="flex items-center gap-1 p-2 bg-gray-900/50 border border-gray-600 rounded-lg flex-wrap">
                                {/* Basic Formatting */}
                                <button type="button" onClick={() => formatText('bold')} className="p-1.5 rounded hover:bg-gray-700 text-gray-400 hover:text-white transition-colors" title="Bold"><Bold className="w-3.5 h-3.5" /></button>
                                <button type="button" onClick={() => formatText('italic')} className="p-1.5 rounded hover:bg-gray-700 text-gray-400 hover:text-white transition-colors" title="Italic"><Italic className="w-3.5 h-3.5" /></button>
                                <button type="button" onClick={() => formatText('strikeThrough')} className="p-1.5 rounded hover:bg-gray-700 text-gray-400 hover:text-white transition-colors" title="Strikethrough"><Strikethrough className="w-3.5 h-3.5" /></button>

                                <div className="w-px h-4 bg-gray-600 mx-1" />

                                {/* Headings */}
                                <button type="button" onClick={() => formatText('formatBlock', 'h1')} className="p-1.5 rounded hover:bg-gray-700 text-gray-400 hover:text-white transition-colors" title="Heading 1"><Heading1 className="w-3.5 h-3.5" /></button>
                                <button type="button" onClick={() => formatText('formatBlock', 'h2')} className="p-1.5 rounded hover:bg-gray-700 text-gray-400 hover:text-white transition-colors" title="Heading 2"><Heading2 className="w-3.5 h-3.5" /></button>

                                <div className="w-px h-4 bg-gray-600 mx-1" />

                                {/* Lists */}
                                <button type="button" onClick={() => formatText('insertUnorderedList')} className="p-1.5 rounded hover:bg-gray-700 text-gray-400 hover:text-white transition-colors" title="Bullet List"><List className="w-3.5 h-3.5" /></button>
                                <button type="button" onClick={() => formatText('insertOrderedList')} className="p-1.5 rounded hover:bg-gray-700 text-gray-400 hover:text-white transition-colors" title="Numbered List"><ListOrdered className="w-3.5 h-3.5" /></button>
                                <button type="button" onClick={() => formatText('indent')} className="p-1.5 rounded hover:bg-gray-700 text-gray-400 hover:text-white transition-colors" title="Increase Indent"><Indent className="w-3.5 h-3.5" /></button>
                                <button type="button" onClick={() => formatText('outdent')} className="p-1.5 rounded hover:bg-gray-700 text-gray-400 hover:text-white transition-colors" title="Decrease Indent"><Outdent className="w-3.5 h-3.5" /></button>

                                <div className="w-px h-4 bg-gray-600 mx-1" />

                                {/* Timestamp & Image */}
                                <button type="button" onClick={insertTimestamp} className="p-1.5 rounded hover:bg-gray-700 text-gray-400 hover:text-white transition-colors" title="Insert Timestamp"><Clock className="w-3.5 h-3.5" /></button>
                                <button type="button" onClick={() => fileInputRef.current?.click()} className="p-1.5 rounded hover:bg-gray-700 text-gray-400 hover:text-white transition-colors" title="Upload Image"><ImageIcon className="w-3.5 h-3.5" /></button>
                                <input
                                  ref={fileInputRef}
                                  type="file"
                                  accept="image/*"
                                  multiple
                                  className="hidden"
                                  onChange={(e) => handleFiles(Array.from(e.target.files || []))}
                                />
                              </div>

                              {/* Content Editor */}
                              <div
                                ref={editorRef}
                                contentEditable
                                onDrop={handleDrop}
                                onDragOver={(e) => e.preventDefault()}
                                className="w-full min-h-[200px] max-h-[300px] overflow-y-auto px-3 py-2 bg-gray-900/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-green-500 text-sm"
                                style={{ whiteSpace: 'pre-wrap' }}
                                suppressContentEditableWarning
                                data-placeholder={`Write your ${noteType.toLowerCase()} note here...`}
                              />

                              {/* Image Previews */}
                              {noteImages.length > 0 && (
                                <div className="flex flex-wrap gap-2">
                                  {noteImages.map((img, idx) => (
                                    <div key={idx} className="relative group">
                                      <img
                                        src={img}
                                        alt={`Upload ${idx + 1}`}
                                        className="w-20 h-20 object-cover rounded border border-gray-600"
                                      />
                                      <button
                                        type="button"
                                        onClick={() => setNoteImages(noteImages.filter((_, i) => i !== idx))}
                                        className="absolute -top-2 -right-2 p-1 bg-red-500 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity"
                                      >
                                        <X className="w-3 h-3" />
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              )}

                              {/* Tags (inline for quick add) */}
                              <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                  <Tag className="w-4 h-4 text-gray-400" />
                                  <span className="text-xs text-gray-400">Tags (min 1, max 3)</span>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                  {noteTags.map((tag, index) => (
                                    <span key={index} className="inline-flex items-center gap-1 px-2 py-1 bg-green-500/20 text-green-300 rounded text-xs">
                                      {tag}
                                      <button type="button" onClick={() => removeTag(tag)} className="hover:text-green-100"><X className="w-3 h-3" /></button>
                                    </span>
                                  ))}
                                </div>
                                {noteTags.length < 3 && (
                                  <div className="flex gap-2">
                                    <select
                                      value=""
                                      onChange={(e) => {
                                        if (e.target.value) {
                                          setTagInput(e.target.value);
                                          if (noteTags.length < 3 && !noteTags.includes(e.target.value)) {
                                            setNoteTags([...noteTags, e.target.value]);
                                          }
                                          e.target.value = '';
                                        }
                                      }}
                                      className="flex-1 px-3 py-1.5 bg-gray-900/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-green-500 text-xs"
                                    >
                                      <option value="">Select a tag...</option>
                                      {PREDEFINED_TAGS.filter(tag => !noteTags.includes(tag)).map((tag) => (
                                        <option key={tag} value={tag}>{tag}</option>
                                      ))}
                                    </select>
                                  </div>
                                )}
                              </div>

                              {/* Action Buttons */}
                              <div className="flex gap-2 pt-2">
                                <button
                                  onClick={editingNoteId ? updateRecordingNote : saveRecordingNote}
                                  disabled={isSavingNote}
                                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                                >
                                  {isSavingNote ? (
                                    <>
                                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                      <span>{editingNoteId ? 'Updating...' : 'Saving...'}</span>
                                    </>
                                  ) : (
                                    <>
                                      <Save className="w-4 h-4" />
                                      <span>{editingNoteId ? 'Update Note' : 'Save Note'}</span>
                                    </>
                                  )}
                                </button>
                                <button
                                  onClick={cancelAddingNote}
                                  disabled={isSavingNote}
                                  className="px-4 py-2.5 rounded-lg bg-gray-700 hover:bg-gray-600 text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          )}

                          {/* Recording Notes List */}
                          <div className="max-h-96 overflow-y-auto space-y-3">
                            {(() => {
                              // Filter notes based on search
                              const filteredNotes = recordingSearchQuery
                                ? recordingNotes.filter(note => {
                                    const searchLower = recordingSearchQuery.toLowerCase();
                                    return (
                                      note.noteTitle.toLowerCase().includes(searchLower) ||
                                      stripHtml(note.noteContent).toLowerCase().includes(searchLower) ||
                                      (note.tags && note.tags.some(tag => tag.toLowerCase().includes(searchLower)))
                                    );
                                  })
                                : recordingNotes;

                              // Sort: Pinned first, then by timestamp
                              const sortedNotes = [...filteredNotes].sort((a, b) => {
                                if (a.isPinned === 'Yes' && b.isPinned !== 'Yes') return -1;
                                if (a.isPinned !== 'Yes' && b.isPinned === 'Yes') return 1;
                                return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
                              });

                              if (sortedNotes.length === 0 && !isAddingNote && !editingNoteId) {
                                return (
                                  <div className="text-center py-8">
                                    <StickyNote className="w-12 h-12 mx-auto mb-3 text-gray-600" />
                                    <p className="text-sm text-gray-400">
                                      {recordingSearchQuery ? 'No notes found' : 'No recording notes yet'}
                                    </p>
                                    <p className="text-xs text-gray-500 mt-1">
                                      {recordingSearchQuery ? 'Try a different search term' : 'Add notes while watching the recording'}
                                    </p>
                                  </div>
                                );
                              }

                              return sortedNotes.map((note, index) => {
                                const noteTypeObj = NOTE_TYPES.find(t => t.value === note.noteType) || NOTE_TYPES[0];
                                const TypeIcon = noteTypeObj.icon;
                                const isPinned = note.isPinned === 'Yes';

                                return (
                                  <div
                                    key={note.noteId || index}
                                    onClick={() => openTagsModal(note)}
                                    className={`p-3 rounded-lg bg-gray-800/60 backdrop-blur-sm border ${
                                      isPinned ? 'border-blue-500/60 shadow-lg shadow-blue-500/20' : 'border-gray-700'
                                    } hover:border-green-500/50 transition-all cursor-pointer group`}
                                  >
                                    {/* Header */}
                                    <div className="flex items-start justify-between mb-2">
                                      <div className="flex items-center gap-2 flex-1">
                                        {/* Type Badge */}
                                        <span className={`flex items-center gap-1 px-2 py-0.5 ${noteTypeObj.color} rounded text-xs font-medium text-white`}>
                                          <TypeIcon className="w-3 h-3" />
                                          {note.noteType}
                                        </span>
                                        <h4 className="font-medium text-white text-sm">{note.noteTitle}</h4>
                                      </div>

                                      {/* Action Buttons */}
                                      <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                                        <span className="text-xs text-gray-500">
                                          {new Date(note.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}
                                        </span>
                                        <button
                                          onClick={() => togglePin(note.noteId)}
                                          className={`p-1 rounded transition-colors ${
                                            isPinned
                                              ? 'bg-blue-500/20 text-blue-400 hover:text-blue-300'
                                              : 'text-gray-500 hover:bg-gray-700 hover:text-blue-400'
                                          }`}
                                          title={isPinned ? 'Unpin note' : 'Pin note'}
                                        >
                                          <Pin className="w-3.5 h-3.5" />
                                        </button>
                                        <button
                                          onClick={() => startEditingNote(note)}
                                          className="p-1 rounded hover:bg-green-500/20 text-green-400 hover:text-green-300 transition-colors opacity-0 group-hover:opacity-100"
                                          title="Edit note"
                                        >
                                          <Edit2 className="w-3.5 h-3.5" />
                                        </button>
                                      </div>
                                    </div>

                                    {/* Session Info */}
                                    {note.sessionName && (
                                      <div className="mb-2 px-1">
                                        <div className="text-xs text-gray-400">
                                          <span className="font-medium text-green-400">
                                            {decodeURIComponent(note.sessionName.replace(/\+/g, ' '))}
                                          </span>
                                          {note.date && (
                                            <span className="text-gray-500">
                                              {' • '}
                                              {(() => {
                                                try {
                                                  const dateObj = new Date(note.date);
                                                  if (isNaN(dateObj.getTime())) return note.date;
                                                  return dateObj.toLocaleDateString('en-US', {
                                                    month: 'short',
                                                    day: 'numeric',
                                                    year: 'numeric'
                                                  });
                                                } catch {
                                                  return note.date;
                                                }
                                              })()}
                                            </span>
                                          )}
                                          {note.startTime && (
                                            <span className="text-gray-500">
                                              {' • '}
                                              {(() => {
                                                try {
                                                  const timeObj = new Date(note.startTime);
                                                  if (isNaN(timeObj.getTime()) || timeObj.getFullYear() < 1900) {
                                                    // Try parsing as time string
                                                    return note.startTime.split('T')[1]?.substring(0, 5) || note.startTime;
                                                  }
                                                  return timeObj.toLocaleTimeString('en-US', {
                                                    hour: '2-digit',
                                                    minute: '2-digit',
                                                    hour12: false
                                                  });
                                                } catch {
                                                  return note.startTime;
                                                }
                                              })()}
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                    )}

                                    {/* Content */}
                                    <div
                                      data-note-id={note.noteId}
                                      className="text-sm text-gray-300 prose prose-sm dark:prose-invert max-w-none [&_ol]:list-decimal [&_ul]:list-disc [&_li]:ml-4"
                                      dangerouslySetInnerHTML={{ __html: note.noteContent }}
                                      onClick={(e) => {
                                        if (note.noteType === 'To Do List') {
                                          const target = e.target as HTMLElement;
                                          if (target.tagName === 'LI') {
                                            e.stopPropagation();
                                            handleLineToggle(note.noteId, target);
                                          }
                                        }
                                      }}
                                    />

                                    {/* Images */}
                                    {note.images && note.images.length > 0 && (
                                      <div className="flex flex-wrap gap-2 mt-2" onClick={(e) => e.stopPropagation()}>
                                        {note.images.map((img: string | { url?: string }, idx) => (
                                          <img
                                            key={idx}
                                            src={typeof img === 'string' ? img : (img?.url || String(img))}
                                            alt={`Note image ${idx + 1}`}
                                            className="w-20 h-20 object-cover rounded border border-gray-600 cursor-pointer hover:border-green-500 transition-colors"
                                            onClick={() => setExpandedImage(typeof img === 'string' ? img : (img?.url || String(img)))}
                                          />
                                        ))}
                                      </div>
                                    )}

                                    {/* Tags */}
                                    {note.tags && Array.isArray(note.tags) && note.tags.length > 0 && (
                                      <div className="flex flex-wrap gap-1 mt-2">
                                        {note.tags.map((tag, idx) => (
                                          <span
                                            key={idx}
                                            className="px-2 py-0.5 bg-green-500/20 text-green-300 rounded text-xs border border-green-500/30"
                                          >
                                            {tag}
                                          </span>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                );
                              });
                            })()}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Past Recording Notes Section */}
                    {pastRecordingSessions.length > 0 && (
                      <div className="mt-4 rounded-xl bg-gradient-to-br from-purple-900/20 to-purple-800/10 border border-purple-500/30 overflow-hidden">
                        <button
                          onClick={() => setExpandedPastRecording(!expandedPastRecording)}
                          className="w-full p-4 flex items-center justify-between hover:bg-purple-500/10 transition-colors"
                        >
                          <div className="flex items-center gap-2">
                            {expandedPastRecording ? (
                              <ChevronDown className="w-5 h-5 text-purple-400" />
                            ) : (
                              <ChevronRight className="w-5 h-5 text-purple-400" />
                            )}
                            <BookOpen className="w-5 h-5 text-purple-400" />
                            <span className="font-semibold text-white">Past Recording Notes</span>
                          </div>
                          <span className="px-2 py-0.5 bg-purple-500/20 text-purple-300 text-xs font-medium rounded">
                            {pastRecordingSessions.reduce((sum, session) => sum + session.notes.length, 0)} notes
                          </span>
                        </button>

                        {expandedPastRecording && (
                          <div className="p-4 space-y-3 max-h-96 overflow-y-auto">
                            {pastRecordingSessions.map((session, _sessionIndex) => {
                              const sessionKey = `past-${session.sessionName}-${session.date}`;
                              const isExpanded = expandedSessions[sessionKey] !== false;

                              return (
                                <div key={sessionKey} className="rounded-lg bg-gray-800/40 border border-gray-700">
                                  <button
                                    onClick={() => toggleSession(sessionKey)}
                                    className="w-full p-3 flex items-center justify-between hover:bg-gray-700/50 transition-colors"
                                  >
                                    <div className="flex items-center gap-2">
                                      {isExpanded ? (
                                        <ChevronDown className="w-4 h-4 text-purple-400" />
                                      ) : (
                                        <ChevronRight className="w-4 h-4 text-purple-400" />
                                      )}
                                      <div className="text-left">
                                        <div className="font-medium text-white text-sm">{session.sessionName}</div>
                                        <div className="text-xs text-gray-400">{session.date} • {session.startTime}</div>
                                      </div>
                                    </div>
                                    <span className="px-2 py-0.5 bg-purple-500/20 text-purple-300 text-xs font-medium rounded">
                                      {session.notes.length} {session.notes.length === 1 ? 'note' : 'notes'}
                                    </span>
                                  </button>

                                  {isExpanded && (
                                    <div className="p-3 space-y-2 border-t border-gray-700">
                                      {session.notes.map((note, noteIndex) => {
                                        const noteTypeObj = NOTE_TYPES.find(t => t.value === note.noteType) || NOTE_TYPES[0];
                                        const TypeIcon = noteTypeObj.icon;

                                        return (
                                          <div
                                            key={note.noteId || noteIndex}
                                            onClick={() => openTagsModal(note)}
                                            className="p-3 rounded-lg bg-gray-800/60 border border-gray-700 hover:border-purple-500/50 transition-colors cursor-pointer"
                                          >
                                            <div className="flex items-start justify-between mb-2">
                                              <div className="flex items-center gap-2 flex-1">
                                                <span className={`flex items-center gap-1 px-2 py-0.5 ${noteTypeObj.color} rounded text-xs font-medium text-white`}>
                                                  <TypeIcon className="w-3 h-3" />
                                                  {note.noteType}
                                                </span>
                                                <h4 className="font-medium text-white text-sm">{note.noteTitle}</h4>
                                              </div>
                                              <span className="text-xs text-gray-500">
                                                {new Date(note.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}
                                              </span>
                                            </div>
                                            <div
                                              data-note-id={note.noteId}
                                              className="text-sm text-gray-300 prose prose-sm dark:prose-invert max-w-none [&_ol]:list-decimal [&_ul]:list-disc [&_li]:ml-4"
                                              dangerouslySetInnerHTML={{ __html: note.noteContent }}
                                              onClick={(e) => {
                                                if (note.noteType === 'To Do List') {
                                                  const target = e.target as HTMLElement;
                                                  if (target.tagName === 'LI') {
                                                    e.stopPropagation();
                                                    handleLineToggle(note.noteId, target);
                                                  }
                                                }
                                              }}
                                            />
                                            {note.images && note.images.length > 0 && (
                                              <div className="flex flex-wrap gap-2 mt-2" onClick={(e) => e.stopPropagation()}>
                                                {note.images.map((img: string | { url?: string }, idx) => (
                                                  <img
                                                    key={idx}
                                                    src={typeof img === 'string' ? img : (img?.url || String(img))}
                                                    alt={`Note image ${idx + 1}`}
                                                    className="w-20 h-20 object-cover rounded border border-gray-600 cursor-pointer hover:border-purple-500 transition-colors"
                                                    onClick={() => setExpandedImage(typeof img === 'string' ? img : (img?.url || String(img)))}
                                                  />
                                                ))}
                                              </div>
                                            )}
                                            {note.tags && Array.isArray(note.tags) && note.tags.length > 0 && (
                                              <div className="flex flex-wrap gap-1 mt-2">
                                                {note.tags.map((tag, idx) => (
                                                  <span key={idx} className="px-2 py-0.5 bg-purple-500/20 text-purple-300 rounded text-xs border border-purple-500/30">
                                                    {tag}
                                                  </span>
                                                ))}
                                              </div>
                                            )}
                                          </div>
                                        );
                                      })}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Tags Modal */}
          {showTagsModal && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50" onClick={() => setShowTagsModal(false)}>
              <div className="bg-gray-800 rounded-xl border border-green-500/30 p-6 max-w-md w-full mx-4 shadow-2xl" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                    <Tag className="w-5 h-5 text-green-400" />
                    Manage Tags
                  </h3>
                  <button onClick={() => setShowTagsModal(false)} className="p-1 hover:bg-gray-700 rounded transition-colors text-gray-400 hover:text-white">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-400 mb-3">Select tags (min 1, max 3):</p>
                    <div className="grid grid-cols-2 gap-2">
                      {PREDEFINED_TAGS.map((tag) => {
                        const isSelected = tempTags.includes(tag);
                        return (
                          <button
                            key={tag}
                            onClick={() => isSelected ? removeTagFromModal(tag) : addPredefinedTag(tag)}
                            disabled={!isSelected && tempTags.length >= 3}
                            className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                              isSelected
                                ? 'bg-green-500 text-white'
                                : 'bg-gray-700 text-gray-300 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed'
                            }`}
                          >
                            {tag}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-4 border-t border-gray-700">
                    <div className="flex flex-wrap gap-2 flex-1">
                      {tempTags.map((tag, idx) => (
                        <span key={idx} className="inline-flex items-center gap-1 px-2 py-1 bg-green-500/20 text-green-300 rounded text-sm">
                          {tag}
                          <button onClick={() => removeTagFromModal(tag)} className="hover:text-green-100">
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={saveTags}
                      disabled={tempTags.length === 0}
                      className="flex-1 px-4 py-2 rounded-lg bg-green-500 hover:bg-green-600 text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Save Tags
                    </button>
                    <button
                      onClick={() => setShowTagsModal(false)}
                      className="px-4 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-white font-medium transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Image Lightbox */}
          {expandedImage && (
            <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50" onClick={() => setExpandedImage(null)}>
              <button onClick={() => setExpandedImage(null)} className="absolute top-4 right-4 p-2 hover:bg-white/10 rounded-lg transition-colors text-white">
                <X className="w-6 h-6" />
              </button>
              <img
                src={expandedImage}
                alt="Expanded view"
                className="max-w-[90vw] max-h-[90vh] object-contain rounded-lg shadow-2xl"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default VideoPlayerPage;
