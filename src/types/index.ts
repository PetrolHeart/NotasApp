export interface ChecklistItem {
  id: string;
  text: string;
  checked: boolean;
  order: number;
}

export interface ContentBlock {
  id: string;
  type: 'text' | 'checklist';
  content: string; // Para bloques de texto, el contenido
  checklistItems?: ChecklistItem[]; // Para bloques de lista de tareas
  order: number;
}

export interface NoteTheme {
  background: string; // Clase de degradado o color de Tailwind
  icon?: string; // Emoji o identificador de icono
  textColor?: string;
  accentColor?: string;
}

export interface Tag {
  id: string;
  name: string;
  color: string; // Hex o color CSS
}

export interface NoteReminder {
  dateTime: string; // Formato ISO String
  isTriggered: boolean;
}

export interface Note {
  id: string;
  title: string;
  blocks: ContentBlock[];
  tags: Tag[];
  theme: NoteTheme;
  isPinned: boolean;
  isArchived: boolean;
  isTrashed: boolean;
  order: number;
  createdAt: number;
  updatedAt: number;
  reminder?: NoteReminder | null;
}

export type FilterMode = 'all' | 'archived' | 'trash';

export interface AppSettings {
  darkMode: boolean;
  compactView: boolean;
  viewMode: 'grid' | 'list';
}

export const DEFAULT_THEMES: NoteTheme[] = [
  { background: 'bg-white dark:bg-zinc-800/90', textColor: 'text-zinc-900 dark:text-zinc-100', accentColor: '#3b82f6' },
  { background: 'bg-gradient-to-br from-amber-50 to-orange-100/80 dark:from-amber-950/40 dark:to-orange-900/40', textColor: 'text-amber-950 dark:text-amber-100', accentColor: '#f59e0b' },
  { background: 'bg-gradient-to-br from-sky-50 to-blue-100/80 dark:from-sky-950/40 dark:to-blue-900/40', textColor: 'text-sky-950 dark:text-sky-100', accentColor: '#0284c7' },
  { background: 'bg-gradient-to-br from-emerald-50 to-green-100/80 dark:from-emerald-950/40 dark:to-green-900/40', textColor: 'text-emerald-950 dark:text-emerald-100', accentColor: '#10b981' },
  { background: 'bg-gradient-to-br from-violet-50 to-purple-100/80 dark:from-violet-950/40 dark:to-purple-900/40', textColor: 'text-violet-950 dark:text-violet-100', accentColor: '#8b5cf6' },
  { background: 'bg-gradient-to-br from-rose-50 to-pink-100/80 dark:from-rose-950/40 dark:to-pink-900/40', textColor: 'text-rose-950 dark:text-rose-100', accentColor: '#f43f5e' },
  { background: 'bg-gradient-to-br from-slate-100 to-zinc-200/80 dark:from-slate-900 dark:to-zinc-800', textColor: 'text-slate-900 dark:text-slate-100', accentColor: '#64748b' },
  { background: 'bg-gradient-to-br from-yellow-50 to-lime-100/80 dark:from-yellow-950/40 dark:to-lime-900/40', textColor: 'text-lime-950 dark:text-lime-100', accentColor: '#84cc16' },
];

export const DEFAULT_TAG_COLORS = [
  '#ef4444', '#f97316', '#eab308', '#22c55e', '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899',
];
