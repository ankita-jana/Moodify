import axios from "axios";

const API_BASE_URL =
  import.meta.env.MODE === "development"
    ? "http://localhost:5000"            
    : "https://moodify-8.onrender.com";  

export default axios.create({ baseURL: API_BASE_URL });
