const Promotion = require('../models/Promotions');

// ===== LIST ACTIVE =====
exports.listActive = async (req, res) => {
    try {
        const data = await Promotion.listActive();
        res.json({ success: true, data });
    } catch (e) {
        res.status(500).json({ success: false, message: e.message });
    }
};

// ===== LIST ALL (ADMIN) =====
exports.listAll = async (req, res) => {
    try {
        const data = await Promotion.listAll();
        res.json({ success: true, data });
    } catch (e) {
        res.status(e.message === 'FORBIDDEN' ? 403 : 500).json({ success: false, message: e.message });
    }
};

// ===== GET ONE =====
exports.getOne = async (req, res) => {
    try {
        const item = await Promotion.findById(req.params.id);
        if (!item) return res.status(404).json({ success: false, message: 'Not found' });
        res.json({ success: true, data: item });
    } catch (e) {
        res.status(e.message === 'FORBIDDEN' ? 403 : 500).json({ success: false, message: e.message });
    }
};

// ===== CREATE =====
exports.create = async (req, res) => {
    try {
        // ✅ req.body đã được validate bởi middleware, dùng trực tiếp
        const payload = req.body;
        
        // ✅ Kiểm tra business logic (code trùng)
        const existing = await Promotion.findByCode(payload.code);
        if (existing) {
            return res.status(400).json({ 
                success: false, 
                message: 'Mã khuyến mãi đã tồn tại' 
            });
        }
        
        const created = await Promotion.create(payload);
        res.status(201).json({ success: true, data: created });
    } catch (e) {
        console.error('[CREATE PROMOTION] Error:', e);
        res.status(400).json({ success: false, message: e.message });
    }
};

// ===== UPDATE =====
exports.update = async (req, res) => {
    try {
        const { id } = req.params;
        
        // ✅ Kiểm tra promotion tồn tại
        const existing = await Promotion.findById(id);
        if (!existing) {
            return res.status(404).json({ 
                success: false, 
                message: 'Không tìm thấy promotion' 
            });
        }
        
        // ✅ req.body đã được validate, merge với existing
        const payload = { ...existing, ...req.body };
        
        // ✅ Kiểm tra code trùng (nếu thay đổi code)
        if (payload.code !== existing.code) {
            const duplicate = await Promotion.findByCode(payload.code);
            if (duplicate) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Mã khuyến mãi đã tồn tại' 
                });
            }
        }
        
        const updated = await Promotion.update(id, payload);
        res.json({ success: true, data: updated });
    } catch (e) {
        console.error('[UPDATE PROMOTION] Error:', e);
        res.status(400).json({ success: false, message: e.message });
    }
};

// ===== DELETE =====
exports.remove = async (req, res) => {
    try {
        const { id } = req.params;
        
        const existing = await Promotion.findById(id);
        if (!existing) {
            return res.status(404).json({ 
                success: false, 
                message: 'Không tìm thấy promotion' 
            });
        }
        
        await Promotion.remove(id);
        res.json({ success: true, message: 'Đã xóa promotion' });
    } catch (e) {
        console.error('[DELETE PROMOTION] Error:', e);
        res.status(400).json({ success: false, message: e.message });
    }
};

// ===== VALIDATE PROMOTION CODE =====
exports.validatePromotion = async (req, res) => {
    try {
        // ✅ req.body đã được validate bởi middleware
        const { code, originalAmount } = req.body;

        const promotion = await Promotion.findByCode(code);

        if (!promotion) {
            return res.status(404).json({ 
                success: false, 
                message: 'Mã khuyến mãi không tồn tại' 
            });
        }

        // ✅ Kiểm tra trạng thái
        if (!promotion.is_active) {
            return res.status(400).json({ 
                success: false, 
                message: 'Mã khuyến mãi không còn hiệu lực' 
            });
        }

        // ✅ Kiểm tra thời gian
        const now = new Date();
        const startDate = new Date(promotion.start_date);
        const endDate = new Date(promotion.end_date);

        if (now < startDate) {
            return res.status(400).json({ 
                success: false, 
                message: 'Mã khuyến mãi chưa bắt đầu' 
            });
        }

        if (now > endDate) {
            return res.status(400).json({ 
                success: false, 
                message: 'Mã khuyến mãi đã hết hạn' 
            });
        }

        // ✅ Kiểm tra lượt sử dụng
        if (promotion.max_usage && promotion.usage_count >= promotion.max_usage) {
            return res.status(400).json({ 
                success: false, 
                message: 'Mã khuyến mãi đã hết lượt sử dụng' 
            });
        }

        // ✅ Tính toán giảm giá
        let discountAmount = 0;
        
        if (promotion.discount_type === 'percentage') {
            discountAmount = (originalAmount * promotion.discount_value) / 100;
            
            // Giới hạn giảm tối đa (nếu có)
            if (promotion.max_discount_value && discountAmount > promotion.max_discount_value) {
                discountAmount = promotion.max_discount_value;
            }
        } else if (promotion.discount_type === 'fixed_amount') {
            discountAmount = promotion.discount_value;
            
            // Không giảm quá giá trị đơn hàng
            if (discountAmount > originalAmount) {
                discountAmount = originalAmount;
            }
        }

        res.status(200).json({
            success: true,
            message: 'Áp dụng mã khuyến mãi thành công!',
            data: {
                code: promotion.code,
                discount_type: promotion.discount_type,
                discount_value: promotion.discount_value,
                discountAmount: discountAmount,
                finalAmount: originalAmount - discountAmount
            }
        });

    } catch (error) {
        console.error('[VALIDATE PROMOTION] Error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Lỗi hệ thống khi kiểm tra mã' 
        });
    }
};