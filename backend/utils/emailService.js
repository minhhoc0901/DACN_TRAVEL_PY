const transporter = require('../config/emailConfig');
const { generateQrCodeFile } = require('./qrCodeGenerator');

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

/**
 * GỬI EMAIL XÁC NHẬN ĐẶT TOUR VỚI QR CODE (HTTP URL)
 */
const sendBookingConfirmation = async (to, bookingData) => {
    try {
        const {
            id,
            tour_name,
            final_amount,
            contact_name,
            contact_email,
            contact_phone,
            departure_date,
            end_date,
            verification_token, 
            promotion_code, 
            BookingDetails 
        } = bookingData;

        // TẠO QR CODE VÀ LƯU VÀO SERVER
        let qrCodeUrl = null;
        
        if (verification_token) {
            try {
                qrCodeUrl = await generateQrCodeFile(verification_token);
                console.log(`✅ [emailService] QR file created for booking #${id}: ${qrCodeUrl}`);
            } catch (qrError) {
                console.error(`❌ [emailService] QR generation failed for booking #${id}:`, qrError);
            }
        } else {
            console.warn(`⚠️ [emailService] No verification_token for booking #${id} - QR code skipped`);
        }

        // FORMAT CURRENCY
        const formatCurrency = (value) => {
            return new Intl.NumberFormat('vi-VN', {
                style: 'currency',
                currency: 'VND',
                minimumFractionDigits: 0
            }).format(value || 0);
        };

        const formattedAmount = formatCurrency(final_amount);

        // FORMAT DATE
        const formatDate = (dateString) => {
            if (!dateString) return 'N/A';
            return new Date(dateString).toLocaleDateString('vi-VN', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
            });
        };

        const formattedDepartureDate = formatDate(departure_date);
        const formattedEndDate = formatDate(end_date);

        await transporter.sendMail({
            from: `"Phú Yên Travel" <${process.env.EMAIL_USER}>`,
            to: to,
            subject: `Xác nhận đặt tour #${id} - Phú Yên Travel`,
            html: `
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="UTF-8">
                    <style>
                        body {
                            font-family: 'Segoe UI', Arial, sans-serif;
                            line-height: 1.6;
                            color: #333;
                            max-width: 600px;
                            margin: 0 auto;
                            background: #f5f5f5;
                        }
                        .header {
                            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                            color: white;
                            padding: 30px 20px;
                            text-align: center;
                            border-radius: 8px 8px 0 0;
                        }
                        .header h1 {
                            margin: 0;
                            font-size: 24px;
                        }
                        .content {
                            background: white;
                            padding: 30px 20px;
                        }
                        .booking-details {
                            background: #f9f9f9;
                            padding: 20px;
                            border-radius: 8px;
                            margin: 20px 0;
                        }
                        .booking-details h3 {
                            margin-top: 0;
                            color: #667eea;
                            border-bottom: 2px solid #667eea;
                            padding-bottom: 10px;
                        }
                        .detail-row {
                            display: flex;
                            justify-content: space-between;
                            padding: 10px 0;
                            border-bottom: 1px solid #eee;
                        }
                        .detail-row:last-child {
                            border-bottom: none;
                        }
                        .detail-label {
                            font-weight: 600;
                            color: #666;
                        }
                        .detail-value {
                            color: #333;
                        }
                        .qr-section {
                            text-align: center;
                            padding: 20px;
                            background: #f9f9f9;
                            border-radius: 8px;
                            margin: 20px 0;
                        }
                        .qr-section img {
                            max-width: 200px;
                            height: auto;
                            border: 4px solid #667eea;
                            border-radius: 8px;
                            padding: 10px;
                            background: white;
                        }
                        .total {
                            background: #fff3cd;
                            padding: 15px;
                            border-radius: 8px;
                            margin-top: 20px;
                            text-align: center;
                        }
                        .total-amount {
                            font-size: 28px;
                            font-weight: 700;
                            color: #d9534f;
                            margin: 10px 0;
                        }
                        .footer {
                            background: #333;
                            color: white;
                            padding: 20px;
                            text-align: center;
                            border-radius: 0 0 8px 8px;
                            font-size: 14px;
                        }
                        .btn {
                            display: inline-block;
                            padding: 12px 30px;
                            background: #667eea;
                            color: white;
                            text-decoration: none;
                            border-radius: 8px;
                            margin: 20px 0;
                            font-weight: 600;
                        }
                        .info-box {
                            background: #e7f3ff;
                            padding: 15px;
                            border-radius: 8px;
                            margin-top: 20px;
                        }
                    </style>
                </head>
                <body>
                    <div class="header">
                        <h1>Đặt Tour Thành Công!</h1>
                    </div>
                    
                    <div class="content">
                        <p>Xin chào <strong>${contact_name}</strong>,</p>
                        
                        <p>Chúng tôi đã nhận được yêu cầu đặt tour của bạn. Dưới đây là thông tin chi tiết:</p>
                        
                        <div class="booking-details">
                            <h3>📋 Thông Tin Đặt Tour</h3>
                            
                            <div class="detail-row">
                                <span class="detail-label">Mã đặt tour:</span>
                                <span class="detail-value"><strong>#${id}</strong></span>
                            </div>
                            
                            <div class="detail-row">
                                <span class="detail-label">Tour:</span>
                                <span class="detail-value">${tour_name}</span>
                            </div>
                            
                            <div class="detail-row">
                                <span class="detail-label">Ngày khởi hành:</span>
                                <span class="detail-value">${formattedDepartureDate}</span>
                            </div>
                            
                            ${end_date ? `
                            <div class="detail-row">
                                <span class="detail-label">Ngày kết thúc:</span>
                                <span class="detail-value">${formattedEndDate}</span>
                            </div>
                            ` : ''}
                            
                            <div class="detail-row">
                                <span class="detail-label">Người đặt:</span>
                                <span class="detail-value">${contact_name}</span>
                            </div>
                            
                            <div class="detail-row">
                                <span class="detail-label">Email:</span>
                                <span class="detail-value">${contact_email}</span>
                            </div>
                            
                            ${contact_phone ? `
                            <div class="detail-row">
                                <span class="detail-label">Điện thoại:</span>
                                <span class="detail-value">${contact_phone}</span>
                            </div>
                            ` : ''}
                        </div>

                        ${promotion_code ? `
                        <div style="background: #e7f3ff; padding: 12px; border-radius: 8px; margin: 15px 0;">
                            <div class="detail-row" style="border: none;">
                                <span class="detail-label">🎁 Mã khuyến mãi:</span>
                                <span class="detail-value"><strong style="color: #667eea;">${promotion_code}</strong></span>
                            </div>
                        </div>
                        ` : ''}

                        ${BookingDetails && BookingDetails.length > 0 ? `
                        <div class="booking-details">
                            <h3>🎫 Chi tiết vé</h3>
                            ${BookingDetails.map(detail => `
                                <div class="detail-row">
                                    <span class="detail-label">
                                        ${detail.price_type === 'adult' ? '👤 Người lớn' : '👶 Trẻ em'}
                                    </span>
                                    <span class="detail-value">
                                        <strong>${detail.quantity}</strong> x ${formatCurrency(detail.unit_price)}
                                    </span>
                                </div>
                            `).join('')}
                        </div>
                        ` : ''}
                        
                        <div class="total">
                            <div style="font-size: 16px; color: #666;">💰 Tổng thanh toán</div>
                            <div class="total-amount">${formattedAmount}</div>
                        </div>

                        ${qrCodeUrl ? `
                        <div class="qr-section">
                            <h3 style="color: #667eea; margin-bottom: 15px;">📱 Mã QR Xác Thực</h3>
                            <p style="color: #666; font-size: 14px; margin-bottom: 15px;">
                                Sử dụng mã QR này để check-in khi bắt đầu tour
                            </p>
                            <img src="${qrCodeUrl}" alt="QR Code" style="max-width: 200px; height: auto; border: 4px solid #667eea; border-radius: 8px; padding: 10px; background: white;" />
                            <p style="color: #999; font-size: 12px; margin-top: 10px;">
                                Vui lòng lưu mã QR này hoặc xuất trình email khi tham gia tour
                            </p>
                        </div>
                        ` : `
                        <div style="background: #fff3cd; padding: 15px; border-radius: 8px; margin: 20px 0; text-align: center;">
                            <p style="margin: 0; color: #856404;">
                                ⚠️ Mã QR xác thực sẽ được gửi sau. Vui lòng kiểm tra email hoặc mục "Đơn hàng của tôi"
                            </p>
                        </div>
                        `}
                        
                        <div style="text-align: center;">
                            <a href="${process.env.FRONTEND_URL}/profile/my-bookings" class="btn">
                                📋 Xem Chi Tiết Đặt Tour
                            </a>
                        </div>

                        <div class="info-box">
                            <strong>📌 Lưu ý quan trọng:</strong>
                            <ul style="margin: 10px 0; padding-left: 20px;">
                                <li>Vui lòng mang theo <strong>CMND/CCCD</strong> khi tham gia tour</li>
                                <li>Có mặt <strong>trước 30 phút</strong> so với giờ khởi hành</li>
                                <li>Thanh toán trong vòng <strong>15 phút</strong> để giữ chỗ</li>
                                <li>Liên hệ hotline <strong>1900 xxxx</strong> nếu cần hỗ trợ</li>
                            </ul>
                        </div>
                    </div>
                    
                    <div class="footer">
                        <p><strong>CÔNG TY DU LỊCH PHÚ YÊN TRAVEL</strong></p>
                        <p>📞 Hotline: 1900 xxxx | 📧 Email: ${process.env.EMAIL_USER}</p>
                        <p>🌐 Website: ${process.env.FRONTEND_URL}</p>
                        <p style="margin-top: 15px; font-size: 12px; color: #999;">
                            © ${new Date().getFullYear()} Phú Yên Travel. All rights reserved.
                        </p>
                    </div>
                </body>
                </html>
            `
        });

        console.log(`✅ [emailService] Booking confirmation sent to ${to} (QR: ${qrCodeUrl ? 'YES' : 'NO'})`);
        return true;
    } catch (error) {
        console.error('❌ [emailService] Send booking confirmation error:', error);
        return false;
    }
};

module.exports = {
    sendOTPEmail,
    sendContactEmail,
    sendBookingConfirmation 
};