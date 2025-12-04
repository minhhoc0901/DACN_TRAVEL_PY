import React, { memo } from 'react';

const UserListItem = memo(({ 
    user, 
    isSelected, 
    onSelect, 
    formatTime 
}) => {
    const userId = user.id || user;
    const userName = user.username || user.name || `User #${userId}`;
    const userAvatar = user.avatar;
    const lastMessage = user.lastMessage;
    const lastMessageTime = user.lastMessageTime;

    return (
        <li className={isSelected ? 'active' : ''} onClick={() => onSelect(user)}>
            <div className="user-avatar">
                {userAvatar ? (
                    <img src={`http://localhost:5000${userAvatar}`} alt={userName} />
                ) : (
                    <div className="avatar-placeholder">
                        {userName.charAt(0).toUpperCase()}
                    </div>
                )}
            </div>
            <div className="user-info">
                <div className="user-name">{userName}</div>
                <div className="last-message">
                    {lastMessage ? (
                        lastMessage.length > 30 
                            ? lastMessage.substring(0, 30) + '...'
                            : lastMessage
                    ) : 'Chưa có tin nhắn'}
                </div>
            </div>
            {lastMessageTime && (
                <div className="message-time">
                    {formatTime(lastMessageTime)}
                </div>
            )}
        </li>
    );
});

UserListItem.displayName = 'UserListItem';

export default UserListItem;