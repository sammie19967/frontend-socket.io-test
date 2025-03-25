import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/authContext';
import io from 'socket.io-client';

const LiveStream = () => {
    const { user, token } = useAuth();
    const [stream, setStream] = useState(null);
    const [messages, setMessages] = useState([]);
    const [message, setMessage] = useState('');
    const videoRef = useRef(null);
    const socketRef = useRef(null);

    useEffect(() => {
        if (!user || !token) {
            console.log('User not authenticated');
            return;
        }

        socketRef.current = io('http://localhost:5000', {
            auth: { token }
        });

        navigator.mediaDevices.getUserMedia({ video: true, audio: true })
            .then((stream) => {
                setStream(stream);
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                }
                socketRef.current.emit('startStream', { userId: user.id });
            })
            .catch((err) => console.error('Error accessing media devices:', err));

        socketRef.current.on('newComment', (newMessage) => {
            setMessages((prevMessages) => [...prevMessages, newMessage]);
        });

        return () => {
            if (socketRef.current) {
                socketRef.current.disconnect();
            }
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }
        };
    }, [user, token]);

    const sendMessage = () => {
        if (message.trim() && socketRef.current) {
            const newMessage = { userId: user.id, text: message };
            socketRef.current.emit('sendComment', newMessage);
            setMessage('');
        }
    };

    return (
        <div>
            <h1>Live Stream</h1>
            {stream ? (
                <video ref={videoRef} autoPlay playsInline muted />
            ) : (
                <p>Loading stream...</p>
            )}
            <div>
                <input 
                    type="text" 
                    value={message} 
                    onChange={(e) => setMessage(e.target.value)} 
                    placeholder="Type a comment..."
                />
                <button onClick={sendMessage}>Send</button>
            </div>
            <div>
                {messages.map((msg, index) => (
                    <p key={index}>{msg.userId}: {msg.text}</p>
                ))}
            </div>
        </div>
    );
};

export default LiveStream;
