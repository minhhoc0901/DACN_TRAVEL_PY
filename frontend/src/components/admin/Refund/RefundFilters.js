import React from 'react';
import '../../../styles/Refund/RefundFilters.css';

const RefundFilters = ({ filters, onFilterChange }) => {
    return (
        <section className="filters-section">
            <div className="filters-grid">
                {/* Trạng thái */}
                <div className="filter-group">
                    <label>Trạng thái</label>
                    <select
                        value={filters.status}
                        onChange={(e) => onFilterChange('status', e.target.value)}
                        className="filter-select"
                    >
                        <option value="">Tất cả</option>
                        <option value="pending">Chờ duyệt</option>
                        <option value="approved">Đã duyệt</option>
                        <option value="completed">Hoàn thành</option>
                        <option value="rejected">Từ chối</option>
                    </select>
                </div>

                {/* Phương thức hoàn tiền */}
                <div className="filter-group">
                    <label>Phương thức</label>
                    <select
                        value={filters.refund_method}
                        onChange={(e) => onFilterChange('refund_method', e.target.value)}
                        className="filter-select"
                    >
                        <option value="">Tất cả</option>
                        <option value="credit">Ví Credit</option>
                        <option value="bank_transfer">Chuyển khoản</option>
                    </select>
                </div>

                {/* Tìm kiếm */}
                <div className="filter-group filter-search">
                    <label>Tìm kiếm</label>
                    <div className="search-input-wrapper">
                        <i className="bi bi-search"></i>
                        <input
                            type="text"
                            placeholder="Booking ID, Tên khách hàng, Email..."
                            value={filters.search}
                            onChange={(e) => onFilterChange('search', e.target.value)}
                            className="filter-input"
                        />
                    </div>
                </div>

                {/* Từ ngày */}
                <div className="filter-group">
                    <label>Từ ngày</label>
                    <input
                        type="date"
                        value={filters.date_from}
                        onChange={(e) => onFilterChange('date_from', e.target.value)}
                        className="filter-input"
                    />
                </div>

                {/* Đến ngày */}
                <div className="filter-group">
                    <label>Đến ngày</label>
                    <input
                        type="date"
                        value={filters.date_to}
                        onChange={(e) => onFilterChange('date_to', e.target.value)}
                        className="filter-input"
                    />
                </div>

                {/* Nút reset */}
                <div className="filter-group filter-actions">
                    <label>&nbsp;</label>
                    <button
                        onClick={() => onFilterChange('reset')}
                        className="btn btn-secondary"
                    >
                        <i className="bi bi-arrow-counterclockwise"></i>
                        Reset
                    </button>
                </div>
            </div>
        </section>
    );
};

export default RefundFilters;