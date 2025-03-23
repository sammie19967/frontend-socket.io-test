import { useState } from "react";
import axios from "axios";
import "../styles/CreatePost.css"; // Import the CSS file for styling

export default function CreatePost({ onPostCreated }) {
    const [caption, setCaption] = useState("");
    const [files, setFiles] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [showSuccessModal, setShowSuccessModal] = useState(false);

    const MAX_FILE_SIZE_MB = 10; // 10MB max file size
    const MAX_FILES = 10; // Maximum number of attachments

    const handleFileChange = (event) => {
        const selectedFiles = Array.from(event.target.files);
        let newFiles = [...files];
        let validationError = "";

        selectedFiles.forEach((file) => {
            if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
                validationError = `File "${file.name}" exceeds the 10MB size limit and will not be uploaded.`;
            } else if (newFiles.length < MAX_FILES) {
                newFiles.push(file);
            } else {
                validationError = `You can only upload a maximum of ${MAX_FILES} attachments.`;
            }
        });

        if (validationError) {
            setError(validationError);
        } else {
            setFiles(newFiles);
            setError(""); // Reset error if all conditions are met
        }
    };

    const handleRemoveFile = (index) => {
        const updatedFiles = files.filter((_, i) => i !== index);
        setFiles(updatedFiles);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!caption.trim() && files.length === 0) {
            setError("Please provide a caption or upload media.");
            return;
        }

        const formData = new FormData();
        formData.append("caption", caption.trim());

        files.forEach((file) => formData.append("files", file));

        try {
            setLoading(true);
            setError("");

            const response = await axios.post("http://localhost:5000/api/posts", formData, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                },
                withCredentials: true,
            });

            if (typeof onPostCreated === "function") {
                onPostCreated(response.data);
            }

            setCaption("");
            setFiles([]);
            document.getElementById("fileInput").value = "";
            setShowSuccessModal(true); // Show success modal
        } catch (err) {
            console.error("Upload Error:", err);
            setError(err.response?.data?.message || "Failed to create post.");
        } finally {
            setLoading(false);
        }
    };

    const closeSuccessModal = () => {
        setShowSuccessModal(false);
    };

    return (
        <div className="create-post-container">
            <h2>Create a Post</h2>
            {error && <p className="error-message">{error}</p>}
            <form onSubmit={handleSubmit} className="post-form">
                <textarea
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                    placeholder="What's on your mind?"
                    className="caption-input"
                ></textarea>

                {/* File Input */}
                <div className="file-input-container">
                    <label htmlFor="fileInput" className="file-input-label">
                        <span className="upload-icon">📷</span>
                        <span className="upload-text">Upload Photos/Video (Max {MAX_FILES} files, 10MB each)</span>
                    </label>
                    <input
                        id="fileInput"
                        type="file"
                        multiple
                        accept="image/*,video/*"
                        onChange={handleFileChange}
                        className="file-input"
                    />
                </div>

                {/* File Preview Section */}
                <div className="file-preview-container">
                    {files.map((file, index) => (
                        <div key={index} className="file-preview">
                            {file.type.startsWith("image") ? (
                                <img
                                    src={URL.createObjectURL(file)}
                                    alt={`preview-${index}`}
                                    className="preview-image"
                                />
                            ) : (
                                <video controls className="preview-video">
                                    <source src={URL.createObjectURL(file)} type={file.type} />
                                    Your browser does not support the video tag.
                                </video>
                            )}
                            <button
                                type="button"
                                onClick={() => handleRemoveFile(index)}
                                className="remove-btn"
                            >
                                ×
                            </button>
                        </div>
                    ))}
                </div>

                {/* Submit Button */}
                <button
                    type="submit"
                    disabled={loading || (!caption.trim() && files.length === 0)}
                    className="submit-button"
                >
                    {loading ? (
                        <span className="loading-spinner"></span>
                    ) : (
                        "Post"
                    )}
                </button>
            </form>

            {/* Success Modal */}
            {showSuccessModal && (
                <div className="modal-overlay">
                    <div className="modal">
                        <h3>🎉 Post Created Successfully!</h3>
                        <p>Your post has been shared with the community.</p>
                        <button onClick={closeSuccessModal} className="modal-close-btn">
                            Close
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}