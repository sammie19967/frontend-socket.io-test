import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import axios from 'axios';
import { useAuth } from '../context/AuthContext'; // Import auth context

// ✅ Create socket OUTSIDE the component, only ONCE
const socket = io('http://localhost:5000', {
    withCredentials: true,
    autoConnect: false, // Prevent auto-connection
});

const ChatTest = () => {
    const { user } = useAuth(); // Get logged-in user
    const senderId = user?.id;
    const [receiverId, setReceiverId] = useState('');
    const [users, setUsers] = useState([]);
    const [message, setMessage] = useState('');
    const [file, setFile] = useState(null);
    const [filePreview, setFilePreview] = useState(null);
    const [messages, setMessages] = useState([]);
    const [uploading, setUploading] = useState(false);
    const chatEndRef = useRef(null);

    // 🔥 1. Fetch all users
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

    // 🔥 2. Connect to socket when senderId is available
    useEffect(() => {
        if (senderId) {
            if (!socket.connected) {
                socket.connect();
                console.log("✅ Connected to socket server:", socket.id);
            }

            socket.emit('join', senderId);
            console.log(`User ${senderId} joined socket server.`);

            socket.on('receiveMessage', (newMessage) => {
                console.log("📩 New message received:", newMessage);
                setMessages((prev) => [...prev, newMessage]);
            });

            socket.on('messageSent', (msg) => {
                console.log("✅ Message sent acknowledgment:", msg);
            });

            socket.on('connect_error', (err) => {
                console.error('❌ Connection error:', err.message);
            });
        }

        // Clean up on component unmount / reload
        return () => {
            if (socket.connected) {
                socket.disconnect();
                console.log('🔌 Socket disconnected!');
            }
        };
    }, [senderId]);

    // 🔥 3. Fetch previous messages when receiver selected
    useEffect(() => {
        if (senderId && receiverId) {
            const fetchMessages = async () => {
                try {
                    const response = await axios.get(`http://localhost:5000/api/messages/${senderId}/${receiverId}`);
                    setMessages(response.data);
                } catch (error) {
                    console.error("Error fetching messages:", error);
                }
            };
            fetchMessages();
        }
    }, [receiverId, senderId]);

    // 🔥 4. Auto-scroll to latest message
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

    const sendMessage = async () => {
        if (!senderId || !receiverId) {
            alert("Please select a user to chat with.");
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

        socket.emit('sendMessage', newMessage); // Emit message

        // Immediately show it
        setMessages((prev) => [...prev, newMessage]);
        setMessage('');
        setFile(null);
        setFilePreview(null);
    };

    return (
        <div className="chat-container" style={{ display: 'flex' }}>
            <div className="sidebar" style={{ width: "250px", borderRight: "1px solid gray" }}>
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

            <div className="chat-box" style={{ flexGrow: 1, padding: "10px" }}>
                {receiverId ? (
                    <>
                        <div className="messages" style={{ height: "400px", overflowY: "auto", border: "1px solid #ccc", padding: "10px" }}>
                            {messages.map((msg, index) => (
                                <div key={index} style={{ marginBottom: "10px", textAlign: msg.senderId === senderId ? 'right' : 'left' }}>
                                    {msg.messageType === 'text' && <p>{msg.message}</p>}
                                    {msg.messageType === 'media' && msg.mediaUrl && (
                                        <img src={`http://localhost:5000${msg.mediaUrl}`} alt="Sent media" width="150" />
                                    )}
                                    <small style={{ fontSize: "10px", color: "gray" }}>{new Date(msg.timestamp).toLocaleTimeString()}</small>
                                </div>
                            ))}
                            <div ref={chatEndRef}></div>
                        </div>

                        <div className="input-area" style={{ marginTop: "10px" }}>
                            <input
                                type="text"
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                placeholder="Type a message..."
                                style={{ width: "80%", padding: "5px" }}
                            />
                            <input type="file" onChange={handleFileChange} />
                            <button onClick={sendMessage} style={{ padding: "5px 10px" }}>Send</button>
                            {uploading && <p>Uploading...</p>}
                        </div>
                    </>
                ) : <p>Select a user to start chatting</p>}
            </div>
        </div>
    );
};

export default ChatTest;
