import type { Note, AppSettings, Tag } from '@/types';
import { DEFAULT_THEMES } from '@/types';

/**
 * Service / Repository Interface for Data Persistence.
 * Swapping in a remote backend (e.g., Supabase, Firebase, REST API)
 * only requires providing another class implementing NoteRepository.
 */
export interface NoteRepository {
  getAllNotes(): Promise<Note[]>;
  getNote(id: string): Promise<Note | undefined>;
  saveNote(note: Note): Promise<void>;
  deleteNote(id: string): Promise<void>;
  saveAllNotes(notes: Note[]): Promise<void>;
  getAllTags(): Promise<Tag[]>;
  saveTags(tags: Tag[]): Promise<void>;
  getSettings(): Promise<AppSettings>;
  saveSettings(settings: AppSettings): Promise<void>;
  exportAll(): Promise<string>;
  importAll(json: string): Promise<void>;
}

const DB_NAME = 'appnotas_db';
const DB_VERSION = 1;
const NOTES_STORE = 'notes';
const TAGS_STORE = 'tags';
const SETTINGS_STORE = 'settings';

export const INITIAL_SETTINGS: AppSettings = {
  darkMode: false,
  compactView: false,
  viewMode: 'grid',
};

export const INITIAL_TAGS: Tag[] = [
  { id: 'tag-work', name: 'Work', color: '#3b82f6' },
  { id: 'tag-ideas', name: 'Ideas', color: '#8b5cf6' },
  { id: 'tag-todo', name: 'To-Do', color: '#22c55e' },
  { id: 'tag-travel', name: 'Travel', color: '#f97316' },
];

export const INITIAL_NOTES: Note[] = [
  {
    id: 'note-welcome',
    title: 'Welcome to AppNotas! 🚀',
    blocks: [
      {
        id: 'b-welcome-1',
        type: 'text',
        content: 'Your mobile-first, tactile note-taking Progressive Web App (PWA). Works 100% offline with zero data loss.',
        order: 0,
      },
      {
        id: 'b-welcome-2',
        type: 'checklist',
        content: '',
        order: 1,
        checklistItems: [
          { id: 'cl-1', text: 'Swipe right on cards to Archive 📦', checked: false, order: 0 },
          { id: 'cl-2', text: 'Swipe left to send to Trash 🗑️', checked: false, order: 1 },
          { id: 'cl-3', text: 'Drag the grip icon to reorder notes ⇅', checked: true, order: 2 },
          { id: 'cl-4', text: 'Tap + at bottom to create hybrid notes', checked: true, order: 3 },
          { id: 'cl-5', text: 'Export backups in Settings ⚙️', checked: false, order: 4 },
        ],
      },
    ],
    tags: [INITIAL_TAGS[1], INITIAL_TAGS[2]],
    theme: { ...DEFAULT_THEMES[4], icon: '✨' },
    isPinned: true,
    isArchived: false,
    isTrashed: false,
    order: 0,
    createdAt: Date.now() - 3600000 * 2,
    updatedAt: Date.now() - 3600000,
  },
  {
    id: 'note-travel',
    title: 'Weekend Escape Plan 🏔️',
    blocks: [
      {
        id: 'b-travel-1',
        type: 'text',
        content: 'Cabin in the woods booked from Friday 4 PM to Sunday evening. Don\'t forget offline maps.',
        order: 0,
      },
      {
        id: 'b-travel-2',
        type: 'checklist',
        content: '',
        order: 1,
        checklistItems: [
          { id: 'cl-t1', text: 'Pack hiking boots & warm fleece', checked: true, order: 0 },
          { id: 'cl-t2', text: 'Download offline trails map', checked: true, order: 1 },
          { id: 'cl-t3', text: 'Charge camera & powerbanks', checked: false, order: 2 },
          { id: 'cl-t4', text: 'Snacks and hot cocoa mix', checked: false, order: 3 },
        ],
      },
    ],
    tags: [INITIAL_TAGS[3]],
    theme: { ...DEFAULT_THEMES[3], icon: '🌲' },
    isPinned: false,
    isArchived: false,
    isTrashed: false,
    order: 1,
    createdAt: Date.now() - 3600000 * 24,
    updatedAt: Date.now() - 3600000 * 5,
  },
  {
    id: 'note-project',
    title: 'Product Roadmap Q4 🎯',
    blocks: [
      {
        id: 'b-proj-1',
        type: 'text',
        content: 'Focusing on tactile gestures, instant offline sync, and delightful micro-interactions with Framer Motion.',
        order: 0,
      },
      {
        id: 'b-proj-2',
        type: 'checklist',
        content: '',
        order: 1,
        checklistItems: [
          { id: 'cl-p1', text: 'Tailwind CSS fluid styling', checked: true, order: 0 },
          { id: 'cl-p2', text: 'IndexedDB robust storage layer', checked: true, order: 1 },
          { id: 'cl-p3', text: 'Vercel one-click deployment ready', checked: true, order: 2 },
        ],
      },
    ],
    tags: [INITIAL_TAGS[0]],
    theme: { ...DEFAULT_THEMES[2], icon: '💼' },
    isPinned: false,
    isArchived: false,
    isTrashed: false,
    order: 2,
    createdAt: Date.now() - 3600000 * 48,
    updatedAt: Date.now() - 3600000 * 12,
  },
];

