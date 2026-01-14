import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { Note } from '../../types';
import { useNotes } from '../hooks/useNotes';
import { useAuth } from '../../features/auth/hooks/useAuth';
import toast from 'react-hot-toast';
import {
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Search,
  Pin,
  Tag,
  Calendar,
  Clock,
  FileText,
  CheckSquare,
  X,
  Save,
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  Link as LinkIcon,
  Loader2
} from 'lucide-react';

// Predefined tag options
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
  'URL(s)',
  'Research',
  'Case Study',
  'To-Do',
];

interface TodoItem {
  id: string;
  text: string;
  sessionId: string;
  sessionName: string;
  noteId: string;
  checked: boolean;
}

interface FilterChip {
  type: 'tag' | 'pinned';
  label: string;
  value?: string;
}

export function NotesPage() {
  const { user } = useAuth();
  const { notes, loading, saveNote, togglePin, refetch, updateNoteContent } = useNotes();
  const [navigation, setNavigation] = useState<{
    level: 'term' | 'domain' | 'subject' | 'notes';
    term?: string;
    domain?: string;
    subject?: string;
  }>({ level: 'term' });

  // Notes view state
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilters, setActiveFilters] = useState<FilterChip[]>([]);
  const [editorContent, setEditorContent] = useState('');
  const [editorTags, setEditorTags] = useState<string[]>([]);
  const [editorPinned, setEditorPinned] = useState(false);
  const [editorNoteType, setEditorNoteType] = useState('Topic');
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const editorRef = useRef<HTMLDivElement>(null);
  const [quickNoteExpanded, setQuickNoteExpanded] = useState(false); // Collapsible Quick Note state - collapsed by default

  // Image modal state
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string>('');

  // Countdown timer for newly saved notes
  const [newNoteSaving, setNewNoteSaving] = useState<{noteId: string, secondsRemaining: number} | null>(null);

  // Countdown effect - tick every second
  useEffect(() => {
    if (!newNoteSaving) return;

    if (newNoteSaving.secondsRemaining <= 0) {
      setNewNoteSaving(null);
      // Clear from localStorage when countdown expires
      localStorage.removeItem('newNoteSaving');
      return;
    }

    const timer = setTimeout(() => {
      setNewNoteSaving(prev =>
        prev ? { ...prev, secondsRemaining: prev.secondsRemaining - 1 } : null
      );
    }, 1000);

    return () => clearTimeout(timer);
  }, [newNoteSaving]);

  // Extract todos from notes with "To Do List" in title
  const extractTodos = useCallback((notes: Note[]): TodoItem[] => {
    const todos: TodoItem[] = [];

    notes.forEach(note => {
      // Only extract todos from notes that have "To Do List" in their title
      // Extract note type from noteTitle (format: "Type: Title")
      const noteTitle = note.noteTitle || '';
      const noteType = noteTitle.split(':')[0]?.trim() || '';

      // Skip if note type is not "To Do List"
      if (!note.noteContent || noteType !== 'To Do List') return;

      try {
        const parser = new DOMParser();
        const doc = parser.parseFromString(note.noteContent, 'text/html');

        // Look for list items (<li> elements) - this is what to-do lists use
        const listItems = doc.querySelectorAll('li');

        if (listItems.length > 0) {
          listItems.forEach((li, index) => {
            const htmlLi = li as HTMLElement;
            const text = htmlLi.textContent?.trim() || '';
            const style = htmlLi.getAttribute('style') || '';

            // Check if item has strikethrough (completed)
            const isCompleted = style.includes('text-decoration: line-through') ||
                               style.includes('text-decoration:line-through');

            if (text) {
              todos.push({
                id: `${note.noteId}-${index}`,
                text: text,
                sessionId: note.sessionId || '',
                sessionName: note.sessionName || note.sessionTopic || 'Unknown Session',
                noteId: note.noteId,
                checked: isCompleted
              });
            }
          });
        } else {
          // No list items found - treat as plain text todo items (fallback)
          const textContent = doc.body.textContent || note.noteContent;
          const items = textContent
            .split(/[\n\r]+/)
            .map(item => item.trim())
            .filter(item => item.length > 0);

          items.forEach((item, index) => {
            todos.push({
              id: `${note.noteId}-${index}`,
              text: item,
              sessionId: note.sessionId || '',
              sessionName: note.sessionName || note.sessionTopic || 'Unknown Session',
              noteId: note.noteId,
              checked: false
            });
          });
        }
      } catch (e) {
        console.error('Error extracting todos:', e);
      }
    });

    return todos;
  }, []);

  // Filter notes by navigation
  const filteredNotesByNav = useMemo(() => {
    if (!notes) return [];

    return notes.filter(note => {
      if (navigation.level === 'term') return true;
      if (navigation.level === 'domain' && note.term === navigation.term) return true;
      if (navigation.level === 'subject' && note.term === navigation.term && note.domain === navigation.domain) return true;
      if (navigation.level === 'notes' &&
          note.term === navigation.term &&
          note.domain === navigation.domain &&
          note.subject === navigation.subject) return true;
      return false;
    });
  }, [notes, navigation]);

  // Group notes by term/domain/subject based on navigation level
  const groupedData = useMemo(() => {
    if (navigation.level === 'term') {
      const terms = new Set(filteredNotesByNav.map(n => n.term).filter(Boolean));
      return Array.from(terms).map(term => ({
        key: term!,
        count: filteredNotesByNav.filter(n => n.term === term).length
      }));
    }

    if (navigation.level === 'domain') {
      const domains = new Set(filteredNotesByNav.map(n => n.domain).filter(Boolean));
      return Array.from(domains).map(domain => ({
        key: domain!,
        count: filteredNotesByNav.filter(n => n.domain === domain).length
      }));
    }

    if (navigation.level === 'subject') {
      const subjects = new Set(filteredNotesByNav.map(n => n.subject).filter(Boolean));
      return Array.from(subjects).map(subject => ({
        key: subject!,
        count: filteredNotesByNav.filter(n => n.subject === subject).length
      }));
    }

    return [];
  }, [filteredNotesByNav, navigation.level]);

  // Group notes by session for the final notes view
  const groupedBySession = useMemo(() => {
    if (navigation.level !== 'notes') return {};

    const groups: { [sessionId: string]: Note[] } = {};

    filteredNotesByNav.forEach(note => {
      const sessionId = note.sessionId || 'unknown';
      if (!groups[sessionId]) {
        groups[sessionId] = [];
      }
      groups[sessionId].push(note);
    });

    // Sort notes within each session by timestamp
    Object.keys(groups).forEach(sessionId => {
      groups[sessionId].sort((a, b) => {
        const dateA = new Date(a.lastModified || a.timestamp || 0).getTime();
        const dateB = new Date(b.lastModified || b.timestamp || 0).getTime();
        return dateB - dateA;
      });
    });

    return groups;
  }, [filteredNotesByNav, navigation.level]);

  // Separate Quick Notes from Session Notes
  const { quickNotes, sessionNotes } = useMemo(() => {
    if (navigation.level !== 'notes') return { quickNotes: [], sessionNotes: {} };

    const quick: Note[] = [];
    const sessions: { [sessionId: string]: Note[] } = {};

    Object.entries(groupedBySession).forEach(([sessionId, notes]) => {
      if (sessionId.startsWith('quick-note-')) {
        // Add to quick notes array
        quick.push(...notes);
      } else {
        // Add to regular sessions
        sessions[sessionId] = notes;
      }
    });

    return { quickNotes: quick, sessionNotes: sessions };
  }, [groupedBySession, navigation.level]);

  // Apply filters and search highlighting
  const displayedSessions = useMemo(() => {
    if (navigation.level !== 'notes') return {};

    let sessions = { ...sessionNotes };

    // Apply search query filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      Object.keys(sessions).forEach(sessionId => {
        sessions[sessionId] = sessions[sessionId].filter(note => {
          // Search in note title, content, and tags
          const searchableText = [
            note.noteTitle,
            note.noteContent,
            note.noteTags,
            note.sessionName
          ].filter(Boolean).join(' ').toLowerCase();

          return searchableText.includes(query);
        });

        // Remove empty sessions
        if (sessions[sessionId].length === 0) {
          delete sessions[sessionId];
        }
      });
    }

    // Apply filter chips
    if (activeFilters.length > 0) {
      Object.keys(sessions).forEach(sessionId => {
        sessions[sessionId] = sessions[sessionId].filter(note => {
          for (const filter of activeFilters) {
            if (filter.type === 'pinned' && !note.isPinned) return false;
            if (filter.type === 'tag' && filter.value && !note.noteTags?.includes(filter.value)) return false;
          }
          return true;
        });

        // Remove empty sessions
        if (sessions[sessionId].length === 0) {
          delete sessions[sessionId];
        }
      });
    }

    return sessions;
  }, [sessionNotes, activeFilters, searchQuery, navigation.level]);

  // Apply filters to Quick Notes
  const displayedQuickNotes = useMemo(() => {
    if (navigation.level !== 'notes') return [];

    let filtered = [...quickNotes];

    // Apply search query filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(note => {
        const searchableText = [
          note.noteTitle,
          note.noteContent,
          note.noteTags
        ].filter(Boolean).join(' ').toLowerCase();

        return searchableText.includes(query);
      });
    }

    // Apply filter chips
    if (activeFilters.length > 0) {
      filtered = filtered.filter(note => {
        for (const filter of activeFilters) {
          if (filter.type === 'pinned' && !note.isPinned) return false;
          if (filter.type === 'tag' && filter.value && !note.noteTags?.includes(filter.value)) return false;
        }
        return true;
      });
    }

    // Sort by last modified (most recent first)
    return filtered.sort((a, b) => {
      const dateA = new Date(a.lastModified || 0).getTime();
      const dateB = new Date(b.lastModified || 0).getTime();
      return dateB - dateA;
    });
  }, [quickNotes, activeFilters, searchQuery, navigation.level]);

  // Highlight search matches in content
  const highlightSearchMatches = useCallback((content: string): string => {
    if (!searchQuery.trim()) return content;

    const regex = new RegExp(`(${searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    return content.replace(regex, '<mark class="bg-yellow-300 text-gray-900">$1</mark>');
  }, [searchQuery]);

  // Extract unique tags from all notes
  const allTags = useMemo(() => {
    const tags = new Set<string>();
    filteredNotesByNav.forEach(note => {
      if (note.noteTags) {
        note.noteTags.split(',').forEach(tag => {
          const trimmed = tag.trim();
          if (trimmed) tags.add(trimmed);
        });
      }
    });
    return Array.from(tags);
  }, [filteredNotesByNav]);

  // Todos for sidebar
  const todos = useMemo(() => {
    return extractTodos(filteredNotesByNav);
  }, [filteredNotesByNav, extractTodos]);

  // Group todos by session
  const todosBySession = useMemo(() => {
    const grouped: { [sessionName: string]: TodoItem[] } = {};
    todos.forEach(todo => {
      const sessionName = todo.sessionName || 'Unknown Session';
      if (!grouped[sessionName]) {
        grouped[sessionName] = [];
      }
      grouped[sessionName].push(todo);
    });
    return grouped;
  }, [todos]);

  // Create session map for quick lookup
  // Navigation handlers
  const handleNavigate = (level: 'term' | 'domain' | 'subject' | 'notes', _key?: string) => {
    if (level === 'term') {
      setNavigation({ level: 'term' });
    } else if (level === 'domain') {
      setNavigation({ level: 'domain', term: navigation.term });
    } else if (level === 'subject') {
      setNavigation({ level: 'subject', term: navigation.term, domain: navigation.domain });
    } else if (level === 'notes') {
      setNavigation({ ...navigation, level: 'notes' });
    }
  };

  const handleSelectItem = (key: string) => {
    if (navigation.level === 'term') {
      setNavigation({ level: 'domain', term: key });
    } else if (navigation.level === 'domain') {
      setNavigation({ level: 'subject', term: navigation.term, domain: key });
    } else if (navigation.level === 'subject') {
      setNavigation({ level: 'notes', term: navigation.term, domain: navigation.domain, subject: key });
    }
  };

  // Filter handlers
  const addFilter = (filter: FilterChip) => {
    if (!activeFilters.find(f => f.type === filter.type && f.value === filter.value)) {
      setActiveFilters([...activeFilters, filter]);
    }
  };

  const removeFilter = (filter: FilterChip) => {
    setActiveFilters(activeFilters.filter(f => !(f.type === filter.type && f.value === filter.value)));
  };

  // Editor handlers
  const handleSaveNote = async () => {
    if (!editorContent.trim() || !user?.email) return;

    setSaving(true);
    try {
      let sessionId: string;
      let sessionName: string;

      if (editingNoteId) {
        // Editing existing note
        const existingNote = filteredNotesByNav.find(n => n.noteId === editingNoteId);
        sessionId = existingNote?.sessionId || '';
        sessionName = existingNote?.sessionName || '';
      } else {
        // Creating new quick note - use generic session info
        sessionId = `quick-note-${Date.now()}`;
        sessionName = 'Quick Note';
      }

      const noteData = {
        studentId: user.email,
        sessionId,
        batch: user.batch || '',
        term: navigation.term,
        domain: navigation.domain,
        subject: navigation.subject,
        sessionName,
        noteContent: editorContent,
        noteTags: editorTags.join(','),
        noteTitle: editorNoteType,
        isPinned: editorPinned,
        noteId: editingNoteId || undefined
      };

      console.log('💾 Saving Quick Note:', noteData);

      const result = await saveNote(noteData, false); // Don't skip refetch for new notes
      console.log('✅ Quick Note saved:', result);

      // Clear editor
      setEditorContent('');
      setEditorTags([]);
      setEditorPinned(false);
      setEditorNoteType('Topic');
      setEditingNoteId(null);

      if (editorRef.current) {
        editorRef.current.innerHTML = '';
      }

      // Only refetch if it's a new note (not an update)
      if (!editingNoteId) {
        // Add a small delay to ensure backend finishes writing to Google Sheets
        // This prevents race condition where user tries to add tags before note is fully saved
        await new Promise(resolve => setTimeout(resolve, 1500));
        await refetch();

        // After refetch, find the newly saved note by matching content and timestamp
        // Since we don't have the real noteId yet, we'll look for the most recent note
        // with matching session and content
        setTimeout(() => {
          const recentNotes = notes.filter(n =>
            n.sessionId === sessionId &&
            n.noteContent === editorContent
          ).sort((a, b) => {
            const dateA = new Date(a.lastModified || 0).getTime();
            const dateB = new Date(b.lastModified || 0).getTime();
            return dateB - dateA;
          });

          if (recentNotes.length > 0) {
            const newNote = recentNotes[0];
            // Start countdown timer for 10 seconds
            const countdownData = {
              noteId: newNote.noteId,
              expiresAt: Date.now() + 10000 // 10 seconds from now
            };
            setNewNoteSaving({ noteId: newNote.noteId, secondsRemaining: 10 });

            // Store in localStorage so other components (like NotesPopup) can access it
            localStorage.setItem('newNoteSaving', JSON.stringify(countdownData));
          }
        }, 500); // Small delay to ensure refetch has completed
      }
    } catch (error) {
      console.error('Failed to save note:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleClearEditor = () => {
    setEditorContent('');
    setEditorTags([]);
    setEditorPinned(false);
    setEditingNoteId(null);

    if (editorRef.current) {
      editorRef.current.innerHTML = '';
    }
  };

  const handleTogglePin = async (e: React.MouseEvent, noteId: string) => {
    e.preventDefault();
    e.stopPropagation();

    // Update in backend without refreshing
    await togglePin(noteId);
  };

  const handleToggleTodo = async (todo: TodoItem) => {
    // Find the note containing this todo
    const note = notes?.find(n => n.noteId === todo.noteId);
    if (!note || !note.noteContent) return;

    // Store original content for rollback
    const originalContent = note.noteContent;

    try {
      // Parse the note content and toggle the list item style
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = note.noteContent;

      // Find all list items
      let allListItems = Array.from(tempDiv.querySelectorAll('li'));

      // If no list items exist, convert plain text to list items
      if (allListItems.length === 0) {
        const textContent = tempDiv.textContent || note.noteContent;
        const items = textContent
          .split(/[\n\r]+/)
          .map(item => item.trim())
          .filter(item => item.length > 0);

        if (items.length > 0) {
          const ol = document.createElement('ol');
          items.forEach(item => {
            const li = document.createElement('li');
            li.textContent = item;
            li.setAttribute('style', 'color: red;'); // Default to uncompleted
            ol.appendChild(li);
          });
          tempDiv.innerHTML = '';
          tempDiv.appendChild(ol);
          allListItems = Array.from(tempDiv.querySelectorAll('li'));
        }
      }

      // Find the list item by index (extracted from todo.id)
      const index = parseInt(todo.id.split('-').pop() || '0');

      if (index >= 0 && index < allListItems.length) {
        const targetItem = allListItems[index] as HTMLElement;
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

        // Optimistic update - update UI immediately without refetching
        updateNoteContent(note.noteId, updatedContent);

        console.log('💾 Saving todo note:', {
          noteId: note.noteId,
          noteTitle: note.noteTitle,
          sessionId: note.sessionId,
          studentId: user?.email
        });

        // Update the note in the database (background, skip refetch)
        const saveResult = await saveNote({
          studentId: user?.email || '',
          sessionId: note.sessionId || '',
          noteContent: updatedContent,
          noteTags: note.noteTags || '',
          noteTitle: note.noteTitle || '',
          noteId: note.noteId,
          batch: note.batch,
          term: note.term,
          domain: note.domain,
          subject: note.subject,
          sessionName: note.sessionName,
          isPinned: note.isPinned === true || note.isPinned === 'Yes'
        }, true); // Skip refetch

        console.log('✅ Save result:', saveResult);
      }
    } catch (error) {
      console.error('Error toggling todo:', error);
      toast.error('Failed to update todo');
      // Rollback to original content
      updateNoteContent(note.noteId, originalContent);
    }
  };

  // Rich text editor commands
  const execCommand = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
  };

  // Update editor content on blur
  const handleEditorBlur = () => {
    if (editorRef.current) {
      setEditorContent(editorRef.current.innerHTML);
    }
  };

  // Handle checkbox clicks in Quick Note editor
  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) return;

    const handleCheckboxClick = (e: Event) => {
      const target = e.target as HTMLInputElement;
      if (target.type === 'checkbox') {
        const label = target.parentElement;
        if (label) {
          if (target.checked) {
            // Apply strikethrough and green color
            label.style.textDecoration = 'line-through';
            label.style.color = '#16a34a'; // green-600
          } else {
            // Remove strikethrough and apply red color
            label.style.textDecoration = 'none';
            label.style.color = '#dc2626'; // red-600
          }
        }
        // Trigger save on checkbox change
        handleEditorBlur();
      }
    };

    editor.addEventListener('click', handleCheckboxClick);
    return () => {
      editor.removeEventListener('click', handleCheckboxClick);
    };
  }, []);

  // Apply styling to existing checkboxes when content loads
  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) return;

    const checkboxes = editor.querySelectorAll('input[type="checkbox"]');
    checkboxes.forEach((checkbox) => {
      const input = checkbox as HTMLInputElement;
      const label = input.parentElement;
      if (label) {
        if (input.checked) {
          label.style.textDecoration = 'line-through';
          label.style.color = '#16a34a'; // green-600
        } else {
          label.style.textDecoration = 'none';
          label.style.color = '#dc2626'; // red-600
        }
      }
    });
  }, [editorContent]);

  // Render navigation view (term/domain/subject)
  if (navigation.level !== 'notes') {
    return (
      <div className="p-6 space-y-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <button
            onClick={() => handleNavigate('term')}
            className={`hover:text-foreground transition-colors ${navigation.level === 'term' ? 'text-foreground font-semibold' : ''}`}
          >
            My Notes
          </button>
          {navigation.term && (
            <>
              <ChevronRight className="w-4 h-4" />
              <button
                onClick={() => handleNavigate('domain')}
                className={`hover:text-foreground transition-colors ${navigation.level === 'domain' ? 'text-foreground font-semibold' : ''}`}
              >
                {navigation.term}
              </button>
            </>
          )}
          {navigation.domain && (
            <>
              <ChevronRight className="w-4 h-4" />
              <button
                onClick={() => handleNavigate('subject')}
                className={`hover:text-foreground transition-colors ${navigation.level === 'subject' ? 'text-foreground font-semibold' : ''}`}
              >
                {navigation.domain}
              </button>
            </>
          )}
        </div>

        {/* Title */}
        <div>
          <h1 className="text-2xl font-bold text-foreground mb-1">
            {navigation.level === 'term' && 'Select Term'}
            {navigation.level === 'domain' && 'Select Domain'}
            {navigation.level === 'subject' && 'Select Subject'}
          </h1>
          <p className="text-sm text-muted-foreground">Browse your notes by category</p>
        </div>

        {/* Grid of items */}
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {groupedData.map(item => (
              <button
                key={item.key}
                onClick={() => handleSelectItem(item.key)}
                className="relative overflow-hidden rounded-2xl p-6 bg-gradient-to-br from-white/70 to-white/40 dark:from-gray-900/70 dark:to-gray-800/40 backdrop-blur-2xl border border-white/20 dark:border-gray-700/30 text-left hover:scale-105 transition-all duration-200 group"
              >
                <h3 className="text-lg font-semibold text-foreground mb-2 group-hover:text-primary transition-colors">{item.key}</h3>
                <p className="text-sm text-muted-foreground">{item.count} {item.count === 1 ? 'note' : 'notes'}</p>
                <ChevronRight className="absolute top-6 right-6 w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Render notes view with session grouping
  return (
    <div className="h-screen flex flex-col">
      {/* Fixed Header */}
      <div className="flex-shrink-0 p-6 pb-0 space-y-4">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm">
          <button onClick={() => handleNavigate('term')} className="text-foreground/70 hover:text-foreground font-medium transition-colors">
            My Notes
          </button>
          <ChevronRight className="w-4 h-4 text-foreground/50" />
          <button onClick={() => handleNavigate('domain')} className="text-foreground/70 hover:text-foreground font-medium transition-colors">
            {navigation.term}
          </button>
          <ChevronRight className="w-4 h-4 text-foreground/50" />
          <button onClick={() => handleNavigate('subject')} className="text-foreground/70 hover:text-foreground font-medium transition-colors">
            {navigation.domain}
          </button>
          <ChevronRight className="w-4 h-4 text-foreground/50" />
          <span className="text-foreground font-semibold">{navigation.subject}</span>
        </div>

      {/* Header with Search */}
      <div className="relative overflow-hidden rounded-2xl p-6 bg-gradient-to-br from-white/70 to-white/40 dark:from-gray-900/70 dark:to-gray-800/40 backdrop-blur-2xl border border-white/20 dark:border-gray-700/30">
        <div className="space-y-4">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search notes (highlights matches)..."
              className="w-full pl-9 pr-4 py-2 rounded-lg bg-white/50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>

          {/* Filter Chips Row */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-foreground">Quick Filters</h3>
              {activeFilters.length > 0 && (
                <button
                  onClick={() => setActiveFilters([])}
                  className="text-xs text-primary hover:text-primary/80 font-medium"
                >
                  Clear filters
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => addFilter({ type: 'pinned', label: 'Pinned' })}
                className="px-3 py-1.5 bg-primary/10 hover:bg-primary/20 border border-primary/20 rounded-lg text-xs font-medium text-primary transition-colors"
              >
                <Pin className="w-3 h-3 inline mr-1" />
                Pinned
              </button>
              {allTags.slice(0, 5).map(tag => (
                <button
                  key={tag}
                  onClick={() => addFilter({ type: 'tag', label: tag, value: tag })}
                  className="px-3 py-1.5 bg-primary/10 hover:bg-primary/20 border border-primary/20 rounded-lg text-xs font-medium text-primary transition-colors"
                >
                  <Tag className="w-3 h-3 inline mr-1" />
                  {tag}
                </button>
              ))}
            </div>

            {/* Active Filters */}
            {activeFilters.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {activeFilters.map((filter, idx) => (
                  <div key={idx} className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/20 border border-primary/30 rounded-lg text-xs font-medium text-foreground">
                    {filter.label}
                    <button onClick={() => removeFilter(filter)} className="hover:text-destructive transition-colors">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Note Editor - Fixed at top */}
      <div className="relative overflow-hidden rounded-2xl p-6 bg-gradient-to-br from-white/90 to-white/70 dark:from-gray-900/70 dark:to-gray-800/40 backdrop-blur-2xl border border-gray-300/70 dark:border-gray-700/30 shadow-sm mt-6">
        <div className="space-y-4">
          {/* Header with Toggle Button - Clickable bar */}
          <div
            onClick={() => setQuickNoteExpanded(!quickNoteExpanded)}
            className="flex items-center justify-between cursor-pointer hover:bg-white/50 dark:hover:bg-gray-800/50 rounded-lg p-2 -m-2 transition-colors"
          >
            <h3 className="text-lg font-bold text-foreground">Quick Note</h3>
            <div className="p-2 rounded-lg" title={quickNoteExpanded ? "Collapse" : "Expand"}>
              {quickNoteExpanded ? (
                <ChevronUp className="w-5 h-5 text-foreground" />
              ) : (
                <ChevronDown className="w-5 h-5 text-foreground" />
              )}
            </div>
          </div>

          {/* Collapsible Content */}
          {quickNoteExpanded && (
            <>
              {/* Note Type Dropdown */}
              <div className="flex items-center gap-3">
                <label className="text-sm font-medium text-foreground whitespace-nowrap">Note Type:</label>
                <select
                  value={editorNoteType}
                  onChange={(e) => setEditorNoteType(e.target.value)}
                  className="flex-1 px-3 py-2 rounded-lg bg-white/50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                >
                  <option value="Topic">Topic</option>
                  <option value="To Do List">To Do List</option>
                  <option value="Important">Important</option>
                  <option value="Question">Question</option>
                  <option value="Keywords">Keywords</option>
                  <option value="Pointers">Pointers</option>
                </select>
              </div>

              {/* Rich Text Toolbar */}
          <div className="flex items-center gap-1 p-2 rounded-lg bg-white/50 dark:bg-gray-800/50 border border-gray-200/50 dark:border-gray-700/50">
            <button onClick={() => execCommand('bold')} className="p-2 hover:bg-primary/10 rounded transition-colors" title="Bold">
              <Bold className="w-4 h-4 text-muted-foreground" />
            </button>
            <button onClick={() => execCommand('italic')} className="p-2 hover:bg-primary/10 rounded transition-colors" title="Italic">
              <Italic className="w-4 h-4 text-muted-foreground" />
            </button>
            <button onClick={() => execCommand('underline')} className="p-2 hover:bg-primary/10 rounded transition-colors" title="Underline">
              <Underline className="w-4 h-4 text-muted-foreground" />
            </button>
            <div className="w-px h-6 bg-gray-200 dark:bg-gray-700" />
            <button onClick={() => execCommand('insertUnorderedList')} className="p-2 hover:bg-primary/10 rounded transition-colors" title="Bullet List">
              <List className="w-4 h-4 text-muted-foreground" />
            </button>
            <button onClick={() => execCommand('insertOrderedList')} className="p-2 hover:bg-primary/10 rounded transition-colors" title="Numbered List">
              <ListOrdered className="w-4 h-4 text-muted-foreground" />
            </button>
            <div className="w-px h-6 bg-gray-200 dark:bg-gray-700" />
            <button
              onClick={() => {
                const url = prompt('Enter URL:');
                if (url) execCommand('createLink', url);
              }}
              className="p-2 hover:bg-primary/10 rounded transition-colors"
              title="Hyperlink"
            >
              <LinkIcon className="w-4 h-4 text-muted-foreground" />
            </button>
            <button
              onClick={() => {
                const selection = window.getSelection();
                if (selection && selection.rangeCount > 0) {
                  execCommand('backColor', '#FFFF00'); // Yellow highlight
                }
              }}
              className="p-2 hover:bg-primary/10 rounded transition-colors"
              title="Highlight Text"
            >
              <div className="w-4 h-4 text-muted-foreground relative">
                <div className="absolute inset-0 bg-yellow-300 opacity-40 rounded" />
                <span className="relative text-[10px] font-bold">A</span>
              </div>
            </button>
          </div>

          {/* Editor */}
          <div
            ref={editorRef}
            contentEditable
            onBlur={handleEditorBlur}
            onInput={handleEditorBlur}
            className="min-h-[80px] max-h-[120px] overflow-y-auto px-4 py-3 rounded-lg bg-white/50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 prose prose-sm dark:prose-invert max-w-none empty:before:content-['Start_typing_your_note...'] empty:before:text-muted-foreground"
            suppressContentEditableWarning
          />

          {/* Tags and Pin */}
          <div className="flex items-center gap-3">
            <div className="flex-1">
              {/* Multi-select dropdown for tags */}
              <div className="relative">
                <div className="flex flex-wrap gap-2 px-3 py-2 rounded-lg bg-white/50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 text-sm min-h-[42px]">
                  {editorTags.length > 0 ? (
                    editorTags.map(tag => (
                      <span
                        key={tag}
                        className="inline-flex items-center gap-1 px-2 py-0.5 bg-primary/20 text-primary rounded-md text-xs font-medium"
                      >
                        {tag}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditorTags(editorTags.filter(t => t !== tag));
                          }}
                          className="hover:text-primary/80"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))
                  ) : (
                    <span className="text-muted-foreground">Select tags...</span>
                  )}
                </div>
                <select
                  value=""
                  onChange={(e) => {
                    if (e.target.value && !editorTags.includes(e.target.value)) {
                      setEditorTags([...editorTags, e.target.value]);
                    }
                  }}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                >
                  <option value="">Select tag...</option>
                  {PREDEFINED_TAGS.map(tag => (
                    <option key={tag} value={tag}>{tag}</option>
                  ))}
                </select>
              </div>
            </div>
            <label className="flex items-center gap-2 cursor-pointer px-3 py-2 rounded-lg hover:bg-white/50 dark:hover:bg-gray-800/50 transition-colors">
              <input
                type="checkbox"
                checked={editorPinned}
                onChange={(e) => setEditorPinned(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-amber-500 focus:ring-amber-500"
              />
              <span className="text-sm text-foreground font-medium whitespace-nowrap">Pin Note</span>
            </label>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2">
            <button
              onClick={handleClearEditor}
              className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-white/50 dark:hover:bg-gray-800/50 rounded-lg transition-colors"
            >
              Clear
            </button>
            <button
              onClick={handleSaveNote}
              disabled={saving || !editorContent.trim()}
              className="px-6 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg text-sm font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Save Note
                </>
              )}
            </button>
          </div>
            </>
          )}
        </div>
      </div>
      </div>

      {/* Scrollable Content Area */}
      <div className="flex-1 overflow-y-auto p-6 pt-0">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mt-6">
        {/* Left Sidebar - Todo List */}
        <div className="lg:col-span-1">
          <div className="relative overflow-hidden rounded-2xl p-6 bg-gradient-to-br from-white/70 to-white/40 dark:from-gray-900/70 dark:to-gray-800/40 backdrop-blur-2xl border border-white/20 dark:border-gray-700/30 sticky top-6">
            <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
              <CheckSquare className="w-4 h-4" />
              Todo List ({todos.filter(t => !t.checked).length}/{todos.length})
            </h3>
            {todos.length === 0 ? (
              <p className="text-xs text-muted-foreground">No todos found</p>
            ) : (
              <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
                {Object.entries(todosBySession).map(([sessionName, sessionTodos]) => (
                  <div key={sessionName} className="space-y-2">
                    {/* Session Header */}
                    <div className="sticky top-0 bg-gradient-to-r from-white/90 to-white/70 dark:from-gray-900/90 dark:to-gray-800/70 backdrop-blur-sm px-2 py-1.5 rounded-md border-l-2 border-primary">
                      <h4 className="text-xs font-semibold text-foreground truncate">{sessionName}</h4>
                      <p className="text-[10px] text-muted-foreground">
                        {sessionTodos.filter(t => !t.checked).length}/{sessionTodos.length} remaining
                      </p>
                    </div>

                    {/* Todo Items for this session */}
                    {sessionTodos.map(todo => (
                      <div
                        key={`${todo.id}-${todo.checked}`}
                        onClick={() => handleToggleTodo(todo)}
                        className="p-3 rounded-lg bg-white/80 dark:bg-gray-800/50 border border-gray-300/70 dark:border-gray-700/50 cursor-pointer hover:bg-white/90 dark:hover:bg-gray-800/70 transition-colors shadow-sm ml-2"
                      >
                        <p
                          className={`text-sm line-clamp-2 font-medium ${
                            todo.checked
                              ? 'text-green-600 dark:text-green-400 line-through'
                              : 'text-red-600 dark:text-red-400'
                          }`}
                        >
                          • {todo.text}
                        </p>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Content - Session Cards */}
        <div className="lg:col-span-3">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : (displayedQuickNotes.length === 0 && Object.keys(displayedSessions).length === 0) ? (
            <div className="relative overflow-hidden rounded-2xl p-12 bg-gradient-to-br from-white/70 to-white/40 dark:from-gray-900/70 dark:to-gray-800/40 backdrop-blur-2xl border border-white/20 dark:border-gray-700/30 text-center">
              <FileText className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-lg font-semibold text-foreground mb-2">No notes found</h3>
              <p className="text-sm text-muted-foreground">Start taking notes in your sessions!</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Quick Notes Section */}
              {displayedQuickNotes.length > 0 && (
                <div className="relative overflow-hidden rounded-2xl p-8 bg-gradient-to-br from-amber-50/90 to-amber-50/70 dark:from-amber-900/20 dark:to-amber-800/10 backdrop-blur-2xl border border-amber-300/60 dark:border-amber-700/30 shadow-sm">
                  {/* Quick Notes Header */}
                  <div className="mb-6 pb-4 border-b border-amber-300/60 dark:border-amber-700/50">
                    <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                      <FileText className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                      Quick Notes ({displayedQuickNotes.length})
                    </h3>
                  </div>

                  {/* Quick Notes Cards Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {displayedQuickNotes.map(note => {
                      // Extract note type from noteTitle (format: "Type: Title" or just "Type")
                      const noteTitle = note.noteTitle || '';
                      const titleParts = noteTitle.split(':');
                      const noteType = titleParts[0]?.trim() || 'Topic';
                      const displayTitle = titleParts.length > 1 ? titleParts.slice(1).join(':').trim() : noteTitle;

                      return (
                        <div key={note.noteId} className="p-4 rounded-lg bg-white/90 dark:bg-gray-800/60 border border-amber-300/70 dark:border-amber-700/50 group shadow-sm hover:shadow-md transition-shadow">
                          {/* Compact Header */}
                          <div className="flex items-center justify-between mb-2 gap-3">
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              {/* Title */}
                              <h4 className="font-semibold text-sm text-foreground truncate flex-shrink">
                                {displayTitle || noteType}
                              </h4>

                              {/* Type Badge */}
                              <span className={`px-2.5 py-1 rounded-md text-xs font-semibold flex-shrink-0 border ${
                                noteType === 'To Do List'
                                  ? 'bg-orange-100 text-orange-800 border-orange-300 dark:bg-orange-900/50 dark:text-orange-300 dark:border-orange-700'
                                  : noteType === 'Important'
                                  ? 'bg-red-100 text-red-800 border-red-300 dark:bg-red-900/50 dark:text-red-300 dark:border-red-700'
                                  : noteType === 'Question'
                                  ? 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900/50 dark:text-blue-300 dark:border-blue-700'
                                  : noteType === 'Keywords'
                                  ? 'bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-900/50 dark:text-yellow-300 dark:border-yellow-700'
                                  : noteType === 'Pointers'
                                  ? 'bg-green-100 text-green-800 border-green-300 dark:bg-green-900/50 dark:text-green-300 dark:border-green-700'
                                  : 'bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-900/50 dark:text-purple-300 dark:border-purple-700'
                              }`}>
                                {noteType}
                              </span>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-1 flex-shrink-0">
                              <button
                                onClick={(e) => handleTogglePin(e, note.noteId)}
                                className={`p-1 rounded transition-colors ${
                                  note.isPinned === 'Yes' || note.isPinned === true
                                    ? 'text-amber-500 hover:bg-amber-500/10'
                                    : 'text-muted-foreground hover:text-amber-500 hover:bg-amber-500/10'
                                }`}
                                title={note.isPinned === 'Yes' || note.isPinned === true ? 'Unpin' : 'Pin'}
                              >
                                <Pin className={`w-3.5 h-3.5 ${note.isPinned === 'Yes' || note.isPinned === true ? 'fill-amber-500' : ''}`} />
                              </button>
                            </div>
                          </div>

                          {/* Timestamp */}
                          <p className="text-xs text-muted-foreground mb-2">
                            {note.lastModified ? new Date(note.lastModified).toLocaleString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            }) : ''}
                          </p>

                          {/* Tags Row (if any) */}
                          {note.noteTags && (
                            <div className="flex gap-1 mb-2 flex-wrap">
                              {note.noteTags.split(',').map((tag, i) => (
                                <span key={i} className="px-2 py-0.5 bg-primary/10 border border-primary/20 rounded text-xs font-medium text-primary">
                                  {tag.trim()}
                                </span>
                              ))}
                            </div>
                          )}

                          {/* Countdown timer for newly saved notes */}
                          {newNoteSaving && newNoteSaving.noteId === note.noteId && newNoteSaving.secondsRemaining > 0 && (
                            <div className="flex items-center gap-2 mb-2 px-2 py-1.5 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded text-xs">
                              <Clock className="h-3.5 w-3.5 text-yellow-600 dark:text-yellow-500" />
                              <span className="text-yellow-700 dark:text-yellow-400 font-medium">
                                Wait {newNoteSaving.secondsRemaining}s to add tags
                              </span>
                            </div>
                          )}

                          {/* Note Content - Truncated */}
                          <div
                            className="text-sm text-foreground prose prose-sm dark:prose-invert max-w-none line-clamp-3 mb-2"
                            dangerouslySetInnerHTML={{
                              __html: highlightSearchMatches(note.noteContent)
                            }}
                          />

                          {/* Image Thumbnails */}
                          {(() => {
                            // Get images from two sources: noteContent HTML and images field
                            const allImages: string[] = [];

                            // 1. Extract from noteContent HTML
                            const parser = new DOMParser();
                            const doc = parser.parseFromString(note.noteContent, 'text/html');
                            const htmlImages = Array.from(doc.querySelectorAll('img'));
                            htmlImages.forEach(img => {
                              const src = (img as HTMLImageElement).src;
                              if (src) allImages.push(src);
                            });

                            // 2. Extract from images field (comma-separated URLs)
                            if (note.images) {
                              const imageUrls = note.images.split(',').map(url => url.trim()).filter(url => url);
                              allImages.push(...imageUrls);
                            }

                            // Remove duplicates
                            const uniqueImages = Array.from(new Set(allImages));

                            if (uniqueImages.length > 0) {
                              return (
                                <div className="flex gap-2 flex-wrap mt-2">
                                  {uniqueImages.slice(0, 3).map((src, idx) => (
                                    <img
                                      key={idx}
                                      src={src}
                                      alt={`thumbnail-${idx}`}
                                      className="w-16 h-16 object-cover rounded border border-gray-300 dark:border-gray-600 cursor-pointer hover:opacity-80 transition-opacity"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setSelectedImage(src);
                                        setImageModalOpen(true);
                                      }}
                                    />
                                  ))}
                                  {uniqueImages.length > 3 && (
                                    <div className="w-16 h-16 flex items-center justify-center rounded border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-800 text-xs text-muted-foreground">
                                      +{uniqueImages.length - 3}
                                    </div>
                                  )}
                                </div>
                              );
                            }
                            return null;
                          })()}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Session Notes */}
              {Object.entries(displayedSessions).map(([sessionId, sessionNotes]) => {
                const firstNote = sessionNotes[0];

                return (
                  <div key={sessionId} className="relative overflow-hidden rounded-2xl p-8 bg-gradient-to-br from-white/90 to-white/70 dark:from-gray-900/70 dark:to-gray-800/40 backdrop-blur-2xl border border-gray-300/60 dark:border-gray-700/30 shadow-sm">
                    {/* Session Header - Horizontal Format */}
                    <div className="mb-6 pb-4 border-b border-gray-300/60 dark:border-gray-700/50">
                      <div className="flex items-center gap-3 text-foreground flex-wrap">
                        <h3 className="text-lg font-bold">
                          {firstNote.sessionName || firstNote.sessionTopic || 'Untitled Session'}
                        </h3>
                        <span className="text-muted-foreground">|</span>
                        <span className="text-sm flex items-center gap-1.5">
                          <Calendar className="w-4 h-4" />
                          {firstNote.date ? new Date(firstNote.date).toLocaleDateString('en-US', {
                            weekday: 'short',
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          }) : 'No date'}
                        </span>
                        <span className="text-muted-foreground">|</span>
                        <span className="text-sm flex items-center gap-1.5">
                          <Clock className="w-4 h-4" />
                          {firstNote.startTime ? new Date(firstNote.startTime).toLocaleTimeString('en-US', {
                            hour: '2-digit',
                            minute: '2-digit',
                            hour12: true
                          }) : 'No time'}
                        </span>
                      </div>
                    </div>

                    {/* Notes in Session */}
                    <div className="space-y-2">
                      {sessionNotes.map(note => {
                        // Extract note type from noteTitle (format: "Type: Title" or just "Type")
                        const noteTitle = note.noteTitle || '';
                        const titleParts = noteTitle.split(':');
                        const noteType = titleParts[0]?.trim() || 'Topic';
                        const displayTitle = titleParts.length > 1 ? titleParts.slice(1).join(':').trim() : noteTitle;

                        return <div key={note.noteId} className="p-3 rounded-lg bg-white/80 dark:bg-gray-800/50 border border-gray-300/70 dark:border-gray-700/50 group shadow-sm">
                          {/* Compact Header - Title, Type, and Timestamp in one line */}
                          <div className="flex items-center justify-between mb-2 gap-3">
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              {/* Title */}
                              <h4 className="font-semibold text-sm text-foreground truncate flex-shrink">
                                {displayTitle || noteType}
                              </h4>

                              {/* Type Badge (Note Type from title) */}
                              <span className={`px-2.5 py-1 rounded-md text-xs font-semibold flex-shrink-0 border ${
                                noteType === 'To Do List'
                                  ? 'bg-orange-100 text-orange-800 border-orange-300 dark:bg-orange-900/50 dark:text-orange-300 dark:border-orange-700'
                                  : noteType === 'Important'
                                  ? 'bg-red-100 text-red-800 border-red-300 dark:bg-red-900/50 dark:text-red-300 dark:border-red-700'
                                  : noteType === 'Question'
                                  ? 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900/50 dark:text-blue-300 dark:border-blue-700'
                                  : noteType === 'Keywords'
                                  ? 'bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-900/50 dark:text-yellow-300 dark:border-yellow-700'
                                  : noteType === 'Pointers'
                                  ? 'bg-green-100 text-green-800 border-green-300 dark:bg-green-900/50 dark:text-green-300 dark:border-green-700'
                                  : 'bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-900/50 dark:text-purple-300 dark:border-purple-700'
                              }`}>
                                {noteType}
                              </span>

                              {/* Session Type Badge (Live Session/Recording/My Notes) */}
                              {note.type && (
                                <span className={`px-2.5 py-1 rounded-md text-xs font-semibold flex-shrink-0 border ${
                                  note.type === 'Live Session'
                                    ? 'bg-green-100 text-green-800 border-green-300 dark:bg-green-900/50 dark:text-green-300 dark:border-green-700'
                                    : note.type === 'Recording'
                                    ? 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900/50 dark:text-blue-300 dark:border-blue-700'
                                    : 'bg-gray-100 text-gray-800 border-gray-300 dark:bg-gray-900/50 dark:text-gray-300 dark:border-gray-700'
                                }`}>
                                  {note.type}
                                </span>
                              )}

                              {/* Timestamp */}
                              <span className="text-xs text-muted-foreground flex-shrink-0">
                                {note.lastModified ? new Date(note.lastModified).toLocaleTimeString('en-US', {
                                  hour: '2-digit',
                                  minute: '2-digit'
                                }) : ''}
                              </span>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-1 flex-shrink-0">
                              <button
                                onClick={(e) => handleTogglePin(e, note.noteId)}
                                className={`p-1 rounded transition-colors ${
                                  note.isPinned === 'Yes' || note.isPinned === true
                                    ? 'text-amber-500 hover:bg-amber-500/10'
                                    : 'text-muted-foreground hover:text-amber-500 hover:bg-amber-500/10'
                                }`}
                                title={note.isPinned === 'Yes' || note.isPinned === true ? 'Unpin' : 'Pin'}
                              >
                                <Pin className={`w-3.5 h-3.5 ${note.isPinned === 'Yes' || note.isPinned === true ? 'fill-amber-500' : ''}`} />
                              </button>
                            </div>
                          </div>

                          {/* Tags Row (if any) */}
                          {note.noteTags && (
                            <div className="flex gap-1 mb-2 flex-wrap">
                              {note.noteTags.split(',').map((tag, i) => (
                                <span key={i} className="px-2 py-0.5 bg-primary/10 border border-primary/20 rounded text-xs font-medium text-primary">
                                  {tag.trim()}
                                </span>
                              ))}
                            </div>
                          )}

                          {/* Countdown timer for newly saved notes */}
                          {newNoteSaving && newNoteSaving.noteId === note.noteId && newNoteSaving.secondsRemaining > 0 && (
                            <div className="flex items-center gap-2 mb-2 px-2 py-1.5 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded text-xs">
                              <Clock className="h-3.5 w-3.5 text-yellow-600 dark:text-yellow-500" />
                              <span className="text-yellow-700 dark:text-yellow-400 font-medium">
                                Wait {newNoteSaving.secondsRemaining}s to add tags
                              </span>
                            </div>
                          )}

                          {/* Note Content */}
                          <div
                            className="text-sm text-foreground prose prose-sm dark:prose-invert max-w-none prose-p:my-2 prose-headings:my-2 prose-a:text-primary prose-a:underline prose-a:cursor-pointer"
                            dangerouslySetInnerHTML={{
                              __html: highlightSearchMatches(note.noteContent)
                            }}
                            onClick={(e) => {
                              const target = e.target as HTMLElement;

                              // Handle hyperlink clicks
                              if (target.tagName === 'A') {
                                const link = target as HTMLAnchorElement;
                                if (link.href) {
                                  e.preventDefault();
                                  window.open(link.href, '_blank', 'noopener,noreferrer');
                                  return;
                                }
                              }

                              // Handle checkbox clicks in note content
                              if (target.tagName === 'INPUT' && (target as HTMLInputElement).type === 'checkbox') {
                                e.preventDefault();
                                const checkbox = target as HTMLInputElement;

                                // Find all checkboxes in this note to get the index
                                const noteDiv = e.currentTarget;
                                const allCheckboxes = Array.from(noteDiv.querySelectorAll('input[type="checkbox"]'));
                                const checkboxIndex = allCheckboxes.indexOf(checkbox);

                                // Create a todo item structure
                                const todo: TodoItem = {
                                  id: `${note.noteId}-${checkboxIndex}`,
                                  text: checkbox.parentElement?.textContent?.trim() || '',
                                  sessionId: note.sessionId || '',
                                  sessionName: note.sessionName || '',
                                  noteId: note.noteId,
                                  checked: checkbox.checked
                                };

                                handleToggleTodo(todo);
                              }
                            }}
                          />

                          {/* Image Thumbnails */}
                          {(() => {
                            // Get images from two sources: noteContent HTML and images field
                            const allImages: string[] = [];

                            // 1. Extract from noteContent HTML
                            const parser = new DOMParser();
                            const doc = parser.parseFromString(note.noteContent, 'text/html');
                            const htmlImages = Array.from(doc.querySelectorAll('img'));
                            htmlImages.forEach(img => {
                              const src = (img as HTMLImageElement).src;
                              if (src) allImages.push(src);
                            });

                            // 2. Extract from images field (comma-separated URLs)
                            if (note.images) {
                              const imageUrls = note.images.split(',').map(url => url.trim()).filter(url => url);
                              allImages.push(...imageUrls);
                            }

                            // Remove duplicates
                            const uniqueImages = Array.from(new Set(allImages));

                            if (uniqueImages.length > 0) {
                              return (
                                <div className="flex gap-2 flex-wrap mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                                  {uniqueImages.slice(0, 3).map((src, idx) => (
                                    <img
                                      key={idx}
                                      src={src}
                                      alt={`thumbnail-${idx}`}
                                      className="w-20 h-20 object-cover rounded border border-gray-300 dark:border-gray-600 cursor-pointer hover:opacity-80 transition-opacity"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setSelectedImage(src);
                                        setImageModalOpen(true);
                                      }}
                                    />
                                  ))}
                                  {uniqueImages.length > 3 && (
                                    <div className="w-20 h-20 flex items-center justify-center rounded border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-800 text-sm text-muted-foreground">
                                      +{uniqueImages.length - 3}
                                    </div>
                                  )}
                                </div>
                              );
                            }
                            return null;
                          })()}
                          </div>
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Image Modal */}
      {imageModalOpen && (
        <div
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
          onClick={() => setImageModalOpen(false)}
        >
          <div className="relative max-w-7xl max-h-[90vh] w-full h-full flex items-center justify-center">
            <button
              onClick={() => setImageModalOpen(false)}
              className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors z-10"
            >
              <X className="w-6 h-6" />
            </button>
            <img
              src={selectedImage}
              alt="Full size"
              className="max-w-full max-h-full object-contain rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </div>
    </div>
  );
}

export default NotesPage;
