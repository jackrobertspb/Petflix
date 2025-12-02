// IndexedDB utility for storing recently viewed videos offline

const DB_NAME = 'petflix-offline';
const DB_VERSION = 1;
const STORE_NAME = 'recentlyViewed';
const MAX_VIDEOS = 50; // Keep last 50 videos

interface RecentlyViewedVideo {
  videoId: string;
  youtube_video_id: string;
  title: string;
  description: string;
  thumbnail_url: string;
  shared_by_user_id: string;
  username?: string;
  profile_picture_url?: string;
  created_at: string;
  viewedAt: string; // ISO timestamp when viewed
}

// Open or create the database
async function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      
      // Create object store if it doesn't exist
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'videoId' });
        // Create index for sorting by viewedAt
        store.createIndex('viewedAt', 'viewedAt', { unique: false });
      }
    };
  });
}

// Store a video as recently viewed
export async function trackRecentlyViewed(video: Omit<RecentlyViewedVideo, 'viewedAt'>): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);

    // Add or update video with current timestamp
    const videoData: RecentlyViewedVideo = {
      ...video,
      viewedAt: new Date().toISOString(),
    };

    await new Promise<void>((resolve, reject) => {
      const putRequest = store.put(videoData);
      putRequest.onsuccess = () => resolve();
      putRequest.onerror = () => reject(putRequest.error);
    });

    // Keep only last MAX_VIDEOS videos
    const index = store.index('viewedAt');
    const allVideos = await new Promise<RecentlyViewedVideo[]>((resolve, reject) => {
      const getAllRequest = index.getAll();
      getAllRequest.onsuccess = () => resolve(getAllRequest.result);
      getAllRequest.onerror = () => reject(getAllRequest.error);
    });
    
    if (allVideos.length > MAX_VIDEOS) {
      // Sort by viewedAt ascending (oldest first)
      const sorted = allVideos.sort((a, b) => 
        new Date(a.viewedAt).getTime() - new Date(b.viewedAt).getTime()
      );
      
      // Delete oldest videos
      const toDelete = sorted.slice(0, allVideos.length - MAX_VIDEOS);
      await Promise.all(
        toDelete.map(v => 
          new Promise<void>((resolve, reject) => {
            const deleteRequest = store.delete(v.videoId);
            deleteRequest.onsuccess = () => resolve();
            deleteRequest.onerror = () => reject(deleteRequest.error);
          })
        )
      );
    }
  } catch (error) {
    console.error('Failed to track recently viewed video:', error);
    // Don't throw - offline storage is optional
  }
}

// Get all recently viewed videos, sorted by most recent first
export async function getRecentlyViewed(): Promise<RecentlyViewedVideo[]> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const index = store.index('viewedAt');
    
    const allVideos = await new Promise<RecentlyViewedVideo[]>((resolve, reject) => {
      const getAllRequest = index.getAll();
      getAllRequest.onsuccess = () => resolve(getAllRequest.result);
      getAllRequest.onerror = () => reject(getAllRequest.error);
    });
    
    // Sort by viewedAt descending (most recent first)
    return allVideos.sort((a, b) => 
      new Date(b.viewedAt).getTime() - new Date(a.viewedAt).getTime()
    );
  } catch (error) {
    console.error('Failed to get recently viewed videos:', error);
    return [];
  }
}

// Remove a specific video from recently viewed
export async function removeRecentlyViewed(videoId: string): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    await new Promise<void>((resolve, reject) => {
      const deleteRequest = store.delete(videoId);
      deleteRequest.onsuccess = () => resolve();
      deleteRequest.onerror = () => reject(deleteRequest.error);
    });
  } catch (error) {
    console.error('Failed to remove recently viewed video:', error);
    // Don't throw - offline storage is optional
  }
}

// Clear all recently viewed videos
export async function clearRecentlyViewed(): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    await new Promise<void>((resolve, reject) => {
      const clearRequest = store.clear();
      clearRequest.onsuccess = () => resolve();
      clearRequest.onerror = () => reject(clearRequest.error);
    });
  } catch (error) {
    console.error('Failed to clear recently viewed videos:', error);
    throw error;
  }
}

// Check if IndexedDB is supported
export function isIndexedDBSupported(): boolean {
  return 'indexedDB' in window;
}

