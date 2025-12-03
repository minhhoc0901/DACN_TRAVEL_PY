import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import TourCard from '../components/Tour/TourCard';
import TourFilters from '../components/Tour/TourFilters';
import Pagination from '../components/Pagination';
import { tourService } from '../services/tourService';
import '../styles/Tour/TourListPage.css';

const TourListPage = () => {
    const navigate = useNavigate();
    const [tours, setTours] = useState([]);
    const [pagination, setPagination] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filters, setFilters] = useState({
        page: 1,
        limit: 12,
        sort_by: 'latest'
    });

    const [debounceTimer, setDebounceTimer] = useState(null);

    const fetchTours = useCallback(async (currentFilters) => {
        try {
            setLoading(true);
            setError(null);
            
            const response = await tourService.getToursForSale(currentFilters);
            
            if (response.success) {
                setTours(response.data.tours);
                setPagination(response.data.pagination);
            } else {
                setError('Không thể lấy danh sách tour');
            }
        } catch (err) {
            setError('Lỗi kết nối. Vui lòng thử lại sau.');
            console.error('Error fetching tours:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchTours(filters);
    }, [fetchTours, filters]);

    const handleFilterChange = (newFilters) => {
        if (debounceTimer) {
            clearTimeout(debounceTimer);
        }

        const timer = setTimeout(() => {
            setFilters(prev => ({
                ...prev,
                ...newFilters,
                page: 1
            }));
        }, 500);

        setDebounceTimer(timer);
    };

    const handleSortChange = (sortBy) => {
        setFilters(prev => ({
            ...prev,
            sort_by: sortBy,
            page: 1
        }));
    };

    const handlePageChange = (newPage) => {
        setFilters(prev => ({
            ...prev,
            page: newPage
        }));
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleBookTour = (tour) => {
        if (tour.min_price > 0) {
            navigate(`/booking/${tour.id}`, { 
                state: { 
                    tourId: tour.id,
                    tourName: tour.title,
                    tourImage: tour.image,
                    minPrice: tour.min_price
                } 
            });
        } else {
            navigate(`/tours/${tour.id}`);
        }
    };

    const handleRefresh = () => {
        fetchTours(filters);
    };

    return (
        <div className="v2-tour-list-page">
            <div className="container-fluid">
                {/* Header */}
                <div className="v2-page-header">
                    <div className="row align-items-center">
                        <div className="col-md-8">
                            <h1>
                                <i className="fas fa-map-marked-alt"></i>
                                Khám phá Tours Phú Yên
                            </h1>
                            <p className="v2-page-subtitle">
                                Tìm kiếm và đặt ngay những tour du lịch tuyệt vời tại Phú Yên
                            </p>
                        </div>
                        <div className="col-md-4 text-end">
                            <button 
                                className="btn btn-outline-primary"
                                onClick={handleRefresh}
                                disabled={loading}
                            >
                                <i className="fas fa-sync-alt"></i> Làm mới
                            </button>
                        </div>
                    </div>
                </div>

                <div className="row">
                    {/* Sidebar - Filters */}
                    <div className="col-lg-3 col-md-4">
                        <TourFilters 
                            onFilterChange={handleFilterChange}
                            onSortChange={handleSortChange}
                        />
                    </div>

                    {/* Main content */}
                    <div className="col-lg-9 col-md-8">
                        {/* Results header */}
                        <div className="v2-results-header">
                            <div className="v2-results-info">
                                {!loading && (
                                    <span>
                                        Tìm thấy <strong>{pagination.total || 0}</strong> tour
                                        {filters.destination && ` cho "${filters.destination}"`}
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Loading state */}
                        {loading && (
                            <div className="v2-loading-container">
                                <div className="spinner-border text-primary" role="status">
                                    <span className="visually-hidden">Đang tải...</span>
                                </div>
                                <p className="mt-3">Đang tìm kiếm tours cho bạn...</p>
                            </div>
                        )}

                        {/* Error state */}
                        {error && (
                            <div className="alert alert-danger" role="alert">
                                <i className="fas fa-exclamation-triangle me-2"></i>
                                {error}
                                <button 
                                    className="btn btn-sm btn-outline-danger ms-3"
                                    onClick={handleRefresh}
                                >
                                    Thử lại
                                </button>
                            </div>
                        )}

                        {/* Tours grid */}
                        {!loading && !error && (
                            <>
                                {tours.length > 0 ? (
                                    <>
                                        <div className="v2-tours-grid">
                                            {tours.map(tour => (
                                                <div key={tour.id} className="v2-tour-grid-item">
                                                    <TourCard 
                                                        tour={tour} 
                                                        onBookTour={handleBookTour}
                                                    />
                                                </div>
                                            ))}
                                        </div>

                                        {/* Pagination */}
                                        <Pagination 
                                            pagination={pagination}
                                            onPageChange={handlePageChange}
                                        />
                                    </>
                                ) : (
                                    <div className="v2-no-results">
                                        <div className="v2-no-results-icon">
                                            <i className="fas fa-search"></i>
                                        </div>
                                        <h3>Không tìm thấy tour nào</h3>
                                        <p>Hãy thử điều chỉnh bộ lọc để tìm kiếm tour phù hợp.</p>
                                        <button 
                                            className="btn btn-primary"
                                            onClick={() => {
                                                setFilters({
                                                    page: 1,
                                                    limit: 12,
                                                    sort_by: 'latest'
                                                });
                                            }}
                                        >
                                            Xem tất cả tours
                                        </button>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TourListPage;