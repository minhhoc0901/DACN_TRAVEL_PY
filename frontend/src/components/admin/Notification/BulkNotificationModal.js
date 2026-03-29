import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../../contexts/AuthContext';
import '../../../styles/admin/NotificationManagement.css';

const BulkNotificationModal = ({ onClose, onSend }) => {
  const { getToken } = useAuth();
  const [users, setUsers] = useState([]);
  const [formData, setFormData] = useState({
    userIds: [],
    message: '',
    type: 'system',
    actionUrl: ''
  });
  const [selectAll, setSelectAll] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    console.log('[BulkNotificationModal] Component mounted!');
    fetchUsers();
    
    // Khóa scroll body khi modal mở
    document.body.style.overflow = 'hidden';
    
    return () => {
      // Mở lại scroll khi modal đóng
      document.body.style.overflow = 'auto';
    };
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const token = getToken();
      console.log('[BulkNotificationModal] Fetching users...');
      const response = await axios.get('http://localhost:5000/api/admin/users', {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        console.log('[BulkNotificationModal] Users loaded:', response.data.data.length);
        setUsers(response.data.data);
      }
    } catch (error) {
      console.error('[BulkNotificationModal] Error fetching users:', error);
      alert('Không thể tải danh sách người dùng');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAll = () => {
    if (selectAll) {
      setFormData({ ...formData, userIds: [] });
    } else {
      setFormData({ ...formData, userIds: filteredUsers.map(u => u.id) });
    }
    setSelectAll(!selectAll);
  };

  const handleUserToggle = (userId) => {
    const newUserIds = formData.userIds.includes(userId)
      ? formData.userIds.filter(id => id !== userId)
      : [...formData.userIds, userId];
    
    setFormData({ ...formData, userIds: newUserIds });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('[BulkNotificationModal] Submitting:', formData);
    
    if (formData.userIds.length === 0) {
      alert('Vui lòng chọn ít nhất một người dùng');
      return;
    }
    if (!formData.message.trim()) {
      alert('Vui lòng nhập nội dung thông báo');
      return;
    }
    onSend(formData);
  };

  // Lọc users theo search query
  const filteredUsers = users.filter(user => {
    const searchLower = searchQuery.toLowerCase();
    return (
      user.username?.toLowerCase().includes(searchLower) ||
      user.full_name?.toLowerCase().includes(searchLower) ||
      user.email?.toLowerCase().includes(searchLower)
    );
  });

  // XỬ LÝ CLICK OVERLAY
  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  console.log('[BulkNotificationModal] Rendering modal...');

  return (
    <div className="qltb-modal-overlay" onClick={handleOverlayClick}>
      <div 
        className="qltb-modal-content qltb-bulk-modal" 
        onClick={(e) => e.stopPropagation()}
      >
        <div className="qltb-modal-header">
          <h3>
            <i className="bi bi-megaphone"></i> Gửi thông báo hàng loạt
          </h3>
          <button onClick={onClose} className="qltb-btn-close">
            <i className="bi bi-x"></i>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="qltb-modal-body">
          <div className="qltb-form-section">
            <div className="qltb-user-selection-header">
              <div className="qltb-selection-title">
                <h4>Chọn người nhận</h4>
                <span className="qltb-user-count">{formData.userIds.length} được chọn</span>
              </div>
              
              <div className="qltb-search-box">
                <i className="bi bi-search"></i>
                <input
                  type="text"
                  placeholder="Tìm kiếm người dùng..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="qltb-form-control"
                />
              </div>

              <label className="qltb-checkbox-label">
                <input
                  type="checkbox"
                  checked={selectAll}
                  onChange={handleSelectAll}
                />
                <span>Chọn tất cả ({filteredUsers.length} người dùng)</span>
              </label>
            </div>

            <div className="qltb-user-list-scroll">
              {loading ? (
                <div className="qltb-loading">
                  <i className="bi bi-arrow-repeat"></i>
                  <p>Đang tải danh sách người dùng...</p>
                </div>
              ) : filteredUsers.length === 0 ? (
                <div className="qltb-no-users">
                  <i className="bi bi-inbox"></i>
                  <p>Không tìm thấy người dùng nào</p>
                </div>
              ) : (
                filteredUsers.map(user => (
                  <label key={user.id} className="qltb-user-item">
                    <input
                      type="checkbox"
                      checked={formData.userIds.includes(user.id)}
                      onChange={() => handleUserToggle(user.id)}
                    />
                    <div className="qltb-user-avatar">
                      {user.avatar ? (
                        <img src={`http://localhost:5000${user.avatar}`} alt={user.username} />
                      ) : (
                        <div className="qltb-avatar-placeholder">
                          {(user.full_name || user.username).charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div className="qltb-user-info">
                      <strong>{user.full_name || user.username}</strong>
                      <span>{user.email}</span>
                    </div>
                  </label>
                ))
              )}
            </div>
          </div>

          <div className="qltb-form-group">
            <label>
              <i className="bi bi-tag"></i> Loại thông báo
            </label>
            <select
              className="qltb-form-control"
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
            >
              <option value="system">🔔 Hệ thống</option>
              <option value="new_message">💬 Tin nhắn</option>
              <option value="tour_approved">✅ Tour được duyệt</option>
              <option value="booking_confirmed">📅 Đặt tour thành công</option>
              <option value="payment_success">💳 Thanh toán thành công</option>
            </select>
          </div>

          <div className="qltb-form-group">
            <label>
              <i className="bi bi-chat-text"></i> Nội dung thông báo *
            </label>
            <textarea
              className="qltb-form-control"
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              placeholder="Nhập nội dung thông báo..."
              rows="4"
              required
            />
          </div>

          <div className="qltb-form-group">
            <label>
              <i className="bi bi-link-45deg"></i> Đường dẫn hành động (tùy chọn)
            </label>
            <input
              type="text"
              className="qltb-form-control"
              value={formData.actionUrl}
              onChange={(e) => setFormData({ ...formData, actionUrl: e.target.value })}
              placeholder="Ví dụ: /tours hoặc /profile"
            />
          </div>

          <div className="qltb-modal-footer">
            <button type="button" onClick={onClose} className="qltb-btn qltb-btn-secondary">
              <i className="bi bi-x-circle"></i> Hủy
            </button>
            <button type="submit" className="qltb-btn qltb-btn-primary">
              <i className="bi bi-send"></i> Gửi thông báo
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BulkNotificationModal;