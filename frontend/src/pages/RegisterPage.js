import React from 'react';
import RegisterForm from '../components/auth/RegisterForm';
import '../styles/auth/AuthForm.css';

const RegisterPage = () => {
    return (
        <div className="auth-page">
            <div className="auth-container">
                <RegisterForm />
            </div>
        </div>
    );
};

export default RegisterPage;