const Joi = require('joi');

const createTourPriceSchema = Joi.object({
    tour_id: Joi.number()
        .integer()
        .required()
        .messages({
            'number.base': 'Tour ID phải là số',
            'any.required': 'Tour ID là bắt buộc'
        }),
    
    price_type: Joi.string()
        .valid('adult', 'child', 'infant', 'student', 'senior')
        .required()
        .messages({
            'any.only': 'Loại giá không hợp lệ',
            'any.required': 'Loại giá là bắt buộc'
        }),
    
    price: Joi.number()
        .min(0)
        .required()
        .messages({
            'number.base': 'Giá phải là số',
            'number.min': 'Giá phải lớn hơn hoặc bằng 0',
            'any.required': 'Giá là bắt buộc'
        }),
    
    sale_price: Joi.number()
        .min(0)
        .max(Joi.ref('price'))
        .allow(null)
        .messages({
            'number.base': 'Giá khuyến mãi phải là số',
            'number.min': 'Giá khuyến mãi phải lớn hơn hoặc bằng 0',
            'number.max': 'Giá khuyến mãi phải nhỏ hơn hoặc bằng giá gốc'
        })
});

const updateTourPriceSchema = createTourPriceSchema.fork(
    ['tour_id', 'price_type', 'price'],
    (schema) => schema.optional()
);

function validateTourPrice(data, isUpdate = false) {
    const schema = isUpdate ? updateTourPriceSchema : createTourPriceSchema;
    return schema.validate(data, { abortEarly: false });
}

module.exports = {
    validateTourPrice,
    createTourPriceSchema,
    updateTourPriceSchema
};