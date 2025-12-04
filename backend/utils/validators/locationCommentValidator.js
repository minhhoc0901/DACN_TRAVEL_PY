const Joi = require('joi');

const createCommentSchema = Joi.object({
    location_id: Joi.number()
        .integer()
        .required()
        .messages({
            'number.base': 'Location ID phải là số',
            'any.required': 'Location ID là bắt buộc'
        }),
    
    comment: Joi.string()
        .max(1000)
        .required()
        .messages({
            'string.empty': 'Bình luận không được để trống',
            'string.max': 'Bình luận không được vượt quá 1000 ký tự',
            'any.required': 'Bình luận là bắt buộc'
        })
});

function validateComment(data) {
    return createCommentSchema.validate(data, { abortEarly: false });
}

module.exports = {
    validateComment,
    createCommentSchema
};