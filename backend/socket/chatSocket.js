const Chat = require('../models/Chat');
const ChatbotService = require('../utils/chatbotService');
const jwt = require('jsonwebtoken');
const jwtConfig = require('../config/jwt');

module.exports = (io) => {
  io.on('connection', (socket) => {
    console.log('User connected to chat:', socket.id);
    
    let userId = 0;
    
    // ✅ Lắng nghe event join_user_room
    socket.on('join_user_room', (userId) => {
      const roomName = `user_${userId}`;
      socket.join(roomName);
      console.log(`[Socket] User ${userId} joined room: ${roomName}`);
      
      // ✅ Emit confirmation back to client
      socket.emit('joined_room', { 
        room: roomName, 
        userId: userId // Thay uid bằng userId
      });
    });
    
    // Authenticate user if token is provided
    socket.on('authenticate', (token) => {
      try {
        if (token) {
          const decoded = jwt.verify(token, jwtConfig.secret);
          userId = decoded.id;
          console.log(`User ${userId} authenticated in chat`);
          
          // ✅ Tự động join vào room sau khi authenticate
          const roomName = `user_${userId}`;
          socket.join(roomName);
          console.log(`[ChatSocket] ✅ User ${userId} auto-joined room: ${roomName}`);
          
          // Get conversation history after authentication
          sendConversationHistory(socket, userId);
        }
      } catch (error) {
        console.error('Socket authentication error:', error);
      }
    });
    
    // Send conversation history when requested
    socket.on('get_conversation', () => {
      sendConversationHistory(socket, userId);
    });

    // Handle new message
    socket.on('user_message', async (message) => {
      try {
        if (!message || !message.trim()) return;
        
        console.log(`Received message from user ${userId}: ${message}`);
        
        // Save user message
        const userMessageId = await Chat.saveMessage(userId, message, false);
        
        // Emit the user message back with an ID
        socket.emit('user_message_sent', {
          id: userMessageId,
          sender: 'user',
          message,
          time: new Date().toISOString()
        });
        
        // Notify client that bot is typing
        socket.emit('bot_typing');
        
        try {
          // Process message and get bot response with a timeout of 5 seconds
          const botResponse = await Promise.race([
            ChatbotService.processMessage(userId, message),
            new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 5000))
          ]);
          
          // Save and emit bot message
          const botMessageId = await Chat.saveMessage(userId, botResponse, true);
          
          socket.emit('bot_message', {
            id: botMessageId,
            sender: 'bot',
            message: botResponse,
            time: new Date().toISOString()
          });
        } catch (error) {
          console.error('Error processing message:', error);
          
          // Send fallback response on error
          const fallbackMessage = "Xin chào! Tôi là trợ lý du lịch Phú Yên. Tôi có thể giúp bạn tìm hiểu về các địa điểm du lịch như Gành Đá Đĩa, Bãi Xép, Mũi Điện, hoặc tư vấn khi nào nên đi Phú Yên. Bạn cần tư vấn gì về chuyến du lịch Phú Yên?";
          const botMessageId = await Chat.saveMessage(userId, fallbackMessage, true);
          
          socket.emit('bot_message', {
            id: botMessageId,
            sender: 'bot',
            message: fallbackMessage,
            time: new Date().toISOString()
          });
        }
        
        socket.emit('bot_stop_typing');
      } catch (error) {
        console.error('Socket message handling error:', error);
        socket.emit('error', {message: 'Đã có lỗi xảy ra, vui lòng thử lại sau'});
      }
    });

    // ✅ GIỮ NGUYÊN: Send notification event
    socket.on('send_notification', (data) => {
      const { userId, message } = data;
      if (userId) {
        const roomName = `user_${userId}`; 
        
        io.to(roomName).emit('new_notification', { 
          id: Date.now(), 
          message: message,
          is_read: false,
          created_at: new Date().toISOString()
        });
        
        console.log(`✅ Notification sent to room: ${roomName}`);
      }
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      console.log('User disconnected from chat:', socket.id);
    });
  });

  // Helper function to send conversation history
  async function sendConversationHistory(socket, userId) {
    try {
      const conversation = await Chat.getConversationByUserId(userId);
      socket.emit('conversation_history', conversation || []);
    } catch (error) {
      console.error('Error fetching conversation history:', error);
      socket.emit('conversation_history', []);
      socket.emit('error', {
        message: 'Không thể tải lịch sử trò chuyện. Vui lòng thử lại sau.'
      });
    }
  }
};