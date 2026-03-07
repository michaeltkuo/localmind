import type { DocumentChunk, UploadedDocument } from '../../types';
import { DocumentStorageService } from '../document-storage.service';

describe('DocumentStorageService', () => {
  const resetIndexedDb = async () => {
    if (typeof indexedDB === 'undefined') {
      return;
    }

    await new Promise<void>((resolve, reject) => {
      const request = indexedDB.deleteDatabase('local-chatbot-db');
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error ?? new Error('Failed to reset IndexedDB'));
      request.onblocked = () => resolve();
    });
  };

  const document: UploadedDocument = {
    id: 'doc-1',
    conversationId: 'conv-1',
    name: 'design.md',
    mimeType: 'text/markdown',
    sizeBytes: 1000,
    uploadedAt: Date.now(),
    chunkCount: 2,
    embeddingModel: 'embeddinggemma',
  };

  const chunks: DocumentChunk[] = [
    {
      id: 'ch-1',
      conversationId: 'conv-1',
      documentId: 'doc-1',
      chunkIndex: 0,
      content: 'Alpha',
      embedding: [0.1, 0.2],
      tokenEstimate: 2,
    },
    {
      id: 'ch-2',
      conversationId: 'conv-1',
      documentId: 'doc-1',
      chunkIndex: 1,
      content: 'Beta',
      embedding: [0.2, 0.3],
      tokenEstimate: 2,
    },
  ];

  beforeEach(async () => {
    localStorage.clear();
    await resetIndexedDb();
  });

  test('saves and loads documents by conversation', async () => {
    await DocumentStorageService.saveDocument(document);

    const docs = await DocumentStorageService.loadDocuments('conv-1');
    expect(docs).toHaveLength(1);
    expect(docs[0].name).toBe('design.md');
  });

  test('appends and loads chunks by conversation', async () => {
    await DocumentStorageService.appendChunks(chunks);

    const loaded = await DocumentStorageService.loadChunks('conv-1');
    expect(loaded).toHaveLength(2);
    expect(loaded[1].chunkIndex).toBe(1);
  });

  test('removeDocument removes metadata and chunks', async () => {
    await DocumentStorageService.saveDocument(document);
    await DocumentStorageService.appendChunks(chunks);

    await DocumentStorageService.removeDocument('conv-1', 'doc-1');

    await expect(DocumentStorageService.loadDocuments('conv-1')).resolves.toHaveLength(0);
    await expect(DocumentStorageService.loadChunks('conv-1')).resolves.toHaveLength(0);
  });

  test('pruneExpired removes documents and chunks older than TTL', async () => {
    const oldUploadedAt = Date.now() - (31 * 60 * 1000);
    const expiredDoc: UploadedDocument = {
      ...document,
      id: 'doc-expired',
      uploadedAt: oldUploadedAt,
    };

    const expiredChunks: DocumentChunk[] = chunks.map((chunk, index) => ({
      ...chunk,
      id: `ch-expired-${index}`,
      documentId: 'doc-expired',
    }));

    await DocumentStorageService.saveDocument(expiredDoc);
    await DocumentStorageService.appendChunks(expiredChunks);

    const removed = await DocumentStorageService.pruneExpired('conv-1', Date.now());
    expect(removed).toContain('doc-expired');

    await expect(DocumentStorageService.loadDocuments('conv-1')).resolves.toHaveLength(0);
    await expect(DocumentStorageService.loadChunks('conv-1')).resolves.toHaveLength(0);
  });
});
