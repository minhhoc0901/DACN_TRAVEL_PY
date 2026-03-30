import { getAuthToken } from '../contexts/AuthContext';
import { CONFIG } from '../config';

const API_BASE_URL = CONFIG.API_API_URL;

/**
 * Xử lý response từ API
 */
async function handleResponse(res) {
    const data = await res.json();
    
    if (!res.ok) {
        throw new Error(data.message || 'Có lỗi xảy ra');
    }
    
    return data;
}

/**
 * ADMIN: Lấy tất cả yêu cầu rút tiền
 */
async function getAllWithdrawals(status = '', page = 1, limit = 20) {
    const token = getAuthToken();
    
    if (!token) {
        throw new Error('Vui lòng đăng nhập');
    }

    const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString()
    });

    if (status) {
        queryParams.append('status', status);
    }

    const res = await fetch(`${API_BASE_URL}/credits/admin/withdrawals?${queryParams}`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        }
    });

    return handleResponse(res);
}

/**
 * ADMIN: Lấy chi tiết yêu cầu rút tiền
 */
async function getWithdrawalById(id) {
    const token = getAuthToken();
    
    if (!token) {
        throw new Error('Vui lòng đăng nhập');
    }

    const res = await fetch(`${API_BASE_URL}/credits/admin/withdrawals/${id}`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        }
    });

    return handleResponse(res);
}

/**
 * ADMIN: Duyệt yêu cầu rút tiền
 */
async function approveWithdrawal(id, admin_note = '') {
    const token = getAuthToken();
    
    if (!token) {
        throw new Error('Vui lòng đăng nhập');
    }

    const res = await fetch(`${API_BASE_URL}/credits/admin/withdrawals/${id}/approve`, {
        method: 'PUT',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ admin_note })
    });

    return handleResponse(res);
}

/**
 * ADMIN: Từ chối yêu cầu rút tiền
 */
async function rejectWithdrawal(id, admin_note) {
    const token = getAuthToken();
    
    if (!token) {
        throw new Error('Vui lòng đăng nhập');
    }

    const res = await fetch(`${API_BASE_URL}/credits/admin/withdrawals/${id}/reject`, {
        method: 'PUT',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ admin_note })
    });

    return handleResponse(res);
}

/**
 * ADMIN: Đánh dấu đã chuyển tiền
 */
async function completeWithdrawal(id, transaction_ref) {
    const token = getAuthToken();
    
    if (!token) {
        throw new Error('Vui lòng đăng nhập');
    }

    const res = await fetch(`${API_BASE_URL}/credits/admin/withdrawals/${id}/complete`, {
        method: 'PUT',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ transaction_ref })
    });

    return handleResponse(res);
}

/**
 * ADMIN: Lấy thống kê rút tiền
 */
async function getWithdrawalStats() {
    const token = getAuthToken();
    
    if (!token) {
        throw new Error('Vui lòng đăng nhập');
    }

    const res = await fetch(`${API_BASE_URL}/credits/admin/withdrawals/stats`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        }
    });

    return handleResponse(res);
}

export const withdrawalService = {
    getAllWithdrawals,
    getWithdrawalById,
    approveWithdrawal,
    rejectWithdrawal,
    completeWithdrawal,
    getWithdrawalStats
};