const Contact = require('../models/Contact');
const { sendContactEmail } = require('../utils/emailService');

exports.submitContact = async (req, res) => {
    try {
        const { name, email, subject, message } = req.body;

        // Validate input
        if (!name || !email || !subject || !message) {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng điền đầy đủ thông tin'
            });
        }

        // Lưu vào database
        const contact = new Contact({ name, email, subject, message });
        const contactId = await contact.save();

        // Gửi email
        await sendContactEmail({ name, email, subject, message }, true);

        res.status(200).json({
            success: true,
            message: 'Gửi liên hệ thành công',
            contactId
        });

    } catch (error) {
        console.error('Submit contact error:', error);
        res.status(500).json({
            success: false, 
            message: 'Có lỗi xảy ra khi gửi liên hệ',
            error: error.message
        });
    }
};

// Lấy danh sách tin nhắn liên hệ (cho admin)
exports.getContactMessages = async (req, res) => {
    try {
        const messages = await Contact.getAllMessages();
        res.status(200).json({
            success: true,
            data: messages
        });
    } catch (error) {
        console.error('Get messages error:', error);
        res.status(500).json({
            success: false,
            message: 'Có lỗi xảy ra khi lấy danh sách tin nhắn'
        });
    }
};