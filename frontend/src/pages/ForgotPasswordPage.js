import React from 'react';
import ForgotPasswordForm from '../components/auth/ForgotPasswordForm';
import '../styles/auth/ForgotPasswordForm.css';

const ForgotPasswordPage = () => {
    return (
        <div className="auth-page">
            <div className="auth-container">
                <ForgotPasswordForm />
            </div>
        </div>
    );
};

export default ForgotPasswordPage;