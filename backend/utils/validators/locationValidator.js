const Joi = require('joi');

// ✅ LOCATION SCHEMA - CẬP NHẬT VALIDATION
const locationSchema = Joi.object({
    name: Joi.string()
        .min(3)
        .max(255)
        .required()
        .messages({
            'string.min': 'Tên địa điểm phải có ít nhất 3 ký tự',
            'string.max': 'Tên địa điểm không được vượt quá 255 ký tự',
            'any.required': 'Tên địa điểm là bắt buộc'
        }),
    
    type: Joi.string()
        .valid('Bãi biển', 'Núi', 'Đồi', 'Di tích', 'Thiên nhiên', 'Văn hóa')
        .required()
        .messages({
            'any.only': 'Loại địa điểm không hợp lệ',
            'any.required': 'Loại địa điểm là bắt buộc'
        }),
    
    description: Joi.string()
        .min(10) // ✅ GIẢM TỐI THIỂU XUỐNG 10 KÝ TỰ
        .max(2000)
        .required()
        .messages({
            'string.min': 'Mô tả phải có ít nhất 10 ký tự',
            'string.max': 'Mô tả không được vượt quá 2000 ký tự',
            'any.required': 'Mô tả là bắt buộc'
        }),
    
    latitude: Joi.number()
        .min(-90)
        .max(90)
        .required()
        .messages({
            'number.base': 'Vĩ độ phải là số',
            'number.min': 'Vĩ độ phải từ -90 đến 90',
            'number.max': 'Vĩ độ phải từ -90 đến 90',
            'any.required': 'Vĩ độ là bắt buộc'
        }),
    
    longitude: Joi.number()
        .min(-180)
        .max(180)
        .required()
        .messages({
            'number.base': 'Kinh độ phải là số',
            'number.min': 'Kinh độ phải từ -180 đến 180',
            'number.max': 'Kinh độ phải từ -180 đến 180',
            'any.required': 'Kinh độ là bắt buộc'
        }),

    subtitle: Joi.string()
        .max(500)
        .optional()
        .allow('', null)
        .messages({
            'string.max': 'Phụ đề không được vượt quá 500 ký tự'
        }),

    introduction: Joi.string()
        .min(10) // ✅ GIẢM TỐI THIỂU
        .max(5000)
        .required()
        .messages({
            'string.min': 'Giới thiệu phải có ít nhất 10 ký tự',
            'string.max': 'Giới thiệu không được vượt quá 5000 ký tự',
            'any.required': 'Giới thiệu là bắt buộc'
        }),

    why_visit_architecture_title: Joi.string()
        .max(255)
        .optional()
        .allow('', null),

    why_visit_architecture_text: Joi.string()
        .min(10) // ✅ GIẢM TỐI THIỂU
        .max(2000)
        .optional()
        .allow('', null)
        .messages({
            'string.min': 'Mô tả kiến trúc phải có ít nhất 10 ký tự',
            'string.max': 'Mô tả kiến trúc không được vượt quá 2000 ký tự'
        }),

    why_visit_culture: Joi.string()
        .min(10) // ✅ GIẢM TỐI THIỂU
        .max(2000)
        .optional()
        .allow('', null)
        .messages({
            'string.min': 'Mô tả văn hóa phải có ít nhất 10 ký tự',
            'string.max': 'Mô tả văn hóa không được vượt quá 2000 ký tự'
        }),

    ticket_price: Joi.string()
        .max(255)
        .optional()
        .allow('', null),

    tip: Joi.string()
        .max(1000)
        .optional()
        .allow('', null),

    // ✅ BEST TIMES - CHO PHÉP MẢNG RỖNG
    bestTimes: Joi.array()
        .items(
            Joi.string()
                .min(3) // ✅ GIẢM TỐI THIỂU
                .max(500)
                .messages({
                    'string.min': 'Mỗi thời điểm phải có ít nhất 3 ký tự',
                    'string.max': 'Mỗi thời điểm không được vượt quá 500 ký tự'
                })
        )
        .min(0) // ✅ CHO PHÉP MẢNG RỖNG
        .optional()
        .messages({
            'array.base': 'Thời điểm tốt nhất phải là mảng',
            'array.min': 'Phải có ít nhất 1 thời điểm'
        }),

    // ✅ TRAVEL METHODS - CHO PHÉP MẢNG RỖNG
    travelMethods: Joi.object({
        fromTuyHoa: Joi.array()
            .items(
                Joi.string()
                    .min(3) // ✅ GIẢM TỐI THIỂU
                    .max(500)
                    .messages({
                        'string.min': 'Mỗi phương thức phải có ít nhất 3 ký tự',
                        'string.max': 'Mỗi phương thức không được vượt quá 500 ký tự'
                    })
            )
            .min(0) // ✅ CHO PHÉP MẢNG RỖNG
            .optional(),
        fromElsewhere: Joi.array()
            .items(
                Joi.string()
                    .min(3) // ✅ GIẢM TỐI THIỂU
                    .max(500)
            )
            .min(0) // ✅ CHO PHÉP MẢNG RỖNG
            .optional()
    }).optional(),

    // ✅ EXPERIENCES - CHO PHÉP MẢNG RỖNG
    experiences: Joi.array()
        .items(
            Joi.object({
                text: Joi.string()
                    .min(3) // ✅ GIẢM TỐI THIỂU
                    .max(1000)
                    .required()
                    .messages({
                        'string.min': 'Nội dung trải nghiệm phải có ít nhất 3 ký tự',
                        'any.required': 'Nội dung trải nghiệm là bắt buộc'
                    })
            })
        )
        .min(0) // ✅ CHO PHÉP MẢNG RỖNG
        .optional(),

    // ✅ CUISINES - CHO PHÉP MẢNG RỖNG
    cuisines: Joi.array()
        .items(
            Joi.object({
                text: Joi.string()
                    .min(3) // ✅ GIẢM TỐI THIỂU
                    .max(1000)
                    .required()
            })
        )
        .min(0) // ✅ CHO PHÉP MẢNG RỖNG
        .optional(),

    // ✅ TIPS - CHO PHÉP MẢNG RỖNG
    tips: Joi.array()
        .items(
            Joi.string()
                .min(3) // ✅ GIẢM TỐI THIỂU
                .max(500)
                .messages({
                    'string.min': 'Mỗi lưu ý phải có ít nhất 3 ký tự',
                    'string.max': 'Mỗi lưu ý không được vượt quá 500 ký tú'
                })
        )
        .min(0) // ✅ CHO PHÉP MẢNG RỖNG
        .optional(),

    nearby: Joi.array()
        .items(Joi.number().integer())
        .optional(),

    hotel_ids: Joi.array()
        .items(Joi.number().integer())
        .optional()
});

// ✅ VALIDATION FUNCTION
function validateLocation(data) {
    return locationSchema.validate(data, { 
        abortEarly: false,
        stripUnknown: true // ✅ BỎ QUA CÁC TRƯỜNG KHÔNG ĐƯỢC ĐỊNH NGHĨA
    });
}

module.exports = {
    validateLocation,
    locationSchema
};