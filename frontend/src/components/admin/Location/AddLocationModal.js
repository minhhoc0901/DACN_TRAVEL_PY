

// AddLocationModal.jsx
import React from 'react';
import LocationForm from './LocationForm';

const AddLocationModal = ({ show, onClose, formData, setFormData, onSubmit }) => {
  if (!show) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2 className="modal-title">Thêm Địa Điểm Mới</h2>
        <LocationForm
          formData={formData}
          setFormData={setFormData}
          onSubmit={onSubmit}
          onCancel={onClose}
        />
      </div>
    </div>
  );
};

export default AddLocationModal;