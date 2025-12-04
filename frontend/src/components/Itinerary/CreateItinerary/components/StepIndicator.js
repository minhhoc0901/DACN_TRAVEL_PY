import React from 'react';

export const StepIndicator = ({ currentStep, setCurrentStep }) => {
  const steps = [
    'Thông tin cơ bản',
    'Hình ảnh & Mô tả',
    'Lịch trình',
    'Hoàn tất'
  ];

  return (
    <div className="stepper">
      {steps.map((step, index) => (
        <div 
          key={index} 
          className={`step ${currentStep > index + 1 ? 'completed' : ''} ${currentStep === index + 1 ? 'active' : ''}`}
          onClick={() => setCurrentStep(index + 1)}
        >
          <div className="step-number">{index + 1}</div>
          <div className="step-label">{step}</div>
        </div>
      ))}
    </div>
  );
};