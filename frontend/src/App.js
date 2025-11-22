import React, { useState, useEffect } from 'react';
import AppRouter from './router';
import Header from './components/show/header';
import Footer from './components/show/footer';
import { ChatProvider } from './contexts/ChatContext';
import { ChatWithAdminProvider } from './contexts/ChatWithAdminContext';
import { AdminChatProvider } from './contexts/AdminChatContext';
import { NotificationProvider } from './contexts/NotificationContext'; // ✅ THÊM
import ChatLauncher from './components/Chat/ChatLauncher';
import ChatLauncherWithAdmin from './components/ChatWithAdmin/ChatLauncher_withadmin';
import ScrollToTop from './utils/ScrollToTop';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useAuth } from './contexts/AuthContext';

const App = () => {
    const [menuOpen, setMenuOpen] = useState(false);
    const { user, loading, authInitialized } = useAuth(); // Lấy thông tin user và loading state

    useEffect(() => {
        if (menuOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }

        return () => {
            document.body.style.overflow = '';
        };
    }, [menuOpen]);

    // Hiển thị loading khi đang khởi tạo auth
    if (loading || !authInitialized) {
        return (
            <div style={{ 
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center', 
                height: '100vh' 
            }}>
                <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Đang tải...</span>
                </div>
            </div>
        );
    }

    return (
        <>
            <ToastContainer 
                position="top-right" 
                autoClose={4000} 
                hideProgressBar={false}
                newestOnTop={false}
                closeOnClick
                rtl={false}
                pauseOnFocusLoss
                draggable
                pauseOnHover
            />
            <ScrollToTop />
            {/* ✅ THÊM NotificationProvider */}
            <NotificationProvider>
                <ChatProvider>
                    <ChatWithAdminProvider>
                        <AdminChatProvider>
                            <div className="app-container">
                                <Header setMenuOpen={setMenuOpen} menuOpen={menuOpen} />
                                <div 
                                    className={`overlay ${menuOpen ? 'active' : ''}`} 
                                    onClick={() => setMenuOpen(false)}
                                ></div>
                                <main className="main-content">
                                    <AppRouter />
                                </main>
                                <Footer />
                                
                                {/* Chỉ hiển thị chat launchers cho user thường (không phải admin) */}
                                {user && user.role !== 'admin' && (
                                    <>
                                        <ChatLauncher />
                                        <ChatLauncherWithAdmin />
                                    </>
                                )}
                            </div>
                        </AdminChatProvider>
                    </ChatWithAdminProvider>
                </ChatProvider>
            </NotificationProvider>
        </>
    );
};

export default App;