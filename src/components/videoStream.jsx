// components/VideoStream.jsx
import { useEffect, useRef } from 'react';

export const VideoStream = ({ stream, isHost, muted = true }) => {
  const videoRef = useRef(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
      videoRef.current.muted = muted;
      videoRef.current.play().catch(e => console.error('Video play error:', e));
    }

    return () => {
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    };
  }, [stream, muted]);

  return (
    <video
      ref={videoRef}
      autoPlay
      playsInline
      muted={muted}
      className="w-full h-full object-cover rounded-lg"
    />
  );
};