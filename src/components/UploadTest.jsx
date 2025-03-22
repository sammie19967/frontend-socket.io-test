import { useState } from "react";
import axios from "axios";

export default function UploadTest() {
    const [files, setFiles] = useState([]);
    const [uploadedUrls, setUploadedUrls] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleFileChange = (event) => {
        setFiles([...event.target.files]); // Convert FileList to Array
        setError(""); // Reset error message
    };

    const handleUpload = async () => {
        if (files.length === 0) {
            setError("Please select files to upload.");
            return;
        }

        const formData = new FormData();
        for (let file of files) {
            formData.append("files", file);
        }

        try {
            setLoading(true);
            setError("");
            const response = await axios.post("http://localhost:5000/api/upload", formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });

            setUploadedUrls(response.data.fileUrls || []);
        } catch (err) {
            console.error("Upload Error:", err.response?.data?.message || err.message);
            setError(err.response?.data?.message || "Upload failed. Try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="upload-container">
            <h2>File Upload Test</h2>

            <input type="file" multiple onChange={handleFileChange} className="file-input" />

            {error && <p className="error">{error}</p>}

            <button onClick={handleUpload} className="upload-btn" disabled={loading}>
                {loading ? "Uploading..." : "Upload Files"}
            </button>

            {uploadedUrls.length > 0 && (
                <div className="uploaded-files">
                    <h3>Uploaded Files:</h3>
                    <div className="file-grid">
                        {uploadedUrls.map((url, index) => (
                            <div key={index} className="file-preview">
                                {url.endsWith(".mp4") ? (
                                    <video src={url} controls className="file-video" />
                                ) : (
                                    <img src={url} alt={`Uploaded ${index}`} className="file-image" />
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
