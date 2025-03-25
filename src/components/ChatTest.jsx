import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import './ChatTest.css';

const socket = io('http://localhost:5000', {
    withCredentials: true,
    autoConnect: false,
});

const ChatTest = () => {
    const { user, token } = useAuth();
    const senderId = user?.id;
    
    const [receiverId, setReceiverId] = useState('');
    const [users, setUsers] = useState([]);
    const [message, setMessage] = useState('');
    const [file, setFile] = useState(null);
    const [filePreview, setFilePreview] = useState(null);
    const [messages, setMessages] = useState([]);
    const [uploading, setUploading] = useState(false);
    const chatEndRef = useRef(null);

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const response = await axios.get('http://localhost:5000/api/auth/all', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setUsers(response.data);
            } catch (error) {
                console.error("Error fetching users:", error);
            }
        };
        if (token) fetchUsers();
    }, [token]);

    useEffect(() => {
        if (!senderId) return;

        if (!socket.connected) {
            socket.connect();
            console.log("✅ Connected to socket server:", socket.id);
        }

        socket.emit('join', senderId);
        console.log(`User ${senderId} joined socket server.`);

        socket.on('receiveMessage', (newMessage) => {
            setMessages((prev) => {
                if (!prev.some(msg => msg.id === newMessage.id)) {
                    return [...prev, newMessage];
                }
                return prev;
            });
        });

        return () => {
            socket.off('receiveMessage');
            if (socket.connected) {
                socket.disconnect();
                console.log('🔌 Socket disconnected!');
            }
        };
    }, [senderId]);

    useEffect(() => {
        if (!senderId || !receiverId || !token) return;

        const fetchMessages = async () => {
            try {
                const response = await axios.get(`http://localhost:5000/api/messages/${senderId}/${receiverId}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setMessages(response.data);
            } catch (error) {
                console.error("Error fetching messages:", error);
            }
        };

        fetchMessages();
    }, [receiverId, senderId, token]);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleSelectUser = (userId) => {
        if (userId !== senderId) {
            setReceiverId(userId);
        } else {
            alert("You cannot chat with yourself!");
        }
    };

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile) {
            setFile(selectedFile);
            setFilePreview(URL.createObjectURL(selectedFile));
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    const sendMessage = async () => {
        if (!senderId || !receiverId) {
            alert("Please select a user to chat with.");
            return;
        }

        if (!message.trim() && !file) {
            return;
        }

        let mediaUrl = '';
        if (file) {
            setUploading(true);
            const formData = new FormData();
            formData.append('file', file);
            try {
                const response = await axios.post('http://localhost:5000/api/upload', formData, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                mediaUrl = response.data.fileUrl;
            } catch (error) {
                console.error("Error uploading file:", error);
                alert("Failed to upload media.");
                setUploading(false);
                return;
            }
            setUploading(false);
        }

        const newMessage = {
            senderId,
            receiverId,
            message: mediaUrl ? '' : message.trim(),
            messageType: file ? 'media' : 'text',
            mediaUrl,
            createdAt: new Date().toISOString(),
        };

        socket.emit('sendMessage', newMessage);
        setMessages((prev) => [...prev, { ...newMessage, id: Date.now() }]);
        setMessage('');
        setFile(null);
        setFilePreview(null);
    };

    return (
        <div className="chat-test-container">
            <div className="chat-test-sidebar">
                <h3 className="chat-test-sidebar-title">Contacts</h3>
                <div className="chat-test-user-list">
                    {users.map((user) => (
                        <div
                            key={user.id}
                            className={`chat-test-user-item ${receiverId === user.id ? 'active' : ''}`}
                            onClick={() => handleSelectUser(user.id)}
                        >
                            <div className="chat-test-user-avatar">
                                {user.username.charAt(0).toUpperCase()}
                            </div>
                            <div className="chat-test-user-info">
                                <span className="chat-test-username">{user.username}</span>
                                <span className="chat-test-useremail">{user.email}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="chat-test-box">
                {receiverId ? (
                    <>
                        <div className="chat-test-header">
                            {users.find(u => u.id === receiverId)?.username || 'Chat'}
                        </div>
                        <div className="chat-test-messages">
                            {messages.length === 0 ? (
                                <div className="chat-test-no-messages">
                                    No messages yet. Start the conversation!
                                </div>
                            ) : (
                                messages.map((msg, index) => (
                                    <div key={index} className={`chat-test-message ${msg.senderId === senderId ? 'sent' : 'received'}`}>
                                        {msg.messageType === 'text' && <p className="chat-test-message-text">{msg.message}</p>}
                                        {msg.messageType === 'media' && msg.mediaUrl && (
                                            <img 
                                                src={`http://localhost:5000${msg.mediaUrl}`} 
                                                alt="Sent media" 
                                                className="chat-test-message-media" 
                                                onLoad={() => chatEndRef.current?.scrollIntoView({ behavior: "smooth" })}
                                            />
                                        )}
                                        <small className="chat-test-message-time">
                                            {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </small>
                                    </div>
                                ))
                            )}
                            <div ref={chatEndRef} className="chat-test-end-ref"></div>
                        </div>

                        <div className="chat-test-input-area">
                            {filePreview && (
                                <div className="chat-test-preview-container">
                                    <img src={filePreview} alt="Preview" className="chat-test-preview-image" />
                                    <button 
                                        className="chat-test-cancel-preview"
                                        onClick={() => {
                                            setFile(null);
                                            setFilePreview(null);
                                        }}
                                    >
                                        ×
                                    </button>
                                </div>
                            )}
                            <div className="chat-test-input-wrapper">
                                <input
                                    type="text"
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    onKeyPress={handleKeyPress}
                                    placeholder="Type a message..."
                                    className="chat-test-message-input"
                                    disabled={uploading}
                                />
                                <label className="chat-test-file-label">
                                    <input 
                                        type="file" 
                                        onChange={handleFileChange} 
                                        className="chat-test-file-input" 
                                        accept="image/*"
                                        disabled={uploading}
                                    />
                                    <span className="chat-test-file-icon">📎</span>
                                </label>
                                <button 
                                    onClick={sendMessage} 
                                    className="chat-test-send-button"
                                    disabled={uploading || (!message.trim() && !file)}
                                >
                                    {uploading ? 'Sending...' : 'Send'}
                                </button>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="chat-test-welcome-screen">
                        <div className="chat-test-welcome-content">
                            <h2>Welcome to Chat</h2>
                            <p>Select a contact to start messaging</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ChatTest;