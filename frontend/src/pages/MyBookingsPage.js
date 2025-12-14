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
        <div className="mb-modal-overlay" onClick={onClose}>
            <div className="mb-modal-box" onClick={e => e.stopPropagation()}>
                <div className="mb-modal-header">
                    <h3><i className="fas fa-exclamation-triangle"></i> {title}</h3>
                    <button onClick={onClose} className="mb-modal-close">
                        <i className="fas fa-times"></i>
                    </button>
                </div>
                <div className="mb-modal-body">
                    {typeof message === 'string' ? (
                        <p className="mb-modal-message">{message}</p>
                    ) : (
                        <div>{message}</div>
                    )}
                </div>
                <div className="mb-modal-footer">
                    <button onClick={onClose} className="mb-btn mb-btn-secondary">
                        <i className="fas fa-times"></i> Hủy
                    </button>
                    <button onClick={onConfirm} className="mb-btn mb-btn-danger">
                        <i className="fas fa-check"></i> {confirmText}
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

    // ✅ PHÂN TRANG STATE
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(6);

    // State cho modal
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
        loadBookings();
    }, []);

    const loadBookings = async () => {
        try {
            setLoading(true);
            const data = await bookingService.getMyBookings();
            setBookings(data);
        } catch (err) {
            setError(err.message || 'Không thể tải danh sách đặt tour');
            toast.error('Không thể tải danh sách đặt tour');
        } finally {
            setLoading(false);
        }
    };

    const getStatusText = (status, paymentStatus) => {
        if (status === 'pending_payment') return paymentStatus === 'success' ? 'Đã thanh toán' : 'Chờ thanh toán';
        if (status === 'confirmed') return 'Đã xác nhận';
        if (status === 'completed') return 'Hoàn thành';
        if (status === 'cancelled') return 'Đã hủy';
        if (status === 'pending_cancellation') return 'Chờ duyệt hủy';
        if (paymentStatus === 'failed') return 'Thanh toán thất bại';
        return 'Chờ thanh toán';
    };

    const getStatusIcon = (status, paymentStatus) => {
        if (status === 'pending_payment' && paymentStatus !== 'success') return 'fas fa-clock';
        if (status === 'confirmed' || paymentStatus === 'success') return 'fas fa-check-circle';
        if (status === 'completed') return 'fas fa-flag-checkered';
        if (status === 'cancelled') return 'fas fa-ban';
        if (status === 'pending_cancellation') return 'fas fa-hourglass-half';
        return 'fas fa-question-circle';
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

    const calculateRefund = (booking) => {
        const departureDate = new Date(booking.departure_date);
        const now = new Date();
        const diffTime = departureDate - now;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        let percent = 0;
        if (diffDays >= 15) percent = 100;
        else if (diffDays >= 7) percent = 70;
        else if (diffDays >= 3) percent = 50;

        const refund = (booking.final_amount * percent) / 100;
        return { percent, refund };
    };

    const handlePayNow = (booking) => {
        setSelectedBookingForPayment(booking);
        setShowPaymentModal(true);
    };

    const handlePaymentSubmit = async (paymentMethod) => {
        if (!selectedBookingForPayment) return;

        try {
            setProcessingPayment(true);
            
            if (paymentMethod === 'credit') {
                const result = await paymentService.processPayment(
                    selectedBookingForPayment.id,
                    'credit',
                    selectedBookingForPayment.final_amount
                );

                if (result.success) {
                    toast.success('Thanh toán thành công bằng Credit!');
                    await loadBookings();
                    setShowPaymentModal(false);
                }
            } else {
                const result = await paymentService.createPaymentUrl({ 
                    bookingId: selectedBookingForPayment.id 
                });
                
                if (result.success && result.paymentUrl) {
                    window.location.href = result.paymentUrl;
                }
            }
        } catch (error) {
            toast.error(error.message || 'Lỗi khi xử lý thanh toán');
        } finally {
            setProcessingPayment(false);
            setSelectedBookingForPayment(null);
        }
    };

    const handleCancelUnpaidBooking = (bookingId) => {
        const action = async () => {
            try {
                await bookingService.cancelBooking(bookingId);
                await loadBookings();
                toast.success('Đã hủy đặt tour thành công!');
            } catch (err) {
                toast.error(err.message || 'Không thể hủy đặt tour');
            }
        };

        openConfirmationModal(
            'Xác nhận Hủy Đặt Tour',
            'Bạn có chắc chắn muốn hủy đặt tour này không?',
            'Xác nhận hủy',
            action
        );
    };

    const handleCancelPaidBooking = (booking) => {
        const { percent, refund } = calculateRefund(booking);
        
        setSelectedBookingForCancel(booking);
        setRefundPercent(percent);
        setRefundAmount(refund);
        setShowRefundModal(true);
    };

    const handleRefundMethodSelected = async (method) => {
        if (!selectedBookingForCancel) return;

        try {
            await bookingService.cancelPaidBooking(selectedBookingForCancel.id, method);
            await loadBookings();
            setShowRefundModal(false);
            setSelectedBookingForCancel(null);
            
            toast.success(
                refundPercent >= 15 
                    ? 'Yêu cầu hủy tour đã được gửi. Admin sẽ xử lý trong 24-48h!' 
                    : 'Đã hủy tour thành công!'
            );
        } catch (err) {
            toast.error(err.message || 'Không thể hủy tour');
        }
    };

    const handleEditUnpaidBooking = (booking) => {
        const action = () => {
            navigate(`/booking/${booking.tour_id}`, {
                state: { 
                    prefillData: booking.details,
                    editMode: true,
                    bookingId: booking.id
                }
            });
        };

        openConfirmationModal(
            'Xác nhận Chỉnh sửa',
            `Chỉnh sửa booking sẽ HỦY đơn hàng hiện tại và tạo một đơn mới.\n\nBạn có muốn tiếp tục?`,
            'Tiếp tục',
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
            'Xác nhận Xóa Booking',
            'Hành động này sẽ xóa vĩnh viễn đơn đặt tour.\nBạn có chắc chắn?',
            'Xóa',
            action
        );
    };

    const handleViewInvoice = (bookingId) => {
        navigate(`/bookings/invoice/${bookingId}`);
    };

    const handleExpire = (bookingId) => {
        loadBookings();
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
            formData.append('images', file);
        });

        try {
            await bookingService.submitReview(formData);
            toast.success('Cảm ơn bạn đã đánh giá!');
            handleCloseReviewModal();
        } catch (err) {
            toast.error(err.message || 'Không thể gửi đánh giá');
        }
    };

    // ✅ TÍNH TOÁN PHÂN TRANG
    const totalPages = Math.ceil(bookings.length / itemsPerPage);
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentBookings = bookings.slice(indexOfFirstItem, indexOfLastItem);

    // ✅ XỬ LÝ CHUYỂN TRANG
    const paginate = (pageNumber) => {
        if (pageNumber >= 1 && pageNumber <= totalPages) {
            setCurrentPage(pageNumber);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    // ✅ TẠO DANH SÁCH SỐ TRANG
    const renderPageNumbers = () => {
        const pages = [];
        const maxVisible = 5;

        if (totalPages <= maxVisible) {
            for (let i = 1; i <= totalPages; i++) {
                pages.push(i);
            }
        } else {
            if (currentPage <= 3) {
                for (let i = 1; i <= 4; i++) pages.push(i);
                pages.push('...');
                pages.push(totalPages);
            } else if (currentPage >= totalPages - 2) {
                pages.push(1);
                pages.push('...');
                for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i);
            } else {
                pages.push(1);
                pages.push('...');
                pages.push(currentPage - 1);
                pages.push(currentPage);
                pages.push(currentPage + 1);
                pages.push('...');
                pages.push(totalPages);
            }
        }

        return pages.map((page, index) => {
            if (page === '...') {
                return <span key={`dots-${index}`} className="mb-pagination-dots">...</span>;
            }
            return (
                <button
                    key={page}
                    className={`mb-page-btn ${page === currentPage ? 'active' : ''}`}
                    onClick={() => paginate(page)}
                >
                    {page}
                </button>
            );
        });
    };

    if (loading) {
        return (
            <div className="mb-container">
                <div className="mb-loading">
                    <div className="mb-spinner"></div>
                    <p>Đang tải dữ liệu...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="mb-container">
                <div className="mb-error">
                    <i className="fas fa-exclamation-triangle"></i>
                    <p>{error}</p>
                    <button onClick={loadBookings} className="mb-btn mb-btn-primary">
                        <i className="fas fa-sync-alt"></i> Thử lại
                    </button>
                </div>
            </div>
        );
    }

    return (
        <>
            <ToastContainer 
                position="top-right"
                autoClose={3000}
                hideProgressBar={false}
                newestOnTop
                closeOnClick
                pauseOnHover
                theme="light"
            />

            <ConfirmationModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onConfirm={handleConfirm}
                title={modalContent.title}
                message={modalContent.message}
                confirmText={modalContent.confirmText}
            />

            <PaymentMethodModal
                isOpen={showPaymentModal}
                onClose={() => setShowPaymentModal(false)}
                onSubmit={handlePaymentSubmit}
                amount={selectedBookingForPayment?.final_amount || 0}
            />

            <RefundMethodModal
                isOpen={showRefundModal}
                onClose={() => setShowRefundModal(false)}
                onSubmit={handleRefundMethodSelected}
                refundAmount={refundAmount}
                refundPercent={refundPercent}
            />

            <ReviewModal
                isOpen={showReviewModal}
                onClose={handleCloseReviewModal}
                booking={selectedBookingForReview}
                rating={rating}
                setRating={setRating}
                reviewText={reviewText}
                setReviewText={setReviewText}
                onSubmit={handleSubmitReview}
                selectedFiles={selectedReviewFiles}
                setSelectedFiles={setSelectedReviewFiles}
            />

            <div className="mb-container">
                {/* ========== PAGE HEADER ========== */}
                <div className="mb-header">
                    <div className="mb-header-content">
                        <h1 className="mb-title">
                            <i className="fas fa-ticket-alt"></i>
                            Lịch sử đặt tour của tôi
                        </h1>
                        <p className="mb-subtitle">
                            Quản lý và theo dõi các chuyến du lịch
                        </p>
                    </div>
                    <button onClick={loadBookings} className="mb-refresh-btn">
                        <i className="fas fa-sync-alt"></i>
                        <span>Làm mới</span>
                    </button>
                </div>

                {bookings.length === 0 ? (
                    <div className="mb-empty">
                        <i className="fas fa-inbox"></i>
                        <p>Bạn chưa có đơn đặt tour nào</p>
                        <Link to="/tours" className="mb-btn mb-btn-primary">
                            <i className="fas fa-compass"></i> Khám phá các tour
                        </Link>
                    </div>
                ) : (
                    <>
                        {/* ========== BOOKINGS GRID ========== */}
                        <div className="mb-grid">
                            {currentBookings.map(booking => {
                                const localDate = new Date(booking.created_at.replace(' ', 'T'));
                                const utcTimestamp = localDate.getTime();
                                const expiryTime = utcTimestamp + 15 * 60 * 1000;
                                const isExpired = Date.now() > expiryTime;
                                const isPaid = booking.payment_status === 'success';
                                const canCancelPaid = isPaid && booking.status === 'confirmed' && booking.can_cancel;
                                const isPendingCancellation = booking.status === 'pending_cancellation';

                                return (
                                    <div key={booking.id} className={`mb-card status-${booking.status}`}>
                                        {/* Image */}
                                        <div className="mb-card-image">
                                            <img 
                                                src={`http://localhost:5000${booking.tour_image}`} 
                                                alt={booking.tour_name}
                                            />
                                            <div className={`mb-status-badge status-${booking.status} payment-${booking.payment_status}`}>
                                                <i className={getStatusIcon(booking.status, booking.payment_status)}></i>
                                                <span>
                                                    {booking.status === 'pending_payment' && isExpired
                                                        ? 'Hết hạn'
                                                        : getStatusText(booking.status, booking.payment_status)}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Content */}
                                        <div className="mb-card-content">
                                            <h3 className="mb-card-title">{booking.tour_name}</h3>
                                            
                                            {/* Countdown */}
                                            {booking.status === 'pending_payment' && !isExpired && (
                                                <div className="mb-countdown-wrapper">
                                                    <CountdownTimer
                                                        expiryTimestamp={expiryTime}
                                                        onExpire={() => handleExpire(booking.id)}
                                                    />
                                                </div>
                                            )}

                                            {/* Info */}
                                            <div className="mb-card-info">
                                                <div className="mb-info-item">
                                                    <i className="fas fa-hashtag"></i>
                                                    <span>Mã: <strong>#{booking.id}</strong></span>
                                                </div>
                                                <div className="mb-info-item">
                                                    <i className="fas fa-calendar-alt"></i>
                                                    <span>{new Date(booking.departure_date).toLocaleDateString('vi-VN')}</span>
                                                </div>
                                                <div className="mb-info-item">
                                                    <i className="fas fa-users"></i>
                                                    <span>
                                                        {Array.isArray(booking.details) && booking.details.map((detail, index) => (
                                                            <span key={index}>
                                                                {detail.quantity} {translatePriceType(detail.price_type)}
                                                                {index < booking.details.length - 1 ? ', ' : ''}
                                                            </span>
                                                        ))}
                                                    </span>
                                                </div>
                                                <div className="mb-info-item">
                                                    <i className="fas fa-user"></i>
                                                    <span>{booking.contact_name}</span>
                                                </div>
                                                
                                                {/* ✅ THÊM EMAIL */}
                                                <div className="mb-info-item">
                                                    <i className="fas fa-envelope"></i>
                                                    <span>{booking.contact_email}</span>
                                                </div>
                                                
                                                {/* ✅ THÊM SỐ ĐIỆN THOẠI */}
                                                <div className="mb-info-item">
                                                    <i className="fas fa-phone"></i>
                                                    <span>{booking.contact_phone}</span>
                                                </div>
                                            </div>

                                            {/* Pending Notice */}
                                            {isPendingCancellation && (
                                                <div className="mb-pending-notice">
                                                    <i className="fas fa-clock"></i>
                                                    <span>Đang chờ admin duyệt hủy (24-48h)</span>
                                                </div>
                                            )}

                                            {/* Total */}
                                            <div className="mb-card-total">
                                                <span>Tổng tiền:</span>
                                                <strong>{booking.final_amount.toLocaleString('vi-VN')} VNĐ</strong>
                                            </div>

                                            {/* Actions */}
                                            <div className="mb-card-actions">
                                                {/* PENDING PAYMENT */}
                                                {booking.status === 'pending_payment' && !isExpired && !isPaid && (
                                                    <>
                                                        <button 
                                                            onClick={() => handlePayNow(booking)} 
                                                            className="mb-btn mb-btn-primary mb-btn-sm"
                                                        >
                                                            <i className="fas fa-credit-card"></i> Thanh toán
                                                        </button>
                                                        <button 
                                                            onClick={() => handleEditUnpaidBooking(booking)} 
                                                            className="mb-btn mb-btn-info mb-btn-sm"
                                                        >
                                                            <i className="fas fa-edit"></i> Sửa
                                                        </button>
                                                        <button 
                                                            onClick={() => handleCancelUnpaidBooking(booking.id)} 
                                                            className="mb-btn mb-btn-danger mb-btn-sm"
                                                        >
                                                            <i className="fas fa-times"></i> Hủy
                                                        </button>
                                                    </>
                                                )}

                                                {/* CONFIRMED */}
                                                {canCancelPaid && (
                                                    <>
                                                        <Link 
                                                            to={`/tours/${booking.tour_id}`} 
                                                            className="mb-btn mb-btn-secondary mb-btn-sm"
                                                        >
                                                            <i className="fas fa-eye"></i> Chi tiết
                                                        </Link>
                                                        <button 
                                                            onClick={() => handleViewInvoice(booking.id)} 
                                                            className="mb-btn mb-btn-info mb-btn-sm"
                                                        >
                                                            <i className="fas fa-file-invoice"></i> Hóa đơn
                                                        </button>
                                                        <button 
                                                            onClick={() => handleCancelPaidBooking(booking)} 
                                                            className="mb-btn mb-btn-warning mb-btn-sm"
                                                        >
                                                            <i className="fas fa-ban"></i> Hủy
                                                        </button>
                                                    </>
                                                )}

                                                {/* COMPLETED */}
                                                {booking.status === 'completed' && (
                                                    <>
                                                        <button 
                                                            onClick={() => handleViewInvoice(booking.id)} 
                                                            className="mb-btn mb-btn-info mb-btn-sm"
                                                        >
                                                            <i className="fas fa-file-invoice"></i> Hóa đơn
                                                        </button>
                                                        <button 
                                                            onClick={() => handleOpenReviewModal(booking)} 
                                                            className="mb-btn mb-btn-success mb-btn-sm"
                                                        >
                                                            <i className="fas fa-star"></i> Đánh giá
                                                        </button>
                                                    </>
                                                )}

                                                {/* CANCELLED */}
                                                {booking.status === 'cancelled' && (
                                                    <>
                                                        <Link 
                                                            to={`/booking/${booking.tour_id}`} 
                                                            state={{ prefillData: booking.details }} 
                                                            className="mb-btn mb-btn-secondary mb-btn-sm"
                                                        >
                                                            <i className="fas fa-redo"></i> Đặt lại
                                                        </Link>
                                                        <button 
                                                            onClick={() => handleDeleteBooking(booking.id)} 
                                                            className="mb-btn mb-btn-danger mb-btn-sm"
                                                        >
                                                            <i className="fas fa-trash"></i> Xóa
                                                        </button>
                                                    </>
                                                )}

                                                {/* PENDING CANCELLATION */}
                                                {isPendingCancellation && (
                                                    <button disabled className="mb-btn mb-btn-disabled mb-btn-sm">
                                                        <i className="fas fa-clock"></i> Chờ duyệt
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* ========== PAGINATION ========== */}
                        {totalPages > 1 && (
                            <>
                                <nav className="mb-pagination">
                                    <button 
                                        className={`mb-pagination-btn ${currentPage === 1 ? 'disabled' : ''}`}
                                        onClick={() => paginate(currentPage - 1)}
                                        disabled={currentPage === 1}
                                    >
                                        <i className="bi bi-chevron-left"></i>
                                    </button>
                                    
                                    <div className="mb-pagination-numbers">
                                        {renderPageNumbers()}
                                    </div>

                                    <button 
                                        className={`mb-pagination-btn ${currentPage === totalPages ? 'disabled' : ''}`}
                                        onClick={() => paginate(currentPage + 1)}
                                        disabled={currentPage === totalPages}
                                    >
                                        <i className="bi bi-chevron-right"></i>
                                    </button>
                                </nav>

                                <div className="mb-pagination-info">
                                    Hiển thị {indexOfFirstItem + 1} - {Math.min(indexOfLastItem, bookings.length)} 
                                    {' '}trong tổng số {bookings.length} booking
                                </div>
                            </>
                        )}
                    </>
                )}
            </div>
        </>
    );
};

export default MyBookingsPage;