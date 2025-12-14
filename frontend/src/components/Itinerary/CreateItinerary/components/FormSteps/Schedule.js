import React from 'react';
import { ScheduleDay } from '../ScheduleDay';

export const Schedule = ({ formData, setFormData }) => {
  return (
    <div className="step-content">
      <h2>Bước 3: Lịch trình chi tiết</h2>
      
      <div className="tour-itinerary-preview">
        <h3>Lịch trình tour</h3>
        <p className="itinerary-note">Tùy chỉnh lịch trình tour theo ý muốn của bạn</p>
        
        {formData.schedule.length > 0 ? (
          formData.schedule.map((day, dayIndex) => (
            <ScheduleDay
              key={dayIndex}
              day={day}
              dayIndex={dayIndex}
              formData={formData}
              setFormData={setFormData}
            />
          ))
        ) : (
          <div className="no-schedule">
            <p>Chưa có lịch trình. Vui lòng kiểm tra ngày đi và ngày về ở Bước 1.</p>
          </div>
        )}
      </div>
    </div>
  );
};