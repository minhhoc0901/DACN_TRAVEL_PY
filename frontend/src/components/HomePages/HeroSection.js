import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import '../../styles/HomePageCSS/HeroSection.css';

// Import ảnh
import bg1 from '../../assets/images/background_PY_1.jpg';
import bg2 from '../../assets/images/background_BX_2.jpg';
import bg3 from '../../assets/images/background_GDD_3.jpg';
import bg4 from '../../assets/images/background_MD_4.jpg';

const HeroSection = () => {
    const [currentSlide, setCurrentSlide] = useState(0);
    
    const slides = [
        {
            id: 1,
            image: bg1,
            title: "PHÚ YÊN",
            subtitle: "Xứ sở hoa vàng cỏ xanh"
        },
        {
            id: 2,
            image: bg2,
            title: "GÀNH ĐÁ ĐĨA",
            subtitle: "Kỳ quan thiên nhiên độc đáo"
        },
        {
            id: 3,
            image: bg3,
            title: "BÃI XÉP",
            subtitle: "Thiên đường nghỉ dưỡng"
        },
        {
            id: 4,
            image: bg4,
            title: "MŨI ĐIỆN",
            subtitle: "Đón ánh bình minh đầu tiên"
        },
    ];

    useEffect(() => {
        // Tự động chuyển slide sau mỗi 5 giây
        const interval = setInterval(() => {
            setCurrentSlide(prevSlide => (prevSlide + 1) % slides.length);
        }, 5000);

        // Clean up interval
        return () => clearInterval(interval);
    }, [slides.length]);

    // Xử lý chuyển đến slide cụ thể
    const goToSlide = (index) => {
        setCurrentSlide(index);
    };

    return (
        <section className="hero-section">
            {/* Slideshow Background */}
            <div className="hero-slideshow">
                {slides.map((slide, index) => (
                    <div 
                        key={slide.id}
                        className={`hero-slide ${index === currentSlide ? 'active' : ''}`}
                        style={{ backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.4)), url(${slide.image})` }}
                    />
                ))}
            </div>

            {/* Hero Content */}
            <div className="hero-content">
                <h1 className="hero-title">{slides[currentSlide].title}</h1>
                <p className="hero-subtitle">{slides[currentSlide].subtitle}</p>
                <Link to="/locations" className="btn btn-secondary hero-btn">
                    Khám phá ngay
                </Link>
                
                {/* Dots Navigation */}
                <div className="slide-dots">
                    {slides.map((_, index) => (
                        <span 
                            key={index}
                            className={`dot ${index === currentSlide ? 'active' : ''}`}
                            onClick={() => goToSlide(index)}
                        />
                    ))}
                </div>
            </div>

            {/* Wave divider */}
            <div className="wave-divider">
                <svg data-name="Layer 1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 120" preserveAspectRatio="none">
                    <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z" className="shape-fill"></path>
                </svg>
            </div>
        </section>
    );
};

export default HeroSection;