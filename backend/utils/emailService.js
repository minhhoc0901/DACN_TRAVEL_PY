const transporter = require('../config/emailConfig');

// Hàm gửi OTP
const sendOTPEmail = async (to, otp, username, isPasswordReset = false) => {
    try {
        const subject = isPasswordReset ? "Đặt lại mật khẩu - Phú Yên Travel" : "Xác thực email - Phú Yên Travel";
        const title = isPasswordReset ? "Đặt lại mật khẩu" : "Xác thực Email của bạn";
        const message = isPasswordReset 
            ? "Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn." 
            : "Cảm ơn bạn đã đăng ký tài khoản tại Phú Yên Travel.";

        await transporter.sendMail({
            from: `"Phú Yên Travel" <${process.env.EMAIL_USER}>`,
            to: to,
            subject: subject,
            html: `
                <div style="font-family: Arial, sans-serif; padding: 20px;">
                    <div style="max-width: 600px; margin: 0 auto; background: #f9f9f9; padding: 20px; border-radius: 10px;">
                        <h2 style="color: #0072bb;">${title}</h2>
                        <p style="margin: 15px 0;">
                            Xin chào ${username}! <br>
                            ${message}<br>
                            Vui lòng sử dụng mã OTP dưới đây:
                        </p>
                        <div style="background: #fff; padding: 15px; border-radius: 5px; text-align: center; margin: 20px 0;">
                            <h1 style="color: #0072bb; letter-spacing: 5px; margin: 0;">${otp}</h1>
                        </div>
                        <p style="color: #666; font-size: 14px;">
                            Mã này sẽ hết hạn sau 5 phút. 
                            Vui lòng không chia sẻ mã này với bất kỳ ai.
                        </p>
                    </div>
                </div>
            `
        });
        return true;
    } catch (error) {
        console.error('Send OTP email error:', error);
        return false;
    }
};

// Hàm gửi email liên hệ
const sendContactEmail = async (contactData, isAutoReply = false) => {
    try {
        if (isAutoReply) {
            // Gửi email phản hồi tự động cho người liên hệ
            await transporter.sendMail({
                from: `"Phú Yên Travel" <${process.env.EMAIL_USER}>`,
                to: contactData.email,
                subject: "Cảm ơn bạn đã liên hệ - Phú Yên Travel",
                html: `
                    <div style="font-family: Arial, sans-serif; padding: 20px;">
                        <h2>Xin chào ${contactData.name}!</h2>
                        <p>Cảm ơn bạn đã liên hệ với Phú Yên Travel. Chúng tôi đã nhận được tin nhắn của bạn và sẽ phản hồi sớm nhất có thể.</p>
                        <p><strong>Tiêu đề:</strong> ${contactData.subject}</p>
                        <p><strong>Nội dung:</strong> ${contactData.message}</p>
                        <p>Trân trọng,<br>Đội ngũ Phú Yên Travel</p>
                    </div>
                `
            });
        }

        // Gửi email thông báo cho admin
        await transporter.sendMail({
            from: `"Website Contact Form" <${process.env.EMAIL_USER}>`,
            to: process.env.ADMIN_EMAIL,
            subject: `[Contact Form] ${contactData.subject}`,
            html: `
                <div style="font-family: Arial, sans-serif; padding: 20px;">
                    <h2>Có liên hệ mới từ website</h2>
                    <p><strong>Họ tên:</strong> ${contactData.name}</p>
                    <p><strong>Email:</strong> ${contactData.email}</p>
                    <p><strong>Tiêu đề:</strong> ${contactData.subject}</p>
                    <p><strong>Nội dung:</strong></p>
                    <p>${contactData.message}</p>
                </div>
            `
        });

        return true;
    } catch (error) {
        console.error('Send contact email error:', error);
        return false;
    }
};

module.exports = { sendOTPEmail, sendContactEmail };