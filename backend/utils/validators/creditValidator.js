const Joi = require('joi');

const createWithdrawalSchema = Joi.object({
    amount: Joi.number()
        .min(50000)
        .required()
        .messages({
            'number.base': 'Số tiền phải là số',
            'number.min': 'Số tiền rút tối thiểu là 50,000 VNĐ',
            'any.required': 'Số tiền là bắt buộc'
        }),
    
    bank_name: Joi.string()
        .max(255)
        .required()
        .messages({
            'string.empty': 'Tên ngân hàng không được để trống',
            'string.max': 'Tên ngân hàng không được vượt quá 255 ký tự',
            'any.required': 'Tên ngân hàng là bắt buộc'
        }),
    
    account_number: Joi.string()
        .pattern(/^[0-9]{9,14}$/)
        .required()
        .messages({
            'string.pattern.base': 'Số tài khoản phải có từ 9-14 chữ số',
            'any.required': 'Số tài khoản là bắt buộc'
        }),
    
    account_name: Joi.string()
        .max(255)
        .required()
        .messages({
            'string.empty': 'Tên tài khoản không được để trống',
            'string.max': 'Tên tài khoản không được vượt quá 255 ký tự',
            'any.required': 'Tên tài khoản là bắt buộc'
        }),
    
    note: Joi.string()
        .max(500)
        .allow('', null)
        .messages({
            'string.max': 'Ghi chú không được vượt quá 500 ký tự'
        })
});

const updateWithdrawalStatusSchema = Joi.object({
    status: Joi.string()
        .valid('pending', 'approved', 'rejected')
        .required()
        .messages({
            'any.only': 'Trạng thái không hợp lệ',
            'any.required': 'Trạng thái là bắt buộc'
        }),
    
    admin_note: Joi.string()
        .max(500)
        .allow('', null)
        .messages({
            'string.max': 'Ghi chú admin không được vượt quá 500 ký tự'
        })
});

function validateWithdrawal(data) {
    return createWithdrawalSchema.validate(data, { abortEarly: false });
}

function validateWithdrawalStatus(data) {
    return updateWithdrawalStatusSchema.validate(data, { abortEarly: false });
}

module.exports = {
    validateWithdrawal,
    validateWithdrawalStatus,
    createWithdrawalSchema,
    updateWithdrawalStatusSchema
};