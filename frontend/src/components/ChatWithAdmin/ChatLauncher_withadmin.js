import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { ChatWithAdminProvider } from '../../contexts/ChatWithAdminContext';
import ChatWithAdminBox from './ChatWithAdminBox';
import '../../styles/user/ChatLauncher_WithAdmin.css';

const ChatLauncher_WithAdmin = () => {
    const { isAuthenticated } = useAuth();
    const [isChatOpen, setIsChatOpen] = useState(false);

    // Chỉ hiển thị khi user đã đăng nhập
    if (!isAuthenticated) {
        return null;
    }

    const toggleChat = () => {
        setIsChatOpen(prev => !prev);
    };

    return (
        <>
            <button onClick={toggleChat} className="chat-launcher-button">
                {isChatOpen ? '✕' : '💬'}
            </button>

            {isChatOpen && (
                // Bọc ChatWithAdminBox trong Provider của chính nó
                // để đảm bảo context được tạo và hủy đúng cách khi hộp chat đóng/mở
                <ChatWithAdminProvider>
                    <ChatWithAdminBox onClose={toggleChat} />
                </ChatWithAdminProvider>
            )}
        </>
    );
};

export default ChatLauncher_WithAdmin;