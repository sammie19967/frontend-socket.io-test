import React, { useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from '../context/AuthContext'; // Use the correct hook from AuthContext

const socket = io('http://localhost:5000'); // Replace with your backend URL

const Livestream = () => {
    const { user } = useAuth(); // Get the logged-in user from AuthContext
    const [streams, setStreams] = useState([]); // List of active streams
    const [streaming, setStreaming] = useState(false); // Whether the user is currently streaming
    const [currentStream, setCurrentStream] = useState(null); // The stream the user is currently viewing
    const [comment, setComment] = useState(''); // Comment input
    const videoRef = useRef(null); // Video element for the livestream
    const streamRef = useRef(null); // Media stream object

    // Fetch active streams when the component mounts
    useEffect(() => {
        socket.on('activeStreams', (activeStreams) => {
            setStreams(activeStreams);
        });

        socket.on('updateLiveStream', (update) => {
            console.log('Live stream update:', update);
        });

        return () => {
            socket.off('activeStreams');
            socket.off('updateLiveStream');
        };
    }, []);

    // Start a livestream
    const startStream = async () => {
        if (!user) return alert('You must be logged in to start a livestream.');
        if (streaming) return alert('You are already streaming.');

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            videoRef.current.srcObject = stream;
            videoRef.current.play();
            streamRef.current = stream;

            socket.emit('startStream', { userId: user.id, title: `${user.username}'s Live` });
            setStreaming(true);
        } catch (error) {
            console.error('Error accessing camera/microphone:', error);
            alert('Failed to access camera or microphone.');
        }
    };

    // End the livestream
    const endStream = () => {
        if (!streaming) return;
        socket.emit('endStream', { userId: user.id });
        setStreaming(false);
        if (streamRef.current) {
            streamRef.current.getTracks().forEach((track) => track.stop());
        }
    };

    // Join a livestream
    const joinStream = (streamId) => {
        socket.emit('joinStream', { userId: user.id, streamId });
        setCurrentStream(streamId);
    };

    // Leave a livestream
    const leaveStream = () => {
        if (!currentStream) return;
        socket.emit('leaveStream', { userId: user.id, streamId: currentStream });
        setCurrentStream(null);
    };

    // Like a livestream
    const likeStream = (streamId) => {
        socket.emit('likeStream', { userId: user.id, streamId });
    };

    // Comment on a livestream
    const commentStream = (streamId) => {
        if (!comment.trim()) return;
        socket.emit('commentStream', { userId: user.id, streamId, comment });
        setComment('');
    };

    return (
        <div>
            <h2>Livestream</h2>

            {/* Video Preview */}
            <div>
                <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    style={{ width: '100%', maxHeight: '400px', backgroundColor: '#000' }}
                />
            </div>

            {/* Start/End Stream Buttons */}
            {streaming ? (
                <button onClick={endStream}>End Livestream</button>
            ) : (
                <button onClick={startStream}>Start Livestream</button>
            )}

            {/* Active Streams */}
            <h3>Active Streams</h3>
            <ul>
                {streams.map((stream) => (
                    <li key={stream.id}>
                        <strong>{stream.title}</strong>
                        <button onClick={() => joinStream(stream.id)}>Join</button>
                        <button onClick={() => likeStream(stream.id)}>Like</button>
                        <button onClick={() => commentStream(stream.id)}>Comment</button>
                    </li>
                ))}
            </ul>

            {/* Comment Input */}
            {currentStream && (
                <div>
                    <h4>Comment on Stream</h4>
                    <input
                        type="text"
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        placeholder="Write a comment..."
                    />
                    <button onClick={() => commentStream(currentStream)}>Send</button>
                    <button onClick={leaveStream}>Leave Stream</button>
                </div>
            )}
        </div>
    );
};

export default Livestream;
