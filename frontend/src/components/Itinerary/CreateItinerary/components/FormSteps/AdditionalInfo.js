import React from 'react';

export const AdditionalInfo = ({ formData, setFormData }) => {
  // Handler for changing items in lists (includes, excludes, notes)
  const handleListItemChange = (listName, index, value) => {
    const newList = [...formData[listName]];
    newList[index] = value;
    setFormData({
      ...formData,
      [listName]: newList
    });
  };

  // Handler for adding new items to lists
  const handleAddListItem = (listName) => {
    const newList = [...formData[listName], ""];
    setFormData({
      ...formData,
      [listName]: newList
    });
  };

  // Handler for removing items from lists
  const handleRemoveListItem = (listName, index) => {
    // Don't allow removing if it's the last item
    if (formData[listName].length <= 1) return;
    
    const newList = [...formData[listName]];
    newList.splice(index, 1);
    setFormData({
      ...formData,
      [listName]: newList
    });
  };

  return (
    <div className="step-content">
      <h2>Bước 4: Thông tin thêm</h2>
      
      {/* Giá tour bao gồm section */}
      <div className="create-tour-form-section">
        <h3>Giá tour bao gồm</h3>
        {formData.includes.map((item, index) => (
          <div className="list-item" key={index}>
            <input 
              type="text" 
              value={item} 
              onChange={(e) => handleListItemChange('includes', index, e.target.value)}
              placeholder="Nhập dịch vụ bao gồm (VD: Vé máy bay khứ hồi)"
              required
            />
            <button 
              type="button" 
              className="remove-btn"
              onClick={() => handleRemoveListItem('includes', index)}
              disabled={formData.includes.length <= 1}
            >
              Xóa
            </button>
          </div>
        ))}
        <button 
          type="button" 
          className="add-btn"
          onClick={() => handleAddListItem('includes')}
        >
          + Thêm mục
        </button>
      </div>
      
      {/* Giá tour không bao gồm section */}
      <div className="create-tour-form-section">
        <h3>Giá tour không bao gồm</h3>
        {formData.excludes.map((item, index) => (
          <div className="list-item" key={index}>
            <input 
              type="text" 
              value={item} 
              onChange={(e) => handleListItemChange('excludes', index, e.target.value)}
              placeholder="Nhập dịch vụ không bao gồm (VD: Chi phí cá nhân)"
              required
            />
            <button 
              type="button" 
              className="remove-btn"
              onClick={() => handleRemoveListItem('excludes', index)}
              disabled={formData.excludes.length <= 1}
            >
              Xóa
            </button>
          </div>
        ))}
        <button 
          type="button" 
          className="add-btn"
          onClick={() => handleAddListItem('excludes')}
        >
          + Thêm mục
        </button>
      </div>
      
      {/* Lưu ý section */}
      <div className="create-tour-form-section">
        <h3>Lưu ý</h3>
        {formData.notes.map((item, index) => (
          <div className="list-item" key={index}>
            <input 
              type="text" 
              value={item} 
              onChange={(e) => handleListItemChange('notes', index, e.target.value)}
              placeholder="Nhập lưu ý (VD: Mang theo giấy tờ tùy thân)"
              required
            />
            <button 
              type="button" 
              className="remove-btn"
              onClick={() => handleRemoveListItem('notes', index)}
              disabled={formData.notes.length <= 1}
            >
              Xóa
            </button>
          </div>
        ))}
        <button 
          type="button" 
          className="add-btn"
          onClick={() => handleAddListItem('notes')}
        >
          + Thêm mục
        </button>
      </div>
      
      {/* Tóm tắt tour section */}
      <div className="form-summary">
        <h3>Tóm tắt tour</h3>
        <div className="summary-content">
          <p><strong>Điểm đến:</strong> {formData.destination || 'Chưa chọn'}</p>
          <p><strong>Xuất phát từ:</strong> {formData.departureFrom || 'Chưa chọn'}</p>
          <p><strong>Thời gian:</strong> {formData.duration || 'Chưa xác định'}</p>
          <p><strong>Ngày đi:</strong> {formData.departureDate ? new Date(formData.departureDate).toLocaleDateString('vi-VN') : 'Chưa chọn'}</p>
          <p><strong>Ngày về:</strong> {formData.returnDate ? new Date(formData.returnDate).toLocaleDateString('vi-VN') : 'Chưa chọn'}</p>
          <p><strong>Số dịch vụ bao gồm:</strong> {formData.includes.filter(item => item.trim()).length}</p>
          <p><strong>Số dịch vụ không bao gồm:</strong> {formData.excludes.filter(item => item.trim()).length}</p>
          <p><strong>Số lưu ý:</strong> {formData.notes.filter(item => item.trim()).length}</p>
        </div>
      </div>
    </div>
  );
};