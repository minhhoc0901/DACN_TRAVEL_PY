import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import '../../styles/HomePageCSS/DestinationsSection.css';
import axios from 'axios'; // Thêm axios

const DestinationsSection = () => {
    const [activeTab, setActiveTab] = useState('all');
    const [activeCard, setActiveCard] = useState(null);
    const [animateOut, setAnimateOut] = useState(false);
    
    const [locations, setLocations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Placeholder cho ảnh nếu API không trả về
    const placeholderImage = 'https://via.placeholder.com/400x300?text=Không+có+ảnh';

    useEffect(() => {
        const fetchLocations = async () => {
            try {
                setLoading(true);
                const response = await axios.get('http://localhost:5000/api/locations');
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
        // Thay đổi 'id' để khớp với giá trị 'type' từ API (ví dụ: 'di tích')
        // Giữ 'name' để hiển thị cho người dùng.
        { id: 'di tích', name: 'Di tích lịch sử', icon: 'bi-landmark' } 
    ];
    
    // Lọc các địa điểm theo category (type từ API)
    const filteredDestinations = activeTab === 'all' 
        ? locations 
        : locations.filter(item => {
            if (!item.type) return false; // Bỏ qua nếu địa điểm không có type
            // So sánh không phân biệt chữ hoa/thường và loại bỏ khoảng trắng thừa
            return item.type.trim().toLowerCase() === activeTab.toLowerCase();
          });

    useEffect(() => {
        // Animation khi chuyển tab
        if (activeTab) {
            setAnimateOut(true);
            const timer = setTimeout(() => {
                setAnimateOut(false);
            }, 300);
            return () => clearTimeout(timer);
        }
    }, [activeTab]);

    // Render sao đánh giá
    const renderStars = (rating) => {
        const numRating = parseFloat(rating) || 0; // Đảm bảo rating là số
        return (
            <div className="stars-rating">
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
            <section className="destinations-section">
                <div className="container">
                    <div className="destinations-loading" style={{ textAlign: 'center', padding: '50px' }}>
                        Đang tải các điểm đến...
                    </div>
                </div>
            </section>
        );
    }

    if (error) {
        return (
            <section className="destinations-section">
                <div className="container">
                    <div className="destinations-error" style={{ textAlign: 'center', padding: '50px', color: 'red' }}>
                        Lỗi: {error}
                    </div>
                </div>
            </section>
        );
    }

    return (
        <section className="destinations-section">
            <div className="destinations-decor">
                <div className="decor-circle decor-circle-1"></div>
                <div className="decor-circle decor-circle-2"></div>
                <div className="decor-line"></div>
            </div>
            
            <div className="container">
                <div className="destinations-header">
                    <div className="destinations-header-content">
                        <div className="section-subtitle">Khám phá Phú Yên</div>
                        <h2 className="section-title">Điểm Đến <span className="highlight-text">Nổi Bật</span></h2>
                        <p className="section-desc">
                            Khám phá những địa điểm du lịch tuyệt vời nhất tại Phú Yên, từ bãi biển hoang sơ đến các di tích lịch sử văn hóa đặc sắc
                        </p>
                    </div>
                </div>

                <div className="destinations-tabs">
                    <div className="destinations-tabs-wrapper">
                        {categories.map(category => (
                            <button 
                                key={category.id}
                                className={`tab-button ${activeTab === category.id ? 'active' : ''}`}
                                onClick={() => setActiveTab(category.id)}
                            >
                                <i className={`bi ${category.icon}`}></i>
                                <span>{category.name}</span>
                            </button>
                        ))}
                    </div>
                </div>

                <div className={`destinations-grid ${animateOut ? 'animate-out' : ''}`}>
                    {filteredDestinations.slice(0, 6).map(destination => (
                        <div 
                            key={destination.id} 
                            className={`destination-card ${activeCard === destination.id ? 'active' : ''}`}
                            onMouseEnter={() => setActiveCard(destination.id)}
                            onMouseLeave={() => setActiveCard(null)}
                        >
                            <div className="destination-card-inner">
                                <div className="destination-image">
                                    <img 
                                        src={destination.introduction?.image ? `http://localhost:5000${destination.introduction.image}` : placeholderImage} 
                                        alt={destination.title} 
                                    />
                                    <div className="destination-rating">
                                        {renderStars(destination.average_rating || 0)} {/* Sử dụng average_rating nếu có, nếu không thì 0 */}
                                        <div className="rating-text">
                                            <span>({destination.review_count || 0} đánh giá)</span> {/* Sử dụng review_count nếu có */}
                                        </div>
                                    </div>
                                    {/* featured hiện không có từ API, có thể ẩn hoặc để false */}
                                    {/* {destination.featured && (
                                        <div className="destination-featured">
                                            <i className="bi bi-bookmark-star-fill"></i>
                                            <span>Nổi bật</span>
                                        </div>
                                    )} */}
                                    <div className="destination-actions">
                                        <Link to={`/locations/${destination.id}`} className="btn-circle">
                                            <i className="bi bi-eye-fill"></i>
                                        </Link>
                                        <button className="btn-circle btn-favorite">
                                            <i className="bi bi-heart"></i>
                                        </button>
                                    </div>
                                </div>
                                
                                <div className="destination-content">
                                    <div className="destination-location">
                                        <i className="bi bi-geo-alt-fill"></i>
                                        <span>{destination.subtitle || destination.type || 'Phú Yên'}</span>
                                    </div>
                                    
                                    <h3 className="destination-title">
                                        <Link to={`/locations/${destination.id}`}>{destination.title}</Link>
                                    </h3>
                                    
                                    <p className="destination-desc">{destination.description ? destination.description.substring(0, 100) + '...' : 'Không có mô tả.'}</p>
                                    
                                    {/* tags hiện không có từ API, có thể ẩn hoặc để trống */}
                                    {/* <div className="destination-tags">
                                        {destination.tags.map((tag, index) => (
                                            <span key={index} className="destination-tag">{tag}</span>
                                        ))}
                                    </div> */}
                                    
                                    <div className="destination-footer">
                                        <Link to={`/locations/${destination.id}`} className="btn-explore">
                                            <span>Khám phá ngay</span>
                                            <svg viewBox="0 0 24 24" width="24" height="24">
                                                <path d="M5 12h14M12 5l7 7-7 7"></path>
                                            </svg>
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
                
                <div className="destinations-cta">
                    <Link to="/locations" className="btn-view-all">
                        Xem tất cả địa điểm
                    </Link>
                    <Link to="/tours" className="btn-view-tours">
                        <i className="bi bi-ticket-perforated"></i>
                        Xem Tours du lịch
                    </Link>
                </div>
            </div>
        </section>
    );
};

export default DestinationsSection;