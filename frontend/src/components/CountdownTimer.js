import React, { useState, useEffect ,useCallback } from 'react';

const CountdownTimer = ({ expiryTimestamp, onExpire }) => {
    // SỬ DỤNG useCallback ĐỂ MEMOIZE HÀM NÀY
    // Nó chỉ được tạo lại khi expiryTimestamp thay đổi.
    const calculateTimeLeft = useCallback(() => {
        const difference = expiryTimestamp - Date.now();
        if (difference <= 0) {
            return null;
        }
        const minutes = Math.floor((difference / 1000 / 60) % 60);
        const seconds = Math.floor((difference / 1000) % 60);
        return { minutes, seconds };
    }, [expiryTimestamp]);

    const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

    useEffect(() => {
        // Kiểm tra ban đầu
        if (!timeLeft) {
            onExpire();
            return;
        }

        // Thiết lập một interval để cập nhật mỗi giây
        const timerId = setInterval(() => {
            const newTimeLeft = calculateTimeLeft();
            if (newTimeLeft) {
                setTimeLeft(newTimeLeft);
            } else {
                // Khi hết giờ, xóa interval và gọi onExpire
                clearInterval(timerId);
                onExpire();
            }
        }, 1000);

        // Hàm dọn dẹp: xóa interval khi component bị unmount
        return () => clearInterval(timerId);
        // THÊM CÁC PHỤ THUỘC CÒN THIẾU VÀO ĐÂY
    }, [timeLeft, calculateTimeLeft, onExpire]);

    if (!timeLeft) {
        // Trạng thái này chỉ hiển thị trong khoảnh khắc trước khi onExpire được gọi
        return <span className="v2-countdown-expired">Đang cập nhật...</span>;
    }

    return (
        <div className="v2-countdown-timer">
            Thời gian còn lại: {String(timeLeft.minutes).padStart(2, '0')}:{String(timeLeft.seconds).padStart(2, '0')}
        </div>
    );
};

export default CountdownTimer;