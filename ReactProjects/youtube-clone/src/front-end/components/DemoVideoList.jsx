// src/front-end/components/SomeComponent.jsx
import { useEffect, useState } from "react";

export default function DemoVideoList() {
  const [videos, setVideos] = useState([]);

  useEffect(() => {
    async function fetchVideos() {
      // Use relative URL - proxy will forward to backend
      const res = await fetch("/api/videos/");
      const data = await res.json();
      setVideos(data);
    }

    fetchVideos();
  }, []);

  return (
    <div>
      <h2>Demo Videos</h2>
      <ul>
        {videos.map((v) => (
          <li key={v.id}>
            <strong>{v.title}</strong> – {v.views} views
          </li>
        ))}
      </ul>
    </div>
  );
}
