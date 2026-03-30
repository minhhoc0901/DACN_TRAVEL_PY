import React from 'react';

const WithdrawalTable = ({ 
    withdrawals, 
    loading, 
    pagination, 
    onPageChange, 
    onViewDetail 
}) => {
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND',
            minimumFractionDigits: 0
        }).format(amount || 0);
    };

    const formatDate = (dateString) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleString('vi-VN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getStatusBadge = (status) => {
        const statusConfig = {
            pending: { label: 'Chờ duyệt', class: 'badge-warning' },
            approved: { label: 'Đã duyệt', class: 'badge-info' },
            rejected: { label: 'Từ chối', class: 'badge-danger' },
            completed: { label: 'Hoàn thành', class: 'badge-success' }
        };
        const config = statusConfig[status] || { label: status, class: 'badge-secondary' };
        return <span className={`badge ${config.class}`}>{config.label}</span>;
    };

    if (loading) {
        return (
            <div className="loading-container">
                <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Đang tải...</span>
                </div>
            </div>
        );
    }

    if (!withdrawals || withdrawals.length === 0) {
        return (
            <div className="empty-state">
                <i className="bi bi-inbox" style={{ fontSize: '48px', color: '#ccc' }}></i>
                <p>Không có yêu cầu rút tiền nào</p>
            </div>
        );
    }

    return (
        <>
            <div className="table-responsive">
                <table className="table withdrawal-table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Người dùng</th>
                            <th>Số tiền</th>
                            <th>Ngân hàng</th>
                            <th>Số TK</th>
                            <th>Chủ TK</th>
                            <th>Trạng thái</th>
                            <th>Ngày tạo</th>
                            <th>Thao tác</th>
                        </tr>
                    </thead>
                    <tbody>
                        {withdrawals.map((withdrawal) => (
                            <tr key={withdrawal.id}>
                                <td>#{withdrawal.id}</td>
                                <td>
                                    <div className="user-info">
                                        <div className="user-name">{withdrawal.full_name || withdrawal.username}</div>
                                        <div className="user-email">{withdrawal.email}</div>
                                    </div>
                                </td>
                                <td>
                                    <strong style={{ color: '#dc3545' }}>
                                        {formatCurrency(withdrawal.amount)}
                                    </strong>
                                </td>
                                <td>{withdrawal.bank_name}</td>
                                <td>
                                    <code>{withdrawal.account_number}</code>
                                </td>
                                <td>{withdrawal.account_name}</td>
                                <td>{getStatusBadge(withdrawal.status)}</td>
                                <td>{formatDate(withdrawal.created_at)}</td>
                                <td>
                                    <button
                                        onClick={() => onViewDetail(withdrawal)}
                                        className="btn btn-sm btn-outline-primary"
                                        title="Xem chi tiết"
                                    >
                                        <i className="bi bi-eye"></i>
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            {pagination && pagination.totalPages > 1 && (
                <div className="pagination-container">
                    <button
                        onClick={() => onPageChange(pagination.page - 1)}
                        disabled={pagination.page === 1}
                        className="btn btn-sm btn-outline-secondary"
                    >
                        <i className="bi bi-chevron-left"></i> Trước
                    </button>
                    
                    <span className="pagination-info">
                        Trang {pagination.page} / {pagination.totalPages}
                        {' '}({pagination.total} yêu cầu)
                    </span>

                    <button
                        onClick={() => onPageChange(pagination.page + 1)}
                        disabled={pagination.page >= pagination.totalPages}
                        className="btn btn-sm btn-outline-secondary"
                    >
                        Sau <i className="bi bi-chevron-right"></i>
                    </button>
                </div>
            )}
        </>
    );
};

export default WithdrawalTable;