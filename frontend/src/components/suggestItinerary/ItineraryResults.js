// import React from 'react';
// import { Link } from 'react-router-dom';
// import MapDisplay from './MapDisplay';
// import TourCard from '../Tour/TourCard';

// const formatDuration = (seconds) => {
//     const hours = Math.floor(seconds / 3600);
//     const minutes = Math.floor((seconds % 3600) / 60);
//     return `${hours > 0 ? `${hours} giờ ` : ''}${minutes} phút`;
// };

// const formatDistance = (meters) => `${(meters / 1000).toFixed(2)} km`;

// const ItineraryResults = ({ data }) => {
//     console.log('[ItineraryResults] Received data:', data);
    
//     const { suggestedRoute, estimatedTotalDuration, estimatedTotalDistance, suggestedTours } = data;

//     if (!suggestedRoute || suggestedRoute.length === 0) {
//         return <div className="v2-error-message">Không có lộ trình để hiển thị.</div>;
//     }

//     return (
//         <div className="v2-results-container">
//             <h2 className="v2-results-title">Lộ trình gợi ý của bạn</h2>
//             <div className="v2-results-summary">
//                 <span>Tổng thời gian: <strong>{formatDuration(estimatedTotalDuration)}</strong></span>
//                 <span>Tổng quãng đường: <strong>{formatDistance(estimatedTotalDistance)}</strong></span>
//             </div>
            
//             <div className="v2-map-container">
//                 <MapDisplay route={suggestedRoute} />
//             </div>

//             <h3 className="v2-section-title">Các điểm dừng trong lộ trình:</h3>
//             <ul className="v2-route-steps">
//                 {suggestedRoute.map((point, index) => (
//                     <li key={`${point.id}-${index}`} className="v2-route-step">
//                         <div className="v2-step-header">
//                             <span className="v2-step-number">{index + 1}</span>
//                             {point.id === 'start' ? (
//                                 <strong className="v2-step-name">{point.name || 'Điểm xuất phát'}</strong>
//                             ) : (
//                                 <Link to={`/locations/${point.id}`} className="v2-step-link">
//                                     <strong className="v2-step-name">{point.name || point.title || `Địa điểm ${index + 1}`}</strong>
//                                 </Link>
//                             )}
//                         </div>
//                         {point.description && (
//                             <p className="v2-step-description">{point.description}</p>
//                         )}
//                         {point.travelInfo && (
//                             <div className="v2-travel-info">
//                                 <span>→ Di chuyển: {formatDuration(point.travelInfo.duration)}</span>
//                                 <span>({formatDistance(point.travelInfo.distance)})</span>
//                             </div>
//                         )}
//                     </li>
//                 ))}
//             </ul>

//             {suggestedTours && suggestedTours.length > 0 && (
//                 <div className="v2-suggested-tours-section">
//                     <h3 className="v2-section-title">Các tour liên quan:</h3>
//                     <div className="v2-suggested-tours-grid">
//                         {suggestedTours.map(tour => (
//                             <TourCard key={tour.id} tour={tour} />
//                         ))}
//                     </div>
//                 </div>
//             )}
//         </div>
//     );
// };

// export default ItineraryResults;


import React from 'react';
import { Link } from 'react-router-dom';
import MapDisplay from './MapDisplay';
import TourCard from '../Tour/TourCard';

