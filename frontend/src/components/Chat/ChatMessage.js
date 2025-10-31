import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import '../../styles/ChatBot/ChatBox.css';


const ChatMessage = ({ message, userAvatar }) => {
  const { sender, message: text, time } = message;
  const isBot = sender === 'bot';
  const [avatarError, setAvatarError] = useState(false);
  
  // Reset avatar error state when message changes
  useEffect(() => {
    setAvatarError(false);
  }, [message]);
  
  // Format time if it's a valid date
  const formatTime = (timeString) => {
    try {
      if (!timeString) return '';
      const date = new Date(timeString);
      if (isNaN(date.getTime())) return '';
      
      // Format as HH:MM using native JavaScript
      return date.toLocaleTimeString('vi-VN', {
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false
      });
    } catch (err) {
      console.error('Error formatting time:', err);
      return '';
    }
  };

  // Process message content to add links to IDs
  const processMessageContent = (content) => {
    if (!content) return '';
    
    // Regex mới để chỉ bắt tên địa danh và ID của nó
    // ([A-Za-z0-9À-ỹ]+(?: [A-Za-z0-9À-ỹ]+)*) : Bắt tên địa danh, có thể gồm nhiều từ tiếng Việt có dấu, cách nhau bởi một dấu cách.
    // \s*\(\s*ID\s*:\s*(\d+)\s*\) : Bắt phần (ID: X)
    return content.replace(/([A-Za-z0-9À-ỹ]+(?: [A-Za-z0-9À-ỹ]+)*)\s*\(\s*ID\s*:\s*(\d+)\s*\)/gi, (match, locationName, id) => {
      return `<a href="/locations/${id}" class="location-name-link">${locationName}</a>`;
    });
  };

  const handleImageError = () => {
    setAvatarError(true);
  };

  // Custom avatars based on sender
  const renderAvatar = () => {
    if (isBot) {
      return <div className="avatar-content bot-avatar">🤖</div>;
    } else {
      return avatarError || !userAvatar ? (
        <div className="avatar-content user-avatar">👤</div> // Avatar mặc định
      ) : (
        <img
          src={`http://localhost:5000${userAvatar}`} // Đường dẫn avatar của người dùng
          alt="User Avatar"
          onError={handleImageError}
          className="avatar-image"
        />
      );
    }
  };

  // Check if the message is part of a sequence from the same sender
  const isTypingIndicator = text === "...";

  return (
    <div className={`chat-message ${isBot ? 'bot' : 'user'}`}>
      {isBot && (
        <div className="message-avatar">
          {renderAvatar()}
        </div>
      )}
      
      <div className="message-content-wrapper">
        {isTypingIndicator ? (
          <div className="message-content typing-content">
            <div className="typing-indicator">
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
        ) : (
          <>
            <div className="message-content">
              <div 
                className="message-text"
                dangerouslySetInnerHTML={{ __html: processMessageContent(text) }} 
              />
            </div>
            {time && <div className="message-time">{formatTime(time)}</div>}
          </>
        )}
      </div>
      
      {!isBot && (
        <div className="message-avatar">
          {renderAvatar()}
        </div>
      )}
    </div>
  );
};

ChatMessage.propTypes = {
  message: PropTypes.object.isRequired,
  userAvatar: PropTypes.string,
};

export default ChatMessage;