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
import { useUserAvatar } from '../../hooks/useUserAvatar'; // Giả sử bạn có hook này để lấy avatar

const CLOUD_NAME = "dox9vbxjn";
const UPLOAD_PRESET = "chat_app_preset";

export default function ChatInput() {
    const [text, setText] = useState('');
    const [isUploading, setIsUploading] = useState(false);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [showToolbar, setShowToolbar] = useState(false);

    // --- STATE CHO MENTION ---
    const [showMentionList, setShowMentionList] = useState(false);
    const [mentionQuery, setMentionQuery] = useState('');
    const [filteredUsers, setFilteredUsers] = useState<any[]>([]);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const inputRef = useRef<HTMLDivElement>(null); // Lưu ý: RichTextInput cần forwardRef tới thẻ input/textarea thực tế

    const { name: currentName, type: currentType,userList} = useAppSelector(state => state.currentChat as any);

    const [isRecording, setIsRecording] = useState(false);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);

    const { user } = useAppSelector((state) => state.auth);
    const { partners } = useAppSelector((state) => state.chatPartner);
    const { replyingTo } = useAppSelector((state) => state.ui);

    const dispatch = useAppDispatch();
    const getCaretIndex = (element: HTMLElement) => {
        let position = 0;
        const selection = window.getSelection();
        if (selection && selection.rangeCount !== 0) {
            const range = selection.getRangeAt(0);
            const preCaretRange = range.cloneRange();
            preCaretRange.selectNodeContents(element);
            preCaretRange.setEnd(range.endContainer, range.endOffset);
            position = preCaretRange.toString().length;
        }
        return position;
    };

    // Component con hiển thị 1 dòng trong popup mention
    const MentionItem = ({ user, onSelect }: { user: any, onSelect: (name: string) => void }) => {
        const avatar = useUserAvatar(user.name);

        return (
            <div
                className="flex items-center gap-2 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer transition-colors"
                // --- QUAN TRỌNG: Dùng onMouseDown ---
                onMouseDown={(e) => {
                    e.preventDefault(); // Giữ focus cho ô input
                    onSelect(user.name);
                }}
            >
                <img src={avatar} alt={user.name} className="w-8 h-8 rounded-full object-cover border border-gray-200" />
                <span className="text-sm font-medium text-gray-800 dark:text-gray-200">{user.name}</span>
            </div>
        );
    };

    const setCaretIndex = (element: HTMLElement, index: number) => {
        const range = document.createRange();
        const selection = window.getSelection();
        const childNode = element.firstChild || element;

        if (childNode) {
            const length = childNode.textContent?.length || 0;
            const safeIndex = Math.min(index, length);
            try {
                if (childNode.nodeType === 3) { // Text node
                    range.setStart(childNode, safeIndex);
                    range.setEnd(childNode, safeIndex);
                } else {
                    range.selectNodeContents(element);
                    range.collapse(false);
                }
                selection?.removeAllRanges();
                selection?.addRange(range);
            } catch (e) { element.focus(); }
        }
    };

    useEffect(() => {
        if (showMentionList) {
            let potentialUsers: any[] = [];

            if (currentType === 'people') {
                // Chat 1-1: Chỉ tag người đang chat cùng
                // Fallback: nếu chưa load partner kịp thì dùng luôn currentName
                const partner = partners.find(p => p.name === currentName);
                potentialUsers = partner ? [partner] : [{ name: currentName }];
            }
            else if (currentType === 'room') {
                // Chat Room: Lấy userList từ Redux (đã lưu ở bước trước)
                if (userList && Array.isArray(userList) && userList.length > 0) {
                    potentialUsers = userList;
                } else {
                    potentialUsers = [];
                }
            }

            // Lọc theo từ khóa
            const filtered = potentialUsers.filter(u =>
                u.name && u.name.toLowerCase().includes(mentionQuery.toLowerCase())
            );
            setFilteredUsers(filtered);
        }
    }, [mentionQuery, currentName, currentType, userList, partners, showMentionList]);
    // 2. HÀM CHECK KÝ TỰ @
    const handleContentChange = (newText: string) => {
        setText(newText);

        const inputElement = inputRef.current;
        if (!inputElement) return;

        // DÙNG HELPER MỚI
        const selectionStart = getCaretIndex(inputElement);
        const textBeforeCursor = newText.slice(0, selectionStart);

        // Regex tìm chữ @ cuối cùng
        const match = textBeforeCursor.match(/(@[a-zA-Z0-9_]*)$/);

        if (match) {
            // Cắt bỏ chữ @ để lấy query tìm kiếm
            const query = match[0].slice(1);
            setMentionQuery(query);
            setShowMentionList(true);
        } else {
            setShowMentionList(false);
        }
    };

    // // 2. HÀM CHECK KÝ TỰ @ KHI NHẬP LIỆU
    // const handleContentChange = (newText: string) => {
    //     setText(newText);
    //     const inputElement = inputRef.current as any;
    //     if (!inputElement) return;
    //
    //     const selectionStart = inputElement.selectionStart || newText.length;
    //
    //     const textBeforeCursor = newText.slice(0, selectionStart);
    //
    //     const match = textBeforeCursor.match(/(^|\s)@([a-zA-Z0-9_]*)$/);
    //
    //     if (match) {
    //         const query = match[2];
    //         setMentionQuery(query);
    //         setShowMentionList(true);
    //     } else {
    //         setShowMentionList(false);
    //     }
    // };

    const handleSelectUser = (username: string) => {
        const inputElement = inputRef.current;
        if (!inputElement) return;

        const selectionStart = getCaretIndex(inputElement);
        const textBeforeCursor = text.slice(0, selectionStart);

        // Tìm đoạn text đang gõ dở (ví dụ "@tu")
        const match = textBeforeCursor.match(/(@[a-zA-Z0-9_]*)$/);

        if (match) {
            const matchString = match[0]; // "@tu"
            const matchIndex = textBeforeCursor.lastIndexOf(matchString);

            // Cắt bỏ đoạn "@tu" cũ, thay bằng "@username "
            const prefix = textBeforeCursor.slice(0, matchIndex);
            const suffix = text.slice(selectionStart);

            const newText = `${prefix}@${username} ${suffix}`;

            setText(newText);
            setShowMentionList(false);

            // Đặt lại con trỏ dùng HELPER MỚI (fix crash)
            setTimeout(() => {
                inputElement.focus();
                const newCursorPos = prefix.length + username.length + 2; // +2 vì có @ và dấu cách
                setCaretIndex(inputElement, newCursorPos);
            }, 0);
        }
    };

    // --- LOGIC CŨ GIỮ NGUYÊN ---
    const processMentions = (rawContent: string) => {
        // Tạo danh sách whitelist: Những cái tên nào ĐƯỢC PHÉP in đậm/nghiêng
        let validUsernames: string[] = [];

        if (currentType === 'room') {
            // Nếu là Room: Lấy danh sách thành viên từ userList
            if (userList && Array.isArray(userList)) {
                validUsernames = userList.map((u: any) => u.name);
            }
        } else {
            // Nếu là People: Chỉ có người mình đang chat
            if (currentName) validUsernames = [currentName];
        }

        // Regex thay thế
        return rawContent.replace(/(^|\s)@([a-zA-Z0-9_]+)/g, (match, prefix, name) => {
            // Chỉ in đậm nếu tên có trong danh sách hợp lệ

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
        setShowMentionList(false); // Đảm bảo tắt popup
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
        // ... (Giữ nguyên logic upload ảnh)
        const file = e.target.files?.[0];
        if (!file) return;

        if (fileInputRef.current) fileInputRef.current.value = '';
        setIsUploading(true);

        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('upload_preset', UPLOAD_PRESET);
            const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
                method: 'POST', body: formData,
            });
            const data = await response.json();
            if (data.secure_url) sendMessage(data.secure_url);
            else alert("Lỗi upload ảnh");
        } catch (error) {
            alert("Không thể kết nối tới Cloudinary!");
        } finally {
            setIsUploading(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        // Nếu popup mention đang hiện, cho phép dùng Enter để chọn user đầu tiên (tuỳ chọn)
        if (showMentionList && filteredUsers.length > 0 && e.key === 'Enter') {
            e.preventDefault();
            handleSelectUser(filteredUsers[0].name);
            return;
        }

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
            {/* 4. POPUP LIST USER (HIỂN THỊ KHI GÕ @) */}
            {showMentionList && filteredUsers.length > 0 && (
                <div className="absolute bottom-full left-10 mb-2 w-64 max-h-48 overflow-y-auto bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg z-50 animate-in fade-in zoom-in duration-200">
                    <div className="p-2 border-b border-gray-100 dark:border-gray-700 text-xs font-bold text-gray-400 uppercase">
                        Gợi ý nhắc tên
                    </div>
                    {filteredUsers.map(user => (
                        <MentionItem key={user.name} user={user} onSelect={handleSelectUser} />
                    ))}
                </div>
            )}

            {/* Reply Preview */}
            {replyingTo.message && replyingTo.target === currentName && (
                <ReplyPreview message={replyingTo.message} onClose={handleCancelReply} />
            )}

            {showToolbar && <MarkdownToolbar editorRef={inputRef} />}

            <div className="h-[60px] border-t border-gray-300 dark:border-gray-700 flex items-center px-4 bg-white dark:bg-gray-800">
                <input type="file" accept="image/*" ref={fileInputRef} onChange={handleImageSelect} className="hidden" />

                <div className="flex space-x-3 text-gray-500 dark:text-gray-400 mr-3">
                    <div className={`cursor-pointer hover:text-blue-500 transition-colors ${isDisabled ? 'opacity-50 pointer-events-none' : ''}`} onClick={() => setShowToolbar(!showToolbar)} title="Format text">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" /></svg>
                    </div>
                    <div className={`cursor-pointer hover:text-blue-500 transition-colors ${isDisabled ? 'opacity-50 pointer-events-none' : ''}`} onClick={() => fileInputRef.current?.click()} title="Gửi ảnh">
                        {isUploading ? (
                            <svg className="animate-spin h-6 w-6 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                        ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
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
                    {/* SỬA: onChange truyền vào hàm mới handleContentChange */}
                    <RichTextInput
                        value={text}
                        onChange={handleContentChange}
                        onKeyDown={handleKeyDown}
                        placeholder={isUploading ? "Đang gửi ảnh..." : (currentName ? "Nhập tin nhắn..." : "Chọn hội thoại để chat")}
                        disabled={isDisabled}
                        className="w-full bg-gray-100 dark:bg-gray-700 rounded-full py-2 px-4 pr-10 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        editorRef={inputRef}
                    />
                    <button onClick={() => setShowEmojiPicker(!showEmojiPicker)} disabled={isDisabled} className={`absolute right-3 top-1/2 transform -translate-y-1/2 ${isDisabled ? 'opacity-50' : ''}`} type="button">
                        <svg className="w-6 h-6 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><circle cx="12" cy="12" r="10" strokeWidth="1.5"/><circle cx="9" cy="10" r="1" fill="currentColor"/><circle cx="15" cy="10" r="1" fill="currentColor"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8 14s1.5 2 4 2 4-2 4-2"/></svg>
                    </button>
                </div>

                {text.trim() ? (
                    <button className={`ml-3 text-[#0084ff] transition-all hover:scale-110 ${isDisabled ? 'opacity-50 pointer-events-none' : ''}`} onClick={handleSendText} disabled={isDisabled} type="button">
                        <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
                    </button>
                ) : (
                    <button className={`ml-3 text-2xl hover:scale-125 transition-transform ${isDisabled ? 'opacity-50 pointer-events-none grayscale' : ''}`} onClick={handleQuickThumbsUp} disabled={isDisabled} type="button">👍</button>
                )}
            </div>

            {showEmojiPicker && <EmojiStickerPicker onEmojiSelect={handleEmojiSelect} onGifSelect={handleGifSelect} onClose={() => setShowEmojiPicker(false)} />}
        </div>
    );
}