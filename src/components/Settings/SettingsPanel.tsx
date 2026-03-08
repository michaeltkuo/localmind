import { useEffect, useState } from 'react';
import type { ChatSettings, OllamaModel, PromptTemplate } from '../../types';
import { supportsTools } from '../../constants/models';
import { debugService } from '../../services/debug.service'; // Phase 3B
import { OllamaService } from '../../services/ollama.service';

interface SettingsPanelProps {
  settings: ChatSettings;
  availableModels: OllamaModel[];
  selectedModel: string;
  promptTemplates?: PromptTemplate[];
  onUpdatePromptTemplate?: (id: string, name: string, content: string) => void;
  onMovePromptTemplate?: (id: string, direction: 'up' | 'down') => void;
  onDeletePromptTemplate?: (id: string) => void;
  onUpdateSettings: (settings: Partial<ChatSettings>) => void;
  onSelectModel: (model: string) => void;
  onRefreshModels?: () => Promise<void>;
  onClose: () => void;
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({
  settings,
  availableModels,
  selectedModel,
  promptTemplates = [],
  onUpdatePromptTemplate,
  onMovePromptTemplate,
  onDeletePromptTemplate,
  onUpdateSettings,
  onSelectModel,
  onRefreshModels,
  onClose,
}) => {
  const [localSettings, setLocalSettings] = useState<ChatSettings>(settings);
  const [showApiKey, setShowApiKey] = useState(false);
  const [showDebugPanel, setShowDebugPanel] = useState(false); // Phase 3B
  const [debugStats, setDebugStats] = useState(debugService.getStats()); // Phase 3B
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);
  const [modelToDownload, setModelToDownload] = useState('');
  const [isDownloadingModel, setIsDownloadingModel] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState<number | null>(null);
  const [modelActionBusyName, setModelActionBusyName] = useState<string | null>(null);
  const [modelActionError, setModelActionError] = useState<string | null>(null);
  const [promptDrafts, setPromptDrafts] = useState<Record<string, { name: string; content: string }>>({});

  useEffect(() => {
    const nextDrafts: Record<string, { name: string; content: string }> = {};
    for (const prompt of promptTemplates) {
      nextDrafts[prompt.id] = {
        name: prompt.name,
        content: prompt.content,
      };
    }
    setPromptDrafts(nextDrafts);
  }, [promptTemplates]);

  const formatModelSize = (sizeBytes?: number): string => {
    if (!sizeBytes || sizeBytes <= 0) {
      return 'Unknown size';
    }

    const gb = sizeBytes / (1024 * 1024 * 1024);
    return `${gb.toFixed(gb < 1 ? 2 : 1)} GB`;
  };

  const handleDownloadModel = async () => {
    const modelName = modelToDownload.trim();
    if (!modelName || isDownloadingModel) {
      return;
    }

    setModelActionError(null);
    setIsDownloadingModel(true);
    setDownloadProgress(0);

    try {
      await OllamaService.pullModel(modelName, (progress) => {
        setDownloadProgress(Math.max(0, Math.min(100, Math.round(progress))));
      });

      await onRefreshModels?.();
      setModelToDownload('');
      setDownloadProgress(100);
    } catch (error) {
      setModelActionError(error instanceof Error ? error.message : 'Failed to download model');
    } finally {
      setIsDownloadingModel(false);
      window.setTimeout(() => setDownloadProgress(null), 500);
    }
  };

  const handleDeleteModel = async (modelName: string) => {
    if (modelActionBusyName) {
      return;
    }

    if (!window.confirm(`Delete model "${modelName}" from local storage?`)) {
      return;
    }

    setModelActionError(null);
    setModelActionBusyName(modelName);

    try {
      await OllamaService.deleteModel(modelName);
      await onRefreshModels?.();

      if (selectedModel === modelName) {
        const fallback = availableModels.find((model) => model.name !== modelName);
        if (fallback) {
          onSelectModel(fallback.name);
        }
      }
    } catch (error) {
      setModelActionError(error instanceof Error ? error.message : 'Failed to delete model');
    } finally {
      setModelActionBusyName(null);
    }
  };

  const handlePromptDraftChange = (id: string, field: 'name' | 'content', value: string) => {
    setPromptDrafts((current) => ({
      ...current,
      [id]: {
        ...(current[id] || { name: '', content: '' }),
        [field]: value,
      },
    }));
  };

  const handlePromptSave = (id: string) => {
    const draft = promptDrafts[id];
    if (!draft || !onUpdatePromptTemplate) {
      return;
    }

    onUpdatePromptTemplate(id, draft.name, draft.content);
  };

