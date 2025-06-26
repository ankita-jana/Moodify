// import { useState } from 'react'
// import reactLogo from './assets/react.svg'
// import viteLogo from '/vite.svg'
// import './App.css'

// function App() {
//   const [count, setCount] = useState(0)

//   return (
//     <>
//       <div>
//         <a href="https://vite.dev" target="_blank">
//           <img src={viteLogo} className="logo" alt="Vite logo" />
//         </a>
//         <a href="https://react.dev" target="_blank">
//           <img src={reactLogo} className="logo react" alt="React logo" />
//         </a>
//       </div>
//       <h1>Vite + React</h1>
//       <div className="card">
//         <button onClick={() => setCount((count) => count + 1)}>
//           count is {count}
//         </button>
//         <p>
//           Edit <code>src/App.jsx</code> and save to test HMR
//         </p>
//       </div>
//       <p className="read-the-docs">
//         Click on the Vite and React logos to learn more
//       </p>
//     </>
//   )
// }

// export default App
import { useState } from "react";
import axios from "axios";

function App() {
  const [image, setImage] = useState(null);
  const [tracks, setTracks] = useState([]);
  const [emotion, setEmotion] = useState("");

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onload = () => setImage(reader.result);
    reader.readAsDataURL(file);
  };

  const analyzeImage = async () => {
    if (!image) return alert("Upload an image first!");

    try {
      const res = await axios.post("http://localhost:5000/api/analyze", {
        imageData: image,
      });

      setEmotion(res.data.emotion);
      setTracks(res.data.tracks);
    } catch (err) {
      console.error("Error:", err);
      alert("Something went wrong.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <h1 className="text-3xl font-bold mb-6 text-center">🎵 Image-to-Music</h1>

      <div className="max-w-xl mx-auto space-y-4">
        <input
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          className="block w-full text-sm file:mr-4 file:py-2 file:px-4 file:border-0 file:bg-blue-600 file:text-white file:rounded-full cursor-pointer"
        />

        <button
          onClick={analyzeImage}
          className="bg-green-600 text-white py-2 px-6 rounded-md hover:bg-green-700 w-full"
        >
          Analyze and Recommend Songs
        </button>

        {emotion && (
          <div className="mt-4 text-center">
            <p className="text-xl font-semibold">Detected Emotion: {emotion}</p>
          </div>
        )}

        <div className="mt-6 space-y-4">
          {tracks.map((track, index) => (
            <div
              key={index}
              className="bg-white shadow-sm rounded-lg p-4 flex items-center space-x-4"
            >
              <img
                src={track.image}
                alt={track.name}
                className="w-16 h-16 rounded-lg"
              />
              <div className="flex-1">
                <p className="text-lg font-medium">{track.name}</p>
                <p className="text-gray-600">{track.artist}</p>
              </div>
              <a
                href={track.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 font-semibold hover:underline"
              >
                Play ▶️
              </a>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default App;
