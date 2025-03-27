// hooks/useLiveStream.js
import { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './useAuth';

export const useLiveStream = () => {
  const { user } = useAuth();
  const [streams, setStreams] = useState([]);
  const [currentStream, setCurrentStream] = useState(null);
  const [comments, setComments] = useState([]);
  const [likes, setLikes] = useState(0);
  const [viewers, setViewers] = useState(0);
  const [streamDuration, setStreamDuration] = useState(0);
  const socketRef = useRef(null);
  const durationInterval = useRef(null);

  useEffect(() => {
    // Initialize socket connection
    socketRef.current = io('http://localhost:5000');

    // Set up event listeners
    socketRef.current.on('streamListUpdated', setStreams);
    socketRef.current.on('streamUpdate', updateStreamData);
    socketRef.current.on('receiveComment', handleNewComment);
    socketRef.current.on('updateLikes', setLikes);
    socketRef.current.on('streamEnded', handleStreamEnd);

    // Clean up
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
      clearInterval(durationInterval.current);
    };
  }, []);

  const updateStreamData = ({ viewers, likes, comments }) => {
    setViewers(viewers);
    setLikes(likes);
    setComments(comments);
  };

  const handleNewComment = (comment) => {
    setComments(prev => [...prev, comment]);
  };

  const handleStreamEnd = () => {
    setCurrentStream(null);
    setComments([]);
    setLikes(0);
    setViewers(0);
    clearInterval(durationInterval.current);
  };

  const startStream = async (streamId) => {
    if (!user || user.role !== 'seller') return;
    
    socketRef.current.emit('startStream', { 
      hostId: user.id, 
      streamId 
    });
    
    setCurrentStream({ id: streamId, isHost: true });
    const startTime = new Date();
    durationInterval.current = setInterval(() => {
      setStreamDuration(Math.floor((new Date() - startTime) / 1000));
    }, 1000);
  };

  const joinStream = (streamId) => {
    socketRef.current.emit('joinStream', { 
      streamId, 
      userId: user.id 
    });
    setCurrentStream({ id: streamId, isHost: false });
    
    // Fetch initial stream data
    socketRef.current.emit('getStreamInfo', { streamId }, (data) => {
      updateStreamData(data);
      setStreamDuration(data.duration);
    });
  };

  const endStream = () => {
    if (currentStream?.isHost) {
      socketRef.current.emit('endStream', { streamId: currentStream.id });
      clearInterval(durationInterval.current);
      handleStreamEnd();
    }
  };

  const sendComment = (comment) => {
    if (currentStream && comment.trim()) {
      socketRef.current.emit('sendComment', {
        streamId: currentStream.id,
        userId: user.id,
        comment: comment.trim()
      });
    }
  };

  const sendLike = () => {
    if (currentStream && user) {
      socketRef.current.emit('sendLike', {
        streamId: currentStream.id,
        userId: user.id
      });
    }
  };

  return {
    streams,
    currentStream,
    comments,
    likes,
    viewers,
    streamDuration,
    startStream,
    joinStream,
    endStream,
    sendComment,
    sendLike,
    canGoLive: user?.role === 'seller'
  };
};