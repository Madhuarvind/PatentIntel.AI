/**
 * indexedDbStore.ts
 *
 * Dedicated Client-Side IndexedDB Storage Adapter for PatentIntel.AI.
 * 
 * Provides:
 * 1. Binary Blob Storage for uploaded Patent PDFs (bypasses localStorage 5MB string quota limit).
 * 2. High-performance offline relational caching for Patents, Claims, Academic Papers, and AI Runs.
 */

const DB_NAME = 'PatentIntelAI_IndexedDB';
const DB_VERSION = 1;

export interface DocumentBlobRecord {
  fileHash: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  blob: Blob;
  uploadedAt: string;
}

export interface CachedRelationalTable<T = any> {
  id: string;
  table: string;
  data: T;
  updatedAt: string;
}

class IndexedDbStorageService {
  private dbPromise: Promise<IDBDatabase> | null = null;

  constructor() {
    if (typeof window !== 'undefined' && 'indexedDB' in window) {
      this.initDB();
    }
  }

  private initDB(): Promise<IDBDatabase> {
    if (this.dbPromise) return this.dbPromise;

    this.dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Store 1: PDF Document Binary Blobs
        if (!db.objectStoreNames.contains('patent_documents_blobs')) {
          const blobStore = db.createObjectStore('patent_documents_blobs', { keyPath: 'fileHash' });
          blobStore.createIndex('uploadedAt', 'uploadedAt', { unique: false });
        }

        // Store 2: Offline Relational Entity Cache
        if (!db.objectStoreNames.contains('relational_entities_cache')) {
          const entityStore = db.createObjectStore('relational_entities_cache', { keyPath: 'id' });
          entityStore.createIndex('table', 'table', { unique: false });
        }
      };

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => {
        console.warn('[IndexedDB] Failed to open IndexedDB database:', request.error);
        reject(request.error);
      };
    });

    return this.dbPromise;
  }

  // ---------------------------------------------------------------------------
  // PDF Blob Storage Operations
  // ---------------------------------------------------------------------------

  public async savePdfBlob(fileHash: string, fileName: string, file: File | Blob): Promise<void> {
    try {
      const db = await this.initDB();
      const tx = db.transaction('patent_documents_blobs', 'readwrite');
      const store = tx.objectStore('patent_documents_blobs');

      const record: DocumentBlobRecord = {
        fileHash,
        fileName,
        mimeType: file.type || 'application/pdf',
        sizeBytes: file.size,
        blob: file instanceof Blob ? file : new Blob([file], { type: 'application/pdf' }),
        uploadedAt: new Date().toISOString()
      };

      await new Promise<void>((resolve, reject) => {
        const req = store.put(record);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
      console.log(`[IndexedDB] Stored PDF Blob for ${fileName} (${fileHash})`);
    } catch (e) {
      console.warn('[IndexedDB] PDF Blob save error:', e);
    }
  }

  public async getPdfBlob(fileHash: string): Promise<DocumentBlobRecord | null> {
    try {
      const db = await this.initDB();
      const tx = db.transaction('patent_documents_blobs', 'readonly');
      const store = tx.objectStore('patent_documents_blobs');

      return await new Promise<DocumentBlobRecord | null>((resolve) => {
        const req = store.get(fileHash);
        req.onsuccess = () => resolve(req.result || null);
        req.onerror = () => resolve(null);
      });
    } catch {
      return null;
    }
  }

  public async deletePdfBlob(fileHash: string): Promise<void> {
    try {
      const db = await this.initDB();
      const tx = db.transaction('patent_documents_blobs', 'readwrite');
      const store = tx.objectStore('patent_documents_blobs');
      store.delete(fileHash);
    } catch (e) {
      console.warn('[IndexedDB] Delete PDF Blob error:', e);
    }
  }

  // ---------------------------------------------------------------------------
  // Relational Entity Caching Operations
  // ---------------------------------------------------------------------------

  public async cacheEntity<T>(tableName: string, entityId: string, data: T): Promise<void> {
    try {
      const db = await this.initDB();
      const tx = db.transaction('relational_entities_cache', 'readwrite');
      const store = tx.objectStore('relational_entities_cache');

      const record: CachedRelationalTable<T> = {
        id: `${tableName}:${entityId}`,
        table: tableName,
        data,
        updatedAt: new Date().toISOString()
      };

      store.put(record);
    } catch (e) {
      console.warn('[IndexedDB] Cache entity error:', e);
    }
  }

  public async getCachedEntity<T>(tableName: string, entityId: string): Promise<T | null> {
    try {
      const db = await this.initDB();
      const tx = db.transaction('relational_entities_cache', 'readonly');
      const store = tx.objectStore('relational_entities_cache');

      return await new Promise<T | null>((resolve) => {
        const req = store.get(`${tableName}:${entityId}`);
        req.onsuccess = () => resolve(req.result ? req.result.data : null);
        req.onerror = () => resolve(null);
      });
    } catch {
      return null;
    }
  }
}

export const indexedDbStore = new IndexedDbStorageService();
