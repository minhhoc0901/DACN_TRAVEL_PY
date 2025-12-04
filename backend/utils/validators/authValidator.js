const Joi = require('joi');

// ✅ REGISTER SCHEMA - THÊM TRƯỜNG OTP
const registerSchema = Joi.object({
    username: Joi.string()
        .alphanum()
        .min(3)
        .max(30)
        .required()
        .messages({
            'string.alphanum': 'Username chỉ được chứa chữ và số',
            'string.min': 'Username phải có ít nhất 3 ký tự',
            'string.max': 'Username không được vượt quá 30 ký tự',
            'any.required': 'Username là bắt buộc'
        }),
    
    email: Joi.string()
        .email()
        .required()
        .messages({
            'string.email': 'Email không hợp lệ',
            'any.required': 'Email là bắt buộc'
        }),
    
    phone: Joi.string()
        .pattern(/^[0-9]{10,11}$/)
        .required()
        .messages({
            'string.pattern.base': 'Số điện thoại phải có 10-11 chữ số',
            'any.required': 'Số điện thoại là bắt buộc'
        }),
    
    password: Joi.string()
        .min(6)
        .required()
        .messages({
            'string.min': 'Mật khẩu phải có ít nhất 6 ký tự',
            'any.required': 'Mật khẩu là bắt buộc'
        }),

    // ✅ THÊM TRƯỜNG fullName (optional)
    fullName: Joi.string()
        .max(100)
        .optional()
        .messages({
            'string.max': 'Họ tên không được vượt quá 100 ký tự'
        }),

    // ✅ THÊM TRƯỜNG otp (required)
    otp: Joi.string()
        .length(6)
        .pattern(/^[0-9]+$/)
        .required()
        .messages({
            'string.length': 'OTP phải có 6 chữ số',
            'string.pattern.base': 'OTP chỉ được chứa số',
            'any.required': 'Mã OTP là bắt buộc'
        }),

    // ✅ THÊM TRƯỜNG confirmPassword (optional - chỉ validate ở frontend)
    confirmPassword: Joi.string()
        .optional()
});

// ✅ LOGIN SCHEMA
const loginSchema = Joi.object({
    username: Joi.string()
        .required()
        .messages({
            'any.required': 'Username là bắt buộc'
        }),
    
    password: Joi.string()
        .required()
        .messages({
            'any.required': 'Mật khẩu là bắt buộc'
        })
});

// ✅ REQUEST OTP SCHEMA
const requestOtpSchema = Joi.object({
    email: Joi.string()
        .email()
        .required()
        .messages({
            'string.email': 'Email không hợp lệ',
            'any.required': 'Email là bắt buộc'
        }),
    
    isPasswordReset: Joi.boolean()
        .optional()
});

// ✅ VERIFY OTP SCHEMA
const verifyOtpSchema = Joi.object({
    email: Joi.string()
        .email()
        .required(),
    
    otp: Joi.string()
        .length(6)
        .pattern(/^[0-9]+$/)
        .required()
        .messages({
            'string.length': 'OTP phải có 6 chữ số',
            'string.pattern.base': 'OTP chỉ được chứa số',
            'any.required': 'OTP là bắt buộc'
        })
});

// ✅ RESET PASSWORD SCHEMA
const resetPasswordSchema = Joi.object({
    email: Joi.string()
        .email()
        .required(),
    
    otp: Joi.string()
        .length(6)
        .required(),
    
    newPassword: Joi.string()
        .min(6)
        .required()
        .messages({
            'string.min': 'Mật khẩu mới phải có ít nhất 6 ký tự'
        })
});

// ✅ CHANGE PASSWORD SCHEMA
const changePasswordSchema = Joi.object({
    currentPassword: Joi.string()
        .required()
        .messages({
            'any.required': 'Mật khẩu hiện tại là bắt buộc'
        }),
    
    newPassword: Joi.string()
        .min(6)
        .required()
        .messages({
            'string.min': 'Mật khẩu mới phải có ít nhất 6 ký tự',
            'any.required': 'Mật khẩu mới là bắt buộc'
        })
});

// ✅ VALIDATION FUNCTIONS
function validateRegister(data) {
    return registerSchema.validate(data, { abortEarly: false });
}

function validateLogin(data) {
    return loginSchema.validate(data, { abortEarly: false });
}

function validateChangePassword(data) {
    return changePasswordSchema.validate(data, { abortEarly: false });
}

function validateRequestOtp(data) {
    return requestOtpSchema.validate(data, { abortEarly: false });
}

function validateVerifyOtp(data) {
    return verifyOtpSchema.validate(data, { abortEarly: false });
}

function validateResetPassword(data) {
    return resetPasswordSchema.validate(data, { abortEarly: false });
}

module.exports = {
    validateRegister,
    validateLogin,
    validateChangePassword,
    validateRequestOtp,
    validateVerifyOtp,
    validateResetPassword,
    registerSchema,
    loginSchema
};