import { renderToStaticMarkup } from 'react-dom/server';
import { DocumentBadge } from '../DocumentBadge';
import { DocumentPanel } from '../DocumentPanel';
import { IndexingProgress } from '../IndexingProgress';
import type { UploadedDocument } from '../../../types';

describe('Document UI components', () => {
  const doc: UploadedDocument = {
    id: 'doc-1',
    conversationId: 'conv-1',
    name: 'roadmap.md',
    mimeType: 'text/markdown',
    sizeBytes: 2048,
    uploadedAt: Date.now(),
    chunkCount: 3,
    embeddingModel: 'embeddinggemma',
  };

  test('DocumentBadge renders filename', () => {
    const html = renderToStaticMarkup(
      <DocumentBadge document={doc} onRemove={() => {}} />
    );

    expect(html).toContain('roadmap.md');
    expect(html).toContain('Remove');
  });

  test('DocumentPanel shows empty state', () => {
    const html = renderToStaticMarkup(
      <DocumentPanel documents={[]} onRemoveDocument={() => {}} />
    );

    expect(html).toContain('No indexed documents');
  });

  test('DocumentPanel renders document metadata', () => {
    const html = renderToStaticMarkup(
      <DocumentPanel documents={[doc]} onRemoveDocument={() => {}} />
    );

    expect(html).toContain('roadmap.md');
    expect(html).toContain('3 chunks');
  });

  test('IndexingProgress renders counters', () => {
    const html = renderToStaticMarkup(
      <IndexingProgress current={2} total={5} />
    );

    expect(html).toContain('Indexing 2/5 chunks');
  });
});
