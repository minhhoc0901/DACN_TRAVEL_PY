import React from 'react';
import { Link } from 'react-router-dom';
import '../../styles/HomePageCSS/AIItinerarySection.css';

const AIItinerarySection = () => {
    const features = [
        {
            icon: 'bi-robot',
            title: 'Gợi Ý Hợp Lý',
            description: 'Thuật toán tối ưu hóa lộ trình dựa trên vị trí, thời gian và sở thích của bạn'
        },
        {
            icon: 'bi-geo-alt-fill',
            title: 'Tối Ưu Địa Điểm',
            description: 'Tự động sắp xếp các điểm đến theo thứ tự hợp lý, tiết kiệm thời gian di chuyển'
        },
        {
            icon: 'bi-clock-history',
            title: 'Tiết Kiệm Thời Gian',
            description: 'Tạo lịch trình hoàn chỉnh chỉ trong vài giây, không cần lên kế hoạch thủ công'
        },
        {
            icon: 'bi-stars',
            title: 'Cá Nhân Hóa',
            description: 'Tùy chỉnh theo sở thích: di tích, biển, văn hóa, núi, thiên nhiên...'
        }
    ];

    const steps = [
        { number: '01', title: 'Chọn điểm xuất phát', desc: 'Chọn vị trí bắt đầu lịch trình của bạn' },
        { number: '02', title: 'Đặt thời gian', desc: 'Thiết lập thời gian và thời lượng tham quan' },
        { number: '03', title: 'Chọn sở thích', desc: 'Chọn loại địa điểm yêu thích của bạn' },
        { number: '04', title: 'Nhận lộ trình', desc: 'AI tạo lịch trình tối ưu ngay lập tức' }
    ];

    return (
        <section className="ai-itinerary-section">
            <div className="ai-bg-decoration">
                <div className="ai-circle ai-circle-1"></div>
                <div className="ai-circle ai-circle-2"></div>
                <div className="ai-grid-pattern"></div>
            </div>

            <div className="container position-relative">
                {/* ✅ THÊM AOS CHO HEADER */}
                <div 
                    className="ai-section-header"
                    data-aos="fade-up"
                    data-aos-duration="800"
                >
                    <div className="ai-badge">
                        <i className="bi bi-stars"></i>
                        <span> Gợi ý lịch trình thông minh</span>
                    </div>
                    <h2 className="ai-section-title">
                        Lịch trình<span className="ai-highlight"> du lịch phù hợp với bạn</span>
                    </h2>
                    <p className="ai-section-subtitle">
                        Hệ thống hỗ trợ xây dựng lịch trình du lịch dựa trên thời gian, sở thích và địa điểm mong muốn – nhanh chóng, hợp lý và dễ sử dụng.
                    </p>
                </div>

                {/* ✅ THÊM AOS CHO FEATURES */}
                <div className="ai-features-grid">
                    {features.map((feature, index) => (
                        <div 
                            key={index} 
                            className="ai-feature-card"
                            data-aos="fade-up"
                            data-aos-delay={index * 100}
                            data-aos-duration="600"
                        >
                            <div className="ai-feature-icon">
                                <i className={`bi ${feature.icon}`}></i>
                            </div>
                            <h3>{feature.title}</h3>
                            <p>{feature.description}</p>
                        </div>
                    ))}
                </div>

                {/* ✅ THÊM AOS CHO HOW IT WORKS */}
                <div 
                    className="ai-how-it-works"
                    data-aos="fade-up"
                    data-aos-duration="800"
                    data-aos-delay="400"
                >
                    <h3 className="ai-how-title">Cách Hoạt Động</h3>
                    <div className="ai-steps-container">
                        {steps.map((step, index) => (
                            <div 
                                key={index} 
                                className="ai-step-item"
                                data-aos="fade-right"
                                data-aos-delay={index * 100}
                            >
                                <div className="ai-step-number">{step.number}</div>
                                <div className="ai-step-content">
                                    <h4>{step.title}</h4>
                                    <p>{step.desc}</p>
                                </div>
                                {index < steps.length - 1 && (
                                    <div className="ai-step-arrow">
                                        <i className="bi bi-arrow-right"></i>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* ✅ THÊM AOS CHO CTA */}
                <div 
                    className="ai-cta-section"
                    data-aos="zoom-in"
                    data-aos-duration="800"
                    data-aos-delay="600"
                >
                    <div className="ai-cta-content">
                        <h3>Sẵn sàng khám phá Phú Yên?</h3>
                        <p>Chọn cách tạo lịch trình phù hợp với bạn</p>
                    </div>
                    <div className="ai-cta-buttons">
                        <Link to="/itinerary-planner" className="ai-cta-button primary">
                            <i className="bi bi-magic"></i>
                            <span>Gợi ý lịch trình thông minh</span>
                        </Link>
                        <Link to="/plan" className="ai-cta-button secondary">
                            <i className="bi bi-pencil-square"></i>
                            <span>Tự tạo lịch trình</span>
                        </Link>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default AIItinerarySection;