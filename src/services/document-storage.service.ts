import type { DocumentChunk, UploadedDocument } from '../types';

const DOCS_KEY = 'local-chatbot-documents';
const CHUNKS_KEY = 'local-chatbot-document-chunks';
const DB_NAME = 'local-chatbot-db';
const DB_VERSION = 1;
const DOCS_STORE = 'documents';
const CHUNKS_STORE = 'chunks';
export const DOCUMENT_TTL_MS = 30 * 60 * 1000;

export class DocumentStorageService {
  private static dbPromise: Promise<IDBDatabase> | null = null;
  private static migrationPromise: Promise<void> | null = null;

  static async saveDocument(document: UploadedDocument): Promise<void> {
    if (!this.hasIndexedDb()) {
      this.saveDocumentToLocalStorage(document);
      return;
    }

    const db = await this.getDb();
    await this.runTransaction(db, [DOCS_STORE], 'readwrite', async (tx) => {
      await this.requestToPromise(tx.objectStore(DOCS_STORE).put(document));
    });
  }

  static async saveChunks(conversationId: string, chunks: DocumentChunk[]): Promise<void> {
    if (!this.hasIndexedDb()) {
      this.saveChunksToLocalStorage(conversationId, chunks);
      return;
    }

    const db = await this.getDb();
    await this.runTransaction(db, [CHUNKS_STORE], 'readwrite', async (tx) => {
      const store = tx.objectStore(CHUNKS_STORE);
      const index = store.index('conversationId');
      const existing = await this.requestToPromise<DocumentChunk[]>(index.getAll(conversationId));

      await Promise.all(existing.map((chunk) => this.requestToPromise(store.delete(chunk.id))));
      await Promise.all(chunks.map((chunk) => this.requestToPromise(store.put(chunk))));
    });
  }

  static async appendChunks(chunks: DocumentChunk[]): Promise<void> {
    if (!chunks.length) {
      return;
    }

    if (!this.hasIndexedDb()) {
      this.appendChunksToLocalStorage(chunks);
      return;
    }

    const db = await this.getDb();
    await this.runTransaction(db, [CHUNKS_STORE], 'readwrite', async (tx) => {
      const store = tx.objectStore(CHUNKS_STORE);
      await Promise.all(chunks.map((chunk) => this.requestToPromise(store.put(chunk))));
    });
  }

  static async loadDocuments(conversationId: string): Promise<UploadedDocument[]> {
    await this.pruneExpired(conversationId);

    if (!this.hasIndexedDb()) {
      return this.loadAllDocumentsFromLocalStorage().filter((doc) => doc.conversationId === conversationId);
    }

    const db = await this.getDb();
    return this.runTransaction(db, [DOCS_STORE], 'readonly', async (tx) => {
      const docs = await this.requestToPromise<UploadedDocument[]>(
        tx.objectStore(DOCS_STORE).index('conversationId').getAll(conversationId)
      );
      return docs.sort((a, b) => a.uploadedAt - b.uploadedAt);
    });
  }

  static async loadChunks(conversationId: string): Promise<DocumentChunk[]> {
    await this.pruneExpired(conversationId);

    if (!this.hasIndexedDb()) {
      return this.loadAllChunksFromLocalStorage().filter((chunk) => chunk.conversationId === conversationId);
    }

    const db = await this.getDb();
    return this.runTransaction(db, [CHUNKS_STORE], 'readonly', async (tx) => {
      const chunks = await this.requestToPromise<DocumentChunk[]>(
        tx.objectStore(CHUNKS_STORE).index('conversationId').getAll(conversationId)
      );
      return chunks.sort((a, b) => a.chunkIndex - b.chunkIndex);
    });
  }

  static async removeDocument(conversationId: string, documentId: string): Promise<void> {
    if (!this.hasIndexedDb()) {
      this.removeDocumentFromLocalStorage(conversationId, documentId);
      return;
    }

    const db = await this.getDb();
    await this.runTransaction(db, [DOCS_STORE, CHUNKS_STORE], 'readwrite', async (tx) => {
      const docsStore = tx.objectStore(DOCS_STORE);
      const chunksStore = tx.objectStore(CHUNKS_STORE);

      const docs = await this.requestToPromise<UploadedDocument[]>(docsStore.index('conversationId').getAll(conversationId));
      const targetDoc = docs.find((doc) => doc.id === documentId);
      if (targetDoc) {
        await this.requestToPromise(docsStore.delete(targetDoc.id));
      }

      const chunks = await this.requestToPromise<DocumentChunk[]>(chunksStore.index('documentId').getAll(documentId));
      await Promise.all(chunks.map((chunk) => this.requestToPromise(chunksStore.delete(chunk.id))));
    });
  }

