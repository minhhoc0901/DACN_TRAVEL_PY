import { getAuthToken } from '../contexts/AuthContext';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

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

async function getBookingStats(filters = {}) {
  const params = new URLSearchParams();
  if (filters.date_from) params.append('date_from', filters.date_from);
  if (filters.date_to) params.append('date_to', filters.date_to);
  
  const res = await fetch(`${API_BASE_URL}/bookings/admin/stats?${params.toString()}`, {
    method: 'GET',
    headers: getAuthHeaders(),
    credentials: 'include'
  });
  
  return await handleResponse(res);
}

async function getAllBookings(filters = {}) {
  const params = new URLSearchParams();
  
  if (filters.status) params.append('status', filters.status);
  if (filters.payment_status) params.append('payment_status', filters.payment_status);
  if (filters.page) params.append('page', filters.page);
  if (filters.limit) params.append('limit', filters.limit);
  if (filters.search) params.append('search', filters.search);
  if (filters.date_from) params.append('date_from', filters.date_from);
  if (filters.date_to) params.append('date_to', filters.date_to);
  if (filters.sort_by) params.append('sort_by', filters.sort_by);
  if (filters.sort_order) params.append('sort_order', filters.sort_order);
  
  const res = await fetch(`${API_BASE_URL}/bookings/admin/all?${params.toString()}`, {
    method: 'GET',
    headers: getAuthHeaders(),
    credentials: 'include'
  });
  
  return await handleResponse(res);
}

async function getBookingDetail(bookingId) {
  const res = await fetch(`${API_BASE_URL}/bookings/admin/${bookingId}`, {
    method: 'GET',
    headers: getAuthHeaders(),
    credentials: 'include'
  });
  
  return await handleResponse(res);
}

async function updateBookingStatus(bookingId, status, reason = '') {
  const res = await fetch(`${API_BASE_URL}/bookings/admin/${bookingId}/status`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    credentials: 'include',
    body: JSON.stringify({ status, reason })
  });
  
  return await handleResponse(res);
}

async function exportReport(filters = {}) {
  const params = new URLSearchParams();
  
  if (filters.status) params.append('status', filters.status);
  if (filters.payment_status) params.append('payment_status', filters.payment_status);
  if (filters.date_from) params.append('date_from', filters.date_from);
  if (filters.date_to) params.append('date_to', filters.date_to);
  
  const res = await fetch(`${API_BASE_URL}/bookings/admin/export?${params.toString()}`, {
    method: 'GET',
    headers: getAuthHeaders(),
    credentials: 'include'
  });
  
  return await handleResponse(res);
}
async function  markBookingCompleted(bookingId) {
  const token = getAuthToken();
  const response = await fetch(`${API_BASE_URL}/bookings/admin/${bookingId}/complete`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });

  const result = await response.json();
  if (!response.ok) {
    throw new Error(result.message || 'Không thể đánh dấu hoàn thành');
  }
  return result;
}
async function triggerMarkCompletedJob() {
  const token = getAuthToken();
  const response = await fetch(`${API_BASE_URL}/bookings/admin/trigger-mark-completed`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });

  const result = await response.json();
  if (!response.ok) {
    throw new Error(result.message || 'Không thể chạy job');
  }
  return result;
}

const adminBookingService = {
  getBookingStats,
  getAllBookings,
  getBookingDetail,
  updateBookingStatus,
  exportReport,
  markBookingCompleted,
  triggerMarkCompletedJob
};

export default adminBookingService;