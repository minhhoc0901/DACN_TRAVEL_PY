import React from 'react';
import TourSidebar from './TourSidebar';
import TourTabContent from './TourTabContent';
import RatingModal from './RatingModal';

const TourContent = ({
  tour,
  activeTab,
  reviews,
  showRatingModal,
  setShowRatingModal,
  rating,
  setRating,
  reviewText,
  setReviewText,
  handleRatingSubmit,
}) => {
  return (
    <div className="tour-content">
      <TourSidebar tour={tour} />
      <div className="tour-main-content">
        <TourTabContent tour={tour} activeTab={activeTab} reviews={reviews} />
        <RatingModal
          show={showRatingModal}
          onClose={() => setShowRatingModal(false)}
          rating={rating}
          setRating={setRating}
          reviewText={reviewText}
          setReviewText={setReviewText}
          onSubmit={handleRatingSubmit}
        />
      </div>
    </div>
  );
};

export default TourContent;