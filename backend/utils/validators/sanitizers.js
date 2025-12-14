const validator = require('validator');

/**
 * Sanitizers để làm sạch input data trước khi validate
 */
const sanitizers = {
    /**
     * Làm sạch string chung - XSS protection
     */
    sanitizeString: (str) => {
        if (typeof str !== 'string') return '';
        return validator.escape(str.trim());
    },

    /**
     * Làm sạch username - chỉ giữ alphanumeric và underscore
     */
    sanitizeUsername: (username) => {
        if (typeof username !== 'string') return '';
        return username.trim().replace(/[^a-zA-Z0-9_]/g, '');
    },

    /**
     * Làm sạch email - normalize và lowercase
     */
    sanitizeEmail: (email) => {
        if (typeof email !== 'string') return '';
        const normalized = validator.normalizeEmail(email.trim().toLowerCase());
        return normalized || email.trim().toLowerCase();
    },

    /**
     * Làm sạch phone number - chỉ giữ số và dấu +
     */
    sanitizePhone: (phone) => {
        if (typeof phone !== 'string') return '';
        // Giữ lại số và dấu + ở đầu
        return phone.trim().replace(/[^\d+]/g, '');
    },

    /**
     * Làm sạch Vietnamese name - giữ ký tự tiếng Việt và loại bỏ space thừa
     */
    sanitizeName: (name) => {
        if (typeof name !== 'string') return '';
        // Loại bỏ khoảng trắng thừa và trim
        return name.trim().replace(/\s+/g, ' ');
    },

    /**
     * Làm sạch password - KHÔNG escape vì cần giữ nguyên ký tự đặc biệt
     */
    sanitizePassword: (password) => {
        if (typeof password !== 'string') return '';
        // Chỉ trim, không escape
        return password.trim();
    },

    /**
     * Làm sạch OTP - chỉ giữ số
     */
    sanitizeOTP: (otp) => {
        if (typeof otp !== 'string') return '';
        return otp.trim().replace(/\D/g, '');
    },

    /**
     * Làm sạch toàn bộ registration data
     */
    sanitizeRegistrationData: (data) => {
        return {
            username: sanitizers.sanitizeUsername(data.username),
            email: sanitizers.sanitizeEmail(data.email),
            fullName: sanitizers.sanitizeName(data.fullName),
            phone: sanitizers.sanitizePhone(data.phone),
            password: sanitizers.sanitizePassword(data.password), // Không escape password
            otp: sanitizers.sanitizeOTP(data.otp)
        };
    },

    /**
     * Làm sạch login data
     */
    sanitizeLoginData: (data) => {
        return {
            username: data.username?.trim() || '',
            password: data.password?.trim() || '' // Không escape password
        };
    },

    /**
     * Làm sạch profile update data
     */
    sanitizeProfileData: (data) => {
        const sanitized = {};
        
        if (data.fullName !== undefined) {
            sanitized.fullName = sanitizers.sanitizeName(data.fullName);
        }
        if (data.email !== undefined) {
            sanitized.email = sanitizers.sanitizeEmail(data.email);
        }
        if (data.phone !== undefined) {
            sanitized.phone = sanitizers.sanitizePhone(data.phone);
        }
        if (data.password !== undefined) {
            sanitized.password = sanitizers.sanitizePassword(data.password);
        }
        
        return sanitized;
    }
};

module.exports = sanitizers;