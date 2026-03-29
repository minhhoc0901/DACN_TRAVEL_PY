import React from "react";
import '../../styles/About/AboutBanner.css';
import bannerImg from '../../assets/images/background_BX_2.jpg';

const AboutBanner = () => (
  <section className="pyab-banner">
    <div className="pyab-overlay"></div>
    <div className="container position-relative">
      <div className="pyab-content">
        <div className="row align-items-center">
          <div className="col-lg-6 pyab-text-content">
            <div className="pyab-badge">
              <span className="pyab-badge-text">Khám phá Phú Yên</span>
              <i className="bi bi-compass-fill"></i>
            </div>
            
            <h1 className="pyab-title">
              Trải Nghiệm Vẻ Đẹp 
              <span className="pyab-highlight"> Xứ Nẫu</span>
            </h1>

            <p className="pyab-description">
              Phú Yên - nơi thiên nhiên hào phóng ban tặng những bãi biển tuyệt đẹp, 
              những di tích lịch sử giàu giá trị văn hóa, và ẩm thực đặc sắc. 
              Hãy cùng chúng tôi khám phá vùng đất kỳ diệu này!
            </p>

            <div className="pyab-stats">
              <div className="pyab-stat-item">
                <div className="pyab-stat-card">
                  <h4>50+</h4>
                  <p>Điểm đến</p>
                </div>
              </div>
              <div className="pyab-stat-item">
                <div className="pyab-stat-card">
                  <h4>1000+</h4>
                  <p>Du khách</p>
                </div>
              </div>
              <div className="pyab-stat-item">
                <div className="pyab-stat-card">
                  <h4>98%</h4>
                  <p>Đánh giá tốt</p>
                </div>
              </div>
            </div>

            <div className="pyab-cta">
              <a href="#about-mission" className="pyab-btn-explore">
                Khám phá ngay
                <i className="bi bi-arrow-right"></i>
              </a>
            </div>
          </div>

          <div className="col-lg-6 pyab-image-content">
            <div className="pyab-image-wrapper">
              <img src={bannerImg} alt="Phú Yên cảnh đẹp" className="pyab-main-image" />
              <div className="pyab-floating-card pyab-card-1">
                <i className="bi bi-camera"></i>
                <span>Điểm check-in tuyệt đẹp</span>
              </div>
              <div className="pyab-floating-card pyab-card-2">
                <i className="bi bi-heart"></i>
                <span>Trải nghiệm độc đáo</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div className="pyab-shapes">
      <div className="pyab-shape pyab-shape-1"></div>
      <div className="pyab-shape pyab-shape-2"></div>
      <div className="pyab-shape pyab-shape-3"></div>
    </div>
  </section>
);

export default AboutBanner;