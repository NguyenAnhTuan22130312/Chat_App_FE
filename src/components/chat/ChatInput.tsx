import React from 'react';

export default function ChatInput() {
  return (
    <div className="h-[60px] border-t border-gray-300 flex items-center px-4 bg-white">
      <div className="flex space-x-3 text-gray-500 mr-3">
         <svg className="w-6 h-6 cursor-pointer hover:text-[#0084ff]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
         <svg className="w-6 h-6 cursor-pointer hover:text-[#0084ff]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
      </div>

      <div className="flex-1 relative">
        <input 
          type="text" 
          placeholder="Type a message..." 
          className="w-full bg-gray-100 rounded-full py-2 px-4 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
        />

        <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 cursor-pointer">☺</span>
      </div>

      <div className="ml-3 text-[#0084ff] cursor-pointer">
        <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 20 20"><path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v7.333l-2 2z" /></svg>
      </div>
    </div>
  );
}