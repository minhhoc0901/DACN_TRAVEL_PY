const User = require('../models/user');
const bcrypt = require('bcryptjs');
const path = require('path');
const fs = require('fs');
const { validateUpdateProfile, validateChangePassword } = require('../utils/validators/authValidator');
const sanitizers = require('../utils/validators/sanitizers');
const { uploadToCloudinary, removeFromCloudinary, getPublicIdFromUrl } = require('../utils/cloudinaryHelper');

// Lấy danh sách tất cả người dùng (chỉ admin)
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.findAll();
    
    res.status(200).json({
      success: true,
      data: users
    });
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Đã xảy ra lỗi khi lấy danh sách người dùng',
      error: error.message
    });
  }
};

// Lấy thông tin một người dùng (admin hoặc chính người dùng đó)
exports.getUserById = async (req, res) => {
  try {
    const userId = req.params.id;
    
    // Kiểm tra quyền: chỉ admin hoặc chính người dùng đó mới xem được
    if (req.user.role !== 'admin' && req.user.id !== parseInt(userId)) {
      return res.status(403).json({ 
        success: false, 
        message: 'Bạn không có quyền truy cập thông tin này'
      });
    }
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'Không tìm thấy thông tin người dùng'
      });
    }

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Get user by ID error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Đã xảy ra lỗi khi lấy thông tin người dùng',
      error: error.message
    });
  }
};

/**
 * ✅ UPDATE USER PROFILE WITH VALIDATION
 * Route: PUT /api/users/:id
 */
exports.updateUser = async (req, res) => {
    try {
        const userId = req.params.id;
        const { fullName, email, phone } = req.body;

        console.log(`[updateUser] Request from user ${req.user.id} to update user ${userId}`);

        // 🔹 BƯỚC 1: CHECK PERMISSION
        if (req.user.id !== parseInt(userId) && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Bạn không có quyền cập nhật thông tin này'
            });
        }

        // 🔹 BƯỚC 2: SANITIZE INPUT
        const sanitizedData = sanitizers.sanitizeProfileData(req.body);

        // 🔹 BƯỚC 3: VALIDATE
        const { error } = validateUpdateProfile(sanitizedData);
        
        if (error) {
            const errors = {};
            error.details.forEach(detail => {
                const key = detail.path[0];
                if (!errors[key]) {
                    errors[key] = [];
                }
                errors[key].push(detail.message);
            });

            return res.status(400).json({
                success: false,
                message: 'Dữ liệu không hợp lệ',
                errors
            });
        }

        // 🔹 BƯỚC 4: CHECK EXISTING EMAIL (nếu thay đổi email)
        if (sanitizedData.email) {
            const User = require('../models/user');
            const existingEmail = await User.findByEmail(sanitizedData.email);
            
            if (existingEmail && existingEmail.id !== parseInt(userId)) {
                return res.status(400).json({
                    success: false,
                    message: 'Email đã được sử dụng',
                    errors: { email: ['Email đã được đăng ký bởi tài khoản khác'] }
                });
            }
        }

        // 🔹 BƯỚC 5: UPDATE USER
        const User = require('../models/user');
        const updated = await User.updateUser(userId, {
            fullName: sanitizedData.fullName,
            email: sanitizedData.email,
            phone: sanitizedData.phone
        });

        if (updated) {
            const user = await User.findById(userId);
            
            res.status(200).json({
                success: true,
                message: 'Cập nhật thông tin thành công',
                data: {
                    id: user.id,
                    username: user.username,
                    fullName: user.full_name,
                    email: user.email,
                    phone: user.phone,
                    role: user.role,
                    avatar: user.avatar
                }
            });
        } else {
            res.status(400).json({
                success: false,
                message: 'Không thể cập nhật thông tin'
            });
        }
    } catch (error) {
        console.error('[UPDATE USER] Error:', error);
        res.status(500).json({
            success: false,
            message: 'Đã xảy ra lỗi khi cập nhật thông tin',
            error: error.message
        });
    }
};

/**
 * ✅ CHANGE PASSWORD WITH VALIDATION
 * Route: PUT /api/users/:id/change-password
 */
exports.changePassword = async (req, res) => {
    try {
        const userId = req.params.id;
        const { currentPassword, newPassword, confirmPassword } = req.body;

        console.log(`[changePassword] Request from user ${req.user.id} to change password for user ${userId}`);

        // 🔹 BƯỚC 1: CHECK PERMISSION
        if (req.user.id !== parseInt(userId)) {
            return res.status(403).json({
                success: false,
                message: 'Bạn không có quyền thay đổi mật khẩu này'
            });
        }

        // 🔹 BƯỚC 2: VALIDATE INPUT
        const { error } = validateChangePassword({ currentPassword, newPassword, confirmPassword });
        
        if (error) {
            const errors = {};
            error.details.forEach(detail => {
                const key = detail.path[0];
                if (!errors[key]) {
                    errors[key] = [];
                }
                errors[key].push(detail.message);
            });

            return res.status(400).json({
                success: false,
                message: 'Dữ liệu không hợp lệ',
                errors
            });
        }

        // 🔹 BƯỚC 3: FIND USER
        const User = require('../models/user');
        const user = await User.findById(userId);
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy người dùng'
            });
        }

        // 🔹 BƯỚC 4: VERIFY CURRENT PASSWORD
        const bcrypt = require('bcryptjs');
        const isValidPassword = await bcrypt.compare(currentPassword, user.password_hash);
        
        if (!isValidPassword) {
            return res.status(400).json({
                success: false,
                message: 'Mật khẩu hiện tại không đúng',
                errors: { currentPassword: ['Mật khẩu hiện tại không đúng'] }
            });
        }

        // 🔹 BƯỚC 5: UPDATE PASSWORD
        const updated = await User.updateUser(userId, { password: newPassword });

        if (updated) {
            res.status(200).json({
                success: true,
                message: 'Đổi mật khẩu thành công'
            });
        } else {
            res.status(400).json({
                success: false,
                message: 'Không thể đổi mật khẩu'
            });
        }
    } catch (error) {
        console.error('[CHANGE PASSWORD] Error:', error);
        res.status(500).json({
            success: false,
            message: 'Đã xảy ra lỗi khi đổi mật khẩu',
            error: error.message
        });
    }
};

