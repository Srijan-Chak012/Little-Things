/**
 * Album Storage — saves scribble images to a device folder
 * using the File System Access API (Chrome/Edge).
 * Creates a "The Little Things" album folder on the device.
 */

const DB_NAME = 'TheLittleThingsAlbum';
const STORE_NAME = 'handles';
const DIR_KEY = 'albumDirectory';

// Open IndexedDB to persist the directory handle
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      request.result.createObjectStore(STORE_NAME);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function saveHandle(handle: FileSystemDirectoryHandle): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).put(handle, DIR_KEY);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function loadHandle(): Promise<FileSystemDirectoryHandle | null> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const request = tx.objectStore(STORE_NAME).get(DIR_KEY);
    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error);
  });
}

/** Check if the File System Access API is available */
export function isAlbumSupported(): boolean {
  return 'showDirectoryPicker' in window;
}

/** Prompt user to select/create the album folder. Returns true on success. */
export async function setupAlbumFolder(): Promise<boolean> {
  if (!isAlbumSupported()) return false;
  try {
    const handle = await (window as any).showDirectoryPicker({
      id: 'the-little-things-album',
      mode: 'readwrite',
      startIn: 'pictures',
    });
    await saveHandle(handle);
    return true;
  } catch {
    return false; // User cancelled
  }
}

/** Check if an album folder has been configured */
export async function hasAlbumFolder(): Promise<boolean> {
  const handle = await loadHandle();
  return handle !== null;
}

/** Verify we still have permission, re-prompt if needed */
async function getVerifiedHandle(): Promise<FileSystemDirectoryHandle | null> {
  const handle = await loadHandle();
  if (!handle) return null;

  // Check if we still have permission
  const permission = await (handle as any).queryPermission({ mode: 'readwrite' });
  if (permission === 'granted') return handle;

  // Try to re-request
  const request = await (handle as any).requestPermission({ mode: 'readwrite' });
  return request === 'granted' ? handle : null;
}

/** Convert a base64 data URL to a Blob */
function dataURLtoBlob(dataURL: string): Blob {
  const [header, data] = dataURL.split(',');
  const mime = header.match(/:(.*?);/)?.[1] || 'image/png';
  const binary = atob(data);
  const array = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    array[i] = binary.charCodeAt(i);
  }
  return new Blob([array], { type: mime });
}

/** Sanitize a string for use as a filename */
function sanitizeFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9_\- ]/g, '').trim().replace(/\s+/g, '_') || 'scribble';
}

/**
 * Save a scribble image to the album folder.
 * Returns the filename on success, or null on failure.
 */
export async function saveToAlbum(
  imageData: string,
  name?: string,
  timestamp?: string
): Promise<string | null> {
  const handle = await getVerifiedHandle();
  if (!handle) return null;

  try {
    const date = timestamp ? new Date(timestamp) : new Date();
    const dateStr = date.toISOString().slice(0, 10); // YYYY-MM-DD
    const baseName = name ? sanitizeFilename(name) : 'scribble';
    const filename = `${baseName}_${dateStr}_${Date.now()}.png`;

    const fileHandle = await handle.getFileHandle(filename, { create: true });
    const writable = await (fileHandle as any).createWritable();
    const blob = dataURLtoBlob(imageData);
    await writable.write(blob);
    await writable.close();

    return filename;
  } catch (err) {
    console.error('Failed to save to album:', err);
    return null;
  }
}

/**
 * Export multiple scribbles to the album (batch).
 * Returns count of successfully saved files.
 */
export async function exportAllToAlbum(
  scribbles: { imageData: string; name?: string; timestamp: string }[]
): Promise<number> {
  const handle = await getVerifiedHandle();
  if (!handle) return 0;

  let saved = 0;
  for (const s of scribbles) {
    const result = await saveToAlbum(s.imageData, s.name, s.timestamp);
    if (result) saved++;
  }
  return saved;
}
