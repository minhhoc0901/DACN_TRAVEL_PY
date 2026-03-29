import React, { useState, useEffect } from 'react';
import UserList from '../../components/admin/users/UserList';
import axios from 'axios';
import { toast } from 'react-toastify';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/users', {
        headers: { 'Authorization': `Bearer ${token}` }
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
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      await axios.put(`http://localhost:5000/api/users/${userId}`,
        { role: newRole },
        { headers: { 'Authorization': `Bearer ${token}` }}
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
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      await axios.delete(`http://localhost:5000/api/users/${userId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
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