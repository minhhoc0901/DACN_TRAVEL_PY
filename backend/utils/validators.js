const validator = require('validator');

class ValidationError extends Error {
  constructor(errors) {
    super('Validation Error');
    this.name = 'ValidationError';
    this.errors = errors;
    this.statusCode = 400;
  }
}

const validators = {
  // Username validation
  username: (value) => {
    const errors = [];
    
    if (!value || typeof value !== 'string' || value.trim() === '') {
      errors.push('Tên đăng nhập không được để trống');
      return errors;
    }

    const trimmedValue = value.trim();
    
    if (trimmedValue.length < 3) {
      errors.push('Tên đăng nhập phải có ít nhất 3 ký tự');
    }
    if (trimmedValue.length > 20) {
      errors.push('Tên đăng nhập không được quá 20 ký tự');
    }
    if (!/^[a-zA-Z0-9_]+$/.test(trimmedValue)) {
      errors.push('Tên đăng nhập chỉ được chứa chữ, số và gạch dưới');
    }
    
    return errors;
  },

  // Email validation
  email: (value) => {
    const errors = [];
    
    if (!value || typeof value !== 'string' || value.trim() === '') {
      errors.push('Email không được để trống');
      return errors;
    }

    const trimmedValue = value.trim().toLowerCase();
    
    if (!validator.isEmail(trimmedValue)) {
      errors.push('Email không hợp lệ');
    }
    if (trimmedValue.length > 100) {
      errors.push('Email quá dài');
    }
    
    return errors;
  },

  // Password validation
  password: (value) => {
    const errors = [];
    
    if (!value || typeof value !== 'string') {
      errors.push('Mật khẩu không được để trống');
      return errors;
    }
    
    if (value.length < 8) {
      errors.push('Mật khẩu phải có ít nhất 8 ký tự');
    }
    if (value.length > 128) {
      errors.push('Mật khẩu quá dài (tối đa 128 ký tự)');
    }
    if (!/(?=.*[a-z])/.test(value)) {
      errors.push('Mật khẩu phải có ít nhất 1 chữ thường');
    }
    if (!/(?=.*[A-Z])/.test(value)) {
      errors.push('Mật khẩu phải có ít nhất 1 chữ hoa');
    }
    if (!/(?=.*\d)/.test(value)) {
      errors.push('Mật khẩu phải có ít nhất 1 số');
    }
    if (!/(?=.*[@$!%*?&])/.test(value)) {
      errors.push('Mật khẩu phải có ít nhất 1 ký tự đặc biệt (@$!%*?&)');
    }
    
    return errors;
  },

  // Phone validation (Vietnamese format)
  phone: (value) => {
    const errors = [];
    
    if (!value || typeof value !== 'string' || value.trim() === '') {
      errors.push('Số điện thoại không được để trống');
      return errors;
    }

    const trimmedValue = value.trim().replace(/\s/g, '');
    
    // Vietnamese phone number formats
    const phoneRegex = /^(0|\+84)(3[2-9]|5[6|8|9]|7[0|6-9]|8[1-5]|9[0-9])[0-9]{7}$/;
    
    if (!phoneRegex.test(trimmedValue)) {
      errors.push('Số điện thoại không hợp lệ (VD: 0912345678 hoặc +84912345678)');
    }
    
    return errors;
  },

  // Full name validation
  fullName: (value) => {
    const errors = [];
    
    if (!value || typeof value !== 'string' || value.trim() === '') {
      errors.push('Họ tên không được để trống');
      return errors;
    }

    const trimmedValue = value.trim();
    
    if (trimmedValue.length < 2) {
      errors.push('Họ tên phải có ít nhất 2 ký tự');
    }
    if (trimmedValue.length > 100) {
      errors.push('Họ tên quá dài');
    }
    // Allow Vietnamese characters
    if (!/^[a-zA-ZÀ-ỹ\s]+$/.test(trimmedValue)) {
      errors.push('Họ tên chỉ được chứa chữ cái và khoảng trắng');
    }
    
    return errors;
  },

  // OTP validation
  otp: (value) => {
    const errors = [];
    
    if (!value || typeof value !== 'string' || value.trim() === '') {
      errors.push('Mã OTP không được để trống');
      return errors;
    }

    const trimmedValue = value.trim();
    
    if (!/^\d{6}$/.test(trimmedValue)) {
      errors.push('Mã OTP phải là 6 chữ số');
    }
    
    return errors;
  }
};

