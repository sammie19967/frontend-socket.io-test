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
    const [viewers, setViewers] = useState(0);
    const [permissionGranted, setPermissionGranted] = useState(false);
    const [streamError, setStreamError] = useState(null);
    const [hasLiked, setHasLiked] = useState(false);
    const [streamDuration, setStreamDuration] = useState(0);

    const videoRef = useRef(null);
    const commentEndRef = useRef(null);
    const durationInterval = useRef(null);

    // Scroll to bottom of comments
    useEffect(() => {
        commentEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [comments]);

    // Format duration (seconds to HH:MM:SS)
    const formatDuration = (seconds) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = Math.floor(seconds % 60);
        return [h, m, s].map(v => v < 10 ? "0" + v : v).join(":");
    };

    useEffect(() => {
        // Get initial stream list
        socket.emit('getLiveStreams');
        
        // Listen for stream updates
        socket.on('streamListUpdated', (streams) => {
            setLiveStreams(streams);
        });

        // Handle stream updates (viewers, likes, comments)
        socket.on('streamUpdate', ({ viewers, likes, comments }) => {
            setViewers(viewers);
            setLikes(likes);
            setComments(comments);
        });

        // Handle new comments
        socket.on('receiveComment', (newComment) => {
            setComments(prev => [...prev, newComment]);
        });

        // Handle like updates
        socket.on('updateLikes', (likeCount) => {
            setLikes(likeCount);
        });

        // Handle stream ending
        socket.on('streamEnded', () => {
            if (videoRef.current?.srcObject) {
                videoRef.current.srcObject.getTracks().forEach(track => track.stop());
            }
            if (durationInterval.current) {
                clearInterval(durationInterval.current);
            }
            setStreaming(false);
            setCurrentStream(null);
            setStreamDuration(0);
        });

        // Clean up
        return () => {
            if (streaming && currentStream?.isHost) {
                socket.emit('endStream', { streamId: currentStream.streamId });
            }
            socket.off('streamListUpdated');
            socket.off('streamUpdate');
            socket.off('receiveComment');
            socket.off('updateLikes');
            socket.off('streamEnded');
            if (durationInterval.current) {
                clearInterval(durationInterval.current);
            }
        };
    }, [streaming, currentStream]);

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

            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                videoRef.current.muted = true;
                
                try {
                    await videoRef.current.play();
                    setPermissionGranted(true);
                    
                    const streamId = `stream_${Date.now()}`;
                    const hostId = socket.id;
                    
                    setCurrentStream({ 
                        streamId,
                        isHost: true, 
                        stream,
                        hostId
                    });
                    setStreaming(true);
                    
                    // Start tracking stream duration
                    const startTime = new Date();
                    durationInterval.current = setInterval(() => {
                        setStreamDuration(Math.floor((new Date() - startTime) / 1000));
                    }, 1000);
                    
                    socket.emit('startStream', { 
                        hostId, 
                        streamId 
                    });
                } catch (playError) {
                    console.error('Play failed:', playError);
                    setStreamError('Video playback blocked. Click anywhere to start.');
                    document.addEventListener('click', async () => {
                        try {
                            await videoRef.current.play();
                            setStreamError(null);
                            setPermissionGranted(true);
                            
                            const streamId = `stream_${Date.now()}`;
                            const hostId = socket.id;
                            
                            setCurrentStream({ 
                                streamId,
                                isHost: true, 
                                stream 
                            });
                            setStreaming(true);
                            
                            const startTime = new Date();
                            durationInterval.current = setInterval(() => {
                                setStreamDuration(Math.floor((new Date() - startTime) / 1000));
                            }, 1000);
                            
                            socket.emit('startStream', { 
                                hostId, 
                                streamId 
                            });
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
            socket.emit('endStream', { streamId: currentStream.streamId });
            currentStream.stream.getTracks().forEach(track => track.stop());
            if (durationInterval.current) {
                clearInterval(durationInterval.current);
            }
            setStreaming(false);
            setCurrentStream(null);
            setStreamDuration(0);
        }
    };

    const joinStream = (streamId) => {
        socket.emit('joinStream', { 
            streamId, 
            userId: socket.id 
        });
        setCurrentStream({ 
            streamId, 
            isHost: false 
        });
        
        // Get initial stream data
        socket.emit('getStreamInfo', { streamId }, (data) => {
            setViewers(data.viewers);
            setLikes(data.likes);
            setComments(data.comments);
            setStreamDuration(data.duration);
        });
    };

    const sendComment = () => {
        if (comment.trim() && currentStream) {
            socket.emit('sendComment', { 
                streamId: currentStream.streamId, 
                userId: socket.id,
                comment: comment.trim() 
            });
            setComment('');
        }
    };

    const sendLike = () => {
        if (currentStream && !hasLiked) {
            socket.emit('sendLike', { 
                streamId: currentStream.streamId, 
                userId: socket.id 
            });
            setHasLiked(true);
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
                        <span className="stream-duration">{formatDuration(streamDuration)}</span>
                        <span className="viewer-count">👥 {viewers}</span>
                        <span className="like-count">❤️ {likes}</span>
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
                    liveStreams.map((streamId) => (
                        <div key={streamId} className="stream-card">
                            <p className="stream-id">🔴 Stream ID: {streamId}</p>
                            {!streaming && (
                                <button 
                                    onClick={() => joinStream(streamId)} 
                                    className="join-stream-btn"
                                >
                                    Join Stream
                                </button>
                            )}
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
                                            <span className="comment-user">{c.userId}:</span>
                                            <span className="comment-text">{c.comment}</span>
                                        </div>
                                    ))
                                )}
                                <div ref={commentEndRef} />
                            </div>
                            <div className="comment-input-area">
                                <input
                                    type="text"
                                    value={comment}
                                    onChange={(e) => setComment(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && sendComment()}
                                    placeholder="Type a comment..."
                                    className="comment-input"
                                />
                                <button 
                                    onClick={sendComment} 
                                    className="send-comment-btn"
                                    disabled={!comment.trim()}
                                >
                                    Send
                                </button>
                                <button 
                                    onClick={sendLike} 
                                    className="like-btn"
                                    disabled={hasLiked}
                                >
                                    {hasLiked ? '❤️ Liked' : `❤️ Like (${likes})`}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}