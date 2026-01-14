import React, { useState } from 'react';
import { socketService } from '../../services/socketService';
import SidebarRail from './SidebarRail';
import SidebarPanel from './SidebarPanel';

const Sidebar = () => {
    const [showCreateRoom, setShowCreateRoom] = useState(false);
    const [newRoomName, setNewRoomName] = useState('');

    const handleCreateRoom = () => {
        if (newRoomName.trim()) {
            socketService.createRoom(newRoomName.trim());
            setNewRoomName('');
            setShowCreateRoom(false);
        }
    };

    return (
        <div className="w-full h-full flex flex-row">
            <SidebarRail />
            <SidebarPanel onOpenCreateRoom={() => setShowCreateRoom(true)} />

            {/* Modal Tạo Nhóm */}
            {showCreateRoom && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[100]">
                    <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 w-[320px] shadow-2xl">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Tạo phòng mới</h3>
                        <input autoFocus type="text" value={newRoomName} onChange={(e) => setNewRoomName(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-700 border focus:ring-2 outline-none" placeholder="Tên phòng..." />
                        <div className="flex justify-end gap-2 mt-6">
                            <button onClick={() => setShowCreateRoom(false)} className="px-4 py-2 text-gray-500">Hủy</button>
                            <button onClick={handleCreateRoom} className="px-6 py-2 bg-blue-600 text-white rounded-xl font-bold">Tạo ngay</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Sidebar;