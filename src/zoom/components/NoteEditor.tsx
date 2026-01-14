import React, { useState, useEffect } from 'react';
import { Session } from '../../types';
import { useNotes } from '../hooks/useNotes';
import { Save, Pin, Loader2 } from 'lucide-react';

interface NoteEditorProps {
  session: Session;
}

export function NoteEditor({ session }: NoteEditorProps) {
  const { currentNote, saveNote, autoSave, saving, togglePin } = useNotes(session.sessionId);
  const [content, setContent] = useState('');
  const [tags, setTags] = useState('');

  useEffect(() => {
    if (currentNote) {
      setContent(currentNote.noteContent);
      setTags(currentNote.noteTags || '');
    }
  }, [currentNote]);

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    setContent(newContent);

    // Auto-save
    autoSave({
      studentId: '', // Will be set in the hook
      sessionId: session.sessionId,
      batch: session.batch,
      term: session.term,
      domain: session.domain,
      subject: session.subject,
      sessionName: session.sessionName,
      noteContent: newContent,
      noteTags: tags,
      isPinned: currentNote?.isPinned === true || currentNote?.isPinned === 'Yes',
    });
  };

  const handleManualSave = async () => {
    await saveNote({
      studentId: '', // Will be set in the hook
      sessionId: session.sessionId,
      batch: session.batch,
      term: session.term,
      domain: session.domain,
      subject: session.subject,
      sessionName: session.sessionName,
      noteContent: content,
      noteTags: tags,
      isPinned: currentNote?.isPinned === true || currentNote?.isPinned === 'Yes',
    });
  };

  const handleTogglePin = async () => {
    if (currentNote?.noteId) {
      await togglePin(currentNote.noteId);
    }
  };

  return (
    <div className="ultimate-glass rounded-xl p-4 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">Session Notes</h3>
        <div className="flex items-center gap-2">
          {saving && (
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <Loader2 className="w-4 h-4 animate-spin" />
              Saving...
            </div>
          )}
          {currentNote && (
            <button
              onClick={handleTogglePin}
              className={`p-2 rounded-lg transition-colors ${
                currentNote.isPinned
                  ? 'bg-ssb-gold text-white'
                  : 'text-gray-400 hover:text-ssb-gold hover:bg-white/10'
              }`}
              title={currentNote.isPinned ? 'Unpin' : 'Pin'}
            >
              <Pin className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={handleManualSave}
            disabled={saving}
            className="epic-button px-4 py-2 rounded-lg text-white text-sm flex items-center gap-2 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            Save
          </button>
        </div>
      </div>

      {/* Session Info */}
      <div className="mb-4 p-3 bg-white/5 rounded-lg">
        <p className="text-sm font-medium text-white">{session.sessionName}</p>
        <p className="text-xs text-gray-400 mt-1">
          {session.domain} • {session.subject} • {session.term}
        </p>
      </div>

      {/* Tags Input */}
      <div className="mb-4">
        <label className="text-sm text-gray-400 mb-2 block">Tags (comma-separated)</label>
        <input
          type="text"
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          placeholder="important, review, quiz"
          className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-ssb-green"
        />
      </div>

      {/* Note Editor */}
      <div className="flex-1 flex flex-col">
        <label className="text-sm text-gray-400 mb-2 block">Notes</label>
        <textarea
          value={content}
          onChange={handleContentChange}
          placeholder="Start taking notes..."
          className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-ssb-green resize-none"
        />
        <div className="mt-2 text-xs text-gray-500 text-right">
          {content.length} characters
        </div>
      </div>
    </div>
  );
}
