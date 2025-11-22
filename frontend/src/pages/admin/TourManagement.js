import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import TourList from '../../components/admin/Tour/TourList';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import EditTourModal from '../../components/admin/Tour/EditTourModal';
import AddTourModal from '../../components/admin/Tour/AddTourModal';

import '../../styles/itineraryCSS/TourManagement.css';

const TourManagement = () => {
  const navigate = useNavigate();
  const { logout, getToken, user } = useAuth();

  const [tours, setTours] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('all'); // Tabs: 'all', 'pending', 'approved', 'rejected'
  const [showEditModal, setShowEditModal] = useState(false);
  const [currentTour, setCurrentTour] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [processingTourId, setProcessingTourId] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTourFormData, setNewTourFormData] = useState({
    destination: '',
    departure_from: '',
    duration: '',
    description: '',
    image: null,
    highlights: ['', '', '', ''],
    schedule: [{
      day: 'Ngày 1',
      title: '',
      activities: ['']
    }]
  });

  const handleTokenExpired = useCallback(() => {
    toast.error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
    logout();
    navigate('/login', { state: { from: '/admin/tours' } });
  }, [logout, navigate]);

  useEffect(() => {
    const interceptor = axios.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          handleTokenExpired();
        }
        return Promise.reject(error);
      }
    );

    return () => {
      axios.interceptors.response.eject(interceptor);
    };
  }, [handleTokenExpired]);

  useEffect(() => {
    const currentToken = getToken();

    if (!currentToken) {
      navigate('/login', { state: { from: '/admin/tours' } });
    }
  }, [navigate, getToken]);

  const fetchTours = useCallback(async () => {
    try {
      setLoading(true);
      const currentToken = getToken();
      
      if (!currentToken) {
        handleTokenExpired();
        return;
      }
      
      // Use the new endpoint for fetching tours with proper filtering
      const response = await axios.get('http://localhost:5000/api/tours', {
        headers: {
          'Authorization': `Bearer ${currentToken}`
        }
      });

      console.log('API response status:', response.status);
      console.log('API response data:', response.data);

      if (response.data.success) {
        // Chuẩn hóa dữ liệu tour để đảm bảo có trạng thái
        let normalizedTours = response.data.tours.map(tour => ({
          ...tour,
          status: tour.status || 'pending'
        }));
        
        // Log số lượng tour theo từng trạng thái
        const pending = normalizedTours.filter(t => t.status === 'pending').length;
        const approved = normalizedTours.filter(t => t.status === 'approved').length;
        const rejected = normalizedTours.filter(t => t.status === 'rejected').length;

        console.log(`Đã tải dữ liệu: ${normalizedTours.length} tour (Chờ duyệt: ${pending}, Đã duyệt: ${approved}, Từ chối: ${rejected})`);
        
        setTours(normalizedTours);
      } else {
        throw new Error(response.data.message || 'Không thể tải danh sách tour');
      }
    } catch (error) {
      console.error('Error fetching tours:', error);

      // Log chi tiết lỗi
      if (error.response) {
        console.log('Error response status:', error.response.status);
        console.log('Error response data:', error.response.data);
      }

      if (error.response?.status === 401) {
        setError('Phiên làm việc đã hết hạn. Vui lòng đăng nhập lại.');
        handleTokenExpired();
      } else if (error.response?.status === 403) {
        setError('Bạn không có quyền truy cập trang này.');
      } else if (error.response?.status === 404) {
        setError('Không tìm thấy API hoặc dữ liệu. Vui lòng kiểm tra lại đường dẫn.');
      } else {
        setError(error.message || 'Có lỗi xảy ra khi tải danh sách tour');
      }
    } finally {
      setLoading(false);
    }
  }, [getToken, handleTokenExpired, user]);

  useEffect(() => {
    fetchTours();
  }, [fetchTours]);

  // Hàm lọc tour theo tab
  const filteredTours = tours.filter((tour) => {
    const tourStatus = tour.status || 'pending';

    if (activeTab === 'all') return true;
    if (activeTab === 'pending' && (tourStatus === 'pending' || !tour.status)) {
      return true;
    }
    return tourStatus === activeTab;
  });

  // Thêm log về kết quả lọc
  console.log(`Lọc theo tab '${activeTab}': ${filteredTours.length}/${tours.length} tours`);

  const handleUpdateTourStatus = async (tourId, newStatus) => {
    try {
      setProcessingTourId(tourId);
      const currentToken = getToken();
                  
      if (!currentToken) {
        handleTokenExpired();
        return;
      }
      
      const response = await axios.put(
        `http://localhost:5000/api/tours/admin/tours/${tourId}/status`, // Sửa endpoint 
        { status: newStatus },
        {
          headers: {
            'Authorization': `Bearer ${currentToken}`
          }
        }
      );

      if (response.data.success) {
        setTours((prevTours) =>
          prevTours.map((tour) =>
            tour.id === tourId ? { ...tour, status: newStatus } : tour
          )
        );
        toast.success(
          newStatus === 'approved'
            ? 'Tour đã được phê duyệt thành công!'
            : newStatus === 'rejected'
            ? 'Tour đã bị từ chối!'
            : 'Trạng thái tour đã được cập nhật!'
        );
      } else {
        throw new Error(response.data.message || 'Không thể cập nhật trạng thái tour');
      }
    } catch (error) {
      console.error('Error updating tour status:', error);
      toast.error(`Lỗi: ${error.message || 'Không thể cập nhật trạng thái'}`);
      
      if (error.response?.status === 401) {
        handleTokenExpired();
      }
    } finally {
      setProcessingTourId(null);
    }
  };

  const handleDeleteTour = async (id) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa tour này không?')) return;

    try {
      setProcessingTourId(id);
      const currentToken = getToken();
                   
      if (!currentToken) {
        handleTokenExpired();
        return;
      }
      
      // Check if user has permission to delete this tour
      const tourToDelete = tours.find(tour => tour.id === id);
      
      // Only allow deletion if admin or the tour creator
      if (user.role !== 'admin' && tourToDelete.user_id !== user.id) {
        toast.error('Bạn không có quyền xóa tour này!');
        return;
      }

      const response = await axios.delete(`http://localhost:5000/api/tours/${id}`, {
        headers: {
          'Authorization': `Bearer ${currentToken}`
        }
      });
      
      if (response.data.success) {
        toast.success('Tour đã được xóa thành công!');
        setTours((prevTours) => prevTours.filter((tour) => tour.id !== id));
      }
    } catch (error) {
      console.error('Delete tour error:', error);
      toast.error(error.response?.data?.message || 'Lỗi khi xóa tour!');
      
      if (error.response?.status === 401) {
        handleTokenExpired();
      }
    } finally {
      setProcessingTourId(null);
    }
  };
  
  const handleEditTour = (tour) => {
    // Only allow editing if admin or the tour creator
    if (user.role !== 'admin' && tour.user_id !== user.id) {
      toast.error('Bạn không có quyền chỉnh sửa tour này!');
      return;
    }
    
    setCurrentTour(tour);
    setShowEditModal(true);
  };

  const handleSubmitEdit = async (formData) => {
    try {
      setIsSubmitting(true);
      const currentToken = getToken();
      
      if (!currentToken) {
        handleTokenExpired();
        return;
      }
      
      // Convert formData to appropriate format for API
      const tourData = new FormData();
      Object.keys(formData).forEach(key => {
        if (key !== 'image') {
          if (typeof formData[key] === 'object') {
            tourData.append(key, JSON.stringify(formData[key]));
          } else {
            tourData.append(key, formData[key]);
          }
        }
      });
      
      if (formData.image instanceof File) {
        tourData.append('image', formData.image);
      }

      // When regular user edits, set status back to pending
      if (user.role !== 'admin') {
        tourData.append('status', 'pending');
      }
      
      const response = await axios.put(
        `http://localhost:5000/api/tours/${currentTour.id}`, 
        tourData,
        {
          headers: {
            'Authorization': `Bearer ${currentToken}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );
      
      if (response.data.success) {
        fetchTours(); // Refresh tour list
        setShowEditModal(false);
        toast.success('Tour đã được cập nhật thành công!');
      }
    } catch (error) {
      console.error('Error updating tour:', error);
      toast.error(error.response?.data?.message || 'Lỗi khi cập nhật tour!');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Cách sửa khi sử dụng FormData để gửi dữ liệu với file ảnh

const handleAddTour = async (formData) => {
  try {
    setIsSubmitting(true);
    const currentToken = getToken();
    
    if (!currentToken) {
      handleTokenExpired();
      return;
    }
    
    // Kiểm tra các trường bắt buộc
    if (!formData.destination || !formData.departure_from || !formData.duration || !formData.description) {
      toast.error('Vui lòng điền đầy đủ thông tin cơ bản của tour');
      setIsSubmitting(false);
      return;
    }
    
    // Xử lý lịch trình
    if (!formData.schedule || !Array.isArray(formData.schedule) || formData.schedule.length === 0) {
      toast.error('Lịch trình tour phải có ít nhất một ngày');
      setIsSubmitting(false);
      return;
    }
    
    // Chuẩn bị dữ liệu tour
    const tourData = {
      destination: formData.destination,
      departure_from: formData.departure_from,
      departure_date: formData.departure_date || null,
      return_date: formData.return_date || null,
      duration: formData.duration,
      description: formData.description,
      highlights: Array.isArray(formData.highlights) ? formData.highlights.filter(h => h && h.trim()) : [],
      schedule: formData.schedule.map(day => ({
        day: day.day || 'Ngày',
        title: day.title || '',
        activities: Array.isArray(day.activities) ? day.activities.filter(a => a && a.trim()) : [],
        locations: Array.isArray(day.locations) ? day.locations.map(locId => parseInt(locId, 10)) : []
      })),
      includes: Array.isArray(formData.includes) ? formData.includes.filter(i => i && i.trim()) : [],
      excludes: Array.isArray(formData.excludes) ? formData.excludes.filter(e => e && e.trim()) : [],
      notes: Array.isArray(formData.notes) ? formData.notes.filter(n => n && n.trim()) : [],
      selected_location_ids: Array.isArray(formData.selected_location_ids) 
        ? formData.selected_location_ids.map(id => parseInt(id, 10)) 
        : []
    };
    
    // Xử lý ảnh nếu có
    if (formData.image instanceof File) {
      const tourFormData = new FormData();
      
      // Thêm file ảnh
      tourFormData.append('image', formData.image);
      
      // Thêm các trường dữ liệu đơn giản
      tourFormData.append('destination', tourData.destination);
      tourFormData.append('departure_from', tourData.departure_from);
      if (tourData.departure_date) tourFormData.append('departure_date', tourData.departure_date);
      if (tourData.return_date) tourFormData.append('return_date', tourData.return_date);
      tourFormData.append('duration', tourData.duration);
      tourFormData.append('description', tourData.description);
      
      // Chuyển đổi các trường mảng thành JSON
      tourFormData.append('highlights', JSON.stringify(tourData.highlights));
      tourFormData.append('schedule', JSON.stringify(tourData.schedule));
      tourFormData.append('includes', JSON.stringify(tourData.includes));
      tourFormData.append('excludes', JSON.stringify(tourData.excludes));
      tourFormData.append('notes', JSON.stringify(tourData.notes));
      tourFormData.append('selected_location_ids', JSON.stringify(tourData.selected_location_ids));
      
      // Log để kiểm tra
      console.log("FormData sent:");
      for (const pair of tourFormData.entries()) {
        const value = pair[1];
        const displayValue = typeof value === 'object' 
          ? (value instanceof File ? `File: ${value.name}` : 'Object') 
          : value;
        console.log(`${pair[0]}: ${displayValue}`);
      }
      
      const response = await axios.post(
        'http://localhost:5000/api/tours',
        tourFormData,
        {
          headers: {
            'Authorization': `Bearer ${currentToken}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );
      
      if (response.data.success) {
        toast.success('Tour đã được tạo thành công!');
        setShowAddModal(false);
        resetFormData();
        fetchTours();
      }
    } else {
      // Gửi dữ liệu JSON khi không có ảnh
      const response = await axios.post(
        'http://localhost:5000/api/tours',
        tourData,
        {
          headers: {
            'Authorization': `Bearer ${currentToken}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      if (response.data.success) {
        toast.success('Tour đã được tạo thành công!');
        setShowAddModal(false);
        resetFormData();
        fetchTours();
      }
    }
  } catch (error) {
    console.error('Error creating tour:', error);
    if (error.response && error.response.data) {
      console.log('Server response:', error.response.data);
      toast.error(`Lỗi: ${error.response.data.message || error.message || 'Không thể tạo tour'}`);
    } else {
      toast.error(`Lỗi: ${error.message || 'Không thể tạo tour'}`);
    }
  } finally {
    setIsSubmitting(false);
  }
};
// Thêm hàm resetFormData để reset form data sau khi thêm thành công
const resetFormData = () => {
  setNewTourFormData({
    destination: '',
    departure_from: '',
    departure_date: '',
    return_date: '',
    duration: '',
    description: '',
    image: null,
    highlights: [''],
    schedule: [{
      day: 'Ngày 1',
      title: '',
      activities: [''],
      locations: []
    }],
    includes: ['Xe du lịch đời mới máy lạnh', 'Khách sạn tiêu chuẩn 3 sao'],
    excludes: ['Chi phí cá nhân', 'Tiền tip cho hướng dẫn viên'],
    notes: ['Quý khách vui lòng mang theo giấy tờ tùy thân']
  });
};

  // eslint-disable-next-line no-unused-vars
  const getStatusBadge = (status) => {
    switch (status) {
      case 'approved':
        return <span className="status-badge approved">Đã duyệt</span>;
      case 'rejected':
        return <span className="status-badge rejected">Từ chối</span>;
      default:
        return <span className="status-badge pending">Chờ duyệt</span>;
    }
  };

  const canModerateContent = useCallback(() => {
    return user?.role === 'admin';
  }, [user]);

  // Hàm approve tour
  const handleApproveTour = async (tourId) => {
    try {
      console.log('[TourManagement] Approve tour:', tourId);
      setProcessingTourId(tourId);
      
      const currentToken = getToken();
      if (!currentToken) {
        handleTokenExpired();
        return;
      }
      
      const response = await axios.put(
        `http://localhost:5000/api/tours/admin/tours/${tourId}/approve`,
        {},
        {
          headers: {
            'Authorization': `Bearer ${currentToken}`
          }
        }
      );

      if (response.data.success) {
        toast.success('Đã duyệt tour thành công!');
        await fetchTours();
      } else {
        throw new Error(response.data.message || 'Lỗi khi duyệt tour');
      }
    } catch (error) {
      console.error('[TourManagement] Error approving tour:', error);
      
      if (error.response?.status === 401) {
        handleTokenExpired();
      } else {
        toast.error(error.response?.data?.message || error.message || 'Lỗi khi duyệt tour');
      }
    } finally {
      setProcessingTourId(null);
    }
  };

  // Hàm reject tour
  const handleRejectTour = async (tourId) => {
    try {
      console.log('[TourManagement] Reject tour:', tourId);
      setProcessingTourId(tourId);
      
      const currentToken = getToken();
      if (!currentToken) {
        handleTokenExpired();
        return;
      }
      
      const response = await axios.put(
        `http://localhost:5000/api/tours/admin/tours/${tourId}/reject`,
        {},
        {
          headers: {
            'Authorization': `Bearer ${currentToken}`
          }
        }
      );

      if (response.data.success) {
        toast.success('Đã từ chối tour thành công!');
        await fetchTours();
      } else {
        throw new Error(response.data.message || 'Lỗi khi từ chối tour');
      }
    } catch (error) {
      console.error('[TourManagement] Error rejecting tour:', error);
      
      if (error.response?.status === 401) {
        handleTokenExpired();
      } else {
        toast.error(error.response?.data?.message || error.message || 'Lỗi khi từ chối tour');
      }
    } finally {
      setProcessingTourId(null);
    }
  };

  return (
    <div className="tour-management">
      <div className="tour-header-wrapper">
        <h1 className="page-title">{user?.role === 'admin' ? 'Quản lý kế hoạch' : 'Tour của tôi'}</h1>
        <button
          onClick={() => setShowAddModal(true)}
          className="add-button"
        >
          Thêm kế hoạch mới
        </button>
      </div>

      <div className="status-filter-tabs">
        <button
          className={`tab-btn ${activeTab === 'all' ? 'active' : ''}`}
          onClick={() => setActiveTab('all')}
        >
          Tất cả ({tours.length})
        </button>
        <button
          className={`tab-btn ${activeTab === 'pending' ? 'active' : ''}`}
          onClick={() => setActiveTab('pending')}
        >
          Chờ duyệt ({tours.filter(t => !t.status || t.status === 'pending').length})
        </button>
        <button
          className={`tab-btn ${activeTab === 'approved' ? 'active' : ''}`}
          onClick={() => setActiveTab('approved')}
        >
          Đã duyệt ({tours.filter((t) => t.status === 'approved').length})
        </button>
        <button
          className={`tab-btn ${activeTab === 'rejected' ? 'active' : ''}`}
          onClick={() => setActiveTab('rejected')}
        >
          Từ chối ({tours.filter((t) => t.status === 'rejected').length})
        </button>
      </div>

      {loading ? (
        <div className="loading-state">Đang tải...</div>
      ) : error ? (
        <div className="error-state">Lỗi: {error}</div>
      ) : filteredTours.length === 0 ? (
        <div className="empty-state">
          <p>Không có tour nào trong danh sách này</p>
        </div>
      ) : (
        <TourList 
          tours={filteredTours}
          onApprove={handleApproveTour}
          onReject={handleRejectTour}
          onEdit={handleEditTour}
          onDelete={handleDeleteTour}
          currentUserId={user?.id}
          canModerate={canModerateContent()}
          processingTourId={processingTourId}
        />
      )}

      {showEditModal && currentTour && (
        <EditTourModal
          show={showEditModal}
          onClose={() => setShowEditModal(false)}
          formData={currentTour}
          setFormData={setCurrentTour}
          onSubmit={handleSubmitEdit}
          isSubmitting={isSubmitting}
        />
      )}

      {showAddModal && (
        <AddTourModal
          show={showAddModal}
          onClose={() => setShowAddModal(false)}
          formData={newTourFormData}
          setFormData={setNewTourFormData}
          onSubmit={handleAddTour}
          isSubmitting={isSubmitting}
        />
      )}

      <ToastContainer />
    </div>
  );
};

export default TourManagement;