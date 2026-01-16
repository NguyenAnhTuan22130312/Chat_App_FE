import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../hooks/reduxHooks';
import { updateAvatar } from '../store/slices/authSlice';
import { toggleTheme } from '../store/slices/themeSlice';
import { saveAvatarToFirebase } from '../services/firebaseConfig';

export default function Profile() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const themeMode = useAppSelector((state) => state.theme.mode);
  
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const CLOUD_NAME = "dox9vbxjn"; 
  const UPLOAD_PRESET = "chat_app_preset";

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    
    if (!file) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', UPLOAD_PRESET);

      const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      if (data.secure_url) {
        dispatch(updateAvatar(data.secure_url));
        
        if (user?.username) {
            saveAvatarToFirebase(user.username, data.secure_url);
        }

        alert("Đổi avatar thành công!");
      }
    } catch (error) {
      console.error("Lỗi upload:", error);
      alert("Có lỗi khi upload ảnh");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center p-4 transition-colors duration-200">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg w-full max-w-md overflow-hidden">
        <div className="bg-[#0084ff] dark:bg-blue-600 p-4 flex items-center text-white">
          <button onClick={() => navigate('/')} className="mr-3 hover:bg-white/20 p-1 rounded-full transition-colors">
             <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
             </svg>
          </button>
          <h1 className="text-xl font-bold">Quản lý tài khoản</h1>
        </div>

        <div className="p-6 flex flex-col items-center">
          
          <div className="relative group mb-6">
            <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-gray-200">
               <img 
                 src={user?.avatar || "https://i.pravatar.cc/150?img=3"} 
                 alt="Avatar" 
                 className="w-full h-full object-cover"
               />
            </div>
            
            <div 
                onClick={() => fileInputRef.current?.click()}
                className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
            >
                <span className="text-white text-sm font-semibold">Đổi ảnh</span>
            </div>
            
            {isUploading && (
                <div className="absolute inset-0 bg-white/80 rounded-full flex items-center justify-center">
                   <svg className="animate-spin h-8 w-8 text-[#0084ff]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                   </svg>
                </div>
            )}
            
            <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="image/*"
                onChange={handleFileChange}
            />
          </div>

          <div className="w-full space-y-4">
            <div>
               <label className="block text-gray-500 dark:text-gray-400 text-sm font-bold mb-1">Tên hiển thị</label>
               <div className="w-full p-3 bg-gray-100 dark:bg-gray-700 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 font-medium">
                  {user?.username}
               </div>
               <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Tên đăng nhập không thể thay đổi.</p>
            </div>

            <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
              <label className="block text-gray-500 dark:text-gray-400 text-sm font-bold mb-3">
                Giao diện
              </label>
              
              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                    {themeMode === 'dark' ? (
                      <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                    )}
                  </div>

                  <div>
                    <p className="font-medium text-gray-700 dark:text-gray-200">Chế độ tối</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {themeMode === 'dark' ? 'Đang bật' : 'Đang tắt'}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => dispatch(toggleTheme())}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 ${
                    themeMode === 'dark' ? 'bg-blue-600' : 'bg-gray-300'
                  }`}
                  role="switch"
                  aria-checked={themeMode === 'dark'}
                  aria-label="Toggle dark mode"
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      themeMode === 'dark' ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>
            
            <button 
                onClick={() => navigate('/')}
                className="w-full py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-lg font-medium transition-colors"
            >
                Quay lại nhắn tin
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}