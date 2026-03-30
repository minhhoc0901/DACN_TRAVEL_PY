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
            description: 'Lựa chọn thời điểm lý tưởng để du lịch Phú Yên và tham khảo thông tin về mùa đẹp nhất trong năm.',
            details: [
                'Mùa đẹp nhất: Tháng 3 - Tháng 8',
                'Thời tiết ổn định, nắng đẹp',
                'Biển xanh, sóng nhẹ phù hợp tắm biển',
                'Tránh mùa mưa: Tháng 10 - Tháng 12'
            ]
        },
        {
            id: 2,
            icon: 'pin-map',
            title: 'Chọn địa điểm',
            description: 'Khám phá và lựa chọn các điểm đến phù hợp với sở thích và thời gian của bạn tại Phú Yên.',
            details: [
                'Bãi Xép - Bãi biển hoang sơ tuyệt đẹp',
                'Gành Đá Đĩa - Kỳ quan thiên nhiên',
                'Vũng Rô - Vịnh biển xanh trong',
                'Tháp Nhạn - Di tích lịch sử văn hóa'
            ]
        },
        {
            id: 3,
            icon: 'houses',
            title: 'Chọn nơi nghỉ',
            description: 'Tìm kiếm các khách sạn, homestay hoặc resort phù hợp với ngân sách và trải nghiệm bạn mong muốn.',
            details: [
                'Khách sạn 3-5 sao tại trung tâm',
                'Homestay gần biển, giá hợp lý',
                'Resort cao cấp với view biển',
                'Khu cắm trại cho phượt thủ'
            ]
        },
        {
            id: 4,
            icon: 'journal-check',
            title: 'Lên lịch trình',
            description: 'Sắp xếp các địa điểm và hoạt động vào lịch trình chi tiết, tối ưu thời gian di chuyển.',
            details: [
                'Lên kế hoạch theo ngày',
                'Tối ưu tuyến đường di chuyển',
                'Sắp xếp thời gian hợp lý',
                'Gợi ý hoạt động mỗi điểm'
            ]
        }
    ];

    const currentStep = steps.find(step => step.id === activeStep);

    return (
        <section className="travel-plan-section">
            <div className="travel-plan-bg">
                <div className="bg-overlay"></div>
                <div className="bg-pattern"></div>
            </div>
            
            <div className="container position-relative">
                {/* HEADER */}
                <div 
                    className="travel-plan-header"
                    data-aos="fade-up"
                    data-aos-duration="800"
                >
                    <div className="plan-badge">
                        <i className="bi bi-map"></i>
                        <span>Lập kế hoạch</span>
                    </div>
                    <h2 className="plan-title">
                        Lên Kế Hoạch <span className="highlight-orange">Du Lịch</span>
                    </h2>
                    <p className="plan-description">
                        Bốn bước đơn giản để tạo nên chuyến du lịch hoàn hảo tại Phú Yên
                    </p>
                </div>

                {/* ✅ NEW: STEPS TABS - SIMPLE HORIZONTAL DESIGN */}
                <div 
                    className="travel-steps-container"
                    data-aos="fade-up"
                    data-aos-duration="800"
                    data-aos-delay="200"
                >
                    <div className="travel-steps-tabs">
                        {steps.map((step) => (
                            <button
                                key={step.id}
                                className={`travel-step-tab ${activeStep === step.id ? 'active' : ''}`}
                                onClick={() => setActiveStep(step.id)}
                            >
                                <div className="tab-icon">
                                    <i className={`bi bi-${step.icon}`}></i>
                                </div>
                                <div className="tab-info">
                                    <span className="tab-number">Bước {step.id}</span>
                                    <span className="tab-title">{step.title}</span>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* ✅ NEW: CONTENT CARD - WHITE BACKGROUND */}
                <div 
                    className="travel-content-card"
                    data-aos="fade-up"
                    data-aos-duration="800"
                    data-aos-delay="400"
                >
                    <div className="card-header">
                        <div className="header-icon">
                            <i className={`bi bi-${currentStep.icon}`}></i>
                        </div>
                        <div className="header-text">
                            <h3>{currentStep.title}</h3>
                            <p>{currentStep.description}</p>
                        </div>
                    </div>

                    <div className="card-body">
                        <ul className="details-list">
                            {currentStep.details.map((detail, index) => (
                                <li key={index} className="detail-item-new">
                                    <span className="item-number">{index + 1}</span>
                                    <span className="item-text">{detail}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                {/* CTA BUTTONS */}
                <div 
                    className="plan-cta"
                    data-aos="fade-up"
                    data-aos-duration="800"
                    data-aos-delay="600"
                >
                    <Link to="/itinerary-planner" className="btn-get-started">
                        <i className="bi bi-stars"></i>
                        <span>Gợi ý lịch trình thông minh</span>
                        <i className="bi bi-arrow-right"></i>
                    </Link>
                    <Link to="/plan" className="btn-create-custom">
                        <i className="bi bi-pencil-square"></i>
                        <span>Tự tạo lịch trình</span>
                    </Link>
                    <Link to="/tours" className="btn-explore-more">
                        <i className="bi bi-compass"></i>
                        <span>Khám phá tour có sẵn</span>
                    </Link>
                </div>
            </div>
        </section>
    );
};

export default TravelPlanSection;