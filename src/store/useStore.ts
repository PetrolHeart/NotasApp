'use client';

import { create } from 'zustand';
import type { Note, Tag, AppSettings, FilterMode, ContentBlock, ChecklistItem, NoteReminder } from '@/types';
import { indexedDBRepository, type NoteRepository, INITIAL_SETTINGS } from '@/lib/storage';
import { DEFAULT_THEMES } from '@/types';
import { checkAndTriggerDueReminders } from '@/lib/reminderService';

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 9);
}

interface AppState {
  notes: Note[];
  tags: Tag[];
  settings: AppSettings;
  filterMode: FilterMode;
  selectedTagIds: string[];
  searchQuery: string;
  isLoaded: boolean;
  editingNote: Note | null;
  isEditorOpen: boolean;
  isSettingsOpen: boolean;
  isTagModalOpen: boolean;

  // Repository abstraction
  repo: NoteRepository;
  setRepository: (repo: NoteRepository) => void;

  // Lifecycle
  loadAll: () => Promise<void>;

  // Notes CRUD
  addNote: (note: Partial<Note>) => Promise<Note>;
  updateNote: (id: string, updates: Partial<Note>) => Promise<void>;
  deleteNote: (id: string) => Promise<void>;
  permanentlyDeleteNote: (id: string) => Promise<void>;
  togglePin: (id: string) => Promise<void>;
  archiveNote: (id: string) => Promise<void>;
  restoreNote: (id: string) => Promise<void>;
  trashNote: (id: string) => Promise<void>;
  emptyTrash: () => Promise<void>;
  reorderNotes: (noteIds: string[]) => Promise<void>;

  // Recordatorios y Alarmas
  setNoteReminder: (noteId: string, reminder: NoteReminder | null) => Promise<void>;
  markReminderTriggered: (noteId: string) => Promise<void>;
  checkReminders: () => Promise<void>;

  // Content Blocks
  addBlock: (noteId: string, type: 'text' | 'checklist') => Promise<void>;
  updateBlock: (noteId: string, blockId: string, updates: Partial<ContentBlock>) => Promise<void>;
  removeBlock: (noteId: string, blockId: string) => Promise<void>;
  toggleChecklistItem: (noteId: string, blockId: string, itemId: string) => Promise<void>;
  addChecklistItem: (noteId: string, blockId: string, text: string) => Promise<void>;
  removeChecklistItem: (noteId: string, blockId: string, itemId: string) => Promise<void>;
  updateChecklistItem: (noteId: string, blockId: string, itemId: string, text: string) => Promise<void>;

  // Tags
  addTag: (name: string, color: string) => Promise<void>;
  removeTag: (id: string) => Promise<void>;
  toggleNoteTag: (noteId: string, tagId: string) => Promise<void>;
  clearTagFilter: () => void;

  // Filter & Search
  setFilterMode: (mode: FilterMode) => void;
  toggleTagFilter: (tagId: string) => void;
  setSearchQuery: (query: string) => void;

  // Settings
  updateSettings: (settings: Partial<AppSettings>) => Promise<void>;
  toggleViewMode: () => Promise<void>;

  // Modals & Sheets
  openEditor: (note?: Note) => void;
  closeEditor: () => void;
  openSettings: () => void;
  closeSettings: () => void;
  openTagModal: () => void;
  closeTagModal: () => void;

  // Backup & Restore
  exportData: () => Promise<string>;
  importData: (json: string) => Promise<void>;

  // Selectors
  getFilteredNotes: () => Note[];
}

