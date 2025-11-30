import React, { useEffect, useRef } from 'react';
import { BiX } from 'react-icons/bi';
import ChatMessage from './ChatMessage';
import ChatInput from './ChatInput';
import { useChat } from '../../contexts/ChatContext';
import { useAuth } from '../../contexts/AuthContext';
import '../../styles/ChatBot/ChatBox.css';

const ChatBox = ({ toggleChat }) => {
  const { messages, sendMessage, isTyping } = useChat();
  const { user } = useAuth(); // Lấy thông tin người dùng từ AuthContext
  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom of messages
  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSuggestedMessage = (message) => {
    sendMessage(message);
  };

  return (
    <div className="chat-container">
      <div className="chat-header">
        <h3>Trợ lý du lịch Phú Yên</h3>
        <button className="chat-close-btn" onClick={toggleChat}>
          <BiX size={24} />
        </button>
      </div>

      <div className="chat-messages">
        {messages.length === 0 ? (
          <div className="chat-welcome">
            <div className="chat-welcome-icon">🏝️</div>
            <h4>Xin chào!</h4>
            <p>
              Tôi là trợ lý du lịch Phú Yên. Tôi có thể giúp bạn?
            </p>
            <div className="chat-suggestions">
              <button onClick={() => handleSuggestedMessage("Thời tiết ở Phú Yên như thế nào?")}>
                Thời tiết Phú Yên?
              </button>
              <button onClick={() => handleSuggestedMessage("Giới thiệu về Phú Yên")}>
                Giới thiệu về Phú Yên
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Hiển thị tin nhắn */}
            {messages.map((msg, index) => (
              <ChatMessage 
                key={msg.id || index} 
                message={msg} 
                userAvatar={user?.avatar} // Truyền avatar của người dùng
              />
            ))}
            
            {/* Hiển thị trạng thái đang gõ */}
            {isTyping && (
              <div className="chat-message bot">
                <div className="message-avatar">🤖</div>
                <div className="message-content">
                  <div className="typing-indicator">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
              </div>
            )}
            
            {/* Element for auto-scrolling */}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>
      
      <ChatInput sendMessage={sendMessage} isTyping={isTyping} />
    </div>
  );
};

export default ChatBox;