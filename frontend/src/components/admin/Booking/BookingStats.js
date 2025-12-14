import React from 'react';
import '../../../styles/Booking/BookingStats.css';

const BookingStats = ({ stats }) => {
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(amount || 0);
    };

    return (
        <div className="booking-stats-grid">
            <div className="stat-card stat-total">
                <div className="stat-icon">
                    <i className="fas fa-clipboard-list"></i>
                </div>
                <div className="stat-info">
                    <div className="stat-label">Tổng Booking</div>
                    <div className="stat-value">{stats.total_bookings || 0}</div>
                </div>
            </div>

            <div className="stat-card stat-pending">
                <div className="stat-icon">
                    <i className="fas fa-clock"></i>
                </div>
                <div className="stat-info">
                    <div className="stat-label">Chờ thanh toán</div>
                    <div className="stat-value">{stats.pending || 0}</div>
                </div>
            </div>

            <div className="stat-card stat-confirmed">
                <div className="stat-icon">
                    <i className="fas fa-check-circle"></i>
                </div>
                <div className="stat-info">
                    <div className="stat-label">Đã xác nhận</div>
                    <div className="stat-value">{stats.confirmed || 0}</div>
                </div>
            </div>

            <div className="stat-card stat-cancelled">
                <div className="stat-icon">
                    <i className="fas fa-times-circle"></i>
                </div>
                <div className="stat-info">
                    <div className="stat-label">Đã hủy</div>
                    <div className="stat-value">{stats.cancelled || 0}</div>
                </div>
            </div>

            <div className="stat-card stat-revenue">
                <div className="stat-icon">
                    <i className="fas fa-dollar-sign"></i>
                </div>
                <div className="stat-info">
                    <div className="stat-label">Doanh thu xác nhận</div>
                    <div className="stat-value">{formatCurrency(stats.confirmed_revenue)}</div>
                </div>
            </div>

            <div className="stat-card stat-paid">
                <div className="stat-icon">
                    <i className="fas fa-money-check-alt"></i>
                </div>
                <div className="stat-info">
                    <div className="stat-label">Đã thanh toán</div>
                    <div className="stat-value">{stats.paid_bookings || 0}</div>
                    <div className="stat-sub">{formatCurrency(stats.total_paid)}</div>
                </div>
            </div>
        </div>
    );
};

export default BookingStats;