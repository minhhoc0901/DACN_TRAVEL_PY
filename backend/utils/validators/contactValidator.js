const Joi = require('joi');

const createContactSchema = Joi.object({
    name: Joi.string()
        .max(255)
        .required()
        .messages({
            'string.empty': 'Họ tên không được để trống',
            'string.max': 'Họ tên không được vượt quá 255 ký tự',
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
        .allow('', null)
        .messages({
            'string.pattern.base': 'Số điện thoại phải có 10-11 chữ số'
        }),
    
    subject: Joi.string()
        .max(255)
        .required()
        .messages({
            'string.empty': 'Tiêu đề không được để trống',
            'string.max': 'Tiêu đề không được vượt quá 255 ký tự',
            'any.required': 'Tiêu đề là bắt buộc'
        }),
    
    message: Joi.string()
        .max(2000)
        .required()
        .messages({
            'string.empty': 'Nội dung không được để trống',
            'string.max': 'Nội dung không được vượt quá 2000 ký tự',
            'any.required': 'Nội dung là bắt buộc'
        })
});

function validateContact(data) {
    return createContactSchema.validate(data, { abortEarly: false });
}

module.exports = {
    validateContact,
    createContactSchema
};