import React, { useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import AdminSidebar from './AdminSidebar';
import AdminHeader from './AdminHeader';
import '../../../styles/admin/AdminLayout.css';

const AdminLayout = () => {
  const { user, loading } = useAuth(); 
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const toggleSidebar = () => setIsSidebarCollapsed(!isSidebarCollapsed);

  if (loading) {
    return (
      <div className="admin-loading">
        <div className="admin-spinner"></div>
        <p>Đang tải...</p>
      </div>
    );
  }

  if (!user || user.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="admin-wrapper">
      <AdminSidebar isCollapsed={isSidebarCollapsed} onToggle={toggleSidebar} />
      
      <div className={`admin-main ${isSidebarCollapsed ? 'expanded' : ''}`}>
        <AdminHeader activePageName="" />
        
        <div className="admin-content">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default AdminLayout;