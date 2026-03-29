/**
 * ✅ MIDDLEWARE VALIDATION - SỬ DỤNG CHO TẤT CẢ ROUTES
 */

/**
 * Middleware validate request body
 * @param {Function} validatorFn - Hàm validator (trả về { error, value })
 */
function validate(validatorFn) {
    return (req, res, next) => {
        const { error, value } = validatorFn(req.body);
        
        if (error) {
            const errors = error.details.map(detail => ({
                field: detail.path.join('.'),
                message: detail.message
            }));
            
            return res.status(400).json({
                success: false,
                message: 'Dữ liệu không hợp lệ',
                errors
            });
        }
        
        // Ghi đè body bằng value đã được validate và sanitize
        req.body = value;
        next();
    };
}

/**
 * Middleware validate query params
 */
function validateQuery(schema) {
    return (req, res, next) => {
        const { error, value } = schema.validate(req.query, { abortEarly: false });
        
        if (error) {
            const errors = error.details.map(detail => ({
                field: detail.path.join('.'),
                message: detail.message
            }));
            
            return res.status(400).json({
                success: false,
                message: 'Query parameters không hợp lệ',
                errors
            });
        }
        
        req.query = value;
        next();
    };
}

/**
 * Middleware validate params (URL parameters)
 */
function validateParams(schema) {
    return (req, res, next) => {
        const { error, value } = schema.validate(req.params, { abortEarly: false });
        
        if (error) {
            const errors = error.details.map(detail => ({
                field: detail.path.join('.'),
                message: detail.message
            }));
            
            return res.status(400).json({
                success: false,
                message: 'URL parameters không hợp lệ',
                errors
            });
        }
        
        req.params = value;
        next();
    };
}

module.exports = {
    validate,
    validateQuery,
    validateParams
};