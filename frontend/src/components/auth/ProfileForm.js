import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios';
import '../../styles/auth/ProfileForm.css';
import AvatarUpload from './AvatarUpload'; // Import component mới

const ProfileForm = () => {
    const { user, login } = useAuth();
    const [formData, setFormData] = useState({
        username: user?.username || '',
        fullName: user?.fullName || '',
        email: user?.email || '',
        phone: user?.phone || ''
    });

    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });

    const [isEditing, setIsEditing] = useState(false);
    const [isChangingPassword, setIsChangingPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const [showPasswords, setShowPasswords] = useState({
        current: false,
        new: false,
        confirm: false
    });

    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        setError('');
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
                login(response.data.data);
                setIsEditing(false);
            }
        } catch (error) {
            setError(error.response?.data?.message || 'Có lỗi xảy ra khi cập nhật thông tin');
        } finally {
            setLoading(false);
        }
    };

    const handleChangePassword = async (e) => {
        e.preventDefault();
        setError('');

        if (passwordData.newPassword !== passwordData.confirmPassword) {
            setError('Mật khẩu mới không khớp');
            return;
        }

        try {
            setLoading(true);
            const token = localStorage.getItem('token') || sessionStorage.getItem('token');
            const response = await axios.put(
                `http://localhost:5000/api/users/${user.id}/change-password`,
                {
                    currentPassword: passwordData.currentPassword,
                    newPassword: passwordData.newPassword
                },
                {
                    headers: { 'Authorization': `Bearer ${token}` }
                }
            );

            if (response.data.success) {
                setSuccessMessage('Đổi mật khẩu thành công!');
                setShowSuccessModal(true);
                setIsChangingPassword(false);
                setPasswordData({
                    currentPassword: '',
                    newPassword: '',
                    confirmPassword: ''
                });
            }
        } catch (error) {
            setError(error.response?.data?.message || 'Có lỗi xảy ra khi đổi mật khẩu');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="profile-form-wrapper">
            <div className="profile-header">
                <div className="header-content">
                    <h1>Thông tin cá nhân</h1>
                    <p className="header-subtitle">Quản lý thông tin cá nhân của bạn</p>
                </div>
                <div className="profile-actions">
                    {!isEditing && !isChangingPassword && (
                        <>
                            <button 
                                className="btn-edit"
                                onClick={() => setIsEditing(true)}
                            >
                                <i className="bi bi-pencil"></i>
                                Chỉnh sửa
                            </button>
                            <button 
                                className="btn-change-password"
                                onClick={() => setIsChangingPassword(true)}
                            >
                                <i className="bi bi-key"></i>
                                Đổi mật khẩu
                            </button>
                        </>
                    )}
                </div>
            </div>

            {/* Thêm component AvatarUpload */}
            <AvatarUpload />

            {error && <div className="profile-alert profile-alert-danger">{error}</div>}

            {!isChangingPassword ? (
                // Form thông tin cá nhân
                <form onSubmit={handleUpdateProfile} className="profile-form">
                    <div className="profile-form-group">
                        <label>
                            <i className="bi bi-person"></i>
                            Tên đăng nhập
                        </label>
                        <input
                            type="text"
                            value={formData.username}
                            disabled
                        />
                    </div>

                    <div className="profile-form-group">
                        <label>
                            <i className="bi bi-person-vcard"></i>
                            Họ và tên
                        </label>
                        <input
                            type="text"
                            value={formData.fullName}
                            onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                            disabled={!isEditing}
                        />
                    </div>

                    <div className="profile-form-group">
                        <label>
                            <i className="bi bi-envelope"></i>
                            Email
                            {user?.isEmailVerified && (
                                <span className="verified-badge" title="Email đã xác minh">
                                    <i className="bi bi-patch-check-fill"></i>
                                </span>
                            )}
                        </label>
                        <input
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData({...formData, email: e.target.value})}
                            disabled={!isEditing || user?.isEmailVerified}
                        />
                    </div>

                    <div className="profile-form-group">
                        <label>
                            <i className="bi bi-telephone"></i>
                            Số điện thoại
                        </label>
                        <input
                            type="tel"
                            value={formData.phone}
                            onChange={(e) => setFormData({...formData, phone: e.target.value})}
                            disabled={!isEditing}
                        />
                    </div>

                    {isEditing && (
                        <div className="form-actions">
                            <button 
                                type="button" 
                                className="btn-cancel"
                                onClick={() => setIsEditing(false)}
                            >
                                <i className="bi bi-x"></i>
                                Hủy
                            </button>
                            <button 
                                type="submit" 
                                className="btn-save"
                                disabled={loading}
                            >
                                {loading ? (
                                    <>
                                        <i className="bi bi-hourglass-split"></i>
                                        Đang lưu...
                                    </>
                                ) : (
                                    <>
                                        <i className="bi bi-check2"></i>
                                        Lưu thay đổi
                                    </>
                                )}
                            </button>
                        </div>
                    )}
                </form>
            ) : (
                // Form đổi mật khẩu
                <form onSubmit={handleChangePassword} className="profile-form">
                    <div className="profile-form-group">
                        <label>
                            <i className="bi bi-lock"></i>
                            Mật khẩu hiện tại
                        </label>
                        <div className="input-group">
                            <input
                                type={showPasswords.current ? "text" : "password"}
                                value={passwordData.currentPassword}
                                onChange={(e) => setPasswordData({...passwordData, currentPassword: e.target.value})}
                                required
                            />
                            <button
                                type="button"
                                className="btn-toggle-password"
                                onClick={() => setShowPasswords({...showPasswords, current: !showPasswords.current})}
                            >
                                <i className={`bi bi-eye${showPasswords.current ? '-slash' : ''}`}></i>
                            </button>
                        </div>
                    </div>

                    <div className="profile-form-group">
                        <label>
                            <i className="bi bi-lock"></i>
                            Mật khẩu mới
                        </label>
                        <div className="input-group">
                            <input
                                type={showPasswords.new ? "text" : "password"}
                                value={passwordData.newPassword}
                                onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
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

                    <div className="profile-form-group">
                        <label>
                            <i className="bi bi-lock"></i>
                            Xác nhận mật khẩu mới
                        </label>
                        <div className="input-group">
                            <input
                                type={showPasswords.confirm ? "text" : "password"}
                                value={passwordData.confirmPassword}
                                onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
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

                    <div className="form-actions">
                        <button 
                            type="button" 
                            className="btn-cancel"
                            onClick={() => setIsChangingPassword(false)}
                        >
                            <i className="bi bi-x"></i>
                            Hủy
                        </button>
                        <button 
                            type="submit" 
                            className="btn-save"
                            disabled={loading}
                        >
                            {loading ? (
                                <>
                                    <i className="bi bi-hourglass-split"></i>
                                    Đang xử lý...
                                </>
                            ) : (
                                <>
                                    <i className="bi bi-check2"></i>
                                    Đổi mật khẩu
                                </>
                            )}
                        </button>
                    </div>
                </form>
            )}

            {showSuccessModal && (
                <div className="profile-modal-overlay">
                    <div className="profile-success-modal">
                        <div className="profile-success-icon">
                            <i className="bi bi-check-circle-fill"></i>
                        </div>
                        <h3>{successMessage}</h3>
                        <button className="btn-modal-ok" onClick={() => setShowSuccessModal(false)}>
                            OK
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProfileForm;