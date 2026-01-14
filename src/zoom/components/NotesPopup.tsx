import React, { useState, useEffect, useRef } from 'react';
import {
  Save, X, GripVertical, Image as ImageIcon, Clock,
  Bold, Italic, Strikethrough,
  List, Heading1, Heading2, HelpCircle, FileText,
  CheckSquare, Key, AlertCircle, BookOpen, Pin, Search,
  Palette, Highlighter, ListOrdered, Indent, Outdent
} from 'lucide-react';
import { auth } from '../../firebase/config';
import { api } from '../../services/api';
import toast from 'react-hot-toast';

interface SessionInfo {
  sessionId: string;
  sessionName: string;
  batch: string;
  term?: string;
  domain?: string;
  subject?: string;
  date?: string;
  startTime?: string;
}

interface Student {
  email: string;
  name: string;
  studentId: string;
  batch: string;
}

interface NoteCard {
  noteId?: string;
  noteType: string;  // Question, Pointers, To Do List, Keywords, Important, Topic
  noteTitle: string;
  noteContent: string;
  images: string[];
  timestamp: string;
  isPinned?: string;  // 'Yes' or 'No'
  tags?: string[];  // Array of tags (min 1, max 3)
}

const NOTE_TYPES = [
  { value: 'Topic', icon: BookOpen, color: 'bg-purple-500' },
  { value: 'Question', icon: HelpCircle, color: 'bg-blue-500' },
  { value: 'Pointers', icon: FileText, color: 'bg-green-500' },
  { value: 'To Do List', icon: CheckSquare, color: 'bg-orange-500' },
  { value: 'Keywords', icon: Key, color: 'bg-yellow-500' },
  { value: 'Important', icon: AlertCircle, color: 'bg-red-500' },
];

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

interface PreviousSession {
  sessionId: string;
  sessionName: string;
  date: string;
  startTime: string;
  batch: string;
  term: string;
  domain: string;
  subject: string;
  notes: NoteCard[];
}

