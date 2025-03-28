import React, { useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from '../context/AuthContext';
import { FiHeart, FiMessageSquare, FiShare2, FiUser, FiX, FiSend } from 'react-icons/fi';
import { BsThreeDotsVertical, BsEmojiFrown, BsEmojiSmile } from 'react-icons/bs';
import { RiLiveLine } from 'react-icons/ri';

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
                setComments(prev => [...prev, update.data]);
            } else if (update.type === 'like') {
                setLikes(prev => ({
                    ...prev,
                    [update.streamId]: (prev[update.streamId] || 0) + 1
                }));
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
                    <button className="btn-primary" onClick={() => setShowModal(false)}>OK</button>
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
                thumbnail: user.avatar || ''
            });
            setStreaming(true);
            setCurrentStream(`${user.id}-${Date.now()}`);
        } catch (error) {
            console.error('Error accessing media devices:', error);
            setModalContent(
                <div className="modal-content">
                    <h3>Device Access Error</h3>
                    <p>Failed to access camera or microphone. Please check permissions.</p>
                    <button className="btn-primary" onClick={() => setShowModal(false)}>OK</button>
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
            streamRef.current.getTracks().forEach(track => track.stop());
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
            avatar: user.avatar
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
                    <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        className="video-player"
                    />
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
                                <h3>{streams.find(s => s.id === currentStream)?.title || 'Live Stream'}</h3>
                                <p>@{user?.username || 'streamer'}</p>
                            </div>
                        </div>
                        <div className="stream-stats">
                            <span className="viewers">👁️ 1.2K viewers</span>
                            <span className="likes">❤️ {likes[currentStream] || 0} likes</span>
                        </div>
                    </div>
                )}
            </div>

            {/* Sidebar */}
            <div className="stream-sidebar">
                {/* Active Streams List */}
                <div className="streams-list">
                    <h3>Live Now <span className="badge">{streams.length}</span></h3>
                    <div className="stream-cards">
                        {streams.map(stream => (
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
                                        <span>👁️ 1.2K</span>
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

            {/* Styles */}
            <style jsx>{`
                .livestream-container {
                    display: flex;
                    height: calc(100vh - 80px);
                    background-color: var(--primary-dark);
                    color: var(--text-primary);
                    padding: 20px;
                    gap: 20px;
                }

                .stream-main {
                    flex: 3;
                    display: flex;
                    flex-direction: column;
                    gap: 20px;
                }

                .video-container {
                    position: relative;
                    background-color: var(--bg-surface);
                    border-radius: 12px;
                    overflow: hidden;
                    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
                    transition: all 0.3s ease;
                }

                .video-container.streaming {
                    box-shadow: 0 4px 30px var(--primary-purple-dark);
                }

                .video-player {
                    width: 100%;
                    height: auto;
                    max-height: 70vh;
                    background-color: #000;
                    display: block;
                }

                .stream-badge {
                    position: absolute;
                    top: 15px;
                    left: 15px;
                    background-color: var(--error);
                    color: white;
                    padding: 5px 10px;
                    border-radius: 20px;
                    display: flex;
                    align-items: center;
                    gap: 5px;
                    font-size: 14px;
                    font-weight: bold;
                }

                .live-icon {
                    animation: pulse 1.5s infinite;
                }

                @keyframes pulse {
                    0% { opacity: 1; }
                    50% { opacity: 0.5; }
                    100% { opacity: 1; }
                }

                .stream-controls {
                    position: absolute;
                    bottom: 20px;
                    left: 50%;
                    transform: translateX(-50%);
                    display: flex;
                    gap: 10px;
                }

                .btn-primary {
                    background-color: var(--primary-purple);
                    color: white;
                    border: none;
                    padding: 10px 20px;
                    border-radius: 20px;
                    font-weight: bold;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }

                .btn-primary:hover {
                    background-color: var(--primary-purple-dark);
                    transform: translateY(-2px);
                }

                .btn-danger {
                    background-color: var(--error);
                    color: white;
                    border: none;
                    padding: 10px 20px;
                    border-radius: 20px;
                    font-weight: bold;
                    cursor: pointer;
                    transition: all 0.2s ease;
                }

                .btn-danger:hover {
                    background-color: #c0392b;
                    transform: translateY(-2px);
                }

                .stream-info {
                    background-color: var(--bg-elevated);
                    padding: 15px;
                    border-radius: 12px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }

                .streamer-info {
                    display: flex;
                    align-items: center;
                    gap: 15px;
                }

                .avatar {
                    width: 50px;
                    height: 50px;
                    border-radius: 50%;
                    background-color: var(--bg-hover);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    overflow: hidden;
                }

                .avatar img {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                }

                .stream-stats {
                    display: flex;
                    gap: 15px;
                    color: var(--text-secondary);
                    font-size: 14px;
                }

                .stream-sidebar {
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    gap: 20px;
                    min-width: 300px;
                }

                .streams-list {
                    background-color: var(--bg-elevated);
                    border-radius: 12px;
                    padding: 15px;
                    overflow-y: auto;
                    max-height: 40%;
                }

                .streams-list h3 {
                    margin-bottom: 15px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }

                .badge {
                    background-color: var(--primary-purple);
                    color: white;
                    padding: 3px 8px;
                    border-radius: 10px;
                    font-size: 12px;
                }

                .stream-cards {
                    display: flex;
                    flex-direction: column;
                    gap: 10px;
                }

                .stream-card {
                    background-color: var(--bg-surface);
                    border-radius: 8px;
                    padding: 10px;
                    cursor: pointer;
                    transition: all 0.2s ease;
                }

                .stream-card:hover {
                    background-color: var(--bg-hover);
                }

                .stream-card.active {
                    border-left: 3px solid var(--primary-purple);
                    background-color: var(--bg-hover);
                }

                .stream-thumbnail {
                    position: relative;
                    width: 100%;
                    aspect-ratio: 16/9;
                    background-color: var(--bg-surface);
                    border-radius: 6px;
                    overflow: hidden;
                    margin-bottom: 8px;
                }

                .stream-thumbnail img {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                }

                .thumbnail-placeholder {
                    width: 100%;
                    height: 100%;
                    background: linear-gradient(45deg, var(--primary-purple), var(--secondary-teal));
                    opacity: 0.7;
                }

                .live-badge {
                    position: absolute;
                    top: 5px;
                    left: 5px;
                    background-color: var(--error);
                    color: white;
                    padding: 2px 6px;
                    border-radius: 4px;
                    font-size: 10px;
                    font-weight: bold;
                }

                .stream-details h4 {
                    margin: 0;
                    font-size: 14px;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }

                .stream-details p {
                    margin: 5px 0;
                    font-size: 12px;
                    color: var(--text-secondary);
                }

                .stream-meta {
                    display: flex;
                    gap: 10px;
                    font-size: 12px;
                    color: var(--text-secondary);
                }

                .comments-section {
                    flex: 1;
                    background-color: var(--bg-elevated);
                    border-radius: 12px;
                    padding: 15px;
                    display: flex;
                    flex-direction: column;
                }

                .comments-section h3 {
                    margin-bottom: 15px;
                }

                .comments-list {
                    flex: 1;
                    overflow-y: auto;
                    margin-bottom: 15px;
                    display: flex;
                    flex-direction: column;
                    gap: 10px;
                }

                .comment {
                    display: flex;
                    gap: 10px;
                    padding: 8px;
                    border-radius: 8px;
                    transition: background-color 0.2s ease;
                }

                .comment:hover {
                    background-color: var(--bg-hover);
                }

                .comment-avatar {
                    width: 32px;
                    height: 32px;
                    border-radius: 50%;
                    background-color: var(--bg-surface);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    flex-shrink: 0;
                    overflow: hidden;
                }

                .comment-avatar img {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                }

                .comment-content {
                    flex: 1;
                }

                .comment-user {
                    font-weight: bold;
                    font-size: 12px;
                    color: var(--primary-purple);
                }

                .comment-content p {
                    margin: 5px 0 0;
                    font-size: 14px;
                }

                .comment-input {
                    display: flex;
                    gap: 10px;
                }

                .comment-input input {
                    flex: 1;
                    background-color: var(--bg-surface);
                    border: 1px solid var(--border-light);
                    border-radius: 20px;
                    padding: 10px 15px;
                    color: var(--text-primary);
                    outline: none;
                }

                .comment-input input:focus {
                    border-color: var(--primary-purple);
                }

                .send-btn {
                    background-color: var(--primary-purple);
                    color: white;
                    border: none;
                    width: 40px;
                    height: 40px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    transition: all 0.2s ease;
                }

                .send-btn:hover {
                    background-color: var(--primary-purple-dark);
                    transform: translateY(-2px);
                }

                .modal-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background-color: rgba(0, 0, 0, 0.7);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 1000;
                }

                .modal {
                    background-color: var(--bg-elevated);
                    border-radius: 12px;
                    padding: 25px;
                    width: 90%;
                    max-width: 400px;
                    position: relative;
                    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
                }

                .modal-close {
                    position: absolute;
                    top: 15px;
                    right: 15px;
                    background: none;
                    border: none;
                    color: var(--text-secondary);
                    cursor: pointer;
                    font-size: 20px;
                }

                .modal-content {
                    display: flex;
                    flex-direction: column;
                    gap: 20px;
                }

                .modal-content h3 {
                    margin: 0;
                    color: var(--primary-purple);
                }

                .modal-content p {
                    margin: 0;
                    line-height: 1.5;
                }

                @media (max-width: 768px) {
                    .livestream-container {
                        flex-direction: column;
                        height: auto;
                    }

                    .stream-sidebar {
                        min-width: 100%;
                    }
                }
            `}</style>
        </div>
    );
};

export default Livestream;