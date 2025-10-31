const Promotion = require('../models/Promotions');


const validate = (body, isUpdate = false) => {
    const errors = [];
    const required = ['code','discount_type','discount_value','start_date','end_date'];
    if (!isUpdate) {
        for (const f of required) if (!body[f]) errors.push(`${f} required`);
    }
    if (body.code && String(body.code).length > 50) errors.push('code too long');
    if (body.discount_type && !['percentage','fixed_amount'].includes(body.discount_type))
        errors.push('discount_type invalid');
    const dv = Number(body.discount_value);
    if (Number.isNaN(dv) || dv < 0) errors.push('discount_value invalid');
    if (body.max_usage != null) {
        const mu = Number(body.max_usage);
        if (Number.isNaN(mu) || mu < 0) errors.push('max_usage invalid');
    }
    if (body.start_date && body.end_date && new Date(body.start_date) >= new Date(body.end_date))
        errors.push('start_date must < end_date');
    if (errors.length) throw new Error(errors.join(', '));
    return {
        code: body.code,
        description: body.description,
        discount_type: body.discount_type,
        discount_value: dv,
        start_date: body.start_date,
        end_date: body.end_date,
        max_usage: body.max_usage ?? null,
        is_active: body.is_active !== undefined ? !!body.is_active : true
    };
};

// GET /api/promotions/active
exports.listActive = async (req, res) => {
    try {
        const data = await Promotion.listActive();
        res.json({ success: true, data });
    } catch (e) {
        res.status(500).json({ success: false, message: e.message });
    }
};

// GET /api/promotions (admin)
exports.listAll = async (req, res) => {
    try {
        const data = await Promotion.listAll();
        res.json({ success: true, data });
    } catch (e) {
        res.status(e.message === 'FORBIDDEN' ? 403 : 500).json({ success: false, message: e.message });
    }
};

// GET /api/promotions/:id
exports.getOne = async (req, res) => {
    try {
        const item = await Promotion.findById(req.params.id);
        if (!item) return res.status(404).json({ success: false, message: 'Not found' });
        res.json({ success: true, data: item });
    } catch (e) {
        res.status(e.message === 'FORBIDDEN' ? 403 : 500).json({ success: false, message: e.message });
    }
};

// POST /api/promotions
exports.create = async (req, res) => {
    try {
        const payload = validate(req.body);
        if (await Promotion.findByCode(payload.code)) throw new Error('code exists');
        const created = await Promotion.create(payload);
        res.status(201).json({ success: true, data: created });
    } catch (e) {
        res.status(e.message === 'FORBIDDEN' ? 403 : 400).json({ success: false, message: e.message });
    }
};

// PUT /api/promotions/:id
exports.update = async (req, res) => {
    try {
        const existing = await Promotion.findById(req.params.id);
        if (!existing) return res.status(404).json({ success: false, message: 'Not found' });
        const payload = validate({ ...existing, ...req.body }, true);
        if (payload.code !== existing.code) {
            if (await Promotion.findByCode(payload.code)) throw new Error('code exists');
        }
        const updated = await Promotion.update(existing.id, payload);
        res.json({ success: true, data: updated });
    } catch (e) {
        res.status(e.message === 'FORBIDDEN' ? 403 : 400).json({ success: false, message: e.message });
    }
};

// DELETE /api/promotions/:id
exports.remove = async (req, res) => {
    try {
        const existing = await Promotion.findById(req.params.id);
        if (!existing) return res.status(404).json({ success: false, message: 'Not found' });
        await Promotion.remove(existing.id);
        res.json({ success: true });
    } catch (e) {
        res.status(e.message === 'FORBIDDEN' ? 403 : 400).json({ success: false, message: e.message });
    }
};
exports.validatePromotion = async (req, res) => {
    const { code, originalAmount } = req.body;

    if (!code) {
        return res.status(400).json({ success: false, message: 'Vui lòng nhập mã khuyến mãi.' });
    }
    if (typeof originalAmount !== 'number' || originalAmount <= 0) {
        return res.status(400).json({ success: false, message: 'Giá trị đơn hàng không hợp lệ.' });
    }

    try {
        const promotion = await Promotion.findByCode( code);

        if (!promotion) {
            return res.status(404).json({ success: false, message: 'Mã khuyến mãi không hợp lệ hoặc đã hết hạn.' });
        }

        // Kiểm tra ngày hết hạn
        const now = new Date();
        if (now < new Date(promotion.start_date)) {
            return res.status(400).json({ success: false, message: 'Mã khuyến mãi chưa bắt đầu.' });
        }
        if (now > new Date(promotion.end_date)) {
            return res.status(400).json({ success: false, message: 'Mã khuyến mãi đã hết hạn.' });
        }

        // Kiểm tra số lượt sử dụng tối đa
        if (promotion.max_usage != null && promotion.usage_count >= promotion.max_usage) {
            return res.status(400).json({ success: false, message: 'Mã khuyến mãi đã hết lượt sử dụng.' });
        }

        // Kiểm tra giá trị đơn hàng tối thiểu (nếu có)
        if (promotion.min_order_value != null && originalAmount < promotion.min_order_value) {
            return res.status(400).json({ success: false, message: `Đơn hàng phải từ ${promotion.min_order_value}đ mới được áp dụng mã.` });
        }

        let discountAmount = 0;
        if (promotion.discount_type === 'percentage') {
            discountAmount = (originalAmount * promotion.discount_value) / 100;
            // Nếu có giới hạn giảm tối đa
            if (promotion.max_discount_value != null && discountAmount > promotion.max_discount_value) {
                discountAmount = promotion.max_discount_value;
            }
        } else if (promotion.discount_type === 'fixed_amount') {
            discountAmount = promotion.discount_value;
            // Không giảm quá giá trị đơn hàng
            if (discountAmount > originalAmount) discountAmount = originalAmount;
        }

        res.status(200).json({
            success: true,
            message: 'Áp dụng mã khuyến mãi thành công!',
            data: {
                code: promotion.code,
                discountAmount: discountAmount,
                finalAmount: originalAmount - discountAmount
            }
        });

    } catch (error) {
        console.error('Error validating promotion:', error);
        res.status(500).json({ success: false, message: 'Lỗi hệ thống khi kiểm tra mã.' });
    }
};