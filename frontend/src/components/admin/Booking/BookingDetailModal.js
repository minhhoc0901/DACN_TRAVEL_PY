import React from 'react';
import '../../../styles/Booking/BookingDetailModal.css';

const BookingDetailModal = ({ booking, onClose }) => {
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(amount);
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleString('vi-VN');
    };

    const getStatusLabel = (status) => {
        const labels = {
            'pending_payment': 'Chờ thanh toán',
            'confirmed': 'Đã xác nhận',
            'cancelled': 'Đã hủy'
        };
        return labels[status] || status;
    };

    const getPaymentStatusLabel = (status) => {
        const labels = {
            'success': 'Đã thanh toán',
            'pending': 'Chưa thanh toán',
            'failed': 'Thất bại'
        };
        return labels[status] || 'Chưa có';
    };

    const getPriceTypeLabel = (type) => {
        const labels = {
            'adult': 'Người lớn',
            'child': 'Trẻ em (5-11 tuổi)',
            'infant': 'Trẻ nhỏ (<5 tuổi)'
        };
        return labels[type] || type;
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content booking-detail-modal" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h3>Chi tiết Booking #{booking.id}</h3>
                    <button onClick={onClose} className="btn-close">
                        <i className="fas fa-times"></i>
                    </button>
                </div>
                
                <div className="modal-body">
                    {/* Thông tin tour */}
                    <div className="detail-section">
                        <h4><i className="fas fa-map-marked-alt"></i> Thông tin tour</h4>
                        <div className="detail-grid">
                            <div className="detail-item">
                                <span className="label">Tour:</span>
                                <span className="value">{booking.tour_name || booking.destination}</span>
                            </div>
                            <div className="detail-item">
                                <span className="label">Điểm khởi hành:</span>
                                <span className="value">{booking.departure_from}</span>
                            </div>
                            <div className="detail-item">
                                <span className="label">Ngày khởi hành:</span>
                                <span className="value">
                                    {booking.departure_date 
                                        ? new Date(booking.departure_date).toLocaleDateString('vi-VN')
                                        : 'N/A'}
                                </span>
                            </div>
                            {/* HIỂN THỊ NGÀY KẾT THÚC */}
                            <div className="detail-item">
                                <span className="label">Ngày kết thúc:</span>
                                <span className="value">
                                    {booking.end_date 
                                        ? new Date(booking.end_date).toLocaleDateString('vi-VN')
                                        : 'N/A'}
                                </span>
                            </div>
                            
                            {/* HIỂN THỊ THỜI GIAN */}
                            <div className="detail-item">
                                <span className="label">Thời gian:</span>
                                <span className="value">{booking.duration || 'N/A'}</span>
                            </div>
                        </div>
                    </div>

                    {/* Thông tin khách hàng */}
                    <div className="detail-section">
                        <h4><i className="fas fa-user"></i> Thông tin khách hàng</h4>
                        <div className="detail-grid">
                            <div className="detail-item">
                                <span className="label">Họ tên:</span>
                                <span className="value">{booking.contact_name}</span>
                            </div>
                            <div className="detail-item">
                                <span className="label">Email:</span>
                                <span className="value">{booking.contact_email}</span>
                            </div>
                            <div className="detail-item">
                                <span className="label">Số điện thoại:</span>
                                <span className="value">{booking.contact_phone}</span>
                            </div>
                            <div className="detail-item">
                                <span className="label">Tài khoản:</span>
                                <span className="value">
                                    {booking.username || booking.full_name || 'Khách vãng lai'}
                                </span>
                            </div>
                        </div>
                        
                        {booking.special_requests && (
                            <div className="detail-item full-width">
                                <span className="label">Yêu cầu đặc biệt:</span>
                                <span className="value">{booking.special_requests}</span>
                            </div>
                        )}
                    </div>

                    {/* Chi tiết giá */}
                    <div className="detail-section">
                        <h4><i className="fas fa-receipt"></i> Chi tiết giá</h4>
                        <div className="price-breakdown">
                            {booking.BookingDetails && booking.BookingDetails.length > 0 ? (
                                booking.BookingDetails.map((detail, index) => (
                                    <div key={index} className="price-row">
                                        <span className="price-label">
                                            {getPriceTypeLabel(detail.price_type)} ({detail.quantity}):
                                        </span>
                                        <span className="price-value">
                                            {formatCurrency(detail.unit_price)} x {detail.quantity} = {formatCurrency(detail.subtotal)}
                                        </span>
                                    </div>
                                ))
                            ) : (
                                <p className="no-data">Không có chi tiết giá</p>
                            )}
                            
                            <div className="price-row subtotal">
                                <span className="price-label">Tạm tính:</span>
                                <span className="price-value">{formatCurrency(booking.original_amount)}</span>
                            </div>
                            
                            {booking.discount_amount > 0 && (
                                <div className="price-row discount">
                                    <span className="price-label">
                                        Giảm giá:
                                        {booking.promotion_code && <span className="promo-code">({booking.promotion_code})</span>}
                                    </span>
                                    <span className="price-value text-danger">
                                        -{formatCurrency(booking.discount_amount)}
                                    </span>
                                </div>
                            )}
                            
                            <div className="price-row total">
                                <span className="price-label">Tổng cộng:</span>
                                <span className="price-value">{formatCurrency(booking.final_amount)}</span>
                            </div>
                        </div>
                    </div>

                    {/* Trạng thái */}
                    <div className="detail-section">
                        <h4><i className="fas fa-info-circle"></i> Trạng thái</h4>
                        <div className="detail-grid">
                            <div className="detail-item">
                                <span className="label">Trạng thái booking:</span>
                                <span className={`value status-${booking.status}`}>
                                    {getStatusLabel(booking.status)}
                                </span>
                            </div>
                            <div className="detail-item">
                                <span className="label">Trạng thái thanh toán:</span>
                                <span className={`value payment-${booking.payment_status}`}>
                                    {getPaymentStatusLabel(booking.payment_status)}
                                </span>
                            </div>
                            {booking.payment_method && (
                                <div className="detail-item">
                                    <span className="label">Phương thức thanh toán:</span>
                                    <span className="value">{booking.payment_method}</span>
                                </div>
                            )}
                            {booking.vnp_TransactionNo && (
                                <div className="detail-item">
                                    <span className="label">Mã giao dịch:</span>
                                    <span className="value">{booking.vnp_TransactionNo}</span>
                                </div>
                            )}
                            <div className="detail-item">
                                <span className="label">Ngày đặt:</span>
                                <span className="value">{formatDate(booking.created_at)}</span>
                            </div>
                            <div className="detail-item">
                                <span className="label">Cập nhật lần cuối:</span>
                                <span className="value">{formatDate(booking.updated_at)}</span>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div className="modal-footer">
                    <button onClick={onClose} className="btn btn-secondary">
                        Đóng
                    </button>
                </div>
            </div>
        </div>
    );
};

export default BookingDetailModal;