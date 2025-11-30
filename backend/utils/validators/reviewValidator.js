const Joi = require('joi');

const createReviewSchema = Joi.object({
    tour_id: Joi.number()
        .integer()
        .required()
        .messages({
            'number.base': 'Tour ID phải là số',
            'any.required': 'Tour ID là bắt buộc'
        }),
    
    rating: Joi.number()
        .integer()
        .min(1)
        .max(5)
        .required()
        .messages({
            'number.base': 'Đánh giá phải là số',
            'number.min': 'Đánh giá phải từ 1 đến 5 sao',
            'number.max': 'Đánh giá phải từ 1 đến 5 sao',
            'any.required': 'Đánh giá là bắt buộc'
        }),
    
    comment: Joi.string()
        .max(1000)
        .required()
        .messages({
            'string.empty': 'Bình luận không được để trống',
            'string.max': 'Bình luận không được vượt quá 1000 ký tự',
            'any.required': 'Bình luận là bắt buộc'
        }),
    
    images: Joi.array()
        .items(Joi.string().uri())
        .max(5)
        .allow(null)
        .messages({
            'array.max': 'Tối đa 5 ảnh'
        })
});

function validateReview(data) {
    return createReviewSchema.validate(data, { abortEarly: false });
}

module.exports = {
    validateReview,
    createReviewSchema
};