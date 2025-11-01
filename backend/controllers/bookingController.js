const { pool } = require("../config/db");
const path = require('path');
const fs = require("fs");
const TourPrice = require("../models/TourPrice");
const BookingDetail = require("../models/BookingDetail");
const Promotion = require("../models/Promotions");
const Booking = require("../models/Booking");
const PDFDocument = require("pdfkit");
exports.quote = async (req, res) => {
    try {
        const { tourId, items } = req.body;
        const prices = await TourPrice.listByTour(tourId);
        const { original } = BookingDetail.calcFromSelection(items, prices);
        res.json({ success: true, originalAmount: original });
    } catch (e) {
        res.status(400).json({ success: false, message: e.message });
    }
};

exports.createBooking = async (req, res) => {
    const conn = await pool.getConnection();
    try {
        const { tourId, startDate, items, promotionCode, contact } = req.body;
        const userId = req.user.id;

        await conn.beginTransaction();

        const prices = await TourPrice.listByTour(tourId);
        const { original, details } = BookingDetail.calcFromSelection(
            items,
            prices
        );

        let discount = 0;
        let promoId = null;
        if (promotionCode) {
            const promo = await Promotion.getByCodeForUpdate(promotionCode, conn);
            if (!promo) throw new Error("Mã khuyến mãi không hợp lệ");
            if (promo.max_usage && promo.usage_count >= promo.max_usage)
                throw new Error("Mã đã hết lượt");

            discount =
                promo.discount_type === "percentage"
                    ? (original * promo.discount_value) / 100
                    : promo.discount_value;

            if (discount > original) discount = original;
            promoId = promo.id;
            await Promotion.incrementUsage(promo.id, conn);
        }

        const finalAmount = original - discount;

        const bookingId = await Booking.create(conn, {
            userId,
            tourId,
            startDate,
            originalAmount: original,
            finalAmount,
            discountAmount: discount,
            promotionId: promoId,
            contact,
        });

        await BookingDetail.bulkInsert(conn, bookingId, details);

        await conn.commit();
        res.json({
            success: true,
            bookingId,
            originalAmount: original,
            finalAmount,
            discountAmount: discount,
        });
    } catch (e) {
        try {
            await conn.rollback();
        } catch { }
        res.status(400).json({ success: false, message: e.message });
    } finally {
        conn.release();
    }
};
/**
 * Lấy lịch sử đặt tour của người dùng đã đăng nhập
 */
exports.getMyBookings = async (req, res) => {
    try {
        const userId = req.user.id; // Lấy userId từ token
        const bookings = await Booking.findByUser(userId);
        res.json({ success: true, data: bookings });
    } catch (e) {
        console.error("[GET MY BOOKINGS] Error:", e);
        res
            .status(500)
            .json({
                success: false,
                message: "Lỗi hệ thống khi lấy lịch sử đặt tour.",
            });
    }
};
exports.cancelMyBooking = async (req, res) => {
    try {
        const { id: bookingId } = req.params;
        const userId = req.user.id;

        const affectedRows = await Booking.cancelByUser(bookingId, userId);

        if (affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message:
                    "Không tìm thấy đơn đặt tour hoặc đơn đã được xử lý và không thể hủy.",
            });
        }

        res.json({ success: true, message: "Đã hủy đơn đặt tour thành công." });
    } catch (e) {
        console.error("[CANCEL MY BOOKING] Error:", e);
        res
            .status(500)
            .json({ success: false, message: "Lỗi hệ thống khi hủy đơn đặt tour." });
    }
};
/**
 * Người dùng xóa vĩnh viễn booking của mình.
 */
exports.deleteMyBooking = async (req, res) => {
    try {
        const { id: bookingId } = req.params;
        const userId = req.user.id;

        const affectedRows = await Booking.deleteByUser(bookingId, userId);

        if (affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message:
                    "Không tìm thấy đơn đặt tour hoặc đơn đã được xác nhận và không thể xóa.",
            });
        }

        res.json({ success: true, message: "Đã xóa đơn đặt tour thành công." });
    } catch (e) {
        console.error("[DELETE MY BOOKING] Error:", e);
        res
            .status(500)
            .json({ success: false, message: "Lỗi hệ thống khi xóa đơn đặt tour." });
    }
};
// xuất hóa đơn PDF
const fontPath = path.join(
    __dirname,
    "..",
    "utils",
    "fonts",
    "Roboto-VariableFont_wdth,wght.ttf"
);
const logoPath = path.join(__dirname, "..", "utils", "logo.png");

// === HÀM TRỢ GIÚP ===
const formatCurrency = (amountString) => {
    const amount = parseFloat(amountString);
    // Sửa lỗi 3: Đảm bảo format ra chuỗi "1.530.000 VNĐ"
    return new Intl.NumberFormat("vi-VN", { style: 'currency', currency: 'VND', minimumFractionDigits: 0 }).format(amount);
};

