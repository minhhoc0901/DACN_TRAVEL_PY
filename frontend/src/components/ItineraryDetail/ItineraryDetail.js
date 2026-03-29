import React, { useState, useEffect, useCallback } from 'react'; 
import { useParams, Link } from 'react-router-dom';
import axios from 'axios'; 
import TourHeader from './TourHeader';
import TourNavigation from './TourNavigation';
import TourTabContent from './TourTabContent';
import RatingModal from './RatingModal'; 
import { useAuth } from '../../contexts/AuthContext'; 
import '../../styles/itineraryCSS/ItineraryDetail.css';

const ItineraryDetail = () => {
  const { id: tourId } = useParams();
  const [tour, setTour] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [reviews, setReviews] = useState([]);
  const { getToken, isAuthenticated } = useAuth(); // Lấy token và trạng thái đăng nhập

  // State cho RatingModal
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [rating, setRating] = useState(0); // 0 nghĩa là chưa chọn
  const [reviewText, setReviewText] = useState('');
  const [selectedReviewFiles, setSelectedReviewFiles] = useState([]);

  const fetchTourAndReviews = useCallback(async () => { // Wrap with useCallback
    setLoading(true);
    try {
      const tourResponse = await axios.get(`http://localhost:5000/api/tours/${tourId}`);
      if (!tourResponse.data.success) throw new Error(tourResponse.data.message || 'Không thể tải thông tin tour');
      
      const fetchedTour = tourResponse.data.tour;
        // Bổ sung dữ liệu nếu thiếu (logic này bạn đã có)
        const days = parseInt(fetchedTour.duration.split(' ')[0]) || 1;
        const destinationParts = fetchedTour.destination.split('|').map(part => part.trim());

        fetchedTour.description = fetchedTour.description || 
        `Tour khám phá vẻ đẹp của ${fetchedTour.destination}. Hành trình ${fetchedTour.duration} xuất phát từ ${fetchedTour.departure_from}.`;
        fetchedTour.highlights = fetchedTour.highlights?.length > 0 ? fetchedTour.highlights : [
        `Khám phá vùng đất ${destinationParts[0]}`,
        `Tham quan ${destinationParts[1] || 'các thắng cảnh nổi tiếng'}`,
        `Trải nghiệm văn hóa và ẩm thực địa phương`,
        ];
        
        if (!fetchedTour.schedule || fetchedTour.schedule.length === 0) {
        fetchedTour.schedule = Array.from({ length: days }, (_, i) => ({
            day: `Ngày ${i + 1}`,
            title: `NGÀY ${i + 1}: ${destinationParts[i] || 'KHÁM PHÁ ĐỊA PHƯƠNG'}`,
            activities: [
            "06:00: Dùng bữa sáng tại khách sạn",
            "08:00: Khởi hành tham quan các điểm du lịch",
            "12:00: Dùng bữa trưa tại nhà hàng địa phương",
            "14:00: Tiếp tục hành trình khám phá",
            "18:00: Dùng bữa tối, nghỉ ngơi tại khách sạn",
            ],
            locations: fetchedTour.locations?.filter((_, locationIndex) => locationIndex % days === i) || []
        }));
        } else {
            // Nếu schedule không có locations, thêm các địa điểm từ tour.locations vào
            if (fetchedTour.schedule?.length > 0) {
                fetchedTour.schedule.forEach((day, index) => {
                    if (!day.locations || day.locations.length === 0) {
                    // const dayLocations = fetchedTour.locations?.filter( // Comment out or remove unused variable
                    //     loc => fetchedTour.schedule[index]?.locations?.some(
                    //     dayLoc => dayLoc.id === loc.id // This logic might need adjustment based on how locations are structured in schedule
                    //     )
                    // );
                    // A simpler approach if schedule doesn't initially link locations:
                    // day.locations = fetchedTour.locations?.filter((_, locIndex) => locIndex % fetchedTour.schedule.length === index) || [];
                    day.locations = day.locations || []; // Ensure it's an array
                    }
                });
            }
        }
        
        fetchedTour.includes = fetchedTour.includes?.length > 0 ? fetchedTour.includes : [
        "Xe du lịch đời mới máy lạnh",
        "Khách sạn tiêu chuẩn 3 sao (2 người/phòng)",
        "Các bữa ăn theo chương trình",
        "Hướng dẫn viên nhiệt tình, kinh nghiệm",
        "Vé tham quan các điểm theo lịch trình",
        "Bảo hiểm du lịch",
        ];
        fetchedTour.excludes = fetchedTour.excludes?.length > 0 ? fetchedTour.excludes : [
        "Chi phí cá nhân, đồ uống",
        "Các chi phí không được đề cập trong mục bao gồm",
        "Tiền tip cho hướng dẫn viên và tài xế",
        ];
      setTour(fetchedTour);

      const reviewsResponse = await axios.get(`http://localhost:5000/api/reviews/tour/${tourId}`);
      if (reviewsResponse.data.success) {
        setReviews(reviewsResponse.data.reviews || []);
      } else {
        console.warn(reviewsResponse.data.message || 'Không thể tải đánh giá.');
        setReviews([]);
      }

    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Lỗi không xác định');
      setReviews([]);
    } finally {
      setLoading(false);
    }
  }, [tourId]); // Add tourId as dependency for useCallback

  useEffect(() => {
    fetchTourAndReviews();
  }, [tourId, fetchTourAndReviews]); // Add fetchTourAndReviews to dependency array

  const handleRatingSubmit = async () => {
    if (!isAuthenticated) {
      alert("Vui lòng đăng nhập để gửi đánh giá.");
      return;
    }
    // Validation is now inside RatingModal's internal submit, but can be re-checked here if needed.

    const formData = new FormData();
    formData.append('tour_id', tourId);
    formData.append('rating', rating);
    formData.append('comment', reviewText);

    selectedReviewFiles.forEach(file => {
      formData.append('reviewImages', file);
    });

    try {
      const token = getToken();
      const response = await axios.post('http://localhost:5000/api/reviews', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.data.success) {
        setReviews(prevReviews => [response.data.review, ...prevReviews].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)));
        setShowRatingModal(false);
        setRating(0);
        setReviewText('');
        setSelectedReviewFiles([]);
        alert('Đánh giá của bạn đã được gửi thành công!');
      } else {
        alert(`Lỗi: ${response.data.message}`);
      }
    } catch (err) {
      console.error("Submit review error:", err);
      alert(`Lỗi khi gửi đánh giá: ${err.response?.data?.message || err.message}`);
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Đang tải thông tin tour...</p>
      </div>
    );
  }

  if (error || !tour) {
    return (
      <div className="error-container">
        <h2>Không tìm thấy thông tin tour</h2>
        <p>{error || `Tour với ID ${tourId} không tồn tại hoặc đã bị xóa.`}</p>
        <Link to="/plan" className="back-button">Quay lại danh sách tour</Link>
      </div>
    );
  }

  return (
    <div className="tour-detail-container">
      <TourHeader tour={tour} />
      <TourNavigation activeTab={activeTab} setActiveTab={setActiveTab} />
      <TourTabContent
        tour={tour}
        activeTab={activeTab}
        reviews={reviews}
        setShowRatingModal={setShowRatingModal}
        isAuthenticated={isAuthenticated}
      />
      {showRatingModal && isAuthenticated && (
        <RatingModal
          show={showRatingModal}
          tourId={tourId}
          onSubmit={handleRatingSubmit}
          onClose={() => setShowRatingModal(false)}
          rating={rating}
          setRating={setRating}
          reviewText={reviewText}
          setReviewText={setReviewText}
          selectedFiles={selectedReviewFiles}
          setSelectedFiles={setSelectedReviewFiles}
        />
      )}
    </div>
  );
};

export default ItineraryDetail;