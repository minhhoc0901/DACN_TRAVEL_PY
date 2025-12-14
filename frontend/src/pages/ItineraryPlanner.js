import React, { useState } from 'react';
import ItineraryForm from '../components/suggestItinerary/ItineraryForm';
import ItineraryResults from '../components/suggestItinerary/ItineraryResults';
import { itineraryService } from '../services/itineraryService';
import '../styles/ItineraryPlanner.css';

const ItineraryPlanner = () => {
    const [results, setResults] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (formData) => {
        setIsLoading(true);
        setError('');
        setResults(null);
        try {
            // Gọi service mới
            const data = await itineraryService.suggestItinerary(formData);
            if (data.success) {
                setResults(data.data);
            } else {
                setError(data.message || 'Có lỗi xảy ra.');
            }
        } catch (err) {
            // Bắt lỗi được throw từ service
            setError(err.message || 'Không thể kết nối đến server.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="itinerary-planner">
            <div className="planner-sidebar">
                <h1>Hành Trình Thông Minh</h1>
                <p>Tự tạo lịch trình du lịch cho riêng bạn chỉ trong vài giây!</p>
                <ItineraryForm onSubmit={handleSubmit} isLoading={isLoading} />
            </div>
            <div className="planner-content">
                {isLoading && <div className="loader">Đang tạo lộ trình...</div>}
                {error && <div className="error-message">{error}</div>}
                {results && <ItineraryResults data={results} />}
            </div>
        </div>
    );
};

export default ItineraryPlanner;