const Joi = require('joi');

const createBookingSchema = Joi.object({
    tourId: Joi.number()
        .integer()
        .required()
        .messages({
            'number.base': 'Tour ID phải là số',
            'any.required': 'Tour ID là bắt buộc'
        }),
    
    tour_departure_id: Joi.number()
        .integer()
        .required()
        .messages({
            'number.base': 'Lịch khởi hành phải là số',
            'any.required': 'Vui lòng chọn lịch khởi hành'
        }),
    
    items: Joi.array()
        .items(
            Joi.object({
                price_type: Joi.string()
                    .valid('adult', 'child', 'infant', 'student', 'senior')
                    .required()
                    .messages({
                        'any.only': 'Loại vé không hợp lệ',
                        'any.required': 'Loại vé là bắt buộc'
                    }),
                quantity: Joi.number()
                    .integer()
                    .min(0)
                    .required()
                    .messages({
                        'number.min': 'Số lượng phải lớn hơn hoặc bằng 0',
                        'any.required': 'Số lượng là bắt buộc'
                    })
            })
        )
        .min(1)
        .required()
        .messages({
            'array.min': 'Phải chọn ít nhất một loại vé'
        }),
    
    promotionCode: Joi.string()
        .max(50)
        .allow('', null),
    
    contact: Joi.object({
        name: Joi.string()
            .max(255)
            .required()
            .messages({
                'string.empty': 'Họ tên không được để trống',
                'any.required': 'Họ tên là bắt buộc'
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
        
        special: Joi.string()
            .max(500)
            .allow('', null)
    }).required()
});

const cancelBookingSchema = Joi.object({
    refundMethod: Joi.string()
        .valid('credit', 'bank_transfer')
        .default('credit')
        .messages({
            'any.only': 'Phương thức hoàn tiền không hợp lệ'
        })
});

const updateBookingStatusSchema = Joi.object({
    status: Joi.string()
        .valid('pending_payment', 'confirmed', 'cancelled', 'completed')
        .required()
        .messages({
            'any.only': 'Trạng thái không hợp lệ',
            'any.required': 'Trạng thái là bắt buộc'
        }),
    
    reason: Joi.string()
        .max(500)
        .allow('', null)
});

function validateBooking(data) {
    return createBookingSchema.validate(data, { abortEarly: false });
}

function validateCancelBooking(data) {
    return cancelBookingSchema.validate(data, { abortEarly: false });
}

function validateUpdateBookingStatus(data) {
    return updateBookingStatusSchema.validate(data, { abortEarly: false });
}

module.exports = {
    validateBooking,
    validateCancelBooking,
    validateUpdateBookingStatus,
    createBookingSchema,
    cancelBookingSchema
};