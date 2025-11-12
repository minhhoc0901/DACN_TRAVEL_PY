const cache = require('../utils/cacheService');

/**
 * Middleware để đọc dữ liệu từ cache cho các request GET.
 * Nếu có cache, trả về ngay.
 * Nếu không, nó sẽ "chặn" phản hồi để lưu vào cache trước khi gửi đi.
 */
function cacheMiddleware(req, res, next) {
    if (req.method !== 'GET') {
        return next();
    }

    const key = req.originalUrl;
    const cachedData = cache.get(key);

    if (cachedData) {
        console.log(`[CACHE HIT] Serving from cache: ${key}`);
        return res.status(200).json(cachedData);
    }

    const originalSend = res.send;
    res.send = function (body) {
        try {
            if (res.statusCode >= 200 && res.statusCode < 300) {
                console.log(`[CACHE SET] Caching data for: ${key}`);
                const dataToCache = JSON.parse(body);
                cache.set(key, dataToCache);
            }
        } catch (error) {
            // Bỏ qua nếu body không phải là JSON hợp lệ
        }
        originalSend.call(this, body);
    };

    next();
}

module.exports = cacheMiddleware;