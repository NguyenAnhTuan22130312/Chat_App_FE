import React from 'react';
import { EMOJI_LIST } from '../../utils/emojiShortcodes';

interface Props {
  onSelect: (shortcode: string) => void;
  onClose: () => void;
}

export default function EmojiShortcodePicker({ onSelect, onClose }: Props) {
  return (
    <div className="absolute bottom-16 right-0 z-50 bg-white rounded-lg shadow-2xl border border-gray-200 w-80">
      <div className="p-3 border-b flex justify-between items-center bg-gray-50">
        <span className="text-sm font-medium text-gray-700">
          Chọn Emoji ({EMOJI_LIST.length})
        </span>
        <button 
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 text-xl font-bold leading-none"
        >
          ×
        </button>
      </div>

      <div className="p-3 max-h-80 overflow-y-auto">
        <div className="grid grid-cols-8 gap-1">
          {EMOJI_LIST.map(({ code, emoji }) => (
            <button
              key={code}
              onClick={() => {
                onSelect(code);
                onClose();
              }}
              title={code}
              className="text-2xl hover:bg-gray-100 rounded p-2 transition-colors cursor-pointer"
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>

      {/* Footer hint */}
      <div className="p-2 border-t bg-gray-50 text-xs text-gray-500 text-center">
        Hoặc gõ trực tiếp: <code className="bg-gray-200 px-1 rounded">:smile:</code>
      </div>
    </div>
  );
}
