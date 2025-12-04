import React from "react";
import '../../styles/About/AboutFeatures.css';

const features = [
  {
    icon: "bi bi-compass",
    title: "Khám Phá Đa Dạng",
    desc: "Từ những bãi biển hoang sơ đến những ngọn núi hùng vĩ, Phú Yên mang đến trải nghiệm du lịch đa dạng và độc đáo.",
    color: "#0072bb"
  },
  {
    icon: "bi bi-stars",
    title: "Trải Nghiệm Độc Đáo",
    desc: "Check-in những địa điểm nổi tiếng, thưởng thức ẩm thực đặc sắc và tham gia các hoạt động văn hóa địa phương.",
    color: "#00b4d8"
  },
  {
    icon: "bi bi-heart",
    title: "Dịch Vụ Tận Tâm",
    desc: "Đội ngũ nhân viên chuyên nghiệp, nhiệt tình sẵn sàng hỗ trợ bạn 24/7 trong suốt hành trình.",
    color: "#ff6b6b"
  },
  {
    icon: "bi bi-shield-check",
    title: "An Toàn & Tin Cậy",
    desc: "Cam kết đảm bảo an toàn cho du khách và mang đến những trải nghiệm du lịch chất lượng nhất.",
    color: "#38b000"
  }
];

const AboutFeatures = () => (
  <section className="features-section">
    <div className="container">
      <div className="section-header">
        <div className="section-badge">Tại sao chọn chúng tôi</div>
        <h2 className="section-title">Điểm Nổi Bật Của Phú Yên Travel</h2>
        <p className="section-subtitle">
          Chúng tôi cam kết mang đến những trải nghiệm du lịch tuyệt vời nhất tại Phú Yên
        </p>
      </div>

      <div className="features-grid">
        {features.map((feature, idx) => (
          <div className="feature-card" key={idx} style={{"--accent-color": feature.color}}>
            <div className="feature-icon">
              <i className={feature.icon}></i>
            </div>
            <div className="feature-content">
              <h3>{feature.title}</h3>
              <p>{feature.desc}</p>
            </div>
            <div className="feature-number">0{idx + 1}</div>
          </div>
        ))}
      </div>

      <div className="features-stats">
        <div className="stat-item">
          <div className="stat-number">1000+</div>
          <div className="stat-label">Khách Hàng Hài Lòng</div>
        </div>
        <div className="stat-item">
          <div className="stat-number">50+</div>
          <div className="stat-label">Điểm Đến Hấp Dẫn</div>
        </div>
        <div className="stat-item">
          <div className="stat-number">98%</div>
          <div className="stat-label">Đánh Giá Tích Cực</div>
        </div>
      </div>
    </div>
  </section>
);

export default AboutFeatures;