import React from 'react';
import { Link } from 'react-router-dom';
import '../../styles/HomePageCSS/AboutSection.css';

// Import hình ảnh
import img1 from '../../assets/images/background_PY_1.jpg';
import img2 from '../../assets/images/background_BX_2.jpg';
import img3 from '../../assets/images/background_GDD_3.jpg';

const AboutSection = () => {
    return (
        <section className="about-section">
            <div className="about-bg-shapes">
                <div className="shape-1"></div>
                <div className="shape-2"></div>
                <div className="shape-3"></div>
            </div>
            
            <div className="container">
                <div className="about-header text-center">
                    <span className="about-subtitle">Giới thiệu</span>
                    <h2 className="about-title">Khám phá vẻ đẹp Phú Yên</h2>
                    <div className="title-separator">
                        <span></span>
                        <i className="bi bi-geo-alt-fill"></i>
                        <span></span>
                    </div>
                </div>

                <div className="about-content">
                    <div className="row gx-5 gy-4 align-items-center">
                        {/* Left Column - Image Gallery */}
                        <div className="col-lg-6">
                            <div className="about-gallery">
                                <div className="main-image">
                                    <img src={img1} alt="Biển Phú Yên" className="img-fluid" />
                                </div>
                                <div className="gallery-grid">
                                    <div className="grid-item">
                                        <img src={img2} alt="Bãi Xép" />
                                    </div>
                                    <div className="grid-item">
                                        <img src={img3} alt="Gành Đá Đĩa" />
                                    </div>
                                    <div className="grid-item statistics">
                                        <div className="stat">
                                            <div className="stat-number">20+</div>
                                            <div className="stat-label">Điểm đến</div>
                                        </div>
                                    </div>
                                    <div className="grid-item highlight">
                                        <div className="highlight-content">
                                            <i className="bi bi-camera-fill"></i>
                                            <span>Thiên đường sống ảo</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Right Column - Content */}
                        <div className="col-lg-6">
                            <div className="about-info">
                                <div className="quote-box">
                                    <i className="bi bi-quote"></i>
                                    <p>Phú Yên - Nơi đón ánh bình minh đầu tiên của Tổ quốc</p>
                                </div>
                                
                                <p className="about-description">
                                    Phú Yên là vùng đất của nắng vàng, biển xanh và những bãi cát trắng mịn màng. 
                                    Được mệnh danh là <span className="highlight-text">"Xứ sở hoa vàng cỏ xanh"</span> sau 
                                    bộ phim cùng tên, Phú Yên níu chân du khách bởi vẻ đẹp hoang sơ, bình yên và những 
                                    điểm đến độc đáo không thể tìm thấy ở nơi nào khác.
                                </p>
                                
                                <div className="feature-boxes">
                                    <div className="feature-box">
                                        <div className="feature-icon">
                                            <i className="bi bi-geo-alt"></i>
                                        </div>
                                        <div className="feature-content">
                                            <h4>Gành Đá Đĩa</h4>
                                            <p>Kỳ quan thiên nhiên độc đáo với hàng nghìn cột đá hình lục giác</p>
                                        </div>
                                    </div>
                                    
                                    <div className="feature-box">
                                        <div className="feature-icon">
                                            <i className="bi bi-water"></i>
                                        </div>
                                        <div className="feature-content">
                                            <h4>Bãi Xép & Vũng Rô</h4>
                                            <p>Bãi biển hoang sơ cùng vịnh biển trong xanh tuyệt đẹp</p>
                                        </div>
                                    </div>
                                    
                                    <div className="feature-box">
                                        <div className="feature-icon">
                                            <i className="bi bi-cup-hot"></i>
                                        </div>
                                        <div className="feature-content">
                                            <h4>Ẩm thực độc đáo</h4>
                                            <p>Sò huyết Ô Loan, mắt cá ngừ đại dương và nhiều đặc sản khác</p>
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="about-actions">
                                    <Link to="/locations" className="btn btn-primary">
                                        <span>Khám phá ngay</span>
                                        <i className="bi bi-arrow-right"></i>
                                    </Link>
                                    <Link to="/about" className="about-link">
                                        <span>Tìm hiểu thêm</span>
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default AboutSection;