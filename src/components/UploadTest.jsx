import { useState } from "react";
import axios from "axios";
import "../styles/UploadTest.css";

export default function UploadTest() {
    const [files, setFiles] = useState([]);
    const [uploadedUrls, setUploadedUrls] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [showFailureModal, setShowFailureModal] = useState(false);

    const handleFileChange = (event) => {
        const selectedFiles = Array.from(event.target.files); // Convert FileList to Array
        setFiles(selectedFiles);
        setError(""); // Reset error message
    };

    const handleRemoveFile = (index) => {
        const updatedFiles = files.filter((_, i) => i !== index); // Remove file at index
        setFiles(updatedFiles);
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
            setFiles([]); // Clear selected files after upload
            setShowSuccessModal(true); // Show success modal
        } catch (err) {
            console.error("Upload Error:", err.response?.data?.message || err.message);
            setError(err.response?.data?.message || "Upload failed. Try again.");
            setShowFailureModal(true); // Show failure modal
        } finally {
            setLoading(false);
        }
    };

    const closeModal = () => {
        setShowSuccessModal(false);
        setShowFailureModal(false);
    };

    return (
        <div className="upload-container">
            <h2>File Upload Test</h2>

            <input type="file" multiple onChange={handleFileChange} className="file-input" />

            {error && <p className="error">{error}</p>}

            {/* File Preview Section */}
            {files.length > 0 && (
                <div className="file-preview-section">
                    <h3>Selected Files:</h3>
                    <div className="file-grid">
                        {files.map((file, index) => (
                            <div key={index} className="file-preview">
                                {file.type.startsWith("image/") ? (
                                    <img src={URL.createObjectURL(file)} alt={`Preview ${index}`} className="file-image" />
                                ) : file.type.startsWith("video/") ? (
                                    <video src={URL.createObjectURL(file)} controls className="file-video" />
                                ) : (
                                    <div className="file-placeholder">
                                        <p>{file.name}</p>
                                        <p>(Unsupported file type)</p>
                                    </div>
                                )}
                                <button onClick={() => handleRemoveFile(index)} className="remove-btn">
                                    Remove
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <button onClick={handleUpload} className="upload-btn" disabled={loading || files.length === 0}>
                {loading ? "Uploading..." : "Upload Files"}
            </button>

            {/* Uploaded Files Section */}
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

            {/* Success Modal */}
            {showSuccessModal && (
                <div className="modal-overlay">
                    <div className="modal">
                        <h3>Success!</h3>
                        <p>Your files have been uploaded successfully.</p>
                        <button onClick={closeModal} className="modal-close-btn">
                            Close
                        </button>
                    </div>
                </div>
            )}

            {/* Failure Modal */}
            {showFailureModal && (
                <div className="modal-overlay">
                    <div className="modal">
                        <h3>Upload Failed</h3>
                        <p>{error || "An error occurred during the upload. Please try again."}</p>
                        <button onClick={closeModal} className="modal-close-btn">
                            Close
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}