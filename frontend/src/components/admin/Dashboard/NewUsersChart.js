import React from 'react';
import { Line } from 'react-chartjs-2';

const NewUsersChart = ({ data }) => {
    const chartData = {
        labels: data.map(item => {
            const date = new Date(item.date);
            return `${date.getDate()}/${date.getMonth() + 1}`;
        }),
        datasets: [
            {
                label: 'Người dùng mới',
                data: data.map(item => item.count),
                borderColor: 'rgb(118, 75, 162)',
                backgroundColor: 'rgba(118, 75, 162, 0.1)',
                fill: true,
                tension: 0.4
            }
        ]
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                display: false
            },
            title: {
                display: true,
                text: 'Người dùng mới (7 ngày gần nhất)',
                font: {
                    size: 16,
                    weight: 'bold'
                }
            }
        },
        scales: {
            y: {
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
                <Line data={chartData} options={options} />
            </div>
        </div>
    );
};

export default NewUsersChart;