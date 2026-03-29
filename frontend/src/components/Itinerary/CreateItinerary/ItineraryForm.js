import React, { useState, useEffect } from 'react';
import { StepIndicator } from './components/StepIndicator';
import { BasicInfo } from './components/FormSteps/BasicInfo';
import { ImageDescription } from './components/FormSteps/ImageDescription';
import { Schedule } from './components/FormSteps/Schedule';
import { AdditionalInfo } from './components/FormSteps/AdditionalInfo';
import { FormNavigation } from './components/FormNavigation';
import { ProcessingOverlay } from './components/ProcessingOverlay';
import { TourCreationSuccess } from './components/TourCreationSuccess';
import axios from 'axios';
import { useAuth } from '../../../contexts/AuthContext'; // Sửa từ context thành contexts

export const ItineraryForm = () => {
  const { user } = useAuth(); // Lấy thông tin user từ context
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [createdTour, setCreatedTour] = useState(null);
  const [formData, setFormData] = useState({
    destination: '',
    departureFrom: '',
    departureDate: '',
    returnDate: '',
    duration: '',
    selected_location_ids: [], 
    image: '/assets/uploads/locations/1/1-exp-3.jpg',
    coverImage: null,
    description: '',
    highlights: ['', '', '', ''],
    schedule: [],
    includes: [
      "Xe du lịch đời mới máy lạnh",
      "Khách sạn tiêu chuẩn 3 sao (2 người/phòng)",
      "Các bữa ăn theo chương trình",
      "Hướng dẫn viên nhiệt tình, kinh nghiệm",
      "Vé tham quan các điểm theo lịch trình",
      "Bảo hiểm du lịch"
    ],
    excludes: [
      "Chi phí cá nhân, đồ uống",
      "Các chi phí không được đề cập trong mục bao gồm",
      "Tiền tip cho hướng dẫn viên và tài xế"
    ],
    notes: [
      "Quý khách vui lòng mang theo giấy tờ tùy thân (CMND/CCCD).",
      "Lịch trình có thể thay đổi tùy theo điều kiện thời tiết và tình hình thực tế.",
      "Trẻ em dưới 2 tuổi miễn phí, từ 2-5 tuổi tính 50% giá tour, từ 6 tuổi trở lên tính như người lớn.",
      "Quý khách nên mang theo thuốc đau bụng, cảm sốt, thuốc chống say xe."
    ]
  });

  // Tính toán thời gian tour
  useEffect(() => {
    if (formData.departureDate && formData.returnDate) {
      const startDate = new Date(formData.departureDate);
      const endDate = new Date(formData.returnDate);
      
      const diffTime = endDate.getTime() - startDate.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
      
      if (diffDays > 0) {
        const newSchedule = [];
        
        const locationIds = [...formData.selected_location_ids]; 
        const locationsPerDay = Math.ceil(locationIds.length / diffDays);
        
        for (let i = 0; i < diffDays; i++) {
          const currentDate = new Date(startDate);
          currentDate.setDate(startDate.getDate() + i);
          
          let title = "";
          let defaultActivities = [];
          
          if (i === 0) {
            title = "TP.HCM - TUY HÒA - THÁP NGHINH PHONG";
            defaultActivities = [
              "05:00: Xe và HDV đón khách tại điểm hẹn, khởi hành đi Phú Yên",
              "12:00: Đến Tuy Hòa, dùng cơm trưa tại nhà hàng địa phương",
              "14:00: Tham quan Tháp Nghinh Phong - ngắm toàn cảnh thành phố",
              "17:00: Nhận phòng khách sạn, nghỉ ngơi",
              "18:30: Dùng bữa tối, tự do khám phá thành phố Tuy Hòa về đêm"
            ];
          } else if (i === diffDays - 1) {
            title = "VỊNH VŨNG RÔ - TP.HCM";
            defaultActivities = [
              "06:30: Dùng bữa sáng, trả phòng khách sạn",
              "08:00: Tham quan Vịnh Vũng Rô - vịnh biển đẹp bậc nhất Việt Nam",
              "11:30: Dùng bữa trưa, nghỉ ngơi",
              "13:00: Khởi hành về TP.HCM",
              "21:00: Về đến TP.HCM, kết thúc chương trình tour"
            ];
          } else {
            title = "GÀNH ĐÁ ĐĨA - BÃI XẾP";
            defaultActivities = [
              "06:00: Dùng bữa sáng tại khách sạn",
              "07:30: Khởi hành đi Gành Đá Đĩa - thắng cảnh địa chất nổi tiếng",
              "11:30: Dùng bữa trưa tại nhà hàng địa phương",
              "14:00: Tham quan, tắm biển tại Bãi Xép",
              "17:00: Trở về khách sạn nghỉ ngơi",
              "18:30: Dùng bữa tối với hải sản địa phương"
            ];
          }
          
          // Lấy các địa điểm cho ngày này
          // Mỗi ngày sẽ được phân bổ một phần của danh sách địa điểm
          const startIdx = i * locationsPerDay;
          const endIdx = Math.min(startIdx + locationsPerDay, locationIds.length);
          const dayLocations = locationIds.slice(startIdx, endIdx);
          
          newSchedule.push({
            day: `Ngày ${i + 1}`,
            date: currentDate.toISOString().split('T')[0],
            title: title,
            activities: defaultActivities,
            locations: dayLocations // Gán địa điểm cho ngày
          });
        }
        
        setFormData(prev => ({
          ...prev,
          duration: `${diffDays} ngày ${diffDays - 1} đêm`,
          schedule: newSchedule
        }));
      }
    }
  }, [formData.departureDate, formData.returnDate, formData.selected_location_ids]); // Thêm selected_location_ids vào dependencies

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleNextStep = () => {
    // Thêm console.log để debug
    console.log(`Moving from step ${currentStep} to ${Math.min(currentStep + 1, 5)}`);
    setCurrentStep(prev => Math.min(prev + 1, 5));
  };

  const handlePrevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  // Sửa hàm handleSubmit
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Kiểm tra nếu chưa đến bước cuối cùng thì chỉ chuyển step
    if (currentStep < 4) {
      console.log(`Form submitted at step ${currentStep}, moving to next step`);
      handleNextStep();
      return;
    }
    
    // Chỉ xử lý submit khi đã đến step cuối cùng (step 4)
    console.log('Processing final submission at step 4');
    setIsSubmitting(true);
    
    try {
      // Get token from both localStorage and sessionStorage
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      
      // Check if token exists
      if (!token) {
        alert('Vui lòng đăng nhập để tạo tour.');
        setIsSubmitting(false);
        return;
      }
      
      // Chuẩn bị dữ liệu để gửi đến API
      const tourData = {
        destination: formData.destination,
        departure_from: formData.departureFrom,
        duration: formData.duration,
        description: formData.description,
        highlights: formData.highlights.filter(h => h.trim() !== ''),
        schedule: formData.schedule.map(day => ({
          day: day.day,
          title: day.title,
          activities: Array.isArray(day.activities) ? day.activities.filter(a => a.trim() !== '') : [],
          locations: Array.isArray(day.locations) ? day.locations : []
        })),
        includes: formData.includes.filter(i => i.trim() !== ''),
        excludes: formData.excludes.filter(e => e.trim() !== ''),
        notes: formData.notes.filter(n => n.trim() !== ''),
        status: 'pending',
        user_id: user?.id,
        // Add these fields that might be required by your backend
        departure_date: formData.departureDate,
        return_date: formData.returnDate,
        location_ids: formData.selected_location_ids // Make sure location IDs are passed
      };
      
      console.log('Tour data being sent:', tourData);
      
      // Tạo một FormData để gửi cả file và data
      const tourFormData = new FormData();
      
      // Thêm các trường dữ liệu vào FormData
      Object.keys(tourData).forEach(key => {
        if (key !== 'image') {
          if (typeof tourData[key] === 'object') {
            tourFormData.append(key, JSON.stringify(tourData[key]));
          } else if (tourData[key] !== undefined && tourData[key] !== null) {
            tourFormData.append(key, tourData[key]);
          }
        }
      });
      
      // Xử lý hình ảnh
      if (formData.image instanceof File) {
        tourFormData.append('image', formData.image);
      } else if (formData.image && typeof formData.image === 'string') {
        // If it's an existing image URL, pass it as string
        tourFormData.append('image', formData.image);
      } else {
        // Default image path
        tourFormData.append('image', '/uploads/tours/default-tour.jpg');
      }
      
      // Log the form data for debugging
      for (let pair of tourFormData.entries()) {
        console.log(`${pair[0]}: ${typeof pair[1] === 'object' ? 'File or Object' : pair[1]}`);
      }
      
      console.log('Sending request with token:', token);
      
      // Gửi dữ liệu đến API với token xác thực
      const response = await axios.post(
        'http://localhost:5000/api/tours', 
        tourFormData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );
      
      console.log('Tour created successfully:', response.data);
      
      // Cập nhật trạng thái thành công và lưu thông tin tour đã tạo
      setCreatedTour({
        tourId: response.data.tourId,
        destination: formData.destination,
        duration: formData.duration,
        status: 'pending'
      });
      setIsSuccess(true);
      
    } catch (error) {
      console.error('Error creating tour:', error);
      // Show more detailed error information
      if (error.response && error.response.data) {
        console.error('Server response:', error.response.data);
        alert(`Lỗi: ${error.response.data.message || error.message}`);
      } else {
        alert(`Có lỗi xảy ra khi tạo tour: ${error.message}`);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return formData.destination && formData.departureDate && formData.returnDate && formData.duration;
      case 2:
        return formData.description && formData.highlights.filter(h => h.trim() !== '').length > 0;
      case 3:
        return formData.schedule.length > 0 && 
               formData.schedule.every(day => 
                 day.title && day.activities.length > 0 && day.activities.every(a => a.trim() !== '')
               );
      case 4:
        return formData.includes.length > 0 && formData.excludes.length > 0 && formData.notes.length > 0;
      default:
        return false;
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <BasicInfo 
          formData={formData} 
          onChange={handleInputChange} 
          setFormData={setFormData}
          updateLocationsInSchedule={updateLocationsInSchedule} 
        />;
      case 2:
        return <ImageDescription formData={formData} setFormData={setFormData} />;
      case 3:
        return <Schedule formData={formData} setFormData={setFormData} />;
      case 4:
        return <AdditionalInfo formData={formData} setFormData={setFormData} />;
      default:
        return null;
    }
  };

  // Nếu tour đã được tạo thành công, hiển thị trang thành công
  if (isSuccess) {
    return <TourCreationSuccess tourData={createdTour} />;
  }

  
  const updateLocationsInSchedule = (locationIds) => {
    if (!formData.schedule || formData.schedule.length === 0) return;
    
    const diffDays = formData.schedule.length;
    const locationsPerDay = Math.ceil(locationIds.length / diffDays);
    
    const updatedSchedule = formData.schedule.map((day, index) => {
      const startIdx = index * locationsPerDay;
      const endIdx = Math.min(startIdx + locationsPerDay, locationIds.length);
      const dayLocations = locationIds.slice(startIdx, endIdx);
      
      return {
        ...day,
        locations: dayLocations
      };
    });
    
    setFormData(prev => ({
      ...prev,
      schedule: updatedSchedule
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="create-tour-form">
      <StepIndicator currentStep={currentStep} setCurrentStep={setCurrentStep} />
      
      {renderStep()}
      
      <FormNavigation
        currentStep={currentStep}
        onNext={handleNextStep}
        onPrev={handlePrevStep}
        isSubmitting={isSubmitting}
        canProceed={canProceed()}
      />
      
      {isSubmitting && <ProcessingOverlay />}
    </form>
  );
};