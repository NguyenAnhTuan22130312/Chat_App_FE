// src/components/sidebar/RoomTab.tsx
import React, { useState, useEffect } from 'react';
import { socketService } from '../../services/socketService';
import { useDispatch } from 'react-redux';
import { setCurrentChat } from '../../store/slices/currentChatSlice';

const RoomTab: React.FC = () => {
    const [roomName, setRoomName] = useState('');
    const [rooms, setRooms] = useState<string[]>([]);
    const dispatch = useDispatch();

    // Load từ localStorage
    useEffect(() => {
        const saved = JSON.parse(localStorage.getItem('joinedRooms') || '[]');
        setRooms(saved);
    }, []);

    const saveRoomsToStorage = (newRooms: string[]) => {
        localStorage.setItem('joinedRooms', JSON.stringify(newRooms));
        setRooms(newRooms);
    };

    const handleCreateAndJoin = () => {
        const name = roomName.trim();
        if (!name) return;

        socketService.createRoom(name);
        socketService.joinRoom(name);
        socketService.getRoomHistory(name);

        const newRooms = [...rooms, name].filter((v, i, a) => a.indexOf(v) === i);
        saveRoomsToStorage(newRooms);
        dispatch(setCurrentChat({ type: 'room', name }));

        setRoomName('');
    };

    const handleSelectRoom = (name: string) => {
        socketService.getRoomHistory(name);
        dispatch(setCurrentChat({ type: 'room', name }));
    };

    return (
        <div className="tab-room">
            <div className="create-room">
                <input
                    placeholder="Tên phòng mới..."
                    value={roomName}
                    onChange={(e) => setRoomName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleCreateAndJoin()}
                />
                <button onClick={handleCreateAndJoin}>Tạo</button>
            </div>

            <div className="room-list">
                {rooms.length === 0 ? (
                    <p className="empty-text">Chưa tham gia phòng nào</p>
                ) : (
                    rooms.map((room) => (
                        <div
                            key={room}
                            className="room-item"
                            onClick={() => handleSelectRoom(room)}
                        >
                            # {room}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default RoomTab;