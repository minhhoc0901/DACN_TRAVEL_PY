import React from 'react';

export const FormNavigation = ({ currentStep, onNext, onPrev, isSubmitting, canProceed }) => {
  return (
    <div className="form-actions">
      {currentStep > 1 && (
        <button 
          type="button" 
          className="prev-btn"
          onClick={onPrev}
          disabled={isSubmitting}
        >
          Quay lại
        </button>
      )}
      
      {currentStep < 4 ? (
        <button 
          type="button" 
          className="next-btn"
          onClick={onNext}
          disabled={!canProceed || isSubmitting}
        >
          Tiếp theo
        </button>
      ) : (
        <button 
          type="submit" 
          className="submit-btn"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Đang xử lý...' : 'Tạo tour'}
        </button>
      )}
    </div>
  );
};