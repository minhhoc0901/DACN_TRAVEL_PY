import React from 'react';
import { Bar } from 'react-chartjs-2';

const TopToursChart = ({ data }) => {
    const formatCurrency = (value) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND',
            minimumFractionDigits: 0
        }).format(value);
    };

    const chartData = {
        labels: data.map(item => item.tour_name.substring(0, 20) + (item.tour_name.length > 20 ? '...' : '')),
        datasets: [
            {
                label: 'Số booking',
                data: data.map(item => item.booking_count),
                backgroundColor: 'rgba(102, 126, 234, 0.8)',
                borderColor: 'rgb(102, 126, 234)',
                borderWidth: 1
            }
        ]
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        indexAxis: 'y',
        plugins: {
            legend: {
                display: false
            },
            title: {
                display: true,
                text: 'Top 5 Tour bán chạy nhất',
                font: {
                    size: 16,
                    weight: 'bold'
                }
            },
            tooltip: {
                callbacks: {
                    afterLabel: function(context) {
                        const revenue = data[context.dataIndex].revenue;
                        return `Doanh thu: ${formatCurrency(revenue)}`;
                    }
                }
            }
        },
        scales: {
            x: {
                beginAtZero: true,
                ticks: {
                    precision: 0
                }
            }
        }
    };

    return (
        <div className="chart-card">
            <div style={{ height: '350px' }}>
                <Bar data={chartData} options={options} />
            </div>
        </div>
    );
};

export default TopToursChart;