import React from "react";
import '../../styles/About/AboutTeam.css';
import avatar1 from '../../assets/images/dev3.jpg';
import avatar2 from '../../assets/images/dev1.jpg';
import avatar3 from '../../assets/images/dev2.jpg';

const team = [
  {
    name: "Nguyễn Thành Nam",
    role: "Developer, Designer",
    img: avatar1,
    socials: {
      facebook: "#",
      linkedin: "#",
      instagram: "#"
    }
  },
  {
    name: "Lê Minh Học",
    role: "Developer, Database Designer",
    img: avatar2,
    socials: {
      facebook: "#",
      linkedin: "#",
      instagram: "#"
    }
  },
  {
    name: "Trần Vũ Huy",
    role: "Developer, Project Manager",
    img: avatar3,
    socials: {
      facebook: "#",
      linkedin: "#",
      instagram: "#"
    }
  }
];

const AboutTeam = () => (
  <section className="pyat-section">
    <div className="container">
      {/* Header */}
      <div className="pyat-header">
        <span className="pyat-badge">Đội ngũ của chúng tôi</span>
        <h2 className="pyat-title">Gặp Gỡ Đội Ngũ</h2>
        <p className="pyat-subtitle">
          Những người đam mê du lịch và công nghệ, luôn nỗ lực mang đến trải nghiệm tốt nhất
        </p>
      </div>

      {/* Team Grid */}
      <div className="pyat-team-grid">
        {team.map((member, index) => (
          <div key={index} className="pyat-team-card">
            <div className="pyat-team-image">
              <img src={member.img} alt={member.name} />
              <div className="pyat-team-overlay">
                <div className="pyat-social-links">
                  <a href={member.socials.facebook} target="_blank" rel="noopener noreferrer">
                    <i className="bi bi-facebook"></i>
                  </a>
                  <a href={member.socials.linkedin} target="_blank" rel="noopener noreferrer">
                    <i className="bi bi-linkedin"></i>
                  </a>
                  <a href={member.socials.instagram} target="_blank" rel="noopener noreferrer">
                    <i className="bi bi-instagram"></i>
                  </a>
                </div>
              </div>
            </div>
            <div className="pyat-team-info">
              <h3>{member.name}</h3>
              <p>{member.role}</p>
            </div>
          </div>
        ))}
      </div>

      {/* CTA */}
      <div className="pyat-cta">
        <h3>Bạn muốn đồng hành cùng chúng tôi?</h3>
        <a href="#careers" className="pyat-btn">
          Tham gia đội ngũ <i className="bi bi-arrow-right"></i>
        </a>
      </div>
    </div>
  </section>
);

export default AboutTeam;