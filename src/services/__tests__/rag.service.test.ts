import type { DocumentChunk, UploadedDocument } from '../../types';
import { OllamaService } from '../ollama.service';
import { RagService } from '../rag.service';

jest.mock('../ollama.service', () => ({
  OllamaService: {
    embedQuery: jest.fn(),
  },
}));

describe('RagService', () => {
  const documents: UploadedDocument[] = [
    {
      id: 'doc-1',
      conversationId: 'conv-1',
      name: 'requirements.md',
      mimeType: 'text/markdown',
      sizeBytes: 1234,
      uploadedAt: Date.now(),
      chunkCount: 2,
      embeddingModel: 'embeddinggemma',
    },
  ];

  const chunks: DocumentChunk[] = [
    {
      id: 'chunk-1',
      conversationId: 'conv-1',
      documentId: 'doc-1',
      chunkIndex: 0,
      content: 'Authentication requires OAuth 2.0.',
      embedding: [1, 0],
      tokenEstimate: 10,
    },
    {
      id: 'chunk-2',
      conversationId: 'conv-1',
      documentId: 'doc-1',
      chunkIndex: 1,
      content: 'Rate limit is 100 requests per minute.',
      embedding: [0, 1],
      tokenEstimate: 10,
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('returns empty string when disabled', async () => {
    const result = await RagService.buildSystemPrefixForQuery('hello', {
      enabled: false,
      embeddingModel: 'embeddinggemma',
      documents,
      chunks,
    });

    expect(result).toBe('');
  });

  test('returns formatted context prefix when query has matches', async () => {
    (OllamaService.embedQuery as jest.Mock).mockResolvedValue([1, 0]);

    const result = await RagService.buildSystemPrefixForQuery('How auth works?', {
      enabled: true,
      embeddingModel: 'embeddinggemma',
      topK: 1,
      maxContextTokens: 200,
      documents,
      chunks,
    });

    expect(result).toContain('--- DOCUMENT CONTEXT ---');
    expect(result).toContain('requirements.md');
    expect(result).toContain('Chunk 0');
    expect(result).not.toContain('Chunk 1');
    expect(OllamaService.embedQuery).toHaveBeenCalledWith('embeddinggemma', 'How auth works?');
  });

  test('uses inline chunks without query embedding', async () => {
    const inlineChunks: DocumentChunk[] = [
      {
        id: 'chunk-inline',
        conversationId: 'conv-1',
        documentId: 'doc-1',
        chunkIndex: 0,
        content: 'This is a tiny document that can be stuffed directly.',
        embedding: [],
        tokenEstimate: 15,
      },
    ];

    const result = await RagService.buildSystemPrefixForQuery('What is this?', {
      enabled: true,
      embeddingModel: 'embeddinggemma',
      topK: 3,
      maxContextTokens: 200,
      documents,
      chunks: inlineChunks,
    });

    expect(result).toContain('tiny document');
    expect(OllamaService.embedQuery).not.toHaveBeenCalled();
  });
});
