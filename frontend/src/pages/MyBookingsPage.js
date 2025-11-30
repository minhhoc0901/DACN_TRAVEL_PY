import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { bookingService } from '../services/bookingService';
import { paymentService } from '../services/paymentService'; 
import CountdownTimer from '../components/CountdownTimer';
import ReviewModal from '../components/ItineraryDetail/RatingModal';
import RefundMethodModal from '../components/admin/Booking/RefundMethodModal'; 
import PaymentMethodModal from '../components/Payment/PaymentMethodModal'; 
import { toast, ToastContainer } from 'react-toastify'; 
import 'react-toastify/dist/ReactToastify.css'; 
import '../styles/Booking/MyBookingsPage.css';

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
                    {typeof message === 'string' ? (
                        <p style={{ whiteSpace: 'pre-wrap' }}>{message}</p>
                    ) : (
                        <div>{message}</div>
                    )}
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

    // State cho modal xác nhận
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalContent, setModalContent] = useState({ title: '', message: '', confirmText: 'Xác nhận' });
    const [onConfirmAction, setOnConfirmAction] = useState(null);

    // State cho Review Modal
    const [showReviewModal, setShowReviewModal] = useState(false);
    const [selectedBookingForReview, setSelectedBookingForReview] = useState(null);
    const [rating, setRating] = useState(0);
    const [reviewText, setReviewText] = useState('');
    const [selectedReviewFiles, setSelectedReviewFiles] = useState([]);

    // STATE CHO REFUND METHOD MODAL
    const [showRefundModal, setShowRefundModal] = useState(false);
    const [selectedBookingForCancel, setSelectedBookingForCancel] = useState(null);
    const [refundAmount, setRefundAmount] = useState(0);
    const [refundPercent, setRefundPercent] = useState(0);

    // STATE CHO PAYMENT METHOD MODAL
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [selectedBookingForPayment, setSelectedBookingForPayment] = useState(null);
    const [processingPayment, setProcessingPayment] = useState(false);

    useEffect(() => {
        bookingService.getMyBookings()
            .then(response => setBookings(response))
            .catch(err => setError(err.message || 'Không thể kết nối đến máy chủ.'))
            .finally(() => setLoading(false));
    }, []);

    const getStatusText = (bookingStatus, paymentStatus) => {
        if (bookingStatus === 'cancelled') return 'Đã hủy';
        if (bookingStatus === 'completed') return 'Đã hoàn thành';
        if (paymentStatus === 'success') return 'Đã thanh toán';
        if (paymentStatus === 'failed') return 'Thanh toán thất bại';
        return 'Chờ thanh toán';
    };

    const translatePriceType = (type) => {
        const typeMap = { 'adult': 'Người lớn', 'child': 'Trẻ em' };
        return typeMap[type] || type;
    };

    const openConfirmationModal = (title, message, confirmText, action) => {
        setModalContent({ title, message, confirmText });
        setOnConfirmAction(() => action);
        setIsModalOpen(true);
    };

    const handleConfirm = () => {
        if (onConfirmAction) {
            onConfirmAction();
        }
        setIsModalOpen(false);
    };

    const handleCancelUnpaidBooking = (bookingId) => {
        const action = async () => {
            try {
                await bookingService.cancelBooking(bookingId);
                toast.success('Hủy booking thành công!', { autoClose: 3000 });
                const response = await bookingService.getMyBookings();
                setBookings(response);
            } catch (err) {
                toast.error(err.message || 'Có lỗi xảy ra khi hủy booking');
            }
        };

        openConfirmationModal(
            'Xác nhận Hủy Booking',
            'Bạn có chắc chắn muốn hủy đơn đặt tour này không?\nBooking chưa thanh toán sẽ được hủy miễn phí.',
            'Đồng ý Hủy',
            action
        );
    };

    //  handleCancelPaidBooking
    const handleCancelPaidBooking = (booking) => {
        const now = new Date();
        const departureDate = new Date(booking.departure_date);
        const daysUntilDeparture = Math.ceil((departureDate - now) / (1000 * 60 * 60 * 24));
        
        let calculatedRefundPercent = 0;
        if (daysUntilDeparture >= 7) calculatedRefundPercent = 80;
        else if (daysUntilDeparture >= 3) calculatedRefundPercent = 50;
        
        const calculatedRefundAmount = Math.round(booking.final_amount * calculatedRefundPercent / 100);

        // LƯU STATE VÀ MỞ MODAL
        setSelectedBookingForCancel(booking);
        setRefundAmount(calculatedRefundAmount);
        setRefundPercent(calculatedRefundPercent);
        setShowRefundModal(true);
    };

    // XỬ LÝ KHI USER XÁC NHẬN TRONG REFUND MODAL
    const handleConfirmRefund = async (refundMethod) => {
        try {
            setShowRefundModal(false);

            await bookingService.cancelPaidBooking(selectedBookingForCancel.id, refundMethod);
            
            if (refundMethod === 'credit') {
                toast.success(
                    `✅ Đã hoàn ${refundAmount.toLocaleString('vi-VN')} VNĐ vào Ví Credit!`,
                    { autoClose: 5000 }
                );
            } else if (refundMethod === 'bank_transfer') {
                const processingFee = Math.ceil(refundAmount * 0.02);
                const bankTransferAmount = refundAmount - processingFee;
                toast.info(
                    `⏳ Yêu cầu hoàn tiền đang chờ xử lý. Bạn sẽ nhận ${bankTransferAmount.toLocaleString('vi-VN')} VNĐ trong 7-10 ngày.`,
                    { autoClose: 7000 }
                );
            }
            
            const response = await bookingService.getMyBookings();
            setBookings(response);
        } catch (err) {
            toast.error(err.message || 'Không thể hủy booking');
        }
    };

    const handleEditUnpaidBooking = (booking) => {
        const action = async () => {
            try {
                await bookingService.cancelBooking(booking.id);
                toast.info('Đang chuyển hướng để sửa booking...', { autoClose: 2000 });
                
                navigate(`/booking/${booking.tour_id}`, {
                    state: {
                        prefillData: booking.details,
                        departureId: booking.tour_departure_id,
                        specialRequests: booking.special_requests
                    }
                });
            } catch (err) {
                toast.error(err.message || 'Không thể sửa booking');
            }
        };

        openConfirmationModal(
            '⚠️ Xác nhận Sửa Booking',
            `Chỉnh sửa booking sẽ HỦY đơn hàng hiện tại và tạo một đơn mới với thông tin bạn thay đổi.\n\n📋 Thông tin booking:\n- Tour: ${booking.tour_name || booking.destination || 'N/A'}\n- Ngày khởi hành: ${new Date(booking.departure_date).toLocaleDateString('vi-VN')}\n- Tổng tiền: ${booking.final_amount.toLocaleString('vi-VN')} VNĐ\n\nBạn có muốn tiếp tục?`,
            'Tiếp tục Sửa',
            action
        );
    };

    const handleDeleteBooking = (bookingId) => {
        const action = async () => {
            try {
                await bookingService.hideBooking(bookingId);
                setBookings(current => current.filter(b => b.id !== bookingId));
                toast.success('Đã xóa booking thành công!');
            } catch (err) {
                toast.error(err.message || 'Không thể xóa booking');
            }
        };

        openConfirmationModal(
            '⚠️ Xác nhận Xóa Booking',
            'Hành động này sẽ xóa vĩnh viễn đơn đặt tour khỏi danh sách của bạn.\nBạn có chắc chắn muốn tiếp tục?',
            'Xóa vĩnh viễn',
            action
        );
    };

    const handleViewInvoice = (bookingId) => {
        navigate(`/bookings/invoice/${bookingId}`);
    };

    const handleDownloadInvoice = async (bookingId) => {
        try {
            const response = await bookingService.downloadInvoice(bookingId);
            const url = window.URL.createObjectURL(new Blob([response], { type: 'application/pdf' }));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `invoice_${bookingId}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.parentNode.removeChild(link);
        } catch (err) {
            toast.error('Không thể tải hóa đơn');
        }
    };

    const handleExpire = (bookingId) => {
        console.log(`[EXPIRE] handleExpire được gọi cho booking ID: ${bookingId}. Cập nhật UI thành 'cancelled'.`);
        bookingService.getMyBookings()
            .then(response => setBookings(response))
            .catch(err => setError(err.message || 'Không thể cập nhật danh sách đơn hàng.'));
    };

    const handleOpenReviewModal = (booking) => {
        setSelectedBookingForReview(booking);
        setShowReviewModal(true);
    };

    const handleCloseReviewModal = () => {
        setShowReviewModal(false);
        setSelectedBookingForReview(null);
        setRating(0);
        setReviewText('');
        setSelectedReviewFiles([]);
    };

    const handleSubmitReview = async () => {
        if (!selectedBookingForReview) return;

        const formData = new FormData();
        formData.append('tour_id', selectedBookingForReview.tour_id);
        formData.append('booking_id', selectedBookingForReview.id);
        formData.append('rating', rating);
        formData.append('comment', reviewText);

        selectedReviewFiles.forEach(file => {
            formData.append('reviewImages', file);
        });

        try {
            const token = localStorage.getItem('token') || sessionStorage.getItem('token');
            const response = await fetch('http://localhost:5000/api/reviews', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });

            const result = await response.json();

            if (result.success) {
                toast.success('Đánh giá của bạn đã được gửi thành công! Cảm ơn bạn đã chia sẻ trải nghiệm.');
                handleCloseReviewModal();
            } else {
                toast.error(result.message || 'Không thể gửi đánh giá');
            }
        } catch (err) {
            console.error("Submit review error:", err);
            toast.error(err.message || 'Không thể gửi đánh giá');
        }
    };

    // XỬ LÝ MỞ MODAL THANH TOÁN
    const handleOpenPaymentModal = (booking) => {
        setSelectedBookingForPayment(booking);
        setShowPaymentModal(true);
    };

    // XỬ LÝ XÁC NHẬN THANH TOÁN
    const handlePaymentConfirm = async (paymentMethod, bookingId) => {
        try {
            setProcessingPayment(true);
            
            if (paymentMethod === 'credit') {
                // THANH TOÁN BẰNG CREDIT
                const result = await paymentService.payWithCredit(bookingId);
                
                if (result.success) {
                    toast.success(
                        `Thanh toán thành công!\n\nSố dư còn lại: ${result.data.remainingBalance.toLocaleString('vi-VN')} VNĐ`,
                        { autoClose: 5000 }
                    );
                    
                    // Refresh danh sách bookings
                    const response = await bookingService.getMyBookings();
                    setBookings(response);
                    setShowPaymentModal(false);
                }
            } else {
                // THANH TOÁN BẰNG VNPAY
                const result = await paymentService.createPaymentUrl({ bookingId });
                if (result.success && result.paymentUrl) {
                    window.location.href = result.paymentUrl;
                }
            }
        } catch (error) {
            toast.error('❌ ' + (error.message || 'Thanh toán thất bại'));
        } finally {
            setProcessingPayment(false);
        }
    };

    if (loading) return <div className="v2-my-bookings-container"><div className="v2-loader"></div></div>;
    if (error) return <div className="v2-my-bookings-container"><p className="v2-error-message">{error}</p></div>;

    return (
        <>
            <ToastContainer position="top-right" autoClose={3000} />
            
            <ConfirmationModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onConfirm={handleConfirm}
                {...modalContent}
            />

            <RefundMethodModal
                isOpen={showRefundModal}
                onClose={() => setShowRefundModal(false)}
                onConfirm={handleConfirmRefund}
                booking={selectedBookingForCancel}
                refundAmount={refundAmount}
                refundPercent={refundPercent}
            />

            {/* ✅ MODAL THANH TOÁN */}
            <PaymentMethodModal
                isOpen={showPaymentModal}
                onClose={() => setShowPaymentModal(false)}
                onConfirm={handlePaymentConfirm}
                amount={selectedBookingForPayment?.final_amount || 0}
                bookingId={selectedBookingForPayment?.id}
                loading={processingPayment}
            />

            <ReviewModal
                show={showReviewModal}
                onClose={handleCloseReviewModal}
                rating={rating}
                setRating={setRating}
                reviewText={reviewText}
                setReviewText={setReviewText}
                onSubmit={handleSubmitReview}
                selectedFiles={selectedReviewFiles}
                setSelectedFiles={setSelectedReviewFiles}
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
                            const localDate = new Date(booking.created_at.replace(' ', 'T'));
                            const utcTimestamp = localDate.getTime();
                            const expiryTime = utcTimestamp + 15 * 60 * 1000;
                            const isExpired = Date.now() > expiryTime;
                            const isPaid = booking.payment_status === 'success';
                            const canCancelPaid = isPaid && booking.status === 'confirmed' && booking.can_cancel;

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

                                        {booking.status === 'pending_payment' && !isExpired && (
                                            <CountdownTimer
                                                expiryTimestamp={expiryTime}
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
                                            {booking.status === 'pending_payment' && !isExpired && (
                                                <>
                                                    {/* NÚT THANH TOÁN MỚI - MỞ MODAL */}
                                                    <button 
                                                        onClick={() => handleOpenPaymentModal(booking)}
                                                        className="v2-btn v2-btn--primary"
                                                    >
                                                        <i className="fas fa-credit-card"></i> Thanh toán
                                                    </button>
                                                    <button 
                                                        onClick={() => handleEditUnpaidBooking(booking)} 
                                                        className="v2-btn v2-btn--info"
                                                        title="Sửa thông tin booking"
                                                    >
                                                        <i className="fas fa-edit"></i> Sửa
                                                    </button>
                                                    <button 
                                                        onClick={() => handleCancelUnpaidBooking(booking.id)} 
                                                        className="v2-btn v2-btn--danger"
                                                    >
                                                        <i className="fas fa-times"></i> Hủy
                                                    </button>
                                                </>
                                            )}

                                            {canCancelPaid && (
                                                <>
                                                    <Link to={`/tours/${booking.tour_id}`} className="v2-btn v2-btn--secondary">
                                                        <i className="fas fa-eye"></i> Xem chi tiết
                                                    </Link>
                                                    <button onClick={() => handleViewInvoice(booking.id)} className="v2-btn v2-btn--info">
                                                        <i className="fas fa-file-invoice"></i> Xem hóa đơn
                                                    </button>
                                                    <button 
                                                        onClick={() => handleCancelPaidBooking(booking)} 
                                                        className="v2-btn v2-btn--warning"
                                                        title={`Hủy tour (${booking.days_until_departure} ngày trước khởi hành)`}
                                                    >
                                                        <i className="fas fa-ban"></i> Hủy tour
                                                    </button>
                                                    <button onClick={() => handleDownloadInvoice(booking.id)} className="v2-btn v2-btn--primary">
                                                        <i className="fas fa-download"></i> Tải hóa đơn
                                                    </button>
                                                </>
                                            )}

                                            {booking.status === 'completed' && (
                                                <>
                                                    <button onClick={() => handleViewInvoice(booking.id)} className="v2-btn v2-btn--info">
                                                        <i className="fas fa-file-invoice"></i> Xem hóa đơn
                                                    </button>
                                                
                                                    <button 
                                                        onClick={() => handleOpenReviewModal(booking)} 
                                                        className="v2-btn v2-btn--success"
                                                    >
                                                        <i className="fas fa-star"></i> Đánh giá
                                                    </button>
                                                </>
                                            )}

                                            {booking.status === 'cancelled' && (
                                                <>
                                                    <Link to={`/booking/${booking.tour_id}`} state={{ prefillData: booking.details }} className="v2-btn v2-btn--secondary">
                                                        <i className="fas fa-redo"></i> Đặt lại
                                                    </Link>
                                                    <button onClick={() => handleDeleteBooking(booking.id)} className="v2-btn v2-btn--danger">
                                                        <i className="fas fa-trash"></i> Xóa
                                                    </button>
                                                </>
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