const qrcode = require('qrcode');
const { uploadToCloudinary } = require('./cloudinaryHelper');

/**
 * Tạo mã QR từ một token xác thực và trả về dưới dạng Data URL (base64).
 * @param {string} verificationToken - Token duy nhất của đơn hàng.
 * @returns {Promise<string>} - Một chuỗi Data URL (ví dụ: "data:image/png;base64,iVBORw0KGgo...") để nhúng vào PDF hoặc HTML.
 * @throws {Error} - Ném lỗi nếu không thể tạo mã QR.
 */
const generateQrCodeDataUrl = async (verificationToken) => {
    if (!verificationToken) {
        throw new Error('Verification token is required to generate a QR code.');
    }

    try {
        // Xây dựng URL đầy đủ mà mã QR sẽ trỏ tới.
        const verificationUrl = `${process.env.FRONTEND_URL}/verify-invoice/${verificationToken}`;
        
        // Chuyển URL thành một ảnh QR dạng Data URL.
        const qrCodeDataUrl = await qrcode.toDataURL(verificationUrl, {
            errorCorrectionLevel: 'H', // Mức độ sửa lỗi cao, giúp mã QR dễ đọc hơn ngay cả khi bị mờ hoặc xước nhẹ.
            margin: 2,
            color: {
                dark: '#000000', // Màu của các ô vuông QR
                light: '#FFFFFF', // Màu nền
            },
        });

        return qrCodeDataUrl;
    } catch (err) {
        console.error('Failed to generate QR code:', err);
        // Ném lại lỗi để hàm gọi nó có thể xử lý.
        throw new Error('Could not generate QR code.');
    }
};
/**
 * TẠO QR CODE VÀ LƯU VÀO SERVER (CHỈ DÙNG CHO EMAIL)
 * @returns {string} - HTTP URL của QR code image
 */
const generateQrCodeFile = async (verificationToken) => {
    if (!verificationToken) {
        throw new Error('Verification token is required to generate a QR code.');
    }

    try {
        const verificationUrl = `${process.env.FRONTEND_URL}/verify-invoice/${verificationToken}`;
        
        // TẠO QR CODE DƯỚI DẠNG BUFFER
        const qrBuffer = await qrcode.toBuffer(verificationUrl, {
            errorCorrectionLevel: 'H',
            margin: 2,
            width: 300,
            color: {
                dark: '#000000',
                light: '#FFFFFF',
            },
        });

        // --- CLOUDINARY UPLOAD ---
        const cloudResult = await uploadToCloudinary(qrBuffer, 'qr-codes');
        const qrUrl = cloudResult.url;
        
        console.log(`✅ [qrCodeGenerator] QR created and uploaded to Cloudinary: ${qrUrl}`);
        
        return qrUrl;
    } catch (err) {
        console.error('❌ Failed to generate QR code:', err);
        throw new Error('Could not generate QR code.');
    }
};

/**
 * XÓA QR CODE FILE CŨ (OPTIONAL - CLEAN UP)
 */
const deleteQrCodeFile = async (verificationToken) => {
    // Với Cloudinary, việc xóa QR code cũ có thể được xử lý qua public_id nếu cần.
    // Tạm thời để trống vì QR code thường không cần xóa ngay lập tức.
};

module.exports = {
    generateQrCodeDataUrl,  // Dùng cho PDF
    generateQrCodeFile,     // Dùng cho Email
    deleteQrCodeFile        // Cleanup
};