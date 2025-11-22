import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';
import io from 'socket.io-client';
import { toast } from 'react-toastify';
import '../../styles/LocationCSS/CommentSection.css';

const CommentSection = ({ locationId }) => {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [loading, setLoading] = useState(false);
  const { user, isAuthenticated, getToken } = useAuth();

  // Fetch comments
  useEffect(() => {
    const fetchComments = async () => {
      try {
        const response = await axios.get(`http://localhost:5000/api/location-comments/${locationId}`);
        if (response.data.success) {
          setComments(response.data.comments);
        }
      } catch (error) {
        console.error('Error fetching comments:', error);
      }
    };

    fetchComments();
  }, [locationId]);

  // ✅ Socket.IO listener - SỬA LẠI
  useEffect(() => {
    const socket = io('http://localhost:5000');

    // Listen cho event cụ thể của location này
    socket.on(`location_${locationId}_new_comment`, (data) => {
      console.log('[CommentSection] New comment received:', data.comment);
      
      const newCommentData = data.comment;
      
      // Kiểm tra xem có phải là reply không
      if (newCommentData.parent_id) {
        // Thêm reply vào comment cha
        setComments((prev) => {
          return prev.map(comment => {
            if (comment.id === newCommentData.parent_id) {
              return {
                ...comment,
                replies: [...(comment.replies || []), newCommentData]
              };
            }
            return comment;
          });
        });
      } else {
        // Thêm comment gốc mới
        setComments((prev) => [...prev, newCommentData]);
      }
      
      // Hiển thị toast notification
      if (newCommentData.user_id !== user?.id) {
        toast.info(`${newCommentData.full_name || newCommentData.username} đã bình luận`);
      }
    });

    socket.on('delete_location_comment', (data) => {
      setComments((prev) => {
        return prev.map(comment => ({
          ...comment,
          replies: comment.replies?.filter(r => r.id !== data.commentId)
        })).filter(c => c.id !== data.commentId);
      });
    });

    return () => {
      socket.disconnect();
    };
  }, [locationId, user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setLoading(true);
    try {
      const token = getToken();
      await axios.post(
        'http://localhost:5000/api/location-comments',
        {
          location_id: locationId,
          comment: newComment
        },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      setNewComment('');
      toast.success('Bình luận thành công!');
    } catch (error) {
      console.error('Error posting comment:', error);
      toast.error('Có lỗi xảy ra khi đăng bình luận');
    } finally {
      setLoading(false);
    }
  };

  const handleReply = async (parentId) => {
    if (!replyText.trim()) return;

    setLoading(true);
    try {
      const token = getToken();
      await axios.post(
        'http://localhost:5000/api/location-comments',
        {
          location_id: locationId,
          comment: replyText,
          parent_id: parentId
        },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      setReplyText('');
      setReplyingTo(null);
      toast.success('Trả lời thành công!');
    } catch (error) {
      console.error('Error posting reply:', error);
      toast.error('Có lỗi xảy ra khi trả lời');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (commentId) => {
    if (!window.confirm('Bạn có chắc muốn xóa bình luận này?')) return;

    try {
      const token = getToken();
      await axios.delete(`http://localhost:5000/api/location-comments/${commentId}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      toast.success('Xóa bình luận thành công!');
    } catch (error) {
      console.error('Error deleting comment:', error);
      toast.error('Có lỗi xảy ra khi xóa bình luận');
    }
  };

  const renderComment = (comment, isReply = false) => (
    <div key={comment.id} className={`comment-item ${isReply ? 'reply' : ''}`}>
      <img
        src={comment.avatar ? `http://localhost:5000${comment.avatar}` : '/default-avatar.png'}
        alt={comment.username}
        className="comment-avatar"
      />
      <div className="comment-content">
        <div className="comment-header">
          <div className="comment-author-info">
            <strong className="comment-author-name">{comment.full_name || comment.username}</strong>
            <span className="comment-time">
              {new Date(comment.created_at).toLocaleString('vi-VN', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </span>
          </div>
        </div>
        <p className="comment-text">{comment.comment}</p>
        <div className="comment-actions">
          {user?.id !== comment.user_id && isAuthenticated && !isReply && (
            <button 
              onClick={() => setReplyingTo(comment.id)} 
              className="reply-btn"
            >
              <i className="bi bi-reply"></i> Trả lời
            </button>
          )}
          {user?.id === comment.user_id && (
            <button onClick={() => handleDelete(comment.id)} className="delete-comment-btn">
              <i className="bi bi-trash"></i> Xóa
            </button>
          )}
        </div>

        {/* Form trả lời */}
        {replyingTo === comment.id && (
          <div className="reply-form">
            <textarea
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder={`Trả lời ${comment.full_name || comment.username}...`}
              rows="2"
            />
            <div className="reply-form-actions">
              <button onClick={() => handleReply(comment.id)} disabled={loading}>
                <i className="bi bi-send"></i> Gửi
              </button>
              <button onClick={() => setReplyingTo(null)} className="cancel-btn">
                Hủy
              </button>
            </div>
          </div>
        )}

        {/* Hiển thị replies */}
        {comment.replies && comment.replies.length > 0 && (
          <div className="replies-list">
            {comment.replies.map((reply) => renderComment(reply, true))}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <section className="comment-section">
      <div className="comment-section-header">
        <h2>
          <i className="bi bi-chat-dots"></i> 
          Bình luận ({comments.reduce((acc, c) => acc + 1 + (c.replies?.length || 0), 0)})
        </h2>
      </div>

      {isAuthenticated ? (
        <form onSubmit={handleSubmit} className="comment-form">
          <div className="comment-input-wrapper">
            <img
              src={user?.avatar ? `http://localhost:5000${user.avatar}` : '/default-avatar.png'}
              alt={user?.username}
              className="comment-avatar"
            />
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Chia sẻ trải nghiệm của bạn về địa điểm này..."
              rows="3"
              disabled={loading}
            />
          </div>
          <div className="comment-form-footer">
            <button type="submit" disabled={loading || !newComment.trim()}>
              {loading ? (
                <>
                  <span className="spinner"></span> Đang gửi...
                </>
              ) : (
                <>
                  <i className="bi bi-send"></i> Gửi bình luận
                </>
              )}
            </button>
          </div>
        </form>
      ) : (
        <div className="login-prompt">
          <i className="bi bi-lock"></i>
          <p>Vui lòng <a href="/login">đăng nhập</a> để bình luận</p>
        </div>
      )}

      <div className="comments-list">
        {comments.length === 0 ? (
          <div className="no-comments">
            <i className="bi bi-chat-square-text"></i>
            <p>Chưa có bình luận nào. Hãy là người đầu tiên chia sẻ!</p>
          </div>
        ) : (
          comments.map((comment) => renderComment(comment))
        )}
      </div>
    </section>
  );
};

export default CommentSection;