import React, { useState } from 'react';
import '../../styles/Tour/TourFilters.css';

const TourFilters = ({ onFilterChange, onSortChange }) => {
    const [filters, setFilters] = useState({
        destination: '',
        price_min: '',
        price_max: '',
        duration: '',
        sort_by: 'latest'
    });

    const [showFilters, setShowFilters] = useState(false);

    const handleFilterChange = (key, value) => {
        const newFilters = { ...filters, [key]: value };
        setFilters(newFilters);
        
        if (key === 'sort_by') {
            onSortChange(value);
        } else {
            onFilterChange(newFilters);
        }
    };

    const resetFilters = () => {
        const resetFilters = {
            destination: '',
            price_min: '',
            price_max: '',
            duration: '',
            sort_by: 'latest'
        };
        setFilters(resetFilters);
        onFilterChange(resetFilters);
        onSortChange('latest');
    };

    return (
        <div className="tour-filters">
            <div className="filter-header">
                <h5>
                    <i className="fas fa-filter"></i> Bộ lọc & Sắp xếp
                </h5>
                <button 
                    className="btn btn-sm btn-outline-primary d-md-none"
                    onClick={() => setShowFilters(!showFilters)}
                >
                    {showFilters ? 'Ẩn bộ lọc' : 'Hiện bộ lọc'}
                </button>
            </div>

            <div className={`filter-content ${showFilters ? 'show' : ''}`}>
                {/* Sắp xếp */}
                <div className="filter-group">
                    <label>Sắp xếp theo:</label>
                    <select 
                        className="form-select"
                        value={filters.sort_by}
                        onChange={(e) => handleFilterChange('sort_by', e.target.value)}
                    >
                        <option value="latest">Mới nhất</option>
                        <option value="price_low">Giá thấp đến cao</option>
                        <option value="price_high">Giá cao đến thấp</option>
                        <option value="rating">Đánh giá cao nhất</option>
                        <option value="popular">Phổ biến nhất</option>
                    </select>
                </div>

                {/* Tìm kiếm điểm đến */}
                <div className="filter-group">
                    <label>Điểm đến:</label>
                    <input 
                        type="text"
                        className="form-control"
                        placeholder="Tìm điểm đến..."
                        value={filters.destination}
                        onChange={(e) => handleFilterChange('destination', e.target.value)}
                    />
                </div>

                {/* Thời gian */}
                <div className="filter-group">
                    <label>Thời gian:</label>
                    <select 
                        className="form-select"
                        value={filters.duration}
                        onChange={(e) => handleFilterChange('duration', e.target.value)}
                    >
                        <option value="">Tất cả</option>
                        <option value="1 ngày">1 ngày</option>
                        <option value="2 ngày">2 ngày</option>
                        <option value="3 ngày">3 ngày</option>
                        <option value="4 ngày">4 ngày</option>
                        <option value="5 ngày">5 ngày trở lên</option>
                    </select>
                </div>

                {/* Khoảng giá */}
                <div className="filter-group">
                    <label>Khoảng giá (VNĐ):</label>
                    <div className="price-range">
                        <input 
                            type="number"
                            className="form-control"
                            placeholder="Từ"
                            value={filters.price_min}
                            onChange={(e) => handleFilterChange('price_min', e.target.value)}
                        />
                        <span>-</span>
                        <input 
                            type="number"
                            className="form-control"
                            placeholder="Đến"
                            value={filters.price_max}
                            onChange={(e) => handleFilterChange('price_max', e.target.value)}
                        />
                    </div>
                    <div className="price-presets">
                        <button 
                            className="btn btn-sm btn-outline-secondary"
                            onClick={() => {
                                handleFilterChange('price_min', '500000');
                                handleFilterChange('price_max', '1000000');
                            }}
                        >
                            500k - 1tr
                        </button>
                        <button 
                            className="btn btn-sm btn-outline-secondary"
                            onClick={() => {
                                handleFilterChange('price_min', '1000000');
                                handleFilterChange('price_max', '2000000');
                            }}
                        >
                            1tr - 2tr
                        </button>
                        <button 
                            className="btn btn-sm btn-outline-secondary"
                            onClick={() => {
                                handleFilterChange('price_min', '2000000');
                                handleFilterChange('price_max', '');
                            }}
                        >
                            Trên 2tr
                        </button>
                    </div>
                </div>

                {/* Reset button */}
                <div className="filter-group">
                    <button 
                        className="btn btn-secondary w-100"
                        onClick={resetFilters}
                    >
                        <i className="fas fa-undo"></i> Đặt lại bộ lọc
                    </button>
                </div>
            </div>
        </div>
    );
};

export default TourFilters;