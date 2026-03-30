import axios from 'axios';
import { CONFIG } from '../config';
import { getAuthToken } from '../utils/auth';

// Tạo một instance của axios với cấu hình mặc định
const api = axios.create({
    baseURL: CONFIG.API_API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Can thiệp (intercept) vào mỗi request trước khi nó được gửi đi
api.interceptors.request.use(
    (config) => {
        const token = getAuthToken();
        if (token) {
            // Nếu có token, thêm nó vào header Authorization
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        // Xử lý lỗi nếu có
        return Promise.reject(error);
    }
);

export default api;