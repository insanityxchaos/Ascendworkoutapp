/* Progress photos live in IndexedDB on the device (localStorage is too small for images). */

const DB_NAME = 'ascend';
const STORE = 'photos';
let dbPromise;

function open() {
  dbPromise = dbPromise || new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE, { keyPath: 'id' });
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  return dbPromise;
}

async function run(mode, fn) {
  const db = await open();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, mode);
    const req = fn(tx.objectStore(STORE));
    tx.oncomplete = () => resolve(req && req.result);
    tx.onerror = () => reject(tx.error);
  });
}

export async function allPhotos() {
  const list = (await run('readonly', s => s.getAll())) || [];
  return list.sort((a, b) => a.date.localeCompare(b.date) || a.ts - b.ts);
}

export const putPhoto = photo => run('readwrite', s => s.put(photo));
export const deletePhoto = id => run('readwrite', s => s.delete(id));
export const clearPhotos = () => run('readwrite', s => s.clear());

// Shrinks a camera photo to a JPEG data URL (~100–200 KB) so hundreds fit on the device.
export function resizeImage(file, maxSide = 1100, quality = 0.8) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, maxSide / Math.max(img.naturalWidth, img.naturalHeight));
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(img.naturalWidth * scale);
      canvas.height = Math.round(img.naturalHeight * scale);
      canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Could not read that image'));
    };
    img.src = url;
  });
}
