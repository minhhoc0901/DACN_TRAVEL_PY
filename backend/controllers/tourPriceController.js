const TourPrice = require('../models/TourPrice');


function validate(body, isUpdate = false) {
    const errors = [];
    const price = Number(body.price);
    const sale = body.sale_price === '' ? null : (body.sale_price != null ? Number(body.sale_price) : null);
    if (!isUpdate && !body.tour_id) errors.push('tour_id required');
    if (!body.price_type || !String(body.price_type).trim()) errors.push('price_type required');
    if (Number.isNaN(price) || price < 0) errors.push('price invalid');
    if (sale != null && (Number.isNaN(sale) || sale < 0)) errors.push('sale_price invalid');
    if (sale != null && sale > price) errors.push('sale_price must <= price');
    if (errors.length) throw new Error(errors.join(', '));
    return {
        tour_id: body.tour_id,
        price_type: String(body.price_type).trim(),
        price,
        sale_price: sale
    };
}

exports.listByTour = async (req, res) => {
    try {
        const prices = await TourPrice.listByTour(req.params.tourId);
        res.json({ success: true, data: prices });
    } catch (e) {
        res.status(400).json({ success: false, message: e.message });
    }
};

exports.getOne = async (req, res) => {
    try {
        const item = await TourPrice.findById(req.params.id);
        if (!item) return res.status(404).json({ success: false, message: 'Not found' });
        res.json({ success: true, data: item });
    } catch (e) {
        res.status(400).json({ success: false, message: e.message });
    }
};

exports.create = async (req, res) => {
    try {
        const payload = validate(req.body);
        const created = await TourPrice.create(payload);
        res.status(201).json({ success: true, data: created });
    } catch (e) {
        res.status(e.message === 'Forbidden' ? 403 : 400).json({ success: false, message: e.message });
    }
};

exports.update = async (req, res) => {
    try {
        const existing = await TourPrice.findById(req.params.id);
        if (!existing) return res.status(404).json({ success: false, message: 'Not found' });
        const payload = validate({ ...existing, ...req.body }, true);
        const updated = await TourPrice.update(req.params.id, payload);
        res.json({ success: true, data: updated });
    } catch (e) {
        res.status(e.message === 'Forbidden' ? 403 : 400).json({ success: false, message: e.message });
    }
};

exports.remove = async (req, res) => {
    try {
        const existing = await TourPrice.findById(req.params.id);
        if (!existing) return res.status(404).json({ success: false, message: 'Not found' });
        await TourPrice.remove(req.params.id);
        res.json({ success: true });
    } catch (e) {
        res.status(e.message === 'Forbidden' ? 403 : 400).json({ success: false, message: e.message });
    }
};