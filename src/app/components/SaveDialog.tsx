import { useState } from 'react';
import { X } from 'lucide-react';

interface SaveDialogProps {
  onSave: (emojis: string[], tags: string[], description: string) => void;
  onCancel: () => void;
}

const EMOJI_OPTIONS = [
  // Positive
  { emoji: '😊', label: 'Joy' },
  { emoji: '🤩', label: 'Inspired' },
  { emoji: '😎', label: 'Cool' },
  { emoji: '😤', label: 'Proud' },
  { emoji: '🥹', label: 'Grateful' },
  // Other
  { emoji: '🤔', label: 'Thoughtful' },
  { emoji: '😢', label: 'Sadness' },
  { emoji: '😡', label: 'Anger' },
  { emoji: '🤢', label: 'Disgust' },
  { emoji: '😰', label: 'Anxiety' },
];

export function SaveDialog({ onSave, onCancel }: SaveDialogProps) {
  const [selectedEmojis, setSelectedEmojis] = useState<string[]>([]);
  const [tags, setTags] = useState('');
  const [description, setDescription] = useState('');

  const toggleEmoji = (emoji: string) => {
    setSelectedEmojis(prev =>
      prev.includes(emoji) ? prev.filter(e => e !== emoji) : [...prev, emoji]
    );
  };

  const handleSave = () => {
    const tagArray = tags
      .split(',')
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0);
    
    onSave(selectedEmojis, tagArray, description);
  };

  return (
    <div className="absolute inset-0 bg-black bg-opacity-50 flex items-end z-50">
      <div className="bg-white w-full rounded-t-3xl p-6 pb-8 animate-slide-up">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-800">Save Your Scribble</h2>
          <button
            onClick={onCancel}
            className="w-8 h-8 flex items-center justify-center text-gray-500 hover:bg-gray-100 rounded-full transition-all"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Emoji Selection */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            How are you feeling? (Select all that apply)
          </label>
          <div className="grid grid-cols-5 gap-2">
            {EMOJI_OPTIONS.map(({ emoji, label }) => (
              <button
                key={emoji}
                onClick={() => toggleEmoji(emoji)}
                className={`flex flex-col items-center gap-1 p-3 rounded-lg transition-all ${
                  selectedEmojis.includes(emoji)
                    ? 'bg-blue-100 ring-2 ring-blue-500'
                    : 'bg-gray-50 hover:bg-gray-100'
                }`}
              >
                <span className="text-2xl">{emoji}</span>
                <span className="text-xs text-gray-600">{label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Tags Input */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Tags (Optional)
          </label>
          <input
            type="text"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="e.g., doodle, nature, abstract (comma-separated)"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Description Input */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Description (Optional)
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What's this scribble about?"
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-3 px-4 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 active:scale-95 transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex-1 py-3 px-4 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 active:scale-95 transition-all"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}