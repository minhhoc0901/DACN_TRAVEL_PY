const Joi = require('joi');

const createHotelSchema = Joi.object({
    name: Joi.string()
        .max(255)
        .required()
        .messages({
            'string.empty': 'Tên khách sạn không được để trống',
            'string.max': 'Tên khách sạn không được vượt quá 255 ký tự',
            'any.required': 'Tên khách sạn là bắt buộc'
        }),
    
    address: Joi.string()
        .max(500)
        .required()
        .messages({
            'string.empty': 'Địa chỉ không được để trống',
            'string.max': 'Địa chỉ không được vượt quá 500 ký tự',
            'any.required': 'Địa chỉ là bắt buộc'
        }),
    
    rating: Joi.number()
        .min(0)
        .max(5)
        .default(0)
        .messages({
            'number.min': 'Đánh giá phải từ 0 đến 5',
            'number.max': 'Đánh giá phải từ 0 đến 5'
        }),
    
    description: Joi.string()
        .max(2000)
        .allow('', null)
        .messages({
            'string.max': 'Mô tả không được vượt quá 2000 ký tự'
        }),
    
    phone: Joi.string()
        .pattern(/^[0-9]{10,11}$/)
        .allow('', null)
        .messages({
            'string.pattern.base': 'Số điện thoại phải có 10-11 chữ số'
        }),
    
    email: Joi.string()
        .email()
        .allow('', null)
        .messages({
            'string.email': 'Email không hợp lệ'
        }),
    
    website: Joi.string()
        .uri()
        .allow('', null)
        .messages({
            'string.uri': 'Website không hợp lệ'
        }),
    
    image: Joi.string()
        .uri()
        .allow('', null),
    
    amenities: Joi.array()
        .items(Joi.string())
        .allow(null),
    
    location_id: Joi.number()
        .integer()
        .allow(null)
        .messages({
            'number.base': 'Location ID phải là số'
        }),
    
    is_active: Joi.boolean()
        .default(true)
});

const updateHotelSchema = createHotelSchema.fork(
    ['name', 'address'],
    (schema) => schema.optional()
);

function validateHotel(data, isUpdate = false) {
    const schema = isUpdate ? updateHotelSchema : createHotelSchema;
    return schema.validate(data, { abortEarly: false });
}

module.exports = {
    validateHotel,
    createHotelSchema,
    updateHotelSchema
};