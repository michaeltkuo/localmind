import { renderToStaticMarkup } from 'react-dom/server';
import { DocDrawer } from '../DocDrawer';
import { DocDrawerTrigger } from '../DocDrawerTrigger';
import type { UploadedDocument } from '../../../types';

const documents: UploadedDocument[] = [
  {
    id: 'doc-1',
    conversationId: 'conv-1',
    name: 'notes.txt',
    mimeType: 'text/plain',
    sizeBytes: 1234,
    uploadedAt: Date.now(),
    chunkCount: 2,
    embeddingModel: 'bge-m3',
  },
];

describe('DocDrawer', () => {
  test('renders hidden class when closed', () => {
    const html = renderToStaticMarkup(
      <DocDrawer open={false} onClose={() => {}} documents={documents} onRemove={() => {}} onUpload={() => {}} />
    );

    expect(html).toContain('translate-x-full');
  });

  test('renders visible class when open', () => {
    const html = renderToStaticMarkup(
      <DocDrawer open={true} onClose={() => {}} documents={documents} onRemove={() => {}} onUpload={() => {}} />
    );

    expect(html).toContain('translate-x-0');
  });
});

describe('DocDrawerTrigger', () => {
  test('renders document pills', () => {
    const html = renderToStaticMarkup(<DocDrawerTrigger documents={documents} onOpen={() => {}} onRemove={() => {}} />);

    expect(html).toContain('notes.txt');
    expect(html).toContain('Manage docs');
  });
});
