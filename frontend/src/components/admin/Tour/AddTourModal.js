import React, { useState } from 'react';
import TourForm from './TourForm';
import '../../../styles/itineraryCSS/TourModal.css';

// Initial state cho formData khi tạo mới tour
const initialFormData = {
  destination: '',
  departure_from: '',
  departure_date: '',
  return_date: '',
  duration: '',
  description: '',
  selected_location_ids: [],
  image: null,
  highlights: [''],
  schedule: [{
    day: 'Ngày 1',
    title: '',
    activities: [''],
    locations: []  // Quan trọng: Phải có trường locations là một mảng
  }],
  includes: ['Xe du lịch đời mới máy lạnh', 'Khách sạn tiêu chuẩn 3 sao'],
  excludes: ['Chi phí cá nhân', 'Tiền tip cho hướng dẫn viên'],
  notes: ['Quý khách vui lòng mang theo giấy tờ tùy thân']
};

const AddTourModal = ({ show, onClose, onSubmit, isSubmitting }) => {
  const [formData, setFormData] = useState(initialFormData);
  
  if (!show) return null;
  
  // Thêm xử lý dữ liệu trước khi submit
  const handleSubmit = (e) => {
    // Kiểm tra xem e có phải là event không trước khi gọi preventDefault
    if (e && typeof e.preventDefault === 'function') {
      e.preventDefault();
    }
    
    // Xử lý dữ liệu form để đảm bảo đúng định dạng
    const processedData = {
      ...formData,
      // Đảm bảo các trường là mảng và đã được lọc giá trị rỗng
      highlights: Array.isArray(formData.highlights) 
        ? formData.highlights.filter(h => h && h.trim()) 
        : [],
      schedule: Array.isArray(formData.schedule) 
        ? formData.schedule.map(day => ({
            ...day,
            activities: Array.isArray(day.activities) 
              ? day.activities.filter(a => a && a.trim()) 
              : [],
            locations: Array.isArray(day.locations) 
              ? day.locations.map(id => typeof id === 'string' ? parseInt(id, 10) : id)
              : []
          }))
        : [],
      includes: Array.isArray(formData.includes) 
        ? formData.includes.filter(i => i && i.trim()) 
        : [],
      excludes: Array.isArray(formData.excludes) 
        ? formData.excludes.filter(e => e && e.trim()) 
        : [],
      notes: Array.isArray(formData.notes) 
        ? formData.notes.filter(n => n && n.trim()) 
        : [],
      selected_location_ids: Array.isArray(formData.selected_location_ids) 
        ? formData.selected_location_ids.map(id => typeof id === 'string' ? parseInt(id, 10) : id)
        : []
    };
    
    // Log dữ liệu đã xử lý
    console.log('Processed data in AddTourModal:', processedData);
    
    // Gọi onSubmit từ props
    onSubmit(processedData);
  };

  return (
    <div className="tour-modal-overlay">
      <div className="tour-modal-content">
        <div className="tour-modal-header">
          <h2>Thêm Tour Mới</h2>
          <button onClick={onClose} className="tour-close-button">
            <i className="bi bi-x"></i>
          </button>
        </div>
        
        <TourForm
          formData={formData}
          setFormData={setFormData}
          onSubmit={handleSubmit}
          onCancel={onClose}
          isSubmitting={isSubmitting}
        />
      </div>
    </div>
  );
};

export default AddTourModal;