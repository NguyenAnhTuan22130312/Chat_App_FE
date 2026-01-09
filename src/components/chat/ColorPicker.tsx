import React from 'react';
import { PRESET_COLORS } from '../../constants/colors';

interface Props {
  onSelectColor: (colorHex: string) => void;
  onClose: () => void;
}

export default function ColorPicker({ onSelectColor, onClose }: Props) {
  return (
    <div className="absolute bottom-16 left-0 z-50 bg-white dark:bg-gray-800 rounded-lg shadow-2xl border border-gray-200 dark:border-gray-700 p-3">
      <div className="flex justify-between items-center mb-3">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-200">Chọn Màu Chữ</span>
        <button 
          onClick={onClose}
          className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 text-xl font-bold transition-colors"
        >
          ×
        </button>
      </div>

      <div className="grid grid-cols-5 gap-2">
        {PRESET_COLORS.map(({ name, value, hex }) => (
          <button
            key={hex}
            onClick={() => {
              onSelectColor(hex);
              onClose();
            }}
            title={name}
            className="w-10 h-10 rounded-full border-2 border-white dark:border-gray-600 shadow-md hover:scale-110 transition-transform"
            style={{ backgroundColor: value }}
          />
        ))}
      </div>

      <div className="mt-3 text-xs text-gray-500 dark:text-gray-400 text-center">
        Chọn màu: <code className="bg-gray-200 dark:bg-gray-600 dark:text-gray-200 px-1 rounded">[red]text[/red]</code>
      </div>
    </div>
  );
}
