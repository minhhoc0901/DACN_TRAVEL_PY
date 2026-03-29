/**
 * Format Vietnamese name (capitalize first letter of each word)
 * @param {string} name - Tên cần format
 * @returns {string} - Tên đã format
 */
export const formatVietnameseName = (name) => {
    if (!name) return '';
    
    return name
        .trim()
        .replace(/\s+/g, ' ') // Loại bỏ khoảng trắng thừa
        .split(' ')
        .map(word => {
            if (word.length === 0) return '';
            return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
        })
        .join(' ');
};

/**
 * Format error message từ backend
 * @param {object|string} error - Error từ API
 * @returns {string} - Error message dễ đọc
 */
export const formatErrorMessage = (error) => {
    if (typeof error === 'string') {
        return error;
    }
    
    if (error.response?.data?.message) {
        return error.response.data.message;
    }
    
    if (error.message) {
        return error.message;
    }
    
    return 'Có lỗi xảy ra, vui lòng thử lại';
};

/**
 * Extract backend validation errors
 * @param {object} error - Error object từ axios
 * @returns {object} - { fieldName: 'error message' }
 */
export const extractValidationErrors = (error) => {
    const errors = {};
    
    if (error.response?.data?.errors) {
        const backendErrors = error.response.data.errors;
        
        // Backend trả về: { username: ['Error 1', 'Error 2'], email: [...] }
        Object.keys(backendErrors).forEach(field => {
            if (Array.isArray(backendErrors[field]) && backendErrors[field].length > 0) {
                errors[field] = backendErrors[field][0]; // Lấy error đầu tiên
            }
        });
    }
    
    return errors;
};

/**
 * Debounce function (delay execution)
 * @param {function} func - Function cần debounce
 * @param {number} delay - Delay time (ms)
 * @returns {function} - Debounced function
 */
export const debounce = (func, delay = 300) => {
    let timeoutId;
    
    return function (...args) {
        clearTimeout(timeoutId);
        
        timeoutId = setTimeout(() => {
            func.apply(this, args);
        }, delay);
    };
};

/**
 * Show success toast message
 * @param {string} message - Success message
 */
export const showSuccessMessage = (message) => {
    // Có thể dùng thư viện như react-toastify
    console.log('✅ SUCCESS:', message);
    alert(message); // Tạm thời dùng alert, sau này có thể thay bằng toast
};

/**
 * Show error toast message
 * @param {string} message - Error message
 */
export const showErrorMessage = (message) => {
    console.error('❌ ERROR:', message);
    alert(message);
};

/**
 * Clear form data
 * @param {object} formData - Form data object
 * @returns {object} - Cleared form data
 */
export const clearForm = (formData) => {
    const clearedData = {};
    
    Object.keys(formData).forEach(key => {
        if (typeof formData[key] === 'string') {
            clearedData[key] = '';
        } else if (typeof formData[key] === 'number') {
            clearedData[key] = 0;
        } else if (typeof formData[key] === 'boolean') {
            clearedData[key] = false;
        } else if (Array.isArray(formData[key])) {
            clearedData[key] = [];
        } else {
            clearedData[key] = null;
        }
    });
    
    return clearedData;
};

/**
 * Convert form data to API payload (remove empty fields)
 * @param {object} formData - Form data
 * @returns {object} - Cleaned payload
 */
export const preparePayload = (formData) => {
    const payload = {};
    
    Object.keys(formData).forEach(key => {
        const value = formData[key];
        
        // Chỉ thêm field có giá trị
        if (value !== null && value !== undefined && value !== '') {
            if (typeof value === 'string') {
                payload[key] = value.trim();
            } else {
                payload[key] = value;
            }
        }
    });
    
    return payload;
};

/**
 * Scroll to first error field
 * @param {object} errors - Errors object
 */
export const scrollToFirstError = (errors) => {
    if (!errors || Object.keys(errors).length === 0) return;
    
    const firstErrorField = Object.keys(errors)[0];
    const element = document.querySelector(`[name="${firstErrorField}"]`);
    
    if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        element.focus();
    }
};

/**
 * Auto-format phone number khi user nhập
 * @param {string} value - Raw phone input
 * @returns {string} - Formatted phone
 */
export const autoFormatPhone = (value) => {
    // Loại bỏ tất cả ký tự không phải số
    const cleaned = value.replace(/\D/g, '');
    
    // Giới hạn 10 số
    const limited = cleaned.slice(0, 10);
    
    // Format: 0912 345 678
    if (limited.length > 6) {
        return `${limited.slice(0, 4)} ${limited.slice(4, 7)} ${limited.slice(7)}`;
    } else if (limited.length > 4) {
        return `${limited.slice(0, 4)} ${limited.slice(4)}`;
    }
    
    return limited;
};

/**
 * Check if two objects are equal (shallow comparison)
 * @param {object} obj1 - Object 1
 * @param {object} obj2 - Object 2
 * @returns {boolean} - True if equal
 */
export const isFormDirty = (obj1, obj2) => {
    const keys1 = Object.keys(obj1);
    const keys2 = Object.keys(obj2);
    
    if (keys1.length !== keys2.length) return true;
    
    for (let key of keys1) {
        if (obj1[key] !== obj2[key]) return true;
    }
    
    return false;
};