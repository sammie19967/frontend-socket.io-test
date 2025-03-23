import { useState } from "react";
import axios from "axios";
import "../styles/CreatePost.css"; // Import the CSS file for styling

export default function CreatePost({ onPostCreated }) {
    const [caption, setCaption] = useState("");
    const [files, setFiles] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleFileChange = (event) => {
        const selectedFiles = Array.from(event.target.files); // Convert FileList to an array
        setFiles([...files, ...selectedFiles]); // Append new files to existing ones
        setError(""); // Reset error when a file is selected
    };

    const handleRemoveFile = (index) => {
        const updatedFiles = files.filter((_, i) => i !== index); // Remove the file at the specified index
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

        // Append all files to the form data
        files.forEach((file) => formData.append("files", file));

        try {
            setLoading(true);
            setError(""); // Reset error before request

            const response = await axios.post("http://localhost:5000/api/posts", formData, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                },
                withCredentials: true,
            });

            // Call `onPostCreated` only if it's a valid function
            if (typeof onPostCreated === "function") {
                onPostCreated(response.data);
            }

            // Reset form fields after successful upload
            setCaption("");
            setFiles([]);
            document.getElementById("fileInput").value = ""; // Reset file input

        } catch (err) {
            console.error("Upload Error:", err);
            setError(err.response?.data?.message || "Failed to create post.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="create-post-container">
            <h2>Create a Post</h2>
            {error && <p className="error-message">{error}</p>}
            <form onSubmit={handleSubmit} className="post-form">
                <textarea
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                    placeholder="Write a caption..."
                    className="caption-input"
                ></textarea>

                {/* File Input */}
                <div className="file-input-container">
                    <label htmlFor="fileInput" className="file-input-label">
                        Upload Photos/Video
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

                {/* Image Preview */}
                <div className="file-preview-container">
                    {files.map((file, index) => (
                        <div key={index} className="file-preview">
                            {file.type.startsWith("image") ? (
                                <img src={URL.createObjectURL(file)} alt={`preview-${index}`} className="preview-image" />
                            ) : (
                                <video controls className="preview-video">
                                    <source src={URL.createObjectURL(file)} type={file.type} />
                                    Your browser does not support the video tag.
                                </video>
                            )}
                            <button
                                type="button"
                                onClick={() => handleRemoveFile(index)}
                                className="remove-file-button"
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
                    {loading ? "Posting..." : "Post"}
                </button>
            </form>
        </div>
    );
}