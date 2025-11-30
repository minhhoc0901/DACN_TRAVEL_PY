import React from 'react';
import { Doughnut } from 'react-chartjs-2';
import { ArcElement } from 'chart.js';
import ChartJS from 'chart.js/auto';

ChartJS.register(ArcElement);

const BookingStatusChart = ({ data }) => {
    const statusMap = {
        'pending_payment': { label: 'Chờ thanh toán', color: '#ffc107' },
        'confirmed': { label: 'Đã xác nhận', color: '#28a745' },
        'cancelled': { label: 'Đã hủy', color: '#dc3545' },
        'completed': { label: 'Hoàn thành', color: '#17a2b8' }
    };

    const chartData = {
        labels: data.map(item => statusMap[item.status]?.label || item.status),
        datasets: [
            {
                data: data.map(item => item.count),
                backgroundColor: data.map(item => statusMap[item.status]?.color || '#6c757d'),
                borderColor: '#fff',
                borderWidth: 2
            }
        ]
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'bottom',
                labels: {
                    padding: 15,
                    usePointStyle: true
                }
            },
            title: {
                display: true,
                text: 'Trạng thái Booking',
                font: {
                    size: 16,
                    weight: 'bold'
                }
            }
        }
    };

    return (
        <div className="chart-card">
            <div style={{ height: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Doughnut data={chartData} options={options} />
            </div>
        </div>
    );
};

export default BookingStatusChart;  