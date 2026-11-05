'use client';

import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { useStore } from '@/store/useStore';
import Header from '@/components/Header';
import NoteGrid from '@/components/NoteGrid';
import NoteEditor from '@/components/NoteEditor';
import SettingsPanel from '@/components/SettingsPanel';
import TagManagerModal from '@/components/TagManagerModal';
import BottomNav from '@/components/BottomNav';

export default function Home() {
  const { isLoaded, loadAll, settings, checkReminders } = useStore();

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  // Aplicar modo oscuro
  useEffect(() => {
    if (settings.darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [settings.darkMode]);

  // Registrar Service Worker para PWA y notificaciones
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    }
  }, []);

  // Temporizador en segundo plano para comprobar y disparar recordatorios cada 30 segundos
  useEffect(() => {
    if (!isLoaded) return;
    // Comprobación inicial al montar
    checkReminders();
    const interval = setInterval(() => {
      checkReminders();
    }, 30000);
    return () => clearInterval(interval);
  }, [isLoaded, checkReminders]);

  if (!isLoaded) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-white dark:bg-zinc-950">
        <motion.div
          animate={{ scale: [1, 1.2, 1], rotate: [0, 10, -10, 0] }}
          transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}
          className="text-5xl mb-3"
        >
          📒
        </motion.div>
        <p className="text-xs font-semibold text-zinc-400 tracking-wider uppercase animate-pulse">
          Cargando AppNotas...
        </p>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-zinc-50/50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 relative selection:bg-blue-500/20">
      <Header />
      <NoteGrid />
      <NoteEditor />
      <TagManagerModal />
      <SettingsPanel />
      <BottomNav />
    </main>
  );
}
