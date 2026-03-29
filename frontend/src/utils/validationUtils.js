/**
 * Validate Username
 * @param {string} username - Tên đăng nhập
 * @returns {string} - Error message (rỗng nếu hợp lệ)
 */
export const validateUsername = (username) => {
    if (!username || username.trim() === '') {
        return 'Tên đăng nhập không được để trống';
    }

    const trimmed = username.trim();

    if (trimmed.length < 3) {
        return 'Tên đăng nhập phải có ít nhất 3 ký tự';
    }

    if (trimmed.length > 20) {
        return 'Tên đăng nhập không được quá 20 ký tự';
    }

    if (!/^[a-zA-Z0-9_]+$/.test(trimmed)) {
        return 'Tên đăng nhập chỉ được chứa chữ, số và gạch dưới (_)';
    }

    if (/^\d/.test(trimmed)) {
        return 'Tên đăng nhập không được bắt đầu bằng số';
    }

    return '';
};

/**
 * Validate Email
 * @param {string} email - Email
 * @returns {string} - Error message
 */
export const validateEmail = (email) => {
    if (!email || email.trim() === '') {
        return 'Email không được để trống';
    }

    const trimmed = email.trim().toLowerCase();

    // Regex đơn giản cho email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmed)) {
        return 'Email không hợp lệ';
    }

    if (trimmed.length > 100) {
        return 'Email quá dài (tối đa 100 ký tự)';
    }

    return '';
};

/**
 * Validate Password
 * @param {string} password - Mật khẩu
 * @returns {string} - Error message
 */
