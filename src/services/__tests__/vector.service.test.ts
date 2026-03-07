import type { DocumentChunk, UploadedDocument } from '../../types';
import { VectorService } from '../vector.service';

describe('VectorService', () => {
  test('cosineSimilarity returns 1 for identical vectors', () => {
    expect(VectorService.cosineSimilarity([1, 2, 3], [1, 2, 3])).toBeCloseTo(1, 10);
  });

  test('cosineSimilarity returns 0 when dimensions mismatch', () => {
    expect(VectorService.cosineSimilarity([1, 2], [1, 2, 3])).toBe(0);
  });

  test('searchChunks returns top K sorted by score', () => {
    const chunks: DocumentChunk[] = [
      {
        id: 'c1',
        conversationId: 'conv-1',
        documentId: 'doc-1',
        chunkIndex: 0,
        content: 'first',
        embedding: [1, 0],
        tokenEstimate: 1,
      },
      {
        id: 'c2',
        conversationId: 'conv-1',
        documentId: 'doc-1',
        chunkIndex: 1,
        content: 'second',
        embedding: [0.5, 0.5],
        tokenEstimate: 1,
      },
      {
        id: 'c3',
        conversationId: 'conv-1',
        documentId: 'doc-2',
        chunkIndex: 0,
        content: 'third',
        embedding: [0, 1],
        tokenEstimate: 1,
      },
    ];

    const result = VectorService.searchChunks([1, 0], chunks, 2);
    expect(result).toHaveLength(2);
    expect(result[0].chunk.id).toBe('c1');
    expect(result[1].chunk.id).toBe('c2');
    expect(result[0].score).toBeGreaterThan(result[1].score);
  });

  test('buildContextBlock formats sources with token budget', () => {
    const documents: UploadedDocument[] = [
      {
        id: 'doc-1',
        conversationId: 'conv-1',
        name: 'policy.md',
        mimeType: 'text/markdown',
        sizeBytes: 500,
        uploadedAt: Date.now(),
        chunkCount: 2,
        embeddingModel: 'embeddinggemma',
      },
    ];

    const retrieved = [
      {
        chunk: {
          id: 'chunk-1',
          conversationId: 'conv-1',
          documentId: 'doc-1',
          chunkIndex: 0,
          content: 'A'.repeat(200),
          embedding: [1, 0],
          tokenEstimate: 60,
        },
        score: 0.9,
      },
      {
        chunk: {
          id: 'chunk-2',
          conversationId: 'conv-1',
          documentId: 'doc-1',
          chunkIndex: 1,
          content: 'B'.repeat(200),
          embedding: [0, 1],
          tokenEstimate: 60,
        },
        score: 0.8,
      },
    ];

    const context = VectorService.buildContextBlock(retrieved, documents, 80);
    expect(context).toContain('--- DOCUMENT CONTEXT ---');
    expect(context).toContain('[Source: policy.md | Chunk 0]');
    expect(context).not.toContain('[Source: policy.md | Chunk 1]');
    expect(context).toContain('--- END DOCUMENT CONTEXT ---');
  });
});
