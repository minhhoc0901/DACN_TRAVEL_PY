import { useFormValidation } from './useFormValidation';

/**
 * Custom hook cho REGISTER FORM
 */
export const useRegisterFormValidation = () => {
    const initialValues = {
        username: '',
        email: '',
        fullName: '',
        phone: '',
        password: '',
        confirmPassword: '',
        otp: ''
    };

    const fieldsToValidate = [
        'username',
        'email',
        'fullName',
        'phone',
        'password',
        'confirmPassword',
        'otp'
    ];

    return useFormValidation(initialValues, fieldsToValidate);
};

/**
 * Custom hook cho LOGIN FORM
 */
export const useLoginFormValidation = () => {
    const initialValues = {
        username: '',
        password: ''
    };

    const fieldsToValidate = ['username', 'password'];

    return useFormValidation(initialValues, fieldsToValidate);
};

/**
 * Custom hook cho PROFILE UPDATE FORM
 */
export const useProfileFormValidation = (user) => {
    const initialValues = {
        fullName: user?.fullName || user?.full_name || '',
        email: user?.email || '',
        phone: user?.phone || ''
    };

    const fieldsToValidate = ['fullName', 'email', 'phone'];

    return useFormValidation(initialValues, fieldsToValidate);
};

/**
 * Custom hook cho CHANGE PASSWORD FORM
 */
export const useChangePasswordValidation = () => {
    const initialValues = {
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    };

    const fieldsToValidate = [
        'currentPassword',
        'newPassword',
        'confirmPassword'
    ];

    return useFormValidation(initialValues, fieldsToValidate);
};