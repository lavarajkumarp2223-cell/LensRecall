import { NextResponse } from 'next/server';

interface PhotoItem {
  id: string;
  eventId: string;
  originalFilename: string;
  url: string;
  thumbnailUrl: string;
  album: string;
  width?: number;
  height?: number;
  matchScore?: number;
}

// Global cross-device in-memory cache for event photos
declare global {
  // eslint-disable-next-line no-var
  var __GLOBAL_EVENT_PHOTOS: Record<string, PhotoItem[]> | undefined;
}

if (!globalThis.__GLOBAL_EVENT_PHOTOS) {
  globalThis.__GLOBAL_EVENT_PHOTOS = {};
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const eventId = searchParams.get('eventId') || '';
    const store = globalThis.__GLOBAL_EVENT_PHOTOS || {};

    if (eventId && store[eventId] && store[eventId].length > 0) {
      return NextResponse.json({ photos: store[eventId] });
    }

    // Try fuzzy match on eventId
    for (const key of Object.keys(store)) {
      if (eventId && (key.includes(eventId) || eventId.includes(key))) {
        if (store[key] && store[key].length > 0) {
          return NextResponse.json({ photos: store[key] });
        }
      }
    }

    // Fallback: Return all photos stored across any event
    const allPhotos = Object.values(store).flat();
    return NextResponse.json({ photos: allPhotos });
  } catch {
    return NextResponse.json({ photos: [] });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { eventId, photos } = body;

    if (!eventId || !Array.isArray(photos)) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    if (!globalThis.__GLOBAL_EVENT_PHOTOS) {
      globalThis.__GLOBAL_EVENT_PHOTOS = {};
    }

    const existing = globalThis.__GLOBAL_EVENT_PHOTOS[eventId] || [];
    const newPhotos = photos.filter((p: PhotoItem) => !existing.some((e) => e.id === p.id));
    globalThis.__GLOBAL_EVENT_PHOTOS[eventId] = [...newPhotos, ...existing];

    return NextResponse.json({
      success: true,
      count: globalThis.__GLOBAL_EVENT_PHOTOS[eventId].length,
    });
  } catch {
    return NextResponse.json({ error: 'Failed to save photos' }, { status: 500 });
  }
}
