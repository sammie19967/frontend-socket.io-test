import React, { useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from '../context/AuthContext';
import { FiHeart, FiMessageSquare, FiShare2, FiUser, FiX, FiSend } from 'react-icons/fi';
import { RiLiveLine } from 'react-icons/ri';
import '../styles/LiveStream.css'; // Import the external CSS file

const socket = io('http://localhost:5000');

const Livestream = () => {
    const { user } = useAuth();
    const [streams, setStreams] = useState([]);
    const [streaming, setStreaming] = useState(false);
    const [currentStream, setCurrentStream] = useState(null);
    const [comment, setComment] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [modalContent, setModalContent] = useState(null);
    const [comments, setComments] = useState([]);
    const [likes, setLikes] = useState({});
    const videoRef = useRef(null);
    const streamRef = useRef(null);
    const commentEndRef = useRef(null);

    // Fetch active streams and comments
    useEffect(() => {
        socket.on('activeStreams', (activeStreams) => {
            setStreams(activeStreams);
        });

        socket.on('updateLiveStream', (update) => {
            if (update.type === 'comment') {
                setComments((prev) => [...prev, update.data]);
            } else if (update.type === 'like') {
                setLikes((prev) => ({
                    ...prev,
                    [update.streamId]: update.likeCount,
                }));
            } else if (update.type === 'view') {
                setStreams((prev) =>
                    prev.map((stream) =>
                        stream.id === update.streamId
                            ? { ...stream, viewCount: update.viewCount }
                            : stream
                    )
                );
            }
        });

        return () => {
            socket.off('activeStreams');
            socket.off('updateLiveStream');
        };
    }, []);

    // Auto-scroll comments
    useEffect(() => {
        commentEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [comments]);

    const startStream = async () => {
        if (!user) {
            setModalContent(
                <div className="modal-content">
                    <h3>Authentication Required</h3>
                    <p>You must be logged in to start a livestream.</p>
                    <button className="btn-primary" onClick={() => setShowModal(false)}>
                        OK
                    </button>
                </div>
            );
            setShowModal(true);
            return;
        }

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            videoRef.current.srcObject = stream;
            videoRef.current.play();
            streamRef.current = stream;

            socket.emit('startStream', {
                userId: user.id,
                title: `${user.username}'s Live Stream`,
                thumbnail: user.avatar || '',
            });
            setStreaming(true);
            setCurrentStream(`${user.id}-${Date.now()}`);
        } catch (error) {
            console.error('Error accessing media devices:', error);
            setModalContent(
                <div className="modal-content">
                    <h3>Device Access Error</h3>
                    <p>Failed to access camera or microphone. Please check permissions.</p>
                    <button className="btn-primary" onClick={() => setShowModal(false)}>
                        OK
                    </button>
                </div>
            );
            setShowModal(true);
        }
    };

    const endStream = () => {
        if (!streaming) return;
        socket.emit('endStream', { userId: user.id });
        setStreaming(false);
        if (streamRef.current) {
            streamRef.current.getTracks().forEach((track) => track.stop());
        }
        setCurrentStream(null);
    };

    const joinStream = (streamId) => {
        socket.emit('joinStream', { userId: user.id, streamId });
        setCurrentStream(streamId);
        setComments([]);
    };

    const leaveStream = () => {
        if (!currentStream) return;
        socket.emit('leaveStream', { userId: user.id, streamId: currentStream });
        setCurrentStream(null);
    };

    const likeStream = (streamId) => {
        socket.emit('likeStream', { userId: user.id, streamId });
    };

    const commentStream = () => {
        if (!comment.trim() || !currentStream) return;
        socket.emit('commentStream', {
            userId: user.id,
            streamId: currentStream,
            comment,
            username: user.username,
            avatar: user.avatar,
        });
        setComment('');
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            commentStream();
        }
    };

    return (
        <div className="livestream-container">
            {/* Main Streaming Area */}
            <div className="stream-main">
                {/* Video Player */}
                <div className={`video-container ${streaming ? 'streaming' : ''}`}>
                    <video ref={videoRef} autoPlay playsInline muted className="video-player" />
                    {streaming && (
                        <div className="stream-badge">
                            <RiLiveLine className="live-icon" />
                            <span>LIVE</span>
                        </div>
                    )}
                    <div className="stream-controls">
                        {streaming ? (
                            <button className="btn-danger" onClick={endStream}>
                                End Stream
                            </button>
                        ) : (
                            <button className="btn-primary" onClick={startStream}>
                                Go Live
                            </button>
                        )}
                    </div>
                </div>

                {/* Stream Info */}
                {currentStream && (
                    <div className="stream-info">
                        <div className="streamer-info">
                            <div className="avatar">
                                {user?.avatar ? (
                                    <img src={user.avatar} alt={user.username} />
                                ) : (
                                    <FiUser />
                                )}
                            </div>
                            <div>
                                <h3>{streams.find((s) => s.id === currentStream)?.title || 'Live Stream'}</h3>
                                <p>@{user?.username || 'streamer'}</p>
                            </div>
                        </div>
                        <div className="stream-stats">
                            <span className="viewers">
                                👁️ {streams.find((s) => s.id === currentStream)?.viewCount || 0} viewers
                            </span>
                            <span className="likes">
                                ❤️ {likes[currentStream] || 0} likes
                            </span>
                        </div>
                    </div>
                )}
            </div>

            {/* Sidebar */}
            <div className="stream-sidebar">
                {/* Active Streams List */}
                <div className="streams-list">
                    <h3>
                        Live Now <span className="badge">{streams.length}</span>
                    </h3>
                    <div className="stream-cards">
                        {streams.map((stream) => (
                            <div
                                key={stream.id}
                                className={`stream-card ${currentStream === stream.id ? 'active' : ''}`}
                                onClick={() => joinStream(stream.id)}
                            >
                                <div className="stream-thumbnail">
                                    {stream.thumbnail ? (
                                        <img src={stream.thumbnail} alt={stream.title} />
                                    ) : (
                                        <div className="thumbnail-placeholder"></div>
                                    )}
                                    <div className="live-badge">LIVE</div>
                                </div>
                                <div className="stream-details">
                                    <h4>{stream.title}</h4>
                                    <p>@{stream.userId}</p>
                                    <div className="stream-meta">
                                        <span>👁️ {stream.viewCount || 0}</span>
                                        <span>❤️ {likes[stream.id] || 0}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Comments Section */}
                {currentStream && (
                    <div className="comments-section">
                        <h3>Live Chat</h3>
                        <div className="comments-list">
                            {comments.map((comment, index) => (
                                <div key={index} className="comment">
                                    <div className="comment-avatar">
                                        {comment.avatar ? (
                                            <img src={comment.avatar} alt={comment.username} />
                                        ) : (
                                            <FiUser />
                                        )}
                                    </div>
                                    <div className="comment-content">
                                        <span className="comment-user">@{comment.username}</span>
                                        <p>{comment.comment}</p>
                                    </div>
                                </div>
                            ))}
                            <div ref={commentEndRef} />
                        </div>
                        <div className="comment-input">
                            <input
                                type="text"
                                value={comment}
                                onChange={(e) => setComment(e.target.value)}
                                onKeyPress={handleKeyPress}
                                placeholder="Send a message..."
                            />
                            <button className="send-btn" onClick={commentStream}>
                                <FiSend />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Modal */}
            {showModal && (
                <div className="modal-overlay">
                    <div className="modal">
                        <button className="modal-close" onClick={() => setShowModal(false)}>
                            <FiX />
                        </button>
                        {modalContent}
                    </div>
                </div>
            )}
        </div>
    );
};

export default Livestream;