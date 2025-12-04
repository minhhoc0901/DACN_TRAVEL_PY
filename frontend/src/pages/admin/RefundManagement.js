import React, { useState, useEffect, useCallback } from 'react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { refundService } from '../../services/refundService';
import RefundStats from '../../components/admin/Refund/RefundStats';
import RefundFilters from '../../components/admin/Refund/RefundFilters';
import RefundTable from '../../components/admin/Refund/RefundTable';
import RefundDetailModal from '../../components/admin/Refund/RefundDetailModal';
import '../../styles/Refund/RefundManagement.css';

const RefundManagement = () => {
    const [stats, setStats] = useState(null);
    const [refunds, setRefunds] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedRefund, setSelectedRefund] = useState(null);
    
    const [filters, setFilters] = useState({
        status: 'pending',
        search: '',
        page: 1,
        limit: 20
    });

    const [pagination, setPagination] = useState({
        page: 1,
        limit: 20,
        total: 0,
        totalPages: 0
    });

    /**
     * oad thống kê refund
     */
    const loadStats = useCallback(async () => {
        try {
            const result = await refundService.getRefundStats();
            
            if (result.success) {
                setStats(result.data);
            }
        } catch (error) {
            console.error('[LOAD STATS] Error:', error);
        }
    }, []); // Empty dependency vì không phụ thuộc gì

    /**
     *  Load danh sách refunds
     */
    const loadRefunds = useCallback(async () => {
        try {
            setLoading(true);
            const result = await refundService.getAllRefunds(filters);

            if (result.success) {
                setRefunds(result.data || []);
                setPagination(result.pagination || {
                    page: 1,
                    limit: 20,
                    total: 0,
                    totalPages: 0
                });
            }
        } catch (error) {
            toast.error('Không thể tải danh sách yêu cầu hoàn tiền');
            console.error('[LOAD REFUNDS] Error:', error);
        } finally {
            setLoading(false);
        }
    }, [filters]);

    /**
     *  Load data khi component mount hoặc filters thay đổi
     */
    useEffect(() => {
        loadStats();
    }, [loadStats]); // THÊM loadStats vào dependency

    useEffect(() => {
        loadRefunds();
    }, [loadRefunds]);

    /**
     * Xử lý thay đổi filters
     */
    const handleFilterChange = (key, value) => {
        if (key === 'reset') {
            setFilters({
                status: 'pending',
                search: '',
                page: 1,
                limit: 20
            });
        } else {
            setFilters(prev => ({
                ...prev,
                [key]: value,
                page: key !== 'page' ? 1 : value // Reset về page 1 khi filter thay đổi
            }));
        }
    };

    /**
     * Xem chi tiết refund
     */
    const handleViewDetail = async (refund) => {
        try {
            const result = await refundService.getRefundById(refund.id);
            
            if (result.success) {
                setSelectedRefund(result.data);
            }
        } catch (error) {
            toast.error('Không thể tải chi tiết yêu cầu hoàn tiền');
            console.error('[VIEW DETAIL] Error:', error);
        }
    };

    /**
     * Duyệt refund
     * @param {number} id - Refund ID
     * @param {string} adminNote - Ghi chú của admin
     */
    const handleApprove = async (id, adminNote = '') => {
        try {
            const result = await refundService.approveRefund(id, adminNote);
            
            if (result.success) {
                toast.success(result.message || 'Đã duyệt yêu cầu hoàn tiền');
                loadStats();
                loadRefunds();
                setSelectedRefund(null);
            }
        } catch (error) {
            toast.error(error.message || 'Không thể duyệt yêu cầu');
            throw error;
        }
    };

    /**
     * Từ chối refund
     * @param {number} id - Refund ID
     * @param {string} adminNote - Lý do từ chối (bắt buộc)
     */
    const handleReject = async (id, adminNote) => {
        if (!adminNote || adminNote.trim() === '') {
            toast.error('Vui lòng nhập lý do từ chối');
            return;
        }

        try {
            const result = await refundService.rejectRefund(id, adminNote);
            
            if (result.success) {
                toast.success(result.message || 'Đã từ chối yêu cầu hoàn tiền');
                loadStats();
                loadRefunds();
                setSelectedRefund(null);
            }
        } catch (error) {
            toast.error(error.message || 'Không thể từ chối yêu cầu');
            throw error;
        }
    };

    /**
     * Hoàn thành bank transfer
     * @param {number} id - Refund ID
     * @param {string} transactionRef - Mã giao dịch
     */
    const handleCompleteBankTransfer = async (id, transactionRef) => {
        if (!transactionRef || transactionRef.trim() === '') {
            toast.error('Vui lòng nhập mã giao dịch');
            return;
        }

        try {
            const result = await refundService.completeBankTransfer(id, transactionRef);
            
            if (result.success) {
                toast.success(result.message || 'Đã hoàn thành chuyển khoản');
                loadStats();
                loadRefunds();
                setSelectedRefund(null);
            }
        } catch (error) {
            toast.error(error.message || 'Không thể hoàn thành chuyển khoản');
            throw error;
        }
    };

    return (
        <div className="admin-page run_ad_refund_management">
            <ToastContainer position="top-right" autoClose={3000} />

            <div className="run_ad_page_header">
                <h1 className="run_ad_page_title">
                    <i className="bi bi-arrow-return-left"></i>
                    Quản lý hoàn tiền
                </h1>
                <button 
                    onClick={loadRefunds} 
                    className="run_ad_btn run_ad_btn_primary"
                    disabled={loading}
                >
                    <i className="bi bi-arrow-clockwise"></i> 
                    {loading ? 'Đang tải...' : 'Làm mới'}
                </button>
            </div>

            <div className="run_ad_content_wrapper">
        
                <RefundStats stats={stats} />

                <RefundFilters 
                    filters={filters}
                    onFilterChange={handleFilterChange}
                />

                <section className="run_ad_table_section">
                    <RefundTable
                        refunds={refunds}
                        loading={loading}
                        pagination={pagination}
                        onPageChange={(page) => handleFilterChange('page', page)}
                        onViewDetail={handleViewDetail}
                    />
                </section>
            </div>

            {selectedRefund && (
                <RefundDetailModal
                    refund={selectedRefund}
                    onClose={() => setSelectedRefund(null)}
                    onApprove={handleApprove}
                    onReject={handleReject}
                    onCompleteBankTransfer={handleCompleteBankTransfer}
                />
            )}
        </div>
    );
};

export default RefundManagement;