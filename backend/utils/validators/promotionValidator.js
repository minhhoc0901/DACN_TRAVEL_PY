const Joi = require('joi');

const createPromotionSchema = Joi.object({
    code: Joi.string()
        .max(50)
        .required()
        .messages({
            'string.empty': 'Mã khuyến mãi không được để trống',
            'string.max': 'Mã khuyến mãi không được vượt quá 50 ký tự',
            'any.required': 'Mã khuyến mãi là bắt buộc'
        }),
    
    description: Joi.string()
        .max(255)
        .allow('', null)
        .messages({
            'string.max': 'Mô tả không được vượt quá 255 ký tự'
        }),
    
    discount_type: Joi.string()
        .valid('percentage', 'fixed_amount')
        .required()
        .messages({
            'any.only': 'Loại giảm giá phải là "percentage" hoặc "fixed_amount"',
            'any.required': 'Loại giảm giá là bắt buộc'
        }),
    
    discount_value: Joi.number()
        .min(0)
        .required()
        .messages({
            'number.base': 'Giá trị giảm phải là số',
            'number.min': 'Giá trị giảm phải lớn hơn hoặc bằng 0',
            'any.required': 'Giá trị giảm là bắt buộc'
        }),
    
    start_date: Joi.date()
        .required()
        .messages({
            'date.base': 'Ngày bắt đầu không hợp lệ',
            'any.required': 'Ngày bắt đầu là bắt buộc'
        }),
    
    end_date: Joi.date()
        .greater(Joi.ref('start_date'))
        .required()
        .messages({
            'date.base': 'Ngày kết thúc không hợp lệ',
            'date.greater': 'Ngày kết thúc phải sau ngày bắt đầu',
            'any.required': 'Ngày kết thúc là bắt buộc'
        }),
    
    max_usage: Joi.number()
        .integer()
        .min(0)
        .allow(null)
        .messages({
            'number.base': 'Số lần sử dụng tối đa phải là số',
            'number.integer': 'Số lần sử dụng tối đa phải là số nguyên',
            'number.min': 'Số lần sử dụng tối đa phải lớn hơn hoặc bằng 0'
        }),
    
    is_active: Joi.boolean()
        .default(true)
});

const updatePromotionSchema = createPromotionSchema.fork(
    ['code', 'discount_type', 'discount_value', 'start_date', 'end_date'],
    (schema) => schema.optional()
);

const validatePromotionCodeSchema = Joi.object({
    code: Joi.string()
        .required()
        .messages({
            'any.required': 'Mã khuyến mãi là bắt buộc'
        }),
    
    originalAmount: Joi.number()
        .min(0)
        .required()
        .messages({
            'number.min': 'Giá trị đơn hàng phải lớn hơn 0',
            'any.required': 'Giá trị đơn hàng là bắt buộc'
        })
});

function validatePromotion(data, isUpdate = false) {
    const schema = isUpdate ? updatePromotionSchema : createPromotionSchema;
    return schema.validate(data, { abortEarly: false });
}

function validatePromotionCode(data) {
    return validatePromotionCodeSchema.validate(data, { abortEarly: false });
}

module.exports = {
    validatePromotion,
    validatePromotionCode,
    createPromotionSchema,
    updatePromotionSchema,
    validatePromotionCodeSchema
};