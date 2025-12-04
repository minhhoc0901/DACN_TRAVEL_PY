import React, { useState, useEffect } from 'react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import dashboardService from '../../services/dashboardService';
import StatsOverview from '../../components/admin/Dashboard/StatsOverview';
import RevenueChart from '../../components/admin/Dashboard/RevenueChart';
import TopToursChart from '../../components/admin/Dashboard/TopToursChart';
import RecentActivities from '../../components/admin/Dashboard/RecentActivities';
import BookingStatusChart from '../../components/admin/Dashboard/BookingStatusChart';
import NewUsersChart from '../../components/admin/Dashboard/NewUsersChart';
import '../../styles/admin/Dashboard.css';

const Dashboard = () => {
    const [dashboardData, setDashboardData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadDashboard();
    }, []);

    const loadDashboard = async () => {
        try {
            setLoading(true);
            const result = await dashboardService.getDashboardOverview();
            
            if (result.success) {
                setDashboardData(result.data);
            }
        } catch (error) {
            console.error('[DASHBOARD] Error:', error);
            toast.error('Không thể tải dashboard');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="dashboard-loading">
                <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                </div>
                <p>Đang tải dashboard...</p>
            </div>
        );
    }

    if (!dashboardData) {
        return (
            <div className="dashboard-error">
                <i className="bi bi-exclamation-triangle"></i>
                <p>Không thể tải dữ liệu dashboard</p>
                <button onClick={loadDashboard} className="btn btn-primary">
                    Thử lại
                </button>
            </div>
        );
    }

    return (
        <div className="admin-dashboard">
            <ToastContainer position="top-right" autoClose={3000} />

            <div className="dashboard-header">
                <div>
                    <h1 className="dashboard-title">Dashboard</h1>
                    <p className="dashboard-subtitle">Tổng quan hệ thống Phú Yên Travel</p>
                </div>
                <button onClick={loadDashboard} className="btn btn-refresh">
                    <i className="bi bi-arrow-clockwise"></i> Làm mới
                </button>
            </div>

            {/* STATS CARDS */}
            <StatsOverview overview={dashboardData.overview} />

            {/* CHARTS ROW 1 */}
            <div className="dashboard-row">
                <div className="dashboard-col-8">
                    <RevenueChart data={dashboardData.revenueByMonth} />
                </div>
                <div className="dashboard-col-4">
                    <BookingStatusChart data={dashboardData.bookingStatusStats} />
                </div>
            </div>

            {/* CHARTS ROW 2 */}
            <div className="dashboard-row">
                <div className="dashboard-col-6">
                    <TopToursChart data={dashboardData.topTours} />
                </div>
                <div className="dashboard-col-6">
                    <NewUsersChart data={dashboardData.newUsers} />
                </div>
            </div>

            {/* RECENT ACTIVITIES */}
            <RecentActivities data={dashboardData.recentActivities} />
        </div>
    );
};

export default Dashboard;