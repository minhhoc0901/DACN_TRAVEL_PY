import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ItineraryForm } from '../components/Itinerary/CreateItinerary/ItineraryForm';
import '../styles/itineraryCSS/CreateItinerary.css';

const CreateItinerary = () => {
  const navigate = useNavigate();

  const handleSubmit = async (formData) => {
    try {
      const existingTours = JSON.parse(localStorage.getItem('customTours')) || [];
      const newId = existingTours.length > 0 
        ? Math.max(...existingTours.map(tour => tour.id)) + 1 
        : 1;
      
      const newTour = {
        id: newId,
        ...formData
      };
      
      const updatedTours = [...existingTours, newTour];
      localStorage.setItem('customTours', JSON.stringify(updatedTours));
      
      navigate(`/Itinerary/${newId}`);
    } catch (error) {
      console.error('Lỗi khi lưu lịch trình:', error);
      throw error;
    }
  };

  return (
    <div className="create-itinerary-container">
      <h1>Tạo lịch trình mới</h1>
      <ItineraryForm onSubmit={handleSubmit} />
    </div>
  );
};

export default CreateItinerary;