import React from 'react';

const NotificationFilters = ({ filters, setFilters, onRefresh }) => {
  const notificationTypes = [
    { value: 'all', label: 'Tất cả' },
    { value: 'tour_approved', label: 'Tour được duyệt' },
    { value: 'tour_rejected', label: 'Tour bị từ chối' },
    { value: 'new_review', label: 'Đánh giá mới' },
    { value: 'new_message', label: 'Tin nhắn từ Admin' },
    { value: 'new_location_comment', label: 'Bình luận địa điểm' },
    { value: 'booking_confirmed', label: 'Đặt tour thành công' },
    { value: 'booking_cancelled', label: 'Hủy tour' },
    { value: 'payment_success', label: 'Thanh toán thành công' },
    { value: 'system', label: 'Hệ thống' }
  ];

  return (
    <div className="admin-notif-filters">
      <div className="admin-notif-filter-group">
        <label>
          <i className="bi bi-funnel"></i> Loại thông báo
        </label>
        <select
          value={filters.type}
          onChange={(e) => setFilters({ ...filters, type: e.target.value })}
        >
          {notificationTypes.map(type => (
            <option key={type.value} value={type.value}>
              {type.label}
            </option>
          ))}
        </select>
      </div>

      <div className="admin-notif-filter-group">
        <label>
          <i className="bi bi-search"></i> Tìm kiếm
        </label>
        <input
          type="text"
          placeholder="Tìm theo nội dung, người dùng..."
          value={filters.search}
          onChange={(e) => setFilters({ ...filters, search: e.target.value })}
        />
      </div>

      <button onClick={onRefresh} className="admin-notif-btn-refresh">
        <i className="bi bi-arrow-clockwise"></i> Làm mới
      </button>
    </div>
  );
};

export default NotificationFilters;