import React from 'react';
import ProfileForm from '../components/auth/ProfileForm';
import '../styles/auth/ProfileForm.css';

const ProfilePage = () => {
    return (
        <div className="profile-page">
            <div className="profile-container">
                <ProfileForm />
            </div>
        </div>
    );
};

export default ProfilePage;