import React from 'react';
import { BiMessageDetail } from 'react-icons/bi';
import { useChat } from '../../contexts/ChatContext';
import ChatBox from './ChatBox';
import '../../styles/ChatBot/ChatBox.css';


const ChatLauncher = () => {
  const { isChatOpen, toggleChat, unreadCount } = useChat();
  
  return (
    <>
      {isChatOpen ? (
        <ChatBox toggleChat={toggleChat} />
      ) : (
        <div className="chat-launcher" onClick={toggleChat}>
          <BiMessageDetail size={34} />
          {unreadCount > 0 && <div className="unread-badge">{unreadCount}</div>}
        </div>
      )}
    </>
  );
};

export default ChatLauncher;