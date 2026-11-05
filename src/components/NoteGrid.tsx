'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useStore } from '@/store/useStore';
import NoteCard from './NoteCard';
import SearchBar from './SearchBar';
import { cn } from '@/lib/utils';

export default function NoteGrid() {
  const { getFilteredNotes, openEditor, filterMode, reorderNotes, settings } = useStore();
  const notes = getFilteredNotes();
  const pinnedNotes = notes.filter((n) => n.isPinned);
  const otherNotes = notes.filter((n) => !n.isPinned);

  const [draggedNoteId, setDraggedNoteId] = useState<string | null>(null);
  const [dragOverNoteId, setDragOverNoteId] = useState<string | null>(null);

  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedNoteId(id);
    e.dataTransfer.setData('text/plain', id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, id: string) => {
    e.preventDefault();
    if (draggedNoteId && draggedNoteId !== id) {
      setDragOverNoteId(id);
    }
  };

  const handleDrop = async (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    setDragOverNoteId(null);
    const sourceId = e.dataTransfer.getData('text/plain') || draggedNoteId;
    if (!sourceId || sourceId === targetId) return;

    const currentNoteIds = notes.map((n) => n.id);
    const sourceIndex = currentNoteIds.indexOf(sourceId);
    const targetIndex = currentNoteIds.indexOf(targetId);

    if (sourceIndex < 0 || targetIndex < 0) return;

    const newOrder = [...currentNoteIds];
    newOrder.splice(sourceIndex, 1);
    newOrder.splice(targetIndex, 0, sourceId);

    await reorderNotes(newOrder);
    setDraggedNoteId(null);
  };

  const isList = settings.viewMode === 'list';
  const gridClasses = isList
    ? 'flex flex-col gap-3'
    : 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5';

  return (
    <div className="px-4 sm:px-6 max-w-6xl mx-auto pb-32 pt-3">
      {/* Search and Tag Carousel */}
      <SearchBar />

      {/* Trash notice banner */}
      {filterMode === 'trash' && notes.length > 0 && <TrashBanner />}

      {/* Pinned Notes Section */}
      {pinnedNotes.length > 0 && filterMode === 'all' && (
        <section className="mb-8">
          <div className="flex items-center justify-between mb-3 px-1">
            <h2 className="text-xs font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500 flex items-center gap-1.5">
              <span>📌</span>
              <span>Pinned Notes</span>
              <span className="text-[10px] bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 px-1.5 py-0.5 rounded-full font-semibold ml-1">
                {pinnedNotes.length}
              </span>
            </h2>
            <span className="text-[10px] text-zinc-400">Drag to reorder</span>
          </div>

          <div className={gridClasses}>
            <AnimatePresence mode="popLayout">
              {pinnedNotes.map((note) => (
                <NoteCard
                  key={note.id}
                  note={note}
                  onEdit={() => openEditor(note)}
                  onDragStartReorder={handleDragStart}
                  onDragOverReorder={handleDragOver}
                  onDropReorder={handleDrop}
                  isDragOver={dragOverNoteId === note.id}
                />
              ))}
            </AnimatePresence>
          </div>
        </section>
      )}

      {/* Other Notes Section */}
      <section>
        {pinnedNotes.length > 0 && filterMode === 'all' && (
          <div className="flex items-center justify-between mb-3 px-1">
            <h2 className="text-xs font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500 flex items-center gap-1.5">
              <span>📋</span>
              <span>All Notes</span>
              <span className="text-[10px] bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 px-1.5 py-0.5 rounded-full font-semibold ml-1">
                {otherNotes.length}
              </span>
            </h2>
          </div>
        )}

        {otherNotes.length > 0 || (pinnedNotes.length === 0 && notes.length > 0) ? (
          <div className={gridClasses}>
            <AnimatePresence mode="popLayout">
              {(filterMode === 'all' ? otherNotes : notes).map((note) => (
                <NoteCard
                  key={note.id}
                  note={note}
                  onEdit={() => openEditor(note)}
                  onDragStartReorder={handleDragStart}
                  onDragOverReorder={handleDragOver}
                  onDropReorder={handleDrop}
                  isDragOver={dragOverNoteId === note.id}
                />
              ))}
            </AnimatePresence>
          </div>
        ) : null}

        {/* Empty State */}
        {notes.length === 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center py-20 text-center px-4"
          >
            <div className="w-20 h-20 rounded-3xl bg-blue-50 dark:bg-zinc-900 flex items-center justify-center text-4xl mb-4 shadow-inner">
              {filterMode === 'archived' ? '📦' : filterMode === 'trash' ? '🗑️' : '📝'}
            </div>
            <h3 className="text-base font-bold text-zinc-800 dark:text-zinc-200 mb-1">
              {filterMode === 'archived'
                ? 'No archived notes yet'
                : filterMode === 'trash'
                ? 'Trash is empty'
                : 'No notes found'}
            </h3>
            <p className="text-xs text-zinc-400 dark:text-zinc-500 max-w-xs mb-6">
              {filterMode === 'archived'
                ? 'Swipe right on any active note to stash it here for later.'
                : filterMode === 'trash'
                ? 'Deleted notes will stay here until emptied.'
                : 'Tap the glowing + button below to create your first hybrid note!'}
            </p>
            {filterMode === 'all' && (
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => openEditor()}
                className="px-5 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-md shadow-blue-500/25 flex items-center gap-2"
              >
                <span>+</span>
                <span>Create New Note</span>
              </motion.button>
            )}
          </motion.div>
        )}
      </section>
    </div>
  );
}

function TrashBanner() {
  const { emptyTrash, notes } = useStore();
  const trashedCount = notes.filter((n) => n.isTrashed).length;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-rose-50 dark:bg-rose-950/30 border border-rose-200/80 dark:border-rose-900/50 rounded-2xl p-3.5 mb-5 flex items-center justify-between shadow-xs"
    >
      <div className="flex items-center gap-2">
        <span className="text-lg">⚠️</span>
        <span className="text-xs font-medium text-rose-700 dark:text-rose-300">
          {trashedCount} items in Trash. Swipe right to restore or left to delete forever.
        </span>
      </div>
      <motion.button
        whileTap={{ scale: 0.95 }}
        onClick={() => {
          if (confirm('Permanently delete all items in trash?')) {
            emptyTrash();
          }
        }}
        className="text-xs font-bold text-rose-600 dark:text-rose-400 px-3 py-1.5 rounded-xl bg-rose-100 dark:bg-rose-900/50 hover:bg-rose-200 transition-colors flex-shrink-0"
      >
        Empty Trash
      </motion.button>
    </motion.div>
  );
}
