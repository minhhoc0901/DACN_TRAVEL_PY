import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../../styles/auth/AuthForm.css';
import '../../styles/auth/ValidationStyles.css'; // ✅ THÊM CSS VALIDATION
import { useAuth } from '../../contexts/AuthContext';

// ✅ IMPORT VALIDATION UTILITIES
import { 
    validateUsername,
    validateEmail,
    validatePhone,
    validatePassword,
    validateFullName,
    validateOTP,
    validateConfirmPassword,
    calculatePasswordStrength
} from '../../utils/validationUtils';

import { extractValidationErrors } from '../../utils/formHelpers';

const RegisterForm = () => {
    const navigate = useNavigate();
    const { isAuthenticated } = useAuth();
    
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

    // ✅ THÊM VALIDATION ERRORS STATE
    const [validationErrors, setValidationErrors] = useState({});
    const [touched, setTouched] = useState({});

    // ✅ THÊM PASSWORD STRENGTH
    const [passwordStrength, setPasswordStrength] = useState({
        strength: 'weak',
        score: 0,
        color: '#ff4444',
        suggestions: []
    });

    useEffect(() => {
        if (isAuthenticated) {
            navigate('/', { replace: true });
        }
    }, [isAuthenticated, navigate]);

    // ✅ VALIDATE FIELD KHI BLUR
    const handleBlur = (fieldName) => {
        setTouched(prev => ({ ...prev, [fieldName]: true }));
        
        let error = '';
        switch (fieldName) {
            case 'username':
                error = validateUsername(formData.username);
                break;
            case 'fullName':
                error = validateFullName(formData.fullName);
                break;
            case 'email':
                error = validateEmail(formData.email);
                break;
            case 'phone':
                error = validatePhone(formData.phone);
                break;
            case 'password':
                error = validatePassword(formData.password);
                break;
            case 'confirmPassword':
                error = validateConfirmPassword(formData.password, formData.confirmPassword);
                break;
            case 'otp':
                error = validateOTP(formData.otp);
                break;
            default:
                break;
        }
        
        setValidationErrors(prev => ({ ...prev, [fieldName]: error }));
    };

    // ✅ UPDATE PASSWORD STRENGTH REALTIME
    useEffect(() => {
        if (formData.password) {
            const strength = calculatePasswordStrength(formData.password);
            setPasswordStrength(strength);
        } else {
            setPasswordStrength({
                strength: 'weak',
                score: 0,
                color: '#ff4444',
                suggestions: []
            });
        }
    }, [formData.password]);

    // ✅ CLEAR ERROR WHEN USER TYPES
    const handleInputChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        
        // Clear error when user types
        if (touched[field]) {
            setValidationErrors(prev => ({ ...prev, [field]: '' }));
        }
        setError('');
    };

    const validateForm = () => {
        const errors = {};
        
        // Validate all fields
        errors.username = validateUsername(formData.username);
        errors.fullName = validateFullName(formData.fullName);
        errors.email = validateEmail(formData.email);
        errors.phone = validatePhone(formData.phone);
        errors.password = validatePassword(formData.password);
        errors.confirmPassword = validateConfirmPassword(formData.password, formData.confirmPassword);
        errors.otp = validateOTP(formData.otp);
        
        // Check terms
        if (!formData.agreeTerms) {
            setError('Vui lòng đồng ý với điều khoản và điều kiện');
            return false;
        }
        
        // Filter out empty errors
        const filteredErrors = Object.fromEntries(
            Object.entries(errors).filter(([_, v]) => v !== '')
        );
        
        setValidationErrors(filteredErrors);
        
        // Mark all fields as touched
        const allTouched = {};
        Object.keys(formData).forEach(key => {
            allTouched[key] = true;
        });
        setTouched(allTouched);
        
        return Object.keys(filteredErrors).length === 0;
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
            // Validate email first
            const emailError = validateEmail(formData.email);
            if (emailError) {
                setValidationErrors(prev => ({ ...prev, email: emailError }));
                setTouched(prev => ({ ...prev, email: true }));
                return;
            }

            setSendingOTP(true);
            startCountdown();

            const response = await axios.post('http://localhost:5000/api/auth/send-otp', {
                email: formData.email
            });

            if (response.data.success) {
                setError('');
            }
        } catch (error) {
            setError(error.response?.data?.message || 'Không thể gửi mã OTP');
            setCountdown(0);
        } finally {
            setSendingOTP(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!validateForm()) {
            setError('Vui lòng kiểm tra lại thông tin');
            return;
        }

        try {
            setLoading(true);
            
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
            
            // ✅ HANDLE BACKEND VALIDATION ERRORS
            if (error.response?.data?.errors) {
                const backendErrors = extractValidationErrors(error);
                setValidationErrors(backendErrors);
                
                // Mark affected fields as touched
                Object.keys(backendErrors).forEach(field => {
                    setTouched(prev => ({ ...prev, [field]: true }));
                });
            }
            
            setError(error.response?.data?.message || 'Có lỗi xảy ra khi đăng ký');
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
                                />
                            </div>
                            {touched.username && validationErrors.username && (
                                <span className="error-message">
                                    <i className="bi bi-exclamation-circle"></i>
                                    {validationErrors.username}
                                </span>
                            )}
                        </div>

                        {/* FULL NAME */}
                        <div className="auth-form-group">
                            <label htmlFor="fullName">Họ và tên</label>
                            <div className="auth-input-group">
                                <i className="bi bi-person"></i>
                                <input
                                    type="text"
                                    id="fullName"
                                    placeholder="Nhập họ và tên"
                                    value={formData.fullName}
                                    onChange={(e) => handleInputChange('fullName', e.target.value)}
                                    onBlur={() => handleBlur('fullName')}
                                    className={touched.fullName && validationErrors.fullName ? 'error' : ''}
                                    required
                                />
                            </div>
                            {touched.fullName && validationErrors.fullName && (
                                <span className="error-message">
                                    <i className="bi bi-exclamation-circle"></i>
                                    {validationErrors.fullName}
                                </span>
                            )}
                        </div>

                        {/* EMAIL & PHONE ROW */}
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
                                        onChange={(e) => handleInputChange('email', e.target.value)}
                                        onBlur={() => handleBlur('email')}
                                        className={touched.email && validationErrors.email ? 'error' : ''}
                                        required
                                    />
                                    <button
                                        type="button"
                                        className={`btn-send-otp ${sendingOTP ? 'loading' : ''}`}
                                        onClick={handleSendOTP}
                                        disabled={countdown > 0 || sendingOTP || !!validationErrors.email}
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
                                {touched.email && validationErrors.email && (
                                    <span className="error-message">
                                        <i className="bi bi-exclamation-circle"></i>
                                        {validationErrors.email}
                                    </span>
                                )}
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
                                        onChange={(e) => handleInputChange('phone', e.target.value)}
                                        onBlur={() => handleBlur('phone')}
                                        className={touched.phone && validationErrors.phone ? 'error' : ''}
                                        required
                                    />
                                </div>
                                {touched.phone && validationErrors.phone && (
                                    <span className="error-message">
                                        <i className="bi bi-exclamation-circle"></i>
                                        {validationErrors.phone}
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* OTP */}
                        <div className="auth-form-group">
                            <label htmlFor="otp">Mã xác thực</label>
                            <div className="auth-input-group">
                                <i className="bi bi-shield-lock"></i>
                                <input
                                    type="text"
                                    id="otp"
                                    placeholder="Nhập mã OTP Email"
                                    value={formData.otp}
                                    onChange={(e) => handleInputChange('otp', e.target.value)}
                                    onBlur={() => handleBlur('otp')}
                                    className={touched.otp && validationErrors.otp ? 'error' : ''}
                                    maxLength="6"
                                    required
                                />
                            </div>
                            {touched.otp && validationErrors.otp && (
                                <span className="error-message">
                                    <i className="bi bi-exclamation-circle"></i>
                                    {validationErrors.otp}
                                </span>
                            )}
                        </div>

                        {/* PASSWORD */}
                        <div className="auth-form-group">
                            <label htmlFor="password">Mật khẩu</label>
                            <div className="auth-input-group">
                                <i className="bi bi-lock"></i>
                                <input
                                    type={showPasswords.password ? "text" : "password"}
                                    id="password"
                                    placeholder="Tạo mật khẩu"
                                    value={formData.password}
                                    onChange={(e) => handleInputChange('password', e.target.value)}
                                    onBlur={() => handleBlur('password')}
                                    className={touched.password && validationErrors.password ? 'error' : ''}
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
                            {touched.password && validationErrors.password && (
                                <span className="error-message">
                                    <i className="bi bi-exclamation-circle"></i>
                                    {validationErrors.password}
                                </span>
                            )}
                            
                            {/* ✅ PASSWORD STRENGTH INDICATOR */}
                            {formData.password && (
                                <div className="password-strength-indicator">
                                    <div className="password-strength-header">
                                        <span className="strength-label">Độ mạnh:</span>
                                        <span className={`strength-value ${passwordStrength.strength}`}>
                                            {passwordStrength.strength === 'weak' ? 'Yếu' : 
                                             passwordStrength.strength === 'medium' ? 'Trung bình' : 'Mạnh'}
                                        </span>
                                    </div>
                                    <div className="strength-progress">
                                        <div 
                                            className="strength-progress-bar"
                                            style={{
                                                width: `${(passwordStrength.score / 6) * 100}%`,
                                                backgroundColor: passwordStrength.color
                                            }}
                                        ></div>
                                    </div>
                                    {passwordStrength.suggestions.length > 0 && (
                                        <div className="strength-suggestions">
                                            <ul>
                                                {passwordStrength.suggestions.map((suggestion, index) => (
                                                    <li key={index}>{suggestion}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* CONFIRM PASSWORD */}
                        <div className="auth-form-group">
                            <label htmlFor="confirmPassword">Xác nhận mật khẩu</label>
                            <div className="auth-input-group">
                                <i className="bi bi-lock-fill"></i>
                                <input
                                    type={showPasswords.confirm ? "text" : "password"}
                                    id="confirmPassword"
                                    placeholder="Nhập lại mật khẩu"
                                    value={formData.confirmPassword}
                                    onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                                    onBlur={() => handleBlur('confirmPassword')}
                                    className={touched.confirmPassword && validationErrors.confirmPassword ? 'error' : ''}
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
                            {touched.confirmPassword && validationErrors.confirmPassword && (
                                <span className="error-message">
                                    <i className="bi bi-exclamation-circle"></i>
                                    {validationErrors.confirmPassword}
                                </span>
                            )}
                        </div>

                        {/* TERMS CHECKBOX */}
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
                                    <Link to="/privacy"> Chính sách bảo mật</Link>
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