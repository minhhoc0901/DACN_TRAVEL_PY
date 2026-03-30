import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { getDisplayImageUrl } from '../../../utils/imageUtils';
import { CONFIG } from '../../../config';
import '../../../styles/user/TourPreview.css';

const TourPreview = () => {
  const { id } = useParams();
  const [tour, setTour] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTour = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${CONFIG.API_API_URL}/tours/${id}`);
        
        if (response.data.success) {
          setTour(response.data.tour);
        } else {
          throw new Error(response.data.message || 'Không thể tải thông tin tour');
        }
      } catch (err) {
        console.error('Error fetching tour:', err);
        setError(err.message || 'Có lỗi xảy ra khi tải dữ liệu');
      } finally {
        setLoading(false);
      }
    };

    fetchTour();
  }, [id]);

  // Get status badge and message
  const getStatusInfo = (status) => {
    switch (status) {
      case 'approved':
        return {
          badgeClass: 'status-badge approved',
          text: 'Đã duyệt',
          message: 'Tour của bạn đã được duyệt và hiển thị công khai.'
        };
      case 'rejected':
        return {
          badgeClass: 'status-badge rejected',
          text: 'Từ chối',
          message: 'Tour của bạn đã bị từ chối. Vui lòng liên hệ với quản trị viên để biết thêm chi tiết.'
        };
      default:
        return {
          badgeClass: 'status-badge pending',
          text: 'Chờ duyệt',
          message: 'Tour của bạn đang chờ quản trị viên xét duyệt.'
        };
    }
  };

  if (loading) {
    return (
      <div className="tour-preview-container">
        <div className="loading-spinner"></div>
        <p>Đang tải thông tin tour...</p>
      </div>
    );
  }

  if (error || !tour) {
    return (
      <div className="tour-preview-container">
        <div className="error-message">
          <h3>Lỗi</h3>
          <p>{error || 'Không tìm thấy tour'}</p>
          <Link to="/user/my-tours" className="back-button">
            Quay lại danh sách tour
          </Link>
        </div>
      </div>
    );
  }

  const statusInfo = getStatusInfo(tour.status);

  return (
    <div className="tour-preview-container">
      <div className="tour-preview-header">
        <h1>{tour.destination}</h1>
        <div className={statusInfo.badgeClass}>{statusInfo.text}</div>
      </div>

      <div className="tour-preview-status-message">
        <p>{statusInfo.message}</p>
      </div>

      <div className="tour-preview-image">
        <img 
          src={getDisplayImageUrl(tour.image)}
          alt={tour.destination}
        />
      </div>

      <div className="tour-preview-info">
        <div className="info-item">
          <span className="info-label">Điểm khởi hành:</span>
          <span className="info-value">{tour.departure_from}</span>
        </div>
        <div className="info-item">
          <span className="info-label">Thời gian:</span>
          <span className="info-value">{tour.duration}</span>
        </div>
      </div>

      <div className="tour-preview-description">
        <h2>Mô tả</h2>
        <p>{tour.description}</p>
      </div>

      <div className="tour-preview-highlights">
        <h2>Điểm nổi bật</h2>
        <ul>
          {tour.highlights && tour.highlights.map((highlight, index) => (
            <li key={index}>{highlight}</li>
          ))}
        </ul>
      </div>

      <div className="tour-preview-schedule">
        <h2>Lịch trình</h2>
        {tour.schedule && tour.schedule.map((day, index) => (
          <div key={index} className="schedule-day">
            <h3>{day.day}: {day.title}</h3>
            <ul>
              {day.activities.map((activity, actIndex) => (
                <li key={actIndex}>{activity}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="tour-preview-includes">
        <h2>Bao gồm</h2>
        <ul>
          {tour.includes && tour.includes.map((item, index) => (
            <li key={index}>{item}</li>
          ))}
        </ul>
      </div>

      <div className="tour-preview-excludes">
        <h2>Không bao gồm</h2>
        <ul>
          {tour.excludes && tour.excludes.map((item, index) => (
            <li key={index}>{item}</li>
          ))}
        </ul>
      </div>

      <div className="tour-preview-notes">
        <h2>Lưu ý</h2>
        <ul>
          {tour.notes && tour.notes.map((note, index) => (
            <li key={index}>{note}</li>
          ))}
        </ul>
      </div>

      <div className="tour-preview-actions">
        <Link to="/user/my-tours" className="back-button">
          Quay lại danh sách tour
        </Link>
        
        {tour.status !== 'approved' && (
          <Link to={`/user/edit-tour/${tour.id}`} className="edit-button">
            Chỉnh sửa tour
          </Link>
        )}
        
        {tour.status === 'approved' && (
          <Link to={`/itinerary/${tour.id}`} className="view-button">
            Xem công khai
          </Link>
        )}
      </div>
    </div>
  );
};

export default TourPreview;