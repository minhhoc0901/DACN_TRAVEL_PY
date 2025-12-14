
const Chat = require('../models/chatWithAdmin');

// Lấy lịch sử chat (chủ yếu cho debug, vì app dùng socket)
exports.getConversation = async (req, res) => {
    try {
        const { userId1, userId2, limit } = req.query;
        const conversation = await Chat.getConversation(userId1, userId2, limit || 50);
        res.json({ success: true, conversation });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Lỗi lấy lịch sử chat', error: error.message });
    }
};

// Gửi tin nhắn (chủ yếu cho debug, vì app dùng socket)
exports.sendMessage = async (req, res) => {
    try {
        const { senderId, receiverId, message } = req.body;
        await Chat.saveMessage(senderId, receiverId, message);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Lỗi gửi tin nhắn', error: error.message });
    }
};
//  CẬP NHẬT: Lấy danh sách user đã chat với thông tin online/offline
exports.getChatUsers = async (req, res) => {
    try {
        const users = await Chat.getAllChatUsers();
        
        // ✅ THÊM: Lấy thông tin online từ Socket.IO
        const io = req.app.get('io');
        if (io && io.getOnlineUsers) {
            const onlineUserIds = io.getOnlineUsers();
            
            // Thêm trạng thái online vào mỗi user
            const usersWithStatus = users.map(user => ({
                ...user,
                isOnline: onlineUserIds.includes(user.id)
            }));
            
            res.json({ success: true, users: usersWithStatus });
        } else {
            // Fallback nếu không có Socket.IO
            const usersWithStatus = users.map(user => ({
                ...user,
                isOnline: false
            }));
            res.json({ success: true, users: usersWithStatus });
        }
    } catch (error) {
        res.status(500).json({ success: false, message: 'Lỗi lấy danh sách user chat', error: error.message });
    }
};

// Lấy danh sách user đã chat, kèm số lượng chưa đọc (cho trang admin)
exports.getChatUsers = async (req, res) => {
    try {
        const users = await Chat.getAllChatUsers();
        res.json({ success: true, users });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Lỗi lấy danh sách user chat', error: error.message });
    }
};

// Lấy ID của admin
exports.getAdminId = async (req, res) => {
    try {
        const adminId = await Chat.getAdminId();
        res.json({ success: true, adminId: adminId });
    } catch (error) {
        res.status(404).json({ success: false, message: 'Không tìm thấy admin', error: error.message });
    }
};

exports.uploadImage = (req, res) => {
    // Kiểm tra xem có file nào được gửi lên không
    if (!req.files || Object.keys(req.files).length === 0) {
        console.error('[Controller] Lỗi: Không có file nào được tải lên.');
        return res.status(400).json({ success: false, message: 'Không có file nào được tải lên.' });
    }

    console.log('[Controller] Đã nhận được file, đang xử lý...');

    // Xác định file hoặc mảng file cần xử lý
    // Ưu tiên 'images' (số nhiều) cho web, sau đó mới đến 'image' (số ít) cho mobile
    const filesToProcess = req.files.images || req.files.image;

    if (!filesToProcess) {
        console.error('[Controller] Lỗi: Field name của file không đúng (cần là "images" hoặc "image").');
        return res.status(400).json({ success: false, message: 'Field name của file không đúng.' });
    }

    // Đảm bảo filesToProcess luôn là một mảng để xử lý đồng nhất
    const imageFiles = Array.isArray(filesToProcess) ? filesToProcess : [filesToProcess];
    
    const uploadPromises = imageFiles.map(imageFile => {
        return new Promise((resolve, reject) => {
            // Tạo tên file và đường dẫn duy nhất
            const uploadPath = `uploads/chat_admin_images/${Date.now()}_${imageFile.name}`;
            
            // Di chuyển file vào thư mục uploads
            imageFile.mv(uploadPath, (err) => {
                if (err) {
                    console.error('[Controller] Lỗi khi di chuyển file:', err);
                    return reject(err);
                }
                // Resolve với đường dẫn tương đối, đúng cấu trúc database
                resolve(`/${uploadPath}`);
            });
        });
    });

    // Chờ tất cả các file được upload xong
    Promise.all(uploadPromises)
        .then(imageUrls => {
            console.log('[Controller] Upload thành công, các URL:', imageUrls);
            
            // Trả về response thành công
            // 'imageUrls' cho web, và 'url' cho mobile để tương thích ngược
            res.json({
                success: true,
                message: `Đã tải lên thành công ${imageUrls.length} ảnh.`,
                imageUrls: imageUrls, // Cho web
                url: imageUrls[0]      // Cho mobile (chỉ lấy ảnh đầu tiên)
            });
        })
        .catch(err => {
            console.error('[Controller] Lỗi trong quá trình xử lý nhiều file:', err);
            res.status(500).json({ success: false, message: 'Lỗi server khi upload file.' });
        });
};