/**
 * LocalStorage Repository - Fallback implementation
 */
export class LocalStorageRepository implements NoteRepository {
  private notesKey = 'appnotas_notes';
  private tagsKey = 'appnotas_tags';
  private settingsKey = 'appnotas_settings';

  private isClient(): boolean {
    return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
  }

  async getAllNotes(): Promise<Note[]> {
    if (!this.isClient()) return INITIAL_NOTES;
    try {
      const data = localStorage.getItem(this.notesKey);
      if (!data) {
        await this.saveAllNotes(INITIAL_NOTES);
        return INITIAL_NOTES;
      }
      return JSON.parse(data);
    } catch {
      return INITIAL_NOTES;
    }
  }

  async getNote(id: string): Promise<Note | undefined> {
    const notes = await this.getAllNotes();
    return notes.find((n) => n.id === id);
  }

  async saveNote(note: Note): Promise<void> {
    const notes = await this.getAllNotes();
    const index = notes.findIndex((n) => n.id === note.id);
    if (index >= 0) {
      notes[index] = note;
    } else {
      notes.push(note);
    }
    await this.saveAllNotes(notes);
  }

  async deleteNote(id: string): Promise<void> {
    const notes = await this.getAllNotes();
    const filtered = notes.filter((n) => n.id !== id);
    await this.saveAllNotes(filtered);
  }

  async saveAllNotes(notes: Note[]): Promise<void> {
    if (!this.isClient()) return;
    localStorage.setItem(this.notesKey, JSON.stringify(notes));
  }

  async getAllTags(): Promise<Tag[]> {
    if (!this.isClient()) return INITIAL_TAGS;
    try {
      const data = localStorage.getItem(this.tagsKey);
      if (!data) {
        await this.saveTags(INITIAL_TAGS);
        return INITIAL_TAGS;
      }
      return JSON.parse(data);
    } catch {
      return INITIAL_TAGS;
    }
  }

  async saveTags(tags: Tag[]): Promise<void> {
    if (!this.isClient()) return;
    localStorage.setItem(this.tagsKey, JSON.stringify(tags));
  }

  async getSettings(): Promise<AppSettings> {
    if (!this.isClient()) return INITIAL_SETTINGS;
    try {
      const data = localStorage.getItem(this.settingsKey);
      return data ? { ...INITIAL_SETTINGS, ...JSON.parse(data) } : INITIAL_SETTINGS;
    } catch {
      return INITIAL_SETTINGS;
    }
  }

  async saveSettings(settings: AppSettings): Promise<void> {
    if (!this.isClient()) return;
    localStorage.setItem(this.settingsKey, JSON.stringify(settings));
  }

