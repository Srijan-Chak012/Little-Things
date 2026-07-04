import { useState, useEffect } from 'react';
import { X } from 'lucide-react';

interface Settings {
  notificationHours: number;
  notificationMinutes: number;
  showEmoji: boolean;
  showTags: boolean;
}

interface SettingsDialogProps {
  onClose: () => void;
}

export function SettingsDialog({ onClose }: SettingsDialogProps) {
  const [settings, setSettings] = useState<Settings>({
    notificationHours: 0,
    notificationMinutes: 30,
    showEmoji: true,
    showTags: true,
  });

  useEffect(() => {
    // Load settings from localStorage
    const saved = localStorage.getItem('appSettings');
    if (saved) {
      setSettings(JSON.parse(saved));
    }
  }, []);

  const saveSettings = () => {
    localStorage.setItem('appSettings', JSON.stringify(settings));
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100] p-4">
      <div className="bg-white w-[350px] rounded-2xl overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="bg-blue-500 text-white px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold">Settings</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center hover:bg-blue-600 rounded-full transition-all active:scale-95"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Notification Time */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Notification Time (after scribble)
            </label>
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <label className="block text-xs text-gray-500 mb-1">Hours</label>
                <input
                  type="number"
                  min="0"
                  max="23"
                  value={settings.notificationHours}
                  onChange={(e) => setSettings({
                    ...settings,
                    notificationHours: Math.max(0, Math.min(23, parseInt(e.target.value) || 0))
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <span className="text-gray-400 mt-6">:</span>
              <div className="flex-1">
                <label className="block text-xs text-gray-500 mb-1">Minutes</label>
                <input
                  type="number"
                  min="0"
                  max="59"
                  value={settings.notificationMinutes}
                  onChange={(e) => setSettings({
                    ...settings,
                    notificationMinutes: Math.max(0, Math.min(59, parseInt(e.target.value) || 0))
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Show Emoji Toggle */}
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-gray-700">
              Show Emoji
            </label>
            <button
              onClick={() => setSettings({ ...settings, showEmoji: !settings.showEmoji })}
              className={`relative w-14 h-8 rounded-full transition-colors ${
                settings.showEmoji ? 'bg-blue-500' : 'bg-gray-300'
              }`}
              aria-label="Toggle show emoji"
            >
              <span
                className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full shadow-md transition-transform ${
                  settings.showEmoji ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Show Tags Toggle */}
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-gray-700">
              Show Tags
            </label>
            <button
              onClick={() => setSettings({ ...settings, showTags: !settings.showTags })}
              className={`relative w-14 h-8 rounded-full transition-colors ${
                settings.showTags ? 'bg-blue-500' : 'bg-gray-300'
              }`}
              aria-label="Toggle show tags"
            >
              <span
                className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full shadow-md transition-transform ${
                  settings.showTags ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 pt-0 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-all active:scale-95"
          >
            Cancel
          </button>
          <button
            onClick={saveSettings}
            className="flex-1 px-4 py-3 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 transition-all active:scale-95"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
