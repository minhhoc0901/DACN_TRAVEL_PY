import React, { useEffect } from 'react';
import LocationForm from './LocationForm';

const EditLocationModal = ({ show, onClose, formData, setFormData, selectedLocation, onSubmit }) => {
  useEffect(() => {
    if (selectedLocation) {
      // Create a complete form data object from the selected location
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
        
        // Handle arrays with proper fallback to empty arrays
        bestTimes: Array.isArray(selectedLocation.bestTimes) && selectedLocation.bestTimes.length > 0 
          ? selectedLocation.bestTimes 
          : [''],
        
        // Handle travel methods object with proper structure
        travelMethods: {
          fromTuyHoa: Array.isArray(selectedLocation.travelMethods?.fromTuyHoa) && 
                      selectedLocation.travelMethods.fromTuyHoa.length > 0
            ? selectedLocation.travelMethods.fromTuyHoa 
            : [''],
          fromElsewhere: Array.isArray(selectedLocation.travelMethods?.fromElsewhere) && 
                        selectedLocation.travelMethods.fromElsewhere.length > 0
            ? selectedLocation.travelMethods.fromElsewhere 
            : ['']
        },
        
        // Handle experiences array with proper image URL retention
        experiences: Array.isArray(selectedLocation.experiences) && selectedLocation.experiences.length > 0
          ? selectedLocation.experiences.map(exp => ({
              text: exp.text || '',
              image: null, // New image file will be set here if user uploads one
              imageUrl: exp.image // Store the existing image URL
            }))
          : [{ text: '', image: null }],
        
        // Handle cuisines array with proper image URL retention
        cuisines: Array.isArray(selectedLocation.cuisine) && selectedLocation.cuisine.length > 0
          ? selectedLocation.cuisine.map(cuisine => ({
              text: cuisine.text || '',
              image: null, // New image file will be set here if user uploads one
              imageUrl: cuisine.image // Store the existing image URL
            }))
          : [{ text: '', image: null }],
        
        // Tips array with fallback
        tips: Array.isArray(selectedLocation.tips) && selectedLocation.tips.length > 0
          ? selectedLocation.tips 
          : [''],
        
        // Nearby locations array with fallback
        nearby: Array.isArray(selectedLocation.nearby) && selectedLocation.nearby.length > 0
          ? selectedLocation.nearby.map(location => location.id || location) 
          : [],
        
        // Image placeholders - will be filled with File objects if user uploads new images
        images: {
          introduction: null,
          architecture: null
        },
        
        // Store original image URLs for reference
        originalImages: {
          introduction: selectedLocation.introduction?.image || null,
          architecture: selectedLocation.whyVisit?.architecture?.image || null
        }
      };
      
      // Set the form data
      setFormData(formDataObj);
    }
  }, [selectedLocation, setFormData]);

  if (!show) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2 className="modal-title">Chỉnh Sửa Địa Điểm</h2>
        <LocationForm
          formData={formData}
          setFormData={setFormData}
          onSubmit={onSubmit}
          onCancel={onClose}
          selectedLocation={selectedLocation}
        />
      </div>
    </div>
  );
};

export default EditLocationModal;