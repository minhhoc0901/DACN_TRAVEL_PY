const Joi = require('joi');

const createTourSchema = Joi.object({
    destination: Joi.string()
        .max(500)
        .required()
        .messages({
            'string.empty': 'Điểm đến không được để trống',
            'any.required': 'Điểm đến là bắt buộc'
        }),
    
    departure_from: Joi.string()
        .max(255)
        .required()
        .messages({
            'string.empty': 'Điểm khởi hành không được để trống',
            'any.required': 'Điểm khởi hành là bắt buộc'
        }),
    
    duration: Joi.string()
        .pattern(/^\d+ ngày \d+ đêm$/)
        .required()
        .messages({
            'string.pattern.base': 'Thời gian phải có định dạng "X ngày Y đêm"',
            'any.required': 'Thời gian là bắt buộc'
        }),
    
    description: Joi.string()
        .max(2000)
        .required()
        .messages({
            'string.max': 'Mô tả không được vượt quá 2000 ký tự',
            'any.required': 'Mô tả là bắt buộc'
        }),
    
    image: Joi.string()
        .uri()
        .allow('', null),
    
    schedule: Joi.array()
        .items(
            Joi.object({
                day: Joi.string().required(),
                title: Joi.string().required(),
                activities: Joi.array().items(Joi.string()).min(1).required()
            })
        )
        .min(1)
        .required()
        .messages({
            'array.min': 'Lịch trình phải có ít nhất 1 ngày'
        }),
    
    highlights: Joi.array()
        .items(Joi.string())
        .allow(null),
    
    includes: Joi.array()
        .items(Joi.string())
        .allow(null),
    
    excludes: Joi.array()
        .items(Joi.string())
        .allow(null),
    
    notes: Joi.array()
        .items(Joi.string())
        .allow(null),
    
    selected_location_ids: Joi.array()
        .items(Joi.number().integer())
        .min(1)
        .required()
        .messages({
            'array.min': 'Phải chọn ít nhất 1 địa điểm'
        }),
    
    status: Joi.string()
        .valid('pending', 'approved', 'rejected')
        .default('pending'),
    
    is_active: Joi.boolean()
        .default(true)
});

const updateTourSchema = createTourSchema.fork(
    Object.keys(createTourSchema.describe().keys),
    (schema) => schema.optional()
);

function validateTour(data, isUpdate = false) {
    const schema = isUpdate ? updateTourSchema : createTourSchema;
    return schema.validate(data, { abortEarly: false });
}

module.exports = {
    validateTour,
    createTourSchema,
    updateTourSchema
};