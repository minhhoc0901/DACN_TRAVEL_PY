
import React from 'react';
import { Link } from 'react-router-dom';
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
        creator_name
    } = tour;

    // Tính toán phần trăm giảm giá
    let discount_percent = 0;
    if (has_sale === 1 && max_price > 0 && max_price > min_price) {
        discount_percent = Math.round(((max_price - min_price) / max_price) * 100);
    }

    // Format price
    const formatPrice = (price) => {
        if (!price || price === 0) return 'Liên hệ';
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(price);
    };

    // Render stars
    const renderStars = (rating) => {
        const stars = [];
        const fullStars = Math.floor(rating);
        const hasHalfStar = rating % 1 !== 0;

        for (let i = 0; i < fullStars; i++) {
            stars.push(<i key={i} className="fas fa-star"></i>);
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

    // Format image URL
    const getImageUrl = () => {
        if (!image) return '/default-tour-image.jpg';
        if (image.startsWith('http')) return image;
        return `http://localhost:5000${image}`;
    };

    return (
        <div className="v2-tour-card">
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

            <div className="v2-tour-card-content">
                <div className="v2-tour-header">
                    <h3 className="v2-tour-title">
                        <Link to={`/tours/${id}`} className="v2-tour-link">
                            {title || destination}
                        </Link>
                    </h3>
                    {departure_from && (
                        <div className="v2-tour-location">
                            <i className="fas fa-map-marker-alt"></i>
                            <span>Khởi hành từ: {departure_from}</span>
                        </div>
                    )}
                </div>

                <div className="v2-tour-rating">
                    <div className="v2-stars">
                        {renderStars(avg_rating || 0)}
                    </div>
                    <span className="v2-rating-text">
                        {avg_rating > 0 ? (
                            <>
                                {avg_rating.toFixed(1)}
                                {review_count > 0 && ` (${review_count} đánh giá)`}
                            </>
                        ) : (
                            'Chưa có đánh giá'
                        )}
                    </span>
                </div>

                {description && (
                    <div className="v2-tour-description">
                        <p>
                            {description.length > 100 
                                ? `${description.substring(0, 100)}...` 
                                : description
                            }
                        </p>
                    </div>
                )}

                <div className="v2-tour-card-footer">
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

                    <div className="v2-tour-actions">
                        <Link 
                            to={`/tours/${id}`} 
                            className="v2-btn v2-btn--outline"
                        >
                            <i className="fas fa-eye"></i> Xem chi tiết
                        </Link>
                        
                        {/* CHUYỂN BUTTON THÀNH LINK */}
                        <Link 
                            to={`/booking/${id}`}
                            className="v2-btn v2-btn--primary"
                            style={{ textDecoration: 'none' }}
                        >
                            <i className="fas fa-calendar-check"></i> Đặt ngay
                        </Link>
                    </div>
                    
                    {creator_name && creator_name !== 'Không rõ' && (
                        <div className="v2-tour-creator">
                            <i className="fas fa-user-check"></i>
                            <span>Tổ chức bởi: {creator_name}</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default TourCard;