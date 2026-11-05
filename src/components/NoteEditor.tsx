'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '@/store/useStore';
import type { NoteTheme, ContentBlock, ChecklistItem } from '@/types';
import { DEFAULT_THEMES, DEFAULT_TAG_COLORS } from '@/types';
import { cn, getChecklistProgress } from '@/lib/utils';

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 9);
}

const QUICK_ICONS = ['📝', '✨', '💡', '🎯', '🚀', '🌲', '💼', '📚', '☕', '🔥', '🎨', '🏖️'];

export default function NoteEditor() {
  const {
    editingNote,
    isEditorOpen,
    closeEditor,
    addNote,
    updateNote,
    deleteNote,
    trashNote,
    tags,
    addTag,
  } = useStore();

  const [title, setTitle] = useState('');
  const [blocks, setBlocks] = useState<ContentBlock[]>([]);
  const [theme, setTheme] = useState<NoteTheme>(DEFAULT_THEMES[0]);
  const [noteIcon, setNoteIcon] = useState('');
  const [isPinned, setIsPinned] = useState(false);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);

  // Panels
  const [showThemePicker, setShowThemePicker] = useState(false);
  const [showTagPicker, setShowTagPicker] = useState(false);
  const [newTagName, setNewTagName] = useState('');

  const titleInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditorOpen) {
      if (editingNote) {
        setTitle(editingNote.title);
        setBlocks(
          editingNote.blocks && editingNote.blocks.length > 0
            ? JSON.parse(JSON.stringify(editingNote.blocks))
            : [{ id: generateId(), type: 'text', content: '', order: 0 }]
        );
        setTheme(editingNote.theme || DEFAULT_THEMES[0]);
        setNoteIcon(editingNote.theme?.icon || '');
        setIsPinned(editingNote.isPinned || false);
        setSelectedTagIds(editingNote.tags ? editingNote.tags.map((t) => t.id) : []);
      } else {
        setTitle('');
        setBlocks([{ id: generateId(), type: 'text', content: '', order: 0 }]);
        setTheme(DEFAULT_THEMES[0]);
        setNoteIcon('');
        setIsPinned(false);
        setSelectedTagIds([]);
      }
      setShowThemePicker(false);
      setShowTagPicker(false);
      setTimeout(() => titleInputRef.current?.focus(), 250);
    }
  }, [isEditorOpen, editingNote]);

  const handleSaveAndClose = async () => {
    const hasText = title.trim().length > 0;
    const hasBlockContent = blocks.some(
      (b) =>
        (b.type === 'text' && b.content.trim().length > 0) ||
        (b.type === 'checklist' && b.checklistItems && b.checklistItems.length > 0)
    );

    // If blank new note, just close
    if (!hasText && !hasBlockContent && !editingNote) {
      closeEditor();
      return;
    }

    const noteTheme: NoteTheme = {
      ...theme,
      icon: noteIcon || undefined,
    };

    const noteTags = tags.filter((t) => selectedTagIds.includes(t.id));

    if (editingNote) {
      await updateNote(editingNote.id, {
        title,
        blocks,
        theme: noteTheme,
        tags: noteTags,
        isPinned,
      });
    } else {
      await addNote({
        title,
        blocks,
        theme: noteTheme,
        tags: noteTags,
        isPinned,
      });
    }

    closeEditor();
  };

  const handleAddBlock = (type: 'text' | 'checklist') => {
    const newBlock: ContentBlock = {
      id: generateId(),
      type,
      content: '',
      checklistItems:
        type === 'checklist'
          ? [{ id: generateId(), text: '', checked: false, order: 0 }]
          : undefined,
      order: blocks.length,
    };
    setBlocks([...blocks, newBlock]);
  };

  const handleRemoveBlock = (blockId: string) => {
    if (blocks.length <= 1) {
      // Just clear content instead of removing sole block
      setBlocks([{ id: generateId(), type: 'text', content: '', order: 0 }]);
      return;
    }
    setBlocks(blocks.filter((b) => b.id !== blockId));
  };

  const handleUpdateTextBlock = (blockId: string, content: string) => {
    setBlocks(blocks.map((b) => (b.id === blockId ? { ...b, content } : b)));
  };

  const handleAddChecklistItem = (blockId: string) => {
    setBlocks(
      blocks.map((b) => {
        if (b.id === blockId) {
          const items = b.checklistItems || [];
          return {
            ...b,
            checklistItems: [
              ...items,
              { id: generateId(), text: '', checked: false, order: items.length },
            ],
          };
        }
        return b;
      })
    );
  };

  const handleToggleChecklistItem = (blockId: string, itemId: string) => {
    setBlocks(
      blocks.map((b) => {
        if (b.id === blockId && b.checklistItems) {
          return {
            ...b,
            checklistItems: b.checklistItems.map((item) =>
              item.id === itemId ? { ...item, checked: !item.checked } : item
            ),
          };
        }
        return b;
      })
    );
  };

  const handleUpdateChecklistItemText = (blockId: string, itemId: string, text: string) => {
    setBlocks(
      blocks.map((b) => {
        if (b.id === blockId && b.checklistItems) {
          return {
            ...b,
            checklistItems: b.checklistItems.map((item) =>
              item.id === itemId ? { ...item, text } : item
            ),
          };
        }
        return b;
      })
    );
  };

  const handleRemoveChecklistItem = (blockId: string, itemId: string) => {
    setBlocks(
      blocks.map((b) => {
        if (b.id === blockId && b.checklistItems) {
          return {
            ...b,
            checklistItems: b.checklistItems.filter((item) => item.id !== itemId),
          };
        }
        return b;
      })
    );
  };

  const handleCreateNewTag = async () => {
    if (!newTagName.trim()) return;
    const randomColor = DEFAULT_TAG_COLORS[tags.length % DEFAULT_TAG_COLORS.length];
    await addTag(newTagName.trim(), randomColor);
    // Find newly added tag
    const matchingTag = useStore.getState().tags.find((t) => t.name === newTagName.trim());
    if (matchingTag) {
      setSelectedTagIds((prev) => [...prev, matchingTag.id]);
    }
    setNewTagName('');
  };

  const progress = getChecklistProgress(blocks);

  return (
    <AnimatePresence>
      {isEditorOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
          onClick={handleSaveAndClose}
        >
          <motion.div
            initial={{ y: '100%', scale: 0.98 }}
            animate={{ y: 0, scale: 1 }}
            exit={{ y: '100%', scale: 0.98 }}
            transition={{ type: 'spring', damping: 28, stiffness: 320 }}
            onClick={(e) => e.stopPropagation()}
            className={cn(
              'w-full max-w-2xl h-[92vh] sm:h-[86vh] rounded-t-3xl sm:rounded-3xl flex flex-col overflow-hidden shadow-2xl border border-white/20 dark:border-zinc-800',
              theme.background,
              theme.textColor || 'text-zinc-900 dark:text-zinc-100'
            )}
          >
            {/* Top Drag Indicator on Mobile */}
            <div className="flex justify-center pt-2.5 pb-1 sm:hidden">
              <div className="w-12 h-1.5 rounded-full bg-black/15 dark:bg-white/20" />
            </div>

            {/* Navigation & Action Bar */}
            <div className="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-black/5 dark:border-white/10">
              <motion.button
                whileTap={{ scale: 0.92 }}
                onClick={handleSaveAndClose}
                className="flex items-center gap-1 text-sm font-semibold text-blue-600 dark:text-blue-400 px-2 py-1 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
              >
                <span>←</span>
                <span>Save</span>
              </motion.button>

              <div className="flex items-center gap-1 sm:gap-2">
                {/* Pin Button */}
                <motion.button
                  whileTap={{ scale: 0.88 }}
                  onClick={() => setIsPinned(!isPinned)}
                  className={cn(
                    'w-9 h-9 rounded-xl flex items-center justify-center text-sm transition-colors',
                    isPinned
                      ? 'bg-amber-400/30 text-amber-600 dark:text-amber-300 font-bold'
                      : 'hover:bg-black/5 dark:hover:bg-white/10 opacity-70'
                  )}
                  title={isPinned ? 'Pinned to top' : 'Pin note'}
                >
                  📌
                </motion.button>

                {/* Theme Selector Toggle */}
                <motion.button
                  whileTap={{ scale: 0.88 }}
                  onClick={() => {
                    setShowThemePicker(!showThemePicker);
                    setShowTagPicker(false);
                  }}
                  className={cn(
                    'w-9 h-9 rounded-xl flex items-center justify-center text-sm transition-colors',
                    showThemePicker
                      ? 'bg-black/15 dark:bg-white/20'
                      : 'hover:bg-black/5 dark:hover:bg-white/10 opacity-70'
                  )}
                  title="Customize Theme & Icon"
                >
                  🎨
                </motion.button>

                {/* Tags Selector Toggle */}
                <motion.button
                  whileTap={{ scale: 0.88 }}
                  onClick={() => {
                    setShowTagPicker(!showTagPicker);
                    setShowThemePicker(false);
                  }}
                  className={cn(
                    'w-9 h-9 rounded-xl flex items-center justify-center text-sm transition-colors',
                    showTagPicker
                      ? 'bg-black/15 dark:bg-white/20'
                      : 'hover:bg-black/5 dark:hover:bg-white/10 opacity-70'
                  )}
                  title="Tag Chips"
                >
                  🏷️
                </motion.button>

                {/* Delete / Trash Shortcut */}
                {editingNote && (
                  <motion.button
                    whileTap={{ scale: 0.88 }}
                    onClick={async () => {
                      if (editingNote.isTrashed) {
                        if (confirm('Permanently delete this note?')) {
                          await deleteNote(editingNote.id);
                          closeEditor();
                        }
                      } else {
                        await trashNote(editingNote.id);
                        closeEditor();
                      }
                    }}
                    className="w-9 h-9 rounded-xl hover:bg-rose-500/20 text-rose-500 flex items-center justify-center text-sm transition-colors"
                    title="Send to Trash"
                  >
                    🗑️
                  </motion.button>
                )}
              </div>
            </div>

            {/* Theme & Icon Picker Flyout */}
            <AnimatePresence>
              {showThemePicker && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="px-6 py-3 bg-black/5 dark:bg-white/5 border-b border-black/5 dark:border-white/10 overflow-hidden"
                >
                  <p className="text-[11px] font-bold uppercase tracking-wider opacity-60 mb-2">
                    Card Background & Accent
                  </p>
                  <div className="flex gap-2.5 overflow-x-auto pb-2 scrollbar-hide">
                    {DEFAULT_THEMES.map((t, idx) => (
                      <button
                        key={idx}
                        onClick={() => setTheme(t)}
                        className={cn(
                          'w-9 h-9 rounded-2xl border-2 flex-shrink-0 transition-all shadow-xs',
                          t.background,
                          theme.background === t.background
                            ? 'border-blue-600 scale-110 ring-2 ring-blue-500/30'
                            : 'border-black/10 dark:border-white/20'
                        )}
                      />
                    ))}
                  </div>

                  <p className="text-[11px] font-bold uppercase tracking-wider opacity-60 mt-2 mb-1.5">
                    Note Icon Emoji
                  </p>
                  <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide py-1">
                    <button
                      onClick={() => setNoteIcon('')}
                      className={cn(
                        'px-2.5 py-1 text-xs rounded-xl bg-black/5 dark:bg-white/10 font-semibold',
                        !noteIcon && 'ring-2 ring-blue-500'
                      )}
                    >
                      None
                    </button>
                    {QUICK_ICONS.map((emoji) => (
                      <button
                        key={emoji}
                        onClick={() => setNoteIcon(emoji)}
                        className={cn(
                          'w-8 h-8 rounded-xl flex items-center justify-center text-base hover:scale-110 transition-transform',
                          noteIcon === emoji && 'bg-blue-500/20 ring-2 ring-blue-500'
                        )}
                      >
                        {emoji}
                      </button>
                    ))}
                    <input
                      type="text"
                      maxLength={2}
                      placeholder="Custom"
                      value={noteIcon}
                      onChange={(e) => setNoteIcon(e.target.value)}
                      className="w-16 px-2 py-1 text-xs rounded-xl bg-black/5 dark:bg-white/10 text-center outline-none"
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Tag Selector Flyout */}
            <AnimatePresence>
              {showTagPicker && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="px-6 py-3 bg-black/5 dark:bg-white/5 border-b border-black/5 dark:border-white/10 overflow-hidden"
                >
                  <p className="text-[11px] font-bold uppercase tracking-wider opacity-60 mb-2">
                    Attach Tags
                  </p>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {tags.map((tag) => {
                      const isSelected = selectedTagIds.includes(tag.id);
                      return (
                        <button
                          key={tag.id}
                          onClick={() => {
                            setSelectedTagIds(
                              isSelected
                                ? selectedTagIds.filter((id) => id !== tag.id)
                                : [...selectedTagIds, tag.id]
                            );
                          }}
                          className={cn(
                            'text-xs font-semibold px-3 py-1.5 rounded-full transition-all flex items-center gap-1.5',
                            isSelected
                              ? 'text-white shadow-sm'
                              : 'bg-black/5 dark:bg-white/10 opacity-70 hover:opacity-100'
                          )}
                          style={isSelected ? { backgroundColor: tag.color } : {}}
                        >
                          <span
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: tag.color }}
                          />
                          <span>{tag.name}</span>
                          {isSelected && <span>✓</span>}
                        </button>
                      );
                    })}
                  </div>

                  {/* Create tag inline */}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Add new tag name..."
                      value={newTagName}
                      onChange={(e) => setNewTagName(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleCreateNewTag()}
                      className="px-3 py-1.5 text-xs rounded-xl bg-black/5 dark:bg-white/10 outline-none flex-1 placeholder-current/40"
                    />
                    <button
                      onClick={handleCreateNewTag}
                      className="px-3 py-1.5 text-xs rounded-xl bg-blue-600 text-white font-semibold"
                    >
                      Add
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Title & Realtime Checklist Bar */}
            <div className="px-5 sm:px-8 pt-4 pb-2">
              <div className="flex items-center gap-2 mb-2">
                {noteIcon && <span className="text-2xl">{noteIcon}</span>}
                <input
                  ref={titleInputRef}
                  type="text"
                  placeholder="Note Title..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full text-xl sm:text-2xl font-black bg-transparent outline-none placeholder-current/30"
                />
              </div>

              {/* Tag Chips in Header */}
              {selectedTagIds.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-1 mb-2">
                  {tags
                    .filter((t) => selectedTagIds.includes(t.id))
                    .map((tag) => (
                      <span
                        key={tag.id}
                        className="text-[10px] font-bold px-2.5 py-0.5 rounded-full text-white shadow-xs"
                        style={{ backgroundColor: tag.color }}
                      >
                        #{tag.name}
                      </span>
                    ))}
                </div>
              )}

              {/* Real-time Checklist Completion Progress Bar */}
              {progress.total > 0 && (
                <div className="pt-2 pb-1">
                  <div className="flex items-center justify-between text-xs font-bold opacity-75 mb-1.5">
                    <span>Checklist Progress</span>
                    <span>
                      {progress.checked}/{progress.total} completed ({progress.percentage}%)
                    </span>
                  </div>
                  <div className="w-full h-2 bg-black/10 dark:bg-white/15 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full rounded-full transition-all duration-300"
                      style={{
                        backgroundColor: progress.percentage === 100 ? '#22c55e' : '#3b82f6',
                      }}
                      animate={{ width: `${progress.percentage}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Hybrid Canvas: Blocks Stream */}
            <div className="flex-1 overflow-y-auto px-5 sm:px-8 py-3 space-y-4">
              {blocks.map((block, blockIndex) => (
                <div
                  key={block.id}
                  className="relative p-3.5 rounded-2xl bg-black/[0.03] dark:bg-white/[0.04] border border-black/5 dark:border-white/5 transition-all group"
                >
                  {/* Delete block button */}
                  <button
                    onClick={() => handleRemoveBlock(block.id)}
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 w-6 h-6 rounded-lg bg-black/10 dark:bg-white/10 hover:bg-rose-500 hover:text-white text-xs flex items-center justify-center transition-all"
                    title="Remove block"
                  >
                    ✕
                  </button>

                  {block.type === 'text' ? (
                    <div>
                      <div className="text-[10px] uppercase font-bold opacity-40 mb-1">
                        Text Block {blockIndex + 1}
                      </div>
                      <textarea
                        placeholder="Write your note content here..."
                        value={block.content}
                        onChange={(e) => handleUpdateTextBlock(block.id, e.target.value)}
                        rows={4}
                        className="w-full bg-transparent outline-none resize-none text-sm leading-relaxed placeholder-current/30"
                      />
                    </div>
                  ) : (
                    <div>
                      <div className="flex items-center justify-between text-[10px] uppercase font-bold opacity-40 mb-2">
                        <span>Interactive Checklist</span>
                        <span>{block.checklistItems?.length || 0} items</span>
                      </div>

                      <div className="space-y-2">
                        {block.checklistItems?.map((item, itemIdx) => (
                          <div key={item.id} className="flex items-center gap-2 group/item">
                            {/* Checkbox */}
                            <motion.button
                              whileTap={{ scale: 0.8 }}
                              onClick={() => handleToggleChecklistItem(block.id, item.id)}
                              className={cn(
                                'w-5 h-5 rounded-lg border-2 flex items-center justify-center flex-shrink-0 transition-all',
                                item.checked
                                  ? 'bg-emerald-500 border-emerald-500 text-white font-bold'
                                  : 'border-zinc-400/60 dark:border-zinc-500/60 hover:border-emerald-500'
                              )}
                            >
                              {item.checked && (
                                <motion.span
                                  initial={{ scale: 0 }}
                                  animate={{ scale: 1 }}
                                  className="text-xs"
                                >
                                  ✓
                                </motion.span>
                              )}
                            </motion.button>

                            {/* Checklist item text input */}
                            <input
                              type="text"
                              value={item.text}
                              onChange={(e) =>
                                handleUpdateChecklistItemText(block.id, item.id, e.target.value)
                              }
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  handleAddChecklistItem(block.id);
                                } else if (e.key === 'Backspace' && item.text === '') {
                                  e.preventDefault();
                                  handleRemoveChecklistItem(block.id, item.id);
                                }
                              }}
                              placeholder={`List item ${itemIdx + 1}...`}
                              className={cn(
                                'flex-1 bg-transparent outline-none text-sm py-0.5 transition-all',
                                item.checked && 'line-through opacity-50'
                              )}
                            />

                            {/* Remove item button */}
                            <button
                              onClick={() => handleRemoveChecklistItem(block.id, item.id)}
                              className="opacity-0 group-hover/item:opacity-100 text-rose-500 hover:text-rose-700 text-xs px-1"
                            >
                              ✕
                            </button>
                          </div>
                        ))}

                        {/* Add Item Button */}
                        <motion.button
                          whileTap={{ scale: 0.95 }}
                          onClick={() => handleAddChecklistItem(block.id)}
                          className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline pt-1 flex items-center gap-1"
                        >
                          <span>+</span>
                          <span>Add item (Press Enter)</span>
                        </motion.button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Hybrid Block Addition Bottom Toolbar */}
            <div className="px-5 sm:px-8 py-3.5 bg-black/[0.04] dark:bg-white/[0.06] border-t border-black/5 dark:border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold opacity-50">Insert Block:</span>
                <motion.button
                  whileTap={{ scale: 0.92 }}
                  onClick={() => handleAddBlock('text')}
                  className="px-3 py-1.5 rounded-xl bg-white dark:bg-zinc-800 shadow-xs border border-black/5 dark:border-white/10 text-xs font-semibold flex items-center gap-1.5 hover:shadow-md transition-all"
                >
                  <span>📝</span>
                  <span>Text Paragraph</span>
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.92 }}
                  onClick={() => handleAddBlock('checklist')}
                  className="px-3 py-1.5 rounded-xl bg-white dark:bg-zinc-800 shadow-xs border border-black/5 dark:border-white/10 text-xs font-semibold flex items-center gap-1.5 hover:shadow-md transition-all"
                >
                  <span>☑️</span>
                  <span>Checklist</span>
                </motion.button>
              </div>

              <motion.button
                whileTap={{ scale: 0.94 }}
                onClick={handleSaveAndClose}
                className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/30 transition-all"
              >
                Done
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
