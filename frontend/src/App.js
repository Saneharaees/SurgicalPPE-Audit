import React, { useState } from "react";
import axios from "axios";
import "./App.css";

const API_URL = "http://localhost:8000";

function App() {
  const [imageFile, setImageFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [resultImage, setResultImage] = useState(null);
  const [summary, setSummary] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [conf, setConf] = useState(0.25);
  const [iou, setIou] = useState(0.45);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImageFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setResultImage(null);
    setSummary([]);
    setError("");
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
    } catch (err) {
      setError(
        err.response?.data?.error ||
          "Backend se connect nahi ho saka. Check karein ke server chal raha hai."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <header>
        <h1>🏥 Surgical PPE Audit System</h1>
        <p>Upload a surgery scene image to detect PPE compliance</p>
      </header>

      <div className="controls">
        <input type="file" accept="image/*" onChange={handleFileChange} />

        <div className="sliders">
          <label>
            Confidence: {conf}
            <input
              type="range"
              min="0.1"
              max="1"
              step="0.05"
              value={conf}
              onChange={(e) => setConf(e.target.value)}
            />
          </label>
          <label>
            Overlap (IOU): {iou}
            <input
              type="range"
              min="0.1"
              max="1"
              step="0.05"
              value={iou}
              onChange={(e) => setIou(e.target.value)}
            />
          </label>
        </div>

        <button onClick={handleAnalyze} disabled={loading}>
          {loading ? "Analyzing..." : "Analyze Scene"}
        </button>
      </div>

      {error && <p className="error">{error}</p>}

      <div className="results">
        <div className="image-panel">
          <h3>Original</h3>
          {previewUrl && <img src={previewUrl} alt="preview" />}
        </div>
        <div className="image-panel">
          <h3>Detected</h3>
          {resultImage && <img src={resultImage} alt="result" />}
        </div>
      </div>

      {summary.length > 0 && (
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
                <td>{row.detected ? "✅ Detected" : "❌ Not Found"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default App;