// Xóa người dùng (chỉ admin)
exports.deleteUser = async (req, res) => {
  try {
    const userId = req.params.id;
    
    // Kiểm tra người dùng tồn tại
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'Không tìm thấy thông tin người dùng'
      });
    }
    
    // Không thể tự xóa tài khoản của mình
    if (req.user.id === parseInt(userId)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Không thể xóa tài khoản của chính mình'
      });
    }
    
    // Xóa người dùng
    const deleted = await User.deleteUser(userId);
    
    if (deleted) {
      res.status(200).json({
        success: true,
        message: 'Xóa người dùng thành công'
      });
    } else {
      res.status(400).json({
        success: false,
        message: 'Xóa người dùng thất bại'
      });
    }
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Đã xảy ra lỗi khi xóa người dùng',
      error: error.message
    });
  }
};

// Cập nhật role của người dùng
exports.updateUserRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!['user', 'admin'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Role không hợp lệ'
      });
    }

    const updated = await User.updateUser(id, { role });

    if (updated) {
      res.status(200).json({
        success: true,
        message: 'Cập nhật role thành công'
      });
    } else {
      res.status(400).json({
        success: false,
        message: 'Cập nhật role thất bại'
      });
    }
  } catch (error) {
    console.error('Update role error:', error);
    res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi cập nhật role',
      error: error.message
    });
  }
};

// Thêm controller mới để xử lý upload avatar
exports.uploadAvatar = async (req, res) => {
  try {
    const userId = req.params.id;

    // Kiểm tra quyền: chỉ có thể cập nhật avatar của chính mình
    if (!req.user || req.user.id === undefined) {
        return res.status(401).json({
            success: false,
            message: 'Người dùng không xác thực hoặc thiếu thông tin người dùng.'
        });
    }
    
    if (req.user.id !== parseInt(userId)) {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền cập nhật ảnh đại diện này'
      });
    }

    // Kiểm tra có file được tải lên không
    if (!req.files || Object.keys(req.files).length === 0 || !req.files.avatar) {
      return res.status(400).json({
        success: false,
        message: 'Không có file ảnh được tải lên hoặc tên trường không phải là "avatar"'
      });
    }

    const avatarFile = req.files.avatar;

    // Kiểm tra định dạng file
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];
    if (!allowedTypes.includes(avatarFile.mimetype)) {
      return res.status(400).json({
        success: false,
        message: 'Chỉ chấp nhận file ảnh định dạng JPG, JPEG hoặc PNG'
      });
    }

    // Kiểm tra kích thước file (giới hạn 2MB)
    if (avatarFile.size > 2 * 1024 * 1024) {
      return res.status(400).json({
        success: false,
        message: 'Kích thước file không được vượt quá 2MB'
      });
    }

    // Lấy thông tin user để kiểm tra avatar cũ
    const user = await User.findById(userId);
    if (!user) {
        return res.status(404).json({
            success: false,
            message: 'Không tìm thấy người dùng'
        });
    }

    // --- CLOUDINARY UPLOAD ---
    const cloudResult = await uploadToCloudinary(avatarFile.data, 'avatars');
    const avatarUrl = cloudResult.url;

    // Kiểm tra và xóa avatar cũ trên Cloudinary (nếu có)
    if (user.avatar && user.avatar.includes('cloudinary')) {
      const publicId = getPublicIdFromUrl(user.avatar);
      if (publicId) {
        await removeFromCloudinary(publicId);
      }
    }

    // Cập nhật đường dẫn avatar trong database
    const updated = await User.updateUser(userId, { avatar: avatarUrl });
    if (!updated) {
        // Nếu cập nhật DB thất bại, xóa ảnh vừa upload lên Cloudinary
        await removeFromCloudinary(cloudResult.public_id);
        return res.status(500).json({
            success: false,
            message: 'Không thể cập nhật thông tin avatar trong cơ sở dữ liệu.'
        });
    }
    
    res.status(200).json({
      success: true,
      message: 'Cập nhật ảnh đại diện thành công',
      avatarUrl
    });
  } catch (error) {
    console.error('Upload avatar error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi tải lên ảnh đại diện',
      error: error.message
    });
  }
};