  static async clearConversation(conversationId: string): Promise<void> {
    if (!this.hasIndexedDb()) {
      this.clearConversationFromLocalStorage(conversationId);
      return;
    }

    const db = await this.getDb();
    await this.runTransaction(db, [DOCS_STORE, CHUNKS_STORE], 'readwrite', async (tx) => {
      const docsStore = tx.objectStore(DOCS_STORE);
      const chunksStore = tx.objectStore(CHUNKS_STORE);

      const docs = await this.requestToPromise<UploadedDocument[]>(docsStore.index('conversationId').getAll(conversationId));
      await Promise.all(docs.map((doc) => this.requestToPromise(docsStore.delete(doc.id))));

      const chunks = await this.requestToPromise<DocumentChunk[]>(chunksStore.index('conversationId').getAll(conversationId));
      await Promise.all(chunks.map((chunk) => this.requestToPromise(chunksStore.delete(chunk.id))));
    });
  }

  static async pruneExpired(conversationId: string, now: number = Date.now()): Promise<string[]> {
    if (!this.hasIndexedDb()) {
      const allDocs = this.loadAllDocumentsFromLocalStorage();
      const expired = allDocs.filter(
        (doc) => doc.conversationId === conversationId && this.isDocumentExpired(doc, now)
      );
      if (!expired.length) {
        return [];
      }

      const expiredIds = new Set(expired.map((doc) => doc.id));
      const liveDocs = allDocs.filter((doc) => !expiredIds.has(doc.id));
      localStorage.setItem(DOCS_KEY, JSON.stringify(liveDocs));

      const liveChunks = this.loadAllChunksFromLocalStorage().filter((chunk) => !expiredIds.has(chunk.documentId));
      localStorage.setItem(CHUNKS_KEY, JSON.stringify(liveChunks));
      return [...expiredIds];
    }

    const db = await this.getDb();
    return this.runTransaction(db, [DOCS_STORE, CHUNKS_STORE], 'readwrite', async (tx) => {
      const docsStore = tx.objectStore(DOCS_STORE);
      const chunksStore = tx.objectStore(CHUNKS_STORE);
      const docs = await this.requestToPromise<UploadedDocument[]>(
        docsStore.index('conversationId').getAll(conversationId)
      );

      const expired = docs.filter((doc) => this.isDocumentExpired(doc, now));
      if (!expired.length) {
        return [];
      }

      const expiredIds = expired.map((doc) => doc.id);

      await Promise.all(expired.map((doc) => this.requestToPromise(docsStore.delete(doc.id))));

      await Promise.all(
        expiredIds.map(async (documentId) => {
          const chunks = await this.requestToPromise<DocumentChunk[]>(
            chunksStore.index('documentId').getAll(documentId)
          );
          await Promise.all(chunks.map((chunk) => this.requestToPromise(chunksStore.delete(chunk.id))));
        })
      );

      return expiredIds;
    });
  }

  private static loadAllDocumentsFromLocalStorage(): UploadedDocument[] {
    try {
      const raw = localStorage.getItem(DOCS_KEY);
      return raw ? (JSON.parse(raw) as UploadedDocument[]) : [];
    } catch {
      return [];
    }
  }

  private static loadAllChunksFromLocalStorage(): DocumentChunk[] {
    try {
      const raw = localStorage.getItem(CHUNKS_KEY);
      return raw ? (JSON.parse(raw) as DocumentChunk[]) : [];
    } catch {
      return [];
    }
  }

  private static hasIndexedDb(): boolean {
    return typeof indexedDB !== 'undefined';
  }

  private static isDocumentExpired(document: UploadedDocument, now: number = Date.now()): boolean {
    return now - document.uploadedAt >= DOCUMENT_TTL_MS;
  }

  private static saveDocumentToLocalStorage(document: UploadedDocument): void {
    const docs = this.loadAllDocumentsFromLocalStorage();
    const index = docs.findIndex((doc) => doc.id === document.id);

    if (index >= 0) {
      docs[index] = document;
    } else {
      docs.push(document);
    }

    localStorage.setItem(DOCS_KEY, JSON.stringify(docs));
  }

