import React from 'react';

export const ScheduleDay = ({ day, dayIndex, formData, setFormData }) => {
  const handleDayTitleChange = (value) => {
    const newSchedule = [...formData.schedule];
    newSchedule[dayIndex].title = value;
    setFormData({...formData, schedule: newSchedule});
  };

  const handleActivityChange = (activityIndex, value) => {
    const newSchedule = [...formData.schedule];
    newSchedule[dayIndex].activities[activityIndex] = value;
    setFormData({...formData, schedule: newSchedule});
  };

  const handleAddActivity = () => {
    const newSchedule = [...formData.schedule];
    newSchedule[dayIndex].activities.push("00:00: Hoạt động mới");
    setFormData({...formData, schedule: newSchedule});
  };

  const handleRemoveActivity = (activityIndex) => {
    const newSchedule = [...formData.schedule];
    newSchedule[dayIndex].activities.splice(activityIndex, 1);
    setFormData({...formData, schedule: newSchedule});
  };

  return (
    <div className="itinerary-day">
      <div className="day-title">
        <div className="day-label">Ngày {dayIndex + 1}</div>
        <input 
          type="text" 
          className="day-location"
          value={day.title} 
          onChange={(e) => handleDayTitleChange(e.target.value)}
          placeholder="Nhập tiêu đề ngày"
          required
        />
      </div>
      
      <div className="day-activities">
        {day.activities.map((activity, actIndex) => {
          const [time, ...descParts] = activity.split(': ');
          const description = descParts.join(': ');
          
          return (
            <div className="activity-item" key={actIndex}>
              <div className="activity-time">
                <input
                  type="text"
                  value={time}
                  onChange={(e) => {
                    const newActivity = `${e.target.value}: ${description}`;
                    handleActivityChange(actIndex, newActivity);
                  }}
                  placeholder="00:00"
                />
              </div>
              <div className="activity-description">
                <input
                  type="text"
                  value={description}
                  onChange={(e) => {
                    const newActivity = `${time}: ${e.target.value}`;
                    handleActivityChange(actIndex, newActivity);
                  }}
                  placeholder="Mô tả hoạt động"
                />
              </div>
              <button 
                type="button" 
                className="remove-activity-btn"
                onClick={() => handleRemoveActivity(actIndex)}
              >
                Xóa
              </button>
            </div>
          );
        })}
        
        <button 
          type="button" 
          className="add-activity-btn"
          onClick={handleAddActivity}
        >
          + Thêm hoạt động
        </button>
      </div>
    </div>
  );
};