import { useState, useRef } from "react";
import api from "./api"; // instead of axios directly
import "./App.css";

function App() {
  const [image, setImage] = useState(null);
  const [tracks, setTracks] = useState([]);
  const [emotion, setEmotion] = useState("");
  const [genre, setGenre] = useState("");
  const [language, setLanguage] = useState("english");
  const [era, setEra] = useState("mixed");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  const languages = [
    { value: "english", label: "English" },
    { value: "hindi", label: "Hindi" },
    { value: "bengali", label: "Bengali" },
    { value: "tamil", label: "Tamil" },
    { value: "punjabi", label: "Punjabi" },
  ];

  // 📏 Resize image before sending to backend
  const resizeImage = (file, maxSize = 256) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const scale = Math.min(maxSize / img.width, maxSize / img.height);
          const canvas = document.createElement("canvas");
          canvas.width = img.width * scale;
          canvas.height = img.height * scale;
          const ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          canvas.toBlob(
            (blob) => {
              const resizedReader = new FileReader();
              resizedReader.onloadend = () => resolve(resizedReader.result);
              resizedReader.onerror = reject;
              resizedReader.readAsDataURL(blob);
            },
            "image/jpeg",
            0.9
          );
        };
        img.onerror = reject;
        img.src = event.target.result;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  // 📤 Handle image selection
  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const resized = await resizeImage(file);
      setImage(resized);
      setTracks([]);
      setEmotion("");
      setGenre("");
      setError(null);
    } catch (err) {
      setError("Image loading failed.");
      console.error(err);
    }
  };

  // 🔍 Analyze image + fetch music
  const analyzeImage = async () => {
    if (!image) return setError("Upload an image first.");

    setIsLoading(true);
    setError(null);

    try {
      const res = await api.post("/api/analyze", {
           imageData: image,
           language,
          era,
    });


      setEmotion(res.data.emotion);
      setGenre(res.data.genre);
      setTracks(res.data.tracks || []);
    } catch (err) {
      const serverError =
        err.response?.data?.error ||
        err.message ||
        "Analysis failed. Please try again.";
      setError(serverError);
      console.error("Analysis Error:", err);
      fileInputRef.current.value = "";
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="app">
      <div className="card">
        <h1>🎵 Emotion to Music</h1>

        {/* 📂 File Upload */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          disabled={isLoading}
          className="file-input"
        />

        {image && <img src={image} alt="Preview" className="preview-image" />}

        {/* 🌐 Language Selector */}
        <select
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          disabled={isLoading}
          className="dropdown"
        >
          {languages.map((lang) => (
            <option key={lang.value} value={lang.value}>
              {lang.label}
            </option>
          ))}
        </select>

        {/* 🕰 Era Selector */}
        <select
          value={era}
          onChange={(e) => setEra(e.target.value)}
          disabled={isLoading}
          className="dropdown"
        >
          <option value="today">Today's Songs</option>
          <option value="90s">90s Songs</option>
          <option value="mixed">Mixed Era</option>
        </select>

        {/* 🚀 Analyze Button */}
        <button
          onClick={analyzeImage}
          disabled={isLoading || !image}
          className={`analyze-btn ${isLoading || !image ? "disabled" : ""}`}
        >
          {isLoading ? "Analyzing..." : "Analyze & Recommend"}
        </button>

        {/* ⚠ Error Display */}
        {error && <div className="error">{error}</div>}

        {/* 🎭 Analysis Results */}
        {(emotion || genre) && (
          <div className="results">
            {emotion && (
              <div className="result-tag emotion">
                Detected Emotion: <strong>{emotion}</strong>
              </div>
            )}
            {genre && (
              <div className="result-tag genre">
                Genre Used: <strong>{genre}</strong>
              </div>
            )}
            <div className="result-tag language">
              Language: <strong>{language}</strong>
            </div>
          </div>
        )}

        {/* 🎶 Song Recommendations */}
        {tracks.length > 0 ? (
          <div className="track-list">
            {tracks.map((track, index) => (
              <div className="track-card" key={index}>
                <img src={track.image} alt={track.name} className="track-img" />
                <div className="track-info">
                  <div className="track-name">{track.name}</div>
                  <div className="track-artist">{track.artist}</div>
                </div>

                <div className="audio-controls">
                  {track.preview && (
                    <audio controls preload="none">
                      <source src={track.preview} type="audio/mpeg" />
                      Your browser does not support the audio element.
                    </audio>
                  )}
                  <a
                    href={track.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="spotify-btn"
                  >
                    ▶ Spotify
                  </a>
                </div>
              </div>
            ))}
          </div>
        ) : (
          !isLoading &&
          image && (
            <div className="no-tracks-message">
              😔 No songs found. Try another photo or language.
            </div>
          )
        )}
      </div>
    </div>
  );
}

export default App;