export const useStore = create<AppState>((set, get) => ({
  notes: [],
  tags: [],
  settings: INITIAL_SETTINGS,
  filterMode: 'all',
  selectedTagIds: [],
  searchQuery: '',
  isLoaded: false,
  editingNote: null,
  isEditorOpen: false,
  isSettingsOpen: false,
  isTagModalOpen: false,
  repo: indexedDBRepository,

  setRepository(repo: NoteRepository) {
    set({ repo });
  },

  async loadAll() {
    const repo = get().repo;
    try {
      const [notes, tags, settings] = await Promise.all([
        repo.getAllNotes(),
        repo.getAllTags(),
        repo.getSettings(),
      ]);
      set({ notes, tags, settings, isLoaded: true });
      // Comprobar alarmas al cargar
      get().checkReminders();
    } catch {
      set({ isLoaded: true });
    }
  },

  async addNote(partial) {
    const now = Date.now();
    const newNote: Note = {
      id: generateId(),
      title: partial.title?.trim() || '',
      blocks: partial.blocks && partial.blocks.length > 0
        ? partial.blocks
        : [{ id: generateId(), type: 'text', content: '', order: 0 }],
      tags: partial.tags || [],
      theme: partial.theme || DEFAULT_THEMES[0],
      isPinned: partial.isPinned || false,
      isArchived: false,
      isTrashed: false,
      reminder: partial.reminder || null,
      order: 0,
      createdAt: now,
      updatedAt: now,
    };

    const updatedNotes = [newNote, ...get().notes.map((n) => ({ ...n, order: n.order + 1 }))];
    set({ notes: updatedNotes });
    await get().repo.saveNote(newNote);
    return newNote;
  },

  async updateNote(id, updates) {
    const now = Date.now();
    const notes = get().notes.map((n) =>
      n.id === id ? { ...n, ...updates, updatedAt: now } : n
    );
    set({ notes });
    const updated = notes.find((n) => n.id === id);
    if (updated) await get().repo.saveNote(updated);
  },

  async deleteNote(id) {
    const notes = get().notes.filter((n) => n.id !== id);
    set({ notes });
    await get().repo.deleteNote(id);
  },

  async permanentlyDeleteNote(id) {
    await get().deleteNote(id);
  },

  async togglePin(id) {
    const note = get().notes.find((n) => n.id === id);
    if (note) {
      await get().updateNote(id, { isPinned: !note.isPinned });
    }
  },

  async archiveNote(id) {
    await get().updateNote(id, { isArchived: true, isPinned: false });
  },

  async restoreNote(id) {
    await get().updateNote(id, { isArchived: false, isTrashed: false });
  },

  async trashNote(id) {
    await get().updateNote(id, { isTrashed: true, isPinned: false, isArchived: false });
  },

  async emptyTrash() {
    const trashed = get().notes.filter((n) => n.isTrashed);
    for (const n of trashed) {
      await get().repo.deleteNote(n.id);
    }
    set({ notes: get().notes.filter((n) => !n.isTrashed) });
  },

  async reorderNotes(noteIds) {
    const orderMap = new Map(noteIds.map((id, index) => [id, index]));
    const notes = [...get().notes]
      .map((n) => {
        const newOrder = orderMap.get(n.id);
        return newOrder !== undefined ? { ...n, order: newOrder } : n;
      })
      .sort((a, b) => a.order - b.order);

    set({ notes });
    await get().repo.saveAllNotes(notes);
  },

  async setNoteReminder(noteId, reminder) {
    await get().updateNote(noteId, { reminder });
  },

  async markReminderTriggered(noteId) {
    const note = get().notes.find((n) => n.id === noteId);
    if (note && note.reminder) {
      const updatedReminder: NoteReminder = {
        ...note.reminder,
        isTriggered: true,
      };
      await get().updateNote(noteId, { reminder: updatedReminder });
    }
  },

  async checkReminders() {
    const notes = get().notes;
    await checkAndTriggerDueReminders(notes, async (noteId) => {
      await get().markReminderTriggered(noteId);
    });
  },

  async addBlock(noteId, type) {
    const note = get().notes.find((n) => n.id === noteId);
    if (!note) return;
    const newBlock: ContentBlock = {
      id: generateId(),
      type,
      content: '',
      checklistItems: type === 'checklist' ? [] : undefined,
      order: note.blocks.length,
    };
    await get().updateNote(noteId, { blocks: [...note.blocks, newBlock] });
  },

  async updateBlock(noteId, blockId, updates) {
    const note = get().notes.find((n) => n.id === noteId);
    if (!note) return;
    const blocks = note.blocks.map((b) => (b.id === blockId ? { ...b, ...updates } : b));
    await get().updateNote(noteId, { blocks });
  },

  async removeBlock(noteId, blockId) {
    const note = get().notes.find((n) => n.id === noteId);
    if (!note) return;
    await get().updateNote(noteId, { blocks: note.blocks.filter((b) => b.id !== blockId) });
  },

  async toggleChecklistItem(noteId, blockId, itemId) {
    const note = get().notes.find((n) => n.id === noteId);
    if (!note) return;
    const blocks = note.blocks.map((b) => {
      if (b.id === blockId && b.checklistItems) {
        return {
          ...b,
          checklistItems: b.checklistItems.map((item) =>
            item.id === itemId ? { ...item, checked: !item.checked } : item
          ),
        };
      }
      return b;
    });
    await get().updateNote(noteId, { blocks });
  },

  async addChecklistItem(noteId, blockId, text) {
    const note = get().notes.find((n) => n.id === noteId);
    if (!note) return;
    const blocks = note.blocks.map((b) => {
      if (b.id === blockId && b.checklistItems) {
        const newItem: ChecklistItem = {
          id: generateId(),
          text,
          checked: false,
          order: b.checklistItems.length,
        };
        return { ...b, checklistItems: [...b.checklistItems, newItem] };
      }
      return b;
    });
    await get().updateNote(noteId, { blocks });
  },

  async removeChecklistItem(noteId, blockId, itemId) {
    const note = get().notes.find((n) => n.id === noteId);
    if (!note) return;
    const blocks = note.blocks.map((b) => {
      if (b.id === blockId && b.checklistItems) {
        return { ...b, checklistItems: b.checklistItems.filter((i) => i.id !== itemId) };
      }
      return b;
    });
    await get().updateNote(noteId, { blocks });
  },

  async updateChecklistItem(noteId, blockId, itemId, text) {
    const note = get().notes.find((n) => n.id === noteId);
    if (!note) return;
    const blocks = note.blocks.map((b) => {
      if (b.id === blockId && b.checklistItems) {
        return {
          ...b,
          checklistItems: b.checklistItems.map((i) => (i.id === itemId ? { ...i, text } : i)),
        };
      }
      return b;
    });
    await get().updateNote(noteId, { blocks });
  },

  async addTag(name, color) {
    const tag: Tag = { id: generateId(), name: name.trim(), color };
    const tags = [...get().tags, tag];
    set({ tags });
    await get().repo.saveTags(tags);
  },

  async removeTag(id) {
    const tags = get().tags.filter((t) => t.id !== id);
    const notes = get().notes.map((n) => ({
      ...n,
      tags: n.tags.filter((t) => t.id !== id),
    }));
    const selectedTagIds = get().selectedTagIds.filter((tid) => tid !== id);
    set({ tags, notes, selectedTagIds });
    await get().repo.saveTags(tags);
    await get().repo.saveAllNotes(notes);
  },

  async toggleNoteTag(noteId, tagId) {
    const note = get().notes.find((n) => n.id === noteId);
    const tag = get().tags.find((t) => t.id === tagId);
    if (!note || !tag) return;
    const hasTag = note.tags.some((t) => t.id === tagId);
    const newTags = hasTag ? note.tags.filter((t) => t.id !== tagId) : [...note.tags, tag];
    await get().updateNote(noteId, { tags: newTags });
  },

  clearTagFilter() {
    set({ selectedTagIds: [] });
  },

  setFilterMode(mode) {
    set({ filterMode: mode });
  },

  toggleTagFilter(tagId) {
    const selected = get().selectedTagIds;
    set({
      selectedTagIds: selected.includes(tagId)
        ? selected.filter((id) => id !== tagId)
        : [...selected, tagId],
    });
  },

  setSearchQuery(query) {
    set({ searchQuery: query });
  },

  async updateSettings(updates) {
    const settings = { ...get().settings, ...updates };
    set({ settings });
    await get().repo.saveSettings(settings);
  },

  async toggleViewMode() {
    const nextMode = get().settings.viewMode === 'grid' ? 'list' : 'grid';
    await get().updateSettings({ viewMode: nextMode });
  },

  openEditor(note) {
    set({
      editingNote: note || null,
      isEditorOpen: true,
    });
  },

  closeEditor() {
    set({ editingNote: null, isEditorOpen: false });
  },

  openSettings() {
    set({ isSettingsOpen: true });
  },

  closeSettings() {
    set({ isSettingsOpen: false });
  },

  openTagModal() {
    set({ isTagModalOpen: true });
  },

  closeTagModal() {
    set({ isTagModalOpen: false });
  },

  async exportData() {
    return get().repo.exportAll();
  },

  async importData(json) {
    await get().repo.importAll(json);
    await get().loadAll();
  },

  getFilteredNotes() {
    const { notes, filterMode, selectedTagIds, searchQuery } = get();
    let filtered = notes;

    switch (filterMode) {
      case 'archived':
        filtered = filtered.filter((n) => n.isArchived && !n.isTrashed);
        break;
      case 'trash':
        filtered = filtered.filter((n) => n.isTrashed);
        break;
      default:
        filtered = filtered.filter((n) => !n.isArchived && !n.isTrashed);
    }

    if (selectedTagIds.length > 0) {
      filtered = filtered.filter((n) =>
        selectedTagIds.some((tagId) => n.tags.some((t) => t.id === tagId))
      );
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (n) =>
          n.title.toLowerCase().includes(q) ||
          n.blocks.some(
            (b) =>
              b.content.toLowerCase().includes(q) ||
              b.checklistItems?.some((i) => i.text.toLowerCase().includes(q))
          )
      );
    }

    return filtered.sort((a, b) => {
      if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
      return a.order - b.order;
    });
  },
}));
