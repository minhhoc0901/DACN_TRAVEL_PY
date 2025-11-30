import React, { useState } from 'react';
import '../../../styles/Booking/RefundMethodModal.css';

const RefundMethodModal = ({ isOpen, onClose, onConfirm, booking, refundAmount, refundPercent }) => {
    const [refundMethod, setRefundMethod] = useState('credit');
    
    if (!isOpen) return null;

    const processingFee = Math.ceil(refundAmount * 0.02);
    const bankTransferAmount = refundAmount - processingFee;

    const handleConfirm = () => {
        onConfirm(refundMethod);
    };

    return (
        <div className="v2-modal-overlay" onClick={onClose}>
            <div className="v2-modal-content" onClick={e => e.stopPropagation()}>
                <div className="v2-modal-header">
                    <h4>⚠️ Xác nhận Hủy Tour Đã Thanh Toán</h4>
                    <button onClick={onClose} className="v2-modal-close-btn">&times;</button>
                </div>
                
                <div className="v2-modal-body">
                    <div className="refund-method-selection">
                        <h4>Chọn hình thức hoàn tiền</h4>
                        <p className="refund-info">
                            Số tiền được hoàn: <strong>{refundAmount.toLocaleString('vi-VN')} VNĐ</strong> ({refundPercent}%)
                        </p>

                        <div className="refund-options">
                            {/* OPTION 1: Credit */}
                            <label className={`refund-option ${refundMethod === 'credit' ? 'selected' : ''}`}>
                                <input
                                    type="radio"
                                    name="refundMethod"
                                    value="credit"
                                    checked={refundMethod === 'credit'}
                                    onChange={(e) => setRefundMethod(e.target.value)}
                                />
                                <div className="option-content">
                                    <div className="option-header">
                                        <i className="bi bi-wallet2"></i>
                                        <strong>Hoàn vào Ví Credit</strong>
                                        <span className="badge instant">Ngay lập tức</span>
                                    </div>
                                    <div className="option-details">
                                        <p>✅ Nhận ngay: <strong>{refundAmount.toLocaleString('vi-VN')} VNĐ</strong></p>
                                        <p>✅ Không mất phí xử lý</p>
                                        <p>✅ Dùng đặt tour tiếp trong hệ thống</p>
                                        <p className="text-muted">* Có thể rút về ngân hàng sau</p>
                                    </div>
                                </div>
                            </label>

                            {/* OPTION 2: Bank Transfer */}
                            <label className={`refund-option ${refundMethod === 'bank_transfer' ? 'selected' : ''}`}>
                                <input
                                    type="radio"
                                    name="refundMethod"
                                    value="bank_transfer"
                                    checked={refundMethod === 'bank_transfer'}
                                    onChange={(e) => setRefundMethod(e.target.value)}
                                />
                                <div className="option-content">
                                    <div className="option-header">
                                        <i className="bi bi-bank"></i>
                                        <strong>Hoàn về Ngân hàng</strong>
                                        <span className="badge pending">7-10 ngày</span>
                                    </div>
                                    <div className="option-details">
                                        <p>💰 Số tiền nhận: <strong>{bankTransferAmount.toLocaleString('vi-VN')} VNĐ</strong></p>
                                        <p>⚠️ Phí xử lý 2%: <span className="text-danger">-{processingFee.toLocaleString('vi-VN')} VNĐ</span></p>
                                        <p>⏳ Thời gian: 7-10 ngày làm việc</p>
                                        <p className="text-muted">* Cần admin duyệt trước khi chuyển</p>
                                    </div>
                                </div>
                            </label>
                        </div>

                        <div className="refund-note">
                            <i className="bi bi-info-circle"></i>
                            <p>
                                <strong>Lưu ý:</strong> Chính sách hoàn tiền dựa trên số ngày trước khởi hành:
                                <br />• ≥7 ngày: Hoàn 80%
                                <br />• 3-6 ngày: Hoàn 50%
                                <br />• &lt;3 ngày: Không hoàn tiền
                            </p>
                        </div>
                    </div>
                </div>

                <div className="v2-modal-footer">
                    <button onClick={onClose} className="v2-btn v2-btn--secondary">
                        Hủy bỏ
                    </button>
                    <button onClick={handleConfirm} className="v2-btn v2-btn--danger">
                        Xác nhận Hủy Tour
                    </button>
                </div>
            </div>
        </div>
    );
};

export default RefundMethodModal;