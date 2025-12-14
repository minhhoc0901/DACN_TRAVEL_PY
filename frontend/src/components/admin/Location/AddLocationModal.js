
import React from 'react';
import LocationForm from './LocationForm';

const AddLocationModal = ({ 
  show, 
  onClose, 
  formData, 
  setFormData, 
  onSubmit, 
  availableLocations, 
  availableHotels     
}) => {
  if (!show) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content large" onClick={(e) => e.stopPropagation()}>
        <h2 className="modal-title">Thêm Địa Điểm Mới</h2>
        <LocationForm
          formData={formData}
          setFormData={setFormData}
          onSubmit={onSubmit}
          onCancel={onClose}
          availableLocations={availableLocations} 
          availableHotels={availableHotels}         
        />
      </div>
    </div>
  );
};

export default AddLocationModal;