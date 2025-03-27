import { useEffect, useState, useRef } from 'react';
import io from 'socket.io-client';
import { useAuth } from '../context/AuthContext';
import '../styles/LiveStream.css';

const LiveStream = () => {
  const { user } = useAuth();
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
  const socketRef = useRef(null);

  // Format duration
  const formatDuration = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    return [h, m, s].map(v => v < 10 ? "0" + v : v).join(":");
  };

  // Scroll to bottom of comments
  useEffect(() => {
    commentEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [comments]);

  // Socket connection and event listeners
  useEffect(() => {
    socketRef.current = io('http://localhost:5000');

    socketRef.current.on('streamListUpdated', (streams) => {
      setLiveStreams(streams);
    });

    socketRef.current.on('streamUpdate', ({ viewers, likes, comments }) => {
      setViewers(viewers);
      setLikes(likes);
      setComments(comments);
    });

    socketRef.current.on('receiveComment', (newComment) => {
      setComments(prev => [...prev, newComment]);
    });

    socketRef.current.on('updateLikes', (likeCount) => {
      setLikes(likeCount);
    });

    socketRef.current.on('streamEnded', () => {
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

    // Initial fetch
    socketRef.current.emit('getLiveStreams');

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
      if (durationInterval.current) {
        clearInterval(durationInterval.current);
      }
    };
  }, []);

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
          const hostId = user.id;
          
          setCurrentStream({ 
            streamId,
            isHost: true, 
            stream,
            hostId
          });
          setStreaming(true);
          
          // Start tracking duration
          const startTime = new Date();
          durationInterval.current = setInterval(() => {
            setStreamDuration(Math.floor((new Date() - startTime) / 1000));
          }, 1000);
          
          socketRef.current.emit('startStream', { 
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
              const hostId = user.id;
              
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
              
              socketRef.current.emit('startStream', { 
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
      socketRef.current.emit('endStream', { streamId: currentStream.streamId });
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
    socketRef.current.emit('joinStream', { 
      streamId, 
      userId: user.id 
    });
    setCurrentStream({ 
      streamId, 
      isHost: false 
    });
    
    // Get initial stream data
    socketRef.current.emit('getStreamInfo', { streamId }, (data) => {
      setViewers(data.viewers);
      setLikes(data.likes);
      setComments(data.comments);
      setStreamDuration(data.duration);
    });
  };

  const sendComment = () => {
    if (comment.trim() && currentStream) {
      socketRef.current.emit('sendComment', { 
        streamId: currentStream.streamId, 
        userId: user.id,
        comment: comment.trim() 
      });
      setComment('');
    }
  };

  const sendLike = () => {
    if (currentStream && !hasLiked) {
      socketRef.current.emit('sendLike', { 
        streamId: currentStream.streamId, 
        userId: user.id 
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

      <div className="stream-layout">
        <div className="video-section">
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

          {currentStream && (
            <div className="stream-status">
              <span className="live-indicator">●</span>
              <span>{formatDuration(streamDuration)}</span>
              <span>•</span>
              <span>{viewers} viewers</span>
              <span>•</span>
              <span>{likes} likes</span>
            </div>
          )}

          <div className="stream-controls">
            {!streaming ? (
              user?.role === 'seller' && (
                <button 
                  onClick={startStream} 
                  className="start-stream-btn"
                  disabled={streamError}
                >
                  {permissionGranted ? 'Go Live Again' : 'Start Live Stream'}
                </button>
              )
            ) : currentStream?.isHost ? (
              <button onClick={stopStream} className="stop-stream-btn">
                End Stream
              </button>
            ) : null}
          </div>
        </div>

        <div className="sidebar">
          <div className="streams-section">
            <h2 className="section-title">Active Streams</h2>
            {liveStreams.length === 0 ? (
              <p className="no-streams">No active streams</p>
            ) : (
              <div className="stream-list">
                {liveStreams.map((streamId) => (
                  <div key={streamId} className="stream-card">
                    <p className="stream-id">🔴 Stream ID: {streamId.slice(-6)}</p>
                    {!streaming && (
                      <button 
                        onClick={() => joinStream(streamId)} 
                        className="join-stream-btn"
                      >
                        Join
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {currentStream && (
            <div className="chat-section">
              <h2 className="chat-title">Live Chat</h2>
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
                  ❤️ {likes}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LiveStream;