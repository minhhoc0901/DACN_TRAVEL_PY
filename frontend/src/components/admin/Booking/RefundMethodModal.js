import React, { useState } from 'react';
import '../../../styles/Booking/RefundMethodModal.css';

const RefundMethodModal = ({ 
    isOpen, 
    onClose, 
    onConfirm, 
    booking, 
    refundAmount, 
    refundPercent,
    submitting 
}) => {
    const [selectedMethod, setSelectedMethod] = useState('credit');

    if (!isOpen || !booking) return null;

    const handleConfirm = () => {
        if (!selectedMethod) {
            alert('Vui lòng chọn phương thức hoàn tiền!');
            return;
        }
        onConfirm(selectedMethod);
    };

    const processingFee = selectedMethod === 'bank_transfer' 
        ? Math.round(refundAmount * 0.02) 
        : 0;

    const finalRefundAmount = refundAmount - processingFee;

    // Helper: Format số tiền
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('vi-VN').format(amount);
    };

    // Helper: Format ngày
    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('vi-VN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    };

    // Tính số ngày còn lại đến ngày khởi hành
    const calculateDaysUntilDeparture = () => {
        if (!booking.departure_date) return 0;
        const departureDate = new Date(booking.departure_date);
        const now = new Date();
        const diffTime = departureDate - now;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays > 0 ? diffDays : 0;
    };

    const daysUntilDeparture = calculateDaysUntilDeparture();

    // Xác định chính sách dựa trên số ngày
    const getPolicyMessage = () => {
        if (daysUntilDeparture >= 15) {
            return `Hủy trước 15 ngày → Hoàn 100%`;
        } else if (daysUntilDeparture >= 7) {
            return `Hủy từ 7-14 ngày trước → Hoàn 80%`;
        } else if (daysUntilDeparture >= 3) {
            return `Hủy từ 3-6 ngày trước → Hoàn 50%`;
        } else {
            return `Hủy dưới 3 ngày → Không hoàn tiền`;
        }
    };

    return (
        <div className="refund-modal-overlay" onClick={onClose}>
            <div className="refund-modal-content" onClick={e => e.stopPropagation()}>
                {/* ===== HEADER ===== */}
                <div className="refund-modal-header">
                    <h3>⚠️ Xác nhận hủy tour</h3>
                    <button onClick={onClose} className="refund-modal-close">&times;</button>
                </div>

                {/* ===== BODY ===== */}
                <div className="refund-modal-body">
                    {/* THÔNG TIN BOOKING */}
                    <div className="refund-info-section">
                        <h4>📋 Thông tin booking</h4>
                        <div className="refund-info-grid">
                            <div className="refund-info-item">
                                <span className="label">Mã booking:</span>
                                <span className="value">#{booking.id}</span>
                            </div>
                            <div className="refund-info-item">
                                <span className="label">Tour:</span>
                                <span className="value">{booking.tour_name || booking.destination}</span>
                            </div>
                            <div className="refund-info-item">
                                <span className="label">Ngày đặt:</span>
                                <span className="value">{formatDate(booking.booking_date || booking.created_at)}</span>
                            </div>
                            <div className="refund-info-item">
                                <span className="label">Ngày khởi hành:</span>
                                <span className="value">{formatDate(booking.departure_date)}</span>
                            </div>
                            <div className="refund-info-item">
                                <span className="label">Tổng tiền đã thanh toán:</span>
                                <span className="value highlight">
                                    {formatCurrency(booking.final_amount)} VNĐ
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* CHÍNH SÁCH HOÀN TIỀN */}
                    <div className="refund-policy-section">
                        <h4>💰 Chính sách hoàn tiền</h4>
                        
                        {/* Hiển thị policy message */}
                        <div className="policy-message">
                            <i className="fas fa-calendar-alt"></i>
                            <div className="policy-message-content">
                                <strong>Còn {daysUntilDeparture} ngày đến ngày khởi hành</strong>
                                <p>{getPolicyMessage()}</p>
                            </div>
                        </div>

                        <div className="refund-policy-info">
                            <div className="policy-item">
                                <i className="fas fa-percentage"></i>
                                <span>Tỷ lệ hoàn</span>
                                <strong>{refundPercent}%</strong>
                            </div>
                            <div className="policy-item">
                                <i className="fas fa-money-bill-wave"></i>
                                <span>Số tiền hoàn</span>
                                <strong className="refund-amount">
                                    {formatCurrency(refundAmount)} VNĐ
                                </strong>
                            </div>
                        </div>

                        <div className="refund-notice">
                            <i className="fas fa-info-circle"></i>
                            <p>Yêu cầu hủy tour sẽ được gửi đến admin xem xét trong vòng 24-48h.</p>
                        </div>
                    </div>

                    {/* CHỌN PHƯƠNG THỨC HOÀN TIỀN */}
                    <div className="refund-method-section">
                        <h4>🏦 Chọn phương thức nhận tiền hoàn</h4>

                        <label className={`refund-method-option ${selectedMethod === 'credit' ? 'selected' : ''}`}>
                            <input
                                type="radio"
                                name="refundMethod"
                                value="credit"
                                checked={selectedMethod === 'credit'}
                                onChange={() => setSelectedMethod('credit')}
                            />
                            <div className="method-info">
                                <div className="method-header">
                                    <i className="fas fa-wallet"></i>
                                    <strong>Hoàn vào ví Credit</strong>
                                    <span className="badge recommended">Khuyến nghị</span>
                                </div>
                                <p className="method-desc">
                                    Tiền sẽ được hoàn vào ví Credit của bạn trong vòng 24-48h sau khi admin duyệt.
                                    Bạn có thể sử dụng để đặt tour tiếp theo.
                                </p>
                                <div className="method-amount">
                                    <span>Số tiền nhận:</span>
                                    <strong className="amount-highlight">
                                        {formatCurrency(refundAmount)} VNĐ
                                    </strong>
                                </div>
                            </div>
                        </label>

                        <label className={`refund-method-option ${selectedMethod === 'bank_transfer' ? 'selected' : ''}`}>
                            <input
                                type="radio"
                                name="refundMethod"
                                value="bank_transfer"
                                checked={selectedMethod === 'bank_transfer'}
                                onChange={() => setSelectedMethod('bank_transfer')}
                            />
                            <div className="method-info">
                                <div className="method-header">
                                    <i className="fas fa-university"></i>
                                    <strong>Chuyển khoản ngân hàng</strong>
                                </div>
                                <p className="method-desc">
                                    Tiền sẽ được chuyển vào tài khoản ngân hàng của bạn trong 7-10 ngày làm việc 
                                    sau khi admin duyệt.
                                </p>
                                <div className="method-amount">
                                    <span>Phí xử lý (2%):</span>
                                    <span className="fee">
                                        -{formatCurrency(processingFee)} VNĐ
                                    </span>
                                </div>
                                <div className="method-amount">
                                    <span>Số tiền nhận:</span>
                                    <strong className="amount-highlight">
                                        {formatCurrency(finalRefundAmount)} VNĐ
                                    </strong>
                                </div>
                            </div>
                        </label>
                    </div>
                </div>

                {/* ===== FOOTER ===== */}
                <div className="refund-modal-footer">
                    <button 
                        onClick={onClose} 
                        className="refund-btn refund-btn-cancel"
                        disabled={submitting}
                    >
                        <i className="fas fa-times"></i> Hủy bỏ
                    </button>
                    <button 
                        onClick={handleConfirm} 
                        className="refund-btn refund-btn-confirm"
                        disabled={submitting}
                    >
                        {submitting ? (
                            <>
                                <i className="fas fa-spinner fa-spin"></i> Đang xử lý...
                            </>
                        ) : (
                            <>
                                <i className="fas fa-check"></i> Xác nhận hủy tour
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default RefundMethodModal;