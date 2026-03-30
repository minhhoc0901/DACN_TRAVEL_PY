import { getAuthToken } from '../contexts/AuthContext'; // Giả sử bạn có hàm này
import { CONFIG } from '../config';

// Định nghĩa URL cơ sở cho API, tương tự các service khác
const API_BASE_URL = CONFIG.API_API_URL;

export const itineraryService = {
    /**
     * Gửi yêu cầu gợi ý một lịch trình mới
     * @param {object} formData Dữ liệu yêu cầu (startLocation, duration, preferences)
     * @returns {Promise<any>}
     */
    async suggestItinerary(formData) {
        // Lấy token xác thực
        const token = getAuthToken();
        if (!token) {
            throw new Error('Bạn cần đăng nhập để sử dụng tính năng này.');
        }

        // Gửi yêu cầu đến backend bằng fetch
        const response = await fetch(`${API_BASE_URL}/itineraries/suggest`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(formData)
        });

        const result = await response.json();

        // Kiểm tra nếu response không thành công (status code không phải 2xx)
        if (!response.ok) {
            throw new Error(result.message || 'Gợi ý lịch trình thất bại. Vui lòng thử lại.');
        }

        return result;
    },
   
};