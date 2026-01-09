import React, { useState, useRef } from 'react';
import { socketService } from '../../services/socketService';
import { useAppDispatch, useAppSelector } from '../../hooks/reduxHooks';
import { addMessage } from '../../store/slices/chatSlice';
import EmojiShortcodePicker from './EmojiShortcodePicker';
import MarkdownToolbar from './MarkdownToolbar';
import RichTextInput from './RichTextInput';

export default function ChatInput() {
  const [text, setText] = useState('');
  const [isUploading, setIsUploading] = useState(false); 
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showToolbar, setShowToolbar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const inputRef = useRef<HTMLDivElement>(null);
  
  const { name: currentName, type: currentType } = useAppSelector(state => state.currentChat);
  const { user } = useAppSelector((state) => state.auth);
  const dispatch = useAppDispatch();

  const CLOUD_NAME = "dox9vbxjn"; 
  const UPLOAD_PRESET = "chat_app_preset"; 

  const sendMessage = async (content: string) => {
    if (!currentName || !currentType) return;

    const tempMessage = {
      name: user?.username || 'me',
      mes: content,
      to: currentName,
      createAt: new Date().toISOString()
    };
    dispatch(addMessage(tempMessage));

    // 2. Gửi qua Socket
    try {
      await socketService.connect();
      
      // SỬA: Kiểm tra loại chat để gọi hàm socket tương ứng
      if (currentType === 'room') {
          socketService.sendMessageToRoom(currentName, content);
      } else {
          socketService.sendMessageToPeople(currentName, content);
      }
      
    } catch (error) {
      console.error("Lỗi socket:", error);
    }
  };

  const handleSendText = () => {
    if (!text.trim()) return;
    sendMessage(text);
    setText('');
  };

  const handleEmojiSelect = (shortcode: string) => {
    setText(prev => prev + shortcode + ' ');
    setShowEmojiPicker(false);
    // Focus lại vào input sau khi chọn emoji
    if (inputRef.current) {
        // Logic focus tùy thuộc vào RichTextInput implementation, 
        // nhưng cơ bản là giữ focus
    }
  };

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (fileInputRef.current) fileInputRef.current.value = '';

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
        console.log("Upload thành công:", data.secure_url);
        sendMessage(data.secure_url); // Gửi link ảnh như tin nhắn
      } else {
        console.error("Lỗi Cloudinary:", data);
        alert("Lỗi upload ảnh");
      }

    } catch (error) {
      console.error("Lỗi mạng:", error);
      alert("Không thể kết nối tới Cloudinary!");
    } finally {
      setIsUploading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { // Shift+Enter để xuống dòng
      e.preventDefault();
      handleSendText();
    }
  };

  // Nếu chưa chọn chat thì disable input
  const isDisabled = !currentName || isUploading;

  return (
    <div className="relative">
      {/* Markdown Toolbar */}
      {showToolbar && <MarkdownToolbar editorRef={inputRef} />}
      
      <div className="h-[60px] border-t border-gray-300 flex items-center px-4 bg-white">

        <input 
          type="file" 
          accept="image/*" 
          ref={fileInputRef} 
          onChange={handleImageSelect} 
          className="hidden" 
        />

        <div className="flex space-x-3 text-gray-500 mr-3">
          {/* Format button */}
          <div
            className={`cursor-pointer hover:text-blue-500 ${isDisabled ? 'opacity-50 pointer-events-none' : ''}`}
            onClick={() => setShowToolbar(!showToolbar)}
            title="Format text"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
            </svg>
          </div>

          {/* Image upload */}
          <div 
            className={`cursor-pointer hover:text-blue-500 ${isDisabled ? 'opacity-50 pointer-events-none' : ''}`} 
            onClick={() => fileInputRef.current?.click()}
            title="Gửi ảnh"
          >
            {isUploading ? (
              <svg className="animate-spin h-6 w-6 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            )}
          </div>
        </div>

        <div className="flex-1 relative flex items-center">
          <RichTextInput
            value={text}
            onChange={setText}
            onKeyDown={handleKeyDown}
            placeholder={isUploading ? "Đang gửi ảnh..." : (currentName ? "Nhập tin nhắn..." : "Chọn hội thoại để chat")}
            disabled={isDisabled}
            className="w-full bg-gray-100 rounded-full py-2 px-4 pr-10 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-200 disabled:text-gray-500"
            editorRef={inputRef}
          />
          
          {/* Emoji button */}
          <button
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            disabled={isDisabled}
            className={`absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-yellow-500 text-xl transition-colors ${isDisabled ? 'opacity-50' : ''}`}
            type="button"
          >
            👍
          </button>
        </div>

        <div 
            className={`ml-3 text-[#0084ff] cursor-pointer ${isDisabled ? 'opacity-50 pointer-events-none' : ''}`} 
            onClick={handleSendText}
        >
          <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 20 20"><path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v7.333l-2 2z" /></svg>
        </div>
      </div>

      {/* Emoji Picker Popup */}
      {showEmojiPicker && (
        <EmojiShortcodePicker
          onSelect={handleEmojiSelect}
          onClose={() => setShowEmojiPicker(false)}
        />
      )}
    </div>
  );
}