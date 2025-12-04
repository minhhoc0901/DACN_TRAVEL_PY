
import React, { useEffect, useState } from 'react';
import LocationForm from './LocationForm';

const EditLocationModal = ({ show, onClose, selectedLocation, onSubmit, availableLocations, availableHotels }) => {
  const [formData, setFormData] = useState(null); 

  useEffect(() => {
    if (selectedLocation) {
      // Chuẩn bị dữ liệu form khi location được chọn thay đổi
      const formDataObj = {
        name: selectedLocation.title || '',
        type: selectedLocation.type || '',
        description: selectedLocation.description || '',
        latitude: selectedLocation.coordinates?.latitude || '',
        longitude: selectedLocation.coordinates?.longitude || '',
        subtitle: selectedLocation.subtitle || '',
        introduction: selectedLocation.introduction?.text || '',
        why_visit_architecture_title: selectedLocation.whyVisit?.architecture?.title || '',
        why_visit_architecture_text: selectedLocation.whyVisit?.architecture?.text || '',
        why_visit_culture: selectedLocation.whyVisit?.culture || '',
        ticket_price: selectedLocation.travelInfo?.ticketPrice || '',
        tip: selectedLocation.travelInfo?.tip || '',
        bestTimes: selectedLocation.bestTimes?.length ? selectedLocation.bestTimes : [''],
        travelMethods: selectedLocation.travelMethods || { fromTuyHoa: [''], fromElsewhere: [''] },
         experiences: selectedLocation.experiences?.length 
            ? selectedLocation.experiences.map(e => ({ text: e.text, image: null, imageUrl: e.image })) 
            : [{ text: '', image: null, imageUrl: null }],
        cuisines: selectedLocation.cuisine?.length 
            ? selectedLocation.cuisine.map(c => ({ text: c.text, image: null, imageUrl: c.image })) 
            : [{ text: '', image: null, imageUrl: null }],
        tips: selectedLocation.tips?.length ? selectedLocation.tips : [''],
        nearby: selectedLocation.nearby?.length ? selectedLocation.nearby.map(loc => loc.id) : [],
        hotel_ids: selectedLocation.nearbyHotels?.length ? selectedLocation.nearbyHotels.map(hotel => hotel.id) : [],
        images: { introduction: null, architecture: null }
      };
      setFormData(formDataObj);
    } else {
      setFormData(null); // Reset khi không có location nào được chọn
    }
  }, [selectedLocation]);
  
  if (!show) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content large" onClick={(e) => e.stopPropagation()}>
        <h2 className="modal-title">Chỉnh Sửa Địa Điểm</h2>
        {/* 2. Chỉ render LocationForm khi formData đã có dữ liệu */}
        {formData ? (
          <LocationForm
            formData={formData}
            setFormData={setFormData}
            // onSubmit={(e) => onSubmit(e, formData)}
            onSubmit={onSubmit}
            onCancel={onClose}
            selectedLocation={selectedLocation}
            availableLocations={availableLocations}
            availableHotels={availableHotels}
          />
        ) : (
          <div>Đang tải dữ liệu...</div> // Hoặc một spinner loading
        )}
      </div>
    </div>
  );
};

export default EditLocationModal;