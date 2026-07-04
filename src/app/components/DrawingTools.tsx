import { Trash2, Undo2 } from 'lucide-react';

interface DrawingToolsProps {
  color: string;
  brushSize: number;
  onColorChange: (color: string) => void;
  onBrushSizeChange: (size: number) => void;
  onClear: () => void;
  onUndo: () => void;
  canUndo: boolean;
}

const PRESET_COLORS = [
  '#000000', // Black
  '#EF4444', // Red
  '#3B82F6', // Blue
  '#10B981', // Green
  '#EAB308', // Yellow
];

const BRUSH_SIZES = [
  { size: 3, label: 'S' },
  { size: 6, label: 'M' },
  { size: 10, label: 'L' },
];

export function DrawingTools({
  color,
  brushSize,
  onColorChange,
  onBrushSizeChange,
  onClear,
  onUndo,
  canUndo,
}: DrawingToolsProps) {
  return (
    <div className="bg-white border-t border-gray-200 shadow-lg">
      {/* Color Palette */}
      <div className="px-4 py-3 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600 min-w-[60px]">Color:</span>
          <div className="flex gap-2 flex-wrap">
            {PRESET_COLORS.map((presetColor) => (
              <button
                key={presetColor}
                onClick={() => onColorChange(presetColor)}
                className="w-8 h-8 rounded-full border-2 transition-all active:scale-95"
                style={{
                  backgroundColor: presetColor,
                  borderColor: color === presetColor ? '#3B82F6' : '#E5E7EB',
                  boxShadow: color === presetColor ? '0 0 0 2px rgba(59, 130, 246, 0.2)' : 'none',
                }}
                aria-label={`Select color ${presetColor}`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Brush Size */}
      <div className="px-4 py-3 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600 min-w-[60px]">Size:</span>
          <div className="flex gap-2 flex-wrap">
            {BRUSH_SIZES.map(({ size, label }) => (
              <button
                key={size}
                onClick={() => onBrushSizeChange(size)}
                className={`px-3 py-1.5 rounded text-sm transition-all active:scale-95 ${
                  brushSize === size
                    ? 'bg-blue-500 text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                aria-label={`Brush size ${label}`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="px-4 py-3 flex gap-3">
        <button
          onClick={onUndo}
          disabled={!canUndo}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg transition-all active:scale-95 ${
            canUndo
              ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              : 'bg-gray-50 text-gray-400 cursor-not-allowed'
          }`}
          aria-label="Undo last stroke"
        >
          <Undo2 className="w-5 h-5" />
          <span>Undo</span>
        </button>
        <button
          onClick={onClear}
          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-all active:scale-95"
          aria-label="Clear canvas"
        >
          <Trash2 className="w-5 h-5" />
          <span>Clear</span>
        </button>
      </div>
    </div>
  );
}