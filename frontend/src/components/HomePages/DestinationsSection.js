import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import '../../styles/HomePageCSS/DestinationsSection.css';
import axios from 'axios';
import { CONFIG } from '../../config';
import { getDisplayImageUrl } from '../../utils/imageUtils';

const DestinationsSection = () => {
    const [activeTab, setActiveTab] = useState('all');
    const containerRef = useRef(null);
    const [animateOut, setAnimateOut] = useState(false);
    const [activeCard, setActiveCard] = useState(null);
    
    const [locations, setLocations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchLocations = async () => {
            try {
                setLoading(true);
                const response = await axios.get(`${CONFIG.API_API_URL}/locations`);
                setLocations(response.data || []);
                setError(null);
            } catch (err) {
                console.error("Error fetching locations:", err);
                setError("Không thể tải danh sách điểm đến. Vui lòng thử lại sau.");
                setLocations([]);
            } finally {
                setLoading(false);
            }
        };
        fetchLocations();
    }, []);
    
    const categories = [
        { id: 'all', name: 'Tất cả', icon: 'bi-collection' },
        { id: 'thiên nhiên', name: 'Thiên nhiên', icon: 'bi-tree' },
        { id: 'bãi biển', name: 'Bãi biển', icon: 'bi-water' },
        { id: 'văn hóa', name: 'Văn hóa', icon: 'bi-bank' },
        { id: 'di tích', name: 'Di tích lịch sử', icon: 'bi-landmark' } 
    ];
    
    const filteredDestinations = activeTab === 'all' 
        ? locations 
        : locations.filter(item => {
            if (!item.type) return false;
            return item.type.trim().toLowerCase() === activeTab.toLowerCase();
          });

    useEffect(() => {
        if (activeTab) {
            setAnimateOut(true);
            const timer = setTimeout(() => {
                setAnimateOut(false);
            }, 300);
            return () => clearTimeout(timer);
        }
    }, [activeTab]);

    const renderStars = (rating) => {
        const numRating = parseFloat(rating) || 0;
        return (
            <div className="pydes-stars">
                {[...Array(5)].map((_, i) => (
                    <i 
                        key={i} 
                        className={`bi ${i < Math.floor(numRating) ? 'bi-star-fill' : 
                                        i < numRating ? 'bi-star-half' : 'bi-star'}`}
                    ></i>
                ))}
            </div>
        );
    };

    if (loading) {
        return (
            <section className="pydes-section">
                <div className="container">
                    <div className="pydes-loading">
                        <div className="pydes-spinner"></div>
                        <p>Đang tải các điểm đến...</p>
                    </div>
                </div>
            </section>
        );
    }

    if (error) {
        return (
            <section className="pydes-section">
                <div className="container">
                    <div className="pydes-error">
                        <i className="bi bi-exclamation-triangle"></i>
                        <p>{error}</p>
                    </div>
                </div>
            </section>
        );
    }

    return (
        <section className="pydes-section">
            {/* Background Decoration */}
            <div className="pydes-bg-shapes">
                <div className="pydes-shape pydes-shape-1"></div>
                <div className="pydes-shape pydes-shape-2"></div>
                <div className="pydes-shape pydes-shape-3"></div>
            </div>
            
            <div className="container position-relative">
                {/* ========== HEADER ========== */}
                <div 
                    className="pydes-header"
                    data-aos="fade-up"
                    data-aos-duration="800"
                >
                    <span className="pydes-badge">Điểm đến nổi bật</span>
                    <h2 className="pydes-title">
                        Khám phá <span className="pydes-highlight">Phú Yên</span>
                    </h2>
                    <div className="pydes-separator">
                        <span></span>
                        <i className="bi bi-geo-alt-fill"></i>
                        <span></span>
                    </div>
                    <p className="pydes-subtitle">
                        Khám phá những địa điểm du lịch tuyệt vời nhất tại Phú Yên, từ bãi biển hoang sơ đến các di tích lịch sử văn hóa đặc sắc
                    </p>
                </div>

                {/* ========== TABS ========== */}
                <div 
                    className="pydes-tabs"
                    data-aos="fade-up"
                    data-aos-duration="800"
                    data-aos-delay="200"
                >
                    {categories.map(category => (
                        <button 
                            key={category.id}
                            className={`pydes-tab ${activeTab === category.id ? 'active' : ''}`}
                            onClick={() => setActiveTab(category.id)}
                        >
                            <i className={`bi ${category.icon}`}></i>
                            <span>{category.name}</span>
                        </button>
                    ))}
                </div>

                {/* ========== GRID ========== */}
                <div className={`pydes-grid ${animateOut ? 'fade-out' : ''}`}>
                    {filteredDestinations.slice(0, 6).map((destination, index) => (
                        <div 
                            key={destination.id} 
                            className="pydes-card"
                            data-aos="fade-up"
                            data-aos-duration="600"
                            data-aos-delay={index * 100}
                            onMouseEnter={() => setActiveCard(destination.id)}
                            onMouseLeave={() => setActiveCard(null)}
                        >
                            {/* Image */}
                            <div className="pydes-card-image">
                                <img 
                                    src={getDisplayImageUrl(destination.introduction?.image)} 
                                    alt={destination.title} 
                                />
                                <div className="pydes-overlay"></div>
                                
                                {/* Rating */}
                                <div className="pydes-rating">
                                    {renderStars(destination.average_rating || 0)}
                                    <span className="pydes-rating-text">
                                        ({destination.review_count || 0})
                                    </span>
                                </div>

                                {/* Actions */}
                                <div className="pydes-actions">
                                    <Link to={`/locations/${destination.id}`} className="pydes-action-btn">
                                        <i className="bi bi-eye-fill"></i>
                                    </Link>
                                    <button className="pydes-action-btn pydes-favorite">
                                        <i className="bi bi-heart"></i>
                                    </button>
                                </div>
                            </div>
                            
                            {/* Content */}
                            <div className="pydes-card-content">
                                <div className="pydes-location">
                                    <i className="bi bi-geo-alt-fill"></i>
                                    <span>{destination.subtitle || destination.type || 'Phú Yên'}</span>
                                </div>
                                
                                <h3 className="pydes-card-title">
                                    <Link to={`/locations/${destination.id}`}>
                                        {destination.title}
                                    </Link>
                                </h3>
                                
                                <p className="pydes-card-desc">
                                    {destination.description ? destination.description.substring(0, 100) + '...' : 'Không có mô tả.'}
                                </p>
                                
                                <Link to={`/locations/${destination.id}`} className="pydes-explore-btn">
                                    <span>Khám phá ngay</span>
                                    <i className="bi bi-arrow-right"></i>
                                </Link>
                            </div>
                        </div>
                    ))}
                </div>

                {/* ========== VIEW ALL BUTTON ========== */}
                <div 
                    className="pydes-view-all"
                    data-aos="fade-up"
                    data-aos-duration="800"
                    data-aos-delay="400"
                >
                    <Link to="/locations" className="pydes-btn-view-all">
                        <span>Xem tất cả địa điểm</span>
                        <i className="bi bi-arrow-right-circle-fill"></i>
                    </Link>
                </div>
            </div>
        </section>
    );
};

export default DestinationsSection;