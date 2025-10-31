import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { paymentService } from '../services/paymentService'; // Tạo service này
import '../styles/PaymentPage.css';

const PaymentPage = () => {
    const { bookingId } = useParams();
    const [status, setStatus] = useState('Đang khởi tạo thanh toán...');
    const [error, setError] = useState('');

    useEffect(() => {
        if (!bookingId) {
            setError('Không tìm thấy thông tin đặt tour.');
            return;
        }

        const createPayment = async () => {
            try {
                // Gọi service để lấy URL thanh toán từ backend
                const result = await paymentService.createPaymentUrl({ bookingId });

                if (result.success && result.paymentUrl) {
                    setStatus('Đang chuyển hướng đến cổng thanh toán...');
                    // Chuyển hướng người dùng đến trang VNPay
                    window.location.href = result.paymentUrl;
                } else {
                    throw new Error(result.message || 'Không thể tạo link thanh toán.');
                }
            } catch (err) {
                console.error('Payment creation failed:', err);
                setError(err.message);
                setStatus('Khởi tạo thanh toán thất bại.');
            }
        };

        createPayment();
    }, [bookingId]);

    return (
        <div className="payment-status-container">
            <div className="payment-status-box">
                <h2>{status}</h2>
                {error ? (
                    <p className="error-message">{error}</p>
                ) : (
                    <p>Vui lòng không đóng cửa sổ này. Bạn sẽ được tự động chuyển hướng.</p>
                )}
                <div className="spinner"></div>
            </div>
        </div>
    );
};

export default PaymentPage;