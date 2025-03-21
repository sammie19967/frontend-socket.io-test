import { useEffect, useState } from "react";
import axios from "axios";
import { FaHeart, FaComment } from "react-icons/fa";
import "../styles/PostList.css"; // Import the CSS file

const PostList = () => {
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchPosts = async () => {
            try {
                const response = await axios.get("http://localhost:5000/api/posts"); // Replace with your actual API endpoint
                setPosts(response.data);
            } catch (err) {
                setError("Failed to load posts");
            } finally {
                setLoading(false);
            }
        };

        fetchPosts();
    }, []);

    if (loading) return <p className="loading-message">Loading posts...</p>;
    if (error) return <p className="error-message">{error}</p>;

    return (
        <div className="post-list-container">
            {posts.length === 0 ? (
                <p className="no-posts-message">No posts available.</p>
            ) : (
                posts.map((post) => (
                    <div key={post._id} className="post-card">
                        {/* User Info */}
                        <div className="post-user-info">
                            <img 
                                src={post.user.profilePicture || "/default-avatar.png"} 
                                alt="Profile" 
                                className="user-avatar"
                            />
                            <div>
                                <p className="user-name">{post.user.name}</p>
                                <p className="post-time">{new Date(post.createdAt).toLocaleString()}</p>
                            </div>
                        </div>

                        {/* Post Text */}
                        {post.text && <p className="post-text">{post.text}</p>}

                        {/* Post Media */}
                        {post.imageUrl && (
                            <img 
                                src={post.imageUrl} 
                                alt="Post" 
                                className="post-media"
                                loading="lazy"
                            />
                        )}

                        {post.videoUrl && (
                            <video controls className="post-media">
                                <source src={post.videoUrl} type="video/mp4" />
                                Your browser does not support the video tag.
                            </video>
                        )}

                        {/* Post Actions */}
                        <div className="post-actions">
                            <div className="flex items-center gap-4">
                                <button className="like">
                                    <FaHeart />
                                    {<span>{post.likes.length}</span>}
                                </button>
                                <button className="comment">
                                    <FaComment />
                                    {<span>{post.comments.length}</span>}
                                </button>
                            </div>
                        </div>
                    </div>
                ))
            )}
        </div>
    );
};

export default PostList;