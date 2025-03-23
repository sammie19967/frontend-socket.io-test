import { useEffect, useState } from "react";
import axios from "axios";
import { FaThumbsUp, FaComment, FaStar } from "react-icons/fa"; // Icons for Like, Comment, Rate
import { Link } from "react-router-dom"; // For linking to user profiles
import "../styles/PostFeed.css";

export default function PostFeed() {
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [likedPosts, setLikedPosts] = useState(new Set()); // Track liked posts

    useEffect(() => {
        const fetchPosts = async () => {
            try {
                const response = await axios.get("http://localhost:5000/api/posts", { withCredentials: true });

                console.log("API Response:", response.data); // ✅ Debugging

                // Ensure data is in the correct format
                if (Array.isArray(response.data.posts)) {
                    setPosts(response.data.posts);
                } else {
                    throw new Error("Invalid data format: Expected an array in 'posts' but got " + typeof response.data.posts);
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
        const newLikedPosts = new Set(likedPosts);
        if (newLikedPosts.has(postId)) {
            newLikedPosts.delete(postId);
        } else {
            newLikedPosts.add(postId);
        }
        setLikedPosts(newLikedPosts);
    };

    if (loading) return <p className="loading">Loading posts...</p>;
    if (error) return <p className="error">{error}</p>;

    return (
        <div className="post-feed-container">
            <h2>Posts</h2>
            {posts.length === 0 ? (
                <p>No posts available.</p>
            ) : (
                posts.map((post) => {
                    const formattedDate = new Date(post.createdAt).toLocaleString(); // Format date
                    const isLiked = likedPosts.has(post.id); // Check if post is liked

                    return (
                        <div key={post.id} className="post-card">
                            {/* User Info with Profile Icon and Link */}
                            <div className="user-info">
                                <Link to={`/${post.User?.id}/profile`} className="profile-link">
                                    <img
                                        src={post.User?.profilePicture || "https://via.placeholder.com/40"} // Default placeholder if no profile picture
                                        alt="Profile"
                                        className="profile-icon"
                                    />
                                    <span className="username">{post.User?.username || "Unknown User"}</span>
                                </Link>
                            </div>

                            <p className="timestamp">{formattedDate}</p>
                            <p className="caption">{post.caption}</p>

                            {/* Handle Media URLs */}
                            {post.mediaUrl && (
                                <div className="media-container">
                                    {post.mediaUrl.split(",").map((url, index) => {
                                        const fullUrl = `http://localhost:5000${url.trim()}`;
                                        return (
                                            <div key={index} className="media-item">
                                                {url.endsWith(".mp4") ? (
                                                    <video controls src={fullUrl} />
                                                ) : (
                                                    <img src={fullUrl} alt="Post media" />
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}

                            {/* Action Buttons with Icons */}
                            <div className="actions">
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
                })
            )}
        </div>
    );
}