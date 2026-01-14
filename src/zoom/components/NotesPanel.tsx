import React, { useState } from 'react';
import { Session } from '../../types';
import { NoteEditor } from './NoteEditor';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '../../utils/helpers';

interface NotesPanelProps {
  session: Session | null;
  isOpen: boolean;
  onClose: () => void;
  embedded?: boolean;
}

export function NotesPanel({ session, isOpen, onClose, embedded = false }: NotesPanelProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  if (!isOpen && !embedded) return null;

  // Embedded mode - render as normal div without fixed positioning
  if (embedded) {
    return (
      <div className="h-full">
        {session ? (
          <NoteEditor session={session} />
        ) : (
          <div className="h-full flex items-center justify-center text-center p-8">
            <div>
              <div className="text-4xl mb-4">📝</div>
              <p className="text-gray-400">Select a session to take notes</p>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Original modal/panel mode
  return (
    <>
      {/* Backdrop for mobile */}
      <div
        className={cn(
          'fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden',
          isOpen ? 'block' : 'hidden'
        )}
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className={cn(
          'fixed right-0 top-16 h-[calc(100vh-4rem)] bg-background/95 backdrop-blur-lg border-l border-white/10 z-50 transition-all duration-300',
          isCollapsed ? 'w-12' : 'w-full lg:w-96',
          !isOpen && 'translate-x-full'
        )}
      >
        {/* Collapse Button */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="absolute -left-10 top-4 p-2 ultimate-glass rounded-l-lg hover:bg-white/10 transition-colors hidden lg:block"
        >
          {isCollapsed ? (
            <ChevronLeft className="w-5 h-5 text-white" />
          ) : (
            <ChevronRight className="w-5 h-5 text-white" />
          )}
        </button>

        {!isCollapsed && (
          <div className="h-full flex flex-col">
            {/* Close Button (Mobile) */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 hover:bg-white/10 rounded-lg transition-colors lg:hidden"
            >
              <X className="w-5 h-5 text-white" />
            </button>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4">
              {session ? (
                <NoteEditor session={session} />
              ) : (
                <div className="h-full flex items-center justify-center text-center p-8">
                  <div>
                    <div className="text-4xl mb-4">📝</div>
                    <p className="text-gray-400">Select a session to take notes</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {isCollapsed && (
          <div className="h-full flex items-center justify-center">
            <div className="transform -rotate-90 whitespace-nowrap text-sm text-gray-400">
              Notes
            </div>
          </div>
        )}
      </div>
    </>
  );
}
