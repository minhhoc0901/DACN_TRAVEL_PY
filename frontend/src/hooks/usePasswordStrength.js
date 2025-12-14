import { useState, useEffect } from 'react';
import { calculatePasswordStrength } from '../utils/validationUtils';


/**
 * Custom Hook để tính và hiển thị độ mạnh của password
 * @param {string} password - Mật khẩu cần kiểm tra
 * @returns {object} - Password strength info
 */
export const usePasswordStrength = (password) => {
    const [strength, setStrength] = useState({
        strength: 'weak',
        score: 0,
        color: '#ff4444',
        suggestions: []
    });

    useEffect(() => {
        if (!password || password.trim() === '') {
            setStrength({
                strength: 'weak',
                score: 0,
                color: '#ff4444',
                suggestions: ['Vui lòng nhập mật khẩu']
            });
            return;
        }

        const result = calculatePasswordStrength(password);
        setStrength(result);
    }, [password]);

    /**
     * Get label cho strength level
     */
    const getStrengthLabel = () => {
        switch (strength.strength) {
            case 'weak':
                return 'Yếu';
            case 'medium':
                return 'Trung bình';
            case 'strong':
                return 'Mạnh';
            default:
                return '';
        }
    };

    /**
     * Get width cho progress bar (%)
     */
    const getProgressWidth = () => {
        // Score từ 0-6, convert sang %
        return Math.min((strength.score / 6) * 100, 100);
    };

    /**
     * Check nếu password đủ mạnh (tối thiểu medium)
     */
    const isStrongEnough = () => {
        return strength.strength !== 'weak';
    };

    /**
     * Get icon cho strength level
     */
    const getStrengthIcon = () => {
        switch (strength.strength) {
            case 'weak':
                return '❌';
            case 'medium':
                return '⚠️';
            case 'strong':
                return '✅';
            default:
                return '';
        }
    };

    return {
        strength: strength.strength,
        score: strength.score,
        color: strength.color,
        suggestions: strength.suggestions,
        label: getStrengthLabel(),
        progressWidth: getProgressWidth(),
        isStrongEnough: isStrongEnough(),
        icon: getStrengthIcon()
    };
};