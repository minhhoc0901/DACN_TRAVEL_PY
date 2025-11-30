import { getAuthToken } from '../contexts/AuthContext'; // Hoặc từ context nếu bạn đã thay đổi

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
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
    throw new Error(message);
  }
  return data;
}
/**
 * Xác thực mã khuyến mãi.
 * @param {object} payload - { code, originalAmount }
 * @returns {Promise<object>}
 */
async function validatePromotion(payload) {
    const token = getAuthToken();
  const res = await fetch(`${API_BASE_URL}/promotions/validate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(payload)
  });
  return handleResponse(res);
}

/* new: CRUD for promotions */
async function getAllPromotions() {
  const token = getAuthToken();
  const url = `${API_BASE_URL}/promotions`;
  const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
  console.debug('[promotionService] GET', url, 'headers:', headers, 'API_BASE_URL=', API_BASE_URL);
  const res = await fetch(url, { headers });
  const text = await res.text();
  console.debug('[promotionService] raw response text:', text);
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch (err) {
    console.error('[promotionService] JSON parse error:', err, 'text:', text);
    throw new Error('Invalid JSON from promotions endpoint');
  }
  if (!res.ok) {
    console.error('[promotionService] HTTP error', res.status, data);
    const message = data && data.message ? data.message : (res.statusText || 'Request failed');
    throw new Error(message);
  }
  console.debug('[promotionService] parsed data:', data);
  return data;
}

async function getPromotionById(id) {
  const token = getAuthToken();
  const res = await fetch(`${API_BASE_URL}/promotions/${id}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  return handleResponse(res);
}

async function createPromotion(data) {
  const token = getAuthToken();
  const res = await fetch(`${API_BASE_URL}/promotions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(data)
  });
  return handleResponse(res);
}

async function updatePromotion(id, data) {
  const token = getAuthToken();
  const res = await fetch(`${API_BASE_URL}/promotions/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(data)
  });
  return handleResponse(res);
}

async function deletePromotion(id) {
  const token = getAuthToken();
  const res = await fetch(`${API_BASE_URL}/promotions/${id}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  return handleResponse(res);
}

export const promotionService = {
  validatePromotion,
  getAllPromotions,
  getPromotionById,
  createPromotion,
  updatePromotion,
  deletePromotion
};