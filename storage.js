// ═══════════════════════════════════════════════════════════════════
// STORAGE — IndexedDB wrapper
// Stores: subjects data, progress, notes, favorites, files (images/PDFs)
// ═══════════════════════════════════════════════════════════════════

const DB_NAME = 'bac_tracker_db';
const DB_VERSION = 1;

const STORES = {
  subjects: 'subjects',   // full subject tree
  progress: 'progress',   // checked state
  notes: 'notes',         // per-subchapter notes
  favorites: 'favorites', // favorite subchapters
  files: 'files',         // uploaded files (images/PDFs)
  settings: 'settings'    // theme, pomodoro config, etc.
};

let db = null;

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onerror = () => reject(req.error);
    req.onsuccess = () => { db = req.result; resolve(db); };
    req.onupgradeneeded = (e) => {
      const database = e.target.result;
      Object.values(STORES).forEach(name => {
        if (!database.objectStoreNames.contains(name)) {
          database.createObjectStore(name, { keyPath: 'key' });
        }
      });
    };
  });
}

function tx(store, mode = 'readonly') {
  return db.transaction(store, mode).objectStore(store);
}

async function dbGet(store, key) {
  return new Promise((resolve, reject) => {
    const req = tx(store).get(key);
    req.onsuccess = () => resolve(req.result?.value);
    req.onerror = () => reject(req.error);
  });
}

async function dbSet(store, key, value) {
  return new Promise((resolve, reject) => {
    const req = tx(store, 'readwrite').put({ key, value });
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

async function dbDelete(store, key) {
  return new Promise((resolve, reject) => {
    const req = tx(store, 'readwrite').delete(key);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

async function dbGetAll(store) {
  return new Promise((resolve, reject) => {
    const req = tx(store).getAll();
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function dbClear(store) {
  return new Promise((resolve, reject) => {
    const req = tx(store, 'readwrite').clear();
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

// ─── HIGH-LEVEL API ─────────────────────────────────────────────
const Storage = {
  // SUBJECTS (the whole tree)
  async getSubjects() {
    return await dbGet(STORES.subjects, 'all') || [];
  },
  async setSubjects(subjects) {
    await dbSet(STORES.subjects, 'all', subjects);
  },

  // PROGRESS — key: `${subjectId}:${lessonId}:${scId}` → bool
  async getProgress() {
    return await dbGet(STORES.progress, 'all') || {};
  },
  async setProgress(progress) {
    await dbSet(STORES.progress, 'all', progress);
  },

  // NOTES — key: subchapter id → text
  async getNotes() {
    return await dbGet(STORES.notes, 'all') || {};
  },
  async setNotes(notes) {
    await dbSet(STORES.notes, 'all', notes);
  },

  // FAVORITES — { [scId]: true }
  async getFavorites() {
    return await dbGet(STORES.favorites, 'all') || {};
  },
  async setFavorites(favs) {
    await dbSet(STORES.favorites, 'all', favs);
  },

  // FILES — each file is { key: uniqueId, value: { name, type, dataUrl, lessonId, section } }
  async addFile(fileData) {
    const key = 'file_' + Date.now() + '_' + Math.random().toString(36).slice(2, 9);
    await dbSet(STORES.files, key, fileData);
    return key;
  },
  async getFile(key) {
    return await dbGet(STORES.files, key);
  },
  async deleteFile(key) {
    await dbDelete(STORES.files, key);
  },
  async getAllFiles() {
    const all = await dbGetAll(STORES.files);
    const map = {};
    all.forEach(item => { map[item.key] = item.value; });
    return map;
  },

  // SETTINGS
  async getSettings() {
    return await dbGet(STORES.settings, 'all') || {};
  },
  async setSettings(settings) {
    await dbSet(STORES.settings, 'all', settings);
  },

  // FULL EXPORT
  async exportAll() {
    const [subjects, progress, notes, favorites, files, settings] = await Promise.all([
      this.getSubjects(),
      this.getProgress(),
      this.getNotes(),
      this.getFavorites(),
      this.getAllFiles(),
      this.getSettings()
    ]);
    return { subjects, progress, notes, favorites, files, settings, exportedAt: new Date().toISOString() };
  },

  // FULL IMPORT
  async importAll(data) {
    if (data.subjects) await this.setSubjects(data.subjects);
    if (data.progress) await this.setProgress(data.progress);
    if (data.notes) await this.setNotes(data.notes);
    if (data.favorites) await this.setFavorites(data.favorites);
    if (data.settings) await this.setSettings(data.settings);
    if (data.files) {
      await dbClear(STORES.files);
      for (const [key, value] of Object.entries(data.files)) {
        await dbSet(STORES.files, key, value);
      }
    }
  },

  // RESET
  async resetAll() {
    for (const store of Object.values(STORES)) {
      await dbClear(store);
    }
  }
};
