import React, { useState } from 'react';
import axios from 'axios';
import "../styles/PostUpload.css";

const PostUpload = () => {
    const [caption, setCaption] = useState('');
    const [media, setMedia] = useState(null);
    const [preview, setPreview] = useState(null);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleFileChange = (e) => {
        const file = e.target.files[0];

        if (file) {
            const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'video/mp4'];
            if (!validTypes.includes(file.type)) {
                setError('Only images (JPG, PNG) and videos (MP4) are allowed');
                return;
            }

            setMedia(file);
            setPreview(URL.createObjectURL(file)); // Show preview
            setError('');
        }
    };

    const handleUpload = async () => {
        if (!caption.trim() && !media) {
            setError('Please add a caption or media');
            return;
        }

        setLoading(true);
        setError('');

        const formData = new FormData();
        formData.append('caption', caption);
        if (media) formData.append('media', media);

        try {
            const token = localStorage.getItem('token'); // Get token from storage
            if (!token) {
                setError('Authentication failed. Please log in.');
                return;
            }

            const res = await axios.post('http://localhost:5000/api/posts', formData, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data',
                },
            });

            console.log('Post uploaded:', res.data);
            alert('Post uploaded successfully!');
            setCaption('');
            setMedia(null);
            setPreview(null);
        } catch (err) {
            console.error('Upload error:', err.response);
            setError(err.response?.data?.message || 'Upload failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="upload-container">
            <h2>Create a Post</h2>
            {error && <p className="error">{error}</p>}
            
            <textarea
                placeholder="Write a caption..."
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
            />

            <label className="file-input-label">
                Upload Media
                <input type="file" accept="image/*,video/mp4" onChange={handleFileChange} />
            </label>

            {preview && (
                media.type.startsWith('image/') ? (
                    <img src={preview} alt="Preview" className="preview" />
                ) : (
                    <video controls className="preview">
                        <source src={preview} type="video/mp4" />
                    </video>
                )
            )}

            <button onClick={handleUpload} disabled={loading}>
                {loading ? 'Uploading...' : 'Post'}
            </button>
        </div>
    );
};

export default PostUpload;