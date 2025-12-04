const Joi = require('joi');

const createTourDepartureSchema = Joi.object({
    tour_id: Joi.number()
        .integer()
        .required()
        .messages({
            'number.base': 'Tour ID phải là số',
            'any.required': 'Tour ID là bắt buộc'
        }),
    
    departure_date: Joi.date()
        .iso()
        .min('now')
        .required()
        .messages({
            'date.base': 'Ngày khởi hành không hợp lệ',
            'date.min': 'Ngày khởi hành phải là ngày trong tương lai',
            'any.required': 'Ngày khởi hành là bắt buộc'
        }),
    
    capacity: Joi.number()
        .integer()
        .min(1)
        .required()
        .messages({
            'number.base': 'Sức chứa phải là số',
            'number.integer': 'Sức chứa phải là số nguyên',
            'number.min': 'Sức chứa phải lớn hơn 0',
            'any.required': 'Sức chứa là bắt buộc'
        }),
    
    booked_slots: Joi.number()
        .integer()
        .min(0)
        .default(0)
        .messages({
            'number.min': 'Số chỗ đã đặt không được âm'
        }),
    
    status: Joi.string()
        .valid('available', 'full', 'cancelled')
        .default('available')
        .messages({
            'any.only': 'Trạng thái không hợp lệ'
        })
});

const updateTourDepartureSchema = createTourDepartureSchema.fork(
    ['tour_id', 'departure_date', 'capacity'],
    (schema) => schema.optional()
);

function validateTourDeparture(data, isUpdate = false) {
    const schema = isUpdate ? updateTourDepartureSchema : createTourDepartureSchema;
    return schema.validate(data, { abortEarly: false });
}

module.exports = {
    validateTourDeparture,
    createTourDepartureSchema,
    updateTourDepartureSchema
};