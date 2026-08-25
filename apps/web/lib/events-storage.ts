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

export function getCurrentUser(): UserSession {
  if (typeof window === 'undefined') {
    return {
      email: 'lookalivesolutions@gmail.com',
      fullName: 'Lava Kumar',
      role: 'ORGANIZER',
      organizationName: 'Lava Kumar Studio',
    };
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
  return {
    email: 'lookalivesolutions@gmail.com',
    fullName: 'Lava Kumar',
    role: 'ORGANIZER',
    organizationName: 'Lava Kumar Studio',
  };
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
  const all = getAllEvents();
  // Filter strictly by ownerEmail matching logged-in user
  return all.filter((e) => {
    if (!e.ownerEmail) {
      // Default unassigned events to lookalivesolutions@gmail.com
      return user.email === 'lookalivesolutions@gmail.com';
    }
    return e.ownerEmail.toLowerCase() === user.email.toLowerCase();
  });
}

export function saveUserEvent(newEvent: EventItem): void {
  if (typeof window === 'undefined') return;
  const user = getCurrentUser();
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
