import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import '../styles/PaymentPage.css';


const PaymentResultPage = () => {
    const [searchParams] = useSearchParams();
    const [status, setStatus] = useState('loading');
    const [message, setMessage] = useState('Đang xử lý kết quả thanh toán...');

    useEffect(() => {
        // Đọc trạng thái và thông báo trực tiếp từ URL
        const paymentStatus = searchParams.get('status');
        const paymentMessage = searchParams.get('message');
        const responseCode = searchParams.get('code');

        if (paymentStatus === 'success') {
            setStatus('success');
            setMessage('Giao dịch của bạn đã được xác nhận thành công!');
        } else if (paymentStatus === 'failed') {
            setStatus('error');
            setMessage(`Thanh toán thất bại. Mã lỗi: ${responseCode}. Vui lòng thử lại.`);
        } else if (paymentStatus === 'error') {
            setStatus('error');
            // Giải mã message nếu có
            const decodedMessage = paymentMessage ? decodeURIComponent(paymentMessage) : 'Đã xảy ra lỗi không xác định.';
            setMessage(`Đã xảy ra lỗi: ${decodedMessage}`);
        } else {
            setStatus('error');
            setMessage('Không nhận được trạng thái thanh toán hợp lệ.');
        }
    }, [searchParams]);

    return (
        <div className="payment-result-container">
            <div className="payment-result-card">
                {status === 'loading' && <div className="spinner"></div>}
                {status === 'success' && <div className="icon success-icon">✓</div>}
                {status === 'error' && <div className="icon error-icon">✗</div>}
                
                <h1 className={status}>
                    {status === 'success' ? 'Thanh toán thành công' : 'Thanh toán thất bại'}
                </h1>
                <p>{message}</p>
                
                <Link to="/profile/my-bookings" className="btn-primary">Xem lịch sử đặt tour</Link>
            </div>
        </div>
    );
};

export default PaymentResultPage;