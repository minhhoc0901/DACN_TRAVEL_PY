import React from 'react';

const StatsOverview = ({ overview }) => {
    const formatCurrency = (value) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND',
            minimumFractionDigits: 0
        }).format(value || 0);
    };

    const stats = [
        {
            title: 'Tổng người dùng',
            value: overview.total_users || 0,
            icon: 'bi-people',
            color: 'blue',
            trend: null
        },
        {
            title: 'Tổng tour',
            value: overview.total_tours || 0,
            icon: 'bi-map',
            color: 'green',
            trend: null
        },
        {
            title: 'Tổng booking',
            value: overview.total_bookings || 0,
            icon: 'bi-calendar-check',
            color: 'purple',
            subtext: `${overview.pending_bookings || 0} đang chờ`
        },
        {
            title: 'Doanh thu',
            value: formatCurrency(overview.total_revenue),
            icon: 'bi-cash-stack',
            color: 'orange',
            trend: null
        },
        {
            title: 'Booking đã xác nhận',
            value: overview.confirmed_bookings || 0,
            icon: 'bi-check-circle',
            color: 'success',
            trend: null
        },
        {
            title: 'Yêu cầu rút tiền',
            value: overview.pending_withdrawals || 0,
            icon: 'bi-wallet2',
            color: 'warning',
            subtext: 'Đang chờ duyệt'
        },
        {
            title: 'Thông báo chưa đọc',
            value: overview.unread_notifications || 0,
            icon: 'bi-bell',
            color: 'danger',
            trend: null
        },
        {
            title: 'Booking chờ thanh toán',
            value: overview.pending_bookings || 0,
            icon: 'bi-hourglass-split',
            color: 'info',
            trend: null
        }
    ];

    return (
        <div className="stats-overview">
            {stats.map((stat, index) => (
                <div key={index} className={`stat-card stat-${stat.color}`}>
                    <div className="stat-icon">
                        <i className={`bi ${stat.icon}`}></i>
                    </div>
                    <div className="stat-content">
                        <div className="stat-title">{stat.title}</div>
                        <div className="stat-value">{stat.value}</div>
                        {stat.subtext && (
                            <div className="stat-subtext">{stat.subtext}</div>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
};

export default StatsOverview;