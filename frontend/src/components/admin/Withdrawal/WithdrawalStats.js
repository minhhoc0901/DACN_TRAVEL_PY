import React from 'react';

const WithdrawalStats = ({ stats }) => {
    if (!stats) return null;

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND',
            minimumFractionDigits: 0
        }).format(amount || 0);
    };

    const cards = [
        {
            title: 'Chờ duyệt',
            count: stats.pending_count || 0,
            amount: stats.pending_amount || 0,
            icon: 'bi-clock-history',
            color: '#ffc107'
        },
        {
            title: 'Đã duyệt',
            count: stats.approved_count || 0,
            amount: stats.approved_amount || 0,
            icon: 'bi-check-circle',
            color: '#17a2b8'
        },
        {
            title: 'Từ chối',
            count: stats.rejected_count || 0,
            amount: 0,
            icon: 'bi-x-circle',
            color: '#dc3545'
        },
        {
            title: 'Hoàn thành',
            count: stats.completed_count || 0,
            amount: stats.completed_amount || 0,
            icon: 'bi-check-all',
            color: '#28a745'
        }
    ];

    return (
        <div className="stats-grid">
            {cards.map((card, index) => (
                <div key={index} className="stat-card" style={{ borderLeftColor: card.color }}>
                    <div className="stat-icon" style={{ backgroundColor: `${card.color}20`, color: card.color }}>
                        <i className={`bi ${card.icon}`}></i>
                    </div>
                    <div className="stat-content">
                        <div className="stat-title">{card.title}</div>
                        <div className="stat-count">{card.count} yêu cầu</div>
                        {card.amount > 0 && (
                            <div className="stat-amount">{formatCurrency(card.amount)}</div>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
};

export default WithdrawalStats;