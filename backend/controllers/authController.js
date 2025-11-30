const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/user');
const jwtConfig = require('../config/jwt');
const { sendOTPEmail } = require('../utils/emailService');
const { pool } = require('../config/db'); 

exports.sendOTP = async (req, res) => {
    try {
        const { email, isPasswordReset } = req.body;
        
        // Kiểm tra email tồn tại
        const existingUser = await User.findByEmail(email);

        // Logic cho quên mật khẩu
        if (isPasswordReset) {
            if (!existingUser) {
                return res.status(400).json({
                    success: false,
                    message: 'Email không tồn tại trong hệ thống'
                });
            }
        } 
        // Logic cho đăng ký
        else {
            if (existingUser) {
                return res.status(400).json({
                    success: false,
                    message: 'Email đã được sử dụng'
                });
            }
        }

        // Tạo OTP ngẫu nhiên 6 số
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        
        // Lưu OTP vào database
        await User.saveOTP(email, otp);
        
        // Lấy username từ email hoặc từ user hiện có
        const username = existingUser ? existingUser.username : email.split('@')[0];
        
        // Gửi email
        const emailSent = await sendOTPEmail(email, otp, username, isPasswordReset);
        
        if (emailSent) {
            res.status(200).json({
                success: true,
                message: 'Mã OTP đã được gửi đến email của bạn'
            });
        } else {
            res.status(500).json({
                success: false,
                message: 'Không thể gửi mã OTP'
            });
        }
    } catch (error) {
        console.error('Send OTP error:', error);
        res.status(500).json({
            success: false,
            message: 'Đã xảy ra lỗi khi gửi mã OTP'
        });
    }
};

// exports.register = async (req, res) => {
//     try {
//         const { username, fullName, email, phone, password, otp } = req.body;

//         // Verify OTP
//         const isOTPValid = await User.verifyOTP(email, otp);
//         if (!isOTPValid) {
//             return res.status(400).json({
//                 success: false,
//                 message: 'Mã OTP không hợp lệ hoặc đã hết hạn'
//             });
//         }

//         if (!username || !email || !password) {
//             return res.status(400).json({ 
//                 success: false, 
//                 message: 'Vui lòng cung cấp đầy đủ thông tin bắt buộc' 
//             });
//         }

//         // Kiểm tra username đã tồn tại
//         const existingUsername = await User.findByUsername(username);
//         if (existingUsername) {
//             return res.status(400).json({
//                 success: false,
//                 message: 'Tên đăng nhập đã được sử dụng'
//             });
//         }

//         // Kiểm tra email đã tồn tại
//         const existingEmail = await User.findByEmail(email);
//         if (existingEmail) {
//             return res.status(400).json({
//                 success: false,
//                 message: 'Email đã được sử dụng'
//             });
//         }

//         const user = new User({
//             username,
//             fullName,
//             email,
//             phone,
//             password
//         });

//         const newUser = await user.register();

//         res.status(201).json({
//             success: true,
//             message: 'Đăng ký thành công',
//             data: newUser
//         });
//     } catch (error) {
//         console.error('Registration error:', error);
//         res.status(500).json({
//             success: false,
//             message: 'Đã xảy ra lỗi khi đăng ký',
//             error: error.message
//         });
//     }
// };

exports.register = async (req, res) => {
    try {
        const { username, fullName, email, phone, password, otp } = req.body;

        // ✅ LOG REQUEST DATA (để debug)
        console.log('[REGISTER] Request body:', {
            username,
            email,
            phone,
            hasPassword: !!password,
            hasOTP: !!otp,
            fullName
        });

        // ✅ VERIFY OTP
        const isOTPValid = await User.verifyOTP(email, otp);
        if (!isOTPValid) {
            console.log('[REGISTER] OTP verification failed for email:', email);
            return res.status(400).json({
                success: false,
                message: 'Mã OTP không hợp lệ hoặc đã hết hạn'
            });
        }

        // ✅ KIỂM TRA USERNAME ĐÃ TỒN TẠI
        const existingUsername = await User.findByUsername(username);
        if (existingUsername) {
            console.log('[REGISTER] Username already exists:', username);
            return res.status(400).json({
                success: false,
                message: 'Tên đăng nhập đã được sử dụng'
            });
        }

        // ✅ KIỂM TRA EMAIL ĐÃ TỒN TẠI
        const existingEmail = await User.findByEmail(email);
        if (existingEmail) {
            console.log('[REGISTER] Email already exists:', email);
            return res.status(400).json({
                success: false,
                message: 'Email đã được sử dụng'
            });
        }

        // ✅ TẠO USER MỚI
        const user = new User({
            username,
            fullName: fullName || username, // Default fullName = username nếu không có
            email,
            phone,
            password
        });

        const newUser = await user.register();

        console.log('[REGISTER] User created successfully:', newUser.id);

        res.status(201).json({
            success: true,
            message: 'Đăng ký thành công',
            data: {
                id: newUser.id,
                username: newUser.username,
                email: newUser.email,
                role: newUser.role
            }
        });
    } catch (error) {
        console.error('[REGISTER] Error:', error);
        res.status(500).json({
            success: false,
            message: 'Đã xảy ra lỗi khi đăng ký',
            error: error.message
        });
    }
};


exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Vui lòng cung cấp username và password'
      });
    }

    const user = await User.findByUsername(username); // Đảm bảo User.findByUsername lấy cả trường avatar
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Thông tin đăng nhập không chính xác'
      });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      return res.status(401).json({ 
        success: false, 
        message: 'Thông tin đăng nhập không chính xác'
      });
    }

    const token = jwt.sign(
      { 
        id: user.id, 
        role: user.role 
      },
      jwtConfig.secret,
      { 
        expiresIn: jwtConfig.expiresIn 
      }
    );

    res.status(200).json({
      success: true,
      message: 'Đăng nhập thành công',
      data: {
        id: user.id,
        username: user.username,
        email: user.email,
        fullName: user.full_name, // Hoặc user.fullName tùy theo model của bạn
        phone: user.phone,
        role: user.role,
        avatar: user.avatar // <<< THÊM DÒNG NÀY
      },
      token
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Đã xảy ra lỗi khi đăng nhập',
      error: error.message
    });
  }
};

exports.getProfile = async (req, res) => {
  try {
    // Lấy thông tin người dùng từ middleware auth
    const userId = req.user.id;
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'Không tìm thấy người dùng' 
      });
    }

    // Trả về thông tin user (không trả password)
    res.status(200).json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        fullName: user.full_name,
        phone: user.phone,
        role: user.role,
        avatar: user.avatar
      }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Đã xảy ra lỗi khi lấy thông tin người dùng',
      error: error.message
    });
  }
};

// Verify OTP for password reset
exports.verifyResetOTP = async (req, res) => {
    try {
        const { email, otp } = req.body;

        // Verify OTP
        const isValidOTP = await User.verifyOTP(email, otp);
        if (!isValidOTP) {
            return res.status(400).json({
                success: false,
                message: 'Mã OTP không hợp lệ hoặc đã hết hạn'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Xác thực OTP thành công'
        });
    } catch (error) {
        console.error('Verify reset OTP error:', error);
        res.status(500).json({
            success: false,
            message: 'Đã xảy ra lỗi khi xác thực OTP'
        });
    }
};

// Reset password
exports.resetPassword = async (req, res) => {
    try {
        const { email, otp, newPassword } = req.body;

        // Verify OTP
        const isValidOTP = await User.verifyOTP(email, otp);
        if (!isValidOTP) {
            return res.status(400).json({
                success: false,
                message: 'Mã OTP không hợp lệ hoặc đã hết hạn'
            });
        }

        // Get user by email
        const user = await User.findByEmail(email);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy người dùng'
            });
        }

        // Hash mật khẩu mới
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        // Update password và đánh dấu OTP đã sử dụng
        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();

            // Cập nhật mật khẩu
            await connection.execute(
                'UPDATE Users SET password_hash = ? WHERE id = ?',
                [hashedPassword, user.id]
            );

            // Đánh dấu OTP đã sử dụng
            await connection.execute(
                'UPDATE user_otps SET used = 1 WHERE email = ? AND otp = ?',
                [email, otp]
            );

            await connection.commit();

            res.status(200).json({
                success: true,
                message: 'Đặt lại mật khẩu thành công'
            });
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    } catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({
            success: false,
            message: 'Đã xảy ra lỗi khi đặt lại mật khẩu'
        });
    }
};