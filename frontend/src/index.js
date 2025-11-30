import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';
import 'bootstrap-icons/font/bootstrap-icons.css'; 
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { BrowserRouter } from 'react-router-dom';
import './styles/show/header.css';
import './styles/show/footer.css';
import './styles/HomePageCSS/HomePage.css';
import { AuthProvider } from './contexts/AuthContext';

const style = document.createElement('style');
style.textContent = `
    .overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        backdrop-filter: blur(2px);
        transition: all 0.3s ease;
        opacity: 0;
        visibility: hidden;
    }
    
    .overlay.active {
        opacity: 1;
        visibility: visible;
    }
    
    .app-container {
        display: flex;
        flex-direction: column;
        min-height: 100vh;
        position: relative;
    }
    
    .main-content {
        flex: 1;
    }
`;
document.head.appendChild(style);

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
    <BrowserRouter>
        <AuthProvider>
            <App />
        </AuthProvider>
    </BrowserRouter>
);