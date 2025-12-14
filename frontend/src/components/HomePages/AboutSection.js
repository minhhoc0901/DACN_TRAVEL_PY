import React from 'react';
import { Link } from 'react-router-dom';
import '../../styles/HomePageCSS/AboutSection.css';

import img1 from '../../assets/images/background_PY_1.jpg';
import img2 from '../../assets/images/background_BX_2.jpg';
import img3 from '../../assets/images/background_GDD_3.jpg';

const AboutSection = () => {
    return (
        <section className="pyhome-about-section">
            <div className="pyhome-about-bg-shapes">
                <div className="pyhome-shape-1"></div>
                <div className="pyhome-shape-2"></div>
                <div className="pyhome-shape-3"></div>
            </div>
            
            <div className="container">
                {/* Header */}
                <div 
                    className="pyhome-about-header text-center"
                    data-aos="fade-up"
                    data-aos-duration="800"
                >
                    <span className="pyhome-about-subtitle">Giới thiệu</span>
                    <h2 className="pyhome-about-title">Khám phá vẻ đẹp Phú Yên</h2>
                    <div className="pyhome-title-separator">
                        <span></span>
                        <i className="bi bi-geo-alt-fill"></i>
                        <span></span>
                    </div>
                </div>

                <div className="pyhome-about-content">
                    <div className="row gx-5 gy-4 align-items-center">
                        {/* Left Column - Image Gallery */}
                        <div 
                            className="col-lg-6"
                            data-aos="fade-right"
                            data-aos-duration="1000"
                            data-aos-delay="200"
                        >
                            <div className="pyhome-about-gallery">
                                <div className="pyhome-main-image">
                                    <img src={img1} alt="Biển Phú Yên" className="img-fluid" />
                                </div>
                                <div className="pyhome-gallery-grid">
                                    <div className="pyhome-grid-item">
                                        <img src={img2} alt="Bãi Xép" />
                                    </div>
                                    <div className="pyhome-grid-item">
                                        <img src={img3} alt="Gành Đá Đĩa" />
                                    </div>
                                    <div className="pyhome-grid-item pyhome-statistics">
                                        <div className="pyhome-about-stat-box">
                                            <div className="pyhome-about-stat-box__number">20+</div>
                                            <div className="pyhome-about-stat-box__label">Điểm đến</div>
                                        </div>
                                    </div>
                                    <div className="pyhome-grid-item pyhome-highlight">
                                        <div className="pyhome-highlight-content">
                                            <i className="bi bi-camera-fill"></i>
                                            <span>Check-in Hot</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Right Column - Content */}
                        <div 
                            className="col-lg-6"
                            data-aos="fade-left"
                            data-aos-duration="1000"
                            data-aos-delay="400"
                        >
                            <div className="pyhome-about-info">
                                <h3 className="pyhome-section-subtitle">Về Phú Yên</h3>
                                <p className="pyhome-about-description">
                                    Phú Yên - Viên ngọc xanh của vùng biển miền Trung, nơi thiên nhiên ban tặng những bãi biển hoang sơ, 
                                    những di tích lịch sử đậm đà bản sắc văn hóa và ẩm thực đặc trưng khó quên.
                                </p>
                                
                                <div className="pyhome-features-list">
                                    <div 
                                        className="pyhome-feature-box"
                                        data-aos="fade-up"
                                        data-aos-delay="600"
                                    >
                                        <div className="pyhome-feature-icon">
                                            <i className="bi bi-geo-alt"></i>
                                        </div>
                                        <div className="pyhome-feature-content">
                                            <h4>Gành Đá Đĩa</h4>
                                            <p>Kỳ quan thiên nhiên với những khối đá bazan hình lục giác độc đáo</p>
                                        </div>
                                    </div>
                                    
                                    <div 
                                        className="pyhome-feature-box"
                                        data-aos="fade-up"
                                        data-aos-delay="700"
                                    >
                                        <div className="pyhome-feature-icon">
                                            <i className="bi bi-water"></i>
                                        </div>
                                        <div className="pyhome-feature-content">
                                            <h4>Bãi Xép & Vũng Rô</h4>
                                            <p>Bãi biển hoang sơ cùng vịnh biển trong xanh tuyệt đẹp</p>
                                        </div>
                                    </div>
                                    
                                    <div 
                                        className="pyhome-feature-box"
                                        data-aos="fade-up"
                                        data-aos-delay="800"
                                    >
                                        <div className="pyhome-feature-icon">
                                            <i className="bi bi-cup-hot"></i>
                                        </div>
                                        <div className="pyhome-feature-content">
                                            <h4>Ẩm thực độc đáo</h4>
                                            <p>Sò huyết Ô Loan, mắt cá ngừ đại dương và nhiều đặc sản khác</p>
                                        </div>
                                    </div>
                                </div>
                                
                                <div 
                                    className="pyhome-about-actions"
                                    data-aos="fade-up"
                                    data-aos-delay="900"
                                >
                                    <Link to="/locations" className="pyhome-btn-explore">
                                        <span>Khám phá ngay</span>
                                        <i className="bi bi-arrow-right"></i>
                                    </Link>
                                    <Link to="/about" className="pyhome-about-link">
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