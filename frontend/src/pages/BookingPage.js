import React, { useState, useEffect, useMemo, useRef } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { tourService } from "../services/tourService";
import { bookingService } from "../services/bookingService";
import { paymentService } from "../services/paymentService";
import { promotionService } from "../services/promotionService";
import { useAuth } from "../contexts/AuthContext";
import { getDisplayImageUrl } from "../utils/imageUtils";
import PaymentMethodModal from "../components/Payment/PaymentMethodModal"; 
import "../styles/Booking/BookingPage.css";

const BookingPage = () => {
  const { tourId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const prefillData = location.state?.prefillData;

  const { user, authInitialized } = useAuth();

  // State cho dữ liệu tour và loading
  const [tour, setTour] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const errorRef = useRef(null);

  // State cho form
  const [departures, setDepartures] = useState([]);
  const [selectedDepartureId, setSelectedDepartureId] = useState("");
  const [selection, setSelection] = useState([]);
  const [contact, setContact] = useState({
    name: "",
    email: "",
    phone: "",
    special: "",
  });

  // State cho khuyến mãi
  const [promotionCode, setPromotionCode] = useState("");
  const [appliedPromotion, setAppliedPromotion] = useState(null);
  const [promoMessage, setPromoMessage] = useState({ type: "", text: "" });

  // STATE CHO MODAL THANH TOÁN
  const [bookingId, setBookingId] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  // Fetch dữ liệu tour khi component được mount
  useEffect(() => {
    if (!authInitialized) return;

    if (!user) {
      navigate("/login", { state: { from: `/booking/${tourId}` } });
      return;
    }

    // Pre-fill thông tin liên hệ từ user đã đăng nhập
    setContact({
      name: user.fullName || user.full_name || "",
      email: user.email || "",
      phone: user.phone || "",
      special: "",
    });

    const fetchTourData = async () => {
      try {
        setLoading(true);
        setError("");

        // Gọi song song 2 API để tăng tốc độ tải trang
        const [tourResponse, departureResponse] = await Promise.all([
          tourService.getTourDetail(tourId),
          tourService.getTourDepartures(tourId),
        ]);
        if (tourResponse.success && tourResponse.data) {
          setTour(tourResponse.data);

          // --- LOGIC ĐIỀN LẠI DỮ LIỆU ---
          // Nếu có dữ liệu cũ từ trang MyBookings, dùng nó để khởi tạo
          if (prefillData && prefillData.length > 0) {
            const initialSelection = tourResponse.data.prices.map((p) => {
              const prefilledItem = prefillData.find(
                (item) => item.price_type === p.price_type
              );
              return {
                price_type: p.price_type,
                quantity: prefilledItem ? prefilledItem.quantity : 0,
                unit_price: p.sale_price ?? p.price,
                label: p.price_type === "adult" ? "Người lớn" : "Trẻ em",
              };
            });
            setSelection(initialSelection);
          } else {
            // Nếu không, khởi tạo mặc định
            const initialSelection = tourResponse.data.prices.map((p) => ({
              price_type: p.price_type,
              quantity: p.price_type === "adult" ? 1 : 0, // Mặc định 1 người lớn
              unit_price: p.sale_price ?? p.price,
              label: p.price_type === "adult" ? "Người lớn" : "Trẻ em",
            }));
            setSelection(initialSelection);
          }
        } else {
          throw new Error("Không tìm thấy dữ liệu tour.");
        }
        // Xử lý lịch khởi hành
        if (departureResponse.success && departureResponse.data) {
          setDepartures(departureResponse.data);
        }
      } catch (err) {
        setError("Không thể tải thông tin tour. Vui lòng thử lại.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchTourData();
  }, [tourId, user, authInitialized, navigate, prefillData]); // Thêm prefillData vào dependency array

  // Calculate prices
  const { originalAmount, finalAmount, discountAmount } = useMemo(() => {
    const total = selection.reduce(
      (acc, item) => acc + item.quantity * item.unit_price,
      0
    );
    if (appliedPromotion) {
      const discount = appliedPromotion.discountAmount;
      return {
        originalAmount: total,
        discountAmount: discount,
        finalAmount: Math.max(0, total - discount),
      };
    }
    return { originalAmount: total, finalAmount: total, discountAmount: 0 };
  }, [selection, appliedPromotion]);

  // Handle promotion
  const handleApplyPromotion = async () => {
    if (!promotionCode) return;
    setPromoMessage({ type: "info", text: "Đang kiểm tra..." });
    try {
      const result = await promotionService.validatePromotion({
        code: promotionCode,
        originalAmount: originalAmount,
      });
      if (result.success) {
        setAppliedPromotion(result.data);
        setPromoMessage({
          type: "success",
          text: result.message || "Áp dụng mã khuyến mãi thành công!",
        });
      } else {
        setAppliedPromotion(null);
        setPromoMessage({
          type: "error",
          text: result.message || "Mã khuyến mãi không hợp lệ",
        });
      }
    } catch (err) {
      setAppliedPromotion(null);
      setPromoMessage({
        type: "error",
        text: err.message || "Không thể kết nối đến máy chủ.",
      });
    }
  };

  const handleRemovePromotion = () => {
    setAppliedPromotion(null);
    setPromotionCode("");
    setPromoMessage({ type: "", text: "" });
  };

  // XỬ LÝ SUBMIT
  const handleSubmit = async (action) => {
    // Validation
    if (originalAmount <= 0) {
      setError("Vui lòng chọn ít nhất 1 hành khách.");
      setTimeout(
        () =>
          errorRef.current?.scrollIntoView({
            behavior: "smooth",
            block: "center",
          }),
        100
      );
      return;
    }
    if (!selectedDepartureId) {
      setError("Vui lòng chọn lịch khởi hành");
      setTimeout(
        () =>
          errorRef.current?.scrollIntoView({
            behavior: "smooth",
            block: "center",
          }),
        100
      );
      return;
    }

    const hasItems = selection.some((item) => item.quantity > 0);
    if (!hasItems) {
      setError("Vui lòng chọn ít nhất một loại vé");
      setTimeout(
        () =>
          errorRef.current?.scrollIntoView({
            behavior: "smooth",
            block: "center",
          }),
        100
      );
      return;
    }

    setSubmitting(true);
    setError("");

    const bookingPayload = {
      tourId: parseInt(tourId, 10),
      tour_departure_id: parseInt(selectedDepartureId, 10),
      items: selection
        .filter((item) => item.quantity > 0)
        .map(({ price_type, quantity }) => ({ price_type, quantity })),
      promotionCode: appliedPromotion ? appliedPromotion.code : "",
      contact,
    };

    try {
      if (action === "book_only") {
        // ĐẶT TOUR - KHÔNG THANH TOÁN
        const result = await bookingService.createBooking(bookingPayload);
        alert(result.message || "Đặt tour thành công!");
        navigate("/profile/my-bookings");
      } else if (action === "book_and_pay") {
        // TẠO BOOKING TRƯỚC, SAU ĐÓ MỞ MODAL
        const result = await bookingService.createBooking(bookingPayload);

        console.log("[BookingPage] Create booking result:", result);

        let newBookingId;
        if (result.data && result.data.bookingId) {
          newBookingId = result.data.bookingId;
        } else if (result.bookingId) {
          newBookingId = result.bookingId;
        } else {
          throw new Error("Không nhận được booking ID từ server");
        }

        console.log("[BookingPage] Extracted bookingId:", newBookingId);

        // LƯU BOOKING ID VÀ MỞ MODAL
        setBookingId(newBookingId);
        setShowPaymentModal(true);
      }
    } catch (err) {
      setError(err.message || "Có lỗi xảy ra khi đặt tour");
      setTimeout(
        () =>
          errorRef.current?.scrollIntoView({
            behavior: "smooth",
            block: "center",
          }),
        100
      );
    } finally {
      setSubmitting(false);
    }
  };

  // XỬ LÝ XÁC NHẬN THANH TOÁN TỪ MODAL
  const handlePaymentConfirm = async (paymentMethod, bookingId) => {
    try {
      setSubmitting(true);

      if (paymentMethod === "credit") {
        // THANH TOÁN BẰNG CREDIT
        const result = await paymentService.payWithCredit(bookingId);

        if (result.success) {
          alert(
            `Thanh toán thành công!\n\nSố dư còn lại: ${result.data.remainingBalance.toLocaleString(
              "vi-VN"
            )} VNĐ`
          );
          navigate("/profile/my-bookings");
        }
      } else {
        // THANH TOÁN BẰNG VNPAY
        const result = await paymentService.createPaymentUrl({ bookingId });
        if (result.success && result.paymentUrl) {
          window.location.href = result.paymentUrl;
        }
      }
    } catch (error) {
      alert("❌ " + (error.message || "Thanh toán thất bại"));
    } finally {
      setSubmitting(false);
      setShowPaymentModal(false);
    }
  };

  const handleQuantityChange = (price_type, value) => {
    if (error) setError(""); // Xóa lỗi nếu có
    const newQuantity = Math.max(0, parseInt(value, 10) || 0);
    setSelection((currentSelection) =>
      currentSelection.map((item) =>
        item.price_type === price_type
          ? { ...item, quantity: newQuantity }
          : item
      )
    );
  };

  const handleContactChange = (e) => {
    if (error) setError("");
    const { name, value } = e.target;
    setContact((prev) => ({ ...prev, [name]: value }));
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
      minimumFractionDigits: 0,
    }).format(value);
  };

  if (loading) return <div className="v2-page-status">Đang tải...</div>;
  if (error && !tour)
    return (
      <div className="v2-page-status v2-error">
        {error || "Không tìm thấy thông tin tour."}
      </div>
    );
  if (!tour)
    return (
      <div className="v2-page-status v2-error">
        {error || "Không tìm thấy thông tin tour."}
      </div>
    );

  return (
    <div className="v2-booking-page">
      {/* MODAL CHỌN PHƯƠNG THỨC THANH TOÁN */}
      <PaymentMethodModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        onConfirm={handlePaymentConfirm}
        amount={finalAmount}
        bookingId={bookingId}
        loading={submitting}
      />

      {/* MAIN BOOKING FORM */}
      <div className="v2-container">
        <div className="v2-booking-layout">
          {/* LEFT COLUMN */}
          <div className="v2-booking-main">
            {/* Thông tin liên hệ */}
            <div className="v2-form-section">
              <h2 className="v2-section-title">Thông tin liên hệ</h2>
              <div className="v2-form-row">
                <div className="v2-form-group">
                  <label>Họ và tên</label>
                  <input
                    type="text"
                    name="name"
                    value={contact.name}
                    onChange={handleContactChange}
                    required
                  />
                </div>
                <div className="v2-form-group">
                  <label>Email</label>
                  <input
                    type="email"
                    name="email"
                    value={contact.email}
                    onChange={handleContactChange}
                    required
                  />
                </div>
              </div>
              <div className="v2-form-row">
                <div className="v2-form-group">
                  <label>Số điện thoại</label>
                  <input
                    type="tel"
                    name="phone"
                    value={contact.phone}
                    onChange={handleContactChange}
                    required
                  />
                </div>
              </div>
            </div>

            {/* Ngày khởi hành */}
            <div className="v2-form-section">
              <h2 className="v2-section-title">Thông tin tour</h2>
              <div className="v2-form-row">
                <div className="v2-form-group v2-full-width">
                  <label htmlFor="startDate">Ngày khởi hành</label>
                  <div className="v2-departure-list">
                    {departures.length > 0 ? (
                      departures.map((dep) => (
                        <div key={dep.id} className="v2-departure-item">
                          <input
                            type="radio"
                            id={`dep-${dep.id}`}
                            name="departureDate"
                            value={dep.id}
                            checked={selectedDepartureId === String(dep.id)}
                            onChange={(e) => {
                              if (error) setError("");
                              setSelectedDepartureId(e.target.value);
                            }}
                          />
                          <label htmlFor={`dep-${dep.id}`}>
                            <span className="departure-date">
                              {new Date(dep.departure_date).toLocaleDateString(
                                "vi-VN"
                              )}
                            </span>
                            <span className="slots-available">
                              (Còn {dep.slots_available} chỗ)
                            </span>
                          </label>
                        </div>
                      ))
                    ) : (
                      <p className="no-departures">
                        Tour hiện chưa có lịch khởi hành.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Số lượng hành khách */}
            <div className="v2-form-section">
              <h2 className="v2-section-title">Số lượng hành khách</h2>
              {selection.map((item) => (
                <div key={item.price_type} className="v2-passenger-row">
                  <div className="v2-passenger-label">
                    <span>{item.label}</span>
                    <small>{formatCurrency(item.unit_price)} / khách</small>
                  </div>
                  <div className="v2-quantity-input">
                    <button
                      type="button"
                      onClick={() =>
                        handleQuantityChange(item.price_type, item.quantity - 1)
                      }
                    >
                      -
                    </button>
                    <input type="text" value={item.quantity} readOnly />
                    <button
                      type="button"
                      onClick={() =>
                        handleQuantityChange(item.price_type, item.quantity + 1)
                      }
                    >
                      +
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Yêu cầu đặc biệt */}
            <div className="v2-form-section">
              <h2 className="v2-section-title">Yêu cầu đặc biệt</h2>
              <textarea
                name="special"
                placeholder="Ví dụ: ăn chay, dị ứng thực phẩm..."
                value={contact.special}
                onChange={handleContactChange}
              />
            </div>
          </div>

          {/* RIGHT COLUMN */}
          <div className="v2-booking-sidebar">
            <div className="v2-summary-card">
              <div className="v2-tour-summary">
                <img
                  src={getDisplayImageUrl(tour.image)}
                  alt={tour.title}
                  className="v2-tour-image"
                />
                <div className="v2-tour-info">
                  <h3>{tour.title}</h3>
                  <p>
                    <i className="fas fa-calendar-alt"></i> {tour.duration}
                  </p>
                  <p>
                    <i className="fas fa-map-marker-alt"></i> {tour.destination}
                  </p>
                </div>
              </div>

              {/* Mã khuyến mãi */}
              <div className="v2-promo-section">
                <h4>Mã khuyến mãi</h4>
                <div className="v2-promo-input-group">
                  <input
                    type="text"
                    placeholder="Nhập mã"
                    value={promotionCode}
                    onChange={(e) => setPromotionCode(e.target.value)}
                    disabled={!!appliedPromotion}
                  />
                  {appliedPromotion ? (
                    <button
                      onClick={handleRemovePromotion}
                      className="v2-btn-remove"
                    >
                      Xóa
                    </button>
                  ) : (
                    <button
                      onClick={handleApplyPromotion}
                      className="v2-btn-apply"
                    >
                      Áp dụng
                    </button>
                  )}
                </div>
                {promoMessage.text && (
                  <p className={`v2-promo-message ${promoMessage.type}`}>
                    {promoMessage.text}
                  </p>
                )}
              </div>

              {/* Tổng tiền */}
              <div className="v2-price-summary">
                <div className="v2-price-row">
                  <span>Tạm tính</span>
                  <span>{formatCurrency(originalAmount)}</span>
                </div>
                <div className="v2-price-row">
                  <span>Giảm giá</span>
                  <span className="v2-discount">
                    - {formatCurrency(discountAmount)}
                  </span>
                </div>
                <hr />
                <div className="v2-price-row v2-total">
                  <span>Tổng cộng</span>
                  <span>{formatCurrency(finalAmount)}</span>
                </div>
              </div>

              {/* Error message */}
              <div ref={errorRef}>
                {error && <p className="v2-form-error">{error}</p>}
              </div>

              {/* Action buttons */}
              <div className="v2-action-buttons">
                <button
                  type="button"
                  onClick={() => handleSubmit("book_only")}
                  className="v2-submit-btn v2-btn-primary"
                  disabled={submitting}
                >
                  {submitting ? "Đang xử lý..." : "Đặt ngay"}
                </button>
                <button
                  type="button"
                  onClick={() => handleSubmit("book_and_pay")}
                  className="v2-submit-btn v2-btn-secondary"
                  disabled={submitting}
                >
                  {submitting ? "Đang xử lý..." : "Thanh toán ngay"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingPage;
