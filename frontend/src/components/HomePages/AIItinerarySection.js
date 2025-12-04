import React from 'react';
import { Link } from 'react-router-dom';
import '../../styles/HomePageCSS/AIItinerarySection.css';

const AIItinerarySection = () => {
    const features = [
        {
            icon: 'bi-robot',
            title: 'AI Thông Minh',
            description: 'Thuật toán AI tối ưu hóa lộ trình dựa trên vị trí, thời gian và sở thích của bạn'
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
        { number: '01', title: 'Chọn điểm xuất phát', desc: 'Chọn vị trí bắt đầu hành trình của bạn' },
        { number: '02', title: 'Đặt thời gian', desc: 'Thiết lập thời gian và thời lượng tham quan' },
        { number: '03', title: 'Chọn sở thích', desc: 'Chọn loại địa điểm yêu thích của bạn' },
        { number: '04', title: 'Nhận lộ trình', desc: 'AI tạo lịch trình tối ưu ngay lập tức' }
    ];

    return (
        <section className="ai-itinerary-section">
            {/* Decorative Background */}
            <div className="ai-bg-decoration">
                <div className="ai-circle ai-circle-1"></div>
                <div className="ai-circle ai-circle-2"></div>
                <div className="ai-grid-pattern"></div>
            </div>

            <div className="container position-relative">
                {/* Header */}
                <div className="ai-section-header">
                    <div className="ai-badge">
                        <i className="bi bi-stars"></i>
                        <span>Công nghệ AI</span>
                    </div>
                    <h2 className="ai-section-title">
                        Lịch Trình <span className="ai-highlight">AI Thông Minh</span>
                    </h2>
                    <p className="ai-section-subtitle">
                        Để AI lên kế hoạch cho bạn - Nhanh chóng, thông minh, và hoàn toàn tự động
                    </p>
                </div>

                {/* Features Grid */}
                <div className="ai-features-grid">
                    {features.map((feature, index) => (
                        <div 
                            key={index} 
                            className="ai-feature-card"
                            data-aos="fade-up"
                            data-aos-delay={index * 100}
                        >
                            <div className="ai-feature-icon">
                                <i className={`bi ${feature.icon}`}></i>
                            </div>
                            <h3>{feature.title}</h3>
                            <p>{feature.description}</p>
                        </div>
                    ))}
                </div>

                {/* How It Works */}
                <div className="ai-how-it-works">
                    <h3 className="ai-how-title">Cách Hoạt Động</h3>
                    <div className="ai-steps-container">
                        {steps.map((step, index) => (
                            <div key={index} className="ai-step-item">
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

                <div className="ai-cta-section">
                    <div className="ai-cta-content">
                        <h3>Sẵn sàng khám phá Phú Yên?</h3>
                        <p>Chọn cách tạo lịch trình phù hợp với bạn</p>
                    </div>
                    <div className="ai-cta-buttons">
                        <Link to="/itinerary-planner" className="ai-cta-button ai-btn">
                            <i className="bi bi-stars"></i>
                            <span>Lịch trình AI thông minh</span>
                        </Link>
                        <Link to="/tours" className="ai-cta-button tours-btn">
                            <i className="bi bi-search"></i>
                            <span>Xem Tours </span>
                        </Link>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default AIItinerarySection;