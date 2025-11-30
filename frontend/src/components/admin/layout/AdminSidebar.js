import React from "react";
import { NavLink } from "react-router-dom";
import "../../../styles/admin/Sidebar.css";

const AdminSidebar = ({ isCollapsed }) => {
  return (
    <div className={`admin-sidebar ${isCollapsed ? "collapsed" : ""}`}>
      <div className="sidebar-header">
        <div className="sidebar-brand">
          <i className="bi bi-shield-lock"></i>
          <span className="brand-text">QUẢN LÝ CHUNG</span>
        </div>
      </div>

      <div className="sidebar-menu">
        <div className="menu-section">
          {/* <div className="menu-section-title">QUẢN LÝ CHUNG</div> */}
          <ul className="nav flex-column">
            <li className="nav-item">
              <NavLink to="/admin" end className="nav-link">
                <i className="bi bi-speedometer2"></i>
                <span>Dashboard</span>
              </NavLink>
            </li>
            <li className="nav-item">
              <NavLink to="/admin/users" className="nav-link">
                <i className="bi bi-people"></i>
                <span>Quản lý người dùng</span>
              </NavLink>
            </li>
            <li className="nav-item">
              <NavLink to="/admin/locations" className="nav-link">
                <i className="bi bi-people"></i>
                <span>Quản lý địa điểm</span>
              </NavLink>
            </li>
            <li className="nav-item">
              <NavLink to="/admin/tours" className="nav-link">
                <i className="bi bi-people"></i>
                <span>Quản lý kế hoạch</span>
              </NavLink>
            </li>
            <li className="nav-item">
              <NavLink to="/admin/prices" className="nav-link">
                <i className="bi bi-currency-dollar"></i>
                <span>Quản lý giá tour</span>
              </NavLink>
            </li>
            <li className="nav-item">
              <NavLink to="/admin/departures" className="nav-link">
                <i className="bi bi-currency-dollar"></i>
                <span>Quản lý lịch khởi hành</span>
              </NavLink>
            </li>
            <li className="nav-item">
              <NavLink to="/admin/bookings" className="nav-link">
                <i className="bi bi-clipboard-check"></i>
                <span>Quản lý đặt tour</span>
              </NavLink>
            </li>
            <li className="nav-item">
              <NavLink to="/admin/withdrawals" className="nav-link">
                <i className="bi bi-wallet2"></i>
                <span>Quản lý rút tiền</span>
              </NavLink>
            </li>
            <li className="nav-item">
              <NavLink to="/admin/promotions" className="nav-link">
                <i className="bi bi-tags"></i>
                <span>Quản lý khuyến mãi</span>
              </NavLink>
            </li>
            <li className="nav-item">
              <NavLink to="/admin/hotels" className="nav-link">
                <i className="bi bi-building"></i>
                <span>Quản lý khách sạn</span>
              </NavLink>
            </li>
            <li className="nav-item">
              <NavLink to="/admin/chat" className="nav-link">
                <i className="bi bi-chat"></i>
                <span>Quản lý chat</span>
              </NavLink>
            </li>
            <li className="nav-item">
              <NavLink to="/admin/notifications" className="nav-link">
                <i className="bi bi-bell"></i>
                <span>Quản lý thông báo</span>
              </NavLink>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default AdminSidebar;
