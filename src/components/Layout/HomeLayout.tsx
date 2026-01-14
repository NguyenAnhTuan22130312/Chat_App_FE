import Sidebar from '../sidebar/Sidebar';
import ChatWindow from '../chat/ChatWindow';
import ContactWindow from '../contact/ContactWindow';
import { useAppSelector } from '../../hooks/reduxHooks';

const HomeLayout = () => {
    // Lấy tab từ Redux
    const activeTab = useAppSelector((state) => state.ui.activeSidebarTab);

    return (
        <div className="flex h-screen w-full overflow-hidden bg-white dark:bg-gray-900">
            {/* Cột trái */}
            <div className="w-[25%] h-full hidden md:flex flex-row border-r border-gray-300 dark:border-gray-700">
                <Sidebar />
            </div>

            {/* Cột phải (Main) */}
            <div className="flex-1 h-full w-[75%] min-w-0 bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-700">
                {activeTab === 'contacts' ? (
                    <ContactWindow />
                ) : (
                    <ChatWindow />
                )}
            </div>
        </div>
    );
};

export default HomeLayout;