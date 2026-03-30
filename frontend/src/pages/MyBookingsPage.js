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
import { CONFIG } from '../config';
import { getDisplayImageUrl } from '../utils/imageUtils';
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
                    <button onClick={onClose} className="v2-btn v2-btn--secondary">Hủy bỏ</button>
                    <button onClick={onConfirm} className="v2-btn v2-btn--danger">{confirmText}</button>
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

    // ✅ THÊM STATE PHÂN TRANG
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 3; // Số booking mỗi trang

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
    const [submittingRefund, setSubmittingRefund] = useState(false);

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

    // ✅ TÍNH TOÁN PHÂN TRANG
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentBookings = bookings.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(bookings.length / itemsPerPage);

    const paginate = (pageNumber) => {
        setCurrentPage(pageNumber);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const getStatusText = (bookingStatus, paymentStatus) => {
        if (bookingStatus === 'pending_cancellation') return 'Chờ duyệt hủy';
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
        if (onConfirmAction) onConfirmAction();
        setIsModalOpen(false);
    };

    const calculateRefund = (booking) => {
        const departureDate = new Date(booking.departure_date);
        const now = new Date();
        const daysUntilDeparture = Math.ceil((departureDate - now) / (1000 * 60 * 60 * 24));

        let refund_percent = 0;
        if (daysUntilDeparture >= 15) refund_percent = 100;
        else if (daysUntilDeparture >= 7) refund_percent = 80;
        else if (daysUntilDeparture >= 3) refund_percent = 50;
        const refund_amount = Math.round((booking.final_amount * refund_percent) / 100);
        return { refund_percent, refund_amount, daysUntilDeparture };
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
        openConfirmationModal('Xác nhận Hủy Booking', 'Bạn có chắc chắn muốn hủy đơn đặt tour này không?\nBooking chưa thanh toán sẽ được hủy miễn phí.', 'Đồng ý Hủy', action);
    };

    const handleCancelPaidBooking = (booking) => {
        const { refund_percent, refund_amount, daysUntilDeparture } = calculateRefund(booking);
        
        // ✅ LUÔN LUÔN MỞ REFUND METHOD MODAL (kể cả khi refund = 0%)
        setSelectedBookingForCancel(booking);
        setRefundAmount(refund_amount);
        setRefundPercent(refund_percent);
        setShowRefundModal(true);
    };

    const handleConfirmRefund = async (refundMethod) => {
        if (!selectedBookingForCancel) return;
        
        try {
            setSubmittingRefund(true);
            setShowRefundModal(false); // Đóng modal ngay khi bắt đầu xử lý
            
            const result = await bookingService.cancelPaidBooking(
                selectedBookingForCancel.id, 
                { refund_method: refundMethod }
            );
            
            if (result.success) {
                // Nếu cần admin duyệt
                if (result.requiresApproval) {
                    toast.info(
                        `⏳ ${result.message}\n\n` +
                        `Số tiền hoàn dự kiến: ${refundAmount.toLocaleString('vi-VN')} VNĐ (${refundPercent}%)\n` +
                        `Phương thức: ${refundMethod === 'credit' ? 'Hoàn vào ví Credit' : 'Chuyển khoản ngân hàng'}`,
                        { autoClose: 7000 }
                    );
                } else {
                    // Hủy thành công không cần duyệt hoặc không hoàn tiền
                    const message = refundPercent === 0 
                        ? 'Tour đã được hủy. Không được hoàn tiền do hủy muộn.'
                        : result.message || 'Tour đã được hủy thành công';
                    
                    toast.warning(message, { autoClose: 5000 });
                }
                
                // Cập nhật lại danh sách bookings
                const response = await bookingService.getMyBookings();
                setBookings(response);
                setSelectedBookingForCancel(null);
            }
        } catch (err) {
            toast.error(err.message || 'Không thể hủy booking');
        } finally {
            setSubmittingRefund(false);
        }
    };

    const handleEditUnpaidBooking = (booking) => {
        const action = async () => {
            try {
                await bookingService.cancelBooking(booking.id);
                toast.info('Đang chuyển hướng để sửa booking...', { autoClose: 2000 });
                navigate(`/booking/${booking.tour_id}`, { state: { prefillData: booking.details, departureId: booking.tour_departure_id, specialRequests: booking.special_requests } });
            } catch (err) {
                toast.error(err.message || 'Không thể sửa booking');
            }
        };
        
        // ✅ SỬA LỖI: Cập nhật cả modal sửa booking cho đồng bộ
        const message = `Chỉnh sửa booking sẽ HỦY đơn hàng hiện tại và tạo một đơn mới với thông tin bạn thay đổi.\n\n📋 Thông tin booking:\n- Tour: ${booking.tour_name || booking.destination || 'N/A'}\n- Ngày khởi hành: ${new Date(booking.departure_date).toLocaleDateString('vi-VN')}\n- Tổng tiền: ${formatCurrency(booking.final_amount)}\n\nBạn có muốn tiếp tục?`;

        openConfirmationModal('⚠️ Xác nhận Sửa Booking', message, 'Tiếp tục Sửa', action);
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
        openConfirmationModal('⚠️ Xác nhận Xóa Booking', 'Hành động này sẽ xóa vĩnh viễn đơn đặt tour khỏi danh sách của bạn.\nBạn có chắc chắn muốn tiếp tục?', 'Xóa vĩnh viễn', action);
    };

    const handleViewInvoice = (bookingId) => navigate(`/bookings/invoice/${bookingId}`);

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
        bookingService.getMyBookings().then(response => setBookings(response)).catch(err => setError(err.message || 'Không thể cập nhật danh sách đơn hàng.'));
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
        selectedReviewFiles.forEach(file => formData.append('reviewImages', file));
        try {
            const token = localStorage.getItem('token') || sessionStorage.getItem('token');
            const response = await fetch(`${CONFIG.API_API_URL}/reviews`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData
            });
            const result = await response.json();
            if (result.success) {
                toast.success('Đánh giá của bạn đã được gửi thành công!');
                handleCloseReviewModal();
            } else {
                toast.error(result.message || 'Không thể gửi đánh giá');
            }
        } catch (err) {
            toast.error(err.message || 'Không thể gửi đánh giá');
        }
    };

    const handleOpenPaymentModal = (booking) => {
        setSelectedBookingForPayment(booking);
        setShowPaymentModal(true);
    };

    const handlePaymentConfirm = async (paymentMethod, bookingId) => {
        try {
            setProcessingPayment(true);
            if (paymentMethod === 'credit') {
                const result = await paymentService.payWithCredit(bookingId);
                if (result.success) {
                    toast.success(`Thanh toán thành công!\n\nSố dư còn lại: ${result.data.remainingBalance.toLocaleString('vi-VN')} VNĐ`, { autoClose: 5000 });
                    const response = await bookingService.getMyBookings();
                    setBookings(response);
                    setShowPaymentModal(false);
                }
            } else {
                const result = await paymentService.createPaymentUrl({ bookingId });
                if (result.success && result.paymentUrl) window.location.href = result.paymentUrl;
            }
        } catch (error) {
            toast.error('❌ ' + (error.message || 'Thanh toán thất bại'));
        } finally {
            setProcessingPayment(false);
        }
    };

    // ✅ Đảm bảo hàm này đã được khai báo trong component MyBookingsPage
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND',
            minimumFractionDigits: 0
        }).format(amount || 0);
    };

    if (loading) return <div className="v2-my-bookings-container"><div className="v2-loader"></div></div>;
    if (error) return <div className="v2-my-bookings-container"><p className="v2-error-message">{error}</p></div>;

    return (
        <>
            <ToastContainer position="top-right" autoClose={3000} />
            <ConfirmationModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onConfirm={handleConfirm} {...modalContent} />
            <RefundMethodModal isOpen={showRefundModal} onClose={() => { setShowRefundModal(false); setSelectedBookingForCancel(null); }} onConfirm={handleConfirmRefund} booking={selectedBookingForCancel} refundAmount={refundAmount} refundPercent={refundPercent} submitting={submittingRefund} />
            <PaymentMethodModal isOpen={showPaymentModal} onClose={() => setShowPaymentModal(false)} onConfirm={handlePaymentConfirm} amount={selectedBookingForPayment?.final_amount || 0} bookingId={selectedBookingForPayment?.id} loading={processingPayment} />
            <ReviewModal show={showReviewModal} onClose={handleCloseReviewModal} rating={rating} setRating={setRating} reviewText={reviewText} setReviewText={setReviewText} onSubmit={handleSubmitReview} selectedFiles={selectedReviewFiles} setSelectedFiles={setSelectedReviewFiles} />

            <div className="v2-my-bookings-container">
                {/* ✅ PAGE HEADER */}
                <div className="v2-page-header">
                    <h1><i className="fas fa-history"></i> Lịch sử đặt tour</h1>
                    <p className="v2-page-subtitle">Quản lý và theo dõi các chuyến đi của bạn ({bookings.length} booking)</p>
                </div>

                {bookings.length === 0 ? (
                    <div className="v2-no-bookings">
                        <i className="fas fa-inbox"></i>
                        <p>Bạn chưa có đơn đặt tour nào.</p>
                        <Link to="/tours" className="v2-btn v2-btn--primary">
                            <i className="fas fa-search"></i> Khám phá các tour
                        </Link>
                    </div>
                ) : (
                    <>
                        {/* ✅ BOOKINGS LIST - COMPACT DESIGN */}
                        <div className="v2-bookings-list-compact">
                            {currentBookings.map(booking => {
                                const localDate = new Date(booking.created_at.replace(' ', 'T'));
                                const utcTimestamp = localDate.getTime();
                                const expiryTime = utcTimestamp + 15 * 60 * 1000;
                                const isExpired = Date.now() > expiryTime;
                                const isPaid = booking.payment_status === 'success';
                                const canCancelPaid = isPaid && booking.status === 'confirmed' && booking.can_cancel;
                                const isPendingCancellation = booking.status === 'pending_cancellation';

                                return (
                                    <div key={booking.id} className={`v2-booking-card-compact status-${booking.status}`}>
                                        {/* THUMBNAIL */}
                                        <div className="v2-booking-thumbnail">
                                            <img src={getDisplayImageUrl(booking.tour_image)} alt={booking.tour_name} />
                                            <span className={`v2-status-badge status-${booking.status} payment-${booking.payment_status}`}>
                                                {booking.status === 'pending_payment' && isExpired ? 'Hết hạn' : getStatusText(booking.status, booking.payment_status)}
                                            </span>
                                        </div>

                                        {/* BOOKING INFO */}
                                        <div className="v2-booking-info-compact">
                                            <div className="v2-booking-header-compact">
                                                <h3>{booking.tour_name}</h3>
                                                <span className="v2-booking-id-badge">#{booking.id}</span>
                                            </div>

                                            {/* COUNTDOWN TIMER */}
                                            {booking.status === 'pending_payment' && !isExpired && (
                                                <div className="v2-countdown-wrapper">
                                                    <CountdownTimer expiryTimestamp={expiryTime} onExpire={() => handleExpire(booking.id)} />
                                                </div>
                                            )}

                                            {/* PENDING CANCELLATION NOTICE */}
                                            {isPendingCancellation && (
                                                <div className="v2-pending-notice">
                                                    <i className="fas fa-clock"></i>
                                                    <span>Yêu cầu hủy đang chờ admin xem xét (24-48h)</span>
                                                </div>
                                            )}

                                            {/* META INFO */}
                                            <div className="v2-booking-meta-compact">
                                                <div className="v2-meta-item">
                                                    <i className="fas fa-calendar-alt"></i>
                                                    <span>Khởi hành: {new Date(booking.departure_date).toLocaleDateString('vi-VN')}</span>
                                                </div>
                                                <div className="v2-meta-item">
                                                    <i className="fas fa-user"></i>
                                                    <span>{booking.contact_name}</span>
                                                </div>
                                                {/* ✅ THÊM EMAIL */}
                                                <div className="v2-meta-item">
                                                    <i className="fas fa-envelope"></i>
                                                    <span>{booking.contact_email}</span>
                                                </div>
                                                <div className="v2-meta-item">
                                                    <i className="fas fa-phone"></i>
                                                    <span>{booking.contact_phone}</span>
                                                </div>
                                            </div>

                                            {/* DETAILS COMPACT */}
                                            <div className="v2-booking-details-compact">
                                                {Array.isArray(booking.details) && booking.details.map((detail, index) => (
                                                    <span key={index} className="v2-detail-tag">
                                                        {translatePriceType(detail.price_type)}: {detail.quantity}
                                                    </span>
                                                ))}
                                            </div>

                                            {/* PRICE */}
                                            <div className="v2-booking-price-compact">
                                                {booking.discount_amount > 0 && (
                                                    <span className="v2-discount">
                                                        {formatCurrency(booking.discount_amount)}
                                                    </span>
                                                )}
                                                <span className="v2-total">
                                                    {formatCurrency(booking.final_amount)}
                                                </span>
                                            </div>
                                        </div>

                                        {/* ACTIONS - VERTICAL */}
                                        <div className="v2-booking-actions-vertical">
                                            {booking.status === 'pending_payment' && !isExpired && (
                                                <>
                                                    <button onClick={() => handleOpenPaymentModal(booking)} className="v2-btn-compact v2-btn-primary">
                                                        <i className="fas fa-credit-card"></i> Thanh toán
                                                    </button>
                                                    <button onClick={() => handleEditUnpaidBooking(booking)} className="v2-btn-compact v2-btn-info">
                                                        <i className="fas fa-edit"></i> Sửa
                                                    </button>
                                                    <button onClick={() => handleCancelUnpaidBooking(booking.id)} className="v2-btn-compact v2-btn-danger">
                                                        <i className="fas fa-times"></i> Hủy
                                                    </button>
                                                </>
                                            )}

                                            {canCancelPaid && (
                                                <>
                                                    <Link to={`/tours/${booking.tour_id}`} className="v2-btn-compact v2-btn-secondary">
                                                        <i className="fas fa-eye"></i> Chi tiết
                                                    </Link>
                                                    <button onClick={() => handleViewInvoice(booking.id)} className="v2-btn-compact v2-btn-info">
                                                        <i className="fas fa-file-invoice"></i> Hóa đơn
                                                    </button>
                                                    <button onClick={() => handleCancelPaidBooking(booking)} className="v2-btn-compact v2-btn-warning">
                                                        <i className="fas fa-ban"></i> Hủy tour
                                                    </button>
                                                    <button onClick={() => handleDownloadInvoice(booking.id)} className="v2-btn-compact v2-btn-success">
                                                        <i className="fas fa-download"></i> Tải PDF
                                                    </button>
                                                </>
                                            )}

                                            {booking.status === 'completed' && (
                                                <>
                                                    <button onClick={() => handleViewInvoice(booking.id)} className="v2-btn-compact v2-btn-info">
                                                        <i className="fas fa-file-invoice"></i> Hóa đơn
                                                    </button>
                                                    <button onClick={() => handleOpenReviewModal(booking)} className="v2-btn-compact v2-btn-success">
                                                        <i className="fas fa-star"></i> Đánh giá
                                                    </button>
                                                </>
                                            )}

                                            {booking.status === 'cancelled' && (
                                                <>
                                                    <Link to={`/booking/${booking.tour_id}`} state={{ prefillData: booking.details }} className="v2-btn-compact v2-btn-secondary">
                                                        <i className="fas fa-redo"></i> Đặt lại
                                                    </Link>
                                                    <button onClick={() => handleDeleteBooking(booking.id)} className="v2-btn-compact v2-btn-danger">
                                                        <i className="fas fa-trash"></i> Xóa
                                                    </button>
                                                </>
                                            )}

                                            {isPendingCancellation && (
                                                <button disabled className="v2-btn-compact v2-btn-disabled">
                                                    <i className="fas fa-clock"></i> Chờ duyệt
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* ✅ PAGINATION */}
                        {totalPages > 1 && (
                            <div className="v2-pagination-wrapper">
                                <button 
                                    onClick={() => paginate(currentPage - 1)} 
                                    disabled={currentPage === 1}
                                    className="v2-pagination-btn v2-pagination-prev"
                                >
                                    <i className="fas fa-chevron-left"></i>
                                </button>

                                {[...Array(totalPages)].map((_, index) => (
                                    <button
                                        key={index + 1}
                                        onClick={() => paginate(index + 1)}
                                        className={`v2-pagination-btn ${currentPage === index + 1 ? 'active' : ''}`}
                                    >
                                        {index + 1}
                                    </button>
                                ))}

                                <button 
                                    onClick={() => paginate(currentPage + 1)} 
                                    disabled={currentPage === totalPages}
                                    className="v2-pagination-btn v2-pagination-next"
                                >
                                    <i className="fas fa-chevron-right"></i>
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>
        </>
    );
};

export default MyBookingsPage;