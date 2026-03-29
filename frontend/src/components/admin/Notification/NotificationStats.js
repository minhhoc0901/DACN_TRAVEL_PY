import React from 'react';

const NotificationStats = ({ stats }) => {
  return (
    <div className="qltb-stats-bar">
      <div className="qltb-stat-item">
        <div className="qltb-stat-icon total">
          <i className="bi bi-bell"></i>
        </div>
        <div className="qltb-stat-content">
          <div className="qltb-stat-label">Tổng thông báo</div>
          <div className="qltb-stat-value">{stats.total || 0}</div>
        </div>
      </div>
      
      <div className="qltb-stat-item">
        <div className="qltb-stat-icon unread">
          <i className="bi bi-envelope"></i>
        </div>
        <div className="qltb-stat-content">
          <div className="qltb-stat-label">Chưa đọc</div>
          <div className="qltb-stat-value">{stats.unread || 0}</div>
        </div>
      </div>
      
      <div className="qltb-stat-item">
        <div className="qltb-stat-icon read">
          <i className="bi bi-check-circle"></i>
        </div>
        <div className="qltb-stat-content">
          <div className="qltb-stat-label">Đã đọc</div>
          <div className="qltb-stat-value">{stats.read || 0}</div>
        </div>
      </div>
      
      <div className="qltb-stat-item">
        <div className="qltb-stat-icon today">
          <i className="bi bi-graph-up"></i>
        </div>
        <div className="qltb-stat-content">
          <div className="qltb-stat-label">Hôm nay</div>
          <div className="qltb-stat-value">{stats.today || 0}</div>
        </div>
      </div>
    </div>
  );
};

export default NotificationStats;