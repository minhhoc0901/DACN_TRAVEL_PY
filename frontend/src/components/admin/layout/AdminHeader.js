import React from 'react';

const AdminHeader = ({ onToggleSidebar, activePageName }) => {

  return (
    <header className="admin-header">
      <div className="header-left">
        <button className="btn-toggle-sidebar" onClick={onToggleSidebar}>
          <i className="bi bi-list"></i>
        </button>
        <nav aria-label="breadcrumb">
          <ol className="breadcrumb mb-0">
            {activePageName === 'Dashboard' || !activePageName ? (
              <li className="breadcrumb-item active"></li>
            ) : (
              <>
                <li className="breadcrumb-item active">{activePageName}</li>
              </>
            )}
          </ol>
        </nav>
      </div>
    </header>
  );
};

export default AdminHeader;