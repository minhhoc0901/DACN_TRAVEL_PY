import { CONFIG } from '../config';

/**
 * Hàm lấy URL ảnh hiển thị
 * @param {string} path - Đường dẫn ảnh (có thể là URL đầy đủ hoặc đường dẫn tương đối /uploads/...)
 * @returns {string} - URL đầy đủ để hiển thị
 */
export const getDisplayImageUrl = (path) => {
    if (!path) return 'https://via.placeholder.com/400x300?text=No+Image';
    
    // Nếu không phải là string (ví dụ là File object hoặc blob URL đã được xử lý)
    // Hoặc nếu đã là một blob URL hoặc data URL
    if (typeof path !== 'string' || path.startsWith('blob:') || path.startsWith('data:')) {
        return path;
    }

    // Nếu là URL đầy đủ (ví dụ từ Cloudinary) thì trả về luôn
    if (path.startsWith('http://') || path.startsWith('https://')) {
        return path;
    }
    
    // Sử dụng Base URL từ CONFIG
    const baseUrl = CONFIG.API_URL;
    
    // Đảm bảo không bị lặp dấu /
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    return `${baseUrl}${cleanPath}`;
};
