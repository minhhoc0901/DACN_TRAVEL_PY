import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { tourDepartureService } from '../../services/tourDepartureService';
import { getDisplayImageUrl } from '../../utils/imageUtils';
import '../../styles/Tour/TourCard.css';

const TourCard = ({ tour }) => {
    const {
        id,
        title,
        destination,
        departure_from,
        duration,
        description,
        image,
        min_price,
        max_price,
        has_sale,
        avg_rating,
        review_count,

    } = tour;

    // STATE QUẢN LÝ NGÀY KHỞI HÀNH
    const [departures, setDepartures] = useState([]);
    const [currentDepartureIndex, setCurrentDepartureIndex] = useState(0);
    const [loadingDepartures, setLoadingDepartures] = useState(false);

    // FETCH NGÀY KHỞI HÀNH
    useEffect(() => {
        const fetchDepartures = async () => {
            try {
                setLoadingDepartures(true);
                const availableDepartures = await tourDepartureService.getAvailableDepartures(id);
                setDepartures(availableDepartures);
            } catch (error) {
                console.error(`[TourCard] Error fetching departures for tour #${id}:`, error);
                setDepartures([]);
            } finally {
                setLoadingDepartures(false);
            }
        };

        if (id) {
            fetchDepartures();
        }
    }, [id]);

    // XỬ LÝ CHUYỂN NGÀY KHỞI HÀNH
    const handleNextDeparture = () => {
        setCurrentDepartureIndex((prevIndex) => (prevIndex + 1) % departures.length);
    };

    const handlePrevDeparture = () => {
        setCurrentDepartureIndex((prevIndex) => 
            prevIndex === 0 ? departures.length - 1 : prevIndex - 1
        );
    };

    // TÍNH TOÁN % GIẢM GIÁ
    let discount_percent = 0;
    if (has_sale === 1 && max_price > 0 && max_price > min_price) {
        discount_percent = Math.round(((max_price - min_price) / max_price) * 100);
    }

    // FORMAT GIÁ
    const formatPrice = (price) => {
        if (!price || price === 0) return 'Liên hệ';
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(price);
    };

    // RENDER SAO ĐÁNH GIÁ
    const renderStars = (rating) => {
        const stars = [];
        const fullStars = Math.floor(rating);
        const hasHalfStar = rating % 1 >= 0.5;

        for (let i = 0; i < fullStars; i++) {
            stars.push(<i key={`full-${i}`} className="fas fa-star"></i>);
        }
        if (hasHalfStar) {
            stars.push(<i key="half" className="fas fa-star-half-alt"></i>);
        }
        const emptyStars = 5 - Math.ceil(rating);
        for (let i = 0; i < emptyStars; i++) {
            stars.push(<i key={`empty-${i}`} className="far fa-star"></i>);
        }
        return stars;
    };

    // FORMAT IMAGE URL
    const getImageUrl = () => {
        return getDisplayImageUrl(image);
    };

    // FORMAT NGÀY KHỞI HÀNH
    const formatDepartureDate = (dateString) => {
        if (!dateString) return '';
        return new Date(dateString).toLocaleDateString('vi-VN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    };

    // KIỂM TRA CÓ THỂ ĐẶT TOUR HAY KHÔNG
    const canBookTour = min_price > 0 && departures.length > 0;

    // LẤY NGÀY KHỞI HÀNH HIỆN TẠI
    const currentDeparture = departures[currentDepartureIndex];

    return (
        <div className="v2-tour-card">
            {/* IMAGE SECTION */}
            <div className="v2-tour-card-image-wrapper">
                <img 
                    src={getImageUrl()} 
                    alt={title || destination}
                    onError={(e) => { e.target.src = '/default-tour-image.jpg'; }}
                    className="v2-tour-card-image"
                />
                {has_sale === 1 && discount_percent > 0 && (
                    <div className="v2-sale-badge">
                        KHUYẾN MÃI {discount_percent}%
                    </div>
                )}
                {duration && (
                    <div className="v2-tour-duration">
                        <i className="far fa-clock"></i> {duration}
                    </div>
                )}
            </div>

            {/* CONTENT SECTION */}
            <div className="v2-tour-card-content">
                {/* TITLE */}
                <h3 className="v2-tour-title">
                    <Link to={`/tours/${id}`} className="v2-tour-link">
                        {title || destination}
                    </Link>
                </h3>

                {/* DEPARTURE FROM */}
                {departure_from && (
                    <div className="v2-tour-meta-item">
                        <i className="fas fa-map-marker-alt"></i>
                        <span>Khởi hành từ: <strong>{departure_from}</strong></span>
                    </div>
                )}

                {/* DEPARTURE DATE */}
                {loadingDepartures ? (
                    <div className="v2-tour-departure-loading">
                        <i className="fas fa-spinner fa-spin"></i>
                        <span>Đang tải lịch...</span>
                    </div>
                ) : departures.length > 0 ? (
                    <div className="v2-tour-departure-info">
                        <div className="v2-departure-header">
                            <i className="fas fa-calendar-alt"></i>
                            <span>Ngày khởi hành:</span>
                        </div>
                        
                        <div className="v2-departure-selector">
                            {departures.length > 1 && (
                                <button 
                                    className="v2-departure-nav prev"
                                    onClick={handlePrevDeparture}
                                    aria-label="Ngày trước"
                                >
                                    <i className="fas fa-chevron-left"></i>
                                </button>
                            )}
                            
                            <div className="v2-departure-date">
                                <span className="date-text">
                                    {formatDepartureDate(currentDeparture?.departure_date)}
                                </span>
                                {departures.length > 1 && (
                                    <span className="departure-count">
                                        ({currentDepartureIndex + 1}/{departures.length})
                                    </span>
                                )}
                            </div>
                            
                            {departures.length > 1 && (
                                <button 
                                    className="v2-departure-nav next"
                                    onClick={handleNextDeparture}
                                    aria-label="Ngày tiếp"
                                >
                                    <i className="fas fa-chevron-right"></i>
                                </button>
                            )}
                        </div>
                        
                        <div className="v2-departure-slots">
                            <i className="fas fa-users"></i>
                            <span>Còn {currentDeparture?.slots_available || 0} chỗ</span>
                        </div>
                    </div>
                ) : (
                    <div className="v2-tour-no-departure">
                        <i className="fas fa-info-circle"></i>
                        <span>Tour hiện chưa có lịch khởi hành</span>
                    </div>
                )}

                {/* RATING */}
                <div className="v2-tour-rating">
                    <div className="v2-stars">
                        {renderStars(avg_rating || 0)}
                    </div>
                    <span className="v2-rating-text">
                        {avg_rating > 0 ? (
                            <>
                                <strong>{avg_rating.toFixed(1)}</strong>
                                {review_count > 0 && ` (${review_count} đánh giá)`}
                            </>
                        ) : (
                            'Chưa có đánh giá'
                        )}
                    </span>
                </div>


                {/* DESCRIPTION */}
                {description && (
                    <div className="v2-tour-description">
                        <p>
                            {description.length > 80 
                                ? `${description.substring(0, 80)}...` 
                                : description
                            }
                        </p>
                    </div>
                )}

                {/* FOOTER: PRICE & ACTIONS */}
                <div className="v2-tour-card-footer">
                    {/* PRICE */}
                    <div className="v2-tour-price">
                        {min_price > 0 ? (
                            <>
                                <span className="v2-price-label">Giá chỉ từ</span>
                                <div className="v2-price-container">
                                    <span className="v2-current-price">
                                        {formatPrice(min_price)}
                                    </span>
                                    {has_sale === 1 && max_price > min_price && (
                                        <span className="v2-original-price">
                                            {formatPrice(max_price)}
                                        </span>
                                    )}
                                </div>
                            </>
                        ) : (
                            <span className="v2-price-contact">Liên hệ</span>
                        )}
                    </div>

                    {/* ACTIONS */}
                    <div className="v2-tour-actions">
                        <Link 
                            to={`/tours/${id}`} 
                            className="v2-btn v2-btn--outline"
                        >
                            Xem chi tiết
                        </Link>
                        
                        {canBookTour ? (
                            <Link 
                                to={`/booking/${id}`}
                                state={{ 
                                    selectedDepartureId: currentDeparture?.id 
                                }}
                                className="v2-btn v2-btn--primary"
                            >
                                Đặt ngay
                            </Link>
                        ) : (
                            <button 
                                className="v2-btn v2-btn--primary v2-btn--disabled"
                                disabled
                                title={
                                    min_price <= 0 
                                        ? "Tour chưa có giá" 
                                        : "Tour chưa có lịch khởi hành"
                                }
                            >
                                Không thể đặt
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TourCard;