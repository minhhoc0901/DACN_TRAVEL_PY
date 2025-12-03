import React, { useState } from 'react';
import { BiSend } from 'react-icons/bi';
import '../../styles/ChatBot/ChatBox.css';

const ChatInput = ({ sendMessage, isTyping }) => {
  const [inputValue, setInputValue] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (inputValue.trim() && !isTyping) {
      sendMessage(inputValue);
      setInputValue('');
    }
  };

  return (
    <form className="chat-input-container" onSubmit={handleSubmit}>
      <input
        type="text"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        placeholder="Nhập câu hỏi của bạn..."
        disabled={isTyping}
        className={isTyping ? 'input-disabled' : ''}
      />
      <button 
        type="submit" 
        disabled={!inputValue.trim() || isTyping}
        className={`chat-send-btn ${(!inputValue.trim() || isTyping) ? 'disabled' : ''}`}
      >
      
        <BiSend size={24}  />
      </button>
    </form>
  );
};

export default ChatInput;