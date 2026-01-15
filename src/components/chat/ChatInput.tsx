import React, { useState, useRef, useEffect } from 'react';
import { socketService } from '../../services/socketService';
import { useAppDispatch, useAppSelector } from '../../hooks/reduxHooks';
import { addMessage } from '../../store/slices/chatSlice';
import EmojiStickerPicker from './EmojiStickerPicker';
import MarkdownToolbar from './MarkdownToolbar';
import RichTextInput from './RichTextInput';
import ReplyPreview from './ReplyPreview';
import { formatReplyMessage } from '../../utils/replyUtils';
import { clearReplyingTo } from '../../store/slices/uiSlice';

const CLOUD_NAME = "dox9vbxjn";
const UPLOAD_PRESET = "chat_app_preset";

export default function ChatInput() {
    const [text, setText] = useState('');
    const [isUploading, setIsUploading] = useState(false);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [showToolbar, setShowToolbar] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const inputRef = useRef<HTMLDivElement>(null);

    const [isRecording, setIsRecording] = useState(false);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);

    const { name: currentName, type: currentType } = useAppSelector(state => state.currentChat);
    const { user } = useAppSelector((state) => state.auth);
    // Lấy danh sách partners để kiểm tra tên có tồn tại không
    const { partners } = useAppSelector((state) => state.chatPartner);
    const { replyingTo } = useAppSelector((state) => state.ui);

    const dispatch = useAppDispatch();

    const processMentions = (rawContent: string) => {
        const validUsernames = partners
            .filter(p => p.type === 'people')
            .map(p => p.name)

        return rawContent.replace(/(^|\s)@([a-zA-Z0-9_]+)/g, (match, prefix, name) => {
            if (validUsernames.includes(name)) {
                return `${prefix}***@${name}***`;
            }
            return match;
        });
    };

    const sendMessage = async (content: string) => {
        if (!currentName || !currentType) return;

        let formattedContent = processMentions(content);
        if (content.startsWith('http')) {
            formattedContent = content;
       }
        if (replyingTo.message && replyingTo.target === currentName) {
            formattedContent = formatReplyMessage(replyingTo.message, formattedContent);
        }

        const tempMessage = {
            name: user?.username || 'me',
            mes: formattedContent,
            type: currentType,
            to: currentName,
            createAt: new Date().toISOString(),
            replyTo: replyingTo.message && replyingTo.target === currentName ? {
                senderName: replyingTo.message.name,
                message: replyingTo.message.mes,
                timestamp: replyingTo.message.createAt,
            } : undefined,
        };

        dispatch(addMessage({
            target: currentName,
            message: tempMessage
        }));

        try {
            await socketService.connect();

            if (currentType === 'room') {
                socketService.sendMessageToRoom(currentName, formattedContent);
            } else {
                socketService.sendMessageToPeople(currentName, formattedContent);
            }

        } catch (error) {
            console.error("Lỗi socket:", error);
        }
    };

    const handleSendText = () => {
        if (!text.trim()) return;
        sendMessage(text);
        setText('');
        dispatch(clearReplyingTo());
    };

    const handleCancelReply = () => {
        dispatch(clearReplyingTo());
    };

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            audioChunksRef.current = [];

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunksRef.current.push(event.data);
                }
            };

            mediaRecorder.onstop = async () => {
                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' }); 
                await handleUploadAudio(audioBlob);
                stream.getTracks().forEach(track => track.stop());
            };

            mediaRecorder.start();
            setIsRecording(true);
        } catch (error) {
            console.error("Lỗi truy cập micro:", error);
            alert("Không thể truy cập Micro. Vui lòng cấp quyền!");
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
        }
    };

    const handleUploadAudio = async (audioBlob: Blob) => {
        if (!currentName) return;
        setIsUploading(true);

        const formData = new FormData();
        formData.append("file", audioBlob);
        formData.append("upload_preset", UPLOAD_PRESET);
        formData.append("resource_type", "auto"); 

        try {
            const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/upload`, {
                method: "POST",
                body: formData,
            });
            const data = await res.json();
            
            if (data.secure_url) {
                // SỬA: Gọi hàm sendMessage để vừa hiện lên UI vừa gửi đi
                sendMessage(data.secure_url);
            }
        } catch (error) {
            console.error("Lỗi upload audio:", error);
            alert("Lỗi gửi tin nhắn thoại.");
        } finally {
            setIsUploading(false);
        }
    };

    useEffect(() => {
        if (replyingTo.message && replyingTo.target === currentName && !text) {
            const mention = `@${replyingTo.message.name} `;
            setText(mention);
            inputRef.current?.focus();
        }
    }, [replyingTo, currentName, text]);

    const handleEmojiSelect = (shortcode: string) => {
        setText(prev => prev + shortcode + ' ');
        inputRef.current?.focus();
    };

    const handleGifSelect = (gifUrl: string) => {
        sendMessage(gifUrl);
        setShowEmojiPicker(false);
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
                sendMessage(data.secure_url);
            } else {
                alert("Lỗi upload ảnh");
            }

        } catch (error) {
            alert("Không thể kết nối tới Cloudinary!");
        } finally {
            setIsUploading(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendText();
        }
    };

    const handleQuickThumbsUp = () => {
        if (isDisabled) return;
        sendMessage(':thumbsup:');
    };

    const isDisabled = !currentName || isUploading;

    return (
        <div className="relative">
            {/* Reply Preview */}
            {replyingTo.message && replyingTo.target === currentName && (
                <ReplyPreview message={replyingTo.message} onClose={handleCancelReply} />
            )}

            {showToolbar && <MarkdownToolbar editorRef={inputRef} />}

            <div className="h-[60px] border-t border-gray-300 dark:border-gray-700 flex items-center px-4 bg-white dark:bg-gray-800">

                <input
                    type="file"
                    accept="image/*"
                    ref={fileInputRef}
                    onChange={handleImageSelect}
                    className="hidden"
                />

                <div className="flex space-x-3 text-gray-500 dark:text-gray-400 mr-3">
                    <div
                        className={`cursor-pointer hover:text-blue-500 dark:hover:text-blue-400 transition-colors ${isDisabled ? 'opacity-50 pointer-events-none' : ''}`}
                        onClick={() => setShowToolbar(!showToolbar)}
                        title="Format text"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                        </svg>
                    </div>

                    <div
                        className={`cursor-pointer hover:text-blue-500 dark:hover:text-blue-400 transition-colors ${isDisabled ? 'opacity-50 pointer-events-none' : ''}`}
                        onClick={() => fileInputRef.current?.click()}
                        title="Gửi ảnh"
                    >
                        {isUploading ? (
                            <svg className="animate-spin h-6 w-6 text-blue-500 dark:text-blue-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                        ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                        )}
                    </div>
                    <button
                        className={`cursor-pointer transition-colors ${
                            isRecording 
                            ? 'text-red-500 animate-pulse bg-red-100 dark:bg-red-900/30 rounded-full p-1' 
                            : 'hover:text-red-500 dark:hover:text-red-400'
                        } ${isDisabled ? 'opacity-50 pointer-events-none' : ''}`}
                        onMouseDown={startRecording}
                        onMouseUp={stopRecording}
                        onMouseLeave={stopRecording}
                        onTouchStart={startRecording}
                        onTouchEnd={stopRecording}
                        title="Nhấn giữ để ghi âm"
                        type="button"
                    >
                         {isRecording ? (
                              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                                   <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/>
                                   <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
                              </svg>
                         ) : (
                              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                              </svg>
                         )}
                    </button>

                </div>

                <div className="flex-1 relative flex items-center">
                    <RichTextInput
                        value={text}
                        onChange={setText}
                        onKeyDown={handleKeyDown}
                        placeholder={isUploading ? "Đang gửi ảnh..." : (currentName ? "Nhập tin nhắn..." : "Chọn hội thoại để chat")}
                        disabled={isDisabled}
                        className="w-full bg-gray-100 dark:bg-gray-700 rounded-full py-2 px-4 pr-10 text-sm text-gray-900 dark:text-gray-100
            placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:focus:ring-blue-400
            disabled:bg-gray-200 dark:disabled:bg-gray-800 disabled:text-gray-500 dark:disabled:text-gray-600"
                        editorRef={inputRef}
                    />

                    <button
                        onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                        disabled={isDisabled}
                        className={`absolute right-3 top-1/2 transform -translate-y-1/2 transition-colors ${isDisabled ? 'opacity-50' : ''}`}
                        type="button"
                        title="Chọn emoji/sticker"
                    >
                        <svg className="w-6 h-6 text-gray-500 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <circle cx="12" cy="12" r="10" strokeWidth="1.5"/>
                            <circle cx="9" cy="10" r="1" fill="currentColor"/>
                            <circle cx="15" cy="10" r="1" fill="currentColor"/>
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8 14s1.5 2 4 2 4-2 4-2"/>
                        </svg>
                    </button>
                </div>

                {text.trim() ? (
                    <button
                        className={`ml-3 text-[#0084ff] dark:text-blue-400 cursor-pointer transition-all hover:scale-110 ${isDisabled ? 'opacity-50 pointer-events-none' : ''}`}
                        onClick={handleSendText}
                        disabled={isDisabled}
                        type="button"
                        title="Gửi tin nhắn"
                    >
                        <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
                        </svg>
                    </button>
                ) : (
                    <button
                        className={`ml-3 text-2xl hover:scale-125 transition-transform ${isDisabled ? 'opacity-50 pointer-events-none grayscale' : ''}`}
                        onClick={handleQuickThumbsUp}
                        disabled={isDisabled}
                        type="button"
                        title="Gửi thumbs up"
                    >
                        👍
                    </button>
                )}
            </div>

            {showEmojiPicker && (
                <EmojiStickerPicker
                    onEmojiSelect={handleEmojiSelect}
                    onGifSelect={handleGifSelect}
                    onClose={() => setShowEmojiPicker(false)}
                />
            )}
        </div>
    );
}