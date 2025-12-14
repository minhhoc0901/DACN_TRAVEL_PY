import React, { useState, useEffect } from 'react';
import { locationService } from '../../services/locationService';

const PREFERENCE_OPTIONS = ["di tích", "biển", "văn hóa", "núi", "thiên nhiên"];

const ItineraryForm = ({ onSubmit, isLoading }) => {
    const [startLocation, setStartLocation] = useState({ latitude: '', longitude: '' });
    const [duration, setDuration] = useState(8);
    const [averageVisitTime, setAverageVisitTime] = useState(1);
    const [preferences, setPreferences] = useState(['di tích']);
    const [allLocations, setAllLocations] = useState([]);

    useEffect(() => {
        const fetchLocations = async () => {
            const locations = await locationService.getAllLocations();
            if (locations && locations.length > 0) {
                setAllLocations(locations);
            }
        };
        fetchLocations();
    }, []);

    const updateStartLocation = (lat, lng) => {
        setStartLocation({
            latitude: lat || '',
            longitude: lng || ''
        });
    };

    const handleGetCurrentLocation = () => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    updateStartLocation(position.coords.latitude, position.coords.longitude);
                    alert('Lấy vị trí thành công!');
                },
                () => alert('Không thể lấy vị trí của bạn. Vui lòng cấp quyền truy cập.')
            );
        } else {
            alert('Trình duyệt của bạn không hỗ trợ lấy vị trí.');
        }
    };

    const handleLocationSelect = (e) => {
        const locationId = e.target.value;
        console.log("Selected location ID:", locationId);
        const selected = allLocations.find(loc => loc.id.toString() === locationId);
        console.log("Found location:", selected);
        
        if (selected) {
            // Sửa lỗi: Xử lý nhiều cấu trúc dữ liệu có thể có
            let lat, lng;
            
            // Trường hợp 1: Tọa độ nằm trong object coordinates
            if (selected.coordinates) {
                lat = selected.coordinates.latitude;
                lng = selected.coordinates.longitude;
            }
            // Trường hợp 2: Tọa độ nằm trực tiếp trong object
            else if (selected.latitude && selected.longitude) {
                lat = selected.latitude;
                lng = selected.longitude;
            }
            
            console.log("Extracted coordinates:", { lat, lng });
            
            if (lat && lng) {
                updateStartLocation(lat, lng);
            } else {
                console.error("Could not extract coordinates from:", selected);
                alert('Địa điểm này không có tọa độ hợp lệ. Vui lòng chọn địa điểm khác.');
            }
        }
    };

    const handlePreferenceChange = (pref) => {
        setPreferences(prev =>
            prev.includes(pref) ? prev.filter(p => p !== pref) : [...prev, pref]
        );
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!startLocation.latitude || !startLocation.longitude) {
            alert('Vui lòng chọn điểm xuất phát.');
            return;
        }
        onSubmit({
            startLocation: {
                latitude: parseFloat(startLocation.latitude),
                longitude: parseFloat(startLocation.longitude),
            },
            duration,
            averageVisitTime,
            preferences,
        });
    };

    return (
        <form onSubmit={handleSubmit} className="itinerary-form">
            <div className="form-group">
                <label>Điểm xuất phát</label>
                <div className="location-options">
                    <button type="button" onClick={handleGetCurrentLocation}>
                        Lấy vị trí hiện tại
                    </button>
                    <select 
                        onChange={handleLocationSelect} 
                        defaultValue=""
                        aria-label="Chọn điểm xuất phát từ danh sách"
                    >
                        <option value="" disabled>Hoặc chọn từ danh sách</option>
                        {allLocations.map(loc => (
                            <option key={loc.id} value={loc.id}>{loc.title}</option>
                        ))}
                    </select>
                </div>
                {startLocation.latitude && (
                    <p className="location-coords">
                        Tọa độ: {parseFloat(startLocation.latitude).toFixed(4)}, {parseFloat(startLocation.longitude).toFixed(4)}
                    </p>
                )}
            </div>
            <div className="form-group">
                <label>Thời gian (giờ): {duration}</label>
                <input
                    type="range"
                    min="1"
                    max="24"
                    value={duration}
                    onChange={(e) => setDuration(Number(e.target.value))}
                />
            </div>
            <div className="form-group">
                <label>Thời gian tham quan mỗi điểm (giờ): {averageVisitTime}</label>
                <input
                    type="range"
                    min="0.5" // 30 phút
                    max="5"
                    step="0.5"
                    value={averageVisitTime}
                    onChange={(e) => setAverageVisitTime(Number(e.target.value))}
                />
            </div>

            <div className="form-group">
                <label>Thể loại</label>
                <div className="preferences-tags">
                    {PREFERENCE_OPTIONS.map(pref => (
                        <span
                            key={pref}
                            className={`tag ${preferences.includes(pref) ? 'active' : ''}`}
                            onClick={() => handlePreferenceChange(pref)}
                        >
                            {pref}
                        </span>
                    ))}
                </div>
            </div>
            <button type="submit" disabled={isLoading}>
                {isLoading ? 'Đang xử lý...' : 'Tạo Lộ Trình'}
            </button>
        </form>
    );
};

export default ItineraryForm;