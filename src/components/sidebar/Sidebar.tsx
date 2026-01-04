// src/components/sidebar/Sidebar.tsx
import React, { useState } from 'react';
import RoomTab from './RoomTab';
import PeopleTab from './PeopleTab';
import './styles.css';

const Sidebar: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'rooms' | 'people'>('rooms');

    return (
        <div className="sidebar-container">
            <div className="sidebar-tabs">
                <button
                    className={activeTab === 'rooms' ? 'active' : ''}
                    onClick={() => setActiveTab('rooms')}
                >
                    Nhóm chat
                </button>
                <button
                    className={activeTab === 'people' ? 'active' : ''}
                    onClick={() => setActiveTab('people')}
                >
                    Chat cá nhân
                </button>
            </div>

            <div className="sidebar-content">
                {activeTab === 'rooms' && <RoomTab />}
                {activeTab === 'people' && <PeopleTab />}
            </div>
        </div>
    );
};

export default Sidebar;