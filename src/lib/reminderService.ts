import type { Note } from '@/types';
import { getNotePreview } from '@/lib/utils';

export type NotificationStatus = 'granted' | 'denied' | 'default' | 'unsupported';

/**
 * Comprueba el estado actual de los permisos de notificación
 */
export function getNotificationPermissionStatus(): NotificationStatus {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported';
  }
  return Notification.permission;
}

/**
 * Solicita permisos de notificación al usuario
 */
export async function requestNotificationPermission(): Promise<NotificationStatus> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported';
  }

  try {
    const permission = await Notification.requestPermission();
    return permission;
  } catch {
    return 'default';
  }
}

/**
 * Muestra una notificación nativa utilizando el Service Worker o la API de Notificaciones estándar
 */
export async function showLocalNotification(title: string, body: string, noteId?: string): Promise<boolean> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return false;
  }

  if (Notification.permission !== 'granted') {
    return false;
  }

  // Vibración táctil si el dispositivo móvil lo soporta
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    try {
      navigator.vibrate([200, 100, 200]);
    } catch {
      // Ignorar si el navegador bloquea la vibración
    }
  }

  const options: NotificationOptions = {
    body,
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
    tag: noteId ? `note-reminder-${noteId}` : 'appnotas-reminder',
    data: {
      url: '/',
      noteId,
    },
  };

  // Intentar mostrar mediante el Service Worker para máxima integración PWA
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.ready;
      if (registration && 'showNotification' in registration) {
        await registration.showNotification(title || 'Recordatorio de AppNotas', options);
        return true;
      }
    } catch {
      // Si el Service Worker falla, usar el fallback estándar
    }
  }

  // Fallback a notificación nativa directa
  try {
    new Notification(title || 'Recordatorio de AppNotas', options);
    return true;
  } catch {
    return false;
  }
}

/**
 * Verifica si existen recordatorios vencidos y no disparados
 */
export async function checkAndTriggerDueReminders(
  notes: Note[],
  onTrigger: (noteId: string) => Promise<void>
): Promise<void> {
  const now = Date.now();

  for (const note of notes) {
    if (
      note.reminder &&
      !note.reminder.isTriggered &&
      !note.isTrashed &&
      !note.isArchived
    ) {
      const reminderTime = new Date(note.reminder.dateTime).getTime();

      // Si la fecha y hora coincide o ya ha pasado
      if (!isNaN(reminderTime) && reminderTime <= now) {
        const preview = getNotePreview(note.blocks);
        const body = preview || '¡Es la hora de tu recordatorio programado!';
        const title = note.title ? `🔔 ${note.title}` : '🔔 Recordatorio de AppNotas';

        // Disparar notificación nativa
        await showLocalNotification(title, body, note.id);

        // Marcar como disparado en el almacenamiento local para evitar bucles
        await onTrigger(note.id);
      }
    }
  }
}

/**
 * Formatea la fecha y hora de un recordatorio al español
 */
export function formatReminderText(isoString: string): string {
  const date = new Date(isoString);
  if (isNaN(date.getTime())) return '';

  const now = new Date();
  const isToday =
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear();

  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const isTomorrow =
    date.getDate() === tomorrow.getDate() &&
    date.getMonth() === tomorrow.getMonth() &&
    date.getFullYear() === tomorrow.getFullYear();

  const timeStr = date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });

  if (isToday) {
    return `Hoy a las ${timeStr}`;
  }
  if (isTomorrow) {
    return `Mañana a las ${timeStr}`;
  }

  const dateStr = date.toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'short',
  });
  return `${dateStr}, ${timeStr}`;
}

/**
 * Genera fechas ISO para accesos rápidos de recordatorios
 */
export function getQuickReminderISO(type: 'in_one_hour' | 'today_evening' | 'tomorrow_morning' | 'next_monday'): string {
  const now = new Date();

  switch (type) {
    case 'in_one_hour': {
      const d = new Date(now.getTime() + 60 * 60 * 1000);
      d.setSeconds(0, 0);
      return toLocalISOString(d);
    }
    case 'today_evening': {
      const d = new Date(now);
      if (now.getHours() >= 18) {
        d.setHours(21, 0, 0, 0);
      } else {
        d.setHours(18, 0, 0, 0);
      }
      return toLocalISOString(d);
    }
    case 'tomorrow_morning': {
      const d = new Date(now);
      d.setDate(d.getDate() + 1);
      d.setHours(9, 0, 0, 0);
      return toLocalISOString(d);
    }
    case 'next_monday': {
      const d = new Date(now);
      const day = d.getDay();
      const daysUntilMonday = day === 0 ? 1 : 8 - day;
      d.setDate(d.getDate() + daysUntilMonday);
      d.setHours(9, 0, 0, 0);
      return toLocalISOString(d);
    }
  }
}

/**
 * Convierte Date a formato compatible con <input type="datetime-local">
 * Formato: YYYY-MM-DDTHH:mm
 */
export function toDatetimeLocalValue(isoString?: string | null): string {
  if (!isoString) return '';
  const d = new Date(isoString);
  if (isNaN(d.getTime())) return '';
  return toLocalISOString(d).slice(0, 16);
}

function toLocalISOString(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  const seconds = pad(date.getSeconds());
  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
}
