import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import axios from 'axios';

const socket = io('http://localhost:5000');

const ChatTest = () => {
    const [senderId, setSenderId] = useState('1'); // Replace with logged-in user ID
    const [receiverId, setReceiverId] = useState('');
    const [users, setUsers] = useState([]);
    const [message, setMessage] = useState('');
    const [file, setFile] = useState(null);
    const [filePreview, setFilePreview] = useState(null);
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

    // Select a contact to chat with
    const handleSelectUser = (userId) => {
        if (userId !== senderId) {
            setReceiverId(userId);
            console.log("Selected Receiver ID:", userId);
        } else {
            alert("You cannot chat with yourself!");
        }
    };

    // Handle file selection
    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile) {
            setFile(selectedFile);
            setFilePreview(URL.createObjectURL(selectedFile));
        }
    };

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
            timestamp: new Date().toISOString(),
        };

        socket.emit('sendMessage', newMessage);
        setMessages((prev) => [...prev, newMessage]); // Update UI instantly
        setMessage('');
        setFile(null);
        setFilePreview(null);
    };

    return (
        <div className="chat-container">
            {/* Sidebar for Contacts */}
            <div className="sidebar">
                <h3>Contacts</h3>
                {users.map((user) => (
                    <div 
                        key={user.id} 
                        className={`user-item ${receiverId === user.id ? 'active' : ''}`}
                        onClick={() => handleSelectUser(user.id)}
                        style={{
                            padding: "10px",
                            cursor: "pointer",
                            backgroundColor: receiverId === user.id ? "#ddd" : "transparent",
                            borderBottom: "1px solid #ccc",
                        }}
                    >
                        {user.username} ({user.email})
                    </div>
                ))}
            </div>

            {/* Chat Box */}
            <div className="chat-box">
                {receiverId ? (
                    <>
                        <div className="messages">
                            {messages
                                .filter((msg) => (msg.senderId === senderId && msg.receiverId === receiverId) || 
                                                 (msg.senderId === receiverId && msg.receiverId === senderId))
                                .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
                                .map((msg, index) => (
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
                                            <span className="timestamp">{new Date(msg.timestamp).toLocaleTimeString()}</span>
                                        </div>
                                    </div>
                                ))}
                            <div ref={chatEndRef}></div>
                        </div>

                        {/* Input Area */}
                        <div className="input-area">
                            <input 
                                type="text" 
                                value={message} 
                                onChange={(e) => setMessage(e.target.value)} 
                                placeholder="Type a message..." 
                                disabled={uploading}
                            />
                            
                            <input type="file" onChange={handleFileChange} />
                            
                            {/* File Preview */}
                            {filePreview && (
                                <div className="file-preview">
                                    {file.type.startsWith("image") ? (
                                        <img src={filePreview} alt="Preview" width="100" />
                                    ) : (
                                        <p>Selected File: {file.name}</p>
                                    )}
                                </div>
                            )}

                            {uploading && <span className="spinner">Uploading...</span>}
                            
                            <button onClick={sendMessage} disabled={!message && !file}>
                                Send
                            </button>
                        </div>
                    </>
                ) : (
                    <p>Select a user to start chatting</p>
                )}
            </div>
        </div>
    );
};

export default ChatTest;
