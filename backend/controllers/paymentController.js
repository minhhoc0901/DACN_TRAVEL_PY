const VNPAYService = require('../utils/VNPAY');
const Payment = require('../models/Payment');
const Booking = require('../models/Booking');
const NotificationService = require('../utils/notificationService');
const UserCredit = require('../models/UserCredit');
const emailService = require('../utils/emailService');


/**
 * Khởi tạo thanh toán VNPAY với validation chống trùng lặp
 */
exports.initVnpay = async (req, res) => {
  try {
    const { bookingId } = req.body;

    console.log('[VNPAY][init] bookingId:', bookingId);

    if (!bookingId) {
      return res.status(400).json({
        success: false,
        message: 'Booking ID là bắt buộc'
      });
    }

    // Kiểm tra booking có tồn tại không
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ 
        success: false, 
        message: 'Không tìm thấy booking' 
      });
    }

    // Kiểm tra trạng thái booking
    if (booking.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: 'Đơn hàng đã bị hủy, không thể thanh toán'
      });
    }

    // QUAN TRỌNG: Kiểm tra booking đã được thanh toán chưa
    const existingPayment = await Payment.findSuccessfulByBookingId(bookingId);
    if (existingPayment) {
      return res.status(400).json({
        success: false,
        message: 'Đơn hàng này đã được thanh toán thành công',
        data: {
          bookingId: bookingId,
          paymentDate: existingPayment.payment_date,
          transactionNo: existingPayment.vnp_TransactionNo,
          amount: existingPayment.amount
        }
      });
    }

    // Kiểm tra có payment pending không
    const pendingPayment = await Payment.findPendingByBookingId(bookingId);
    if (pendingPayment) {
      if (pendingPayment) {
      await Payment.markCancelled(pendingPayment.vnp_TxnRef);
      console.log(`[VNPAY][init] Cancelled old pending payment: ${pendingPayment.vnp_TxnRef} to create a new one.`);
    }
    }

    console.log('[VNPAY][init] amount:', booking.final_amount);

    const ipAddr = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
    const txnRef = `${bookingId}${Date.now()}`.replace(/\D/g, '').slice(0, 20);
    const orderInfo = `Thanh toan booking ${bookingId}`;

    console.log('[VNPAY][init] txnRef:', txnRef);

    // Tạo payment mới
    await Payment.createPending(bookingId, txnRef, booking.final_amount);

    // Tạo URL thanh toán
    const paymentUrl = VNPAYService.createPaymentUrl(ipAddr, {
      amount: booking.final_amount,
      txnRef: txnRef,
      orderInfo: orderInfo,
      bankCode: req.body.bankCode || ''
    });

    res.json({ 
      success: true, 
      paymentUrl, 
      txnRef,
      amount: booking.final_amount,
      expiresIn: '15 minutes'
    });
  } catch (error) {
    console.error('[VNPAY][init] Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Xử lý callback từ VNPAY (Return URL)
 */
exports.vnpReturn = async (req, res) => {
  try {
    console.log('[VNPAY][return] Query params:', req.query);

    // Verify chữ ký
    const isValid = VNPAYService.verifySignature(req.query);
    if (!isValid) {
      console.error('[VNPAY][return] Invalid signature');
      return res.redirect(`${process.env.FRONTEND_URL}/payment/result?status=error&message=Invalid_signature`);
    }

    const { vnp_TxnRef, vnp_ResponseCode, vnp_TransactionNo, vnp_Amount } = req.query;
    const payment = await Payment.findByTxnRef(vnp_TxnRef);

    if (!payment) {
      console.error('[VNPAY][return] Payment not found:', vnp_TxnRef);
      return res.redirect(`${process.env.FRONTEND_URL}/payment/result?status=error&message=Payment_not_found`);
    }

    if (vnp_ResponseCode === '00') {
      // CẬP NHẬT PAYMENT & BOOKING
      await Payment.markSuccess(vnp_TxnRef, vnp_TransactionNo, vnp_ResponseCode);
      await Booking.updateStatus(payment.booking_id, 'confirmed');
      
      const io = req.app.get('io');
      const amount = parseInt(vnp_Amount) / 100;

      // Thông báo cho user
      await NotificationService.notifyPaymentSuccess(
        io,
        payment.user_id,
        payment.booking_id,
        amount
      );

      // Thông báo cho admin
      const adminIds = await NotificationService.getAdminIds();
      await NotificationService.notifyAdminPaymentSuccess(
        io,
        adminIds,
        payment.booking_id,
        amount
      );

      // GỬI EMAIL 
      try {
        const booking = await Booking.findByPk(payment.booking_id);
        
        if (booking) {
          
          // GỬI EMAIL
          await emailService.sendBookingConfirmation(
            booking.contact_email, 
            {
              id: payment.booking_id,
              tour_name: booking.tour_name,
              final_amount: booking.final_amount,
              contact_name: booking.contact_name,
              contact_email: booking.contact_email,
              contact_phone: booking.contact_phone,
              departure_date: booking.departure_date,
              end_date: booking.end_date,
              verification_token: booking.verification_token,
              promotion_code: booking.promotion_code,
              BookingDetails: booking.BookingDetails
            }
          );
          
          console.log(`[VNPAY][return] ✅ Email sent to ${booking.contact_email}`);
        }
      } catch (emailError) {
        console.error('[VNPAY][return] ❌ Email error (non-critical):', emailError);
      }

      console.log('[VNPAY][return] Payment success:', vnp_TxnRef);
      return res.redirect(`${process.env.FRONTEND_URL}/payment/result?status=success&bookingId=${payment.booking_id}&txnRef=${vnp_TxnRef}`);
    } else {
      await Payment.markFailed(vnp_TxnRef, vnp_ResponseCode);
      
      console.log('[VNPAY][return] Payment failed:', vnp_TxnRef, vnp_ResponseCode);
      return res.redirect(`${process.env.FRONTEND_URL}/payment/result?status=failed&code=${vnp_ResponseCode}&bookingId=${payment.booking_id}`);
    }

  } catch (error) {
    console.error('[VNPAY][return] Error:', error);
    res.redirect(`${process.env.FRONTEND_URL}/payment/result?status=error&message=${encodeURIComponent(error.message)}`);
  }
};

/**
 * Xử lý IPN callback từ VNPAY (server-to-server)
 */
exports.vnpIpn = async (req, res) => {
  try {
    console.log('[VNPAY][IPN] Query params:', req.query);

    // Verify chữ ký
    const isValid = VNPAYService.verifySignature(req.query);
    if (!isValid) {
      console.error('[VNPAY][IPN] Invalid signature');
      return res.status(200).json({ RspCode: '97', Message: 'Invalid Signature' });
    }

    const { vnp_TxnRef, vnp_ResponseCode, vnp_TransactionNo } = req.query;
    const payment = await Payment.findByTxnRef(vnp_TxnRef);

    if (!payment) {
      console.error('[VNPAY][IPN] Order not found:', vnp_TxnRef);
      return res.status(200).json({ RspCode: '01', Message: 'Order not found' });
    }

    if (payment.payment_status !== 'pending') {
      console.log('[VNPAY][IPN] Order already confirmed/failed:', vnp_TxnRef);
      return res.status(200).json({ RspCode: '02', Message: 'Order already confirmed' });
    }

    if (vnp_ResponseCode === '00') {
      await Payment.markSuccess(vnp_TxnRef, vnp_TransactionNo, vnp_ResponseCode);
      await Booking.updateStatus(payment.booking_id, 'confirmed');
      return res.status(200).json({ RspCode: '00', Message: 'Success' });
    } else {
      await Payment.markFailed(vnp_TxnRef, vnp_ResponseCode);
      return res.status(200).json({ RspCode: '00', Message: 'Confirm fail transaction' });
    }
  } catch (error) {
    console.error('[VNPAY][IPN] Error:', error);
    return res.status(200).json({ RspCode: '99', Message: 'Unknown error' });
  }
};

/**
 * Kiểm tra trạng thái thanh toán theo booking ID
 */
exports.getPaymentStatus = async (req, res) => {
  try {
    const { bookingId } = req.params;
    
    if (!bookingId || isNaN(parseInt(bookingId))) {
      return res.status(400).json({
        success: false,
        message: 'Booking ID không hợp lệ'
      });
    }

    const bookingIdInt = parseInt(bookingId);
    console.log('[Payment][status] Checking payment status for booking:', bookingIdInt);
    
    // Lấy thông tin song song để tăng hiệu suất
    const [successfulPayment, pendingPayment, allPayments] = await Promise.all([
      Payment.findSuccessfulByBookingId(bookingIdInt),
      Payment.findPendingByBookingId(bookingIdInt),
      Payment.findByBookingId(bookingIdInt)
    ]);
    
    // Tính toán thời gian còn lại cho payment pending
    let pendingTimeLeft = null;
    if (pendingPayment) {
      const now = new Date();
      const paymentTime = new Date(pendingPayment.payment_date);
      const diffMinutes = (now - paymentTime) / (1000 * 60);
      pendingTimeLeft = Math.max(0, 15 - diffMinutes);
    }
    
    const response = {
      success: true,
      data: {
        bookingId: bookingIdInt,
        paymentSummary: {
          hasSuccessfulPayment: !!successfulPayment,
          hasPendingPayment: !!pendingPayment,
          totalPayments: allPayments.length,
          pendingTimeLeft: pendingTimeLeft
        },
        successfulPayment: successfulPayment || null,
        pendingPayment: pendingPayment ? {
          ...pendingPayment,
          timeLeftMinutes: pendingTimeLeft,
          isExpired: pendingTimeLeft <= 0
        } : null,
        paymentHistory: allPayments
      }
    };
    
    console.log('[Payment][status] Response summary:', {
      bookingId: bookingIdInt,
      hasSuccess: !!successfulPayment,
      hasPending: !!pendingPayment,
      totalPayments: allPayments.length
    });
    
    res.json(response);
  } catch (error) {
    console.error('[Payment][status] Error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi kiểm tra trạng thái thanh toán',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Lấy chi tiết payment theo ID
 */
exports.getPaymentDetail = async (req, res) => {
  try {
    const { paymentId } = req.params;
    
    if (!paymentId || isNaN(parseInt(paymentId))) {
      return res.status(400).json({
        success: false,
        message: 'Payment ID không hợp lệ'
      });
    }
    
    const payment = await Payment.findById(parseInt(paymentId));
    
    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy payment'
      });
    }
    
    res.json({
      success: true,
      data: payment
    });
  } catch (error) {
    console.error('[Payment][detail] Error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy chi tiết payment',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Lấy thống kê payments
 */
exports.getPaymentStats = async (req, res) => {
  try {
    const { fromDate, toDate, type } = req.query;
    
    let stats;
    if (type === 'total') {
      stats = await Payment.getTotalStats();
    } else {
      stats = await Payment.getStatsByDate(fromDate, toDate);
    }
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('[Payment][stats] Error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy thống kê payments',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * THANH TOÁN BẰNG VÍ CREDIT
 * @route POST /api/payments/credit/pay
 */
exports.payWithCredit = async (req, res) => {
    try {
        const { bookingId } = req.body;
        const userId = req.user.id;

        console.log('[CREDIT PAYMENT] bookingId:', bookingId, 'userId:', userId);

        // 1. Kiểm tra booking tồn tại
        const booking = await Booking.findById(bookingId);
        if (!booking) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy booking'
            });
        }

        // 2. Kiểm tra quyền sở hữu
        if (booking.user_id !== userId) {
            return res.status(403).json({
                success: false,
                message: 'Bạn không có quyền thanh toán booking này'
            });
        }

        // 3. Kiểm tra trạng thái booking
        if (booking.status !== 'pending_payment') {
            return res.status(400).json({
                success: false,
                message: `Booking đã ${booking.status === 'confirmed' ? 'được thanh toán' : booking.status}`
            });
        }

        // 4. Kiểm tra đã thanh toán chưa
        const existingPayment = await Payment.findSuccessfulByBookingId(bookingId);
        if (existingPayment) {
            return res.status(400).json({
                success: false,
                message: 'Booking đã được thanh toán'
            });
        }

        // 5. Kiểm tra số dư Credit
        const balance = await UserCredit.getBalance(userId);
        const amount = parseFloat(booking.final_amount);

        console.log('[CREDIT PAYMENT] Balance:', balance, 'Amount:', amount);

        if (balance < amount) {
            return res.status(400).json({
                success: false,
                message: `Số dư không đủ. Bạn cần thêm ${(amount - balance).toLocaleString('vi-VN')} VNĐ`,
                data: {
                    balance,
                    required: amount,
                    shortfall: amount - balance
                }
            });
        }

        // 6. Trừ tiền Credit
        await UserCredit.deductCredit(
            userId,
            amount,
            bookingId,
            `Thanh toán booking #${bookingId}`
        );

        // 7. Cập nhật booking status
        await Booking.updateStatus(bookingId, 'confirmed');

        // 8. Tạo payment record
        const txnRef = `CREDIT_${bookingId}_${Date.now()}`;
        await Payment.createCreditPayment(bookingId, txnRef, amount);

        // 9. GỬI THÔNG BÁO
        const io = req.app.get('io');
        
        await NotificationService.notifyPaymentSuccess(
            io,
            userId,
            bookingId,
            amount 
        );

        const adminIds = await NotificationService.getAdminIds();
        await NotificationService.notifyAdminPaymentSuccess(
            io,
            adminIds,
            bookingId,
            amount
        );

        // 10. GỬI EMAIL 
        try {
          const bookingDetails = await Booking.findByPk(bookingId);
          
          if (bookingDetails) {
            
            // GỬI EMAIL
            await emailService.sendBookingConfirmation(
              bookingDetails.contact_email,
              {
                id: bookingId,
                tour_name: bookingDetails.tour_name,
                final_amount: bookingDetails.final_amount,
                contact_name: bookingDetails.contact_name,
                contact_email: bookingDetails.contact_email,
                contact_phone: bookingDetails.contact_phone,
                departure_date: bookingDetails.departure_date,
                end_date: bookingDetails.end_date,
                verification_token: bookingDetails.verification_token,
                promotion_code: bookingDetails.promotion_code,
                BookingDetails: bookingDetails.BookingDetails
              }
            );
            
            console.log(`[CREDIT PAYMENT] ✅ Email sent to ${bookingDetails.contact_email}`);
          }
        } catch (emailError) {
            console.error('[CREDIT PAYMENT] ❌ Email error (non-critical):', emailError);
        }

        console.log('[CREDIT PAYMENT] ✅ Success for booking:', bookingId);

        res.json({
            success: true,
            message: 'Thanh toán thành công bằng Ví Credit',
            data: {
                bookingId,
                amount,
                remainingBalance: balance - amount,
                paymentMethod: 'credit',
                txnRef
            }
        });

    } catch (error) {
        console.error('[CREDIT PAYMENT] Error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Lỗi khi thanh toán bằng Credit'
        });
    }
};