import { DocumentService } from '../document.service';
import { OllamaService } from '../ollama.service';

jest.mock('../ollama.service', () => ({
  OllamaService: {
    embed: jest.fn(),
  },
}));

describe('DocumentService', () => {
  const originalApi = window.api;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    window.api = originalApi;
  });

  test('chunkText returns overlapping chunks', () => {
    const input = 'A'.repeat(2200) + '\n\n' + 'B'.repeat(2200);
    const chunks = DocumentService.chunkText(input, { chunkSize: 2000, overlap: 200 });

    expect(chunks.length).toBeGreaterThan(2);
    expect(chunks[0].length).toBeLessThanOrEqual(2000);
    expect(chunks[1].length).toBeGreaterThan(0);
  });

  test('chunkText throws when overlap >= chunkSize', () => {
    expect(() => DocumentService.chunkText('hello world', { chunkSize: 200, overlap: 200 })).toThrow(
      'Chunk overlap must be smaller than chunk size'
    );
  });

  test('indexTextDocument builds doc and chunk metadata', async () => {
    const mockedEmbed = OllamaService.embed as jest.Mock;
    mockedEmbed.mockResolvedValue([
      [0.1, 0.2, 0.3],
      [0.4, 0.5, 0.6],
    ]);

    const text = 'A'.repeat(1000) + '\n\n' + 'B'.repeat(1000);

    const progressSpy = jest.fn();
    const result = await DocumentService.indexTextDocument({
      conversationId: 'conv-1',
      documentName: 'notes.txt',
      mimeType: 'text/plain',
      sizeBytes: 2048,
      text,
      embeddingModel: 'embeddinggemma',
      chunkSize: 1200,
      overlap: 100,
      onProgress: progressSpy,
    });

    expect(result.document.conversationId).toBe('conv-1');
    expect(result.document.name).toBe('notes.txt');
    expect(result.document.chunkCount).toBe(2);

    expect(result.chunks).toHaveLength(2);
    expect(result.chunks[0].documentId).toBe(result.document.id);
    expect(result.chunks[1].chunkIndex).toBe(1);
    expect(progressSpy).toHaveBeenCalled();
    expect(progressSpy).toHaveBeenLastCalledWith(2, 2);
    expect(mockedEmbed).toHaveBeenCalledWith('embeddinggemma', expect.any(Array));
  });

  test('indexTextDocument skipEmbeddings bypasses embedding call for small docs', async () => {
    const mockedEmbed = OllamaService.embed as jest.Mock;

    const result = await DocumentService.indexTextDocument({
      conversationId: 'conv-1',
      documentName: 'small.txt',
      mimeType: 'text/plain',
      sizeBytes: 64,
      text: 'small document',
      embeddingModel: 'embeddinggemma',
      skipEmbeddings: true,
    });

    expect(mockedEmbed).not.toHaveBeenCalled();
    expect(result.document.embeddingModel).toBe('inline-context');
    expect(result.chunks.every((chunk) => chunk.embedding.length === 0)).toBe(true);
  });

  test('indexTextDocument throws when no text is indexable', async () => {
    await expect(
      DocumentService.indexTextDocument({
        conversationId: 'conv-1',
        documentName: 'empty.txt',
        mimeType: 'text/plain',
        sizeBytes: 0,
        text: '   ',
        embeddingModel: 'embeddinggemma',
      })
    ).rejects.toThrow('No indexable text found in document');
  });

  test('isSupportedFile accepts declared extensions', () => {
    const txt = { name: 'notes.txt', type: 'text/plain' } as File;
    const pdf = { name: 'policy.pdf', type: 'application/pdf' } as File;
    const docx = {
      name: 'spec.docx',
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    } as File;
    const exe = { name: 'danger.exe', type: 'application/octet-stream' } as File;

    expect(DocumentService.isSupportedFile(txt)).toBe(true);
    expect(DocumentService.isSupportedFile(pdf)).toBe(true);
    expect(DocumentService.isSupportedFile(docx)).toBe(true);
    expect(DocumentService.isSupportedFile(exe)).toBe(false);
  });

  test('extractTextFromFile uses file.text for text formats', async () => {
    const file = {
      name: 'hello.txt',
      type: 'text/plain',
      text: jest.fn().mockResolvedValue('hello world'),
    } as unknown as File;

    await expect(DocumentService.extractTextFromFile(file)).resolves.toBe('hello world');
    expect(file.text).toHaveBeenCalled();
  });

  test('extractTextFromFile uses Electron extraction for PDF', async () => {
    window.api = {
      ...(window.api || {}),
      extractTextFromDocument: jest.fn().mockResolvedValue({ success: true, text: 'Parsed PDF Text' }),
    } as any;

    const file = {
      name: 'guide.pdf',
      type: 'application/pdf',
      arrayBuffer: jest.fn().mockResolvedValue(new Uint8Array([1, 2, 3]).buffer),
    } as unknown as File;

    const text = await DocumentService.extractTextFromFile(file);

    expect(text).toBe('Parsed PDF Text');
    expect(file.arrayBuffer).toHaveBeenCalled();
    expect((window.api as any).extractTextFromDocument).toHaveBeenCalledWith(
      expect.objectContaining({ fileName: 'guide.pdf' })
    );
  });
});
