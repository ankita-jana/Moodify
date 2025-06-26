import React from 'react';

function SongList({ emotion, songs }) {
  return (
    <div className="bg-white rounded shadow p-4">
      <h2 className="text-xl font-semibold mb-4">Detected Emotion: <span className="text-blue-600">{emotion}</span></h2>
      <ul className="space-y-4">
        {songs.map((song, index) => (
          <li key={index} className="flex items-center space-x-4">
            <img src={song.image} alt="Album cover" className="w-16 h-16 rounded" />
            <div>
              <p className="font-medium">{song.name}</p>
              <p className="text-sm text-gray-500">by {song.artist}</p>
              <a href={song.url} target="_blank" className="text-blue-500 underline">Listen</a>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default SongList;
