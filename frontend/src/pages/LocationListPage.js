import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import '../styles/LocationCSS/LocationListPage.css';
import { motion } from 'framer-motion'; // Thêm framer-motion cho hiệu ứng

function ApiLocationList() {
    const [locations, setLocations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 6;
    const [filter, setFilter] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [hoveredCard, setHoveredCard] = useState(null);

    // Animation variants
    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    const cardVariants = {
        hidden: { y: 50, opacity: 0 },
        visible: {
            y: 0,
            opacity: 1,
            transition: {
                type: 'spring',
                stiffness: 100,
                damping: 12
            }
        }
    };

    useEffect(() => {
        const fetchLocations = async () => {
            try {
                setLoading(true);
                const response = await fetch('http://localhost:5000/api/locations', {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });
                if (!response.ok) {
                    throw new Error('Không thể lấy dữ liệu địa điểm');
                }
                const data = await response.json();
                setLocations(data);
                setLoading(false);
            } catch (err) {
                setError(err.message);
                setLoading(false);
            }
        };

        fetchLocations();
    }, []);

    // Lọc địa điểm theo loại và tìm kiếm
    const filteredLocations = locations.filter(location => {
        const matchesFilter = filter === 'all' || (location.type && location.type.toLowerCase() === filter);
        const matchesSearch = !searchTerm || 
            (location.title && location.title.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (location.subtitle && location.subtitle.toLowerCase().includes(searchTerm.toLowerCase()));
        
        return matchesFilter && matchesSearch;
    });

    // Phân trang
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentLocations = filteredLocations.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredLocations.length / itemsPerPage);

    // Hàm chuyển trang
    const paginate = (pageNumber) => {
        if (pageNumber < 1 || pageNumber > totalPages) return;
        setCurrentPage(pageNumber);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // Hiển thị số trang
    const renderPageNumbers = () => {
        const pageNumbers = [];
        const maxPageButtons = 5;
        let startPage, endPage;

        if (totalPages <= maxPageButtons) {
            startPage = 1;
            endPage = totalPages;
        } else {
            const maxPagesBeforeCurrentPage = Math.floor(maxPageButtons / 2);
            const maxPagesAfterCurrentPage = Math.ceil(maxPageButtons / 2) - 1;
            if (currentPage <= maxPagesBeforeCurrentPage) {
                startPage = 1;
                endPage = maxPageButtons;
            } else if (currentPage + maxPagesAfterCurrentPage >= totalPages) {
                startPage = totalPages - maxPageButtons + 1;
                endPage = totalPages;
            } else {
                startPage = currentPage - maxPagesBeforeCurrentPage;
                endPage = currentPage + maxPagesAfterCurrentPage;
            }
        }

        if (startPage > 1) {
            pageNumbers.push(
                <motion.li key="1" 
                    whileHover={{ scale: 1.1 }}
                    className={`page-item ${1 === currentPage ? 'active' : ''}`}
                >
                    <button onClick={() => paginate(1)} className="page-link">1</button>
                </motion.li>
            );
            if (startPage > 2) {
                pageNumbers.push(<li key="start-ellipsis" className="page-item disabled"><span className="page-link">...</span></li>);
            }
        }

        for (let i = startPage; i <= endPage; i++) {
            pageNumbers.push(
                <motion.li 
                    key={i} 
                    className={`page-item ${i === currentPage ? 'active' : ''}`}
                    whileHover={{ scale: 1.1 }}
                >
                    <button onClick={() => paginate(i)} className="page-link">{i}</button>
                </motion.li>
            );
        }

        if (endPage < totalPages) {
            if (endPage < totalPages - 1) {
                pageNumbers.push(<li key="end-ellipsis" className="page-item disabled"><span className="page-link">...</span></li>);
            }
            pageNumbers.push(
                <motion.li 
                    key={totalPages} 
                    className={`page-item ${totalPages === currentPage ? 'active' : ''}`}
                    whileHover={{ scale: 1.1 }}
                >
                    <button onClick={() => paginate(totalPages)} className="page-link">{totalPages}</button>
                </motion.li>
            );
        }
        return pageNumbers;
    };

    if (loading) {
        return (
            <div className="location-loading">
                <div className="location-loader">
                    <svg className="location-loader-icon" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="50" cy="50" r="45" />
                    </svg>
                    <p>Đang khám phá địa điểm...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="location-error">
                <div className="location-error-content">
                    <i className="bi bi-exclamation-triangle"></i>
                    <h2>Rất tiếc!</h2>
                    <p>Không thể tải danh sách địa điểm. Vui lòng thử lại sau.</p>
                    <button onClick={() => window.location.reload()} className="reload-btn">
                        <i className="bi bi-arrow-clockwise"></i> Thử lại
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="locations-page">
            <div className="locations-hero">
                <div className="locations-hero-overlay"></div>
                <div className="locations-hero-content">
                    <h1 className="hero-title">Khám Phá Phú Yên</h1>
                    <p className="hero-subtitle">Những trải nghiệm tuyệt vời đang chờ đón bạn</p>
                </div>
            </div>

            <div className="locations-container">
                <div className="locations-filters">
                    <div className="filter-search">
                        <input 
                            type="text" 
                            placeholder="Tìm kiếm địa điểm..." 
                            value={searchTerm}
                            onChange={(e) => {
                                setSearchTerm(e.target.value);
                                setCurrentPage(1);
                            }}
                            className="search-input"
                        />
                        {searchTerm && (
                            <button 
                                className="clear-search" 
                                onClick={() => setSearchTerm('')}
                            >
                                <i className="bi bi-x"></i>
                            </button>
                        )}
                    </div>
                    <div className="filter-categories">
                        <button 
                            className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
                            onClick={() => {setFilter('all'); setCurrentPage(1);}}
                        >
                            <i className="bi bi-grid"></i>Tất cả
                        </button>
                        <button 
                            className={`filter-btn ${filter === 'biển' ? 'active' : ''}`}
                            onClick={() => {setFilter('biển'); setCurrentPage(1);}}
                        >
                            <i className="bi bi-water"></i>Biển
                        </button>
                        <button 
                            className={`filter-btn ${filter === 'núi' ? 'active' : ''}`}
                            onClick={() => {setFilter('núi'); setCurrentPage(1);}}
                        >
                            <i className="bi bi-mountains"></i>Núi
                        </button>
                        <button 
                            className={`filter-btn ${filter === 'di tích' ? 'active' : ''}`}
                            onClick={() => {setFilter('di tích'); setCurrentPage(1);}}
                        >
                            <i className="bi bi-building"></i>Di tích
                        </button>
                        <button 
                            className={`filter-btn ${filter === 'văn hóa' ? 'active' : ''}`}
                            onClick={() => {setFilter('văn hóa'); setCurrentPage(1);}}
                        >
                            <i className="bi bi-people"></i>Văn hóa
                        </button>
                    </div>
                </div>

                <div className="locations-results">
                    <div className="results-header">
                        <p className="results-count">
                            Đang hiển thị <span>{currentLocations.length}</span> trong số <span>{filteredLocations.length}</span> địa điểm
                        </p>
                    </div>

                    {filteredLocations.length === 0 ? (
                        <motion.div 
                            className="locations-empty"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5 }}
                        >
                            <i className="bi bi-map"></i>
                            <h3>Không tìm thấy địa điểm nào</h3>
                            <p>Không có địa điểm nào phù hợp với tìm kiếm của bạn. Vui lòng thử lại với từ khóa hoặc bộ lọc khác.</p>
                            <button 
                                className="reset-filter-btn"
                                onClick={() => { setFilter('all'); setSearchTerm(''); }}
                            >
                                <i className="bi bi-arrow-repeat"></i> Đặt lại bộ lọc
                            </button>
                        </motion.div>
                    ) : (
                        <motion.div 
                            className="locations-grid"
                            variants={containerVariants}
                            initial="hidden"
                            animate="visible"
                        >
                            {currentLocations.map((location, index) => (
                                <motion.div 
                                    key={location.id} 
                                    className="location-card-wrapper"
                                    variants={cardVariants}
                                    onHoverStart={() => setHoveredCard(location.id)}
                                    onHoverEnd={() => setHoveredCard(null)}
                                >
                                    <Link to={`/locations/${location.id}`} className="location-card">
                                        <div className="location-card-media">
                                            <div className="location-card-image">
                                                <img
                                                    src={location.introduction?.image 
                                                        ? `http://localhost:5000${location.introduction.image}` 
                                                        : 'https://images.unsplash.com/photo-1500964757637-c85e8a162699?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=60'
                                                    }
                                                    alt={location.title || 'Hình ảnh địa điểm'}
                                                />
                                            </div>
                                            {location.type && (
                                                <span className="location-card-badge">
                                                    <i className={`bi ${
                                                        location.type.toLowerCase() === 'biển' ? 'bi-water' :
                                                        location.type.toLowerCase() === 'núi' ? 'bi-mountains' :
                                                        location.type.toLowerCase() === 'di tích' ? 'bi-building' :
                                                        'bi-geo-alt'
                                                    }`}></i>
                                                    {location.type}
                                                </span>
                                            )}
                                            <div className="location-card-overlay"></div>
                                        </div>
                                        <div className="location-card-content">
                                            <h3 className="location-card-title">{location.title || 'Chưa có tiêu đề'}</h3>
                                            <p className="location-card-description">
                                                {location.subtitle 
                                                    ? (location.subtitle.length > 100 
                                                        ? location.subtitle.substring(0, 97) + "..." 
                                                        : location.subtitle) 
                                                    : 'Khám phá vẻ đẹp tiềm ẩn tại đây.'}
                                            </p>
                                            <div className={`location-card-action ${hoveredCard === location.id ? 'active' : ''}`}>
                                                <span>Khám phá</span>
                                                <i className="bi bi-arrow-right"></i>
                                            </div>
                                        </div>
                                    </Link>
                                </motion.div>
                            ))}
                        </motion.div>
                    )}

                    {totalPages > 1 && (
                        <motion.nav 
                            className="pagination-container"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                        >
                            <ul className="custom-pagination">
                                <motion.li whileHover={{ scale: 1.1 }}>
                                    <button 
                                        className={`pagination-arrow ${currentPage === 1 ? 'disabled' : ''}`}
                                        onClick={() => paginate(currentPage - 1)}
                                        disabled={currentPage === 1}
                                    >
                                        <i className="bi bi-chevron-left"></i>
                                    </button>
                                </motion.li>
                                {renderPageNumbers()}
                                <motion.li whileHover={{ scale: 1.1 }}>
                                    <button 
                                        className={`pagination-arrow ${currentPage === totalPages ? 'disabled' : ''}`}
                                        onClick={() => paginate(currentPage + 1)}
                                        disabled={currentPage === totalPages}
                                    >
                                        <i className="bi bi-chevron-right"></i>
                                    </button>
                                </motion.li>
                            </ul>
                        </motion.nav>
                    )}
                </div>
            </div>
        </div>
    );
}

export default ApiLocationList;
