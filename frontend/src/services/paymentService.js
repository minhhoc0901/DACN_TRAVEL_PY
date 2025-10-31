// filepath: d:\DACN\DACS_Travel_PY-Tnam\frontend\src\services\paymentService.js
import { getAuthToken } from '../contexts/AuthContext';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

async function createPaymentUrl(payload) {
    const token = getAuthToken();
    const response = await fetch(`${API_BASE_URL}/payments/vnpay/init`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
    });
    return response.json();
}


export const paymentService = {
    createPaymentUrl,

};