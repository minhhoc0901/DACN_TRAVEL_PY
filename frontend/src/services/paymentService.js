
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
 * Tạo URL thanh toán VNPay
 */
async function createPaymentUrl(payload) {
    const token = getAuthToken();
    
    if (!token) {
        throw new Error('Bạn cần đăng nhập để thanh toán');
    }

    const response = await fetch(`${API_BASE_URL}/payments/vnpay/init`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
    });

    return handleResponse(response);
}

/**
 * ✅ THANH TOÁN BẰNG VÍ CREDIT
 */
async function payWithCredit(bookingId) {
    const token = getAuthToken();
    
    if (!token) {
        throw new Error('Bạn cần đăng nhập để thanh toán');
    }

    const response = await fetch(`${API_BASE_URL}/payments/credit/pay`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ bookingId })
    });

    return handleResponse(response);
}

/**
 * Kiểm tra trạng thái thanh toán
 */
async function checkPaymentStatus(bookingId) {
    const token = getAuthToken();
    
    if (!token) {
        throw new Error('Bạn cần đăng nhập để kiểm tra trạng thái');
    }

    const response = await fetch(`${API_BASE_URL}/payments/status/${bookingId}`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });

    return handleResponse(response);
}

export const paymentService = {
    createPaymentUrl,
    payWithCredit,
    checkPaymentStatus
};