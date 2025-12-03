import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '../../../../styles/itineraryCSS/TourCreationSuccess.css';

export const TourCreationSuccess = ({ tourData }) => {
  const navigate = useNavigate();
  const [countdown, setCountdown] = useState(5);
  
  useEffect(() => {
    // Auto redirect after 5 seconds
    const timer = setInterval(() => {
      setCountdown(prevCount => {
        if (prevCount <= 1) {
          clearInterval(timer);
          navigate('/user/my-tours'); // Chuyển hướng đến trang "Tour của tôi"
          return 0;
        }
        return prevCount - 1;
      });
    }, 1000);
    
    return () => clearInterval(timer);
  }, [navigate]);
  
  if (!tourData) {
    return (
      <div className="success-container">
        <div className="success-card">
          <div className="success-icon error">❌</div>
          <h1 className="success-title">Đã xảy ra lỗi</h1>
          <p>Không thể tạo tour. Vui lòng thử lại sau.</p>
          <div className="action-buttons">
            <Link to="/" className="btn-primary">
              Quay về trang chủ
            </Link>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="success-container">
      <div className="success-card">
        <div className="success-icon">✓</div>
        
        <h1 className="success-title">Tour đã được tạo thành công!</h1>
        
        <div className="tour-info">
          <p className="destination">
            <strong>{tourData.destination}</strong>
          </p>
          <p className="duration">{tourData.duration}</p>
        </div>
        
        <div className="pending-notice">
          <div className="pending-icon">⏳</div>
          <h3>Đang chờ xét duyệt</h3>
          <p>Tour của bạn đang chờ quản trị viên xét duyệt trước khi hiển thị trên trang chính.</p>
        </div>
        
        <p className="redirect-message">
          Bạn sẽ được chuyển hướng đến trang lịch trình của tôi sau {countdown} giây
        </p>
        
        <div className="action-buttons">
          <Link to="/user/my-tours" className="btn-primary">
            Xem lịch trình của tôi
          </Link>
          <Link to="/plan" className="btn-secondary">
            Xem các lịch trình khác
          </Link>
        </div>
      </div>
    </div>
  );
};

export default TourCreationSuccess;