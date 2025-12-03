
import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import '../../styles/admin/LocationManagement.css';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import LocationList from '../../components/admin/Location/LocationList';
import AddLocationModal from '../../components/admin/Location/AddLocationModal';
import EditLocationModal from '../../components/admin/Location/EditLocationModal';
import { hotelService } from '../../services/hotelService'; 

const LocationManagement = () => {
  const navigate = useNavigate();
  const { logout, getToken } = useAuth();
  const [, setToken] = useState(() => localStorage.getItem('token') || sessionStorage.getItem('token'));

  const handleTokenExpired = useCallback(() => {
    toast.error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
    logout();
    navigate('/login', { state: { from: '/admin/locations' } });
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
    const currentToken = localStorage.getItem('token') || sessionStorage.getItem('token');
    setToken(currentToken);
    
    if (!currentToken) {
      navigate('/login', { state: { from: '/admin/locations' } });
    }
  }, [navigate]);

  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [availableHotels, setAvailableHotels] = useState([]);

  const initialFormData = {
    name: '',
    type: '',
    description: '',
    latitude: '',
    longitude: '',
    subtitle: '',
    introduction: '',
    why_visit_architecture_title: '',
    why_visit_architecture_text: '',
    why_visit_culture: '',
    ticket_price: '',
    tip: '',
    bestTimes: [''],
    travelMethods: {
      fromTuyHoa: [''],
      fromElsewhere: ['']
    },
    experiences: [{ text: '', image: null }],
    cuisines: [{ text: '', image: null }],
    tips: [''],
    nearby: [''],
    hotel_ids: [],
    images: {
      introduction: null,
      architecture: null
    }
  };
  const [formData, setFormData] = useState(initialFormData);

  const fetchLocations = useCallback(async () => {
    try {
      const currentToken = getToken();
      
      if (!currentToken) {
        handleTokenExpired();
        return;
      }
      
      const response = await axios.get('http://localhost:5000/api/locations', {
        headers: {
          'Authorization': `Bearer ${currentToken}`
        }
      });
      
      setLocations(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Fetch locations error:', error);
      setError('Không thể tải danh sách địa điểm');
      setLoading(false);
      
      if (error.response?.status === 401) {
        handleTokenExpired();
      }
    }
  }, [handleTokenExpired, getToken]);

  useEffect(() => {
    fetchLocations();
  }, [fetchLocations]);

  // useEffect để tải danh sách khách sạn khi component được mount
  useEffect(() => {
    const fetchHotels = async () => {
      try {
        const hotelsData = await hotelService.getAllHotels();
        setAvailableHotels(hotelsData);
      } catch (err) {
        console.error("Failed to fetch hotels:", err);
        toast.error("Không thể tải danh sách khách sạn.");
      }
    };
    fetchHotels();
  }, []);

  // LOCK BODY SCROLL KHI MODAL MỞ
  useEffect(() => {
    if (showAddModal || showEditModal) {
      const scrollY = window.scrollY;
      
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';

      return () => {
        document.body.style.overflow = '';
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.width = '';
        window.scrollTo(0, scrollY);
      };
    }
  }, [showAddModal, showEditModal]);

  const handleAddLocation = async (e) => {
    e.preventDefault();
    try {
        const currentToken = getToken();
        if (!currentToken) {
            handleTokenExpired();
            return;
        }

        // Hiển thị loading
        toast.info('Đang thêm địa điểm...');

        const locationFormData = new FormData();

        // Thêm các trường cơ bản
        locationFormData.append('name', formData.name);
        locationFormData.append('type', formData.type);
        locationFormData.append('description', formData.description);
        locationFormData.append('latitude', formData.latitude);
        locationFormData.append('longitude', formData.longitude);
        locationFormData.append('subtitle', formData.subtitle);
        locationFormData.append('introduction', formData.introduction);
        locationFormData.append('why_visit_architecture_title', formData.why_visit_architecture_title);
        locationFormData.append('why_visit_architecture_text', formData.why_visit_architecture_text);
        locationFormData.append('why_visit_culture', formData.why_visit_culture);
        locationFormData.append('ticket_price', formData.ticket_price);
        locationFormData.append('tip', formData.tip);

        // Thêm arrays dưới dạng JSON strings
        locationFormData.append('bestTimes', JSON.stringify(formData.bestTimes));
        locationFormData.append('travelMethods', JSON.stringify(formData.travelMethods));
        locationFormData.append('tips', JSON.stringify(formData.tips));
        locationFormData.append('nearby', JSON.stringify(formData.nearby));

        // Thêm experiences và cuisines
        locationFormData.append('experiences', JSON.stringify(
            formData.experiences.map(exp => ({
                text: exp.text
            }))
        ));
        locationFormData.append('cuisines', JSON.stringify(
            formData.cuisines.map(cuisine => ({
                text: cuisine.text
            }))
        ));

        // Upload ảnh chính
        if (formData.images.introduction instanceof File) {
            locationFormData.append('introductionImage', formData.images.introduction);
        }
        if (formData.images.architecture instanceof File) {
            locationFormData.append('architectureImage', formData.images.architecture);
        }

        // Upload ảnh experiences
        formData.experiences.forEach((exp, index) => {
            if (exp.image instanceof File) {
                locationFormData.append(`experienceImage_${index}`, exp.image);
            }
        });

        // Upload ảnh cuisines
        formData.cuisines.forEach((cuisine, index) => {
            if (cuisine.image instanceof File) {
                locationFormData.append(`cuisineImage_${index}`, cuisine.image);
            }
        });

        locationFormData.append('hotel_ids', JSON.stringify(formData.hotel_ids || []));




        console.log('Sending data:', {
            formData: Object.fromEntries(locationFormData.entries())
        });

        const response = await axios.post(
            'http://localhost:5000/api/locations',
            locationFormData,
            {
                headers: {
                    'Authorization': `Bearer ${currentToken}`,
                    'Content-Type': 'multipart/form-data'
                }
            }
        );

        if (response.data.success) {
            toast.success('Thêm địa điểm thành công');
            setShowAddModal(false);
            await fetchLocations();
            resetForm();
        }
    } catch (error) {
        console.error('Add location error:', error);
        toast.error(error.response?.data?.message || 'Lỗi khi thêm địa điểm');
        
        if (error.response?.status === 401) {
            handleTokenExpired();
        }
    }
};

const handleEditLocation = async (e, locationFormData) => { // Nhận FormData đã được chuẩn bị
  e.preventDefault();
  try {
    const currentToken = getToken();
    if (!currentToken) {
      handleTokenExpired();
      return;
    }

    toast.info('Đang cập nhật địa điểm...');
    
    const locationId = selectedLocation.id;
    console.log('Sending update data for location ID:', locationId);

    const response = await axios.put(
      `http://localhost:5000/api/locations/${locationId}`,
      locationFormData, // Gửi trực tiếp FormData đã nhận
      {
        headers: {
          'Authorization': `Bearer ${currentToken}`,
          'Content-Type': 'multipart/form-data'
        }
      }
    );

    if (response.data.success) {
      toast.success('Cập nhật địa điểm thành công');
      setShowEditModal(false);
      setSelectedLocation(null);
      await fetchLocations();
      resetForm();
    } else {
      toast.error(response.data.message || 'Cập nhật địa điểm thất bại');
    }
  } catch (error) {
    console.error('Edit location error:', error);
    toast.error(
      error.response?.data?.message || 
      'Lỗi khi cập nhật địa điểm. Vui lòng thử lại sau.'
    );
    
    if (error.response?.status === 401) {
      handleTokenExpired();
    }
  }
};
 
  const handleDeleteLocation = async (id) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa địa điểm này?')) return;

    try {
      const currentToken = getToken();
      if (!currentToken) {
        handleTokenExpired();
        return;
      }

      await axios.delete(`http://localhost:5000/api/locations/${id}`, {
        headers: {
          'Authorization': `Bearer ${currentToken}`
        }
      });

      toast.success('Xóa địa điểm thành công');
      await fetchLocations();
    } catch (error) {
      console.error('Delete location error:', error);
      toast.error(error.response?.data?.message || 'Lỗi khi xóa địa điểm');
      
      if (error.response?.status === 401) {
        handleTokenExpired();
      }
    }
  };

  const resetForm = () => {
    setFormData(initialFormData);
  };


  const [searchTerm, setSearchTerm] = useState('');
  const [searchTimeout, setSearchTimeout] = useState(null);
  
  const handleSearch = async (keyword) => {
    try {
        if (searchTimeout) {
            clearTimeout(searchTimeout);
        }
  
        setSearchTimeout(setTimeout(async () => {
            try {
                const currentToken = getToken();
                if (!currentToken) {
                    handleTokenExpired();
                    return;
                }
  
                if (!keyword.trim()) {
                    await fetchLocations();
                    return;
                }
  
                const response = await axios.get('http://localhost:5000/api/locations/search', {
                    params: { keyword: keyword.trim() },
                    headers: {
                        'Authorization': `Bearer ${currentToken}`
                    }
                });
  
                if (response.data.success) {
                    setLocations(response.data.locations);
                }
            } catch (error) {
                console.error('Search error:', error);
                if (error.response?.status === 404) {
                    toast.error('Không tìm thấy kết quả phù hợp');
                } else {
                    toast.error('Lỗi khi tìm kiếm địa điểm');
                }
            }
        }, 500));
    } catch (error) {
        console.error('Search error:', error);
        toast.error('Lỗi khi tìm kiếm địa điểm');
    }
  };
    
  

  if (loading) return <div className="loading-state">Đang tải...</div>;
  if (error) return <div className="error-state">Lỗi: {error}</div>;

  return (
    <>
      <div className="location-management">
        <div className="header-wrapper">
          <h1 className="page-title">Quản lý địa điểm</h1>
          <div className="search-bar">
            <input
                type="text" 
                placeholder="Tìm kiếm theo tên..."
                value={searchTerm}
                onChange={(e) => {
                  const value = e.target.value;
                  setSearchTerm(value);
                  handleSearch(value); // Gọi hàm search khi giá trị thay đổi
                }}
                className="search-input"
              />
            <select
              onChange={(e) => {
              const selectedType = e.target.value;
              if (selectedType === "all") {
                fetchLocations(); // Reset to all locations
              } else {
                const filteredLocations = locations.filter(location =>
                location.type === selectedType
                );
                setLocations(filteredLocations);
              }
              }}
              className="search-select"
            >
              <option value="all">Tất cả thể loại</option>
              <option value="Bãi biển">Bãi biển</option>
              <option value="Văn hóa">Văn hóa</option>
              <option value="di tích">Di tích</option>
              <option value="Thiên nhiên">Thiên nhiên</option>

            </select>
            </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="add-button"
          >
            Thêm địa điểm mới
          </button>
        </div>

        <LocationList
          locations={locations}
          onEdit={(location) => {
            setSelectedLocation(location);
            setShowEditModal(true);
          }}
          onDelete={handleDeleteLocation}
        />

        <AddLocationModal
          show={showAddModal}
          onClose={() => {
            setShowAddModal(false);
            resetForm();
          }}
          formData={formData}
          setFormData={setFormData}
          onSubmit={handleAddLocation}
          availableLocations={locations}
          availableHotels={availableHotels}
        />

        {/* <EditLocationModal
          show={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setSelectedLocation(null);
          }}
          formData={formData}
          setFormData={setFormData}
          selectedLocation={selectedLocation}
          onSubmit={handleEditLocation}
        /> */}
         <EditLocationModal
        show={showEditModal}
        onClose={() => { setShowEditModal(false); setSelectedLocation(null);  }}
        selectedLocation={selectedLocation} // Chỉ cần truyền location được chọn
        onSubmit={handleEditLocation}
        availableLocations={locations}
        availableHotels={availableHotels} // 
      />
      </div>
      <ToastContainer />
    </>
  );
};

export default LocationManagement;