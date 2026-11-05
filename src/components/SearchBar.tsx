'use client';

import { motion } from 'framer-motion';
import { useStore } from '@/store/useStore';

export default function SearchBar() {
  const {
    searchQuery,
    setSearchQuery,
    tags,
    selectedTagIds,
    toggleTagFilter,
    clearTagFilter,
    openTagModal,
  } = useStore();

  return (
    <div className="mb-5">
      {/* Caja de Entrada de Búsqueda */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative"
      >
        <input
          type="text"
          placeholder="Buscar notas, listas, etiquetas..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-4 py-3 pl-11 pr-10 rounded-2xl bg-zinc-100/80 dark:bg-zinc-800/80 backdrop-blur-md text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 outline-none border border-zinc-200/50 dark:border-zinc-750 focus:border-blue-500 dark:focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all shadow-xs"
        />
        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-base text-zinc-400 pointer-events-none">
          🔍
        </span>
        {searchQuery && (
          <motion.button
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            whileTap={{ scale: 0.8 }}
            onClick={() => setSearchQuery('')}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-zinc-300 dark:bg-zinc-600 text-zinc-600 dark:text-zinc-200 text-xs flex items-center justify-center font-bold"
          >
            ✕
          </motion.button>
        )}
      </motion.div>

      {/* Carrusel de Filtro por Etiquetas */}
      {tags.length > 0 && (
        <div className="flex items-center gap-1.5 mt-2.5 overflow-x-auto pb-1 scrollbar-hide text-xs">
          {/* Todas las notas */}
          <motion.button
            whileTap={{ scale: 0.92 }}
            onClick={clearTagFilter}
            className={`px-3 py-1 rounded-full font-semibold whitespace-nowrap transition-all flex items-center gap-1 ${
              selectedTagIds.length === 0
                ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 shadow-xs'
                : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
            }`}
          >
            <span>Todas</span>
          </motion.button>

          {/* Chips de etiquetas */}
          {tags.map((tag) => {
            const isSelected = selectedTagIds.includes(tag.id);
            return (
              <motion.button
                key={tag.id}
                whileTap={{ scale: 0.92 }}
                onClick={() => toggleTagFilter(tag.id)}
                className={`px-3 py-1 rounded-full font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                  isSelected
                    ? 'text-white shadow-sm ring-1 ring-white/30'
                    : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                }`}
                style={isSelected ? { backgroundColor: tag.color } : {}}
              >
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: tag.color }}
                />
                <span>#{tag.name}</span>
                {isSelected && <span className="text-[10px]">✕</span>}
              </motion.button>
            );
          })}

          {/* Botón Gestionar Etiquetas */}
          <motion.button
            whileTap={{ scale: 0.92 }}
            onClick={openTagModal}
            className="px-2.5 py-1 rounded-full font-semibold whitespace-nowrap bg-zinc-100 dark:bg-zinc-800/60 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors"
            title="Gestionar etiquetas"
          >
            + Etiquetas
          </motion.button>
        </div>
      )}
    </div>
  );
}
