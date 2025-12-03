import React, { useState, useEffect } from 'react';
import '../../styles/itineraryCSS/RatingModal.css';

const RatingModal = ({
  show,
  onClose,
  rating,
  setRating,
  reviewText,
  setReviewText,
  onSubmit,
  selectedFiles,
  setSelectedFiles,  // Function to update parent's File objects
}) => {
  const [imagePreviews, setImagePreviews] = useState([]);

  useEffect(() => {
    // Create previews when selectedFiles changes
    const newPreviews = selectedFiles.map(file => URL.createObjectURL(file));
    setImagePreviews(newPreviews);

    // Cleanup object URLs on component unmount or when selectedFiles change
    return () => {
      newPreviews.forEach(url => URL.revokeObjectURL(url));
    };
  }, [selectedFiles]);

  console.log('RatingModal show:', show);
  if (!show) return null;

  const handleFileChange = (event) => {
    const files = Array.from(event.target.files);
    if (selectedFiles.length + files.length > 5) {
        alert("Bạn chỉ có thể tải lên tối đa 5 ảnh.");
        const remainingSlots = 5 - selectedFiles.length;
        if (remainingSlots > 0) {
            setSelectedFiles(prev => [...prev, ...files.slice(0, remainingSlots)]);
        }
        event.target.value = null;
        return;
    }
    setSelectedFiles(prev => [...prev, ...files]);
    event.target.value = null;
  };

  const handleRemoveImage = (indexToRemove) => {
    setSelectedFiles(prev => prev.filter((_, index) => index !== indexToRemove));
  };

  const handleInternalSubmit = (e) => {
    e.preventDefault();
    if (rating === 0) {
        alert("Vui lòng chọn số sao đánh giá.");
        return;
    }
    if (!reviewText.trim()) {
        alert("Vui lòng viết nhận xét của bạn.");
        return;
    }
    onSubmit();
  };

  return (
    <div className={`rating-modal-overlay ${show ? 'show' : ''}`}>
      <div className="rating-modal">
        <div className="rating-modal-header">
          <h3>Đánh giá tour</h3>
          <button className="close-modal" onClick={onClose}>
            <i className="bi bi-x" />
          </button>
        </div>
        <form onSubmit={handleInternalSubmit}>
          <div className="star-rating">
            <p>Đánh giá của bạn: <span className="required">*</span></p>
            <div className="stars">
              {[1, 2, 3, 4, 5].map(star => (
                <i
                  key={star}
                  className={`bi ${rating >= star ? 'bi-star-fill' : 'bi-star'}`}
                  onClick={() => setRating(star)}
                  style={{ cursor: 'pointer', color: rating >= star ? '#ffc107' : '#e0e0e0', fontSize: '1.5rem', marginRight: '5px' }}
                />
              ))}
            </div>
          </div>
          <div className="review-input">
            <label htmlFor="review-text-modal">Nhận xét của bạn:</label>
            <textarea
              id="review-text-modal"
              rows="4"
              value={reviewText}
              onChange={e => setReviewText(e.target.value)}
              placeholder="Chia sẻ trải nghiệm của bạn về tour này..."
            />
          </div>

          <div className="review-image-upload">
            <label htmlFor="review-images-modal">Thêm hình ảnh (tối đa 5 ảnh):</label>
            <input
              type="file"
              id="review-images-modal"
              multiple
              accept="image/jpeg, image/png, image/gif"
              onChange={handleFileChange}
              disabled={selectedFiles.length >= 5}
              className="form-control-file"
            />
            {selectedFiles.length >= 5 && <p className="image-limit-note">Bạn đã đạt giới hạn 5 ảnh.</p>}
            <div className="image-previews-modal">
              {imagePreviews.map((preview, index) => (
                <div key={index} className="image-preview-item-modal">
                  <img src={preview} alt={`Xem trước ${index + 1}`} />
                  <button type="button" onClick={() => handleRemoveImage(index)} className="remove-image-btn-modal">
                    <i className="bi bi-x-circle-fill"></i>
                  </button>
                </div>
              ))}
            </div>
          </div>

          <button
            type="submit"
            className="submit-rating"
            disabled={rating === 0 || !reviewText.trim()}
          >
            Gửi đánh giá
          </button>
        </form>
      </div>
    </div>
  );
};

export default RatingModal;