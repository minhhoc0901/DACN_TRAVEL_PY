import React from "react";
import '../../styles/About/AboutBanner.css';
import bannerImg from '../../assets/images/background_BX_2.jpg';

const AboutBanner = () => (
  <section className="about-banner">
    <div className="about-banner__overlay"></div>
    <div className="container position-relative">
      <div className="about-banner__content">
        <div className="row align-items-center">
          <div className="col-lg-6 about-banner__text-content">
            <div className="about-banner__badge">
              <span className="badge-text">Khám phá Phú Yên</span>
              <i className="bi bi-compass-fill"></i>
            </div>
            
            <h1 className="about-banner__title">
              Trải Nghiệm Vẻ Đẹp 
              <span className="highlight-text"> Xứ Nẫu</span>
            </h1>

            <p className="about-banner__description">
              Chào mừng bạn đến với Phú Yên Travel - nơi những hành trình đáng nhớ bắt đầu. 
              Chúng tôi tự hào mang đến cho bạn những trải nghiệm du lịch độc đáo và đáng nhớ nhất.
            </p>

            <div className="about-banner__stats">
              <div className="stat-item">
                <i className="bi bi-geo-alt"></i>
                <div className="stat-content">
                  <h4>50+</h4>
                  <p>Điểm đến</p>
                </div>
              </div>
              <div className="stat-item">
                <i className="bi bi-people"></i>
                <div className="stat-content">
                  <h4>1000+</h4>
                  <p>Khách hàng</p>
                </div>
              </div>
              <div className="stat-item">
                <i className="bi bi-star"></i>
                <div className="stat-content">
                  <h4>98%</h4>
                  <p>Đánh giá tốt</p>
                </div>
              </div>
            </div>

            <div className="about-banner__cta">
              <a href="#about-mission" className="btn-explore">
                Khám phá ngay
                <i className="bi bi-arrow-right"></i>
              </a>
            </div>
          </div>

          <div className="col-lg-6 about-banner__image-content">
            <div className="image-wrapper">
              <img src={bannerImg} alt="Phú Yên cảnh đẹp" className="main-image" />
              <div className="floating-card card-1">
                <i className="bi bi-camera"></i>
                <span>Điểm check-in tuyệt đẹp</span>
              </div>
              <div className="floating-card card-2">
                <i className="bi bi-heart"></i>
                <span>Trải nghiệm độc đáo</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div className="about-banner__shapes">
      <div className="shape shape-1"></div>
      <div className="shape shape-2"></div>
      <div className="shape shape-3"></div>
    </div>
  </section>
);

export default AboutBanner;