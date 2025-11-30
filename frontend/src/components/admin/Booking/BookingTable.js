import React from 'react';
import '../../../styles/Booking/BookingTable.css';

const BookingTable = ({ 
    bookings, 
    loading, 
    pagination, 
    filters,
    onViewDetail, 
    onUpdateStatus,
    onPageChange,
    onSort,
    onMarkCompleted
}) => {
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(amount);
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('vi-VN');
    };

    const getStatusBadge = (status) => {
        const statusMap = {
            'pending_payment': { label: 'Chờ thanh toán', class: 'status-pending' },
            'confirmed': { label: 'Đã xác nhận', class: 'status-confirmed' },
            'completed': { label: 'Đã hoàn thành', class: 'status-completed' },
            'cancelled': { label: 'Đã hủy', class: 'status-cancelled' }
        };
        const statusInfo = statusMap[status] || { label: status, class: '' };
        return <span className={`status-badge ${statusInfo.class}`}>{statusInfo.label}</span>;
    };

    const getPaymentStatusBadge = (paymentStatus) => {
        const statusMap = {
            'success': { label: 'Đã thanh toán', class: 'payment-success' },
            'pending': { label: 'Chưa thanh toán', class: 'payment-pending' },
            'failed': { label: 'Thất bại', class: 'payment-failed' }
        };
        const statusInfo = statusMap[paymentStatus] || { label: 'Chưa có', class: 'payment-none' };
        return <span className={`payment-badge ${statusInfo.class}`}>{statusInfo.label}</span>;
    };

    const getSortIcon = (column) => {
        if (filters.sort_by !== column) return <i className="fas fa-sort"></i>;
        return filters.sort_order === 'DESC' 
            ? <i className="fas fa-sort-down"></i> 
            : <i className="fas fa-sort-up"></i>;
    };

    const renderPagination = () => {
        const { page, totalPages } = pagination;
        const pages = [];
        const maxVisible = 5;

        let startPage = Math.max(1, page - Math.floor(maxVisible / 2));
        let endPage = Math.min(totalPages, startPage + maxVisible - 1);

        if (endPage - startPage + 1 < maxVisible) {
            startPage = Math.max(1, endPage - maxVisible + 1);
        }

        if (startPage > 1) {
            pages.push(
                <button key={1} onClick={() => onPageChange(1)} className="page-btn">1</button>
            );
            if (startPage > 2) {
                pages.push(<span key="dots1" className="pagination-dots">...</span>);
            }
        }

        for (let i = startPage; i <= endPage; i++) {
            pages.push(
                <button
                    key={i}
                    onClick={() => onPageChange(i)}
                    className={`page-btn ${i === page ? 'active' : ''}`}
                >
                    {i}
                </button>
            );
        }

        if (endPage < totalPages) {
            if (endPage < totalPages - 1) {
                pages.push(<span key="dots2" className="pagination-dots">...</span>);
            }
            pages.push(
                <button
                    key={totalPages}
                    onClick={() => onPageChange(totalPages)}
                    className="page-btn"
                >
                    {totalPages}
                </button>
            );
        }

        return pages;
    };

    return (
        <div className="booking-table-section">
            <div className="table-header">
                <h3>Danh sách Booking ({pagination.total})</h3>
            </div>

            <div className="table-responsive">
                <table className="booking-table">
                    <thead>
                        <tr>
                            <th onClick={() => onSort('created_at')} className="sortable">
                                ID {getSortIcon('created_at')}
                            </th>
                            <th>Khách hàng</th>
                            <th>Tour</th>
                            <th onClick={() => onSort('departure_date')} className="sortable">
                                Ngày khởi hành {getSortIcon('departure_date')}
                            </th>
                            {/* ✅ THÊM CỘT NGÀY KẾT THÚC */}
                            <th>Ngày kết thúc</th>
                            <th className="text-center">Số khách</th>
                            <th onClick={() => onSort('final_amount')} className="sortable">
                                Tổng tiền {getSortIcon('final_amount')}
                            </th>
                            <th>Trạng thái</th>
                            <th>Thanh toán</th>
                            <th>Ngày đặt</th>
                            <th className="text-center">Thao tác</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan="11" className="text-center">
                                    <div className="loading-spinner">
                                        <i className="fas fa-spinner fa-spin"></i> Đang tải...
                                    </div>
                                </td>
                            </tr>
                        ) : bookings.length === 0 ? (
                            <tr>
                                <td colSpan="11" className="text-center">
                                    <div className="no-data">
                                        <i className="fas fa-inbox"></i>
                                        <p>Không có booking nào</p>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            bookings.map(booking => (
                                <tr key={booking.id}>
                                    <td className="booking-id">#{booking.id}</td>
                                    <td>
                                        <div className="customer-info">
                                            <div className="customer-name">{booking.contact_name}</div>
                                            <div className="customer-email">{booking.contact_email}</div>
                                            <div className="customer-phone">{booking.contact_phone}</div>
                                        </div>
                                    </td>
                                    <td>
                                        <div className="tour-info">
                                            <div className="tour-name">{booking.destination}</div>
                                            <div className="tour-user">
                                                <i className="fas fa-user"></i> {booking.username || booking.full_name}
                                            </div>
                                        </div>
                                    </td>
                                    <td>{formatDate(booking.departure_date)}</td>
                                    {/* ✅ HIỂN THỊ NGÀY KẾT THÚC */}
                                    <td>
                                        {booking.end_date ? (
                                            <span className="end-date">{formatDate(booking.end_date)}</span>
                                        ) : (
                                            <span className="no-data-text">N/A</span>
                                        )}
                                    </td>
                                    <td className="text-center">
                                        <span className="badge badge-info">{booking.total_guests}</span>
                                    </td>
                                    <td className="booking-amount">{formatCurrency(booking.final_amount)}</td>
                                    <td>{getStatusBadge(booking.status)}</td>
                                    <td>{getPaymentStatusBadge(booking.payment_status)}</td>
                                    <td>{formatDate(booking.created_at)}</td>
                                    <td>
                                        <div className="action-buttons">
                                            <button
                                                onClick={() => onViewDetail(booking.id)}
                                                className="btn-icon btn-info"
                                                title="Xem chi tiết"
                                            >
                                                <i className="fas fa-eye"></i>
                                            </button>
                                            
                                            {booking.status === 'pending_payment' && (
                                                <>
                                                    <button
                                                        onClick={() => onUpdateStatus(booking)}
                                                        className="btn-icon btn-warning"
                                                        title="Cập nhật trạng thái"
                                                    >
                                                        <i className="fas fa-edit"></i>
                                                    </button>
                                                </>
                                            )}

                                            {booking.status === 'confirmed' && (
                                                <button
                                                    onClick={() => onMarkCompleted(booking)}
                                                    className="btn-icon btn-success"
                                                    title="Đánh dấu hoàn thành"
                                                >
                                                    <i className="fas fa-check-circle"></i>
                                                </button>
                                            )}
                                            
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {!loading && bookings.length > 0 && (
                <div className="pagination">
                    <button
                        onClick={() => onPageChange(pagination.page - 1)}
                        disabled={pagination.page === 1}
                        className="page-btn prev-btn"
                    >
                        <i className="fas fa-chevron-left"></i> Trước
                    </button>
                    
                    {renderPagination()}
                    
                    <button
                        onClick={() => onPageChange(pagination.page + 1)}
                        disabled={pagination.page === pagination.totalPages}
                        className="page-btn next-btn"
                    >
                        Sau <i className="fas fa-chevron-right"></i>
                    </button>
                </div>
            )}
        </div>
    );
};

export default BookingTable;