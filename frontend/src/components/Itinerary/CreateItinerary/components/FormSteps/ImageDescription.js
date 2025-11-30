import React from 'react';
import { ImageUpload } from '../ImageUpload';

export const ImageDescription = ({ formData, setFormData }) => {
  return (
    <div className="step-content">
      <h2>Bước 2: Hình ảnh và Mô tả</h2>
      
      <ImageUpload 
        formData={formData}
        setFormData={setFormData}
      />
    </div>
  );
};