  private static saveChunksToLocalStorage(conversationId: string, chunks: DocumentChunk[]): void {
    const allChunks = this.loadAllChunksFromLocalStorage();
    const withoutConversation = allChunks.filter((chunk) => chunk.conversationId !== conversationId);
    localStorage.setItem(CHUNKS_KEY, JSON.stringify([...withoutConversation, ...chunks]));
  }

  private static appendChunksToLocalStorage(chunks: DocumentChunk[]): void {
    const allChunks = this.loadAllChunksFromLocalStorage();
    localStorage.setItem(CHUNKS_KEY, JSON.stringify([...allChunks, ...chunks]));
  }

  private static removeDocumentFromLocalStorage(conversationId: string, documentId: string): void {
    const docs = this.loadAllDocumentsFromLocalStorage().filter(
      (doc) => !(doc.conversationId === conversationId && doc.id === documentId)
    );
    localStorage.setItem(DOCS_KEY, JSON.stringify(docs));

    const chunks = this.loadAllChunksFromLocalStorage().filter(
      (chunk) => !(chunk.conversationId === conversationId && chunk.documentId === documentId)
    );
    localStorage.setItem(CHUNKS_KEY, JSON.stringify(chunks));
  }

  private static clearConversationFromLocalStorage(conversationId: string): void {
    const docs = this.loadAllDocumentsFromLocalStorage().filter((doc) => doc.conversationId !== conversationId);
    localStorage.setItem(DOCS_KEY, JSON.stringify(docs));

    const chunks = this.loadAllChunksFromLocalStorage().filter((chunk) => chunk.conversationId !== conversationId);
    localStorage.setItem(CHUNKS_KEY, JSON.stringify(chunks));
  }

  private static async getDb(): Promise<IDBDatabase> {
    if (!this.hasIndexedDb()) {
      throw new Error('IndexedDB is not available in this environment.');
    }

    if (!this.dbPromise) {
      this.dbPromise = new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = () => {
          const db = request.result;

          if (!db.objectStoreNames.contains(DOCS_STORE)) {
            const docsStore = db.createObjectStore(DOCS_STORE, { keyPath: 'id' });
            docsStore.createIndex('conversationId', 'conversationId', { unique: false });
          }

          if (!db.objectStoreNames.contains(CHUNKS_STORE)) {
            const chunksStore = db.createObjectStore(CHUNKS_STORE, { keyPath: 'id' });
            chunksStore.createIndex('conversationId', 'conversationId', { unique: false });
            chunksStore.createIndex('documentId', 'documentId', { unique: false });
          }
        };

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error ?? new Error('Failed to open IndexedDB.'));
      });
    }

    const db = await this.dbPromise;

    if (!this.migrationPromise) {
      this.migrationPromise = this.migrateFromLocalStorage(db);
    }
    await this.migrationPromise;

    return db;
  }

  private static async migrateFromLocalStorage(db: IDBDatabase): Promise<void> {
    const docs = this.loadAllDocumentsFromLocalStorage();
    const chunks = this.loadAllChunksFromLocalStorage();

    if (!docs.length && !chunks.length) {
      return;
    }

    await this.runTransaction(db, [DOCS_STORE, CHUNKS_STORE], 'readwrite', async (tx) => {
      const docsStore = tx.objectStore(DOCS_STORE);
      const chunksStore = tx.objectStore(CHUNKS_STORE);

      await Promise.all(docs.map((doc) => this.requestToPromise(docsStore.put(doc))));
      await Promise.all(chunks.map((chunk) => this.requestToPromise(chunksStore.put(chunk))));
    });

    localStorage.removeItem(DOCS_KEY);
    localStorage.removeItem(CHUNKS_KEY);
  }

  private static requestToPromise<T = unknown>(request: IDBRequest<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error ?? new Error('IndexedDB request failed.'));
    });
  }

  private static async runTransaction<T>(
    db: IDBDatabase,
    stores: string[],
    mode: IDBTransactionMode,
    operation: (tx: IDBTransaction) => Promise<T>
  ): Promise<T> {
    const tx = db.transaction(stores, mode);

    const txDone = new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onabort = () => reject(tx.error ?? new Error('IndexedDB transaction aborted.'));
      tx.onerror = () => reject(tx.error ?? new Error('IndexedDB transaction failed.'));
    });

    const result = await operation(tx);
    await txDone;
    return result;
  }
}
