import React, { useState, useEffect } from 'react';
import { creditService } from '../services/creditService';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import '../styles/CreditWalletPage.css';

const WithdrawalModal = ({ isOpen, onClose, balance, onSubmit }) => {
    const [amount, setAmount] = useState('');
    const [bankName, setBankName] = useState('');
    const [accountNumber, setAccountNumber] = useState('');
    const [accountName, setAccountName] = useState('');
    const [submitting, setSubmitting] = useState(false);

    if (!isOpen) return null;

    const formatCurrency = (num) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(num);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        const withdrawAmount = parseInt(amount);
        
        if (isNaN(withdrawAmount) || withdrawAmount <= 0) {
            toast.error('❌ Vui lòng nhập số tiền hợp lệ');
            return;
        }
        
        if (withdrawAmount < 50000) {
            toast.error('❌ Số tiền rút tối thiểu là 50.000 VNĐ');
            return;
        }
        
        if (withdrawAmount > balance) {
            toast.error('❌ Số dư không đủ để rút');
            return;
        }

        if (!bankName || !accountNumber || !accountName) {
            toast.error('❌ Vui lòng điền đầy đủ thông tin ngân hàng');
            return;
        }

        setSubmitting(true);

        try {
            await onSubmit({
                amount: withdrawAmount,
                bankName,
                accountNumber,
                accountName
            });

            // Reset form
            setAmount('');
            setBankName('');
            setAccountNumber('');
            setAccountName('');
            
            // ✅ HIỂN THỊ TOAST NGAY TRƯỚC KHI ĐÓNG MODAL
            toast.success('✅ Yêu cầu rút tiền đã được gửi thành công! Admin sẽ xử lý trong 7-10 ngày làm việc.', {
                autoClose: 3000,
                position: 'top-right'
            });
            
            setTimeout(() => {
                onClose();
            }, 500);

        } catch (error) {
            console.error('[WithdrawalModal] Error:', error);
            toast.error(`❌ ${error.message || 'Không thể gửi yêu cầu rút tiền'}`, {
                autoClose: 5000,
                position: 'top-center'
            });
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="cv-modal-overlay" onClick={onClose}>
            <div className="cv-modal-content cv-withdrawal-modal" onClick={e => e.stopPropagation()}>
                <div className="cv-modal-header">
                    <h3>Yêu cầu rút tiền</h3>
                    <button onClick={onClose} className="cv-btn-close">
                        <i className="fas fa-times"></i>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="cv-modal-body">
                    <div className="cv-balance-info">
                        <p>Số dư hiện tại: <strong>{formatCurrency(balance)}</strong></p>
                        <p className="cv-text-muted">Số tiền rút tối thiểu: 50.000 VNĐ</p>
                    </div>

                    <div className="cv-form-group">
                        <label>Số tiền rút <span className="cv-required">*</span></label>
                        <input
                            type="number"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            placeholder="Nhập số tiền cần rút"
                            min="50000"
                            max={balance}
                            required
                        />
                    </div>

                    <div className="cv-form-group">
                        <label>Ngân hàng <span className="cv-required">*</span></label>
                        <select
                            value={bankName}
                            onChange={(e) => setBankName(e.target.value)}
                            required
                        >
                            <option value="">-- Chọn ngân hàng --</option>
                            <option value="Vietcombank">Vietcombank</option>
                            <option value="VietinBank">VietinBank</option>
                            <option value="BIDV">BIDV</option>
                            <option value="Agribank">Agribank</option>
                            <option value="Techcombank">Techcombank</option>
                            <option value="MB Bank">MB Bank</option>
                            <option value="ACB">ACB</option>
                            <option value="Sacombank">Sacombank</option>
                            <option value="VPBank">VPBank</option>
                            <option value="TPBank">TPBank</option>
                        </select>
                    </div>

                    <div className="cv-form-group">
                        <label>Số tài khoản <span className="cv-required">*</span></label>
                        <input
                            type="text"
                            value={accountNumber}
                            onChange={(e) => setAccountNumber(e.target.value)}
                            placeholder="Nhập số tài khoản"
                            required
                        />
                    </div>

                    <div className="cv-form-group">
                        <label>Chủ tài khoản <span className="cv-required">*</span></label>
                        <input
                            type="text"
                            value={accountName}
                            onChange={(e) => setAccountName(e.target.value)}
                            placeholder="Nhập tên chủ tài khoản"
                            required
                        />
                    </div>

                    <div className="cv-withdrawal-note">
                        <i className="bi bi-info-circle"></i>
                        <p>
                            <strong>Lưu ý:</strong>
                            <br />• Thời gian xử lý: 7-10 ngày làm việc
                            <br />• Admin sẽ xem xét và duyệt yêu cầu
                            <br />• Vui lòng điền chính xác thông tin tài khoản
                        </p>
                    </div>

                    <div className="cv-modal-footer">
                        <button type="button" onClick={onClose} className="cv-btn cv-btn-secondary">
                            Hủy bỏ
                        </button>
                        <button type="submit" className="cv-btn cv-btn-primary" disabled={submitting}>
                            {submitting ? (
                                <>
                                    <span className="cv-spinner"></span>
                                    Đang xử lý...
                                </>
                            ) : (
                                'Gửi yêu cầu'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const CreditWalletPage = () => {
    const [balance, setBalance] = useState(0);
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showWithdrawalModal, setShowWithdrawalModal] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            setError('');
            
            const [balanceData, transactionsData] = await Promise.all([
                creditService.getBalance(),
                creditService.getTransactionHistory()
            ]);

            console.log('[CreditWallet] Balance data:', balanceData);
            console.log('[CreditWallet] Transactions data:', transactionsData);

            // ✅ Parse balance
            const balanceAmount = parseFloat(balanceData.data.balance) || 0;
            setBalance(balanceAmount);

            setTransactions(transactionsData.data || []);
        } catch (err) {
            console.error('[CreditWallet] Error:', err);
            setError(err.message || 'Không thể tải dữ liệu');
            toast.error(err.message || 'Không thể tải dữ liệu');
        } finally {
            setLoading(false);
        }
    };

    const handleWithdrawal = async (withdrawalData) => {
        try {
            const result = await creditService.requestWithdrawal(withdrawalData);
            console.log('[handleWithdrawal] Result:', result);
            
            // ✅ Reload data sau khi rút tiền thành công
            await fetchData();
            
            return result;
        } catch (error) {
            console.error('[handleWithdrawal] Error:', error);
            throw error;
        }
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount || 0);
    };

    const getTransactionIcon = (type) => {
        switch (type) {
            case 'refund':
                return <i className="fas fa-plus-circle cv-text-success"></i>;
            case 'payment':
                return <i className="fas fa-minus-circle cv-text-danger"></i>;
            case 'withdrawal':
                return <i className="fas fa-arrow-right cv-text-info"></i>;
            default:
                return <i className="fas fa-circle cv-text-muted"></i>;
        }
    };

    const getTransactionTypeLabel = (type) => {
        const labels = {
            'refund': 'Hoàn tiền',
            'payment': 'Thanh toán',
            'withdrawal': 'Rút tiền'
        };
        return labels[type] || type;
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('vi-VN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    if (loading) {
        return (
            <div className="cv-credit-wallet-container">
                <div className="cv-loader"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="cv-credit-wallet-container">
                <div className="cv-error-message">
                    <i className="fas fa-exclamation-triangle"></i>
                    <p>{error}</p>
                    <button onClick={fetchData} className="cv-btn cv-btn-primary">
                        <i className="fas fa-sync-alt"></i> Thử lại
                    </button>
                </div>
            </div>
        );
    }

    return (
        <>
            {/* ✅ TOAST CONTAINER PHẢI Ở NGOÀI CÙNG */}
            <ToastContainer 
                position="top-center"
                autoClose={3000}
                hideProgressBar={false}
                newestOnTop
                closeOnClick
                rtl={false}
                pauseOnFocusLoss
                draggable
                pauseOnHover
                theme="light"
            />

            <WithdrawalModal
                isOpen={showWithdrawalModal}
                onClose={() => setShowWithdrawalModal(false)}
                balance={balance}
                onSubmit={handleWithdrawal}
            />

            <div className="cv-credit-wallet-container">
                <div className="cv-page-header">
                    <h1>Ví Credit của tôi</h1>
                    <p className="cv-subtitle">Quản lý số dư và lịch sử giao dịch</p>
                </div>

                {/* Balance Card */}
                <div className="cv-balance-card">
                    <div className="cv-balance-header">
                        <div className="cv-balance-icon">
                            <i className="fas fa-wallet"></i>
                        </div>
                        <div className="cv-balance-info">
                            <p className="cv-balance-label">Số dư khả dụng</p>
                            {/* ✅ HIỂN THỊ SỐ DƯ */}
                            <h2 className="cv-balance-amount">{formatCurrency(balance)}</h2>
                        </div>
                    </div>
                    <div className="cv-balance-actions">
                        <button 
                            onClick={() => setShowWithdrawalModal(true)} 
                            className="cv-btn cv-btn-primary"
                            disabled={balance < 50000}
                        >
                            <i className="fas fa-money-bill-wave"></i>
                            Rút tiền
                        </button>
                        <button onClick={fetchData} className="cv-btn cv-btn-secondary">
                            <i className="fas fa-sync-alt"></i>
                            Làm mới
                        </button>
                    </div>
                    {balance < 50000 && (
                        <p className="cv-text-muted" style={{ marginTop: '10px', fontSize: '13px' }}>
                            * Số dư tối thiểu để rút tiền là 50.000 VNĐ
                        </p>
                    )}
                </div>

                {/* Transaction History */}
                <div className="cv-transactions-section">
                    <h3>Lịch sử giao dịch</h3>
                    
                    {transactions.length === 0 ? (
                        <div className="cv-empty-state">
                            <i className="fas fa-inbox"></i>
                            <p>Chưa có giao dịch nào</p>
                        </div>
                    ) : (
                        <div className="cv-transactions-list">
                            {transactions.map(transaction => (
                                <div key={transaction.id} className="cv-transaction-item">
                                    <div className="cv-transaction-icon">
                                        {getTransactionIcon(transaction.transaction_type)}
                                    </div>
                                    <div className="cv-transaction-details">
                                        <p className="cv-transaction-type">
                                            {getTransactionTypeLabel(transaction.transaction_type)}
                                        </p>
                                        <p className="cv-transaction-description">
                                            {transaction.description}
                                        </p>
                                        <p className="cv-transaction-date">
                                            {formatDate(transaction.created_at)}
                                        </p>
                                    </div>
                                    <div className="cv-transaction-amount">
                                        <span className={transaction.amount >= 0 ? 'cv-text-success' : 'cv-text-danger'}>
                                            {transaction.amount >= 0 ? '+' : ''}
                                            {formatCurrency(Math.abs(transaction.amount))}
                                        </span>
                                        <span className="cv-balance-after">
                                            Số dư: {formatCurrency(transaction.balance_after)}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </>
    );
};

export default CreditWalletPage;