import React, { useState, useEffect } from 'react';
import TourForm from './TourForm';
import axios from 'axios';
import { CONFIG } from '../../../config';
import '../../../styles/itineraryCSS/TourModal.css';

const EditTourModal = ({ show, onClose, formData, setFormData, onSubmit, isSubmitting, tourId }) => {
  const [availableLocations, setAvailableLocations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    // Fetch danh sách địa điểm khi component mount
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
  
  // Nếu có tourId truyền vào thì fetch dữ liệu tour đó
  useEffect(() => {
    if (tourId) {
      const fetchTour = async () => {
        try {
          setLoading(true);
          const response = await axios.get(`${CONFIG.API_API_URL}/tours/${tourId}`);
          
          if (response.data.success) {
            const tourData = response.data.tour;
            
            // Xử lý dữ liệu locations trong schedule - lưu dưới dạng số nguyên
            const updatedSchedule = tourData.schedule.map(day => {
              return {
                ...day,
                locations: day.locations ? day.locations.map(loc => parseInt(loc.id, 10)) : []
              };
            });
            
            // Trích xuất location IDs từ tất cả các ngày trong lịch trình - lưu dưới dạng số nguyên
            const allLocationIds = [];
            tourData.schedule.forEach(day => {
              if (day.locations && Array.isArray(day.locations)) {
                day.locations.forEach(loc => {
                  const locId = parseInt(loc.id, 10);
                  if (!isNaN(locId) && !allLocationIds.includes(locId)) {
                    allLocationIds.push(locId);
                  }
                });
              }
            });
            
            console.log("Extracted location IDs:", allLocationIds);
            
            setFormData({
              ...tourData,
              schedule: updatedSchedule,
              image: tourData.image,
              selected_location_ids: allLocationIds,
              location_ids: allLocationIds // Đảm bảo thêm cả trường location_ids
            });
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
    }
  }, [tourId, setFormData]);

  if (!show) return null;

  return (
    <div className="tour-modal-overlay">
      <div className="tour-modal-content">
        <div className="tour-modal-header">
          <h2>Chỉnh Sửa Tour</h2>
          <button onClick={onClose} className="tour-close-button">
            <i className="bi bi-x"></i>
          </button>
        </div>
        
        {loading && (
          <div className="loading-indicator">
            <div className="spinner"></div>
            <p>Đang tải thông tin tour...</p>
          </div>
        )}
        
        {error && (
          <div className="error-message">
            <p>{error}</p>
            <button onClick={onClose}>Đóng</button>
          </div>
        )}
        
        {!loading && !error && (
          <TourForm
            formData={formData}
            setFormData={setFormData}
            onSubmit={onSubmit}
            onCancel={onClose}
            isSubmitting={isSubmitting}
          />
        )}
      </div>
    </div>
  );
};

export default EditTourModal;

