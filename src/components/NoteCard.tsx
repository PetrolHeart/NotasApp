'use client';

import { useState } from 'react';
import { motion, useMotionValue, useTransform, type PanInfo } from 'framer-motion';
import { useStore } from '@/store/useStore';
import type { Note } from '@/types';
import { getChecklistProgress, getNotePreview, formatDate, cn } from '@/lib/utils';

interface NoteCardProps {
  note: Note;
  onEdit: () => void;
  onDragStartReorder?: (e: React.DragEvent, id: string) => void;
  onDragOverReorder?: (e: React.DragEvent, id: string) => void;
  onDropReorder?: (e: React.DragEvent, id: string) => void;
  isDragOver?: boolean;
}

const SWIPE_THRESHOLD = 90;

export default function NoteCard({
  note,
  onEdit,
  onDragStartReorder,
  onDragOverReorder,
  onDropReorder,
  isDragOver = false,
}: NoteCardProps) {
  const {
    archiveNote,
    restoreNote,
    trashNote,
    permanentlyDeleteNote,
    togglePin,
    filterMode,
  } = useStore();

  const x = useMotionValue(0);
  const [swiping, setSwiping] = useState(false);

  // Transformaciones dinámicas para feedback táctil de deslizamiento
  const rightBg = useTransform(
    x,
    [0, SWIPE_THRESHOLD],
    ['rgba(34, 197, 94, 0)', 'rgba(34, 197, 94, 0.45)']
  );
  const leftBg = useTransform(
    x,
    [-SWIPE_THRESHOLD, 0],
    ['rgba(239, 68, 68, 0.45)', 'rgba(239, 68, 68, 0)']
  );
  const rightOpacity = useTransform(x, [0, 40, SWIPE_THRESHOLD], [0, 0.5, 1]);
  const leftOpacity = useTransform(x, [-SWIPE_THRESHOLD, -40, 0], [1, 0.5, 0]);
  const rightScale = useTransform(x, [0, SWIPE_THRESHOLD], [0.6, 1.15]);
  const leftScale = useTransform(x, [-SWIPE_THRESHOLD, 0], [1.15, 0.6]);

  const progress = getChecklistProgress(note.blocks);
  const preview = getNotePreview(note.blocks);

  const handleDragEnd = async (_: unknown, info: PanInfo) => {
    setSwiping(false);
    if (info.offset.x > SWIPE_THRESHOLD) {
      if (note.isArchived || note.isTrashed) {
        await restoreNote(note.id);
      } else {
        await archiveNote(note.id);
      }
    } else if (info.offset.x < -SWIPE_THRESHOLD) {
      if (note.isTrashed) {
        await permanentlyDeleteNote(note.id);
      } else {
        await trashNote(note.id);
      }
    }
  };

  const getRightSwipeLabel = () => {
    if (note.isArchived || note.isTrashed) return { icon: '↩️', label: 'Restaurar' };
    return { icon: '📦', label: 'Archivar' };
  };

  const getLeftSwipeLabel = () => {
    if (note.isTrashed) return { icon: '🔥', label: 'Eliminar' };
    return { icon: '🗑️', label: 'Papelera' };
  };

  const rightAction = getRightSwipeLabel();
  const leftAction = getLeftSwipeLabel();

  return (
    <div
      draggable
      onDragStart={(e) => onDragStartReorder?.(e, note.id)}
      onDragOver={(e) => onDragOverReorder?.(e, note.id)}
      onDrop={(e) => onDropReorder?.(e, note.id)}
      className={cn(
        'relative rounded-3xl overflow-hidden transition-all duration-200 select-none group',
        isDragOver && 'ring-2 ring-blue-500 scale-[1.02] shadow-xl'
      )}
    >
      {/* Acción de fondo al deslizar a la derecha */}
      <motion.div
        className="absolute inset-0 rounded-3xl flex items-center justify-start px-6 z-0"
        style={{ backgroundColor: rightBg }}
      >
        <motion.div
          style={{ opacity: rightOpacity, scale: rightScale }}
          className="flex items-center gap-1.5 font-bold text-emerald-800 dark:text-emerald-200"
        >
          <span className="text-2xl">{rightAction.icon}</span>
          <span className="text-xs uppercase tracking-wider">{rightAction.label}</span>
        </motion.div>
      </motion.div>

      {/* Acción de fondo al deslizar a la izquierda */}
      <motion.div
        className="absolute inset-0 rounded-3xl flex items-center justify-end px-6 z-0"
        style={{ backgroundColor: leftBg }}
      >
        <motion.div
          style={{ opacity: leftOpacity, scale: leftScale }}
          className="flex items-center gap-1.5 font-bold text-rose-800 dark:text-rose-200"
        >
          <span className="text-xs uppercase tracking-wider">{leftAction.label}</span>
          <span className="text-2xl">{leftAction.icon}</span>
        </motion.div>
      </motion.div>

      {/* Superficie de tarjeta deslizable y arrastrable */}
      <motion.div
        style={{ x }}
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.65}
        onDragStart={() => setSwiping(true)}
        onDragEnd={handleDragEnd}
        whileTap={{ scale: swiping ? 1 : 0.98 }}
        onClick={() => {
          if (!swiping) onEdit();
        }}
        layout
        initial={{ opacity: 0, scale: 0.92, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.85, x: 250, transition: { duration: 0.25 } }}
        className={cn(
          'relative z-10 p-4 sm:p-5 rounded-3xl cursor-pointer flex flex-col justify-between min-h-[140px]',
          'backdrop-blur-xl border shadow-sm hover:shadow-lg transition-all',
          'border-zinc-200/60 dark:border-zinc-750/50',
          note.theme.background,
          note.theme.textColor || 'text-zinc-900 dark:text-zinc-100'
        )}
      >
        {/* Cabecera de tarjeta: Manija de reorden, título y fijar */}
        <div>
          <div className="flex items-start justify-between gap-2 mb-1.5">
            <div className="flex items-center gap-1.5 flex-1 min-w-0">
              {/* Indicador para arrastrar y reordenar */}
              <span
                className="opacity-25 hover:opacity-80 transition-opacity cursor-grab text-xs leading-none select-none flex-shrink-0"
                title="Arrastrar para reordenar"
              >
                ⠿
              </span>
              {note.theme.icon && (
                <span className="text-base flex-shrink-0">{note.theme.icon}</span>
              )}
              {note.title && (
                <h3 className="font-bold text-sm sm:text-base leading-snug line-clamp-2 truncate">
                  {note.title}
                </h3>
              )}
            </div>

            {/* Botón para fijar o desfijar nota */}
            {filterMode === 'all' && (
              <motion.button
                whileTap={{ scale: 0.8 }}
                onClick={(e) => {
                  e.stopPropagation();
                  togglePin(note.id);
                }}
                className={cn(
                  'w-7 h-7 rounded-full flex items-center justify-center transition-all flex-shrink-0 text-xs',
                  note.isPinned
                    ? 'bg-amber-400/25 text-amber-600 dark:text-amber-300'
                    : 'opacity-0 group-hover:opacity-60 hover:bg-black/5 dark:hover:bg-white/10'
                )}
                title={note.isPinned ? 'Desfijar de arriba' : 'Fijar nota arriba'}
              >
                📌
              </motion.button>
            )}
          </div>

          {/* Vista previa de texto */}
          {preview && (
            <p className="text-xs sm:text-[13px] opacity-75 line-clamp-3 leading-relaxed mb-3">
              {preview}
            </p>
          )}

          {/* Barra de progreso interactiva */}
          {progress.total > 0 && (
            <div className="my-2.5 bg-black/5 dark:bg-white/10 p-2 rounded-xl">
              <div className="flex items-center justify-between text-[11px] font-semibold opacity-75 mb-1.5">
                <span>Lista de tareas</span>
                <span>
                  {progress.checked}/{progress.total} ({progress.percentage}%)
                </span>
              </div>
              <div className="w-full h-1.5 bg-black/10 dark:bg-white/20 rounded-full overflow-hidden">
                <motion.div
                  className="h-full rounded-full transition-all duration-300"
                  style={{
                    backgroundColor:
                      progress.percentage === 100
                        ? '#22c55e'
                        : note.theme.accentColor || '#3b82f6',
                  }}
                  initial={{ width: 0 }}
                  animate={{ width: `${progress.percentage}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Pie de tarjeta: Chips de etiquetas y fecha */}
        <div className="pt-2 mt-auto border-t border-black/5 dark:border-white/5 flex flex-col gap-2">
          {note.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {note.tags.map((tag) => (
                <span
                  key={tag.id}
                  className="text-[10px] font-semibold px-2 py-0.5 rounded-full text-white shadow-xs"
                  style={{ backgroundColor: tag.color }}
                >
                  {tag.name}
                </span>
              ))}
            </div>
          )}

          <div className="flex items-center justify-between text-[10px] opacity-50 font-medium">
            <span>{formatDate(note.updatedAt)}</span>
            <span className="opacity-0 group-hover:opacity-100 transition-opacity text-[10px]">
              Deslizar ↔
            </span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
