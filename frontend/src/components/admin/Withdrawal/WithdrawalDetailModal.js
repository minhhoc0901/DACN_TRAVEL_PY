import React, { useState } from 'react';

const WithdrawalDetailModal = ({ 
    withdrawal, 
    onClose, 
    onApprove, 
    onReject, 
    onComplete 
}) => {
    const [adminNote, setAdminNote] = useState('');
    const [transactionRef, setTransactionRef] = useState('');
    const [processing, setProcessing] = useState(false);

    if (!withdrawal) return null;

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND',
            minimumFractionDigits: 0
        }).format(amount || 0);
    };

    const formatDate = (dateString) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleString('vi-VN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const handleApprove = async () => {
        if (!window.confirm('Xác nhận duyệt yêu cầu rút tiền này?')) return;
        setProcessing(true);
        try {
            await onApprove(withdrawal.id, adminNote);
            onClose();
        } catch (error) {
            alert(error.message || 'Lỗi khi duyệt yêu cầu');
        } finally {
            setProcessing(false);
        }
    };

    const handleReject = async () => {
        if (!adminNote.trim()) {
            alert('Vui lòng nhập lý do từ chối');
            return;
        }
        if (!window.confirm('Xác nhận từ chối yêu cầu rút tiền này?')) return;
        setProcessing(true);
        try {
            await onReject(withdrawal.id, adminNote);
            onClose();
        } catch (error) {
            alert(error.message || 'Lỗi khi từ chối yêu cầu');
        } finally {
            setProcessing(false);
        }
    };

    const handleComplete = async () => {
        if (!transactionRef.trim()) {
            alert('Vui lòng nhập mã giao dịch');
            return;
        }
        if (!window.confirm('Xác nhận đã chuyển tiền thành công?')) return;
        setProcessing(true);
        try {
            await onComplete(withdrawal.id, transactionRef);
            onClose();
        } catch (error) {
            alert(error.message || 'Lỗi khi cập nhật trạng thái');
        } finally {
            setProcessing(false);
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-dialog modal-lg" onClick={(e) => e.stopPropagation()}>
                <div className="modal-content">
                    <div className="modal-header">
                        <h5 className="modal-title">
                            Chi tiết yêu cầu rút tiền #{withdrawal.id}
                        </h5>
                        <button onClick={onClose} className="btn-close"></button>
                    </div>

                    <div className="modal-body">
                        {/* User Info */}
                        <div className="info-section">
                            <h6 className="section-title">
                                <i className="bi bi-person-circle"></i> Thông tin người dùng
                            </h6>
                            <div className="info-grid">
                                <div className="info-item">
                                    <label>Họ tên:</label>
                                    <span>{withdrawal.full_name || withdrawal.username}</span>
                                </div>
                                <div className="info-item">
                                    <label>Email:</label>
                                    <span>{withdrawal.email}</span>
                                </div>
                                <div className="info-item">
                                    <label>Số dư hiện tại:</label>
                                    <span className="text-success">
                                        {formatCurrency(withdrawal.user_balance)}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Bank Info */}
                        <div className="info-section">
                            <h6 className="section-title">
                                <i className="bi bi-bank"></i> Thông tin ngân hàng
                            </h6>
                            <div className="info-grid">
                                <div className="info-item">
                                    <label>Ngân hàng:</label>
                                    <span><strong>{withdrawal.bank_name}</strong></span>
                                </div>
                                <div className="info-item">
                                    <label>Số tài khoản:</label>
                                    <span><code>{withdrawal.account_number}</code></span>
                                </div>
                                <div className="info-item">
                                    <label>Chủ tài khoản:</label>
                                    <span>{withdrawal.account_name}</span>
                                </div>
                            </div>
                        </div>

                        {/* Withdrawal Info */}
                        <div className="info-section">
                            <h6 className="section-title">
                                <i className="bi bi-cash-coin"></i> Thông tin rút tiền
                            </h6>
                            <div className="info-grid">
                                <div className="info-item">
                                    <label>Số tiền:</label>
                                    <span className="text-danger" style={{ fontSize: '18px', fontWeight: 'bold' }}>
                                        {formatCurrency(withdrawal.amount)}
                                    </span>
                                </div>
                                <div className="info-item">
                                    <label>Trạng thái:</label>
                                    <span>
                                        {withdrawal.status === 'pending' && <span className="badge badge-warning">Chờ duyệt</span>}
                                        {withdrawal.status === 'approved' && <span className="badge badge-info">Đã duyệt</span>}
                                        {withdrawal.status === 'rejected' && <span className="badge badge-danger">Từ chối</span>}
                                        {withdrawal.status === 'completed' && <span className="badge badge-success">Hoàn thành</span>}
                                    </span>
                                </div>
                                <div className="info-item">
                                    <label>Ngày tạo:</label>
                                    <span>{formatDate(withdrawal.created_at)}</span>
                                </div>
                                {withdrawal.processed_at && (
                                    <div className="info-item">
                                        <label>Ngày xử lý:</label>
                                        <span>{formatDate(withdrawal.processed_at)}</span>
                                    </div>
                                )}
                                {withdrawal.completed_at && (
                                    <div className="info-item">
                                        <label>Ngày hoàn thành:</label>
                                        <span>{formatDate(withdrawal.completed_at)}</span>
                                    </div>
                                )}
                                {withdrawal.transaction_ref && (
                                    <div className="info-item">
                                        <label>Mã giao dịch:</label>
                                        <span><code>{withdrawal.transaction_ref}</code></span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Admin Note */}
                        {withdrawal.admin_note && (
                            <div className="info-section">
                                <h6 className="section-title">
                                    <i className="bi bi-chat-left-text"></i> Ghi chú Admin
                                </h6>
                                <div className="alert alert-info">
                                    {withdrawal.admin_note}
                                </div>
                            </div>
                        )}

                        {/* Actions for PENDING */}
                        {withdrawal.status === 'pending' && (
                            <div className="info-section">
                                <h6 className="section-title">
                                    <i className="bi bi-pencil-square"></i> Xử lý yêu cầu
                                </h6>
                                <div className="form-group">
                                    <label>Ghi chú của admin:</label>
                                    <textarea
                                        value={adminNote}
                                        onChange={(e) => setAdminNote(e.target.value)}
                                        className="form-control"
                                        rows="3"
                                        placeholder="Nhập ghi chú (bắt buộc khi từ chối)..."
                                    />
                                </div>
                            </div>
                        )}

                        {/* Actions for APPROVED */}
                        {withdrawal.status === 'approved' && (
                            <div className="info-section">
                                <h6 className="section-title">
                                    <i className="bi bi-check2-circle"></i> Đánh dấu hoàn thành
                                </h6>
                                <div className="form-group">
                                    <label>Mã giao dịch chuyển tiền:</label>
                                    <input
                                        type="text"
                                        value={transactionRef}
                                        onChange={(e) => setTransactionRef(e.target.value)}
                                        className="form-control"
                                        placeholder="Ví dụ: VCB123456789"
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="modal-footer">
                        <button onClick={onClose} className="btn btn-secondary">
                            Đóng
                        </button>

                        {withdrawal.status === 'pending' && (
                            <>
                                <button
                                    onClick={handleReject}
                                    className="btn btn-danger"
                                    disabled={processing}
                                >
                                    <i className="bi bi-x-circle"></i>{' '}
                                    {processing ? 'Đang xử lý...' : 'Từ chối'}
                                </button>
                                <button
                                    onClick={handleApprove}
                                    className="btn btn-success"
                                    disabled={processing}
                                >
                                    <i className="bi bi-check-circle"></i>{' '}
                                    {processing ? 'Đang xử lý...' : 'Duyệt'}
                                </button>
                            </>
                        )}

                        {withdrawal.status === 'approved' && (
                            <button
                                onClick={handleComplete}
                                className="btn btn-primary"
                                disabled={processing}
                            >
                                <i className="bi bi-check-all"></i>{' '}
                                {processing ? 'Đang xử lý...' : 'Hoàn thành'}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default WithdrawalDetailModal;