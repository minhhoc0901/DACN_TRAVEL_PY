import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import '../../styles/show/footer.css';

const Footer = () => {
    const currentYear = new Date().getFullYear();
    const [email, setEmail] = useState('');
    const [isSubscribed, setIsSubscribed] = useState(false);

    const handleSubscribe = (e) => {
        e.preventDefault();
        if (email && email.includes('@')) {
            setIsSubscribed(true);
            setEmail('');
            setTimeout(() => setIsSubscribed(false), 5000);
        }
    };

    useEffect(() => {
        const backToTopBtn = document.getElementById('back-to-top');
        
        const toggleBackToTop = () => {
            if (window.scrollY > 300) {
                backToTopBtn.classList.add('active');
            } else {
                backToTopBtn.classList.remove('active');
            }
        };
        
        const scrollToTop = () => {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        };
        
        window.addEventListener('scroll', toggleBackToTop);
        backToTopBtn.addEventListener('click', scrollToTop);
        
        return () => {
            window.removeEventListener('scroll', toggleBackToTop);
            backToTopBtn.removeEventListener('click', scrollToTop);
        };
    }, []);

    return (
        <footer className="site-footer">
            <div className="footer-cta">
                <div className="container">
                    <div className="cta-container">
                        <div className="row align-items-center">
                            <div className="col-lg-8 col-md-7">
                                <h3 className="cta-title">Sẵn sàng khám phá Phú Yên?</h3>
                                <p className="cta-text">Hãy để chúng tôi giúp bạn lên kế hoạch cho chuyến du lịch đáng nhớ.</p>
                            </div>
                            <div className="col-lg-4 col-md-5 text-md-end">
                                <Link to="/plan" className="btn-cta" id="footer-cta-link" style={{ pointerEvents: 'auto', zIndex: 2 }}>
                                    <span>Lên kế hoạch ngay</span>
                                    <i className="bi bi-arrow-right"></i>
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <div className="footer-main">
                <div className="container">
                    <div className="footer-widgets">
                        <div className="row">
                            <div className="col-lg-4 col-md-6">
                                <div className="footer-widget about-widget">
                                    <div className="widget-title-wrap">
                                        <h4 className="widget-title">Về chúng tôi</h4>
                                    </div>
                                    <div className="about-content">
                                        <Link to="/" className="footer-logo">
                                            <div className="logo-text-wrap">
                                                <div className="logo-icon-wrap">
                                                    <img src="/logo1.png" alt="Phú Yên Travel Logo" />                                                </div>
                                                <div className="logo-text">PHÚ YÊN</div>
                                            </div>
                                        </Link>
                                        <p>Chúng tôi cam kết mang đến cho bạn những trải nghiệm du lịch đáng nhớ tại Phú Yên - nơi có những bãi biển đẹp nhất, những cảnh quan thiên nhiên hùng vĩ và văn hóa địa phương đặc sắc.</p>
                                    </div>
                                    <div className="social-links">
                                        <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" aria-label="Facebook">
                                            <i className="bi bi-facebook"></i>
                                        </a>
                                        <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
                                            <i className="bi bi-instagram"></i>
                                        </a>
                                        <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" aria-label="Twitter">
                                            <i className="bi bi-twitter-x"></i>
                                        </a>
                                        <a href="https://youtube.com" target="_blank" rel="noopener noreferrer" aria-label="Youtube">
                                            <i className="bi bi-youtube"></i>
                                        </a>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="col-lg-2 col-md-6 col-6">
                                <div className="footer-widget links-widget">
                                    <div className="widget-title-wrap">
                                        <h4 className="widget-title">Khám phá</h4>
                                    </div>
                                    <ul className="footer-links">
                                        <li><Link to="/locations/beaches">Bãi biển</Link></li>
                                        <li><Link to="/locations/mountains">Núi & Đồi</Link></li>
                                        <li><Link to="/locations/cultural">Di tích văn hóa</Link></li>
                                        <li><Link to="/locations/food">Ẩm thực</Link></li>
                                        <li><Link to="/tours">Tour du lịch</Link></li>
                                        <li><Link to="/events">Sự kiện</Link></li>
                                    </ul>
                                </div>
                            </div>
                            
                            <div className="col-lg-2 col-md-6 col-6">
                                <div className="footer-widget links-widget">
                                    <div className="widget-title-wrap">
                                        <h4 className="widget-title">Liên kết</h4>
                                    </div>
                                    <ul className="footer-links">
                                        <li><Link to="/">Trang chủ</Link></li>
                                        <li><Link to="/locations">Địa điểm</Link></li>
                                        <li><Link to="/tours">Tours du lịch</Link></li>
                                        <li><Link to="/plan">Lập kế hoạch</Link></li>
                                        <li><Link to="/itinerary-planner">Lịch trình AI</Link></li>
                                        <li><Link to="/about">Giới thiệu</Link></li>
                                        <li><Link to="/contact">Liên hệ</Link></li>
                                    </ul>
                                </div>
                            </div>
                            
                            <div className="col-lg-4 col-md-6">
                                <div className="footer-widget newsletter-widget">
                                    <div className="widget-title-wrap">
                                        <h4 className="widget-title">Đăng ký nhận tin</h4>
                                    </div>
                                    <div className="newsletter-content">
                                        <p>Nhận thông tin ưu đãi và cập nhật mới nhất về du lịch Phú Yên</p>
                                        <form className="subscribe-form" onSubmit={handleSubscribe}>
                                            <div className="form-group">
                                                <input 
                                                    type="email" 
                                                    className="form-control" 
                                                    placeholder="Nhập email của bạn" 
                                                    value={email}
                                                    onChange={(e) => setEmail(e.target.value)}
                                                    required 
                                                />
                                                <button type="submit" className="btn-subscribe">
                                                    {isSubscribed ? <i className="bi bi-check-lg"></i> : <i className="bi bi-send"></i>}
                                                </button>
                                            </div>
                                            {isSubscribed && (
                                                <div className="subscribe-success">
                                                    Đăng ký thành công! Cảm ơn bạn.
                                                </div>
                                            )}
                                        </form>
                                        <div className="widget-info mt-4">
                                            <div className="info-item">
                                                <i className="bi bi-telephone"></i>
                                                <span>+84 257 123 4567</span>
                                            </div>
                                            <div className="info-item">
                                                <i className="bi bi-envelope"></i>
                                                <span>info@phuyen-travel.com</span>
                                            </div>
                                            <div className="info-item">
                                                <i className="bi bi-geo-alt"></i>
                                                <span>78 Đường ABC, Tp. Tuy Hòa, Phú Yên</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div className="footer-features">
                        <div className="row">
                            <div className="col-lg-3 col-md-6">
                                <div className="feature-item">
                                    <div className="feature-icon">
                                        <i className="bi bi-shield-check"></i>
                                    </div>
                                    <h5>Đảm bảo an toàn</h5>
                                    <p>Các tour được kiểm tra chất lượng và an toàn</p>
                                </div>
                            </div>
                            <div className="col-lg-3 col-md-6">
                                <div className="feature-item">
                                    <div className="feature-icon">
                                        <i className="bi bi-credit-card"></i>
                                    </div>
                                    <h5>Thanh toán bảo mật</h5>
                                    <p>Nhiều phương thức thanh toán an toàn</p>
                                </div>
                            </div>
                            <div className="col-lg-3 col-md-6">
                                <div className="feature-item">
                                    <div className="feature-icon">
                                        <i className="bi bi-headset"></i>
                                    </div>
                                    <h5>Hỗ trợ 24/7</h5>
                                    <p>Đội ngũ tư vấn viên luôn sẵn sàng</p>
                                </div>
                            </div>
                            <div className="col-lg-3 col-md-6">
                                <div className="feature-item">
                                    <div className="feature-icon">
                                        <i className="bi bi-award"></i>
                                    </div>
                                    <h5>Đảm bảo chất lượng</h5>
                                    <p>Cam kết dịch vụ tốt nhất cho du khách</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <div className="footer-bottom">
                <div className="container">
                    <div className="row align-items-center">
                        <div className="col-lg-6">
                            <div className="copyright">
                                &copy; {currentYear} <span>Phú Yên Travel</span>. Tất cả các quyền được bảo lưu.
                            </div>
                        </div>
                        <div className="col-lg-6">
                            <div className="footer-links-bottom">
                                <Link to="/terms">Điều khoản dịch vụ</Link>
                                <Link to="/privacy">Chính sách bảo mật</Link>
                                <Link to="/sitemap">Sơ đồ trang web</Link>
                                <div className="payment-methods">
                                    <i className="bi bi-credit-card"></i>
                                    <i className="bi bi-paypal"></i>
                                    <i className="bi bi-wallet2"></i>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <button id="back-to-top" className="back-to-top" aria-label="Back to top">
                <i className="bi bi-arrow-up"></i>
            </button>
        </footer>
    );
};

export default Footer;

