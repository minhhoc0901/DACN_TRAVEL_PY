import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios';
import AvatarUpload from './AvatarUpload';
import '../../styles/auth/ProfileForm.css';
import '../../styles/auth/ValidationStyles.css'; // ✅ IMPORT VALIDATION CSS

// ✅ IMPORT VALIDATION UTILITIES
import {
    validateFullName,
    validateEmail,
    validatePhone,
    validatePassword
} from '../../utils/validationUtils';

import { extractValidationErrors } from '../../utils/formHelpers';

const ProfileForm = () => {
    const { user, login } = useAuth();
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [isChangingPassword, setIsChangingPassword] = useState(false);
    
    // ===== FORM DATA =====
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        phone: ''
    });

    // ===== PASSWORD DATA =====
    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });

    // ===== VALIDATION ERRORS =====
    const [validationErrors, setValidationErrors] = useState({});
    
    // ✅ THÊM TOUCHED STATE
    const [touched, setTouched] = useState({});

    // ===== SHOW PASSWORD STATES =====
    const [showPasswords, setShowPasswords] = useState({
        current: false,
        new: false,
        confirm: false
    });

    // ===== LOAD USER DATA =====
    useEffect(() => {
        if (user) {
            setFormData({
                fullName: user.fullName || user.full_name || '',
                email: user.email || '',
                phone: user.phone || ''
            });
        }
    }, [user]);

    // ✅ HANDLE INPUT CHANGE WITH VALIDATION
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        
        // Clear error when user types
        if (touched[name]) {
            setValidationErrors(prev => ({ ...prev, [name]: '' }));
        }
        setError('');
    };

    // ✅ HANDLE BLUR - VALIDATE FIELD
    const handleBlur = (fieldName) => {
        setTouched(prev => ({ ...prev, [fieldName]: true }));
        
        let error = '';
        switch (fieldName) {
            case 'fullName':
                error = validateFullName(formData.fullName);
                break;
            case 'email':
                error = validateEmail(formData.email);
                break;
            case 'phone':
                error = validatePhone(formData.phone);
                break;
            default:
                break;
        }
        
        setValidationErrors(prev => ({ ...prev, [fieldName]: error }));
    };

    const handlePasswordChange = (e) => {
        const { name, value } = e.target;
        setPasswordData(prev => ({ ...prev, [name]: value }));
        
        // Clear error when user types
        if (touched[name]) {
            setValidationErrors(prev => ({ ...prev, [name]: '' }));
        }
        setError('');
    };

    // ✅ HANDLE PASSWORD BLUR
    const handlePasswordBlur = (fieldName) => {
        setTouched(prev => ({ ...prev, [fieldName]: true }));
        
        let error = '';
        switch (fieldName) {
            case 'currentPassword':
                error = passwordData.currentPassword ? '' : 'Vui lòng nhập mật khẩu hiện tại';
                break;
            case 'newPassword':
                error = validatePassword(passwordData.newPassword);
                break;
            case 'confirmPassword':
                if (!passwordData.confirmPassword) {
                    error = 'Vui lòng xác nhận mật khẩu';
                } else if (passwordData.newPassword !== passwordData.confirmPassword) {
                    error = 'Xác nhận mật khẩu không khớp';
                }
                break;
            default:
                break;
        }
        
        setValidationErrors(prev => ({ ...prev, [fieldName]: error }));
    };

    // ===== VALIDATE PROFILE FORM =====
    const validateProfileForm = () => {
        const errors = {
            fullName: validateFullName(formData.fullName),
            email: validateEmail(formData.email),
            phone: validatePhone(formData.phone)
        };

        // Filter out empty errors
        const filteredErrors = Object.fromEntries(
            Object.entries(errors).filter(([_, v]) => v !== '')
        );

        setValidationErrors(filteredErrors);
        
        // Mark all fields as touched
        setTouched({
            fullName: true,
            email: true,
            phone: true
        });

        return Object.keys(filteredErrors).length === 0;
    };

    // ===== VALIDATE PASSWORD FORM =====
    const validatePasswordForm = () => {
        const errors = {
            currentPassword: passwordData.currentPassword ? '' : 'Vui lòng nhập mật khẩu hiện tại',
            newPassword: validatePassword(passwordData.newPassword),
            confirmPassword: ''
        };

        // Check confirm password match
        if (passwordData.newPassword !== passwordData.confirmPassword) {
            errors.confirmPassword = 'Xác nhận mật khẩu không khớp';
        }

        // Check new password different from current
        if (passwordData.currentPassword === passwordData.newPassword && passwordData.currentPassword) {
            errors.newPassword = 'Mật khẩu mới phải khác mật khẩu hiện tại';
        }

        // Filter out empty errors
        const filteredErrors = Object.fromEntries(
            Object.entries(errors).filter(([_, v]) => v !== '')
        );

        setValidationErrors(filteredErrors);
        
        // Mark all password fields as touched
        setTouched({
            currentPassword: true,
            newPassword: true,
            confirmPassword: true
        });

        return Object.keys(filteredErrors).length === 0;
    };

    // ===== UPDATE PROFILE =====
    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        setError('');
        setSuccessMessage('');

        // Validate form
        if (!validateProfileForm()) {
            setError('Vui lòng kiểm tra lại thông tin');
            return;
        }

        try {
            setLoading(true);
            const token = localStorage.getItem('token') || sessionStorage.getItem('token');
            
            const response = await axios.put(
                `http://localhost:5000/api/users/${user.id}`,
                formData,
                {
                    headers: { 'Authorization': `Bearer ${token}` }
                }
            );

            if (response.data.success) {
                setSuccessMessage('Cập nhật thông tin thành công!');
                setShowSuccessModal(true);
                
                // Update user in context
                login(response.data.data, token);
                setIsEditing(false);
                
                setTimeout(() => setSuccessMessage(''), 3000);
            }
        } catch (error) {
            console.error('[UPDATE PROFILE] Error:', error.response?.data);
            
            // ✅ HANDLE BACKEND VALIDATION ERRORS
            if (error.response?.data?.errors) {
                const backendErrors = extractValidationErrors(error);
                setValidationErrors(backendErrors);
                
                // Mark affected fields as touched
                Object.keys(backendErrors).forEach(field => {
                    setTouched(prev => ({ ...prev, [field]: true }));
                });
            } else {
                setError(error.response?.data?.message || 'Có lỗi xảy ra khi cập nhật thông tin');
            }
        } finally {
            setLoading(false);
        }
    };

    // ===== CHANGE PASSWORD =====
    const handleChangePassword = async (e) => {
        e.preventDefault();
        setError('');
        setSuccessMessage('');

        // Validate form
        if (!validatePasswordForm()) {
            setError('Vui lòng kiểm tra lại thông tin');
            return;
        }

        try {
            setLoading(true);
            const token = localStorage.getItem('token') || sessionStorage.getItem('token');
            
            const response = await axios.put(
                `http://localhost:5000/api/users/${user.id}/change-password`,
                passwordData,
                {
                    headers: { 'Authorization': `Bearer ${token}` }
                }
            );

            if (response.data.success) {
                setSuccessMessage('Đổi mật khẩu thành công!');
                setShowSuccessModal(true);
                
                // Clear password form
                setPasswordData({
                    currentPassword: '',
                    newPassword: '',
                    confirmPassword: ''
                });
                setIsChangingPassword(false);
                
                setTimeout(() => setSuccessMessage(''), 3000);
            }
        } catch (error) {
            console.error('[CHANGE PASSWORD] Error:', error.response?.data);
            
            // ✅ HANDLE BACKEND VALIDATION ERRORS
            if (error.response?.data?.errors) {
                const backendErrors = extractValidationErrors(error);
                setValidationErrors(backendErrors);
                
                Object.keys(backendErrors).forEach(field => {
                    setTouched(prev => ({ ...prev, [field]: true }));
                });
            } else {
                setError(error.response?.data?.message || 'Có lỗi xảy ra khi đổi mật khẩu');
            }
        } finally {
            setLoading(false);
        }
    };

    // ===== CANCEL EDIT =====
    const handleCancelEdit = () => {
        setIsEditing(false);
        setFormData({
            fullName: user.fullName || user.full_name || '',
            email: user.email || '',
            phone: user.phone || ''
        });
        setValidationErrors({});
        setTouched({});
        setError('');
    };

    // ===== CANCEL PASSWORD CHANGE =====
    const handleCancelPasswordChange = () => {
        setIsChangingPassword(false);
        setPasswordData({
            currentPassword: '',
            newPassword: '',
            confirmPassword: ''
        });
        setValidationErrors({});
        setTouched({});
        setError('');
    };

    return (
        <div className="profile-container">
            <div className="profile-header">
                <h2>Thông tin cá nhân</h2>
            </div>

            {/* SUCCESS MESSAGE */}
            {successMessage && (
                <div className="alert alert-success">
                    <i className="bi bi-check-circle-fill"></i>
                    {successMessage}
                </div>
            )}

            {/* ERROR MESSAGE */}
            {error && (
                <div className="alert alert-danger">
                    <i className="bi bi-exclamation-circle-fill"></i>
                    {error}
                </div>
            )}

            <div className="profile-content">
                {/* AVATAR SECTION */}
                <div className="profile-avatar-section">
                    <AvatarUpload />
                </div>

                {/* PROFILE INFO SECTION */}
                <div className="profile-info-section">
                    <div className="section-header">
                        <h3>Thông tin tài khoản</h3>
                        {!isEditing && !isChangingPassword && (
                            <button 
                                className="btn-edit"
                                onClick={() => setIsEditing(true)}
                            >
                                <i className="bi bi-pencil"></i>
                                Chỉnh sửa
                            </button>
                        )}
                    </div>

                    {!isChangingPassword ? (
                        <form onSubmit={handleUpdateProfile} className="profile-form">
                            {/* USERNAME (READ ONLY) */}
                            <div className="form-group">
                                <label>Tên đăng nhập</label>
                                <input
                                    type="text"
                                    value={user?.username || ''}
                                    disabled
                                    className="form-control-readonly"
                                />
                            </div>

                            {/* FULL NAME */}
                            <div className="profile-form-group">
                                <label htmlFor="fullName">
                                    <i className="bi bi-person"></i>
                                    Họ và tên <span className="required">*</span>
                                </label>
                                <input
                                    type="text"
                                    id="fullName"
                                    name="fullName"
                                    value={formData.fullName}
                                    onChange={handleInputChange}
                                    onBlur={() => handleBlur('fullName')}
                                    disabled={!isEditing}
                                    className={touched.fullName && validationErrors.fullName ? 'error' : ''}
                                    placeholder="Nhập họ và tên"
                                />
                                {touched.fullName && validationErrors.fullName && (
                                    <span className="error-message">
                                        <i className="bi bi-exclamation-circle"></i>
                                        {validationErrors.fullName}
                                    </span>
                                )}
                            </div>

                            {/* EMAIL */}
                            <div className="profile-form-group">
                                <label htmlFor="email">
                                    <i className="bi bi-envelope"></i>
                                    Email <span className="required">*</span>
                                </label>
                                <input
                                    type="email"
                                    id="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleInputChange}
                                    onBlur={() => handleBlur('email')}
                                    disabled={!isEditing}
                                    className={touched.email && validationErrors.email ? 'error' : ''}
                                    placeholder="Nhập email"
                                />
                                {touched.email && validationErrors.email && (
                                    <span className="error-message">
                                        <i className="bi bi-exclamation-circle"></i>
                                        {validationErrors.email}
                                    </span>
                                )}
                            </div>

                            {/* PHONE */}
                            <div className="profile-form-group">
                                <label htmlFor="phone">
                                    <i className="bi bi-phone"></i>
                                    Số điện thoại <span className="required">*</span>
                                </label>
                                <input
                                    type="tel"
                                    id="phone"
                                    name="phone"
                                    value={formData.phone}
                                    onChange={handleInputChange}
                                    onBlur={() => handleBlur('phone')}
                                    disabled={!isEditing}
                                    className={touched.phone && validationErrors.phone ? 'error' : ''}
                                    placeholder="Nhập số điện thoại"
                                />
                                {touched.phone && validationErrors.phone && (
                                    <span className="error-message">
                                        <i className="bi bi-exclamation-circle"></i>
                                        {validationErrors.phone}
                                    </span>
                                )}
                            </div>

                            {/* ROLE (READ ONLY) */}
                            <div className="form-group">
                                <label>
                                    <i className="bi bi-shield-check"></i>
                                    Vai trò
                                </label>
                                <input
                                    type="text"
                                    value={user?.role === 'admin' ? 'Quản trị viên' : 'Người dùng'}
                                    disabled
                                    className="form-control-readonly"
                                />
                            </div>

                            {/* ACTION BUTTONS */}
                            {isEditing && (
                                <div className="form-actions">
                                    <button 
                                        type="submit" 
                                        className="btn-save"
                                        disabled={loading}
                                    >
                                        {loading ? (
                                            <>
                                                <span className="spinner"></span>
                                                Đang lưu...
                                            </>
                                        ) : (
                                            <>
                                                <i className="bi bi-check-lg"></i>
                                                Lưu thay đổi
                                            </>
                                        )}
                                    </button>
                                    <button 
                                        type="button" 
                                        className="btn-cancel"
                                        onClick={handleCancelEdit}
                                        disabled={loading}
                                    >
                                        <i className="bi bi-x-lg"></i>
                                        Hủy
                                    </button>
                                </div>
                            )}

                            {/* CHANGE PASSWORD BUTTON */}
                            {!isEditing && (
                                <button
                                    type="button"
                                    className="btn-change-password"
                                    onClick={() => setIsChangingPassword(true)}
                                >
                                    <i className="bi bi-key"></i>
                                    Đổi mật khẩu
                                </button>
                            )}
                        </form>
                    ) : (
                        // CHANGE PASSWORD FORM
                        <form onSubmit={handleChangePassword} className="profile-form">
                            <div className="section-header">
                                <h3>Đổi mật khẩu</h3>
                            </div>

                            {/* CURRENT PASSWORD */}
                            <div className="profile-form-group">
                                <label htmlFor="currentPassword">
                                    <i className="bi bi-lock"></i>
                                    Mật khẩu hiện tại <span className="required">*</span>
                                </label>
                                <div className="input-group">
                                    <input
                                        type={showPasswords.current ? "text" : "password"}
                                        id="currentPassword"
                                        name="currentPassword"
                                        value={passwordData.currentPassword}
                                        onChange={handlePasswordChange}
                                        onBlur={() => handlePasswordBlur('currentPassword')}
                                        className={touched.currentPassword && validationErrors.currentPassword ? 'error' : ''}
                                        placeholder="Nhập mật khẩu hiện tại"
                                    />
                                    <button
                                        type="button"
                                        className="btn-toggle-password"
                                        onClick={() => setShowPasswords({
                                            ...showPasswords,
                                            current: !showPasswords.current
                                        })}
                                    >
                                        <i className={`bi bi-eye${showPasswords.current ? '-slash' : ''}`}></i>
                                    </button>
                                </div>
                                {touched.currentPassword && validationErrors.currentPassword && (
                                    <span className="error-message">
                                        <i className="bi bi-exclamation-circle"></i>
                                        {validationErrors.currentPassword}
                                    </span>
                                )}
                            </div>

                            {/* NEW PASSWORD */}
                            <div className="profile-form-group">
                                <label htmlFor="newPassword">
                                    <i className="bi bi-lock-fill"></i>
                                    Mật khẩu mới <span className="required">*</span>
                                </label>
                                <div className="input-group">
                                    <input
                                        type={showPasswords.new ? "text" : "password"}
                                        id="newPassword"
                                        name="newPassword"
                                        value={passwordData.newPassword}
                                        onChange={handlePasswordChange}
                                        onBlur={() => handlePasswordBlur('newPassword')}
                                        className={touched.newPassword && validationErrors.newPassword ? 'error' : ''}
                                        placeholder="Nhập mật khẩu mới"
                                    />
                                    <button
                                        type="button"
                                        className="btn-toggle-password"
                                        onClick={() => setShowPasswords({
                                            ...showPasswords,
                                            new: !showPasswords.new
                                        })}
                                    >
                                        <i className={`bi bi-eye${showPasswords.new ? '-slash' : ''}`}></i>
                                    </button>
                                </div>
                                {touched.newPassword && validationErrors.newPassword && (
                                    <span className="error-message">
                                        <i className="bi bi-exclamation-circle"></i>
                                        {validationErrors.newPassword}
                                    </span>
                                )}
                            </div>

                            {/* CONFIRM PASSWORD */}
                            <div className="profile-form-group">
                                <label htmlFor="confirmPassword">
                                    <i className="bi bi-lock-fill"></i>
                                    Xác nhận mật khẩu mới <span className="required">*</span>
                                </label>
                                <div className="input-group">
                                    <input
                                        type={showPasswords.confirm ? "text" : "password"}
                                        id="confirmPassword"
                                        name="confirmPassword"
                                        value={passwordData.confirmPassword}
                                        onChange={handlePasswordChange}
                                        onBlur={() => handlePasswordBlur('confirmPassword')}
                                        className={touched.confirmPassword && validationErrors.confirmPassword ? 'error' : ''}
                                        placeholder="Nhập lại mật khẩu mới"
                                    />
                                    <button
                                        type="button"
                                        className="btn-toggle-password"
                                        onClick={() => setShowPasswords({
                                            ...showPasswords,
                                            confirm: !showPasswords.confirm
                                        })}
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

                            {/* ACTION BUTTONS */}
                            <div className="form-actions">
                                <button 
                                    type="submit" 
                                    className="btn-save"
                                    disabled={loading}
                                >
                                    {loading ? (
                                        <>
                                            <span className="spinner"></span>
                                            Đang xử lý...
                                        </>
                                    ) : (
                                        <>
                                            <i className="bi bi-check-lg"></i>
                                            Đổi mật khẩu
                                        </>
                                    )}
                                </button>
                                <button 
                                    type="button" 
                                    className="btn-cancel"
                                    onClick={handleCancelPasswordChange}
                                    disabled={loading}
                                >
                                    <i className="bi bi-x-lg"></i>
                                    Hủy
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>

            {/* SUCCESS MODAL */}
            {showSuccessModal && (
                <div className="modal-overlay" onClick={() => setShowSuccessModal(false)}>
                    <div className="success-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="success-icon">
                            <i className="bi bi-check-circle-fill"></i>
                        </div>
                        <h3>Thành công!</h3>
                        <p>{successMessage}</p>
                        <button 
                            className="btn-modal"
                            onClick={() => setShowSuccessModal(false)}
                        >
                            OK
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProfileForm;