import React from 'react';

const WithdrawalFilters = ({ filters, onFilterChange }) => {
    return (
        <div className="filters-section">
            <div className="filters-row">
                <div className="filter-group">
                    <label>Trạng thái</label>
                    <select
                        value={filters.status}
                        onChange={(e) => onFilterChange('status', e.target.value)}
                        className="form-select"
                    >
                        <option value="">Tất cả</option>
                        <option value="pending">Chờ duyệt</option>
                        <option value="approved">Đã duyệt</option>
                        <option value="rejected">Từ chối</option>
                        <option value="completed">Hoàn thành</option>
                    </select>
                </div>

                <div className="filter-group">
                    <label>Số bản ghi/trang</label>
                    <select
                        value={filters.limit}
                        onChange={(e) => onFilterChange('limit', e.target.value)}
                        className="form-select"
                    >
                        <option value="10">10</option>
                        <option value="20">20</option>
                        <option value="50">50</option>
                        <option value="100">100</option>
                    </select>
                </div>

                <div className="filter-group-actions">
                    <button
                        onClick={() => onFilterChange('reset')}
                        className="btn btn-reset"
                    >
                        <i className="bi bi-arrow-clockwise"></i> Reset
                    </button>
                </div>
            </div>
        </div>
    );
};

export default WithdrawalFilters;