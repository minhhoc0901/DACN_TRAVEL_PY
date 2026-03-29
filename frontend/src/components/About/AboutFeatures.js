import React from "react";
import '../../styles/About/AboutFeatures.css';

const AboutFeatures = () => (
  <section className="pyaf-section">
    <div className="container">
      {/* Header */}
      <div className="pyaf-header">
        <span className="pyaf-badge">Tại sao chọn chúng tôi</span>
        <h2 className="pyaf-title">Điểm Nổi Bật Của Chúng Tôi</h2>
        <p className="pyaf-subtitle">
          Cam kết mang đến trải nghiệm du lịch tốt nhất với những dịch vụ chuyên nghiệp
        </p>
      </div>

      {/* Features Grid */}
      <div className="pyaf-features-grid">
        <div className="pyaf-feature-card">
          <div className="pyaf-feature-icon">
            <i className="bi bi-award"></i>
          </div>
          <h3>Dịch vụ chất lượng</h3>
          <p>Đội ngũ hướng dẫn viên chuyên nghiệp, nhiệt tình và am hiểu địa phương</p>
        </div>

        <div className="pyaf-feature-card">
          <div className="pyaf-feature-icon">
            <i className="bi bi-shield-check"></i>
          </div>
          <h3>An toàn đảm bảo</h3>
          <p>Bảo hiểm du lịch toàn diện, phương tiện đạt chuẩn an toàn</p>
        </div>

        <div className="pyaf-feature-card">
          <div className="pyaf-feature-icon">
            <i className="bi bi-currency-dollar"></i>
          </div>
          <h3>Giá cả hợp lý</h3>
          <p>Mức giá cạnh tranh với nhiều ưu đãi hấp dẫn cho khách hàng thân thiết</p>
        </div>

        <div className="pyaf-feature-card">
          <div className="pyaf-feature-icon">
            <i className="bi bi-headset"></i>
          </div>
          <h3>Hỗ trợ 24/7</h3>
          <p>Luôn sẵn sàng hỗ trợ khách hàng mọi lúc, mọi nơi trong suốt hành trình</p>
        </div>

        <div className="pyaf-feature-card">
          <div className="pyaf-feature-icon">
            <i className="bi bi-globe"></i>
          </div>
          <h3>Đa dạng lịch trình</h3>
          <p>Nhiều tour đa dạng từ văn hóa, thiên nhiên đến ẩm thực</p>
        </div>

        <div className="pyaf-feature-card">
          <div className="pyaf-feature-icon">
            <i className="bi bi-star"></i>
          </div>
          <h3>Trải nghiệm độc đáo</h3>
          <p>Khám phá những điểm đến ít người biết, trải nghiệm văn hóa bản địa</p>
        </div>
      </div>

      {/* Stats */}
      <div className="pyaf-stats-wrapper">
        <div className="pyaf-stat-item">
          <div className="pyaf-stat-number">1000+</div>
          <div className="pyaf-stat-label">Khách Hàng Hài Lòng</div>
        </div>
        <div className="pyaf-stat-item">
          <div className="pyaf-stat-number">50+</div>
          <div className="pyaf-stat-label">Điểm Đến Hấp Dẫn</div>
        </div>
        <div className="pyaf-stat-item">
          <div className="pyaf-stat-number">98%</div>
          <div className="pyaf-stat-label">Đánh Giá Tích Cực</div>
        </div>
      </div>
    </div>
  </section>
);

export default AboutFeatures;