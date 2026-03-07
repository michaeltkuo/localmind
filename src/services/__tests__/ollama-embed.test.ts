import { OllamaService } from '../ollama.service';

describe('OllamaService embed', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  test('embed returns embeddings from /api/embed', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ embeddings: [[0.1, 0.2], [0.3, 0.4]] }),
    } as Response);

    const result = await OllamaService.embed('embeddinggemma', ['a', 'b']);

    expect(result).toHaveLength(2);
    expect(result[0]).toEqual([0.1, 0.2]);
    expect(global.fetch).toHaveBeenCalledWith(
      'http://localhost:11434/api/embed',
      expect.objectContaining({
        method: 'POST',
      })
    );
  });

  test('embedQuery returns first embedding for single input', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ embedding: [0.9, 0.8, 0.7] }),
    } as Response);

    const result = await OllamaService.embedQuery('embeddinggemma', 'hello');
    expect(result).toEqual([0.9, 0.8, 0.7]);
  });

  test('embed throws with non-ok response', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 500,
      text: async () => 'Internal error',
    } as Response);

    await expect(OllamaService.embed('embeddinggemma', 'hello')).rejects.toThrow(
      'Failed to generate embeddings: HTTP 500 Internal error'
    );
  });

  test('ensureModelAvailable does not pull when model is already installed', async () => {
    const listSpy = jest.spyOn(OllamaService, 'listModels').mockResolvedValue([
      {
        name: 'embeddinggemma:latest',
        modified_at: '',
        size: 0,
        digest: '',
      },
    ]);
    const pullSpy = jest.spyOn(OllamaService, 'pullModel').mockResolvedValue();

    await OllamaService.ensureModelAvailable('embeddinggemma:latest');

    expect(listSpy).toHaveBeenCalled();
    expect(pullSpy).not.toHaveBeenCalled();
  });

  test('ensureModelAvailable pulls model when missing', async () => {
    jest.spyOn(OllamaService, 'listModels').mockResolvedValue([
      {
        name: 'llama3.2:latest',
        modified_at: '',
        size: 0,
        digest: '',
      },
    ]);
    const pullSpy = jest.spyOn(OllamaService, 'pullModel').mockResolvedValue();

    await OllamaService.ensureModelAvailable('embeddinggemma:latest');

    expect(pullSpy).toHaveBeenCalledWith('embeddinggemma:latest', expect.any(Function));
  });
});
