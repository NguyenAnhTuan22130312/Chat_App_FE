import React from 'react';
import { EMOJI_LIST } from '../../utils/emojiShortcodes';

interface Props {
  onSelect: (shortcode: string) => void;
  onClose: () => void;
  hideHeader?: boolean;
}

export default function EmojiShortcodePicker({ onSelect, onClose, hideHeader = false }: Props) {
  return (
    <>
      {!hideHeader && (
        <div className="absolute bottom-16 right-0 z-50 bg-white dark:bg-gray-800 rounded-lg shadow-2xl border border-gray-200 dark:border-gray-700 w-80">
          <div className="p-3 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-700">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
              Chọn Emoji
            </span>
            <button 
              onClick={onClose}
              className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 text-xl font-bold leading-none transition-colors"
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
                  className="text-2xl hover:bg-gray-100 dark:hover:bg-gray-700 rounded p-2 transition-colors cursor-pointer"
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          <div className="p-2 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 text-xs text-gray-500 dark:text-gray-400 text-center">
            Hoặc gõ trực tiếp: <code className="bg-gray-200 dark:bg-gray-600 dark:text-gray-200 px-1 rounded">:smile:</code>
          </div>
        </div>
      )}
      
      {hideHeader && (
        <div className="p-3 max-h-96 overflow-y-auto">
          <div className="grid grid-cols-8 gap-1">
            {EMOJI_LIST.map(({ code, emoji }) => (
              <button
                key={code}
                onClick={() => {
                  onSelect(code);
                }}
                title={code}
                className="text-2xl hover:bg-gray-100 dark:hover:bg-gray-700 rounded p-2 transition-colors cursor-pointer"
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
