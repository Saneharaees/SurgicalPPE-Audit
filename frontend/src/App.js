import React, { useState, useRef } from "react";
import axios from "axios";
import "./App.css";

const API_URL = "http://localhost:8000";

function App() {
  const [imageFile, setImageFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [resultImage, setResultImage] = useState(null);
  const [summary, setSummary] = useState([]);
  const [totalDetections, setTotalDetections] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [conf, setConf] = useState(0.25);
  const [iou, setIou] = useState(0.45);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);

  const loadFile = (file) => {
    if (!file || !file.type.startsWith("image/")) {
      setError("Sirf image file select karein.");
      return;
    }
    setImageFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setResultImage(null);
    setSummary([]);
    setError("");
  };

  const handleFileChange = (e) => loadFile(e.target.files[0]);

  const handleDrop = (e) => {
    e.preventDefault();
    setDragActive(false);
    loadFile(e.dataTransfer.files[0]);
  };

  const handleAnalyze = async () => {
    if (!imageFile) {
      setError("Pehle ek image select karein.");
      return;
    }
    setLoading(true);
    setError("");

    const formData = new FormData();
    formData.append("file", imageFile);

    try {
      const res = await axios.post(
        `${API_URL}/predict?conf=${conf}&iou=${iou}`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      setResultImage(res.data.annotated_image);
      setSummary(res.data.summary);
      setTotalDetections(res.data.total_detections);
    } catch (err) {
      setError(
        err.response?.data?.error ||
          "Backend se connect nahi ho saka. Check karein ke server chal raha hai."
      );
    } finally {
      setLoading(false);
    }
  };

  const detectedCount = summary.filter((s) => s.detected).length;

  return (
    <div className="page">
      <header className="hero">
        <div className="hero-content">
          <span className="badge">YOLOv8 · AI Powered</span>
          <h1>Surgical PPE Audit System</h1>
          <p>
            Upload a surgery scene image and instantly verify compliance
            across coveralls, masks, gloves, goggles &amp; face shields.
          </p>
        </div>
      </header>

      <main className="container">
        <section className="card upload-card">
          <div
            className={`dropzone ${dragActive ? "active" : ""} ${
              previewUrl ? "has-image" : ""
            }`}
            onDragOver={(e) => {
              e.preventDefault();
              setDragActive(true);
            }}
            onDragLeave={() => setDragActive(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current.click()}
          >
            {previewUrl ? (
              <img src={previewUrl} alt="preview" className="dropzone-img" />
            ) : (
              <div className="dropzone-placeholder">
                <div className="upload-icon">⬆</div>
                <p className="dz-title">Click or drag an image here</p>
                <p className="dz-sub">PNG, JPG up to ~10MB</p>
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              hidden
            />
          </div>

          <div className="settings">
            <div className="slider-row">
              <div className="slider-label">
                <span>Confidence</span>
                <span className="slider-value">{conf}</span>
              </div>
              <input
                type="range"
                min="0.1"
                max="1"
                step="0.05"
                value={conf}
                onChange={(e) => setConf(e.target.value)}
              />
            </div>
            <div className="slider-row">
              <div className="slider-label">
                <span>Overlap (IOU)</span>
                <span className="slider-value">{iou}</span>
              </div>
              <input
                type="range"
                min="0.1"
                max="1"
                step="0.05"
                value={iou}
                onChange={(e) => setIou(e.target.value)}
              />
            </div>

            <button
              className="analyze-btn"
              onClick={handleAnalyze}
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="spinner" /> Analyzing...
                </>
              ) : (
                "Analyze Scene"
              )}
            </button>

            {error && <p className="error">{error}</p>}
          </div>
        </section>

        {resultImage && (
          <section className="card result-card">
            <div className="result-header">
              <h2>Detection Results</h2>
              <div className="stat-pills">
                <span className="pill">{totalDetections} items detected</span>
                <span className="pill pill-green">
                  {detectedCount}/{summary.length} categories present
                </span>
              </div>
            </div>

            <div className="image-compare">
              <div className="image-panel">
                <h3>Original</h3>
                <img src={previewUrl} alt="original" />
              </div>
              <div className="image-panel">
                <h3>AI Detected</h3>
                <img src={resultImage} alt="result" />
              </div>
            </div>

            <table className="summary-table">
              <thead>
                <tr>
                  <th>PPE Item</th>
                  <th>Count</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {summary.map((row) => (
                  <tr key={row.item}>
                    <td>{row.item}</td>
                    <td>{row.count}</td>
                    <td>
                      <span
                        className={`status-tag ${
                          row.detected ? "status-ok" : "status-missing"
                        }`}
                      >
                        {row.detected ? "Detected" : "Not Found"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        )}
      </main>

      <footer className="footer">
        Powered by YOLOv8 &middot; FastAPI &middot; React
      </footer>
    </div>
  );
}

export default App;