  const handleSave = () => {
    onUpdateSettings(localSettings);
    try {
      // Send Brave API key securely to main process and avoid exposing it further
      // @ts-ignore
      if (typeof window !== 'undefined' && window.api?.setBraveApiKey) {
        // @ts-ignore
        window.api.setBraveApiKey(localSettings.braveApiKey || '');
      }
    } catch {}
    onClose();
  };

  const handleReset = () => {
    const defaultSettings: ChatSettings = {
      temperature: 0.7,
      maxTokens: 2048,
      topP: 0.9,
      systemPrompt: '', // Empty string uses the built-in LocalMind prompt
      webSearchEnabled: false,
      autoDetectSearchQueries: true,
      searchMode: 'off',
      debugMode: false,
      maxSearchResults: 8,
      searchTimeout: 10000,
      ragEnabled: true,
      ragTopK: 5,
      ragChunkSize: 3000,
      ragChunkOverlap: 200,
      ragMaxContextTokens: 8000,
    };
    setLocalSettings(defaultSettings);
  };

  const customPromptIds = promptTemplates
    .filter((template) => !template.builtIn)
    .map((template) => template.id);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Settings</h2>
          <button
            onClick={onClose}
            className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
            title="Close"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          <div className="space-y-6">
            {/* Temperature */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Temperature: {localSettings.temperature.toFixed(2)}
              </label>
              <input
                type="range"
                min="0"
                max="2"
                step="0.1"
                value={localSettings.temperature}
                onChange={(e) => setLocalSettings({ ...localSettings, temperature: parseFloat(e.target.value) })}
                className="w-full h-2 bg-gray-200 dark:bg-gray-600 rounded-lg appearance-none cursor-pointer"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Controls randomness. Lower values make output more focused and deterministic. Higher values make it more creative.
              </p>
            </div>

            {/* Max Tokens */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Max Tokens: {localSettings.maxTokens}
              </label>
              <input
                type="range"
                min="128"
                max="8192"
                step="128"
                value={localSettings.maxTokens}
                onChange={(e) => setLocalSettings({ ...localSettings, maxTokens: parseInt(e.target.value) })}
                className="w-full h-2 bg-gray-200 dark:bg-gray-600 rounded-lg appearance-none cursor-pointer"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Maximum length of the generated response. Higher values allow longer responses but take more time.
              </p>
            </div>

            {/* Top P */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Top P: {localSettings.topP.toFixed(2)}
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={localSettings.topP}
                onChange={(e) => setLocalSettings({ ...localSettings, topP: parseFloat(e.target.value) })}
                className="w-full h-2 bg-gray-200 dark:bg-gray-600 rounded-lg appearance-none cursor-pointer"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Controls diversity via nucleus sampling. Lower values make output more focused on likely tokens.
              </p>
            </div>

            {/* System Prompt */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                System Prompt
              </label>
              <textarea
                value={localSettings.systemPrompt}
                onChange={(e) => setLocalSettings({ ...localSettings, systemPrompt: e.target.value })}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="Leave empty to use the built-in LocalMind system prompt."
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Override the default system prompt. Leave blank to use the built-in LocalMind prompt (recommended). Only applies in the standard non-tool mode.
              </p>
            </div>

            {/* Model Selection */}
            <div className="pt-4 border-t border-gray-200 dark:border-gray-600">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">🤖 Model</h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Selected Model
                </label>
                <select
                  value={selectedModel}
                  onChange={(e) => onSelectModel(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {availableModels.map((model) => (
                    <option key={model.name} value={model.name}>
                      {model.name} {supportsTools(model.name) ? '🔧' : ''}
                    </option>
                  ))}
                </select>
                <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                  {supportsTools(selectedModel) ? (
                    <span className="text-green-600 dark:text-green-400">
                      ✓ This model supports tool calling (web search)
                    </span>
                  ) : (
                    <span className="text-yellow-600 dark:text-yellow-400">
                      ⚠️ This model doesn't support tool calling. Web search will be disabled.
                    </span>
                  )}
                </div>
              </div>

              <div className="mt-4 p-3 rounded-lg bg-gray-50 dark:bg-gray-700/40 border border-gray-200 dark:border-gray-600 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-white">Installed Models</h4>
                  <button
                    type="button"
                    onClick={() => onRefreshModels?.()}
                    className="text-xs px-2 py-1 rounded border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    Refresh
                  </button>
                </div>

                <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
                  {availableModels.length === 0 ? (
                    <p className="text-xs text-gray-500 dark:text-gray-400">No models installed.</p>
                  ) : (
                    availableModels.map((model) => (
                      <div
                        key={model.name}
                        className="flex items-center justify-between gap-2 p-2 rounded bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
                      >
                        <div className="min-w-0">
                          <p className="text-sm text-gray-900 dark:text-white truncate">{model.name}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{formatModelSize(model.size)}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleDeleteModel(model.name)}
                          disabled={modelActionBusyName === model.name}
                          className="text-xs px-2 py-1 rounded border border-red-300 dark:border-red-700 text-red-600 dark:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-50"
                        >
                          {modelActionBusyName === model.name ? 'Deleting...' : 'Delete'}
                        </button>
                      </div>
                    ))
                  )}
                </div>

                <div className="pt-2 border-t border-gray-200 dark:border-gray-600 space-y-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Download model by name
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={modelToDownload}
                      onChange={(e) => setModelToDownload(e.target.value)}
                      placeholder="e.g. llama3.2:latest"
                      className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      type="button"
                      onClick={handleDownloadModel}
                      disabled={isDownloadingModel || !modelToDownload.trim()}
                      className="px-3 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg disabled:opacity-50"
                    >
                      {isDownloadingModel ? 'Downloading...' : 'Download'}
                    </button>
                  </div>

                  {downloadProgress !== null && (
                    <div className="space-y-1">
                      <div className="h-2 w-full rounded bg-gray-200 dark:bg-gray-700 overflow-hidden">
                        <div
                          className="h-full bg-blue-600 transition-all"
                          style={{ width: `${downloadProgress}%` }}
                        />
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{downloadProgress}%</p>
                    </div>
                  )}

                  {modelActionError && (
                    <p className="text-xs text-red-600 dark:text-red-400">{modelActionError}</p>
                  )}
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-200 dark:border-gray-600">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">✨ Prompt Library</h3>
              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {promptTemplates.length === 0 ? (
                  <p className="text-sm text-gray-500 dark:text-gray-400">No prompt templates found.</p>
                ) : (
                  promptTemplates.map((prompt) => {
                    const draft = promptDrafts[prompt.id] || { name: prompt.name, content: prompt.content };
                    const customIndex = customPromptIds.indexOf(prompt.id);
                    const canMoveUp = customIndex > 0;
                    const canMoveDown = customIndex >= 0 && customIndex < customPromptIds.length - 1;

                    return (
                      <div
                        key={prompt.id}
                        className="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/40 p-3 space-y-2"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <input
                              type="text"
                              value={draft.name}
                              disabled={prompt.builtIn}
                              onChange={(event) => handlePromptDraftChange(prompt.id, 'name', event.target.value)}
                              className="px-2 py-1 text-sm rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white disabled:opacity-60"
                            />
                            {prompt.builtIn && (
                              <span className="text-[11px] px-2 py-0.5 rounded-full bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-200">
                                Built-in
                              </span>
                            )}
                          </div>
                          {!prompt.builtIn && (
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => onMovePromptTemplate?.(prompt.id, 'up')}
                                disabled={!canMoveUp}
                                className="px-2 py-1 text-xs rounded border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-40"
                              >
                                ↑
                              </button>
                              <button
                                type="button"
                                onClick={() => onMovePromptTemplate?.(prompt.id, 'down')}
                                disabled={!canMoveDown}
                                className="px-2 py-1 text-xs rounded border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-40"
                              >
                                ↓
                              </button>
                            </div>
                          )}
                        </div>

                        <textarea
                          value={draft.content}
                          disabled={prompt.builtIn}
                          onChange={(event) => handlePromptDraftChange(prompt.id, 'content', event.target.value)}
                          rows={3}
                          className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white disabled:opacity-60"
                        />

                        {!prompt.builtIn && (
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => onDeletePromptTemplate?.(prompt.id)}
                              className="px-2.5 py-1.5 text-xs rounded border border-red-300 dark:border-red-700 text-red-600 dark:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20"
                            >
                              Delete
                            </button>
                            <button
                              type="button"
                              onClick={() => handlePromptSave(prompt.id)}
                              className="px-2.5 py-1.5 text-xs rounded bg-blue-600 text-white hover:bg-blue-700"
                            >
                              Save
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => setShowAdvancedSettings((prev) => !prev)}
                className="w-full px-3 py-2 text-sm font-medium rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                {showAdvancedSettings ? 'Hide advanced settings' : 'Show advanced settings'}
              </button>
            </div>

            {/* Web Search Section */}
            <div className={`${showAdvancedSettings ? 'pt-4 border-t border-gray-200 dark:border-gray-600' : 'hidden'}`}>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">🌐 Web Search</h3>
              
              {/* Search Mode Selector */}
              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Web Search Mode
                  </label>
                  <div className="group relative">
                    <svg className="w-4 h-4 text-gray-400 cursor-help" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                    </svg>
                    <div className="invisible group-hover:visible absolute left-6 top-0 w-80 p-3 bg-gray-900 text-white text-xs rounded-lg shadow-lg z-10">
                      <strong>OFF:</strong> No web search. All answers from model's knowledge base. Fastest and most private.<br/><br/>
                      <strong>SMART (Recommended):</strong> Automatically searches only when needed (weather, breaking news, real-time data). Uses intelligent query classification.<br/><br/>
                      <strong>AUTO:</strong> Model decides when to search. May search more frequently than SMART mode.
                    </div>
                  </div>
                </div>
                <select 
                  value={localSettings.searchMode || 'off'}
                  onChange={(e) => {
                    const mode = e.target.value as 'off' | 'smart' | 'auto';
                    setLocalSettings({ 
                      ...localSettings, 
                      searchMode: mode,
                      webSearchEnabled: mode !== 'off' // Sync with legacy webSearchEnabled
                    });
                  }}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="off">🔴 OFF - No web search (fastest, private)</option>
                  <option value="smart">🟡 SMART - Auto-detect when search needed (recommended)</option>
                  <option value="auto">🟢 AUTO - Model decides when to search</option>
                </select>
                <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
                  {(localSettings.searchMode === 'off' || !localSettings.searchMode) && (
                    <div>
                      <p className="font-medium">Web search is disabled.</p>
                      <p>All answers will come from the model's built-in knowledge. This is the fastest and most private option.</p>
                    </div>
                  )}
                  {localSettings.searchMode === 'smart' && (
                    <div>
                      <p className="font-medium">Smart search mode enabled.</p>
                      <p>Automatically searches only for:</p>
                      <ul className="list-disc list-inside ml-2 mt-1">
                        <li>Real-time data (weather, stocks, sports)</li>
                        <li>Very recent events (today, yesterday)</li>
                        <li>Explicit search requests ("search for...", "look up...")</li>
                      </ul>
                      <p className="mt-1">Conceptual questions and creative tasks won't trigger search.</p>
                    </div>
                  )}
                  {localSettings.searchMode === 'auto' && (
                    <div>
                      <p className="font-medium">Automatic search mode enabled.</p>
                      <p>The model decides when web search would be helpful. May search more frequently than SMART mode.</p>
                    </div>
                  )}
                </div>
              </div>

              {localSettings.searchMode && localSettings.searchMode !== 'off' && (
                <>
                  {/* Max Search Results */}
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Max Search Results: {localSettings.maxSearchResults || 8}
                    </label>
                    <input
                      type="range"
                      min="3"
                      max="10"
                      step="1"
                      value={localSettings.maxSearchResults || 8}
                      onChange={(e) => setLocalSettings({ ...localSettings, maxSearchResults: parseInt(e.target.value) })}
                      className="w-full h-2 bg-gray-200 dark:bg-gray-600 rounded-lg appearance-none cursor-pointer"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Number of search results to fetch. More results provide better coverage but use more context tokens.
                    </p>
                  </div>

                  {/* Ollama API Key */}
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Ollama API Key
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type={showApiKey ? 'text' : 'password'}
                        value={localSettings.braveApiKey || ''}
                        onChange={(e) => setLocalSettings({ ...localSettings, braveApiKey: e.target.value })}
                        placeholder="Enter your OLLAMA_API_KEY"
                        className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        autoComplete="off"
                      />
                      <button
                        type="button"
                        onClick={() => setShowApiKey(!showApiKey)}
                        className="px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700"
                      >
                        {showApiKey ? 'Hide' : 'Show'}
                      </button>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Stored securely in the app's main process and used only for calling Ollama Web Search API.
                    </p>
                  </div>

                  <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                    <p className="text-xs text-blue-700 dark:text-blue-300">
                      <strong>Privacy Note:</strong> Web search is performed via Ollama's hosted Web Search API. Your API key is kept in the main process and not stored in conversation history.
                    </p>
                  </div>
                </>
              )}
            </div>

            {/* Document RAG Section */}
            <div className={`${showAdvancedSettings ? 'pt-4 border-t border-gray-200 dark:border-gray-600' : 'hidden'}`}>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">📚 Document Retrieval</h3>

              <div className="space-y-4">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={localSettings.ragEnabled ?? true}
                    onChange={(e) => setLocalSettings({ ...localSettings, ragEnabled: e.target.checked })}
                    className="rounded"
                  />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Enable document retrieval (RAG)
                  </span>
                </label>

                {localSettings.ragEnabled !== false && (
                  <>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Embedding model is managed automatically by LocalMind.
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Retrieved Chunks (Top K): {localSettings.ragTopK || 5}
                      </label>
                      <input
                        type="range"
                        min="1"
                        max="10"
                        step="1"
                        value={localSettings.ragTopK || 5}
                        onChange={(e) => setLocalSettings({ ...localSettings, ragTopK: parseInt(e.target.value) })}
                        className="w-full h-2 bg-gray-200 dark:bg-gray-600 rounded-lg appearance-none cursor-pointer"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Chunk Size: {localSettings.ragChunkSize || 3000}
                      </label>
                      <input
                        type="range"
                        min="500"
                        max="8000"
                        step="100"
                        value={localSettings.ragChunkSize || 3000}
                        onChange={(e) => setLocalSettings({ ...localSettings, ragChunkSize: parseInt(e.target.value) })}
                        className="w-full h-2 bg-gray-200 dark:bg-gray-600 rounded-lg appearance-none cursor-pointer"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Chunk Overlap: {localSettings.ragChunkOverlap || 200}
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="600"
                        step="50"
                        value={localSettings.ragChunkOverlap || 200}
                        onChange={(e) => setLocalSettings({ ...localSettings, ragChunkOverlap: parseInt(e.target.value) })}
                        className="w-full h-2 bg-gray-200 dark:bg-gray-600 rounded-lg appearance-none cursor-pointer"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Max Context Tokens: {localSettings.ragMaxContextTokens || 8000}
                      </label>
                      <input
                        type="range"
                        min="1000"
                        max="32000"
                        step="500"
                        value={localSettings.ragMaxContextTokens || 8000}
                        onChange={(e) => setLocalSettings({ ...localSettings, ragMaxContextTokens: parseInt(e.target.value) })}
                        className="w-full h-2 bg-gray-200 dark:bg-gray-600 rounded-lg appearance-none cursor-pointer"
                      />
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Phase 3B: Debug Panel */}
            <div className={`${showAdvancedSettings ? 'pt-4 border-t border-gray-200 dark:border-gray-600' : 'hidden'}`}>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">🐛 Debug & Logging</h3>
              
              {/* Enable Debug Mode */}
              <div className="space-y-3">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={localSettings.debugMode || false}
                    onChange={(e) => setLocalSettings({ ...localSettings, debugMode: e.target.checked })}
                    className="rounded"
                  />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Enable Debug Logging
                  </span>
                </label>
                <p className="text-xs text-gray-500 dark:text-gray-400 ml-6">
                  Track search queries, results, and performance metrics for troubleshooting.
                </p>
                
                {localSettings.debugMode && (
                  <>
                    {/* Debug Stats */}
                    <div className="ml-6 mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Statistics</h4>
                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div>
                          <div className="text-gray-500 dark:text-gray-400">Total Queries</div>
                          <div className="font-semibold text-gray-900 dark:text-white">{debugStats.totalQueries}</div>
                        </div>
                        <div>
                          <div className="text-gray-500 dark:text-gray-400">Search Queries</div>
                          <div className="font-semibold text-gray-900 dark:text-white">{debugStats.searchQueries}</div>
                        </div>
                        <div>
                          <div className="text-gray-500 dark:text-gray-400">Successful</div>
                          <div className="font-semibold text-green-600 dark:text-green-400">{debugStats.successfulSearches}</div>
                        </div>
                        <div>
                          <div className="text-gray-500 dark:text-gray-400">Failed</div>
                          <div className="font-semibold text-red-600 dark:text-red-400">{debugStats.failedSearches}</div>
                        </div>
                        <div>
                          <div className="text-gray-500 dark:text-gray-400">Avg Search Time</div>
                          <div className="font-semibold text-gray-900 dark:text-white">{debugStats.averageSearchDuration}ms</div>
                        </div>
                        <div>
                          <div className="text-gray-500 dark:text-gray-400">Avg Response Time</div>
                          <div className="font-semibold text-gray-900 dark:text-white">{debugStats.averageResponseDuration}ms</div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Debug Panel Toggle */}
                    <div className="ml-6 mt-3">
                      <button
                        onClick={() => {
                          setShowDebugPanel(!showDebugPanel);
                          setDebugStats(debugService.getStats());
                        }}
                        className="w-full px-3 py-2 text-sm text-blue-600 dark:text-blue-400 border border-blue-300 dark:border-blue-700 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                      >
                        {showDebugPanel ? 'Hide' : 'Show'} Debug Logs ({debugService.getLogs().length})
                      </button>
                    </div>
                    
                    {/* Debug Logs Panel */}
                    {showDebugPanel && (
                      <div className="ml-6 mt-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg max-h-96 overflow-y-auto">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="text-sm font-semibold text-gray-900 dark:text-white">Recent Logs</h4>
                          <div className="flex gap-2">
                            <button
                              onClick={() => {
                                const json = debugService.exportLogs();
                                const blob = new Blob([json], { type: 'application/json' });
                                const url = URL.createObjectURL(blob);
                                const a = document.createElement('a');
                                a.href = url;
                                a.download = `localmind-debug-${Date.now()}.json`;
                                a.click();
                                URL.revokeObjectURL(url);
                              }}
                              className="px-2 py-1 text-xs text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                              title="Export as JSON"
                            >
                              JSON ↓
                            </button>
                            <button
                              onClick={() => {
                                const csv = debugService.exportLogsCSV();
                                const blob = new Blob([csv], { type: 'text/csv' });
                                const url = URL.createObjectURL(blob);
                                const a = document.createElement('a');
                                a.href = url;
                                a.download = `localmind-debug-${Date.now()}.csv`;
                                a.click();
                                URL.revokeObjectURL(url);
                              }}
                              className="px-2 py-1 text-xs text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                              title="Export as CSV"
                            >
                              CSV ↓
                            </button>
                            <button
                              onClick={() => {
                                if (window.confirm('Clear all debug logs? This cannot be undone.')) {
                                  debugService.clearLogs();
                                  setDebugStats(debugService.getStats());
                                }
                              }}
                              className="px-2 py-1 text-xs text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
                            >
                              Clear
                            </button>
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          {debugService.getLogs().slice(0, 20).map((log) => (
                            <div
                              key={log.id}
                              className="p-3 bg-white dark:bg-gray-900 rounded border border-gray-200 dark:border-gray-700 text-xs"
                            >
                              <div className="flex items-start justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <span className="text-gray-500 dark:text-gray-400">
                                    {new Date(log.timestamp).toLocaleTimeString()}
                                  </span>
                                  {log.searchTriggered && (
                                    <span className="px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded text-[10px]">
                                      SEARCH
                                    </span>
                                  )}
                                  {log.error && (
                                    <span className="px-1.5 py-0.5 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 rounded text-[10px]">
                                      ERROR
                                    </span>
                                  )}
                                </div>
                                <span className="text-gray-400 dark:text-gray-600">
                                  {log.totalDuration}ms
                                </span>
                              </div>
                              
                              <div className="text-gray-900 dark:text-gray-100 mb-1">
                                <strong>Q:</strong> {log.query}
                              </div>
                              
                              {log.searchQuery && log.searchQuery !== log.query && (
                                <div className="text-gray-600 dark:text-gray-400 mb-1">
                                  <strong>Search:</strong> {log.searchQuery}
                                </div>
                              )}
                              
                              {log.searchResultCount !== undefined && (
                                <div className="text-gray-600 dark:text-gray-400">
                                  <strong>Results:</strong> {log.searchResultCount} sources ({log.searchDuration}ms)
                                </div>
                              )}
                              
                              {log.citationsUsed && log.citationsUsed.length > 0 && (
                                <div className="text-gray-600 dark:text-gray-400">
                                  <strong>Citations:</strong> [{log.citationsUsed.join(', ')}]
                                </div>
                              )}
                              
                              {log.error && (
                                <div className="text-red-600 dark:text-red-400 mt-2">
                                  <strong>Error:</strong> {log.error}
                                </div>
                              )}
                            </div>
                          ))}
                          
                          {debugService.getLogs().length === 0 && (
                            <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                              No logs yet. Send some messages to see debug logs here.
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 dark:bg-gray-700 border-t border-gray-200 dark:border-gray-600 px-6 py-4 flex items-center justify-between">
          <button
            onClick={handleReset}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            Reset to Defaults
          </button>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white border border-gray-300 dark:border-gray-600 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
            >
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
