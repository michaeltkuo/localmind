import type { DocumentChunk, RetrievedChunk, UploadedDocument } from '../types';

const EPSILON = 1e-12;

export class VectorService {
  static cosineSimilarity(a: number[], b: number[]): number {
    if (a.length === 0 || b.length === 0 || a.length !== b.length) {
      return 0;
    }

    let dot = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < a.length; i++) {
      dot += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }

    const denom = Math.sqrt(normA) * Math.sqrt(normB);
    if (denom < EPSILON) {
      return 0;
    }

    return dot / denom;
  }

  static searchChunks(
    queryEmbedding: number[],
    chunks: DocumentChunk[],
    topK: number = 5,
    minScore: number = -1
  ): RetrievedChunk[] {
    if (!chunks.length || topK <= 0) {
      return [];
    }

    return chunks
      .map((chunk) => ({
        chunk,
        score: this.cosineSimilarity(queryEmbedding, chunk.embedding),
      }))
      .filter((item) => item.score >= minScore)
      .sort((a, b) => b.score - a.score)
      .slice(0, topK);
  }

  static buildContextBlock(
    retrieved: RetrievedChunk[],
    documents: UploadedDocument[],
    maxTokens: number = 4000
  ): string {
    if (!retrieved.length) {
      return '';
    }

    const docsById = new Map(documents.map((doc) => [doc.id, doc]));
    let budgetUsed = 0;
    const lines: string[] = ['--- DOCUMENT CONTEXT ---'];

    for (const item of retrieved) {
      const chunk = item.chunk;
      const doc = docsById.get(chunk.documentId);
      const chunkTokens = chunk.tokenEstimate || this.estimateTokenCount(chunk.content);

      if (budgetUsed + chunkTokens > maxTokens) {
        continue;
      }

      budgetUsed += chunkTokens;
      lines.push(`[Source: ${doc?.name || 'Unknown'} | Chunk ${chunk.chunkIndex}]`);
      lines.push(chunk.content.trim());
      lines.push('');
    }

    lines.push('--- END DOCUMENT CONTEXT ---');
    lines.push('Answer using the document context when relevant. Cite sources as (filename, chunk N).');

    return lines.join('\n').trim();
  }

  static estimateTokenCount(text: string): number {
    if (!text) {
      return 0;
    }
    return Math.ceil(text.length / 4);
  }
}
