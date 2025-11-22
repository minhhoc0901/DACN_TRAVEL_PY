import React, { useState, useEffect } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import AdminSidebar from './AdminSidebar';
import AdminHeader from './AdminHeader';
import '../../../styles/admin/AdminLayout.css';

const AdminLayout = () => {
  const { user, loading } = useAuth(); // ✅ Lấy loading từ context
  const location = useLocation();
  const [activePageName, setActivePageName] = useState('');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const toggleSidebar = () => setIsSidebarCollapsed(!isSidebarCollapsed);

  useEffect(() => {
    const path = location.pathname;
    
    if (path.startsWith('/admin/users')) {
      setActivePageName('Quản lý người dùng');
    } else if (path.startsWith('/admin/locations')) {
      setActivePageName('Quản lý địa điểm');
    } else if (path.startsWith('/admin/tours')) {
      setActivePageName('Quản lý tour');
    } else if (path.startsWith('/admin/chat')) {
      setActivePageName('Quản lý chat');
    } else if (path.startsWith('/admin/notifications')) {
      setActivePageName('Quản lý thông báo');
    } else {
      setActivePageName(''); 
    }
  }, [location.pathname]);

  // ✅ Hiển thị loading khi đang kiểm tra auth
  if (loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        flexDirection: 'column',
        gap: '1rem'
      }}>
        <div style={{
          width: '48px',
          height: '48px',
          border: '4px solid #f3f3f3',
          borderTop: '4px solid #007bff',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }}></div>
        <p>Đang tải...</p>
      </div>
    );
  }

  // ✅ Chỉ redirect khi đã load xong và không phải admin
  if (!user || user.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="admin-wrapper">
      <AdminSidebar isCollapsed={isSidebarCollapsed} />
      <div className={`admin-main ${isSidebarCollapsed ? 'expanded' : ''}`}>
        <AdminHeader onToggleSidebar={toggleSidebar} activePageName={activePageName} />
        <div className="admin-content">
          <div className="container-fluid">
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLayout;