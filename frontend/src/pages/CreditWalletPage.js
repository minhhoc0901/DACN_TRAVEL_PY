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

    //  Reset form khi đóng modal
    useEffect(() => {
        if (!isOpen) {
            setAmount('');
            setBankName('');
            setAccountNumber('');
            setAccountName('');
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const formatCurrency = (num) => {
        return new Intl.NumberFormat('vi-VN').format(num);
    };

    // Format input số tiền khi user nhập
    const handleAmountChange = (e) => {
        const value = e.target.value.replace(/\D/g, ''); // Chỉ giữ số
        setAmount(value);
    };

    // Validate số tài khoản (chỉ số, 6-20 ký tự)
    const handleAccountNumberChange = (e) => {
        const value = e.target.value.replace(/\D/g, ''); // Chỉ giữ số
        if (value.length <= 20) {
            setAccountNumber(value);
        }
    };

    // Validate tên chủ tài khoản (chỉ chữ cái, khoảng trắng, dấu)
    const handleAccountNameChange = (e) => {
        const value = e.target.value.toUpperCase();
        // Cho phép: chữ cái, khoảng trắng, không số và ký tự đặc biệt
        const regex = /^[A-ZÀÁẠẢÃÂẦẤẬẨẪĂẰẮẶẲẴÈÉẸẺẼÊỀẾỆỂỄÌÍỊỈĨÒÓỌỎÕÔỒỐỘỔỖƠỜỚỢỞỠÙÚỤỦŨƯỪỨỰỬỮỲÝỴỶỸĐ\s]*$/;
        if (regex.test(value)) {
            setAccountName(value);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        const withdrawAmount = parseInt(amount);
        
        // VALIDATE FORM
        if (!amount || isNaN(withdrawAmount) || withdrawAmount <= 0) {
            toast.error('❌ Vui lòng nhập số tiền hợp lệ');
            return;
        }
        
        if (withdrawAmount < 50000) {
            toast.error('❌ Số tiền rút tối thiểu là 50.000 VNĐ');
            return;
        }

        if (withdrawAmount > 50000000) {
            toast.error('❌ Số tiền rút tối đa là 50.000.000 VNĐ/lần');
            return;
        }
        
        if (withdrawAmount > balance) {
            toast.error('❌ Số dư không đủ để thực hiện giao dịch');
            return;
        }

        if (!bankName) {
            toast.error('❌ Vui lòng chọn ngân hàng');
            return;
        }

        if (!accountNumber) {
            toast.error('❌ Vui lòng nhập số tài khoản');
            return;
        }

        if (accountNumber.length < 6 || accountNumber.length > 20) {
            toast.error('❌ Số tài khoản phải từ 6-20 chữ số');
            return;
        }

        if (!accountName) {
            toast.error('❌ Vui lòng nhập tên chủ tài khoản');
            return;
        }

        if (accountName.length < 3) {
            toast.error('❌ Tên chủ tài khoản phải có ít nhất 3 ký tự');
            return;
        }

        // Kiểm tra tên có chứa số
        if (/\d/.test(accountName)) {
            toast.error('❌ Tên chủ tài khoản không được chứa số');
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

            setAmount('');
            setBankName('');
            setAccountNumber('');
            setAccountName('');
            
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
                position: 'top-right'
            });
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="cv-modal-overlay" onClick={onClose}>
            <div className="cv-modal-content cv-withdrawal-modal" onClick={e => e.stopPropagation()}>
                <div className="cv-modal-header">
                    <h3>💸 Yêu cầu rút tiền</h3>
                    <button onClick={onClose} className="cv-btn-close" type="button">
                        <i className="fas fa-times"></i>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="cv-modal-body">
                    <div className="cv-balance-info">
                        <p>
                            <i className="fas fa-wallet"></i> Số dư hiện tại: 
                            <strong className="cv-balance-highlight"> {formatCurrency(balance)} VNĐ</strong>
                        </p>
                        <div className="cv-withdrawal-limits">
                            <p><i className="fas fa-info-circle"></i> Số tiền rút: 50.000 - 50.000.000 VNĐ</p>
                        </div>
                    </div>

                    <div className="cv-form-group">
                        <label>
                            <i className="fas fa-money-bill-wave"></i> Số tiền rút 
                            <span className="cv-required">*</span>
                        </label>
                        <div className="cv-input-group">
                            <input
                                type="text"
                                value={amount ? formatCurrency(amount) : ''}
                                onChange={handleAmountChange}
                                placeholder="Nhập số tiền cần rút"
                                required
                                className="cv-input-currency"
                            />
                            <span className="cv-input-suffix">VNĐ</span>
                        </div>
                        {amount && parseInt(amount) >= 50000 && (
                            <p className="cv-text-muted cv-helper-text">
                                Bạn sẽ nhận được: <strong>{formatCurrency(parseInt(amount))} VNĐ</strong>
                            </p>
                        )}
                    </div>

                    <div className="cv-form-group">
                        <label>
                            <i className="fas fa-university"></i> Ngân hàng 
                            <span className="cv-required">*</span>
                        </label>
                        <select
                            value={bankName}
                            onChange={(e) => setBankName(e.target.value)}
                            required
                            className="cv-select"
                        >
                            <option value="">-- Chọn ngân hàng --</option>
                            <option value="Vietcombank">Vietcombank (VCB)</option>
                            <option value="VietinBank">VietinBank (CTG)</option>
                            <option value="BIDV">BIDV</option>
                            <option value="Agribank">Agribank</option>
                            <option value="Techcombank">Techcombank (TCB)</option>
                            <option value="MB Bank">MB Bank (MBB)</option>
                            <option value="ACB">ACB</option>
                            <option value="Sacombank">Sacombank (STB)</option>
                            <option value="VPBank">VPBank</option>
                            <option value="TPBank">TPBank</option>
                            <option value="HDBank">HDBank</option>
                            <option value="VIB">VIB</option>
                            <option value="SHB">SHB</option>
                            <option value="OCB">OCB</option>
                        </select>
                    </div>

                    <div className="cv-form-group">
                        <label>
                            <i className="fas fa-credit-card"></i> Số tài khoản 
                            <span className="cv-required">*</span>
                        </label>
                        <input
                            type="text"
                            value={accountNumber}
                            onChange={handleAccountNumberChange}
                            placeholder="Nhập số tài khoản (6-20 chữ số)"
                            required
                            maxLength={20}
                            className="cv-input"
                        />
                        {accountNumber && accountNumber.length < 6 && (
                            <p className="cv-error-text">
                                <i className="fas fa-exclamation-circle"></i> Số tài khoản phải có ít nhất 6 chữ số
                            </p>
                        )}
                    </div>

                    <div className="cv-form-group">
                        <label>
                            <i className="fas fa-user"></i> Chủ tài khoản 
                            <span className="cv-required">*</span>
                        </label>
                        <input
                            type="text"
                            value={accountName}
                            onChange={handleAccountNameChange}
                            placeholder="VD: NGUYEN VAN A"
                            required
                            className="cv-input cv-input-uppercase"
                        />
                        <p className="cv-text-muted cv-helper-text">
                            <i className="fas fa-info-circle"></i> Nhập in hoa, không dấu (theo thẻ ngân hàng)
                        </p>
                    </div>

                    <div className="cv-withdrawal-note">
                        <i className="fas fa-lightbulb"></i>
                        <div>
                            <strong>Lưu ý quan trọng:</strong>
                            <ul>
                                <li>⏱️ Thời gian xử lý: 7-10 ngày làm việc</li>
                                <li>✅ Admin sẽ xem xét và duyệt yêu cầu</li>
                                <li>⚠️ Vui lòng điền chính xác thông tin tài khoản</li>
                                <li>🔒 Thông tin được mã hóa và bảo mật</li>
                            </ul>
                        </div>
                    </div>

                    <div className="cv-modal-footer">
                        <button 
                            type="button" 
                            onClick={onClose} 
                            className="cv-btn cv-btn-secondary"
                            disabled={submitting}
                        >
                            <i className="fas fa-times"></i> Hủy bỏ
                        </button>
                        <button 
                            type="submit" 
                            className="cv-btn cv-btn-primary" 
                            disabled={submitting}
                        >
                            {submitting ? (
                                <>
                                    <span className="cv-spinner"></span>
                                    Đang xử lý...
                                </>
                            ) : (
                                <>
                                    <i className="fas fa-paper-plane"></i> Gửi yêu cầu
                                </>
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
    
    // STATE ẨN/HIỆN SỐ DƯ
    const [balanceVisible, setBalanceVisible] = useState(false);

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
            
            await fetchData();
            
            return result;
        } catch (error) {
            console.error('[handleWithdrawal] Error:', error);
            throw error;
        }
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('vi-VN').format(amount || 0);
    };

    // Toggle ẩn/hiện số dư
    const toggleBalanceVisibility = () => {
        setBalanceVisible(!balanceVisible);
    };

    // Hiển thị số dư hoặc *****
    const displayBalance = () => {
        if (balanceVisible) {
            return formatCurrency(balance);
        }
        return '********';
    };

    const getTransactionIcon = (type) => {
        switch (type) {
            case 'refund':
                return <i className="fas fa-plus-circle cr_us_text_success"></i>;
            case 'payment':
                return <i className="fas fa-minus-circle cr_us_text_danger"></i>;
            case 'withdrawal':
                return <i className="fas fa-arrow-right cr_us_text_info"></i>;
            default:
                return <i className="fas fa-circle cr_us_text_muted"></i>;
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

    const getWithdrawalStatusBadge = (status) => {
        const statusConfig = {
            'pending': {
                label: 'Chờ duyệt',
                className: 'cr_us_badge_pending',
                icon: 'bi-clock-history'
            },
            'approved': {
                label: 'Đã duyệt',
                className: 'cr_us_badge_approved',
                icon: 'bi-check-circle'
            },
            'rejected': {
                label: 'Từ chối',
                className: 'cr_us_badge_rejected',
                icon: 'bi-x-circle'
            },
            'completed': {
                label: 'Hoàn thành',
                className: 'cr_us_badge_completed',
                icon: 'bi-check-circle-fill'
            }
        };

        const config = statusConfig[status] || statusConfig['pending'];

        return (
            <span className={`cr_us_status_badge ${config.className}`}>
                <i className={`bi ${config.icon}`}></i>
                {config.label}
            </span>
        );
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
                <div className="cv-loader-wrapper">
                    <div className="cv-loader"></div>
                    <p>Đang tải dữ liệu...</p>
                </div>
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
            <ToastContainer 
                position="top-right"
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
                    <h1><i className="fas fa-wallet"></i> Ví Credit của tôi</h1>
                    <p className="cv-subtitle">Quản lý số dư và lịch sử giao dịch</p>
                </div>

                {/* ✅ BALANCE CARD - CÓ TOGGLE ẨN/HIỆN */}
                <div className="cv-balance-card">
                    <div className="cv-balance-header">
                        <div className="cv-balance-icon">
                            <i className="fas fa-wallet"></i>
                        </div>
                        <div className="cv-balance-info">
                            <p className="cv-balance-label">Số dư khả dụng</p>
                            <div className="cv-balance-amount-wrapper">
                                <h2 className="cv-balance-amount">
                                    {displayBalance()} {balanceVisible && 'VNĐ'}
                                </h2>
                                {/* ✅ BUTTON TOGGLE ẨN/HIỆN */}
                                <button 
                                    onClick={toggleBalanceVisibility}
                                    className="cv-toggle-balance-btn"
                                    title={balanceVisible ? 'Ẩn số dư' : 'Hiện số dư'}
                                >
                                    <i className={`fas ${balanceVisible ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                                </button>
                            </div>
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
                        <div className="cv-balance-warning">
                            <i className="fas fa-exclamation-circle"></i>
                            <p>Số dư tối thiểu để rút tiền là 50.000 VNĐ</p>
                        </div>
                    )}
                </div>

                {/* Transaction History */}
                <div className="cv-transactions-section">
                    <div className="cv-transactions-header">
                        <h3><i className="fas fa-history"></i> Lịch sử giao dịch</h3>
                        <span className="cv-transactions-count">
                            {transactions.length} giao dịch
                        </span>
                    </div>
                    
                    {transactions.length === 0 ? (
                        <div className="cv-empty-state">
                            <i className="fas fa-inbox"></i>
                            <p>Chưa có giao dịch nào</p>
                        </div>
                    ) : (
                        <div className="cv-transactions-list">
                            {transactions.map(transaction => (
                                <div key={transaction.id} className="cr_us_transaction_item">
                                    <div className="cr_us_transaction_icon">
                                        {getTransactionIcon(transaction.transaction_type)}
                                    </div>
                                    <div className="cr_us_transaction_details">
                                        <div className="cr_us_transaction_header">
                                            <p className="cr_us_transaction_type">
                                                {getTransactionTypeLabel(transaction.transaction_type)}
                                            </p>
                                            {/* Hiển thị trạng thái nếu là withdrawal */}
                                            {transaction.transaction_type === 'withdrawal' && transaction.withdrawal_status && (
                                                getWithdrawalStatusBadge(transaction.withdrawal_status)
                                            )}
                                        </div>
                                        <p className="cr_us_transaction_description">
                                            {transaction.description}
                                        </p>
                                        
                                        {/* Hiển thị thông tin ngân hàng nếu là withdrawal */}
                                        {transaction.transaction_type === 'withdrawal' && transaction.bank_info && (
                                            <div className="cr_us_bank_info">
                                                <div className="cr_us_bank_detail">
                                                    <i className="bi bi-bank"></i>
                                                    <span>{transaction.bank_info.bank_name}</span>
                                                </div>
                                                <div className="cr_us_bank_detail">
                                                    <i className="bi bi-credit-card"></i>
                                                    <span>{transaction.bank_info.account_number}</span>
                                                </div>
                                                <div className="cr_us_bank_detail">
                                                    <i className="bi bi-person"></i>
                                                    <span>{transaction.bank_info.account_name}</span>
                                                </div>
                                            </div>
                                        )}

                                        {/*  Hiển thị admin notes nếu có */}
                                        {transaction.admin_notes && (
                                            <div className="cr_us_admin_note">
                                                <i className="bi bi-info-circle"></i>
                                                <span>Ghi chú: {transaction.admin_notes}</span>
                                            </div>
                                        )}

                                        <p className="cr_us_transaction_date">
                                            <i className="far fa-clock"></i> {formatDate(transaction.created_at)}
                                        </p>
                                    </div>
                                    <div className="cr_us_transaction_amount">
                                        <span className={transaction.amount >= 0 ? 'cr_us_text_success' : 'cr_us_text_danger'}>
                                            {transaction.amount >= 0 ? '+' : ''}
                                            {formatCurrency(Math.abs(transaction.amount))} VNĐ
                                        </span>
                                        <span className="cr_us_balance_after">
                                            Số dư: {formatCurrency(transaction.balance_after)} VNĐ
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