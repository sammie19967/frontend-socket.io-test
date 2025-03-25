import { useEffect, useRef, useState } from "react";
import io from "socket.io-client";
import Peer from "peerjs";
import jwtDecode from "jwt-decode";

const SERVER_URL = "http://localhost:5000"; // Update if needed
const socket = io(SERVER_URL);

export default function LiveStream() {
  const videoRef = useRef(null);
  const [streaming, setStreaming] = useState(false);
  const [peerId, setPeerId] = useState(null);
  const [comments, setComments] = useState([]);
  const [comment, setComment] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    const user = jwtDecode(token);
    console.log("Authenticated User:", user);

    const peer = new Peer();
    peer.on("open", (id) => {
      setPeerId(id);
      socket.emit("join-stream", { userId: user.id, peerId: id });
    });

    socket.on("new-comment", (newComment) => {
      setComments((prev) => [...prev, newComment]);
    });
  }, []);

  const startStream = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      videoRef.current.srcObject = stream;
      setStreaming(true);
    } catch (err) {
      console.error("Error accessing camera/microphone:", err);
    }
  };

  const sendComment = () => {
    if (!comment.trim()) return;
    socket.emit("send-comment", { text: comment });
    setComment("");
  };

  return (
    <div>
      <h1>Live Stream</h1>
      <video ref={videoRef} autoPlay playsInline></video>
      {!streaming ? (
        <button onClick={startStream}>Start Streaming</button>
      ) : (
        <p>Streaming...</p>
      )}
      <div>
        <h3>Comments</h3>
        <div>
          {comments.map((c, index) => (
            <p key={index}>{c.text}</p>
          ))}
        </div>
        <input
          type="text"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Write a comment..."
        />
        <button onClick={sendComment}>Send</button>
      </div>
    </div>
  );
}
