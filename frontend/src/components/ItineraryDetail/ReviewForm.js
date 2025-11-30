import React, { useState } from 'react';
import '../../styles/itineraryCSS/ReviewForm.css';

const ReviewForm = ({ onSubmit }) => {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (rating > 0 && comment.trim()) {
      onSubmit({ rating, comment });
      setRating(0);
      setComment('');
    }
  };

  return (
    <div className="review-form">
      <h3>Viết đánh giá của bạn</h3>
      <form onSubmit={handleSubmit}>
        <div className="star-rating">
          {[1, 2, 3, 4, 5].map((star) => (
            <i
              key={star}
              className={`bi ${rating >= star ? 'bi-star-fill' : 'bi-star'}`}
              onClick={() => setRating(star)}
            />
          ))}
        </div>
        <textarea
          placeholder="Chia sẻ trải nghiệm của bạn..."
          value={comment}
          onChange={(e) => setComment(e.target.value)}
        />
        <button type="submit" disabled={rating === 0 || !comment.trim()}>
          Gửi đánh giá
        </button>
      </form>
    </div>
  );
};

export default ReviewForm;