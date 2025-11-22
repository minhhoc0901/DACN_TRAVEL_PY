const Chat = require('../models/chatWithAdmin');
const Notification = require('../models/Notification');

// ✅ THÊM: Map để lưu trạng thái online của users
const onlineUsers = new Map(); // Map<userId, { socketId, lastSeen }>

module.exports = (io) => {
  io.on('connection', (socket) => {
    console.log(`[ChatSocketWithAdmin] New connection: ${socket.id}`);

    let currentUserId = null;

    socket.on('join', (roomName) => {
        console.log(`[Socket] User ${socket.id} joined room: ${roomName}`); 
        socket.join(roomName);
        
        // ✅ Extract userId và đánh dấu online
        const userIdMatch = roomName.match(/^user_(\d+)$/);
        if (userIdMatch) {
            currentUserId = parseInt(userIdMatch[1]);
            onlineUsers.set(currentUserId, {
                socketId: socket.id,
                lastSeen: new Date()
            });
            
            // Broadcast trạng thái online
            io.emit('user_status_changed', {
                userId: currentUserId,
                status: 'online',
                lastSeen: new Date()
            });
            
            console.log(`[Socket] User ${currentUserId} is now ONLINE`);
        }
    });

    socket.on('join_user_room', (userId) => {
        const roomName = `user_${userId}`;
        socket.join(roomName);
        currentUserId = parseInt(userId);
        
        // ✅ Đánh dấu user online
        onlineUsers.set(currentUserId, {
            socketId: socket.id,
            lastSeen: new Date()
        });
        
        io.emit('user_status_changed', {
            userId: currentUserId,
            status: 'online',
            lastSeen: new Date()
        });
        
        console.log(`[Socket] User ${userId} joined room: ${roomName}`);
    });

    socket.on('private_message', async (data) => {
        const { senderId, receiverId, message, imageUrls } = data;

        if (!senderId || !receiverId) {
            console.error('[Socket] Lỗi: senderId hoặc receiverId bị thiếu.');
            return;
        }

        try {
            const messageId = await Chat.saveMessage(senderId, receiverId, message, imageUrls);
            
            const messageData = {
                id: messageId,
                senderId, 
                receiverId, 
                message,
                imageUrls,
                is_read: 0,
                time: new Date()
            };

            io.to(`user_${receiverId}`).emit('private_message', messageData);
            
            if (senderId.toString() !== receiverId.toString()) {
                io.to(`user_${senderId}`).emit('private_message', messageData);
            }
            
            console.log(`[Socket] Message emitted to user_${receiverId} and user_${senderId}`);

            const [users] = await require('../config/db').pool.query(
                'SELECT role FROM users WHERE id = ?',
                [senderId]
            );

            if (users.length > 0 && users[0].role === 'admin') {
                const notificationMessage = imageUrls && imageUrls.length > 0
                    ? `Admin đã gửi ${imageUrls.length} ảnh cho bạn`
                    : `Admin: ${message.substring(0, 50)}${message.length > 50 ? '...' : ''}`;
                
                const notification = await Notification.createNotificationWithType(
                    receiverId,
                    notificationMessage,
                    'new_message',
                    messageId,
                    null
                );

                const fullNotification = await Notification.getNotificationById(notification.id);
                if (fullNotification) {
                    io.to(`user_${receiverId}`).emit('new_notification', fullNotification);
                    console.log(`[Chat] ✅ Sent message notification to user_${receiverId}`);
                }
            }

        } catch (error) {
            console.error('[Socket] Lỗi khi xử lý private_message:', error);
        }
    });

    socket.on('mark_as_read', async ({ senderId, receiverId }) => {
        await Chat.markMessagesAsRead(senderId, receiverId);
    });

    socket.on('delete_message', async ({ messageId, userId }) => {
        const success = await Chat.deleteMessage(messageId, userId);
        if (success) {
            io.to(`user_${userId}`).emit('message_deleted', { messageId });
        }
    });

    socket.on('get_conversation_admin', async (payload) => {
        if (!payload || !payload.userId1 || !payload.userId2) return;
        const { userId1, userId2, limit } = payload;
        const conversation = await Chat.getConversation(userId1, userId2, limit);
        socket.emit('conversation_history_chatadmin', conversation);
    });

    // ✅ THÊM: Xử lý disconnect
    socket.on('disconnect', () => {
        if (currentUserId) {
            onlineUsers.delete(currentUserId);
            
            io.emit('user_status_changed', {
                userId: currentUserId,
                status: 'offline',
                lastSeen: new Date()
            });
            
            console.log(`[Socket] User ${currentUserId} is now OFFLINE`);
        }
        console.log(`[ChatSocketWithAdmin] User disconnected: ${socket.id}`);
    });

    // ✅ THÊM: API lấy danh sách user online
    socket.on('get_online_users', () => {
        const onlineUsersList = Array.from(onlineUsers.entries()).map(([userId, data]) => ({
            userId,
            lastSeen: data.lastSeen
        }));
        
        socket.emit('online_users_list', onlineUsersList);
    });
  });

  // ✅ THÊM: Export functions
  io.getOnlineUsers = () => {
    return Array.from(onlineUsers.keys());
  };

  io.isUserOnline = (userId) => {
    return onlineUsers.has(parseInt(userId));
  };
};