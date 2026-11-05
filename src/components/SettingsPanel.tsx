'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '@/store/useStore';
import { DEFAULT_TAG_COLORS } from '@/types';
import { INITIAL_NOTES, INITIAL_TAGS } from '@/lib/storage';
import {
  getNotificationPermissionStatus,
  requestNotificationPermission,
  showLocalNotification,
  type NotificationStatus,
} from '@/lib/reminderService';

export default function SettingsPanel() {
  const {
    isSettingsOpen,
    closeSettings,
    settings,
    updateSettings,
    tags,
    addTag,
    removeTag,
    notes,
    exportData,
    importData,
    loadAll,
    repo,
  } = useStore();

  const [newTagName, setNewTagName] = useState('');
  const [newTagColor, setNewTagColor] = useState(DEFAULT_TAG_COLORS[0]);
  const [exportStatus, setExportStatus] = useState('');
  const [importStatus, setImportStatus] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [notificationPermission, setNotificationPermission] = useState<NotificationStatus>('default');
  const [testNotificationStatus, setTestNotificationStatus] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isSettingsOpen) {
      setNotificationPermission(getNotificationPermissionStatus());
    }
  }, [isSettingsOpen]);

  const handleRequestPermission = async () => {
    const res = await requestNotificationPermission();
    setNotificationPermission(res);
    if (res === 'granted') {
      setTestNotificationStatus('✅ Permiso concedido');
      setTimeout(() => setTestNotificationStatus(''), 3000);
    } else if (res === 'denied') {
      setTestNotificationStatus('❌ Permiso denegado por el navegador');
      setTimeout(() => setTestNotificationStatus(''), 4000);
    }
  };

  const handleTestNotification = async () => {
    if (notificationPermission !== 'granted') {
      const res = await requestNotificationPermission();
      setNotificationPermission(res);
      if (res !== 'granted') {
        setTestNotificationStatus('⚠️ Se necesita permiso para enviar notificaciones.');
        setTimeout(() => setTestNotificationStatus(''), 3000);
        return;
      }
    }

    const success = await showLocalNotification(
      '🔔 Notificación de prueba',
      '¡Tu sistema de alarmas y recordatorios locales está funcionando correctamente en AppNotas!'
    );

    if (success) {
      setTestNotificationStatus('✅ Notificación enviada');
    } else {
      setTestNotificationStatus('❌ No se pudo enviar la notificación');
    }
    setTimeout(() => setTestNotificationStatus(''), 3000);
  };

  const handleExport = async () => {
    try {
      setExportStatus('Generando copia de seguridad...');
      const json = await exportData();
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `appnotas-copia-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setExportStatus('✅ ¡Copia de seguridad descargada con éxito!');
      setTimeout(() => setExportStatus(''), 4000);
    } catch {
      setExportStatus('❌ Error al exportar los datos');
      setTimeout(() => setExportStatus(''), 4000);
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsImporting(true);
    setImportStatus('Leyendo archivo de respaldo...');
    try {
      const text = await file.text();
      await importData(text);
      setImportStatus('✅ ¡Copia de seguridad restaurada con éxito!');
      setTimeout(() => setImportStatus(''), 4000);
    } catch {
      setImportStatus('❌ Formato de archivo JSON inválido');
      setTimeout(() => setImportStatus(''), 4000);
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleAddTag = async () => {
    if (newTagName.trim()) {
      await addTag(newTagName.trim(), newTagColor);
      setNewTagName('');
    }
  };

  const handleResetSampleData = async () => {
    if (confirm('¿Restablecer a las notas de ejemplo iniciales? Los datos actuales se reemplazarán.')) {
      await repo.saveAllNotes(INITIAL_NOTES);
      await repo.saveTags(INITIAL_TAGS);
      await loadAll();
    }
  };

  const getPermissionLabel = () => {
    switch (notificationPermission) {
      case 'granted':
        return { label: 'Concedido', color: 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40' };
      case 'denied':
        return { label: 'Bloqueado', color: 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40' };
      case 'unsupported':
        return { label: 'No soportado', color: 'text-zinc-500 bg-zinc-100 dark:bg-zinc-800' };
      default:
        return { label: 'Pendiente', color: 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40' };
    }
  };

  const permBadge = getPermissionLabel();
  const pendingRemindersCount = notes.filter(
    (n) => n.reminder && !n.reminder.isTriggered && !n.isTrashed && !n.isArchived
  ).length;

  return (
    <AnimatePresence>
      {isSettingsOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
          onClick={closeSettings}
        >
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 26, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-xl max-h-[88vh] bg-white dark:bg-zinc-900 rounded-t-3xl sm:rounded-3xl overflow-hidden flex flex-col shadow-2xl border border-zinc-200/60 dark:border-zinc-800"
          >
            {/* Manija de arrastre */}
            <div className="flex justify-center pt-3 pb-1 sm:hidden">
              <div className="w-10 h-1.5 rounded-full bg-zinc-300 dark:bg-zinc-700" />
            </div>

            {/* Cabecera */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 dark:border-zinc-800">
              <div className="flex items-center gap-2">
                <span className="text-xl">⚙️</span>
                <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">Ajustes</h2>
              </div>
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={closeSettings}
                className="text-sm text-blue-600 dark:text-blue-400 font-bold px-3 py-1 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-950/30"
              >
                Listo
              </motion.button>
            </div>

            {/* Contenido */}
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
              {/* Apariencia y diseño */}
              <section>
                <h3 className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-3">
                  Apariencia y Diseño
                </h3>
                <div className="space-y-2.5">
                  <ToggleRow
                    label="Modo Oscuro"
                    description="Alterna entre tema claro y tema medianoche"
                    icon="🌙"
                    value={settings.darkMode}
                    onChange={(v) => updateSettings({ darkMode: v })}
                  />
                  <ToggleRow
                    label="Cuadrícula Compacta"
                    description="Espaciado más ajustado para pantallas móviles pequeñas"
                    icon="📱"
                    value={settings.compactView}
                    onChange={(v) => updateSettings({ compactView: v })}
                  />
                  <ToggleRow
                    label="Vista en Lista"
                    description="Muestra las notas en una lista de ancho completo"
                    icon="☰"
                    value={settings.viewMode === 'list'}
                    onChange={(v) => updateSettings({ viewMode: v ? 'list' : 'grid' })}
                  />
                </div>
              </section>

              {/* Recordatorios y Notificaciones */}
              <section>
                <h3 className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-3">
                  Recordatorios y Alarmas
                </h3>
                <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200/50 dark:border-zinc-700/50 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <span className="text-xl">🔔</span>
                      <div>
                        <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100 block">
                          Notificaciones Locales
                        </span>
                        <span className="text-[11px] text-zinc-400 dark:text-zinc-500">
                          {pendingRemindersCount} {pendingRemindersCount === 1 ? 'recordatorio pendiente' : 'recordatorios pendientes'}
                        </span>
                      </div>
                    </div>
                    <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${permBadge.color}`}>
                      {permBadge.label}
                    </span>
                  </div>

                  {testNotificationStatus && (
                    <p className="text-xs text-center font-semibold text-blue-600 dark:text-blue-400 py-1">
                      {testNotificationStatus}
                    </p>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                    {notificationPermission !== 'granted' && notificationPermission !== 'unsupported' ? (
                      <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={handleRequestPermission}
                        className="w-full py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition-colors"
                      >
                        Activar Notificaciones
                      </motion.button>
                    ) : null}

                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={handleTestNotification}
                      className="w-full py-2 px-3 rounded-xl bg-zinc-200 dark:bg-zinc-700 hover:bg-zinc-300 dark:hover:bg-zinc-600 text-zinc-800 dark:text-zinc-200 font-bold text-xs transition-colors"
                    >
                      Probar Notificación
                    </motion.button>
                  </div>
                </div>
              </section>

              {/* Persistencia de datos y seguridad */}
              <section>
                <h3 className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-3">
                  Persistencia de Datos y Seguridad Local
                </h3>

                {/* Tarjeta de estado del almacenamiento */}
                <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl p-4 border border-zinc-200/60 dark:border-zinc-700/60 mb-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                      Motor de Almacenamiento
                    </span>
                    <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full">
                      IndexedDB (Activo)
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center pt-2 border-t border-zinc-200/40 dark:border-zinc-700/40 text-xs">
                    <div>
                      <div className="font-bold text-zinc-800 dark:text-zinc-200">{notes.length}</div>
                      <div className="text-[10px] text-zinc-400">Notas Totales</div>
                    </div>
                    <div>
                      <div className="font-bold text-zinc-800 dark:text-zinc-200">{tags.length}</div>
                      <div className="text-[10px] text-zinc-400">Etiquetas</div>
                    </div>
                    <div>
                      <div className="font-bold text-zinc-800 dark:text-zinc-200">100%</div>
                      <div className="text-[10px] text-zinc-400">Sin Conexión</div>
                    </div>
                  </div>
                </div>

                {/* Acciones de Copia y Restauración */}
                <div className="space-y-2.5">
                  <motion.button
                    whileTap={{ scale: 0.98 }}
                    onClick={handleExport}
                    className="w-full text-left flex items-center justify-between p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-zinc-200/50 dark:border-zinc-700/50 transition-all group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center text-xl">
                        💾
                      </div>
                      <div>
                        <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                          Exportar Copia de Seguridad (JSON)
                        </p>
                        <p className="text-[11px] text-zinc-500">
                          Descarga en un clic todas tus notas, tareas y etiquetas
                        </p>
                      </div>
                    </div>
                    <span className="text-zinc-400 group-hover:translate-x-1 transition-transform">
                      →
                    </span>
                  </motion.button>

                  {exportStatus && (
                    <p className="text-xs font-semibold text-center text-emerald-600 dark:text-emerald-400 py-1">
                      {exportStatus}
                    </p>
                  )}

                  <motion.button
                    whileTap={{ scale: 0.98 }}
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isImporting}
                    className="w-full text-left flex items-center justify-between p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-zinc-200/50 dark:border-zinc-700/50 transition-all group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center text-xl">
                        📂
                      </div>
                      <div>
                        <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                          Importar Copia de Seguridad
                        </p>
                        <p className="text-[11px] text-zinc-500">
                          Restaura tus notas desde un archivo JSON anterior
                        </p>
                      </div>
                    </div>
                    <span className="text-zinc-400 group-hover:translate-x-1 transition-transform">
                      →
                    </span>
                  </motion.button>

                  {importStatus && (
                    <p className="text-xs font-semibold text-center text-blue-600 dark:text-blue-400 py-1">
                      {importStatus}
                    </p>
                  )}

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".json"
                    onChange={handleImport}
                    className="hidden"
                  />
                </div>
              </section>

              {/* Gestión de Etiquetas */}
              <section>
                <h3 className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-3">
                  Gestionar Etiquetas
                </h3>
                <div className="flex gap-2 mb-3">
                  <input
                    type="text"
                    placeholder="Nueva etiqueta..."
                    value={newTagName}
                    onChange={(e) => setNewTagName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddTag()}
                    className="flex-1 px-3.5 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-sm outline-none text-zinc-900 dark:text-zinc-100"
                  />
                  <div className="flex items-center gap-1">
                    {DEFAULT_TAG_COLORS.slice(0, 4).map((c) => (
                      <button
                        key={c}
                        onClick={() => setNewTagColor(c)}
                        className={`w-6 h-6 rounded-full ${
                          newTagColor === c ? 'ring-2 ring-blue-500 ring-offset-1' : ''
                        }`}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                  <motion.button
                    whileTap={{ scale: 0.92 }}
                    onClick={handleAddTag}
                    className="px-3.5 py-2 rounded-xl bg-blue-600 text-white font-bold text-xs"
                  >
                    Añadir
                  </motion.button>
                </div>

                <div className="flex flex-wrap gap-2">
                  {tags.map((tag) => (
                    <div
                      key={tag.id}
                      className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full text-white font-semibold shadow-xs"
                      style={{ backgroundColor: tag.color }}
                    >
                      <span>{tag.name}</span>
                      <button
                        onClick={() => removeTag(tag.id)}
                        className="opacity-70 hover:opacity-100 ml-1 text-[11px]"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </section>

              {/* Restablecer muestras */}
              <section className="pt-2 border-t border-zinc-100 dark:border-zinc-800">
                <button
                  onClick={handleResetSampleData}
                  className="w-full text-center text-xs font-semibold text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 py-2 transition-colors"
                >
                  ↻ Restablecer Notas de Ejemplo Iniciales
                </button>
              </section>

              {/* Pie de página */}
              <div className="text-center pt-2 pb-6">
                <p className="text-xs font-bold text-zinc-400 dark:text-zinc-500">
                  AppNotas PWA · Aplicación Web Progresiva
                </p>
                <p className="text-[10px] text-zinc-400 dark:text-zinc-600 mt-0.5">
                  Next.js App Router · TypeScript · Tailwind CSS · Framer Motion
                </p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function ToggleRow({
  label,
  description,
  icon,
  value,
  onChange,
}: {
  label: string;
  description: string;
  icon: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200/50 dark:border-zinc-700/50">
      <div className="flex items-start gap-3">
        <span className="text-xl mt-0.5">{icon}</span>
        <div>
          <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100 block">{label}</span>
          <span className="text-[11px] text-zinc-400 dark:text-zinc-500 block">{description}</span>
        </div>
      </div>
      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={() => onChange(!value)}
        className={`w-12 h-7 rounded-full p-1 transition-colors flex-shrink-0 ${
          value ? 'bg-blue-600' : 'bg-zinc-300 dark:bg-zinc-700'
        }`}
      >
        <motion.div
          animate={{ x: value ? 20 : 0 }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          className="w-5 h-5 rounded-full bg-white shadow-sm"
        />
      </motion.button>
    </div>
  );
}
