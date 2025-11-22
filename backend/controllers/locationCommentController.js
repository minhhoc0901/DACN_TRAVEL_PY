const LocationComment = require('../models/LocationComment');
const Location = require('../models/Location');
const Notification = require('../models/Notification');
const NOTIFICATION_TYPES = require('../constants/notificationTypes');

/**
 * Thêm comment mới hoặc reply
 */
exports.addComment = async (req, res) => {
  try {
    const { location_id, comment, parent_id = null } = req.body;
    const user_id = req.user.id;

    console.log('[LocationComment] New comment request:', { location_id, user_id, parent_id });

    if (!comment || comment.trim().length === 0) {
      return res.status(400).json({ success: false, message: 'Nội dung bình luận không được để trống' });
    }

    // Lấy thông tin location
    const location = await Location.getLocationById(location_id);
    if (!location) {
      return res.status(404).json({ success: false, message: 'Địa điểm không tồn tại' });
    }

    // Tạo comment
    const commentId = await LocationComment.createComment({
      locationId: location_id,
      userId: user_id,
      comment: comment.trim(),
      parentId: parent_id
    });

    console.log('[LocationComment] ✅ Comment created:', commentId);

    // Lấy thông tin comment vừa tạo
    const newComment = await LocationComment.getCommentById(commentId);

    // ✅ TẠO THÔNG BÁO NẾU LÀ REPLY
    if (parent_id) {
      try {
        const parentComment = await LocationComment.getCommentById(parent_id);
        
        if (parentComment && parentComment.user_id !== user_id) {
          const replierName = req.user?.full_name || req.user?.username || 'Một người dùng';
          const message = `${replierName} đã trả lời bình luận của bạn tại "${location.name}"`;
          const actionUrl = `/locations/${location_id}`;

          console.log('[LocationComment] Creating notification for user:', parentComment.user_id);

          const notification = await Notification.createNotificationWithType(
            parentComment.user_id,
            message,
            NOTIFICATION_TYPES.NEW_LOCATION_COMMENT,
            parseInt(location_id),
            actionUrl
          );

          console.log('[LocationComment] ✅ Notification created:', notification.id);

          // Emit socket notification
          const io = req.app.get('io');
          if (io) {
            const fullNotificationData = await Notification.getNotificationById(notification.id);
            if (fullNotificationData) {
              const roomName = `user_${parentComment.user_id}`;
              
              console.log(`[LocationComment] 📡 Emitting notification to room: ${roomName}`);
              
              io.to(roomName).emit('new_notification', fullNotificationData);
              
              console.log(`[LocationComment] ✅ Notification emitted successfully`);
            }
          }
        }
      } catch (notifError) {
        console.error('[LocationComment] ❌ Notification error:', notifError);
      }
    }

    // ✅ EMIT SOCKET ĐỂ CẬP NHẬT REAL-TIME (SỬA LẠI)
    const io = req.app.get('io');
    if (io) {
      console.log('[LocationComment] 📡 Broadcasting new comment to location:', location_id);
      
      // Emit đến tất cả clients đang xem location này
      io.emit(`location_${location_id}_new_comment`, {
        comment: newComment
      });
      
      console.log('[LocationComment] ✅ Comment broadcasted successfully');
    }

    res.status(201).json({
      success: true,
      message: 'Thêm bình luận thành công!',
      comment: newComment
    });
  } catch (error) {
    console.error('[LocationComment] ❌ Error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi thêm bình luận',
      error: error.message
    });
  }
};

/**
 * Lấy tất cả comments của địa điểm
 */
exports.getCommentsByLocation = async (req, res) => {
  try {
    const { locationId } = req.params;
    const comments = await LocationComment.getCommentsByLocationId(locationId);
    res.status(200).json({ success: true, comments });
  } catch (error) {
    console.error('[LocationComment] Error fetching comments:', error);
    res.status(500).json({ success: false, message: 'Lỗi khi lấy bình luận' });
  }
};

/**
 * Xóa comment
 */
exports.deleteComment = async (req, res) => {
  try {
    const { commentId } = req.params;
    const user_id = req.user.id;

    const success = await LocationComment.deleteComment(commentId, user_id);
    if (success) {
      // Emit socket để xóa real-time
      const io = req.app.get('io');
      if (io) {
        io.emit('delete_location_comment', { commentId });
      }
      
      res.status(200).json({ success: true, message: 'Xóa bình luận thành công' });
    } else {
      res.status(403).json({ success: false, message: 'Bạn không có quyền xóa bình luận này' });
    }
  } catch (error) {
    console.error('[LocationComment] Error deleting comment:', error);
    res.status(500).json({ success: false, message: 'Lỗi khi xóa bình luận' });
  }
};