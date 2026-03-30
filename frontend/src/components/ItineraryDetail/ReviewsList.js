import React from 'react';
import '../../styles/itineraryCSS/ReviewsList.css';
import { getDisplayImageUrl } from '../../utils/imageUtils';

const ReviewsList = ({ reviews }) => {
  if (!reviews || reviews.length === 0) {
    return <p className="no-reviews">Chưa có đánh giá nào cho tour này. Hãy là người đầu tiên!</p>;
  }

  return (
    <div className="reviews-list-container">
      {reviews.map((review) => (
        <div key={review.id} className="review-item">
          <div className="review-author-info">
            <img 
              src={getDisplayImageUrl(review.user_avatar)} 
              alt={review.username || 'User'} 
              className="reviewer-avatar"
            />
            <div className="author-details">
              <strong className="reviewer-name">{review.username || 'Ẩn danh'}</strong>
              <span className="review-date">
                {new Date(review.created_at).toLocaleDateString('vi-VN', {
                  year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
                })}
              </span>
            </div>
          </div>
          <div className="review-rating">
            {[...Array(5)].map((_, i) => (
              <i
                key={i}
                className={`bi ${i < review.rating ? 'bi-star-fill' : 'bi-star'}`}
                style={{ color: i < review.rating ? '#ffc107' : '#e0e0e0', marginRight: '3px' }}
              />
            ))}
          </div>
          <p className="review-comment-text">{review.comment}</p>
          {review.images && review.images.length > 0 && (
            <div className="review-images-gallery">
              {review.images.map((imageUrl, imgIndex) => (
                <div key={imgIndex} className="review-image-item">
                  <img 
                    src={getDisplayImageUrl(imageUrl)} 
                    alt={`Hình ảnh đánh giá ${imgIndex + 1} cho review ${review.id}`}
                    className="review-gallery-image"
                    // onClick={() => {/* Open lightbox or larger preview */}}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default ReviewsList;