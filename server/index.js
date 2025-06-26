require('dotenv').config();
const express = require('express');
const axios = require('axios');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const PORT = 5000;

app.use(cors());
app.use(bodyParser.json({ limit: '10mb' }));

app.post('/api/analyze', async (req, res) => {
  try {
    const { imageData, language = "english" } = req.body;

    // 🔁 Call DeepFace Python API
    const pyRes = await axios.post('http://127.0.0.1:5001/analyze', { imageData, language });
    const emotion = pyRes.data.emotion;

    // 🔐 Get Spotify access token
    const tokenRes = await axios.post(
      'https://accounts.spotify.com/api/token',
      new URLSearchParams({ grant_type: 'client_credentials' }),
      {
        headers: {
          Authorization:
            'Basic ' +
            Buffer.from(
              process.env.SPOTIFY_CLIENT_ID + ':' + process.env.SPOTIFY_CLIENT_SECRET
            ).toString('base64'),
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );

    const accessToken = tokenRes.data.access_token;

    // 🎵 Search tracks
    const trackRes = await axios.get(
      `https://api.spotify.com/v1/search?q=${encodeURIComponent(emotion)}&type=track&limit=5`,
      {
        headers: { Authorization: 'Bearer ' + accessToken },
      }
    );

    const tracks = trackRes.data.tracks.items.map((track) => ({
      name: track.name,
      artist: track.artists[0].name,
      url: track.external_urls.spotify,
      image: track.album.images[0]?.url,
    }));

    res.json({ emotion, tracks });
  } catch (err) {
    console.error('🔥 Server error:', err?.response?.data || err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Node.js server at http://localhost:${PORT}`);
});
