// ./pages/ProfilePage.jsx
import { useAuth } from '../context/AuthContext';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';

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

    // Fetch user posts (mock implementation)
    const fetchPosts = async () => {
      try {
        // In a real app, you would fetch from your API
        // const response = await fetch('/api/posts/user', {
        //   headers: {
        //     'Authorization': `Bearer ${token}`
        //   }
        // });
        // const data = await response.json();
        
        // Mock data
        const mockPosts = [
          { id: 1, title: 'My First Post', content: 'This is my first post content', createdAt: '2023-05-15' },
          { id: 2, title: 'Learning React', content: 'React is awesome for building UIs', createdAt: '2023-05-20' },
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
    return <div>Loading...</div>;
  }

  return (
    <ProfileContainer>
      <ProfileHeader>
        <ProfileAvatar>
          {user.username?.charAt(0).toUpperCase() || 'U'}
        </ProfileAvatar>
        <ProfileInfo>
          <h1>{user.username}</h1>
          <p>{user.email}</p>
          <RoleBadge role={user.role}>{user.role}</RoleBadge>
        </ProfileInfo>
        <LogoutButton onClick={handleLogout}>Logout</LogoutButton>
      </ProfileHeader>

      <ProfileContent>
        <ProfileSection>
          <h2>About</h2>
          <p>{user.bio || 'No bio available'}</p>
        </ProfileSection>

        <ProfileSection>
          <h2>My Posts ({posts.length})</h2>
          {loading ? (
            <p>Loading posts...</p>
          ) : posts.length > 0 ? (
            <PostsList>
              {posts.map(post => (
                <PostItem key={post.id}>
                  <h3>{post.title}</h3>
                  <p>{post.content}</p>
                  <PostDate>{new Date(post.createdAt).toLocaleDateString()}</PostDate>
                </PostItem>
              ))}
            </PostsList>
          ) : (
            <p>No posts yet.</p>
          )}
        </ProfileSection>
      </ProfileContent>
    </ProfileContainer>
  );
};

// Styled Components
const ProfileContainer = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
`;

const ProfileHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 2rem;
  margin-bottom: 3rem;
  padding-bottom: 2rem;
  border-bottom: 1px solid #eee;
`;

const ProfileAvatar = styled.div`
  width: 100px;
  height: 100px;
  border-radius: 50%;
  background-color: #4a6fa5;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 3rem;
  font-weight: bold;
`;

const ProfileInfo = styled.div`
  flex: 1;
  
  h1 {
    margin: 0;
    font-size: 2rem;
  }
  
  p {
    margin: 0.5rem 0 0;
    color: #666;
  }
`;

const RoleBadge = styled.span`
  display: inline-block;
  margin-top: 0.5rem;
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: bold;
  background-color: ${props => 
    props.role === 'admin' ? '#ff6b6b' : 
    props.role === 'moderator' ? '#48dbfb' : 
    '#1dd1a1'};
  color: white;
`;

const LogoutButton = styled.button`
  padding: 0.5rem 1rem;
  background-color: #ff6b6b;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: bold;
  transition: background-color 0.2s;

  &:hover {
    background-color: #ee5253;
  }
`;

const ProfileContent = styled.div`
  display: grid;
  gap: 3rem;
`;

const ProfileSection = styled.section`
  h2 {
    margin-bottom: 1rem;
    padding-bottom: 0.5rem;
    border-bottom: 1px solid #eee;
  }
`;

const PostsList = styled.div`
  display: grid;
  gap: 1.5rem;
`;

const PostItem = styled.article`
  padding: 1.5rem;
  border-radius: 8px;
  background-color: #f8f9fa;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
  
  h3 {
    margin: 0 0 0.5rem;
    color: #333;
  }
  
  p {
    margin: 0 0 0.5rem;
    color: #555;
  }
`;

const PostDate = styled.small`
  color: #999;
  font-size: 0.8rem;
`;

export default ProfilePage;