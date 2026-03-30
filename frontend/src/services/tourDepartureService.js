import { getAuthToken } from '../contexts/AuthContext';
import { CONFIG } from '../config';

const API_BASE_URL = CONFIG.API_API_URL;

/**
 * Xử lý response từ API
 * @param {Response} res - Response object từ fetch
 * @returns {Promise<any>} - Parsed JSON data
 */
async function handleResponse(res) {
    const text = await res.text();
    let data = null;
    
    try {
        if (text) {
            data = JSON.parse(text);
        }
    } catch (err) {
        console.warn('[tourDepartureService] Response không phải JSON:', text);
        throw new Error('Server trả về dữ liệu không hợp lệ');
    }

    if (!res.ok) {
        const errorMsg = data?.message || `HTTP ${res.status}: ${res.statusText}`;
        throw new Error(errorMsg);
    }
    
    return data;
}

/**
 * Lấy danh sách lịch khởi hành còn trống cho một tour (PUBLIC)
 * @param {number} tourId - ID của tour
 * @returns {Promise<Array>} Danh sách lịch khởi hành còn trống
 */
async function getAvailableDepartures(tourId) {
    console.debug('[tourDepartureService] getAvailableDepartures for tour:', tourId);
    
    const headers = {
        'Accept': 'application/json'
    };

    const res = await fetch(`${API_BASE_URL}/tour-departures/${tourId}/available`, {
        method: 'GET',
        headers,
        credentials: 'include'
    });

    const data = await handleResponse(res);
    
    // Normalize response
    if (Array.isArray(data)) return data;
    if (data?.data && Array.isArray(data.data)) return data.data;
    if (data?.departures && Array.isArray(data.departures)) return data.departures;
    
    console.warn('[tourDepartureService] Unexpected response format:', data);
    return [];
}

/**
 * Lấy tất cả lịch khởi hành của một tour (ADMIN)
 * @param {number} tourId - ID của tour
 * @returns {Promise<Array>} Danh sách tất cả lịch khởi hành
 */
async function getAllDeparturesForTour(tourId) {
    const token = getAuthToken();
    console.debug('[tourDepartureService] getAllDeparturesForTour with token:', token ? 'present' : 'missing');
    
    if (!token) {
        throw new Error('Bạn cần đăng nhập để thực hiện chức năng này');
    }

    const headers = {
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`
    };

    const res = await fetch(`${API_BASE_URL}/tour-departures/${tourId}`, {
        method: 'GET',
        headers,
        credentials: 'include'
    });

    const data = await handleResponse(res);
    
    // Normalize response
    if (Array.isArray(data)) return data;
    if (data?.data && Array.isArray(data.data)) return data.data;
    if (data?.departures && Array.isArray(data.departures)) return data.departures;
    
    return [];
}

/**
 * Tạo lịch khởi hành mới (ADMIN)
 * @param {object} departureData - { tour_id, departure_date, capacity, status }
 * @returns {Promise<object>} Lịch khởi hành vừa tạo
 */
async function createDeparture(departureData) {
    const token = getAuthToken();
    console.debug('[tourDepartureService] createDeparture with token:', token ? 'present' : 'missing');
    
    if (!token) {
        throw new Error('Bạn cần đăng nhập để thực hiện chức năng này');
    }

    const headers = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`
    };

    const res = await fetch(`${API_BASE_URL}/tour-departures`, {
        method: 'POST',
        headers,
        credentials: 'include',
        body: JSON.stringify(departureData)
    });

    return await handleResponse(res);
}

/**
 * Cập nhật lịch khởi hành (ADMIN)
 * @param {number} id - ID của lịch khởi hành
 * @param {object} departureData - { departure_date, capacity, status }
 * @returns {Promise<object>} Lịch khởi hành đã cập nhật
 */
async function updateDeparture(id, departureData) {
    const token = getAuthToken();
    console.debug('[tourDepartureService] updateDeparture with token:', token ? 'present' : 'missing');
    
    if (!token) {
        throw new Error('Bạn cần đăng nhập để thực hiện chức năng này');
    }

    const headers = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`
    };

    const res = await fetch(`${API_BASE_URL}/tour-departures/${id}`, {
        method: 'PUT',
        headers,
        credentials: 'include',
        body: JSON.stringify(departureData)
    });

    return await handleResponse(res);
}

/**
 * Xóa lịch khởi hành (ADMIN)
 * @param {number} id - ID của lịch khởi hành
 * @returns {Promise<object>} Kết quả xóa
 */
async function deleteDeparture(id) {
    const token = getAuthToken();
    console.debug('[tourDepartureService] deleteDeparture with token:', token ? 'present' : 'missing');
    
    if (!token) {
        throw new Error('Bạn cần đăng nhập để thực hiện chức năng này');
    }

    const headers = {
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`
    };

    const res = await fetch(`${API_BASE_URL}/tour-departures/${id}`, {
        method: 'DELETE',
        headers,
        credentials: 'include'
    });

    return await handleResponse(res);
}

/**
 * Lấy chi tiết một lịch khởi hành theo ID
 * @param {number} id - ID của lịch khởi hành
 * @returns {Promise<object>} Thông tin lịch khởi hành
 */
async function getDepartureById(id) {
    const token = getAuthToken();
    
    const headers = {
        'Accept': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    };

    const res = await fetch(`${API_BASE_URL}/tour-departures/detail/${id}`, {
        method: 'GET',
        headers,
        credentials: 'include'
    });

    return await handleResponse(res);
}

/**
 * Kiểm tra tính khả dụng của lịch khởi hành
 * @param {number} departureId - ID của lịch khởi hành
 * @param {number} quantity - Số lượng vé cần kiểm tra
 * @returns {Promise<object>} Thông tin tình trạng còn chỗ
 */
async function checkAvailability(departureId, quantity) {
    const headers = {
        'Accept': 'application/json'
    };

    const res = await fetch(
        `${API_BASE_URL}/tour-departures/${departureId}/check-availability?quantity=${quantity}`,
        {
            method: 'GET',
            headers,
            credentials: 'include'
        }
    );

    return await handleResponse(res);
}

export const tourDepartureService = {
    getAvailableDepartures,
    getAllDeparturesForTour,
    createDeparture,
    updateDeparture,
    deleteDeparture,
    getDepartureById,
    checkAvailability
};