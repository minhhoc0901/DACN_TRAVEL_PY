import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { getDisplayImageUrl } from '../../utils/imageUtils';
import NotificationBell from '../Notifications/NotificationBell';
import '../../styles/show/header.css';

const Header = ({ setMenuOpen, menuOpen }) => {
    const [scrolled, setScrolled] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [userMenuOpen, setUserMenuOpen] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();
    const { user, isAuthenticated, logout } = useAuth();
    // XÓA CÁC DÒNG DƯỚI ĐÂY
    // const {
    //     handleNotificationClick,
    //     markAllAsRead,
    //     deleteNotification
    // } = useNotification();

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 50);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    useEffect(() => {
        if (mobileMenuOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
    }, [mobileMenuOpen]);

    useEffect(() => {
        setMobileMenuOpen(false);
    }, [location]);

    const handleLogout = () => {
        logout();
        navigate('/');
        setMobileMenuOpen(false);
    };

    return (
        <header className={`header ${scrolled ? 'header-scrolled' : ''}`}>
            <nav className="navbar navbar-expand-lg">
                <div className="container">
                    {/* Logo */}
                    <Link to="/" className="navbar-brand">
                        <div className="logo-text-wrap">
                            <div className="logo-icon-wrap">
                                <img src={process.env.PUBLIC_URL + '/logo1.png'} alt="Phú Yên Travel Logo" />
                            </div>
                            <div className="logo-text">PHÚ YÊN</div>
                        </div>
                    </Link>

                    {/* Mobile Toggle Button */}
                    <button 
                        className={`navbar-toggler ${mobileMenuOpen ? 'active' : ''}`}
                        type="button"
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    >
                        <span></span>
                        <span></span>
                        <span></span>
                    </button>

                    {/* Main Navigation */}
                    <div className={`collapse navbar-collapse ${mobileMenuOpen ? 'show' : ''}`}>
                        <ul className="navbar-nav mx-auto">
                            <li className="nav-item">
                                <Link to="/" className="nav-link">
                                    <i className="bi bi-house-door"></i>
                                    <span>Trang chủ</span>
                                </Link>
                            </li>
                            <li className="nav-item">
                                <Link to="/locations" className="nav-link">
                                    <i className="bi bi-geo-alt"></i>
                                    <span>Điểm đến</span>
                                </Link>
                            </li>
                            <li className="nav-item">
                                <Link to="/tours" className="nav-link">
                                    <i className="bi bi-compass"></i>
                                    <span>Tours du lịch</span>
                                </Link>
                            </li>
                            <li className="nav-item">
                                <Link to="/plan" className="nav-link">
                                    <i className="bi bi-calendar3"></i>
                                    <span>Lập kế hoạch</span>
                                </Link>
                            </li>
                            <li className="nav-item">
                                <Link to="/about" className="nav-link">
                                    <i className="bi bi-info-circle"></i>
                                    <span>Giới thiệu</span>
                                </Link>
                            </li>
                            <li className="nav-item">
                                <Link to="/contact" className="nav-link">
                                    <i className="bi bi-chat-dots"></i>
                                    <span>Liên hệ</span>
                                </Link>
                            </li>
                        </ul>

                        {/* User Actions */}
                        <div className="nav-actions">
                            <button className="search-btn" aria-label="Search">
                                <i className="bi bi-search"></i>
                            </button>

                            {isAuthenticated && <NotificationBell />}

                            {isAuthenticated ? (
                                <div className="dropdown user-menu">
                                    <div className="user-dropdown">
                                        <div className="header-user-profile" onClick={() => setUserMenuOpen(!userMenuOpen)}>
                                            <div className="header-user-avatar">
                                                <img 
                                                    src={getDisplayImageUrl(user.avatar)} 
                                                    alt="Avatar" 
                                                    className="avatar-img" 
                                                />
                                            </div>
                                            <span className="header-user-name">{user.username}</span>
                                            <i className={`bi ${userMenuOpen ? 'bi-chevron-up' : 'bi-chevron-down'}`}></i>
                                        </div>
                                        <ul className={`dropdown-menu ${userMenuOpen ? 'show' : ''}`}>
                                            <li>
                                                <Link to="/profile" className="dropdown-item" onClick={() => setUserMenuOpen(false)}>
                                                    <i className="bi bi-person"></i>
                                                    <span>Tài khoản</span>
                                                </Link>
                                            </li>
                                            <li>
                                                <Link to="/profile/credit-wallet" className="dropdown-item" onClick={() => setUserMenuOpen(false)}>
                                                    <i className="bi bi-wallet2"></i>
                                                    <span>Ví Credit</span>
                                                </Link>
                                            </li>
                                            <li>
                                                <Link to="/profile/my-bookings" className="dropdown-item" onClick={() => setUserMenuOpen(false)}>
                                                    <i className="bi bi-bookmark-check"></i>
                                                    <span>Đặt chỗ của tôi</span>
                                                </Link>
                                            </li>
                                            {user.role === 'admin' && (
                                                <li>
                                                    <Link to="/admin" className="dropdown-item text-primary" onClick={() => setUserMenuOpen(false)}>
                                                        <i className="bi bi-shield-lock"></i>
                                                        <span>Quản lý Admin</span>
                                                    </Link>
                                                </li>
                                            )}
                                            <li><hr className="dropdown-divider"/></li>
                                            <li>
                                                <button onClick={() => { handleLogout(); setUserMenuOpen(false); }} className="dropdown-item text-danger">
                                                    <i className="bi bi-box-arrow-right"></i>
                                                    <span>Đăng xuất</span>
                                                </button>
                                            </li>
                                        </ul>
                                    </div>
                                </div>
                            ) : (
                                <Link to="/login" className="btn login-btn">
                                    <i className="bi bi-person-circle"></i>
                                    <span>Đăng nhập</span>
                                </Link>
                            )}
                        </div>
                    </div>

                    {/* Overlay */}
                    {mobileMenuOpen && (
                        <div 
                            className="overlay active" 
                            onClick={() => setMobileMenuOpen(false)}
                        ></div>
                    )}
                </div>
            </nav>
        </header>
    );
};

export default Header;