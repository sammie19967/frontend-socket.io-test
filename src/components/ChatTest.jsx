import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';

const socket = io('http://localhost:5000'); // Update with your backend URL if needed

const ChatTest = () => {
    const [userId, setUserId] = useState(''); // Current logged-in user ID
    const [receiverId, setReceiverId] = useState(''); // Receiver user ID
    const [message, setMessage] = useState('');
    const [messages, setMessages] = useState([]);

    useEffect(() => {
        if (userId) {
            socket.emit('join', userId);
        }
    }, [userId]);

    useEffect(() => {
        socket.on('receiveMessage', (msg) => {
            setMessages((prevMessages) => [...prevMessages, msg]);
        });

        return () => {
            socket.off('receiveMessage');
        };
    }, []);

    const sendMessage = () => {
        if (message.trim() && userId && receiverId) {
            const newMessage = { senderId: userId, receiverId, message, messageType: 'text', mediaUrl: '' };
            socket.emit('sendMessage', newMessage);
            setMessages((prevMessages) => [...prevMessages, newMessage]);
            setMessage('');
        }
    };

    return (
        <div style={{ padding: '20px', width: '400px', border: '1px solid black' }}>
            <h3>Chat Test Interface</h3>
            <label>User ID:</label>
            <input type="text" value={userId} onChange={(e) => setUserId(e.target.value)} placeholder="Your User ID" />
            <br />
            <label>Receiver ID:</label>
            <input type="text" value={receiverId} onChange={(e) => setReceiverId(e.target.value)} placeholder="Receiver User ID" />
            <br />
            <label>Message:</label>
            <input type="text" value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Type a message" />
            <button onClick={sendMessage}>Send</button>
            
            <h4>Chat Messages</h4>
            <div style={{ border: '1px solid gray', height: '200px', overflowY: 'scroll' }}>
                {messages.map((msg, index) => (
                    <p key={index}><strong>{msg.senderId}</strong>: {msg.message}</p>
                ))}
            </div>
        </div>
    );
};

export default ChatTest;
