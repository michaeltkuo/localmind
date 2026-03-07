import { renderToStaticMarkup } from 'react-dom/server';
import { DocumentUploadButton } from '../DocumentUploadButton';

describe('DocumentUploadButton', () => {
  test('accepts text and binary document file types', () => {
    const html = renderToStaticMarkup(
      <DocumentUploadButton onUpload={() => {}} />
    );

    expect(html).toContain('.txt');
    expect(html).toContain('.md');
    expect(html).toContain('.csv');
    expect(html).toContain('.json');
    expect(html).toContain('.pdf');
    expect(html).toContain('.docx');
  });
});
