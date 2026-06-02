import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useAuth } from '../store/authStore';
import axiosClient from '../api/axiosClient';

const ChatContext = createContext();

export const ChatProvider = ({ children }) => {
    const { user } = useAuth();
    const [conversations, setConversations] = useState([]);
    const [activeChatUser, setActiveChatUser] = useState(null);
    const [messages, setMessages] = useState([]);
    const [isConnected, setIsConnected] = useState(false);
    
    const socketRef = useRef(null);
    const reconnectTimeoutRef = useRef(null);

    // Fetch conversation list
    const fetchConversations = async () => {
        if (!user) return;
        try {
            const response = await axiosClient.get('/messages/conversations');
            setConversations(response.data);
        } catch (e) {
            console.error("Failed to load conversations", e);
        }
    };

    // Fetch history for active user
    const fetchHistory = async (email) => {
        try {
            const response = await axiosClient.get(`/messages/history/${email}`);
            setMessages(response.data);
        } catch (e) {
            console.error("Failed to load history", e);
        }
    };

    // Load initial conversation list
    useEffect(() => {
        if (user) {
            fetchConversations();
        } else {
            setConversations([]);
            setMessages([]);
            setActiveChatUser(null);
            if (socketRef.current) {
                socketRef.current.close();
            }
        }
    }, [user]);

    // Load history when active user changes
    useEffect(() => {
        if (activeChatUser) {
            fetchHistory(activeChatUser);
        } else {
            setMessages([]);
        }
    }, [activeChatUser]);

    // WebSocket connection management
    useEffect(() => {
        if (!user) return;

        const connect = () => {
            if (socketRef.current && (socketRef.current.readyState === WebSocket.OPEN || socketRef.current.readyState === WebSocket.CONNECTING)) {
                return;
            }

            const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
            // Base URL port mapping fallback
            const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8152';
            const host = baseUrl.replace(/^https?:\/\//, '');
            const wsUrl = `${protocol}//${host}/chat?token=${user.token}`;

            const ws = new WebSocket(wsUrl);
            socketRef.current = ws;

            ws.onopen = () => {
                setIsConnected(true);
                console.log("Connected to Chat WebSocket");
            };

            ws.onmessage = (event) => {
                try {
                    const msg = JSON.parse(event.data);
                    // Add message if it is part of active conversation
                    if ((msg.sender === activeChatUser && msg.recipient === user.email) ||
                        (msg.sender === user.email && msg.recipient === activeChatUser)) {
                        setMessages((prev) => [...prev, msg]);
                    }
                    
                    // Refresh conversations list if new user messaged
                    fetchConversations();
                } catch (e) {
                    console.error("Error parsing message payload", e);
                }
            };

            ws.onclose = () => {
                setIsConnected(false);
                console.log("Chat WebSocket disconnected. Reconnecting in 5s...");
                reconnectTimeoutRef.current = setTimeout(connect, 5000);
            };

            ws.onerror = (err) => {
                console.error("WebSocket error", err);
                ws.close();
            };
        };

        connect();

        return () => {
            if (socketRef.current) {
                socketRef.current.close();
            }
            if (reconnectTimeoutRef.current) {
                clearTimeout(reconnectTimeoutRef.current);
            }
        };
    }, [user, activeChatUser]);

    // Send text message helper
    const sendMessage = (recipientEmail, content) => {
        if (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) {
            console.error("WebSocket is not connected");
            return;
        }

        const payload = {
            recipient: recipientEmail,
            content: content
        };

        socketRef.current.send(JSON.stringify(payload));
        
        // Optimistically add recipient to conversations list if not present
        if (!conversations.includes(recipientEmail)) {
            setConversations(prev => [...prev, recipientEmail]);
        }
    };

    return (
        <ChatContext.Provider value={{
            conversations,
            activeChatUser,
            setActiveChatUser,
            messages,
            isConnected,
            sendMessage,
            refreshConversations: fetchConversations
        }}>
            {children}
        </ChatContext.Provider>
    );
};

export const useChat = () => useContext(ChatContext);
