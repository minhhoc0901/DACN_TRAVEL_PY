const axios = require('axios');

/**
 * Gọi OSRM API để tính toán ma trận thời gian và khoảng cách di chuyển giữa các điểm.
 */

async function calculateDistanceMatrix(points) {
    console.log(`\n[MATRIX_LOG] Bắt đầu tính toán ma trận khoảng cách cho ${points.length} điểm.`);
    if (!points || points.length === 0) {
        console.log('[MATRIX_LOG] Không có điểm nào để tính toán. Trả về ma trận rỗng.');
        return { rows: [] };
    }
    const coordinates = points.map(p => `${p.longitude},${p.latitude}`).join(';');
    const url = `http://router.project-osrm.org/table/v1/driving/${coordinates}?annotations=duration,distance`;
    console.log(`[MATRIX_LOG] Gọi đến OSRM API URL: ${url}`);

    try {
        const response = await axios.get(url);
        const { durations, distances, code } = response.data;

        if (code !== 'Ok' || !durations || !distances) {
            throw new Error(`Phản hồi từ OSRM API không hợp lệ: ${code}`);
        }
        
        console.log('[MATRIX_LOG] Nhận phản hồi thành công từ OSRM API.');

        const matrix = {
            rows: durations.map((row, i) => ({
                elements: row.map((duration, j) => ({
                    status: 'OK',
                    duration: { value: duration },
                    distance: { value: distances[i][j] }
                }))
            }))
        };
        
        console.log('[MATRIX_LOG] Đã tạo ma trận thành công.');
        return matrix;

    } catch (error) {
        console.error("OSRM API Error:", error.message);
        throw new Error("Không thể tính toán khoảng cách giữa các địa điểm bằng OSRM.");
    }
}

/**
 * Giải bài toán người du lịch (TSP) bằng thuật toán tham lam (Nearest Neighbor).
 * bằng cách sử dụng Map để tra cứu và hỗ trợ thời gian tham quan tùy chỉnh.
 *
 * @param {object} matrix - Ma trận khoảng cách và thời gian từ OSRM.
 * @param {Array<object>} locations - Mảng các đối tượng địa điểm. Địa điểm đầu tiên là điểm xuất phát.
 * @param {number} maxDurationSeconds - Tổng thời gian tối đa cho phép của chuyến đi, tính bằng giây.
 * @param {number} averageVisitTime - Thời gian tham quan trung bình tại mỗi địa điểm, tính bằng giây.
 * @returns {{route: Array, totalDuration: number, totalDistance: number}} Lộ trình đã tính toán, tổng thời gian và tổng khoảng cách.
 */

