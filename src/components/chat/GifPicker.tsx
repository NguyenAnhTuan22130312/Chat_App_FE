import React, { useState, useEffect } from 'react';
import { searchGifs, getTrendingGifs, GiphyGif } from '../../services/giphyService';

interface GifPickerProps {
  onSelect: (gifUrl: string) => void;
  onClose: () => void;
  hideHeader?: boolean;
}

export default function GifPicker({ onSelect, onClose, hideHeader = false }: GifPickerProps) {
  const [gifs, setGifs] = useState<GiphyGif[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadTrendingGifs();
  }, []);

  const loadTrendingGifs = async () => {
    setLoading(true);
    setError(null);
    try {
      const trendingGifs = await getTrendingGifs(30);
      setGifs(trendingGifs);
    } catch (err) {
      setError('Không thể tải GIF. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    
    if (!query.trim()) {
      loadTrendingGifs();
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const results = await searchGifs(query, 30);
      setGifs(results);
    } catch (err) {
      setError('Không thể tìm kiếm GIF. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const handleGifClick = (gif: GiphyGif) => {
    const gifUrl = gif.images.downsized.url;
    onSelect(gifUrl);
    if (!hideHeader) {
      onClose();
    }
  };

  const gifGridContent = (
    <>
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="flex flex-col items-center">
            <svg className="animate-spin h-8 w-8 text-blue-500 dark:text-blue-400 mb-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span className="text-sm text-gray-500 dark:text-gray-400">Đang tải GIF...</span>
          </div>
        </div>
      ) : error ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <p className="text-sm text-red-500 dark:text-red-400 mb-2">{error}</p>
            <button
              onClick={loadTrendingGifs}
              className="text-sm text-blue-500 dark:text-blue-400 hover:underline"
            >
              Thử lại
            </button>
          </div>
        </div>
      ) : gifs.length === 0 ? (
        <div className="flex items-center justify-center py-12">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Không tìm thấy GIF nào
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-2">
          {gifs.map((gif) => (
            <button
              key={gif.id}
              onClick={() => handleGifClick(gif)}
              className="relative aspect-square overflow-hidden rounded-lg hover:opacity-80 transition-opacity cursor-pointer
                bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600"
              title={gif.title}
            >
              <img
                src={gif.images.fixed_height.url}
                alt={gif.title}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </button>
          ))}
        </div>
      )}
    </>
  );

  if (hideHeader) {
    return (
      <>
        <div className="p-3 border-b border-gray-200 dark:border-gray-700">
          <input
            type="text"
            placeholder="Tìm kiếm GIF..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-600 rounded-lg
              text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400
              focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
          />
        </div>
        <div className="p-3 max-h-96 overflow-y-auto">
          {gifGridContent}
        </div>
      </>
    );
  }

  return (
    <div className="absolute bottom-16 right-0 z-50 bg-white dark:bg-gray-800 rounded-lg shadow-2xl border border-gray-200 dark:border-gray-700 w-96">
      {/* Header */}
      <div className="p-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
            Chọn GIF
          </span>
          <button 
            onClick={onClose}
            className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 text-xl font-bold leading-none transition-colors"
          >
            ×
          </button>
        </div>
        
        {/* Search Input */}
        <input
          type="text"
          placeholder="Tìm kiếm GIF..."
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
          className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-600 rounded-lg
            text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400
            focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
        />
      </div>

      {/* GIF Grid */}
      <div className="p-3 max-h-96 overflow-y-auto">
        {gifGridContent}
      </div>

      {/* Footer */}
      <div className="p-2 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 text-xs text-gray-500 dark:text-gray-400 text-center">
        Powered by{' '}
        <a 
          href="https://giphy.com" 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-blue-500 dark:text-blue-400 hover:underline"
        >
          GIPHY
        </a>
      </div>
    </div>
  );
}
