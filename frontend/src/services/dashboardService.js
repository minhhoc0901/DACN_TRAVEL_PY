import { getAuthToken } from '../contexts/AuthContext';
import { CONFIG } from '../config';

const API_BASE_URL = CONFIG.API_API_URL;

async function handleResponse(res) {
    const data = await res.json();
    
    if (!res.ok) {
        const error = new Error(data.message || 'Có lỗi xảy ra');
        error.status = res.status;
        error.data = data;
        throw error;
    }
    
    return data;
}

function getAuthHeaders() {
    const token = getAuthToken();
    
    return {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` })
    };
}

/**
 * Lấy tổng quan dashboard
 */
async function getDashboardOverview() {
    const res = await fetch(`${API_BASE_URL}/dashboard/overview`, {
        method: 'GET',
        headers: getAuthHeaders(),
        credentials: 'include'
    });
    
    return handleResponse(res);
}

/**
 * Lấy thống kê chi tiết
 */
async function getDetailedStats(startDate, endDate) {
    const params = new URLSearchParams();
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);
    
    const res = await fetch(`${API_BASE_URL}/dashboard/detailed?${params.toString()}`, {
        method: 'GET',
        headers: getAuthHeaders(),
        credentials: 'include'
    });
    
    return handleResponse(res);
}

const dashboardService = {
    getDashboardOverview,
    getDetailedStats
};

export default dashboardService;