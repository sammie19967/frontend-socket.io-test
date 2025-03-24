import { useEffect, useState } from "react";
import axios from "axios";
import { FaThumbsUp, FaComment, FaStar } from "react-icons/fa";
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

    useEffect(() => {
        const fetchPosts = async () => {
            try {
                const response = await axios.get("http://localhost:5000/api/posts", { withCredentials: true });

                console.log("API Response:", response.data);

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

    if (loading) return <p className="loading-v2">Loading posts...</p>;
    if (error) return <p className="error-v2">{error}</p>;

    return (
        <div className="post-feed-container-v2">
            <h2>Posts</h2>
            {posts.length === 0 ? (
                <p>No posts available.</p>
            ) : (
                posts.map((post) => {
                    const formattedDate = new Date(post.createdAt).toLocaleString();
                    const isLiked = likedPosts.has(post.id);
                    const mediaUrls = post.mediaUrl ? post.mediaUrl.split(",") : [];

                    return (
                        <div key={post.id} className="post-card-v2">
                            {/* User Info */}
                            <div className="user-info-v2">
                                <Link to={`/profile/${post.User?.id}`} className="profile-link-v2">
                                    <img
                                        src={post.User?.profilePicture || "https://via.placeholder.com/40"}
                                        alt="Profile"
                                        className="profile-icon-v2"
                                    />
                                    <span className="username-v2">{post.User?.username || "Unknown User"}</span>
                                </Link>
                            </div>

                            <p className="timestamp-v2">{formattedDate}</p>
                            <p className="caption-v2">{post.caption}</p>

                            {/* Media Grid */}
                            {mediaUrls.length > 0 && (
                                <div className="media-grid-v2">
                                    {mediaUrls.map((url, index) => {
                                        const fullUrl = `http://localhost:5000${url.trim()}`;
                                        return (
                                            <div key={index} className="media-item-v2" onClick={() => openLightbox(mediaUrls, index)}>
                                                {url.endsWith(".mp4") ? (
                                                    <video src={fullUrl} muted />
                                                ) : (
                                                    <img src={fullUrl} alt="Post media" />
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}

                            {/* Action Buttons */}
                            <div className="actions-v2">
                                <button className={isLiked ? "liked" : ""} onClick={() => handleLike(post.id)}>
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
                })
            )}

            {/* Lightbox */}
            {lightboxOpen && (
                <Lightbox slides={lightboxSlides} index={lightboxIndex} open={lightboxOpen} close={() => setLightboxOpen(false)} />
            )}
        </div>
    );
}