// Validate registration data
const validateRegistration = (data) => {
  const allErrors = {};
  
  const usernameErrors = validators.username(data.username);
  if (usernameErrors.length) allErrors.username = usernameErrors;
  
  const emailErrors = validators.email(data.email);
  if (emailErrors.length) allErrors.email = emailErrors;
  
  const passwordErrors = validators.password(data.password);
  if (passwordErrors.length) allErrors.password = passwordErrors;
  
  const phoneErrors = validators.phone(data.phone);
  if (phoneErrors.length) allErrors.phone = phoneErrors;
  
  const fullNameErrors = validators.fullName(data.fullName);
  if (fullNameErrors.length) allErrors.fullName = fullNameErrors;
  
  const otpErrors = validators.otp(data.otp);
  if (otpErrors.length) allErrors.otp = otpErrors;
  
  if (Object.keys(allErrors).length > 0) {
    throw new ValidationError(allErrors);
  }
  
  return true;
};

// Validate login data
const validateLogin = (data) => {
  const allErrors = {};
  
  if (!data.username || typeof data.username !== 'string' || data.username.trim() === '') {
    allErrors.username = ['Tên đăng nhập không được để trống'];
  }
  
  if (!data.password || typeof data.password !== 'string' || data.password.trim() === '') {
    allErrors.password = ['Mật khẩu không được để trống'];
  }
  
  if (Object.keys(allErrors).length > 0) {
    throw new ValidationError(allErrors);
  }
  
  return true;
};

// Validate profile update
const validateProfileUpdate = (data) => {
  const allErrors = {};
  
  if (data.fullName !== undefined) {
    const fullNameErrors = validators.fullName(data.fullName);
    if (fullNameErrors.length) allErrors.fullName = fullNameErrors;
  }
  
  if (data.email !== undefined) {
    const emailErrors = validators.email(data.email);
    if (emailErrors.length) allErrors.email = emailErrors;
  }
  
  if (data.phone !== undefined) {
    const phoneErrors = validators.phone(data.phone);
    if (phoneErrors.length) allErrors.phone = phoneErrors;
  }
  
  if (data.password !== undefined) {
    const passwordErrors = validators.password(data.password);
    if (passwordErrors.length) allErrors.password = passwordErrors;
  }
  
  if (Object.keys(allErrors).length > 0) {
    throw new ValidationError(allErrors);
  }
  
  return true;
};

// Validate password change
const validatePasswordChange = (data) => {
  const allErrors = {};
  
  if (!data.currentPassword || typeof data.currentPassword !== 'string' || data.currentPassword.trim() === '') {
    allErrors.currentPassword = ['Mật khẩu hiện tại không được để trống'];
  }
  
  const newPasswordErrors = validators.password(data.newPassword);
  if (newPasswordErrors.length) allErrors.newPassword = newPasswordErrors;
  
  if (data.currentPassword && data.newPassword && data.currentPassword === data.newPassword) {
    allErrors.newPassword = ['Mật khẩu mới phải khác mật khẩu hiện tại'];
  }
  
  if (Object.keys(allErrors).length > 0) {
    throw new ValidationError(allErrors);
  }
  
  return true;
};

module.exports = {
  validators,
  validateRegistration,
  validateLogin,
  validateProfileUpdate,
  validatePasswordChange,
  ValidationError
};