const Joi = require('joi');

/**
 * Schema validation cho REGISTER
 */
const registerSchema = Joi.object({
    username: Joi.string()
        .min(3)
        .max(20)
        .pattern(/^[a-zA-Z0-9_]+$/)
        .required()
        .messages({
            'string.min': 'Tên đăng nhập phải có ít nhất 3 ký tự',
            'string.max': 'Tên đăng nhập không được vượt quá 20 ký tự',
            'string.pattern.base': 'Tên đăng nhập chỉ được chứa chữ, số và gạch dưới',
            'any.required': 'Tên đăng nhập là bắt buộc'
        }),
    
    email: Joi.string()
        .email()
        .required()
        .messages({
            'string.email': 'Email không hợp lệ',
            'any.required': 'Email là bắt buộc'
        }),
    
    phone: Joi.string()
        .pattern(/^(0|\+84)(3[2-9]|5[6|8|9]|7[0|6-9]|8[1-5]|9[0-9])[0-9]{7}$/)
        .required()
        .messages({
            'string.pattern.base': 'Số điện thoại không hợp lệ (VD: 0912345678)',
            'any.required': 'Số điện thoại là bắt buộc'
        }),
    
    password: Joi.string()
        .min(8)
        .max(128)
        .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]+$/)
        .required()
        .messages({
            'string.min': 'Mật khẩu phải có ít nhất 8 ký tự',
            'string.max': 'Mật khẩu không được vượt quá 128 ký tự',
            'string.pattern.base': 'Mật khẩu phải chứa chữ hoa, chữ thường, số và ký tự đặc biệt (@$!%*?&)',
            'any.required': 'Mật khẩu là bắt buộc'
        }),

    fullName: Joi.string()
        .min(2)
        .max(100)
        .pattern(/^[a-zA-ZÀ-ỹ\s]+$/)
        .optional()
        .messages({
            'string.min': 'Họ tên phải có ít nhất 2 ký tự',
            'string.max': 'Họ tên không được vượt quá 100 ký tự',
            'string.pattern.base': 'Họ tên chỉ được chứa chữ cái và khoảng trắng'
        }),

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

/**
 * Schema validation cho LOGIN
 */
const loginSchema = Joi.object({
    username: Joi.string()
        .required()
        .messages({
            'string.empty': 'Tên đăng nhập không được để trống',
            'any.required': 'Tên đăng nhập là bắt buộc'
        }),
    
    password: Joi.string()
        .required()
        .messages({
            'string.empty': 'Mật khẩu không được để trống',
            'any.required': 'Mật khẩu là bắt buộc'
        })
});

/**
 * Schema validation cho UPDATE PROFILE
 */
const updateProfileSchema = Joi.object({
    fullName: Joi.string()
        .min(2)
        .max(100)
        .pattern(/^[a-zA-ZÀ-ỹ\s]+$/)
        .optional()
        .messages({
            'string.min': 'Họ tên phải có ít nhất 2 ký tự',
            'string.max': 'Họ tên không được vượt quá 100 ký tự',
            'string.pattern.base': 'Họ tên chỉ được chứa chữ cái'
        }),
    
    email: Joi.string()
        .email()
        .optional()
        .messages({
            'string.email': 'Email không hợp lệ'
        }),
    
    phone: Joi.string()
        .pattern(/^(0|\+84)(3[2-9]|5[6|8|9]|7[0|6-9]|8[1-5]|9[0-9])[0-9]{7}$/)
        .optional()
        .messages({
            'string.pattern.base': 'Số điện thoại không hợp lệ'
        })
});

/**
 * Schema validation cho CHANGE PASSWORD
 */
const changePasswordSchema = Joi.object({
    currentPassword: Joi.string()
        .required()
        .messages({
            'any.required': 'Mật khẩu hiện tại là bắt buộc'
        }),
    
    newPassword: Joi.string()
        .min(8)
        .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]+$/)
        .required()
        .messages({
            'string.min': 'Mật khẩu mới phải có ít nhất 8 ký tự',
            'string.pattern.base': 'Mật khẩu phải chứa chữ hoa, chữ thường, số và ký tự đặc biệt',
            'any.required': 'Mật khẩu mới là bắt buộc'
        }),
    
    confirmPassword: Joi.string()
        .valid(Joi.ref('newPassword'))
        .required()
        .messages({
            'any.only': 'Xác nhận mật khẩu không khớp',
            'any.required': 'Xác nhận mật khẩu là bắt buộc'
        })
});

/**
 * Hàm validation helpers
 */
function validateRegister(data) {
    return registerSchema.validate(data, { abortEarly: false });
}

function validateLogin(data) {
    return loginSchema.validate(data, { abortEarly: false });
}

function validateUpdateProfile(data) {
    return updateProfileSchema.validate(data, { abortEarly: false });
}

function validateChangePassword(data) {
    return changePasswordSchema.validate(data, { abortEarly: false });
}

module.exports = {
    validateRegister,
    validateLogin,
    validateUpdateProfile,
    validateChangePassword,
    registerSchema,
    loginSchema,
    updateProfileSchema,
    changePasswordSchema
};