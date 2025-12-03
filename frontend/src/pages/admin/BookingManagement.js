import React, { useState, useEffect, useCallback } from 'react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import adminBookingService from '../../services/adminBookingService';
import BookingStats from '../../components/admin/Booking/BookingStats';
import BookingFilters from '../../components/admin/Booking/BookingFilters';
import BookingTable from '../../components/admin/Booking/BookingTable';
import BookingDetailModal from '../../components/admin/Booking/BookingDetailModal';
import StatusUpdateModal from '../../components/admin/Booking/StatusUpdateModal';
// ✅ SỬA ĐƯỜNG DẪN CSS
import '../../styles/Booking/BookingManagement.css';

const BookingManagement = () => {
    const [bookings, setBookings] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(false);
    const [selectedBooking, setSelectedBooking] = useState(null);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [showStatusModal, setShowStatusModal] = useState(false);

    const [filters, setFilters] = useState({
        status: '',
        payment_status: '',
        search: '',
        date_from: '',
        date_to: '',
        page: 1,
        limit: 20,
        sort_by: 'created_at',
        sort_order: 'DESC'
    });

    const [pagination, setPagination] = useState({
        total: 0,
        page: 1,
        limit: 20,
        totalPages: 0
    });

    // ✅ SỬA USEEFFECT - Thêm useCallback
    const loadStats = useCallback(async () => {
        try {
            const result = await adminBookingService.getBookingStats({
                date_from: filters.date_from,
                date_to: filters.date_to
            });
            if (result.success) {
                setStats(result.stats);
            }
        } catch (error) {
            console.error('Load stats error:', error);
        }
    }, [filters.date_from, filters.date_to]); // ✅ Dependencies

    const loadBookings = useCallback(async () => {
        try {
            setLoading(true);
            const result = await adminBookingService.getAllBookings(filters);
            
            if (result.success) {
                setBookings(result.data.bookings);
                setPagination(result.data.pagination);
            }
        } catch (error) {
            toast.error(error.message || 'Lỗi khi tải danh sách booking');
        } finally {
            setLoading(false);
        }
    }, [filters]); // ✅ Dependencies

    useEffect(() => {
        loadStats();
    }, [loadStats]); // ✅ Thêm loadStats vào dependencies

    useEffect(() => {
        loadBookings();
    }, [loadBookings]); // ✅ Thêm loadBookings vào dependencies

    const handleSearch = (e) => {
        e.preventDefault();
        setFilters(prev => ({ ...prev, page: 1 }));
    };

    const handleFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value, page: 1 }));
    };

    const handleViewDetail = async (bookingId) => {
        try {
            const result = await adminBookingService.getBookingDetail(bookingId);
            if (result.success) {
                setSelectedBooking(result.booking);
                setShowDetailModal(true);
            }
        } catch (error) {
            toast.error('Không thể tải chi tiết booking');
        }
    };
    const handleMarkCompleted = async (booking) => {
        if (!window.confirm(
            `Đánh dấu hoàn thành Booking #${booking.id}?\n\n` +
            `Tour: ${booking.destination}\n` +
            `Ngày khởi hành: ${new Date(booking.departure_date).toLocaleDateString('vi-VN')}`
        )) return;

        try {
            const result = await adminBookingService.markBookingCompleted(booking.id);
            
            if (result.success) {
            toast.success('Đánh dấu hoàn thành thành công!');
            
            if (result.warning) {
                toast.warning(result.warning, { autoClose: 5000 });
            }
            
            loadBookings();
            loadStats();
            }
        } catch (error) {
            toast.error(error.message || 'Lỗi khi đánh dấu hoàn thành');
        }
    };
    const handleTriggerMarkCompletedJob = async () => {
        if (!window.confirm(
            'Chạy job đánh dấu hoàn thành tự động?\n\n' +
            'Hệ thống sẽ tìm và đánh dấu tất cả các booking đã qua ngày kết thúc tour.'
        )) return;

        try {
            toast.info('Đang chạy job...');
            const result = await adminBookingService.triggerMarkCompletedJob();
            
            if (result.success) {
                toast.success(`✅ Đã đánh dấu ${result.count} booking hoàn thành!`);
                loadBookings();
                loadStats();
            }
        } catch (error) {
            toast.error(error.message || 'Lỗi khi chạy job');
        }
    };
    
    const handleOpenStatusModal = (booking) => {
        setSelectedBooking(booking);
        setShowStatusModal(true);
    };

    const handleUpdateStatus = async (newStatus, reason) => {
        try {
            const result = await adminBookingService.updateBookingStatus(
                selectedBooking.id, 
                newStatus,
                reason
            );
            
            if (result.success) {
                toast.success('Cập nhật trạng thái thành công');
                setShowStatusModal(false);
                loadBookings();
                loadStats();
            }
        } catch (error) {
            toast.error(error.message || 'Lỗi khi cập nhật trạng thái');
        }
    };

    const handleExport = async () => {
        try {
            toast.info('Đang xuất báo cáo...');
            const result = await adminBookingService.exportReport({
                status: filters.status,
                payment_status: filters.payment_status,
                date_from: filters.date_from,
                date_to: filters.date_to
            });

            if (result.success) {
                const csv = convertToCSV(result.data);
                downloadCSV(csv, result.filename);
                toast.success('Xuất báo cáo thành công');
            }
        } catch (error) {
            toast.error('Lỗi khi xuất báo cáo');
        }
    };

    const convertToCSV = (data) => {
        if (data.length === 0) return '';
        
        const headers = Object.keys(data[0]);
        const csvRows = [];
        
        csvRows.push(headers.join(','));
        
        for (const row of data) {
            const values = headers.map(header => {
                const val = row[header];
                return `"${val}"`;
            });
            csvRows.push(values.join(','));
        }
        
        return csvRows.join('\n');
    };

    const downloadCSV = (csv, filename) => {
        const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handlePageChange = (newPage) => {
        setFilters(prev => ({ ...prev, page: newPage }));
    };

    const handleSort = (column) => {
        const newOrder = filters.sort_by === column && filters.sort_order === 'DESC' ? 'ASC' : 'DESC';
        setFilters(prev => ({
            ...prev,
            sort_by: column,
            sort_order: newOrder,
            page: 1
        }));
    };

    return (
        <div className="admin-page booking-management">
            <ToastContainer position="top-right" autoClose={3000} />

            <div className="page-header">
                <h1 className="page-title">Quản lý Booking</h1>
                <button onClick={handleTriggerMarkCompletedJob} className="btn btn-info">
                    <i className="fas fa-sync-alt"></i> Đánh dấu hoàn thành tự động
                </button>
                <button onClick={handleExport} className="btn btn-success">
                    <i className="fas fa-file-excel"></i> Xuất báo cáo
                </button>
            </div>

            {stats && <BookingStats stats={stats} />}

            <BookingFilters 
                filters={filters}
                onFilterChange={handleFilterChange}
                onSearch={handleSearch}
            />

            <BookingTable
                bookings={bookings}
                loading={loading}
                pagination={pagination}
                filters={filters}
                onViewDetail={handleViewDetail}
                onUpdateStatus={handleOpenStatusModal}
                onMarkCompleted={handleMarkCompleted}
                onPageChange={handlePageChange}
                onSort={handleSort}
            />

            {showDetailModal && selectedBooking && (
                <BookingDetailModal
                    booking={selectedBooking}
                    onClose={() => setShowDetailModal(false)}
                />
            )}

            {showStatusModal && selectedBooking && (
                <StatusUpdateModal
                    booking={selectedBooking}
                    onClose={() => setShowStatusModal(false)}
                    onSubmit={handleUpdateStatus}
                />
            )}
        </div>
    );
};

export default BookingManagement;