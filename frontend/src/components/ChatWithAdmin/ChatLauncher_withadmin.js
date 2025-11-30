import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { ChatWithAdminProvider, useChatWithAdmin } from '../../contexts/ChatWithAdminContext';
import ChatWithAdminBox from './ChatWithAdminBox';
import '../../styles/user/ChatLauncher_WithAdmin.css';

const ChatLauncherContent = () => {
    const { isAuthenticated } = useAuth();
    const { isChatOpen, setIsChatOpen } = useChatWithAdmin();

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

            {isChatOpen && <ChatWithAdminBox onClose={() => setIsChatOpen(false)} />}
        </>
    );
};


const ChatLauncher_WithAdmin = () => {
    return (
        <ChatWithAdminProvider>
            <ChatLauncherContent />
        </ChatWithAdminProvider>
    );
};

export default ChatLauncher_WithAdmin;