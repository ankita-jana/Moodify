import React, { useState } from 'react';
import axios from 'axios';

function Upload({ setEmotion, setSongs }) {
  const [image, setImage] = useState(null);
  const [language, setLanguage] = useState('english');
  const [loading, setLoading] = useState(false);

  const handleUpload = async () => {
    if (!image) return;

    setLoading(true);
    try {
      const base64 = await toBase64(image);
      const res = await axios.post('/api/analyze', {
        imageData: base64,
        language,
      });

      setEmotion(res.data.emotion);
      setSongs(res.data.tracks);
    } catch (err) {
      console.error(err);
      alert('Error analyzing image or fetching songs.');
    } finally {
      setLoading(false);
    }
  };

  const toBase64 = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
    });

  return (
    <div className="bg-white rounded shadow p-4 mb-6">
      <input type="file" accept="image/*" onChange={(e) => setImage(e.target.files[0])} />
      <select value={language} onChange={(e) => setLanguage(e.target.value)} className="ml-4">
        <option value="english">English</option>
        <option value="hindi">Hindi</option>
        <option value="bengali">Bengali</option>
      </select>
      <button
        onClick={handleUpload}
        className="bg-blue-500 text-white px-4 py-2 rounded ml-4"
        disabled={loading}
      >
        {loading ? 'Analyzing...' : 'Analyze & Recommend'}
      </button>
    </div>
  );
}

export default Upload;
