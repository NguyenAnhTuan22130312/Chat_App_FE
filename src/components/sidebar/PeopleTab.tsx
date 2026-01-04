// src/components/sidebar/PeopleTab.tsx
import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../store/store'; // điều chỉnh đường dẫn nếu cần
import { setCurrentChat } from '../../store/slices/currentChatSlice';
import { socketService } from '../../services/socketService';

const PeopleTab: React.FC = () => {
    const dispatch = useDispatch();
    const users = useSelector((state: RootState) => state.userList.users);
    const currentUser = useSelector((state: RootState) => state.auth.user?.username); // username hiện tại

    const handleOpenChat = (username: string) => {
        if (username === currentUser) return; // không chat với chính mình

        socketService.getHistory(username);
        dispatch(setCurrentChat({ type: 'people', name: username }));

        // Optional: lưu vào localStorage để reload vẫn thấy (dự phòng)
        const saved = JSON.parse(localStorage.getItem('peopleChats') || '[]');
        if (!saved.includes(username)) {
            saved.push(username);
            localStorage.setItem('peopleChats', JSON.stringify(saved));
        }
    };

    const filteredUsers = users.filter(user => user.name !== currentUser);

    return (
        <div className="tab-people">
            <div className="people-list">
                {filteredUsers.length === 0 ? (
                    <p className="empty-text">Đang tải danh sách người dùng...</p>
                ) : (
                    filteredUsers.map((user) => (
                        <div
                            key={user.name}
                            className="people-item"
                            onClick={() => handleOpenChat(user.name)}
                        >
                            👤 {user.name}
                            {user.type === 0 ? ' 🟢' : ' 🔴'} {/* ví dụ: type 0 online, 1 offline */}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default PeopleTab;