  async exportAll(): Promise<string> {
    const notes = await this.getAllNotes();
    const tags = await this.getAllTags();
    const settings = await this.getSettings();
    return JSON.stringify(
      { version: 1, exportedAt: new Date().toISOString(), notes, tags, settings },
      null,
      2
    );
  }

  async importAll(json: string): Promise<void> {
    const data = JSON.parse(json);
    if (Array.isArray(data.notes)) await this.saveAllNotes(data.notes);
    if (Array.isArray(data.tags)) await this.saveTags(data.tags);
    if (data.settings) await this.saveSettings(data.settings);
  }
}

/**
 * IndexedDB Repository - Primary offline storage implementation
 */
export class IndexedDBRepository implements NoteRepository {
  private fallback = new LocalStorageRepository();

  private isAvailable(): boolean {
    return typeof window !== 'undefined' && !!window.indexedDB;
  }

  private openDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      if (!this.isAvailable()) {
        return reject(new Error('IndexedDB unavailable'));
      }

      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(NOTES_STORE)) {
          db.createObjectStore(NOTES_STORE, { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains(TAGS_STORE)) {
          db.createObjectStore(TAGS_STORE, { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains(SETTINGS_STORE)) {
          db.createObjectStore(SETTINGS_STORE);
        }
      };
    });
  }

  async getAllNotes(): Promise<Note[]> {
    if (!this.isAvailable()) return this.fallback.getAllNotes();
    try {
      const db = await this.openDB();
      return new Promise<Note[]>((resolve, reject) => {
        const tx = db.transaction(NOTES_STORE, 'readonly');
        const store = tx.objectStore(NOTES_STORE);
        const req = store.getAll();
        req.onsuccess = async () => {
          const result = req.result as Note[];
          if (!result || result.length === 0) {
            // Seed sample notes for a delightful first-time experience
            await this.saveAllNotes(INITIAL_NOTES);
            resolve(INITIAL_NOTES);
          } else {
            resolve(result);
          }
        };
        req.onerror = () => reject(req.error);
      });
    } catch {
      return this.fallback.getAllNotes();
    }
  }

  async getNote(id: string): Promise<Note | undefined> {
    if (!this.isAvailable()) return this.fallback.getNote(id);
    try {
      const db = await this.openDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(NOTES_STORE, 'readonly');
        const store = tx.objectStore(NOTES_STORE);
        const req = store.get(id);
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      });
    } catch {
      return this.fallback.getNote(id);
    }
  }

  async saveNote(note: Note): Promise<void> {
    if (!this.isAvailable()) return this.fallback.saveNote(note);
    try {
      const db = await this.openDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(NOTES_STORE, 'readwrite');
        const store = tx.objectStore(NOTES_STORE);
        const req = store.put(note);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    } catch {
      return this.fallback.saveNote(note);
    }
  }

  async deleteNote(id: string): Promise<void> {
    if (!this.isAvailable()) return this.fallback.deleteNote(id);
    try {
      const db = await this.openDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(NOTES_STORE, 'readwrite');
        const store = tx.objectStore(NOTES_STORE);
        const req = store.delete(id);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    } catch {
      return this.fallback.deleteNote(id);
    }
  }

  async saveAllNotes(notes: Note[]): Promise<void> {
    if (!this.isAvailable()) return this.fallback.saveAllNotes(notes);
    try {
      const db = await this.openDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(NOTES_STORE, 'readwrite');
        const store = tx.objectStore(NOTES_STORE);
        store.clear();
        for (const note of notes) {
          store.put(note);
        }
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
    } catch {
      return this.fallback.saveAllNotes(notes);
    }
  }

  async getAllTags(): Promise<Tag[]> {
    if (!this.isAvailable()) return this.fallback.getAllTags();
    try {
      const db = await this.openDB();
      return new Promise<Tag[]>((resolve, reject) => {
        const tx = db.transaction(TAGS_STORE, 'readonly');
        const store = tx.objectStore(TAGS_STORE);
        const req = store.getAll();
        req.onsuccess = async () => {
          const res = req.result as Tag[];
          if (!res || res.length === 0) {
            await this.saveTags(INITIAL_TAGS);
            resolve(INITIAL_TAGS);
          } else {
            resolve(res);
          }
        };
        req.onerror = () => reject(req.error);
      });
    } catch {
      return this.fallback.getAllTags();
    }
  }

  async saveTags(tags: Tag[]): Promise<void> {
    if (!this.isAvailable()) return this.fallback.saveTags(tags);
    try {
      const db = await this.openDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(TAGS_STORE, 'readwrite');
        const store = tx.objectStore(TAGS_STORE);
        store.clear();
        for (const tag of tags) {
          store.put(tag);
        }
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
    } catch {
      return this.fallback.saveTags(tags);
    }
  }

  async getSettings(): Promise<AppSettings> {
    if (!this.isAvailable()) return this.fallback.getSettings();
    try {
      const db = await this.openDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(SETTINGS_STORE, 'readonly');
        const store = tx.objectStore(SETTINGS_STORE);
        const req = store.get('settings');
        req.onsuccess = () => resolve(req.result ? { ...INITIAL_SETTINGS, ...req.result } : INITIAL_SETTINGS);
        req.onerror = () => reject(req.error);
      });
    } catch {
      return this.fallback.getSettings();
    }
  }

  async saveSettings(settings: AppSettings): Promise<void> {
    if (!this.isAvailable()) return this.fallback.saveSettings(settings);
    try {
      const db = await this.openDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(SETTINGS_STORE, 'readwrite');
        const store = tx.objectStore(SETTINGS_STORE);
        const req = store.put(settings, 'settings');
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    } catch {
      return this.fallback.saveSettings(settings);
    }
  }

  async exportAll(): Promise<string> {
    const notes = await this.getAllNotes();
    const tags = await this.getAllTags();
    const settings = await this.getSettings();
    return JSON.stringify(
      {
        version: 1,
        appName: 'AppNotas',
        exportedAt: new Date().toISOString(),
        notes,
        tags,
        settings,
      },
      null,
      2
    );
  }

  async importAll(json: string): Promise<void> {
    const data = JSON.parse(json);
    if (Array.isArray(data.notes)) await this.saveAllNotes(data.notes);
    if (Array.isArray(data.tags)) await this.saveTags(data.tags);
    if (data.settings) await this.saveSettings(data.settings);
  }
}

