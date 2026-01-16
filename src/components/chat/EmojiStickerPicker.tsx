import React, { useState } from 'react';
import EmojiShortcodePicker from './EmojiShortcodePicker';
import GifPicker from './GifPicker';

interface EmojiStickerPickerProps {
  onEmojiSelect: (shortcode: string) => void;
  onGifSelect: (gifUrl: string) => void;
  onClose: () => void;
}

type TabType = 'sticker' | 'emoji';

export default function EmojiStickerPicker({ onEmojiSelect, onGifSelect, onClose }: EmojiStickerPickerProps) {
  const [activeTab, setActiveTab] = useState<TabType>('emoji');

  return (
    <div className="absolute bottom-16 right-0 z-50 bg-white dark:bg-gray-800 rounded-lg shadow-2xl border border-gray-200 dark:border-gray-700 w-96">
      <div className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700">
        <div className="flex items-center justify-between px-3 pt-3 pb-2">
          <div className="flex-1 flex">
            <button
              onClick={() => setActiveTab('sticker')}
              className={`flex-1 py-2 text-sm font-medium transition-colors ${
                activeTab === 'sticker'
                  ? 'text-blue-500 dark:text-blue-400 border-b-2 border-blue-500 dark:border-blue-400'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              STICKER
            </button>
            <button
              onClick={() => setActiveTab('emoji')}
              className={`flex-1 py-2 text-sm font-medium transition-colors ${
                activeTab === 'emoji'
                  ? 'text-blue-500 dark:text-blue-400 border-b-2 border-blue-500 dark:border-blue-400'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              EMOJI
            </button>
          </div>
          <button 
            onClick={onClose}
            className="ml-3 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 text-xl font-bold leading-none transition-colors"
          >
            ×
          </button>
        </div>
      </div>

      <div>
        {activeTab === 'sticker' ? (
          <GifPicker onSelect={onGifSelect} onClose={onClose} hideHeader />
        ) : (
          <EmojiShortcodePicker onSelect={onEmojiSelect} onClose={onClose} hideHeader />
        )}
      </div>
    </div>
  );
}
