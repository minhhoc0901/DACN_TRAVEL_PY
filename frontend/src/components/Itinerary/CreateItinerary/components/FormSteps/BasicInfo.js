import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { CONFIG } from '../../../../../config';

export const BasicInfo = ({ formData, onChange, setFormData, updateLocationsInSchedule }) => {
  const [availableLocations, setAvailableLocations] = useState([]);
  const provinces = [
    "An Giang", "Bà Rịa - Vũng Tàu", "Bắc Giang", "Bắc Kạn", "Bạc Liêu", "Bắc Ninh",
    "Bến Tre", "Bình Định", "Bình Dương", "Bình Phước", "Bình Thuận", "Cà Mau",
    "Cần Thơ", "Cao Bằng", "Đà Nẵng", "Đắk Lắk", "Đắk Nông", "Điện Biên", "Đồng Nai",
    "Đồng Tháp", "Gia Lai", "Hà Giang", "Hà Nam", "Hà Nội", "Hà Tĩnh", "Hải Dương",
    "Hải Phòng", "Hậu Giang", "Hòa Bình", "Hưng Yên", "Khánh Hòa", "Kiên Giang",
    "Kon Tum", "Lai Châu", "Lâm Đồng", "Lạng Sơn", "Lào Cai", "Long An", "Nam Định",
    "Nghệ An", "Ninh Bình", "Ninh Thuận", "Phú Thọ", "Phú Yên", "Quảng Bình",
    "Quảng Nam", "Quảng Ngãi", "Quảng Ninh", "Quảng Trị", "Sóc Trăng", "Sơn La",
    "Tây Ninh", "Thái Bình", "Thái Nguyên", "Thanh Hóa", "Thừa Thiên Huế", "Tiền Giang",
    "TP Hồ Chí Minh", "Trà Vinh", "Tuyên Quang", "Vĩnh Long", "Vĩnh Phúc", "Yên Bái"
  ];
  
  // Fetch available locations when component mounts
  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const response = await axios.get(`${CONFIG.API_API_URL}/locations`);
        setAvailableLocations(response.data);
      } catch (error) {
        console.error("Error fetching locations:", error);
      }
    };
    fetchLocations();
  }, []);

  // Hàm tạo chuỗi tên địa điểm từ danh sách ID đã chọn
  // const getDestinationString = (selectedLocationIds) => {
  //   const selectedLocations = availableLocations.filter(loc => 
  //     selectedLocationIds.includes(loc.id.toString()));
  //   return selectedLocations.map(loc => 
  //     loc.title || loc.name).join(' | ');
  // };

  // Handle multiple destination selection
  const handleDestinationsSelect = (e) => {
    const selectedOptions = Array.from(e.target.selectedOptions);
    const selectedLocationIds = selectedOptions.map(option => option.value);
    
    // Get the selected location objects
    const selectedLocations = availableLocations.filter(loc => 
      selectedLocationIds.includes(loc.id.toString()));
    
    if (selectedLocations.length > 0) {
      // Create a combined destination string
      const destinationNames = selectedLocations.map(loc => 
        loc.title || loc.name).join(' | ');
      
      setFormData(prev => ({
        ...prev,
        destination: destinationNames,
        selected_location_ids: selectedLocationIds
      }));
      
      // Cập nhật lịch trình với các điểm đã chọn
      if (updateLocationsInSchedule) {
        updateLocationsInSchedule(selectedLocationIds);
      }
    }
  };

  // Regular input change handler
  const handleInputChange = (e) => {
    onChange(e);
  };

  return (
    <div className="step-content">
      <h2>Bước 1: Thông tin cơ bản</h2>
      
      <div className="create-tour-form-group">
        <label>Chọn điểm đến:</label>
        <select 
          multiple
          className="tour-select-locations"
          onChange={handleDestinationsSelect}
          value={formData.selected_location_ids || []}
          required
          size={Math.min(6, availableLocations.length)}
        >
          {availableLocations.map((loc) => (
            <option key={loc.id} value={loc.id}>
              {loc.title || loc.name}
            </option>
          ))}
        </select>
        <small>Giữ phím Ctrl để chọn nhiều địa điểm du lịch từ danh sách</small>
      </div>
      
      <div className="create-tour-form-group">
        <label htmlFor="departureFrom">Xuất phát từ:</label>
        <select
          id="departureFrom"
          name="departureFrom"
          value={formData.departureFrom}
          onChange={handleInputChange}
          required
        >
          <option value="">-- Chọn điểm khởi hành --</option>
          {provinces.sort().map(province => ( // Sắp xếp theo alphabet cho dễ tìm
            <option key={province} value={province}>
              {province}
            </option>
          ))}
        </select>
      </div>
      
      <div className="create-tour-form-row">
        <div className="create-tour-form-group half">
          <label htmlFor="departureDate">Ngày khởi hành:</label>
          <input 
            type="date" 
            id="departureDate" 
            name="departureDate" 
            value={formData.departureDate} 
            onChange={handleInputChange}
            min={new Date().toISOString().split('T')[0]}
            required
          />
        </div>
        
        <div className="create-tour-form-group half">
          <label htmlFor="returnDate">Ngày kết thúc:</label>
          <input 
            type="date" 
            id="returnDate" 
            name="returnDate" 
            value={formData.returnDate} 
            onChange={handleInputChange}
            min={formData.departureDate || new Date().toISOString().split('T')[0]}
            required
          />
        </div>
      </div>
      
      {formData.departureDate && formData.returnDate && formData.duration && (
        <div className="create-tour-form-info">
          <p><strong>Thời gian tour:</strong> {formData.duration}</p>
          {formData.destination && (
            <p><strong>Điểm đến:</strong> {formData.destination}</p>
          )}
        </div>
      )}
    </div>
  );
};