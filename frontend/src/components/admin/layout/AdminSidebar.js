import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../../contexts/AuthContext";
import "../../../styles/admin/Sidebar.css";

const AdminSidebar = ({ isCollapsed, onToggle }) => {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const handleLogout = () => {
    if (window.confirm('Bạn có chắc chắn muốn đăng xuất?')) {
      logout();
      navigate('/');
    }
  };

  const handleBackToHome = () => {
    navigate('/');
  };

  return (
    <div className={`admin-sidebar ${isCollapsed ? "collapsed" : ""}`}>
      {/* ===== HEADER WITH TOGGLE BUTTON ===== */}
      <div className="admin-sidebar-header">
        <button 
          onClick={onToggle} 
          className="admin-menu-toggle"
          title={isCollapsed ? 'Mở rộng menu' : 'Thu gọn menu'}
        >
          <span className="toggle-bar"></span>
          <span className="toggle-bar"></span>
          <span className="toggle-bar"></span>
        </button>

        <div className="admin-brand">
          {/* <div className="admin-brand-icon">
            <i className="bi bi-gear-fill"></i>
          </div> */}
          {!isCollapsed && (
            <div className="admin-brand-text">
              <span className="admin-brand-title">QUẢN TRỊ</span>
              <span className="admin-brand-subtitle">Hệ thống</span>
            </div>
          )}
        </div>
      </div>

      {/* ===== MENU ===== */}
      <div className="admin-sidebar-menu">
        <div className="admin-menu-section">
          <div className="admin-menu-title">TỔNG QUAN</div>
          <ul className="admin-nav">
            <li className="admin-nav-item">
              <NavLink to="/admin" end className="admin-nav-link">
                <i className="bi bi-speedometer2"></i>
                <span>Dashboard</span>
              </NavLink>
            </li>
          </ul>
        </div>

        <div className="admin-menu-section">
          <div className="admin-menu-title">QUẢN LÝ NỘI DUNG</div>
          <ul className="admin-nav">
            <li className="admin-nav-item">
              <NavLink to="/admin/users" className="admin-nav-link">
                <i className="bi bi-people"></i>
                <span>Người dùng</span>
              </NavLink>
            </li>
            <li className="admin-nav-item">
              <NavLink to="/admin/locations" className="admin-nav-link">
                <i className="bi bi-geo-alt"></i>
                <span>Địa điểm</span>
              </NavLink>
            </li>
            <li className="admin-nav-item">
              <NavLink to="/admin/tours" className="admin-nav-link">
                <i className="bi bi-map"></i>
                <span>Kế hoạch</span>
              </NavLink>
            </li>
          </ul>
        </div>

        <div className="admin-menu-section">
          <div className="admin-menu-title">DỊCH VỤ</div>
          <ul className="admin-nav">
            <li className="admin-nav-item">
              <NavLink to="/admin/prices" className="admin-nav-link">
                <i className="bi bi-currency-dollar"></i>
                <span>Giá tour</span>
              </NavLink>
            </li>
            <li className="admin-nav-item">
              <NavLink to="/admin/departures" className="admin-nav-link">
                <i className="bi bi-calendar-check"></i>
                <span>Lịch khởi hành</span>
              </NavLink>
            </li>
            <li className="admin-nav-item">
              <NavLink to="/admin/bookings" className="admin-nav-link">
                <i className="bi bi-clipboard-check"></i>
                <span>Đặt tour</span>
              </NavLink>
            </li>
            <li className="admin-nav-item">
              <NavLink to="/admin/hotels" className="admin-nav-link">
                <i className="bi bi-building"></i>
                <span>Khách sạn</span>
              </NavLink>
            </li>
          </ul>
        </div>

        <div className="admin-menu-section">
          <div className="admin-menu-title">TÀI CHÍNH</div>
          <ul className="admin-nav">
            <li className="admin-nav-item">
              <NavLink to="/admin/refunds" className="admin-nav-link">
                <i className="bi bi-arrow-counterclockwise"></i>
                <span>Hoàn tiền</span>
              </NavLink>
            </li>
            <li className="admin-nav-item">
              <NavLink to="/admin/withdrawals" className="admin-nav-link">
                <i className="bi bi-wallet2"></i>
                <span>Rút tiền</span>
              </NavLink>
            </li>
          </ul>
        </div>

        <div className="admin-menu-section">
          <div className="admin-menu-title">MARKETING</div>
          <ul className="admin-nav">
            <li className="admin-nav-item">
              <NavLink to="/admin/promotions" className="admin-nav-link">
                <i className="bi bi-tags"></i>
                <span>Khuyến mãi</span>
              </NavLink>
            </li>
            <li className="admin-nav-item">
              <NavLink to="/admin/notifications" className="admin-nav-link">
                <i className="bi bi-bell"></i>
                <span>Thông báo</span>
              </NavLink>
            </li>
          </ul>
        </div>

        <div className="admin-menu-section">
          <div className="admin-menu-title">HỖ TRỢ</div>
          <ul className="admin-nav">
            <li className="admin-nav-item">
              <NavLink to="/admin/chat" className="admin-nav-link">
                <i className="bi bi-chat-dots"></i>
                <span>Chat</span>
              </NavLink>
            </li>
          </ul>
        </div>
      </div>

      {/* ===== FOOTER ACTIONS ===== */}
      <div className="admin-sidebar-footer">
        <button onClick={handleBackToHome} className="admin-footer-btn admin-btn-home">
          <i className="bi bi-house-door"></i>
          <span>Về trang chủ</span>
        </button>
        <button onClick={handleLogout} className="admin-footer-btn admin-btn-logout">
          <i className="bi bi-box-arrow-right"></i>
          <span>Đăng xuất</span>
        </button>
      </div>
    </div>
  );
};

export default AdminSidebar;
