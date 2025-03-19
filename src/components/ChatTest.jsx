import React, { useState } from 'react';
import { io } from 'socket.io-client';
import axios from 'axios';

const socket = io('http://localhost:5000');

const ChatTest = ({ userId, receiverId }) => {
    const [message, setMessage] = useState('');
    const [file, setFile] = useState(null);

    const sendMessage = async () => {
        let mediaUrl = '';

        // Upload file if selected
        if (file) {
            const formData = new FormData();
            formData.append('file', file);
            try {
                const response = await axios.post('http://localhost:5000/api/upload', formData);
                mediaUrl = response.data.fileUrl;
            } catch (error) {
                console.error("Error uploading file:", error);
            }
        }

        // Send message
        socket.emit('sendMessage', {
            senderId: userId,
            receiverId,
            message: mediaUrl ? '' : message,  // If media is sent, no need for text
            messageType: file ? 'media' : 'text',
            mediaUrl
        });

        setMessage('');
        setFile(null);
    };

    return (
        <div>
            <input 
                type="text" 
                value={message} 
                onChange={(e) => setMessage(e.target.value)} 
                placeholder="Type a message..." 
            />
            <input 
                type="file" 
                onChange={(e) => setFile(e.target.files[0])} 
            />
            <button onClick={sendMessage}>Send</button>
        </div>
    );
};

export default ChatTest;
