const { pool } = require('../config/db');
const Booking = require('../models/Booking');
const UserCredit = require('../models/UserCredit');
const Notification = require('../models/Notification');

/**
 * ✅ LẤY TỔNG QUAN DASHBOARD
 */
exports.getDashboardOverview = async (req, res) => {
    try {
        // 1. THỐNG KÊ TỔNG QUAN
        const [overview] = await pool.query(`
            SELECT 
                (SELECT COUNT(*) FROM users WHERE role = 'user') as total_users,
                (SELECT COUNT(*) FROM tours WHERE is_active = 1) as total_tours,
                (SELECT COUNT(*) FROM bookings) as total_bookings,
                (SELECT COUNT(*) FROM bookings WHERE status = 'pending_payment') as pending_bookings,
                (SELECT COUNT(*) FROM bookings WHERE status = 'confirmed') as confirmed_bookings,
                (SELECT SUM(final_amount) FROM bookings WHERE status = 'confirmed') as total_revenue,
                (SELECT COUNT(*) FROM withdrawal_requests WHERE status = 'pending') as pending_withdrawals,
                (SELECT COUNT(*) FROM notifications WHERE is_read = 0) as unread_notifications
        `);

        // 2. DOANH THU THEO THÁNG (12 THÁNG GẦN NHẤT)
        const [revenueByMonth] = await pool.query(`
            SELECT 
                DATE_FORMAT(created_at, '%Y-%m') as month,
                COUNT(*) as booking_count,
                SUM(final_amount) as revenue
            FROM bookings
            WHERE status = 'confirmed'
                AND created_at >= DATE_SUB(NOW(), INTERVAL 12 MONTH)
            GROUP BY DATE_FORMAT(created_at, '%Y-%m')
            ORDER BY month ASC
        `);

        // 3. TOP 5 TOUR BÁN CHẠY NHẤT
        const [topTours] = await pool.query(`
            SELECT 
                t.id,
                t.destination as tour_name,
                t.image,
                COUNT(b.id) as booking_count,
                SUM(b.final_amount) as revenue
            FROM tours t
            LEFT JOIN bookings b ON t.id = b.tour_id AND b.status = 'confirmed'
            WHERE t.is_active = 1
            GROUP BY t.id, t.destination, t.image
            ORDER BY booking_count DESC
            LIMIT 5
        `);

        // 4. HOẠT ĐỘNG GẦN ĐÂY (10 BOOKING MỚI NHẤT)
        const [recentActivities] = await pool.query(`
            SELECT 
                b.id,
                b.contact_name,
                b.final_amount,
                b.status,
                b.created_at,
                t.destination as tour_name,
                u.full_name as user_name
            FROM bookings b
            LEFT JOIN tours t ON b.tour_id = t.id
            LEFT JOIN users u ON b.user_id = u.id
            ORDER BY b.created_at DESC
            LIMIT 10
        `);

        // 5. THỐNG KÊ THEO TRẠNG THÁI BOOKING
        const [bookingStatusStats] = await pool.query(`
            SELECT 
                status,
                COUNT(*) as count,
                SUM(final_amount) as total_amount
            FROM bookings
            GROUP BY status
        `);

        // 6. THỐNG KÊ NGƯỜI DÙNG MỚI (7 NGÀY GẦN NHẤT)
        const [newUsers] = await pool.query(`
            SELECT 
                DATE(created_at) as date,
                COUNT(*) as count
            FROM users
            WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
            GROUP BY DATE(created_at)
            ORDER BY date ASC
        `);

        // 7. THỐNG KÊ RÚT TIỀN
        const withdrawalStats = await UserCredit.getWithdrawalStats();

        res.json({
            success: true,
            data: {
                overview: overview[0],
                revenueByMonth,
                topTours,
                recentActivities,
                bookingStatusStats,
                newUsers,
                withdrawalStats
            }
        });

    } catch (error) {
        console.error('[DASHBOARD] Error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi tải dashboard'
        });
    }
};

/**
 * ✅ LẤY THỐNG KÊ CHI TIẾT THEO KHOẢNG THỜI GIAN
 */
exports.getDashboardDetailedStats = async (req, res) => {
    try {
        const { start_date, end_date } = req.query;

        // Doanh thu theo ngày
        const [dailyRevenue] = await pool.query(`
            SELECT 
                DATE(created_at) as date,
                COUNT(*) as booking_count,
                SUM(final_amount) as revenue
            FROM bookings
            WHERE status = 'confirmed'
                AND created_at BETWEEN ? AND ?
            GROUP BY DATE(created_at)
            ORDER BY date ASC
        `, [start_date, end_date]);

        res.json({
            success: true,
            data: { dailyRevenue }
        });

    } catch (error) {
        console.error('[DASHBOARD][DETAILED] Error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi tải thống kê chi tiết'
        });
    }
};