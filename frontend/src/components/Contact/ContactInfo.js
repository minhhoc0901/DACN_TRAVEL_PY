import React from 'react';
import '../../styles/Contact/ContactInfo.css';

const ContactInfo = () => {
  return (
    <div className="contact-info-wrapper">
      <h2>Thông Tin Liên Hệ</h2>
      
      <div className="info-cards">
        <div className="info-card">
          <div className="card-icon">
            <i className="bi bi-geo-alt"></i>
          </div>
          <div className="card-content">
            <h3>Địa chỉ</h3>
            <p>78 Đường ABC, Tp. Tuy Hòa, Phú Yên</p>
          </div>
        </div>

        <div className="info-card">
          <div className="card-icon">
            <i className="bi bi-telephone"></i>
          </div>
          <div className="card-content">
            <h3>Điện thoại</h3>
            <p>+84 257 123 4567</p>
            <p>+84 257 765 4321</p>
          </div>
        </div>

        <div className="info-card">
          <div className="card-icon">
            <i className="bi bi-envelope"></i>
          </div>
          <div className="card-content">
            <h3>Email</h3>
            <p>info@phuyen-travel.com</p>
            <p>support@phuyen-travel.com</p>
          </div>
        </div>

        <div className="info-card">
          <div className="card-icon">
            <i className="bi bi-clock"></i>
          </div>
          <div className="card-content">
            <h3>Giờ làm việc</h3>
            <p>Thứ 2 - Thứ 6: 8:00 - 17:30</p>
            <p>Thứ 7 - CN: 8:00 - 12:00</p>
          </div>
        </div>
      </div>

      <div className="contact-map">
        <iframe
          src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3875.5477788607725!2d109.31659231482943!3d13.096886990773595!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x316fec94ab3caf0f%3A0x13025c6e955d14b8!2zVHV5IEjDsmEsIFBow7ogWcOqbiwgVmnhu4d0IE5hbQ!5e0!3m2!1svi!2s!4v1645167156868!5m2!1svi!2s"
          width="100%"
          height="300"
          style={{ border: 0, borderRadius: '12px' }}
          allowFullScreen=""
          loading="lazy"
          title="Bản đồ"
        ></iframe>
      </div>
    </div>
  );
};

export default ContactInfo;