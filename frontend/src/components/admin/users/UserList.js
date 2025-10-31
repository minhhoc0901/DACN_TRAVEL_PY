import React from 'react';
import '../../../styles/admin/UserList.css';

const UserList = ({ users, onUpdateRole, onDeleteUser }) => {
  return (
    <div className="user-list-section">
      <div className="user-list-header">
        <h2>Danh sách người dùng</h2>
        <div className="header-actions">
          <div className="search-box">
            <i className="bi bi-search"></i>
            <input type="text" placeholder="Tìm kiếm người dùng..." />
          </div>
        </div>
      </div>

      <div className="table-responsive">
        <table className="user-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Tên đăng nhập</th>
              <th>Email</th>
              <th>Họ tên</th>
              <th>Quyền</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user.id}>
                <td>#{user.id}</td>
                <td>
                  <div className="user-info">
                    <i className="bi bi-person-circle"></i>
                    <span>{user.username}</span>
                  </div>
                </td>
                <td>{user.email}</td>
                <td>{user.full_name || '-'}</td>
                <td>
                  <select
                    className={`role-select ${user.role}`}
                    value={user.role}
                    onChange={(e) => onUpdateRole(user.id, e.target.value)}
                  >
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                  </select>
                </td>
                <td>
                  <div className="action-buttons">
                    <button
                      className="btn-delete"
                      onClick={() => {
                        if(window.confirm('Bạn có chắc muốn xóa người dùng này?')) {
                          onDeleteUser(user.id);
                        }
                      }}
                      title="Xóa"
                    >
                      <i className="bi bi-trash"></i>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default UserList;