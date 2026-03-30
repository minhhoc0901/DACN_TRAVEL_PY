const Chat = require('../models/Chat');
const ChatbotService = require('../utils/chatBotService');

exports.sendMessage = async (req, res) => {
  try {
    const { message } = req.body;
    const userId = req.user ? req.user.id : 0; // Sử dụng ID 0 cho người dùng ẩn danh
    
    // Lưu tin nhắn của người dùng
    await Chat.saveMessage(userId, message, false);
    
    // Xử lý tin nhắn và lấy phản hồi
    const response = await ChatbotService.processMessage(userId, message);
    
    // Lưu tin nhắn phản hồi của bot
    await Chat.saveMessage(userId, response, true);
    
    res.status(200).json({
      success: true,
      response
    });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi xử lý tin nhắn',
      error: error.message
    });
  }
};

exports.getConversation = async (req, res) => {
  try {
    const userId = req.user ? req.user.id : 0;
    const conversation = await Chat.getConversationByUserId(userId);
    
    res.status(200).json({
      success: true,
      conversation: conversation || [] // Ensure we always return an array
    });
  } catch (error) {
    console.error('Get conversation error:', error);
    res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi lấy lịch sử chat',
      error: error.message,
      conversation: [] // Return empty array on error
    });
  }
};