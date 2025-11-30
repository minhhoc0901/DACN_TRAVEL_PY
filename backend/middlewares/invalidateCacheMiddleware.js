const cache = require('../utils/cacheService');

/**
 * Middleware TỰ ĐỘNG xóa cache liên quan sau khi một request (POST, PUT, DELETE) thành công.
 * @param {string | string[] | Function} prefixes - Một hoặc nhiều tiền tố của các key cần xóa.
 */
function invalidateCacheMiddleware(prefixes) {
    return (req, res, next) => {
        res.on('finish', () => {
            if (res.statusCode >= 200 && res.statusCode < 300) {
                const prefixesToDelete = Array.isArray(prefixes) ? prefixes : [prefixes];
                const allKeys = cache.keys();

                prefixesToDelete.forEach(prefix => {
                    const resolvedPrefix = typeof prefix === 'function' ? prefix(req) : prefix;
                    
                    const keysToDelete = allKeys.filter(k => k.startsWith(resolvedPrefix));
                    
                    if (keysToDelete.length > 0) {
                        cache.del(keysToDelete);
                        console.log(`[CACHE INVALIDATED] Automatically deleted ${keysToDelete.length} keys with prefix: ${resolvedPrefix}`);
                    }
                });
            }
        });

        next();
    };
}

module.exports = invalidateCacheMiddleware;