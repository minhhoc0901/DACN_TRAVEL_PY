import React from "react";
import '../../styles/About/AboutMission.css';
import bg2 from '../../assets/images/background_BX_2.jpg';

const AboutMission = () => (
  <section className="pyam-section" id="about-mission">
    <div className="container">
      <div className="pyam-wrapper">
        <div className="row g-4">
          {/* Mission */}
          <div className="col-lg-4">
            <div className="pyam-card pyam-primary">
              <div className="pyam-card-icon">
                <i className="bi bi-bookmark-star"></i>
              </div>
              <h3>Sứ mệnh</h3>
              <p>
                Mang đến trải nghiệm du lịch tuyệt vời, kết nối du khách với vẻ đẹp 
                thiên nhiên, văn hóa và con người Phú Yên.
              </p>
            </div>
          </div>

          {/* Vision */}
          <div className="col-lg-4">
            <div className="pyam-card pyam-vision">
              <div className="pyam-card-icon">
                <i className="bi bi-eye"></i>
              </div>
              <h3>Tầm nhìn</h3>
              <p>
                Trở thành điểm đến lý tưởng cho những ai yêu thích khám phá vẻ đẹp 
                hoang sơ và văn hóa độc đáo của Phú Yên.
              </p>
            </div>
          </div>

          {/* Values */}
          <div className="col-lg-4">
            <div className="pyam-card pyam-values">
              <div className="pyam-card-icon">
                <i className="bi bi-heart"></i>
              </div>
              <h3>Giá trị cốt lõi</h3>
              <p>
                Chất lượng - Tận tâm - Sáng tạo - Trách nhiệm với cộng đồng và 
                môi trường.
              </p>
            </div>
          </div>
        </div>

        {/* Principles */}
        <div className="pyam-principles">
          <div className="row align-items-center">
            <div className="col-lg-6">
              <img 
                src={bg2} 
                alt="Phú Yên Travel Principles" 
                className="pyam-principles-image"
              />
            </div>
            <div className="col-lg-6">
              <div className="pyam-principles-content">
                <h2>Nguyên tắc hoạt động</h2>
                <div className="pyam-principles-list">
                  <div className="pyam-principle-item">
                    <i className="bi bi-check-circle"></i>
                    <div>
                      <h4>Chất lượng dịch vụ</h4>
                      <p>Cam kết mang đến trải nghiệm du lịch chất lượng cao</p>
                    </div>
                  </div>
                  <div className="pyam-principle-item">
                    <i className="bi bi-people"></i>
                    <div>
                      <h4>Hướng đến khách hàng</h4>
                      <p>Luôn lắng nghe và đáp ứng nhu cầu của khách hàng</p>
                    </div>
                  </div>
                  <div className="pyam-principle-item">
                    <i className="bi bi-globe"></i>
                    <div>
                      <h4>Du lịch bền vững</h4>
                      <p>Phát triển du lịch gắn với bảo vệ môi trường</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
);

export default AboutMission;