
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { tourService } from '../services/tourService';
import { bookingService } from '../services/bookingService';
import { paymentService } from '../services/paymentService';
import { promotionService } from '../services/promotionService';
import { useAuth } from '../contexts/AuthContext';
import '../styles/Booking/BookingPage.css';

const BookingPage = () => {
    const { tourId } = useParams();
    const navigate = useNavigate();
    const location = useLocation(); // Hook để truy cập state được truyền qua
    const prefillData = location.state?.prefillData; // Lấy dữ liệu cũ nếu có

    const { user, authInitialized } = useAuth();

    // State cho dữ liệu tour và loading
    const [tour, setTour] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const errorRef = useRef(null);
    // State cho form, khớp với cấu trúc API
    const [departures, setDepartures] = useState([]);
    const [selectedDepartureId, setSelectedDepartureId] = useState('');
    const [selection, setSelection] = useState([]);
    const [contact, setContact] = useState({
        name: '',
        email: '',
        phone: '',
        special: ''
    });

    // State cho khuyến mãi
    const [promotionCode, setPromotionCode] = useState('');
    const [appliedPromotion, setAppliedPromotion] = useState(null);
    const [promoMessage, setPromoMessage] = useState({ type: '', text: '' });

    // Fetch dữ liệu tour khi component được mount
    useEffect(() => {
        if (!authInitialized) return;

        if (!user) {
            navigate('/login', { state: { from: `/booking/${tourId}` } });
            return;
        }

        // Pre-fill thông tin liên hệ từ user đã đăng nhập
        setContact({
            name: user.fullName || user.full_name || '',
            email: user.email || '',
            phone: user.phone || '',
            special: ''
        });

        const fetchTourData = async () => {
            try {
                setLoading(true);
                setError('');

                // Gọi song song 2 API để tăng tốc độ tải trang
                const [tourResponse, departureResponse] = await Promise.all([
                    tourService.getTourDetail(tourId),
                    tourService.getTourDepartures(tourId)
                ]);
                if (tourResponse.success && tourResponse.data) {
                    setTour(tourResponse.data);

                    // --- LOGIC ĐIỀN LẠI DỮ LIỆU ---
                    // Nếu có dữ liệu cũ từ trang MyBookings, dùng nó để khởi tạo
                    if (prefillData && prefillData.length > 0) {
                        const initialSelection = tourResponse.data.prices.map(p => {
                            const prefilledItem = prefillData.find(item => item.price_type === p.price_type);
                            return {
                                price_type: p.price_type,
                                quantity: prefilledItem ? prefilledItem.quantity : 0,
                                unit_price: p.sale_price ?? p.price,
                                label: p.price_type === 'adult' ? 'Người lớn' : 'Trẻ em'
                            };
                        });
                        setSelection(initialSelection);
                    } else {
                        // Nếu không, khởi tạo mặc định
                        const initialSelection = tourResponse.data.prices.map(p => ({
                            price_type: p.price_type,
                            quantity: p.price_type === 'adult' ? 1 : 0, // Mặc định 1 người lớn
                            unit_price: p.sale_price ?? p.price,
                            label: p.price_type === 'adult' ? 'Người lớn' : 'Trẻ em'
                        }));
                        setSelection(initialSelection);
                    }
                } else {
                    throw new Error('Không tìm thấy dữ liệu tour.');
                }
                // Xử lý lịch khởi hành
                if (departureResponse.success && departureResponse.data) {
                    setDepartures(departureResponse.data);
                }
            } catch (err) {
                setError('Không thể tải thông tin tour. Vui lòng thử lại.');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchTourData();
    }, [tourId, user, authInitialized, navigate, prefillData]); // Thêm prefillData vào dependency array

    const { originalAmount, finalAmount, discountAmount } = useMemo(() => {
        const total = selection.reduce((acc, item) => acc + (item.quantity * item.unit_price), 0);
        if (appliedPromotion) {
            const discount = appliedPromotion.discountAmount;
            return {
                originalAmount: total,
                discountAmount: discount,
                finalAmount: Math.max(0, total - discount)
            };
        }
        return { originalAmount: total, finalAmount: total, discountAmount: 0 };
    }, [selection, appliedPromotion]);

    const handleApplyPromotion = async () => {
        if (!promotionCode) return;
        setPromoMessage({ type: 'info', text: 'Đang kiểm tra...' });
        try {
            const result = await promotionService.validatePromotion({
                code: promotionCode,
                originalAmount: originalAmount
            });
            if (result.success) {
                setAppliedPromotion(result.data);
                setPromoMessage({ type: 'success', text: result.message });
            } else {
                setAppliedPromotion(null);
                setPromoMessage({ type: 'error', text: result.message });
            }
        } catch (err) {
            setAppliedPromotion(null);
            setPromoMessage({ type: 'error', text: 'Không thể kết nối đến máy chủ.' });
        }
    };

    const handleRemovePromotion = () => {
        setAppliedPromotion(null);
        setPromotionCode('');
        setPromoMessage({ type: '', text: '' });
    };

    const handleSubmit = async (action) => {
        if (originalAmount <= 0) {
            setError('Vui lòng chọn ít nhất 1 hành khách.');
            setTimeout(() => errorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 100);
            return;
        }
        if (!selectedDepartureId) {
            setError('Vui lòng chọn ngày khởi hành.');
            setTimeout(() => errorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 100);
            return;
        }
        setSubmitting(true);
        setError('');

        const bookingPayload = {
            tourId: parseInt(tourId, 10),
            tour_departure_id: parseInt(selectedDepartureId, 10), // <-- Dùng ID lịch khởi hành
            items: selection.filter(item => item.quantity > 0).map(({ price_type, quantity }) => ({ price_type, quantity })),
            promotionCode: appliedPromotion ? appliedPromotion.code : '',
            contact
        };

        try {
            if (action === 'book_only') {
                const result = await bookingService.createBooking(bookingPayload);
                alert(result.message || 'Đặt tour thành công! Vui lòng kiểm tra trong mục "Đơn hàng của tôi".');
                navigate('/profile/my-bookings'); // Chuyển hướng đến trang quản lý đơn hàng
            }
            else if (action === 'book_and_pay') {
                const bookingResult = await bookingService.createBooking(bookingPayload);
                if (!bookingResult.success) {
                    throw new Error(bookingResult.message || 'Tạo đơn hàng thất bại.');
                }

                const paymentResult = await paymentService.createPaymentUrl({ bookingId: bookingResult.bookingId });
                if (paymentResult.success && paymentResult.paymentUrl) {
                    window.location.href = paymentResult.paymentUrl;
                } else {
                    throw new Error(paymentResult.message || 'Không thể tạo link thanh toán.');
                }
            }
        } catch (err) {
            setError(err.message);
            setTimeout(() => errorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 100);
          
        } finally {
            setSubmitting(false);
        }
    };

    const handleQuantityChange = (price_type, value) => {
        if (error) setError(''); // Xóa lỗi nếu có
        const newQuantity = Math.max(0, parseInt(value, 10) || 0);
        setSelection(currentSelection =>
            currentSelection.map(item =>
                item.price_type === price_type ? { ...item, quantity: newQuantity } : item
            )
        );
    };

    const handleContactChange = (e) => {
        if (error) setError(''); 
        const { name, value } = e.target;
        setContact(prev => ({ ...prev, [name]: value }));
    };

    const formatCurrency = (value) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);

    if (loading) return <div className="v2-page-status">Đang tải trang đặt tour...</div>;
    if (!tour)  return <div className="v2-page-status v2-error">{error || 'Không tìm thấy thông tin tour.'}</div>;


    return (
        <div className="v2-booking-page">
            <div className="v2-container">
                <form onSubmit={handleSubmit} className="v2-booking-layout">
                    <div className="v2-booking-main">
                        <div className="v2-form-section">
                            <h2 className="v2-section-title">Thông tin liên hệ</h2>
                            <div className="v2-form-grid">
                                <div className="v2-form-group">
                                    <label htmlFor="name">Họ và tên</label>
                                    <input type="text" id="name" name="name" value={contact.name} onChange={handleContactChange} required />
                                </div>
                                <div className="v2-form-group">
                                    <label htmlFor="email">Email</label>
                                    <input type="email" id="email" name="email" value={contact.email} onChange={handleContactChange} required />
                                </div>
                                <div className="v2-form-group">
                                    <label htmlFor="phone">Số điện thoại</label>
                                    <input type="tel" id="phone" name="phone" value={contact.phone} onChange={handleContactChange} required />
                                </div>
                                <div className="v2-form-group v2-full-width">
                                    <label htmlFor="startDate">Ngày khởi hành</label>
                                    <div className="v2-departure-list">
                                        {departures.length > 0 ? (
                                            departures.map(dep => (
                                                <div key={dep.id} className="v2-departure-item">
                                                    <input
                                                        type="radio"
                                                        id={`dep-${dep.id}`}
                                                        name="departureDate"
                                                        value={dep.id}
                                                        checked={selectedDepartureId === String(dep.id)}
                                                        onChange={(e) =>{
                                                            if (error) setError('');
                                                            setSelectedDepartureId(e.target.value)
                                                        }}
                                                    />
                                                    <label htmlFor={`dep-${dep.id}`}>
                                                        <span className="departure-date">{new Date(dep.departure_date).toLocaleDateString('vi-VN')}</span>
                                                        <span className="slots-available">(Còn {dep.slots_available} chỗ)</span>
                                                    </label>
                                                </div>
                                            ))
                                        ) : (
                                            <p className="no-departures">Tour hiện chưa có lịch khởi hành.</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="v2-form-section">
                            <h2 className="v2-section-title">Số lượng hành khách</h2>
                            {selection.map(item => (
                                <div key={item.price_type} className="v2-passenger-row">
                                    <div className="v2-passenger-label">
                                        <span>{item.label}</span>
                                        <small>{formatCurrency(item.unit_price)} / khách</small>
                                    </div>
                                    <div className="v2-quantity-input">
                                        <button type="button" onClick={() => handleQuantityChange(item.price_type, item.quantity - 1)}>-</button>
                                        <input type="text" value={item.quantity} readOnly />
                                        <button type="button" onClick={() => handleQuantityChange(item.price_type, item.quantity + 1)}>+</button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="v2-form-section">
                            <h2 className="v2-section-title">Yêu cầu đặc biệt</h2>
                            <textarea name="special" placeholder="Ví dụ: ăn chay, dị ứng thực phẩm..." value={contact.special} onChange={handleContactChange}></textarea>
                        </div>
                    </div>

                    <div className="v2-booking-sidebar">
                        <div className="v2-summary-card">
                            <div className="v2-tour-summary">
                                <img src={`http://localhost:5000${tour.image}`} alt={tour.title} className="v2-tour-image" />
                                <div className="v2-tour-info">
                                    <h3>{tour.title}</h3>
                                    <p><i className="fas fa-calendar-alt"></i> {tour.duration}</p>
                                    <p><i className="fas fa-map-marker-alt"></i> {tour.destination}</p>
                                </div>
                            </div>
                            <div className="v2-promo-section">
                                <input
                                    type="text"
                                    placeholder="Nhập mã khuyến mãi"
                                    value={promotionCode}
                                    onChange={(e) => setPromotionCode(e.target.value)}
                                    disabled={!!appliedPromotion}
                                />
                                {appliedPromotion ? (
                                    <button
                                        type="button"
                                        onClick={handleRemovePromotion}
                                        className="v2-promo-btn-remove"
                                    >
                                        Hủy
                                    </button>
                                ) : (
                                    <button
                                        type="button"
                                        onClick={handleApplyPromotion}
                                    >
                                        Áp dụng
                                    </button>
                                )}
                            </div>
                            {promoMessage.text && <p className={`v2-promo-message ${promoMessage.type}`}>{promoMessage.text}</p>}
                            <div className="v2-price-details">
                                <div className="v2-price-row">
                                    <span>Tạm tính</span>
                                    <span>{formatCurrency(originalAmount)}</span>
                                </div>
                                <div className="v2-price-row">
                                    <span>Giảm giá</span>
                                    <span className="v2-discount">- {formatCurrency(discountAmount)}</span>
                                </div>
                                <hr />
                                <div className="v2-price-row v2-total">
                                    <span>Tổng cộng</span>
                                    <span>{formatCurrency(finalAmount)}</span>
                                </div>
                            </div>
                            <div ref={errorRef}>
                                {error && <p className="v2-form-error">{error}</p>}
                            </div>
                            <div className="v2-action-buttons">
                                <button
                                    type="button"
                                    onClick={() => handleSubmit('book_only')}
                                    className="v2-submit-btn v2-btn-primary"
                                    disabled={submitting}
                                >
                                    {submitting ? 'Đang xử lý...' : 'Đặt ngay'}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleSubmit('book_and_pay')}
                                    className="v2-submit-btn v2-btn-secondary"
                                    disabled={submitting}
                                >
                                    {submitting ? 'Đang xử lý...' : 'Thanh Toán Ngay'}
                                </button>
                            </div>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default BookingPage;