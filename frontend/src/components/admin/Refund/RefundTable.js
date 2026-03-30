import React from 'react';
import '../../../styles/Refund/RefundTable.css';

const RefundTable = ({ refunds, loading, pagination, onPageChange, onViewDetail }) => {
    const formatCurrency = (num) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(num);
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleString('vi-VN');
    };

    const getStatusBadge = (status) => {
        const badges = {
            'pending': <span className="badge badge-warning">Chờ duyệt</span>,
            'approved': <span className="badge badge-info">Đã duyệt</span>,
            'completed': <span className="badge badge-success">Hoàn thành</span>,
            'rejected': <span className="badge badge-danger">Từ chối</span>
        };
        return badges[status] || <span className="badge badge-secondary">{status}</span>;
    };

    const getMethodBadge = (method) => {
        return method === 'credit' ? (
            <span className="badge badge-secondary"><i className="bi bi-wallet2"></i> Ví Credit</span>
        ) : (
            <span className="badge badge-info"><i className="bi bi-bank"></i> Ngân hàng</span>
        );
    };

    if (loading) {
        return (
            <div className="table-loading">
                <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Đang tải...</span>
                </div>
                <p>Đang tải dữ liệu...</p>
            </div>
        );
    }

    if (!refunds || refunds.length === 0) {
        return (
            <div className="table-empty">
                <i className="bi bi-inbox"></i>
                <p>Không có yêu cầu hoàn tiền nào</p>
            </div>
        );
    }

    return (
        <>
            <div className="table-responsive">
                <table className="refund-table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Booking</th>
                            <th>Khách hàng</th>
                            <th>Tour</th>
                            <th>Số tiền booking</th>
                            <th>% hoàn</th>
                            <th>Số tiền hoàn</th>
                            <th>Phương thức</th>
                            <th>Phí xử lý</th>
                            <th>Trạng thái</th>
                            <th>Ngày tạo</th>
                            <th>Thao tác</th>
                        </tr>
                    </thead>
                    <tbody>
                        {refunds.map(refund => (
                            <tr key={refund.id}>
                                <td>
                                    <span className="refund-id">#{refund.id}</span>
                                </td>
                                <td>
                                    <div className="booking-info">
                                        <strong>#{refund.booking_id}</strong>
                                    </div>
                                </td>
                                <td>
                                    <div className="customer-info">
                                        <strong>{refund.full_name || refund.contact_name}</strong>
                                        <div style={{ fontSize: '12px', color: '#667eea', fontWeight: '600' }}>
                                            <i className="bi bi-telephone"></i> {refund.contact_phone}
                                        </div>
                                        <small className="text-muted">{refund.user_email || refund.contact_email}</small>
                                    </div>
                                </td>
                                <td>
                                    <div className="tour-info">
                                        <span>{refund.tour_name}</span>
                                    </div>
                                </td>
                                <td>
                                    <strong>{formatCurrency(refund.booking_amount)}</strong>
                                </td>
                                <td>
                                    <span className="refund-percent">{refund.refund_percent}%</span>
                                </td>
                                <td>
                                    <strong className="refund-amount">{formatCurrency(refund.refund_amount)}</strong>
                                </td>
                                <td>
                                    {getMethodBadge(refund.refund_method)}
                                </td>
                                <td>
                                    <span className="text-danger">{formatCurrency(refund.processing_fee || 0)}</span>
                                </td>
                                <td>
                                    {getStatusBadge(refund.refund_status)}
                                </td>
                                <td>
                                    <small>{formatDate(refund.created_at)}</small>
                                </td>
                                <td>
                                    <button
                                        onClick={() => onViewDetail(refund)}
                                        className="btn btn-sm btn-primary"
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
            {pagination.totalPages > 1 && (
                <div className="table-pagination">
                    <div className="pagination-info">
                        Hiển thị {((pagination.page - 1) * pagination.limit) + 1} - {Math.min(pagination.page * pagination.limit, pagination.total)} / {pagination.total} kết quả
                    </div>
                    <div className="pagination-controls">
                        <button
                            onClick={() => onPageChange(pagination.page - 1)}
                            disabled={pagination.page === 1}
                            className="btn btn-sm btn-secondary"
                        >
                            <i className="bi bi-chevron-left"></i>
                        </button>
                        
                        {[...Array(pagination.totalPages)].map((_, index) => {
                            const page = index + 1;
                            if (
                                page === 1 ||
                                page === pagination.totalPages ||
                                (page >= pagination.page - 2 && page <= pagination.page + 2)
                            ) {
                                return (
                                    <button
                                        key={page}
                                        onClick={() => onPageChange(page)}
                                        className={`btn btn-sm ${page === pagination.page ? 'btn-primary' : 'btn-secondary'}`}
                                    >
                                        {page}
                                    </button>
                                );
                            } else if (page === pagination.page - 3 || page === pagination.page + 3) {
                                return <span key={page}>...</span>;
                            }
                            return null;
                        })}

                        <button
                            onClick={() => onPageChange(pagination.page + 1)}
                            disabled={pagination.page === pagination.totalPages}
                            className="btn btn-sm btn-secondary"
                        >
                            <i className="bi bi-chevron-right"></i>
                        </button>
                    </div>
                </div>
            )}
        </>
    );
};

export default RefundTable;