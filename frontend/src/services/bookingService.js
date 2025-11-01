import { getAuthToken } from '../contexts/AuthContext'; // Giả sử bạn có hàm này để lấy token

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

export const bookingService = {
    /**
     * Gửi yêu cầu tạo một booking mới
     * @param {object} bookingData Dữ liệu đặt tour
     * @returns {Promise<any>}
     */
    async createBooking(bookingData) {
        const token = getAuthToken();
        if (!token) {
            throw new Error('Bạn cần đăng nhập để thực hiện chức năng này.');
        }

        const response = await fetch(`${API_BASE_URL}/bookings`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(bookingData)
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || 'Đặt tour thất bại. Vui lòng thử lại.');
        }

        return result;
    },

    /**
     * Lấy danh sách các tour đã đặt của người dùng
     * @returns {Promise<any>}
     */
    async getMyBookings() {
        const token = getAuthToken();
        if (!token) {
            throw new Error('Bạn cần đăng nhập để xem lịch sử đặt tour.');
        }

        const response = await fetch(`${API_BASE_URL}/bookings/my-bookings`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || 'Không thể tải lịch sử đặt tour.');
        }

        return result.data;
    },
    async cancelBooking(bookingId) {
        const token = getAuthToken();
        const response = await fetch(`${API_BASE_URL}/bookings/my-bookings/${bookingId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const result = await response.json();
        if (!response.ok) {
            throw new Error(result.message || 'Không thể hủy đơn đặt tour.');
        }
        return result;
    },
    async deleteBooking(bookingId) {
        const token = getAuthToken();
        const response = await fetch(`${API_BASE_URL}/bookings/my-bookings/delete/${bookingId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const result = await response.json();
        if (!response.ok) {
            throw new Error(result.message || 'Không thể xóa đơn đặt tour.');
        }
        return result;
    },
    async downloadInvoice(bookingId) {
        const token = getAuthToken();
        const response = await fetch(`${API_BASE_URL}/bookings/${bookingId}/invoice/pdf`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        if (!response.ok) {
            throw new Error('Không thể tải hóa đơn.');
        }
        return await response.arrayBuffer(); // Trả về dữ liệu PDF dạng arrayBuffer
    },
};