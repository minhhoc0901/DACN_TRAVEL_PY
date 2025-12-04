import React from 'react'; // ✅ THÊM DÒNG NÀY

/**
 * 🎯 VALIDATION UTILITY - CLIENT-SIDE
 * Đồng bộ với backend validators để tránh duplicate validation
 */

export const validators = {
  // ===== COMMON =====
  required: (value, fieldName = 'Trường này') => {
    if (!value || (typeof value === 'string' && !value.trim())) {
      return `${fieldName} là bắt buộc`;
    }
    return null;
  },

  minLength: (value, min, fieldName = 'Trường này') => {
    if (value && value.length < min) {
      return `${fieldName} phải có ít nhất ${min} ký tự`;
    }
    return null;
  },

  maxLength: (value, max, fieldName = 'Trường này') => {
    if (value && value.length > max) {
      return `${fieldName} không được vượt quá ${max} ký tự`;
    }
    return null;
  },

  // ===== EMAIL =====
  email: (value) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (value && !emailRegex.test(value)) {
      return 'Email không hợp lệ';
    }
    return null;
  },

  // ===== PHONE =====
  phone: (value) => {
    const phoneRegex = /^[0-9]{10,11}$/;
    if (value && !phoneRegex.test(value.replace(/\s/g, ''))) {
      return 'Số điện thoại phải có 10-11 chữ số';
    }
    return null;
  },

  // ===== NUMBER =====
  number: (value, fieldName = 'Trường này') => {
    if (value && isNaN(Number(value))) {
      return `${fieldName} phải là số`;
    }
    return null;
  },

  min: (value, min, fieldName = 'Giá trị') => {
    if (value != null && Number(value) < min) {
      return `${fieldName} phải lớn hơn hoặc bằng ${min}`;
    }
    return null;
  },

  max: (value, max, fieldName = 'Giá trị') => {
    if (value != null && Number(value) > max) {
      return `${fieldName} phải nhỏ hơn hoặc bằng ${max}`;
    }
    return null;
  },

  integer: (value, fieldName = 'Trường này') => {
    if (value && !Number.isInteger(Number(value))) {
      return `${fieldName} phải là số nguyên`;
    }
    return null;
  },

  // ===== DATE =====
  date: (value, fieldName = 'Ngày') => {
    if (value && isNaN(new Date(value).getTime())) {
      return `${fieldName} không hợp lệ`;
    }
    return null;
  },

  futureDate: (value, fieldName = 'Ngày') => {
    if (value) {
      const inputDate = new Date(value);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (inputDate < today) {
        return `${fieldName} phải là ngày trong tương lai`;
      }
    }
    return null;
  },

  dateRange: (startDate, endDate) => {
    if (startDate && endDate) {
      if (new Date(endDate) <= new Date(startDate)) {
        return 'Ngày kết thúc phải sau ngày bắt đầu';
      }
    }
    return null;
  },

  // ===== URL =====
  url: (value, fieldName = 'URL') => {
    try {
      if (value) {
        new URL(value);
      }
      return null;
    } catch {
      return `${fieldName} không hợp lệ`;
    }
  },

  // ===== COORDINATES =====
  latitude: (value) => {
    const num = Number(value);
    if (value != null && (isNaN(num) || num < -90 || num > 90)) {
      return 'Vĩ độ phải từ -90 đến 90';
    }
    return null;
  },

  longitude: (value) => {
    const num = Number(value);
    if (value != null && (isNaN(num) || num < -180 || num > 180)) {
      return 'Kinh độ phải từ -180 đến 180';
    }
    return null;
  },

  // ===== PROMOTION =====
  promotionCode: (value) => {
    if (value && value.length > 50) {
      return 'Mã khuyến mãi không được vượt quá 50 ký tự';
    }
    return null;
  },

  discountType: (value) => {
    const validTypes = ['percentage', 'fixed_amount'];
    if (value && !validTypes.includes(value)) {
      return 'Loại giảm giá không hợp lệ';
    }
    return null;
  },

  // ===== BOOKING =====
  adults: (value) => {
    const num = Number(value);
    if (isNaN(num) || num < 1) {
      return 'Phải có ít nhất 1 người lớn';
    }
    return null;
  },

  // ===== RATING =====
  rating: (value) => {
    const num = Number(value);
    if (value != null && (isNaN(num) || num < 0 || num > 5)) {
      return 'Đánh giá phải từ 0 đến 5';
    }
    return null;
  }
};

/**
 * 🎯 VALIDATE MULTIPLE FIELDS
 * @param {Object} data - Dữ liệu cần validate
 * @param {Object} rules - Rules cho từng field
 * @returns {Object} { isValid: boolean, errors: {} }
 */
export const validateForm = (data, rules) => {
  const errors = {};

  Object.keys(rules).forEach(field => {
    const fieldRules = rules[field];
    const value = data[field];

    for (const rule of fieldRules) {
      const error = rule(value);
      if (error) {
        errors[field] = error;
        break; // Stop at first error
      }
    }
  });

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

/**
 * 🎯 REAL-TIME VALIDATION HOOK
 */
export const useFormValidation = (initialState, validationRules) => {
  const [formData, setFormData] = React.useState(initialState);
  const [errors, setErrors] = React.useState({});
  const [touched, setTouched] = React.useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    // Validate field if touched
    if (touched[name]) {
      const fieldRules = validationRules[name] || [];
      let error = null;
      
      for (const rule of fieldRules) {
        error = rule(value);
        if (error) break;
      }

      setErrors(prev => ({
        ...prev,
        [name]: error
      }));
    }
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    setTouched(prev => ({ ...prev, [name]: true }));

    // Validate on blur
    const fieldRules = validationRules[name] || [];
    let error = null;
    
    for (const rule of fieldRules) {
      error = rule(value);
      if (error) break;
    }

    setErrors(prev => ({
      ...prev,
      [name]: error
    }));
  };

  const validateAll = () => {
    const result = validateForm(formData, validationRules);
    setErrors(result.errors);
    
    // Mark all fields as touched
    const allTouched = {};
    Object.keys(validationRules).forEach(key => {
      allTouched[key] = true;
    });
    setTouched(allTouched);

    return result.isValid;
  };

  const reset = () => {
    setFormData(initialState);
    setErrors({});
    setTouched({});
  };

  return {
    formData,
    errors,
    touched,
    handleChange,
    handleBlur,
    validateAll,
    reset,
    setFormData
  };
};