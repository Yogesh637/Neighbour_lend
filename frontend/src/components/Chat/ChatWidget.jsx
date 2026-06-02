import React, { useState, useEffect, useRef } from 'react';
import { useChat } from '../../context/ChatContext';
import { useAuth } from '../../store/authStore';

const ChatWidget = () => {
    const { user } = useAuth();
    const { conversations, activeChatUser, setActiveChatUser, messages, sendMessage } = useChat();
    const [isOpen, setIsOpen] = useState(false);
    const [inputMsg, setInputMsg] = useState('');
    const messagesEndRef = useRef(null);

    // Auto-scroll chat to bottom
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        if (isOpen || activeChatUser) {
            scrollToBottom();
        }
    }, [messages, isOpen, activeChatUser]);

    // Automatically open widget if someone sets activeChatUser (e.g. from Product Card)
    useEffect(() => {
        if (activeChatUser) {
            setIsOpen(true);
        }
    }, [activeChatUser]);

    if (!user) return null;

    const handleSend = (e) => {
        e.preventDefault();
        if (!inputMsg.trim() || !activeChatUser) return;
        sendMessage(activeChatUser, inputMsg);
        setInputMsg('');
    };

    return (
        <div style={{ position: 'fixed', bottom: '24px', right: '24px', zIndex: 9999, fontFamily: 'Outfit, sans-serif' }}>
            {/* Toggle Button */}
            {!isOpen && (
                <button
                    onClick={() => setIsOpen(true)}
                    className="btn-primary"
                    style={{
                        borderRadius: '50%',
                        width: '60px',
                        height: '60px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '1.6rem',
                        boxShadow: '0 8px 30px rgba(0, 0, 0, 0.2)',
                        cursor: 'pointer',
                        padding: 0
                    }}
                >
                    💬
                </button>
            )}

            {/* Chat Box Container */}
            {isOpen && (
                <div
                    className="glass-panel"
                    style={{
                        width: '380px',
                        height: '500px',
                        borderRadius: '24px',
                        display: 'flex',
                        flexDirection: 'column',
                        overflow: 'hidden',
                        boxShadow: '0 12px 40px rgba(0, 0, 0, 0.25)',
                        border: '1px solid var(--border-color)',
                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                        animation: 'fadeIn 0.25s ease-out'
                    }}
                >
                    {/* Header */}
                    <div
                        style={{
                            padding: '16px 20px',
                            background: 'var(--secondary-color)',
                            color: 'white',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                        }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            {activeChatUser && (
                                <button
                                    onClick={() => setActiveChatUser(null)}
                                    style={{
                                        background: 'transparent',
                                        border: 'none',
                                        color: 'white',
                                        cursor: 'pointer',
                                        fontSize: '1.1rem',
                                        padding: '0 4px 0 0'
                                    }}
                                >
                                    ←
                                </button>
                            )}
                            <div>
                                <div style={{ fontWeight: '700', fontSize: '1rem' }}>
                                    {activeChatUser ? activeChatUser.split('@')[0] : 'Neighbour Messages'}
                                </div>
                                <div style={{ fontSize: '0.75rem', opacity: 0.8 }}>
                                    {activeChatUser ? 'Active Chat' : `${conversations.length} Active Threads`}
                                </div>
                            </div>
                        </div>
                        <button
                            onClick={() => {
                                setIsOpen(false);
                                setActiveChatUser(null);
                            }}
                            style={{
                                background: 'transparent',
                                border: 'none',
                                color: 'white',
                                cursor: 'pointer',
                                fontSize: '1.2rem',
                                padding: 0
                            }}
                        >
                            ✕
                        </button>
                    </div>

                    {/* Chat Body */}
                    <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column' }}>
                        {activeChatUser ? (
                            /* Messages Thread list */
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                {messages.length === 0 ? (
                                    <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '40px' }}>
                                        No messages yet. Say hello!
                                    </div>
                                ) : (
                                    messages.map((m) => {
                                        const isSender = m.sender === user.email;
                                        return (
                                            <div
                                                key={m.id || Math.random()}
                                                style={{
                                                    alignSelf: isSender ? 'flex-end' : 'flex-start',
                                                    maxWidth: '75%',
                                                    display: 'flex',
                                                    flexDirection: 'column',
                                                    alignItems: isSender ? 'flex-end' : 'flex-start'
                                                }}
                                            >
                                                <div
                                                    style={{
                                                        padding: '10px 14px',
                                                        borderRadius: isSender ? '16px 16px 2px 16px' : '16px 16px 16px 2px',
                                                        backgroundColor: isSender ? 'var(--primary-color)' : '#f1f5f9',
                                                        color: isSender ? 'white' : 'var(--secondary-color)',
                                                        fontSize: '0.9rem',
                                                        fontWeight: '500',
                                                        wordBreak: 'break-word',
                                                        boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
                                                    }}
                                                >
                                                    {m.content}
                                                </div>
                                                <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '4px', padding: '0 2px' }}>
                                                    {m.createdAt ? new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                                                </span>
                                            </div>
                                        );
                                    })
                                )}
                                <div ref={messagesEndRef} />
                            </div>
                        ) : (
                            /* Conversations List */
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                {conversations.length === 0 ? (
                                    <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '60px' }}>
                                        <span style={{ fontSize: '2.5rem', display: 'block', marginBottom: '8px' }}>📬</span>
                                        No conversations yet.<br />Message hosts directly from item pages.
                                    </div>
                                ) : (
                                    conversations.map((email) => (
                                        <div
                                            key={email}
                                            onClick={() => setActiveChatUser(email)}
                                            style={{
                                                padding: '12px 16px',
                                                borderRadius: '16px',
                                                border: '1px solid var(--border-color)',
                                                cursor: 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '12px',
                                                transition: 'all 0.2s ease',
                                                backgroundColor: '#fafafa'
                                            }}
                                            onMouseEnter={(e) => {
                                                e.currentTarget.style.backgroundColor = '#f1f5f9';
                                                e.currentTarget.style.transform = 'translateY(-1px)';
                                            }}
                                            onMouseLeave={(e) => {
                                                e.currentTarget.style.backgroundColor = '#fafafa';
                                                e.currentTarget.style.transform = 'none';
                                            }}
                                        >
                                            <div
                                                style={{
                                                    width: '40px',
                                                    height: '40px',
                                                    borderRadius: '50%',
                                                    backgroundColor: 'var(--secondary-color)',
                                                    color: 'white',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    fontWeight: '700',
                                                    fontSize: '0.9rem'
                                                }}
                                            >
                                                {email.charAt(0).toUpperCase()}
                                            </div>
                                            <div style={{ flex: 1 }}>
                                                <div style={{ fontWeight: '700', fontSize: '0.9rem', color: 'var(--secondary-color)' }}>
                                                    {email.split('@')[0]}
                                                </div>
                                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                    Click to view messaging history
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        )}
                    </div>

                    {/* Chat Footer (Inputs) */}
                    {activeChatUser && (
                        <form
                            onSubmit={handleSend}
                            style={{
                                padding: '12px 16px',
                                borderTop: '1px solid var(--border-color)',
                                display: 'flex',
                                gap: '10px',
                                backgroundColor: 'white'
                            }}
                        >
                            <input
                                placeholder="Type a message..."
                                value={inputMsg}
                                onChange={(e) => setInputMsg(e.target.value)}
                                style={{
                                    flex: 1,
                                    padding: '10px 16px',
                                    borderRadius: '30px',
                                    border: '1.5px solid var(--border-color)',
                                    outline: 'none',
                                    fontSize: '0.9rem',
                                    fontWeight: '500'
                                }}
                            />
                            <button
                                type="submit"
                                className="btn-primary"
                                style={{
                                    borderRadius: '50%',
                                    width: '38px',
                                    height: '38px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    padding: 0,
                                    minHeight: 'auto'
                                }}
                            >
                                ➔
                            </button>
                        </form>
                    )}
                </div>
            )}
        </div>
    );
};

export default ChatWidget;
