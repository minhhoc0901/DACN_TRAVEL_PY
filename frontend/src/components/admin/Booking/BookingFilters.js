import React from 'react';
import '../../../styles/Booking/BookingFilters.css';

const BookingFilters = ({ filters, onFilterChange, onSearch }) => {
    return (
        <div className="booking-filters-section">
            <form onSubmit={onSearch} className="filters-form">
                <div className="filter-row">
                    <div className="filter-group">
                        <label>Tìm kiếm</label>
                        <input
                            type="text"
                            placeholder="ID, tên, email, tour..."
                            value={filters.search}
                            onChange={(e) => onFilterChange('search', e.target.value)}
                            className="filter-input"
                        />
                    </div>

                    <div className="filter-group">
                        <label>Trạng thái booking</label>
                        <select
                            value={filters.status}
                            onChange={(e) => onFilterChange('status', e.target.value)}
                            className="filter-select"
                        >
                            <option value="">Tất cả</option>
                            <option value="pending_payment">Chờ thanh toán</option>
                            <option value="confirmed">Đã xác nhận</option>
                            <option value="cancelled">Đã hủy</option>
                        </select>
                    </div>

                    <div className="filter-group">
                        <label>Trạng thái thanh toán</label>
                        <select
                            value={filters.payment_status}
                            onChange={(e) => onFilterChange('payment_status', e.target.value)}
                            className="filter-select"
                        >
                            <option value="">Tất cả</option>
                            <option value="pending">Chưa thanh toán</option>
                            <option value="success">Đã thanh toán</option>
                            <option value="failed">Thất bại</option>
                        </select>
                    </div>
                </div>

                <div className="filter-row">
                    <div className="filter-group">
                        <label>Từ ngày</label>
                        <input
                            type="date"
                            value={filters.date_from}
                            onChange={(e) => onFilterChange('date_from', e.target.value)}
                            className="filter-input"
                        />
                    </div>

                    <div className="filter-group">
                        <label>Đến ngày</label>
                        <input
                            type="date"
                            value={filters.date_to}
                            onChange={(e) => onFilterChange('date_to', e.target.value)}
                            className="filter-input"
                        />
                    </div>

                    <div className="filter-group">
                        <label>&nbsp;</label>
                        <button type="submit" className="btn btn-primary">
                            <i className="fas fa-search"></i> Tìm kiếm
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
};

export default BookingFilters;