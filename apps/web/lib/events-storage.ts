export interface EventItem {
  id: string;
  name: string;
  category: string;
  date: string;
  location: string;
  status: 'ACTIVE' | 'DRAFT' | 'ARCHIVED';
  photoCount: number;
  searchCount: number;
  qrToken: string;
  coverUrl: string;
  ownerEmail?: string;
  description?: string;
}

export interface UserSession {
  email: string;
  fullName: string;
  role: string;
  organizationName?: string;
  avatarUrl?: string;
}

export function getCurrentUser(): UserSession | null {
  if (typeof window === 'undefined') {
    return null;
  }
  try {
    const raw = localStorage.getItem('lr_user');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.email) {
        return {
          email: parsed.email,
          fullName: parsed.fullName || parsed.email.split('@')[0],
          role: parsed.role || 'ORGANIZER',
          organizationName:
            parsed.organizationName ||
            `${(parsed.fullName || parsed.email.split('@')[0]).replace(/\./g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase())} Studio`,
        };
      }
    }
  } catch {}
  return null;
}

export function getAllEvents(): EventItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem('lr_organizer_events');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {}
  return [];
}

/**
 * Returns ONLY the events belonging strictly to the currently logged-in user!
 * Guarantees zero leakage across different registered email accounts.
 */
export function getUserEvents(): EventItem[] {
  const user = getCurrentUser();
  if (!user) return [];
  const all = getAllEvents();
  // STRICT isolation: only show events that belong to the logged-in user
  return all.filter((e) => {
    if (!e.ownerEmail) {
      // Legacy events without ownerEmail — do NOT show to anyone
      // They are orphaned and must be re-created by the owner
      return false;
    }
    return e.ownerEmail.toLowerCase() === user.email.toLowerCase();
  });
}

export function saveUserEvent(newEvent: EventItem): void {
  if (typeof window === 'undefined') return;
  const user = getCurrentUser();
  if (!user) return;
  const eventWithUser: EventItem = {
    ...newEvent,
    ownerEmail: newEvent.ownerEmail || user.email,
  };
  const all = getAllEvents();
  const existingIdx = all.findIndex((e) => e.id === eventWithUser.id);
  if (existingIdx >= 0) {
    all[existingIdx] = eventWithUser;
  } else {
    all.unshift(eventWithUser);
  }
  localStorage.setItem('lr_organizer_events', JSON.stringify(all));
}

export function deleteUserEvent(eventId: string): void {
  if (typeof window === 'undefined') return;
  const all = getAllEvents();
  const updated = all.filter((e) => e.id !== eventId);
  localStorage.setItem('lr_organizer_events', JSON.stringify(updated));
}

/**
 * Clears ALL LensRecall-related data from localStorage.
 * Used during logout to prevent session leaks between users.
 */
export function clearAllUserData(): void {
  if (typeof window === 'undefined') return;
  const keysToRemove: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && (key.startsWith('lr_') || key.startsWith('lensrecall'))) {
      keysToRemove.push(key);
    }
  }
  keysToRemove.forEach((key) => localStorage.removeItem(key));
}

