import { useState } from "react";
import axios from "axios";

export default function UploadTest() {
    const [files, setFiles] = useState([]);
    const [uploadedUrls, setUploadedUrls] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleFileChange = (event) => {
        setFiles(event.target.files);
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

            setUploadedUrls(response.data.fileUrls);
        } catch (err) {
            console.error("Upload Error:", err.response?.data?.message || err.message);
            setError(err.response?.data?.message || "Upload failed. Try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-4 max-w-lg mx-auto">
            <h2 className="text-xl font-bold mb-4">File Upload Test</h2>

            <input type="file" multiple onChange={handleFileChange} className="mb-4 border p-2 w-full" />
            {error && <p className="text-red-500">{error}</p>}

            <button 
                onClick={handleUpload} 
                className="bg-blue-500 text-white px-4 py-2 rounded" 
                disabled={loading}
            >
                {loading ? "Uploading..." : "Upload"}
            </button>

            <h3 className="mt-4 text-lg font-semibold">Uploaded Files:</h3>
            <div className="mt-2">
                {uploadedUrls.map((url, index) => (
                    <div key={index} className="mb-2">
                        {url.endsWith(".mp4") ? (
                            <video src={url} controls width="200" className="border" />
                        ) : (
                            <img src={url} alt={`Uploaded ${index}`} width="200" className="border" />
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
