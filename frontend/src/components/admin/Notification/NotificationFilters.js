import React from 'react';

const NotificationFilters = ({ filters, setFilters, onRefresh }) => {
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleReset = () => {
    setFilters({
      type: 'all',
      search: '',
      dateFrom: '',
      dateTo: ''
    });
  };

  return (
    <div className="qltb-filters-section">
      <div className="qltb-filters-row">
        <div className="qltb-filter-col">
          <label>Loại thông báo</label>
          <select
            className="qltb-form-control"
            value={filters.type}
            onChange={(e) => handleFilterChange('type', e.target.value)}
          >
            <option value="all">Tất cả</option>
            <option value="booking_confirmed">Xác nhận booking</option>
            <option value="booking_cancelled">Hủy booking</option>
            <option value="payment_success">Thanh toán thành công</option>
            <option value="tour_approved">Tour được duyệt</option>
            <option value="tour_rejected">Tour bị từ chối</option>
          </select>
        </div>

        <div className="qltb-filter-col">
          <label>Tìm kiếm</label>
          <input
            type="text"
            className="qltb-form-control"
            placeholder="Tìm theo nội dung, người dùng..."
            value={filters.search}
            onChange={(e) => handleFilterChange('search', e.target.value)}
          />
        </div>

        <div className="qltb-filter-col">
          <label>&nbsp;</label>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button 
              className="qltb-btn qltb-btn-light"
              onClick={handleReset}
              style={{ flex: 1 }}
            >
              <i className="bi bi-arrow-clockwise"></i> Đặt lại
            </button>
            <button 
              className="qltb-btn qltb-btn-secondary"
              onClick={onRefresh}
              style={{ flex: 1 }}
            >
              <i className="bi bi-arrow-repeat"></i> Làm mới
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationFilters;