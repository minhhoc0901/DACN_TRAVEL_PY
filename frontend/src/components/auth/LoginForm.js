import React, { useState, useEffect } from 'react'; 
import { Link, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import '../../styles/auth/AuthForm.css';
import { useAuth } from '../../contexts/AuthContext';

const LoginForm = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const from = location.state?.from || '/';
    const { login, isAuthenticated } = useAuth(); 
    const [formData, setFormData] = useState({
        username: '',
        password: '',
        remember: false
    });

    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    // Thêm useEffect để kiểm tra và chuyển hướng nếu đã đăng nhập
    useEffect(() => {
        if (isAuthenticated) {
            navigate(from, { replace: true }); // Chuyển hướng về trang trước đó hoặc trang chủ
        }
    }, [isAuthenticated, navigate, from]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!formData.username || !formData.password) {
            setError('Vui lòng nhập đầy đủ thông tin');
            return;
        }

        try {
            setLoading(true);
            const response = await axios.post('http://localhost:5000/api/auth/login', {
                username: formData.username,
                password: formData.password
            });

            if (response.data.success) {
                const token = response.data.token;
                
                // THAY ĐỔI QUAN TRỌNG: Gọi hàm login với đầy đủ token và rememberMe
                login(response.data.data, token, formData.remember);
                
                // Không cần lưu token riêng nữa vì đã được xử lý trong login
                // Giữ đoạn này để debug
                console.log('Token passed to login:', token);
                
                setShowSuccessModal(true);
            }
        } catch (error) {
            setError(error.response?.data?.message || 'Đăng nhập thất bại');
        } finally {
            setLoading(false);
        }
    };

    const handleSuccessModalClose = () => {
        setShowSuccessModal(false);
        navigate(from); 
    };

    // Nếu đã đăng nhập, có thể hiển thị null hoặc một thông báo đang chuyển hướng
    // để tránh form bị render trong giây lát trước khi chuyển hướng.
    if (isAuthenticated) {
        return null; // Hoặc <p>Đang chuyển hướng...</p>
    }

    return (
        <div className="auth-wrapper">
            <div className="auth-side">
                <div className="auth-side-content">
                    <h2>Chào mừng trở lại!</h2>
                    <p>Khám phá vẻ đẹp của Phú Yên cùng chúng tôi</p>
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
                        <h1>Đăng nhập</h1>
                        <p>Vui lòng đăng nhập để tiếp tục</p>
                    </div>

                    {location.state?.message && (
                        <div className="alert alert-success">
                            {location.state.message}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="auth-form">
                        {error && <div className="alert alert-danger">{error}</div>}

                        <div className="auht-form-group">
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
                                    autoComplete="username"
                                />
                            </div>
                        </div>

                        <div className="auth-form-group">
                            <label htmlFor="password">Mật khẩu</label>
                            <div className="auth-input-group">
                                <i className="bi bi-lock"></i>
                                <input
                                    type={showPassword ? "text" : "password"}
                                    id="password"
                                    placeholder="Nhập mật khẩu"
                                    value={formData.password}
                                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                                    required
                                    autoComplete="current-password"
                                />
                                <button
                                    type="button"
                                    className="btn-toggle-password"
                                    onClick={() => setShowPassword(!showPassword)}
                                >
                                    <i className={`bi bi-eye${showPassword ? '-slash' : ''}`}></i>
                                </button>
                            </div>
                        </div>

                        <div className="form-options">
                            <label className="auth-checkbox-wrapper">
                                <input
                                    type="checkbox"
                                    checked={formData.remember}
                                    onChange={(e) => setFormData({...formData, remember: e.target.checked})}
                                />
                                <span className="auth-checkbox-label">Ghi nhớ đăng nhập</span>
                            </label>
                            <Link to="/forgot-password" className="forgot-link">
                                Quên mật khẩu?
                            </Link>
                        </div>

                        <button type="submit" className="btn-submit" disabled={loading}>
                            {loading ? 'Đang xử lý...' : 'Đăng nhập'}
                            {!loading && <i className="bi bi-arrow-right"></i>}
                        </button>
                    </form>

                    <div className="auth-separator">
                        <span>Hoặc đăng nhập với</span>
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
                        Chưa có tài khoản? 
                        <Link to="/register"> Đăng ký ngay</Link>
                    </p>
                </div>
            </div>

            {showSuccessModal && (
                <div className="modal-overlay">
                    <div className="success-modal">
                        <div className="success-icon">
                            <i className="bi bi-check-circle-fill"></i>
                        </div>
                        <h3>Đăng nhập thành công!</h3>
                        <p>Chào mừng bạn đã trở lại.</p>
                        <button className="btn-modal" onClick={handleSuccessModalClose}>
                            OK
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default LoginForm;