'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '@/store/useStore';
import type { NoteTheme, ContentBlock, ChecklistItem, NoteReminder } from '@/types';
import { DEFAULT_THEMES, DEFAULT_TAG_COLORS } from '@/types';
import { cn, getChecklistProgress } from '@/lib/utils';
import {
  requestNotificationPermission,
  getNotificationPermissionStatus,
  formatReminderText,
  getQuickReminderISO,
  toDatetimeLocalValue,
} from '@/lib/reminderService';

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
  const [reminder, setReminder] = useState<NoteReminder | null>(null);

  // Paneles flotantes
  const [showThemePicker, setShowThemePicker] = useState(false);
  const [showTagPicker, setShowTagPicker] = useState(false);
  const [showReminderPicker, setShowReminderPicker] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const [permissionNotice, setPermissionNotice] = useState('');

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
        setReminder(editingNote.reminder || null);
      } else {
        setTitle('');
        setBlocks([{ id: generateId(), type: 'text', content: '', order: 0 }]);
        setTheme(DEFAULT_THEMES[0]);
        setNoteIcon('');
        setIsPinned(false);
        setSelectedTagIds([]);
        setReminder(null);
      }
      setShowThemePicker(false);
      setShowTagPicker(false);
      setShowReminderPicker(false);
      setPermissionNotice('');
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

    // Si es una nota nueva vacía, solo cerrar
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
        reminder,
      });
    } else {
      await addNote({
        title,
        blocks,
        theme: noteTheme,
        tags: noteTags,
        isPinned,
        reminder,
      });
    }

    closeEditor();
  };

  const handleSetReminder = async (dateTimeISO: string) => {
    // Solicitar permiso de notificación si aún no ha sido concedido
    const permStatus = getNotificationPermissionStatus();
    if (permStatus !== 'granted' && permStatus !== 'unsupported') {
      const res = await requestNotificationPermission();
      if (res === 'denied') {
        setPermissionNotice('⚠️ Las notificaciones están bloqueadas en tu navegador. Actívalas en los ajustes del sitio para recibir avisos.');
      } else if (res === 'granted') {
        setPermissionNotice('✅ ¡Permiso de notificación concedido!');
        setTimeout(() => setPermissionNotice(''), 3000);
      }
    }

    setReminder({
      dateTime: dateTimeISO,
      isTriggered: false,
    });
  };

  const handleClearReminder = () => {
    setReminder(null);
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
            {/* Indicador de arrastre en móvil */}
            <div className="flex justify-center pt-2.5 pb-1 sm:hidden">
              <div className="w-12 h-1.5 rounded-full bg-black/15 dark:bg-white/20" />
            </div>

            {/* Barra de Navegación y Acciones */}
            <div className="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-black/5 dark:border-white/10">
              <motion.button
                whileTap={{ scale: 0.92 }}
                onClick={handleSaveAndClose}
                className="flex items-center gap-1 text-sm font-semibold text-blue-600 dark:text-blue-400 px-2 py-1 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
              >
                <span>←</span>
                <span>Guardar</span>
              </motion.button>

              <div className="flex items-center gap-1 sm:gap-2">
                {/* Botón Recordatorio */}
                <motion.button
                  whileTap={{ scale: 0.88 }}
                  onClick={() => {
                    setShowReminderPicker(!showReminderPicker);
                    setShowThemePicker(false);
                    setShowTagPicker(false);
                  }}
                  className={cn(
                    'w-9 h-9 rounded-xl flex items-center justify-center text-sm transition-colors relative',
                    reminder
                      ? 'bg-blue-600 text-white font-bold shadow-xs'
                      : showReminderPicker
                      ? 'bg-black/15 dark:bg-white/20'
                      : 'hover:bg-black/5 dark:hover:bg-white/10 opacity-70'
                  )}
                  title="Configurar recordatorio y notificación"
                >
                  ⏰
                  {reminder && !reminder.isTriggered && (
                    <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-amber-400 ring-2 ring-white dark:ring-zinc-900" />
                  )}
                </motion.button>

                {/* Botón Fijar Nota */}
                <motion.button
                  whileTap={{ scale: 0.88 }}
                  onClick={() => setIsPinned(!isPinned)}
                  className={cn(
                    'w-9 h-9 rounded-xl flex items-center justify-center text-sm transition-colors',
                    isPinned
                      ? 'bg-amber-400/30 text-amber-600 dark:text-amber-300 font-bold'
                      : 'hover:bg-black/5 dark:hover:bg-white/10 opacity-70'
                  )}
                  title={isPinned ? 'Nota fijada arriba' : 'Fijar nota'}
                >
                  📌
                </motion.button>

                {/* Selector de tema y color */}
                <motion.button
                  whileTap={{ scale: 0.88 }}
                  onClick={() => {
                    setShowThemePicker(!showThemePicker);
                    setShowTagPicker(false);
                    setShowReminderPicker(false);
                  }}
                  className={cn(
                    'w-9 h-9 rounded-xl flex items-center justify-center text-sm transition-colors',
                    showThemePicker
                      ? 'bg-black/15 dark:bg-white/20'
                      : 'hover:bg-black/5 dark:hover:bg-white/10 opacity-70'
                  )}
                  title="Personalizar tema e icono"
                >
                  🎨
                </motion.button>

                {/* Selector de etiquetas */}
                <motion.button
                  whileTap={{ scale: 0.88 }}
                  onClick={() => {
                    setShowTagPicker(!showTagPicker);
                    setShowThemePicker(false);
                    setShowReminderPicker(false);
                  }}
                  className={cn(
                    'w-9 h-9 rounded-xl flex items-center justify-center text-sm transition-colors',
                    showTagPicker
                      ? 'bg-black/15 dark:bg-white/20'
                      : 'hover:bg-black/5 dark:hover:bg-white/10 opacity-70'
                  )}
                  title="Etiquetas de la nota"
                >
                  🏷️
                </motion.button>

                {/* Acceso rápido a eliminar / papelera */}
                {editingNote && (
                  <motion.button
                    whileTap={{ scale: 0.88 }}
                    onClick={async () => {
                      if (editingNote.isTrashed) {
                        if (confirm('¿Eliminar definitivamente esta nota?')) {
                          await deleteNote(editingNote.id);
                          closeEditor();
                        }
                      } else {
                        await trashNote(editingNote.id);
                        closeEditor();
                      }
                    }}
                    className="w-9 h-9 rounded-xl hover:bg-rose-500/20 text-rose-500 flex items-center justify-center text-sm transition-colors"
                    title="Enviar a papelera"
                  >
                    🗑️
                  </motion.button>
                )}
              </div>
            </div>

            {/* Panel de Recordatorio y Notificaciones */}
            <AnimatePresence>
              {showReminderPicker && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="px-6 py-4 bg-black/5 dark:bg-white/5 border-b border-black/5 dark:border-white/10 overflow-hidden"
                >
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-[11px] font-bold uppercase tracking-wider opacity-60 flex items-center gap-1.5">
                      <span>⏰</span>
                      <span>Recordatorio y Alarma</span>
                    </p>
                    {reminder && (
                      <button
                        onClick={handleClearReminder}
                        className="text-[11px] font-semibold text-rose-500 hover:underline"
                      >
                        Quitar recordatorio
                      </button>
                    )}
                  </div>

                  {permissionNotice && (
                    <p className="text-xs mb-2 text-zinc-600 dark:text-zinc-300 bg-black/5 dark:bg-white/5 p-2 rounded-xl">
                      {permissionNotice}
                    </p>
                  )}

                  {/* Estado actual del recordatorio */}
                  {reminder && (
                    <div className="flex items-center justify-between p-2.5 mb-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-xs">
                      <span className="font-semibold flex items-center gap-1.5">
                        <span>🔔</span>
                        <span>Programado: {formatReminderText(reminder.dateTime)}</span>
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500 text-white font-bold">
                        {reminder.isTriggered ? 'Completado' : 'Pendiente'}
                      </span>
                    </div>
                  )}

                  {/* Botones de Acceso Rápido */}
                  <p className="text-[10px] uppercase font-bold opacity-40 mb-1.5">Accesos rápidos:</p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleSetReminder(getQuickReminderISO('in_one_hour'))}
                      className="px-2.5 py-2 rounded-xl bg-white dark:bg-zinc-800 shadow-xs border border-black/5 dark:border-white/10 text-xs font-semibold text-left hover:border-blue-500 transition-colors"
                    >
                      <span className="block opacity-50 text-[10px]">Pronto</span>
                      <span>En 1 hora</span>
                    </motion.button>
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleSetReminder(getQuickReminderISO('today_evening'))}
                      className="px-2.5 py-2 rounded-xl bg-white dark:bg-zinc-800 shadow-xs border border-black/5 dark:border-white/10 text-xs font-semibold text-left hover:border-blue-500 transition-colors"
                    >
                      <span className="block opacity-50 text-[10px]">Tarde</span>
                      <span>Hoy a las 18:00</span>
                    </motion.button>
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleSetReminder(getQuickReminderISO('tomorrow_morning'))}
                      className="px-2.5 py-2 rounded-xl bg-white dark:bg-zinc-800 shadow-xs border border-black/5 dark:border-white/10 text-xs font-semibold text-left hover:border-blue-500 transition-colors"
                    >
                      <span className="block opacity-50 text-[10px]">Mañana</span>
                      <span>A las 09:00</span>
                    </motion.button>
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleSetReminder(getQuickReminderISO('next_monday'))}
                      className="px-2.5 py-2 rounded-xl bg-white dark:bg-zinc-800 shadow-xs border border-black/5 dark:border-white/10 text-xs font-semibold text-left hover:border-blue-500 transition-colors"
                    >
                      <span className="block opacity-50 text-[10px]">Semana próxima</span>
                      <span>Lunes 09:00</span>
                    </motion.button>
                  </div>

                  {/* Selector Manual de Fecha y Hora */}
                  <div>
                    <label className="text-[10px] uppercase font-bold opacity-40 mb-1 block">
                      O selecciona fecha y hora personalizada:
                    </label>
                    <input
                      type="datetime-local"
                      value={toDatetimeLocalValue(reminder?.dateTime)}
                      onChange={(e) => {
                        if (e.target.value) {
                          handleSetReminder(new Date(e.target.value).toISOString());
                        }
                      }}
                      className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-zinc-800 border border-black/10 dark:border-white/20 text-xs font-medium outline-none text-zinc-900 dark:text-zinc-100"
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Selector de tema e icono */}
            <AnimatePresence>
              {showThemePicker && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="px-6 py-3 bg-black/5 dark:bg-white/5 border-b border-black/5 dark:border-white/10 overflow-hidden"
                >
                  <p className="text-[11px] font-bold uppercase tracking-wider opacity-60 mb-2">
                    Fondo y Color de la Tarjeta
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
                    Icono Emoji
                  </p>
                  <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide py-1">
                    <button
                      onClick={() => setNoteIcon('')}
                      className={cn(
                        'px-2.5 py-1 text-xs rounded-xl bg-black/5 dark:bg-white/10 font-semibold',
                        !noteIcon && 'ring-2 ring-blue-500'
                      )}
                    >
                      Ninguno
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
                      placeholder="Emoji"
                      value={noteIcon}
                      onChange={(e) => setNoteIcon(e.target.value)}
                      className="w-16 px-2 py-1 text-xs rounded-xl bg-black/5 dark:bg-white/10 text-center outline-none"
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Selector de Etiquetas */}
            <AnimatePresence>
              {showTagPicker && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="px-6 py-3 bg-black/5 dark:bg-white/5 border-b border-black/5 dark:border-white/10 overflow-hidden"
                >
                  <p className="text-[11px] font-bold uppercase tracking-wider opacity-60 mb-2">
                    Adjuntar Etiquetas
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

                  {/* Crear etiqueta directamente */}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Nueva etiqueta..."
                      value={newTagName}
                      onChange={(e) => setNewTagName(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleCreateNewTag()}
                      className="px-3 py-1.5 text-xs rounded-xl bg-black/5 dark:bg-white/10 outline-none flex-1 placeholder-current/40"
                    />
                    <button
                      onClick={handleCreateNewTag}
                      className="px-3 py-1.5 text-xs rounded-xl bg-blue-600 text-white font-semibold"
                    >
                      Añadir
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Título de la nota y barra de progreso */}
            <div className="px-5 sm:px-8 pt-4 pb-2">
              <div className="flex items-center gap-2 mb-2">
                {noteIcon && <span className="text-2xl">{noteIcon}</span>}
                <input
                  ref={titleInputRef}
                  type="text"
                  placeholder="Título de la nota..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full text-xl sm:text-2xl font-black bg-transparent outline-none placeholder-current/30"
                />
              </div>

              {/* Chips de etiquetas y recordatorio activo en cabecera */}
              <div className="flex flex-wrap items-center gap-1.5 mt-1 mb-2">
                {reminder && (
                  <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-blue-600 text-white flex items-center gap-1 shadow-xs">
                    <span>⏰</span>
                    <span>{formatReminderText(reminder.dateTime)}</span>
                  </span>
                )}
                {selectedTagIds.length > 0 &&
                  tags
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

              {/* Barra de progreso de la lista en tiempo real */}
              {progress.total > 0 && (
                <div className="pt-2 pb-1">
                  <div className="flex items-center justify-between text-xs font-bold opacity-75 mb-1.5">
                    <span>Progreso de Tareas</span>
                    <span>
                      {progress.checked}/{progress.total} completadas ({progress.percentage}%)
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

            {/* Lienzo Híbrido: Bloques de Contenido */}
            <div className="flex-1 overflow-y-auto px-5 sm:px-8 py-3 space-y-4">
              {blocks.map((block, blockIndex) => (
                <div
                  key={block.id}
                  className="relative p-3.5 rounded-2xl bg-black/[0.03] dark:bg-white/[0.04] border border-black/5 dark:border-white/5 transition-all group"
                >
                  {/* Botón para eliminar bloque */}
                  <button
                    onClick={() => handleRemoveBlock(block.id)}
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 w-6 h-6 rounded-lg bg-black/10 dark:bg-white/10 hover:bg-rose-500 hover:text-white text-xs flex items-center justify-center transition-all"
                    title="Eliminar bloque"
                  >
                    ✕
                  </button>

                  {block.type === 'text' ? (
                    <div>
                      <div className="text-[10px] uppercase font-bold opacity-40 mb-1">
                        Párrafo de Texto {blockIndex + 1}
                      </div>
                      <textarea
                        placeholder="Escribe el contenido de tu nota aquí..."
                        value={block.content}
                        onChange={(e) => handleUpdateTextBlock(block.id, e.target.value)}
                        rows={4}
                        className="w-full bg-transparent outline-none resize-none text-sm leading-relaxed placeholder-current/30"
                      />
                    </div>
                  ) : (
                    <div>
                      <div className="flex items-center justify-between text-[10px] uppercase font-bold opacity-40 mb-2">
                        <span>Lista de Tareas Interactiva</span>
                        <span>{block.checklistItems?.length || 0} elementos</span>
                      </div>

                      <div className="space-y-2">
                        {block.checklistItems?.map((item, itemIdx) => (
                          <div key={item.id} className="flex items-center gap-2 group/item">
                            {/* Casilla de verificación */}
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

                            {/* Entrada de texto de tarea */}
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
                              placeholder={`Elemento ${itemIdx + 1}...`}
                              className={cn(
                                'flex-1 bg-transparent outline-none text-sm py-0.5 transition-all',
                                item.checked && 'line-through opacity-50'
                              )}
                            />

                            {/* Botón borrar elemento */}
                            <button
                              onClick={() => handleRemoveChecklistItem(block.id, item.id)}
                              className="opacity-0 group-hover/item:opacity-100 text-rose-500 hover:text-rose-700 text-xs px-1"
                              title="Borrar elemento"
                            >
                              ✕
                            </button>
                          </div>
                        ))}

                        {/* Botón Añadir Elemento */}
                        <motion.button
                          whileTap={{ scale: 0.95 }}
                          onClick={() => handleAddChecklistItem(block.id)}
                          className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline pt-1 flex items-center gap-1"
                        >
                          <span>+</span>
                          <span>Añadir elemento (Pulsa Enter)</span>
                        </motion.button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Barra inferior para añadir bloques */}
            <div className="px-5 sm:px-8 py-3.5 bg-black/[0.04] dark:bg-white/[0.06] border-t border-black/5 dark:border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold opacity-50">Insertar bloque:</span>
                <motion.button
                  whileTap={{ scale: 0.92 }}
                  onClick={() => handleAddBlock('text')}
                  className="px-3 py-1.5 rounded-xl bg-white dark:bg-zinc-800 shadow-xs border border-black/5 dark:border-white/10 text-xs font-semibold flex items-center gap-1.5 hover:shadow-md transition-all"
                >
                  <span>📝</span>
                  <span>Párrafo de Texto</span>
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.92 }}
                  onClick={() => handleAddBlock('checklist')}
                  className="px-3 py-1.5 rounded-xl bg-white dark:bg-zinc-800 shadow-xs border border-black/5 dark:border-white/10 text-xs font-semibold flex items-center gap-1.5 hover:shadow-md transition-all"
                >
                  <span>☑️</span>
                  <span>Lista de Tareas</span>
                </motion.button>
              </div>

              <motion.button
                whileTap={{ scale: 0.94 }}
                onClick={handleSaveAndClose}
                className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/30 transition-all"
              >
                Listo
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
