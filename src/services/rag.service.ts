import type { DocumentChunk, RetrievedChunk, UploadedDocument } from '../types';
import { OllamaService } from './ollama.service';
import { DocumentService } from './document.service';
import { VectorService } from './vector.service';

interface BuildRagContextOptions {
  enabled?: boolean;
  embeddingModel: string;
  topK?: number;
  maxContextTokens?: number;
  documents: UploadedDocument[];
  chunks: DocumentChunk[];
}

export class RagService {
  static async buildSystemPrefixForQuery(
    query: string,
    options: BuildRagContextOptions
  ): Promise<string> {
    const {
      enabled = true,
      embeddingModel,
      topK = 5,
      maxContextTokens = 4000,
      documents,
      chunks,
    } = options;

    if (!enabled || !documents.length || !chunks.length || !query.trim()) {
      return '';
    }

    const inlineChunks = chunks.filter((chunk) => chunk.embedding.length === 0);
    const vectorChunks = chunks.filter((chunk) => chunk.embedding.length > 0);

    const retrieved: RetrievedChunk[] = [];

    if (inlineChunks.length) {
      const inlineRetrieved = inlineChunks
        .sort((a, b) => a.chunkIndex - b.chunkIndex)
        .map((chunk) => ({ chunk, score: 1 }));
      retrieved.push(...inlineRetrieved);
    }

    if (vectorChunks.length) {
      const queryEmbedding = await OllamaService.embedQuery(embeddingModel, query);
      const vectorRetrieved = VectorService.searchChunks(queryEmbedding, vectorChunks, topK, 0);
      retrieved.push(...vectorRetrieved);
    }

    if (!retrieved.length) {
      return '';
    }

    const contextBlock = VectorService.buildContextBlock(retrieved, documents, maxContextTokens);
    return DocumentService.buildRagSystemPrefix(contextBlock);
  }
}