// Khai báo hàm với các tham số đầu vào
function solveTspGreedy(matrix, locations, maxDurationSeconds, averageVisitTime = 3600) {
    // Lấy tổng số điểm cần xử lý
    const n = locations.length;
    // Ghi log bắt đầu
    console.log(`\n[ROUTING_LOG] Bắt đầu giải TSP với ${n - 1} địa điểm, thời gian tối đa: ${maxDurationSeconds} giây.`);
    console.log(`[ROUTING_LOG] Thời gian tham quan trung bình mỗi điểm: ${averageVisitTime} giây.`);

    // Nếu không có điểm nào, trả về kết quả rỗng
    if (n === 0) {
        return { route: [], totalDuration: 0, totalDistance: 0 };
    }

    // Tối ưu hóa: Tạo một Map để tra cứu index của một địa điểm dựa vào ID của nó.
    // Việc này giúp tìm index nhanh hơn nhiều (O(1)) so với dùng `findIndex` trong vòng lặp (O(n)).
    const locationIndexMap = new Map(locations.map((loc, i) => [loc.id.toString(), i]));

    // Tạo một Set chứa ID của tất cả các điểm chưa được tham quan.
    // Set được sử dụng vì việc thêm/xóa phần tử rất nhanh (O(1)).
    const unvisited = new Set(locations.map(loc => loc.id.toString()));
    
    // Khởi tạo các biến cho thuật toán
    let currentPoint = locations[0]; // Điểm hiện tại, bắt đầu từ điểm xuất phát
    const route = [currentPoint]; // Mảng chứa lộ trình cuối cùng, thêm điểm xuất phát vào đầu tiên
    unvisited.delete(currentPoint.id.toString()); // Xóa điểm xuất phát khỏi danh sách "chưa đi"

    let totalDuration = 0; // Tổng thời gian đã sử dụng (di chuyển + tham quan)
    let totalDistance = 0; // Tổng khoảng cách đã đi

    console.log(`[ROUTING_LOG] Điểm bắt đầu: ${currentPoint.name} (id: ${currentPoint.id})`);

    // Vòng lặp chính: chạy cho đến khi không còn điểm nào chưa đi
    while (unvisited.size > 0) {
        console.log(`\n[ROUTING_LOG] ----- Vòng lặp mới -----`);
        console.log(`[ROUTING_LOG] Điểm hiện tại: ${currentPoint.name} (id: ${currentPoint.id}). Thời gian đã dùng: ${totalDuration.toFixed(2)} giây.`);
        console.log(`[ROUTING_LOG] Các điểm chưa đi:`, Array.from(unvisited));

        // Khởi tạo các biến để tìm điểm gần nhất trong vòng lặp này
        let nearestPoint = null; // Lưu đối tượng địa điểm gần nhất
        let minDuration = Infinity; // Lưu thời gian di chuyển ngắn nhất, bắt đầu bằng vô cực
        let moveDuration = 0; // Thời gian di chuyển đến điểm gần nhất
        let moveDistance = 0; // Khoảng cách di chuyển đến điểm gần nhất

        // Lấy index của điểm hiện tại từ Map đã tạo
        const currentIndex = locationIndexMap.get(currentPoint.id.toString());

        // Lặp qua TẤT CẢ các điểm còn lại trong danh sách "chưa đi"
        for (const locationId of unvisited) {
            // Lấy index của điểm "chưa đi" tiếp theo
            const nextIndex = locationIndexMap.get(locationId);
            // Tra cứu thông tin di chuyển từ `currentIndex` đến `nextIndex` trong ma trận.
            // Đây là bước quan trọng, tận dụng ma trận đã tính toán trước đó.
            const leg = matrix.rows[currentIndex].elements[nextIndex];

            // Nếu có thông tin di chuyển và thời gian di chuyển nhỏ hơn `minDuration` hiện tại
            if (leg && leg.status === 'OK' && leg.duration.value < minDuration) {
                // Cập nhật điểm gần nhất mới
                minDuration = leg.duration.value;
                nearestPoint = locations[nextIndex];
                moveDuration = leg.duration.value;
                moveDistance = leg.distance.value;
            }
        }

        // Nếu sau vòng lặp không tìm thấy điểm nào (ví dụ: do lỗi kết nối OSRM), dừng thuật toán
        if (!nearestPoint) {
            console.log('[ROUTING_LOG] Không tìm thấy điểm đến gần nhất có thể đi được. Dừng thuật toán.');
            break;
        }
        
        console.log(`[ROUTING_LOG] Tìm thấy điểm gần nhất: ${nearestPoint.name} (id: ${nearestPoint.id}). Thời gian di chuyển: ${moveDuration.toFixed(2)} giây.`);

        // Lấy thời gian tham quan từ tham số người dùng truyền vào
        const visitDuration = averageVisitTime;
        console.log(`[ROUTING_LOG] Thời gian tham quan dự kiến: ${visitDuration} giây.`);

        // Tính toán tổng thời gian dự kiến NẾU đi đến điểm gần nhất này
        const projectedTotalDuration = totalDuration + moveDuration + visitDuration;
        console.log(`[ROUTING_LOG] Kiểm tra thời gian: ${totalDuration.toFixed(2)} (hiện tại) + ${moveDuration.toFixed(2)} (di chuyển) + ${visitDuration} (tham quan) = ${projectedTotalDuration.toFixed(2)} giây.`);

        // **ĐIỀU KIỆN DỪNG QUAN TRỌNG NHẤT**
        // Nếu tổng thời gian dự kiến vượt quá giới hạn người dùng đặt ra, thì không đi nữa và thoát khỏi vòng lặp.
        if (projectedTotalDuration > maxDurationSeconds) {
            console.log(`[ROUTING_LOG] Dừng lại: Tổng thời gian dự kiến (${projectedTotalDuration.toFixed(2)} giây) vượt quá giới hạn (${maxDurationSeconds} giây).`);
            break;
        }

        // Nếu thời gian cho phép, thực hiện "di chuyển"
        // 1. Cộng dồn thời gian và khoảng cách di chuyển
        totalDuration += moveDuration;
        totalDistance += moveDistance;
        
        // 2. Thêm điểm gần nhất vào lộ trình cuối cùng
        route.push({ ...nearestPoint, travelInfo: { duration: moveDuration, distance: moveDistance } });
        
        // 3. Cập nhật điểm hiện tại thành điểm vừa đến
        currentPoint = nearestPoint;
        
        // 4. Xóa điểm vừa đến khỏi danh sách "chưa đi"
        unvisited.delete(currentPoint.id.toString());
        
        // 5. Cộng dồn thời gian tham quan tại điểm mới này
        totalDuration += visitDuration;
        console.log(`[ROUTING_LOG] Thêm điểm [${currentPoint.name}] vào lộ trình. Tổng thời gian mới: ${totalDuration.toFixed(2)} giây.`);
    }

    // Sau khi vòng lặp kết thúc (hết điểm hoặc hết thời gian)
    console.log(`\n[ROUTING_LOG] ----- KẾT THÚC -----`);
    console.log(`[ROUTING_LOG] Lộ trình cuối cùng có ${route.length} điểm.`);
    
    // Trả về kết quả là một object chứa lộ trình và các thông số tổng hợp
    return { route, totalDuration, totalDistance };
}

/**
 * Lấy đường đi chi tiết (geometry) giữa hai điểm từ OSRM
 * @param {Object} fromPoint - Điểm xuất phát {latitude, longitude}
 * @param {Object} toPoint - Điểm đích {latitude, longitude}
 * @returns {Promise<Array>} - Mảng các tọa độ [lng, lat] theo đường đi thực tế
 */
async function getRouteGeometry(fromPoint, toPoint) {
    try {
        const url = `http://router.project-osrm.org/route/v1/driving/${fromPoint.longitude},${fromPoint.latitude};${toPoint.longitude},${toPoint.latitude}?overview=full&geometries=geojson`;
        
        console.log(`[ROUTE_GEOMETRY] Gọi OSRM API: ${url}`);
        
        const response = await axios.get(url);
        
        if (response.data.code === 'Ok' && response.data.routes && response.data.routes.length > 0) {
            // Trả về mảng tọa độ theo định dạng GeoJSON
            const coordinates = response.data.routes[0].geometry.coordinates;
            console.log(`[ROUTE_GEOMETRY] Nhận được ${coordinates.length} điểm tọa độ.`);
            return coordinates; // Mảng [[lng, lat], [lng, lat], ...]
        } else {
            console.warn('[ROUTE_GEOMETRY] Không tìm thấy đường đi.');
            return [];
        }
    } catch (error) {
        console.error('[ROUTE_GEOMETRY] Lỗi khi gọi OSRM API:', error.message);
        return [];
    }
}
module.exports = {
    calculateDistanceMatrix,
    solveTspGreedy,
    getRouteGeometry
};