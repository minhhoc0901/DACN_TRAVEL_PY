import React from "react";
import '../../styles/About/AboutPartners.css';
import doitac_1 from '../../assets/images/doitac_1.png';
import doitac_2 from '../../assets/images/doitac_2.jpg';

const partners = [
  {
    name: "TravelCo",
    logo: doitac_1,
    description: "Đối tác du lịch hàng đầu khu vực miền Trung",
    website: "#"
  },
  {
    name: "HotelX",
    logo: doitac_2,
    description: "Chuỗi khách sạn cao cấp tại Phú Yên",
    website: "#"
  }
];

const AboutPartners = () => (
  <section className="aboutpartners-modern-section">
    <div className="container">
      <div className="aboutpartners-header text-center">
        <span className="aboutpartners-badge">Đối tác chiến lược</span>
        <h2 className="aboutpartners-title">
          Cùng đồng hành phát triển <span className="highlight">Phú Yên Travel</span>
        </h2>
        <p className="aboutpartners-desc">
          Chúng tôi tự hào hợp tác với những thương hiệu uy tín để mang đến trải nghiệm tốt nhất cho khách hàng.
        </p>
      </div>
      <div className="aboutpartners-grid">
        {partners.map((partner, idx) => (
          <div className="aboutpartners-card" key={idx}>
            <div className="aboutpartners-logo-wrap">
              <img src={partner.logo} alt={partner.name} className="aboutpartners-logo" />
            </div>
            <div className="aboutpartners-info">
              <h3 className="aboutpartners-name">{partner.name}</h3>
              <p className="aboutpartners-description">{partner.description}</p>
              <a href={partner.website} className="aboutpartners-link" target="_blank" rel="noopener noreferrer">
                Xem website <i className="bi bi-box-arrow-up-right"></i>
              </a>
            </div>
          </div>
        ))}
      </div>
      <div className="aboutpartners-cta text-center">
        <h3>Bạn muốn trở thành đối tác?</h3>
        <a href="#contact" className="aboutpartners-btn">
          Liên hệ hợp tác <i className="bi bi-arrow-right"></i>
        </a>
      </div>
    </div>
  </section>
);

export default AboutPartners;