import { getAuthToken } from '../contexts/AuthContext'; // Hoặc từ context nếu bạn đã thay đổi

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

/**
 * Xác thực mã khuyến mãi.
 * @param {object} payload - { code, originalAmount }
 * @returns {Promise<object>}
 */
async function validatePromotion(payload) {
    const token = getAuthToken();
    const response = await fetch(`${API_BASE_URL}/promotions/validate`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
    });
    return response.json();
}

// Sau này bạn có thể thêm các hàm CRUD cho admin ở đây
// async function getAllPromotions() { ... }
// async function createPromotion(data) { ... }
// async function updatePromotion(id, data) { ... }
// async function deletePromotion(id) { ... }

export const promotionService = {
    validatePromotion,
    // getAllPromotions,
    // createPromotion,
    // ...
};