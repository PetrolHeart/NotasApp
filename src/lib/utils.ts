import type { ContentBlock } from '@/types';

export function getChecklistProgress(blocks: ContentBlock[]): { total: number; checked: number; percentage: number } {
  let total = 0;
  let checked = 0;
  for (const block of blocks) {
    if (block.type === 'checklist' && block.checklistItems) {
      total += block.checklistItems.length;
      checked += block.checklistItems.filter((i) => i.checked).length;
    }
  }
  return { total, checked, percentage: total > 0 ? Math.round((checked / total) * 100) : 0 };
}

export function formatDate(timestamp: number): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Ahora mismo';
  if (diffMins < 60) return `Hace ${diffMins} min`;
  if (diffHours < 24) return `Hace ${diffHours} h`;
  if (diffDays < 7) return `Hace ${diffDays} d`;
  return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
}

export function cn(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ');
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '…';
}

export function getNotePreview(blocks: ContentBlock[]): string {
  for (const block of blocks) {
    if (block.type === 'text' && block.content.trim()) {
      return truncateText(block.content, 120);
    }
    if (block.type === 'checklist' && block.checklistItems?.length) {
      return block.checklistItems.map(i => `${i.checked ? '☑' : '☐'} ${i.text}`).slice(0, 3).join(', ');
    }
  }
  return '';
}
