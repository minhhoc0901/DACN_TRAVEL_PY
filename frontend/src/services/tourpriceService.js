import { getAuthToken } from '../contexts/AuthContext';
import { CONFIG } from '../config';

const API_BASE_URL = CONFIG.API_API_URL;

async function handleResponse(res) {
    const text = await res.text();
    let data = null;
    try {
        data = text ? JSON.parse(text) : null;
    } catch (err) {
        console.error('[tourPriceService] JSON parse error:', err, 'text:', text.slice(0, 200));
        throw new Error('Invalid JSON response from server');
    }

    if (!res.ok) {
        const message = data?.message || res.statusText || `HTTP ${res.status}`;
        throw new Error(message);
    }
    return data;
}

/**
 * Lấy tất cả giá tour (cho admin)
 * @returns {Promise<Array>} Danh sách tất cả giá tour
 */
async function getAllPrices() {
    const token = getAuthToken();
    console.debug('[tourPriceService] getAllPrices with token:', token ? 'present' : 'missing');
    
    const headers = {
        'Accept': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    };

    const res = await fetch(`${API_BASE_URL}/tour-prices`, {
        method: 'GET',
        headers,
        credentials: 'include'
    });

    const data = await handleResponse(res);
    // Normalize response - có thể trả về array trực tiếp hoặc { data: [...] }
    if (Array.isArray(data)) return data;
    if (data?.data && Array.isArray(data.data)) return data.data;
    if (data?.rows && Array.isArray(data.rows)) return data.rows;
    return [];
}

/**
 * Lấy danh sách tours để map tour_id -> tên tour
 * @returns {Promise<object>} Map từ tour_id -> tour name
 */
async function getToursMap() {
    const token = getAuthToken();
    const headers = {
        'Accept': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    };

    const candidates = [
        `${API_BASE_URL}/tours/admin/tours`, // Ưu tiên endpoint admin để lấy tất cả tours
        `${API_BASE_URL}/tours/for-sale`,
        `${API_BASE_URL}/tours`
    ];

    for (const url of candidates) {
        try {
            const res = await fetch(url, { headers, credentials: 'include' });
            const data = await handleResponse(res);
            
            // Normalize to array
            let toursList = [];
            if (Array.isArray(data)) toursList = data;
            else if (data?.tours && Array.isArray(data.tours)) toursList = data.tours;
            else if (data?.data && Array.isArray(data.data)) toursList = data.data;

            console.debug('[tourPriceService] getToursMap received', toursList.length, 'tours from', url);
            
            // Log chi tiết 5 tours đầu tiên để debug
            if (toursList.length > 0) {
                console.debug('[tourPriceService] Sample tours:', toursList.slice(0, 5).map(t => ({
                    id: t.id,
                    destination: t.destination,
                    title: t.title,
                    status: t.status
                })));
            }

            // Build map: tour_id -> tour name (ưu tiên destination)
            const map = {};
            toursList.forEach(t => {
                const id = t.id ?? t._id ?? t.tour_id ?? t.tourId;
                const name = t.destination ?? t.title ?? t.name ?? `Tour ${id}`;
                if (id != null) {
                    map[String(id)] = name;
                    console.debug(`[tourPriceService] Mapped tour ${id} -> "${name}"`);
                }
            });
            
            console.debug('[tourPriceService] getToursMap from', url, '-> mapped', Object.keys(map).length, 'tours');
            console.debug('[tourPriceService] Map keys:', Object.keys(map).slice(0, 10));
            
            if (Object.keys(map).length > 0) {
                return map;
            }
        } catch (err) {
            console.error('[tourPriceService] getToursMap failed for', url, err.message);
        }
    }
    
    // Return empty map if all candidates fail
    console.warn('[tourPriceService] getToursMap: All endpoints failed');
    return {};
}

/**
 * Lấy danh sách tất cả locations
 * @returns {Promise<Array>} Danh sách locations
 */
