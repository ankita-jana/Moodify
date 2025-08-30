require("dotenv").config();
const express = require("express");
const axios = require("axios");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 5000;
const PY_BACKEND_URL = process.env.PY_BACKEND_URL;

app.use(cors({
  origin: "https://moodifyy-nhq7.onrender.com",
  methods: ['GET', 'POST'],
  credentials: true
}));

app.use(express.json({ limit: "50mb" }));

// 🔐 Spotify Token Cache
let spotifyToken = null;
let tokenExpiry = 0;

async function getSpotifyToken(retries = 3) {
  const now = Date.now();
  if (spotifyToken && now < tokenExpiry) return spotifyToken;

  for (let i = 0; i < retries; i++) {
    try {
      const authString = `${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`;
      const encoded = Buffer.from(authString).toString("base64");

      const { data } = await axios.post(
        "https://accounts.spotify.com/api/token",
        new URLSearchParams({ grant_type: "client_credentials" }),
        {
          headers: {
            Authorization: `Basic ${encoded}`,
            "Content-Type": "application/x-www-form-urlencoded"
          },
          timeout: 5000
        }
      );

      spotifyToken = data.access_token;
      tokenExpiry = now + (data.expires_in - 60) * 1000;
      return spotifyToken;
    } catch (err) {
      console.error("❌ Spotify Token Error:", err.response?.data || err.message);
      if (i === retries - 1) throw err;
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
}

// 🎧 Fetch tracks from Spotify
async function fetchTracks(query, token, offset = 0) {
  const encoded = encodeURIComponent(query);
  const url = `https://api.spotify.com/v1/search?q=${encoded}&type=track&limit=30&offset=${offset}&market=IN`;

  const response = await axios.get(url, {
    headers: { Authorization: `Bearer ${token}` },
    timeout: 8000
  });

  const tracks = response.data.tracks?.items || [];
  console.log(`🎧 Fetched ${tracks.length} tracks for "${query}"`);
  return tracks;
}

// 🔄 Broaden query helper
function broadenQuery(query) {
  return query
    .replace(/\+/g, " ")
    .replace(/\b\d{2,4}s\b/g, "") // remove "90s", "2000s"
    .split(" ")
    .filter(Boolean)
    .slice(0, 3)
    .join(" ");
}

// 🎵 Emotion-to-Song Endpoint
app.post("/api/analyze", async (req, res) => {
  try {
    const { imageData, language = "english", era = "today" } = req.body;

    if (!imageData) {
      return res.status(400).json({ error: "Image data is required" });
    }

    // 🔁 Call Python backend
    const pyRes = await axios.post(`${PY_BACKEND_URL}/analyze`, {
      imageData,
      language: language.toLowerCase(),
      era: era.toLowerCase()
    }, { timeout: 30000 });

    const {
      base_emotion,
      emotion,
      genre,
      language: detectedLanguage,
      era: selectedEra
    } = pyRes.data;

    const token = await getSpotifyToken();
    const offset = Math.floor(Math.random() * 10);

    // Queries list (progressive fallback)
    let queries = [
      `${genre} ${detectedLanguage}`,         
      `${detectedLanguage} songs`,            
      "trending music",                       
      broadenQuery(`${genre} ${detectedLanguage}`), 
      "pop music"                              
    ];

    let tracks = [];
    for (let q of queries) {
      console.log(`🎵 Searching: ${q}`);
      const fetched = await fetchTracks(q, token, offset);

      if (fetched.length > 0) {
        tracks = fetched
          .sort((a, b) => b.popularity - a.popularity)
          .slice(0, 10);
        break; 
      }
    }

    if (tracks.length === 0) {
      return res.status(404).json({
        error: "No suitable tracks found. Try a broader language or image.",
        base_emotion,
        emotion,
        genre,
        language: detectedLanguage,
        era: selectedEra
      });
    }

    // ✅ Return result (preview_url may be null, that's fine)
    res.json({
      base_emotion,
      emotion,
      genre,
      language: detectedLanguage,
      era: selectedEra,
      tracks: tracks.map(track => ({
        name: track.name,
        artist: track.artists[0]?.name || "Unknown Artist",
        url: track.external_urls?.spotify || "#",
        image: track.album?.images[0]?.url || "https://via.placeholder.com/150",
        preview: track.preview_url || null
      }))
    });

  } catch (err) {
    console.error("❌ API Error:", {
      message: err.message,
      ...(err.response && {
        status: err.response.status,
        data: err.response.data || "No response body"
      })
    });

    res.status(err.response?.status || 500).json({
      error: "Music recommendation failed",
      details: err.message
    });
  }
});

// 🧪 Health Check
app.get("/api/health", async (req, res) => {
  try {
    const pyHealth = await axios.get(`${PY_BACKEND_URL}/`, { timeout: 3000 });

    res.json({
      status: "healthy",
      services: {
        node: "running",
        python: pyHealth.data || "connected",
        spotify: "configured"
      }
    });
  } catch (err) {
    res.status(500).json({
      status: "degraded",
      error: "Python service unavailable"
    });
  }
});

// 🚀 Launch
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🎧 Emotion Music API running at http://0.0.0.0:${PORT}`);
});
