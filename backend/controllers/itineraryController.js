const Location = require('../models/Location');
const Tour = require('../models/Tour');
const { calculateDistanceMatrix, solveTspGreedy, getRouteGeometry } = require('../utils/routingUtils');

exports.suggestItinerary = async (req, res) => {
    const { startLocation, duration, preferences, averageVisitTime  } = req.body;

    console.log('[itineraryController] Received request:', { startLocation, duration, preferences, averageVisitTime });

    if (!startLocation || !startLocation.latitude || !startLocation.longitude || !duration || !preferences) {
        return res.status(400).json({ success: false, message: 'Thiếu thông tin điểm xuất phát, thời gian hoặc sở thích.' });
    }

    try {
        // 1. Lọc các địa điểm tiềm năng từ DB
        const potentialLocations = await Location.getLocationsByTypes(preferences, 10);
        console.log('[itineraryController] Found potential locations:', potentialLocations.length);

        if (potentialLocations.length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'Không tìm thấy địa điểm nào phù hợp với sở thích của bạn.' 
            });
        }

        // 2. Chuẩn bị danh sách các điểm để tính toán
        const startLat = parseFloat(startLocation.latitude);
        const startLng = parseFloat(startLocation.longitude);

        // Lọc bỏ các địa điểm trùng với điểm xuất phát (trong bán kính 100m)
        const DUPLICATE_THRESHOLD = 0.001; // Khoảng 100m
        
        const filteredLocations = potentialLocations.filter(loc => {
            const locLat = parseFloat(loc.latitude || loc.coordinates?.latitude);
            const locLng = parseFloat(loc.longitude || loc.coordinates?.longitude);
            
            // Tính khoảng cách đơn giản
            const latDiff = Math.abs(locLat - startLat);
            const lngDiff = Math.abs(locLng - startLng);
            
            const isDuplicate = latDiff < DUPLICATE_THRESHOLD && lngDiff < DUPLICATE_THRESHOLD;
            
            if (isDuplicate) {
                console.log(`[itineraryController] Loại bỏ địa điểm trùng: ${loc.title || loc.name} (id: ${loc.id})`);
            }
            
            return !isDuplicate;
        });

        console.log(`[itineraryController] Sau khi lọc: ${filteredLocations.length} địa điểm (đã loại ${potentialLocations.length - filteredLocations.length} trùng lặp)`);

        if (filteredLocations.length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'Không tìm thấy địa điểm nào khác ngoài điểm xuất phát.' 
            });
        }

        const allPointsForMatrix = [
            { 
                id: 'start', 
                name: 'Điểm xuất phát', 
                latitude: startLat, 
                longitude: startLng 
            },
            ...filteredLocations.map(loc => {
                return {
                    id: loc.id,
                    name: loc.title || loc.name,
                    description: loc.description,
                    latitude: parseFloat(loc.latitude || loc.coordinates?.latitude),
                    longitude: parseFloat(loc.longitude || loc.coordinates?.longitude)
                };
            })
        ];

        console.log('[itineraryController] All points for matrix:', allPointsForMatrix.length);

        // 3. Gọi API để lấy ma trận khoảng cách
        const matrix = await calculateDistanceMatrix(allPointsForMatrix);

        // 4. Giải bài toán TSP để tìm lộ trình tối ưu
        const maxDurationSeconds = duration * 3600;
        // Chuyển đổi thời gian tham quan từ giờ sang giây, nếu người dùng gửi theo giờ
        const visitTimeInSeconds = averageVisitTime ? averageVisitTime * 3600 : 3600; // Mặc định 1 giờ

        const routeResult = solveTspGreedy(matrix, allPointsForMatrix, maxDurationSeconds, visitTimeInSeconds);
        
        console.log('[itineraryController] TSP result - route length:', routeResult.route?.length);

        if (!routeResult.route || routeResult.route.length <= 1) {
            return res.status(404).json({ 
                success: false, 
                message: 'Không thể tạo lộ trình với thời gian và các địa điểm đã cho. Vui lòng tăng thời gian hoặc thay đổi sở thích.' 
            });
        }

        // 5. Lấy thông tin đường đi chi tiết cho từng chặng
        const enrichedRoute = [];
        for (let i = 0; i < routeResult.route.length; i++) {
            const point = routeResult.route[i];
            
            if (i === 0) {
                // Điểm xuất phát
                enrichedRoute.push({
                    id: point.id,
                    name: point.name,
                    description: point.description || null,
                    latitude: point.latitude,
                    longitude: point.longitude,
                    travelInfo: null,
                    routeGeometry: null
                });
            } else {
                // Các điểm tiếp theo
                const previousPoint = routeResult.route[i - 1];
                const previousIndex = allPointsForMatrix.findIndex(p => p.id === previousPoint.id);
                const currentIndex = allPointsForMatrix.findIndex(p => p.id === point.id);

                // Lấy thông tin di chuyển từ ma trận
                const travelDuration = matrix.rows[previousIndex].elements[currentIndex].duration.value;
                const travelDistance = matrix.rows[previousIndex].elements[currentIndex].distance.value;

                // Lấy đường đi chi tiết
                let geometry = [];
                try {
                    geometry = await getRouteGeometry(
                        { latitude: previousPoint.latitude, longitude: previousPoint.longitude },
                        { latitude: point.latitude, longitude: point.longitude }
                    );
                } catch (error) {
                    console.error('[itineraryController] Error getting route geometry:', error);
                }

                enrichedRoute.push({
                    id: point.id,
                    name: point.name,
                    description: point.description || null,
                    latitude: point.latitude,
                    longitude: point.longitude,
                    travelInfo: {
                        duration: travelDuration,
                        distance: travelDistance
                    },
                    routeGeometry: geometry
                });
            }
        }

        console.log('[itineraryController] Enriched route created with', enrichedRoute.length, 'points');

        // 6. Gợi ý các tour liên quan
        const locationIdsInRoute = enrichedRoute
            .map(loc => loc.id)
            .filter(id => id && id !== 'start');
        
        const suggestedTours = await Tour.getToursByLocationIds(locationIdsInRoute, 5); 

        // 7. Trả về kết quả
        const responseData = {
            success: true,
            data: {
                suggestedRoute: enrichedRoute,
                estimatedTotalDuration: routeResult.totalDuration,
                estimatedTotalDistance: routeResult.totalDistance,
                suggestedTours: suggestedTours || []
            }
        };

        res.status(200).json(responseData);

    } catch (error) {
        console.error('[itineraryController] Error:', error);
        res.status(500).json({ 
            success: false, 
            message: error.message || 'Lỗi hệ thống khi gợi ý lộ trình.' 
        });
    }
};