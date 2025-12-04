import React, { useState, useEffect } from 'react'; // Thêm useEffect
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../../styles/auth/AuthForm.css';
import { useAuth } from '../../contexts/AuthContext'; // Import useAuth

const RegisterForm = () => {
    const navigate = useNavigate();
    const { isAuthenticated } = useAuth(); // Lấy isAuthenticated từ context
    const [formData, setFormData] = useState({
        username: '',
        fullName: '',
        email: '',
        phone: '',
        password: '',
        confirmPassword: '',
        agreeTerms: false,
        otp: '',
    });

    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [countdown, setCountdown] = useState(0);
    const [sendingOTP, setSendingOTP] = useState(false);
    const [showPasswords, setShowPasswords] = useState({
        password: false,
        confirm: false
    });

    // Thêm useEffect để kiểm tra và chuyển hướng nếu đã đăng nhập
    useEffect(() => {
        if (isAuthenticated) {
            navigate('/', { replace: true }); // Chuyển hướng về trang chủ
        }
    }, [isAuthenticated, navigate]);

    const validateForm = () => {
        if (!formData.username) {
            setError('Vui lòng nhập tên đăng nhập');
            return false;
        }
        if (!formData.email) {
            setError('Vui lòng nhập email');
            return false;
        }
        if (!formData.password) {
            setError('Vui lòng nhập mật khẩu');
            return false;
        }
        if (formData.password !== formData.confirmPassword) {
            setError('Mật khẩu xác nhận không khớp');
            return false;
        }
        if (!formData.agreeTerms) {
            setError('Vui lòng đồng ý với điều khoản và điều kiện');
            return false;
        }
        return true;
    };

    const startCountdown = () => {
        setCountdown(60);
        const timer = setInterval(() => {
            setCountdown(prev => {
                if (prev <= 1) {
                    clearInterval(timer);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
    };

    const handleSendOTP = async () => {
        try {
            if (!formData.email) {
                setError('Vui lòng nhập email');
                return;
            }

            setSendingOTP(true); // Set loading state
            startCountdown(); // Start countdown immediately

            const response = await axios.post('http://localhost:5000/api/auth/send-otp', {
                email: formData.email
            });

            if (response.data.success) {
                setError('');
            }
        } catch (error) {
            setError(error.response?.data?.message || 'Không thể gửi mã OTP');
            setCountdown(0); // Reset countdown if error
        } finally {
            setSendingOTP(false);
        }
    };

    
    const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!validateForm()) return;

    try {
        setLoading(true);
        
        // CHUẨN BỊ DỮ LIỆU GỬI LÊN SERVER
        const payload = {
            username: formData.username.trim(),
            fullName: formData.fullName.trim() || formData.username.trim(),
            email: formData.email.trim(),
            phone: formData.phone.trim(),
            password: formData.password,
            otp: formData.otp.trim()
        };

        console.log('[REGISTER] Sending payload:', {
            ...payload,
            password: '***hidden***'
        });

        const response = await axios.post('http://localhost:5000/api/auth/register', payload);

        console.log('[REGISTER] Response:', response.data);

        if (response.data.success) {
            setShowSuccessModal(true);
        }
    } catch (error) {
        console.error('[REGISTER] Error:', error.response?.data || error.message);
        
        //  HIỂN THỊ LỖI CHI TIẾT
        if (error.response?.data?.errors) {
            const errorMessages = error.response.data.errors
                .map(err => err.message)
                .join(', ');
            setError(errorMessages);
        } else {
            setError(error.response?.data?.message || 'Có lỗi xảy ra khi đăng ký');
        }
    } finally {
        setLoading(false);
    }
};

    const handleSuccessModalClose = () => {
        setShowSuccessModal(false);
        navigate('/login');
    };

    // Nếu đã đăng nhập, có thể hiển thị null hoặc một thông báo đang chuyển hướng
    if (isAuthenticated) {
        return null; // Hoặc <p>Đang chuyển hướng...</p>
    }

    return (
        <div className="auth-wrapper">
            <div className="auth-side">
                <div className="auth-side-content">
                    <h2>Tham gia cùng chúng tôi!</h2>
                    <p>Bắt đầu hành trình khám phá Phú Yên của bạn</p>
                    <div className="auth-image"></div>
                </div>
            </div>
            
            <div className="auth-main">
                <div className="auth-box">
                    <div className="auth-header">
                        <Link to="/" className="auth-brand">
                            <i className="bi bi-airplane-engines"></i>
                            <span>PHÚ YÊN</span>
                        </Link>
                        <h1>Đăng ký tài khoản</h1>
                        <p>Điền thông tin dưới đây để tạo tài khoản</p>
                    </div>

                    <form onSubmit={handleSubmit} className="auth-form">
                        {error && <div className="alert alert-danger">{error}</div>}
                        
                        <div className="auth-form-group">
                            <label htmlFor="username">Tên đăng nhập</label>
                            <div className="auth-input-group">
                                <i className="bi bi-person"></i>
                                <input
                                    type="text"
                                    id="username"
                                    placeholder="Nhập tên đăng nhập"
                                    value={formData.username}
                                    onChange={(e) => setFormData({...formData, username: e.target.value})}
                                    required
                                />
                            </div>
                        </div>

                        <div className="auth-form-group">
                            <label htmlFor="fullName">Họ và tên</label>
                            <div className="auth-input-group">
                                <i className="bi bi-person"></i>
                                <input
                                    type="text"
                                    id="fullName"
                                    placeholder="Nhập họ và tên"
                                    value={formData.fullName}
                                    onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                                    required
                                />
                            </div>
                        </div>

                        <div className="form-row">
                            <div className="auth-form-group">
                                <label htmlFor="email">Email</label>
                                <div className="auth-input-group">
                                    <i className="bi bi-envelope"></i>
                                    <input
                                        type="email"
                                        id="email"
                                        placeholder="Nhập email"
                                        value={formData.email}
                                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                                        required
                                    />
                                    <button
                                        type="button"
                                        className={`btn-send-otp ${sendingOTP ? 'loading' : ''}`}
                                        onClick={handleSendOTP}
                                        disabled={countdown > 0 || sendingOTP}
                                    >
                                        {sendingOTP ? (
                                            <i className="bi bi-hourglass-split spinning"></i>
                                        ) : countdown > 0 ? (
                                            `${countdown}s`
                                        ) : (
                                            'Gửi mã'
                                        )}
                                    </button>
                                </div>
                            </div>

                            <div className="auth-form-group">
                                <label htmlFor="phone">Số điện thoại</label>
                                <div className="auth-input-group">
                                    <i className="bi bi-phone"></i>
                                    <input
                                        type="tel"
                                        id="phone"
                                        placeholder="Nhập số điện thoại"
                                        value={formData.phone}
                                        onChange={(e) => setFormData({...formData, phone: e.target.value})}
                                        required
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="auth-form-group">
                            <label htmlFor="otp">Mã xác thực</label>
                            <div className="auth-input-group">
                                <i className="bi bi-shield-lock"></i>
                                <input
                                    type="text"
                                    id="otp"
                                    placeholder="Nhập mã OTP Email"
                                    value={formData.otp}
                                    onChange={(e) => setFormData({...formData, otp: e.target.value})}
                                    required
                                />
                            </div>
                        </div>

                        <div className="auth-form-group">
                            <label htmlFor="password">Mật khẩu</label>
                            <div className="auth-input-group">
                                <i className="bi bi-lock"></i>
                                <input
                                    type={showPasswords.password ? "text" : "password"}
                                    id="password"
                                    placeholder="Tạo mật khẩu"
                                    value={formData.password}
                                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                                    required
                                />
                                <button
                                    type="button"
                                    className="btn-toggle-password"
                                    onClick={() => setShowPasswords({...showPasswords, password: !showPasswords.password})}
                                >
                                    <i className={`bi bi-eye${showPasswords.password ? '-slash' : ''}`}></i>
                                </button>
                            </div>
                        </div>

                        <div className="auth-form-group">
                            <label htmlFor="confirmPassword">Xác nhận mật khẩu</label>
                            <div className="auth-input-group">
                                <i className="bi bi-lock-fill"></i>
                                <input
                                    type={showPasswords.confirm ? "text" : "password"}
                                    id="confirmPassword"
                                    placeholder="Nhập lại mật khẩu"
                                    value={formData.confirmPassword}
                                    onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                                    required
                                />
                                <button
                                    type="button"
                                    className="btn-toggle-password"
                                    onClick={() => setShowPasswords({...showPasswords, confirm: !showPasswords.confirm})}
                                >
                                    <i className={`bi bi-eye${showPasswords.confirm ? '-slash' : ''}`}></i>
                                </button>
                            </div>
                        </div>

                        <div className="auth-form-group">
                            <label className="auth-checkbox-wrapper terms">
                                <input
                                    type="checkbox"
                                    checked={formData.agreeTerms}
                                    onChange={(e) => setFormData({...formData, agreeTerms: e.target.checked})}
                                    required
                                />
                                <span className="auth-checkbox-label">
                                    Tôi đồng ý với <Link to="/terms">Điều khoản</Link> và 
                                    <Link to="/privacy">Chính sách bảo mật</Link>
                                </span>
                            </label>
                        </div>

                        <button type="submit" className="btn-submit" disabled={loading}>
                            {loading ? 'Đang xử lý...' : 'Đăng ký'}
                            {!loading && <i className="bi bi-arrow-right"></i>}
                        </button>
                    </form>

                    <div className="auth-separator">
                        <span>Hoặc đăng ký với</span>
                    </div>

                    <div className="social-auth">
                        <button type="button" className="social-btn google">
                            <i className="bi bi-google"></i>
                            <span>Google</span>
                        </button>
                        <button type="button" className="social-btn facebook">
                            <i className="bi bi-facebook"></i>
                            <span>Facebook</span>
                        </button>
                    </div>

                    <p className="auth-redirect">
                        Đã có tài khoản? 
                        <Link to="/login"> Đăng nhập</Link>
                    </p>
                </div>
            </div>

            {showSuccessModal && (
                <div className="modal-overlay">
                    <div className="success-modal">
                        <div className="success-icon">
                            <i className="bi bi-check-circle-fill"></i>
                        </div>
                        <h3>Đăng ký thành công!</h3>
                        <p>Tài khoản của bạn đã được tạo thành công.</p>
                        <button className="btn-modal" onClick={handleSuccessModalClose}>
                            OK
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default RegisterForm;