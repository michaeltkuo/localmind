import { useState } from 'react';
import type { ChatSettings } from '../../types';

interface SettingsPanelProps {
  settings: ChatSettings;
  onUpdateSettings: (settings: Partial<ChatSettings>) => void;
  onClose: () => void;
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({
  settings,
  onUpdateSettings,
  onClose,
}) => {
  const [localSettings, setLocalSettings] = useState<ChatSettings>(settings);

  const handleSave = () => {
    onUpdateSettings(localSettings);
    onClose();
  };

  const handleReset = () => {
    const defaultSettings: ChatSettings = {
      temperature: 0.7,
      maxTokens: 2048,
      topP: 0.9,
      systemPrompt: 'You are a helpful AI assistant.',
    };
    setLocalSettings(defaultSettings);
  };

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
                placeholder="You are a helpful AI assistant."
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Sets the behavior and personality of the AI assistant. This is sent with every conversation.
              </p>
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
