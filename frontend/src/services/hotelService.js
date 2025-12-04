import { getAuthToken } from '../contexts/AuthContext';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

/**
 * Xử lý response từ API
 */
async function handleResponse(res) {
    const text = await res.text();
    let data = null;
    
    try {
        if (text) {
            data = JSON.parse(text);
        }
    } catch (err) {
        console.warn('[hotelService] Response không phải JSON:', text);
        throw new Error('Server trả về dữ liệu không hợp lệ');
    }

    if (!res.ok) {
        const errorMsg = data?.message || `HTTP ${res.status}: ${res.statusText}`;
        throw new Error(errorMsg);
    }
    
    return data;
}

/**
 * Lấy tất cả khách sạn (PUBLIC)
 */
async function getAllHotels() {
    console.debug('[hotelService] getAllHotels');
    
    const headers = {
        'Accept': 'application/json'
    };

    const res = await fetch(`${API_BASE_URL}/hotels`, {
        method: 'GET',
        headers,
        credentials: 'include'
    });

    const data = await handleResponse(res);
    
    if (Array.isArray(data)) return data;
    if (data?.data && Array.isArray(data.data)) return data.data;
    if (data?.hotels && Array.isArray(data.hotels)) return data.hotels;
    
    return [];
}

/**
 * Lấy thông tin một khách sạn theo ID
 */
async function getHotelById(id) {
    console.debug('[hotelService] getHotelById:', id);
    
    const headers = {
        'Accept': 'application/json'
    };

    const res = await fetch(`${API_BASE_URL}/hotels/${id}`, {
        method: 'GET',
        headers,
        credentials: 'include'
    });

    const data = await handleResponse(res);
    return data?.data || data;
}

/**
 * Tạo khách sạn mới (ADMIN)
 */
async function createHotel(hotelData) {
    const token = getAuthToken();
    console.debug('[hotelService] createHotel with token:', token ? 'present' : 'missing');
    
    if (!token) {
        throw new Error('Bạn cần đăng nhập để thực hiện chức năng này');
    }

    const headers = {
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`
    };

    // Nếu có ảnh, dùng FormData
    let body;
    if (hotelData.image instanceof File) {
        const formData = new FormData();
        Object.keys(hotelData).forEach(key => {
            if (hotelData[key] !== null && hotelData[key] !== undefined) {
                formData.append(key, hotelData[key]);
            }
        });
        body = formData;
    } else {
        headers['Content-Type'] = 'application/json';
        body = JSON.stringify(hotelData);
    }

    const res = await fetch(`${API_BASE_URL}/hotels`, {
        method: 'POST',
        headers,
        credentials: 'include',
        body
    });

    return await handleResponse(res);
}

/**
 * Cập nhật thông tin khách sạn (ADMIN)
 */
async function updateHotel(id, hotelData) {
    const token = getAuthToken();
    console.debug('[hotelService] updateHotel with token:', token ? 'present' : 'missing');
    
    if (!token) {
        throw new Error('Bạn cần đăng nhập để thực hiện chức năng này');
    }

    const headers = {
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`
    };

    // Nếu có ảnh mới, dùng FormData
    let body;
    if (hotelData.image instanceof File) {
        const formData = new FormData();
        Object.keys(hotelData).forEach(key => {
            if (hotelData[key] !== null && hotelData[key] !== undefined) {
                formData.append(key, hotelData[key]);
            }
        });
        body = formData;
    } else {
        headers['Content-Type'] = 'application/json';
        body = JSON.stringify(hotelData);
    }

    const res = await fetch(`${API_BASE_URL}/hotels/${id}`, {
        method: 'PUT',
        headers,
        credentials: 'include',
        body
    });

    return await handleResponse(res);
}

/**
 * Xóa khách sạn (ADMIN)
 */
async function deleteHotel(id) {
    const token = getAuthToken();
    console.debug('[hotelService] deleteHotel with token:', token ? 'present' : 'missing');
    
    if (!token) {
        throw new Error('Bạn cần đăng nhập để thực hiện chức năng này');
    }

    const headers = {
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`
    };

    const res = await fetch(`${API_BASE_URL}/hotels/${id}`, {
        method: 'DELETE',
        headers,
        credentials: 'include'
    });

    return await handleResponse(res);
}

/**
 * Tìm kiếm khách sạn
 */
async function searchHotels(keyword) {
    console.debug('[hotelService] searchHotels:', keyword);
    
    const headers = {
        'Accept': 'application/json'
    };

    const res = await fetch(`${API_BASE_URL}/hotels/search/${encodeURIComponent(keyword)}`, {
        method: 'GET',
        headers,
        credentials: 'include'
    });

    const data = await handleResponse(res);
    return data?.data || data;
}

/**
 * Lấy khách sạn theo địa điểm
 */
async function getHotelsByLocation(locationId) {
    console.debug('[hotelService] getHotelsByLocation:', locationId);
    
    const headers = {
        'Accept': 'application/json'
    };

    const res = await fetch(`${API_BASE_URL}/hotels/location/${locationId}`, {
        method: 'GET',
        headers,
        credentials: 'include'
    });

    const data = await handleResponse(res);
    return data?.data || data;
}

export const hotelService = {
    getAllHotels,
    getHotelById,
    createHotel,
    updateHotel,
    deleteHotel,
    searchHotels,
    getHotelsByLocation
};