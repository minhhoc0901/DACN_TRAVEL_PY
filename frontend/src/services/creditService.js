import { getAuthToken } from '../contexts/AuthContext';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

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
 * Lấy số dư Credit của user
 */
async function getBalance() {
    const token = getAuthToken();
    
    if (!token) {
        throw new Error('Vui lòng đăng nhập để xem số dư Credit');
    }

    const res = await fetch(`${API_BASE_URL}/credits/balance`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        }
    });

    return handleResponse(res);
}

/**
 * Lấy lịch sử giao dịch Credit
 */
async function getTransactionHistory(limit = 20) {
    const token = getAuthToken();
    
    if (!token) {
        throw new Error('Vui lòng đăng nhập để xem lịch sử giao dịch');
    }

    const res = await fetch(`${API_BASE_URL}/credits/transactions?limit=${limit}`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        }
    });

    return handleResponse(res);
}

/**
 * Yêu cầu rút tiền về ngân hàng
 */
async function requestWithdrawal(withdrawalData) {
    const token = getAuthToken();
    
    if (!token) {
        throw new Error('Vui lòng đăng nhập để rút tiền');
    }

    const res = await fetch(`${API_BASE_URL}/credits/withdraw`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(withdrawalData)
    });

    return handleResponse(res);
}

export const creditService = {
    getBalance,
    getTransactionHistory,
    requestWithdrawal
};