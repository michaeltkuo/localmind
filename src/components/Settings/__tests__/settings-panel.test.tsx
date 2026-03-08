import { renderToStaticMarkup } from 'react-dom/server';
import { SettingsPanel } from '../SettingsPanel';
import type { ChatSettings } from '../../../types';

describe('SettingsPanel', () => {
  test('renders document retrieval controls', () => {
    const settings: ChatSettings = {
      temperature: 0.7,
      maxTokens: 2048,
      topP: 0.9,
      systemPrompt: '',
      webSearchEnabled: false,
      autoDetectSearchQueries: true,
      searchMode: 'off',
      debugMode: false,
      maxSearchResults: 8,
      searchTimeout: 10000,
      ragEnabled: true,
      embeddingModel: 'embeddinggemma',
      ragTopK: 5,
      ragChunkSize: 2000,
      ragChunkOverlap: 200,
      ragMaxContextTokens: 4000,
    };

    const html = renderToStaticMarkup(
      <SettingsPanel
        settings={settings}
        availableModels={[]}
        selectedModel="llama3.2:latest"
        onUpdateSettings={() => {}}
        onSelectModel={() => {}}
        onClose={() => {}}
      />
    );

    expect(html).toContain('Document Retrieval');
    expect(html).toContain('Prompt Library');
    expect(html).toContain('Embedding model is managed automatically by LocalMind.');
    expect(html).toContain('Retrieved Chunks');
    expect(html).toContain('Chunk Size');
    expect(html).toContain('Chunk Overlap');
    expect(html).toContain('Max Context Tokens');
    expect(html).toContain('Show advanced settings');
  });
});
