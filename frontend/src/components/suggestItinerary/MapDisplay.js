// import React from 'react';
// import { MapContainer, TileLayer, Marker, Polyline, Tooltip } from 'react-leaflet';
// import { useNavigate } from 'react-router-dom';
// import 'leaflet/dist/leaflet.css';
// import L from 'leaflet';

// // Fix lỗi icon marker mặc định của Leaflet
// delete L.Icon.Default.prototype._getIconUrl;
// L.Icon.Default.mergeOptions({
//   iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
//   iconUrl: require('leaflet/dist/images/marker-icon.png'),
//   shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
// });

// // Hàm tạo icon được đánh số
// const createNumberedIcon = (number) => {
//     return L.divIcon({
//         html: `<div class="numbered-marker"><span>${number}</span></div>`,
//         className: 'custom-div-icon',
//         iconSize: [30, 42],
//         iconAnchor: [15, 42],
//     });
// };

// const MapDisplay = ({ route }) => {
//     const navigate = useNavigate();
//     const positions = route.map(p => [parseFloat(p.latitude), parseFloat(p.longitude)]);
//     const center = positions[0] || [13.08, 109.3];

//     const handleMarkerClick = (point) => {
//         if (point.id !== 'start') {
//             navigate(`/locations/${point.id}`);
//         }
//     };

//     return (
//         <MapContainer center={center} zoom={11} style={{ height: '450px', width: '100%' }}>
//             <TileLayer
//                 url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
//                 attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
//             />
//             {route.map((point, index) => (
//                 <Marker
//                     key={point.id}
//                     position={[parseFloat(point.latitude), parseFloat(point.longitude)]}
//                     icon={createNumberedIcon(index + 1)}
//                     eventHandlers={{
//                         click: () => handleMarkerClick(point),
//                     }}
//                 >
//                     <Tooltip>
//                         <strong>{point.name}</strong>
//                     </Tooltip>
//                 </Marker>
//             ))}
//             <Polyline pathOptions={{ color: 'blue' }} positions={positions} />
//         </MapContainer>
//     );
// };

// export default MapDisplay;
import React from 'react';
import { MapContainer, TileLayer, Marker, Polyline, Tooltip } from 'react-leaflet';
import { useNavigate } from 'react-router-dom';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix lỗi icon marker mặc định của Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

// Hàm tạo icon được đánh số
const createNumberedIcon = (number) => {
    return L.divIcon({
        html: `<div class="numbered-marker"><span>${number}</span></div>`,
        className: 'custom-div-icon',
        iconSize: [30, 42],
        iconAnchor: [15, 42],
    });
};

const MapDisplay = ({ route }) => {
    const navigate = useNavigate();
    
    // Tạo mảng tọa độ cho các marker
    const markerPositions = route.map(p => [parseFloat(p.latitude), parseFloat(p.longitude)]);
    const center = markerPositions[0] || [13.08, 109.3];

    // Tạo mảng tất cả các đoạn đường chi tiết để vẽ
    const allRouteSegments = [];
    route.forEach((point, index) => {
        if (index > 0 && point.routeGeometry && point.routeGeometry.length > 0) {
            // Convert từ [lng, lat] sang [lat, lng] cho Leaflet
            const segment = point.routeGeometry.map(coord => [coord[1], coord[0]]);
            allRouteSegments.push(segment);
        }
    });

    const handleMarkerClick = (point) => {
        if (point.id !== 'start') {
            navigate(`/locations/${point.id}`);
        }
    };

    return (
        <MapContainer center={center} zoom={11} style={{ height: '450px', width: '100%' }}>
            <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />
            
            {/* Vẽ các marker */}
            {route.map((point, index) => (
                <Marker
                    key={point.id}
                    position={[parseFloat(point.latitude), parseFloat(point.longitude)]}
                    icon={createNumberedIcon(index + 1)}
                    eventHandlers={{
                        click: () => handleMarkerClick(point),
                    }}
                >
                    <Tooltip>
                        <strong>{point.name}</strong>
                    </Tooltip>
                </Marker>
            ))}
            
            {/* Vẽ các đoạn đường chi tiết */}
            {allRouteSegments.map((segment, index) => (
                <Polyline 
                    key={`segment-${index}`}
                    pathOptions={{ color: 'blue', weight: 4, opacity: 0.7 }} 
                    positions={segment} 
                />
            ))}
        </MapContainer>
    );
};

export default MapDisplay;