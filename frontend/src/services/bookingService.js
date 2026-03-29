import { getAuthToken } from '../contexts/AuthContext'; // Giả sử bạn có hàm này để lấy token


const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/api';

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
            method: 'PUT',
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
    async hideBooking(bookingId) {
        const token = getAuthToken();
        const response = await fetch(`${API_BASE_URL}/bookings/my-booking/hide/${bookingId}`, {
            method: 'PUT',
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

    /**
     * HỦY BOOKING ĐÃ THANH TOÁN VỚI CHÍNH SÁCH HOÀN TIỀN
     */

    async cancelPaidBooking(bookingId, data) { 
        const token = getAuthToken();
        
        console.log('[cancelPaidBooking] Request:', { bookingId, data });

        if (!data || !data.refund_method) {
            console.error('[cancelPaidBooking] ❌ Missing refund_method!');
            throw new Error('Phương thức hoàn tiền không được để trống');
        }

        const response = await fetch(`${API_BASE_URL}/bookings/my-bookings/${bookingId}/cancel-paid`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ 
                refund_method: data.refund_method 
            }) 
        });

        const result = await response.json();
        
        console.log('[cancelPaidBooking] Response:', result);

        if (!response.ok) {
            throw new Error(result.message || 'Không thể hủy booking đã thanh toán.');
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
    async verifyByToken(token) {
        try {
            const response = await fetch(`${API_BASE_URL}/bookings/verify/${token}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Xác thực hóa đơn thất bại.');
            }

            return data;
        } catch (error) {
            console.error('Error verifying booking by token:', error);
            throw error;
        }
    }

};