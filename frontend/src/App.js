import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import AppRouter from './router';
import Header from './components/show/header';
import Footer from './components/show/footer';
import { ChatProvider } from './contexts/ChatContext';
import { ChatWithAdminProvider } from './contexts/ChatWithAdminContext';
import { AdminChatProvider } from './contexts/AdminChatContext';
import { NotificationProvider } from './contexts/NotificationContext';
import ChatLauncher from './components/Chat/ChatLauncher';
import ChatLauncherWithAdmin from './components/ChatWithAdmin/ChatLauncher_withadmin';
import ScrollToTop from './utils/ScrollToTop';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useAuth } from './contexts/AuthContext';

// ✅ IMPORT AOS
import AOS from 'aos';
import 'aos/dist/aos.css';

const App = () => {
    const [menuOpen, setMenuOpen] = useState(false);
    const { user, loading, authInitialized } = useAuth();
    const location = useLocation();

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

    // ✅ KHỞI TẠO AOS
    useEffect(() => {
        AOS.init({
            duration: 1000,
            easing: 'ease-in-out',
            once: true,
            mirror: false,
            offset: 100,
            delay: 0,
            anchorPlacement: 'top-bottom',
        });

        return () => {
            AOS.refresh();
        };
    }, []);

    // ✅ KIỂM TRA ROUTE ADMIN
    const isAdminRoute = location.pathname.startsWith('/admin');

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
            <NotificationProvider>
                <AdminChatProvider>
                    <ChatWithAdminProvider>
                        <ChatProvider>
                            <div className="app-container">
                                {!isAdminRoute && <Header setMenuOpen={setMenuOpen} menuOpen={menuOpen} />}
                                
                                <div className={`main-content ${isAdminRoute ? 'admin-page' : ''}`}>
                                    <AppRouter />
                                </div>
                                
                                {!isAdminRoute && <Footer />}
                                
                                {!isAdminRoute && user && user.role === 'user' && <ChatLauncher />}
                                {!isAdminRoute && user && user.role === 'user' && <ChatLauncherWithAdmin />}
                            </div>
                        </ChatProvider>
                    </ChatWithAdminProvider>
                </AdminChatProvider>
            </NotificationProvider>
        </>
    );
};

export default App;