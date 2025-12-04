import React from 'react';

export const ProcessingOverlay = () => {
  return (
    <div className="processing-overlay">
      <div className="processing-spinner"></div>
      <p>Đang xử lý ảnh và lưu dữ liệu...</p>
    </div>
  );
};