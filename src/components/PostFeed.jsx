import { useEffect, useState, useRef } from "react";
import axios from "axios";
import { FaThumbsUp, FaComment, FaStar, FaPlay, FaPause } from "react-icons/fa";
import { Link } from "react-router-dom";
import Lightbox from "yet-another-react-lightbox";
import "yet-another-react-lightbox/styles.css";
import "../styles/PostFeed.css";

export default function PostFeed() {
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [likedPosts, setLikedPosts] = useState(new Set());
    const [lightboxOpen, setLightboxOpen] = useState(false);
    const [lightboxIndex, setLightboxIndex] = useState(0);
    const [lightboxSlides, setLightboxSlides] = useState([]);
    const videoRefs = useRef({});

    useEffect(() => {
        const fetchPosts = async () => {
            try {
                const response = await axios.get("http://localhost:5000/api/posts", { 
                    withCredentials: true 
                });
                
                if (Array.isArray(response.data.posts)) {
                    setPosts(response.data.posts);
                } else {
                    throw new Error("Invalid data format");
                }
            } catch (err) {
                console.error("Error fetching posts:", err);
                setError("Failed to fetch posts. Please try again later.");
            } finally {
                setLoading(false);
            }
        };

        fetchPosts();
    }, []);

    const handleLike = (postId) => {
        setLikedPosts((prev) => {
            const newLikes = new Set(prev);
            newLikes.has(postId) ? newLikes.delete(postId) : newLikes.add(postId);
            return newLikes;
        });
    };

    const openLightbox = (mediaUrls, index) => {
        setLightboxSlides(mediaUrls.map((url) => ({ src: `http://localhost:5000${url}` })));
        setLightboxIndex(index);
        setLightboxOpen(true);
    };

    const toggleVideoPlayback = (postId, mediaIndex) => {
        const videoKey = `${postId}-${mediaIndex}`;
        const video = videoRefs.current[videoKey];
        
        if (video) {
            if (video.paused) {
                video.play();
            } else {
                video.pause();
            }
        }
    };

    if (loading) return <p className="loading-v2">Loading posts...</p>;
    if (error) return <p className="error-v2">{error}</p>;

    return (
        <div className="post-feed-container-v2">
            <h2>Posts</h2>
            <div className="posts-grid">
                {posts.map((post) => {
                    const formattedDate = new Date(post.createdAt).toLocaleString();
                    const isLiked = likedPosts.has(post.id);
                    const mediaUrls = post.mediaUrl ? post.mediaUrl.split(",") : [];
                    const mediaCount = mediaUrls.length;
                    const usernameInitial = post.User?.username?.charAt(0).toUpperCase() || 'U';

                    return (
                        <div key={post.id} className="post-card-v2">
                            {/* User Info */}
                            <div className="user-info-v2">
                                <Link to={`/profile/${post.User?.id}`} className="profile-link-v2">
                                    <div className="profile-icon-v2">
                                        {usernameInitial}
                                    </div>
                                    <span className="username-v2">{post.User?.username || "Unknown User"}</span>
                                </Link>
                            </div>

                            <p className="timestamp-v2">{formattedDate}</p>
                            <p className="caption-v2">{post.caption}</p>

                            {/* Media Container */}
                            {mediaCount > 0 && (
                                <div 
                                    className="media-container" 
                                    data-count={mediaCount > 4 ? '>4' : mediaCount.toString()}
                                >
                                    {mediaUrls.map((url, index) => {
                                        const fullUrl = `http://localhost:5000${url.trim()}`;
                                        const isVideo = url.endsWith(".mp4");
                                        
                                        return (
                                            <div 
                                                key={index} 
                                                className={`media-wrapper ${mediaCount > 1 ? 'multi-media' : ''}`}
                                            >
                                                {/* Show count badge on first media item if multiple */}
                                                {mediaCount > 1 && index === 0 && (
                                                    <div className="media-count-badge">
                                                        +{mediaCount - 1}
                                                    </div>
                                                )}
                                                
                                                {isVideo ? (
                                                    <div className="video-wrapper">
                                                        <video
                                                            ref={el => videoRefs.current[`${post.id}-${index}`] = el}
                                                            src={fullUrl}
                                                            muted
                                                            loop
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                toggleVideoPlayback(post.id, index);
                                                            }}
                                                            onPlay={(e) => {
                                                                e.target.setAttribute('playing', 'true');
                                                            }}
                                                            onPause={(e) => {
                                                                e.target.removeAttribute('playing');
                                                            }}
                                                        />
                                                        <button 
                                                            className="video-control"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                toggleVideoPlayback(post.id, index);
                                                            }}
                                                        >
                                                            <FaPlay className="play-icon" />
                                                            <FaPause className="pause-icon" />
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <img 
                                                        src={fullUrl} 
                                                        alt="Post media" 
                                                        onClick={() => openLightbox(mediaUrls, index)}
                                                    />
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}

                            {/* Action Buttons */}
                            <div className="actions-v2">
                                <button 
                                    className={isLiked ? "liked" : ""} 
                                    onClick={() => handleLike(post.id)}
                                >
                                    <FaThumbsUp /> Like ({post.likes?.length || 0})
                                </button>
                                <button>
                                    <FaComment /> Comment ({post.comments?.length || 0})
                                </button>
                                <button>
                                    <FaStar /> Rate
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Lightbox */}
            {lightboxOpen && (
                <Lightbox 
                    slides={lightboxSlides} 
                    index={lightboxIndex} 
                    open={lightboxOpen} 
                    close={() => setLightboxOpen(false)} 
                />
            )}
        </div>
    );
}