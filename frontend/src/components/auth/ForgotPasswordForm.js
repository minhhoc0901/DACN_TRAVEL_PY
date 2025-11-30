import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../../styles/auth/ForgotPasswordForm.css';

const ForgotPasswordForm = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        email: '',
        otp: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [step, setStep] = useState(1); 
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [countdown, setCountdown] = useState(0);
    const [showPasswords, setShowPasswords] = useState({
        new: false,
        confirm: false
    });

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

            setLoading(true);
            const response = await axios.post('http://localhost:5000/api/auth/send-otp', {
                email: formData.email,
                isPasswordReset: true // Thêm flag để phân biệt với đăng ký
            });

            if (response.data.success) {
                startCountdown();
                setError('');
                setStep(2); 
            }
        } catch (error) {
            setError(error.response?.data?.message || 'Không thể gửi mã OTP');
            setCountdown(0);
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOTP = async () => {
        try {
            if (!formData.otp) {
                setError('Vui lòng nhập mã OTP');
                return;
            }

            setLoading(true);
            const response = await axios.post('http://localhost:5000/api/auth/verify-reset-otp', {
                email: formData.email,
                otp: formData.otp
            });

            if (response.data.success) {
                setStep(3);
                setError('');
            }
        } catch (error) {
            setError(error.response?.data?.message || 'Mã OTP không hợp lệ');
        } finally {
            setLoading(false);
        }
    };

    const handleResetPassword = async () => {
        try {
            if (formData.newPassword !== formData.confirmPassword) {
                setError('Mật khẩu xác nhận không khớp');
                return;
            }

            setLoading(true);
            const response = await axios.post('http://localhost:5000/api/auth/reset-password', {
                email: formData.email,
                otp: formData.otp,
                newPassword: formData.newPassword
            });

            if (response.data.success) {
                // Redirect to login with success message
                navigate('/login', { 
                    state: { message: 'Đặt lại mật khẩu thành công. Vui lòng đăng nhập.' } 
                });
            }
        } catch (error) {
            setError(error.response?.data?.message || 'Không thể đặt lại mật khẩu');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-wrapper">
            <div className="auth-side">
                <div className="auth-side-content">
                    <h2>Quên mật khẩu?</h2>
                    <p>Đừng lo, chúng tôi sẽ giúp bạn lấy lại mật khẩu</p>
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
                        <h1>Quên mật khẩu</h1>
                        <p>Vui lòng thực hiện các bước để lấy lại mật khẩu</p>
                    </div>

                    {error && <div className="alert alert-danger">{error}</div>}

                    <div className="auth-steps">
                        <div className={`step ${step >= 1 ? 'active' : ''}`}>
                            <span className="step-number">1</span>
                            <span className="step-text">Email</span>
                        </div>
                        <div className={`step ${step >= 2 ? 'active' : ''}`}>
                            <span className="step-number">2</span>
                            <span className="step-text">OTP</span>
                        </div>
                        <div className={`step ${step >= 3 ? 'active' : ''}`}>
                            <span className="step-number">3</span>
                            <span className="step-text">Mật khẩu mới</span>
                        </div>
                    </div>

                    {step === 1 && (
                        <div className="auth-form">
                            <div className="form-group">
                                <label>Email</label>
                                <div className="input-group">
                                    <i className="bi bi-envelope"></i>
                                    <input
                                        type="email"
                                        placeholder="Nhập email của bạn"
                                        value={formData.email}
                                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                                        required
                                    />
                                </div>
                            </div>
                            <button
                                type="button"
                                className="btn-submit"
                                onClick={handleSendOTP}
                                disabled={loading || countdown > 0}
                            >
                                {loading ? 'Đang xử lý...' : countdown > 0 ? `Gửi lại sau ${countdown}s` : 'Tiếp tục'}
                            </button>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="auth-form">
                            <div className="form-group">
                                <label>Mã xác thực</label>
                                <div className="input-group">
                                    <i className="bi bi-shield-lock"></i>
                                    <input
                                        type="text"
                                        placeholder="Nhập mã OTP"
                                        value={formData.otp}
                                        onChange={(e) => setFormData({...formData, otp: e.target.value})}
                                        required
                                    />
                                </div>
                                <p className="help-text">
                                    Mã xác thực đã được gửi đến email của bạn
                                </p>
                            </div>
                            <button
                                type="button"
                                className="btn-submit"
                                onClick={handleVerifyOTP}
                                disabled={loading}
                            >
                                {loading ? 'Đang xử lý...' : 'Xác nhận'}
                            </button>
                        </div>
                    )}

                    {step === 3 && (
                        <div className="auth-form">
                            <div className="form-group">
                                <label>Mật khẩu mới</label>
                                <div className="input-group">
                                    <i className="bi bi-lock"></i>
                                    <input
                                        type={showPasswords.new ? "text" : "password"}
                                        placeholder="Nhập mật khẩu mới"
                                        value={formData.newPassword}
                                        onChange={(e) => setFormData({...formData, newPassword: e.target.value})}
                                        required
                                    />
                                    <button
                                        type="button"
                                        className="btn-toggle-password"
                                        onClick={() => setShowPasswords({...showPasswords, new: !showPasswords.new})}
                                    >
                                        <i className={`bi bi-eye${showPasswords.new ? '-slash' : ''}`}></i>
                                    </button>
                                </div>
                            </div>

                            <div className="form-group">
                                <label>Xác nhận mật khẩu mới</label>
                                <div className="input-group">
                                    <i className="bi bi-lock"></i>
                                    <input
                                        type={showPasswords.confirm ? "text" : "password"}
                                        placeholder="Nhập lại mật khẩu mới"
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

                            <button
                                type="button"
                                className="btn-submit"
                                onClick={handleResetPassword}
                                disabled={loading}
                            >
                                {loading ? 'Đang xử lý...' : 'Đặt lại mật khẩu'}
                            </button>
                        </div>
                    )}

                    <div className="auth-footer">
                        <Link to="/login">Quay lại đăng nhập</Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ForgotPasswordForm;