const API_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/api';

export const locationService = {
    async getAllLocations() {
        try {
            const response = await fetch(`${API_URL}/locations`);

            if (!response.ok) {
                throw new Error('Không thể tải danh sách địa điểm.');
            }

            const result = await response.json();
            console.log("locationService - Full response:", result);
            
            // Sửa lỗi: API trả về mảng trực tiếp, không phải object có thuộc tính 'data'
            // Kiểm tra xem result có phải là mảng không
            if (Array.isArray(result)) {
                console.log("locationService - Returning array directly:", result);
                return result;
            } else if (result.data && Array.isArray(result.data)) {
                console.log("locationService - Returning result.data:", result.data);
                return result.data;
            } else {
                console.warn("locationService - Unexpected data structure:", result);
                return [];
            }
        } catch (error) {
            console.error("Failed to fetch locations:", error);
            return [];
        }
    }
};