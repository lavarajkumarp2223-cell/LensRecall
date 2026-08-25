// Simple, robust client-side IndexedDB photo store for LensRecall Organizer
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
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      store.put(photo);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.error('Failed to save photo to IndexedDB:', err);
  }
}

export async function getPhotosForEvent(eventId: string): Promise<StoredPhoto[]> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const index = store.index('eventId');
      const req = index.getAll(eventId);
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
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
