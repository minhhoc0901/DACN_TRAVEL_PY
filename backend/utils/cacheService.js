const NodeCache = require('node-cache');

/**
 * Khởi tạo một instance cache duy nhất cho toàn bộ ứng dụng.
 * stdTTL: 0 -> Dữ liệu sẽ không tự hết hạn. Chúng ta sẽ xóa nó một cách chủ động.
 * checkperiod: 120 -> Cứ 2 phút sẽ kiểm tra các key hết hạn (nếu có).
 */
const cache = new NodeCache({ stdTTL: 0, checkperiod: 120 });

console.log('Cache service has been initialized.');

module.exports = cache;