const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("vi-VN");
};

const translateStatus = (status) => {
    const statusMap = {
        'pending_payment': 'Chờ thanh toán',
        'confirmed': 'Đã xác nhận',
        'cancelled': 'Đã hủy',
        'completed': 'Đã hoàn thành'
    };
    return statusMap[status] || status;
};
// ==========================

exports.getInvoicePdf = async (req, res) => {
    try {
        const bookingId = req.params.id;
        const booking = await Booking.findByPk(bookingId);
        if (!booking) return res.status(404).json({ message: "Booking not found" });

        const doc = new PDFDocument({ margin: 50, size: "A4" });
        const pageRightMargin = 545; // Lề A4 (595) - lề 50

        res.setHeader("Content-Type", "application/pdf");
        res.setHeader(
            "Content-Disposition",
            `inline; filename=invoice_${bookingId}.pdf`
        );
        doc.pipe(res);

        // Đăng ký và sử dụng font
        if (fs.existsSync(fontPath)) {
            doc.registerFont("Roboto", fontPath);
            doc.font("Roboto");
        } else {
            console.warn("Font file not found at:", fontPath);
        }

        // === PHẦN HEADER ===
        if (fs.existsSync(logoPath)) {
            doc.image(logoPath, 50, 40, { width: 60 });
        }
        doc.fontSize(20).text("HÓA ĐƠN ĐẶT TOUR", { align: "center" });
        doc.fontSize(10).text("PHÚ YÊN TOURIST", { align: "center" });
        doc.moveDown(2);

        // === SỬA LỖI 1 & 2: Căn lề 2 cột thông tin ===
        const col1X = 50;
        const col2LabelX = 320; // Sửa lỗi 2: Dịch cột 2 sang trái
        const col2ValueX = 410;
        const infoTopY = doc.y; // <-- LƯU LẠI VỊ TRÍ Y BAN ĐẦU
        let currentY = infoTopY;

        // CỘT 1: Thông tin khách hàng
        // Sửa lỗi 1: Dùng "continued: true" để giữ trên 1 dòng
        doc.fillColor("#000").fontSize(11).text("Khách hàng:", col1X, currentY, { bold: true, continued: true });
        doc.fillColor("#333").fontSize(10).text(` ${booking.user_name || booking.contact_name}`, { bold: false });
        currentY += 16;
        doc.fillColor("#333").fontSize(10).text(`Email: ${booking.contact_email}`, col1X, currentY);
        currentY += 15;
        doc.text(`Điện thoại: ${booking.contact_phone}`, col1X, currentY);

        // CỘT 2: Thông tin đơn hàng
        currentY = infoTopY; // Reset Y về vị trí bắt đầu của CỘT 1
        doc.fillColor("#000").fontSize(11).text("Mã đơn:", col2LabelX, currentY, { bold: true });
        doc.fillColor("#333").fontSize(10).text(booking.id, col2ValueX, currentY);
        currentY += 16;
        doc.fillColor("#000").fontSize(11).text("Ngày đặt:", col2LabelX, currentY, { bold: true });
        doc.fillColor("#333").fontSize(10).text(formatDate(booking.created_at), col2ValueX, currentY);
        currentY += 16;
        doc.fillColor("#000").fontSize(11).text("Trạng thái:", col2LabelX, currentY, { bold: true });
        doc.fillColor("#333").fontSize(10).text(translateStatus(booking.status), col2ValueX, currentY);

        // === SỬA LỖI 4: Bỏ khối xám, thay bằng đường kẻ (HR) ===
        currentY = Math.max(doc.y, currentY) + 15;
        doc.moveTo(col1X, currentY).lineTo(pageRightMargin, currentY).strokeOpacity(0.5).strokeColor("#ccc").stroke();
        currentY += 15;

        // Thông tin Tour
        let paymentStatusText = "Chưa thanh toán";
        if (booking.payment_status === "success") {
            paymentStatusText = `Đã thanh toán (qua ${booking.payment_method || 'N/A'})`;
        }
        doc.fillColor("#000").fontSize(10).text("Tên tour:", col1X, currentY, { bold: true });
        doc.fillColor("#333").text(booking.tour_name, col1X + 100, currentY, { width: 400 }); // Tăng width
        currentY += 18;
        doc.fillColor("#000").text("Ngày khởi hành:", col1X, currentY, { bold: true });
        doc.fillColor("#333").text(formatDate(booking.start_date), col1X + 100, currentY);
        currentY += 18;
        doc.fillColor("#000").text("Thanh toán:", col1X, currentY, { bold: true });
        doc.fillColor("#333").text(paymentStatusText, col1X + 100, currentY, { width: 400 });

        // Đường kẻ thứ 2
        currentY = doc.y + 15;
        doc.moveTo(col1X, currentY).lineTo(pageRightMargin, currentY).strokeOpacity(0.5).strokeColor("#ccc").stroke();
        currentY += 15;

        // === SỬA LỖI 3 & 4: Căn lề Bảng chi tiết ===
        const tableTop = currentY;
        const itemX = 50;
        const qtyX = 300;
        const priceX = 370;
        const totalX = 440; // Cột cuối cùng
        const tableColWidth = 105; // Chiều rộng cột tiền (Đảm bảo không rớt chữ)

        // Header Bảng
        doc.fontSize(11).fillColor("#444")
            .text("Mô tả", itemX, tableTop, { bold: true })
            .text("Số lượng", qtyX, tableTop, { width: 70, align: "right", bold: true })
            .text("Đơn giá", priceX, tableTop, { width: 70, align: "right", bold: true })
            .text("Thành tiền", totalX, tableTop, { width: tableColWidth, align: "right", bold: true });

        doc.moveTo(itemX, tableTop + 20).lineTo(pageRightMargin, tableTop + 20).strokeOpacity(0.5).strokeColor("#aaa").stroke();
        doc.fillColor("black");
        currentY = tableTop + 30;

        // Các dòng chi tiết
        booking.BookingDetails.forEach((detail) => {
            const itemTotal = parseFloat(detail.quantity) * parseFloat(detail.unit_price);
            doc.fontSize(10)
                .text(detail.price_type === "adult" ? "Người lớn" : "Trẻ em", itemX, currentY, { width: 240 })
                .text(detail.quantity, qtyX, currentY, { width: 70, align: "right" })
                .text(formatCurrency(detail.unit_price), priceX, currentY, { width: 70, align: "right" })
                .text(formatCurrency(itemTotal), totalX, currentY, { width: tableColWidth, align: "right" });
            currentY += 20;
        });

        // Yêu cầu đặc biệt
        if (booking.special_requests) {
            currentY += 10;
            doc.fillColor("#000").fontSize(10).text("Yêu cầu đặc biệt:", itemX, currentY, { bold: true });
            currentY += 15;
            doc.fillColor("#333").text(booking.special_requests, itemX, currentY, { width: 350, align: 'left' });
            currentY = doc.y; // Lấy Y hiện tại sau khi text có thể bị ngắt dòng
        }

        // === SỬA LỖI 3: Căn lề Tổng tiền (Không rớt hàng) ===
        currentY += 15;
        doc.moveTo(priceX - 20, currentY).lineTo(pageRightMargin, currentY).strokeOpacity(0.5).strokeColor("#aaa").stroke();
        currentY += 10;

        const summaryLabelX = 350; // Nhãn (Tạm tính, Giảm giá...)
        const summaryValueX = 440; // Giá trị (tiền)
        const summaryWidth = tableColWidth; // Lấy width từ bảng = 105

        if (booking.discount_amount > 0) {
            // Tạm tính
            doc.fontSize(10).text("Tạm tính:", summaryLabelX, currentY, { width: 90, align: "right" });
            doc.text(formatCurrency(booking.original_amount), summaryValueX, currentY, { width: summaryWidth, align: "right" });
            currentY += 18;

            // Giảm giá
            doc.text("Giảm giá:", summaryLabelX, currentY, { width: 90, align: "right" });
            doc.text(`-${formatCurrency(booking.discount_amount)}`, summaryValueX, currentY, { width: summaryWidth, align: "right" });

            if (booking.promotion_code) {
                doc.fontSize(9).fillColor("#555").text(`(Mã: ${booking.promotion_code})`, summaryLabelX - 80, currentY + 1, {
                    width: 80,
                    align: 'right'
                });
            }
            currentY += 20;
        }

        // Tổng cộng
        doc.font("Roboto").fontSize(14);
        doc.text("Tổng cộng:", summaryLabelX, currentY, { width: 90, align: "right", bold: true });
        // DÙNG WIDTH RỘNG ĐỂ KHÔNG RỚT HÀNG
        doc.text(formatCurrency(booking.final_amount), summaryValueX, currentY, {
            width: summaryWidth,
            align: "right",
            bold: true
        });

        // === FOOTER ===
        doc.fontSize(11).fillColor("#333").text("Cảm ơn quý khách đã sử dụng dịch vụ!", 50, 720, {
            align: "center",
            width: 495,
        });

        doc.end();
    } catch (err) {
        console.error("[GET INVOICE PDF] Error:", err);
        if (!res.headersSent) {
            res.status(500).json({ message: "Lỗi tạo hóa đơn PDF: " + err.message });
        } else {
            console.error("[PDF STREAM ERROR]", err);
        }
    }
};