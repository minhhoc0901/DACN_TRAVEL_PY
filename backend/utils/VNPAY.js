const { VNPay } = require('vnpay');

/**
 * VNPAYService - Quản lý tích hợp VNPAY bằng thư viện chính thức
 * Sử dụng Singleton pattern để đảm bảo cấu hình nhất quán
 */
class VNPAYService {
    constructor() {
        // Kiểm tra các biến môi trường cần thiết
        if (!process.env.VNP_TMN_CODE || !process.env.VNP_HASH_SECRET) {
            throw new Error('VNPAY configuration (VNP_TMN_CODE, VNP_HASH_SECRET) is missing in .env file.');
        }

        // Khởi tạo VNPay instance với cấu hình từ .env
        this.vnpayInstance = new VNPay({
            tmnCode: process.env.VNP_TMN_CODE,
            secureSecret: process.env.VNP_HASH_SECRET, // Lưu ý: một số phiên bản dùng 'secureSecret' thay vì 'hashSecret'
            vnpayHost: process.env.VNP_PAYMENT_URL || 'https://sandbox.vnpayment.vn',
            testMode: true, // Sandbox mode
            enableLog: true, // Bật logging để debug
        });

        this.returnUrl = process.env.VNP_RETURN_URL;
        
        console.log('[VNPAYService] Initialized successfully with:');
        console.log('  TMN_CODE:', process.env.VNP_TMN_CODE);
        console.log('  HASH_SECRET length:', process.env.VNP_HASH_SECRET ? process.env.VNP_HASH_SECRET.length : 'undefined');
        console.log('  RETURN_URL:', this.returnUrl);
    }

    /**
     * Tạo URL thanh toán VNPAY
     * @param {string} ipAddr - Địa chỉ IP của người dùng
     * @param {object} paymentData - Dữ liệu thanh toán
     * @returns {string} URL thanh toán
     */
    createPaymentUrl(ipAddr, paymentData) {
        try {
            const paymentParams = {
                vnp_Amount: paymentData.amount,
                vnp_IpAddr: this.normalizeIp(ipAddr),
                vnp_TxnRef: paymentData.txnRef,
                vnp_OrderInfo: paymentData.orderInfo,
                vnp_OrderType: 'other',
                vnp_ReturnUrl: this.returnUrl,
                vnp_Locale: 'vn',
                vnp_CreateDate: this.getCurrentDateVnpay(),
                vnp_ExpireDate: this.getExpireDateVnpay(15), // Hết hạn sau 15 phút
            };

            // Thêm bankCode nếu có
            if (paymentData.bankCode) {
                paymentParams.vnp_BankCode = paymentData.bankCode;
            }

            console.log('[VNPAYService] Creating payment URL with params:', paymentParams);

            // Sử dụng thư viện để tạo URL
            const paymentUrl = this.vnpayInstance.buildPaymentUrl(paymentParams);

            console.log('[VNPAYService] Generated payment URL:', paymentUrl);
            return paymentUrl;

        } catch (error) {
            console.error('[VNPAYService] Error creating payment URL:', error);
            throw new Error(`Failed to create payment URL: ${error.message}`);
        }
    }

    /**
     * Xác thực chữ ký từ VNPAY callback
     * @param {object} query - Query parameters từ VNPAY callback
     * @returns {boolean} True nếu chữ ký hợp lệ
     */
    verifySignature(query) {
        try {
            console.log('[VNPAYService] Verifying signature for query:', Object.keys(query));
            
            // Sử dụng thư viện để verify
            const verifyResult = this.vnpayInstance.verifyReturnUrl(query);
            
            console.log('[VNPAYService] Verification result:', verifyResult);
            
            // Thư viện trả về object với isSuccess và isVerified
            return verifyResult.isSuccess || verifyResult.isVerified || false;

        } catch (error) {
            console.error('[VNPAYService] Error verifying signature:', error);
            return false;
        }
    }

    /**
     * Normalize IP address
     * @param {string} ip - Raw IP address
     * @returns {string} Normalized IP address
     */
    normalizeIp(ip) {
        if (!ip) return '127.0.0.1';
        if (ip.includes(',')) ip = ip.split(',')[0].trim();
        if (ip === '::1' || ip.startsWith('::ffff:')) return '127.0.0.1';
        return ip;
    }

    /**
     * Tạo chuỗi thời gian định dạng yyyyMMddHHmmss theo múi giờ Việt Nam
     * @returns {string} định dạng yyyyMMddHHmmss
     */
    getCurrentDateVnpay() {
        const date = new Date();
        return this.formatDateVnpay(date);
    }

    /**
     * Tạo chuỗi thời gian hết hạn sau N phút
     * @param {number} minutes 
     * @returns {string} định dạng yyyyMMddHHmmss
     */
    getExpireDateVnpay(minutes) {
        const date = new Date();
        date.setMinutes(date.getMinutes() + minutes);
        return this.formatDateVnpay(date);
    }

    /**
     * Helper định dạng Date sang yyyyMMddHHmmss
     */
    formatDateVnpay(date) {
        const pad = (n) => n.toString().padStart(2, '0');
        return date.getFullYear() +
            pad(date.getMonth() + 1) +
            pad(date.getDate()) +
            pad(date.getHours()) +
            pad(date.getMinutes()) +
            pad(date.getSeconds());
    }
}

// Export singleton instance
module.exports = new VNPAYService();