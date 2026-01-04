import React from 'react';
import { socketService } from '../../services/socketService';

interface ConnectionErrorScreenProps {
  errorMessage?: string;
}

const ConnectionErrorScreen: React.FC<ConnectionErrorScreenProps> = ({ 
  errorMessage = 'Không thể kết nối đến máy chủ' 
}) => {
  const handleRetry = () => {
    socketService.reconnect();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-red-50 via-white to-orange-50">
      <div className="text-center max-w-md px-6">
        {/* Error Icon */}
        <div className="relative w-24 h-24 mx-auto mb-8">
          <div className="absolute inset-0 bg-red-100 rounded-full flex items-center justify-center">
            <svg 
              className="w-12 h-12 text-red-500" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
              />
            </svg>
          </div>
          {/* Pulse effect */}
          <div className="absolute inset-0 bg-red-200 rounded-full animate-ping opacity-20"></div>
        </div>

        {/* Error Title */}
        <h2 className="text-2xl font-semibold text-gray-800 mb-3">
          Lỗi Kết Nối
        </h2>
        
        {/* Error Message */}
        <p className="text-base text-gray-600 mb-8">
          {errorMessage}
        </p>

        {/* Retry Button */}
        <button
          onClick={handleRetry}
          className="px-8 py-3 bg-primary hover:bg-primary-light text-white font-semibold rounded-lg transition-all duration-300 shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0"
        >
          <span className="flex items-center gap-2">
            <svg 
              className="w-5 h-5" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" 
              />
            </svg>
            Thử lại
          </span>
        </button>

        {/* Help Text */}
        <p className="text-sm text-gray-500 mt-6">
          Vui lòng kiểm tra kết nối mạng của bạn
        </p>
      </div>
    </div>
  );
};

export default ConnectionErrorScreen;
