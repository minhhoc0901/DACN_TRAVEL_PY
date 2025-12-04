import React, { useState, useEffect } from 'react';
import '../../../../styles/itineraryCSS/ImageUpload.css';

export const ImageUpload = ({ formData, setFormData }) => {
  const [previewImage, setPreviewImage] = useState(null);
  // const [tourImage, setTourImage] = useState(null); 
  // const [uploadingImage, setUploadingImage] = useState(false); 
  const [description, setDescription] = useState(formData.description || '');
  const [highlights, setHighlights] = useState(formData.highlights || ['', '', '', '']);
  const [imageError, setImageError] = useState('');

  // Hiển thị preview ảnh hiện tại nếu đang edit
  useEffect(() => {
    if (formData.image && typeof formData.image === 'string' && formData.image.startsWith('/')) {
      setPreviewImage(`http://localhost:5000${formData.image}`);
    } else if (formData.image && typeof formData.image === 'string') {
      setPreviewImage(formData.image);
    } else if (formData.imagePreview) {
      setPreviewImage(formData.imagePreview);
    }
  }, [formData.image, formData.imagePreview]);

  // Xử lý khi tải lên file ảnh mới - cập nhật theo TourForm
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // Kiểm tra kích thước file (giới hạn 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setImageError('Kích thước file quá lớn. Vui lòng chọn file nhỏ hơn 5MB.');
      return;
    }
    
    // Kiểm tra loại file
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setImageError('Loại file không hợp lệ. Vui lòng chọn file ảnh (JPEG, PNG, GIF, WEBP).');
      return;
    }
    
    setImageError('');
    // setTourImage(file); 
    
    // Tạo preview URL và lưu cả ảnh và URL
    const previewURL = URL.createObjectURL(file);
    setPreviewImage(previewURL);
    
    // Lưu trữ file ảnh trong formData thay vì gửi lên server ngay lập tức
    setFormData(prev => ({
      ...prev,
      image: file,
      imagePreview: previewURL
    }));
  };

  // Xử lý khi thay đổi description
  const handleDescriptionChange = (e) => {
    const value = e.target.value;
    setDescription(value);
    setFormData({
      ...formData,
      description: value
    });
  };

  // Xử lý khi thay đổi highlights
  const handleHighlightChange = (index, value) => {
    const newHighlights = [...highlights];
    newHighlights[index] = value;
    setHighlights(newHighlights);
    setFormData({
      ...formData,
      highlights: newHighlights
    });
  };

  // Thêm một highlight mới
  const handleAddHighlight = () => {
    const newHighlights = [...highlights, ''];
    setHighlights(newHighlights);
    setFormData({
      ...formData,
      highlights: newHighlights
    });
  };

  // Xóa một highlight
  const handleRemoveHighlight = (index) => {
    if (highlights.length <= 1) return;
    
    const newHighlights = highlights.filter((_, i) => i !== index);
    setHighlights(newHighlights);
    setFormData({
      ...formData,
      highlights: newHighlights
    });
  };

  // Thêm cleanup cho object URL để tránh memory leaks
  useEffect(() => {
    return () => {
      if (formData.imagePreview && formData.imagePreview.startsWith('blob:')) {
        URL.revokeObjectURL(formData.imagePreview);
      }
    };
  }, [formData.imagePreview]);

  return (
    <div className="image-description-container">
      <h2 className="section-title">Hình ảnh & Mô tả</h2>
      
      <div className="image-section">
        <h3>Hình ảnh đại diện tour</h3>
        
        <div className="upload-section">
          <input 
            type="file" 
            id="tour-image" 
            accept="image/*"
            onChange={handleFileUpload}
            className="file-input"
            // disabled={uploadingImage}
          />
          <label htmlFor="tour-image" className="file-label">
            Chọn file ảnh
          </label>
          {imageError && <p className="error-message">{imageError}</p>}
          <p className="help-text">Hỗ trợ file JPEG, PNG, GIF. Kích thước tối đa: 5MB</p>
        </div>
        
        <div className="image-preview">
          {previewImage ? (
            <img 
              src={previewImage} 
              alt=""
              onError={(e) => {
                e.target.src = '/placeholder-image.jpg'; // Fallback image
              }}
            />
          ) : (
            <div className="image-placeholder">
              <i className="bi bi-image-alt placeholder-icon"></i>
              <p>Chưa có ảnh nào được chọn</p>
              <span>Xem trước ảnh sẽ hiển thị ở đây</span>
            </div>
          )}
        </div>
      </div>
      
      <div className="description-section">
        <h3>Mô tả tour</h3>
        <textarea
          rows="5"
          placeholder="Nhập mô tả chi tiết về tour..."
          value={description}
          onChange={handleDescriptionChange}
          required
        ></textarea>
      </div>
      
      <div className="highlights-section">
        <h3>Điểm nổi bật của tour</h3>
        <p className="help-text">Thêm những điểm thu hút của tour (tối thiểu 4 điểm)</p>
        
        {highlights.map((highlight, index) => (
          <div key={index} className="highlight-item">
            <input
              type="text"
              placeholder={`Điểm nổi bật ${index + 1}`}
              value={highlight}
              onChange={(e) => handleHighlightChange(index, e.target.value)}
              required
            />
            <button 
              type="button" 
              className="remove-btn"
              onClick={() => handleRemoveHighlight(index)}
              disabled={highlights.length <= 4}
            >
              Xóa
            </button>
          </div>
        ))}
        
        <button 
          type="button" 
          className="add-highlight-btn"
          onClick={handleAddHighlight}
        >
          + Thêm điểm nổi bật
        </button>
      </div>
    </div>
  );
};

export default ImageUpload;