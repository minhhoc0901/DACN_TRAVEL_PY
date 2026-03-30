import React, { useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';
import { getDisplayImageUrl } from '../../utils/imageUtils';
import '../../styles/itineraryCSS/TourSidebar.css';

const TourSidebar = ({ tour }) => {
  // Xác định vị trí trung tâm của bản đồ dựa trên tất cả các địa điểm
  const mapCenter = useMemo(() => {
    if (!tour.locations || tour.locations.length === 0) {
      return [13.0827, 109.3140]; 
    }

    const validLocations = tour.locations.filter(
      loc => loc.latitude && loc.longitude
    );

    if (validLocations.length === 0) return [13.0827, 109.3140];

    const sumLat = validLocations.reduce(
      (sum, loc) => sum + parseFloat(loc.latitude), 0
    );
    const sumLng = validLocations.reduce(
      (sum, loc) => sum + parseFloat(loc.longitude), 0
    );

    return [sumLat / validLocations.length, sumLng / validLocations.length];
  }, [tour.locations]);

  // Tạo polyline nối các điểm
  const polylinePoints = useMemo(() => {
    if (!tour.locations) return [];
    return tour.locations
      .filter(loc => loc.latitude && loc.longitude)
      .map(loc => [parseFloat(loc.latitude), parseFloat(loc.longitude)]);
  }, [tour.locations]);

  // Custom icon function with number
  const customIcon = (index) => {
    return L.divIcon({
      className: 'custom-map-marker',
      html: `<div class="marker-content">${index + 1}</div>`,
      iconSize: [36, 36],
      iconAnchor: [18, 36],
      popupAnchor: [0, -36]
    });
  };

  if (!tour.locations || tour.locations.length === 0) {
    return (
      <div className="sidebar-no-locations">
        <h3><i className="bi bi-map"></i> Bản đồ tour</h3>
        <div className="empty-map-message">
          <i className="bi bi-geo-alt-fill"></i>
          <p>Tour này hiện chưa có thông tin địa điểm cụ thể</p>
        </div>
      </div>
    );
  }

  return (
    <div className="tour-sidebar">
      <h3><i className="bi bi-map"></i> Bản đồ tour</h3>
      
      <div className="map-box">
        <MapContainer 
          center={mapCenter} 
          zoom={10} 
          style={{ height: '400px', width: '100%', borderRadius: '12px' }}
          className="tour-map-container"
        >
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          />
          
          {tour.locations.map((loc, index) => {
            if (!loc.latitude || !loc.longitude) return null;
            return (
              <Marker
                key={index}
                position={[parseFloat(loc.latitude), parseFloat(loc.longitude)]}
                icon={customIcon(index)}
              >
                <Popup className="custom-popup">
                  <div className="popup-content">
                    {loc.image && (
                      <img 
                        src={getDisplayImageUrl(loc.image)} 
                        alt={loc.name}
                        className="popup-image"
                        onError={(e) => { e.target.src = '/placeholder-image.jpg'; }}
                      />
                    )}
                    <div className="popup-info">
                      <h4>{loc.name || `Điểm ${index + 1}`}</h4>
                      {loc.type && <span className="location-type">{loc.type}</span>}
                      {loc.description && <p>{loc.description}</p>}
                    </div>
                  </div>
                </Popup>
              </Marker>
            );
          })}
          
          <Polyline 
            positions={polylinePoints}
            color="#2980B9"
            weight={3}
            opacity={0.7}
            dashArray="5, 10"
          />
        </MapContainer>
      </div>
      
      {/* <div className="location-list">
        <h4 className="location-list-title"><i className="bi bi-geo-fill"></i> Điểm tham quan</h4>
        <ul className="locations-summary">
          {tour.locations.map((location, index) => (
            <li key={index} className="location-item">
              <div className="location-marker">{index + 1}</div>
              <div className="location-details">
                <h5>{location.name}</h5>
                {location.type && <span className="location-type-badge">{location.type}</span>}
              </div>
            </li>
          ))}
        </ul>
      </div> */}
    </div>
  );
};

export default TourSidebar;