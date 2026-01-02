import React from 'react';

export default function ChatHeader() {
  return (
    <div className="h-[60px] border-b border-gray-300 flex items-center justify-between px-4 bg-white shadow-sm">
      <div className="flex flex-col items-center w-full">
        <h2 className="text-[17px] font-bold text-gray-900">Sơn Tùng MTP</h2>
        <span className="text-[13px] text-gray-500">Active</span>
      </div>
      <div className="absolute right-4 flex space-x-3 text-[#0084ff]">

         <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>

         <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
      </div>
    </div>
  );
}