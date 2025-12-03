import React, { useState } from 'react';
import '../../../styles/Booking/StatusUpdateModal.css';

const StatusUpdateModal = ({ booking, onClose, onSubmit }) => {
    const [selectedStatus, setSelectedStatus] = useState(booking.status);
    const [reason, setReason] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (selectedStatus === 'cancelled' && !reason.trim()) {
            alert('Vui lòng nhập lý do hủy');
            return;
        }

        setSubmitting(true);
        try {
            await onSubmit(selectedStatus, reason);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content status-update-modal" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h3>Cập nhật trạng thái Booking #{booking.id}</h3>
                    <button onClick={onClose} className="btn-close">
                        <i className="fas fa-times"></i>
                    </button>
                </div>
                
                <form onSubmit={handleSubmit}>
                    <div className="modal-body">
                        <div className="form-group">
                            <label>Khách hàng:</label>
                            <div className="customer-info">
                                <strong>{booking.contact_name}</strong>
                                <span>{booking.contact_email}</span>
                            </div>
                        </div>

                        <div className="form-group">
                            <label>Tour:</label>
                            <div className="tour-info">
                                <strong>{booking.destination}</strong>
                            </div>
                        </div>

                        <div className="form-group">
                            <label>Trạng thái hiện tại:</label>
                            <div className={`current-status status-${booking.status}`}>
                                {booking.status === 'pending_payment' && 'Chờ thanh toán'}
                                {booking.status === 'confirmed' && 'Đã xác nhận'}
                                {booking.status === 'cancelled' && 'Đã hủy'}
                            </div>
                        </div>

                        <div className="form-group">
                            <label>Trạng thái mới: <span className="required">*</span></label>
                            <select
                                value={selectedStatus}
                                onChange={(e) => setSelectedStatus(e.target.value)}
                                className="form-select"
                                required
                            >
                                <option value="pending_payment">Chờ thanh toán</option>
                                <option value="confirmed">Xác nhận</option>
                                <option value="cancelled">Hủy booking</option>
                            </select>
                        </div>

                        {selectedStatus === 'cancelled' && (
                            <div className="form-group">
                                <label>Lý do hủy: <span className="required">*</span></label>
                                <textarea
                                    value={reason}
                                    onChange={(e) => setReason(e.target.value)}
                                    placeholder="Nhập lý do hủy booking..."
                                    className="form-textarea"
                                    rows="4"
                                    required
                                />
                                <small className="form-hint">
                                    Lý do này sẽ được gửi đến khách hàng qua thông báo
                                </small>
                            </div>
                        )}

                        {selectedStatus === 'confirmed' && (
                            <div className="alert alert-info">
                                <i className="fas fa-info-circle"></i>
                                Khách hàng sẽ nhận được thông báo xác nhận booking qua hệ thống
                            </div>
                        )}
                    </div>
                    
                    <div className="modal-footer">
                        <button 
                            type="button" 
                            onClick={onClose} 
                            className="btn btn-secondary"
                            disabled={submitting}
                        >
                            Hủy
                        </button>
                        <button 
                            type="submit" 
                            className={`btn btn-primary ${submitting ? 'loading' : ''}`}
                            disabled={submitting}
                        >
                            {submitting ? (
                                <>
                                    <span className="spinner"></span>
                                    Đang xử lý...
                                </>
                            ) : (
                                <>
                                    <i className="fas fa-check"></i>
                                    Cập nhật
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default StatusUpdateModal;