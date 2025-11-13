import { openDB, IDBPDatabase } from 'idb';
// import { ITask, IHabit } from '@/types/models';

export type GolfSession = {
  id: string;
  createdAt: number;
  updatedAt: number;
  // Add more fields as needed
};

export class DataService {
  private static dbPromise: Promise<IDBPDatabase<any>>;

  static init() {
    if (!this.dbPromise) {
      this.dbPromise = openDB('LifeSyncDB', 1, {
        upgrade(db) {
          if (!db.objectStoreNames.contains('tasks')) {
            db.createObjectStore('tasks', { keyPath: 'id' });
          }
          if (!db.objectStoreNames.contains('habits')) {
            db.createObjectStore('habits', { keyPath: 'id' });
          }
          if (!db.objectStoreNames.contains('golfSessions')) {
            db.createObjectStore('golfSessions', { keyPath: 'id' });
          }
        },
      });
    }
    return this.dbPromise;
  }

  static async getAll(store: 'tasks' | 'habits' | 'golfSessions') {
    const db = await this.init();
    return db.getAll(store);
  }

  static async get(store: 'tasks' | 'habits' | 'golfSessions', id: string) {
    const db = await this.init();
    return db.get(store, id);
  }

  static async set(store: 'tasks' | 'habits' | 'golfSessions', value: any) {
    const db = await this.init();
    return db.put(store, value);
  }

  static async delete(store: 'tasks' | 'habits' | 'golfSessions', id: string) {
    const db = await this.init();
    return db.delete(store, id);
  }
}

// Initialize DB on app load
DataService.init();
