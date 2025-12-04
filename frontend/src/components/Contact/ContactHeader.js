import React from 'react';
import '../../styles/Contact/ContactHeader.css';

const ContactHeader = () => {
  return (
    <header className="contact-header">
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-lg-8 text-center">
            <h1 className="contact-title">
              Liên Hệ Với Chúng Tôi
            </h1>
            <p className="contact-subtitle">
              Chúng tôi luôn sẵn sàng lắng nghe và hỗ trợ bạn 24/7. 
              Hãy liên hệ ngay với Phú Yên Travel!
            </p>
          </div>
        </div>
      </div>
      <div className="header-shapes">
        <div className="shape shape-1"></div>
        <div className="shape shape-2"></div>
      </div>
    </header>
  );
};

export default ContactHeader;