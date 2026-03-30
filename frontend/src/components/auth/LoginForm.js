import React, { useState, useEffect } from 'react'; 
import { Link, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import '../../styles/auth/AuthForm.css';
import '../../styles/auth/ValidationStyles.css';
import { useAuth } from '../../contexts/AuthContext';
import { CONFIG } from '../../config';

// ✅ CHỈ IMPORT validateUsername (BỎ validatePassword)
import { validateUsername } from '../../utils/validationUtils';

import { extractValidationErrors } from '../../utils/formHelpers';

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

    // ✅ THÊM VALIDATION STATES
    const [validationErrors, setValidationErrors] = useState({});
    const [touched, setTouched] = useState({});

    // Redirect nếu đã đăng nhập
    useEffect(() => {
        if (isAuthenticated) {
            navigate(from, { replace: true });
        }
    }, [isAuthenticated, navigate, from]);

    // ✅ VALIDATE FIELD KHI BLUR
    const handleBlur = (fieldName) => {
        setTouched(prev => ({ ...prev, [fieldName]: true }));
        
        let error = '';
        switch (fieldName) {
            case 'username':
                error = validateUsername(formData.username);
                break;
            case 'password':
                // Đơn giản hóa validation cho login - chỉ check empty
                if (!formData.password || formData.password.trim() === '') {
                    error = 'Mật khẩu không được để trống';
                }
                break;
            default:
                break;
        }
        
        setValidationErrors(prev => ({ ...prev, [fieldName]: error }));
    };

    // ✅ HANDLE INPUT CHANGE
    const handleInputChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        
        // Clear error khi user nhập
        if (touched[field]) {
            setValidationErrors(prev => ({ ...prev, [field]: '' }));
        }
        setError('');
    };

    // ✅ VALIDATE FORM BEFORE SUBMIT
    const validateForm = () => {
        const errors = {};
        
        errors.username = validateUsername(formData.username);
        
        if (!formData.password || formData.password.trim() === '') {
            errors.password = 'Mật khẩu không được để trống';
        }
        
        // Filter out empty errors
        const filteredErrors = Object.fromEntries(
            Object.entries(errors).filter(([_, v]) => v !== '')
        );
        
        setValidationErrors(filteredErrors);
        
        // Mark all fields as touched
        setTouched({
            username: true,
            password: true
        });
        
        return Object.keys(filteredErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        // ✅ VALIDATE FORM
        if (!validateForm()) {
            setError('Vui lòng kiểm tra lại thông tin');
            return;
        }

        try {
            setLoading(true);
            const response = await axios.post(`${CONFIG.API_API_URL}/auth/login`, {
                username: formData.username.trim(),
                password: formData.password
            });

            if (response.data.success) {
                const token = response.data.token;
                
                login(response.data.data, token, formData.remember);
                
                console.log('Token passed to login:', token);
                
                setShowSuccessModal(true);
            }
        } catch (error) {
            console.error('[LOGIN] Error:', error.response?.data);
            
            // ✅ HANDLE BACKEND VALIDATION ERRORS
            if (error.response?.data?.errors) {
                const backendErrors = extractValidationErrors(error);
                setValidationErrors(backendErrors);
                
                // Mark affected fields as touched
                Object.keys(backendErrors).forEach(field => {
                    setTouched(prev => ({ ...prev, [field]: true }));
                });
            }
            
            setError(error.response?.data?.message || 'Đăng nhập thất bại');
        } finally {
            setLoading(false);
        }
    };

    const handleSuccessModalClose = () => {
        setShowSuccessModal(false);
        navigate(from); 
    };

    if (isAuthenticated) {
        return null;
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

                    {/* SUCCESS MESSAGE FROM FORGOT PASSWORD */}
                    {location.state?.message && (
                        <div className="alert alert-success">
                            <i className="bi bi-check-circle-fill"></i>
                            {location.state.message}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="auth-form">
                        {/* ✅ ERROR MESSAGE */}
                        {error && (
                            <div className="alert alert-danger">
                                <i className="bi bi-exclamation-circle-fill"></i>
                                {error}
                            </div>
                        )}

                        {/* USERNAME */}
                        <div className="auth-form-group">
                            <label htmlFor="username">Tên đăng nhập</label>
                            <div className="auth-input-group">
                                <i className="bi bi-person"></i>
                                <input
                                    type="text"
                                    id="username"
                                    placeholder="Nhập tên đăng nhập"
                                    value={formData.username}
                                    onChange={(e) => handleInputChange('username', e.target.value)}
                                    onBlur={() => handleBlur('username')}
                                    className={touched.username && validationErrors.username ? 'error' : ''}
                                    required
                                    autoComplete="username"
                                />
                            </div>
                            {touched.username && validationErrors.username && (
                                <span className="error-message">
                                    <i className="bi bi-exclamation-circle"></i>
                                    {validationErrors.username}
                                </span>
                            )}
                        </div>

                        {/* PASSWORD */}
                        <div className="auth-form-group">
                            <label htmlFor="password">Mật khẩu</label>
                            <div className="auth-input-group">
                                <i className="bi bi-lock"></i>
                                <input
                                    type={showPassword ? "text" : "password"}
                                    id="password"
                                    placeholder="Nhập mật khẩu"
                                    value={formData.password}
                                    onChange={(e) => handleInputChange('password', e.target.value)}
                                    onBlur={() => handleBlur('password')}
                                    className={touched.password && validationErrors.password ? 'error' : ''}
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
                            {touched.password && validationErrors.password && (
                                <span className="error-message">
                                    <i className="bi bi-exclamation-circle"></i>
                                    {validationErrors.password}
                                </span>
                            )}
                        </div>

                        {/* REMEMBER ME & FORGOT PASSWORD */}
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

                        {/* SUBMIT BUTTON */}
                        <button type="submit" className="btn-submit" disabled={loading}>
                            {loading ? (
                                <>
                                    <span className="spinner"></span>
                                    Đang xử lý...
                                </>
                            ) : (
                                <>
                                    Đăng nhập
                                    <i className="bi bi-arrow-right"></i>
                                </>
                            )}
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

            {/* SUCCESS MODAL */}
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