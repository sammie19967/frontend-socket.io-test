import { useEffect, useState, useRef } from 'react';
import io from 'socket.io-client';
import '../styles/LiveStream.css';

const socket = io('http://localhost:5000');

export default function LiveStream() {
    const [liveStreams, setLiveStreams] = useState([]);
    const [streaming, setStreaming] = useState(false);
    const [currentStream, setCurrentStream] = useState(null);
    const [comment, setComment] = useState('');
    const [comments, setComments] = useState([]);
    const [likes, setLikes] = useState(0);
    const [permissionGranted, setPermissionGranted] = useState(false);
    const [streamError, setStreamError] = useState(null);

    const videoRef = useRef(null);

    useEffect(() => {
        socket.emit('getLiveStreams');
        socket.on('updateLiveStreams', (streams) => setLiveStreams(streams));
        socket.on('newComment', (newComment) => setComments((prev) => [...prev, newComment]));
        socket.on('updateLikes', (likeCount) => setLikes(likeCount));

        return () => {
            socket.off('updateLiveStreams');
            socket.off('newComment');
            socket.off('updateLikes');
            if (currentStream?.stream) {
                currentStream.stream.getTracks().forEach(track => track.stop());
            }
        };
    }, [currentStream]);

    const startStream = async () => {
        try {
            setStreamError(null);
            const stream = await navigator.mediaDevices.getUserMedia({ 
                video: {
                    width: { ideal: 1280 },
                    height: { ideal: 720 },
                    facingMode: "user"
                },
                audio: true
            });

            console.log('Stream obtained:', stream);
            console.log('Video tracks:', stream.getVideoTracks());
            console.log('Audio tracks:', stream.getAudioTracks());

            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                videoRef.current.muted = true;
                
                try {
                    await videoRef.current.play();
                    console.log('Video playback started');
                    setPermissionGranted(true);
                    setCurrentStream({ 
                        streamId: Date.now(), 
                        isHost: true, 
                        stream 
                    });
                    setStreaming(true);
                    socket.emit('startLive', { streamId: Date.now() });
                } catch (playError) {
                    console.error('Play failed:', playError);
                    setStreamError('Video playback blocked. Click anywhere to start.');
                    document.addEventListener('click', async () => {
                        try {
                            await videoRef.current.play();
                            setStreamError(null);
                            setPermissionGranted(true);
                            setCurrentStream({ 
                                streamId: Date.now(), 
                                isHost: true, 
                                stream 
                            });
                            setStreaming(true);
                            socket.emit('startLive', { streamId: Date.now() });
                        } catch (err) {
                            console.error('Still failed:', err);
                            setStreamError('Failed to start video. Please refresh and try again.');
                        }
                    }, { once: true });
                }
            }
        } catch (error) {
            console.error('Media access error:', error);
            setStreamError(`Error: ${error.message}`);
            if (error.name === 'NotAllowedError') {
                setStreamError('Please allow camera and microphone access');
            }
        }
    };

    const stopStream = () => {
        if (currentStream?.isHost) {
            socket.emit('stopLive', { streamId: currentStream.streamId });
            currentStream.stream.getTracks().forEach(track => track.stop());
            setStreaming(false);
            setCurrentStream(null);
        }
    };

    const joinStream = (streamId) => {
        setCurrentStream({ streamId, isHost: false });
    };

    const sendComment = () => {
        if (comment && currentStream) {
            socket.emit('sendComment', { 
                streamId: currentStream.streamId, 
                comment 
            });
            setComment('');
        }
    };

    const sendLike = () => {
        if (currentStream) {
            socket.emit('sendLike', { streamId: currentStream.streamId });
        }
    };

    return (
        <div className="live-stream-container">
            <h1 className="live-stream-title">Live Streaming</h1>

            {streamError && (
                <div className="error-message">
                    {streamError}
                    {streamError.includes('click') && (
                        <button 
                            onClick={() => document.dispatchEvent(new Event('click'))}
                            className="retry-button"
                        >
                            Click Here
                        </button>
                    )}
                </div>
            )}

            {!streaming ? (
                <button 
                    onClick={startStream} 
                    className="start-stream-btn"
                    disabled={streamError}
                >
                    {permissionGranted ? 'Go Live Again' : 'Start Live Stream'}
                </button>
            ) : (
                <div className="stream-controls">
                    <div className="stream-status">
                        <span className="live-indicator">🔴 LIVE</span>
                        <span className="stream-id">Stream ID: {currentStream?.streamId}</span>
                    </div>
                    <button onClick={stopStream} className="stop-stream-btn">
                        End Stream
                    </button>
                </div>
            )}

            <div className="streams-section">
                <h2 className="section-title">Active Streams</h2>
                {liveStreams.length === 0 ? (
                    <p className="no-streams">No active streams</p>
                ) : (
                    liveStreams.map((stream) => (
                        <div key={stream.streamId} className="stream-card">
                            <p className="stream-id">🔴 Stream ID: {stream.streamId}</p>
                            <button 
                                onClick={() => joinStream(stream.streamId)} 
                                className="join-stream-btn"
                            >
                                Join Stream
                            </button>
                        </div>
                    ))
                )}
            </div>

            <div className="video-section">
                <div className="video-container">
                    <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted={currentStream?.isHost}
                        className="live-video"
                        onClick={() => {
                            if (videoRef.current?.muted) {
                                videoRef.current.muted = false;
                            }
                        }}
                    />
                    {!streaming && (
                        <div className="video-placeholder">
                            {permissionGranted ? 'Camera ready' : 'Camera preview will appear here'}
                        </div>
                    )}
                </div>

                {currentStream && (
                    <div className="interaction-panel">
                        <div className="chat-section">
                            <h3 className="chat-title">Live Chat</h3>
                            <div className="comments-box">
                                {comments.length === 0 ? (
                                    <p className="no-comments">No comments yet</p>
                                ) : (
                                    comments.map((c, i) => (
                                        <div key={i} className="comment">
                                            <span className="comment-user">User:</span>
                                            <span className="comment-text">{c}</span>
                                        </div>
                                    ))
                                )}
                            </div>
                            <div className="comment-input-area">
                                <input
                                    type="text"
                                    value={comment}
                                    onChange={(e) => setComment(e.target.value)}
                                    placeholder="Type a comment..."
                                    className="comment-input"
                                />
                                <button 
                                    onClick={sendComment} 
                                    className="send-comment-btn"
                                    disabled={!comment}
                                >
                                    Send
                                </button>
                                <button onClick={sendLike} className="like-btn">
                                    ❤️ {likes}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}