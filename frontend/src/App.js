import React, { useState, useEffect } from 'react';
import AppRouter from './router';
import Header from './components/show/header';
import Footer from './components/show/footer';
import { ChatProvider } from './contexts/ChatContext';
// import { NotificationProvider } from './contexts/NotificationContext'; 
import ChatLauncher from './components/Chat/ChatLauncher';
import ScrollToTop from './utils/ScrollToTop';
import { ChatWithAdminProvider } from './contexts/ChatWithAdminContext';
import { AdminChatProvider } from './contexts/AdminChatContext';
import ChatLauncherWithAdmin from './components/ChatWithAdmin/ChatLauncher_withadmin'; // ✅ Đổi tên

const App = () => {
    const [menuOpen, setMenuOpen] = useState(false);
    const [userId, setUserId] = useState(null);
    const [userRole, setUserRole] = useState(null);

    useEffect(() => {
        const storedUserId = localStorage.getItem('userId');
        const storedUserRole = localStorage.getItem('userRole');
        
        if (storedUserId) setUserId(Number(storedUserId));
        if (storedUserRole) setUserRole(storedUserRole);
    }, []);

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

    return (
        <>
            <ScrollToTop />
            <ChatProvider>
                <ChatWithAdminProvider userId={userId}>
                    <AdminChatProvider>
                        {/* <NotificationProvider> */}
                            <div className="app-container">
                                <Header setMenuOpen={setMenuOpen} menuOpen={menuOpen} />
                                <div className={`overlay ${menuOpen ? 'active' : ''}`} onClick={() => setMenuOpen(false)}></div>
                                <main className="main-content">
                                    <AppRouter />
                                </main>
                                <Footer />
                                
                                {userRole !== 'admin' && (
                                    <>
                                        <ChatLauncher />
                                        <ChatLauncherWithAdmin /> {/* ✅ Đổi tên */}
                                    </>
                                )}
                            </div>
                        {/* </NotificationProvider> */}
                    </AdminChatProvider>
                </ChatWithAdminProvider>   
            </ChatProvider>
        </>
    );
};

export default App;