/**
 * Example Template for Remote Supabase Repository:
 * Easily swap this in with zero modifications to any UI component.
 */
export class SupabaseNoteRepository implements NoteRepository {
  constructor(private supabaseClient?: unknown) {}

  async getAllNotes(): Promise<Note[]> {
    // const { data } = await this.supabaseClient.from('notes').select('*');
    // return data || [];
    throw new Error('Supabase integration requires credentials. Swap via useStore.');
  }

  async getNote(id: string): Promise<Note | undefined> {
    throw new Error('Supabase integration requires credentials.');
  }

  async saveNote(note: Note): Promise<void> {
    throw new Error('Supabase integration requires credentials.');
  }

  async deleteNote(id: string): Promise<void> {
    throw new Error('Supabase integration requires credentials.');
  }

  async saveAllNotes(notes: Note[]): Promise<void> {
    throw new Error('Supabase integration requires credentials.');
  }

  async getAllTags(): Promise<Tag[]> {
    throw new Error('Supabase integration requires credentials.');
  }

  async saveTags(tags: Tag[]): Promise<void> {
    throw new Error('Supabase integration requires credentials.');
  }

  async getSettings(): Promise<AppSettings> {
    return INITIAL_SETTINGS;
  }

  async saveSettings(settings: AppSettings): Promise<void> {
    // Save to user metadata
  }

  async exportAll(): Promise<string> {
    return JSON.stringify({ notes: [], tags: [], settings: INITIAL_SETTINGS });
  }

  async importAll(json: string): Promise<void> {}
}

export const indexedDBRepository = new IndexedDBRepository();
