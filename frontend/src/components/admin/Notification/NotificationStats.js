import React from 'react';

const NotificationStats = ({ stats }) => {
  return (
    <div className="admin-notif-stats-grid">
      <div className="admin-notif-stat-card">
        <div className="admin-notif-stat-icon blue">
          <i className="bi bi-bell"></i>
        </div>
        <div className="admin-notif-stat-content">
          <h3>{stats.total?.toLocaleString() || 0}</h3>
          <p>Tổng thông báo</p>
        </div>
      </div>

      <div className="admin-notif-stat-card">
        <div className="admin-notif-stat-icon orange">
          <i className="bi bi-envelope-open"></i>
        </div>
        <div className="admin-notif-stat-content">
          <h3>{stats.unread?.toLocaleString() || 0}</h3>
          <p>Chưa đọc</p>
        </div>
      </div>

      <div className="admin-notif-stat-card">
        <div className="admin-notif-stat-icon green">
          <i className="bi bi-check-circle"></i>
        </div>
        <div className="admin-notif-stat-content">
          <h3>{stats.read?.toLocaleString() || 0}</h3>
          <p>Đã đọc</p>
        </div>
      </div>

      <div className="admin-notif-stat-card">
        <div className="admin-notif-stat-icon purple">
          <i className="bi bi-graph-up"></i>
        </div>
        <div className="admin-notif-stat-content">
          <h3>{stats.daily?.[0]?.count || 0}</h3>
          <p>Hôm nay</p>
        </div>
      </div>
    </div>
  );
};

export default NotificationStats;