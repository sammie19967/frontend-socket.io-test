import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import axios from 'axios';
import './ChatTest.css'; // Ensure this file is imported

const socket = io('http://localhost:5000');

const ChatTest = () => {
    const [senderId, setSenderId] = useState('');
    const [receiverId, setReceiverId] = useState('');
    const [users, setUsers] = useState([]);
    const [message, setMessage] = useState('');
    const [file, setFile] = useState(null);
    const [messages, setMessages] = useState([]);
    const [uploading, setUploading] = useState(false);
    const chatEndRef = useRef(null);

    // Fetch all users
    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const response = await axios.get('http://localhost:5000/api/auth/all');
                setUsers(response.data);
            } catch (error) {
                console.error("Error fetching users:", error);
            }
        };
        fetchUsers();
    }, []);

    // Listen for new messages
    useEffect(() => {
        socket.on('receiveMessage', (newMessage) => {
            setMessages((prev) => [...prev, newMessage]);
        });

        return () => socket.off('receiveMessage');
    }, []);

    // Auto-scroll to latest message
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    // Handle sending messages
    const sendMessage = async () => {
        if (!senderId || !receiverId) {
            alert("Please select both sender and receiver.");
            return;
        }

        let mediaUrl = '';
        if (file) {
            setUploading(true);
            const formData = new FormData();
            formData.append('file', file);
            try {
                const response = await axios.post('http://localhost:5000/api/upload', formData);
                mediaUrl = response.data.fileUrl;
            } catch (error) {
                console.error("Error uploading file:", error);
                alert("Failed to upload media.");
            }
            setUploading(false);
        }

        const newMessage = {
            senderId,
            receiverId,
            message: mediaUrl ? '' : message,
            messageType: file ? 'media' : 'text',
            mediaUrl,
        };

        socket.emit('sendMessage', newMessage);
        setMessages((prev) => [...prev, newMessage]); // Update UI instantly
        setMessage('');
        setFile(null);
    };

    return (
        <div className="chat-container">
            <div className="sidebar">
                <h3>Contacts</h3>
                {users.map((user) => (
                    <div 
                        key={user.id} 
                        className={`user-item ${receiverId === user.id ? 'active' : ''}`}
                        onClick={() => setReceiverId(user.id)}
                    >
                        {user.username} ({user.email})
                    </div>
                ))}
            </div>

            <div className="chat-box">
                <div className="messages">
                    {messages.map((msg, index) => (
                        <div key={index} className={`message ${msg.senderId === senderId ? 'sent' : 'received'}`}>
                            <div className="message-content">
                                {msg.messageType === 'text' && <p>{msg.message}</p>}
                                {msg.messageType === 'media' && msg.mediaUrl && (
                                    msg.mediaUrl.endsWith('.mp4') ? (
                                        <video width="200" controls>
                                            <source src={`http://localhost:5000${msg.mediaUrl}`} type="video/mp4" />
                                        </video>
                                    ) : (
                                        <img src={`http://localhost:5000${msg.mediaUrl}`} alt="Sent media" width="150" />
                                    )
                                )}
                                <span className="timestamp">Now</span>
                            </div>
                        </div>
                    ))}
                    <div ref={chatEndRef}></div>
                </div>

                <div className="input-area">
                    <input 
                        type="text" 
                        value={message} 
                        onChange={(e) => setMessage(e.target.value)} 
                        placeholder="Type a message..." 
                    />
                    <input type="file" onChange={(e) => setFile(e.target.files[0])} />
                    {uploading && <span className="spinner">Uploading...</span>}
                    <button onClick={sendMessage} disabled={!receiverId || uploading}>Send</button>
                </div>
            </div>
        </div>
    );
};

export default ChatTest;
