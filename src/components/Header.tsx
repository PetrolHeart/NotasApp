'use client';

import { motion } from 'framer-motion';
import { useStore } from '@/store/useStore';

export default function Header() {
  const {
    filterMode,
    notes,
    selectedTagIds,
    tags,
    clearTagFilter,
    settings,
    toggleViewMode,
    setFilterMode,
  } = useStore();

  const activeNotes = notes.filter((n) => !n.isArchived && !n.isTrashed);
  const archivedNotes = notes.filter((n) => n.isArchived && !n.isTrashed);
  const trashedNotes = notes.filter((n) => n.isTrashed);

  const getTitle = () => {
    if (filterMode === 'archived') return 'Archivadas';
    if (filterMode === 'trash') return 'Papelera';
    if (selectedTagIds.length > 0) {
      const activeTagNames = tags
        .filter((t) => selectedTagIds.includes(t.id))
        .map((t) => t.name)
        .join(', ');
      return `#${activeTagNames}`;
    }
    return 'AppNotas';
  };

  const count =
    filterMode === 'archived'
      ? archivedNotes.length
      : filterMode === 'trash'
      ? trashedNotes.length
      : activeNotes.length;

  return (
    <motion.header
      initial={{ opacity: 0, y: -15 }}
      animate={{ opacity: 1, y: 0 }}
      className="sticky top-0 z-40 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl border-b border-zinc-200/50 dark:border-zinc-800/60 safe-area-top"
    >
      <div className="flex items-center justify-between px-5 py-3.5 max-w-5xl mx-auto">
        <div className="flex items-center gap-2">
          {filterMode !== 'all' || selectedTagIds.length > 0 ? (
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => {
                setFilterMode('all');
                clearTagFilter();
              }}
              className="mr-1 p-1.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 text-xs font-semibold flex items-center gap-1 hover:bg-zinc-200"
            >
              ← Volver
            </motion.button>
          ) : null}

          <div>
            <h1 className="text-xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <span>{getTitle()}</span>
              {filterMode === 'all' && selectedTagIds.length === 0 && (
                <span className="text-sm">✨</span>
              )}
            </h1>
            <p className="text-[11px] font-medium text-zinc-400 dark:text-zinc-500">
              {count} {count === 1 ? 'nota' : 'notas'}
              {selectedTagIds.length > 0 && ' (filtradas)'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Alternar modo de vista: Cuadrícula o Lista */}
          <motion.button
            whileTap={{ scale: 0.88 }}
            onClick={toggleViewMode}
            title={settings.viewMode === 'grid' ? 'Cambiar a vista de lista' : 'Cambiar a cuadrícula'}
            className="w-9 h-9 rounded-xl bg-zinc-100 dark:bg-zinc-800/80 hover:bg-zinc-200 dark:hover:bg-zinc-700 flex items-center justify-center text-sm transition-colors"
          >
            {settings.viewMode === 'grid' ? '☰' : '⊞'}
          </motion.button>

          {/* Acceso directo a la papelera */}
          {filterMode === 'all' && (
            <motion.button
              whileTap={{ scale: 0.88 }}
              onClick={() => setFilterMode('trash')}
              title="Papelera de reciclaje"
              className="w-9 h-9 rounded-xl bg-zinc-100 dark:bg-zinc-800/80 hover:bg-zinc-200 dark:hover:bg-zinc-700 flex items-center justify-center text-sm transition-colors relative"
            >
              🗑️
              {trashedNotes.length > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[9px] font-bold flex items-center justify-center">
                  {trashedNotes.length}
                </span>
              )}
            </motion.button>
          )}
        </div>
      </div>
    </motion.header>
  );
}