async function getAllLocations() {
    const token = getAuthToken();
    const headers = {
        'Accept': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    };

    const res = await fetch(`${API_BASE_URL}/locations`, {
        method: 'GET',
        headers,
        credentials: 'include'
    });

    const data = await handleResponse(res);
    
    // Normalize response
    if (Array.isArray(data)) return data;
    if (data?.locations && Array.isArray(data.locations)) return data.locations;
    if (data?.data && Array.isArray(data.data)) return data.data;
    return [];
}

/**
 * Lấy danh sách giá theo tour ID
 * @param {number} tourId - ID của tour
 * @returns {Promise<Array>} Danh sách giá của tour
 */
async function getPricesByTour(tourId) {
    const token = getAuthToken();
    const headers = {
        'Accept': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    };

    const res = await fetch(`${API_BASE_URL}/tour-prices/tour/${tourId}`, {
        method: 'GET',
        headers,
        credentials: 'include'
    });

    const data = await handleResponse(res);
    if (Array.isArray(data)) return data;
    if (data?.data && Array.isArray(data.data)) return data.data;
    return [];
}

/**
 * Lấy chi tiết một giá tour theo ID
 * @param {number} id - ID của giá tour
 * @returns {Promise<object>} Thông tin giá tour
 */
async function getPriceById(id) {
    const token = getAuthToken();
    const headers = {
        'Accept': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    };

    const res = await fetch(`${API_BASE_URL}/tour-prices/${id}`, {
        method: 'GET',
        headers,
        credentials: 'include'
    });

    return await handleResponse(res);
}

/**
 * Tạo giá tour mới (Admin only)
 * @param {object} priceData - { tour_id, price_type, price, sale_price }
 * @returns {Promise<object>} Giá tour vừa tạo
 */
async function createPrice(priceData) {
    const token = getAuthToken();
    console.debug('[tourPriceService] createPrice with token:', token ? 'present' : 'missing');
    
    if (!token) {
        throw new Error('Bạn cần đăng nhập để thực hiện chức năng này');
    }

    const headers = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`
    };

    const res = await fetch(`${API_BASE_URL}/tour-prices`, {
        method: 'POST',
        headers,
        credentials: 'include',
        body: JSON.stringify(priceData)
    });

    return await handleResponse(res);
}

/**
 * Cập nhật giá tour (Admin only)
 * @param {number} id - ID của giá tour
 * @param {object} priceData - { price_type, price, sale_price }
 * @returns {Promise<object>} Giá tour đã cập nhật
 */
async function updatePrice(id, priceData) {
    const token = getAuthToken();
    console.debug('[tourPriceService] updatePrice with token:', token ? 'present' : 'missing');
    
    if (!token) {
        throw new Error('Bạn cần đăng nhập để thực hiện chức năng này');
    }

    const headers = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`
    };

    const res = await fetch(`${API_BASE_URL}/tour-prices/${id}`, {
        method: 'PUT',
        headers,
        credentials: 'include',
        body: JSON.stringify(priceData)
    });

    return await handleResponse(res);
}

/**
 * Xóa giá tour (Admin only)
 * @param {number} id - ID của giá tour
 * @returns {Promise<object>} Kết quả xóa
 */
async function deletePrice(id) {
    const token = getAuthToken();
    console.debug('[tourPriceService] deletePrice with token:', token ? 'present' : 'missing');
    
    if (!token) {
        throw new Error('Bạn cần đăng nhập để thực hiện chức năng này');
    }

    const headers = {
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`
    };

    const res = await fetch(`${API_BASE_URL}/tour-prices/${id}`, {
        method: 'DELETE',
        headers,
        credentials: 'include'
    });

    return await handleResponse(res);
}

export const tourPriceService = {
    getAllPrices,
    getToursMap,
    getAllLocations,
    getPricesByTour,
    getPriceById,
    createPrice,
    updatePrice,
    deletePrice
};