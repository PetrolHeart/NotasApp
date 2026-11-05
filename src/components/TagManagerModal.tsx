'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '@/store/useStore';
import { DEFAULT_TAG_COLORS } from '@/types';

export default function TagManagerModal() {
  const {
    isTagModalOpen,
    closeTagModal,
    tags,
    selectedTagIds,
    toggleTagFilter,
    clearTagFilter,
    addTag,
    removeTag,
    notes,
  } = useStore();

  const [newTagName, setNewTagName] = useState('');
  const [selectedColor, setSelectedColor] = useState(DEFAULT_TAG_COLORS[0]);

  const handleCreate = async () => {
    if (newTagName.trim()) {
      await addTag(newTagName.trim(), selectedColor);
      setNewTagName('');
    }
  };

  const getTagNoteCount = (tagId: string) => {
    return notes.filter((n) => !n.isTrashed && n.tags.some((t) => t.id === tagId)).length;
  };

  return (
    <AnimatePresence>
      {isTagModalOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
          onClick={closeTagModal}
        >
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 26, stiffness: 320 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg bg-white dark:bg-zinc-900 rounded-t-3xl sm:rounded-3xl max-h-[85vh] flex flex-col overflow-hidden border border-zinc-200/50 dark:border-zinc-800 shadow-2xl"
          >
            {/* Grab Handle */}
            <div className="flex justify-center pt-3 pb-1 sm:hidden">
              <div className="w-10 h-1 rounded-full bg-zinc-300 dark:bg-zinc-700" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 dark:border-zinc-800">
              <div className="flex items-center gap-2">
                <span className="text-xl">🏷️</span>
                <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">Filter by Tags</h2>
              </div>
              <div className="flex items-center gap-2">
                {selectedTagIds.length > 0 && (
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={clearTagFilter}
                    className="text-xs font-semibold text-rose-500 hover:text-rose-600 px-2 py-1"
                  >
                    Clear Filter
                  </motion.button>
                )}
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={closeTagModal}
                  className="w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-500 dark:text-zinc-400 font-bold text-sm"
                >
                  ✕
                </motion.button>
              </div>
            </div>

            <div className="p-6 overflow-y-auto space-y-6">
              {/* Filter Chips List */}
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 mb-3">
                  Select Tags to Filter Canvas
                </p>
                <div className="grid grid-cols-2 gap-2.5">
                  <motion.button
                    whileTap={{ scale: 0.96 }}
                    onClick={clearTagFilter}
                    className={`flex items-center justify-between px-4 py-3 rounded-2xl border transition-all text-left ${
                      selectedTagIds.length === 0
                        ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-500 text-blue-600 dark:text-blue-400 font-medium'
                        : 'bg-zinc-50 dark:bg-zinc-800/60 border-zinc-200/60 dark:border-zinc-700/60 text-zinc-700 dark:text-zinc-300'
                    }`}
                  >
                    <span className="text-sm">🌟 All Notes</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-black/5 dark:bg-white/10 font-medium">
                      {notes.filter((n) => !n.isTrashed).length}
                    </span>
                  </motion.button>

                  {tags.map((tag) => {
                    const isSelected = selectedTagIds.includes(tag.id);
                    const count = getTagNoteCount(tag.id);
                    return (
                      <motion.div
                        key={tag.id}
                        layout
                        className="relative group"
                      >
                        <motion.button
                          whileTap={{ scale: 0.96 }}
                          onClick={() => toggleTagFilter(tag.id)}
                          className={`w-full flex items-center justify-between px-3.5 py-3 rounded-2xl border transition-all text-left ${
                            isSelected
                              ? 'border-transparent text-white shadow-md'
                              : 'bg-zinc-50 dark:bg-zinc-800/60 border-zinc-200/60 dark:border-zinc-700/60 text-zinc-800 dark:text-zinc-200'
                          }`}
                          style={isSelected ? { backgroundColor: tag.color } : {}}
                        >
                          <div className="flex items-center gap-2 truncate pr-4">
                            <span
                              className="w-3 h-3 rounded-full flex-shrink-0"
                              style={{ backgroundColor: tag.color }}
                            />
                            <span className="text-sm truncate font-medium">{tag.name}</span>
                          </div>
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${
                              isSelected ? 'bg-white/25 text-white' : 'bg-black/5 dark:bg-white/10'
                            }`}
                          >
                            {count}
                          </span>
                        </motion.button>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            removeTag(tag.id);
                          }}
                          className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-rose-500 text-white text-[10px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow"
                          title="Delete tag"
                        >
                          ✕
                        </button>
                      </motion.div>
                    );
                  })}
                </div>
              </div>

              {/* Add New Tag */}
              <div className="bg-zinc-50 dark:bg-zinc-800/40 p-4 rounded-2xl border border-zinc-200/50 dark:border-zinc-700/50">
                <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 mb-2">
                  Create New Tag
                </p>
                <div className="flex flex-col gap-3">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="e.g. Finance, Reading..."
                      value={newTagName}
                      onChange={(e) => setNewTagName(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                      className="flex-1 px-4 py-2.5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-sm outline-none text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:border-blue-500"
                    />
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={handleCreate}
                      disabled={!newTagName.trim()}
                      className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium text-sm transition-colors shadow-sm"
                    >
                      Add
                    </motion.button>
                  </div>

                  {/* Color Palette */}
                  <div className="flex items-center gap-2 pt-1">
                    <span className="text-xs text-zinc-400">Color:</span>
                    <div className="flex gap-2 overflow-x-auto py-1">
                      {DEFAULT_TAG_COLORS.map((c) => (
                        <button
                          key={c}
                          onClick={() => setSelectedColor(c)}
                          className={`w-6 h-6 rounded-full transition-transform ${
                            selectedColor === c ? 'scale-125 ring-2 ring-offset-2 ring-blue-500' : 'hover:scale-110'
                          }`}
                          style={{ backgroundColor: c }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
