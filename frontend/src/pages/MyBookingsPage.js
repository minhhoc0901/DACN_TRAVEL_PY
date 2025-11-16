import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { bookingService } from '../services/bookingService';
import CountdownTimer from '../components/CountdownTimer';
import '../styles/MyBookingsPage.css';

// Component Modal xác nhận (có thể tách ra file riêng nếu muốn)
const ConfirmationModal = ({ isOpen, onClose, onConfirm, title, message, confirmText }) => {
    if (!isOpen) return null;

    return (
        <div className="v2-modal-overlay" onClick={onClose}>
            <div className="v2-modal-content" onClick={e => e.stopPropagation()}>
                <div className="v2-modal-header">
                    <h4>{title}</h4>
                    <button onClick={onClose} className="v2-modal-close-btn">&times;</button>
                </div>
                <div className="v2-modal-body">
                    <p>{message}</p>
                </div>
                <div className="v2-modal-footer">
                    <button onClick={onClose} className="v2-btn v2-btn--secondary">
                        Hủy bỏ
                    </button>
                    <button onClick={onConfirm} className="v2-btn v2-btn--danger">
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
};

const MyBookingsPage = () => {
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    // State cho modal
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalContent, setModalContent] = useState({ title: '', message: '', confirmText: 'Xác nhận' });
    const [onConfirmAction, setOnConfirmAction] = useState(null);

    useEffect(() => {
        bookingService.getMyBookings()
            .then(response => setBookings(response))
            .catch(err => setError(err.message || 'Không thể kết nối đến máy chủ.'))
            .finally(() => setLoading(false));
    }, []);

    const getStatusText = (bookingStatus, paymentStatus) => {
        if (bookingStatus === 'cancelled') return 'Đã hủy';
        if (paymentStatus === 'success') return 'Đã thanh toán';
        if (paymentStatus === 'failed') return 'Thanh toán thất bại';
        if (bookingStatus === 'completed') return 'Hoàn thành';
        return 'Chờ thanh toán';
    };

    const translatePriceType = (type) => {
        const typeMap = { 'adult': 'Người lớn', 'child': 'Trẻ em' };
        return typeMap[type] || type;
    };

    // Mở modal với nội dung và hành động cụ thể
    const openConfirmationModal = (title, message, confirmText, action) => {
        setModalContent({ title, message, confirmText });
        setOnConfirmAction(() => action); // Bọc action trong một hàm để lưu trữ
        setIsModalOpen(true);
    };

    // Xử lý khi người dùng xác nhận
    const handleConfirm = () => {
        if (onConfirmAction) {
            onConfirmAction();
        }
        setIsModalOpen(false);
    };

    const handleCancelBooking = (bookingId) => {
        const action = async () => {
            try {
                await bookingService.cancelBooking(bookingId);
                setBookings(current =>
                    current.map(b =>
                        b.id === bookingId ? { ...b, status: 'cancelled' } : b
                    )
                );
            } catch (err) {
                // Có thể hiển thị thông báo lỗi bằng một modal khác hoặc toast
                console.error(err);
                alert(err.message);
            }
        };
        openConfirmationModal(
            'Xác nhận Hủy Tour',
            'Bạn có chắc chắn muốn hủy đơn đặt tour này không?',
            'Đồng ý Hủy',
            action
        );
    };

    const handleEditBooking = (booking) => {
        const action = async () => {
            try {
                await bookingService.cancelBooking(booking.id);
                setBookings(current =>
                    current.map(b =>
                        b.id === booking.id ? { ...b, status: 'cancelled' } : b
                    )
                );
                navigate(`/booking/${booking.tour_id}`, {
                    state: {
                        prefillData: booking.details
                    }
                });
            } catch (err) {
                alert(err.message);
            }
        };
        openConfirmationModal(
            'Xác nhận Chỉnh sửa',
            'Chỉnh sửa sẽ hủy đơn hàng hiện tại và tạo một đơn mới để bạn thay đổi. Bạn có muốn tiếp tục?',
            'Tiếp tục Sửa',
            action
        );
    };

    const handleDeleteBooking = (bookingId) => {
        const action = async () => {
            try {
                await bookingService.hideBooking(bookingId);
                setBookings(current => current.filter(b => b.id !== bookingId));
            } catch (err) {
                alert(err.message);
            }
        };
        openConfirmationModal(
            'Xác nhận Xóa Đơn',
            'Hành động này sẽ xóa vĩnh viễn đơn đặt tour. Bạn có chắc chắn muốn tiếp tục?',
            'Xóa vĩnh viễn',
            action
        );
    };

    const handleViewInvoice = (bookingId) => {
        // Chuyển hướng sang trang hóa đơn hoặc mở modal (tùy bạn muốn UI thế nào)
        // Ví dụ chuyển hướng:
        navigate(`/bookings/invoice/${bookingId}`);
    };

    const handleDownloadInvoice = async (bookingId) => {
        try {
            // Gọi API backend trả về file PDF
            const response = await bookingService.downloadInvoice(bookingId);
            // Tạo link download file PDF
            const url = window.URL.createObjectURL(new Blob([response], { type: 'application/pdf' }));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `invoice_${bookingId}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.parentNode.removeChild(link);
        } catch (err) {
            alert('Không thể tải hóa đơn.');
        }
    };

    // Hàm xử lý khi hết giờ
    const handleExpire = (bookingId) => {
        console.log(`[EXPIRE] handleExpire được gọi cho booking ID: ${bookingId}. Cập nhật UI thành 'cancelled'.`);

        bookingService.getMyBookings()
            .then(response => setBookings(response))
            .catch(err => setError(err.message || 'Không thể cập nhật danh sách đơn hàng.'));
    };

    if (loading) return <div className="v2-my-bookings-container"><div className="v2-loader"></div></div>;
    if (error) return <div className="v2-my-bookings-container"><p className="v2-error-message">{error}</p></div>;

    return (
        <>
            <ConfirmationModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onConfirm={handleConfirm}
                {...modalContent}
            />
            <div className="v2-my-bookings-container">
                <h1>Lịch sử đặt tour</h1>
                {bookings.length === 0 ? (
                    <div className="v2-no-bookings">
                        <p>Bạn chưa có đơn đặt tour nào.</p>
                        <Link to="/tours" className="v2-btn v2-btn--primary">Khám phá các tour</Link>
                    </div>
                ) : (
                    <div className="v2-bookings-list">
                        {bookings.map(booking => {
                            // 1. Tạo đối tượng Date từ chuỗi backend. Trình duyệt sẽ tự hiểu đây là giờ địa phương.
                            const localDate = new Date(booking.created_at.replace(' ', 'T'));

                            // 2. Lấy timestamp UTC từ đối tượng Date vừa tạo.
                            const utcTimestamp = localDate.getTime();

                            // 3. Tính thời gian hết hạn.
                            const expiryTimestamp = utcTimestamp + 15 * 60 * 1000;
                            const isExpired = Date.now() > expiryTimestamp;
                            return (
                                <div key={booking.id} className={`v2-booking-card status-${booking.status}`}>
                                    <img src={`http://localhost:5000${booking.tour_image}`} alt={booking.tour_name} className="v2-booking-card-img" />
                                    <div className="v2-booking-card-body">
                                        <span className={`v2-booking-status status-text-${booking.status} payment-status-${booking.payment_status}`}>
                                            {booking.status === 'pending_payment' && isExpired
                                                ? 'Đã hết hạn'
                                                : getStatusText(booking.status, booking.payment_status)}
                                        </span>
                                        <h3 className="v2-booking-tour-name">{booking.tour_name}</h3>

                                        {/* HIỂN THỊ ĐỒNG HỒ ĐẾM NGƯỢC */}
                                        {booking.status === 'pending_payment' && !isExpired && (
                                            <CountdownTimer
                                                expiryTimestamp={expiryTimestamp}
                                                onExpire={() => handleExpire(booking.id)}
                                            />
                                        )}

                                        <div className="v2-booking-details-section">
                                            {Array.isArray(booking.details) && booking.details.map((detail, index) => (
                                                <p key={index} className="v2-booking-detail-item">
                                                    {translatePriceType(detail.price_type)}: {detail.quantity} x {new Intl.NumberFormat('vi-VN').format(detail.unit_price)} VNĐ
                                                </p>
                                            ))}
                                            {booking.discount_amount > 0 && (
                                                <p className="v2-booking-detail-discount">
                                                    Giảm giá: -{new Intl.NumberFormat('vi-VN').format(booking.discount_amount)} VNĐ
                                                </p>
                                            )}
                                        </div>

                                        <p className="v2-booking-total">
                                            <strong>Tổng tiền:</strong> {new Intl.NumberFormat('vi-VN').format(booking.final_amount)} VNĐ
                                        </p>

                                        <div className="v2-booking-card-actions">
                                            {booking.status === 'pending_payment' && (
                                                <>
                                                    <Link to={`/payment/${booking.id}`} className="v2-btn v2-btn--primary">Thanh toán</Link>
                                                    <button onClick={() => handleEditBooking(booking)} className="v2-btn v2-btn--warning">Sửa</button>
                                                    <button onClick={() => handleCancelBooking(booking.id)} className="v2-btn v2-btn--danger">Hủy</button>
                                                </>
                                            )}
                                            {booking.payment_status === 'success' && booking.status !== 'cancelled' && (
                                                <>
                                                    <Link to={`/tours/${booking.tour_id}`} className="v2-btn v2-btn--secondary">Xem chi tiết</Link>
                                                    <button onClick={() => handleViewInvoice(booking.id)} className="v2-btn v2-btn--info">Xem hóa đơn</button>
                                                    <button onClick={() => handleDownloadInvoice(booking.id)} className="v2-btn v2-btn--primary">Tải hóa đơn (PDF)</button>
                                                </>
                                            )}
                                            {booking.status === 'cancelled' && (
                                                <>
                                                    <Link to={`/booking/${booking.tour_id}`} state={{ prefillData: booking.details }} className="v2-btn v2-btn--secondary">Đặt lại</Link>
                                                    <button onClick={() => handleDeleteBooking(booking.id)} className="v2-btn v2-btn--danger">Xóa</button>
                                                </>
                                            )}
                                            {booking.payment_status === 'failed' && booking.status !== 'cancelled' && (
                                                <button onClick={() => handleDeleteBooking(booking.id)} className="v2-btn v2-btn--danger">Xóa</button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </>
    );
};

export default MyBookingsPage;