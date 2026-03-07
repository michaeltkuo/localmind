import type { DocumentChunk, UploadedDocument } from '../types';
import { OllamaService } from './ollama.service';
import { VectorService } from './vector.service';

interface IndexTextOptions {
  conversationId: string;
  documentName: string;
  mimeType: string;
  sizeBytes: number;
  text: string;
  embeddingModel: string;
  chunkSize?: number;
  overlap?: number;
  skipEmbeddings?: boolean;
  embeddingBatchSize?: number;
  onProgress?: (current: number, total: number) => void;
}

interface ChunkTextOptions {
  chunkSize?: number;
  overlap?: number;
}

const SUPPORTED_MIME_TYPES = new Set([
  'text/plain',
  'text/markdown',
  'text/csv',
  'application/json',
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]);

const SUPPORTED_EXTENSIONS = ['.txt', '.md', '.csv', '.json', '.pdf', '.docx'];

export class DocumentService {
  static isSupportedFile(file: File): boolean {
    const name = file.name.toLowerCase();
    const hasSupportedExtension = SUPPORTED_EXTENSIONS.some((ext) => name.endsWith(ext));
    const hasSupportedMime = !!file.type && SUPPORTED_MIME_TYPES.has(file.type);
    return hasSupportedExtension || hasSupportedMime;
  }

  static getSupportedExtensions(): string[] {
    return [...SUPPORTED_EXTENSIONS];
  }

  static async extractTextFromFile(file: File): Promise<string> {
    if (!this.isSupportedFile(file)) {
      throw new Error(
        `Unsupported file type. Supported types: ${SUPPORTED_EXTENSIONS.join(', ')}`
      );
    }

    const fileName = file.name.toLowerCase();
    const isPdf = fileName.endsWith('.pdf') || file.type === 'application/pdf';
    const isDocx =
      fileName.endsWith('.docx') ||
      file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

    if (!isPdf && !isDocx) {
      return file.text();
    }

    const hasExtractor =
      typeof window !== 'undefined' &&
      !!window.api &&
      typeof window.api.extractTextFromDocument === 'function';

    if (!hasExtractor) {
      throw new Error('Document extraction is unavailable in this environment.');
    }

    const bytes = Array.from(new Uint8Array(await file.arrayBuffer()));
    const result = await window.api.extractTextFromDocument({
      fileName: file.name,
      mimeType: file.type || '',
      bytes,
    });

    if (!result.success) {
      throw new Error(result.error || 'Failed to extract document text');
    }

    const extracted = (result.text || '').trim();
    if (!extracted) {
      throw new Error('No indexable text found in document');
    }

    return extracted;
  }

  static chunkText(text: string, options?: ChunkTextOptions): string[] {
    const normalized = text.trim();
    if (!normalized) {
      return [];
    }

    const chunkSize = options?.chunkSize ?? 2000;
    const overlap = options?.overlap ?? 200;

    if (overlap >= chunkSize) {
      throw new Error('Chunk overlap must be smaller than chunk size');
    }

    const chunks: string[] = [];
    let start = 0;

    while (start < normalized.length) {
      const tentativeEnd = Math.min(start + chunkSize, normalized.length);
      let end = tentativeEnd;

      if (tentativeEnd < normalized.length) {
        const paragraphBreak = normalized.lastIndexOf('\n\n', tentativeEnd);
        const sentenceBreak = normalized.lastIndexOf('. ', tentativeEnd);
        const breakPoint = Math.max(paragraphBreak, sentenceBreak);

        if (breakPoint > start + Math.floor(chunkSize * 0.6)) {
          end = breakPoint + 1;
        }
      }

      const chunk = normalized.slice(start, end).trim();
      if (chunk) {
        chunks.push(chunk);
      }

      if (end >= normalized.length) {
        break;
      }

      start = Math.max(0, end - overlap);
    }

    return chunks;
  }

  static async indexTextDocument(options: IndexTextOptions): Promise<{
    document: UploadedDocument;
    chunks: DocumentChunk[];
  }> {
    const {
      conversationId,
      documentName,
      mimeType,
      sizeBytes,
      text,
      embeddingModel,
      chunkSize,
      overlap,
      skipEmbeddings = false,
      embeddingBatchSize = 12,
      onProgress,
    } = options;

    const rawChunks = this.chunkText(text, { chunkSize, overlap });
    if (!rawChunks.length) {
      throw new Error('No indexable text found in document');
    }

    const documentId = `doc-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    let embeddings: number[][] = [];

    if (skipEmbeddings) {
      embeddings = rawChunks.map(() => []);
      onProgress?.(rawChunks.length, rawChunks.length);
    } else {
      const safeBatchSize = Math.max(1, embeddingBatchSize);

      // Embed a slice of chunks, auto-retrying with half the batch size on
      // HTTP 500 / EOF errors (Ollama's model runner dies if the payload is
      // too large). Recurses down to single-chunk batches before giving up.
      const embedWithRetry = async (batch: string[], maxSize: number): Promise<number[][]> => {
        try {
          const result = await OllamaService.embed(embeddingModel, batch);
          if (result.length !== batch.length) {
            throw new Error('Mismatch between chunk and embedding count');
          }
          return result;
        } catch (err) {
          const halfSize = Math.floor(maxSize / 2);
          if (halfSize < 1) {
            // Already at single-chunk granularity — surface the error
            throw err;
          }
          // Split batch and retry each half with a smaller size cap
          const out: number[][] = [];
          for (let i = 0; i < batch.length; i += halfSize) {
            const sub = batch.slice(i, i + halfSize);
            const subResult = await embedWithRetry(sub, halfSize);
            out.push(...subResult);
          }
          return out;
        }
      };

      for (let start = 0; start < rawChunks.length; start += safeBatchSize) {
        const batch = rawChunks.slice(start, start + safeBatchSize);
        const batchEmbeddings = await embedWithRetry(batch, safeBatchSize);
        embeddings.push(...batchEmbeddings);
        onProgress?.(Math.min(start + batch.length, rawChunks.length), rawChunks.length);
      }
    }

    if (embeddings.length !== rawChunks.length) {
      throw new Error('Mismatch between chunk and embedding count');
    }

    const chunks: DocumentChunk[] = rawChunks.map((content, chunkIndex) => {
      return {
        id: `${documentId}-chunk-${chunkIndex}`,
        conversationId,
        documentId,
        chunkIndex,
        content,
        embedding: embeddings[chunkIndex],
        tokenEstimate: VectorService.estimateTokenCount(content),
      };
    });

    const document: UploadedDocument = {
      id: documentId,
      conversationId,
      name: documentName,
      originalName: documentName,
      mimeType,
      sizeBytes,
      uploadedAt: Date.now(),
      chunkCount: chunks.length,
      embeddingModel: skipEmbeddings ? 'inline-context' : embeddingModel,
    };

    return { document, chunks };
  }

  static buildRagSystemPrefix(contextBlock: string): string {
    if (!contextBlock.trim()) {
      return '';
    }
    return `${contextBlock}\n\n`;
  }
}
