import React from "react";
import '../../styles/About/AboutPartners.css';

const partners = [
  {
    name: "VNPay",
    logo: "https://vnpay.vn/s1/statics.vnpay.vn/2023/6/0oxhzjmxbksr1686814746087.png",
    description: "Đối tác thanh toán",
    website: "https://vnpay.vn"
  },
  {
    name: "Vietcombank",
    logo: "https://www.vietcombank.com.vn/images/logo.png",
    description: "Ngân hàng hợp tác",
    website: "https://vietcombank.com.vn"
  },
  {
    name: "Agoda",
    logo: "https://logos-world.net/wp-content/uploads/2021/02/Agoda-Logo.png",
    description: "Đặt phòng khách sạn",
    website: "https://agoda.com"
  }
];

const AboutPartners = () => (
  <section className="pyap-section">
    <div className="container">
      {/* Header */}
      <div className="pyap-header">
        <span className="pyap-badge">Đối tác tin cậy</span>
        <h2 className="pyap-title">Đối Tác Của Chúng Tôi</h2>
        <p className="pyap-subtitle">
          Chúng tôi hợp tác với những đơn vị uy tín hàng đầu để mang đến dịch vụ tốt nhất
        </p>
      </div>

      {/* Partners Grid */}
      <div className="pyap-partners-grid">
        {partners.map((partner, index) => (
          <div key={index} className="pyap-partner-card">
            <div className="pyap-partner-logo">
              <img src={partner.logo} alt={partner.name} />
            </div>
            <div className="pyap-partner-info">
              <h3>{partner.name}</h3>
              <p>{partner.description}</p>
              <a href={partner.website} target="_blank" rel="noopener noreferrer" className="pyap-partner-link">
                Xem website <i className="bi bi-box-arrow-up-right"></i>
              </a>
            </div>
          </div>
        ))}
      </div>

      {/* CTA */}
      <div className="pyap-cta">
        <h3>Bạn muốn trở thành đối tác?</h3>
        <a href="#contact" className="pyap-btn">
          Liên hệ hợp tác <i className="bi bi-arrow-right"></i>
        </a>
      </div>
    </div>
  </section>
);

export default AboutPartners;