const formatDuration = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours > 0 ? `${hours} giờ ` : ''}${minutes} phút`;
};

const formatDistance = (meters) => `${(meters / 1000).toFixed(2)} km`;

const ItineraryResults = ({ data }) => {
    // ===== LOG CHI TIẾT DATA NHẬN ĐƯỢC =====
    console.log('========================================');
    console.log('[ItineraryResults] RAW DATA RECEIVED:');
    console.log('========================================');
    console.log('Full data object:', data);
    console.log('Data keys:', Object.keys(data || {}));
    console.log('Data type:', typeof data);
    console.log('Is data null/undefined?:', data === null || data === undefined);
    console.log('----------------------------------------');
    
    const { suggestedRoute, estimatedTotalDuration, estimatedTotalDistance, suggestedTours, suggestedTourIds } = data;

    // ===== LOG CHI TIẾT SUGGESTED TOURS =====
    console.log('[ItineraryResults] SUGGESTED TOURS INFO:');
    console.log('----------------------------------------');
    console.log('suggestedTours exists?:', suggestedTours !== undefined);
    console.log('suggestedTours value:', suggestedTours);
    console.log('suggestedTours type:', typeof suggestedTours);
    console.log('Is suggestedTours array?:', Array.isArray(suggestedTours));
    console.log('suggestedTours length:', suggestedTours?.length);
    
    if (suggestedTours && Array.isArray(suggestedTours)) {
        console.log('suggestedTours items:');
        suggestedTours.forEach((tour, index) => {
            console.log(`  [${index}]:`, {
                id: tour?.id,
                title: tour?.title,
                price: tour?.price,
                image_url: tour?.image_url,
                keys: Object.keys(tour || {})
            });
        });
    }
    
    // ===== LOG CHI TIẾT SUGGESTED TOUR IDs =====
    console.log('----------------------------------------');
    console.log('[ItineraryResults] SUGGESTED TOUR IDS INFO:');
    console.log('suggestedTourIds exists?:', suggestedTourIds !== undefined);
    console.log('suggestedTourIds value:', suggestedTourIds);
    console.log('suggestedTourIds type:', typeof suggestedTourIds);
    console.log('Is suggestedTourIds array?:', Array.isArray(suggestedTourIds));
    console.log('suggestedTourIds length:', suggestedTourIds?.length);
    
    if (suggestedTourIds && Array.isArray(suggestedTourIds)) {
        console.log('suggestedTourIds items:', suggestedTourIds);
    }
    
    // ===== LOG ROUTE INFO =====
    console.log('----------------------------------------');
    console.log('[ItineraryResults] ROUTE INFO:');
    console.log('suggestedRoute length:', suggestedRoute?.length);
    console.log('estimatedTotalDuration:', estimatedTotalDuration);
    console.log('estimatedTotalDistance:', estimatedTotalDistance);
    console.log('========================================\n');

    if (!suggestedRoute || suggestedRoute.length === 0) {
        return <div className="v2-error-message">Không có lộ trình để hiển thị.</div>;
    }

    return (
        <div className="v2-results-container">
            <h2 className="v2-results-title">Lộ trình gợi ý của bạn</h2>
            <div className="v2-results-summary">
                <span>Tổng thời gian: <strong>{formatDuration(estimatedTotalDuration)}</strong></span>
                <span>Tổng quãng đường: <strong>{formatDistance(estimatedTotalDistance)}</strong></span>
            </div>
            
            <div className="v2-map-container">
                <MapDisplay route={suggestedRoute} />
            </div>

            <h3 className="v2-section-title">Các điểm dừng trong lộ trình:</h3>
            <ul className="v2-route-steps">
                {suggestedRoute.map((point, index) => (
                    <li key={`${point.id}-${index}`} className="v2-route-step">
                        <div className="v2-step-header">
                            <span className="v2-step-number">{index + 1}</span>
                            {point.id === 'start' ? (
                                <strong className="v2-step-name">{point.name || 'Điểm xuất phát'}</strong>
                            ) : (
                                <Link to={`/locations/${point.id}`} className="v2-step-link">
                                    <strong className="v2-step-name">{point.name || point.title || `Địa điểm ${index + 1}`}</strong>
                                </Link>
                            )}
                        </div>
                        {point.description && (
                            <p className="v2-step-description">{point.description}</p>
                        )}
                        {point.travelInfo && (
                            <div className="v2-travel-info">
                                <span>→ Di chuyển: {formatDuration(point.travelInfo.duration)}</span>
                                <span>({formatDistance(point.travelInfo.distance)})</span>
                            </div>
                        )}
                    </li>
                ))}
            </ul>

            {/* DEBUG: Hiển thị cả suggestedTours và suggestedTourIds */}
            {console.log('[ItineraryResults] Rendering tours section...')}
            {console.log('[ItineraryResults] Condition check - suggestedTours:', suggestedTours)}
            {console.log('[ItineraryResults] Condition check - length:', suggestedTours?.length)}
            
            {suggestedTours && suggestedTours.length > 0 && (
                <div className="v2-suggested-tours-section">
                    <h3 className="v2-section-title">
                        Các tour liên quan: ({suggestedTours.length})
                    </h3>
                    <div className="v2-suggested-tours-grid">
                        {suggestedTours.map((tour, index) => {
                            console.log(`[ItineraryResults] Rendering TourCard #${index}:`, tour);
                            return <TourCard key={tour.id || index} tour={tour} />;
                        })}
                    </div>
                </div>
            )}
            
            {/* Hiển thị debug info nếu không có tours */}
            {(!suggestedTours || suggestedTours.length === 0) && (
                <div className="v2-no-tours-message">
                    <p>⚠️ DEBUG: Không có tour được trả về từ API</p>
                    <p>suggestedTours: {JSON.stringify(suggestedTours)}</p>
                    <p>suggestedTourIds: {JSON.stringify(suggestedTourIds)}</p>
                </div>
            )}
        </div>
    );
};

export default ItineraryResults;