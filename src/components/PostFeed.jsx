import { useEffect, useState } from "react";
import axios from "axios";

export default function PostFeed() {
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const fetchPosts = async () => {
            try {
                const response = await axios.get("http://localhost:5000/api/posts", { withCredentials: true });
                setPosts(response.data);
            } catch (err) {
                setError("Failed to fetch posts.");
            } finally {
                setLoading(false);
            }
        };

        fetchPosts();
    }, []);

    if (loading) return <p>Loading posts...</p>;
    if (error) return <p style={{ color: "red" }}>{error}</p>;

    return (
        <div>
            <h2>Posts</h2>
            {posts.length === 0 ? (
                <p>No posts available.</p>
            ) : (
                posts.map((post) => (
                    <div key={post.id}>
                        <p><strong>{post.user?.username}</strong></p>
                        <p>{post.caption}</p>
                        {post.mediaUrls && post.mediaUrls.map((url, index) => (
                            <div key={index}>
                                {url.endsWith(".mp4") ? (
                                    <video controls src={url} width="300" />
                                ) : (
                                    <img src={url} alt="Post media" width="300" />
                                )}
                            </div>
                        ))}
                        <button>Like ({post.likes?.length || 0})</button>
                        <button>Comment ({post.comments?.length || 0})</button>
                        <button>Rate</button>
                    </div>
                ))
            )}
        </div>
    );
}
