import React, { useState, useEffect } from 'react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { withdrawalService } from '../../services/withdrawalService';
import WithdrawalStats from '../../components/admin/Withdrawal/WithdrawalStats';
import WithdrawalFilters from '../../components/admin/Withdrawal/WithdrawalFilters';
import WithdrawalTable from '../../components/admin/Withdrawal/WithdrawalTable';
import WithdrawalDetailModal from '../../components/admin/Withdrawal/WithdrawalDetailModal';
import '../../styles/admin/WithdrawalManagement.css';

const WithdrawalManagement = () => {
    const [stats, setStats] = useState(null);
    const [withdrawals, setWithdrawals] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedWithdrawal, setSelectedWithdrawal] = useState(null);
    
    const [filters, setFilters] = useState({
        status: '',
        page: 1,
        limit: 20
    });

    const [pagination, setPagination] = useState({
        page: 1,
        limit: 20,
        total: 0,
        totalPages: 0
    });

    useEffect(() => {
        loadStats();
        loadWithdrawals();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filters]);

    const loadStats = async () => {
        try {
            const result = await withdrawalService.getWithdrawalStats();
            if (result.success) {
                setStats(result.data);
            }
        } catch (error) {
            console.error('[LOAD STATS] Error:', error);
        }
    };

    const loadWithdrawals = async () => {
        try {
            setLoading(true);
            const result = await withdrawalService.getAllWithdrawals(
                filters.status,
                filters.page,
                filters.limit
            );

            if (result.success) {
                setWithdrawals(result.data);
                setPagination(result.pagination);
            }
        } catch (error) {
            toast.error('Không thể tải danh sách yêu cầu rút tiền');
            console.error('[LOAD WITHDRAWALS] Error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleFilterChange = (key, value) => {
        if (key === 'reset') {
            setFilters({ status: '', page: 1, limit: 20 });
        } else {
            setFilters(prev => ({
                ...prev,
                [key]: value,
                page: key === 'status' || key === 'limit' ? 1 : prev.page
            }));
        }
    };

    const handlePageChange = (newPage) => {
        setFilters(prev => ({ ...prev, page: newPage }));
    };

    const handleViewDetail = async (withdrawal) => {
        try {
            const result = await withdrawalService.getWithdrawalById(withdrawal.id);
            if (result.success) {
                setSelectedWithdrawal(result.data);
            }
        } catch (error) {
            toast.error('Không thể tải chi tiết yêu cầu rút tiền');
        }
    };

    const handleApprove = async (id, adminNote) => {
        try {
            const result = await withdrawalService.approveWithdrawal(id, adminNote);
            if (result.success) {
                toast.success('Đã duyệt yêu cầu rút tiền thành công');
                loadStats();
                loadWithdrawals();
                setSelectedWithdrawal(null);
            }
        } catch (error) {
            throw error;
        }
    };

    const handleReject = async (id, adminNote) => {
        try {
            const result = await withdrawalService.rejectWithdrawal(id, adminNote);
            if (result.success) {
                toast.success('Đã từ chối yêu cầu rút tiền');
                loadStats();
                loadWithdrawals();
                setSelectedWithdrawal(null);
            }
        } catch (error) {
            throw error;
        }
    };

    const handleComplete = async (id, transactionRef) => {
        try {
            const result = await withdrawalService.completeWithdrawal(id, transactionRef);
            if (result.success) {
                toast.success('Đã đánh dấu hoàn thành chuyển tiền');
                loadStats();
                loadWithdrawals();
                setSelectedWithdrawal(null);
            }
        } catch (error) {
            throw error;
        }
    };

    return (
        <div className="admin-page withdrawal-management">
            <ToastContainer position="top-right" autoClose={3000} />

            <div className="page-header">
                <h1 className="page-title">Quản lý rút tiền</h1>
                <button onClick={loadWithdrawals} className="btn btn-primary">
                    <i className="bi bi-arrow-clockwise"></i> Làm mới
                </button>
            </div>

            <WithdrawalStats stats={stats} />

            <WithdrawalFilters 
                filters={filters}
                onFilterChange={handleFilterChange}
            />

            <section className="table-section">
                <WithdrawalTable
                    withdrawals={withdrawals}
                    loading={loading}
                    pagination={pagination}
                    onPageChange={handlePageChange}
                    onViewDetail={handleViewDetail}
                />
            </section>

            {selectedWithdrawal && (
                <WithdrawalDetailModal
                    withdrawal={selectedWithdrawal}
                    onClose={() => setSelectedWithdrawal(null)}
                    onApprove={handleApprove}
                    onReject={handleReject}
                    onComplete={handleComplete}
                />
            )}
        </div>
    );
};

export default WithdrawalManagement;