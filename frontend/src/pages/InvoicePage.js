import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { bookingService } from '../services/bookingService';
import '../styles/InvoicePage.css';

const InvoicePage = () => {
    const { bookingId } = useParams();
    const [pdfUrl, setPdfUrl] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // TÁCH RA: Effect 1 - Chỉ để fetch dữ liệu khi bookingId thay đổi
    useEffect(() => {
        const fetchInvoice = async () => {
            setLoading(true); // Bắt đầu tải
            setError(''); // Xóa lỗi cũ
            try {
                const pdfData = await bookingService.downloadInvoice(bookingId);
                const blob = new Blob([pdfData], { type: 'application/pdf' });
                setPdfUrl(URL.createObjectURL(blob));
            } catch (err) {
                setError(err.message);
                setPdfUrl(null); // Đảm bảo không có URL cũ nếu lỗi
            } finally {
                setLoading(false); // Tải xong
            }
        };

        fetchInvoice();
    }, [bookingId]); // <-- Chỉ phụ thuộc vào bookingId

    // TÁCH RA: Effect 2 - Chỉ để dọn dẹp (revoke) URL
    useEffect(() => {
        const currentPdfUrl = pdfUrl; // Lưu lại URL hiện tại

        // Trả về một hàm cleanup
        return () => {
            // Khi component unmount (hoặc khi pdfUrl thay đổi)
            // hãy hủy URL *cũ* để tránh rò rỉ bộ nhớ
            if (currentPdfUrl) {
                URL.revokeObjectURL(currentPdfUrl);
            }
        };
    }, [pdfUrl]); // <-- Chỉ phụ thuộc vào pdfUrl

    const handlePrint = () => {
        const iframe = document.getElementById('invoice-pdf-iframe');
        if (iframe) {
            try {
                iframe.contentWindow.print();
            } catch (e) {
                console.error('Lỗi khi gọi in:', e);
                alert('Không thể mở hộp thoại in. Vui lòng thử lại.');
            }
        }
    };

    if (loading) {
        return <div className="invoice-status-message">Đang tải hóa đơn...</div>;
    }
    if (error) {
        return <div className="invoice-status-message error">Lỗi: {error}</div>;
    }

    return (
        <div className="invoice-page-container">
            <h2>Hóa đơn đặt tour</h2>
            {pdfUrl && (
                <>
                    <div className="invoice-iframe-wrapper">
                        <iframe
                            id="invoice-pdf-iframe"
                            src={pdfUrl}
                            title="Invoice PDF"
                            width="100%"
                            height="700px"
                            className="invoice-iframe"
                        />
                    </div>
                    <div className="invoice-actions">
                        <button onClick={handlePrint} className="invoice-print-btn">
                            In hóa đơn
                        </button>
                    </div>
                </>
            )}
        </div>
    );
};

export default InvoicePage;