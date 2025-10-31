import React, { useState, useEffect } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import AdminSidebar from './AdminSidebar';
import AdminHeader from './AdminHeader';
import '../../../styles/admin/AdminLayout.css';

const AdminLayout = () => {
  const { user } = useAuth();
  const location = useLocation();
  const [activePageName, setActivePageName] = useState('');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const toggleSidebar = () => setIsSidebarCollapsed(!isSidebarCollapsed);

  useEffect(() => {
    const path = location.pathname;
    // Xóa hoặc bình luận đoạn if cho Dashboard
    // if (path === '/admin') {
    //   setActivePageName('Dashboard');
    // } else 
    if (path.startsWith('/admin/users')) {
      setActivePageName('Quản lý người dùng');
    } else if (path.startsWith('/admin/locations')) {
      setActivePageName('Quản lý địa điểm');
    } else if (path.startsWith('/admin/tours')) {
      setActivePageName('Quản lý tour');
    } else {
      // Nếu /admin được truy cập trực tiếp và đã redirect,
      // activePageName sẽ được đặt bởi route con (ví dụ: /admin/users)
      // Nếu bạn muốn một giá trị mặc định khi không có route con nào khớp, đặt ở đây.
      // Ví dụ, nếu /admin/users là mặc định, bạn có thể không cần 'else' này
      // hoặc đặt nó thành 'Quản lý người dùng' nếu path là '/admin' và chưa redirect.
      // Tuy nhiên, với Navigate trong router.js, path sẽ nhanh chóng thành /admin/users.
      setActivePageName(''); 
    }
  }, [location.pathname]);

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