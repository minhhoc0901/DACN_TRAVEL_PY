const { pool }  = require('../config/db');

class BookingDetail {
    static async bulkInsert(conn, bookingId, items) {
        for (const it of items) {
            await conn.query(
                `INSERT INTO Booking_Details
                 (booking_id, price_type, quantity, unit_price, subtotal)
                 VALUES (?,?,?,?,?)`,
                [bookingId, it.price_type, it.quantity, it.unit_price, it.subtotal]
            );
        }
    }

    static calcFromSelection(selection, tourPrices) {
        // selection: [{ price_type, quantity }]
        let original = 0;
        const details = [];
        for (const sel of selection) {
            const priceRow = tourPrices.find(p => p.price_type === sel.price_type);
            if (!priceRow) throw new Error(`Không tìm thấy loại giá: ${sel.price_type}`);
            const unit = priceRow.sale_price != null ? priceRow.sale_price : priceRow.price;
            const subtotal = unit * sel.quantity;
            original += subtotal;
            details.push({
                price_type: sel.price_type,
                quantity: sel.quantity,
                unit_price: unit,
                subtotal
            });
        }
        return { original, details };
    }
}

module.exports = BookingDetail;