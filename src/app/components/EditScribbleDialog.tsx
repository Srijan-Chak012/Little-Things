import { useState } from 'react';
import { X } from 'lucide-react';

interface Scribble {
  id: string;
  timestamp: string;
  imageData: string;
  emoji: string[];
  tags: string[];
  description: string;
  name?: string;
}

interface EditScribbleDialogProps {
  scribble: Scribble;
  onSave: (updatedScribble: Scribble) => void;
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

export function EditScribbleDialog({ scribble, onSave, onCancel }: EditScribbleDialogProps) {
  const [name, setName] = useState(scribble.name || '');
  const [selectedEmojis, setSelectedEmojis] = useState<string[]>(
    Array.isArray(scribble.emoji) ? scribble.emoji : scribble.emoji ? [scribble.emoji] : []
  );
  const [tags, setTags] = useState(scribble.tags.join(', '));
  const [description, setDescription] = useState(scribble.description || '');

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
    
    onSave({
      ...scribble,
      name,
      emoji: selectedEmojis,
      tags: tagArray,
      description,
    });
  };

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', { 
      month: 'long', 
      day: 'numeric', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100] p-4">
      <div className="bg-white w-[350px] max-h-[780px] rounded-2xl overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800">Edit Scribble</h2>
          <button
            onClick={onCancel}
            className="w-8 h-8 flex items-center justify-center text-gray-500 hover:bg-gray-100 rounded-full transition-all"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-140px)] p-4">
          {/* Image Preview */}
          <div className="mb-4 flex justify-center">
            <img
              src={scribble.imageData}
              alt="Scribble preview"
              className="max-w-full max-h-48 object-contain rounded-lg border border-gray-200"
            />
          </div>

          {/* Timestamp */}
          <div className="mb-4 text-center">
            <span className="text-sm text-gray-500">
              Created: {formatDate(scribble.timestamp)}
            </span>
          </div>

          {/* Name Input */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Name (Optional)
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Give your scribble a name"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
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
          <div className="mb-4">
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
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 p-4 border-t border-gray-200">
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
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}