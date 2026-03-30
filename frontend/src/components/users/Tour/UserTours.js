import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../../contexts/AuthContext';
import { getDisplayImageUrl } from '../../../utils/imageUtils';
import { CONFIG } from '../../../config';
import '../../../styles/user/UserTours.css';

const UserTours = () => {
  const [tours, setTours] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user, getToken, logout } = useAuth();
  const navigate = useNavigate();
  
  useEffect(() => {
    const fetchUserTours = async () => {
      try {
        setLoading(true);
        const token = getToken();
        
        if (!token) {
          setError('Vui lòng đăng nhập để xem tour của bạn');
          navigate('/login', { state: { from: '/user/my-tours' } });
          return;
        }
        
        // Try to get tours using the user-specific endpoint
        try {
          const response = await axios.get(`${CONFIG.API_API_URL}/tours/user/tours`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          
          if (response.data.success && response.data.tours) {
            // Format the tours to ensure all have a status
            setTours(response.data.tours.map(tour => ({
              ...tour,
              status: tour.status || 'pending'
            })));
          } else {
            throw new Error(response.data.message || 'Không thể tải dữ liệu tour');
          }
        } catch (userApiErr) {
          console.warn('User-specific API failed, trying admin API as fallback:', userApiErr);
          
          // Fall back to admin endpoint if user has sufficient privileges
          try {
            const adminResponse = await axios.get(`${CONFIG.API_API_URL}/admin/tours`, {
              headers: {
                'Authorization': `Bearer ${token}`
              }
            });
            
            if (adminResponse.data.success) {
              // Filter tours to only include those belonging to the current user
              const currentUserId = user?.id;
              const userTours = adminResponse.data.tours.filter(tour => 
                parseInt(tour.user_id) === parseInt(currentUserId)
              );
              
              setTours(userTours.map(tour => ({
                ...tour,
                status: tour.status || 'pending'
              })));
            } else {
              throw new Error(adminResponse.data.message || 'Không thể tải dữ liệu tour');
            }
          } catch (adminApiErr) {
            // If both APIs fail, try the generic tours endpoint as last resort
            if (adminApiErr.response?.status === 403) {
              const publicResponse = await axios.get(`${CONFIG.API_API_URL}/tours`);
              
              if (publicResponse.data.success) {
                // Still filter by current user ID if we have that info
                const filteredTours = user?.id 
                  ? publicResponse.data.tours.filter(tour => parseInt(tour.user_id) === parseInt(user.id))
                  : [];
                
                setTours(filteredTours.map(tour => ({
                  ...tour,
                  status: tour.status || 'pending'
                })));
              } else {
                throw new Error('Không thể tải dữ liệu tour');
              }
            } else {
              throw adminApiErr;
            }
          }
        }
      } catch (err) {
        console.error('Error fetching tours:', err);
        if (err.response?.status === 401) {
          logout();
          navigate('/login', { state: { from: '/user/my-tours' } });
          setError('Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.');
        } else {
          setError(err.message || 'Có lỗi xảy ra khi tải dữ liệu');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchUserTours();
  }, [navigate, getToken, logout, user]);

  // Get status badge and message
  const getStatusInfo = (status) => {
    switch (status) {
      case 'approved':
        return {
          badgeClass: 'status-badge approved',
          text: 'Đã duyệt',
          message: 'Lịch trình của bạn đã được duyệt và hiển thị công khai.'
        };
      case 'rejected':
        return {
          badgeClass: 'status-badge rejected',
          text: 'Từ chối',
          message: 'Lịch trình của bạn đã bị từ chối. Vui lòng liên hệ với quản trị viên để biết thêm chi tiết.'
        };
      default:
        return {
          badgeClass: 'status-badge pending',
          text: 'Chờ duyệt',
          message: 'Lịch trình của bạn đang chờ quản trị viên xét duyệt.'
        };
    }
  };

  if (loading) {
    return (
      <div className="user-tours-container">
        <div className="loading-spinner"></div>
        <p>Đang tải dữ liệu tour của bạn...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="user-tours-container">
        <div className="error-message">
          <h3>Lỗi</h3>
          <p>{error}</p>
          <button onClick={() => window.location.reload()} className="refresh-btn">
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="user-tours-container">
      <div className="page-header">
        <h1>Lịch trình của tôi</h1>
        <Link to="/create-itinerary" className="create-tour-btn">
          Tạo Lịch trình mới
        </Link>
      </div>
      
      {tours.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🏖️</div>
          <h3>Bạn chưa có lịch trình nào</h3>
          <p>Hãy bắt đầu tạo lịch trình đầu tiên của bạn</p>
          <Link to="/create-itinerary" className="create-first-tour-btn">
            Tạo lịch trình ngay
          </Link>
        </div>
      ) : (
        <div className="user-tour-list">
          {tours.map(tour => {
            const statusInfo = getStatusInfo(tour.status);
            
            return (
              <div key={tour.id} className={`user-tour-item ${tour.status || 'pending'}`}>
                <div className="tour-preview">
                    <div className="tour-image">
                      <img 
                        src={getDisplayImageUrl(tour.image)}
                        alt={tour.destination}
                        onError={(e) => {
                          e.target.src = '/placeholder-image.jpg';
                        }}
                      />
                    </div>
                  
                  <div className="tour-details">
                    <h3 className="tour-title">{tour.destination}</h3>
                    <div className="tour-info">
                      <p><strong>Khởi hành:</strong> {tour.departure_from}</p>
                      <p><strong>Thời gian:</strong> {tour.duration}</p>
                    </div>
                    <div className="tour-status">
                      <div className={statusInfo.badgeClass}>
                        {statusInfo.text}
                      </div>
                      <p className="status-message">{statusInfo.message}</p>
                    </div>
                  </div>
                </div>
                
                <div className="tour-actions">
                  <Link to={`/tours/${tour.id}`} className="view-btn">
                    Xem chi tiết
                  </Link>
                  
                  {tour.status !== 'approved' && (
                    <Link to={`/user/edit-tour/${tour.id}`} className="edit-btn">
                      Chỉnh sửa
                    </Link>
                  )}
                  
                  {tour.status === 'approved' && (
                    <Link to={`/tours/${tour.id}`} className="public-view-btn">
                      Xem công khai
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default UserTours;