export const validatePassword = (password) => {
    if (!password || password.trim() === '') {
        return 'Mật khẩu không được để trống';
    }

    if (password.length < 8) {
        return 'Mật khẩu phải có ít nhất 8 ký tự';
    }

    if (password.length > 128) {
        return 'Mật khẩu quá dài (tối đa 128 ký tự)';
    }

    if (!/(?=.*[a-z])/.test(password)) {
        return 'Mật khẩu phải có ít nhất 1 chữ thường (a-z)';
    }

    if (!/(?=.*[A-Z])/.test(password)) {
        return 'Mật khẩu phải có ít nhất 1 chữ hoa (A-Z)';
    }

    if (!/(?=.*\d)/.test(password)) {
        return 'Mật khẩu phải có ít nhất 1 chữ số (0-9)';
    }

    if (!/(?=.*[@$!%*?&#])/.test(password)) {
        return 'Mật khẩu phải có ít nhất 1 ký tự đặc biệt (@$!%*?&#)';
    }

    if (/\s/.test(password)) {
        return 'Mật khẩu không được chứa khoảng trắng';
    }

    return '';
};

/**
 * Calculate Password Strength
 * @param {string} password - Mật khẩu
 * @returns {object} - { strength: 'weak'|'medium'|'strong', score: 0-4, suggestions: [] }
 */
export const calculatePasswordStrength = (password) => {
    if (!password) {
        return { strength: 'weak', score: 0, color: '#ff4444', suggestions: ['Vui lòng nhập mật khẩu'] };
    }

    let score = 0;
    const suggestions = [];

    // Kiểm tra độ dài
    if (password.length >= 8) score++;
    else suggestions.push('Mật khẩu nên có ít nhất 8 ký tự');

    if (password.length >= 12) score++;

    // Kiểm tra chữ thường
    if (/[a-z]/.test(password)) score++;
    else suggestions.push('Thêm chữ thường (a-z)');

    // Kiểm tra chữ hoa
    if (/[A-Z]/.test(password)) score++;
    else suggestions.push('Thêm chữ hoa (A-Z)');

    // Kiểm tra số
    if (/\d/.test(password)) score++;
    else suggestions.push('Thêm số (0-9)');

    // Kiểm tra ký tự đặc biệt
    if (/[@$!%*?&#]/.test(password)) score++;
    else suggestions.push('Thêm ký tự đặc biệt (@$!%*?&#)');

    // Xác định strength
    let strength = 'weak';
    let color = '#ff4444';

    if (score >= 5) {
        strength = 'strong';
        color = '#00c851';
    } else if (score >= 3) {
        strength = 'medium';
        color = '#ffbb33';
    }

    return { strength, score, color, suggestions };
};

/**
 * Validate Phone Number (Vietnamese format)
 * @param {string} phone - Số điện thoại
 * @returns {string} - Error message
 */
export const validatePhone = (phone) => {
    if (!phone || phone.trim() === '') {
        return 'Số điện thoại không được để trống';
    }

    const trimmed = phone.trim().replace(/\s/g, '');

    // Vietnamese phone number: 0912345678, +84912345678
    const phoneRegex = /^(0|\+84)(3[2-9]|5[6|8|9]|7[0|6-9]|8[1-5]|9[0-9])[0-9]{7}$/;

    if (!phoneRegex.test(trimmed)) {
        return 'Số điện thoại không hợp lệ (VD: 0912345678)';
    }

    return '';
};

/**
 * Validate Full Name (Vietnamese)
 * @param {string} fullName - Họ tên
 * @returns {string} - Error message
 */
export const validateFullName = (fullName) => {
    if (!fullName || fullName.trim() === '') {
        return 'Họ tên không được để trống';
    }

    const trimmed = fullName.trim();

    if (trimmed.length < 2) {
        return 'Họ tên phải có ít nhất 2 ký tự';
    }

    if (trimmed.length > 100) {
        return 'Họ tên quá dài (tối đa 100 ký tự)';
    }

    // Cho phép chữ cái tiếng Việt và khoảng trắng
    if (!/^[a-zA-ZÀ-ỹ\s]+$/.test(trimmed)) {
        return 'Họ tên chỉ được chứa chữ cái và khoảng trắng';
    }

    // Kiểm tra nhiều khoảng trắng liên tiếp
    if (/\s{2,}/.test(trimmed)) {
        return 'Họ tên không được có nhiều khoảng trắng liên tiếp';
    }

    return '';
};

/**
 * Validate OTP (6 digits)
 * @param {string} otp - Mã OTP
 * @returns {string} - Error message
 */
export const validateOTP = (otp) => {
    if (!otp || otp.trim() === '') {
        return 'Mã OTP không được để trống';
    }

    const trimmed = otp.trim();

    if (!/^\d{6}$/.test(trimmed)) {
        return 'Mã OTP phải là 6 chữ số';
    }

    return '';
};

/**
 * Validate Confirm Password
 * @param {string} password - Mật khẩu gốc
 * @param {string} confirmPassword - Mật khẩu xác nhận
 * @returns {string} - Error message
 */
export const validateConfirmPassword = (password, confirmPassword) => {
    if (!confirmPassword || confirmPassword.trim() === '') {
        return 'Vui lòng xác nhận mật khẩu';
    }

    if (password !== confirmPassword) {
        return 'Mật khẩu xác nhận không khớp';
    }

    return '';
};

/**
 * Sanitize Input (prevent XSS)
 * @param {string} input - Input string
 * @returns {string} - Sanitized string
 */
export const sanitizeInput = (input) => {
    if (typeof input !== 'string') return '';
    
    return input
        .trim()
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;')
        .replace(/\//g, '&#x2F;');
};

/**
 * Format Phone Number (Vietnamese)
 * @param {string} phone - Phone number
 * @returns {string} - Formatted phone (0912 345 678)
 */
export const formatPhoneNumber = (phone) => {
    if (!phone) return '';
    
    const cleaned = phone.replace(/\D/g, '');
    
    if (cleaned.length === 10 && cleaned.startsWith('0')) {
        return `${cleaned.slice(0, 4)} ${cleaned.slice(4, 7)} ${cleaned.slice(7)}`;
    }
    
    return phone;
};

/**
 * Validate Form (tổng hợp)
 * @param {object} formData - Dữ liệu form
 * @param {array} fields - Danh sách field cần validate ['username', 'email', ...]
 * @returns {object} - { isValid: boolean, errors: {} }
 */
export const validateForm = (formData, fields) => {
    const errors = {};
    
    fields.forEach(field => {
        const value = formData[field];
        let error = '';
        
        switch (field) {
            case 'username':
                error = validateUsername(value);
                break;
            case 'email':
                error = validateEmail(value);
                break;
            case 'password':
                error = validatePassword(value);
                break;
            case 'confirmPassword':
                error = validateConfirmPassword(formData.password, value);
                break;
            case 'phone':
                error = validatePhone(value);
                break;
            case 'fullName':
                error = validateFullName(value);
                break;
            case 'otp':
                error = validateOTP(value);
                break;
            default:
                break;
        }
        
        if (error) {
            errors[field] = error;
        }
    });
    
    return {
        isValid: Object.keys(errors).length === 0,
        errors
    };
};