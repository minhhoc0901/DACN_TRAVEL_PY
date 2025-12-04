import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { bookingService } from '../services/bookingService';
import '../styles/VerifyInvoicePage.css'; 
const VerifyInvoicePage = () => {
    // 1. Lấy token từ URL bằng hook useParams
    const { token } = useParams();

    // 2. Quản lý các trạng thái của component
    const [loading, setLoading] = useState(true);
    const [booking, setBooking] = useState(null);
    const [error, setError] = useState('');

    useEffect(() => {
        // 3. Hàm để gọi API và cập nhật state
        const verifyBooking = async () => {
            if (!token) {
                setError('Không tìm thấy mã xác thực.');
                setLoading(false);
                return;
            }

            try {
                const result = await bookingService.verifyByToken(token);
                if (result.success) {
                    setBooking(result.booking);
                } else {
                    // Trường hợp API trả về success: false
                    setError(result.message || 'Hóa đơn không hợp lệ.');
                }
            } catch (err) {
                // Trường hợp API ném lỗi (network error, 500...)
                setError(err.message || 'Không thể kết nối đến máy chủ.');
            } finally {
                setLoading(false);
            }
        };

        verifyBooking();
    }, [token]); // Chạy lại effect nếu token thay đổi

    // 4. Render giao diện dựa trên state
    if (loading) {
        return <div className="verify-container status-loading">Đang xác thực hóa đơn...</div>;
    }

    if (error) {
        return (
            <div className="verify-container status-error">
                <div className="icon error-icon">✖</div>
                <h2>Xác thực thất bại</h2>
                <p>{error}</p>
            </div>
        );
    }

    if (booking) {
        return (
            <div className="verify-container status-success">
                <div className="icon success-icon">✔</div>
                <h2>Hóa đơn hợp lệ</h2>
                <div className="booking-details">
                    <p><strong>Mã hóa đơn:</strong> #{booking.id}</p>
                    <p><strong>Khách hàng:</strong> {booking.user_name || booking.contact_name}</p>
                    <p><strong>Tour:</strong> {booking.tour_name}</p>
                    <p><strong>Ngày khởi hành:</strong> {new Date(booking.departure_date).toLocaleDateString('vi-VN')}</p>
                    <p><strong>Tổng tiền:</strong> {new Intl.NumberFormat('vi-VN').format(booking.final_amount)} VNĐ</p>
                    <p><strong>Trạng thái:</strong> {booking.status === 'confirmed' ? 'Đã xác nhận' : 'Chờ xử lý'}</p>
                </div>
            </div>
        );
    }

    return null; // Trường hợp không có gì để hiển thị
};

export default VerifyInvoicePage;