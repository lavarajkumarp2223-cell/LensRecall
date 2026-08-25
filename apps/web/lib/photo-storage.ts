// Simple, robust client-side IndexedDB & cross-device sync store for LensRecall
const DB_NAME = 'lensrecall_db';
const DB_VERSION = 1;
const STORE_NAME = 'event_photos';

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') return reject('SSR');
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('eventId', 'eventId', { unique: false });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export interface StoredPhoto {
  id: string;
  eventId: string;
  originalFilename: string;
  url: string; // Base64 data URL
  thumbnailUrl: string;
  album: string;
  width: number;
  height: number;
  sizeMB: string;
  uploadedAt: string;
  status: 'READY' | 'PROCESSING' | 'FAILED';
  faceCount: number;
  faces: { x: number; y: number; width: number; height: number; confidence: number }[];
}

export async function savePhotoToStorage(photo: StoredPhoto): Promise<void> {
  try {
    const db = await openDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      store.put(photo);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });

    // Asynchronously synchronize photo to cloud API so mobile guests can view it
    if (typeof window !== 'undefined') {
      fetch('/api/photos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId: photo.eventId,
          photos: [
            {
              id: photo.id,
              eventId: photo.eventId,
              originalFilename: photo.originalFilename,
              url: photo.url,
              thumbnailUrl: photo.thumbnailUrl,
              album: photo.album,
              width: photo.width,
              height: photo.height,
            },
          ],
        }),
      }).catch(() => {});
    }
  } catch (err) {
    console.error('Failed to save photo to IndexedDB:', err);
  }
}

export async function getAllPhotosFromStorage(): Promise<StoredPhoto[]> {
  try {
    const db = await openDB();
    const localPhotos = await new Promise<StoredPhoto[]>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });

    if (localPhotos.length > 0) {
      return localPhotos;
    }

    // If local IndexedDB is empty (e.g. guest on mobile phone), fetch from cloud API
    if (typeof window !== 'undefined') {
      try {
        const res = await fetch('/api/photos');
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.photos) && data.photos.length > 0) {
            return data.photos;
          }
        }
      } catch {}
    }

    return [];
  } catch {
    return [];
  }
}

export async function getPhotosForEvent(eventId: string): Promise<StoredPhoto[]> {
  try {
    const all = await getAllPhotosFromStorage();

    if (!eventId || eventId === 'undefined' || eventId === 'all') {
      return all;
    }

    // Direct match on eventId
    const directMatches = all.filter((p) => p.eventId === eventId);
    if (directMatches.length > 0) {
      return directMatches;
    }

    // Resolve eventId against localStorage events
    try {
      const rawEvents = localStorage.getItem('lr_organizer_events');
      if (rawEvents) {
        const events = JSON.parse(rawEvents);
        if (Array.isArray(events)) {
          const matchedEvent = events.find(
            (e: any) =>
              e.id === eventId ||
              e.qrToken === eventId ||
              eventId.includes(e.id) ||
              (e.qrToken && eventId.includes(e.qrToken)),
          );
          if (matchedEvent) {
            const byResolvedId = all.filter((p) => p.eventId === matchedEvent.id);
            if (byResolvedId.length > 0) return byResolvedId;
          }
        }
      }
    } catch {}

    // Fallback: If cloud API has photos for this eventId
    if (typeof window !== 'undefined') {
      try {
        const res = await fetch(`/api/photos?eventId=${encodeURIComponent(eventId)}`);
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.photos) && data.photos.length > 0) {
            return data.photos;
          }
        }
      } catch {}
    }

    // Fallback: return all photos stored
    return all;
  } catch {
    return [];
  }
}

export async function deletePhotoFromStorage(id: string): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      store.delete(id);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.error('Failed to delete photo from IndexedDB:', err);
  }
}

// Convert File to compressed data URL for fast persistent preview
export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.readAsDataURL(file);
  });
}
