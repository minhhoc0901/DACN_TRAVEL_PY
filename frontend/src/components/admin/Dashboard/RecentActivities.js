import React from 'react';
import { Link } from 'react-router-dom';

const RecentActivities = ({ data }) => {
    const formatCurrency = (value) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND',
            minimumFractionDigits: 0
        }).format(value);
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleString('vi-VN');
    };

    const getStatusBadge = (status) => {
        const statusMap = {
            'pending_payment': { label: 'Chờ thanh toán', class: 'warning' },
            'confirmed': { label: 'Đã xác nhận', class: 'success' },
            'cancelled': { label: 'Đã hủy', class: 'danger' },
            'completed': { label: 'Hoàn thành', class: 'info' }
        };

        const statusInfo = statusMap[status] || { label: status, class: 'secondary' };

        return (
            <span className={`badge badge-${statusInfo.class}`}>
                {statusInfo.label}
            </span>
        );
    };

    return (
        <div className="recent-activities">
            <div className="activities-header">
                <h3>Hoạt động gần đây</h3>
                <Link to="/admin/bookings" className="btn btn-sm btn-outline">
                    Xem tất cả <i className="bi bi-arrow-right"></i>
                </Link>
            </div>
            <div className="activities-table">
                <table className="table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Khách hàng</th>
                            <th>Tour</th>
                            <th>Số tiền</th>
                            <th>Trạng thái</th>
                            <th>Thời gian</th>
                            <th></th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.map((activity) => (
                            <tr key={activity.id}>
                                <td>#{activity.id}</td>
                                <td>
                                    <div className="customer-info">
                                        <strong>{activity.contact_name}</strong>
                                        {activity.user_name && (
                                            <small>{activity.user_name}</small>
                                        )}
                                    </div>
                                </td>
                                <td>{activity.tour_name}</td>
                                <td><strong>{formatCurrency(activity.final_amount)}</strong></td>
                                <td>{getStatusBadge(activity.status)}</td>
                                <td>{formatDate(activity.created_at)}</td>
                                
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default RecentActivities;