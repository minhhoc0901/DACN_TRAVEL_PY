import React from 'react';
import { Link } from 'react-router-dom';
import '../../styles/itineraryCSS/TourHeader.css';

const TourHeader = ({ tour }) => {
  if (!tour) return null;

  const placeholderImage = 'https://via.placeholder.com/1200x500?text=Tour+Image';
  const imageUrl = tour.image && tour.image.startsWith('/') 
                   ? `http://localhost:5000${tour.image}` 
                   : (tour.image || placeholderImage);

  return (
    <section className="tour-header-section">
      <img src={imageUrl} alt={tour.destination} className="tour-header-image" />
      <div className="tour-header-overlay">
        <nav aria-label="breadcrumb" className="tour-header-breadcrumbs">
          <Link to="/">Trang chủ</Link>
          <span className="breadcrumb-separator">/</span>
          <Link to="/itinerary">Tours</Link>
          <span className="breadcrumb-separator">/</span>
          <span>{tour.destination}</span>
        </nav>
        <h1 className="tour-header-title">{tour.destination}</h1>
        <div className="tour-header-meta">
          <div className="tour-header-meta-item">
            <i className="bi bi-clock"></i>
            <span>{tour.duration || 'N/A'}</span>
          </div>
          <div className="tour-header-meta-item">
            <i className="bi bi-geo-alt-fill"></i>
            <span>Từ: {tour.departure_from || 'N/A'}</span>
          </div>
          {/* Add more meta items like average rating if available */}
          {/* Example: 
          <div className="tour-header-meta-item">
            <i className="bi bi-star-fill"></i>
            <span>{tour.averageRating || 'Chưa có đánh giá'} ({tour.reviewCount || 0} đánh giá)</span>
          </div> 
          */}
        </div>
      </div>
    </section>
  );
};

export default TourHeader;