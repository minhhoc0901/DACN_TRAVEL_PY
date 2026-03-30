import React from 'react';
import '../../../styles/Refund/RefundStats.css';

const RefundStats = ({ stats }) => {
    if (!stats) {
        return (
            <section className="run_ad_stats_section">
                <div className="run_ad_stats_loading">
                    <i className="bi bi-hourglass-split"></i>
                    <p>Đang tải thống kê...</p>
                </div>
            </section>
        );
    }

    // Helper function format tiền
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('vi-VN').format(amount || 0);
    };

    const statsData = [
        {
            key: 'total',
            label: 'Tổng yêu cầu',
            value: stats.total_refunds || 0,
            sublabel: 'YÊU CẦU HOÀN TIỀN',
            icon: 'bi-receipt',
            className: 'run_ad_stat_total'
        },
        {
            key: 'pending',
            label: 'Chờ duyệt',
            value: (stats.pending_count || 0) + (stats.processing_count || 0),
            sublabel: 'CẦN XỬ LÝ',
            icon: 'bi-clock-history',
            className: 'run_ad_stat_pending'
        },
        {
            key: 'completed',
            label: 'Đã hoàn thành',
            value: stats.approved_count || 0,
            sublabel: 'YÊU CẦU',
            icon: 'bi-check-circle',
            className: 'run_ad_stat_completed'
        },
        {
            key: 'rejected',
            label: 'Đã từ chối',
            value: stats.rejected_count || 0,
            sublabel: 'YÊU CẦU',
            icon: 'bi-x-circle',
            className: 'run_ad_stat_rejected'
        },
        {
            key: 'amount',
            label: 'Tổng tiền hoàn',
            value: `${formatCurrency(stats.total_refund_amount)} ₫`,
            sublabel: `Đã hoàn: ${formatCurrency(stats.approved_amount)} ₫`,
            icon: 'bi-cash-coin',
            className: 'run_ad_stat_amount'
        },
        {
            key: 'avg',
            label: 'Trung bình',
            value: `${formatCurrency(Math.round(stats.avg_refund_amount))} ₫`,
            sublabel: 'MỖI YÊU CẦU',
            icon: 'bi-calculator',
            className: 'run_ad_stat_avg'
        },
        {
            key: 'credit',
            label: 'Hoàn vào Credit',
            value: stats.credit_refunds || 0,
            sublabel: 'YÊU CẦU',
            icon: 'bi-wallet2',
            className: 'run_ad_stat_credit'
        },
        {
            key: 'bank',
            label: 'Hoàn về Bank',
            value: stats.bank_refunds || 0,
            sublabel: `Phí: ${formatCurrency(stats.total_processing_fees)} ₫`,
            icon: 'bi-bank',
            className: 'run_ad_stat_bank'
        }
    ];

    return (
        <section className="run_ad_stats_section">
            <div className="run_ad_stats_grid">
                {statsData.map(stat => (
                    <div key={stat.key} className={`run_ad_stat_card ${stat.className}`}>
                        <div className="run_ad_stat_icon">
                            <i className={`bi ${stat.icon}`}></i>
                        </div>
                        <div className="run_ad_stat_content">
                            <div className="run_ad_stat_label">{stat.label}</div>
                            <div className="run_ad_stat_value">{stat.value}</div>
                            <div className="run_ad_stat_sublabel">{stat.sublabel}</div>
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
};

export default RefundStats;