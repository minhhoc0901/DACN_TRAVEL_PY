import { useState, useCallback } from 'react';
import { validateForm } from '../utils/validationUtils';

/**
 * Custom Hook để xử lý validation cho forms
 * @param {object} initialValues - Giá trị khởi tạo của form
 * @param {array} fieldsToValidate - Danh sách fields cần validate
 * @returns {object} - Form state và handlers
 */
export const useFormValidation = (initialValues = {}, fieldsToValidate = []) => {
    const [values, setValues] = useState(initialValues);
    const [errors, setErrors] = useState({});
    const [touched, setTouched] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    /**
     * Handle change cho input fields
     */
    const handleChange = useCallback((e) => {
        const { name, value } = e.target;
        
        setValues(prev => ({
            ...prev,
            [name]: value
        }));

        // Clear error khi user bắt đầu nhập
        if (errors[name]) {
            setErrors(prev => ({
                ...prev,
                [name]: ''
            }));
        }
    }, [errors]);

    /**
     * Handle blur - validate field khi user rời khỏi input
     */
    const handleBlur = useCallback((e) => {
        const { name } = e.target;
        
        setTouched(prev => ({
            ...prev,
            [name]: true
        }));

        // Validate field khi blur
        const validation = validateForm(values, [name]);
        if (validation.errors[name]) {
            setErrors(prev => ({
                ...prev,
                [name]: validation.errors[name]
            }));
        }
    }, [values]);

    /**
     * Validate toàn bộ form
     */
    const validateAllFields = useCallback(() => {
        const validation = validateForm(values, fieldsToValidate);
        setErrors(validation.errors);
        
        // Mark all fields as touched
        const allTouched = {};
        fieldsToValidate.forEach(field => {
            allTouched[field] = true;
        });
        setTouched(allTouched);
        
        return validation.isValid;
    }, [values, fieldsToValidate]);

    /**
     * Set một field cụ thể
     */
    const setFieldValue = useCallback((name, value) => {
        setValues(prev => ({
            ...prev,
            [name]: value
        }));
    }, []);

    /**
     * Set error cho một field cụ thể
     */
    const setFieldError = useCallback((name, error) => {
        setErrors(prev => ({
            ...prev,
            [name]: error
        }));
    }, []);

    /**
     * Set multiple errors (từ backend)
     */
    const setBackendErrors = useCallback((backendErrors) => {
        setErrors(backendErrors);
    }, []);

    /**
     * Reset form về trạng thái ban đầu
     */
    const resetForm = useCallback(() => {
        setValues(initialValues);
        setErrors({});
        setTouched({});
        setIsSubmitting(false);
    }, [initialValues]);

    /**
     * Clear tất cả errors
     */
    const clearErrors = useCallback(() => {
        setErrors({});
    }, []);

    /**
     * Check nếu form có thể submit
     */
    const canSubmit = useCallback(() => {
        const hasValues = fieldsToValidate.every(field => {
            const value = values[field];
            return value !== null && value !== undefined && value !== '';
        });
        
        const hasNoErrors = Object.keys(errors).length === 0;
        
        return hasValues && hasNoErrors && !isSubmitting;
    }, [values, errors, isSubmitting, fieldsToValidate]);

    return {
        // State
        values,
        errors,
        touched,
        isSubmitting,
        
        // Handlers
        handleChange,
        handleBlur,
        setFieldValue,
        setFieldError,
        setBackendErrors,
        setIsSubmitting,
        
        // Methods
        validateAllFields,
        resetForm,
        clearErrors,
        canSubmit
    };
};