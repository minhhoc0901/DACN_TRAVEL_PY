import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import '../../styles/HomePageCSS/TravelPlanSection.css';

const TravelPlanSection = () => {
    const [activeStep, setActiveStep] = useState(1);

    const steps = [
        {
            id: 1,
            icon: 'calendar-event',
            title: 'Chọn thời gian',
            description: 'Lựa chọn thời điểm lý tưởng để du lịch Phú Yên và tham khảo thông tin về mùa đẹp nhất trong năm.'
        },
        {
            id: 2,
            icon: 'pin-map',
            title: 'Chọn địa điểm',
            description: 'Khám phá và lựa chọn các điểm đến phù hợp với sở thích và thời gian của bạn tại Phú Yên.'
        },
        {
            id: 3,
            icon: 'houses',
            title: 'Chọn nơi nghỉ',
            description: 'Tìm kiếm các khách sạn, homestay hoặc resort phù hợp với ngân sách và trải nghiệm bạn mong muốn.'
        },
        {
            id: 4,
            icon: 'journal-check',
            title: 'Lên lịch trình',
            description: 'Sắp xếp các địa điểm và hoạt động vào lịch trình chi tiết, tối ưu thời gian di chuyển.'
        }
    ];

    return (
        <section className="travel-plan-section">
            <div className="travel-plan-bg">
                <div className="bg-overlay"></div>
                <div className="bg-pattern"></div>
            </div>
            
            <div className="container position-relative">
                <div className="travel-plan-header">
                    <div className="plan-badge">Lập kế hoạch</div>
                    <h2 className="plan-title">Bắt đầu <span className="highlight">Hành trình</span> của bạn</h2>
                    <p className="plan-subtitle">
                        Lên kế hoạch cho chuyến đi hoàn hảo đến Phú Yên chỉ với vài bước đơn giản.
                        Chúng tôi giúp bạn tạo ra một lịch trình du lịch phù hợp nhất.
                    </p>
                </div>
                
                <div className="travel-plan-steps">
                    <div className="step-timeline">
                        <div className="timeline-track">
                            <div 
                                className="timeline-progress"
                                style={{ width: `${(activeStep - 1) * 100 / (steps.length - 1)}%` }}
                            ></div>
                        </div>
                        
                        <div className="timeline-points-wrapper">
                            {steps.map(step => (
                                <div 
                                    key={step.id} 
                                    className={`timeline-point ${activeStep >= step.id ? 'active' : ''}`}
                                    onClick={() => setActiveStep(step.id)}
                                >
                                    <div className="point-number">{step.id}</div>
                                    <div className="point-label">{step.title}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                    
                    <div className="step-cards">
                        {steps.map(step => (
                            <div 
                                key={step.id}
                                className={`step-card ${activeStep === step.id ? 'active' : ''}`}
                            >
                                <div className="step-icon">
                                    <i className={`bi bi-${step.icon}`}></i>
                                </div>
                                <div className="step-content">
                                    <h3 className="step-title">{step.title}</h3>
                                    <p className="step-description">{step.description}</p>
                                </div>
                            </div>
                        ))}
                        
                        <div className="step-navigation">
                            <button 
                                className="btn-prev"
                                onClick={() => setActiveStep(prev => Math.max(prev - 1, 1))}
                                disabled={activeStep === 1}
                            >
                                <i className="bi bi-arrow-left"></i>
                                <span>Trước</span>
                            </button>
                            
                            {activeStep < steps.length ? (
                                <button 
                                    className="btn-next"
                                    onClick={() => setActiveStep(prev => Math.min(prev + 1, steps.length))}
                                >
                                    <span>Tiếp theo</span>
                                    <i className="bi bi-arrow-right"></i>
                                </button>
                            ) : (
                                <Link to="/plan" className="btn-create-plan">
                                    <span>Tạo Lịch Trình</span>
                                    <i className="bi bi-calendar-plus"></i>
                                </Link>
                            )}
                        </div>
                    </div>
                </div>
                
                <div className="travel-plan-features">
                    <div className="plan-feature">
                        <div className="feature-icon">
                            <i className="bi bi-calendar-check"></i>
                        </div>
                        <h4>Tiết kiệm thời gian</h4>
                        <p>Tối ưu hóa lịch trình với các gợi ý lộ trình thông minh</p>
                    </div>
                    
                    <div className="plan-feature">
                        <div className="feature-icon">
                            <i className="bi bi-piggy-bank"></i>
                        </div>
                        <h4>Quản lý chi phí</h4>
                        <p>Ước tính ngân sách và tìm các lựa chọn phù hợp với túi tiền</p>
                    </div>
                    
                    <div className="plan-feature">
                        <div className="feature-icon">
                            <i className="bi bi-share"></i>
                        </div>
                        <h4>Chia sẻ dễ dàng</h4>
                        <p>Mời bạn bè đóng góp ý kiến hoặc tham gia lập kế hoạch cùng bạn</p>
                    </div>
                </div>
                
                <div className="travel-plan-cta">
                    <Link to="/plan" className="btn-get-started">
                        <span>Bắt đầu ngay</span>
                        <i className="bi bi-arrow-right"></i>
                    </Link>
                    <Link to="/locations" className="btn-explore-more">
                        Khám phá địa điểm
                    </Link>
                </div>
            </div>
        </section>
    );
};

export default TravelPlanSection;