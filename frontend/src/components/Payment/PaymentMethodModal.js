import React, { useState, useEffect } from 'react';
import { creditService } from '../../services/creditService';
import '../../styles/Payment/PaymentMethodModal.css';

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
            setSelectedPaymentMethod('vnpay'); // ✅ Reset về VNPay khi mở modal
            loadCreditBalance();
        }
    }, [isOpen]);

    const loadCreditBalance = async () => {
        setLoadingBalance(true);
        try {
            const response = await creditService.getBalance();
            console.log('[PaymentMethodModal] Credit balance response:', response);
            
            if (response.success) {
                const balance = Number(response.data.balance) || 0;
                setCreditBalance(balance);
                
                console.log('[PaymentMethodModal] Comparison:', {
                    balance: balance,
                    amount: amount,
                    isSufficient: balance >= amount
                });
                
                // ✅ FIX: Chỉ cho phép chọn Credit nếu đủ tiền
                if (balance < amount) {
                    setSelectedPaymentMethod('vnpay');
                }
            } else {
                console.error('[PaymentMethodModal] Failed to get balance:', response);
                setCreditBalance(0);
                setSelectedPaymentMethod('vnpay');
            }
        } catch (error) {
            console.error('[PaymentMethodModal] Error loading credit balance:', error);
            setCreditBalance(0);
            setSelectedPaymentMethod('vnpay');
        } finally {
            setLoadingBalance(false);
        }
    };

    const formatCurrency = (value) => {
        return new Intl.NumberFormat('vi-VN', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(value || 0);
    };

    const handleConfirm = () => {
        // ✅ FIX: Kiểm tra lại số dư trước khi xác nhận
        const isSufficient = creditBalance >= amount;
        
        if (selectedPaymentMethod === 'credit' && !isSufficient) {
            alert('❌ Số dư Credit không đủ để thanh toán!');
            return;
        }
        
        console.log('[PaymentMethodModal] Confirming payment:', {
            method: selectedPaymentMethod,
            bookingId,
            amount,
            creditBalance,
            isSufficient
        });
        
        onConfirm(selectedPaymentMethod, bookingId);
    };

    // ✅ FIX: Kiểm tra có đủ điều kiện thanh toán không - ĐẢM BẢO SỐ LIỆU CHÍNH XÁC
    const isCreditSufficient = Number(creditBalance) >= Number(amount);
    const canConfirm = selectedPaymentMethod === 'vnpay' || (selectedPaymentMethod === 'credit' && isCreditSufficient);

    console.log('[PaymentMethodModal] Render state:', {
        isOpen,
        amount: Number(amount),
        creditBalance: Number(creditBalance),
        isCreditSufficient,
        selectedPaymentMethod,
        canConfirm,
        loadingBalance
    });

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
                        <p className="payment-amount">{formatCurrency(amount)} đ</p>
                    </div>

                    {/* PHƯƠNG THỨC THANH TOÁN */}
                    <div className="payment-methods">
                        {/* OPTION 1: VÍ CREDIT */}
                        <label 
                            className={`payment-option ${selectedPaymentMethod === 'credit' ? 'selected' : ''} ${!isCreditSufficient ? 'insufficient' : ''}`}
                            style={{ 
                                cursor: isCreditSufficient ? 'pointer' : 'not-allowed',
                                opacity: isCreditSufficient ? 1 : 0.6
                            }}
                        >
                            <input
                                type="radio"
                                name="paymentMethod"
                                value="credit"
                                checked={selectedPaymentMethod === 'credit'}
                                onChange={(e) => {
                                    // ✅ FIX: Chỉ cho phép chọn nếu đủ tiền
                                    if (isCreditSufficient) {
                                        setSelectedPaymentMethod(e.target.value);
                                    }
                                }}
                                disabled={loading || !isCreditSufficient} // ✅ FIX: Disable nếu không đủ tiền
                            />
                            <div className="option-content">
                                <div className="option-header">
                                    <i className="fas fa-wallet"></i>
                                    <strong>Ví Credit</strong>
                                    {/* ✅ FIX: Hiển thị badge dựa trên logic chính xác */}
                                    {!loadingBalance && (
                                        isCreditSufficient ? (
                                            <span className="badge sufficient">✅ Đủ</span>
                                        ) : (
                                            <span className="badge insufficient">❌ Không đủ</span>
                                        )
                                    )}
                                </div>
                                <div className="option-details">
                                    {loadingBalance ? (
                                        <p className="text-muted">Đang tải số dư...</p>
                                    ) : (
                                        <>
                                            <p>Số dư: <strong className={isCreditSufficient ? 'text-success' : 'text-danger'}>
                                                {formatCurrency(creditBalance)} đ
                                            </strong></p>
                                            {!isCreditSufficient ? (
                                                <p className="text-danger" style={{ fontSize: '13px', marginTop: '5px' }}>
                                                    <i className="fas fa-exclamation-triangle"></i> Thiếu {formatCurrency(amount - creditBalance)} đ
                                                </p>
                                            ) : (
                                                <p className="text-success" style={{ fontSize: '13px', marginTop: '5px' }}>
                                                    <i className="fas fa-check-circle"></i> Đủ để thanh toán
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

                    {/* ✅ FIX: Hiển thị thông báo khi không đủ điều kiện */}
                    {!canConfirm && selectedPaymentMethod === 'credit' && (
                        <div className="payment-warning">
                            <i className="fas fa-info-circle"></i>
                            <span>Vui lòng chọn VNPay hoặc nạp thêm tiền vào ví Credit</span>
                        </div>
                    )}
                </div>

                {/* FOOTER */}
                <div className="payment-modal-footer">
                    <button 
                        onClick={onClose} 
                        className="payment-btn payment-btn-cancel"
                        disabled={loading}
                    >
                        Hủy
                    </button>
                    <button 
                        onClick={handleConfirm} 
                        className="payment-btn payment-btn-confirm"
                        disabled={loading || !canConfirm} // ✅ FIX: Disable nếu không đủ điều kiện
                    >
                        {loading ? (
                            <>
                                <i className="fas fa-spinner fa-spin"></i> Đang xử lý...
                            </>
                        ) : (
                            <>
                                <i className="fas fa-check"></i> Xác nhận thanh toán
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PaymentMethodModal;