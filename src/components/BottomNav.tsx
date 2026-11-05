'use client';

import { motion } from 'framer-motion';
import { useStore } from '@/store/useStore';
import type { FilterMode } from '@/types';

export default function BottomNav() {
  const {
    filterMode,
    setFilterMode,
    openEditor,
    openSettings,
    openTagModal,
    selectedTagIds,
  } = useStore();

  const handleTap = (action: string) => {
    if (action === 'all' || action === 'archived') {
      setFilterMode(action as FilterMode);
    } else if (action === 'tags') {
      openTagModal();
    } else if (action === 'settings') {
      openSettings();
    }
  };

  const navItems = [
    { id: 'all', label: 'Notas', icon: '📝', isActive: filterMode === 'all' && selectedTagIds.length === 0 },
    { id: 'tags', label: 'Etiquetas', icon: '🏷️', isActive: selectedTagIds.length > 0, badge: selectedTagIds.length || undefined },
    { id: 'archived', label: 'Archivadas', icon: '📦', isActive: filterMode === 'archived' },
    { id: 'settings', label: 'Ajustes', icon: '⚙️', isActive: false },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 safe-area-bottom pointer-events-none">
      <div className="bg-white/85 dark:bg-zinc-900/85 backdrop-blur-xl border-t border-zinc-200/70 dark:border-zinc-800 shadow-[0_-4px_24px_rgba(0,0,0,0.06)] pointer-events-auto">
        <div className="flex items-center justify-around px-3 py-1.5 max-w-lg mx-auto relative">
          {navItems.map((item) => (
            <motion.button
              key={item.id}
              whileTap={{ scale: 0.9 }}
              onClick={() => handleTap(item.id)}
              className={`flex flex-col items-center justify-center py-1.5 px-3 rounded-2xl transition-all min-w-[64px] relative ${
                item.isActive
                  ? 'text-blue-600 dark:text-blue-400 font-semibold'
                  : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200'
              }`}
            >
              <div className="relative">
                <span className="text-xl mb-0.5 inline-block">{item.icon}</span>
                {item.badge && (
                  <span className="absolute -top-1 -right-2 w-4 h-4 rounded-full bg-blue-600 text-white text-[9px] font-bold flex items-center justify-center shadow">
                    {item.badge}
                  </span>
                )}
              </div>
              <span className="text-[10px] tracking-tight">{item.label}</span>
              {item.isActive && (
                <motion.div
                  layoutId="activeTabIndicator"
                  className="absolute bottom-0 w-8 h-1 rounded-full bg-blue-600 dark:bg-blue-400 shadow-sm"
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
              )}
            </motion.button>
          ))}

          {/* Botón Flotante (FAB) - Crear Nota */}
          <div className="absolute -top-6 left-1/2 -translate-x-1/2">
            <motion.button
              whileTap={{ scale: 0.88 }}
              whileHover={{ scale: 1.08 }}
              onClick={() => openEditor()}
              aria-label="Crear nueva nota"
              className="w-14 h-14 rounded-full bg-gradient-to-tr from-blue-600 via-indigo-600 to-violet-500 text-white shadow-xl shadow-blue-500/35 flex items-center justify-center text-3xl border-2 border-white dark:border-zinc-900 group"
            >
              <motion.span
                initial={{ rotate: 0 }}
                whileTap={{ rotate: 90 }}
                transition={{ duration: 0.15 }}
                className="font-light leading-none mb-1 group-hover:scale-110 transition-transform"
              >
                +
              </motion.span>
            </motion.button>
          </div>
        </div>
      </div>
    </nav>
  );
}
