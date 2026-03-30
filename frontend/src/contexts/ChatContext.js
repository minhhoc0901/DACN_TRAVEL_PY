import React, { createContext, useState, useEffect, useContext } from 'react';
import { useAuth } from './AuthContext';
import { toast } from 'react-toastify'; // Add this import
import io from 'socket.io-client';
import { CONFIG } from '../config';

const ChatContext = createContext();

export const ChatProvider = ({ children }) => {
  const [messages, setMessages] = useState([]);
  const [socket, setSocket] = useState(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isTyping, setIsTyping] = useState(false);
  const { getToken } = useAuth();
  const token = getToken();

  useEffect(() => {
    const newSocket = io(CONFIG.API_URL, {
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000
    });

    // Connection events
    newSocket.on('connect', () => {
      console.log('Connected to chat server');
      
      // Authenticate with token if available
      if (token) {
        newSocket.emit('authenticate', token);
      }
      
      // Get conversation history
      newSocket.emit('get_conversation');
    });
    
    newSocket.on('connect_error', (err) => {
      console.error('Connection error:', err);
    });

    // Nhận lịch sử chat
    newSocket.on('conversation_history', (conversation) => {
      try {
        if (Array.isArray(conversation)) {
          setMessages(conversation);
        } else {
          console.error('Invalid conversation data:', conversation);
          setMessages([]);
        }
      } catch (err) {
        console.error('Error processing conversation history:', err);
        setMessages([]); 
      }
    });

    // Nhận tin nhắn từ bot
    newSocket.on('bot_message', (message) => {
      console.log('Received bot message:', message);
      setMessages(prev => [...prev, message]);
      setIsTyping(false);
      
      // Tăng số tin nhắn chưa đọc nếu chat đang đóng
      if (!isChatOpen) {
        setUnreadCount(prev => prev + 1);
      }
    });

    // Handle user message sent confirmation
    newSocket.on('user_message_sent', (message) => {
      console.log('Message sent confirmation:', message);
    });

    // Bot bắt đầu đánh máy
    newSocket.on('bot_typing', () => {
      setIsTyping(true);
    });

    // Bot dừng đánh máy
    newSocket.on('bot_stop_typing', () => {
      setIsTyping(false);
    });
    
    // Handle errors
    newSocket.on('error', (error) => {
      console.error('Socket error:', error);
      // Display error message to user
      if (toast) {
        toast.error(error.message || 'Có lỗi xảy ra');
      }
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [token, isChatOpen]); 

  // Reset unreadCount khi mở chat
  useEffect(() => {
    if (isChatOpen) {
      setUnreadCount(0);
    }
  }, [isChatOpen]);

  // Gửi tin nhắn
  const sendMessage = (message) => {
    if (!socket || !message.trim()) return;

    console.log('Sending message:', message);

    // Thêm tin nhắn vào state
    const newMessage = {
      id: Date.now(),
      sender: 'user',
      message,
      time: new Date().toISOString()
    };

    setMessages(prev => [...prev, newMessage]);
    
    // Bật trạng thái đánh máy
    setIsTyping(true);
    
    // Gửi tin nhắn qua socket
    socket.emit('user_message', message);
  };

  // Toggle chat window
  const toggleChat = () => {
    setIsChatOpen(prev => !prev);
    if (!isChatOpen) {
      setUnreadCount(0);
    }
  };

  return (
    <ChatContext.Provider value={{
      messages,
      sendMessage,
      isChatOpen,
      toggleChat,
      unreadCount,
      isTyping
    }}>
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => useContext(ChatContext);

export default ChatContext;