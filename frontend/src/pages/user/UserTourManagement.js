import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';
import { CONFIG } from '../../config';
import { getDisplayImageUrl } from '../../utils/imageUtils';
import '../../styles/itineraryCSS/UserTours.css';

const UserTours = () => {
  const [tours, setTours] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);
  const { getToken, logout } = useAuth();
  const navigate = useNavigate();
  
  // Function to fetch user data
  const fetchUserData = async () => {
    try {
      // Get token from storage
      const token = getToken();
      if (!token) {
        throw new Error('Vui lòng đăng nhập để xem tour của bạn');
      }
      
      // Fetch user profile
      const userResponse = await axios.get(`${CONFIG.API_BASE_URL}/api/users/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
        
      if (!userResponse.data.success || !userResponse.data.user) {
        throw new Error('Không thể lấy thông tin người dùng');
      }
      
      const currentUser = userResponse.data.user;
      setUser(currentUser);
      
      console.log('Đã lấy thông tin user:', currentUser.id, currentUser.username || currentUser.full_name);
      return {token, userId: currentUser.id};
    } catch (error) {
      console.error("Lỗi khi lấy thông tin người dùng:", error);
      
      // Handle authentication errors
      if (error.response?.status === 401 || error.response?.status === 403) {
        logout();
        navigate('/login', { state: { from: '/user/my-tours' } });
      }
      throw error;
    }
  };
  
  // Main fetch function for tours
  const fetchUserTours = async () => {
    try {
      setLoading(true);
      
      // Fetch user data first
      const {token, userId} = await fetchUserData();
      console.log("Đang tìm tour với user_id:", userId);
      
      // Try to fetch tours using different endpoints with appropriate error handling
      try {
        // Try user-specific endpoint first
        console.log("Fetching tours using user-specific API");
        const response = await axios.get(`${CONFIG.API_BASE_URL}/api/tours/user/tours`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (response.data.success && response.data.tours) {
          setTours(response.data.tours.map(tour => ({
            ...tour,
            status: tour.status || 'pending'
          })));
          return;
        }
        throw new Error("API không trả về dữ liệu hợp lệ");
      } catch (apiErr) {
        console.warn("Falling back to admin API:", apiErr);
        
        // Try admin API as fallback
        const adminResponse = await axios.get(`${CONFIG.API_BASE_URL}/api/admin/tours`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (adminResponse.data.success && adminResponse.data.tours) {
          // Filter to only show current user's tours
          const filteredTours = adminResponse.data.tours.filter(tour => {
            const tourUserId = parseInt(tour.user_id);
            return tourUserId === parseInt(userId);
          });
          
          console.log(`Found ${filteredTours.length} tours for user ${userId}`);
          
          setTours(filteredTours.map(tour => ({
            ...tour,
            status: tour.status || 'pending'
          })));
        } else {
          throw new Error('Không thể tải dữ liệu tour');
        }
      }
    } catch (err) {
      console.error('Lỗi khi tải tour của người dùng:', err);
      
      if (err.response?.status === 401 || err.response?.status === 403) {
        logout();
        navigate('/login', { state: { from: '/user/my-tours' } });
        return;
      }
      
      setError(err.message || 'Có lỗi xảy ra khi tải dữ liệu tour của bạn');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserTours();
  }, []);
  
  // Lấy thông tin hiển thị trạng thái
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
        <p>Đang tải dữ liệu lịch trình của bạn...</p>
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
        <h1>Tour của {user?.full_name || user?.username || 'tôi'}</h1>
        <div className="user-info">
          <small className="user-id">ID người dùng hiện tại: {user?.id}</small>
        </div>
        <Link to="/create-itinerary" className="create-tour-btn">
          Tạo lịch trình mới
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

            // Check if this tour actually belongs to the current user
            const isCurrentUserTour = tour.user_id === user?.id;
            
            return (
              <div key={tour.id} className={`user-tour-item ${tour.status || 'pending'} ${!isCurrentUserTour ? 'wrong-user' : ''}`}>
                {!isCurrentUserTour && (
                  <div className="warning-badge">
                    ⚠️ Lịch trình này không thuộc về bạn (User ID: {tour.user_id})
                  </div>
                )}
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
                      <p><strong>ID người tạo:</strong> {tour.user_id}</p>
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
                  <Link to={`/user/tour-preview/${tour.id}`} className="view-btn">
                    Xem chi tiết
                  </Link>

                  {tour.status !== 'approved' && isCurrentUserTour && (
                    <Link to={`/user/edit-tour/${tour.id}`} className="edit-btn">
                      Chỉnh sửa
                    </Link>
                  )}

                  {tour.status === 'approved' && (
                    <Link to={`/itinerary/${tour.id}`} className="public-view-btn">
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