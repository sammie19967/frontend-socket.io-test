import { useAuth } from '../context/AuthContext';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/ProfilePage.css';

const ProfilePage = () => {
  const { user, token, logout } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    const fetchPosts = async () => {
      try {
        // Mock data
        const mockPosts = [
          { 
            id: 1, 
            title: 'My First Post', 
            content: 'This is my first post content', 
            createdAt: '2023-05-15' 
          },
          { 
            id: 2, 
            title: 'Learning React', 
            content: 'React is awesome for building UIs', 
            createdAt: '2023-05-20' 
          },
        ];
        
        setPosts(mockPosts);
      } catch (error) {
        console.error('Error fetching posts:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, [user, token, navigate]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!user) {
    return <div className="loading-placeholder">Loading...</div>;
  }

  return (
    <div className="profile-container">
      <div className="profile-header">
        <div className="profile-avatar">
          {user.username?.charAt(0).toUpperCase() || 'U'}
        </div>
        <div className="profile-info">
          <h1>{user.username}</h1>
          <p>{user.email}</p>
          <span className={`role-badge role-${user.role}`}>
            {user.role}
          </span>
        </div>
        <button 
          className="logout-button"
          onClick={handleLogout}
        >
          Logout
        </button>
      </div>

      <div className="profile-content">
        <section className="profile-section">
          <h2>About</h2>
          <p>{user.bio || 'No bio available'}</p>
        </section>

        <section className="profile-section">
          <h2>My Posts ({posts.length})</h2>
          {loading ? (
            <p className="loading-text">Loading posts...</p>
          ) : posts.length > 0 ? (
            <div className="posts-list">
              {posts.map(post => (
                <article className="post-item" key={post.id}>
                  <h3>{post.title}</h3>
                  <p>{post.content}</p>
                  <small className="post-date">
                    {new Date(post.createdAt).toLocaleDateString()}
                  </small>
                </article>
              ))}
            </div>
          ) : (
            <p className="no-posts">No posts yet.</p>
          )}
        </section>
      </div>
    </div>
  );
};

export default ProfilePage;