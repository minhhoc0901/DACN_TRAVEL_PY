import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import '../../styles/HomePageCSS/HeroSection.css';

// Import images
import heroImg1 from '../../assets/images/background_PY_1.jpg';
import heroImg2 from '../../assets/images/background_BX_2.jpg';
import heroImg3 from '../../assets/images/background_GDD_3.jpg';

const HeroSection = () => {
    const [currentSlide, setCurrentSlide] = useState(0);

    const slides = [
        {
            id: 1,
            image: heroImg1,
            badge: 'KHÁM PHÁ PHÚ YÊN',
            title: 'Thiên Đường Nghỉ Dưỡng',
            subtitle: 'Biển xanh - Cát trắng - Nắng vàng',
            description: 'Khám phá vẻ đẹp hoang sơ của vùng đất Phú Yên với những bãi biển tuyệt đẹp, ẩm thực phong phú và con người thân thiện.'
        },
        {
            id: 2,
            image: heroImg2,
            badge: 'BÃI XÉP NỔI TIẾNG',
            title: 'Bãi Biển Hoang Sơ',
            subtitle: 'Nơi tôi thấy hoa vàng trên cỏ xanh',
            description: 'Trải nghiệm không gian yên bình tại bãi biển đẹp nhất Phú Yên, nơi lý tưởng để thư giãn và tận hưởng thiên nhiên.'
        },
        {
            id: 3,
            image: heroImg3,
            badge: 'DI TÍCH LỊCH SỬ',
            title: 'Gành Đá Đĩa',
            subtitle: 'Kỳ quan thiên nhiên độc đáo',
            description: 'Chiêm ngưỡng những khối đá bazan hình lục giác xếp chồng lên nhau - công trình kiến tạo tuyệt vời của thiên nhiên.'
        }
    ];

    // Auto slide
    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentSlide((prev) => (prev + 1) % slides.length);
        }, 5000);
        return () => clearInterval(timer);
    }, [slides.length]);

    // ✅ Hàm scroll xuống section tiếp theo
    const scrollToNextSection = () => {
        const heroHeight = document.querySelector('.hero-modern').offsetHeight;
        window.scrollTo({
            top: heroHeight,
            behavior: 'smooth'
        });
    };

    return (
        <section className="hero-modern">
            {/* Background Slider */}
            <div className="hero-slider">
                {slides.map((slide, index) => (
                    <div
                        key={slide.id}
                        className={`hero-slide ${index === currentSlide ? 'active' : ''}`}
                        style={{ backgroundImage: `url(${slide.image})` }}
                    >
                        <div className="hero-overlay"></div>
                    </div>
                ))}
            </div>

            {/* Content */}
            <div className="hero-content">
                <div className="container">
                    <div className="hero-text-wrapper">
                        <span className="hero-badge">{slides[currentSlide].badge}</span>
                        <h1 className="hero-title">
                            {slides[currentSlide].title}
                        </h1>
                        <p className="hero-subtitle">{slides[currentSlide].subtitle}</p>
                        <p className="hero-description">{slides[currentSlide].description}</p>

                        {/* Quick Actions */}
                        <div className="hero-actions">
                            <Link to="/tours" className="hero-btn hero-btn-outline">
                                <i className="bi bi-ticket-perforated"></i>
                                <span>Xem Tours</span>
                            </Link>
                            <Link to="/itinerary-planner" className="hero-btn hero-btn-secondary">
                                <i className="bi bi-stars"></i>
                                <span>Lịch trình AI</span>
                            </Link>
                            <Link to="/locations" className="hero-btn hero-btn-outline">
                                <i className="bi bi-map"></i>
                                <span>Khám phá</span>
                            </Link>
                        </div>
                    </div>
                </div>
            </div>

            {/* ✅ Slide Indicators - Di chuyển lên trên Scroll Indicator */}
            <div className="hero-indicators">
                {slides.map((_, index) => (
                    <button
                        key={index}
                        className={`indicator ${index === currentSlide ? 'active' : ''}`}
                        onClick={() => setCurrentSlide(index)}
                        aria-label={`Slide ${index + 1}`}
                    />
                ))}
            </div>

            {/* ✅ Scroll Indicator - Nằm dưới cùng */}
            <div className="scroll-indicator" onClick={scrollToNextSection}>
                <span>Khám phá thêm</span>
                <i className="bi bi-chevron-down"></i>
            </div>
        </section>
    );
};

export default HeroSection;