export function NotesPopup() {
  const [sessionInfo, setSessionInfo] = useState<SessionInfo | null>(null);
  const [student, setStudent] = useState<Student | null>(null);
  const [notes, setNotes] = useState<NoteCard[]>([]);
  const [previousSessions, setPreviousSessions] = useState<PreviousSession[]>([]);
  const [currentNote, setCurrentNote] = useState<NoteCard>({
    noteType: 'Topic',
    noteTitle: '',
    noteContent: '',
    images: [],
    timestamp: ''
  });
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showHighlightPicker, setShowHighlightPicker] = useState(false);
  const [expandedImage, setExpandedImage] = useState<string | null>(null);
  const [showTagsModal, setShowTagsModal] = useState(false);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [tempTags, setTempTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const contentEditableRef = useRef<HTMLDivElement>(null);
  const isInitializedRef = useRef(false); // Use ref instead of state to prevent double loading

  // Countdown timer for newly saved notes
  const [savingNoteId, setSavingNoteId] = useState<string | null>(null);
  const [countdownSeconds, setCountdownSeconds] = useState<number>(0);

  // Check localStorage for countdown timer and update every second
  useEffect(() => {
    const checkCountdown = () => {
      const savedData = localStorage.getItem('newNoteSaving');
      if (savedData) {
        try {
          const { noteId, expiresAt } = JSON.parse(savedData);
          const remainingMs = expiresAt - Date.now();
          const remainingSeconds = Math.ceil(remainingMs / 1000);

          if (remainingMs > 0) {
            setSavingNoteId(noteId);
            setCountdownSeconds(remainingSeconds);
          } else {
            // Expired, clear it
            localStorage.removeItem('newNoteSaving');
            setSavingNoteId(null);
            setCountdownSeconds(0);
          }
        } catch (e) {
          // Invalid data, clear it
          console.error('Failed to parse countdown data:', e);
          localStorage.removeItem('newNoteSaving');
          setSavingNoteId(null);
          setCountdownSeconds(0);
        }
      } else {
        // Only update if currently showing countdown
        if (savingNoteId !== null || countdownSeconds > 0) {
          setSavingNoteId(null);
          setCountdownSeconds(0);
        }
      }
    };

    // Check immediately
    checkCountdown();

    // Check every second
    const interval = setInterval(checkCountdown, 1000);
    return () => clearInterval(interval);
  }, [savingNoteId, countdownSeconds]);

  // Update timestamp every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Update every minute
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
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [expandedImage]);

  // Get session info and student data
  useEffect(() => {
    if (isInitializedRef.current) return; // Prevent double initialization
    isInitializedRef.current = true; // Mark as initialized immediately

    const initializePopup = async () => {
      // Get session info from URL
      const params = new URLSearchParams(window.location.search);
      const sessionId = params.get('sessionId');
      const sessionName = params.get('sessionName');
      const batch = params.get('batch');
      const term = params.get('term') || undefined;
      const domain = params.get('domain') || undefined;
      const subject = params.get('subject') || undefined;
      const date = params.get('date') || undefined;
      const startTime = params.get('startTime') || undefined;
      const studentEmail = params.get('studentEmail') || undefined;
      const studentName = params.get('studentName') || undefined;

      console.log('URL Params - sessionId:', sessionId, 'sessionName:', sessionName, 'batch:', batch);
      console.log('URL Params - studentEmail:', studentEmail, 'studentName:', studentName);

      if (sessionId && sessionName && batch) {
        setSessionInfo({
          sessionId,
          sessionName: decodeURIComponent(sessionName),
          batch,
          term,
          domain,
          subject,
          date,
          startTime
        });

        // Get student data - priority: URL params > Firebase auth > localStorage
        let email = studentEmail || '';
        let name = studentName || '';

        if (!email) {
          // Try Firebase auth
          const currentUser = auth.currentUser;
          if (currentUser?.email) {
            email = currentUser.email;
          } else {
            // Fallback to localStorage
            const storedUser = localStorage.getItem('user');
            if (storedUser) {
              const parsedUser = JSON.parse(storedUser);
              email = parsedUser.email;
            }
          }
        }

        if (email) {
          // If we have email from URL params and name, use directly
          if (studentEmail && studentName) {
            const studentData = {
              email: email,
              name: name,
              studentId: email.split('@')[0],
              batch: batch
            };
            console.log('Setting student from URL params:', studentData);
            setStudent(studentData);
            loadNotes(sessionId, email);
            // Load previous sessions in background (silently)
            if (batch && term && domain && subject) {
              loadPreviousSessions(email, sessionId, batch, term, domain, subject);
            }
          } else {
            // Fetch student profile from backend if we don't have complete info
            try {
              console.log('Fetching student profile from backend for:', email);
              const response = await api.getStudentProfile(email);
              if (response.success && response.data) {
                const studentData = {
                  email: response.data.email,
                  name: response.data.fullName,
                  studentId: response.data.email.split('@')[0],
                  batch: response.data.batch
                };
                console.log('Setting student from backend:', studentData);
                setStudent(studentData);
                loadNotes(sessionId, response.data.email);
                // Load previous sessions in background (silently)
                if (batch && term && domain && subject) {
                  loadPreviousSessions(response.data.email, sessionId, batch, term, domain, subject);
                }
              }
            } catch (error) {
              console.error('Error fetching student profile:', error);
              // Fallback to basic student object
              const fallbackData = {
                email: email,
                name: name || email.split('@')[0],
                studentId: email.split('@')[0],
                batch: batch
              };
              console.log('Setting student from fallback:', fallbackData);
              setStudent(fallbackData);
              loadNotes(sessionId, email);
              // Load previous sessions in background (silently)
              if (batch && term && domain && subject) {
                loadPreviousSessions(email, sessionId, batch, term, domain, subject);
              }
            }
          }
        } else {
          console.error('No email found - cannot initialize student');
          setIsLoading(false); // Stop loading even if no email
        }
      }
    };

    initializePopup();
  }, []); // Empty dependency array - only run once on mount

  // Convert Google Drive URL to direct image URL
  const convertDriveUrl = (url: string): string => {
    if (!url) return url;

    // If it's already a data URL or direct image URL, return as is
    if (url.startsWith('data:') || url.includes('googleusercontent.com') || url.includes('drive.google.com/uc')) {
      return url;
    }

    // Convert Google Drive URL formats to direct image URL
    // Format 1: https://drive.google.com/file/d/FILE_ID/view
    // Format 2: https://drive.google.com/file/d/FILE_ID/view?usp=drivesdk
    // Format 3: https://drive.google.com/open?id=FILE_ID
    let fileId = '';

    const fileMatch = url.match(/\/file\/d\/([^\/\?]+)/);
    if (fileMatch) {
      fileId = fileMatch[1];
    } else {
      const idMatch = url.match(/[?&]id=([^&]+)/);
      if (idMatch) {
        fileId = idMatch[1];
      }
    }

    if (fileId) {
      // Use the thumbnail API which is specifically designed for embedding
      // This bypasses CORS restrictions and works reliably for images
      return `https://drive.google.com/thumbnail?id=${fileId}&sz=w2000`;
    }

    return url;
  };

  const loadNotes = async (sessionId: string, studentEmail: string, showLoading = true) => {
    try {
      if (showLoading) setIsLoading(true);
      const response = await api.getSessionNotes(studentEmail, sessionId);
      if (response.success && response.data && Array.isArray(response.data)) {
        const loadedNotes = response.data.map((note: any) => {
          // Debug logging for images
          if (note.images) {
            console.log('Original image URLs:', note.images);
            const imageUrls = note.images.split(',').filter((url: string) => url.trim());
            console.log('Parsed image URLs:', imageUrls);
            const convertedUrls = imageUrls.map(convertDriveUrl);
            console.log('Converted image URLs:', convertedUrls);
          }

          // Decode URL-encoded content (for old notes that have + symbols)
          let decodedContent = note.noteContent || '';
          if (decodedContent.includes('+')) {
            // Replace + with spaces and decode other URL-encoded characters
            decodedContent = decodeURIComponent(decodedContent.replace(/\+/g, ' '));
          }

          // Decode URL-encoded title
          let decodedTitle = note.noteTitle || '';
          if (decodedTitle.includes('+')) {
            decodedTitle = decodeURIComponent(decodedTitle.replace(/\+/g, ' '));
          }

          return {
            noteId: note.noteId,
            noteType: decodedTitle.split(':')[0] || 'Topic',
            noteTitle: decodedTitle,
            noteContent: decodedContent,
            images: note.images ? note.images.split(',').filter((url: string) => url.trim()).map(convertDriveUrl) : [],
            timestamp: note.timestamp,
            isPinned: note.isPinned,
            tags: note.tags ? note.tags.split(',').filter((tag: string) => tag.trim()) : []
          };
        });
        setNotes(loadedNotes);
      }
    } catch (error) {
      console.error('Error loading notes:', error);
      toast.error('Failed to load notes');
    } finally {
      if (showLoading) setIsLoading(false);
    }
  };

  // Load previous sessions in background (thread view)
  const loadPreviousSessions = async (
    studentEmail: string,
    currentSessionId: string,
    batch: string,
    term?: string,
    domain?: string,
    subject?: string
  ) => {
    try {
      console.log('🔄 Loading previous sessions in background...');
      console.log('📋 Filters:', {
        studentEmail,
        currentSessionId,
        batch: `"${batch}"`,
        term: `"${term}"`,
        domain: `"${domain}"`,
        subject: `"${subject}"`
      });

      const response = await api.getSessionNotesBySubject(
        studentEmail,
        batch,
        term || '',
        domain || '',
        subject || ''
      );

      console.log('📦 API Response:', response);
      console.log('📦 Response success:', response.success);
      console.log('📦 Response data:', response.data);

      if (response.success && response.data && Array.isArray(response.data)) {
        console.log('✅ Total sessions from API:', response.data.length);

        // Filter out current session and map notes
        const previousSessionsData = response.data
          .filter(session => {
            const isNotCurrent = session.sessionId !== currentSessionId;
            console.log(`Session ${session.sessionId}: ${isNotCurrent ? 'INCLUDE' : 'EXCLUDE (current)'}`);
            return isNotCurrent;
          })
          .map(session => ({
            ...session,
            notes: session.notes.map((note: any) => {
              // Decode URL-encoded content
              let decodedContent = note.noteContent || '';
              if (decodedContent.includes('+')) {
                decodedContent = decodeURIComponent(decodedContent.replace(/\+/g, ' '));
              }

              let decodedTitle = note.noteTitle || '';
              if (decodedTitle.includes('+')) {
                decodedTitle = decodeURIComponent(decodedTitle.replace(/\+/g, ' '));
              }

              return {
                noteId: note.noteId,
                noteType: decodedTitle.split(':')[0] || 'Topic',
                noteTitle: decodedTitle,
                noteContent: decodedContent,
                images: note.images ? note.images.split(',').filter((url: string) => url.trim()).map(convertDriveUrl) : [],
                timestamp: note.timestamp,
                isPinned: note.isPinned,
                tags: note.tags ? note.tags.split(',').filter((tag: string) => tag.trim()) : []
              };
            })
          }));

        console.log('✨ Previous sessions after filtering:', previousSessionsData.length);
        console.log('📝 Previous sessions data:', previousSessionsData);
        setPreviousSessions(previousSessionsData);
      } else {
        console.log('❌ No data or unsuccessful response');
      }
    } catch (error) {
      console.error('💥 Error loading previous sessions:', error);
      // Silently fail - don't show error toast for background loading
    }
  };

  const saveCurrentNote = async () => {
    console.log('SaveCurrentNote - student:', student);
    console.log('SaveCurrentNote - sessionInfo:', sessionInfo);

    if (!student?.email || !sessionInfo) {
      console.error('Missing data - student email:', student?.email, 'sessionInfo:', sessionInfo);
      toast.error('Missing student or session information');
      return;
    }

    const contentText = contentEditableRef.current?.innerText || '';
    if (!currentNote.noteTitle.trim() && !contentText.trim()) {
      toast.error('Please add a title or content');
      return;
    }

    // Format title with note type
    const formattedTitle = currentNote.noteTitle.trim()
      ? `${currentNote.noteType}: ${currentNote.noteTitle}`
      : currentNote.noteType;

    // Create optimistic note for instant UI feedback
    const tempNoteId = `temp-${Date.now()}`;
    const optimisticNote: NoteCard = {
      noteId: tempNoteId,
      noteType: currentNote.noteType,
      noteTitle: formattedTitle,
      noteContent: contentEditableRef.current?.innerHTML || '',
      images: currentNote.images,
      timestamp: new Date().toISOString(),
      isPinned: 'No'
    };

    // Immediately add to UI
    setNotes(prev => [optimisticNote, ...prev]);

    // Start countdown immediately for better UX
    const countdownData = {
      noteId: tempNoteId,
      expiresAt: Date.now() + 10000 // 10 seconds from now
    };
    setSavingNoteId(tempNoteId);
    setCountdownSeconds(10);
    localStorage.setItem('newNoteSaving', JSON.stringify(countdownData));

    // Reset editor immediately for fast UX
    setCurrentNote({
      noteType: 'Topic',
      noteTitle: '',
      noteContent: '',
      images: [],
      timestamp: ''
    });
    if (contentEditableRef.current) {
      contentEditableRef.current.innerHTML = '';
    }

    // Show instant success feedback
    toast.success('Note saved!', { duration: 2000 });

    try {
      setIsSaving(true);

      // Convert images to base64
      const imageData = await Promise.all(
        currentNote.images.map(async (url) => {
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

      // Save to backend in background
      const response = await api.saveSessionNote({
        studentId: student.email,
        studentName: student.name,
        sessionId: sessionInfo.sessionId,
        noteTitle: formattedTitle,
        noteContent: optimisticNote.noteContent,
        images: validImages,
        batch: sessionInfo.batch,
        term: sessionInfo.term,
        domain: sessionInfo.domain,
        subject: sessionInfo.subject,
        sessionName: sessionInfo.sessionName,
        date: sessionInfo.date,
        startTime: sessionInfo.startTime
      });

      // Reload notes to get real data from backend (without showing loading overlay)
      if (response.success) {
        await loadNotes(sessionInfo.sessionId, student.email, false);

        // Update countdown to use real noteId instead of temp ID
        if (response.data?.noteId) {
          const realNoteId = response.data.noteId;

          // Get the current countdown expiration time
          const currentCountdown = localStorage.getItem('newNoteSaving');
          if (currentCountdown) {
            try {
              const { expiresAt } = JSON.parse(currentCountdown);

              // Update to real noteId but keep the same expiration time
              const countdownData = {
                noteId: realNoteId,
                expiresAt: expiresAt
              };

              // Update local state
              setSavingNoteId(realNoteId);

              // Store in localStorage for cross-component sharing
              localStorage.setItem('newNoteSaving', JSON.stringify(countdownData));
            } catch (e) {
              console.error('Failed to parse existing countdown:', e);
            }
          }
        }
      } else {
        // Remove optimistic note on error
        setNotes(prev => prev.filter(n => n.noteId !== optimisticNote.noteId));
        toast.error(response.error || 'Failed to save note');
      }
    } catch (error) {
      console.error('Error saving note:', error);
      // Remove optimistic note on error
      setNotes(prev => prev.filter(n => n.noteId !== optimisticNote.noteId));
      toast.error('Failed to save note');
    } finally {
      setIsSaving(false);
    }
  };

  // Toggle pin status with optimistic update
  const togglePin = async (noteId: string | undefined) => {
    if (!student?.email || !noteId) return;

    // Optimistic update - toggle immediately in UI
    setNotes(prev => prev.map(note =>
      note.noteId === noteId
        ? { ...note, isPinned: note.isPinned === 'Yes' ? 'No' : 'Yes' }
        : note
    ));

    const isPinning = notes.find(n => n.noteId === noteId)?.isPinned !== 'Yes';
    toast.success(isPinning ? 'Note pinned!' : 'Note unpinned!', { duration: 1500 });

    try {
      // Update backend in background
      const response = await api.togglePinNote(noteId, student.email);
      if (!response.success) {
        // Revert on error
        setNotes(prev => prev.map(note =>
          note.noteId === noteId
            ? { ...note, isPinned: note.isPinned === 'Yes' ? 'No' : 'Yes' }
            : note
        ));
        toast.error(response.error || 'Failed to toggle pin');
      }
    } catch (error) {
      console.error('Error toggling pin:', error);
      // Revert on error
      setNotes(prev => prev.map(note =>
        note.noteId === noteId
          ? { ...note, isPinned: note.isPinned === 'Yes' ? 'No' : 'Yes' }
          : note
      ));
      toast.error('Failed to toggle pin');
    }
  };

  // Image handling
  const handleFiles = (files: File[]) => {
    files.forEach(file => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          setCurrentNote(prev => ({
            ...prev,
            images: [...prev.images, e.target?.result as string]
          }));
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

  // Rich text formatting
  const formatText = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    contentEditableRef.current?.focus();
  };

  const insertTimestamp = () => {
    const timestamp = `[${currentTime.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    })}] `;
    document.execCommand('insertText', false, timestamp);
  };

  // Handle line click to toggle strikethrough in to-do list
  const handleLineToggle = async (noteId: string | undefined, clickedElement: HTMLElement, isFromPreviousSession: boolean = false) => {
    if (!noteId || !student?.email) return;

    // Find the note - check both current notes and previous sessions
    let noteToUpdate: NoteCard | undefined;
    let sessionIdForNote: string | undefined;

    if (isFromPreviousSession) {
      // Search in previous sessions
      for (const session of previousSessions) {
        const foundNote = session.notes.find(n => n.noteId === noteId);
        if (foundNote) {
          noteToUpdate = foundNote;
          sessionIdForNote = session.sessionId;
          break;
        }
      }
    } else {
      // Search in current notes
      noteToUpdate = notes.find(n => n.noteId === noteId);
      sessionIdForNote = sessionInfo?.sessionId;
    }

    if (!noteToUpdate || noteToUpdate.noteType !== 'To Do List') return;

    // Store original content for potential revert
    const originalContent = noteToUpdate.noteContent;

    // Find the closest <li> element (list item)
    const listItem = clickedElement.closest('li');
    if (!listItem) return;

    // Parse the content
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = originalContent;

    // Find all <li> elements
    const allListItems = Array.from(tempDiv.querySelectorAll('li'));

    // Find the exact list item in the DOM
    const noteContentDiv = document.querySelector(`[data-note-id="${noteId}"]`);
    if (!noteContentDiv) return;

    const domListItems = Array.from(noteContentDiv.querySelectorAll('li'));
    const itemIndex = domListItems.indexOf(listItem);

    if (itemIndex >= 0 && itemIndex < allListItems.length) {
      const targetItem = allListItems[itemIndex] as HTMLElement;
      const currentStyle = targetItem.getAttribute('style') || '';

      // Check if already striked
      const isStriked = currentStyle.includes('text-decoration: line-through') ||
                        currentStyle.includes('text-decoration:line-through');

      if (isStriked) {
        // Remove strikethrough - change to red
        targetItem.setAttribute('style', 'color: red;');
      } else {
        // Add strikethrough - change to green
        targetItem.setAttribute('style', 'text-decoration: line-through; color: green;');
      }

      const updatedContent = tempDiv.innerHTML;

      // Optimistic update - update the appropriate state
      if (isFromPreviousSession) {
        setPreviousSessions(prev => prev.map(session => ({
          ...session,
          notes: session.notes.map(note =>
            note.noteId === noteId ? { ...note, noteContent: updatedContent } : note
          )
        })));
      } else {
        setNotes(prev => prev.map(note =>
          note.noteId === noteId ? { ...note, noteContent: updatedContent } : note
        ));
      }

      // Save to backend
      try {
        const response = await api.updateNoteContent(noteId, student.email, updatedContent);
        if (!response.success) {
          // Revert on error
          if (isFromPreviousSession) {
            setPreviousSessions(prev => prev.map(session => ({
              ...session,
              notes: session.notes.map(note =>
                note.noteId === noteId ? { ...note, noteContent: originalContent } : note
              )
            })));
          } else {
            setNotes(prev => prev.map(note =>
              note.noteId === noteId ? { ...note, noteContent: originalContent } : note
            ));
          }
          toast.error(response.error || 'Failed to save');
        }
      } catch (error) {
        console.error('Error saving:', error);
        // Revert on error
        if (isFromPreviousSession) {
          setPreviousSessions(prev => prev.map(session => ({
            ...session,
            notes: session.notes.map(note =>
              note.noteId === noteId ? { ...note, noteContent: originalContent } : note
            )
          })));
        } else {
          setNotes(prev => prev.map(note =>
            note.noteId === noteId ? { ...note, noteContent: originalContent } : note
          ));
        }
        toast.error('Failed to save');
      }
    }
  };

  // Open tags modal for a note
  const openTagsModal = (note: NoteCard) => {
    setEditingNoteId(note.noteId || null);
    setTempTags(note.tags || []);
    setTagInput('');
    setShowTagsModal(true);
  };

  // Add a tag from dropdown
  const addTag = () => {
    if (tagInput.trim() && tempTags.length < 3 && !tempTags.includes(tagInput.trim())) {
      setTempTags([...tempTags, tagInput.trim()]);
      setTagInput('');
    }
  };

  // Add predefined tag
  const addPredefinedTag = (tag: string) => {
    if (tempTags.length < 3 && !tempTags.includes(tag)) {
      setTempTags([...tempTags, tag]);
    }
  };

  // Remove a tag
  const removeTag = (tagToRemove: string) => {
    setTempTags(tempTags.filter(tag => tag !== tagToRemove));
  };

  // Helper function to strip HTML tags for search
  const stripHtml = (html: string) => {
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
  };

  // Save tags
  const saveTags = async () => {
    if (!editingNoteId || !student?.email) return;
    if (tempTags.length === 0) {
      toast.error('Please add at least 1 tag');
      return;
    }

    // Check if note is in current session or previous sessions
    const isInCurrentSession = notes.some(n => n.noteId === editingNoteId);
    const isInPreviousSessions = previousSessions.some(s =>
      s.notes.some(n => n.noteId === editingNoteId)
    );

    // Store original tags for potential revert
    let originalTags: string[] = [];
    if (isInCurrentSession) {
      originalTags = notes.find(n => n.noteId === editingNoteId)?.tags || [];
    } else if (isInPreviousSessions) {
      for (const session of previousSessions) {
        const note = session.notes.find(n => n.noteId === editingNoteId);
        if (note) {
          originalTags = note.tags || [];
          break;
        }
      }
    }

    // Optimistic update - update appropriate state
    if (isInCurrentSession) {
      setNotes(prev => prev.map(note =>
        note.noteId === editingNoteId ? { ...note, tags: tempTags } : note
      ));
    } else if (isInPreviousSessions) {
      setPreviousSessions(prev => prev.map(session => ({
        ...session,
        notes: session.notes.map(note =>
          note.noteId === editingNoteId ? { ...note, tags: tempTags } : note
        )
      })));
    }

    setShowTagsModal(false);
    toast.success('Tags updated!');

    try {
      // Save to backend
      const response = await api.updateNoteTags(editingNoteId, student.email, tempTags);
      if (!response.success) {
        // Revert on error
        if (isInCurrentSession) {
          setNotes(prev => prev.map(note =>
            note.noteId === editingNoteId ? { ...note, tags: originalTags } : note
          ));
        } else if (isInPreviousSessions) {
          setPreviousSessions(prev => prev.map(session => ({
            ...session,
            notes: session.notes.map(note =>
              note.noteId === editingNoteId ? { ...note, tags: originalTags } : note
            )
          })));
        }
        toast.error(response.error || 'Failed to save tags');
      }
    } catch (error) {
      console.error('Error saving tags:', error);
      // Revert on error
      if (isInCurrentSession) {
        setNotes(prev => prev.map(note =>
          note.noteId === editingNoteId ? { ...note, tags: originalTags } : note
        ));
      } else if (isInPreviousSessions) {
        setPreviousSessions(prev => prev.map(session => ({
          ...session,
          notes: session.notes.map(note =>
            note.noteId === editingNoteId ? { ...note, tags: originalTags } : note
          )
        })));
      }
      toast.error('Failed to save tags');
    }
  };

  if (!sessionInfo) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <p className="text-gray-600 dark:text-gray-400">Loading...</p>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-white dark:bg-gray-900 relative">
      {/* Glassmorphism Skeleton Loading Overlay - Only show on initial load */}
      {isLoading && notes.length === 0 && (
        <div className="absolute inset-0 bg-gradient-to-br from-white/70 to-white/40 dark:from-gray-900/70 dark:to-gray-800/40 backdrop-blur-2xl z-50 overflow-hidden">
          <div className="h-full flex flex-col">
            {/* Header Skeleton */}
            <div className="p-3 bg-gradient-to-r from-green-500/30 to-emerald-600/30 backdrop-blur-lg border-b border-white/20 dark:border-gray-700/30 animate-pulse">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-white/50 dark:bg-gray-700/50 rounded"></div>
                <div className="flex-1 space-y-1">
                  <div className="h-3 bg-white/50 dark:bg-gray-700/50 rounded w-1/3"></div>
                  <div className="h-2 bg-white/40 dark:bg-gray-700/40 rounded w-1/2"></div>
                </div>
              </div>
            </div>

            <div className="flex-1 p-4 space-y-4 overflow-hidden">
              {/* Saved Notes Skeleton */}
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="relative group"
                    style={{ animationDelay: `${i * 150}ms` }}
                  >
                    {/* Glass card background matching sessions page */}
                    <div className="absolute inset-0 bg-gradient-to-br from-white/70 to-white/40 dark:from-gray-900/70 dark:to-gray-800/40 backdrop-blur-2xl rounded-2xl border border-white/20 dark:border-gray-700/30 shadow-xl animate-pulse"></div>

                    {/* Content */}
                    <div className="relative p-3 space-y-2">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2 flex-1">
                          <div className="w-6 h-6 bg-gradient-to-br from-green-500/40 to-emerald-600/40 rounded"></div>
                          <div className="h-3 bg-gray-300/50 dark:bg-gray-600/50 rounded w-1/3"></div>
                        </div>
                        <div className="h-2 bg-gray-300/40 dark:bg-gray-600/40 rounded w-16"></div>
                      </div>
                      <div className="space-y-2">
                        <div className="h-2 bg-gray-300/40 dark:bg-gray-600/40 rounded w-full"></div>
                        <div className="h-2 bg-gray-300/40 dark:bg-gray-600/40 rounded w-4/5"></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Editor Skeleton */}
              <div className="space-y-3 mt-6">
                {/* Type Selector Skeleton */}
                <div className="flex gap-2 flex-wrap">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div
                      key={i}
                      className="relative"
                      style={{ animationDelay: `${i * 100}ms` }}
                    >
                      <div className="h-8 w-20 bg-gradient-to-br from-white/70 to-white/40 dark:from-gray-900/70 dark:to-gray-800/40 backdrop-blur-2xl border border-white/20 dark:border-gray-700/30 rounded-lg animate-pulse shadow-lg"></div>
                    </div>
                  ))}
                </div>

                {/* Title Input Skeleton */}
                <div className="relative">
                  <div className="h-10 bg-gradient-to-br from-white/70 to-white/40 dark:from-gray-900/70 dark:to-gray-800/40 backdrop-blur-2xl border border-white/20 dark:border-gray-700/30 rounded-lg animate-pulse shadow-lg"></div>
                </div>

                {/* Content Editor Skeleton */}
                <div className="relative">
                  <div className="h-32 bg-gradient-to-br from-white/70 to-white/40 dark:from-gray-900/70 dark:to-gray-800/40 backdrop-blur-2xl border border-white/20 dark:border-gray-700/30 rounded-lg animate-pulse shadow-lg p-3 space-y-2">
                    <div className="h-2 bg-gray-300/40 dark:bg-gray-600/40 rounded w-full"></div>
                    <div className="h-2 bg-gray-300/40 dark:bg-gray-600/40 rounded w-11/12"></div>
                    <div className="h-2 bg-gray-300/40 dark:bg-gray-600/40 rounded w-10/12"></div>
                  </div>
                </div>

                {/* Save Button Skeleton */}
                <div className="relative">
                  <div className="h-10 bg-gradient-to-r from-green-500/50 to-emerald-600/50 backdrop-blur-xl rounded-lg animate-pulse shadow-lg"></div>
                </div>
              </div>

              {/* Loading Text with Pulsing Animation */}
              <div className="absolute bottom-8 left-0 right-0 flex justify-center">
                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full opacity-20 blur-xl"></div>
                  <div className="relative px-6 py-3 bg-gradient-to-br from-white/80 to-white/60 dark:from-gray-800/80 dark:to-gray-900/80 backdrop-blur-xl rounded-full border border-white/60 dark:border-gray-700/60 shadow-xl">
                    <div className="flex items-center gap-3">
                      <div className="flex gap-1">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                        <div className="w-2 h-2 bg-emerald-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                      </div>
                      <span className="text-sm font-medium bg-gradient-to-r from-green-600 to-emerald-700 dark:from-green-400 dark:to-emerald-500 bg-clip-text text-transparent">Loading notes...</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header - Glassmorphism */}
      <div className="relative flex items-center justify-between p-3 flex-shrink-0 border-b border-white/20 dark:border-gray-700/30 shadow-lg shadow-gray-500/20 dark:shadow-gray-900/40">
        {/* Glassmorphism background */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/70 to-white/40 dark:from-gray-900/70 dark:to-gray-800/40 backdrop-blur-2xl"></div>

        {/* Content */}
        <div className="relative flex items-center gap-2 flex-1 min-w-0">
          <GripVertical className="w-4 h-4 flex-shrink-0 text-gray-700 dark:text-gray-300" />
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold truncate bg-gradient-to-r from-green-600 to-emerald-700 dark:from-green-400 dark:to-emerald-500 bg-clip-text text-transparent">
              {student?.name ? `${student.name}'s Notes` : 'Session Notes'}
            </h3>
            <p className="text-xs text-gray-600 dark:text-gray-400 truncate">{sessionInfo.sessionName} • {sessionInfo.subject}</p>
          </div>
        </div>
        <div className="relative flex items-center gap-1">
          <button
            onClick={() => setShowSearch(!showSearch)}
            className="p-1 hover:bg-gray-200/50 dark:hover:bg-gray-700/50 rounded transition-colors text-gray-700 dark:text-gray-300"
            title="Search notes"
          >
            <Search className="w-4 h-4" />
          </button>
          <button
            onClick={() => window.close()}
            className="p-1 hover:bg-gray-200/50 dark:hover:bg-gray-700/50 rounded transition-colors text-gray-700 dark:text-gray-300"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex flex-col flex-1 overflow-hidden">
          {/* Search Bar - Collapsible */}
          {showSearch && (
            <div className="px-4 pt-3 pb-2 border-b border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search notes..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 dark:focus:ring-emerald-500 text-gray-900 dark:text-white placeholder-gray-400"
                  autoFocus
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Unified Scrollable Area - Current Session Notes + Previous Sessions */}
          <div className="flex-1 overflow-y-auto">
            {/* Current Session Notes */}
            {notes.length > 0 && (
              <div className="border-b border-gray-200 dark:border-gray-700">
                {/* Pin Counter */}
                {(() => {
                  const pinnedCount = notes.filter(n => n.isPinned === 'Yes').length;
                  const maxPins = 10;
                  return pinnedCount > 0 && (
                    <div className="px-4 pt-3 pb-1 border-b border-gray-200 dark:border-gray-700">
                      <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                        <Pin className="w-3 h-3 text-blue-500" />
                        <span>
                          Pinned: <span className="font-semibold text-blue-600 dark:text-blue-400">{pinnedCount}</span>/{maxPins}
                        </span>
                      </div>
                    </div>
                  );
                })()}

                <div className="p-4 space-y-2">
                {notes
                .filter(note => {
                  // Filter by search query
                  if (!searchQuery) return true;
                  const query = searchQuery.toLowerCase();
                  const plainTextContent = stripHtml(note.noteContent).toLowerCase();
                  return (
                    note.noteTitle.toLowerCase().includes(query) ||
                    plainTextContent.includes(query) ||
                    (note.tags && note.tags.some(tag => tag.toLowerCase().includes(query)))
                  );
                })
                .sort((a, b) => {
                // Sort pinned notes to the top
                if (a.isPinned === 'Yes' && b.isPinned !== 'Yes') return -1;
                if (a.isPinned !== 'Yes' && b.isPinned === 'Yes') return 1;
                // Then sort by timestamp (newest first)
                return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
              }).map((note, index) => {
                const noteType = NOTE_TYPES.find(t => note.noteTitle.startsWith(t.value)) || NOTE_TYPES[0];
                const Icon = noteType.icon;
                return (
                  <div
                    key={note.noteId || index}
                    className={`group/card relative p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border ${
                      note.isPinned === 'Yes'
                        ? 'border-blue-400 dark:border-blue-500 border-2'
                        : 'border-gray-200 dark:border-gray-700'
                    } hover:shadow-md transition-shadow cursor-pointer`}
                    onClick={(e) => {
                      // Don't allow opening tags modal during countdown
                      if (savingNoteId === note.noteId && countdownSeconds > 0) {
                        e.preventDefault();
                        return;
                      }
                      // Open tags modal when clicking on card (but not on buttons or checkboxes)
                      const target = e.target as HTMLElement;
                      if (!target.closest('button') && !target.closest('input[type="checkbox"]')) {
                        openTagsModal(note);
                      }
                    }}
                  >
                    {/* Hover tooltip for adding tags */}
                    {!(savingNoteId === note.noteId && countdownSeconds > 0) && (
                      <div className="absolute top-2 left-1/2 -translate-x-1/2 -translate-y-full mb-1 px-3 py-1 bg-gray-800 dark:bg-gray-700 text-white text-xs rounded shadow-lg opacity-0 group-hover/card:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                        Click to add tags
                      </div>
                    )}

                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className={`p-1 rounded ${noteType.color} text-white`}>
                          <Icon className="w-3 h-3" />
                        </div>
                        <h4 className="font-semibold text-xs text-gray-900 dark:text-white">
                          {note.noteTitle || 'Untitled Note'}
                        </h4>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500">
                          {new Date(note.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            // Don't allow pinning notes that haven't been saved yet
                            if (!note.noteId?.startsWith('temp-')) {
                              togglePin(note.noteId);
                            }
                          }}
                          disabled={note.noteId?.startsWith('temp-')}
                          className={`p-1 rounded transition-colors ${
                            note.noteId?.startsWith('temp-')
                              ? 'opacity-30 cursor-not-allowed text-gray-300 dark:text-gray-600'
                              : note.isPinned === 'Yes'
                              ? 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300'
                              : 'hover:bg-gray-200 text-gray-400 dark:hover:bg-gray-700 dark:text-gray-500'
                          }`}
                          title={
                            note.noteId?.startsWith('temp-')
                              ? 'Save note first to pin it'
                              : note.isPinned === 'Yes' ? 'Unpin note' : 'Pin note'
                          }
                        >
                          <Pin className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                    <div className="relative group/content">
                      {note.noteType === 'To Do List' && (
                        <div className="absolute -top-8 left-0 px-2 py-1 bg-gray-800 dark:bg-gray-700 text-white text-xs rounded opacity-0 group-hover/content:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                          Click on any item to mark as complete/incomplete
                        </div>
                      )}
                      <div
                        className="text-sm text-gray-700 dark:text-gray-300"
                        data-note-id={note.noteId}
                        dangerouslySetInnerHTML={{ __html: note.noteContent }}
                        onClick={(e) => {
                          // Handle line clicks for to-do lists
                          const target = e.target as HTMLElement;
                          if (note.noteType === 'To Do List' && !target.closest('button')) {
                            e.stopPropagation();
                            handleLineToggle(note.noteId, target);
                          }
                        }}
                        style={note.noteType === 'To Do List' ? { cursor: 'pointer' } : {}}
                      />
                    </div>
                    {note.images.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {note.images.map((img, idx) => (
                          <img
                            key={idx}
                            src={img}
                            alt="Note attachment"
                            className="w-12 h-12 object-cover rounded border cursor-pointer hover:opacity-80 transition-opacity"
                            onClick={(e) => {
                              e.stopPropagation();
                              setExpandedImage(img);
                            }}
                            onError={(e) => {
                              console.error('Image failed to load:', img);
                              const target = e.target as HTMLImageElement;
                              const fileId = img.match(/id=([^&]+)/)?.[1];

                              if (fileId && !target.dataset.fallbackAttempt) {
                                // Mark that we've tried fallback to prevent infinite loop
                                target.dataset.fallbackAttempt = '1';

                                // Try alternative Google Drive URL formats in sequence
                                if (img.includes('export=download')) {
                                  target.src = `https://drive.google.com/uc?export=view&id=${fileId}`;
                                  console.log('Trying export=view URL:', target.src);
                                } else if (img.includes('export=view')) {
                                  target.src = `https://drive.google.com/thumbnail?id=${fileId}&sz=w1000`;
                                  console.log('Trying thumbnail URL:', target.src);
                                } else {
                                  // Final fallback - show placeholder
                                  target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect fill="%23ddd" width="100" height="100"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%23999"%3EImage%3C/text%3E%3C/svg%3E';
                                  console.warn('All image URL formats failed for:', img);
                                }
                              }
                            }}
                          />
                        ))}
                      </div>
                    )}

                    {/* Countdown timer for newly saved notes */}
                    {savingNoteId === note.noteId && countdownSeconds > 0 && (
                      <div className="mt-2 flex items-center gap-2 px-2 py-1.5 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded text-xs">
                        <Clock className="h-3.5 w-3.5 text-yellow-600 dark:text-yellow-500 flex-shrink-0" />
                        <span className="text-yellow-700 dark:text-yellow-400 font-medium">
                          Wait {countdownSeconds}s to add tags
                        </span>
                      </div>
                    )}

                    {/* Tags display */}
                    {note.tags && note.tags.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {note.tags.map((tag, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
                </div>
              </div>
            )}

            {/* Previous Sessions - Thread View (Read-only) */}
            {previousSessions.length > 0 && (
              <div className="bg-gray-50/50 dark:bg-gray-900/50">
                <div className="sticky top-0 px-4 py-3 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-b border-blue-200 dark:border-blue-700 z-10 shadow-sm">
                  <h3 className="text-sm font-bold text-blue-700 dark:text-blue-300 uppercase tracking-wider flex items-center gap-2">
                    <span className="w-1.5 h-5 bg-gradient-to-b from-blue-500 to-indigo-500 rounded-full"></span>
                    📚 Previous Sessions ({previousSessions.length})
                  </h3>
                  <p className="text-xs text-blue-600 dark:text-blue-400 mt-1 ml-4">Scroll down to view past session notes</p>
                </div>
                <div className="p-4 space-y-4">
                {previousSessions.map((session, sessionIndex) => {
                  // Filter notes for this session based on search
                  const filteredNotes = session.notes.filter(note => {
                    if (!searchQuery) return true;
                    const query = searchQuery.toLowerCase();
                    const plainTextContent = stripHtml(note.noteContent).toLowerCase();
                    return (
                      note.noteTitle.toLowerCase().includes(query) ||
                      plainTextContent.includes(query) ||
                      (note.tags && note.tags.some(tag => tag.toLowerCase().includes(query)))
                    );
                  });

                  // Don't show session if no notes match the search
                  if (searchQuery && filteredNotes.length === 0) return null;

                  return (
                  <div
                    key={session.sessionId || sessionIndex}
                    className="bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden"
                  >
                    {/* Session Header */}
                    <div className="px-4 py-2 bg-gray-100 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-semibold text-sm text-gray-900 dark:text-white">
                            {session.sessionName}
                          </h4>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                            {session.date} at {session.startTime}
                          </p>
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded">
                          Read-only
                        </div>
                      </div>
                    </div>

                    {/* Session Notes */}
                    <div className="p-3 space-y-2">
                      {filteredNotes.length > 0 ? (
                        filteredNotes.map((note, noteIndex) => {
                          const noteType = NOTE_TYPES.find(t => note.noteTitle.startsWith(t.value)) || NOTE_TYPES[0];
                          const Icon = noteType.icon;
                          return (
                            <div
                              key={note.noteId || noteIndex}
                              className="relative group p-3 bg-white dark:bg-gray-900 rounded border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow cursor-pointer"
                              onClick={(e) => {
                                // For non-todo lists, single click opens tags
                                const target = e.target as HTMLElement;
                                if (note.noteType !== 'To Do List' && !target.closest('button')) {
                                  openTagsModal(note);
                                }
                              }}
                              onDoubleClick={(e) => {
                                // For to-do lists, double click opens tags
                                if (note.noteType === 'To Do List') {
                                  e.stopPropagation();
                                  openTagsModal(note);
                                }
                              }}
                            >
                              {/* Hover tooltip */}
                              <div className="absolute top-2 left-1/2 -translate-x-1/2 -translate-y-full mb-1 px-3 py-1 bg-gray-800 dark:bg-gray-700 text-white text-xs rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-20">
                                {note.noteType === 'To Do List'
                                  ? 'Click items to toggle • Double-click card for tags'
                                  : 'Click to add/edit tags'}
                              </div>

                              <div className="flex items-start justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <div className={`p-1 rounded ${noteType.color} text-white`}>
                                    <Icon className="w-3 h-3" />
                                  </div>
                                  <h4 className="font-semibold text-xs text-gray-900 dark:text-white">
                                    {note.noteTitle}
                                  </h4>
                                  {note.isPinned === 'Yes' && (
                                    <Pin className="w-3 h-3 text-blue-500" />
                                  )}
                                </div>
                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                  {new Date(note.timestamp).toLocaleTimeString([], {
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </span>
                              </div>

                              {/* Note Content */}
                              <div className="relative group/content">
                                {note.noteType === 'To Do List' && (
                                  <div className="absolute -top-8 left-0 bg-gray-800 dark:bg-gray-700 text-white text-xs px-2 py-1 rounded shadow-lg opacity-0 group-hover/content:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                                    Click on any item to mark as complete/incomplete
                                  </div>
                                )}
                                <div
                                  data-note-id={note.noteId}
                                  className="text-xs text-gray-700 dark:text-gray-300 prose prose-sm dark:prose-invert max-w-none"
                                  dangerouslySetInnerHTML={{ __html: note.noteContent }}
                                  onClick={(e) => {
                                    // Allow clicking to toggle strikethrough for to-do lists (read-only but interactive)
                                    if (note.noteType === 'To Do List') {
                                      handleLineToggle(note.noteId, e.target as HTMLElement, true);
                                    }
                                  }}
                                />
                              </div>

                              {/* Images */}
                              {note.images && note.images.length > 0 && (
                                <div className="mt-2 flex gap-2 flex-wrap">
                                  {note.images.map((img: string, imgIdx: number) => (
                                    <div
                                      key={imgIdx}
                                      className="relative w-16 h-16 rounded border border-gray-300 dark:border-gray-600 overflow-hidden cursor-pointer hover:opacity-80 transition-opacity"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setExpandedImage(img);
                                      }}
                                    >
                                      <img
                                        src={img}
                                        alt={`Note attachment ${imgIdx + 1}`}
                                        className="w-full h-full object-cover"
                                        onError={(e) => {
                                          const target = e.target as HTMLImageElement;
                                          target.style.display = 'none';
                                          const parent = target.parentElement;
                                          if (parent) {
                                            parent.innerHTML = '<div class="w-full h-full flex items-center justify-center bg-gray-100 dark:bg-gray-800 text-gray-400 text-xs">Image</div>';
                                          }
                                        }}
                                      />
                                    </div>
                                  ))}
                                </div>
                              )}

                              {/* Tags */}
                              {note.tags && note.tags.length > 0 && (
                                <div className="mt-2 flex flex-wrap gap-1">
                                  {note.tags.map((tag: string, tagIdx: number) => (
                                    <span
                                      key={tagIdx}
                                      className="text-xs px-2 py-0.5 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-full"
                                    >
                                      {tag}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        })
                      ) : (
                        <p className="text-xs text-gray-500 dark:text-gray-400 text-center py-2">
                          No notes for this session
                        </p>
                      )}
                    </div>
                  </div>
                  );
                })}
                </div>
              </div>
            )}
          </div>

          {/* Editor - Fixed at Bottom */}
          <div className="border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4 space-y-3">
            {/* Note Type Selector */}
            <div className="flex gap-2 flex-wrap">
              {NOTE_TYPES.map((type) => {
                const Icon = type.icon;
                return (
                  <button
                    key={type.value}
                    onClick={() => {
                      setCurrentNote(prev => ({ ...prev, noteType: type.value }));
                      // Auto-insert ordered list for To Do List type if content is empty
                      if (type.value === 'To Do List' && !currentNote.noteContent.trim()) {
                        setTimeout(() => {
                          formatText('insertOrderedList');
                          formatText('foreColor', 'red');
                        }, 50);
                      }
                    }}
                    className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-all ${
                      currentNote.noteType === type.value
                        ? `${type.color} text-white shadow-md`
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <Icon className="w-3 h-3" />
                    {type.value}
                  </button>
                );
              })}
            </div>

            {/* Title input */}
            <input
              type="text"
              value={currentNote.noteTitle}
              onChange={(e) => setCurrentNote(prev => ({ ...prev, noteTitle: e.target.value }))}
              placeholder={`${currentNote.noteType === 'Topic' ? 'Enter topic name' : 'Enter title'}...`}
              className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

            {/* Rich Text Toolbar */}
            <div className="flex items-center gap-1 flex-wrap p-2 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
              <button
                onClick={() => formatText('bold')}
                className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
                title="Bold"
              >
                <Bold className="w-4 h-4" />
              </button>
              <button
                onClick={() => formatText('italic')}
                className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
                title="Italic"
              >
                <Italic className="w-4 h-4" />
              </button>
              <button
                onClick={() => formatText('strikeThrough')}
                className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
                title="Strikethrough"
              >
                <Strikethrough className="w-4 h-4" />
              </button>
              <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1" />

              {/* Text Color */}
              <div className="relative">
                <button
                  onClick={() => {
                    setShowColorPicker(!showColorPicker);
                    setShowHighlightPicker(false);
                  }}
                  className={`p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors ${showColorPicker ? 'bg-gray-200 dark:bg-gray-700' : ''}`}
                  title="Text Color"
                >
                  <Palette className="w-4 h-4 text-gray-700 dark:text-gray-300" />
                </button>
                {showColorPicker && (
                  <div className="absolute bottom-full left-0 mb-2 flex bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg p-2 gap-1 shadow-xl z-20">
                    {['#000000', '#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6', '#EC4899'].map(color => (
                      <button
                        key={color}
                        onClick={() => {
                          formatText('foreColor', color);
                          setShowColorPicker(false);
                        }}
                        className="w-6 h-6 rounded border-2 border-gray-300 hover:border-gray-500 transition-colors hover:scale-110"
                        style={{ backgroundColor: color }}
                        title={`Text color: ${color}`}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Highlighter */}
              <div className="relative">
                <button
                  onClick={() => {
                    setShowHighlightPicker(!showHighlightPicker);
                    setShowColorPicker(false);
                  }}
                  className={`p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors ${showHighlightPicker ? 'bg-gray-200 dark:bg-gray-700' : ''}`}
                  title="Highlight"
                >
                  <Highlighter className="w-4 h-4 text-gray-700 dark:text-gray-300" />
                </button>
                {showHighlightPicker && (
                  <div className="absolute bottom-full left-0 mb-2 flex bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg p-2 gap-1 shadow-xl z-20">
                    {['transparent', '#FEF08A', '#FED7AA', '#BFDBFE', '#C7D2FE', '#DDD6FE', '#FBCFE8'].map(color => (
                      <button
                        key={color}
                        onClick={() => {
                          formatText('backColor', color);
                          setShowHighlightPicker(false);
                        }}
                        className="w-6 h-6 rounded border-2 border-gray-300 hover:border-gray-500 transition-colors hover:scale-110"
                        style={{ backgroundColor: color }}
                        title={`Highlight: ${color}`}
                      />
                    ))}
                  </div>
                )}
              </div>
              <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1" />
              <button
                onClick={() => formatText('formatBlock', 'h1')}
                className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
                title="Heading 1"
              >
                <Heading1 className="w-4 h-4" />
              </button>
              <button
                onClick={() => formatText('formatBlock', 'h2')}
                className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
                title="Heading 2"
              >
                <Heading2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => formatText('insertUnorderedList')}
                className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
                title="Bullet List"
              >
                <List className="w-4 h-4" />
              </button>
              <button
                onClick={() => {
                  formatText('insertOrderedList');
                  // Apply red color for To Do List
                  if (currentNote.noteType === 'To Do List') {
                    setTimeout(() => formatText('foreColor', 'red'), 50);
                  }
                }}
                className={`p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors ${
                  currentNote.noteType === 'To Do List' ? 'bg-orange-100 dark:bg-orange-900' : ''
                }`}
                title="Numbered List"
              >
                <ListOrdered className="w-4 h-4" />
              </button>
              <button
                onClick={() => formatText('indent')}
                className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
                title="Increase Indent (Sub-list)"
              >
                <Indent className="w-4 h-4" />
              </button>
              <button
                onClick={() => formatText('outdent')}
                className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
                title="Decrease Indent"
              >
                <Outdent className="w-4 h-4" />
              </button>
              <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1" />
              <button
                onClick={insertTimestamp}
                className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
                title="Insert timestamp"
              >
                <Clock className="w-4 h-4" />
              </button>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
                title="Add image"
              >
                <ImageIcon className="w-4 h-4" />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => e.target.files && handleFiles(Array.from(e.target.files))}
              />
            </div>

            {/* Content editor - Rich text */}
            <div
              ref={contentEditableRef}
              contentEditable
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
              className="w-full min-h-[200px] max-h-[300px] overflow-y-auto px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              style={{
                whiteSpace: 'pre-wrap',
                wordWrap: 'break-word',
                color: currentNote.noteType === 'To Do List' ? 'red' : undefined
              }}
              data-placeholder={currentNote.noteType === 'To Do List' ? 'Enter your to-do items (press numbered list button for auto-numbering)...' : 'Type your notes here... Use toolbar for formatting'}
            />

            <style>{`
              [contenteditable]:empty:before {
                content: attr(data-placeholder);
                color: #9ca3af;
                pointer-events: none;
              }
              [contenteditable] h1 {
                font-size: 1.5em;
                font-weight: bold;
                margin: 0.5em 0;
              }
              [contenteditable] h2 {
                font-size: 1.3em;
                font-weight: bold;
                margin: 0.5em 0;
              }
              [contenteditable] ul, [contenteditable] ol {
                list-style-position: inside;
                margin: 0.5em 0;
                padding-left: 1.5em;
              }
              [contenteditable] ul {
                list-style-type: disc;
              }
              [contenteditable] ol {
                list-style-type: decimal;
              }
              [contenteditable] li {
                margin: 0.25em 0;
                display: list-item;
              }
              [contenteditable] ul ul, [contenteditable] ol ol {
                padding-left: 2em;
              }
              [contenteditable] ul ul {
                list-style-type: circle;
              }

              /* Style for saved note cards with numbered lists */
              [data-note-id] ol {
                list-style-position: inside;
                margin: 0.5em 0;
                padding-left: 1.5em;
                list-style-type: decimal;
              }
              [data-note-id] ul {
                list-style-position: inside;
                margin: 0.5em 0;
                padding-left: 1.5em;
                list-style-type: disc;
              }
              [data-note-id] li {
                margin: 0.25em 0;
                display: list-item;
                cursor: pointer;
                padding: 0.25em;
                border-radius: 4px;
                transition: background-color 0.2s;
              }
              [data-note-id] li:hover {
                background-color: rgba(0, 0, 0, 0.05);
              }
              .dark [data-note-id] li:hover {
                background-color: rgba(255, 255, 255, 0.05);
              }
            `}</style>

            {/* Image previews */}
            {currentNote.images.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {currentNote.images.map((img, idx) => (
                  <div key={idx} className="relative group">
                    <img
                      src={img}
                      alt="Preview"
                      className="w-16 h-16 object-cover rounded border"
                    />
                    <button
                      onClick={() => {
                        setCurrentNote(prev => ({
                          ...prev,
                          images: prev.images.filter((_, i) => i !== idx)
                        }));
                      }}
                      className="absolute -top-1 -right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

          </div>

          {/* Save button - Fixed at bottom - Transparent Glassmorphism */}
          <div className="flex-shrink-0 p-4 pt-2 border-t border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm">
            <button
              onClick={saveCurrentNote}
              className="relative group w-full overflow-hidden shadow-lg shadow-gray-500/20 dark:shadow-gray-900/40 rounded-xl"
            >
              {/* Glassmorphism layers */}
              <div className="absolute inset-0 bg-gradient-to-br from-white/60 to-white/30 dark:from-gray-800/60 dark:to-gray-900/30 backdrop-blur-xl rounded-xl"></div>
              <div className="absolute inset-0 bg-gradient-to-r from-green-500/30 to-emerald-600/30 rounded-xl"></div>
              <div className="absolute inset-0 border-2 border-white/40 dark:border-gray-700/40 rounded-xl"></div>

              {/* Hover glow effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>

              {/* Button content */}
              <div className="relative py-3 px-4 flex items-center justify-center gap-2 transition-all duration-300 transform group-hover:scale-[1.02] group-active:scale-[0.98]">
                <Save className="w-4 h-4 text-green-600 dark:text-green-400 drop-shadow-lg" />
                <span className="font-semibold text-sm bg-gradient-to-r from-green-600 to-emerald-700 dark:from-green-400 dark:to-emerald-500 bg-clip-text text-transparent drop-shadow-lg">Save Note Card</span>
              </div>
            </button>
          </div>
        </div>

      {/* Image Lightbox Modal */}
      {expandedImage && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setExpandedImage(null)}
        >
          {/* Close button */}
          <button
            onClick={() => setExpandedImage(null)}
            className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition-all hover:scale-110 z-10"
            title="Close (ESC)"
          >
            <X className="w-6 h-6" />
          </button>

          {/* Image container */}
          <div
            className="relative max-w-[90vw] max-h-[90vh] p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={expandedImage}
              alt="Expanded view"
              className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
            />
          </div>

          {/* Instructions */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 bg-white/10 backdrop-blur-md text-white text-sm rounded-full">
            Click anywhere or press ESC to close
          </div>
        </div>
      )}

      {/* Tags Modal */}
      {showTagsModal && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setShowTagsModal(false)}
        >
          <div
            className="relative bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 w-[90%] max-w-md p-6"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Add Tags</h3>
              <button
                onClick={() => setShowTagsModal(false)}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors text-gray-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Current Tags */}
            {tempTags.length > 0 && (
              <div className="mb-4">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Current Tags ({tempTags.length}/3):</p>
                <div className="flex flex-wrap gap-2">
                  {tempTags.map((tag, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                    >
                      {tag}
                      <button
                        onClick={() => removeTag(tag)}
                        className="hover:bg-blue-200 dark:hover:bg-blue-800 rounded-full p-0.5 transition-colors"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Add Tag Dropdown */}
            {tempTags.length < 3 && (
              <div className="mb-4">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  {tempTags.length === 0 ? 'Select at least 1 tag:' : 'Select more tags:'}
                </p>
                <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto">
                  {PREDEFINED_TAGS.map((tag) => (
                    <button
                      key={tag}
                      onClick={() => addPredefinedTag(tag)}
                      disabled={tempTags.includes(tag)}
                      className={`px-3 py-2 text-sm rounded-lg border transition-colors text-left ${
                        tempTags.includes(tag)
                          ? 'bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 border-gray-300 dark:border-gray-600 cursor-not-allowed'
                          : 'bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:border-blue-400 dark:hover:border-blue-500'
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Info Text */}
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
              Add minimum 1 and maximum 3 tags to organize your notes
            </p>

            {/* Action Buttons */}
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setShowTagsModal(false)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={saveTags}
                disabled={tempTags.length === 0}
                className="px-4 py-2 bg-green-500 hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition-colors"
              >
                Save Tags
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
