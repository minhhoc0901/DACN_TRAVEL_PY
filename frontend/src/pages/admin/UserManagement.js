import React, { useState, useEffect } from 'react';
import UserList from '../../components/admin/users/UserList';
import axios from 'axios';
import { toast } from 'react-toastify';
import { CONFIG } from '../../config';
import { useAuth } from '../../contexts/AuthContext';
// import '../../styles/admin/UserManagement.css'; // File doesn't exist

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const { getToken } = useAuth();

  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await axios.get(`${CONFIG.API_API_URL}/users`, {
        headers: { 'Authorization': `Bearer ${getToken()}` }
      });
      setUsers(response.data.data);
      setLoading(false);
    } catch (error) {
      toast.error('Lỗi khi tải danh sách người dùng');
      setLoading(false);
    }
  };

  const handleUpdateRole = async (userId, newRole) => {
    try {
      await axios.put(`${CONFIG.API_API_URL}/users/${userId}`,
        { role: newRole },
        { headers: { 'Authorization': `Bearer ${getToken()}` }}
      );
      toast.success('Cập nhật quyền thành công');
      fetchUsers();
    } catch (error) {
      toast.error('Lỗi khi cập nhật quyền');
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Bạn có chắc muốn xóa người dùng này?')) return;

    try {
      await axios.delete(`${CONFIG.API_API_URL}/users/${userId}`, {
        headers: { 'Authorization': `Bearer ${getToken()}` }
      });
      toast.success('Xóa người dùng thành công');
      fetchUsers();
    } catch (error) {
      toast.error('Lỗi khi xóa người dùng');
    }
  };

  return (
    <div className="admin-page-container">
      <div className="admin-page-header">
        <h1 className="admin-page-title">Quản lý người dùng</h1>
      </div>
      
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>Đang tải...</div>
      ) : (
        <UserList
          users={users}
          onUpdateRole={handleUpdateRole}
          onDeleteUser={handleDeleteUser}
        />
      )}
    </div>
  );
};

export default UserManagement;