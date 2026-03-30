import { getAuthToken } from '../contexts/AuthContext';
import { CONFIG } from '../config';

const API_BASE_URL = CONFIG.API_API_URL;

/**
 * ✅ Handle response từ API
 */
async function handleResponse(res) {
  const text = await res.text();
  const data = text ? JSON.parse(text) : null;
  
  if (!res.ok) {
    const message = data && data.message ? data.message : (res.statusText || 'Request failed');
    const error = new Error(message);
    error.response = {
      status: res.status,
      data: data
    };
    throw error;
  }
  
  return data;
}

/**
 * ========================================
 * ADMIN METHODS
 * ========================================
 */

/**
 * ✅ [ADMIN] Lấy danh sách yêu cầu hoàn tiền
 * @param {object} filters - { status, page, limit, search }
 * @returns {Promise<object>}
 */
async function getAllRefunds(filters = {}) {
  const token = getAuthToken();
  
  // Build query string
  const queryParams = new URLSearchParams();
  Object.keys(filters).forEach(key => {
    if (filters[key] !== undefined && filters[key] !== null && filters[key] !== '') {
      queryParams.append(key, filters[key]);
    }
  });

  // ✅ SỬA: /refunds/admin/refunds → /refunds/admin
  const url = `${API_BASE_URL}/refunds/admin?${queryParams.toString()}`;
  
  console.debug('[refundService] GET', url);
  
  const res = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  return handleResponse(res);
}

/**
 * ✅ [ADMIN] Lấy thống kê refund
 * @returns {Promise<object>}
 */
async function getRefundStats() {
  const token = getAuthToken();

  // ✅ SỬA: /refunds/admin/refunds/stats → /refunds/admin/stats
  const url = `${API_BASE_URL}/refunds/admin/stats`;
  
  console.debug('[refundService] GET stats', url);
  
  const res = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  return handleResponse(res);
}

/**
 * ✅ [ADMIN] Lấy chi tiết một yêu cầu hoàn tiền
 * @param {number} id - Refund ID
 * @returns {Promise<object>}
 */
async function getRefundById(id) {
  const token = getAuthToken();
  
  // ✅ SỬA: /refunds/admin/refunds/:id → /refunds/admin/:id
  const res = await fetch(`${API_BASE_URL}/refunds/admin/${id}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  return handleResponse(res);
}

/**
 * ✅ [ADMIN] Duyệt yêu cầu hoàn tiền
 * @param {number} id - Refund ID
 * @param {string} adminNote - Ghi chú của admin (optional)
 * @returns {Promise<object>}
 */
async function approveRefund(id, adminNote = '') {
  const token = getAuthToken();
  
  // ✅ SỬA: 
  // - URL: /refunds/admin/refunds/:id/approve → /refunds/admin/:id/approve
  // - Method: POST → PUT
  // - Body: { admin_note } thay vì { refund_reference, admin_notes }
  const res = await fetch(`${API_BASE_URL}/refunds/admin/${id}/approve`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ admin_note: adminNote })
  });
  
  return handleResponse(res);
}

/**
 * ✅ [ADMIN] Từ chối yêu cầu hoàn tiền
 * @param {number} id - Refund ID
 * @param {string} adminNote - Lý do từ chối (bắt buộc)
 * @returns {Promise<object>}
 */
async function rejectRefund(id, adminNote) {
  const token = getAuthToken();
  
  // ✅ SỬA:
  // - URL: /refunds/admin/refunds/:id/reject → /refunds/admin/:id/reject
  // - Method: POST → PUT
  // - Body: { admin_note } thay vì { admin_notes }
  const res = await fetch(`${API_BASE_URL}/refunds/admin/${id}/reject`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ admin_note: adminNote })
  });
  
  return handleResponse(res);
}

/**
 * ✅ [ADMIN] Hoàn thành bank transfer
 * @param {number} id - Refund ID
 * @param {string} transactionRef - Mã giao dịch
 * @returns {Promise<object>}
 */
async function completeBankTransfer(id, transactionRef) {
  const token = getAuthToken();
  
  const res = await fetch(`${API_BASE_URL}/refunds/admin/${id}/complete-transfer`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ transaction_ref: transactionRef })
  });
  
  return handleResponse(res);
}

/**
 * ========================================
 * USER METHODS
 * ========================================
 */

/**
 * ✅ [USER] Lấy danh sách refund của user
 * @param {object} options - { page, limit }
 * @returns {Promise<object>}
 */
async function getUserRefunds(options = {}) {
  const token = getAuthToken();
  
  // Build query string
  const queryParams = new URLSearchParams();
  if (options.page) queryParams.append('page', options.page);
  if (options.limit) queryParams.append('limit', options.limit);

  // ✅ SỬA: /refunds/user/refunds → /refunds/user
  const url = `${API_BASE_URL}/refunds/user?${queryParams.toString()}`;
  
  const res = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  return handleResponse(res);
}

/**
 * ✅ [USER] Lấy chi tiết refund của user
 * @param {number} id - Refund ID
 * @returns {Promise<object>}
 */
async function getUserRefundById(id) {
  const token = getAuthToken();
  
  const res = await fetch(`${API_BASE_URL}/refunds/user/${id}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  return handleResponse(res);
}

/**
 * ========================================
 * EXPORT
 * ========================================
 */
export const refundService = {
  // Admin
  getAllRefunds,
  getRefundStats,
  getRefundById,
  approveRefund,
  rejectRefund,
  completeBankTransfer,
  
  // User
  getUserRefunds,
  getUserRefundById
};