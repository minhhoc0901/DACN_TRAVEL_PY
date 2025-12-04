import React, { useState, useEffect } from 'react';
import { creditService } from '../../services/creditService';
import '../../styles/Payment/PaymentMethodModal.css';

/**
 * COMPONENT MODAL CHỌN PHƯƠNG THỨC THANH TOÁN
 * 
 * @param {boolean} isOpen - Modal có đang mở không
 * @param {function} onClose - Callback khi đóng modal
 * @param {function} onConfirm - Callback khi xác nhận thanh toán (paymentMethod, bookingId)
 * @param {number} amount - Số tiền cần thanh toán
 * @param {number} bookingId - ID của booking
 * @param {boolean} loading - Trạng thái đang xử lý
 */
const PaymentMethodModal = ({ 
    isOpen, 
    onClose, 
    onConfirm, 
    amount, 
    bookingId,
    loading = false 
}) => {
    const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('vnpay');
    const [creditBalance, setCreditBalance] = useState(0);
    const [loadingBalance, setLoadingBalance] = useState(true);

    // Fetch số dư Credit khi modal mở
    useEffect(() => {
        if (isOpen) {
            loadCreditBalance();
        }
    }, [isOpen]);

    const loadCreditBalance = async () => {
        try {
            setLoadingBalance(true);
            const response = await creditService.getBalance();
            if (response.success) {
                setCreditBalance(response.data.balance);
            }
        } catch (error) {
            console.error('[PaymentMethodModal] Error loading credit balance:', error);
            setCreditBalance(0);
        } finally {
            setLoadingBalance(false);
        }
    };

    const formatCurrency = (value) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND',
            minimumFractionDigits: 0
        }).format(value || 0);
    };

    const handleConfirm = () => {
        if (selectedPaymentMethod === 'credit' && creditBalance < amount) {
            alert('❌ Số dư Credit không đủ để thanh toán!');
            return;
        }
        
        onConfirm(selectedPaymentMethod, bookingId);
    };

    if (!isOpen) return null;

    return (
        <div className="payment-modal-overlay" onClick={onClose}>
            <div className="payment-modal-content" onClick={(e) => e.stopPropagation()}>
                {/* HEADER */}
                <div className="payment-modal-header">
                    <h3>Chọn phương thức thanh toán</h3>
                    <button 
                        onClick={onClose} 
                        className="payment-close-btn"
                        disabled={loading}
                    >
                        <i className="fas fa-times"></i>
                    </button>
                </div>

                {/* BODY */}
                <div className="payment-modal-body">
                    {/* TỔNG TIỀN */}
                    <div className="payment-total">
                        <h4>Tổng thanh toán</h4>
                        <p className="payment-amount">{formatCurrency(amount)}</p>
                    </div>

                    {/* PHƯƠNG THỨC THANH TOÁN */}
                    <div className="payment-methods">
                        {/* OPTION 1: VÍ CREDIT */}
                        <label className={`payment-option ${selectedPaymentMethod === 'credit' ? 'selected' : ''}`}>
                            <input
                                type="radio"
                                name="paymentMethod"
                                value="credit"
                                checked={selectedPaymentMethod === 'credit'}
                                onChange={(e) => setSelectedPaymentMethod(e.target.value)}
                                disabled={loading}
                            />
                            <div className="option-content">
                                <div className="option-header">
                                    <i className="fas fa-wallet"></i>
                                    <strong>Ví Credit</strong>
                                    {!loadingBalance && creditBalance < amount && (
                                        <span className="badge insufficient">Không đủ</span>
                                    )}
                                </div>
                                <div className="option-details">
                                    {loadingBalance ? (
                                        <p className="text-muted">Đang tải số dư...</p>
                                    ) : (
                                        <>
                                            <p>Số dư: <strong>{formatCurrency(creditBalance)}</strong></p>
                                            {creditBalance >= amount ? (
                                                <p className="text-success">✅ Đủ để thanh toán</p>
                                            ) : (
                                                <p className="text-danger">
                                                    ❌ Thiếu {formatCurrency(amount - creditBalance)}
                                                </p>
                                            )}
                                        </>
                                    )}
                                </div>
                            </div>
                        </label>

                        {/* OPTION 2: VNPAY */}
                        <label className={`payment-option ${selectedPaymentMethod === 'vnpay' ? 'selected' : ''}`}>
                            <input
                                type="radio"
                                name="paymentMethod"
                                value="vnpay"
                                checked={selectedPaymentMethod === 'vnpay'}
                                onChange={(e) => setSelectedPaymentMethod(e.target.value)}
                                disabled={loading}
                            />
                            <div className="option-content">
                                <div className="option-header">
                                    <i className="fas fa-credit-card"></i>
                                    <strong>VNPay</strong>
                                </div>
                                <div className="option-details">
                                    <p>Thanh toán qua cổng VNPay</p>
                                    <p className="text-muted">Hỗ trợ ATM, Visa, MasterCard</p>
                                </div>
                            </div>
                        </label>
                    </div>
                </div>

                {/* FOOTER */}
                <div className="payment-modal-footer">
                    <button 
                        onClick={onClose} 
                        className="btn btn-secondary"
                        disabled={loading}
                    >
                        Hủy
                    </button>
                    <button 
                        onClick={handleConfirm}
                        className="btn btn-primary"
                        disabled={loading || (selectedPaymentMethod === 'credit' && creditBalance < amount)}
                    >
                        {loading ? (
                            <>
                                <i className="fas fa-spinner fa-spin"></i> Đang xử lý...
                            </>
                        ) : (
                            'Xác nhận thanh toán'
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PaymentMethodModal;