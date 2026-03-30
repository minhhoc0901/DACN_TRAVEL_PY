// import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
// import axios from 'axios';

// const AuthContext = createContext(null);

// export const AuthProvider = ({ children }) => {
//     const [user, setUser] = useState(null);
//     const [isAuthenticated, setIsAuthenticated] = useState(false);
//     const [authInitialized, setAuthInitialized] = useState(false);
//     const [loading, setLoading] = useState(true); // ✅ Thêm loading state

//     // ✅ Khôi phục user từ token khi app khởi động
//     useEffect(() => {
//         const initializeAuth = async () => {
//             try {
//                 const token = localStorage.getItem('token') || sessionStorage.getItem('token');
                
//                 if (token) {
//                     try {
//                         // Gọi API để lấy thông tin user từ token
//                         const response = await axios.get(`${CONFIG.API_API_URL}/auth/profile`, {
//                             headers: { Authorization: `Bearer ${token}` }
//                         });

//                         if (response.data.success) {
//                             const userData = response.data.user;
//                             setUser({
//                                 id: userData.id,
//                                 username: userData.username,
//                                 email: userData.email,
//                                 fullName: userData.fullName || userData.full_name,
//                                 phone: userData.phone,
//                                 role: userData.role,
//                                 avatar: userData.avatar
//                             });
//                             setIsAuthenticated(true);
//                             console.log('[AuthContext] User restored from token:', userData);
//                         }
//                     } catch (error) {
//                         console.error('[AuthContext] Failed to restore user:', error);
//                         // Token không hợp lệ, xóa đi
//                         localStorage.removeItem('token');
//                         sessionStorage.removeItem('token');
//                         localStorage.removeItem('user');
//                         sessionStorage.removeItem('user');
//                     }
//                 }
//             } catch (error) {
//                 console.error('[AuthContext] Error during auth initialization:', error);
//             } finally {
//                 setLoading(false);
//                 setAuthInitialized(true);
//             }
//         };

//         initializeAuth();
//     }, []);

//     const getToken = useCallback(() => {
//         return localStorage.getItem('token') || sessionStorage.getItem('token');
//     }, []);

//     const login = useCallback((userData, token, rememberMe = true) => {
//         const normalizedUser = {
//             id: userData.id,
//             username: userData.username,
//             email: userData.email,
//             fullName: userData.fullName || userData.full_name,
//             phone: userData.phone,
//             role: userData.role,
//             avatar: userData.avatar
//         };

//         setUser(normalizedUser);
//         setIsAuthenticated(true);
        
//         // Lưu user data vào storage
//         if (rememberMe) {
//             localStorage.setItem('user', JSON.stringify(normalizedUser));
//             localStorage.setItem('token', token);
//             sessionStorage.removeItem('token');
//             sessionStorage.removeItem('user');
//         } else {
//             sessionStorage.setItem('user', JSON.stringify(normalizedUser));
//             sessionStorage.setItem('token', token);
//             localStorage.removeItem('token');
//             localStorage.removeItem('user');
//         }

//         console.log('[AuthContext] User logged in:', normalizedUser);
//     }, []);

//     const logout = useCallback(() => {
//         setUser(null);
//         setIsAuthenticated(false);
        
//         // Clear all storage
//         localStorage.removeItem('user');
//         localStorage.removeItem('token');
//         sessionStorage.removeItem('user');
//         sessionStorage.removeItem('token');
        
//         console.log('[AuthContext] User logged out');
//     }, []);

//     const updateUserAvatar = useCallback((avatarUrl) => {
//         if (user) {
//             const updatedUser = { ...user, avatar: avatarUrl };
//             setUser(updatedUser);
            
//             // Cập nhật storage
//             const storedInLocal = localStorage.getItem('user');
//             if (storedInLocal) {
//                 localStorage.setItem('user', JSON.stringify(updatedUser));
//             } else {
//                 sessionStorage.setItem('user', JSON.stringify(updatedUser));
//             }
            
//             console.log('[AuthContext] Avatar updated:', avatarUrl);
//         }
//     }, [user]);

//     const value = {
//         user,
//         isAuthenticated,
//         authInitialized,
//         loading,
//         login,
//         logout,
//         getToken,
//         updateUserAvatar
//     };

//     return (
//         <AuthContext.Provider value={value}>
//             {children}
//         </AuthContext.Provider>
//     );
// };

// export const useAuth = () => {
//     const context = useContext(AuthContext);
//     if (!context) {
//         throw new Error('useAuth must be used within an AuthProvider');
//     }
//     return context;
// };

// export const getAuthToken = () => {
//     return localStorage.getItem('token') || sessionStorage.getItem('token');
// };

import React, { createContext, useState, useContext, useEffect } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    // --- 1. THÊM TRẠNG THÁI QUAN TRỌNG NÀY ---
    const [authInitialized, setAuthInitialized] = useState(false);

    useEffect(() => {
        try {
            // Check if user is logged in on mount
            const storedUser = localStorage.getItem('user');
            const token = localStorage.getItem('token') || sessionStorage.getItem('token');
            
            if (storedUser && token) {
                setUser(JSON.parse(storedUser));
                setIsAuthenticated(true);
            }
        } catch (error) {
            console.error("AuthContext: Failed to initialize auth state.", error);
            // Nếu có lỗi (ví dụ JSON sai), xóa dữ liệu hỏng
            localStorage.removeItem('user');
            localStorage.removeItem('token');
        } finally {
            // --- 2. ĐÁNH DẤU LÀ ĐÃ KIỂM TRA XONG ---
            // Dù thành công hay thất bại, quá trình khởi tạo đã hoàn tất.
            setAuthInitialized(true);
        }
    }, []);

    // Hàm này được giữ nguyên, không thay đổi
    const getToken = () => {
        return localStorage.getItem('token') || sessionStorage.getItem('token');
    };

    // Hàm login của bạn được giữ nguyên, không thay đổi
    const login = (userData, token, rememberMe = true) => {
        setUser({
            id: userData.id,
            username: userData.username,
            email: userData.email,
            fullName: userData.fullName || userData.full_name,
            phone: userData.phone,
            role: userData.role,
            avatar: userData.avatar 
        });
        setIsAuthenticated(true);
        
        localStorage.setItem('user', JSON.stringify(userData)); 
        
        if (rememberMe) {
            localStorage.setItem('token', token);
        } else {
            sessionStorage.setItem('token', token);
        }
    };

    // Hàm logout của bạn được giữ nguyên, không thay đổi
    const logout = () => {
        setUser(null);
        setIsAuthenticated(false);
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        sessionStorage.removeItem('user');
        sessionStorage.removeItem('token');
    };

    // Hàm updateUserAvatar của bạn được giữ nguyên, không thay đổi
    const updateUserAvatar = (avatarUrl) => {
        if (user) {
            const updatedUser = { ...user, avatar: avatarUrl };
            setUser(updatedUser);
            localStorage.setItem('user', JSON.stringify(updatedUser));
        }
    };

    return (
        <AuthContext.Provider value={{ 
            user, 
            isAuthenticated, 
            // --- 3. CUNG CẤP TRẠNG THÁI MỚI RA NGOÀI ---
            authInitialized,
            login, 
            logout,
            getToken,
            updateUserAvatar,
        }}>
            {children}
        </AuthContext.Provider>
    );
};

// Hàm useAuth được giữ nguyên, không thay đổi
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

// Hàm getAuthToken export riêng được giữ nguyên, không thay đổi
export function getAuthToken() {
    return localStorage.getItem('token') || sessionStorage.getItem('token');
}