import React from 'react';

const PRESET_COLORS = [
  { name: 'Đỏ', value: '#FF0000', hex: 'red' },
  { name: 'Xanh dương', value: '#0084FF', hex: 'blue' },
  { name: 'Xanh lá', value: '#00C851', hex: 'green' },
  { name: 'Vàng', value: '#FFD700', hex: 'yellow' },
  { name: 'Tím', value: '#9C27B0', hex: 'purple' },
  { name: 'Cam', value: '#FF9800', hex: 'orange' },
  { name: 'Hồng', value: '#E91E63', hex: 'pink' },
  { name: 'Nâu', value: '#795548', hex: 'brown' },
  { name: 'Xám', value: '#9E9E9E', hex: 'gray' },
  { name: 'Đen', value: '#000000', hex: 'black' },
];

interface Props {
  onSelectColor: (colorHex: string) => void;
  onClose: () => void;
}

export default function ColorPicker({ onSelectColor, onClose }: Props) {
  return (
    <div className="absolute bottom-16 left-0 z-50 bg-white rounded-lg shadow-2xl border border-gray-200 p-3">
      <div className="flex justify-between items-center mb-3">
        <span className="text-sm font-medium text-gray-700">Chọn Màu Chữ</span>
        <button 
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 text-xl font-bold"
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
            className="w-10 h-10 rounded-full border-2 border-white shadow-md hover:scale-110 transition-transform"
            style={{ backgroundColor: value }}
          />
        ))}
      </div>

      <div className="mt-3 text-xs text-gray-500 text-center">
        Chọn màu: <code className="bg-gray-200 px-1 rounded">[red]text[/red]</code>
      </div>
    </div>
  );
}
