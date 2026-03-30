import { CONFIG } from '../config';

const API_BASE_URL = CONFIG.API_API_URL;

export const tourService = {
    
    async getToursForSale(filters = {}) {
        try {
            const queryParams = new URLSearchParams();
            
            Object.keys(filters).forEach(key => {
                if (filters[key] !== null && filters[key] !== undefined && filters[key] !== '') {
                    queryParams.append(key, filters[key]);
                }
            });

            // Thêm log để kiểm tra chuỗi query
            console.log('Fetching tours with filters:', queryParams.toString());
            
            const response = await fetch(`${API_BASE_URL}/tours/for-sale?${queryParams.toString()}`);
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to fetch tours');
            }
            
            return await response.json();
        } catch (error) {
            console.error('Error fetching tours:', error);
            throw error;
        }
    },

    // Lấy tours nổi bật
    async getFeaturedTours(limit = 8) {
        try {
            const response = await fetch(`${API_BASE_URL}/tours/featured?limit=${limit}`);
            
            if (!response.ok) {
                throw new Error('Failed to fetch featured tours');
            }
            
            return await response.json();
        } catch (error) {
            console.error('Error fetching featured tours:', error);
            throw error;
        }
    },

    // Lấy chi tiết tour
    async getTourDetail(tourId) {
        try {
            const response = await fetch(`${API_BASE_URL}/tours/detail/${tourId}`);
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to fetch tour details');
            }
            
            return await response.json();
        } catch (error) {
            console.error(`Error fetching details for tour ${tourId}:`, error);
            throw error;
        }
    },
    async getTourDepartures(tourId) {
        try {
            // Sửa lại endpoint cho đúng với backend và sử dụng API_BASE_URL
            const response = await fetch(`${API_BASE_URL}/tour-departures/${tourId}/available`);
            
            if (!response.ok) {
                // Thêm logic xử lý lỗi chi tiết hơn
                const errorData = await response.text(); // Dùng .text() để xem server trả về gì
                console.error("Server response (not JSON):", errorData);
                throw new Error('Không thể tải lịch khởi hành.');
            }
            
            return await response.json();
        } catch (error) {
            console.error(`Error fetching departures for tour ${tourId}:`, error);
            throw error;
        }
    },
};